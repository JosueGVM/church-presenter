const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Rutas de las bases de datos en la carpeta /database
const DB_DIR = path.join(__dirname, '../../database');
const BIBLES_DB_PATH = path.join(DB_DIR, 'bibles.db');
const SONGS_DB_PATH = path.join(DB_DIR, 'songs.db');

// Asegurar que la carpeta 'database' exista
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let biblesDb = null;
let songsDb = null;

function initDatabases() {
    // 1. Conexión a la Base de Datos de Biblias
    biblesDb = new sqlite3.Database(BIBLES_DB_PATH, (err) => {
        if (err) {
            console.error('Error al conectar con bibles.db:', err.message);
        } else {
            console.log('Conectado a bibles.db con éxito.');
            // Crear tabla de versículos si no existe
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
            // Crear tabla de canciones si no existe
            songsDb.run(`CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                lyrics TEXT NOT NULL,
                author TEXT,
                category TEXT
            )`);
        }
    });
}

// Funciones de consulta para las Biblias
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

function getBiblesDb() { return biblesDb; }
function getSongsDb() { return songsDb; }

// Obtener todas las versiones de la Biblia disponibles en la BD
function getVersions() {
    return new Promise((resolve, reject) => {
        biblesDb.all(`SELECT DISTINCT version FROM bible_verses ORDER BY version ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.version));
        });
    });
}

// Obtener los libros correspondientes a una versión de manera ultra-simplificada y segura
function getBooks(version) {
    return new Promise((resolve, reject) => {
        console.log(`[SQL Query] Buscando libros para la versión: "${version}"`);

        // Validación de seguridad si la versión llega vacía
        if (!version) {
            console.warn("[SQL Warn] Se intentó buscar libros para una versión vacía o indefinida.");
            return resolve([]);
        }

        biblesDb.all(
            `SELECT DISTINCT book_name FROM bible_verses WHERE version = ?`, 
            [version], 
            (err, rows) => {
                if (err) {
                    console.error('[SQL Error] Error en getBooks:', err);
                    reject(err);
                } else {
                    // Si 'rows' llega indefinido por algún motivo de SQLite, lo forzamos a ser un array vacío []
                    const filasSeguras = rows || [];
                    
                    // Imprimimos en la terminal de VS Code lo que nos devolvió exactamente la BD
                    console.log("[SQL Debug] Filas devueltas crudas por la BD:", rows);
                    console.log(`[SQL Result] Libros devueltos para "${version}": ${filasSeguras.length} registros.`);

                    resolve(filasSeguras.map(row => row.book_name));
                }
            }
        );
    });
}

const SETTINGS_JSON_PATH = path.join(DB_DIR, 'settings.json');

// Leer la configuración persistente
function getSettings() {
    try {
        if (!fs.existsSync(SETTINGS_JSON_PATH)) {
            // Configuración inicial predeterminada
            const defaultSettings = { startTab: 'welcome' };
            fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }
        const data = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error al leer settings.json, usando valores por defecto:", err);
        return { startTab: 'welcome' };
    }
}

// Guardar la configuración persistente
function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2));
        return { success: true };
    } catch (err) {
        console.error("Error al guardar settings.json:", err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    initDatabases,
    searchVerses,
    getVersions,
    getBooks,
    getSettings,
    saveSettings,
    getBiblesDb,
    getSongsDb
};