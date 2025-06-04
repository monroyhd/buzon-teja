// Configuración de la aplicación
// La configuración de API se maneja en config.js
// que se carga antes que este archivo

// Variable global para la URL de la API
let API_BASE_URL;
let currentUser = null;
let filesData = {
    notifications: {},
    readFiles: {},
    totalNotifications: 0,
    totalReadFiles: 0
};

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que la configuración esté lista
    if (window.apiConfig) {
        API_BASE_URL = window.apiConfig.getApiUrl();
        checkAuthentication();
        initializeApp();
    } else {
        // Fallback si config.js no se cargó
        console.warn('⚠️ Config.js no cargado, usando configuración por defecto');
        API_BASE_URL = window.location.hostname === 'localhost' ? 
            'http://localhost:3020/api' : '/api';
        checkAuthentication();
        initializeApp();
    }
});

// Verificar si el usuario está autenticado
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!token || !userEmail) {
        // Si no hay token, redirigir al login
        window.location.href = '/login';
        return;
    }
    
    currentUser = { email: userEmail };
    document.getElementById('userEmail').textContent = userEmail;
}

// Inicializar la aplicación
function initializeApp() {
    // Solicitar permisos de notificación
    requestNotificationPermission();
    
    // Cargar datos iniciales
    loadFiles();
    
    // Configurar eventos
    setupEventListeners();
    
    // Actualizar datos cada 30 segundos y verificar archivos nuevos
    setInterval(() => {
        loadFiles(true); // Pasar true para indicar que es una verificación automática
    }, 30000);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.navList').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Formulario de cambio de contraseña
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
}

// Mostrar sección específica
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remover clase active de todos los nav items
    document.querySelectorAll('.navList').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Agregar clase active al nav item correspondiente
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Cargar contenido específico según la sección
    switch (sectionName) {
        case 'notifications':
            renderNotifications();
            break;
        case 'read-files':
            renderReadFiles();
            break;
        case 'profile':
            loadUserProfile();
            break;
    }
}

