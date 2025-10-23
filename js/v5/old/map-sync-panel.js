// ============================================================
// SINCRONIZZAZIONE MAPPA CON SIDE PANEL
// Legge i dati del patto visualizzato nel side panel
// e sincronizza la mappa (highlight + zoom)
// ============================================================

console.log('🗺️ Sistema sincronizzazione Mappa-SidePanel avviato');

// Variabili di tracciamento
window.currentPulseMarker = null;
let observerActive = false;
let initAttempts = 0;
const maxAttempts = 30;

// ============================================================
// ESTRAI COORDINATE DAL SIDE PANEL
// ============================================================
function extractCoordinatesFromPanel() {
    try {
        // Verifica che il side panel esista e sia aperto
        const sidePanel = document.getElementById('pattoSidePanel');
        if (!sidePanel || !sidePanel.classList.contains('open')) {
            console.log('⚠️ Side panel non aperto');
            return null;
        }
        
        // Leggi il titolo dal side panel
        const titleElement = document.getElementById('sidePanelTitle');
        if (!titleElement || !titleElement.textContent.trim()) {
            console.log('⚠️ Titolo side panel vuoto');
            return null;
        }
        
        const panelTitle = titleElement.textContent.trim();
        console.log('📋 Titolo letto dal panel:', panelTitle);
        
        // Verifica che i dati siano disponibili
        if (!window.allData || window.allData.length === 0) {
            console.log('⚠️ Dati globali non disponibili');
            return null;
        }
        
        // Cerca il patto nel dataset
        const titoloKey = Object.keys(window.allData[0] || {}).find(k => 
            k.toLowerCase().includes('titolo') && k.toLowerCase().includes('proposta')
        );
        
        if (!titoloKey) {
            console.log('⚠️ Chiave titolo non trovata');
            return null;
        }
        
        const patto = window.allData.find(p => 
            p[titoloKey] && p[titoloKey].trim() === panelTitle
        );
        
        if (!patto) {
            console.log('⚠️ Patto non trovato nel dataset');
            return null;
        }
        
        if (!patto.lat || !patto.lng) {
            console.log('⚠️ Coordinate non valide:', { lat: patto.lat, lng: patto.lng });
            return null;
        }
        
        const coords = {
            lat: parseFloat(patto.lat),
            lng: parseFloat(patto.lng),
            title: panelTitle,
            patto: patto
        };
        
        console.log('✅ Coordinate estratte:', coords);
        return coords;
        
    } catch (error) {
        console.error('❌ Errore lettura coordinate dal panel:', error);
        return null;
    }
}

// ============================================================
// RIMUOVI PULSE PRECEDENTE
// ============================================================
function removePreviousPulse() {
    if (!window.currentPulseMarker || !window.map) return;
    
    try {
        if (window.map.hasLayer(window.currentPulseMarker)) {
            window.map.removeLayer(window.currentPulseMarker);
        }
        window.currentPulseMarker = null;
        console.log('🗑️ Pulse precedente rimosso');
    } catch (e) {
        console.warn('⚠️ Errore rimozione pulse:', e);
        window.currentPulseMarker = null;
    }
}

// ============================================================
// CREA MARKER CON PULSE
// ============================================================
function createPulseMarker(coords) {
    if (!window.map) {
        console.log('⚠️ Mappa non disponibile');
        return;
    }
    
    try {
        removePreviousPulse();
        
        // Crea marker circolare con pulse
        window.currentPulseMarker = L.circleMarker(
            [coords.lat, coords.lng],
            {
                radius: 20,
                fillColor: '#3b82f6',
                color: '#ffffff',
                weight: 4,
                opacity: 1,
                fillOpacity: 0.7,
                className: 'map-pulse-marker'
            }
        ).addTo(window.map);
        
        // Aggiungi tooltip
        window.currentPulseMarker.bindTooltip(coords.title, {
            permanent: false,
            direction: 'top',
            className: 'pulse-tooltip'
        });
        
        console.log('✨ Marker pulse creato a:', coords.lat, coords.lng);
        
    } catch (error) {
        console.error('❌ Errore creazione pulse marker:', error);
    }
}

// ============================================================
// ZOOM E CENTRA MAPPA
// ============================================================
function centerMapOnCoords(coords) {
    if (!window.map) {
        console.log('⚠️ Mappa non disponibile per zoom');
        return;
    }
    
    try {
        // Verifica che la mappa sia pronta
        if (!window.map._container) {
            console.log('⚠️ Contenitore mappa non inizializzato');
            return;
        }
        
        window.map.setView(
            [coords.lat, coords.lng],
            17,
            {
                animate: true,
                duration: 1.0,
                easeLinearity: 0.25
            }
        );
        
        console.log('🎯 Mappa centrata su:', coords.lat, coords.lng);
        
    } catch (error) {
        console.error('❌ Errore zoom mappa:', error);
    }
}

// ============================================================
// SINCRONIZZA MAPPA CON SIDE PANEL
// ============================================================
function syncMapWithPanel() {
    console.log('🔄 Sincronizzazione in corso...');
    
    const coords = extractCoordinatesFromPanel();
    
    if (!coords) {
        console.log('⚠️ Sincronizzazione non possibile: coordinate non disponibili');
        return false;
    }
    
    createPulseMarker(coords);
    centerMapOnCoords(coords);
    
    console.log('✅ Sincronizzazione completata');
    return true;
}

