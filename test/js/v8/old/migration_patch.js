// ==========================================
// MIGRATION PATCH - MODIFICHE AI FILE ESISTENTI
// ==========================================
// ⭐ Applica queste modifiche ai file originali

/* 
==============================================
FILE: stats-dataviz-panel.js
==============================================
*/

// 🔧 MODIFICA 1: updateStatsDisplay() - VERSIONE SEMPLIFICATA
// Sostituisci la funzione esistente con questa:

function updateStatsDisplay() {
    try {
        console.log('📊 updateStatsDisplay: Inizio aggiornamento');
        
        // ✅ USA DataStateManager come fonte unica
        const data = window.DataStateManager 
            ? window.DataStateManager.getData() 
            : { all: window.allData || [], filtered: window.filteredData || [] };
        
        const allData = data.all;
        const filteredData = data.filtered;
        
        console.log(`📊 Dati: ${filteredData.length}/${allData.length}`);
        
        if (!allData || allData.length === 0) {
            console.error('❌ Nessun dato disponibile');
            return;
        }
        
        // Trova chiave stato
        const statoKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('stato'));
        
        if (!statoKey) {
            console.error('❌ Chiave stato non trovata');
            return;
        }
        
        // ✅ CALCOLA STATISTICHE
        const stats = {
            total: filteredData.length,
            stipulati: filteredData.filter(p => p[statoKey] === 'Patto stipulato').length,
            istruttoria: filteredData.filter(p => p[statoKey] === 'Istruttoria in corso').length,
            attesaIntegrazione: filteredData.filter(p => p[statoKey] === 'In attesa di integrazione').length,
            monitoraggio: filteredData.filter(p => p[statoKey] === 'Proroga e/o Monitoraggio e valutazione dei risultati').length,
            respinti: filteredData.filter(p => p[statoKey] === 'Respinta').length,
            archiviati: filteredData.filter(p => p[statoKey] === 'Archiviata').length,
            statoKey,
            allData
        };
        
        console.log('📊 Statistiche calcolate:', stats);
        
        // ✅ AGGIORNA DOM
        updatePanelStats(stats);
        preventChartCreationInTab1();
        
        console.log('✅ updateStatsDisplay completato');
        
    } catch (error) {
        console.error('❌ Errore in updateStatsDisplay:', error);
    }
}



// 🔧 MODIFICA 2: resetStatsPanelToDefault() - ELIMINA E USA BRIDGE
// Commenta o elimina questa funzione, il bridge la gestisce automaticamente

/* 
// ❌ ELIMINA QUESTA FUNZIONE - ora gestita dal bridge
function resetStatsPanelToDefault() {
    // ... codice vecchio ...
}
*/

// 🔧 MODIFICA 3: cleanupCharts() - MANTIENI INVARIATA
// Questa funzione va bene così com'è

// 🔧 MODIFICA 4: handleChartClick() - SEMPLIFICATA
// Sostituisci con questa versione:

function handleChartClick(chartType, selectedValue) {
    try {
        console.log('📊 Click su grafico:', chartType, selectedValue);
        
        // ✅ DELEGA AL BRIDGE che gestirà tutto
        if (window.handleChartClick && window.DataStateManager) {
            return window.handleChartClick(chartType, selectedValue);
        }
        
        // Fallback se bridge non disponibile
        console.warn('⚠️ Bridge non disponibile, uso metodo legacy');
        applyChartFilter(chartType, selectedValue);
        
    } catch (error) {
        console.error('❌ Errore gestione click:', error);
    }
}

// 🔧 MODIFICA 5: applyChartFilter() - SEMPLIFICATA
// Sostituisci con questa versione:



