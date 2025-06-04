# 📤 Ejemplos de cURL para Envío Múltiple de Archivos

## 🎯 Comando Básico (Múltiples Archivos)

```bash
curl -X POST http://localhost:3020/api/upload \
  -F "email=test@test.com" \
  -F "expediente=EXPEDIENTE-001" \
  -F "files[]=@./archivo1.pdf" \
  -F "files[]=@./archivo2.docx" \
  -F "files[]=@./archivo3.txt"
```

## 📋 Ejemplos Específicos

### 1. Envío de 3 Documentos PDF
```bash
curl -X POST http://localhost:3020/api/upload \
  -F "email=usuario@empresa.com" \
  -F "expediente=LEGAL-2024-001" \
  -F "files[]=@./contrato.pdf" \
  -F "files[]=@./anexo1.pdf" \
  -F "files[]=@./anexo2.pdf"
```

### 2. Documentos de Diferentes Tipos
```bash
curl -X POST http://localhost:3020/api/upload \
  -F "email=cliente@ejemplo.com" \
  -F "expediente=FISCAL-2024-055" \
  -F "files[]=@./declaracion.pdf" \
  -F "files[]=@./comprobantes.xlsx" \
  -F "files[]=@./notas.txt" \
  -F "files[]=@./imagen.jpg"
```

### 3. Formato Postman/Insomnia Compatible
```bash
curl --location --request POST 'http://localhost:3020/api/upload' \
--form 'email="admin@teja.com"' \
--form 'expediente="ADMIN-001"' \
--form 'files[]=@"C:\documentos\archivo1.pdf"' \
--form 'files[]=@"C:\documentos\archivo2.pdf"' \
--form 'files[]=@"C:\documentos\archivo3.pdf"'
```

### 4. Con Headers Específicos
```bash
curl -X POST http://localhost:3020/api/upload \
  -H "Content-Type: multipart/form-data" \
  -H "User-Agent: BuzonTEJA/1.0" \
  -F "email=sistema@externa.com" \
  -F "expediente=INTEGRACION-001" \
  -F "files[]=@./documento_principal.pdf" \
  -F "files[]=@./documento_anexo.pdf"
```

### 5. Con Información Detallada (Debug)
```bash
curl -X POST http://localhost:3020/api/upload \
  -F "email=test@test.com" \
  -F "expediente=DEBUG-001" \
  -F "files[]=@./test1.txt" \
  -F "files[]=@./test2.txt" \
  -v \
  --progress-bar
```

## 🔧 Parámetros Obligatorios

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `email` | string | Email del usuario (se crea automáticamente si no existe) |
| `expediente` | string | Nombre del expediente/carpeta donde se guardan los archivos |
| `files[]` | file[] | Array de archivos a subir (mínimo 1) |

## 📁 Estructura de Almacenamiento

Los archivos se guardan en:
```
storage/
└── <hash_sha256_del_email>/
    └── <nombre_expediente>/
        ├── archivo1.pdf
        ├── archivo2.docx
        └── archivo3.txt
```

## ✅ Respuestas del API

### Éxito (200)
```json
{
  "status": "success",
  "message": "Archivos recibidos correctamente",
  "filesCount": 3,
  "newUser": false
}
```

### Error - Faltan Parámetros (400)
```json
{
  "status": "error",
  "message": "Email, expediente y al menos un archivo son requeridos"
}
```

### Error - Servidor (500)
```json
{
  "status": "error",
  "message": "Error interno del servidor"
}
```

## 🎭 Casos de Uso Reales

### Integración con Sistema Externo
```bash
# Script para integración automática
#!/bin/bash
EMAIL="cliente@empresa.com"
EXPEDIENTE="FACTURACION-$(date +%Y%m%d)"
API_URL="http://servidor-teja.com:3020/api/upload"

curl -X POST $API_URL \
  -F "email=$EMAIL" \
  -F "expediente=$EXPEDIENTE" \
  -F "files[]=@./facturas/factura_001.pdf" \
  -F "files[]=@./facturas/factura_002.pdf" \
  -F "files[]=@./facturas/resumen.xlsx"
```

### Carga Masiva desde Aplicación
```bash
# Envío automático de documentos procesados
curl -X POST http://localhost:3020/api/upload \
  -F "email=procesamiento@sistema.com" \
  -F "expediente=PROCESO-AUTOMATICO-001" \
  -F "files[]=@./output/documento_procesado.pdf" \
  -F "files[]=@./output/log_proceso.txt" \
  -F "files[]=@./output/reporte_errores.xlsx"
```

## 🔍 Verificación

Después del envío, verifica en el frontend:
1. Accede a: http://localhost:3021
2. Inicia sesión con las credenciales del email usado
3. Revisa la sección "Notificaciones" para ver los archivos nuevos
4. Los archivos aparecerán organizados por expediente

## 💡 Tips Importantes

- ✅ **Usar `files[]`** para múltiples archivos
- ✅ **Incluir `@`** antes de la ruta del archivo
- ✅ **Email y expediente** son obligatorios
- ✅ **Usuarios nuevos** se crean automáticamente
- ✅ **Contraseña aleatoria** se envía por email
- ⚠️ **Archivos grandes** pueden tardar más tiempo
- ⚠️ **Verificar permisos** de los archivos a enviar
