// ====== CONFIGURACIÓN ======
const CONFIG = {
    CSV_URL: 'data/productos.csv',
    WHATSAPP_NUMBER: '5351234567', // ¡CAMBIA ESTO!
    WHATSAPP_MESSAGE: 'Hola! Me interesa este producto de GarageShop:',
    PROMO_INTERVAL: 6,
    PRODUCTS_PER_PAGE: 12,
    IMAGE_SIZE: '300x300',
    CACHE_VERSION: 'v1.0.0',
    AUTOCOMPLETE_MIN_CHARS: 2,
    MAX_AUTOCOMPLETE: 8,
};

// ====== ESTADO GLOBAL ======
const state = {
    products: [],
    filteredProducts: [],
    currentCategory: 'all',
    searchTerm: '',
    currentView: 'grid',
    cart: [],
    currentPage: 1,
    isLoading: false,
    allLoaded: false,
    favorites: JSON.parse(localStorage.getItem('garageshop_favorites') || '[]'),
};

// ====== DOM ELEMENTS ======
const DOM = {
    productsContainer: document.getElementById('productsContainer'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    autocompleteList: document.getElementById('autocompleteList'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    productCount: document.getElementById('productCount'),
    totalProducts: document.getElementById('totalProducts'),
    viewToggle: document.getElementById('viewToggle'),
    loader: document.getElementById('loader'),
    whatsappFloat: document.getElementById('whatsappFloat'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    notificationContainer: document.getElementById('notificationContainer'),
};

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupEventListeners();
    setupPWA();
    setupWhatsApp();
    updateTotalCount();
});

// ====== CARGAR PRODUCTOS ======
async function loadProducts() {
    showLoader(true);
    try {
        const response = await fetch(CONFIG.CSV_URL, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) throw new Error('CSV no encontrado');
        
        const csvText = await response.text();
        state.products = parseCSV(csvText);
        
        if (state.products.length === 0) {
            state.products = getSampleProducts();
            showNotification('Usando datos de ejemplo - Conecta tu CSV', 'warning');
        }
        
        state.filteredProducts = [...state.products];
        renderCategories();
        renderProducts();
        updateProductCount();
        updateTotalCount();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        state.products = getSampleProducts();
        state.filteredProducts = [...state.products];
        renderCategories();
        renderProducts();
        updateProductCount();
        updateTotalCount();
        showNotification('⚠️ Usando datos de ejemplo - Conecta tu archivo CSV', 'warning');
    }
    showLoader(false);
}

// ====== PARSEAR CSV ======
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const product = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            
            // Limpiar y formatear
            if (header === 'precio') {
                value = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
            } else if (header === 'destacado') {
                value = value.toLowerCase() === 'si' || value === 'true';
            } else {
                value = value.trim();
            }
            
            product[header] = value;
        });
        
        if (product.nombre && product.precio !== undefined) {
            product.id = product.id || i;
            products.push(product);
        }
    }
    
    return products;
}

