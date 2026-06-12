import { selectTab } from '../../control/script.js';

// --- ESTADOS INTERNOS DEL MÓDULO ---
let savedNotes = [];       // Notas rápidas cargadas desde notes.db
let selectedNoteId = null; // ID de la nota seleccionada para editar
let editingNoteId = null;  // Variable de control del editor corregida

let activeLiveType = null; // Tipo de transmisión activa ('banner', 'fullscreen' o null)
let activeLiveText = "";   // El texto proyectado actualmente en vivo

// --- ELEMENTOS DE LA INTERFAZ ---
let notesCatalogList, btnCreateNote;
let noteLiveEditor, btnProjectBanner, btnProjectFullscreen, btnClearNoteProj;

// Vista Previa (Elementos fijos de la doble pantalla)
let notePreviewBoxFullscreen, notePreviewBoxBanner, previewNoteTextContent, previewAlertBanner;

// Modal
let noteEditorModal, btnModalClose, btnEditorCancel, btnEditorSave, modalTitle; // <-- DECLARADA modalTitle
let editorNoteTitle, editorNoteContent, notesSaveStatus;

export async function init() {
    // 1. Vincular elementos del catálogo
    notesCatalogList = document.getElementById('notes-catalog-list');
    btnCreateNote = document.getElementById('btn-create-note');

    // Vincular elementos del editor en vivo
    noteLiveEditor = document.getElementById('note-live-editor');
    btnProjectBanner = document.getElementById('btn-project-banner');
    btnProjectFullscreen = document.getElementById('btn-project-fullscreen');
    btnClearNoteProj = document.getElementById('btn-clear-note-proj');

    // Vincular Vista Previa de Doble Pantalla
    notePreviewBoxFullscreen = document.getElementById('note-preview-box-fullscreen');
    notePreviewBoxBanner = document.getElementById('note-preview-box-banner');
    previewNoteTextContent = document.getElementById('preview-note-text-content');
    previewAlertBanner = document.getElementById('preview-alert-banner');

    // Vincular modal flotante
    noteEditorModal = document.getElementById('note-editor-modal');
    modalTitle = document.getElementById('modal-title'); // <-- ENLAZADO CLAVE
    btnModalClose = document.getElementById('btn-modal-close');
    btnEditorCancel = document.getElementById('btn-editor-cancel');
    btnEditorSave = document.getElementById('btn-editor-save');

    editorNoteTitle = document.getElementById('editor-note-title');
    editorNoteContent = document.getElementById('editor-note-content');
    notesSaveStatus = document.getElementById('settings-save-status');

    // 2. Escuchar eventos de interacción
    btnCreateNote.addEventListener('click', () => openEditor());
    btnModalClose.addEventListener('click', closeEditor);
    btnEditorCancel.addEventListener('click', closeEditor);
    btnEditorSave.addEventListener('click', handleSaveNote);

    // Entrada del editor en vivo para actualizar la vista previa al escribir
    noteLiveEditor.addEventListener('input', handleLiveEditorInput);

    // Botones de proyección activa
    btnProjectBanner.addEventListener('click', projectAsBanner);
    btnProjectFullscreen.addEventListener('click', projectAsFullscreen);
    btnClearNoteProj.addEventListener('click', clearNoteProjection);

    // 3. Inicializar Teclado (ESC o ENTER en el editor)
    document.removeEventListener('keydown', handleNotesKeydown);
    document.addEventListener('keydown', handleNotesKeydown);

    // 4. Cargar catálogo de notas pre-guardadas
    await loadNotesCatalog();
}

// ================= GESTIÓN DEL CATÁLOGO DE NOTAS (COLUMNA 1) =================

async function loadNotesCatalog() {
    try {
        savedNotes = await window.api.getQuickNotes();
        renderCatalog();
    } catch (err) {
        console.error("[Notes] Error al cargar catálogo de notas:", err);
    }
}

function renderCatalog() {
    notesCatalogList.innerHTML = '';

    if (savedNotes.length === 0) {
        notesCatalogList.innerHTML = '<li style="font-size: 11px; color: var(--text-secondary); text-align: center; border: none; cursor: default; background: none; padding-top: 15px;">No hay avisos guardados.</li>';
        return;
    }

    savedNotes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        if (note.id === selectedNoteId) li.className = 'active';

        const previewText = note.content.length > 30 ? note.content.substring(0, 30) + "..." : note.content;

        li.innerHTML = `
            <div class="note-catalog-info">
                <h4>${note.title}</h4>
                <p>${previewText}</p>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="note-btn-edit" style="background:none; border:none; color: var(--text-secondary); font-size:12px; cursor:pointer;" title="Editar">✏️</button>
                <button class="note-btn-delete" title="Eliminar Aviso">🗑️</button>
            </div>
        `;

        li.addEventListener('click', () => {
            selectedNoteId = note.id;
            noteLiveEditor.value = note.content;
            
            notesCatalogList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            handleLiveEditorInput();
        });

        li.querySelector('.note-btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditor(note);
        });

        li.querySelector('.note-btn-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmar = confirm(`¿Estás seguro de que deseas eliminar permanentemente el aviso "${note.title}"?`);
            if (confirmar) {
                try {
                    const result = await window.api.deleteQuickNote(note.id);
                    if (result && result.success) {
                        if (selectedNoteId === note.id) {
                            selectedNoteId = null;
                            noteLiveEditor.value = '';
                            resetPreview();
                        }
                        await loadNotesCatalog();
                    }
                } catch (err) {
                    console.error("[Notes] Error al borrar aviso de la BD:", err);
                }
            }
        });

        notesCatalogList.appendChild(li);
    });
}

