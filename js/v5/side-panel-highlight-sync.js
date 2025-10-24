/**
 * ============================================
 * SISTEMA HIGHLIGHTING - VERSIONE FUNZIONANTE
 * Evidenzia marker quando si apre side panel
 * ============================================
 */

console.log('🚀 Caricamento sistema highlighting...');

// ============================================
// VARIABILI GLOBALI - SALVATE IN WINDOW
// ============================================

window.currentHighlightMarker = null;
window.currentHighlightedPattoId = null;

console.log('✅ Variabili globali create');

// ============================================
// FUNZIONE: CREA HIGHLIGHT CON MIRINO
// ============================================

window.createHighlightMarkerSafe = function(patto, animate = true) {
    console.log('🎯 createHighlightMarkerSafe chiamata per patto:', patto?.id);
    
    // Validazione patto
    if (!patto) {
        console.error('❌ Patto null');
        return false;
    }
    
    // Converti lat/lng a numeri
    const lat = parseFloat(patto.lat);
    const lng = parseFloat(patto.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Coordinate invalide:', { lat: patto.lat, lng: patto.lng });
        return false;
    }
    
    if (!window.map) {
        console.warn('⚠️ Mappa non pronta, retry tra 300ms');
        setTimeout(() => window.createHighlightMarkerSafe(patto, animate), 300);
        return false;
    }
    
    try {
        // Rimuovi marker precedente
        window.removeHighlightMarkerSafe();
        
        console.log('📍 Creando mirino a:', [lat, lng]);
        
        // Crea un marker con icona personalizzata (mirino)
        const mirinoIcon = L.icon({
            iconUrl: 'img/mirino.png',
            iconSize: [32, 32],      // Dimensione più piccola del circle marker
            iconAnchor: [16, 16],    // Centro l'icona
            className: animate ? 'mirino-pulse' : 'mirino'
        });
        
        const marker = L.marker(
            [lat, lng],
            {
                icon: mirinoIcon,
                zIndexOffset: 1000
            }
        );
        
        // Aggiungi alla mappa
        marker.addTo(window.map);
        marker.bringToFront();
        
        // Salva globalmente
        window.currentHighlightMarker = marker;
        window.currentHighlightedPattoId = patto.id;
        
        console.log('✅ Mirino salvato');
        
        // Centra mappa
        setTimeout(() => {
            try {
                window.map.setView([lat, lng], 16, {
                    animate: true,
                    duration: 1.0
                });
                console.log('✅ Mappa centrata su:', [lat, lng]);
            } catch (e) {
                console.warn('⚠️ Errore centratura mappa:', e);
            }
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore creazione mirino:', error);
        return false;
    }
};

// ============================================
// FUNZIONE: RIMUOVI HIGHLIGHT
// ============================================

window.removeHighlightMarkerSafe = function() {
    console.log('🗑️ Rimozione marker highlight...');
    
    if (window.currentHighlightMarker && window.map) {
        try {
            // Rimuovi dalla mappa
            window.map.removeLayer(window.currentHighlightMarker);
            console.log('✅ Marker rimosso dalla mappa');
        } catch (error) {
            console.warn('⚠️ Errore rimozione:', error);
        }
    }
    
    // Pulisci riferimento
    window.currentHighlightMarker = null;
    window.currentHighlightedPattoId = null;
    
    return true;
};

// ============================================
// AGGIUNGI STILI CSS
// ============================================

function addHighlightingStyles() {
    if (document.getElementById('unifiedHighlightingStyles')) {
        console.log('✅ Stili CSS già presenti');
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'unifiedHighlightingStyles';
    style.textContent = `
        /* Stili per mirino */
        .mirino {
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6)) !important;
            transition: all 0.3s ease;
            z-index: 999 !important;
        }
        
        .mirino-pulse {
            animation: mirinoPulse 1.5s ease-in-out infinite;
            z-index: 1000 !important;
        }
        
        /* Animazione pulse per mirino */
        @keyframes mirinoPulse {
            0%, 100% {
                filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5)) 
                        drop-shadow(0 0 12px rgba(59, 130, 246, 0.3));
                transform: scale(1);
            }
            50% {
                filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) 
                        drop-shadow(0 0 24px rgba(59, 130, 246, 0.5));
                transform: scale(1.15);
            }
        }
        
        .mirino:hover {
            filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) 
                    drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) !important;
            transform: scale(1.2);
        }
    `;
    
    document.head.appendChild(style);
    console.log('📋 Stili CSS aggiunti');
}

// ============================================
// HOOK: APERTURA SIDE PANEL
// ============================================

// Salva la funzione originale
const originalOpenSidePanel = window.openSidePanel || window.showPattoDetails;

// ============================================
// INTERCETTA populateSidePanelContent
// ============================================

const originalPopulateSidePanelContent = window.populateSidePanelContent;

window.populateSidePanelContent = function(patto) {
    console.log('📄 populateSidePanelContent chiamata per patto:', patto?.id);
    
    // Chiama originale
    if (originalPopulateSidePanelContent && typeof originalPopulateSidePanelContent === 'function') {
        originalPopulateSidePanelContent.call(this, patto);
    }
    
    // Aggiungi highlight quando il contenuto viene aggiornato
    setTimeout(() => {
        console.log('🎯 Aggiornamento highlight durante populateSidePanelContent');
        window.createHighlightMarkerSafe(patto, true);
    }, 100);
};

// ============================================
// HOOK: NAVIGAZIONE SIDE PANEL - VERSIONE DIRETTA
// ============================================

// Intercetta i click direttamente sui pulsanti
function setupNavigationButtons() {
    console.log('🔧 Setup button intercettazione...');
    
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');
    
    if (!prevBtn || !nextBtn) {
        console.warn('⚠️ Pulsanti navigazione non trovati, retry tra 500ms');
        setTimeout(setupNavigationButtons, 500);
        return;
    }
    
    console.log('✅ Pulsanti trovati');
    
    // Rimuovi vecchi listener (clone per pulire)
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Aggiungi nuovi listener con ID univoci
    const prevBtnNew = document.getElementById('sidePanelPrevious');
    const nextBtnNew = document.getElementById('sidePanelNext');
    
    // Listener PREVIO
    prevBtnNew.addEventListener('click', function(e) {
        console.log('\n⬆️ CLICK PULSANTE INDIETRO');
        e.preventDefault();
        e.stopPropagation();
        
        // Chiama la funzione originale navigateSidePanel se esiste
        if (typeof window.navigateSidePanel === 'function') {
            console.log('Chiamando navigateSidePanel originale...');
            window.navigateSidePanel(-1);
        }
    });
    
    // Listener NEXT
    nextBtnNew.addEventListener('click', function(e) {
        console.log('\n⬇️ CLICK PULSANTE AVANTI');
        e.preventDefault();
        e.stopPropagation();
        
        // Chiama la funzione originale navigateSidePanel se esiste
        if (typeof window.navigateSidePanel === 'function') {
            console.log('Chiamando navigateSidePanel originale...');
            window.navigateSidePanel(1);
        }
    });
    
    console.log('✅ Button listeners installati');
}

// Inizializza dopo che il panel è aperto
const originalOpenSidePanelOld = window.openSidePanel;
window.openSidePanel = function(pattoId) {
    console.log('\n📂 ===== APERTURA SIDE PANEL =====');
    
    // Chiama originale
    if (originalOpenSidePanelOld && typeof originalOpenSidePanelOld === 'function') {
        originalOpenSidePanelOld.call(this, pattoId);
    }
    
    // Setup buttons dopo che il panel è stato creato
    setTimeout(() => {
        setupNavigationButtons();
    }, 300);
    
    // Aggiungi highlight
    setTimeout(() => {
        console.log('⏳ Ricerca patto nel dataset...');
        
        let patto = null;
        
        if (window.filteredData?.length > 0) {
            patto = window.filteredData.find(p => {
                const pk = Object.keys(p).find(k => k.toLowerCase() === 'id');
                return p[pk] == pattoId;
            });
            if (patto) console.log('✅ Trovato in filteredData');
        }
        
        if (!patto && window.allData?.length > 0) {
            patto = window.allData.find(p => {
                const pk = Object.keys(p).find(k => k.toLowerCase() === 'id');
                return p[pk] == pattoId;
            });
            if (patto) console.log('✅ Trovato in allData');
        }
        
        if (patto) {
            console.log('🎯 Creando highlight...');
            window.createHighlightMarkerSafe(patto, true);
        } else {
            console.error('❌ Patto non trovato:', pattoId);
        }
    }, 300);
};

// Salva come showPattoDetails anche
window.showPattoDetails = window.openSidePanel;

// ============================================
// HOOK: CHIUSURA SIDE PANEL
// ============================================

const originalCloseSidePanel = window.closeSidePanel;

window.closeSidePanel = function() {
    console.log('\n📂 ===== CHIUSURA SIDE PANEL =====');
    
    // Rimuovi highlight
    window.removeHighlightMarkerSafe();
    
    // Chiama originale
    if (originalCloseSidePanel && typeof originalCloseSidePanel === 'function') {
        originalCloseSidePanel.call(this);
    }
};

// ============================================
// INIZIALIZZAZIONE
// ============================================

console.log('\n⏳ Attesa mappa...');

function initHighlighting() {
    if (!window.map) {
        setTimeout(initHighlighting, 100);
        return;
    }
    
    console.log('\n✅ Mappa pronta!');
    addHighlightingStyles();
    console.log('✅ Sistema highlighting inizializzato');
    console.log('💡 Comandi disponibili:');
    console.log('   - window.createHighlightMarkerSafe(patto, true)');
    console.log('   - window.removeHighlightMarkerSafe()');
    console.log('   - window.openSidePanel(pattoId)');
}

// Avvia dopo 1 secondo
setTimeout(initHighlighting, 1000);

console.log('\n✅ Script highlighting caricato');
