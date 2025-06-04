// Cargar variables de entorno
require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

// Inicializar base de datos
require('./database/init');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// Configurar CORS basado en el entorno
const corsOptions = {
    origin: function (origin, callback) {
        // En producción, solo permitir el frontend local
        // En desarrollo, permitir localhost y la IP pública
        const allowedOrigins = [
            'http://localhost:3021',
            'http://127.0.0.1:3021',
            'http://165.73.244.122:3021',  // IP pública para desarrollo (frontend)
            'http://165.73.244.122:3020',  // IP pública para API directa
            'http://165.73.244.122',       // IP pública sin puerto específico
            'https://165.73.244.122'       // IP pública con HTTPS
        ];
        
        // En desarrollo, también permitir sin origin (para testing)
        if (process.env.NODE_ENV !== 'production' && !origin) {
            return callback(null, true);
        }
        
        // Permitir orígenes autorizados
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Habilitar CORS
app.use(cors(corsOptions));

// Middleware para logging de peticiones en producción
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        console.log(`📡 ${req.method} ${req.path} - Cliente: ${clientIP}`);
        next();
    });
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

module.exports = app;