// ============================================================
// OSSERVA CAMBAMENTI NEL SIDE PANEL
// ============================================================
function setupPanelObserver() {
    const panelTitle = document.getElementById('sidePanelTitle');
    if (!panelTitle) {
        console.log('⏳ sidePanelTitle non trovato ancora');
        return false;
    }
    
    if (observerActive) return true;
    
    // Crea observer per monitorare cambamenti
    const observer = new MutationObserver((mutations) => {
        console.log('📢 Cambamento rilevato nel side panel');
        setTimeout(() => {
            syncMapWithPanel();
        }, 300);
    });
    
    observer.observe(panelTitle, {
        characterData: true,
        childList: true,
        subtree: true
    });
    
    observerActive = true;
    console.log('👁️ Observer attivato sul side panel');
    return true;
}

// ============================================================
// MONITORA NAVIGAZIONE NEL PANEL
// ============================================================
function setupNavigationListeners() {
    document.addEventListener('keydown', function(e) {
        const sidePanel = document.getElementById('pattoSidePanel');
        
        if (sidePanel && sidePanel.classList.contains('open')) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                console.log('⌨️ Tasto freccia premuto');
                setTimeout(() => {
                    syncMapWithPanel();
                }, 400);
            }
        }
    });
    
    console.log('⌨️ Listener tasti freccia attivati');
}

// ============================================================
// INTERCETTA CLICK SU MARKER
// ============================================================
function interceptMarkerClicks() {
    setTimeout(() => {
        if (!window.markersLayer) {
            console.log('⚠️ markersLayer non disponibile');
            return;
        }
        
        window.markersLayer.eachLayer(function(layer) {
            if (layer instanceof L.CircleMarker) {
                layer.on('click', function() {
                    console.log('👆 Click su marker della mappa');
                    setTimeout(() => {
                        syncMapWithPanel();
                    }, 600);
                });
            }
        });
        
        console.log('🔗 Listener click marker attivati');
    }, 3000);
}

// ============================================================
// INIETTA STILI CSS
// ============================================================
function injectStyles() {
    if (document.getElementById('map-sync-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'map-sync-styles';
    style.textContent = `
        @keyframes pulseWave {
            0% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.9);
            }
            50% {
                box-shadow: 0 0 0 20px rgba(59, 130, 246, 0.4);
            }
            100% {
                box-shadow: 0 0 0 40px rgba(59, 130, 246, 0);
            }
        }
        
        .map-pulse-marker {
            animation: pulseWave 2s ease-out infinite !important;
            filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8));
        }
        
        .pulse-tooltip {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 6px !important;
            color: #fff !important;
            font-weight: 500;
            font-size: 12px;
            padding: 6px 10px !important;
        }
        
        .pulse-tooltip::before {
            border-top-color: rgba(0, 0, 0, 0.95) !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Stili CSS iniettati');
}

// ============================================================
// TENTATIVO DI INIZIALIZZAZIONE CON RETRY
// ============================================================
function tryInitialize() {
    initAttempts++;
    
    console.log(`🔄 Tentativo inizializzazione ${initAttempts}/${maxAttempts}`);
    
    // Verifica se tutto è pronto
    const mapReady = window.map && window.map._container;
    const dataReady = window.allData && window.allData.length > 0;
    const panelReady = document.getElementById('sidePanelTitle');
    
    console.log('📊 Status:', {
        mapReady,
        dataReady,
        panelReady: !!panelReady,
        markersLayer: !!window.markersLayer
    });
    
    if (mapReady && dataReady && panelReady) {
        console.log('✅ Tutti i componenti pronti');
        injectStyles();
        setupPanelObserver();
        setupNavigationListeners();
        interceptMarkerClicks();
        console.log('✅✅ SISTEMA COMPLETAMENTE INIZIALIZZATO');
        return true;
    }
    
    if (initAttempts < maxAttempts) {
        console.log(`⏳ Ritento in 1 secondo... (${initAttempts}/${maxAttempts})`);
        setTimeout(tryInitialize, 1000);
        return false;
    }
    
    console.error('❌ Impossibile inizializzare dopo 30 tentativi');
    console.error('Debug info:', {
        mapReady,
        dataReady,
        panelReady: !!panelReady,
        markersLayer: !!window.markersLayer
    });
    return false;
}

// ============================================================
// AVVIA AL CARICAMENTO PAGINA
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM caricato, inizio tentativi...');
        setTimeout(tryInitialize, 2000);
    });
} else {
    console.log('📄 DOM già caricato, inizio tentativi...');
    setTimeout(tryInitialize, 2000);
}

// ============================================================
// API PUBBLICA
// ============================================================
window.mapSync = {
    sync: syncMapWithPanel,
    removePulse: removePreviousPulse,
    status: () => {
        const coords = extractCoordinatesFromPanel();
        console.log('📊 Status:', {
            panelOpen: !!document.getElementById('pattoSidePanel')?.classList.contains('open'),
            currentCoords: coords,
            hasPulse: window.currentPulseMarker !== null,
            observerActive: observerActive,
            mapReady: !!window.map?._container,
            dataReady: !!window.allData?.length
        });
    },
    reset: () => {
        removePreviousPulse();
        observerActive = false;
        initAttempts = 0;
        console.log('🔄 Reset completo');
    }
};

console.log('✅ Script caricato. Usa window.mapSync.status() per debug.');