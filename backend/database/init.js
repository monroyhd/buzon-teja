const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'buzon.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas
db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email_hash TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reset_token TEXT,
        reset_token_expires DATETIME
    )`);

    // Tabla de archivos
    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        expediente TEXT NOT NULL,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        is_notification BOOLEAN DEFAULT 1,
        fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    console.log('Tablas creadas o verificadas correctamente.');
});

module.exports = db;
