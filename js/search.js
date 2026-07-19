// ====== BÚSQUEDA AVANZADA ======

class SearchEngine {
    constructor(products) {
        this.products = products;
        this.index = this.buildIndex();
    }
    
    // Construir índice de búsqueda
    buildIndex() {
        return this.products.map(p => ({
            ...p,
            searchTokens: this.tokenize(p.nombre + ' ' + (p.descripcion || '') + ' ' + (p.categoria || ''))
        }));
    }
    
    // Tokenizar texto
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9áéíóúñ ]/g, '')
            .split(' ')
            .filter(t => t.length > 1);
    }
    
    // Buscar con relevancia
    search(query) {
        if (!query || query.length < 2) return [];
        
        const tokens = this.tokenize(query);
        const results = [];
        
        this.index.forEach(product => {
            let score = 0;
            
            tokens.forEach(token => {
                // Búsqueda exacta en nombre (mayor peso)
                if (product.nombre.toLowerCase().includes(token)) {
                    score += 10;
                }
                // Búsqueda en descripción
                if (product.descripcion && product.descripcion.toLowerCase().includes(token)) {
                    score += 5;
                }
                // Búsqueda en categoría
                if (product.categoria && product.categoria.toLowerCase().includes(token)) {
                    score += 3;
                }
                // Búsqueda en tokens
                product.searchTokens.forEach(t => {
                    if (t.includes(token) || token.includes(t)) {
                        score += 2;
                    }
                });
            });
            
            if (score > 0) {
                results.push({ ...product, score });
            }
        });
        
        // Ordenar por relevancia
        return results.sort((a, b) => b.score - a.score);
    }
    
    // Obtener sugerencias
    getSuggestions(query, limit = 8) {
        const results = this.search(query);
        return results.slice(0, limit);
    }
}

// ====== INICIALIZAR BUSCADOR ======
let searchEngine = null;

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que carguen los productos
    const checkProducts = setInterval(() => {
        if (state.products && state.products.length > 0) {
            searchEngine = new SearchEngine(state.products);
            clearInterval(checkProducts);
            console.log('🔍 Motor de búsqueda inicializado');
        }
    }, 100);
});

// ====== FUNCIONES DE BÚSQUEDA GLOBALES ======

window.searchProducts = function(query) {
    if (!searchEngine) return [];
    return searchEngine.search(query);
};

window.getSuggestions = function(query, limit = 8) {
    if (!searchEngine) return [];
    return searchEngine.getSuggestions(query, limit);
};

// ====== BÚSQUEDA POR VOZ (OPCIONAL) ======
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Agregar botón de voz
    document.addEventListener('DOMContentLoaded', () => {
        const searchBox = document.querySelector('.search-box');
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'btn-voice';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.setAttribute('aria-label', 'Buscar por voz');
        voiceBtn.title = 'Buscar por voz';
        
        voiceBtn.addEventListener('click', () => {
            recognition.start();
            voiceBtn.classList.add('listening');
        });
        
        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            DOM.searchInput.value = transcript;
            state.searchTerm = transcript;
            filterProducts();
            voiceBtn.classList.remove('listening');
        });
        
        recognition.addEventListener('end', () => {
            voiceBtn.classList.remove('listening');
        });
        
        searchBox.appendChild(voiceBtn);
    });
    
    // Estilos del botón de voz
    const voiceStyles = document.createElement('style');
    voiceStyles.textContent = `
        .btn-voice {
            background: none;
            border: none;
            color: var(--text-light);
            padding: 8px 12px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: var(--transition);
            border-radius: 50%;
        }
        
        .btn-voice:hover {
            background: rgba(245, 166, 35, 0.1);
            color: var(--primary);
        }
        
        .btn-voice.listening {
            color: var(--accent);
            animation: pulse 1s infinite;
        }
        
        .btn-voice.listening i {
            color: var(--accent);
        }
    `;
    document.head.appendChild(voiceStyles);
}
