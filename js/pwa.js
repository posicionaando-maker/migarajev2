// ====== PWA CONFIGURACIÓN AVANZADA ======

const PWA_CONFIG = {
    CACHE_NAME: 'garageshop-v1',
    OFFLINE_URL: 'index.html',
    ASSETS: [
        '/',
        '/index.html',
        '/css/style.css',
        '/js/app.js',
        '/js/search.js',
        '/manifest.json',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'
    ]
};

// ====== REGISTRAR SERVICE WORKER ======
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(registration => {
                console.log('✅ Service Worker registrado:', registration);
                
                // Verificar actualizaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    }
});

// ====== MOSTRAR NOTIFICACIÓN DE ACTUALIZACIÓN ======
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-sync-alt" aria-hidden="true"></i>
        Nueva versión disponible
        <button onclick="updateApp()" style="margin-left:15px;background:white;color:#2c3e50;border:none;padding:5px 15px;border-radius:5px;font-weight:bold;cursor:pointer;">
            Actualizar
        </button>
    `;
    document.getElementById('notificationContainer').appendChild(notification);
}

// ====== ACTUALIZAR APP ======
window.updateApp = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.update();
                showNotification('🔄 Actualizando...', 'info');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        });
    }
};

// ====== DETECTAR ESTADO DE CONEXIÓN ======
window.addEventListener('online', () => {
    showNotification('📶 Conexión restablecida', 'success');
});

window.addEventListener('offline', () => {
    showNotification('📶 Sin conexión - Modo offline', 'warning');
});

// ====== CACHÉ DE IMÁGENES ======
function cacheImages(imageUrls) {
    if ('caches' in window) {
        caches.open(PWA_CONFIG.CACHE_NAME)
            .then(cache => {
                imageUrls.forEach(url => {
                    if (url) {
                        cache.add(url).catch(() => {});
                    }
                });
            });
    }
}

// ====== PREFETCH DE PÁGINAS ======
function prefetchPage(url) {
    if ('caches' in window) {
        caches.open(PWA_CONFIG.CACHE_NAME)
            .then(cache => {
                cache.add(url).catch(() => {});
            });
    }
}

// ====== INSTALACIÓN DE LA APP ======
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-banner-content">
            <div>
                <strong>📱 Instala GarageShop</strong>
                <p>Accede más rápido desde tu pantalla de inicio</p>
            </div>
            <div>
                <button onclick="installApp()" class="btn-install">Instalar</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-install-close">✕</button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);
}

window.installApp = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('🎉 GarageShop instalado exitosamente', 'success');
            }
            deferredPrompt = null;
            document.querySelector('.install-banner')?.remove();
        });
    }
};

// ====== ESTILOS DEL BANNER DE INSTALACIÓN ======
const installBannerStyles = document.createElement('style');
installBannerStyles.textContent = `
    .install-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--secondary);
        color: white;
        padding: 15px 20px;
        z-index: 9998;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
        animation: slideUp 0.5s ease;
    }
    
    .install-banner-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 600px;
        margin: 0 auto;
        gap: 15px;
    }
    
    .install-banner-content strong {
        font-size: 1.1rem;
        display: block;
    }
    
    .install-banner-content p {
        font-size: 0.9rem;
        opacity: 0.8;
        margin: 0;
    }
    
    .btn-install {
        background: var(--primary);
        color: var(--secondary);
        border: none;
        padding: 10px 25px;
        border-radius: 50px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition);
        font-size: 0.9rem;
    }
    
    .btn-install:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(245, 166, 35, 0.4);
    }
    
    .btn-install-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 5px 10px;
        transition: var(--transition);
    }
    
    .btn-install-close:hover {
        color: white;
        transform: scale(1.2);
    }
    
    @media (max-width: 480px) {
        .install-banner-content {
            flex-direction: column;
            text-align: center;
        }
        
        .install-banner-content div:last-child {
            display: flex;
            gap: 10px;
            align-items: center;
        }
    }
`;
document.head.appendChild(installBannerStyles);

// ====== ANALYTICS (SIN COOKIES) ======
// Usar Plausible o similar para analíticas respetuosas con la privacidad
// Configuración en el HTML con: data-domain="tusitio.com"

console.log('📱 PWA configurada correctamente');
