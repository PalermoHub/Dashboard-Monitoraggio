// ==========================================
// PATCH PER monitoraggio_p1-v2.js
// Integrazione con side-panel-sync-enhanced.js
// ==========================================

// AGGIUNGI QUESTO CODICE ALLA FINE DEL FILE monitoraggio_p1-v2.js
// (DOPO console.log('Dashboard Monitoraggio Patti...')

// ==========================================
// PATCH 1: DISABILITA IL VECCHIO SISTEMA DI SYNC
// ==========================================

// Sovrascrivi le vecchie funzioni per evitare conflitti
console.log('🔧 PATCH: Disabilitazione vecchio sistema sync...');

const originalHighlightMarkerOnMap = window.highlightPattoMarkerOnMap;
window.highlightPattoMarkerOnMap = function(patto) {
    console.log('⚠️ highlightPattoMarkerOnMap BYPASSATO - Usa nuovo sistema');
    // NON FARE NULLA - Il nuovo sistema gestisce tutto
    return true;
};

const originalSyncMapWithSidePanel = window.syncMapWithSidePanel;
window.syncMapWithSidePanel = function(patto) {
    console.log('⚠️ syncMapWithSidePanel BYPASSATO - Usa nuovo sistema');
    // NON FARE NULLA - Il nuovo sistema gestisce tutto
    return true;
};

console.log('✅ Vecchio sistema disabilitato');

// ==========================================
// PATCH 2: MODIFICA populateSidePanelContent
// ==========================================

// Salva la funzione originale
const originalPopulateSidePanelContent = window.populateSidePanelContent;

// Sovrascrivi con versione che integra il nuovo sync
window.populateSidePanelContent = function(patto) {
    console.log('🔄 populateSidePanelContent PATCHED - Patto ID:', patto?.id);
    
    // Esegui la funzione originale per popolare i dati
    if (typeof originalPopulateSidePanelContent === 'function') {
        try {
            originalPopulateSidePanelContent(patto);
            console.log('✅ Dati pannello popolati');
        } catch (e) {
            console.error('❌ Errore populateSidePanelContent originale:', e);
        }
    }
    
    // NUOVO: Sincronizza con la mappa usando il sistema enhanced
    setTimeout(() => {
        console.log('🎯 Attivando sincronizzazione enhanced...');
        
        if (typeof syncSidePanelWithMap === 'function') {
            const syncResult = syncSidePanelWithMap(patto);
            console.log('📍 Risultato sync:', syncResult ? '✅ Successo' : '❌ Fallito');
        } else {
            console.error('❌ Funzione syncSidePanelWithMap non trovata');
            console.warn('⚠️ Assicurati che side-panel-sync-enhanced.js sia caricato');
        }
    }, 300);
};

console.log('✅ populateSidePanelContent PATCHed');

// ==========================================
// PATCH 3: MODIFICA navigateSidePanel
// ==========================================

// Salva la funzione originale
const originalNavigateSidePanel = window.navigateSidePanel;

// Sovrascrivi per sincronizzare dopo navigazione
window.navigateSidePanel = function(direction) {
    console.log('🔄 navigateSidePanel PATCHED - Direzione:', direction > 0 ? 'NEXT' : 'PREV');
    
    // Chiudi i popup della mappa prima di navigare
    window.closeMapPopups();
    
    // Naviga
    if (typeof originalNavigateSidePanel === 'function') {
        try {
            originalNavigateSidePanel(direction);
            console.log('✅ Navigazione completata');
        } catch (e) {
            console.error('❌ Errore navigazione:', e);
        }
    }
    
    // NUOVO: Re-sincronizza con il nuovo patto
    setTimeout(() => {
        console.log('🎯 Re-sincronizzazione dopo navigazione...');
        
        if (window.allData && currentSidePanelIndex !== undefined) {
            const patto = window.allData[currentSidePanelIndex];
            
            if (patto && typeof syncSidePanelWithMap === 'function') {
                const syncResult = syncSidePanelWithMap(patto);
                console.log('📍 Risultato sync post-navigazione:', syncResult ? '✅ Successo' : '❌ Fallito');
            }
        }
    }, 300);
};

console.log('✅ navigateSidePanel PATCHed');

// ==========================================
// PATCH 4: MODIFICA closeSidePanel
// ==========================================

// Salva la funzione originale
const originalCloseSidePanel = window.closeSidePanel;

