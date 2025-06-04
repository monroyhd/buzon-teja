
# 📬 PRD - Buzón Electrónico de Documentos

## 🧠 Objetivo del Proyecto
Desarrollar una aplicación web que actúe como un **buzón electrónico de documentos**, permitiendo que los usuarios reciban, consulten y gestionen archivos enviados por otra aplicación a través de una API. El sistema debe contar con autenticación de usuarios, gestión de notificaciones, control de lectura, monitoreo de acceso y organización por expedientes.

## 🛠 Tecnologías sugeridas
- **Backend:** Node.js + Express.js
- **Frontend:** HTML + CSS + Bootstrap
- **Base de datos:** MySQL o SQLite
- **Almacenamiento de archivos:** Sistema de archivos local
- **Autenticación:** JWT + bcrypt para contraseñas

## 🔄 Flujo General del Sistema
1. Otra aplicación externa realiza una solicitud `POST` a una API de recepción, enviando uno o varios archivos junto con el correo del destinatario y el número de expediente.
2. La API:
   - Verifica si el correo ya está registrado.
   - Si no existe:
     - Crea un nuevo usuario.
     - Genera una contraseña aleatoria.
     - Envía un correo electrónico al nuevo usuario con su contraseña.
   - Codifica el correo electrónico (ej. con SHA-256).
   - Crea (si no existe) un directorio único basado en el hash del correo.
   - Guarda los archivos en una subcarpeta correspondiente al número de expediente.
   - Registra los archivos como “notificaciones” en la base de datos.
3. El usuario inicia sesión en la interfaz web.
4. Se muestran todos los archivos que aún no han sido leídos como **notificaciones**, agrupados por expediente.
5. Al abrir un archivo:
   - El sistema marca el archivo como leído.
   - Registra la fecha y hora de lectura.
   - Lo mueve visualmente a la sección **Leídos**, también agrupado por expediente.

## 📡 API: Recepción de Archivos
### Endpoint: `POST /api/upload`
**Content-Type:** `multipart/form-data`

**Campos esperados:**
- `files[]` → Lista de archivos a subir (PDF, DOCX, XLSX, etc.).
- `email` → Correo electrónico del destinatario.
- `expediente` → Número de expediente.

### Lógica de la API:
1. Verificar si el usuario existe en la base de datos.
2. Si no existe:
   - Crear usuario.
   - Generar contraseña aleatoria.
   - Enviar correo electrónico con credenciales de acceso.
3. Codificar el correo (ej. `sha256(email)`).
4. Guardar los archivos en:  
   `/storage/<hash_correo>/<expediente>/`
5. Registrar los archivos en la base de datos con:
   - `estado: notificación`
   - `is_read: false`
   - `fecha_subida`
   - `expediente`
6. Devolver respuesta de éxito.

### Ejemplo de Respuesta:
```json
{
  "status": "success",
  "message": "Archivos recibidos correctamente"
}
```

## 🧾 Base de Datos (Modelo sugerido)
### Tabla: `users`
| id | email | password_hash | email_hash | created_at |

### Tabla: `files`
| id | user_id | expediente | filename | path | is_read | is_notification | fecha_subida | fecha_lectura |

## 🔐 Funcionalidad de Autenticación
### Requisitos:
- Registro automático al recibir archivos.
- Login por correo y contraseña.
- Generación de contraseña aleatoria para usuarios nuevos.
- Envío de correo automático con credenciales (SMTP).
- Sistema de recuperación de contraseña:
  - Envío de enlace seguro al correo electrónico.
  - Página para establecer nueva contraseña.

## 📁 Estructura del Almacenamiento
```bash
/storage
  └── <hash_correo_usuario>
        └── 2024-EXP001/
              ├── archivo1.pdf
              └── archivo2.docx
        └── 2024-EXP002/
              └── otro_archivo.pdf
```

## 🖥 Interfaz de Usuario
### Inicio de sesión
- Formulario con campos de correo y contraseña.
- Opción de recuperación de contraseña.
- Dashboard limpio y responsivo utilizando Bootstrap, que muestre la ventana de notificaciones y archivos leídos.

### Pantalla principal
- **Sección: Notificaciones**
  - Lista de archivos no leídos.
  - Agrupados por expediente.
  - Al hacer clic en un archivo:
    - Se abre el documento.
    - Se actualiza en la base de datos como leído.
    - Se registra fecha y hora de consulta.
    - Se mueve visualmente a la sección “Leídos”.

- **Sección: Archivos Leídos**
  - Muestra todos los archivos abiertos.
  - También agrupados por expediente.

