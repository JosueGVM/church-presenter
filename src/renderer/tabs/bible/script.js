import { BIBLE_BOOKS, BIBLE_CAT_COLORS } from '../../../constants/bible.js';
import { splitTextByWords } from '../../common/textUtils.js';

// --- ESTADOS INTERNOS DEL MÓDULO ---
let versionsList = [];
let currentVersionPage = 0;
const versionsPerPage = 10;

let selectedVersion = "";
let selectedBookObj = null;  // Almacena el objeto del libro activo
let selectedChapterNum = 1;
let selectedVerseNum = null;

let activeLiveVerseNum = null; // Almacena el número del versículo proyectado en este momento

// Sub-slides de versículo largo (división por palabras)
let _pendingChunks = [];
let _currentChunkIndex = 0;

// Paginación interna de Capítulos (Para Salmos > 75)
let currentChapterPage = 0;
const chaptersPerPage = 75;

// Paginación interna de Versículos (Para versículos > 88)
let currentVersePage = 0;
const versesPerPage = 88;

// --- ELEMENTOS DE LA INTERFAZ ---
let versionsContainer, btnPrevVersions, btnNextVersions;
let currentChapterTitle, bibleTextList;
let booksGrid, chaptersGrid, versesGrid;

export async function init() {
    // 1. Vincular los elementos de la vista
    versionsContainer = document.getElementById('versions-container');
    btnPrevVersions = document.getElementById('btn-prev-versions');
    btnNextVersions = document.getElementById('btn-next-versions');
    
    currentChapterTitle = document.getElementById('current-chapter-title');
    bibleTextList = document.getElementById('bible-text-list');
    
    booksGrid = document.getElementById('books-grid');
    chaptersGrid = document.getElementById('chapters-grid');
    versesGrid = document.getElementById('verses-grid');

    // 2. Escuchar botones de paginación de versiones
    btnPrevVersions.addEventListener('click', () => changeVersionPage(-1));
    btnNextVersions.addEventListener('click', () => changeVersionPage(1));

    // 3. Inicializar Teclado (ESC, ENTER, Flechas de Dirección)
    document.removeEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('keydown', handleGlobalKeydown);

    // 4. Arrancar la carga de datos
    await loadInitialData();
}

// --- LOGICA DE DATOS ---

async function loadInitialData() {
    try {
        // Cargar versiones desde la BD
        versionsList = await window.api.getVersions();

        if (versionsList.length > 0) {
            // Restaurar la versión que el usuario dejó activa la última vez
            const settings = await window.api.getSettings();
            const savedVersion = settings.lastBibleVersion;

            if (savedVersion && versionsList.includes(savedVersion)) {
                selectedVersion = savedVersion;
            } else {
                selectedVersion = versionsList[0];
            }

            renderVersions();
        }

        // Renderizar cuadrícula fija de 66 libros
        renderBooksGrid();

        // Cargar de manera predeterminada Génesis 1 al iniciar
        selectedBookObj = BIBLE_BOOKS[0]; // Génesis
        selectedChapterNum = 1;
        selectedVerseNum = null;

        highlightActiveBook();
        renderChaptersGrid();
        await loadChapterTextAndRenderVersesGrid();

    } catch (err) {
        console.error("[Bible Tab] Error al inicializar datos:", err);
    }
}

// Renderizar cuadrícula de libros bíblicos con sus colores correspondientes
function renderBooksGrid() {
    booksGrid.innerHTML = '';
    BIBLE_BOOKS.forEach((book) => {
        const tile = document.createElement('div');
        tile.className = 'book-tile';
        tile.dataset.bookName = book.name;
        
        const color = BIBLE_CAT_COLORS[book.cat] || BIBLE_CAT_COLORS.default;
        tile.style.backgroundColor = color;

        tile.innerHTML = `
            <span class="abbr">${book.abbr}</span>
            <span class="full-name">${book.name}</span>
        `;

        tile.addEventListener('click', () => {
            selectedBookObj = book;
            selectedChapterNum = 1; // Auto-selecciona el Capítulo 1
            selectedVerseNum = null;
            currentChapterPage = 0; // Reset de paginación de capítulos
            currentVersePage = 0;   // Reset de paginación de versículos

            highlightActiveBook();
            renderChaptersGrid();
            loadChapterTextAndRenderVersesGrid();
        });

        booksGrid.appendChild(tile);
    });
}

