# 📋 Documentación - Buzón Electrónico TEJA

## 🏗️ Arquitectura del Sistema

La aplicación está construida con una arquitectura separada de **Backend** y **Frontend**, donde ambos se comunican a través de una API RESTful.

```
/apps-node/buzon-teja/
├── 📁 backend/              # API RESTful en Node.js + Express
├── 📁 frontend/             # Interfaz web con EJS + Bootstrap
├── 📁 storage/              # Almacenamiento de archivos por usuario
├── 📄 PRD.md               # Documento de especificaciones
├── 📄 .env.example         # Variables de entorno de ejemplo
└── 📄 DOCUMENTACION.md     # Este archivo
```

---

## 🔧 Backend (Puerto 3020)

### 📂 Estructura del Backend

```
backend/
├── app.js                  # Aplicación principal de Express
├── package.json           # Dependencias y scripts
├── bin/www                 # Servidor HTTP
├── database/
│   └── init.js            # Configuración e inicialización de SQLite
├── middleware/
│   └── auth.js            # Autenticación JWT
├── routes/
│   ├── api.js             # Rutas principales del API
│   ├── index.js           # Rutas básicas
│   └── users.js           # Rutas de usuarios (básico)
├── utils/
│   └── helpers.js         # Funciones auxiliares (hash, email, etc.)
├── storage/               # Directorio de archivos subidos
└── public/                # Archivos estáticos (no se usa activamente)
```

### 📄 Archivos Importantes del Backend

#### **`app.js`**
- **Función**: Aplicación principal de Express
- **Responsabilidades**:
  - Configuración de middleware (CORS, parsers, etc.)
  - Configuración de rutas
  - Inicialización de la base de datos
  - Carga de variables de entorno con `dotenv`

#### **`database/init.js`**
- **Función**: Configuración de la base de datos SQLite
- **Responsabilidades**:
  - Crear conexión a SQLite
  - Crear tablas `users` y `files` si no existen
  - Exportar la instancia de base de datos para uso en toda la aplicación

#### **`routes/api.js`**
- **Función**: Rutas principales del API del buzón electrónico
- **Endpoints principales**:
  - `POST /api/upload` - Recibe archivos de aplicaciones externas
  - `POST /api/login` - Autenticación de usuarios
  - `GET /api/files` - Obtiene archivos del usuario autenticado
  - `PUT /api/files/:id/mark-read` - Marca archivos como leídos
  - `GET /api/files/:id/download` - Descarga archivos
  - `POST /api/forgot-password` - Solicitar recuperación de contraseña
  - `POST /api/reset-password` - Restablecer contraseña

#### **`middleware/auth.js`**
- **Función**: Middleware de autenticación JWT
- **Responsabilidades**:
  - Generar tokens JWT para usuarios autenticados
  - Verificar tokens en rutas protegidas
  - Proteger endpoints que requieren autenticación

#### **`utils/helpers.js`**
- **Función**: Funciones auxiliares del sistema
- **Responsabilidades**:
  - Generar hash SHA-256 de emails para organización de archivos
  - Generar contraseñas aleatorias para nuevos usuarios
  - Envío de correos electrónicos (bienvenida y recuperación)
  - Configuración SMTP

### 🗃️ Base de Datos (SQLite)

#### Tabla `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_hash TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_token_expires DATETIME
);
```

#### Tabla `files`
```sql
CREATE TABLE files (
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
);
```

---

## 🎨 Frontend (Puerto 3021)

### 📂 Estructura del Frontend

```
frontend/
├── app.js                  # Aplicación Express para servir vistas
├── package.json           # Dependencias del frontend
├── bin/www                 # Servidor del frontend
├── routes/
│   ├── index.js           # Rutas principales (/, /login, /reset-password)
│   └── users.js           # Rutas de usuarios (básico)
├── views/
│   ├── index.ejs          # Dashboard principal del buzón
│   ├── login.ejs          # Página de inicio de sesión
│   ├── reset-password.ejs # Página de restablecimiento de contraseña
│   └── error.ejs          # Página de errores
└── public/
    ├── javascripts/
    │   └── app.js         # Lógica JavaScript del cliente
    ├── stylesheets/
    │   └── style.css      # Estilos CSS personalizados
    └── images/
        └── logo.png       # Logo de la aplicación
