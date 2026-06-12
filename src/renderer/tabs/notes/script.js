import { selectTab } from '../../control/script.js';

// --- ESTADOS INTERNOS DEL MÓDULO ---
let catalogNotes = [];     // Bosquejos devueltos por el buscador
let savedNotes = [];       // Bosquejos cargados desde notes.db
let selectedNoteId = null; // ID de la nota que se está editando en tiempo real (null = nueva)

let parsedSlides = [];    // Diapositivas procesadas del bosquejo activo
let selectedSlideIndex = null;
let activeLiveSlideIndex = null; // Diapositiva en pantalla externa

// --- ELEMENTOS DE LA INTERFAZ ---
let notesSearch, notesCatalogList, btnCreateNote;
let editorHeaderTitle, btnDeleteNote, btnSaveNote, btnClearNoteProj, notesSaveStatus;
let noteTitleInput, noteAuthorInput, noteCategoryInput, noteLiveEditor, noteDateInput;
let notesSlidesGrid, currentNoteTitle, currentNoteAuthor;

export async function init() {
    // 1. Vincular elementos del catálogo (Columna 1)
    notesSearch = document.getElementById('notes-search');
    notesCatalogList = document.getElementById('notes-catalog-list');
    btnCreateNote = document.getElementById('btn-create-note');

    // Vincular elementos del editor (Columna 2)
    editorHeaderTitle = document.getElementById('editor-header-title');
    btnDeleteNote = document.getElementById('btn-delete-note');
    btnSaveNote = document.getElementById('btn-save-note');
    btnClearNoteProj = document.getElementById('btn-clear-note-proj');
    notesSaveStatus = document.getElementById('notes-save-status'); // Alerta integrada

    noteTitleInput = document.getElementById('note-title-input');
    noteAuthorInput = document.getElementById('note-author-input');
    noteCategoryInput = document.getElementById('note-category-input');
    noteDateInput = document.getElementById('note-date-input');
    noteLiveEditor = document.getElementById('note-live-editor');

    // Vincular elementos del visor (Columna 3)
    currentNoteTitle = document.getElementById('current-note-title');
    currentNoteAuthor = document.getElementById('current-note-author');
    notesSlidesGrid = document.getElementById('notes-slides-grid');

    // 2. Escuchar eventos de interacción
    notesSearch.addEventListener('input', () => loadCatalog(notesSearch.value.trim()));
    btnCreateNote.addEventListener('click', () => createNewNote());

    btnSaveNote.addEventListener('click', handleSaveNote);
    btnDeleteNote.addEventListener('click', handleDeleteNote);
    btnClearNoteProj.addEventListener('click', clearNotesProjection);

    // Lógica reactiva en tiempo real al escribir
    noteLiveEditor.addEventListener('input', () => {
        parseNoteContent(noteLiveEditor.value);
        renderSlidesGrid();
    });

    // 3. Inicializar Teclado (ESC, ENTER, Flechas)
    document.removeEventListener('keydown', handleNotesKeydown);
    document.addEventListener('keydown', handleNotesKeydown);

    // 4. Cargar catálogo de notas pre-guardadas en SQLite
    await loadCatalog('');
}

// ================= GESTIÓN DEL CATÁLOGO (COLUMNA 1) =================

async function loadCatalog(query) {
    try {
        const allNotes = await window.api.getSermonNotes();
        const searchLower = query.toLowerCase();
        
        savedNotes = allNotes.filter(note => 
            note.title.toLowerCase().includes(searchLower) || 
            (note.author && note.author.toLowerCase().includes(searchLower)) ||
            note.content.toLowerCase().includes(searchLower)
        );

        renderCatalog();

        // Al iniciar por primera vez: Carga automáticamente la primera nota si existe
        if (!selectedNoteId && allNotes.length > 0) {
            loadNote(allNotes[0]);
        } else if (allNotes.length === 0) {
            createNewNote(); 
        }
    } catch (err) {
        console.error("[Notes Tab] Error al cargar bosquejos del catálogo:", err);
    }
}

function renderCatalog() {
    notesCatalogList.innerHTML = '';
    
    savedNotes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        if (note.id === selectedNoteId) li.className = 'active';

        const previewText = note.content.length > 30 ? note.content.substring(0, 30) + "..." : note.content;

        li.innerHTML = `
            <h4>${note.title}</h4>
            <p>${previewText}</p>
        `;

        li.addEventListener('click', () => {
            loadNote(note);
        });

        notesCatalogList.appendChild(li);
    });
}

