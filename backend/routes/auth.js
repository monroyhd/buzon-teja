const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { User } = require('../models');
const { sendResetEmail } = require('../utils/helpers');

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        console.log('Solicitud de recuperación de contraseña para:', email);

        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({ message: 'Si el email existe, recibirá instrucciones para recuperar su contraseña' });
        }

        // Generar token de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en la base de datos
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Enviar email
        try {
            await sendResetEmail(user.email, resetToken);
            console.log('Email de recuperación enviado exitosamente');
        } catch (emailError) {
            console.error('Error al enviar email de recuperación:', emailError);
            // Eliminar el token si no se pudo enviar el email
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();
            
            return res.status(500).json({ 
                error: 'Error al enviar el email de recuperación. Por favor, intente más tarde.',
                details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

        res.json({ message: 'Si el email existe, recibirá instrucciones para recuperar su contraseña' });

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;