function applyChartFilter(chartType, selectedValue) {
    try {
        console.log('✅ Applicazione filtro:', chartType, selectedValue);
        
        // Aggiorna UI del filtro
        if (chartType === 'stato') {
            const select = document.getElementById('filterStato');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } 
        else if (chartType === 'proponente') {
            window.proponenteFilter = selectedValue;
            
            // Usa applyFilters che ora è wrappato dal bridge
            if (typeof window.applyFilters === 'function') {
                window.applyFilters();
            }
        } 
        else if (chartType === 'ambiti') {
            const select = document.getElementById('filterAmbiti');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
    } catch (error) {
        console.error('❌ Errore applicazione filtro:', error);
    }
}



// 🔧 MODIFICA 6: resetChartFilter() - USA BRIDGE
// Sostituisci con questa versione:

function resetChartFilter() {
    try {
        console.log('🔄 Reset filtro grafico');
        
        // ✅ USA IL SISTEMA UNIFICATO
        if (window.resetFilters) {
            return window.resetFilters();
        }
        
        console.error('❌ resetFilters non disponibile');
        
    } catch (error) {
        console.error('❌ Errore reset filtri:', error);
    }
}


/* 
==============================================
FILE: monitoraggio_p1.js
==============================================
*/

// 🔧 MODIFICA 7: applyFilters() - VERSIONE WRAPPATA
// Sostituisci la funzione esistente con questa:



function applyFilters() {
    console.log('🔍 applyFilters chiamato');
    
    // ✅ IL BRIDGE GESTIRÀ AUTOMATICAMENTE
    // Se il bridge è attivo, questa funzione è già wrappata
    // Altrimenti esegui la logica locale
    
    if (window.DataStateManager) {
        // Raccogli filtri
        const filters = {
            stato: document.getElementById('filterStato')?.value?.trim() || '',
            upl: document.getElementById('filterUpl')?.value?.trim() || '',
            quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
            circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
            ambiti: document.getElementById('filterAmbiti')?.value?.trim() || '',
            titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
            proponente: proponenteFilter.trim()
        };
        
        // ✅ DELEGA AL MANAGER
        return window.DataStateManager.applyFilters(filters);
    }
    
    // Fallback: logica legacy (se bridge non caricato)
    console.warn('⚠️ DataStateManager non disponibile, uso logica legacy');
    
    const filters = {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
        ambiti: document.getElementById('filterAmbiti')?.value?.trim() || '',
        titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
        proponente: proponenteFilter.trim()
    };
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const ambitiKey = Object.keys(item).find(k => k.toLowerCase().includes('ambiti'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        return (
            (!filters.stato || item[statoKey]?.trim() === filters.stato) &&
            (!filters.upl || item[uplKey]?.trim() === filters.upl) &&
            (!filters.quartiere || item[quartiereKey]?.trim() === filters.quartiere) &&
            (!filters.circoscrizione || item[circoscrizioneKey]?.trim() === filters.circoscrizione) &&
            (!filters.ambiti || item[ambitiKey]?.trim() === filters.ambiti) &&
            (!filters.titolo || item[titoloKey]?.toLowerCase().includes(filters.titolo)) &&
            (!filters.proponente || item[proponenteKey]?.trim() === filters.proponente)
        );
    });
    
    window.filteredData = filteredData;
    
    updateMap();
    updateTable();
    updateFiltersPopup();
}



// 🔧 MODIFICA 8: resetFiltersFromPopup() - USA BRIDGE
// Sostituisci con questa versione SEMPLIFICATA:



function resetFiltersFromPopup() {
    console.log('🔄 resetFiltersFromPopup chiamato');
    
    // ✅ USA IL SISTEMA UNIFICATO
    if (window.resetFilters) {
        return window.resetFilters();
    }
    
    // Fallback legacy
    console.warn('⚠️ resetFilters non disponibile, uso legacy');
    
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterAmbiti', 'filterTitolo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    proponenteFilter = '';
    window.proponenteFilter = '';
    
    if (typeof clearSmartSearchCompletely === 'function') {
        clearSmartSearchCompletely();
    }
    
    filteredData = allData.slice(0);
    window.filteredData = allData.slice(0);
    
    if (typeof updateFilters === 'function') updateFilters();
    if (typeof updateMap === 'function') updateMap();
    if (typeof updateTable === 'function') updateTable();
    if (typeof hideFiltersPopup === 'function') hideFiltersPopup();
}



// 🔧 MODIFICA 9: setupGlobalResetButton() - SEMPLIFICATO
// Sostituisci con questa versione:



function setupGlobalResetButton() {
    console.log('🔧 Configurazione pulsante reset globale...');
    
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (!clearFiltersBtn) {
        console.warn('⚠️ Pulsante clearFilters non trovato');
        return false;
    }
    
    // Rimuovi vecchi listener
    const newClearBtn = clearFiltersBtn.cloneNode(true);
    clearFiltersBtn.parentNode.replaceChild(newClearBtn, clearFiltersBtn);
    
    // ✅ LISTENER UNIFICATO
    newClearBtn.addEventListener('click', function() {
        console.log('🔄 Reset globale richiesto');
        
        // Usa il sistema unificato
        if (window.resetFilters) {
            window.resetFilters();
        } else {
            console.error('❌ resetFilters non disponibile');
        }
    });
    
    console.log('✅ Reset globale configurato');
    return true;
}



// 🔧 MODIFICA 10: loadData() - INTEGRAZIONE CON MANAGER
// Aggiungi questa riga ALLA FINE della funzione loadData():

async function loadData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/PalermoHub/Dashboard-Monitoraggio/refs/heads/main/dati/monit_patti_pa.csv');
        const csvText = await response.text();
        
        allData = parseCSV(csvText);
        window.allData = allData;
        window.filteredData = [...allData];
        filteredData = [...allData];
        
        // ✅ AGGIUNGI QUESTE RIGHE - Inizializza DataStateManager
        if (window.DataStateManager) {
            window.DataStateManager.initialize(allData);
            console.log('✅ Dati sincronizzati con DataStateManager');
        } else {
            console.warn('⚠️ DataStateManager non ancora caricato, sincronizzerò dopo');
            // Retry dopo 500ms
            setTimeout(() => {
                if (window.DataStateManager) {
                    window.DataStateManager.initialize(allData);
                    console.log('✅ Dati sincronizzati con DataStateManager (retry)');
                }
            }, 500);
        }
        
        setupAutocomplete();
        updateFilters();
        updateMap();
        
        if (typeof window.updateStatsDisplay === 'function') {
            window.updateStatsDisplay();
        }
        
        updateLastUpdate();
        updateTable();
        hideFiltersPopup();
        
        console.log('✅ Dati caricati:', allData.length, 'patti');
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati. Riprova più tardi.');
    }
}