```

### 📄 Archivos Importantes del Frontend

#### **`views/index.ejs`**
- **Función**: Dashboard principal del buzón electrónico
- **Características**:
  - Navegación lateral con secciones: Dashboard, Notificaciones, Archivos Leídos, Perfil
  - Panel de estadísticas (total archivos, notificaciones, leídos, expedientes)
  - Sección de actividades recientes
  - Visualización de notificaciones agrupadas por expediente
  - Visualización de archivos leídos agrupados por expediente
  - Perfil de usuario con opción de cambio de contraseña

#### **`views/login.ejs`**
- **Función**: Página de inicio de sesión
- **Características**:
  - Formulario de login con email y contraseña
  - Modal para recuperación de contraseña
  - Validación del lado cliente
  - Redirección automática si ya está autenticado
  - Diseño responsivo con Bootstrap

#### **`views/reset-password.ejs`**
- **Función**: Página para restablecer contraseña
- **Características**:
  - Formulario para nueva contraseña
  - Validación de confirmación de contraseña
  - Verificación de token de URL
  - Redirección al login después del restablecimiento

#### **`public/javascripts/app.js`**
- **Función**: Lógica JavaScript principal del cliente
- **Responsabilidades**:
  - Autenticación y verificación de tokens
  - Comunicación con API del backend
  - Navegación entre secciones
  - Carga y visualización de archivos
  - Funcionalidad de descarga de archivos
  - Marcar archivos como leídos
  - Gestión de notificaciones/toasts
  - Actualización automática de datos

#### **`public/stylesheets/style.css`**
- **Función**: Estilos personalizados de la aplicación
- **Características**:
  - Diseño responsivo
  - Tema de colores corporativo (azul #1891d1)
  - Estilos para navegación lateral
  - Estilos para cards de archivos
  - Badges de notificaciones
  - Efectos hover y transiciones

---

## 🔄 Flujo de Funcionamiento

### 1. **Recepción de Archivos (API Externa → Backend)**
```
1. Aplicación externa envía POST a /api/upload
2. Backend verifica si usuario existe
3. Si no existe: crea usuario, genera contraseña, envía email
4. Codifica email con SHA-256 para crear directorio
5. Guarda archivos en /storage/<hash_email>/<expediente>/
6. Registra archivos en base de datos como notificaciones
```

### 2. **Acceso del Usuario (Frontend → Backend)**
```
1. Usuario accede a /login
2. Ingresa credenciales
3. Backend valida y genera JWT
4. Frontend guarda token y redirige a dashboard
5. Dashboard carga archivos desde API
6. Muestra notificaciones y archivos leídos
```

### 3. **Gestión de Archivos**
```
1. Usuario ve notificaciones agrupadas por expediente
2. Puede descargar archivos
3. Al marcar como leído: actualiza BD y mueve visualmente
4. Archivos leídos se muestran en sección separada
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js 14+ instalado
- NPM o Yarn

### 1. **Configurar Backend**
```bash
cd backend/
npm install
cp ../.env.example .env
# Editar .env con configuración SMTP real
npm start
```

### 2. **Configurar Frontend**
```bash
cd frontend/
npm install
npm start
```

### 3. **Acceso**
- **Frontend**: http://localhost:3021
- **Backend API**: http://localhost:3020
- **Login inicial**: Crear usuario vía API upload o usar BD

---

## 📡 API Endpoints

### **Públicos**
- `POST /api/upload` - Recibir archivos (para aplicaciones externas)
- `POST /api/login` - Iniciar sesión
- `POST /api/forgot-password` - Solicitar recuperación
- `POST /api/reset-password` - Restablecer contraseña

### **Protegidos (requieren JWT)**
- `GET /api/files` - Obtener archivos del usuario
- `PUT /api/files/:id/mark-read` - Marcar como leído
- `GET /api/files/:id/download` - Descargar archivo

---

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# Puertos
BACKEND_PORT=3020
FRONTEND_PORT=3021

# Seguridad
JWT_SECRET=tu-secreto-muy-seguro

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app

# URLs
FRONTEND_URL=http://localhost:3021
BACKEND_URL=http://localhost:3020
```

---

## 🛡️ Seguridad

### Medidas Implementadas
- **JWT**: Autenticación stateless
- **bcrypt**: Hash de contraseñas
- **CORS**: Configurado para frontend específico
- **Multer**: Validación de tipos de archivo
- **Tokens de recuperación**: Con expiración (1 hora)
- **SHA-256**: Hash de emails para organización segura

### Consideraciones para Producción
- Cambiar JWT_SECRET
- Configurar HTTPS
- Configurar SMTP real
- Limitar tamaño de archivos
- Implementar rate limiting
- Logs de auditoría

---

## 🧪 Testing

### Probar API con cURL
```bash
# Upload de archivo
curl -X POST http://localhost:3020/api/upload \
  -F "files[]=@test.pdf" \
  -F "email=usuario@test.com" \
  -F "expediente=EXP001"

# Login
curl -X POST http://localhost:3020/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"contraseña"}'
```

---

## 🏗️ Desarrollo y Mantenimiento

### Estructura de Desarrollo
- **Backend**: API independiente, fácil de escalar
- **Frontend**: SPA simple, fácil de mantener
- **Base de datos**: SQLite para desarrollo, MySQL/PostgreSQL para producción
- **Archivos**: Sistema de archivos local, migrable a S3/cloud

### Próximas Mejoras
- [ ] Panel de administración
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda de archivos
- [ ] Filtros avanzados
- [ ] Exportación de reportes
- [ ] API rate limiting
- [ ] Logs de auditoría

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar logs del backend y frontend
2. Verificar configuración SMTP
3. Comprobar permisos de directorio storage/
4. Verificar conectividad entre backend y frontend
