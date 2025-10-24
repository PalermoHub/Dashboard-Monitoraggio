/**
 * ============================================
 * SISTEMA INTEGRATO DI HIGHLIGHTING
 * Side Panel & Map Marker Synchronization
 * ============================================
 * 
 * FUNZIONALITÀ:
 * ✅ Evidenzia marker quando si apre il side panel
 * ✅ Aggiorna highlight durante navigazione prev/next
 * ✅ Sincronizza posizione della mappa
 * ✅ Rimuove highlight quando si chiude il panel
 * ✅ Gestisce un unico highlight per evitare duplicati
 */

// ============================================
// VARIABILI GLOBALI PER TRACKING
// ============================================

let currentHighlightedPattoId = null;      // Traccia il patto attualmente evidenziato
let currentHighlightMarker = null;         // Reference al marker di highlight attuale
let highlightAnimationTimeout = null;      // Per gestire timeout animazioni

// ============================================
// CONFIGURAZIONE HIGHLIGHT
// ============================================

const HIGHLIGHT_CONFIG = {
    active: {
        radius: 18,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 4,
        opacity: 1,
        fillOpacity: 0.8
    },
    hover: {
        radius: 22,
        fillColor: '#2563eb',
        color: '#ffffff',
        weight: 5,
        opacity: 1,
        fillOpacity: 0.9
    },
    pulse: {
        animationDuration: 2000,
        animationIterations: 'infinite'
    }
};

// ============================================
// FUNZIONE PRINCIPALE: CREA HIGHLIGHT
// ============================================

/**
 * Crea un marker di highlighting sulla mappa principale
 * @param {Object} patto - Oggetto patto con proprietà lat, lng, id
 * @param {boolean} animate - Se true, aggiunge animazione pulse
 */
function createHighlightMarker(patto, animate = true) {
    console.log('🎯 Creazione highlight marker per patto:', patto.id);
    
    if (!patto || !patto.lat || !patto.lng) {
        console.warn('⚠️ Dati patto non validi per highlight');
        return false;
    }
    
    // Verifica mappa
    if (!isMapReady()) {
        console.warn('⚠️ Mappa non pronta, retry tra 500ms');
        setTimeout(() => createHighlightMarker(patto, animate), 500);
        return false;
    }
    
    // Rimuovi highlight precedente
    removeCurrentHighlight();
    
    try {
        // Crea il marker di highlight
        currentHighlightMarker = L.circleMarker(
            [parseFloat(patto.lat), parseFloat(patto.lng)],
            {
                ...HIGHLIGHT_CONFIG.active,
                className: animate ? 'marker-highlight-pulse' : 'marker-highlight'
            }
        );
        
        // Aggiungi alla mappa
        currentHighlightMarker.addTo(window.map);
        
        // Salva ID patto
        currentHighlightedPattoId = patto.id;
        
        // Aggiungi effetti hover
        setupHighlightHoverEffects();
        
        // Aggiungi animazione se richiesta
        if (animate) {
            addPulseAnimation();
        }
        
        console.log('✅ Highlight marker creato con successo');
        return true;
        
    } catch (error) {
        console.error('❌ Errore creazione highlight:', error);
        return false;
    }
}

// ============================================
// FUNZIONE: RIMUOVI HIGHLIGHT ATTUALE
// ============================================

/**
 * Rimuove il marker di highlight dalla mappa
 */
function removeCurrentHighlight() {
    console.log('🗑️ Rimozione highlight marker...');
    
    if (currentHighlightMarker && window.map) {
        try {
            window.map.removeLayer(currentHighlightMarker);
            currentHighlightMarker = null;
            currentHighlightedPattoId = null;
            console.log('✅ Highlight marker rimosso');
            return true;
        } catch (error) {
            console.warn('⚠️ Errore rimozione highlight:', error);
            return false;
        }
    }
    
    return true;
}

// ============================================
// FUNZIONE: EFFETTI HOVER
// ============================================

/**
 * Aggiunge effetti hover al marker di highlight
 */
function setupHighlightHoverEffects() {
    if (!currentHighlightMarker) return;
    
    currentHighlightMarker.on('mouseover', function() {
        console.log('🔍 Hover sul marker evidenziato');
        
        try {
            this.setStyle({
                radius: HIGHLIGHT_CONFIG.hover.radius,
                fillColor: HIGHLIGHT_CONFIG.hover.fillColor,
                weight: HIGHLIGHT_CONFIG.hover.weight,
                fillOpacity: HIGHLIGHT_CONFIG.hover.fillOpacity
            });
        } catch (e) {
            console.warn('⚠️ Errore applicazione hover:', e);
        }
    });
    
    currentHighlightMarker.on('mouseout', function() {
        console.log('👁️ Mouse out dal marker');
        
        try {
            this.setStyle({
                radius: HIGHLIGHT_CONFIG.active.radius,
                fillColor: HIGHLIGHT_CONFIG.active.fillColor,
                weight: HIGHLIGHT_CONFIG.active.weight,
                fillOpacity: HIGHLIGHT_CONFIG.active.fillOpacity
            });
        } catch (e) {
            console.warn('⚠️ Errore rimozione hover:', e);
        }
    });
}

