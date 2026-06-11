import { getLabelColor } from '../../../constants/songs.js';

// --- ESTADOS INTERNOS DEL MÓDULO ---
let catalogSongs = [];    // Almacena canciones devueltas por el buscador
let cronograma = [];      // Almacena las canciones en la playlist del día

let selectedSong = null;  // Canción cargada actualmente
let parsedSlides = [];    // Diapositivas procesadas de la canción activa
let selectedSlideIndex = null;
let activeLiveSlideIndex = null; // Índice de la diapositiva en pantalla externa

// Estado del Editor de Canciones
let editingSongId = null; 

// Buffer para atajos de teclado (Máquina de Estados de Secciones)
let hotkeyTimeout = null;
let pendingKey = null;

// --- ELEMENTOS DE LA INTERFAZ ---
let catalogSearch, catalogList, btnCreateSong;
let cronogramaDropZone, cronogramaList, btnClearCronograma;
let currentSongTitle, currentSongAuthor, slidesGrid;
let songEditorModal, btnModalClose, btnEditorCancel, btnEditorSave, modalTitle;
let editorTitle, editorAuthor, editorCategory, editorLyrics;

export async function init() {
    // 1. Vincular elementos
    catalogSearch = document.getElementById('catalog-search');
    catalogList = document.getElementById('catalog-list');
    btnCreateSong = document.getElementById('btn-create-song');

    cronogramaDropZone = document.getElementById('cronograma-drop-zone');
    cronogramaList = document.getElementById('cronograma-list');
    btnClearCronograma = document.getElementById('btn-clear-cronograma');

    currentSongTitle = document.getElementById('current-song-title');
    currentSongAuthor = document.getElementById('current-song-author');
    slidesGrid = document.getElementById('slides-grid');

    songEditorModal = document.getElementById('song-editor-modal');
    modalTitle = document.getElementById('modal-title');
    btnModalClose = document.getElementById('btn-modal-close');
    btnEditorCancel = document.getElementById('btn-editor-cancel');
    btnEditorSave = document.getElementById('btn-editor-save');

    editorTitle = document.getElementById('editor-title');
    editorAuthor = document.getElementById('editor-author');
    editorCategory = document.getElementById('editor-category');
    editorLyrics = document.getElementById('editor-lyrics');

    // 2. Escuchar eventos de entrada
    catalogSearch.addEventListener('input', () => loadCatalog(catalogSearch.value.trim()));
    btnCreateSong.addEventListener('click', () => openEditor());

    btnModalClose.addEventListener('click', closeEditor);
    btnEditorCancel.addEventListener('click', closeEditor);
    btnEditorSave.addEventListener('click', handleSaveSong);

    btnClearCronograma.addEventListener('click', clearCronograma);

    // 3. Inicializar Drag and Drop (HTML5 Nativo)
    setupDragAndDrop();

    // 4. Inicializar Asistente de Selección en el Editor
    setupEditorAssistant();

    // 5. Inicializar Teclado (ESC, ENTER, Flechas, Atajos)
    document.removeEventListener('keydown', handleSongKeydown);
    document.addEventListener('keydown', handleSongKeydown);

    // 6. Carga inicial del catálogo vacío (trae todo)
    await loadCatalog('');
}

// ================= LÓGICA DE CATÁLOGO (COLUMNA 1) =================

async function loadCatalog(query) {
    try {
        catalogSongs = await window.api.searchSongs(query);
        renderCatalog();
    } catch (err) {
        console.error("[Songs] Error al buscar en catálogo:", err);
    }
}

function renderCatalog() {
    catalogList.innerHTML = '';
    
    if (catalogSongs.length === 0) {
        catalogList.innerHTML = '<li style="font-size: 12px; color: var(--text-secondary); text-align: center; cursor: default;">No hay canciones.</li>';
        return;
    }

    catalogSongs.forEach(song => {
        const li = document.createElement('li');
        li.draggable = true; // Habilita Drag and Drop
        
        li.innerHTML = `
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>${song.author || 'Autor Desconocido'}</p>
            </div>
            <button class="cat-btn-add" title="Agregar al Cronograma">+</button>
        `;

        // Eventos de arrastre desde catálogo
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('source', 'catalog');
            e.dataTransfer.setData('song-id', song.id);
            e.dataTransfer.effectAllowed = 'copy';
        });

        // Botón rápido de agregar al cronograma (+)
        li.querySelector('.cat-btn-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCronograma(song);
        });

        // Cargar canción al visor al hacer clic en el catálogo
        li.addEventListener('click', () => {
            loadSong(song);
        });

        catalogList.appendChild(li);
    });
}

// ================= LÓGICA DE CRONOGRAMA (COLUMNA 2) =================

