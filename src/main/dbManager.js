const { app } = require('electron'); // Importamos app para calcular la portabilidad
const sqlite3 = require('sqlite3').verbose(); // Usamos la de Microsoft precompilada
const path = require('path');
const fs = require('fs');
const url = require('url');

// --- CÁLCULO DE PORTABILIDAD DINÁMICO ---
// Si la aplicación está empaquetada (.isPackaged), la ruta será al lado del archivo .exe (USB)
// Si está en desarrollo, se guardará en la carpeta raíz de tu código
const DB_DIR = app.isPackaged 
    ? path.join(path.dirname(app.getPath('exe')), 'database')
    : path.join(__dirname, '../../database');

const BIBLES_DB_PATH = path.join(DB_DIR, 'bibles.db');
const SONGS_DB_PATH = path.join(DB_DIR, 'songs.db');
const NOTES_DB_PATH = path.join(DB_DIR, 'notes.db');
const SETTINGS_JSON_PATH = path.join(DB_DIR, 'settings.json');

// Carpetas de Medios Portátiles
const MEDIA_DIR = path.join(DB_DIR, 'media');
const IMAGES_DIR = path.join(MEDIA_DIR, 'images');
const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');
const AUDIO_DIR = path.join(MEDIA_DIR, 'audio');

// Carpeta de Fonts Portátiles
const FONTS_DIR = path.join(DB_DIR, 'fonts');

// Asegurar la existencia física de todas las carpetas portátiles
[DB_DIR, MEDIA_DIR, IMAGES_DIR, VIDEOS_DIR, AUDIO_DIR, FONTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

let biblesDb = null;
let songsDb = null;

function initDatabases() {
    // 1. Conexión a la Base de Datos de Biblias
    biblesDb = new sqlite3.Database(BIBLES_DB_PATH, (err) => {
        if (err) {
            console.error('Error al conectar con bibles.db:', err.message);
        } else {
            console.log('Conectado a bibles.db con éxito.');
            biblesDb.run(`CREATE TABLE IF NOT EXISTS bible_verses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT,
                book_name TEXT,
                chapter INTEGER,
                verse_number INTEGER,
                text TEXT
            )`);
        }
    });

    // 2. Conexión a la Base de Datos de Canciones
    songsDb = new sqlite3.Database(SONGS_DB_PATH, (err) => {
        if (err) {
            console.error('Error al conectar con songs.db:', err.message);
        } else {
            console.log('Conectado a songs.db con éxito.');
            songsDb.run(`CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                lyrics TEXT NOT NULL,
                author TEXT,
                category TEXT
            )`);
        }
    });

    // 3. Conexión a la Base de Datos de Notas Rápidas
    notesDb = new sqlite3.Database(NOTES_DB_PATH, (err) => {
        if (err) {
            console.error('Error al conectar con notes.db:', err.message);
        } else {
            console.log('Conectado a notes.db con éxito.');
            // Crear tabla de notas rápidas si no existe
            notesDb.run(`CREATE TABLE IF NOT EXISTS quick_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL
            )`);
            // Crear tabla de notas rápidas si no existe
            notesDb.run(`CREATE TABLE IF NOT EXISTS quick_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL
            )`);

            // --- AGREGAR CREACIÓN DE TABLA DE NOTAS DE SERMÓN ---
            notesDb.run(`CREATE TABLE IF NOT EXISTS sermon_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                author TEXT,
                category TEXT
            )`);
            notesDb.run(`ALTER TABLE sermon_notes ADD COLUMN created_at TEXT`, (err) => {
                // Es seguro ignorar el error si la columna ya existe de fábrica
            });
        }
    });
}

// --- LOGICA DE MEDIOS PORTÁTILES Y DETECCIÓN EN TIEMPO REAL ---
// Escanear físicamente las carpetas de medios y listar los archivos para el catálogo (Columna 1)
function scanMediaFolder() {
    try {
        const images = fs.readdirSync(IMAGES_DIR).map(file => {
            const fullPath = path.join(IMAGES_DIR, file); // Nombre corto y limpio
            return {
                name: file,
                path: fullPath,
                url: url.pathToFileURL(fullPath).href, // URL codificada
                type: 'image'
            };
        });
        
        const videos = fs.readdirSync(VIDEOS_DIR).map(file => {
            const fullPath = path.join(VIDEOS_DIR, file);
            return {
                name: file,
                path: fullPath,
                url: url.pathToFileURL(fullPath).href,
                type: 'video'
            };
        });
        
        const audios = fs.readdirSync(AUDIO_DIR).map(file => {
            const fullPath = path.join(AUDIO_DIR, file);
            return {
                name: file,
                path: fullPath,
                url: url.pathToFileURL(fullPath).href,
                type: 'audio'
            };
        });

        return { success: true, files: [...images, ...videos, ...audios] };
    } catch (err) {
        console.error("Error al escanear carpeta de medios:", err);
        return { success: false, files: [], error: err.message };
    }
}

// Guardar imágenes convertidas a WebP (Recibe Base64 de la UI y lo guarda físicamente)
function saveWebPImage(fileName, base64Data) {
    try {
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');
        const targetPath = path.join(IMAGES_DIR, fileName);
        
        fs.writeFileSync(targetPath, buffer);
        return { success: true, fileName, path: targetPath };
    } catch (err) {
        console.error("Error al escribir imagen WebP:", err);
        return { success: false, error: err.message };
    }
}

// Copiar físicamente videos o audios importados a las carpetas portátiles de la USB
function importMediaFile(sourcePath, type) {
    try {
        const fileName = path.basename(sourcePath);
        const targetFolder = type === 'video' ? VIDEOS_DIR : AUDIO_DIR;
        const targetPath = path.join(targetFolder, fileName);
        
        // Copiado síncrono y directo al directorio de la USB
        fs.copyFileSync(sourcePath, targetPath);
        return { success: true, fileName, path: targetPath };
    } catch (err) {
        console.error("Error al copiar archivo multimedia:", err);
        return { success: false, error: err.message };
    }
}

// --- GESTIÓN DE CONFIGURACIÓN ---
function getSettings() {
    try {
        if (!fs.existsSync(SETTINGS_JSON_PATH)) {
            const defaultSettings = { 
                startTab: 'welcome',
                hideWelcomeIcon: false,
                defaultBibleTheme: 'default',
                defaultSongsTheme: 'default',
                defaultNotesTheme: 'default',
                themes: [{
                    id: 'default',
                    name: 'Tema Predeterminado',
                    fontFamily: 'Segoe UI',
                    fontSize: 5,         // Medido en vh (Porcentaje de alto de pantalla)
                    fontColor: '#ffffff',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                    alignH: 'center',    // left, center, right
                    alignV: 'center',    // top, center, bottom
                    bgType: 'color',     // color, image, video
                    bgPath: '#131316'
                }
                ],
                songsThemes: {}
            };
            fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }
        const data = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { startTab: 'welcome' };
    }
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2));
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// --- BÚSQUEDAS BÍBLICAS ---
function searchVerses(version, book, chapter, verseStart, verseEnd) {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM bible_verses WHERE version = ? AND book_name = ? AND chapter = ?`;
        let params = [version, book, chapter];
        if (verseStart && verseEnd) {
            query += ` AND verse_number BETWEEN ? AND ?`;
            params.push(verseStart, verseEnd);
        } else if (verseStart) {
            query += ` AND verse_number = ?`;
            params.push(verseStart);
        }
        query += ` ORDER BY verse_number ASC`;
        biblesDb.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getVersions() {
    return new Promise((resolve, reject) => {
        biblesDb.all(`SELECT DISTINCT version FROM bible_verses ORDER BY version ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.version));
        });
    });
}

