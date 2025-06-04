#!/bin/bash

# Script para detener el sistema de buzón TEJA
# Uso: ./stop-system.sh

echo "🛑 Deteniendo sistema de buzón TEJA..."

# Función para matar procesos por puerto
kill_by_port() {
    local port=$1
    local service_name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        echo "📍 Deteniendo $service_name en puerto $port (PID: $pid)..."
        kill -TERM $pid 2>/dev/null
        sleep 2
        
        # Verificar si el proceso aún existe
        if kill -0 $pid 2>/dev/null; then
            echo "⚠️  Forzando detención de $service_name..."
            kill -KILL $pid 2>/dev/null
        fi
        
        echo "✅ $service_name detenido correctamente"
    else
        echo "ℹ️  $service_name no está ejecutándose en puerto $port"
    fi
}

# Función para matar procesos por nombre
kill_by_name() {
    local pattern=$1
    local service_name=$2
    local pids=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "📍 Deteniendo procesos de $service_name..."
        echo "$pids" | xargs kill -TERM 2>/dev/null
        sleep 2
        
        # Verificar procesos restantes y forzar si es necesario
        local remaining_pids=$(pgrep -f "$pattern" 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "⚠️  Forzando detención de $service_name..."
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null
        fi
        
        echo "✅ $service_name detenido correctamente"
    else
        echo "ℹ️  No se encontraron procesos de $service_name"
    fi
}

# Detener por puertos específicos
kill_by_port 3000 "Frontend"
kill_by_port 4000 "Backend"

# Detener por nombres de proceso (como backup)
kill_by_name "buzon-teja.*frontend" "Frontend (por nombre)"
kill_by_name "buzon-teja.*backend" "Backend (por nombre)"
kill_by_name "node.*frontend/bin/www" "Frontend Node.js"
kill_by_name "node.*backend/bin/www" "Backend Node.js"

# Verificar que los puertos estén libres
echo ""
echo "🔍 Verificando puertos..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Puerto 3000 aún ocupado"
else
    echo "✅ Puerto 3000 libre"
fi

if lsof -ti:4000 >/dev/null 2>&1; then
    echo "⚠️  Puerto 4000 aún ocupado"
else
    echo "✅ Puerto 4000 libre"
fi

echo ""
echo "🎉 Sistema de buzón TEJA detenido completamente"
echo "📝 Para reiniciar:"
echo "   - Desarrollo: ./start-development.sh"
echo "   - Producción: ./start-production.sh"
