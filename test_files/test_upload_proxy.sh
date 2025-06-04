#!/bin/bash

# Script de prueba para el endpoint de upload a través del proxy
# Uso: ./test_upload_proxy.sh

echo "🧪 Probando endpoint de upload a través del PROXY (puerto 3021)..."

# Crear archivos de prueba si no existen
mkdir -p test_files
echo "Documento de prueba PROXY 1 - $(date)" > test_files/test_proxy1.txt
echo "Documento de prueba PROXY 2 - $(date)" > test_files/test_proxy2.txt

# Probar upload con archivos de texto a través del proxy
echo "📁 Subiendo archivos de prueba a través del proxy..."

curl -X POST http://localhost:3021/api/upload \
  -F "files[]=@test_files/test_proxy1.txt" \
  -F "files[]=@test_files/test_proxy2.txt" \
  -F "expediente=TEJA-PROXY-TEST-$(date +%Y%m%d-%H%M%S)" \
  -F "email=test.proxy@ejemplo.com" \
  -w "\n📊 Código de respuesta HTTP: %{http_code}\n" \
  -s

echo ""
echo "✅ Prueba completada"
echo ""
echo "🔍 Para probar desde IP externa a través del proxy, usa:"
echo "curl -X POST http://165.73.244.122:3021/api/upload \\"
echo "  -F \"files[]=@/ruta/a/tu/archivo1.pdf\" \\"
echo "  -F \"files[]=@/ruta/a/tu/archivo2.pdf\" \\"
echo "  -F \"expediente=2025/12\" \\"
echo "  -F \"email=monroyhd@gmail.com\""
