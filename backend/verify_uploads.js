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

console.log('🔍 VERIFICACIÓN DE ARCHIVOS SUBIDOS');
console.log('===================================');

// Consultar usuarios
db.all("SELECT id, email, created_at FROM users ORDER BY id", [], (err, users) => {
    if (err) {
        console.error('Error al consultar usuarios:', err.message);
    } else {
        console.log('\n👥 USUARIOS EN EL SISTEMA:');
        console.log('---------------------------');
        if (users.length === 0) {
            console.log('No hay usuarios en la base de datos.');
        } else {
            users.forEach((user) => {
                console.log(`🆔 ${user.id} | 📧 ${user.email} | 📅 ${user.created_at}`);
            });
        }
    }
    
    // Consultar archivos agrupados por usuario y expediente
    db.all(`
        SELECT 
            u.email,
            f.expediente,
            f.filename,
            f.is_read,
            f.is_notification,
            f.fecha_subida
        FROM files f
        JOIN users u ON f.user_id = u.id
        ORDER BY u.email, f.expediente, f.fecha_subida DESC
    `, [], (err, files) => {
        if (err) {
            console.error('Error al consultar archivos:', err.message);
        } else {
            console.log(`\n📁 ARCHIVOS EN EL SISTEMA (${files.length} total):`);
            console.log('----------------------------------------------');
            
            if (files.length === 0) {
                console.log('No hay archivos en el sistema.');
            } else {
                let currentUser = '';
                let currentExpediente = '';
                
                files.forEach((file) => {
                    if (file.email !== currentUser) {
                        currentUser = file.email;
                        console.log(`\n👤 Usuario: ${file.email}`);
                    }
                    
                    if (file.expediente !== currentExpediente) {
                        currentExpediente = file.expediente;
                        console.log(`  📂 Expediente: ${file.expediente}`);
                    }
                    
                    const status = file.is_read ? '✅ Leído' : '🔔 Nuevo';
                    console.log(`    📄 ${file.filename} | ${status} | ${file.fecha_subida}`);
                });
            }
        }
        
        // Estadísticas generales
        db.get(`
            SELECT 
                COUNT(*) as total_archivos,
                COUNT(CASE WHEN is_read = 0 THEN 1 END) as no_leidos,
                COUNT(CASE WHEN is_read = 1 THEN 1 END) as leidos,
                COUNT(DISTINCT expediente) as expedientes_unicos,
                COUNT(DISTINCT user_id) as usuarios_con_archivos
            FROM files
        `, [], (err, stats) => {
            if (err) {
                console.error('Error al obtener estadísticas:', err.message);
            } else {
                console.log('\n📊 ESTADÍSTICAS:');
                console.log('================');
                console.log(`📄 Total archivos: ${stats.total_archivos}`);
                console.log(`🔔 No leídos: ${stats.no_leidos}`);
                console.log(`✅ Leídos: ${stats.leidos}`);
                console.log(`📂 Expedientes únicos: ${stats.expedientes_unicos}`);
                console.log(`👥 Usuarios con archivos: ${stats.usuarios_con_archivos}`);
            }
            
            db.close();
        });
    });
});