// Cargar archivos del usuario
async function loadFiles(isAutoCheck = false) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/files`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado, redirigir al login
                logout();
                return;
            }
            throw new Error('Error al cargar archivos');
        }
        
        const result = await response.json();
        
        // Si es una verificación automática, comparar con datos anteriores
        if (isAutoCheck && filesData.totalNotifications !== undefined) {
            const newNotificationsCount = result.data.totalNotifications;
            const oldNotificationsCount = filesData.totalNotifications;
            
            // Si hay archivos nuevos, mostrar notificaciones
            if (newNotificationsCount > oldNotificationsCount) {
                const newFilesCount = newNotificationsCount - oldNotificationsCount;
                const expedientes = Object.keys(result.data.notifications);
                
                // Mostrar notificación del navegador
                showBrowserNotification(
                    '📬 Buzón Electrónico TEJA',
                    `¡${newFilesCount} archivo(s) nuevo(s) recibido(s)!`
                );
                
                // Mostrar alerta visual en la aplicación
                showNewFilesAlert(newFilesCount, expedientes);
                
                // Reproducir sonido de notificación (opcional)
                playNotificationSound();
                
                console.log(`🔔 Detectados ${newFilesCount} archivos nuevos`);
            }
        }
        
        filesData = result.data;
        updateDashboard();
        
    } catch (error) {
        console.error('Error al cargar archivos:', error);
        if (!isAutoCheck) {
            showToast('Error al cargar archivos', 'error');
        }
    }
}

// Actualizar dashboard con estadísticas
function updateDashboard() {
    // Actualizar contadores
    document.getElementById('totalFiles').textContent = 
        filesData.totalNotifications + filesData.totalReadFiles;
    document.getElementById('totalNotifications').textContent = filesData.totalNotifications;
    document.getElementById('totalReadFiles').textContent = filesData.totalReadFiles;
    document.getElementById('notificationCount').textContent = filesData.totalNotifications;
    
    // Contar expedientes únicos
    const allExpedientes = new Set([
        ...Object.keys(filesData.notifications),
        ...Object.keys(filesData.readFiles)
    ]);
    document.getElementById('totalExpedientes').textContent = allExpedientes.size;
    
    // Actualizar actividades recientes
    updateRecentActivities();
}

// Actualizar actividades recientes
function updateRecentActivities() {
    const recentActivitiesDiv = document.getElementById('recentActivities');
    
    // Obtener archivos recientes de notificaciones
    const recentFiles = [];
    
    Object.values(filesData.notifications).forEach(expedienteFiles => {
        expedienteFiles.forEach(file => {
            recentFiles.push({
                ...file,
                type: 'notification',
                action: 'Archivo recibido'
            });
        });
    });
    
    Object.values(filesData.readFiles).forEach(expedienteFiles => {
        expedienteFiles.forEach(file => {
            if (file.fecha_lectura) {
                recentFiles.push({
                    ...file,
                    type: 'read',
                    action: 'Archivo leído'
                });
            }
        });
    });
    
    // Ordenar por fecha (más recientes primero)
    recentFiles.sort((a, b) => {
        const dateA = new Date(a.fecha_lectura || a.fecha_subida);
        const dateB = new Date(b.fecha_lectura || b.fecha_subida);
        return dateB - dateA;
    });
    
    // Mostrar solo los 5 más recientes
    const recentFilesHTML = recentFiles.slice(0, 5).map(file => {
        const date = new Date(file.fecha_lectura || file.fecha_subida);
        const formattedDate = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
        
        return `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <strong>${file.filename}</strong>
                    <br>
                    <small class="text-muted">Expediente: ${file.expediente}</small>
                </div>
                <div class="text-end">
                    <span class="badge bg-${file.type === 'notification' ? 'warning' : 'success'}">
                        ${file.action}
                    </span>
                    <br>
                    <small class="text-muted">${formattedDate}</small>
                </div>
            </div>
        `;
    }).join('');
    
    recentActivitiesDiv.innerHTML = recentFilesHTML || '<p class="text-muted">No hay actividades recientes</p>';
}

// Renderizar notificaciones
function renderNotifications() {
    const notificationsDiv = document.getElementById('notificationsContent');
    
    if (Object.keys(filesData.notifications).length === 0) {
        notificationsDiv.innerHTML = '<p class="text-muted">No hay notificaciones</p>';
        return;
    }
    
    let html = '';
    
    Object.entries(filesData.notifications).forEach(([expediente, files]) => {
        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <ion-icon name="folder-outline"></ion-icon>
                        Expediente: ${expediente}
                        <span class="badge bg-warning ms-2">${files.length} archivo(s)</span>
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
        `;
        
        files.forEach(file => {
            const uploadDate = new Date(file.fecha_subida);
            const formattedDate = uploadDate.toLocaleDateString('es-ES') + ' ' + uploadDate.toLocaleTimeString('es-ES');
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card border-warning">
                        <div class="card-body">
                            <h6 class="card-title">
                                <ion-icon name="document-outline"></ion-icon>
                                ${file.filename}
                            </h6>
                            <p class="card-text">
                                <small class="text-muted">Recibido: ${formattedDate}</small>
                            </p>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="viewFile(${file.id})">
                                    <ion-icon name="eye-outline"></ion-icon> Visualizar
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="downloadFile(${file.id})">
                                    <ion-icon name="download-outline"></ion-icon> Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    notificationsDiv.innerHTML = html;
}

// Renderizar archivos leídos
function renderReadFiles() {
    const readFilesDiv = document.getElementById('readFilesContent');
    const deleteAllBtn = document.getElementById('deleteAllReadBtn');
    
    if (Object.keys(filesData.readFiles).length === 0) {
        readFilesDiv.innerHTML = '<p class="text-muted">No hay archivos leídos</p>';
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        return;
    }

    // Mostrar botón de eliminar todos si hay archivos leídos
    if (deleteAllBtn) deleteAllBtn.style.display = 'inline-block';
    
    let html = '';
    
    Object.entries(filesData.readFiles).forEach(([expediente, files]) => {
        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <ion-icon name="folder-open-outline"></ion-icon>
                        Expediente: ${expediente}
                        <span class="badge bg-success ms-2">${files.length} archivo(s)</span>
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
        `;
        
        files.forEach(file => {
            const uploadDate = new Date(file.fecha_subida);
            const readDate = file.fecha_lectura ? new Date(file.fecha_lectura) : null;
            const formattedUploadDate = uploadDate.toLocaleDateString('es-ES') + ' ' + uploadDate.toLocaleTimeString('es-ES');
            const formattedReadDate = readDate ? readDate.toLocaleDateString('es-ES') + ' ' + readDate.toLocaleTimeString('es-ES') : 'N/A';
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card border-success">
                        <div class="card-body">
                            <h6 class="card-title">
                                <ion-icon name="document-text-outline"></ion-icon>
                                ${file.filename}
                            </h6>
                            <p class="card-text">
                                <small class="text-muted">
                                    Recibido: ${formattedUploadDate}<br>
                                    Leído: ${formattedReadDate}
                                </small>
                            </p>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="viewFile(${file.id})">
                                    <ion-icon name="eye-outline"></ion-icon> Visualizar
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="downloadFile(${file.id})">
                                    <ion-icon name="download-outline"></ion-icon> Descargar
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteReadFile(${file.id}, '${file.filename}')" title="Eliminar archivo">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    readFilesDiv.innerHTML = html;
}

// Visualizar archivo
async function viewFile(fileId) {
    try {
        const token = localStorage.getItem('authToken');
        
        // Primero verificamos si el archivo existe y marcamos como leído
        const response = await fetch(`${API_BASE_URL}/files/${fileId}/view`, {
            method: 'HEAD', // Solo verificar sin descargar
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al acceder al archivo');
        }
        
        // Abrir en nueva pestaña con la URL y token en el header
        // Como no podemos pasar headers a window.open, usamos una approach diferente
        const viewUrl = `${API_BASE_URL}/files/${fileId}/view`;
        
        // Crear un formulario temporal para enviar la petición POST con token
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = viewUrl;
        form.target = '_blank';
        
        // No podemos enviar headers así, mejor descargamos y mostramos
        // Vamos a hacer fetch para obtener el archivo y crear una URL temporal
        const fileResponse = await fetch(viewUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!fileResponse.ok) {
            throw new Error('Error al obtener archivo');
        }
        
        const blob = await fileResponse.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        
        // Abrir en nueva pestaña
        window.open(fileUrl, '_blank');
        
        // Limpiar la URL después de un tiempo
        setTimeout(() => {
            window.URL.revokeObjectURL(fileUrl);
        }, 60000); // 1 minuto
        
        showToast('Archivo visualizado y marcado como leído', 'success');
        
        // Recargar archivos para actualizar las secciones
        await loadFiles();
        
        // Renderizar la sección actual
        const notificationsSection = document.getElementById('notifications-section');
        const readFilesSection = document.getElementById('read-files-section');
        
        if (notificationsSection.style.display !== 'none') {
            renderNotifications();
        } else if (readFilesSection.style.display !== 'none') {
            renderReadFiles();
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al visualizar archivo', 'error');
    }
}

// Descargar archivo
async function downloadFile(fileId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al descargar archivo');
        }
        
        // Crear enlace de descarga
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Obtener nombre del archivo del header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition ? 
            contentDisposition.split('filename=')[1].replace(/"/g, '') : 
            'archivo';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Archivo descargado y marcado como leído', 'success');
        
        // Recargar archivos para actualizar las secciones
        await loadFiles();
        
        // Renderizar la sección actual
        const notificationsSection = document.getElementById('notifications-section');
        const readFilesSection = document.getElementById('read-files-section');
        
        if (notificationsSection.style.display !== 'none') {
            renderNotifications();
        } else if (readFilesSection.style.display !== 'none') {
            renderReadFiles();
        }
        
        showToast('Archivo descargado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al descargar archivo', 'error');
    }
}

// Refrescar archivos
async function refreshFiles() {
    showToast('Actualizando archivos...', 'info');
    await loadFiles();
    
    // Renderizar la sección actual
    const activeSection = document.querySelector('.navList.active');
    if (activeSection) {
        const sectionName = activeSection.getAttribute('data-section');
        if (sectionName === 'notifications') {
            renderNotifications();
        } else if (sectionName === 'read-files') {
            renderReadFiles();
        }
    }
    
    showToast('Archivos actualizados', 'success');
}

// Cargar perfil de usuario
function loadUserProfile() {
    const userEmail = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = userEmail || 'N/A';
    
    // Aquí se podría cargar más información del perfil desde el backend
    document.getElementById('userCreatedAt').textContent = 'N/A';
}

// Manejar cambio de contraseña
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        // Aquí se implementaría la llamada al API para cambiar contraseña
        showToast('Funcionalidad de cambio de contraseña en desarrollo', 'info');
        
        // Limpiar formulario
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cambiar contraseña', 'error');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
}

// Mostrar toast/notificación
function showToast(message, type = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// Solicitar permisos de notificación del navegador
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permisos de notificación otorgados');
                    showToast('Notificaciones habilitadas. Recibirás alertas cuando lleguen archivos nuevos.', 'success');
                } else {
                    console.log('Permisos de notificación denegados');
                    showToast('Para recibir notificaciones de archivos nuevos, habilita las notificaciones en tu navegador.', 'warning');
                }
            });
        }
    } else {
        console.log('Este navegador no soporta notificaciones');
    }
}

// Mostrar notificación del navegador
function showBrowserNotification(title, message, icon = '/images/logo.png') {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: message,
            icon: icon,
            badge: icon,
            tag: 'buzon-teja-notification',
            requireInteraction: true,
            silent: false
        });

        // Hacer clic en la notificación enfoca la ventana y va a notificaciones
        notification.onclick = function() {
            window.focus();
            showSection('notifications');
            this.close();
        };

        // Auto cerrar después de 10 segundos
        setTimeout(() => {
            notification.close();
        }, 10000);
    }
}

// Mostrar alerta visual en la aplicación
function showNewFilesAlert(newFilesCount, expedientes) {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const expedientesList = expedientes.map(exp => `<li><strong>${exp}</strong></li>`).join('');
    
    const alertHTML = `
        <div class="alert alert-info alert-dismissible fade show new-files-alert" role="alert">
            <div class="d-flex align-items-start">
                <div class="me-3">
                    <i class="fas fa-bell fa-2x text-primary"></i>
                </div>
                <div class="flex-grow-1">
                    <h5 class="alert-heading mb-2">📬 ¡Archivos Nuevos Recibidos!</h5>
                    <p class="mb-1">Se han recibido <strong>${newFilesCount}</strong> archivo(s) nuevo(s) en los siguientes expedientes:</p>
                    <ul class="mb-2">${expedientesList}</ul>
                    <button type="button" class="btn btn-primary btn-sm" onclick="showSection('notifications')">
                        Ver Notificaciones
                    </button>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Auto ocultar después de 15 segundos
    setTimeout(() => {
        const alert = alertContainer.querySelector('.new-files-alert');
        if (alert) {
            alert.remove();
        }
    }, 15000);
}

// Crear contenedor de alertas si no existe
function createAlertContainer() {
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
    }
    return container;
}

// Reproducir sonido de notificación
function playNotificationSound() {
    try {
        // Crear un contexto de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Crear un oscilador para generar el tono
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Conectar el oscilador al nodo de ganancia y luego al destino
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar el sonido de notificación
        oscillator.type = 'sine'; // Tipo de onda
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frecuencia inicial
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // Cambio de frecuencia
        
        // Configurar el volumen
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Reproducir el sonido
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        console.log('🔊 Sonido de notificación reproducido');
        
    } catch (error) {
        console.warn('⚠️ No se pudo reproducir el sonido de notificación:', error);
        
        // Fallback: intentar reproducir un sonido alternativo si está disponible
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => {
                console.warn('⚠️ Fallback de audio también falló:', e);
            });
        } catch (fallbackError) {
            console.warn('⚠️ Fallback de audio no disponible:', fallbackError);
        }
    }
}

