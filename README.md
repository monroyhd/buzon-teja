# 📬 Buzón Electrónico TEJA

Sistema de buzón electrónico para recibir, gestionar y consultar documentos enviados por aplicaciones externas.

## 🚀 Inicio Rápido

### 1. Clonar y configurar
```bash
git clone <repo-url>
cd buzon-teja
cp .env.example backend/.env
# Editar backend/.env con tu configuración SMTP
```

### 2. Instalar dependencias
```bash
# Backend
cd backend && npm install && cd ..

# Frontend  
cd frontend && npm install && cd ..
```

### 3. Ejecutar aplicación
```bash
# Terminal 1 - Backend (API)
cd backend && npm start

# Terminal 2 - Frontend (Interfaz Web)
cd frontend && npm start
```

### 4. Acceder
- **Aplicación Web**: http://localhost:3021
- **API**: http://localhost:3020

## 🧪 Probar API
```bash
./test_api.sh
```

## 📋 Características

- ✅ **Recepción de archivos** vía API desde aplicaciones externas
- ✅ **Autenticación automática** - crea usuarios y envía credenciales por email
- ✅ **Gestión de notificaciones** - archivos no leídos
- ✅ **Organización por expedientes** - agrupación automática
- ✅ **Descarga de archivos** - visualización y descarga segura
- ✅ **Recuperación de contraseña** - vía email con token seguro
- ✅ **Dashboard responsivo** - interfaz moderna con Bootstrap
- ✅ **Seguridad JWT** - autenticación stateless

## 🏗️ Arquitectura

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Frontend      │ ←──────────────→ │    Backend      │
│   (Port 3021)   │                 │   (Port 3020)   │
│                 │                 │                 │
│ • Login         │                 │ • API Routes    │
│ • Dashboard     │                 │ • Auth JWT      │
│ • File View     │                 │ • File Upload   │
│ • Notifications │                 │ • Email SMTP    │
└─────────────────┘                 └─────────────────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │   SQLite DB   │
                                    │  + File Store │
                                    └───────────────┘
```

## 📡 API Endpoints

### Públicos
- `POST /api/upload` - Subir archivos (para apps externas)
- `POST /api/login` - Iniciar sesión
- `POST /api/forgot-password` - Recuperar contraseña

### Protegidos (JWT)
- `GET /api/files` - Obtener archivos del usuario
- `PUT /api/files/:id/mark-read` - Marcar como leído
- `GET /api/files/:id/download` - Descargar archivo

## 🔧 Configuración

### Variables de Entorno (backend/.env)
```env
# Servidor
BACKEND_PORT=3020
FRONTEND_PORT=3021

# JWT
JWT_SECRET=tu-secreto-super-seguro

# SMTP (Gmail ejemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app

# URLs
FRONTEND_URL=http://localhost:3021
```

## 📁 Estructura de Archivos

```
storage/
└── <hash_sha256_email>/
    └── EXPEDIENTE-001/
        ├── documento1.pdf
        └── documento2.docx
```

## 🛡️ Seguridad

- **JWT Tokens** para autenticación
- **bcrypt** para hash de contraseñas  
- **SHA-256** para hash de emails
- **Multer** para validación de archivos
- **CORS** configurado
- **Tokens de recuperación** con expiración

## 📖 Documentación

Ver [DOCUMENTACION.md](./DOCUMENTACION.md) para documentación técnica completa.

## 🧪 Testing

```bash
# Probar API completa
./test_api.sh

# Ejemplo de upload manual
curl -X POST http://localhost:3020/api/upload \
  -F "files[]=@mi_archivo.pdf" \
  -F "email=usuario@test.com" \
  -F "expediente=EXP001"
```

## 🔄 Flujo de Uso

1. **App externa** envía archivos vía `POST /api/upload`
2. **Sistema** crea usuario si no existe y envía credenciales por email
3. **Usuario** accede a http://localhost:3021 con sus credenciales
4. **Usuario** ve notificaciones de archivos no leídos agrupados por expediente
5. **Usuario** descarga/lee archivos, que se marcan automáticamente como leídos

## 🚀 Producción

### Consideraciones
- Cambiar `JWT_SECRET` 
- Configurar HTTPS
- Usar MySQL/PostgreSQL en lugar de SQLite
- Configurar SMTP real
- Implementar logs y monitoreo
- Backup de base de datos y archivos

### Docker (Opcional)
```dockerfile
# Ejemplo de Dockerfile para backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3020
CMD ["npm", "start"]
```

## 📞 Soporte

- 📧 Email: soporte@teja.com
- 📖 Docs: [DOCUMENTACION.md](./DOCUMENTACION.md)
- 🧪 Tests: `./test_api.sh`

---


