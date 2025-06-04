#!/bin/bash

# Script para iniciar el sistema en modo desarrollo
echo "🚀 Iniciando Buzón Electrónico TEJA en modo DESARROLLO..."

# Configurar variables de entorno para desarrollo
export NODE_ENV=development
export BACKEND_HOST=0.0.0.0
export FRONTEND_HOST=0.0.0.0

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

# Función para iniciar backend
start_backend() {
    echo "⚙️ Iniciando backend (puerto 3020)..."
    cd "$BASE_DIR/backend"
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    sleep 3
}

# Función para iniciar frontend
start_frontend() {
    echo "🌐 Iniciando frontend (puerto 3021)..."
    cd "$BASE_DIR/frontend"
    npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    sleep 3
}

# Función para verificar servicios
check_services() {
    echo "🔍 Verificando servicios..."
    
    # Verificar backend
    if curl -s http://localhost:3020/api > /dev/null; then
        echo "✅ Backend: OK (puerto 3020)"
    else
        echo "❌ Backend: Error"
    fi
    
    # Verificar frontend
    if curl -s http://localhost:3021 > /dev/null; then
        echo "✅ Frontend: OK (puerto 3021)"
    else
        echo "❌ Frontend: Error"
    fi
}

# Ejecutar secuencia de inicio
cleanup
start_backend
start_frontend
check_services

echo ""
echo "🎉 Sistema iniciado en modo DESARROLLO"
echo "📱 Frontend: http://localhost:3021"
echo "🔧 Backend API: http://localhost:3020/api"
echo ""
echo "Para detener el sistema, ejecuta: ./stop.sh"
