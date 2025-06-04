#!/bin/bash

# Script de prueba para el sistema de recuperación de contraseña
# Autor: Sistema Buzón Electrónico TEJA

echo "🔐 PRUEBA DEL SISTEMA DE RECUPERACIÓN DE CONTRASEÑA"
echo "===================================================="

BASE_URL="http://localhost:3020/api"
FRONTEND_URL="http://localhost:3021"
TEST_EMAIL="test@test.com"

echo ""
echo "📋 PASO 1: Verificar que los servidores estén ejecutándose..."

# Verificar backend
if curl -s "$BASE_URL/health" > /dev/null 2>&1 || curl -s "$BASE_URL/../" > /dev/null 2>&1; then
    echo "✅ Backend ejecutándose en puerto 3020"
else
    echo "❌ Backend no disponible en puerto 3020"
    echo "   Ejecuta: cd backend && npm start"
    exit 1
fi

# Verificar frontend
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "✅ Frontend ejecutándose en puerto 3021"
else
    echo "❌ Frontend no disponible en puerto 3021"
    echo "   Ejecuta: cd frontend && npm start"
    exit 1
fi

echo ""
echo "📧 PASO 2: Solicitar recuperación de contraseña..."
echo "Email de prueba: $TEST_EMAIL"

FORGOT_RESPONSE=$(curl -X POST "$BASE_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  -s)

echo "Respuesta del servidor:"
echo $FORGOT_RESPONSE | jq '.' 2>/dev/null || echo $FORGOT_RESPONSE

echo ""
echo "🔍 PASO 3: Verificar token en la base de datos..."
echo "Para verificar el token generado, ejecuta:"
echo "cd backend && node -e \"
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/buzon.db');
db.get('SELECT email, reset_token, reset_token_expires FROM users WHERE email = ?', ['$TEST_EMAIL'], (err, row) => {
    if (err) console.error(err);
    else if (row) {
        console.log('Email:', row.email);
        console.log('Token:', row.reset_token);
        console.log('Expira:', row.reset_token_expires);
    } else {
        console.log('Usuario no encontrado');
    }
    db.close();
});
\""

echo ""
echo "📝 PASO 4: Probar con email inexistente..."

INVALID_RESPONSE=$(curl -X POST "$BASE_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"noexiste@example.com\"}" \
  -s)

echo "Respuesta para email inexistente:"
echo $INVALID_RESPONSE | jq '.' 2>/dev/null || echo $INVALID_RESPONSE

echo ""
echo "🎯 PRUEBAS MANUALES RECOMENDADAS:"
echo "=================================="
echo "1. Accede a: $FRONTEND_URL/login"
echo "2. Haz clic en '¿Olvidó su contraseña?'"
echo "3. Ingresa el email: $TEST_EMAIL"
echo "4. Revisa la consola del backend para ver el email enviado"
echo "5. Si tienes SMTP configurado, revisa tu bandeja de entrada"
echo ""
echo "💡 PARA PROBAR EL RESET COMPLETO:"
echo "================================="
echo "1. Obtén el token de la base de datos (comando arriba)"
echo "2. Accede a: $FRONTEND_URL/reset-password?token=<TOKEN>"
echo "3. Ingresa una nueva contraseña"
echo "4. Intenta hacer login con la nueva contraseña"

echo ""
echo "⚙️ CONFIGURACIÓN SMTP:"
echo "====================="
echo "Para que los emails se envíen realmente, configura en backend/.env:"
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_USER=tu-email@gmail.com"
echo "SMTP_PASS=tu-contraseña-de-aplicación"

echo ""
echo "✅ Script de prueba completado"
