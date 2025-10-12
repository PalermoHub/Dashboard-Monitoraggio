// ==========================================
// MAP CONTROLS - SOLO CONTROLLI UI MAPPA
// ==========================================
// RESPONSABILITÀ: Gestione UI controlli mappa (bottoni, layer switch, centering)
// NON duplica initializeMap che è in monitoraggio_p1-v2.js

(function() {
    'use strict';
    
    console.log('🗺️ Map Controls - Inizializzazione...');
    
    // ==========================================
    // COSTANTI
    // ==========================================
    
    const PALERMO_CENTER = [38.1157, 13.3615];
    
    // ==========================================
    // FUNZIONI CONTROLLI MAPPA
    // ==========================================
    
    /**
     * Centra la mappa su Palermo con effetto animato
     */
    function centerMapOnPalermo() {
        console.log('🎯 Centrando mappa su Palermo...');
        
        if (!window.map) {
            console.error('Mappa non inizializzata');
            return;
        }
        
        try {
            window.map.setView(PALERMO_CENTER, 13, {
                animate: true,
                duration: 1.5
            });
            
            // Effetto highlight
            highlightPalermoCenter();
            
            console.log('✅ Mappa centrata');
            
        } catch (error) {
            console.error('❌ Errore nel centrare la mappa:', error);
        }
    }
    
    /**
     * Evidenzia brevemente il centro di Palermo
     */
    function highlightPalermoCenter() {
        if (!window.map) return;
        
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
    }
    
    /**
     * Cambia il layer della mappa (standard/satellite)
     */
    function switchMapLayer(layerType) {
        console.log(`🗺️ Cambio layer a: ${layerType}`);
        
        if (!window.map) {
            console.error('Mappa non inizializzata');
            return;
        }
        
        try {
            window.currentMapLayer = layerType;
            updateLayerButtons(layerType);
            
            // Rimuovi tutti i tile layer esistenti
            window.map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    window.map.removeLayer(layer);
                }
            });
            
            // Aggiungi nuovo layer
            let newTileLayer;
            
            if (layerType === 'satellite') {
                newTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                    attribution: '© Google Satellite - @gbvitrano - 2025',
                    maxZoom: 18,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                });
            } else {
                newTileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                    attribution: 'CartoDB - @gbvitrano - 2025',
                    maxZoom: 18
                });
            }
            
            newTileLayer.addTo(window.map);
            console.log(`✅ Layer ${layerType} applicato`);
            
        } catch (error) {
            console.error('❌ Errore nel cambio layer:', error);
            
            // Fallback al layer standard
            if (layerType !== 'standard') {
                setTimeout(() => switchMapLayer('standard'), 500);
            }
        }
    }
    
    /**
     * Aggiorna UI dei pulsanti layer
     */
    function updateLayerButtons(activeLayer) {
        const standardBtn = document.getElementById('mapStandard');
        const satelliteBtn = document.getElementById('mapSatellite');
        
        if (!standardBtn || !satelliteBtn) {
            console.warn('Pulsanti layer non trovati');
            return;
        }
        
        const activeClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white font-semibold';
        const inactiveClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
        
        if (activeLayer === 'standard') {
            standardBtn.className = activeClasses;
            satelliteBtn.className = inactiveClasses;
        } else {
            standardBtn.className = inactiveClasses;
            satelliteBtn.className = activeClasses;
        }
    }
    
    /**
     * Toggle menu layer
     */
    function toggleLayerMenu() {
        const menu = document.getElementById('layerMenu');
        const toggle = document.getElementById('layerToggle');
        
        if (!menu) return;
        
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
        
        if (toggle) {
            toggle.setAttribute('aria-expanded', !isHidden);
        }
    }
    
    /**
     * Nascondi menu layer
     */
    function hideLayerMenu() {
        const menu = document.getElementById('layerMenu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }
    
    /**
     * Setup chiusura menu cliccando fuori
     */
    function setupLayerMenuOutsideClick() {
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('layerMenu');
            const toggle = document.getElementById('layerToggle');
            
            if (menu && toggle) {
                if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                    if (!menu.classList.contains('hidden')) {
                        hideLayerMenu();
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        });
    }
    
    // ==========================================
    // SETUP CONTROLLI
    // ==========================================
    
    function setupMapControls() {
        console.log('🛠️ Setup controlli mappa...');
        
        // Pulsante centra Palermo
        const centerBtn = document.getElementById('centerPalermo');
        if (centerBtn) {
            centerBtn.addEventListener('click', centerMapOnPalermo);
            console.log('✅ Pulsante centra configurato');
        }
        
        // Toggle menu layer
        const layerToggle = document.getElementById('layerToggle');
        if (layerToggle) {
            layerToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLayerMenu();
            });
            console.log('✅ Toggle layer configurato');
        }
        
        // Pulsante mappa standard
        const mapStandard = document.getElementById('mapStandard');
        if (mapStandard) {
            mapStandard.addEventListener('click', function() {
                switchMapLayer('standard');
                hideLayerMenu();
            });
            console.log('✅ Pulsante mappa standard configurato');
        }
        
        // Pulsante mappa satellite
        const mapSatellite = document.getElementById('mapSatellite');
        if (mapSatellite) {
            mapSatellite.addEventListener('click', function() {
                switchMapLayer('satellite');
                hideLayerMenu();
            });
            console.log('✅ Pulsante mappa satellite configurato');
        }
        
        // Click del marker centro Palermo
        setTimeout(() => {
            if (window.map) {
                window.map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        const latLng = layer.getLatLng();
                        if (Math.abs(latLng.lat - PALERMO_CENTER[0]) < 0.0001 &&
                            Math.abs(latLng.lng - PALERMO_CENTER[1]) < 0.0001) {
                            layer.on('click', centerMapOnPalermo);
                            console.log('✅ Listener marker centro configurato');
                        }
                    }
                });
            }
        }, 1000);
        
        // Setup chiusura menu fuori click
        setupLayerMenuOutsideClick();
        
        console.log('✅ Controlli mappa configurati');
    }
    
    // ==========================================
    // EXPORT FUNZIONI
    // ==========================================
    
    // Export come proprietà di window (non sovrascrivere se già esistono)
    if (!window.centerMapOnPalermo) {
        window.centerMapOnPalermo = centerMapOnPalermo;
    }
    
    if (!window.switchMapLayer) {
        window.switchMapLayer = switchMapLayer;
    }
    
    // ==========================================
    // AUTO-INIZIALIZZAZIONE
    // ==========================================
    
    function initializeMapControls() {
        // Aspetta che la mappa sia inizializzata
        if (!window.map) {
            console.log('⏳ Mappa non ancora pronta, riprovo...');
            setTimeout(initializeMapControls, 500);
            return;
        }
        
        setupMapControls();
    }
    
    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeMapControls, 1000);
        });
    } else {
        setTimeout(initializeMapControls, 1000);
    }
    
    console.log('✅ Map Controls caricato');
    
})();

// CSS per marker centro
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .center-palermo-marker .center-marker-icon {
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border: 2px solid #3B82F6;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .center-palermo-marker:hover .center-marker-icon {
            transform: scale(1.2);
            background: #3B82F6;
        }
    `;
    document.head.appendChild(style);
}