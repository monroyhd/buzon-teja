const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'database/buzon.db');

// Función para generar hash del email (igual que en helpers.js)
function generateEmailHash(email) {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

async function createTestUser() {
    const email = 'test@test.com';
    const password = '123456';
    const emailHash = generateEmailHash(email);
    
    try {
        // Crear hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Insertar usuario en la base de datos
        db.run(
            'INSERT INTO users (email, password_hash, email_hash) VALUES (?, ?, ?)',
            [email, passwordHash, emailHash],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        console.log('❌ El usuario ya existe en la base de datos');
                    } else {
                        console.error('Error al crear usuario:', err.message);
                    }
                } else {
                    console.log('✅ Usuario de prueba creado exitosamente');
                    console.log('📧 Email:', email);
                    console.log('🔐 Contraseña:', password);
                    console.log('🆔 ID:', this.lastID);
                }
                
                // Verificar que el usuario fue creado
                db.get('SELECT id, email, created_at FROM users WHERE email = ?', [email], (err, user) => {
                    if (err) {
                        console.error('Error al verificar usuario:', err.message);
                    } else if (user) {
                        console.log('\n=== VERIFICACIÓN ===');
                        console.log('ID:', user.id);
                        console.log('Email:', user.email);
                        console.log('Creado:', user.created_at);
                    }
                    
                    db.close();
                });
            }
        );
        
    } catch (error) {
        console.error('Error al generar hash de contraseña:', error);
        db.close();
    }
}

// Ejecutar la función
createTestUser();