// ================= LÓGICA DEL EDITOR EN VIVO (COLUMNA 2) =================

function loadNote(note) {
    selectedNoteId = note.id;

    // Actualizar estados visuales del catálogo
    if (notesCatalogList) {
        notesCatalogList.querySelectorAll('li').forEach(li => {
            if (parseInt(li.dataset.id) === note.id) li.classList.add('active');
            else li.classList.remove('active');
        });
    }

    // Cargar datos en el formulario central (Con protección defensiva para evitar nulls)
    if (editorHeaderTitle) {
        editorHeaderTitle.textContent = `Editar: ${note.title}`;
    }
    if (noteTitleInput) noteTitleInput.value = note.title;
    if (noteAuthorInput) noteAuthorInput.value = note.author || '';
    if (noteCategoryInput) noteCategoryInput.value = note.category || '';
    if (noteDateInput) noteDateInput.value = note.created_at || 'Sin fecha';
    if (noteLiveEditor) noteLiveEditor.value = note.content;

    // Habilitar botón de eliminación
    if (btnDeleteNote) btnDeleteNote.disabled = false;

    // Cargar cabecera del visor derecho
    if (currentNoteTitle) currentNoteTitle.textContent = note.title;
    if (currentNoteAuthor) currentNoteAuthor.textContent = note.author ? `Por: ${note.author}` : 'Orador Desconocido';

    clearNotesProjection();
    parseNoteContent(note.content);
    renderSlidesGrid();
}

function createNewNote() {
    selectedNoteId = null;

    // Limpiar catálogo activo
    if (notesCatalogList) {
        notesCatalogList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    }

    // Limpiar formulario central (Con protección defensiva para evitar nulls)
    if (editorHeaderTitle) {
        editorHeaderTitle.textContent = "Nuevo Bosquejo";
    }
    if (noteTitleInput) noteTitleInput.value = '';
    if (noteAuthorInput) noteAuthorInput.value = '';
    if (noteCategoryInput) noteCategoryInput.value = '';
    if (noteDateInput) noteDateInput.value = new Date().toLocaleDateString('es-ES');
    if (noteLiveEditor) noteLiveEditor.value = '';

    if (btnDeleteNote) btnDeleteNote.disabled = true;

    // Limpiar visor de la derecha
    if (currentNoteTitle) currentNoteTitle.textContent = "Nuevo Bosquejo";
    if (currentNoteAuthor) currentNoteAuthor.textContent = "Orador Desconocido";
    if (notesSlidesGrid) notesSlidesGrid.innerHTML = '';
    parsedSlides = [];
    selectedSlideIndex = null;

    clearNotesProjection();
    if (noteTitleInput) noteTitleInput.focus();
}

// ================= LÓGICA DE DIAPOSITIVAS Y PARSEO (COLUMNA 3) =================

function parseNoteContent(contentRaw) {
    parsedSlides = [];
    if (!contentRaw) return;

    const rawBlocks = contentRaw.split(/\n\n+/);
    rawBlocks.forEach(block => {
        const cleanText = block.trim();
        if (cleanText) {
            parsedSlides.push({
                text: cleanText
            });
        }
    });
}

function renderSlidesGrid() {
    notesSlidesGrid.innerHTML = '';
    
    if (selectedSlideIndex >= parsedSlides.length) selectedSlideIndex = null;

    parsedSlides.forEach((slide, index) => {
        const card = document.createElement('div');
        card.className = 'slide-card';
        card.dataset.index = index;

        card.innerHTML = `
            <span class="slide-live-badge">En Vivo</span>
            <div class="slide-text-body">${slide.text}</div>
        `;

        if (index === selectedSlideIndex) card.classList.add('selected');
        if (index === activeLiveSlideIndex) card.classList.add('live');

        card.addEventListener('click', () => selectSlide(index));
        card.addEventListener('dblclick', () => projectSlide(index));

        notesSlidesGrid.appendChild(card);
    });
}

