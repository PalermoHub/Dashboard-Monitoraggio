// ==========================================
// MAP LAYER SWITCHER - VERSIONE OTTIMIZZATA
// Gestione completa e robusta del cambio layer mappa
// ==========================================

/**
 * Configurazione layer disponibili
 */
const MAP_LAYERS = {
    standard: {
        name: 'Standard',
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
        options: {
            maxZoom: 18,
            subdomains: ['a', 'b', 'c']
        }
    },
    satellite: {
        name: 'Satellite',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Satellite - 2025',
        options: {
            maxZoom: 18,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
    }
};

/**
 * Classe per gestire il Layer Switcher
 */
class MapLayerSwitcher {
    constructor(map) {
        // Gestione robusta dell'istanza mappa
        this.map = this.getMapInstance(map);
        this.currentLayer = null;
        this.currentLayerType = 'standard';
        this.initialized = false;
        
        // Elementi DOM
        this.elements = {
            toggle: null,
            menu: null,
            standardBtn: null,
            satelliteBtn: null
        };
        
        console.log('🗺️ MapLayerSwitcher inizializzato');
    }

    /**
     * Ottiene l'istanza corretta della mappa Leaflet
     */
    getMapInstance(mapRef) {
        // Prova diverse fonti per la mappa
        const candidates = [
            mapRef,
            window.map,
            typeof map !== 'undefined' ? map : null
        ];

        for (const candidate of candidates) {
            if (this.isValidLeafletMap(candidate)) {
                console.log('✅ Istanza mappa valida trovata');
                return candidate;
            }
        }

        console.error('❌ Nessuna istanza mappa valida trovata');
        return null;
    }

    /**
     * Verifica se l'oggetto è una mappa Leaflet valida
     */
    isValidLeafletMap(obj) {
        return obj && 
               typeof obj === 'object' && 
               typeof obj.removeLayer === 'function' &&
               typeof obj.addLayer === 'function' &&
               typeof obj.eachLayer === 'function';
    }

    /**
     * Inizializza il layer switcher
     */
    init() {
        if (this.initialized) {
            console.warn('⚠️ Layer switcher già inizializzato');
            return false;
        }

        // Ri-verifica mappa (potrebbe essere stata inizializzata dopo il constructor)
        if (!this.map || !this.isValidLeafletMap(this.map)) {
            console.log('🔄 Tentativo di recuperare istanza mappa...');
            this.map = this.getMapInstance(null);
        }

        // Verifica mappa
        if (!this.map || !this.isValidLeafletMap(this.map)) {
            console.error('❌ Mappa non disponibile o non valida');
            return false;
        }

        // Trova elementi DOM
        if (!this.findElements()) {
            console.error('❌ Elementi DOM non trovati');
            return false;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Applica layer iniziale
        this.switchLayer('standard', false);

        this.initialized = true;
        console.log('✅ Layer switcher inizializzato con successo');
        return true;
    }

    /**
     * Trova tutti gli elementi DOM necessari
     */
    findElements() {
        this.elements.toggle = document.getElementById('layerToggle');
        this.elements.menu = document.getElementById('layerMenu');
        this.elements.standardBtn = document.getElementById('mapStandard');
        this.elements.satelliteBtn = document.getElementById('mapSatellite');

        const allFound = Object.values(this.elements).every(el => el !== null);
        
        if (!allFound) {
            console.error('❌ Elementi mancanti:', {
                toggle: !!this.elements.toggle,
                menu: !!this.elements.menu,
                standardBtn: !!this.elements.standardBtn,
                satelliteBtn: !!this.elements.satelliteBtn
            });
        }

        return allFound;
    }

    /**
     * Setup event listeners con gestione robusta
     */
    setupEventListeners() {
        // Toggle menu
        if (this.elements.toggle) {
            // Rimuovi vecchi listener clonando
            const newToggle = this.elements.toggle.cloneNode(true);
            this.elements.toggle.parentNode.replaceChild(newToggle, this.elements.toggle);
            this.elements.toggle = newToggle;

            this.elements.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click su toggle layer');
                this.toggleMenu();
            });
            
            // Debug: verifica che il listener sia attivo
            console.log('✅ Toggle listener configurato su:', this.elements.toggle);
        } else {
            console.error('❌ Elemento toggle non trovato!');
        }

        // Pulsante Standard
        if (this.elements.standardBtn) {
            const newStandardBtn = this.elements.standardBtn.cloneNode(true);
            this.elements.standardBtn.parentNode.replaceChild(newStandardBtn, this.elements.standardBtn);
            this.elements.standardBtn = newStandardBtn;

            this.elements.standardBtn.addEventListener('click', () => {
                this.switchLayer('standard');
                this.hideMenu();
            });
            console.log('✅ Pulsante Standard configurato');
        }

        // Pulsante Satellite
        if (this.elements.satelliteBtn) {
            const newSatelliteBtn = this.elements.satelliteBtn.cloneNode(true);
            this.elements.satelliteBtn.parentNode.replaceChild(newSatelliteBtn, this.elements.satelliteBtn);
            this.elements.satelliteBtn = newSatelliteBtn;

            this.elements.satelliteBtn.addEventListener('click', () => {
                this.switchLayer('satellite');
                this.hideMenu();
            });
            console.log('✅ Pulsante Satellite configurato');
        }

        // Chiudi menu cliccando fuori
        document.addEventListener('click', (e) => {
            if (this.elements.menu && 
                !this.elements.menu.contains(e.target) && 
                !this.elements.toggle.contains(e.target)) {
                this.hideMenu();
            }
        });
    }

    /**
     * Cambia layer mappa
     */
    switchLayer(layerType, showNotification = true) {
        if (!MAP_LAYERS[layerType]) {
            console.error('❌ Layer type non valido:', layerType);
            return false;
        }

        console.log(`🔄 Cambio layer a: ${layerType}`);

        // Re-verifica mappa prima di operare
        if (!this.map || !this.isValidLeafletMap(this.map)) {
            console.log('🔄 Mappa non valida, tentativo recupero...');
            this.map = this.getMapInstance(null);
            
            if (!this.map || !this.isValidLeafletMap(this.map)) {
                console.error('❌ Impossibile recuperare istanza mappa valida');
                this.showNotification('Errore: mappa non disponibile', 'error');
                return false;
            }
        }

        try {
            // Rimuovi layer corrente se esiste
            if (this.currentLayer) {
                console.log('🗑️ Rimozione layer precedente...');
                
                try {
                    this.map.removeLayer(this.currentLayer);
                    console.log('✅ Layer precedente rimosso');
                } catch (removeError) {
                    console.warn('⚠️ Errore rimozione layer:', removeError);
                    // Prova metodo alternativo
                    this.forceRemoveAllTileLayers();
                }
            }

            // Crea nuovo layer
            const config = MAP_LAYERS[layerType];
            console.log('🎨 Creazione nuovo layer:', config.name);
            
            this.currentLayer = L.tileLayer(config.url, {
                attribution: config.attribution,
                ...config.options
            });

            // Aggiungi alla mappa
            console.log('➕ Aggiunta layer alla mappa...');
            this.currentLayer.addTo(this.map);
            this.currentLayerType = layerType;

            // Aggiorna UI
            this.updateUI();

            // Refresh mappa
            setTimeout(() => {
                if (this.map && typeof this.map.invalidateSize === 'function') {
                    this.map.invalidateSize();
                    console.log('🔄 Mappa aggiornata');
                }
            }, 100);

            console.log(`✅ Layer ${layerType} attivato con successo`);

            // Notifica utente
            if (showNotification) {
                this.showNotification(
                    `Mappa ${config.name} attivata`, 
                    'success'
                );
            }

            return true;

        } catch (error) {
            console.error('❌ Errore cambio layer:', error);
            console.error('Stack trace:', error.stack);
            
            // Diagnostica dettagliata
            console.log('🔍 Diagnostica mappa:', {
                mapExists: !!this.map,
                isValidMap: this.isValidLeafletMap(this.map),
                hasRemoveLayer: this.map && typeof this.map.removeLayer === 'function',
                hasAddLayer: this.map && typeof this.map.addLayer === 'function',
                currentLayerExists: !!this.currentLayer
            });
            
            // NON fare fallback per evitare loop infinito
            this.showNotification('Errore nel cambio mappa', 'error');
            return false;
        }
    }

    /**
     * Forza rimozione di tutti i tile layer (metodo alternativo)
     */
    forceRemoveAllTileLayers() {
        console.log('🧹 Pulizia forzata tile layers...');
        
        if (!this.map || !this.map.eachLayer) {
            console.warn('⚠️ Impossibile iterare layer');
            return;
        }

        try {
            const layersToRemove = [];
            
            this.map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    layersToRemove.push(layer);
                }
            });

            layersToRemove.forEach(layer => {
                try {
                    this.map.removeLayer(layer);
                    console.log('✅ Tile layer rimosso');
                } catch (e) {
                    console.warn('⚠️ Errore rimozione singolo layer:', e);
                }
            });

            console.log(`🧹 Rimossi ${layersToRemove.length} tile layers`);
        } catch (error) {
            console.error('❌ Errore pulizia forzata:', error);
        }
    }

    /**
     * Aggiorna UI pulsanti
     */
    updateUI() {
        if (!this.elements.standardBtn || !this.elements.satelliteBtn) {
            return;
        }

        const activeClasses = 'layer-option active';
        const inactiveClasses = 'layer-option';

        if (this.currentLayerType === 'standard') {
            this.elements.standardBtn.className = activeClasses;
            this.elements.satelliteBtn.className = inactiveClasses;
        } else {
            this.elements.standardBtn.className = inactiveClasses;
            this.elements.satelliteBtn.className = activeClasses;
        }

        console.log('✅ UI aggiornata per:', this.currentLayerType);
    }

    /**
     * Toggle menu visibilità
     */
    toggleMenu() {
        if (!this.elements.menu) {
            console.error('❌ Menu element non trovato');
            return;
        }

        const isHidden = this.elements.menu.classList.contains('hidden');
        
        console.log('🔄 Toggle menu - stato attuale:', isHidden ? 'nascosto' : 'visibile');
        
        if (isHidden) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
        
        // Debug visibilità
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(this.elements.menu);
            console.log('📊 Menu dopo toggle:', {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                classList: Array.from(this.elements.menu.classList)
            });
        }, 100);
    }

    /**
     * Mostra menu
     */
    showMenu() {
        if (!this.elements.menu) return;
        
        console.log('📋 Apertura menu layer...');
        
        // Rimuovi classe hidden
        this.elements.menu.classList.remove('hidden');
        
        // Forza display block
        this.elements.menu.style.display = 'block';
        this.elements.menu.style.visibility = 'visible';
        this.elements.menu.style.opacity = '1';
        this.elements.menu.style.pointerEvents = 'auto';
        
        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', 'true');
            this.elements.toggle.classList.add('active');
        }
        
        console.log('✅ Menu layer mostrato');
    }

    /**
     * Nascondi menu
     */
    hideMenu() {
        if (!this.elements.menu) return;
        
        console.log('📋 Chiusura menu layer...');
        
        // Aggiungi classe hidden
        this.elements.menu.classList.add('hidden');
        
        // Forza hide
        this.elements.menu.style.display = 'none';
        this.elements.menu.style.visibility = 'hidden';
        this.elements.menu.style.opacity = '0';
        this.elements.menu.style.pointerEvents = 'none';
        
        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', 'false');
            this.elements.toggle.classList.remove('active');
        }
        
        console.log('✅ Menu layer nascosto');
    }

    /**
     * Mostra notifica
     */
    showNotification(message, type = 'info') {
        // Usa la funzione esistente se disponibile
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Fallback: notifica semplice
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Diagnostica stato
     */
    diagnose() {
        console.log('🔍 DIAGNOSTICA LAYER SWITCHER');
        console.log('================================');
        console.log('Inizializzato:', this.initialized);
        console.log('Mappa presente:', !!this.map);
        console.log('Layer corrente:', this.currentLayerType);
        console.log('Layer object:', !!this.currentLayer);
        console.log('Elementi DOM:', {
            toggle: !!this.elements.toggle,
            menu: !!this.elements.menu,
            standardBtn: !!this.elements.standardBtn,
            satelliteBtn: !!this.elements.satelliteBtn
        });
        console.log('================================');
        
        return {
            initialized: this.initialized,
            hasMap: !!this.map,
            currentLayer: this.currentLayerType,
            elementsOk: Object.values(this.elements).every(el => el !== null)
        };
    }

    /**
     * Reset completo
     */
    reset() {
        console.log('🔄 Reset layer switcher...');
        
        // Rimuovi layer corrente
        if (this.currentLayer && this.map) {
            try {
                this.map.removeLayer(this.currentLayer);
            } catch (e) {
                console.warn('Errore rimozione layer:', e);
            }
        }
        
        this.currentLayer = null;
        this.currentLayerType = 'standard';
        this.initialized = false;
        
        // Nascondi menu
        this.hideMenu();
        
        console.log('✅ Layer switcher resettato');
    }
}

