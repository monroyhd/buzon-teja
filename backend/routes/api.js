const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

const db = require('../database/init');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { generateEmailHash, generateRandomPassword, sendWelcomeEmail, sendResetEmail } = require('../utils/helpers');

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Crear directorio temporal, moveremos después cuando tengamos email y expediente
        const tempPath = path.join(__dirname, '../storage/temp');
        
        // Crear directorio temporal si no existe
        fs.mkdirSync(tempPath, { recursive: true });
        cb(null, tempPath);
    },
    filename: function (req, file, cb) {
        // Generar nombre único temporal para evitar conflictos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Permitir solo ciertos tipos de archivo
        const allowedTypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png|txt|text/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetypeAllowed = file.mimetype.includes('text') || 
                               file.mimetype.includes('pdf') || 
                               file.mimetype.includes('image') || 
                               file.mimetype.includes('application/vnd') ||
                               file.mimetype.includes('application/msword') ||
                               allowedTypes.test(file.mimetype);
        
        if (mimetypeAllowed && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite
    }
});

// Endpoint para recibir archivos (API principal)
router.post('/upload', upload.array('files[]'), async (req, res) => {
    try {
        const { email, expediente } = req.body;
        
        if (!email || !expediente || !req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, expediente y al menos un archivo son requeridos'
            });
        }

        const emailHash = generateEmailHash(email);
        let userId;
        let isNewUser = false;

        // Verificar si el usuario existe
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (user) {
                // Usuario existente
                userId = user.id;
                saveFiles();
            } else {
                // Crear nuevo usuario
                isNewUser = true;
                const randomPassword = generateRandomPassword();
                const passwordHash = await bcrypt.hash(randomPassword, 10);

                db.run(
                    'INSERT INTO users (email, password_hash, email_hash) VALUES (?, ?, ?)',
                    [email, passwordHash, emailHash],
                    function(err) {
                        if (err) {
                            console.error('Error al crear usuario:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Error al crear usuario'
                            });
                        }

                        userId = this.lastID;
                        
                        // Enviar correo de bienvenida
                        sendWelcomeEmail(email, randomPassword)
                            .then(() => console.log('Correo de bienvenida enviado'))
                            .catch(err => console.error('Error al enviar correo:', err));
                        
                        saveFiles();
                    }
                );
            }
        });

        function saveFiles() {
            // Crear directorio final y mover archivos
            const emailHash = generateEmailHash(email);
            const finalPath = path.join(__dirname, '../storage', emailHash, expediente);
            fs.mkdirSync(finalPath, { recursive: true });

            // Guardar información de archivos en la base de datos
            const stmt = db.prepare('INSERT INTO files (user_id, expediente, filename, path, is_read, is_notification) VALUES (?, ?, ?, ?, 0, 1)');
            
            req.files.forEach(file => {
                // Mover archivo de temporal a directorio final
                const tempFilePath = file.path;
                const finalFileName = file.originalname;
                const finalFilePath = path.join(finalPath, finalFileName);
                
                try {
                    // Mover archivo
                    fs.renameSync(tempFilePath, finalFilePath);
                    
                    // Guardar en BD con la ruta relativa final
                    const relativePath = path.relative(path.join(__dirname, '../storage'), finalFilePath);
                    stmt.run(userId, expediente, finalFileName, relativePath);
                } catch (moveError) {
                    console.error('Error al mover archivo:', moveError);
                    // Si falla, intentar limpiar archivo temporal
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (cleanupError) {
                        console.error('Error al limpiar archivo temporal:', cleanupError);
                    }
                }
            });
            
            stmt.finalize((err) => {
                if (err) {
                    console.error('Error al guardar archivos:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error al guardar archivos'
                    });
                }

                res.json({
                    status: 'success',
                    message: 'Archivos recibidos correctamente',
                    filesCount: req.files.length,
                    newUser: isNewUser
                });
            });
        }

    } catch (error) {
        console.error('Error en upload:', error);
        
        // Limpiar archivos temporales si hay error
        if (req.files) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Error al limpiar archivo temporal:', cleanupError);
                }
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email y contraseña son requeridos'
            });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Credenciales inválidas'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Credenciales inválidas'
                });
            }

            const token = generateToken(user);

            res.json({
                status: 'success',
                message: 'Login exitoso',
                token: token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
});

