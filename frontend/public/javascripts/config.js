// Configuración dinámica para el frontend
// Este archivo maneja las URLs de la API según el entorno

class ApiConfig {
    constructor() {
        this.hostname = window.location.hostname;
        this.protocol = window.location.protocol;
        this.port = window.location.port;
        
        // Determinar el entorno
        this.isDevelopment = this.hostname === 'localhost' || this.hostname === '127.0.0.1';
        this.isProduction = !this.isDevelopment;
        
        // Configurar URLs
        this.setupUrls();
        
        console.log(`🔧 Configuración API iniciada - Entorno: ${this.isDevelopment ? 'Desarrollo' : 'Producción'}`);
        console.log(`📡 URL de API: ${this.apiBaseUrl}`);
    }
    
    setupUrls() {
        if (this.isDevelopment) {
            // Desarrollo local - comunicación directa
            this.apiBaseUrl = 'http://localhost:3020/api';
            this.backendUrl = 'http://localhost:3020';
        } else {
            // Producción - usar comunicación interna
            // El frontend hace proxy de las peticiones al backend
            this.apiBaseUrl = '/api';  // Usar rutas relativas que serán proxy
            this.backendUrl = '';      // No necesario en producción
        }
    }
    
    // Método para obtener la URL completa de la API
    getApiUrl(endpoint = '') {
        return `${this.apiBaseUrl}${endpoint}`;
    }
    
    // Método para verificar si estamos en producción
    isProductionMode() {
        return this.isProduction;
    }
    
    // Método para obtener headers de autenticación
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }
}

// Instancia global de configuración
window.apiConfig = new ApiConfig();
