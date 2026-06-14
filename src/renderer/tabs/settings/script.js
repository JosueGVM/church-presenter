let screenList, btnRedetectScreens, btnToggleProjection;
let selectStartTab, selectUiTheme, checkHideWelcome, btnViewWelcome;
let selectWordSplit;
let settingsSaveStatus;

let isProjectionOpen = false; // Bandera de estado del proyector

export async function init() {
    // 1. Vincular elementos
    screenList = document.getElementById('screen-list');
    btnRedetectScreens = document.getElementById('btn-redetect-screens');
    btnToggleProjection = document.getElementById('btn-toggle-projection');

    selectStartTab = document.getElementById('select-start-tab');
    selectUiTheme = document.getElementById('select-ui-theme');
    checkHideWelcome = document.getElementById('check-hide-welcome');
    btnViewWelcome = document.getElementById('btn-view-welcome');
    selectWordSplit = document.getElementById('select-word-split');

    settingsSaveStatus = document.getElementById('settings-save-status');

    // 2. Escuchar clics e interacciones
    btnRedetectScreens.addEventListener('click', detectDisplays);
    btnToggleProjection.addEventListener('click', handleToggleProjection);
    btnViewWelcome.addEventListener('click', () => {
        // Simulamos un clic físico sobre el botón de bienvenida de tu barra de herramientas
        const welcomeBtn = document.querySelector('.nav-btn[data-tab="welcome"]');
        if (welcomeBtn) {
            welcomeBtn.click();
        }
    });

    // Cambios automáticos de configuración (Se guardan de inmediato al interactuar)
    selectStartTab.addEventListener('change', saveSettings);
    selectUiTheme.addEventListener('change', saveSettings);
    checkHideWelcome.addEventListener('change', saveSettings);
    selectWordSplit.addEventListener('change', saveSettings);

    // 3. Inicializaciones iniciales
    await detectDisplays();
    await checkProjectionState();
    await loadSettings();
}

// ================= GESTIÓN DE PANTALLAS (ELECTRON APIS) =================

async function detectDisplays() {
    try {
        screenList.innerHTML = '';
        const displays = await window.api.getDisplays();

        if (displays.length > 0) {
            displays.forEach(display => {
                const li = document.createElement('li');
                const rol = display.esPrincipal ? '⭐ Monitor Principal' : '📺 Monitor Externo';
                li.innerHTML = `<strong>${rol}</strong> — ID: ${display.id} — Resolución: ${display.width}x${display.height}`;
                screenList.appendChild(li);
            });
        } else {
            screenList.innerHTML = '<li>No se detectaron pantallas adicionales.</li>';
        }
    } catch (err) {
        console.error("[Settings] Error al detectar pantallas:", err);
        screenList.innerHTML = '<li>Error al detectar monitores.</li>';
    }
}

// Verificar si el proyector está abierto actualmente
async function checkProjectionState() {
    try {
        const state = await window.api.toggleProjection('status');
        updateProjectionButton(state.abierta);
    } catch (err) {
        console.error("[Settings] Error al verificar estado de proyección:", err);
    }
}

// Abrir o Cerrar la Proyección bajo demanda (Salvavidas HDMI)
async function handleToggleProjection() {
    try {
        const action = isProjectionOpen ? 'close' : 'open';
        const state = await window.api.toggleProjection(action);
        updateProjectionButton(state.abierta);
    } catch (err) {
        console.error("[Settings] Error al cambiar estado de proyección:", err);
    }
}

function updateProjectionButton(isOpen) {
    isProjectionOpen = isOpen;
    if (isOpen) {
        btnToggleProjection.textContent = "Cerrar Proyección";
        btnToggleProjection.className = "btn danger";
    } else {
        btnToggleProjection.textContent = "Abrir Proyección";
        btnToggleProjection.className = "btn primary";
    }
}

// ================= GESTIÓN DE CONFIGURACIÓN (settings.json) =================

async function loadSettings() {
    try {
        const settings = await window.api.getSettings();
        if (settings) {
            selectStartTab.value = settings.startTab || 'welcome';
            selectUiTheme.value = settings.uiTheme || 'dark';
            checkHideWelcome.checked = !!settings.hideWelcomeIcon;
            selectWordSplit.value = String(settings.wordSplitLimit ?? 150);
        }
    } catch (err) {
        console.error("[Settings] Error al cargar configuraciones:", err);
    }
}

// Guardar de forma persistente y segura las configuraciones de usuario
async function saveSettings() {
    try {
        // 1. Leemos las configuraciones actuales para no sobreescribir ni perder los temas creados
        const settings = await window.api.getSettings();
        
        // 2. Actualizamos únicamente los campos de inicio y estilo de interfaz
        settings.startTab = selectStartTab.value;
        settings.uiTheme = selectUiTheme.value;
        settings.hideWelcomeIcon = checkHideWelcome.checked;
        settings.wordSplitLimit = parseInt(selectWordSplit.value);

        // 3. Guardamos el objeto completo y combinado de vuelta en la USB
        const result = await window.api.saveSettings(settings);
        
        if (result && result.success) {
            // Disparamos el evento global para que el Sidebar se actualice al instante
            window.dispatchEvent(new CustomEvent('settings-updated'));

            settingsSaveStatus.textContent = "✓ Configuración guardada e integrada con éxito.";
            setTimeout(() => {
                settingsSaveStatus.textContent = "";
            }, 3000);
        }
    } catch (err) {
        console.error("[Settings] Error al guardar configuraciones:", err);
        settingsSaveStatus.textContent = "✗ Error al guardar preferencias.";
    }
}