// ============================================
// FUNZIONE: ANIMAZIONE PULSE
// ============================================

/**
 * Aggiunge animazione pulse al marker di highlight
 */
function addPulseAnimation() {
    // Se non esiste lo stile, crealo
    if (!document.getElementById('markerPulseStyles')) {
        const style = document.createElement('style');
        style.id = 'markerPulseStyles';
        style.textContent = `
            @keyframes marker-pulse {
                0% {
                    r: 18px;
                    stroke-width: 4px;
                    opacity: 1;
                }
                50% {
                    r: 24px;
                    stroke-width: 3px;
                    opacity: 0.8;
                }
                100% {
                    r: 18px;
                    stroke-width: 4px;
                    opacity: 1;
                }
            }
            
            .marker-highlight-pulse {
                animation: marker-pulse 2s ease-in-out infinite;
            }
            
            .marker-highlight {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        console.log('📝 Stili animazione pulse aggiunti');
    }
}

// ============================================
// FUNZIONE: VERIFICA MAPPA PRONTA
// ============================================

/**
 * Verifica se la mappa è pronta per operazioni
 */
function isMapReady() {
    return window.map && 
           window.map._container &&
           window.map.getCenter &&
           typeof window.map.setView === 'function' &&
           window.map._leaflet_map !== undefined;
}

// ============================================
// INTEGRAZIONE CON openSidePanel
// ============================================

/**
 * Hook per aprire side panel CON highlighting
 * Questo sostituisce/integra la funzione openSidePanel esistente
 */
const originalOpenSidePanel = window.showPattoDetails;

window.showPattoDetails = function(pattoId) {
    console.log('📂 Apertura side panel per patto:', pattoId);
    
    // Chiama la funzione originale
    if (typeof originalOpenSidePanel === 'function') {
        originalOpenSidePanel.call(this, pattoId);
    }
    
    // Aspetta che il panel sia aperto
    setTimeout(() => {
        const panel = document.getElementById('pattoSidePanel');
        if (panel && panel.classList.contains('open')) {
            
            // Trova il patto nel dataset
            let patto = null;
            if (window.filteredData) {
                patto = window.filteredData.find(p => {
                    const idKey = Object.keys(p).find(k => k.toLowerCase() === 'id');
                    return p[idKey] == pattoId;
                });
            }
            
            if (!patto) {
                patto = window.allData.find(p => {
                    const idKey = Object.keys(p).find(k => k.toLowerCase() === 'id');
                    return p[idKey] == pattoId;
                });
            }
            
            // Crea highlight
            if (patto) {
                const success = createHighlightMarker(patto, true);
                
                if (success) {
                    console.log('✅ Highlight marker creato all\'apertura del panel');
                    
                    // Sincronizza mappa se disponibile
                    if (typeof syncMapWithSidePanel === 'function') {
                        setTimeout(() => syncMapWithSidePanel(patto), 300);
                    }
                }
            }
        }
    }, 200);
};

// ============================================
// INTEGRAZIONE CON navigateSidePanel
// ============================================

/**
 * Hook per navigazione side panel CON update highlight
 * Questo integra la funzione navigateSidePanel esistente
 */
const originalNavigateSidePanel = window.navigateSidePanel;

window.navigateSidePanel = function(direction) {
    console.log('➡️ Navigazione side panel:', direction > 0 ? 'AVANTI' : 'INDIETRO');
    
    // Salva posizione attuale
    const oldIndex = window.currentSidePanelIndex;
    
    // Chiama la funzione originale
    if (typeof originalNavigateSidePanel === 'function') {
        originalNavigateSidePanel.call(this, direction);
    }
    
    // Se l'indice è cambiato
    if (window.currentSidePanelIndex !== oldIndex && window.sidePanelData) {
        
        const newPatto = window.sidePanelData[window.currentSidePanelIndex];
        
        if (newPatto) {
            // Rimuovi highlight vecchio con effetto
            fadeOutHighlight(() => {
                // Crea nuovo highlight
                const success = createHighlightMarker(newPatto, true);
                
                if (success) {
                    console.log('✅ Highlight aggiornato durante navigazione');
                    
                    // Sincronizza mappa
                    if (typeof syncMapWithSidePanel === 'function') {
                        setTimeout(() => syncMapWithSidePanel(newPatto), 300);
                    }
                }
            });
        }
    }
};

// ============================================
// FUNZIONE: EFFETTO FADE OUT
// ============================================

/**
 * Rimuove l'highlight con effetto fade
 * @param {Function} callback - Funzione da eseguire al termine
 */
function fadeOutHighlight(callback) {
    if (!currentHighlightMarker) {
        if (callback) callback();
        return;
    }
    
    console.log('👁️ Fade out highlight...');
    
    // Anima la scomparsa
    const originalFillOpacity = HIGHLIGHT_CONFIG.active.fillOpacity;
    let opacity = originalFillOpacity;
    const step = 0.1;
    const interval = setInterval(() => {
        opacity -= step;
        
        if (opacity <= 0) {
            clearInterval(interval);
            removeCurrentHighlight();
            
            if (callback) {
                callback();
            }
        } else {
            try {
                currentHighlightMarker.setStyle({ fillOpacity: opacity });
            } catch (e) {}
        }
    }, 50);
}

// ============================================
// INTEGRAZIONE CON closeSidePanel
// ============================================

/**
 * Hook per chiusura side panel
 * Rimuove l'highlighting quando si chiude il panel
 */
const originalCloseSidePanel = window.closeSidePanel;

window.closeSidePanel = function() {
    console.log('🔙 Chiusura side panel...');
    
    // Rimuovi highlight con fade
    fadeOutHighlight(() => {
        // Chiama la funzione originale
        if (typeof originalCloseSidePanel === 'function') {
            originalCloseSidePanel.call(this);
        }
    });
};

// ============================================
// FUNZIONE DI SINCRONIZZAZIONE MAPPA
// ============================================

/**
 * Sincronizza la vista della mappa con il patto nel side panel
 * @param {Object} patto - Dati del patto
 */
function syncMapWithSidePanel(patto) {
    if (!patto || !patto.lat || !patto.lng || !window.map) {
        return;
    }
    
    console.log('🗺️ Sincronizzazione mappa con patto:', patto.id);
    
    try {
        // Centra la mappa con zoom
        window.map.setView(
            [parseFloat(patto.lat), parseFloat(patto.lng)],
            16,
            {
                animate: true,
                duration: 1.0,
                easeLinearity: 0.25
            }
        );
        
        // Aggiungi un'animazione al marker
        if (currentHighlightMarker) {
            try {
                currentHighlightMarker.bringToFront();
            } catch (e) {}
        }
        
        console.log('✅ Mappa sincronizzata');
        
    } catch (error) {
        console.error('❌ Errore sincronizzazione mappa:', error);
    }
}

// ============================================
// FUNZIONE DI DEBUG/DIAGNOSTICA
// ============================================

/**
 * Verifica lo stato del sistema di highlighting
 */
window.debugHighlighting = function() {
    console.group('🔍 DEBUG - Stato Highlighting');
    
    console.log('Mappa pronta:', isMapReady());
    console.log('Highlight marker attivo:', !!currentHighlightMarker);
    console.log('Patto evidenziato:', currentHighlightedPattoId);
    console.log('Panel aperto:', document.getElementById('pattoSidePanel')?.classList.contains('open'));
    console.log('Index attuale:', window.currentSidePanelIndex);
    console.log('Dati panel:', window.sidePanelData?.length, 'elementi');
    
    if (currentHighlightMarker) {
        const center = currentHighlightMarker.getLatLng();
        console.log('Posizione highlight:', { lat: center.lat, lng: center.lng });
    }
    
    console.groupEnd();
};

// ============================================
// INIZIALIZZAZIONE
// ============================================

/**
 * Inizializza il sistema di highlighting
 */
function initializeHighlightingSystem() {
    console.log('🚀 Inizializzazione sistema highlighting...');
    
    // Verifica che le funzioni originali esistano
    if (typeof window.showPattoDetails !== 'function') {
        console.error('❌ Funzione showPattoDetails non trovata!');
        return false;
    }
    
    if (typeof window.closeSidePanel !== 'function') {
        console.error('❌ Funzione closeSidePanel non trovata!');
        return false;
    }
    
    // Aggiungi style CSS
    addHighlightingStyles();
    
    console.log('✅ Sistema highlighting inizializzato con successo');
    console.log('💡 Usa window.debugHighlighting() per diagnostica');
    
    return true;
}

/**
 * Aggiunge stili CSS necessari
 */
function addHighlightingStyles() {
    if (document.getElementById('highlightingSystemStyles')) {
        return; // Già aggiunto
    }
    
    const style = document.createElement('style');
    style.id = 'highlightingSystemStyles';
    style.textContent = `
        /* Stili per marker di highlighting */
        .marker-highlight {
            transition: all 0.3s ease !important;
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
        }
        
        .marker-highlight-pulse {
            filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
        }
        
        /* Animazione pulse */
        @keyframes markerPulse {
            0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
            }
            50% {
                transform: scale(1.2);
                filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.9));
            }
        }
        
        .marker-highlight-pulse svg circle {
            animation: markerPulse 2s ease-in-out infinite;
        }
        
        /* Effetto ripple al click */
        @keyframes ripple {
            0% {
                r: 20px;
                opacity: 1;
            }
            100% {
                r: 40px;
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('📋 Stili highlighting aggiunti al documento');
}

// ============================================
// AUTO-INIT AL CARICAMENTO
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeHighlightingSystem, 1500);
    });
} else {
    // DOM già caricato
    setTimeout(initializeHighlightingSystem, 1000);
}

// ============================================
// EXPORT PER MODULI
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createHighlightMarker,
        removeCurrentHighlight,
        setupHighlightHoverEffects,
        addPulseAnimation,
        fadeOutHighlight,
        syncMapWithSidePanel,
        isMapReady,
        initializeHighlightingSystem,
        HIGHLIGHT_CONFIG
    };
}

console.log('✅ Script highlighting side panel caricato');