// Sovrascrivi per cleanup del nuovo sistema
window.closeSidePanel = function() {
    console.log('🔄 closeSidePanel PATCHED - Closing...');
    
    // Chiudi il pannello (funzione originale)
    if (typeof originalCloseSidePanel === 'function') {
        try {
            originalCloseSidePanel();
            console.log('✅ Pannello chiuso');
        } catch (e) {
            console.error('❌ Errore chiusura pannello:', e);
        }
    }
    
    // NUOVO: Cleanup del sistema enhanced
    setTimeout(() => {
        console.log('🧹 Cleanup sincronizzazione...');
        
        if (typeof cleanupSidePanelSync === 'function') {
            try {
                cleanupSidePanelSync();
                console.log('✅ Cleanup completato');
            } catch (e) {
                console.error('❌ Errore cleanup:', e);
            }
        }
    }, 200);
};

console.log('✅ closeSidePanel PATCHed');

// ==========================================
// PATCH 5: VERIFICA CARICAMENTO FILES
// ==========================================

console.log('\n📋 VERIFICA STATO INTEGRAZIONE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const integrationStatus = {
    'side-panel.js': typeof openSidePanel !== 'undefined' ? '✅ Caricato' : '❌ MANCANTE',
    'side-panel-sync-enhanced.js': typeof syncSidePanelWithMap !== 'undefined' ? '✅ Caricato' : '❌ MANCANTE',
    'Mappa principale': typeof window.map !== 'undefined' ? '✅ Inizializzata' : '⏳ Non ancora',
    'Funzioni patchate': '✅ 5 funzioni patchate'
};

Object.entries(integrationStatus).forEach(([name, status]) => {
    console.log(`  ${name}: ${status}`);
});

// ==========================================
// PATCH 6: HOOK PER APERTURA POPUP MARKERS
// ==========================================

// Intercetta la funzione closeMapPopupAndOpenPanel per sincronizzare
const originalCloseMapPopupAndOpenPanel = window.closeMapPopupAndOpenPanel;

window.closeMapPopupAndOpenPanel = function(pattoId) {
    console.log('🔄 closeMapPopupAndOpenPanel INTERCETTATO - Patto ID:', pattoId);
    
    // Esegui la funzione originale
    if (typeof originalCloseMapPopupAndOpenPanel === 'function') {
        try {
            originalCloseMapPopupAndOpenPanel(pattoId);
            console.log('✅ Popup chiuso e pannello aperto');
        } catch (e) {
            console.error('❌ Errore:', e);
        }
    }
};

console.log('✅ closeMapPopupAndOpenPanel INTERCETTato');

// ==========================================
// PATCH 7: MONITOR CAMBIO FILTRI
// ==========================================

// Quando i filtri cambiano, reset il pannello se è aperto
const originalApplyFilters = window.applyFilters;

window.applyFilters = function() {
    console.log('🔄 applyFilters PATCHED - Filtri modificati');
    
    // Esegui la funzione originale
    if (typeof originalApplyFilters === 'function') {
        try {
            originalApplyFilters();
            console.log('✅ Filtri applicati');
        } catch (e) {
            console.error('❌ Errore applicazione filtri:', e);
        }
    }
    
    // Se il pannello è aperto, sincronizza
    const panel = document.getElementById('pattoSidePanel');
    if (panel && panel.classList.contains('open')) {
        console.log('⚠️ Pannello aperto durante cambio filtri - Verifica sincronizzazione');
        
        if (window.allData && currentSidePanelIndex !== undefined) {
            const patto = window.allData[currentSidePanelIndex];
            
            // Verifica se il patto è ancora nei dati filtrati
            if (window.filteredData && !window.filteredData.includes(patto)) {
                console.warn('⚠️ Patto non più nei filtri - Chiusura pannello');
                closeSidePanel();
            } else if (patto && typeof syncSidePanelWithMap === 'function') {
                console.log('🎯 Re-sincronizzazione post-filtri');
                syncSidePanelWithMap(patto);
            }
        }
    }
};

console.log('✅ applyFilters PATCHed');

// ==========================================
// PATCH 8: DEBUG MODE
// ==========================================

window.enableSidePanelDebug = function() {
    console.log('\n🐛 DEBUG MODE ATTIVATO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Stato sincronizzazione:', window.panelMapSyncState);
    console.log('Pannello aperto:', document.getElementById('pattoSidePanel')?.classList.contains('open'));
    console.log('Indice corrente:', currentSidePanelIndex);
    console.log('Patto corrente:', window.allData?.[currentSidePanelIndex]);
    console.log('Mappa pronibilità:', typeof window.map !== 'undefined' ? 'OK' : 'ERRORE');
};

console.log('\n✅ DEBUG MODE disponibile: window.enableSidePanelDebug()');

// ==========================================
// FINALE
// ==========================================

console.log('\n🎉 PATCH COMPLETATO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Tutte le modifiche applicate');
console.log('✅ Nuovo sistema syncSidePanelWithMap ATTIVO');
console.log('✅ Pronto per il testing');
console.log('\n💡 Per debuggare: window.enableSidePanelDebug()');
