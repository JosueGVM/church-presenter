const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Proyección
    proyectarTexto: (texto) => ipcRenderer.send('proyectar-contenido', { texto }),
    limpiarPantalla: () => ipcRenderer.send('limpiar-proyeccion'),

    // Consultas de base de datos
    getVersions: () => ipcRenderer.invoke('db:get-versions'),
    getBooks: (version) => ipcRenderer.invoke('db:get-books', version),
    searchVerses: (params) => ipcRenderer.invoke('db:search-verses', params),

    // Configuraciones de usuario (settings.json)
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings)
});