function getBooks(version) {
    return new Promise((resolve, reject) => {
        biblesDb.all(
            `SELECT book_name, MIN(id) AS min_id FROM bible_verses WHERE version = ? GROUP BY book_name ORDER BY min_id ASC`, 
            [version], 
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.book_name));
            }
        );
    });
}

// --- BÚSQUEDAS CANCIONES ---
function searchSongs(query) {
    return new Promise((resolve, reject) => {
        const sqlQuery = `SELECT * FROM songs WHERE title LIKE ? OR lyrics LIKE ? OR author LIKE ? ORDER BY title ASC`;
        const param = `%${query}%`;
        songsDb.all(sqlQuery, [param, param, param], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function saveSong(song) {
    return new Promise((resolve, reject) => {
        if (song.id) {
            const stmt = songsDb.prepare(`UPDATE songs SET title = ?, lyrics = ?, author = ?, category = ? WHERE id = ?`);
            stmt.run(song.title, song.lyrics, song.author, song.category, song.id, (err) => {
                if (err) reject(err);
                else resolve({ success: true, id: song.id });
            });
            stmt.finalize();
        } else {
            const stmt = songsDb.prepare(`INSERT INTO songs (title, lyrics, author, category) VALUES (?, ?, ?, ?)`);
            stmt.run(song.title, song.lyrics, song.author, song.category, function(err) {
                if (err) reject(err);
                else resolve({ success: true, id: this.lastID });
            });
            stmt.finalize();
        }
    });
}

function deleteSong(id) {
    return new Promise((resolve, reject) => {
        const stmt = songsDb.prepare(`DELETE FROM songs WHERE id = ?`);
        stmt.run(id, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
        });
        stmt.finalize();
    });
}

function getBiblesDb() {
    return biblesDb;
}

function getSongsDb() {
    return songsDb;
}

// Eliminar físicamente un archivo de medios de la USB
function deleteMediaFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Borrado físico del archivo
            return { success: true };
        }
        return { success: false, error: "El archivo no existe físicamente." };
    } catch (err) {
        console.error("Error al eliminar archivo multimedia:", err);
        return { success: false, error: err.message };
    }
}

