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

    // 4. Manejadores para el catálogo de canciones (songs.db)
    ipcMain.handle('db:search-songs', async (event, query) => {
        return dbManager.searchSongs(query);
    });

    ipcMain.handle('db:save-song', async (event, song) => {
        return dbManager.saveSong(song);
    });

    ipcMain.handle('db:delete-song', async (event, id) => {
        return dbManager.deleteSong(id);
    });

    // 5. Manejadores para el Modo Multimedia portátiles (Copiado de archivos y escáner)
    ipcMain.handle('db:scan-media', async () => {
        return dbManager.scanMediaFolder();
    });

    ipcMain.handle('db:save-webp', async (event, { fileName, base64Data }) => {
        return dbManager.saveWebPImage(fileName, base64Data);
    });

    ipcMain.handle('db:import-media', async (event, { sourcePath, type }) => {
        return dbManager.importMediaFile(sourcePath, type);
    });

    ipcMain.handle('db:delete-media', async (event, filePath) => {
        return dbManager.deleteMediaFile(filePath);
    });
    
    // 6. Obtener las pantallas conectadas físicamente al sistema
    ipcMain.handle('screen:get-displays', async () => {
        const { screen } = require('electron');
        return screen.getAllDisplays().map((display, index) => {
            return {
                id: display.id,
                indice: index + 1,
                esPrincipal: display.bounds.x === 0 && display.bounds.y === 0,
                width: display.bounds.width,
                height: display.bounds.height
            };
        });
    });

    // 7. Obtener tipografías portátiles del sistema (.ttf/.otf)
    ipcMain.handle('screen:get-fonts', async () => {
        return dbManager.scanFontsFolder();
    });

    // 8. Manejadores para el catálogo de notas rápidas (notes.db)
    ipcMain.handle('db:get-quick-notes', async () => {
        return dbManager.getQuickNotes();
    });

    ipcMain.handle('db:save-quick-note', async (event, note) => {
        return dbManager.saveQuickNote(note);
    });

    ipcMain.handle('db:delete-quick-note', async (event, id) => {
        return dbManager.deleteQuickNote(id);
    });

    // 9. Manejadores para el catálogo de Notas de Sermón (notes.db)
    ipcMain.handle('db:get-sermon-notes', async () => {
        return dbManager.getSermonNotes();
    });

    ipcMain.handle('db:save-sermon-note', async (event, note) => {
        return dbManager.saveSermonNote(note);
    });

    ipcMain.handle('db:delete-sermon-note', async (event, id) => {
        return dbManager.deleteSermonNote(id);
    });
}


module.exports = { setupIpcHandlers };