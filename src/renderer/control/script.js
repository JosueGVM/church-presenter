const mainContent = document.getElementById('main-content');
const navButtons = document.querySelectorAll('.nav-btn');
const tabStylesheet = document.getElementById('tab-stylesheet');

// Ruta base donde se guardarán las pestañas
const TABS_PATH = '../tabs';

// Función para cambiar de pestaña e inyectar recursos dinámicamente
async function selectTab(tabName) {
    try {
        // 1. Actualizar el estado visual del Sidebar
        navButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. Inyectar la hoja de estilos CSS de la pestaña activa
        tabStylesheet.href = `${TABS_PATH}/${tabName}/style.css`;

        // 3. Descargar e inyectar el HTML de la pestaña
        const response = await fetch(`${TABS_PATH}/${tabName}/view.html`);
        if (!response.ok) throw new Error(`No se pudo cargar la vista de la pestaña: ${tabName}`);
        
        const html = await response.text();
        mainContent.innerHTML = html;

        // 4. Importar y ejecutar dinámicamente la lógica JS de la pestaña
        // Usamos try/catch porque pestañas estáticas como "welcome" no necesitan JS obligatorio
        try {
            const module = await import(`${TABS_PATH}/${tabName}/script.js`);
            if (module && typeof module.init === 'function') {
                module.init();
            }
        } catch (jsError) {
            // Nota de depuración por si la pestaña no contiene o no requiere script.js
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

// Escuchar los clics del sidebar para cambiar de pestaña
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        selectTab(tabName);
    });
});

// Cargar la pestaña configurada de inicio al arrancar la app
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await window.api.getSettings();
        // Si no hay configuración o dice 'welcome', carga el tutorial; si no, abre el modo directamente
        const startTab = (settings && settings.startTab) ? settings.startTab : 'welcome';
        selectTab(startTab);
    } catch (err) {
        console.warn("[Router] No se pudo leer settings de inicio, cargando welcome por defecto:", err);
        selectTab('welcome');
    }
});