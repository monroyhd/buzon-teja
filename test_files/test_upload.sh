#!/bin/bash

# Script de prueba para el endpoint de upload
# Uso: ./test_upload.sh

echo "🧪 Probando endpoint de upload..."

# Crear archivos de prueba si no existen
mkdir -p test_files
echo "Documento de prueba 1 - $(date)" > test_files/test1.txt
echo "Documento de prueba 2 - $(date)" > test_files/test2.txt

# Probar upload con archivos de texto
echo "📁 Subiendo archivos de prueba..."

curl -X POST http://localhost:3020/api/upload \
  -F "files[]=@test_files/test1.txt" \
  -F "files[]=@test_files/test2.txt" \
  -F "expediente=TEST-$(date +%Y%m%d)" \
  -F "email=test@ejemplo.com" \
  -w "\n📊 Código de respuesta HTTP: %{http_code}\n" \
  -s

echo ""
echo "✅ Prueba completada"
echo ""
echo "🔍 Para probar desde IP externa, usa:"
echo "curl -X POST http://165.73.244.122:3020/api/upload \\"
echo "  -F \"files[]=@/ruta/a/tu/archivo1.pdf\" \\"
echo "  -F \"files[]=@/ruta/a/tu/archivo2.pdf\" \\"
echo "  -F \"expediente=2025/12\" \\"
echo "  -F \"email=monroyhd@gmail.com\""