// ================= LÓGICA DE ACTUALIZACIÓN DE VISTA PREVIA DOBLE =================

// Al escribir en el editor central se actualizan AMBOS visores de forma simultánea
function handleLiveEditorInput() {
    const text = noteLiveEditor.value.trim();

    // 1. Visor de pantalla completa (Siempre con opacidad baja a menos que esté live)
    previewNoteTextContent.textContent = text || "Texto del Aviso a Pantalla Completa";
    previewNoteTextContent.style.display = 'block';

    // 2. Visor de banner inferior (Siempre visible de forma local para previsualizar)
    previewAlertBanner.textContent = text || "Texto del banner de alerta inferior";
    previewAlertBanner.style.display = 'block';
}

function resetPreview() {
    previewNoteTextContent.textContent = 'Escribe un aviso...';
    previewAlertBanner.style.display = 'none';
    previewAlertBanner.textContent = '';
    
    notePreviewBoxFullscreen.classList.remove('live');
    notePreviewBoxBanner.classList.remove('live');
}

// ================= PROYECCIÓN EN VIVO (MÉTODOS POLIMÓRFICOS) =================

// Proyectar como Banner / Franja
function projectAsBanner() {
    const text = noteLiveEditor.value.trim();
    if (!text) return;

    activeLiveType = 'banner';
    activeLiveText = text;

    // Encender indicador LIVE únicamente en la tarjeta de Banner
    notePreviewBoxBanner.classList.add('live');
    notePreviewBoxFullscreen.classList.remove('live');

    previewAlertBanner.textContent = text;
    previewAlertBanner.style.display = 'block';

    // Enviar por IPC al proyector
    window.api.proyectarTexto({
        alertText: text 
    });
}

// Proyectar como Diapositiva Completa (Hereda estilos del Tema de notas/canciones)
async function projectAsFullscreen() {
    const text = noteLiveEditor.value.trim();
    if (!text) return;

    activeLiveType = 'fullscreen';
    activeLiveText = text;

    // Encender indicador LIVE únicamente en la tarjeta de Pantalla Completa
    notePreviewBoxFullscreen.classList.add('live');
    notePreviewBoxBanner.classList.remove('live');

    previewNoteTextContent.textContent = text;

    try {
        const settings = await window.api.getSettings();
        const themeId = settings.defaultNotesTheme || settings.defaultSongsTheme || 'default';
        const activeTheme = settings.themes.find(t => t.id === themeId) || settings.themes[0];

        const payload = {
            texto: text,
            estilo: activeTheme,
            background: activeTheme.bgType !== 'color' ? {
                path: activeTheme.bgPath,
                type: activeTheme.bgType
            } : null,
            clearBg: activeTheme.bgType === 'color'
        };

        window.api.proyectarTexto(payload);

    } catch (err) {
        console.error("[Notes] Error al proyectar como diapositiva con tema:", err);
        window.api.proyectarTexto(text);
    }
}

// Limpiar la nota en vivo (Apaga tanto faja como pantalla completa)
function clearNoteProjection() {
    activeLiveType = null;
    activeLiveText = "";

    // Apagar luces live en ambos visores del operador
    notePreviewBoxFullscreen.classList.remove('live');
    notePreviewBoxBanner.classList.remove('live');

    // Restaurar textos pasivos
    handleLiveEditorInput();

    window.api.proyectarTexto({
        clearAlert: true, 
        texto: ""         
    });
}

// ================= NAVEGACIÓN Y TECLADO =================

function handleNotesKeydown(e) {
    if (e.key === 'Escape') {
        clearNoteProjection();
        return;
    }

    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        projectAsBanner();
    }
}

// ================= EDITOR DE NOTAS DEL CATÁLOGO =================

function openEditor(note = null) {
    if (note) {
        editingNoteId = note.id; // Corrección total
        modalTitle.textContent = "Editar Aviso";
        editorNoteTitle.value = note.title;
        editorNoteContent.value = note.content;
    } else {
        editingNoteId = null; // Corrección total
        modalTitle.textContent = "Guardar Aviso";
        editorNoteTitle.value = '';
        editorNoteContent.value = '';
    }
    noteEditorModal.classList.remove('hidden');
}

function closeEditor() {
    noteEditorModal.classList.add('hidden');
    editingNoteId = null;
}

async function handleSaveNote() {
    const title = editorNoteTitle.value.trim();
    const content = editorNoteContent.value.trim();

    if (!title || !content) {
        alert("Por favor completa el Título y el Contenido de la nota.");
        return;
    }

    const noteData = {
        title,
        content
    };

    if (editingNoteId) { // Corrección total
        noteData.id = editingNoteId;
    }

    try {
        const result = await window.api.saveQuickNote(noteData);
        if (result && result.success) {
            closeEditor();
            await loadNotesCatalog();
        }
    } catch (err) {
        console.error("[Notes] Error al guardar aviso en la base de datos:", err);
        alert("Ocurrió un error al intentar guardar la nota rápida.");
    }
}