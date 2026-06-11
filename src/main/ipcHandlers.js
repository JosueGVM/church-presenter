const { ipcMain, BrowserWindow } = require('electron');
const dbManager = require('./dbManager');

function setupIpcHandlers() {
    // 1. Manejadores de proyección en tiempo real
    ipcMain.on('proyectar-contenido', (event, datos) => {
        // Buscar todas las ventanas abiertas en Electron
        const windows = BrowserWindow.getAllWindows();
        
        // Encontrar la ventana de proyección (podemos identificarla por su título o lógica)
        const projectionWin = windows.find(win => win.esProyeccion === true);

        if (projectionWin) {
            // Reenviar los datos de proyección a la pantalla secundaria
            projectionWin.webContents.send('actualizar-proyeccion', datos);
        }
    });

    // Escuchar evento para limpiar la pantalla (Black screen / Clear text)
    ipcMain.on('limpiar-proyeccion', () => {
        const windows = BrowserWindow.getAllWindows();
        const projectionWin = windows.find(win => win.esProyeccion === true);
        
        if (projectionWin) {
            projectionWin.webContents.send('limpiar-pantalla');
        }
    });

    // 2. Manejadores para consultas a la Base de Datos (Bibles)
    ipcMain.handle('db:get-versions', async () => {
        return await dbManager.getVersions();
    });

    ipcMain.handle('db:get-books', async (event, version) => {
        return await dbManager.getBooks(version);
    });

    ipcMain.handle('db:search-verses', async (event, { version, book, chapter, verseStart, verseEnd }) => {
        return await dbManager.searchVerses(version, book, chapter, verseStart, verseEnd);
    });

    // 3. Manejadores para la configuración persistente (settings.json)
    ipcMain.handle('db:get-settings', async () => {
        return dbManager.getSettings();
    });

    ipcMain.handle('db:save-settings', async (event, settings) => {
        return dbManager.saveSettings(settings);
    });
}

module.exports = { setupIpcHandlers };