// ==========================================
// INIZIALIZZAZIONE GLOBALE
// ==========================================

let mapLayerSwitcherInstance = null;

/**
 * Inizializza il layer switcher globalmente
 */
function initMapLayerSwitcher() {
    console.log('🚀 Inizializzazione MapLayerSwitcher...');
    
    // Trova l'istanza mappa da diverse fonti possibili
    let mapInstance = null;
    
    // Prova 1: window.map
    if (window.map && typeof window.map.removeLayer === 'function') {
        mapInstance = window.map;
        console.log('✅ Mappa trovata in window.map');
    }
    // Prova 2: variabile globale map
    else if (typeof map !== 'undefined' && typeof map.removeLayer === 'function') {
        mapInstance = map;
        console.log('✅ Mappa trovata nella variabile globale map');
    }
    // Prova 3: cerca nell'oggetto window
    else {
        for (const key in window) {
            const obj = window[key];
            if (obj && 
                typeof obj === 'object' && 
                typeof obj.removeLayer === 'function' &&
                typeof obj.addLayer === 'function') {
                mapInstance = obj;
                console.log('✅ Mappa trovata in window.' + key);
                break;
            }
        }
    }
    
    if (!mapInstance) {
        console.warn('⚠️ Mappa non ancora disponibile, riprovo tra 500ms');
        setTimeout(initMapLayerSwitcher, 500);
        return false;
    }
    
    console.log('🗺️ Istanza mappa verificata:', {
        hasRemoveLayer: typeof mapInstance.removeLayer === 'function',
        hasAddLayer: typeof mapInstance.addLayer === 'function',
        hasEachLayer: typeof mapInstance.eachLayer === 'function'
    });
    
    // Distruggi istanza precedente se esiste
    if (mapLayerSwitcherInstance) {
        mapLayerSwitcherInstance.reset();
    }
    
    // Crea nuova istanza con la mappa verificata
    mapLayerSwitcherInstance = new MapLayerSwitcher(mapInstance);
    
    // Inizializza
    const success = mapLayerSwitcherInstance.init();
    
    if (success) {
        // Esponi globalmente
        window.mapLayerSwitcher = mapLayerSwitcherInstance;
        console.log('✅ MapLayerSwitcher pronto e disponibile globalmente');
        
        // Test automatico
        setTimeout(() => {
            console.log('🧪 Test automatico funzionalità...');
            const diagnosis = mapLayerSwitcherInstance.diagnose();
            console.log('📊 Risultati diagnostica:', diagnosis);
        }, 1000);
        
        return true;
    } else {
        console.error('❌ Errore inizializzazione MapLayerSwitcher');
        return false;
    }
}

