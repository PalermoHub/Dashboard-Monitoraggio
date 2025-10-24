/**
 * ============================================
 * SINCRONIZZAZIONE FILTRI CON SIDE PANEL
 * Quando applichi filtri, il panel mostra solo i dati filtrati
 * ============================================
 */

console.log('🔄 Caricamento sincronizzazione filtri...');

// ============================================
// INTERCETTA applyFilters
// ============================================

const originalApplyFilters = window.applyFilters;

window.applyFilters = function() {
    console.log('\n📊 ===== APPLICAZIONE FILTRI =====');
    
    // Chiama originale
    if (typeof originalApplyFilters === 'function') {
        originalApplyFilters.call(this);
    }
    
    // Sincronizza il panel con i dati filtrati
    setTimeout(() => {
        syncPanelWithFilters();
    }, 100);
};

// ============================================
// FUNZIONE: SINCRONIZZA PANEL CON FILTRI
// ============================================

window.syncPanelWithFilters = function() {
    console.log('🔄 Sincronizzazione panel con filtri...');
    
    const panel = document.getElementById('pattoSidePanel');
    const isOpen = panel?.classList.contains('open');
    
    console.log('Panel aperto:', isOpen);
    console.log('Dati filtrati disponibili:', window.filteredData?.length);
    
    if (!isOpen) {
        console.log('⚠️ Panel non aperto, sincronizzazione non necessaria');
        return;
    }
    
    // Se il panel è aperto, verifica che i dati siano quelli filtrati
    if (window.filteredData && window.filteredData.length > 0) {
        console.log('✅ Utilizzo filteredData nel panel');
        
        // Aggiorna sidePanelData per usare i dati filtrati
        window.sidePanelData = window.filteredData;
        
        // Resetta l'indice per mostare il primo elemento filtrato
        window.currentSidePanelIndex = 0;
        
        console.log('✅ Panel aggiornato:');
        console.log('   - sidePanelData lunghezza:', window.sidePanelData.length);
        console.log('   - currentSidePanelIndex reset a:', window.currentSidePanelIndex);
        
        // Aggiorna il contenuto del panel
        if (window.filteredData.length > 0) {
            const firstPatto = window.filteredData[0];
            
            if (typeof window.populateSidePanelContent === 'function') {
                console.log('📄 Aggiornamento contenuto panel al primo elemento filtrato');
                window.populateSidePanelContent(firstPatto);
            }
            
            // Aggiorna counter
            if (typeof window.updateSidePanelCounter === 'function') {
                window.updateSidePanelCounter();
            }
        }
    } else if (window.allData && window.allData.length > 0) {
        console.log('⚠️ Nessun dato filtrato, utilizzo allData');
        
        window.sidePanelData = window.allData;
        window.currentSidePanelIndex = 0;
        
        if (window.allData.length > 0) {
            const firstPatto = window.allData[0];
            
            if (typeof window.populateSidePanelContent === 'function') {
                window.populateSidePanelContent(firstPatto);
            }
        }
    }
};

// ============================================
// INTERCETTA CAMBIO FILTRI SPECIFICI
// ============================================

// Monitora i principali select di filtro
const filterSelectors = [
    'filterStato',
    'filterCircoscrizione',
    'filterQuartiere',
    'filterUpl',
    'filterAmbiti',
    'filterTitolo'
];

filterSelectors.forEach(id => {
    const element = document.getElementById(id);
    
    if (element) {
        element.addEventListener('change', function() {
            console.log(`📝 Cambio filtro: ${id} = ${this.value}`);
            
            // Aspetta che applyFilters termini
            setTimeout(() => {
                window.syncPanelWithFilters();
                
                // Se il panel è aperto, aggiorna anche i dati di navigazione
                const panel = document.getElementById('pattoSidePanel');
                if (panel?.classList.contains('open')) {
                    console.log('Panel aperto durante filtro, aggiornamento navigazione');
                    window.currentSidePanelIndex = 0;
                    window.updateSidePanelCounter();
                }
            }, 200);
        });
    }
});

// ============================================
// MONITOR RESET FILTRI
// ============================================

const originalResetFilters = window.resetFiltersFromPopup;

if (typeof originalResetFilters === 'function') {
    window.resetFiltersFromPopup = function() {
        console.log('🔄 Reset filtri richiesto');
        
        // Chiama originale
        originalResetFilters.call(this);
        
        // Sincronizza panel
        setTimeout(() => {
            window.syncPanelWithFilters();
        }, 200);
    };
}

// ============================================
// CONTROLLO INTELLIGENTE: SE PANEL CHIUSO E FILTRI CAMBIANO
// ============================================

window.addEventListener('filterChanged', function() {
    console.log('📊 Evento filterChanged rilevato');
    window.syncPanelWithFilters();
});

// ============================================
// FUNZIONE DI DEBUG
// ============================================

window.debugFilterSync = function() {
    console.group('🔍 DEBUG - Sincronizzazione Filtri');
    
    console.log('Dati totali:', window.allData?.length);
    console.log('Dati filtrati:', window.filteredData?.length);
    console.log('Dati nel panel:', window.sidePanelData?.length);
    console.log('Index attuale:', window.currentSidePanelIndex);
    console.log('Panel aperto:', document.getElementById('pattoSidePanel')?.classList.contains('open'));
    
    if (window.sidePanelData && window.sidePanelData.length > 0) {
        const current = window.sidePanelData[window.currentSidePanelIndex];
        console.log('Patto corrente nel panel:', {
            id: current.id,
            titolo: current[Object.keys(current).find(k => k.toLowerCase().includes('titolo'))]
        });
    }
    
    console.groupEnd();
};

console.log('✅ Sincronizzazione filtri caricata');
console.log('💡 Usa window.debugFilterSync() per diagnostica');