function highlightActiveBook() {
    const tiles = booksGrid.querySelectorAll('.book-tile');
    tiles.forEach(tile => {
        if (tile.dataset.bookName === selectedBookObj.name) {
            tile.classList.add('active');
        } else {
            tile.classList.remove('active');
        }
    });
}

// --- ALGORITMO MATEMÁTICO DE REJILLAS ADAPTATIVAS (FR) ---
function calculateGridDimensions(count, maxCols, maxRows) {
    // 1. Calculamos columnas iniciales aproximando a un cuadrado
    let cols = Math.ceil(Math.sqrt(count));
    let rows = Math.ceil(count / cols);

    // 2. Si las filas calculadas exceden el límite, forzamos el límite de filas y calculamos columnas
    if (rows > maxRows) {
        rows = maxRows;
        cols = Math.ceil(count / rows);
    }
    if (cols > maxCols) {
        cols = maxCols;
        rows = Math.ceil(count / cols);
    }
    return { cols, rows };
}

// Función matemática para oscurecer un color hexadecimal de forma proporcional (20% por defecto)
function darkenHexColor(hex, percent) {
    let num = parseInt(hex.replace("#", ""), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) - amt;
    let G = (num >> 8 & 0x00FF) - amt;
    let B = (num & 0x0000FF) - amt;

    R = R < 0 ? 0 : R;
    G = G < 0 ? 0 : G;
    B = B < 0 ? 0 : B;

    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Función matemática para aclarar un color hexadecimal de forma proporcional
function lightenHexColor(hex, percent) {
    let num = parseInt(hex.replace("#", ""), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;

    R = R < 255 ? (R < 0 ? 0 : R) : 255;
    G = G < 255 ? (G < 0 ? 0 : G) : 255;
    B = B < 255 ? (B < 0 ? 0 : B) : 255;

    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Dibujar cuadrícula de capítulos adaptativa, herencia de color y oscurecimiento al seleccionar
function renderChaptersGrid() {
    chaptersGrid.innerHTML = '';
    const totalChapters = selectedBookObj.ch;
    
    let chaptersToRender = [];

    // Paginación en capítulos (Salmo 150)
    if (totalChapters > chaptersPerPage) {
        const start = currentChapterPage * chaptersPerPage;
        const end = start + chaptersPerPage;
        const pageChapters = [];
        
        for (let i = start + 1; i <= Math.min(end, totalChapters); i++) {
            pageChapters.push(i);
        }

        if (currentChapterPage === 0) {
            chaptersToRender = [...pageChapters, 'next'];
        } else {
            chaptersToRender = ['prev', ...pageChapters];
        }
    } else {
        for (let i = 1; i <= totalChapters; i++) {
            chaptersToRender.push(i);
        }
    }

    // Calcular dimensiones de la cuadrícula adaptativa (Máximo 10 cols x 8 filas)
    const { cols, rows } = calculateGridDimensions(chaptersToRender.length, 10, 8);
    chaptersGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    chaptersGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Obtener el color exacto del libro padre
    const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;

    chaptersToRender.forEach(item => {
        const tile = document.createElement('div');
        tile.className = 'num-tile';

        if (item === 'next') {
            tile.textContent = '>';
            tile.style.backgroundColor = '#16161b';
            tile.style.color = '#fff';
            tile.addEventListener('click', () => {
                currentChapterPage++;
                renderChaptersGrid();
            });
        } else if (item === 'prev') {
            tile.textContent = '<';
            tile.style.backgroundColor = '#16161b';
            tile.style.color = '#fff';
            tile.addEventListener('click', () => {
                currentChapterPage--;
                renderChaptersGrid();
            });
        } else {
            tile.textContent = item;

            // Herencia de color: El capítulo tiene el mismo color exacto del libro activo
            if (item === selectedChapterNum) {
                tile.classList.add('active');
                tile.style.backgroundColor = darkenHexColor(bookColor, 20); // Oscurecido al seleccionarse
            } else {
                tile.style.backgroundColor = bookColor; // Hereda el color exacto
                tile.style.borderColor = 'rgba(0,0,0,0.15)';
            }

            tile.addEventListener('click', () => {
                selectedChapterNum = item;
                selectedVerseNum = null;
                currentVersePage = 0; // Reset paginación de versículo

                // Actualizar selección visual de capítulos
                chaptersGrid.querySelectorAll('.num-tile').forEach(t => {
                    const num = parseInt(t.textContent);
                    if (num === item) {
                        t.classList.add('active');
                        t.style.backgroundColor = darkenHexColor(bookColor, 20); // Oscurecer seleccionado
                    } else {
                        t.classList.remove('active');
                        if (t.textContent !== '<' && t.textContent !== '>') {
                            t.style.backgroundColor = bookColor; // Restaurar color padre
                        }
                    }
                });

                loadChapterTextAndRenderVersesGrid();
            });
        }

        chaptersGrid.appendChild(tile);
    });
}

// Cargar el texto en la columna central y generar la cuadrícula de versículos
async function loadChapterTextAndRenderVersesGrid() {
    try {
        const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;
        
        // El Título de la columna central de texto adquiere dinámicamente el color del Libro Padre
        currentChapterTitle.textContent = `${selectedBookObj.name} ${selectedChapterNum}`;
        currentChapterTitle.style.color = bookColor;
        
        // Buscar versículos en la BD SQLite
        const verses = await window.api.searchVerses({
            version: selectedVersion,
            book: selectedBookObj.name,
            chapter: selectedChapterNum
        });

        renderVersesTextList(verses);
        renderVersesGrid(verses.length);

    } catch (err) {
        console.error("[Bible Tab] Error al cargar capítulo:", err);
    }
}

// Renderizar la lista de texto (Columna 2)
function renderVersesTextList(verses) {
    bibleTextList.innerHTML = '';
    
    verses.forEach(v => {
        const li = document.createElement('li');
        li.dataset.verseNumber = v.verse_number;
        li.dataset.textoCompleto = `${v.book_name} ${v.chapter}:${v.verse_number}\n\n"${v.text}"`;
        li.tabIndex = 0; // Permite enfocar con el teclado

        li.innerHTML = `<strong>${v.verse_number}</strong> ${v.text}`;

        if (v.verse_number === activeLiveVerseNum) {
            li.classList.add('live');
        }

        // Selección simple (auto-scroll)
        li.addEventListener('click', () => {
            selectVerse(v.verse_number, false);
        });

        // Doble clic para proyectar
        li.addEventListener('dblclick', () => {
            projectVerse(v.verse_number, li.dataset.textoCompleto);
        });

        bibleTextList.appendChild(li);
    });
}

// Dibujar cuadrícula de versículos adaptativa y con paginación
function renderVersesGrid(totalVerses) {
    versesGrid.innerHTML = '';
    
    let versesToRender = [];

    // Paginación en versículos (Para capítulos > 88 versículos)
    if (totalVerses > versesPerPage) {
        const start = currentVersePage * versesPerPage;
        const end = start + versesPerPage;
        const pageVerses = [];
        
        for (let i = start + 1; i <= Math.min(end, totalVerses); i++) {
            pageVerses.push(i);
        }

        if (currentVersePage === 0) {
            versesToRender = [...pageVerses, 'next'];
        } else {
            versesToRender = ['prev', ...pageVerses];
        }
    } else {
        for (let i = 1; i <= totalVerses; i++) {
            versesToRender.push(i);
        }
    }

    // Calcular dimensiones de la cuadrícula de versículos (Máximo 13 cols x 7 filas)
    const { cols, rows } = calculateGridDimensions(versesToRender.length, 13, 7);
    versesGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    versesGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Obtener color del libro (Heredará el color del libro exacto)
    const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;
    const verseColor = lightenHexColor(bookColor, 18);

    versesToRender.forEach(item => {
        const tile = document.createElement('div');
        tile.className = 'num-tile';

        if (item === 'next') {
            tile.textContent = '>';
            tile.style.backgroundColor = '#16161b';
            tile.style.color = '#fff';
            tile.addEventListener('click', () => {
                currentVersePage++;
                renderVersesGrid(totalVerses);
            });
        } else if (item === 'prev') {
            tile.textContent = '<';
            tile.style.backgroundColor = '#16161b';
            tile.style.color = '#fff';
            tile.addEventListener('click', () => {
                currentVersePage--;
                renderVersesGrid(totalVerses);
            });
        } else {
            tile.textContent = item;

            // Herencia cromática exacta y oscurecimiento al seleccionar
            if (item === activeLiveVerseNum) {
                tile.classList.add('live'); // Si está EN VIVO usa estilo CSS azul accent
            } else if (item === selectedVerseNum) {
                tile.classList.add('active');
                tile.style.backgroundColor = darkenHexColor(bookColor, 20); // Oscurecido al seleccionarse
            } else {
                tile.style.backgroundColor = verseColor; // Hereda el color exacto
                tile.style.borderColor = 'rgba(0,0,0,0.15)';
            }

            tile.addEventListener('click', () => {
                selectVerse(item, true);
            });

            tile.addEventListener('dblclick', () => {
                const li = bibleTextList.querySelector(`li[data-verse-number="${item}"]`);
                if (li) {
                    projectVerse(item, li.dataset.textoCompleto);
                }
            });
        }

        versesGrid.appendChild(tile);
    });
}

// Lógica de Selección y Auto-scroll de versículos
function selectVerse(verseNum, mustScroll) {
    selectedVerseNum = verseNum;

    const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;
    const verseColor = lightenHexColor(bookColor, 18);

    // Resaltar en cuadrícula de versículos (Hereda color y oscurece seleccionado)
    versesGrid.querySelectorAll('.num-tile').forEach(t => {
        const num = parseInt(t.textContent);
        if (num === verseNum) {
            t.classList.add('active');
            if (!t.classList.contains('live')) {
                t.style.backgroundColor = darkenHexColor(bookColor, 20); // Oscurecido
            }
        } else {
            t.classList.remove('active');
            if (!t.classList.contains('live') && t.textContent !== '<' && t.textContent !== '>') {
                t.style.backgroundColor = verseColor; // Restaurar color padre
            }
        }
    });

    // Resaltar en lista de texto (Columna central) y pintar dinámicamente el borde izquierdo del color del libro
    const listItems = bibleTextList.querySelectorAll('li');
    listItems.forEach(li => {
        const num = parseInt(li.dataset.verseNumber);
        if (num === verseNum) {
            li.classList.add('selected');
            li.style.borderLeftColor = bookColor; // Borde lateral del color exacto del libro
            li.focus(); // Enfocar para permitir pulsar ENTER
            
            if (mustScroll) {
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            li.classList.remove('selected');
            li.style.borderLeftColor = ''; // Resetear borde
        }
    });
}

// Proyección "EN VIVO" con herencia de Temas de settings.json
async function projectVerse(verseNum, textToProject) {
    activeLiveVerseNum = verseNum;

    try {
        // 1. Obtener la base de datos de configuraciones portátil
        const settings = await window.api.getSettings();
        
        // 2. Buscar qué tema está asignado de forma global para la Biblia
        const bibleThemeId = settings.defaultBibleTheme || 'default';
        const activeTheme = settings.themes.find(t => t.id === bibleThemeId) || settings.themes[0];

        // --- Separar la cita bíblica del texto del versículo ---
        const partes = textToProject.split('\n\n');
        const citaBiblica = partes[0] || "";
        const textoLimpio = (partes[1] || "").replace(/^"|"$/g, '').trim();

        // 3. Dividir por palabras si está configurado
        const wordLimit = settings.wordSplitLimit ?? 20;
        const chunks = splitTextByWords(textoLimpio, wordLimit);

        // 4. Proyectar cada chunk con un pequeño delay entre ellos si hay más de uno,
        //    o solo el primero si el operador navega rápido (proyectamos todos en secuencia
        //    usando dblclick/enter — el primer chunk va inmediato)
        const sendChunk = (chunkText) => {
            const payload = {
                texto: chunkText,
                cita: citaBiblica,
                esBiblia: true,
                estilo: activeTheme,
                background: activeTheme.bgType !== 'color' ? {
                    path: activeTheme.bgPath,
                    type: activeTheme.bgType
                } : null,
                clearBg: activeTheme.bgType === 'color'
            };
            window.api.proyectarTexto(payload);
        };

        if (chunks.length === 1) {
            sendChunk(chunks[0]);
        } else {
            // Si hay múltiples chunks, proyectamos el primero inmediatamente
            // y registramos los demás para navegar con flechas
            _pendingChunks = chunks;
            _currentChunkIndex = 0;
            sendChunk(_pendingChunks[0]);
        }

    } catch (err) {
        console.error("[Bible] Error al proyectar con estilos de tema:", err);
        window.api.proyectarTexto(textToProject);
    }

    const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;
    const verseColor = lightenHexColor(bookColor, 18);

    // Actualizar cuadrícula
    versesGrid.querySelectorAll('.num-tile').forEach(t => {
        const num = parseInt(t.textContent);
        if (num === verseNum) {
            t.classList.add('live');
            t.style.backgroundColor = ''; // CSS Accent Azul
        } else {
            t.classList.remove('live');
            if (num === selectedVerseNum) {
                t.style.backgroundColor = darkenHexColor(bookColor, 20);
            } else if (t.textContent !== '<' && t.textContent !== '>') {
                t.style.backgroundColor = verseColor;
            }
        }
    });

    // Actualizar visor central
    bibleTextList.querySelectorAll('li').forEach(li => {
        if (parseInt(li.dataset.verseNumber) === verseNum) {
            li.classList.add('live');
        } else {
            li.classList.remove('live');
        }
    });
}

// Limpiar la Proyección Activa
function clearProjection() {
    activeLiveVerseNum = null;
    window.api.limpiarPantalla();

    const bookColor = BIBLE_CAT_COLORS[selectedBookObj.cat] || BIBLE_CAT_COLORS.default;
    const verseColor = lightenHexColor(bookColor, 18);

    versesGrid.querySelectorAll('.num-tile').forEach(t => {
        t.classList.remove('live');
        const num = parseInt(t.textContent);
        if (num === selectedVerseNum) {
            t.style.backgroundColor = darkenHexColor(bookColor, 20);
        } else if (t.textContent !== '<' && t.textContent !== '>') {
            t.style.backgroundColor = verseColor;
        }
    });
    
    bibleTextList.querySelectorAll('li').forEach(li => li.classList.remove('live'));
}

// --- NAVEGACIÓN Y TECLADO ---

function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
        clearProjection();
        return;
    }

    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'LI' && activeElement.dataset.verseNumber) {
            projectVerse(parseInt(activeElement.dataset.verseNumber), activeElement.dataset.textoCompleto);
        }
        return;
    }

    if (activeLiveVerseNum !== null) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            navigateLiveVerse(1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateLiveVerse(-1);
        }
    }
}

