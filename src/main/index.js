const { app, BrowserWindow, screen, ipcMain, protocol, net } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers');
const { initDatabases } = require('./dbManager');

// Registrar el esquema como privilegiado ANTES de que la app esté lista.
// Esto permite que local-media:// sirva video/audio sin restricciones de CORS.
protocol.registerSchemesAsPrivileged([
    { scheme: 'local-media', privileges: { secure: true, supportFetchAPI: true, stream: true } }
]);

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let controlWindow = null;
let projectionWindow = null;
let splashWindow = null;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 420,
        height: 260,
        frame: false,
        transparent: false,
        backgroundColor: '#0d0d10',
        resizable: false,
        center: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: { contextIsolation: true }
    });
    splashWindow.loadFile(path.join(__dirname, '../renderer/splash/index.html'));
    splashWindow.once('ready-to-show', () => splashWindow.show());
}

function createControlWindow() {
    controlWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        frame: false,          // Ocultamos la barra nativa
        titleBarStyle: 'hidden',
        title: 'Church Display',
        show: false,           // No mostrar hasta que la splash termine
        webPreferences: {
            preload: path.join(__dirname, '../preload/controlPreload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    controlWindow.loadFile(path.join(__dirname, '../renderer/control/index.html'));

    controlWindow.on('closed', () => {
        controlWindow = null;
        if (projectionWindow) projectionWindow.close();
    });
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
                nodeIntegration: false,
                backgroundThrottling: false
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
    // Servir archivos multimedia locales a través del protocolo seguro local-media://
    protocol.handle('local-media', (request) => {
        // URL: local-media://host/C:/ruta/archivo.jpg  (Windows)
        //      local-media://host/ruta/archivo.jpg     (Mac/Linux)
        const url = new URL(request.url);
        // url.pathname comienza con '/', lo quitamos para reconstruir la ruta real
        const relativePath = url.pathname.replace(/^\//, '');
        // En Windows quedará "C:/ruta/..." → file:///C:/ruta/...
        // En Mac/Linux quedará "ruta/..." → necesitamos el '/' inicial de vuelta
        const isWindows = process.platform === 'win32';
        const filePath = isWindows ? relativePath : `/${relativePath}`;
        return net.fetch(`file://${isWindows ? '/' : ''}${filePath}`);
    });

    initDatabases();
    setupIpcHandlers();

    // 1. Mostrar splash primero
    createSplashWindow();

    // 2. Crear la ventana de control en segundo plano mientras la splash corre
    createControlWindow();

    // 3. Tras 4 segundos, cerrar splash, mostrar control y LUEGO abrir proyección
    setTimeout(() => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        if (controlWindow) {
            controlWindow.show();
            controlWindow.focus();
        }
        // La proyección se abre después para no aparecer detrás del splash
        createProjectionWindow();
    }, 4000);

    // --- MANEJADOR DE APERTURA/CIERRE DE PROYECCIÓN BAJO DEMANDA ---
    ipcMain.handle('projection:toggle', (event, accion) => {
        if (accion === 'open') {
            if (!projectionWindow) {
                createProjectionWindow();
            }
        } else if (accion === 'close') {
            if (projectionWindow) {
                projectionWindow.close();
                projectionWindow = null;
            }
        }
        // Devuelve el estado actual (true = abierto, false = cerrado)
        return { abierta: projectionWindow !== null };
    });

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