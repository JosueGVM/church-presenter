const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    alActualizarProyeccion: (callback) => ipcRenderer.on('actualizar-proyeccion', (event, datos) => callback(datos)),
    alLimpiarPantalla: (callback) => ipcRenderer.on('limpiar-pantalla', () => callback())
});