// ====== DATOS DE EJEMPLO ======
function getSampleProducts() {
    return [
        { id: 1, nombre: 'Licuadora Oster 5 velocidades', precio: 2500, descripcion: 'Licuadora potente con 5 velocidades ideal para batidos y sopas.', categoria: 'Electrodomésticos', imagen_url: 'https://via.placeholder.com/300x300/f5a623/ffffff?text=Licuadora', destacado: true },
        { id: 2, nombre: 'Set de sábanas 100% algodón', precio: 1800, descripcion: 'Juego de sábanas premium suaves y duraderas.', categoria: 'Hogar', imagen_url: 'https://via.placeholder.com/300x300/2c3e50/ffffff?text=Sabanas', destacado: false },
        { id: 3, nombre: 'Bicicleta 26" multicolor', precio: 4500, descripcion: 'Bicicleta para paseo frenos de disco 21 velocidades.', categoria: 'Deportes', imagen_url: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=Bicicleta', destacado: true },
        { id: 4, nombre: 'Lámpara LED escritorio', precio: 850, descripcion: 'Lámpara LED regulable luz cálida/fría USB recargable.', categoria: 'Electrodomésticos', imagen_url: 'https://via.placeholder.com/300x300/f5a623/ffffff?text=Lampara', destacado: false },
        { id: 5, nombre: 'Cafetera italiana 6 tazas', precio: 1200, descripcion: 'Cafetera de acero inoxidable 6 tazas de café express.', categoria: 'Cocina', imagen_url: 'https://via.placeholder.com/300x300/2c3e50/ffffff?text=Cafetera', destacado: false },
        { id: 6, nombre: 'Mesa de centro moderna', precio: 3200, descripcion: 'Mesa de centro con diseño moderno acabado en madera.', categoria: 'Hogar', imagen_url: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=Mesa', destacado: false },
        { id: 7, nombre: 'Smart TV 32" HD', precio: 6500, descripcion: 'Smart TV con Android resolución HD WiFi integrado.', categoria: 'Electrónicos', imagen_url: 'https://via.placeholder.com/300x300/f5a623/ffffff?text=TV', destacado: true },
        { id: 8, nombre: 'Juego de ollas de acero', precio: 2800, descripcion: 'Set de 5 ollas de acero inoxidable con tapa.', categoria: 'Cocina', imagen_url: 'https://via.placeholder.com/300x300/2c3e50/ffffff?text=Ollas', destacado: false },
        { id: 9, nombre: 'Ventilador de torre silencioso', precio: 3200, descripcion: 'Ventilador de torre con control remoto y 3 velocidades.', categoria: 'Electrodomésticos', imagen_url: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=Ventilador', destacado: false },
        { id: 10, nombre: 'Set de tupperware hermético', precio: 950, descripcion: 'Set de 10 tupperwares herméticos de diferentes tamaños.', categoria: 'Cocina', imagen_url: 'https://via.placeholder.com/300x300/f5a623/ffffff?text=Tupperware', destacado: false },
        { id: 11, nombre: 'Cámara fotográfica digital', precio: 8500, descripcion: 'Cámara digital 20MP con lente intercambiable.', categoria: 'Electrónicos', imagen_url: 'https://via.placeholder.com/300x300/2c3e50/ffffff?text=Camara', destacado: true },
        { id: 12, nombre: 'Juego de pesas 20kg', precio: 4200, descripcion: 'Set de pesas ajustables para entrenamiento en casa.', categoria: 'Deportes', imagen_url: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=Pesas', destacado: false }
    ];
}

// ====== RENDERIZAR CATEGORÍAS ======
function renderCategories() {
    const categories = ['all', ...new Set(state.products.map(p => p.categoria))];
    DOM.categoriesContainer.innerHTML = categories.map(cat => `
        <button class="category-chip ${cat === 'all' ? 'active' : ''}" data-category="${cat}" role="tab" aria-selected="${cat === 'all'}">
            ${cat === 'all' ? '📦 Todos' : cat}
        </button>
    `).join('');
}

// ====== RENDERIZAR PRODUCTOS ======
function renderProducts(resetPage = true) {
    if (resetPage) {
        state.currentPage = 1;
        state.allLoaded = false;
        DOM.loadMoreContainer.style.display = 'none';
    }
    
    const allProducts = getFilteredProducts();
    const start = 0;
    const end = state.currentPage * CONFIG.PRODUCTS_PER_PAGE;
    const products = allProducts.slice(start, end);
    
    if (resetPage) {
        DOM.productsContainer.innerHTML = '';
    }
    
    if (products.length === 0 && resetPage) {
        DOM.productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" aria-hidden="true"></i>
                <h3>No encontramos productos</h3>
                <p>Intenta con otra búsqueda o categoría</p>
            </div>
        `;
        return;
    }
    
    let productHTML = '';
    let promoIndex = 0;
    const currentItems = DOM.productsContainer.children.length;
    const startIndex = resetPage ? 0 : currentItems;
    
    products.forEach((product, index) => {
        const globalIndex = startIndex + index;
        
        // Intercalar promociones
        if (globalIndex > 0 && globalIndex % CONFIG.PROMO_INTERVAL === 0) {
            productHTML += renderPromoBanner(promoIndex);
            promoIndex++;
        }
        
        productHTML += renderProductCard(product);
    });
    
    if (resetPage) {
        DOM.productsContainer.innerHTML = productHTML;
    } else {
        DOM.productsContainer.insertAdjacentHTML('beforeend', productHTML);
    }
    
    // Actualizar vista
    DOM.productsContainer.className = `products-grid ${state.currentView === 'list' ? 'list-view' : ''}`;
    
    // Mostrar/ocultar botón "Cargar más"
    const totalFiltered = getFilteredProducts().length;
    if (end < totalFiltered) {
        DOM.loadMoreContainer.style.display = 'block';
        DOM.loadMoreBtn.textContent = `Cargar más productos (${end}/${totalFiltered})`;
    } else {
        DOM.loadMoreContainer.style.display = 'none';
        if (!resetPage) {
            showNotification('🎉 Todos los productos cargados', 'success');
        }
    }
}

// ====== RENDERIZAR TARJETA DE PRODUCTO ======
function renderProductCard(product) {
    const imageUrl = product.imagen_url || 'https://via.placeholder.com/300x300/cccccc/666666?text=Sin+imagen';
    const isFavorite = state.favorites.includes(product.id);
    
    return `
        <div class="product-card" data-id="${product.id}" itemscope itemtype="https://schema.org/Product">
            ${product.destacado ? '<span class="product-badge">⭐ Destacado</span>' : ''}
            
            <div class="product-image-wrapper">
                <img src="${imageUrl}" alt="${product.nombre}" class="product-image" loading="lazy" width="300" height="300" itemprop="image">
                <button class="btn-favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${product.id})" aria-label="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
                    <i class="fas fa-heart" aria-hidden="true"></i>
                </button>
            </div>
            
            <div class="product-info">
                <h3 class="product-name" itemprop="name">${product.nombre}</h3>
                <div class="product-category">${product.categoria || 'Sin categoría'}</div>
                <div class="product-price" itemprop="price">${product.precio} <span>CUP</span></div>
                <p class="product-desc" itemprop="description">${product.descripcion || ''}</p>
                
                <div class="product-actions">
                    <button class="btn-whatsapp" onclick="contactWhatsApp(${product.id})">
                        <i class="fab fa-whatsapp" aria-hidden="true"></i> Consultar
                    </button>
                    <button class="btn-detail" onclick="showProductDetail(${product.id})" aria-label="Ver detalles">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ====== RENDERIZAR BANNER PROMOCIONAL ======
function renderPromoBanner(index) {
    const promos = [
        {
            title: '🔥 ¡Ofertas Únicas!',
            description: 'Encuentra tesoros escondidos en nuestra tienda de garage',
            image: 'https://via.placeholder.com/800x300/f5a623/ffffff?text=Garage+Sale',
            cta: 'Ver ofertas'
        },
        {
            title: '🛒 Venta de Garage',
            description: 'Todo debe irse - Precios increíbles',
            image: 'https://via.placeholder.com/800x300/2c3e50/ffffff?text=Todo+debe+irse',
            cta: 'Comprar ahora'
        },
        {
            title: '🎁 Productos Nuevos',
            description: 'Actualizamos nuestro catálogo diariamente',
            image: 'https://via.placeholder.com/800x300/e74c3c/ffffff?text=Nuevos+Productos',
            cta: 'Descubrir'
        }
    ];
    
    const promo = promos[index % promos.length];
    return `
        <div class="promo-banner">
            <img src="${promo.image}" alt="${promo.title}" loading="lazy">
            <h3>${promo.title}</h3>
            <p>${promo.description}</p>
            <button class="btn-promo" onclick="window.open('https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Quiero+una+oferta+de+GarageShop', '_blank')">
                ${promo.cta} <i class="fas fa-arrow-right" aria-hidden="true"></i>
            </button>
        </div>
    `;
}

// ====== FILTRAR PRODUCTOS ======
function getFilteredProducts() {
    let filtered = [...state.products];
    
    // Filtrar por categoría
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.categoria === state.currentCategory);
    }
    
    // Filtrar por búsqueda
    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(term) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
            (p.categoria && p.categoria.toLowerCase().includes(term))
        );
    }
    
    return filtered;
}

// ====== ACTUALIZAR CONTADORES ======
function updateProductCount() {
    const count = getFilteredProducts().length;
    const total = state.products.length;
    DOM.productCount.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}${count !== total ? ` (de ${total})` : ''}`;
}

function updateTotalCount() {
    DOM.totalProducts.textContent = state.products.length;
}

// ====== MOSTRAR/OCULTAR LOADER ======
function showLoader(show) {
    DOM.loader.classList.toggle('active', show);
}

// ====== GENERAR LINK DE WHATSAPP ======
function generateWhatsAppLink(product) {
    const message = `${CONFIG.WHATSAPP_MESSAGE}\n\n*${product.nombre}*\n💰 Precio: ${product.precio} CUP\n📂 Categoría: ${product.categoria || 'General'}\n\n${product.descripcion || ''}`;
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// ====== CONTACTAR POR WHATSAPP ======
window.contactWhatsApp = function(productId) {
    const product = state.products.find(p => p.id == productId);
    if (product) {
        window.open(generateWhatsAppLink(product), '_blank');
    }
};

// ====== MOSTRAR DETALLE DEL PRODUCTO ======
window.showProductDetail = function(productId) {
    const product = state.products.find(p => p.id == productId);
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="modal-image">
                <img src="${product.imagen_url || 'https://via.placeholder.com/500'}" alt="${product.nombre}">
            </div>
            <div class="modal-info">
                <h2>${product.nombre}</h2>
                <span class="modal-category">${product.categoria || 'Sin categoría'}</span>
                <div class="modal-price">${product.precio} CUP</div>
                <p class="modal-description">${product.descripcion || 'Sin descripción disponible'}</p>
                <button class="btn-whatsapp" onclick="contactWhatsApp(${product.id}); this.closest('.modal-overlay').remove();">
                    <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.remove();
    });
};

// ====== FAVORITOS ======
window.toggleFavorite = function(productId) {
    const index = state.favorites.indexOf(productId);
    if (index > -1) {
        state.favorites.splice(index, 1);
        showNotification('❤️ Eliminado de favoritos', 'warning');
    } else {
        state.favorites.push(productId);
        showNotification('❤️ Añadido a favoritos', 'success');
    }
    localStorage.setItem('garageshop_favorites', JSON.stringify(state.favorites));
    
    // Actualizar UI
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (card.dataset.id == productId) {
            const btn = card.querySelector('.btn-favorite');
            if (btn) {
                btn.classList.toggle('active');
                btn.setAttribute('aria-label', btn.classList.contains('active') ? 'Quitar de favoritos' : 'Añadir a favoritos');
            }
        }
    });
};

// ====== ACTUALIZAR AUTOCOMPLETAR ======
function updateAutocomplete(searchTerm) {
    if (!searchTerm || searchTerm.length < CONFIG.AUTOCOMPLETE_MIN_CHARS) {
        DOM.autocompleteList.classList.remove('active');
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const suggestions = state.products
        .filter(p => p.nombre.toLowerCase().includes(term))
        .slice(0, CONFIG.MAX_AUTOCOMPLETE);
    
    if (suggestions.length === 0) {
        DOM.autocompleteList.classList.remove('active');
        return;
    }
    
    DOM.autocompleteList.innerHTML = suggestions.map(p => `
        <div class="autocomplete-item" data-id="${p.id}" role="option">
            <img src="${p.imagen_url || 'https://via.placeholder.com/50'}" alt="${p.nombre}" loading="lazy">
            <div>
                <div class="name">${p.nombre}</div>
                <div class="category">${p.categoria || 'General'}</div>
            </div>
            <div class="price">${p.precio} CUP</div>
        </div>
    `).join('');
    
    DOM.autocompleteList.classList.add('active');
    
    // Click en sugerencia
    DOM.autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const product = state.products.find(p => p.id === id);
            if (product) {
                DOM.searchInput.value = product.nombre;
                state.searchTerm = product.nombre;
                DOM.autocompleteList.classList.remove('active');
                filterProducts();
                DOM.searchInput.focus();
            }
        });
    });
}

// ====== FILTRAR PRODUCTOS ======
function filterProducts() {
    state.filteredProducts = getFilteredProducts();
    renderProducts(true);
    updateProductCount();
}

// ====== CONFIGURAR WHATSAPP ======
function setupWhatsApp() {
    if (DOM.whatsappFloat) {
        DOM.whatsappFloat.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`;
    }
}