// ==========================================
// FUNZIONI DI UTILITÀ GLOBALI
// ==========================================

/**
 * Cambia layer (wrapper per retrocompatibilità)
 */
window.switchMapLayer = function(layerType) {
    if (!mapLayerSwitcherInstance) {
        console.error('❌ Layer switcher non inizializzato');
        initMapLayerSwitcher();
        
        setTimeout(() => {
            if (mapLayerSwitcherInstance) {
                mapLayerSwitcherInstance.switchLayer(layerType);
            }
        }, 500);
        return;
    }
    
    mapLayerSwitcherInstance.switchLayer(layerType);
};

/**
 * Diagnostica layer switcher
 */
window.diagnoseLayerSwitcher = function() {
    if (!mapLayerSwitcherInstance) {
        console.error('❌ Layer switcher non inizializzato');
        return null;
    }
    
    return mapLayerSwitcherInstance.diagnose();
};

/**
 * Reset layer switcher
 */
window.resetLayerSwitcher = function() {
    if (mapLayerSwitcherInstance) {
        mapLayerSwitcherInstance.reset();
    }
    initMapLayerSwitcher();
};

/**
 * Debug completo dello stato della mappa
 */
window.debugMapState = function() {
    console.log('🔍 ===== DEBUG STATO MAPPA =====');
    
    // 1. Variabili globali
    console.log('📦 Variabili globali:');
    console.log('  window.map:', !!window.map);
    console.log('  global map:', typeof map !== 'undefined' ? !!map : false);
    
    // 2. Trova istanza mappa
    let mapInstance = null;
    let mapLocation = 'non trovata';
    
    if (window.map && typeof window.map.removeLayer === 'function') {
        mapInstance = window.map;
        mapLocation = 'window.map';
    } else if (typeof map !== 'undefined' && typeof map.removeLayer === 'function') {
        mapInstance = map;
        mapLocation = 'global map';
    }
    
    console.log('📍 Istanza mappa:', mapLocation);
    
    if (mapInstance) {
        console.log('✅ Mappa Leaflet valida:');
        console.log('  - removeLayer:', typeof mapInstance.removeLayer === 'function');
        console.log('  - addLayer:', typeof mapInstance.addLayer === 'function');
        console.log('  - eachLayer:', typeof mapInstance.eachLayer === 'function');
        console.log('  - invalidateSize:', typeof mapInstance.invalidateSize === 'function');
        
        // Conta layer
        let tileLayerCount = 0;
        let markerCount = 0;
        let otherCount = 0;
        
        try {
            mapInstance.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    tileLayerCount++;
                    console.log('    🗺️ TileLayer:', layer._url || 'unknown');
                } else if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                    markerCount++;
                } else {
                    otherCount++;
                }
            });
            
            console.log('  📊 Layer sulla mappa:');
            console.log('    - Tile Layers:', tileLayerCount);
            console.log('    - Markers:', markerCount);
            console.log('    - Altri:', otherCount);
        } catch (e) {
            console.error('  ❌ Errore nel contare layer:', e);
        }
    } else {
        console.error('❌ Nessuna istanza mappa valida trovata');
    }
    
    // 3. Layer Switcher
    console.log('🔧 Layer Switcher:');
    console.log('  Instance exists:', !!mapLayerSwitcherInstance);
    if (mapLayerSwitcherInstance) {
        console.log('  Initialized:', mapLayerSwitcherInstance.initialized);
        console.log('  Current layer:', mapLayerSwitcherInstance.currentLayerType);
        console.log('  Map reference valid:', 
            mapLayerSwitcherInstance.isValidLeafletMap(mapLayerSwitcherInstance.map));
    }
    
    // 4. Elementi DOM
    console.log('🖼️ Elementi DOM:');
    const elements = {
        layerToggle: !!document.getElementById('layerToggle'),
        layerMenu: !!document.getElementById('layerMenu'),
        mapStandard: !!document.getElementById('mapStandard'),
        mapSatellite: !!document.getElementById('mapSatellite')
    };
    console.table(elements);
    
    // 5. Verifica visibilità menu
    const menuElement = document.getElementById('layerMenu');
    if (menuElement) {
        const computedStyle = window.getComputedStyle(menuElement);
        console.log('👁️ Visibilità Menu:');
        console.log('  - display:', computedStyle.display);
        console.log('  - visibility:', computedStyle.visibility);
        console.log('  - opacity:', computedStyle.opacity);
        console.log('  - classList:', Array.from(menuElement.classList));
        console.log('  - offsetWidth:', menuElement.offsetWidth);
        console.log('  - offsetHeight:', menuElement.offsetHeight);
    }
    
    // 6. Test event listener
    const toggleBtn = document.getElementById('layerToggle');
    if (toggleBtn) {
        console.log('🖱️ Event Listeners sul toggle:');
        console.log('  - onclick:', toggleBtn.onclick);
        console.log('  - Puoi testare cliccando con: document.getElementById("layerToggle").click()');
    }
    
    console.log('===== FINE DEBUG =====');
    
    return {
        mapFound: !!mapInstance,
        mapLocation,
        layerSwitcherReady: mapLayerSwitcherInstance?.initialized || false,
        elementsOk: Object.values(elements).every(v => v),
        menuElement: !!menuElement
    };
};