function selectSlide(index) {
    selectedSlideIndex = index;
    notesSlidesGrid.querySelectorAll('.slide-card').forEach(card => {
        if (parseInt(card.dataset.index) === index) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// Proyectar Diapositiva en Vivo heredando el Tema de Notas
async function projectSlide(index) {
    activeLiveSlideIndex = index;
    const slide = parsedSlides[index];

    notesSlidesGrid.querySelectorAll('.slide-card').forEach(card => {
        if (parseInt(card.dataset.index) === index) {
            card.classList.add('live');
        } else {
            card.classList.remove('live');
        }
    });

    try {
        const settings = await window.api.getSettings();
        const themeId = settings.defaultNotesTheme || settings.defaultSongsTheme || 'default';
        const activeTheme = settings.themes.find(t => t.id === themeId) || settings.themes[0];

        const payload = {
            texto: slide.text,
            estilo: activeTheme,
            background: activeTheme.bgType !== 'color' ? {
                path: activeTheme.bgPath,
                type: activeTheme.bgType
            } : null,
            clearBg: activeTheme.bgType === 'color'
        };

        window.api.proyectarTexto(payload);

    } catch (err) {
        console.error("[Notes Tab] Error al proyectar slide de nota:", err);
        window.api.proyectarTexto(slide.text);
    }
}

function clearNotesProjection() {
    activeLiveSlideIndex = null;
    window.api.limpiarPantalla();
    notesSlidesGrid.querySelectorAll('.slide-card').forEach(card => card.classList.remove('live'));
}

// ================= GUARDADO Y ELIMINACIÓN DE NOTAS =================

async function handleSaveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteLiveEditor.value.trim();
    const author = noteAuthorInput.value.trim();
    const category = noteCategoryInput.value.trim();

    if (!title || !content) {
        showStatus("✗ Por favor completa el Título y el Contenido.", true);
        return;
    }

    const noteData = {
        title,
        content,
        author: author || null,
        category: category || null,
        created_at: noteDateInput.value
    };

    if (selectedNoteId) {
        noteData.id = selectedNoteId;
    }

    try {
        const result = await window.api.saveSermonNote(noteData);
        if (result && result.success) {
            const activeId = selectedNoteId || result.id;
            
            // Recargar catálogo desde SQLite
            await loadCatalog('');
            
            // Cargar y seleccionar la nota correspondiente
            const savedNote = catalogNotes.find(n => n.id === activeId);
            if (savedNote) {
                loadNote(savedNote);
            }
            
            // Alerta visual de éxito (Verde)
            showStatus("✓ Bosquejo guardado con éxito.", false);
        } else {
            showStatus("✗ Error al intentar guardar el bosquejo.", true);
        }
    } catch (err) {
        console.error("[Notes Tab] Error al guardar bosquejo:", err);
        showStatus("✗ Error de comunicación con la base de datos.", true);
    }
}

async function handleDeleteNote() {
    if (!selectedNoteId) return;
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar permanentemente el bosquejo "${noteTitleInput.value}"?`);
    if (!confirmar) return;

    try {
        const result = await window.api.deleteSermonNote(selectedNoteId);
        if (result && result.success) {
            selectedNoteId = null;
            await loadCatalog('');
            showStatus("✓ Bosquejo eliminado con éxito.", false);
        }
    } catch (err) {
        console.error("[Notes Tab] Error al eliminar bosquejo:", err);
        showStatus("✗ Error al eliminar de la base de datos.", true);
    }
}

// Mostrar mensajes de estado de guardado dinámicos (Toast)
function showStatus(msg, isError) {
    if (notesSaveStatus) {
        notesSaveStatus.textContent = msg;
        notesSaveStatus.style.color = isError ? '#d9534f' : '#2ec4b6'; // Rojo si es error, verde si es éxito
        setTimeout(() => {
            notesSaveStatus.textContent = "";
        }, 3000);
    }
}

// ================= NAVEGACIÓN Y TECLADO =================

function handleNotesKeydown(e) {
    if (e.key === 'Escape') {
        clearNotesProjection();
        return;
    }

    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('slide-card')) {
            const idx = parseInt(activeElement.dataset.index);
            projectSlide(idx);
            return;
        }
        
        if (selectedSlideIndex !== null && document.activeElement === document.body) {
            projectSlide(selectedSlideIndex);
            return;
        }
    }

    if (activeLiveSlideIndex !== null) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateLiveNotes(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateLiveNotes(-1);
        }
    }
}

function navigateLiveNotes(direction) {
    const nextIdx = activeLiveSlideIndex + direction;
    if (nextIdx >= 0 && nextIdx < parsedSlides.length) {
        selectSlide(nextIdx);
        projectSlide(nextIdx);
        
        const targetCard = notesSlidesGrid.querySelector(`.slide-card[data-index="${nextIdx}"]`);
        if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}