// ====== NOTIFICACIONES ======
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    DOM.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// ====== CONFIGURAR EVENT LISTENERS ======
function setupEventListeners() {
    // Búsqueda
    DOM.searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        state.searchTerm = value;
        DOM.clearSearch.style.display = value ? 'block' : 'none';
        updateAutocomplete(value);
        filterProducts();
    });
    
    DOM.clearSearch.addEventListener('click', () => {
        DOM.searchInput.value = '';
        state.searchTerm = '';
        DOM.clearSearch.style.display = 'none';
        DOM.autocompleteList.classList.remove('active');
        filterProducts();
        DOM.searchInput.focus();
    });
    
    // Click fuera del autocompletar
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box') && !e.target.closest('.autocomplete-list')) {
            DOM.autocompleteList.classList.remove('active');
        }
    });
    
    // Categorías
    DOM.categoriesContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        
        DOM.categoriesContainer.querySelectorAll('.category-chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
        
        state.currentCategory = chip.dataset.category;
        filterProducts();
        showNotification(`Filtrando por: ${chip.dataset.category === 'all' ? 'Todos' : chip.dataset.category}`, 'info');
    });
    
    // Cambiar vista
    DOM.viewToggle.addEventListener('click', () => {
        state.currentView = state.currentView === 'grid' ? 'list' : 'grid';
        DOM.viewToggle.innerHTML = `<i class="fas fa-${state.currentView === 'grid' ? 'list' : 'th'}" aria-hidden="true"></i>`;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === state.currentView);
            btn.setAttribute('aria-pressed', btn.dataset.view === state.currentView);
        });
        
        renderProducts(true);
        showNotification(`Vista: ${state.currentView === 'grid' ? 'Cuadrícula' : 'Lista'}`, 'info');
    });
    
    // Vista desde botones
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            
            state.currentView = btn.dataset.view;
            renderProducts(true);
        });
    });
    
    // Cargar más
    DOM.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        renderProducts(false);
    });
    
    // Teclas rápidas
    document.addEventListener('keydown', (e) => {
        // Ctrl + F para buscar
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            DOM.searchInput.focus();
            DOM.searchInput.select();
        }
        
        // Escape para cerrar
        if (e.key === 'Escape') {
            DOM.autocompleteList.classList.remove('active');
            DOM.searchInput.blur();
        }
    });
}