/**
 * Test manuale apertura menu CON FEEDBACK VISIVO
 */
window.testToggleMenu = function() {
    console.log('🧪 TEST MANUALE TOGGLE MENU');
    
    if (!mapLayerSwitcherInstance) {
        console.error('❌ Layer switcher non inizializzato');
        alert('❌ Layer switcher non inizializzato!');
        return;
    }
    
    console.log('📋 Forzo apertura menu...');
    mapLayerSwitcherInstance.showMenu();
    
    // Aggiungi bordo rosso al menu per debug visivo
    const menu = document.getElementById('layerMenu');
    if (menu) {
        menu.style.border = '4px solid red !important';
        menu.style.boxShadow = '0 0 0 4px rgba(255,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3) !important';
        
        setTimeout(() => {
            const rect = menu.getBoundingClientRect();
            console.log('📐 Posizione menu:', {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });
            
            alert(`Menu aperto! Posizione: top=${rect.top}px, left=${rect.left}px. Cerca un box con bordo rosso!`);
        }, 100);
    }
    
    setTimeout(() => {
        console.log('📋 Forzo chiusura menu...');
        mapLayerSwitcherInstance.hideMenu();
        
        if (menu) {
            menu.style.border = '';
            menu.style.boxShadow = '';
        }
    }, 5000);
    
    console.log('✅ Test completato (menu resterà aperto per 5 secondi con bordo rosso)');
};

