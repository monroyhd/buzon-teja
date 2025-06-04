// Cargar variables de entorno desde el directorio padre
require('dotenv').config({ path: '../.env' });

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Middleware de proxy para peticiones API (DEBE IR ANTES DE TODO)
const { createProxyMiddleware } = require('http-proxy-middleware');

// Determinar la URL del backend según el entorno
const backendUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3020')
    : 'http://127.0.0.1:3020';

// Configurar proxy para /api preservando la ruta completa
app.use('/api', createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    // Importante: Preservar el prefijo /api que Express remueve automáticamente
    pathRewrite: {
        '^/': '/api/'  // Reescribe '/' como '/api/' para restaurar el prefijo
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            const fullUrl = `${backendUrl}${proxyReq.path}`;
            console.log(`🔄 PROXY INTERCEPTED: ${req.method} ${req.originalUrl} -> ${fullUrl}`);
            console.log(`🔄 Target Path: ${proxyReq.path}`);
            console.log(`🔄 Headers: Authorization: ${req.headers.authorization || 'no definido'}`);
        },
        proxyRes: (proxyRes, req, res) => {
            console.log(`✅ Proxy Response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        },
        error: (err, req, res) => {
            console.error('🚨 Proxy Error:', err.message);
            console.error('🚨 Proxy Error Stack:', err.stack);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error de comunicación interna',
                    message: 'No se pudo conectar con el backend'
                });
            }
        }
    }
}));

console.log(`🔗 Proxy configurado: /api -> ${backendUrl} (${process.env.NODE_ENV || 'development'})`);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

// Middleware de debugging DESPUÉS del proxy
app.use((req, res, next) => {
    console.log(`🌐 INCOMING REQUEST: ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`);
    console.log(`🌐 User-Agent: ${req.headers['user-agent']}`);
    console.log(`🌐 Content-Type: ${req.headers['content-type'] || 'no definido'}`);
    next();
});

// DESPUÉS del proxy, configurar el parsing del body para las rutas del frontend
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas del frontend
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
