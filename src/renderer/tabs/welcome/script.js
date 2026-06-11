// La función init() será invocada automáticamente por el enrutador de index.js
export async function init() {
    const selectStartTab = document.getElementById('select-start-tab');
    const btnSaveStart = document.getElementById('btn-save-start');
    const saveStatus = document.getElementById('save-status');

    try {
        // Pedir la configuración guardada al backend (settings.json)
        const settings = await window.api.getSettings();
        if (settings && settings.startTab) {
            selectStartTab.value = settings.startTab;
        }
    } catch (err) {
        console.error("[Welcome] Error al cargar la configuración de inicio:", err);
    }

    // Guardar preferencia
    btnSaveStart.addEventListener('click', async () => {
        const selectedValue = selectStartTab.value;
        try {
            const result = await window.api.saveSettings({ startTab: selectedValue });
            if (result && result.success) {
                saveStatus.textContent = "✓ Preferencia guardada con éxito.";
                setTimeout(() => {
                    saveStatus.textContent = "";
                }, 3000);
            } else {
                saveStatus.textContent = "✗ Error al intentar guardar la preferencia.";
            }
        } catch (err) {
            console.error("[Welcome] Error al enviar settings por IPC:", err);
            saveStatus.textContent = "✗ Error de comunicación con el sistema.";
        }
    });
}