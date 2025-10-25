// ==========================================
// MAP LAYER SWITCHER - VERSIONE INTEGRATA CON SIDE PANEL
// Gestione completa layer mappa + compatibilità side-panel.js
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
        this.map = this.getMapInstance(map);
        this.currentLayer = null;
        this.currentLayerType = 'standard';
        this.initialized = false;
        
        this.elements = {
            toggle: null,
            menu: null,
            standardBtn: null,
            satelliteBtn: null
        };
        
        console.log('🗺️ MapLayerSwitcher inizializzato');
    }

    getMapInstance(mapRef) {
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

    isValidLeafletMap(obj) {
        return obj && 
               typeof obj === 'object' && 
               typeof obj.removeLayer === 'function' &&
               typeof obj.addLayer === 'function' &&
               typeof obj.eachLayer === 'function';
    }

    init() {
        if (this.initialized) {
            console.warn('⚠️ Layer switcher già inizializzato');
            return false;
        }

        if (!this.map || !this.isValidLeafletMap(this.map)) {
            console.log('🔄 Tentativo di recuperare istanza mappa...');
            this.map = this.getMapInstance(null);
        }

        if (!this.map || !this.isValidLeafletMap(this.map)) {
            console.error('❌ Mappa non disponibile o non valida');
            return false;
        }

        if (!this.findElements()) {
            console.error('❌ Elementi DOM non trovati');
            return false;
        }

        this.setupEventListeners();
        this.switchLayer('standard', false);

        this.initialized = true;
        console.log('✅ Layer switcher inizializzato con successo');
        return true;
    }

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

    setupEventListeners() {
        if (this.elements.toggle) {
            const newToggle = this.elements.toggle.cloneNode(true);
            this.elements.toggle.parentNode.replaceChild(newToggle, this.elements.toggle);
            this.elements.toggle = newToggle;

            this.elements.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click su toggle layer');
                this.toggleMenu();
            });
            
            console.log('✅ Toggle listener configurato');
        }

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

        document.addEventListener('click', (e) => {
            if (this.elements.menu && 
                !this.elements.menu.contains(e.target) && 
                !this.elements.toggle.contains(e.target)) {
                this.hideMenu();
            }
        });
    }

    switchLayer(layerType, showNotification = true) {
        if (!MAP_LAYERS[layerType]) {
            console.error('❌ Layer type non valido:', layerType);
            return false;
        }

        console.log(`🔄 Cambio layer a: ${layerType}`);

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
            if (this.currentLayer) {
                console.log('🗑️ Rimozione layer precedente...');
                
                try {
                    this.map.removeLayer(this.currentLayer);
                    console.log('✅ Layer precedente rimosso');
                } catch (removeError) {
                    console.warn('⚠️ Errore rimozione layer:', removeError);
                    this.forceRemoveAllTileLayers();
                }
            }

            const config = MAP_LAYERS[layerType];
            console.log('🎨 Creazione nuovo layer:', config.name);
            
            this.currentLayer = L.tileLayer(config.url, {
                attribution: config.attribution,
                ...config.options
            });

            console.log('➕ Aggiunta layer alla mappa...');
            this.currentLayer.addTo(this.map);
            this.currentLayerType = layerType;

            this.updateUI();
            
            // 🎯 AGGIORNA COLORE MIRINO IN BASE AL LAYER
            this.updateViewfinderColor(layerType);

            setTimeout(() => {
                if (this.map && typeof this.map.invalidateSize === 'function') {
                    this.map.invalidateSize();
                    console.log('🔄 Mappa aggiornata');
                }
            }, 100);

            console.log(`✅ Layer ${layerType} attivato con successo`);

            if (showNotification) {
                this.showNotification(
                    `Mappa ${config.name} attivata`, 
                    'success'
                );
            }

            return true;

        } catch (error) {
            console.error('❌ Errore cambio layer:', error);
            this.showNotification('Errore nel cambio mappa', 'error');
            return false;
        }
    }
    
    /**
     * Aggiorna il colore del mirino in base al layer attivo
     */
    updateViewfinderColor(layerType) {
        if (!window.currentHighlightMarker) {
            console.log('ℹ️ Nessun mirino attivo da aggiornare');
            return;
        }
        
        try {
            // Colori in base al layer
            const colors = {
                standard: '#a09090',  // Grigio per layer standard
                satellite: '#ff9900'  // Arancione per satellite
            };
            
            const color = colors[layerType] || colors.standard;
            
            // Ottieni il marker esistente
            const marker = window.currentHighlightMarker;
            
            // Aggiorna l'HTML dell'icona con il nuovo colore
            const newIcon = L.divIcon({
                className: 'viewfinder-fallback',
                html: `
<div style="
    border: 2px solid ${color};
    border-radius: 4px;
    width: 30px; 
    height: 30px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(59, 130, 246, 0.7);
    animation: pulseMarker 2s infinite;
">
    <!-- Linea verticale superiore -->
    <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: ${color};"></div>
    
    <!-- Linea orizzontale sinistra -->
    <div style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: ${color};"></div>
    
    <!-- Linea orizzontale destra -->
    <div style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: ${color};"></div>
    
    <!-- Linea verticale inferiore -->
    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: ${color};"></div>
</div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            // Aggiorna l'icona del marker
            marker.setIcon(newIcon);
            
            console.log(`🎨 Mirino aggiornato con colore: ${color} per layer ${layerType}`);
            
        } catch (error) {
            console.error('❌ Errore aggiornamento colore mirino:', error);
        }
    }

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
                } catch (e) {
                    console.warn('⚠️ Errore rimozione singolo layer:', e);
                }
            });

            console.log(`🧹 Rimossi ${layersToRemove.length} tile layers`);
        } catch (error) {
            console.error('❌ Errore pulizia forzata:', error);
        }
    }

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

    toggleMenu() {
        if (!this.elements.menu) {
            console.error('❌ Menu element non trovato');
            return;
        }

        const isHidden = this.elements.menu.classList.contains('hidden');
        
        if (isHidden) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    showMenu() {
        if (!this.elements.menu) return;
        
        this.elements.menu.classList.remove('hidden');
        this.elements.menu.style.display = 'block';
        
        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', 'true');
        }
    }

    hideMenu() {
        if (!this.elements.menu) return;
        
        this.elements.menu.classList.add('hidden');
        this.elements.menu.style.display = 'none';
        
        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', 'false');
        }
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

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
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// ==========================================
// FUNZIONI GLOBALI COMPATIBILI CON SIDE-PANEL
// ==========================================

let mapLayerSwitcherInstance = null;

/**
 * Centra la mappa su Palermo
 * COMPATIBILE con side-panel.js
 */
function centerMapOnPalermo() {
    console.log('🎯 Centrando mappa su Palermo...');
    
    if (!window.map) {
        console.error('❌ Mappa non inizializzata');
        return;
    }
    
    try {
        const PALERMO_CENTER = [38.1170, 13.3734];
        
        window.map.setView(PALERMO_CENTER, 13, {
            animate: true,
            duration: 1.5
        });
        
        console.log('✅ Mappa centrata su:', PALERMO_CENTER);
        
        // Evidenziazione temporanea
        const highlightCircle = L.circle(PALERMO_CENTER, {
            radius: 500,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(window.map);
        
        setTimeout(() => {
            window.map.removeLayer(highlightCircle);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Errore nel centrare la mappa:', error);
    }
}

/**
 * Cambia il layer della mappa
 * COMPATIBILE con side-panel.js
 */
function switchMapLayer(layerType) {
    if (!mapLayerSwitcherInstance) {
        console.error('❌ Layer switcher non inizializzato');
        return;
    }
    
    mapLayerSwitcherInstance.switchLayer(layerType);
}

/**
 * Sincronizza la mappa con il side panel
 * INTEGRAZIONE DIRETTA per side-panel.js
 */
window.syncMapWithSidePanel = function(patto) {
    console.log('🗺️ Sincronizzazione mappa con side panel', {
        id: patto?.id,
        lat: patto?.lat,
        lng: patto?.lng
    });
    
    if (!patto || !patto.lat || !patto.lng) {
        console.error('❌ Dati patto mancanti');
        return false;
    }
    
    if (!window.map) {
        console.error('❌ Mappa non pronta');
        return false;
    }
    
    try {
        // Zoom e centratura sul marker
        window.map.setView(
            [parseFloat(patto.lat), parseFloat(patto.lng)], 
            17, 
            {
                animate: true,
                duration: 1.0,
                easeLinearity: 0.25
            }
        );
        
        console.log('✅ Mappa sincronizzata con side panel');
        return true;
        
    } catch (error) {
        console.error('❌ Errore sincronizzazione:', error);
        return false;
    }
};

/**
 * Inizializza il layer switcher
 */
function initMapLayerSwitcher() {
    console.log('🚀 Inizializzazione MapLayerSwitcher...');
    
    let mapInstance = null;
    
    // Trova istanza mappa
    if (window.map && typeof window.map.removeLayer === 'function') {
        mapInstance = window.map;
        console.log('✅ Mappa trovata in window.map');
    } else if (typeof map !== 'undefined' && typeof map.removeLayer === 'function') {
        mapInstance = map;
        window.map = map; // Assicura che sia disponibile globalmente
        console.log('✅ Mappa trovata nella variabile globale map');
    }
    
    if (!mapInstance) {
        console.warn('⚠️ Mappa non ancora disponibile, riprovo tra 500ms');
        setTimeout(initMapLayerSwitcher, 500);
        return false;
    }
    
    // Distruggi istanza precedente
    if (mapLayerSwitcherInstance) {
        console.log('🔄 Reset istanza precedente');
    }
    
    // Crea nuova istanza
    mapLayerSwitcherInstance = new MapLayerSwitcher(mapInstance);
    
    // Inizializza
    const success = mapLayerSwitcherInstance.init();
    
    if (success) {
        // Esponi globalmente
        window.mapLayerSwitcher = mapLayerSwitcherInstance;
        window.centerMapOnPalermo = centerMapOnPalermo;
        window.switchMapLayer = switchMapLayer;
        
        console.log('✅ MapLayerSwitcher pronto e compatibile con side-panel');
        return true;
    } else {
        console.error('❌ Errore inizializzazione MapLayerSwitcher');
        return false;
    }
}

// ==========================================
// CSS ANIMATIONS E STILI
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
        
        .map-controls {
            position: absolute !important;
            top: 80px !important;
            left: 10px !important;
            z-index: 1001 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            pointer-events: auto !important;
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
            pointer-events: auto !important;
        }

        .map-control.active,
        .map-control:hover {
            background: #f8f9fa !important;
            border-color: rgba(0, 0, 0, 0.3) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
            transform: translateY(-2px) !important;
        }
        
        .layer-menu {
            position: absolute !important;
            top: 0 !important;
            left: 48px !important;
            background: white !important;
            border: 2px solid rgba(0, 0, 0, 0.2) !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            min-width: 140px !important;
            z-index: 1000 !important;
            overflow: hidden !important;
            animation: slideInLeft 0.2s ease !important;
        }
        
        .layer-menu.hidden {
            display: none !important;
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
        }
        
        .layer-option:hover {
            background: #f3f4f6 !important;
        }
        
        .layer-option.active {
            background: #3b82f6 !important;
            color: white !important;
            font-weight: 600 !important;
        }
    `;
    
    const oldStyle = document.getElementById('map-layer-switcher-styles');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    document.head.appendChild(style);
    console.log('🎨 Stili layer switcher iniettati');
}

// ==========================================
// AUTO-INIZIALIZZAZIONE
// ==========================================

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initMapLayerSwitcher, 1500);
        });
    } else {
        setTimeout(initMapLayerSwitcher, 1500);
    }
}

console.log('🗺️ map-controls_layer.js caricato (versione integrata con side-panel)');

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MapLayerSwitcher,
        initMapLayerSwitcher,
        centerMapOnPalermo,
        switchMapLayer
    };
}