/**
 * Evidenzia visivamente TUTTI gli elementi del layer switcher
 */
window.highlightLayerElements = function() {
    console.log('🎨 EVIDENZIAZIONE ELEMENTI LAYER SWITCHER');
    
    const elements = {
        toggle: document.getElementById('layerToggle'),
        menu: document.getElementById('layerMenu'),
        standard: document.getElementById('mapStandard'),
        satellite: document.getElementById('mapSatellite')
    };
    
    const colors = {
        toggle: 'blue',
        menu: 'red',
        standard: 'green',
        satellite: 'orange'
    };
    
    Object.keys(elements).forEach(key => {
        const el = elements[key];
        if (el) {
            el.style.border = `4px solid ${colors[key]} !important`;
            el.style.boxShadow = `0 0 0 4px rgba(255,0,0,0.3) !important`;
            el.style.zIndex = '99999 !important';
            console.log(`✅ ${key} evidenziato in ${colors[key]}`);
            
            const rect = el.getBoundingClientRect();
            console.log(`  Posizione ${key}:`, {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                display: window.getComputedStyle(el).display,
                visibility: window.getComputedStyle(el).visibility
            });
        } else {
            console.error(`❌ ${key} non trovato`);
        }
    });
    
    alert('Elementi evidenziati! Cerca:\n- Toggle (blu)\n- Menu (rosso)\n- Standard (verde)\n- Satellite (arancione)');
    
    // Rimuovi evidenziazione dopo 10 secondi
    setTimeout(() => {
        Object.values(elements).forEach(el => {
            if (el) {
                el.style.border = '';
                el.style.boxShadow = '';
                el.style.zIndex = '';
            }
        });
        console.log('🎨 Evidenziazione rimossa');
    }, 10000);
};