## ✅ Requisitos Funcionales
- [x] Recepción de múltiples archivos en una sola solicitud.
- [x] Verificación de usuario al recibir archivos.
- [x] Creación automática de usuarios con contraseña enviada por correo.
- [x] Codificación del correo para organizar almacenamiento.
- [x] Visualización de archivos no leídos como notificaciones.
- [x] Registro de lectura con fecha/hora.
- [x] Movimiento automático a la sección de archivos leídos.
- [x] Agrupación de archivos por expediente.
- [x] Interfaz limpia y responsiva (usando Bootstrap).
- [x] Recuperación de contraseña mediante enlace de seguridad.

## 📦 Extras
- Autenticación por token JWT para proteger rutas de API.
- Endpoint adicional para listar archivos por usuario.
- Panel de administrador (para monitorear uso del sistema).
- Pruebas unitarias para backend y API.

## 📧 Ejemplo de correo automático para nuevo usuario
> Asunto: Acceso a su Buzón Electrónico  
> Cuerpo:
```
Hola,

Ha recibido archivos en su buzón electrónico TEJA. Su cuenta ha sido creada automáticamente.

Correo: usuario@ejemplo.com  
Contraseña temporal: d9Kf7wP2

Por favor inicie sesión en la siguiente dirección y cambie su contraseña:

https://mi-buzon.com/login
```

## 🧱 Estructura Separada: Backend y Frontend

### 📂 Organización de Carpetas

```
/buzon_electronico/
├── backend/            # API RESTful en Node.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   ├── config/
│   └── index.js
├── frontend/           # HTML + Bootstrap o framework moderno (React, Vue, etc.)
│   ├── public/
│   ├── css/
│   ├── js/
│   └── index.html
├── storage/            # Directorios de archivos por usuario (correo codificado)
└── PRD_Buzon_Electronico.md
```

---

## 🌐 Comunicación entre Frontend y Backend

- El **frontend** se comunica con el **backend** exclusivamente a través de **API REST**.
- Las solicitudes se hacen vía `fetch()` o `axios` desde el navegador.

---

## 🔐 Configuración CORS

En el backend (`app.js`):

```js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3021', // o el dominio del frontend en producción
  credentials: true
}));
```

> Asegúrate de habilitar los headers necesarios si trabajas con JWT o cookies.

---

## 📡 Rutas sugeridas del Backend (Express.js)

| Método | Ruta                  | Descripción                              |
|--------|-----------------------|------------------------------------------|
| POST   | `/api/upload`         | Recibe archivos, correo y expediente     |
| POST   | `/api/login`          | Inicio de sesión                         |
| POST   | `/api/forgot-password`| Enviar enlace para restaurar contraseña  |
| POST   | `/api/reset-password` | Restaurar contraseña                     |
| GET    | `/api/files`          | Obtener archivos (por usuario)           |
| GET    | `/api/notifications`  | Obtener solo archivos no leídos          |
| PUT    | `/api/mark-read/:id`  | Marcar un archivo como leído             |

---

## ✅ Recomendaciones Adicionales

- Servir el **frontend** desde un servidor estático o CDN (ej. Vercel, Netlify, Nginx).
- Implementar autenticación con **JWT** para proteger rutas del backend.
- Almacenar archivos en subdirectorios organizados por expediente dentro del hash de usuario.
- Agregar `dotenv` para gestionar variables de entorno (puertos, claves, etc.).


## 📝 Documentación y Mantenimiento

- Incluir documentación técnica para desarrolladores (API, estructura de carpetas, etc.).
- Crear guías de usuario para el uso del sistema.
- Establecer un plan de mantenimiento y actualización del sistema.
- Implementar un sistema de seguimiento de errores y logs para monitorear el estado del sistema.
## 📊 Monitoreo y Estadísticas
- Implementar un panel de administración para monitorear el uso del sistema.
- Registrar estadísticas de uso (número de archivos recibidos, usuarios activos, etc.).
- Considerar el uso de herramientas de monitoreo como Prometheus o Grafana para visualizar métricas en tiempo real.
## 🛠 Plan de Desarrollo  
- Fase 1: Configuración del entorno de desarrollo y creación de la estructura básica del proyecto.
- Fase 2: Implementación de la API de recepción de archivos y autenticación de usuarios.
- Fase 3: Desarrollo del frontend con Bootstrap y conexión a la API.
- Fase 4: Pruebas unitarias y de integración.
- Fase 5: Despliegue en un entorno de producción y pruebas finales.
- Fase 6: Mantenimiento y mejoras basadas en feedback de usuarios.

## 🏗️ Arquitectura

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Frontend      │ ←─────────────→ │    Backend      │
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
