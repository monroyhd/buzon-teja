#!/bin/bash

# Script de prueba para la API del Buzón Electrónico TEJA
# Asegúrate de que el backend esté corriendo en puerto 3020

echo "🧪 Probando API del Buzón Electrónico TEJA"
echo "=========================================="

# Configuración
API_URL="http://localhost:3020/api"
TEST_EMAIL="usuario.prueba@test.com"
TEST_EXPEDIENTE="EXP-TEST-001"

echo ""
echo "📁 1. Probando upload de archivo..."
echo "-----------------------------------"

# Crear archivo de prueba
echo "Este es un archivo de prueba para el buzón electrónico TEJA" > test_document.txt

# Subir archivo
curl -X POST "${API_URL}/upload" \
  -F "files[]=@test_document.txt" \
  -F "email=${TEST_EMAIL}" \
  -F "expediente=${TEST_EXPEDIENTE}" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "🔐 2. Probando login..."
echo "----------------------"

# Nota: La contraseña se generó automáticamente y se envió por email
# Para esta prueba, asumimos que conocemos la contraseña o podemos consultarla en la BD
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"password123\"}")

echo "Response: $LOGIN_RESPONSE"

# Extraer token (requiere jq para parsing JSON)
if command -v jq &> /dev/null; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Token obtenido: ${TOKEN:0:20}..."
        
        echo ""
        echo "📋 3. Probando obtención de archivos..."
        echo "--------------------------------------"
        
        curl -X GET "${API_URL}/files" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Accept: application/json" \
          -w "\nStatus: %{http_code}\n"
    else
        echo "❌ No se pudo obtener token. Verifica credenciales."
    fi
else
    echo "ℹ️  Para obtener el token automáticamente, instala 'jq'"
fi

echo ""
echo "📧 4. Probando recuperación de contraseña..."
echo "-------------------------------------------"

curl -X POST "${API_URL}/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\"}" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "🧹 Limpiando archivos de prueba..."
rm -f test_document.txt

echo ""
echo "✅ Pruebas completadas!"
echo ""
echo "💡 Notas importantes:"
echo "  • Si el upload funcionó, revisa tu email para la contraseña"
echo "  • El archivo se guardó en: storage/<hash_email>/${TEST_EXPEDIENTE}/"
echo "  • Para probar el frontend, ve a: http://localhost:3021"
echo "  • Para ver la base de datos: backend/database/buzon.db"