// ====== CONFIGURAR PWA ======
function setupPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('✅ Service Worker registrado'))
                .catch(err => console.log('❌ Error SW:', err));
        });
    }
    
    // Detectar instalación
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
}

function showInstallPrompt() {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-download" aria-hidden="true"></i>
        Instala GarageShop en tu dispositivo
        <button onclick="installApp()" style="margin-left:15px;background:white;color:#2c3e50;border:none;padding:5px 15px;border-radius:5px;font-weight:bold;cursor:pointer;">
            Instalar
        </button>
    `;
    DOM.notificationContainer.appendChild(notification);
}

window.installApp = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('🎉 GarageShop instalado exitosamente', 'success');
            }
            deferredPrompt = null;
        });
    }
};

// ====== ESTILOS DEL MODAL ======
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .modal-content {
        background: white;
        border-radius: var(--border-radius);
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: scaleIn 0.3s ease;
    }
    
    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0,0,0,0.1);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        transition: var(--transition);
        z-index: 1;
    }
    
    .modal-close:hover {
        background: rgba(0,0,0,0.2);
        transform: scale(1.1);
    }
    
    .modal-image img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
    }
    
    .modal-info {
        padding: 30px;
    }
    
    .modal-info h2 {
        font-family: var(--font-title);
        color: var(--secondary);
        margin-bottom: 5px;
    }
    
    .modal-category {
        color: var(--text-light);
        font-size: 0.9rem;
        display: block;
        margin-bottom: 15px;
    }
    
    .modal-price {
        font-size: 2rem;
        font-weight: 800;
        color: var(--primary-dark);
        margin-bottom: 15px;
    }
    
    .modal-description {
        color: var(--text-light);
        margin-bottom: 20px;
        line-height: 1.8;
    }
    
    .modal-info .btn-whatsapp {
        width: 100%;
        padding: 15px;
        font-size: 1.1rem;
    }
    
    .btn-favorite {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(255,255,255,0.9);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        transition: var(--transition);
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ccc;
    }
    
    .btn-favorite:hover {
        transform: scale(1.1);
    }
    
    .btn-favorite.active {
        color: var(--accent);
        background: rgba(231, 76, 60, 0.1);
    }
    
    .btn-favorite.active i {
        animation: heartBeat 0.5s ease;
    }
    
    @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
    }
    
    @media (max-width: 768px) {
        .modal-image img {
            height: 200px;
        }
        .modal-info {
            padding: 20px;
        }
        .modal-price {
            font-size: 1.5rem;
        }
    }
`;
document.head.appendChild(modalStyles);

// ====== CONSOLA ======
console.log('🚀 GarageShop cargado exitosamente!');
console.log(`📦 ${state.products.length} productos disponibles`);
console.log(`🏷️ ${new Set(state.products.map(p => p.categoria)).size} categorías`);
console.log(`📱 Modo: PWA ready`);