function addToCronograma(song) {
    // Generamos un 'cronoId' único para permitir duplicados de la misma canción en la playlist
    const playlistItem = {
        ...song,
        cronoId: Date.now() + Math.random()
    };
    cronograma.push(playlistItem);
    renderCronograma();
}

function renderCronograma() {
    cronogramaList.innerHTML = '';

    if (cronograma.length === 0) {
        cronogramaList.innerHTML = '<li style="font-size: 12px; color: var(--text-secondary); text-align: center; border: none; cursor: default; background: none;">Cronograma vacío. Arrastra cantos aquí.</li>';
        return;
    }

    cronograma.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `cronograma-item ${selectedSong && selectedSong.cronoId === item.cronoId ? 'active-item' : ''}`;
        li.draggable = true;
        li.dataset.index = index;

        li.innerHTML = `
            <span class="cronograma-item-title">${item.title}</span>
            <div class="cronograma-controls">
                <button class="btn-move btn-up" title="Subir">▲</button>
                <button class="btn-move btn-down" title="Bajar">▼</button>
                <button class="btn-remove-cron" title="Quitar">×</button>
            </div>
        `;

        // Eventos Drag and Drop para reordenar dentro de la lista
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('source', 'cronograma');
            e.dataTransfer.setData('index', index);
            e.dataTransfer.effectAllowed = 'move';
        });

        // Clic en un canto del cronograma lo selecciona
        li.addEventListener('click', () => {
            loadSong(item);
            renderCronograma(); // Refresca resaltado
        });

        // Botón de subir en la lista
        li.querySelector('.btn-up').addEventListener('click', (e) => {
            e.stopPropagation();
            moveInCronograma(index, -1);
        });

        // Botón de bajar en la lista
        li.querySelector('.btn-down').addEventListener('click', (e) => {
            e.stopPropagation();
            moveInCronograma(index, 1);
        });

        // Botón de eliminar (X)
        li.querySelector('.btn-remove-cron').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromCronograma(index);
        });

        cronogramaList.appendChild(li);
    });
}

function moveInCronograma(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < cronograma.length) {
        const temp = cronograma[index];
        cronograma[index] = cronograma[targetIndex];
        cronograma[targetIndex] = temp;
        renderCronograma();
    }
}

function removeFromCronograma(index) {
    // Si la canción eliminada es la que está en pantalla, la quitamos del visor
    if (selectedSong && selectedSong.cronoId === cronograma[index].cronoId) {
        selectedSong = null;
        parsedSlides = [];
        selectedSlideIndex = null;
        clearSongProjection();
        currentSongTitle.textContent = "Selecciona una canción";
        currentSongAuthor.textContent = "";
        slidesGrid.innerHTML = '';
    }
    cronograma.splice(index, 1);
    renderCronograma();
}

function clearCronograma() {
    cronograma = [];
    selectedSong = null;
    parsedSlides = [];
    selectedSlideIndex = null;
    clearSongProjection();
    currentSongTitle.textContent = "Selecciona una canción";
    currentSongAuthor.textContent = "";
    slidesGrid.innerHTML = '';
    renderCronograma();
}

// --- Soporte Drag and Drop HTML5 ---
function setupDragAndDrop() {
    cronogramaDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        cronogramaDropZone.classList.add('drag-over');
    });

    cronogramaDropZone.addEventListener('dragleave', () => {
        cronogramaDropZone.classList.remove('drag-over');
    });

    cronogramaDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        cronogramaDropZone.classList.remove('drag-over');

        const source = e.dataTransfer.getData('source');

        if (source === 'catalog') {
            // Jalar nueva canción del catálogo
            const id = parseInt(e.dataTransfer.getData('song-id'));
            const song = catalogSongs.find(s => s.id === id);
            if (song) addToCronograma(song);
        } else if (source === 'cronograma') {
            // Reordenar arrastrando
            const sourceIndex = parseInt(e.dataTransfer.getData('index'));
            // Intentar buscar la posición del elemento sobre el cual se soltó
            const targetLi = e.target.closest('.cronograma-item');
            if (targetLi) {
                const targetIndex = parseInt(targetLi.dataset.index);
                if (sourceIndex !== targetIndex) {
                    const itemToMove = cronograma[sourceIndex];
                    cronograma.splice(sourceIndex, 1);
                    cronograma.splice(targetIndex, 0, itemToMove);
                    renderCronograma();
                }
            }
        }
    });
}

// ================= LÓGICA DE PARSEO Y VISOR DE DIAPOSITIVAS (COLUMNA 3) =================

function loadSong(song) {
    selectedSong = song;
    currentSongTitle.innerHTML = `${song.title} <button id="btn-edit-song" class="btn-clear" style="margin-left: 10px; font-size: 11px;">Editar Letra</button>`;
    currentSongAuthor.textContent = song.author ? `Por: ${song.author}` : 'Autor Desconocido';
    
    // Escuchar botón editar
    document.getElementById('btn-edit-song').addEventListener('click', () => openEditor(song));

    // Resetear proyección
    clearSongProjection();

    // Parsear letra en diapositivas con herencia de secciones
    parseLyrics(song.lyrics);
    renderSlidesGrid();
}

