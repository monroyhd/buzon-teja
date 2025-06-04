#!/bin/bash

# Script para iniciar el sistema en modo producción
echo "🚀 Iniciando Buzón Electrónico TEJA en modo PRODUCCIÓN..."

# Configurar variables de entorno para producción
export NODE_ENV=production
export BACKEND_HOST=0.0.0.0   # Accesible públicamente para API de recepción
export FRONTEND_HOST=0.0.0.0  # Accesible públicamente

# Directorio base
BASE_DIR="/apps-node/buzon-teja"

# Función para limpiar procesos existentes
cleanup() {
    echo "🧹 Limpiando procesos existentes..."
    pkill -f "node.*3020" 2>/dev/null || true
    pkill -f "node.*3021" 2>/dev/null || true
    fuser -k 3020/tcp 2>/dev/null || true
    fuser -k 3021/tcp 2>/dev/null || true
    sleep 2
}

# Función para iniciar backend (público con CORS estricto)
start_backend() {
    echo "⚙️ Iniciando backend PÚBLICO (0.0.0.0:3020) con CORS estricto..."
    cd "$BASE_DIR/backend"
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    sleep 3
}

# Función para iniciar frontend (público)
start_frontend() {
    echo "🌐 Iniciando frontend PÚBLICO (0.0.0.0:3021)..."
    cd "$BASE_DIR/frontend"
    npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    sleep 3
}

# Función para verificar servicios
check_services() {
    echo "🔍 Verificando servicios..."
    
    # Verificar backend (público con CORS)
    if curl -s http://127.0.0.1:3020/api > /dev/null; then
        echo "✅ Backend: OK (acceso público: 0.0.0.0:3020 con CORS estricto)"
    else
        echo "❌ Backend: Error"
    fi
    
    # Verificar frontend (público)
    if curl -s http://localhost:3021 > /dev/null; then
        echo "✅ Frontend: OK (acceso público: 0.0.0.0:3021)"
    else
        echo "❌ Frontend: Error"
    fi
    
    # Verificar que backend esté accesible para API de recepción
    IP_EXTERNA=$(hostname -I | awk '{print $1}')
    echo "🔒 Verificando acceso..."
    echo "   - Backend público: $IP_EXTERNA:3020 (solo endpoints autorizados)"
    echo "   - Frontend público: $IP_EXTERNA:3021"
}

# Función para mostrar información de seguridad
security_info() {
    echo ""
    echo "🔐 CONFIGURACIÓN DE SEGURIDAD:"
    echo "   - Backend: Accesible públicamente (0.0.0.0:3020) con CORS estricto"
    echo "   - Frontend: Accesible públicamente (0.0.0.0:3021)"
    echo "   - Proxy: Frontend hace proxy de /api al backend interno"
    echo "   - CORS: Solo permite orígenes autorizados y IP específica para upload"
    echo "   - API Recepción: /api/upload accesible desde 165.73.244.122"
    echo ""
}

# Ejecutar secuencia de inicio
cleanup
start_backend
start_frontend
check_services
security_info

echo "🎉 Sistema iniciado en modo PRODUCCIÓN"
echo "🌍 Acceso público Frontend: http://$(hostname -I | awk '{print $1}'):3021"
echo "📡 API Recepción Backend: http://$(hostname -I | awk '{print $1}'):3020/api/upload"
echo ""
echo "Para detener el sistema, ejecuta: ./stop.sh"