// Obtener archivos del usuario (notificaciones y leídos)
router.get('/files', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(
        'SELECT * FROM files WHERE user_id = ? ORDER BY expediente, fecha_subida DESC',
        [userId],
        (err, files) => {
            if (err) {
                console.error('Error al obtener archivos:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error al obtener archivos'
                });
            }

            // Agrupar archivos por expediente y estado
            const notifications = files.filter(file => file.is_notification && !file.is_read);
            const readFiles = files.filter(file => file.is_read);

            // Agrupar por expediente
            const groupByExpediente = (filesList) => {
                const grouped = {};
                filesList.forEach(file => {
                    if (!grouped[file.expediente]) {
                        grouped[file.expediente] = [];
                    }
                    grouped[file.expediente].push(file);
                });
                return grouped;
            };

            res.json({
                status: 'success',
                data: {
                    notifications: groupByExpediente(notifications),
                    readFiles: groupByExpediente(readFiles),
                    totalNotifications: notifications.length,
                    totalReadFiles: readFiles.length
                }
            });
        }
    );
});

// Marcar archivo como leído
router.put('/files/:id/mark-read', authenticateToken, (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    db.run(
        'UPDATE files SET is_read = 1, fecha_lectura = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [fileId, userId],
        function(err) {
            if (err) {
                console.error('Error al marcar archivo como leído:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error al actualizar archivo'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado'
                });
            }

            res.json({
                status: 'success',
                message: 'Archivo marcado como leído'
            });
        }
    );
});

// Descargar archivo
router.get('/files/:id/download', authenticateToken, (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId],
        (err, file) => {
            if (err) {
                console.error('Error al obtener archivo:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (!file) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado'
                });
            }

            const filePath = path.join(__dirname, '../storage', file.path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado en el sistema'
                });
            }

            // Marcar como leído automáticamente al descargar
            if (!file.is_read) {
                db.run(
                    'UPDATE files SET is_read = 1, fecha_lectura = ? WHERE id = ?',
                    [new Date().toISOString(), fileId],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Error al marcar archivo como leído:', updateErr);
                        }
                    }
                );
            }

            res.download(filePath, file.filename);
        }
    );
});

// Visualizar archivo (mostrar en navegador)
router.get('/files/:id/view', authenticateToken, (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ?', 
        [fileId, userId], 
        async (err, file) => {
            if (err) {
                console.error('Error al obtener archivo:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (!file) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado'
                });
            }

            const filePath = path.join(__dirname, '../storage', file.path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado en el sistema'
                });
            }

            // Marcar como leído automáticamente
            if (!file.is_read) {
                db.run(
                    'UPDATE files SET is_read = 1, fecha_lectura = ? WHERE id = ?',
                    [new Date().toISOString(), fileId],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Error al marcar archivo como leído:', updateErr);
                        }
                    }
                );
            }

            // Determinar el tipo MIME basado en la extensión
            const ext = path.extname(file.filename).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                case '.txt':
                    contentType = 'text/plain';
                    break;
                case '.html':
                case '.htm':
                    contentType = 'text/html';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.doc':
                case '.docx':
                    contentType = 'application/msword';
                    break;
                case '.xls':
                case '.xlsx':
                    contentType = 'application/vnd.ms-excel';
                    break;
                default:
                    contentType = 'application/octet-stream';
            }

            // Configurar headers para mostrar en el navegador
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
            
            // Enviar el archivo
            res.sendFile(filePath);
        }
    );
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            status: 'error',
            message: 'Email es requerido'
        });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    db.run(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        [resetToken, resetTokenExpires.toISOString(), email],
        function(err) {
            if (err) {
                console.error('Error al generar token de reset:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Email no encontrado'
                });
            }

            // Enviar correo de recuperación
            sendResetEmail(email, resetToken)
                .then(() => {
                    res.json({
                        status: 'success',
                        message: 'Correo de recuperación enviado'
                    });
                })
                .catch(err => {
                    console.error('Error al enviar correo de reset:', err);
                    res.status(500).json({
                        status: 'error',
                        message: 'Error al enviar correo de recuperación'
                    });
                });
        }
    );
});

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Token y nueva contraseña son requeridos'
        });
    }

    db.get(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?',
        [token, new Date().toISOString()],
        async (err, user) => {
            if (err) {
                console.error('Error al verificar token:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (!user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Token inválido o expirado'
                });
            }

            const passwordHash = await bcrypt.hash(newPassword, 10);

            db.run(
                'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [passwordHash, user.id],
                function(err) {
                    if (err) {
                        console.error('Error al actualizar contraseña:', err);
                        return res.status(500).json({
                            status: 'error',
                            message: 'Error al actualizar contraseña'
                        });
                    }

                    res.json({
                        status: 'success',
                        message: 'Contraseña actualizada correctamente'
                    });
                }
            );
        }
    );
});