// Analizador de secciones con regla de herencia
function parseLyrics(lyricsRaw) {
    parsedSlides = [];
    if (!lyricsRaw) return;

    // Dividimos por doble salto de línea
    const rawBlocks = lyricsRaw.split(/\n\n+/);
    let activeSection = 'DEFAULT'; // Por defecto no hay sección heredada

    rawBlocks.forEach(block => {
        let lines = block.trim().split('\n');
        if (lines.length === 0 || lines[0] === '') return;

        // Comprobar si la primera línea contiene un corchete ej: "[Coro]" o "[Estrofa 1]"
        const match = lines[0].match(/^\[([^\]]+)\]/);
        
        if (match) {
            // Actualizamos la herencia
            activeSection = match[1].trim().toUpperCase();
            // Removemos la etiqueta del cuerpo del texto para no proyectarla
            lines.shift();
        }

        const cleanText = lines.join('\n').trim();
        parsedSlides.push({
            text: cleanText,
            section: activeSection
        });
    });
}

function renderSlidesGrid() {
    slidesGrid.innerHTML = '';
    selectedSlideIndex = null;

    parsedSlides.forEach((slide, index) => {
        const card = document.createElement('div');
        card.className = 'slide-card';
        card.dataset.index = index;

        // 1. Heredar color del borde de canciones.js
        card.style.borderLeftColor = getLabelColor(slide.section);

        // 2. Colocar etiqueta pequeña de sección arriba a la izquierda
        card.innerHTML = `
            <span class="slide-section-badge">${slide.section}</span>
            <span class="slide-live-badge">En Vivo</span>
            <div class="slide-text-body">${slide.text}</div>
        `;

        // Selección simple
        card.addEventListener('click', () => {
            selectSlide(index);
        });

        // Doble Clic proyecta
        card.addEventListener('dblclick', () => {
            projectSlide(index);
        });

        slidesGrid.appendChild(card);
    });
}