function navigateLiveVerse(direction) {
    // Si hay chunks pendientes del versículo actual, navegar entre ellos primero
    if (_pendingChunks.length > 1) {
        const nextChunk = _currentChunkIndex + direction;
        if (nextChunk >= 0 && nextChunk < _pendingChunks.length) {
            _currentChunkIndex = nextChunk;
            window.api.proyectarTexto({ texto: _pendingChunks[_currentChunkIndex] });
            return;
        }
        // Si llegamos al final/inicio de los chunks, continuamos al siguiente versículo
    }

    // Navegar al siguiente/anterior versículo
    const totalVerses = bibleTextList.children.length;
    let nextVerse = activeLiveVerseNum + direction;

    if (nextVerse >= 1 && nextVerse <= totalVerses) {
        _pendingChunks = [];
        _currentChunkIndex = 0;
        const nextLi = bibleTextList.querySelector(`li[data-verse-number="${nextVerse}"]`);
        if (nextLi) {
            selectVerse(nextVerse, true);
            projectVerse(nextVerse, nextLi.dataset.textoCompleto);
        }
    }
}

// --- PAGINACION DE VERSIONES ---

function renderVersions() {
    versionsContainer.innerHTML = '';
    
    const start = currentVersionPage * versionsPerPage;
    const end = start + versionsPerPage;
    const pageSegment = versionsList.slice(start, end);

    pageSegment.forEach(v => {
        const pill = document.createElement('button');
        pill.className = `ver-pill ${v === selectedVersion ? 'active' : ''}`;
        pill.textContent = v;

        pill.addEventListener('click', async () => {
            selectedVersion = v;
            versionsContainer.querySelectorAll('.ver-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // Persistir la versión seleccionada para la próxima vez que abra la app
            try {
                const settings = await window.api.getSettings();
                await window.api.saveSettings({ ...settings, lastBibleVersion: v });
            } catch (err) {
                console.error("[Bible] Error al guardar versión activa:", err);
            }

            loadChapterTextAndRenderVersesGrid();
        });

        versionsContainer.appendChild(pill);
    });

    btnPrevVersions.disabled = currentVersionPage === 0;
    btnNextVersions.disabled = end >= versionsList.length;
}

function changeVersionPage(direction) {
    currentVersionPage += direction;
    renderVersions();
}