/**
 * Forza click sul pulsante toggle
 */
window.forceToggleClick = function() {
    console.log('🖱️ FORZA CLICK SUL TOGGLE');
    const toggleBtn = document.getElementById('layerToggle');
    
    if (!toggleBtn) {
        console.error('❌ Pulsante toggle non trovato');
        return;
    }
    
    console.log('✅ Simulazione click...');
    toggleBtn.click();
    
    setTimeout(() => {
        const menu = document.getElementById('layerMenu');
        if (menu) {
            console.log('📊 Stato menu dopo click:', {
                hidden: menu.classList.contains('hidden'),
                display: window.getComputedStyle(menu).display
            });
        }
    }, 100);
};

// ==========================================
// AUTO-INIZIALIZZAZIONE
// ==========================================

if (typeof document !== 'undefined') {
    // Aspetta che tutto sia caricato
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Aspetta che la mappa sia inizializzata
            setTimeout(initMapLayerSwitcher, 1500);
        });
    } else {
        // DOM già caricato
        setTimeout(initMapLayerSwitcher, 1500);
    }
}

// ==========================================
// CSS ANIMATIONS E STILI FORZATI - VERSIONE DEFINITIVA
// ==========================================

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.id = 'map-layer-switcher-styles';
    style.textContent = `
        @keyframes slideInLeft {
            from {
                transform: translateX(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        /* STILI FORZATI PER MAP CONTROLS CONTAINER */
.map-controls {
    position: absolute !important;
    top: 80px !important; /* Sotto i controlli zoom (80px altezza zoom + 10px gap + 8px) */
    left: 10px !important;
    z-index: 1001 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    pointer-events: auto !important;
}

.map-control svg,
.map-control i {
    width: 18px !important;  /* Dimensione icona */
    height: 18px !important;
}

/* Ordine interno: Layer prima, Home dopo */
.map-controls {
    display: flex !important;
    flex-direction: column !important;
}

/* Assicura che il layer toggle sia il primo elemento */
.map-controls .relative {
    order: 1 !important;
}
/* Home button viene dopo */
#centerPalermo {
    order: 2 !important;
}
        
        /* STILI FORZATI PER LAYER MENU */
        .layer-menu {
            position: absolute !important;
            top: 0 !important;
            left: 48px !important; /* SPOSTATO A DESTRA DEL PULSANTE */
            background: white !important;
            border: 2px solid rgba(0, 0, 0, 0.2) !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            min-width: 140px !important;
            z-index: 1000 !important;
            overflow: hidden !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            animation: slideInLeft 0.2s ease !important; /* ANIMAZIONE DA SINISTRA */
        }
        
        .layer-menu.hidden {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
        
        .layer-option {
            width: 100% !important;
            padding: 12px 16px !important;
            border: none !important;
            background: white !important;
            text-align: left !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            border-bottom: 1px solid #e5e7eb !important;
            display: block !important;
            color: #1f2937 !important;
        }
        
        .layer-option:last-child {
            border-bottom: none !important;
        }
        
        .layer-option:hover {
            background: #f3f4f6 !important;
            color: #111827 !important;
        }
        
        .layer-option.active {
            background: #3b82f6 !important;
            color: white !important;
            font-weight: 600 !important;
        }
        
        .map-control {
            width: 35px !important;
            height: 35px !important;
            background: white !important;
            border: 2px solid rgba(0, 0, 0, 0.2) !important;
            border-radius: 6px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
            transition: all 0.3s ease !important;
            z-index: 9998 !important;
            pointer-events: auto !important;
        }
        
        .map-control.active,
        .map-control:hover {
            background: #f8f9fa !important;
            border-color: rgba(0, 0, 0, 0.3) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
            transform: translateY(-2px) !important;
        }
        
        /* Assicura che relative funzioni */
        .map-controls .relative {
            position: relative !important;
            z-index: 1000 !important;
        }
        
        /* Debug visual per capire dove è il menu */
        .layer-menu::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
        }
        
        /* RESPONSIVE - Mobile */
        @media (max-width: 768px) {
            .map-controls {
                top: 80px !important; /* Sotto l'header mobile */
                left: 10px !important;
                gap: 6px !important;
            }
            
            .map-control {
                width: 36px !important;
                height: 36px !important;
            }
            
            .layer-menu {
                left: 42px !important;
                min-width: 120px !important;
                font-size: 13px !important;
            }
            
            .layer-option {
                padding: 10px 12px !important;
                font-size: 13px !important;
            }
        }
        
        /* Assicura che i controlli Leaflet nativi siano visibili */
.leaflet-control-zoom {
    margin: 0 !important;
    border: 2px solid rgba(0, 0, 0, 0.2) !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
}
        
/* Posiziona i controlli zoom nativi di Leaflet SOPRA tutto */
.leaflet-top.leaflet-left {
    top: 10px !important;
    left: 10px !important;
    z-index: 1002 !important; /* Sopra i nostri controlli */
}
    `;
    
    // Rimuovi stile precedente se esiste
    const oldStyle = document.getElementById('map-layer-switcher-styles');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    document.head.appendChild(style);
    console.log('🎨 Stili layer switcher iniettati (versione definitiva)');
}

console.log('🗺️ map-layer-switcher.js caricato');

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MapLayerSwitcher,
        initMapLayerSwitcher
    };
}