/* 
==============================================
ORDINE DI CARICAMENTO FILES - IMPORTANTE!
==============================================
*/

/*
Nel tuo HTML, assicurati di caricare i file in QUESTO ORDINE:

1. <!-- Librerie esterne (Leaflet, Chart.js, etc) -->
   <script src="...leaflet.js"></script>
   <script src="...chart.js"></script>

2. <!-- ⭐ NUOVO: State Manager (PRIMO!) -->
   <script src="data-state-manager.js"></script>

3. <!-- File esistenti -->
   <script src="monitoraggio_p1.js"></script>
   <script src="stats-dataviz-panel.js"></script>

4. <!-- ⭐ NUOVO: Integration Bridge (ULTIMO!) -->
   <script src="integration-bridge.js"></script>

Esempio completo:
*/

/*
<!DOCTYPE html>
<html>
<head>
    <!-- ... meta tags, CSS ... -->
    
    <!-- Librerie -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    
</head>
<body>
    <!-- ... HTML content ... -->
    
    <!-- Scripts in ORDINE CORRETTO -->
    
    <!-- 1. State Manager -->
    <script src="data-state-manager.js"></script>
    
    <!-- 2. File esistenti -->
    <script src="monitoraggio_p1.js"></script>
    <script src="stats-dataviz-panel.js"></script>
    
    <!-- 3. Integration Bridge -->
    <script src="integration-bridge.js"></script>
    
</body>
</html>
*/


/* 
==============================================
TESTING E DEBUGGING
==============================================
*/

