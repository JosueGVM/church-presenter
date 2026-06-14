const mainContent = document.getElementById('main-content');
const navButtons = document.querySelectorAll('.nav-btn');
const tabStylesheet = document.getElementById('tab-stylesheet');

const TABS_PATH = '../tabs';

// Botones de la titlebar personalizada
document.getElementById('tb-minimize')?.addEventListener('click', () => window.api.minimizeWindow());
document.getElementById('tb-maximize')?.addEventListener('click', () => window.api.maximizeWindow());
document.getElementById('tb-close')?.addEventListener('click', () => window.api.closeWindow());

// Función para ocultar o mostrar el icono de Tutorial según la configuración
function applySidebarSettings(settings) {
    const welcomeBtn = document.querySelector('.nav-btn[data-tab="welcome"]');
    const separator = document.querySelector('.sidebar-separator');

    if (welcomeBtn && separator) {
        if (settings && settings.hideWelcomeIcon) {
            welcomeBtn.style.display = 'none';
            separator.style.display = 'none';
        } else {
            welcomeBtn.style.display = 'flex';
            separator.style.display = 'block';
        }
    }

    const theme = (settings && settings.uiTheme) ? settings.uiTheme : 'dark';
    document.body.className = `theme-${theme}`; // Aplica .theme-dark o .theme-light al body
}

// Función para cambiar de pestaña e inyectar recursos dinámicamente
async function selectTab(tabName) {
    try {
        navButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabStylesheet.href = `${TABS_PATH}/${tabName}/style.css`;

        const response = await fetch(`${TABS_PATH}/${tabName}/view.html`);
        if (!response.ok) throw new Error(`No se pudo cargar la vista de la pestaña: ${tabName}`);
        
        const html = await response.text();
        mainContent.innerHTML = html;

        try {
            const module = await import(`${TABS_PATH}/${tabName}/script.js`);
            if (module && typeof module.init === 'function') {
                module.init();
            }
        } catch (jsError) {
            console.warn(`[Router Debug] Error al inicializar la lógica de "${tabName}":`, jsError);
        }

    } catch (error) {
        console.error(`[Router Error] Fallo al cargar la pestaña "${tabName}":`, error);
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--danger);">
                <h3>Error de carga</h3>
                <p>No se pudo inyectar el módulo seleccionado de forma segura.</p>
            </div>
        `;
    }
}

// Escuchar los clics del sidebar
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        selectTab(tabName);
    });
});

// ESCUCHAR EN TIEMPO REAL SI SE CAMBIA LA CONFIGURACIÓN DESDE SETTINGS
window.addEventListener('settings-updated', async () => {
    const settings = await window.api.getSettings();
    applySidebarSettings(settings);
});

// Cargar la pestaña configurada de inicio al arrancar la app
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await window.api.getSettings();
        applySidebarSettings(settings); // Aplicamos visibilidad del icono al arrancar
        
        const startTab = (settings && settings.startTab) ? settings.startTab : 'welcome';
        selectTab(startTab);
    } catch (err) {
        console.warn("[Router] No se pudo leer settings de inicio, cargando welcome por defecto:", err);
        selectTab('welcome');
    }
});

// EXPORTAR selectTab para permitir que pestañas internas fuercen la redirección
export { selectTab };