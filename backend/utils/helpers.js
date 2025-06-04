const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Cargar variables de entorno si no están cargadas
if (!process.env.SMTP_HOST) {
    require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
}

// Generar hash del email
function generateEmailHash(email) {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

// Generar contraseña aleatoria
function generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Configuración del transportador de correo
let transporter;

// Función para crear el transportador
function createTransporter() {
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    };

    console.log('Configuración SMTP:', {
        host: config.host,
        port: config.port,
        user: config.auth.user,
        passExists: !!config.auth.pass
    });

    return nodemailer.createTransport(config);
}

try {
    transporter = createTransporter();

    // Verificar configuración del transportador
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Error en la configuración del transportador de correo:', error);
        } else {
            console.log('Servidor de correo listo para enviar mensajes');
        }
    });
} catch (error) {
    console.error('Error al crear el transportador:', error);
}

// Enviar correo de bienvenida
async function sendWelcomeEmail(email, password) {
    try {
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3021';
        
        const mailOptions = {
            from: `"Buzón TEJA" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Acceso a su Buzón Electrónico TEJA',
            html: `
                <h2>Bienvenido al Buzón Electrónico TEJA</h2>
                <p>Hola,</p>
                <p>Ha recibido archivos en su buzón electrónico TEJA. Su cuenta ha sido creada automáticamente.</p>
                <p><strong>Datos de acceso:</strong></p>
                <ul>
                    <li><strong>Usuario:</strong> ${email}</li>
                    <li><strong>Contraseña:</strong> ${password}</li>
                </ul>
                <p>Puede acceder a su buzón en: <a href="${frontendUrl}">${frontendUrl}</a></p>
                <p>Se recomienda cambiar su contraseña después del primer acceso.</p>
                <p>Saludos,<br>Equipo TEJA</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo de bienvenida enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar correo de bienvenida:', error);
        throw error;
    }
}

// Enviar correo de recuperación de contraseña
async function sendResetEmail(email, resetToken) {
    try {
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3021';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: `"Buzón TEJA" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Recuperación de contraseña - Buzón TEJA',
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Hola,</p>
                <p>Ha solicitado restablecer su contraseña para el Buzón Electrónico TEJA.</p>
                <p>Haga clic en el siguiente enlace para restablecer su contraseña:</p>
                <p><a href="${resetUrl}">Restablecer contraseña</a></p>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitó este cambio, ignore este correo.</p>
                <p>Saludos,<br>Equipo TEJA</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo de recuperación enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        throw error;
    }
}

module.exports = {
    generateEmailHash,
    generateRandomPassword,
    sendWelcomeEmail,
    sendResetEmail
};