// Eliminar archivos leídos del usuario
router.delete('/files/read', authenticateToken, (req, res) => {
    const userId = req.user.id;

    // Primero obtener la lista de archivos leídos para eliminar físicamente
    db.all(
        'SELECT * FROM files WHERE user_id = ? AND is_read = 1',
        [userId],
        (err, files) => {
            if (err) {
                console.error('Error al obtener archivos leídos:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error al obtener archivos leídos'
                });
            }

            if (files.length === 0) {
                return res.json({
                    status: 'success',
                    message: 'No hay archivos leídos para eliminar',
                    deletedCount: 0
                });
            }

            // Eliminar archivos físicos del sistema de archivos
            const fs = require('fs');
            const path = require('path');
            let deletedPhysicalFiles = 0;
            let failedDeletions = [];

            files.forEach(file => {
                const filePath = path.join(__dirname, '../storage', file.path);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        deletedPhysicalFiles++;
                    }
                } catch (deleteErr) {
                    console.error(`Error al eliminar archivo físico ${file.filename}:`, deleteErr);
                    failedDeletions.push(file.filename);
                }
            });

            // Eliminar registros de la base de datos
            db.run(
                'DELETE FROM files WHERE user_id = ? AND is_read = 1',
                [userId],
                function(err) {
                    if (err) {
                        console.error('Error al eliminar archivos de la BD:', err);
                        return res.status(500).json({
                            status: 'error',
                            message: 'Error al eliminar archivos de la base de datos'
                        });
                    }

                    res.json({
                        status: 'success',
                        message: `Se eliminaron ${this.changes} archivo(s) leído(s)`,
                        deletedCount: this.changes,
                        deletedPhysicalFiles: deletedPhysicalFiles,
                        failedDeletions: failedDeletions
                    });
                }
            );
        }
    );
});

// Eliminar un archivo específico leído
router.delete('/files/:id', authenticateToken, (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    // Primero verificar que el archivo existe y está leído
    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ? AND is_read = 1',
        [fileId, userId],
        (err, file) => {
            if (err) {
                console.error('Error al obtener archivo:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error interno del servidor'
                });
            }

            if (!file) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Archivo no encontrado o no está marcado como leído'
                });
            }

            // Eliminar archivo físico
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../storage', file.path);
            
            let physicalDeleted = false;
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    physicalDeleted = true;
                }
            } catch (deleteErr) {
                console.error(`Error al eliminar archivo físico ${file.filename}:`, deleteErr);
            }

            // Eliminar registro de la base de datos
            db.run(
                'DELETE FROM files WHERE id = ? AND user_id = ?',
                [fileId, userId],
                function(err) {
                    if (err) {
                        console.error('Error al eliminar archivo de la BD:', err);
                        return res.status(500).json({
                            status: 'error',
                            message: 'Error al eliminar archivo de la base de datos'
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            status: 'error',
                            message: 'Archivo no encontrado'
                        });
                    }

                    res.json({
                        status: 'success',
                        message: `Archivo "${file.filename}" eliminado correctamente`,
                        physicalDeleted: physicalDeleted
                    });
                }
            );
        }
    );
});

module.exports = router;
