const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/buzon.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Consultar usuarios
db.all("SELECT id, email, created_at FROM users", [], (err, rows) => {
    if (err) {
        console.error('Error al consultar usuarios:', err.message);
    } else {
        console.log('\n=== USUARIOS EXISTENTES ===');
        if (rows.length === 0) {
            console.log('No hay usuarios en la base de datos.');
        } else {
            rows.forEach((row) => {
                console.log(`ID: ${row.id}, Email: ${row.email}, Creado: ${row.created_at}`);
            });
        }
    }
    
    // Consultar archivos
    db.all("SELECT COUNT(*) as total FROM files", [], (err, rows) => {
        if (err) {
            console.error('Error al consultar archivos:', err.message);
        } else {
            console.log(`\n=== ARCHIVOS EN SISTEMA ===`);
            console.log(`Total de archivos: ${rows[0].total}`);
        }
        
        db.close();
    });
});
