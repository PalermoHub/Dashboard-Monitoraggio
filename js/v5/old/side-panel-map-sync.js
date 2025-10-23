// ==========================================
// SINCRONIZZAZIONE SIDE PANEL - MAPPA PRINCIPALE
// CON ZOOM PERSONALIZZATO
// ==========================================

console.log('Sincronizzazione Side Panel - Mappa: Inizializzazione');

// Configurazione zoom
const SIDE_PANEL_ZOOM_CONFIG = {
    zoomLevel: 17,              // Livello di zoom (11-19, default 16)
    animationDuration: 1.0,     // Durata animazione in secondi
    animationEasing: 'cubic',   // Tipo di easing: 'linear', 'quad', 'cubic'
    enableSmoothing: true       // Abilita smoothing animazione
};

// Funzione principale di sincronizzazione CON ZOOM
window.syncSidePanelWithMap = function(patto) {
    if (!patto) return;
    
    console.log('🔄 Sincronizzazione:', patto.id || 'N/A');
    
    // 1. Chiudi popup della mappa principale
    if (window.closeMainMapPopup && typeof window.closeMainMapPopup === 'function') {
        window.closeMainMapPopup();
    }
    
    // 2. Evidenzia il marker sulla mappa
    if (window.highlightPattoMarkerOnMap && typeof window.highlightPattoMarkerOnMap === 'function') {
        window.highlightPattoMarkerOnMap(patto);
    }
    
    // 3. Centra e ZOOM la mappa sul patto
    if (window.map && patto.lat && patto.lng && typeof window.map.setView === 'function') {
        try {
            window.map.setView(
                [parseFloat(patto.lat), parseFloat(patto.lng)],
                SIDE_PANEL_ZOOM_CONFIG.zoomLevel,
                {
                    animate: true,
                    duration: SIDE_PANEL_ZOOM_CONFIG.animationDuration,
                    easeLinearity: SIDE_PANEL_ZOOM_CONFIG.animationEasing === 'linear' ? 1 : 0.25
                }
            );
            console.log(`✓ Zoom a livello ${SIDE_PANEL_ZOOM_CONFIG.zoomLevel}`);
        } catch (error) {
            console.warn('Errore centraggio mappa:', error.message);
        }
    }
};

// Pulisci highlight quando si chiude il side panel
window.removeMainMapHighlight = function() {
    if (window.removePattoHighlight && typeof window.removePattoHighlight === 'function') {
        window.removePattoHighlight();
    }
};

// BONUS: Funzione per cambiare zoom dinamicamente da console
window.setSidePanelZoom = function(newZoom) {
    if (newZoom >= 11 && newZoom <= 19) {
        SIDE_PANEL_ZOOM_CONFIG.zoomLevel = newZoom;
        console.log(`✓ Zoom impostato a ${newZoom}`);
    } else {
        console.warn('Zoom non valido. Usa valori tra 11 e 19');
    }
};

// BONUS: Funzione per cambiare durata animazione
window.setSidePanelAnimationDuration = function(seconds) {
    if (seconds >= 0.1 && seconds <= 5) {
        SIDE_PANEL_ZOOM_CONFIG.animationDuration = seconds;
        console.log(`✓ Durata animazione impostata a ${seconds}s`);
    } else {
        console.warn('Durata non valida. Usa valori tra 0.1 e 5 secondi');
    }
};

console.log('✅ Sincronizzazione Side Panel - Mappa caricata (CON ZOOM)');
console.log(`Zoom: ${SIDE_PANEL_ZOOM_CONFIG.zoomLevel}, Durata: ${SIDE_PANEL_ZOOM_CONFIG.animationDuration}s`);