// Escanear físicamente la carpeta de fuentes de la USB y listar archivos .ttf y .otf
function scanFontsFolder() {
    try {
        const files = fs.readdirSync(FONTS_DIR);
        const fontFiles = files
            .filter(file => file.endsWith('.ttf') || file.endsWith('.otf'))
            .map(file => {
                const absolutePath = path.join(FONTS_DIR, file);
                return {
                    // Nombre de la fuente sin extensión para registrarla en la UI
                    name: path.basename(file, path.extname(file)),
                    fileName: file,
                    path: absolutePath,
                    url: url.pathToFileURL(absolutePath).href // URL codificada file:///
                };
            });
        return { success: true, fonts: fontFiles };
    } catch (err) {
        console.error("Error al escanear carpeta de fuentes:", err);
        return { success: false, fonts: [], error: err.message };
    }
}

// --- GESTIÓN DE NOTAS RÁPIDAS (notes.db) ---

// Obtener todas las notas rápidas guardadas en la base de datos
function getQuickNotes() {
    return new Promise((resolve, reject) => {
        notesDb.all(`SELECT * FROM quick_notes ORDER BY title ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Guardar (crear o actualizar) una nota rápida
function saveQuickNote(note) {
    return new Promise((resolve, reject) => {
        if (note.id) {
            // Editar nota existente
            const stmt = notesDb.prepare(`UPDATE quick_notes SET title = ?, content = ? WHERE id = ?`);
            stmt.run(note.title, note.content, note.id, (err) => {
                if (err) reject(err);
                else resolve({ success: true, id: note.id });
            });
            stmt.finalize();
        } else {
            // Crear nota nueva
            const stmt = notesDb.prepare(`INSERT INTO quick_notes (title, content) VALUES (?, ?)`);
            stmt.run(note.title, note.content, function(err) {
                if (err) reject(err);
                else resolve({ success: true, id: this.lastID });
            });
            stmt.finalize();
        }
    });
}

// Eliminar físicamente una nota del catálogo por su ID
function deleteQuickNote(id) {
    return new Promise((resolve, reject) => {
        const stmt = notesDb.prepare(`DELETE FROM quick_notes WHERE id = ?`);
        stmt.run(id, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
        });
        stmt.finalize();
    });
}

function getSermonNotes() {
    return new Promise((resolve, reject) => {
        notesDb.all(`SELECT * FROM sermon_notes ORDER BY title ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function saveSermonNote(note) {
    return new Promise((resolve, reject) => {
        if (note.id) {
            // ACTUALIZACIÓN: Excluimos 'created_at' para que la fecha original nunca se modifique
            const stmt = notesDb.prepare(`UPDATE sermon_notes SET title = ?, content = ?, author = ?, category = ? WHERE id = ?`);
            stmt.run(note.title, note.content, note.author, note.category, note.id, (err) => {
                if (err) reject(err);
                else resolve({ success: true, id: note.id });
            });
            stmt.finalize();
        } else {
            // INSERCIÓN: Aquí sí guardamos el campo 'created_at' de creación
            const stmt = notesDb.prepare(`INSERT INTO sermon_notes (title, content, author, category, created_at) VALUES (?, ?, ?, ?, ?)`);
            stmt.run(note.title, note.content, note.author, note.category, note.created_at, function(err) {
                if (err) reject(err);
                else resolve({ success: true, id: this.lastID });
            });
            stmt.finalize();
        }
    });
}

function deleteSermonNote(id) {
    return new Promise((resolve, reject) => {
        const stmt = notesDb.prepare(`DELETE FROM sermon_notes WHERE id = ?`);
        stmt.run(id, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
        });
        stmt.finalize();
    });
}

module.exports = {
    initDatabases,
    searchVerses,
    getVersions,
    getBooks,
    getSettings,
    saveSettings,
    searchSongs,
    saveSong,
    deleteSong,
    scanMediaFolder,
    saveWebPImage,  
    importMediaFile,
    deleteMediaFile,
    scanFontsFolder,
    getQuickNotes,
    saveQuickNote,
    deleteQuickNote,
    getSermonNotes,
    saveSermonNote,
    deleteSermonNote,
    getBiblesDb,
    getSongsDb
};