// Dopo il caricamento, testa il sistema dalla console:

/*
// Test 1: Verifica inizializzazione
console.log('DataStateManager disponibile:', !!window.DataStateManager);
console.log('Bridge attivo:', !!window.applyFiltersUnified);

// Test 2: Verifica dati
window.debugAppState();

// Test 3: Test reset
window.resetFilters();

// Test 4: Test filtro
window.applyFiltersUnified({
    stato: 'Patto stipulato',
    upl: '',
    quartiere: '',
    circoscrizione: '',
    ambiti: '',
    titolo: '',
    proponente: ''
});

// Test 5: Verifica sincronizzazione
console.log('allData length:', window.allData.length);
console.log('filteredData length:', window.filteredData.length);
console.log('Manager data:', window.DataStateManager.getData());
*/


/* 
==============================================
RISOLUZIONE PROBLEMI COMUNI
==============================================
*/

// PROBLEMA: "DataStateManager is undefined"
// SOLUZIONE: Verifica ordine caricamento script (data-state-manager.js deve essere PRIMO)

// PROBLEMA: "Le statistiche non si aggiornano dopo reset"
// SOLUZIONE: 
//   1. Apri console
//   2. Esegui: window.DataStateManager.resetFilters()
//   3. Verifica: window.debugAppState()

// PROBLEMA: "I grafici non si aggiornano"
// SOLUZIONE: Verifica che cleanupCharts() e createHorizontalCharts() siano definite

// PROBLEMA: "Reset parziale - alcuni filtri rimangono"
// SOLUZIONE: Il nuovo sistema resetta TUTTO atomicamente. Se vedi filtri attivi:
//   1. Apri console
//   2. Esegui: window.DataStateManager.resetFilters()
//   3. Se persiste: window.forceSyncData()

// PROBLEMA: "Race conditions - aggiornamenti multipli"
// SOLUZIONE: Il flag AppState.isUpdating previene questo. Se persiste:
//   1. Apri console
//   2. Verifica: DataStateManager._getState() 
//   3. Se isUpdating è true ma bloccato: ricarica pagina

/* 
==============================================
VANTAGGI DEL NUOVO SISTEMA
==============================================
*/

/*
✅ UNICA FONTE DI VERITÀ
   - Tutti i dati passano per DataStateManager
   - Nessuna inconsistenza tra variabili

✅ NIENTE RACE CONDITIONS  
   - Flag isUpdating previene aggiornamenti concorrenti
   - Operazioni atomiche

✅ PATTERN OBSERVER
   - Componenti si registrano e vengono notificati
   - Accoppiamento lasco tra moduli

✅ RETROCOMPATIBILITÀ
   - Le vecchie funzioni continuano a funzionare
   - Il bridge le redirge al nuovo sistema

✅ DEBUG SEMPLIFICATO
   - window.debugAppState() per vedere tutto
   - Console log dettagliati

✅ RESET ATOMICO
   - Un solo punto di reset
   - Garantito funzionare sempre
*/


/* 
==============================================
MIGRAZIONE STEP-BY-STEP
==============================================
*/

/*
STEP 1: Aggiungi i nuovi file
   - Crea data-state-manager.js
   - Crea integration-bridge.js
   
STEP 2: Modifica HTML
   - Aggiungi <script src="data-state-manager.js"></script> PRIMA di monitoraggio_p1.js
   - Aggiungi <script src="integration-bridge.js"></script> DOPO tutti gli altri

STEP 3: Applica patch
   - Sostituisci funzioni in stats-dataviz-panel.js
   - Sostituisci funzioni in monitoraggio_p1.js

STEP 4: Testa
   - Apri console
   - Esegui: window.debugAppState()
   - Testa reset: window.resetFilters()
   - Testa filtri: applica filtro da UI
   - Verifica statistiche si aggiornano

STEP 5: Cleanup (opzionale)
   - Rimuovi funzioni duplicate/obsolete
   - Rimuovi setTimeout non necessari
   - Semplifica codice legacy
*/