/**
 * SISTEMA HIGHLIGHTING - VERSIONE CORRETTA
 * Usa CircleMarker invece di Marker
 */

console.log('🚀 Caricamento sistema highlighting corretto...');

// VARIABILI GLOBALI
window.currentHighlightMarker = null;
window.currentHighlightedPattoId = null;

console.log('✅ Variabili globali create');

// ✅ VERSIONE CORRETTA - USA circleMarker
window.createHighlightMarkerSafe = function(patto, animate = true) {
    console.log('🎯 createHighlightMarkerSafe - patto:', patto?.id);
    
    if (!patto) {
        console.error('❌ Patto null');
        return false;
    }
    
    const lat = parseFloat(patto.lat);
    const lng = parseFloat(patto.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Coordinate invalide');
        return false;
    }
    
    if (!window.map) {
        console.warn('⚠️ Mappa non pronta');
        setTimeout(() => window.createHighlightMarkerSafe(patto, animate), 300);
        return false;
    }
    
    try {
        window.removeHighlightMarkerSafe();
        
        console.log('🔵 Creando circleMarker a:', [lat, lng]);
        
        const marker = L.circleMarker([lat, lng], {
            radius: 15,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 4,
            opacity: 1,
            fillOpacity: 0.7,
            className: animate ? 'mirino-pulse' : 'mirino',
            zIndexOffset: 1000
        });
        
        marker.addTo(window.map);
        marker.bringToFront();
        
        window.currentHighlightMarker = marker;
        window.currentHighlightedPattoId = patto.id;
        
        console.log('✅ Marker creato');
        
        setTimeout(() => {
            try {
                window.map.setView([lat, lng], 17, {
                    animate: true,
                    duration: 1.0
                });
            } catch (e) {
                console.warn('⚠️ Errore setView:', e);
            }
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore:', error);
        return false;
    }
};

// RIMUOVI HIGHLIGHT
window.removeHighlightMarkerSafe = function() {
    console.log('🗑️ Rimozione marker highlight');
    
    if (window.currentHighlightMarker && window.map) {
        try {
            window.map.removeLayer(window.currentHighlightMarker);
            console.log('✅ Marker rimosso');
        } catch (error) {
            console.warn('⚠️ Errore rimozione:', error);
        }
    }
    
    window.currentHighlightMarker = null;
    window.currentHighlightedPattoId = null;
    
    return true;
};

// AGGIUNGI STILI CSS
function addHighlightingStyles() {
    if (document.getElementById('unifiedHighlightingStyles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'unifiedHighlightingStyles';
    style.textContent = `
        .mirino-pulse {
            animation: mirinoPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes mirinoPulse {
            0%, 100% {
                filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
            }
            50% {
                filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
            }
        }
    `;
    
    document.head.appendChild(style);
}

// HOOK: APERTURA SIDE PANEL
const originalPopulateSidePanelContent = window.populateSidePanelContent;

window.populateSidePanelContent = function(patto) {
    if (originalPopulateSidePanelContent) {
        originalPopulateSidePanelContent.call(this, patto);
    }
    
    setTimeout(() => {
        console.log('🎯 Highlight durante populate');
        window.createHighlightMarkerSafe(patto, true);
    }, 100);
};

// HOOK: CHIUSURA SIDE PANEL
const originalCloseSidePanel = window.closeSidePanel;

window.closeSidePanel = function() {
    console.log('🔒 Chiusura panel');
    window.removeHighlightMarkerSafe();
    
    if (originalCloseSidePanel) {
        originalCloseSidePanel.call(this);
    }
};

// INIZIALIZZAZIONE
function initHighlighting() {
    if (!window.map) {
        setTimeout(initHighlighting, 100);
        return;
    }
    
    addHighlightingStyles();
    console.log('✅ Sistema highlighting inizializzato');
}

setTimeout(initHighlighting, 1000);

console.log('✅ Script highlighting caricato');