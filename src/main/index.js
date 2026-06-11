const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers');
const { initDatabases } = require('./dbManager');

let controlWindow = null;
let projectionWindow = null;

function createControlWindow() {
    controlWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        title: "Church Display - Control",
        webPreferences: {
            preload: path.join(__dirname, '../preload/controlPreload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    controlWindow.loadFile(path.join(__dirname, '../renderer/control/index.html'));

    // Si el operador cierra el panel de control, cerramos toda la aplicación
    controlWindow.on('closed', () => {
        controlWindow = null;
        if (projectionWindow) projectionWindow.close();
    });
    controlWindow.webContents.openDevTools();
}

function createProjectionWindow() {
    const displays = screen.getAllDisplays();
    
    // Intentamos buscar una pantalla que no sea la principal (coordenadas x o y distintas de 0)
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    if (externalDisplay) {
        // Pantalla secundaria detectada: abrimos a pantalla completa sin bordes
        projectionWindow = new BrowserWindow({
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            width: externalDisplay.bounds.width,
            height: externalDisplay.bounds.height,
            fullscreen: true,
            frame: false,
            autoHideMenuBar: true,
            title: "Church Display - Proyección",
            webPreferences: {
                preload: path.join(__dirname, '../preload/projectionPreload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });
    } else {
        // Un solo monitor: abrimos en modo ventana para poder hacer pruebas de desarrollo
        projectionWindow = new BrowserWindow({
            width: 800,
            height: 450,
            title: "Church Display - Proyección (Vista de Prueba)",
            webPreferences: {
                preload: path.join(__dirname, '../preload/projectionPreload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });
    }

    projectionWindow.esProyeccion = true;

    projectionWindow.loadFile(path.join(__dirname, '../renderer/projection/index.html'));

    projectionWindow.on('closed', () => {
        projectionWindow = null;
    });
}

// Iniciar ventanas cuando Electron esté listo
app.whenReady().then(() => {
    initDatabases();
    setupIpcHandlers(); 
    createControlWindow();
    createProjectionWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createControlWindow();
            createProjectionWindow();
        }
    });
});

// Cerrar cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});