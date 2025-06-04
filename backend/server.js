// Cargar variables de entorno al inicio
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
// ...existing code...

// Verificar que las variables de entorno se cargaron
console.log('Variables de entorno cargadas:', {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
    BACKEND_PORT: process.env.BACKEND_PORT,
    NODE_ENV: process.env.NODE_ENV
});

// ...existing code...