function selectSlide(index) {
    selectedSlideIndex = index;
    slidesGrid.querySelectorAll('.slide-card').forEach(card => {
        if (parseInt(card.dataset.index) === index) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function projectSlide(index) {
    activeLiveSlideIndex = index;
    const slide = parsedSlides[index];

    // Enviar al proyector
    window.api.proyectarTexto(slide.text);

    // Pintar estado live en UI
    slidesGrid.querySelectorAll('.slide-card').forEach(card => {
        const cardIdx = parseInt(card.dataset.index);
        if (cardIdx === index) {
            card.classList.add('live');
        } else {
            card.classList.remove('live');
        }
    });
}

function clearSongProjection() {
    activeLiveSlideIndex = null;
    window.api.limpiarPantalla();
    slidesGrid.querySelectorAll('.slide-card').forEach(card => card.classList.remove('live'));
}

// ================= MÁQUINA DE ESTADOS Y ATAJOS DE TECLADO (EN VIVO) =================

function handleSongKeydown(e) {
    // 1. ESCAPE: Limpia pantalla
    if (e.key === 'Escape') {
        clearSongProjection();
        return;
    }

    // 2. ENTER: Proyecta la seleccionada
    if (e.key === 'Enter') {
        if (selectedSlideIndex !== null) {
            projectSlide(selectedSlideIndex);
        }
        return;
    }

    // 3. Flechas de navegación (Izquierda/Derecha únicamente)
    if (activeLiveSlideIndex !== null) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateLiveSong(1);
            return;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateLiveSong(-1);
            return;
        }
    }

    // 4. Atajos rápidos de secciones
    if (activeLiveSlideIndex !== null) {
        const key = e.key.toLowerCase();
        const keyMap = {
            'e': 'ESTROFA',
            'c': 'CORO',
            'p': 'PRECORO',
            'u': 'PUENTE',
            'm': 'MUSICA',
            'f': 'FINAL',
            'i': 'INTRO',
            'v': 'VERSO'
        };

        if (keyMap[key]) {
            e.preventDefault();

            // Si presionó la misma tecla dos veces (Doble pulsación rápida)
            if (pendingKey === key) {
                clearTimeout(hotkeyTimeout);
                pendingKey = null;
                jumpToSection(keyMap[key], 1); // Salta al primer bloque de esa sección
                return;
            }

            // Registrar tecla pendiente y esperar 500ms por un número
            if (pendingKey) clearTimeout(hotkeyTimeout);
            pendingKey = key;
            hotkeyTimeout = setTimeout(() => {
                pendingKey = null;
                jumpToSection(keyMap[key], 1); // Salta al primero si expira el tiempo
            }, 500);
            return;
        }

        // Si hay una tecla de sección pendiente y presiona un número
        if (pendingKey && !isNaN(key) && key !== ' ') {
            e.preventDefault();
            clearTimeout(hotkeyTimeout);
            const targetSection = keyMap[pendingKey];
            const targetNum = parseInt(key);
            pendingKey = null;
            jumpToSection(targetSection, targetNum);
        }
    }
}

function navigateLiveSong(direction) {
    const nextIdx = activeLiveSlideIndex + direction;
    if (nextIdx >= 0 && nextIdx < parsedSlides.length) {
        selectSlide(nextIdx);
        projectSlide(nextIdx);
        // Scroll automático suave al visor de la tarjeta proyectada
        const targetCard = slidesGrid.querySelector(`.slide-card[data-index="${nextIdx}"]`);
        if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Saltar directamente a una sección de la canción (Ej: CORO 2 o ESTROFA 1)
function jumpToSection(sectionName, targetNum) {
    // 1. Filtrar los índices reales de las diapositivas de la canción que correspondan a la sección
    const matchingIndices = [];
    parsedSlides.forEach((slide, index) => {
        if (slide.section.includes(sectionName)) {
            matchingIndices.push({ index, label: slide.section });
        }
    });

    if (matchingIndices.length === 0) return; // No existe la sección

    // 2. Intentar buscar por coincidencia de número en la etiqueta (ej: "CORO 2" o "ESTROFA 2")
    const numMatch = matchingIndices.find(item => item.label.includes(String(targetNum)));
    
    if (numMatch) {
        // Encontrado explícitamente
        selectSlide(numMatch.index);
        projectSlide(numMatch.index);
        const card = slidesGrid.querySelector(`.slide-card[data-index="${numMatch.index}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback: Si no tiene números, saltar al N-ésimo bloque de esa sección
        const fallbackItem = matchingIndices[targetNum - 1] || matchingIndices[0];
        selectSlide(fallbackItem.index);
        projectSlide(fallbackItem.index);
        const card = slidesGrid.querySelector(`.slide-card[data-index="${fallbackItem.index}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ================= LÓGICA DEL EDITOR DE CANCIONES (MODAL FLOTANTE) =================

function openEditor(song = null) {
    if (song) {
        editingSongId = song.id;
        modalTitle.textContent = "Editar Canción";
        editorTitle.value = song.title;
        editorAuthor.value = song.author || '';
        editorCategory.value = song.category || '';
        editorLyrics.value = song.lyrics || '';
    } else {
        editingSongId = null;
        modalTitle.textContent = "Nueva Canción";
        editorTitle.value = '';
        editorAuthor.value = '';
        editorCategory.value = '';
        editorLyrics.value = '';
    }
    songEditorModal.classList.remove('hidden');
}

function closeEditor() {
    songEditorModal.classList.add('hidden');
    editingSongId = null;
}

// Asistente de inserción / envoltura de corchetes
function setupEditorAssistant() {
    const assistButtons = document.querySelectorAll('.btn-assist');
    
    assistButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const start = editorLyrics.selectionStart;
            const end = editorLyrics.selectionEnd;
            const text = editorLyrics.value;

            // Obtener el fragmento de texto seleccionado
            const selectedText = text.substring(start, end);
            
            // Creamos el bloque con corchete. Si seleccionó texto, lo envuelve
            const tagText = `[${tag}]\n${selectedText}`;

            // Insertamos en la posición del cursor o envolviendo
            editorLyrics.value = text.substring(0, start) + tagText + text.substring(end);
            editorLyrics.focus();

            // Restauramos selección
            editorLyrics.setSelectionRange(start, start + tagText.length);
        });
    });
}

// Guardar canción en SQLite
async function handleSaveSong() {
    const title = editorTitle.value.trim();
    const lyrics = editorLyrics.value.trim();
    const author = editorAuthor.value.trim();
    const category = editorCategory.value.trim();

    if (!title || !lyrics) {
        alert("Por favor completa el Título y la Letra de la canción.");
        return;
    }

    const songData = {
        title,
        lyrics,
        author: author || null,
        category: category || null
    };

    if (editingSongId) {
        songData.id = editingSongId;
    }

    try {
        const result = await window.api.saveSong(songData);
        if (result && result.success) {
            closeEditor();
            // Recargar catálogo y mantener seleccionado el actual
            await loadCatalog(catalogSearch.value.trim());
            if (selectedSong && selectedSong.id === editingSongId) {
                // Si editamos la canción cargada, refrescar su vista
                const updatedSong = catalogSongs.find(s => s.id === editingSongId);
                if (updatedSong) loadSong(updatedSong);
            }
        }
    } catch (err) {
        console.error("[Songs] Error al guardar canción:", err);
        alert("Error al intentar guardar la canción en la base de datos.");
    }
}