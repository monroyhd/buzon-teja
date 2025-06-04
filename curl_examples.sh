#!/bin/bash

# Script de prueba para envío de múltiples archivos al Buzón Electrónico TEJA
# ============================================================================

echo "🚀 Probando envío de múltiples archivos al Buzón TEJA"
echo "======================================================"

# URL base del API
API_URL="http://localhost:3020/api"

# Datos del expediente
EMAIL="test@test.com"
EXPEDIENTE="TEJA-001"

echo ""
echo "📧 Email: $EMAIL"
echo "📁 Expediente: $EXPEDIENTE"
echo ""

# Verificar que los archivos existan
FILES_DIR="./test_files"
FILE1="$FILES_DIR/documento1.txt"
FILE2="$FILES_DIR/informe_tecnico.txt"
FILE3="$FILES_DIR/anexo_especificaciones.txt"

if [ ! -f "$FILE1" ] || [ ! -f "$FILE2" ] || [ ! -f "$FILE3" ]; then
    echo "❌ Error: No se encontraron todos los archivos de prueba"
    echo "   Asegúrate de que existan:"
    echo "   - $FILE1"
    echo "   - $FILE2"
    echo "   - $FILE3"
    exit 1
fi

echo "✅ Archivos encontrados:"
echo "   - $(basename $FILE1)"
echo "   - $(basename $FILE2)"
echo "   - $(basename $FILE3)"
echo ""

# EJEMPLO 1: Envío básico con 3 archivos
echo "📤 EJEMPLO 1: Envío de 3 archivos al mismo expediente"
echo "------------------------------------------------"
echo "Comando cURL:"
echo ""
cat << 'EOF'
curl -X POST http://localhost:3020/api/upload \
  -F "email=test@test.com" \
  -F "expediente=TEJA-001" \
  -F "files[]=@./test_files/documento1.txt" \
  -F "files[]=@./test_files/informe_tecnico.txt" \
  -F "files[]=@./test_files/anexo_especificaciones.txt" \
  -H "Content-Type: multipart/form-data"
EOF

echo ""
echo "🔄 Ejecutando..."
curl -X POST "$API_URL/upload" \
  -F "email=$EMAIL" \
  -F "expediente=$EXPEDIENTE" \
  -F "files[]=@$FILE1" \
  -F "files[]=@$FILE2" \
  -F "files[]=@$FILE3" \
  -H "Content-Type: multipart/form-data" \
  -w "\n\n📊 Código de respuesta: %{http_code}\n" \
  -s

echo ""
echo "================================================"
echo ""

# EJEMPLO 2: Envío con diferentes tipos de archivo (simulado)
echo "📤 EJEMPLO 2: Envío con diferentes expedientes"
echo "---------------------------------------------"
echo "Comando cURL para expediente diferente:"
echo ""
cat << 'EOF'
curl -X POST http://localhost:3020/api/upload \
  -F "email=usuario@empresa.com" \
  -F "expediente=TEJA-002" \
  -F "files[]=@./test_files/documento1.txt" \
  -F "files[]=@./test_files/informe_tecnico.txt"
EOF

echo ""
echo "🔄 Ejecutando con nuevo usuario y expediente..."
curl -X POST "$API_URL/upload" \
  -F "email=usuario@empresa.com" \
  -F "expediente=TEJA-002" \
  -F "files[]=@$FILE1" \
  -F "files[]=@$FILE2" \
  -H "Content-Type: multipart/form-data" \
  -w "\n\n📊 Código de respuesta: %{http_code}\n" \
  -s

echo ""
echo "================================================"
echo ""

# EJEMPLO 3: Formato alternativo más legible
echo "📤 EJEMPLO 3: Formato cURL alternativo (más legible)"
echo "---------------------------------------------------"
cat << 'EOF'
curl --location --request POST 'http://localhost:3020/api/upload' \
--form 'email="test@test.com"' \
--form 'expediente="TEJA-001"' \
--form 'files[]=@"./test_files/documento1.txt"' \
--form 'files[]=@"./test_files/informe_tecnico.txt"' \
--form 'files[]=@"./test_files/anexo_especificaciones.txt"'
EOF

echo ""
echo ""

# EJEMPLO 4: Con verbose para debugging
echo "📤 EJEMPLO 4: Comando con información detallada (verbose)"
echo "--------------------------------------------------------"
cat << 'EOF'
curl -X POST http://localhost:3020/api/upload \
  -F "email=test@test.com" \
  -F "expediente=TEJA-001" \
  -F "files[]=@./test_files/documento1.txt" \
  -F "files[]=@./test_files/informe_tecnico.txt" \
  -F "files[]=@./test_files/anexo_especificaciones.txt" \
  -v \
  --progress-bar
EOF

echo ""
echo ""

echo "💡 NOTAS IMPORTANTES:"
echo "====================="
echo "• Usar 'files[]' como nombre del campo para múltiples archivos"
echo "• Incluir @ antes de la ruta del archivo"
echo "• Email y expediente son campos obligatorios"
echo "• El servidor debe estar corriendo en puerto 3020"
echo "• Los archivos se guardan en storage/<hash_email>/<expediente>/"
echo "• Si el usuario no existe, se crea automáticamente con contraseña aleatoria"
echo ""

echo "🔍 VERIFICACIÓN:"
echo "================"
echo "Puedes verificar que los archivos se subieron correctamente:"
echo "1. Accede a http://localhost:3021"
echo "2. Inicia sesión con: test@test.com / 123456"
echo "3. Revisa la sección de notificaciones"
echo ""

echo "✅ Script completado"