// Eliminar todos los archivos leídos
async function deleteAllReadFiles() {
    // Mostrar confirmación
    const confirmed = await showConfirmDialog(
        '¿Eliminar todos los archivos leídos?',
        'Esta acción eliminará permanentemente todos los archivos que ya has leído. No se puede deshacer.',
        'Eliminar Todo',
        'btn-danger'
    );

    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/files/read`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar archivos');
        }

        if (result.deletedCount === 0) {
            showToast('No hay archivos leídos para eliminar', 'info');
        } else {
            showToast(`Se eliminaron ${result.deletedCount} archivo(s) leído(s)`, 'success');
            
            if (result.failedDeletions && result.failedDeletions.length > 0) {
                showToast(`Advertencia: No se pudieron eliminar físicamente ${result.failedDeletions.length} archivo(s)`, 'warning');
            }
        }

        // Recargar archivos y actualizar la vista
        await loadFiles();
        renderReadFiles();

    } catch (error) {
        console.error('Error al eliminar archivos leídos:', error);
        showToast('Error al eliminar archivos leídos: ' + error.message, 'error');
    }
}

// Eliminar un archivo leído específico
async function deleteReadFile(fileId, filename) {
    // Mostrar confirmación
    const confirmed = await showConfirmDialog(
        `¿Eliminar "${filename}"?`,
        'Esta acción eliminará permanentemente el archivo. No se puede deshacer.',
        'Eliminar',
        'btn-danger'
    );

    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar archivo');
        }

        showToast(`Archivo "${filename}" eliminado correctamente`, 'success');

        // Recargar archivos y actualizar la vista
        await loadFiles();
        renderReadFiles();

    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        showToast('Error al eliminar archivo: ' + error.message, 'error');
    }
}

// Mostrar diálogo de confirmación
function showConfirmDialog(title, message, confirmText = 'Confirmar', confirmClass = 'btn-primary') {
    return new Promise((resolve) => {
        // Crear modal de confirmación
        const modalHTML = `
            <div class="modal fade" id="confirmModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <ion-icon name="warning-outline"></ion-icon>
                                ${title}
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelBtn">
                                Cancelar
                            </button>
                            <button type="button" class="btn ${confirmClass}" id="confirmBtn">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('confirmModal');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        const bsModal = new bootstrap.Modal(modal);

        // Manejar eventos
        confirmBtn.addEventListener('click', () => {
            bsModal.hide();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            bsModal.hide();
            resolve(false);
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Mostrar modal
        bsModal.show();
    });
}
