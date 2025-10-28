// ==========================================
// INTEGRATION BRIDGE - VERSIONE CORRETTA
// ==========================================

(function() {
    'use strict';

    console.log('🌉 Integration Bridge: Inizializzazione...');

    function waitForDataManager(callback) {
        if (window.DataStateManager) {
            callback();
        } else {
            setTimeout(() => waitForDataManager(callback), 100);
        }
    }

    waitForDataManager(() => {
        console.log('✅ DataStateManager trovato, configurazione bridge...');
        setupBridge();
    });

    function setupBridge() {
        // ==========================================
        // ✅ FIX 1: OBSERVER STATS CON DELAY
        // ==========================================
        window.DataStateManager.subscribe('stats', (data) => {
            console.log('📊 Bridge → Stats Panel (dati aggiornati)');
            
            // Sincronizza variabili globali
            window.filteredData = data.filtered;
            window.allData = data.all;
            
            // ✅ DELAY per stabilità DOM
            setTimeout(() => {
                if (typeof window.updateStatsDisplay === 'function') {
                    window.updateStatsDisplay();
                    console.log('✅ Statistiche aggiornate');
                }
            }, 150);
        });

        // ==========================================
        // ✅ FIX 2: OBSERVER CHARTS CON PULIZIA
        // ==========================================
        window.DataStateManager.subscribe('charts', (data) => {
            console.log('📈 Bridge → Charts (dati aggiornati)');
            
            const datavizTab = document.getElementById('dataviz-tab');
            if (datavizTab && datavizTab.classList.contains('active')) {
                // Pulisci prima
                if (typeof window.cleanupCharts === 'function') {
                    window.cleanupCharts();
                }
                
                // Ricrea dopo delay
                setTimeout(() => {
                    if (typeof window.createHorizontalCharts === 'function') {
                        window.createHorizontalCharts();
                        console.log('✅ Grafici aggiornati');
                    }
                }, 200);
            }
        });

        // ==========================================
        // OBSERVER MAP
        // ==========================================
        window.DataStateManager.subscribe('map', (data) => {
            console.log('🗺️ Bridge → Mappa (dati aggiornati)');
            
            if (typeof window.updateMap === 'function') {
                window.updateMap();
            }
        });

        // ==========================================
        // OBSERVER TABLE
        // ==========================================
        window.DataStateManager.subscribe('table', (data) => {
            console.log('📋 Bridge → Tabella (dati aggiornati)');
            
            if (typeof window.updateTable === 'function') {
                window.updateTable();
            }
        });

        // ==========================================
        // OBSERVER FILTERS UI
        // ==========================================
        window.DataStateManager.subscribe('filters', (data) => {
            console.log('🔍 Bridge → Filtri UI (dati aggiornati)');
            
            if (typeof window.updateFilters === 'function') {
                window.updateFilters();
            }
            
            if (typeof window.updateFiltersPopup === 'function') {
                window.updateFiltersPopup();
            }
        });

        // ==========================================
        // ✅ FIX 3: WRAPPER applyFilters CORRETTO
        // ==========================================
        const originalApplyFilters = window.applyFilters;
        
        window.applyFilters = function() {
            console.log('🔄 applyFilters() chiamato → redirect a DataStateManager');
            
            // Raccogli filtri
            const filters = {
                stato: document.getElementById('filterStato')?.value?.trim() || '',
                upl: document.getElementById('filterUpl')?.value?.trim() || '',
                quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
                circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
                ambiti: document.getElementById('filterAmbiti')?.value?.trim() || '',
                titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
                proponente: window.proponenteFilter?.trim() || ''
            };
            
            console.log('📊 Filtri raccolti:', filters);
            
            // ✅ APPLICA tramite DataStateManager
            const success = window.DataStateManager.applyFilters(filters);
            
            if (success) {
                console.log('✅ Filtri applicati con successo');
            } else {
                console.error('❌ Errore applicazione filtri');
            }
            
            return success;
        };

        // ==========================================
        // ✅ FIX 4: RESET UNIFICATO
        // ==========================================
        window.resetFilters = function() {
            console.log('🔄 resetFilters() UNIFICATO chiamato');
            
            // 1️⃣ Reset tramite DataStateManager
            const success = window.DataStateManager.resetFilters();
            
            if (!success) {
                console.error('❌ Reset DataStateManager fallito');
                return false;
            }
            
            // 2️⃣ Reset UI Filtri (già fatto dal Manager, ma assicuriamoci)
            const filterIds = [
                'filterStato', 
                'filterUpl', 
                'filterQuartiere', 
                'filterCircoscrizione', 
                'filterAmbiti', 
                'filterTitolo'
            ];

            filterIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = '';
                    el.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
                    el.classList.add('border-gray-300');
                    el.style.fontWeight = 'normal';
                }
            });
            
            // 3️⃣ Reset Smart Search
            if (typeof window.clearSmartSearchCompletely === 'function') {
                window.clearSmartSearchCompletely();
            }
            
            // 4️⃣ Reset Proponente Filter
            window.proponenteFilter = '';
            
            // 5️⃣ Chiudi popup filtri
            if (typeof window.hideFiltersPopup === 'function') {
                window.hideFiltersPopup();
            }
            
            console.log('✅ Reset completo eseguito');
            return true;
        };

        // Alias
        window.resetFiltersFromPopup = window.resetFilters;
        window.resetStatsPanelToDefault = window.resetFilters;

        // ==========================================
        // ✅ FIX 5: WRAPPER handleChartClick
        // ==========================================
        window.handleChartClick = function(chartType, selectedValue) {
            console.log('📊 handleChartClick:', chartType, selectedValue);
            
            // Costruisci filtri
            const currentFilters = window.DataStateManager.getData().filters || {};
            
            const filters = {
                stato: chartType === 'stato' ? selectedValue : (currentFilters.stato || ''),
                upl: currentFilters.upl || '',
                quartiere: currentFilters.quartiere || '',
                circoscrizione: currentFilters.circoscrizione || '',
                ambiti: chartType === 'ambiti' ? selectedValue : (currentFilters.ambiti || ''),
                titolo: currentFilters.titolo || '',
                proponente: chartType === 'proponente' ? selectedValue : (currentFilters.proponente || '')
            };
            
            // Aggiorna UI
            if (chartType === 'stato') {
                const select = document.getElementById('filterStato');
                if (select) select.value = selectedValue;
            } else if (chartType === 'proponente') {
                window.proponenteFilter = selectedValue;
            } else if (chartType === 'ambiti') {
                const select = document.getElementById('filterAmbiti');
                if (select) select.value = selectedValue;
            }
            
            // Applica
            return window.DataStateManager.applyFilters(filters);
        };

        // ==========================================
        // INTERCETTA loadData
        // ==========================================
        const originalLoadData = window.loadData;
        
        window.loadData = async function() {
            console.log('📥 loadData() chiamato');
            
            try {
                if (originalLoadData) {
                    await originalLoadData();
                }
                
                if (window.allData && window.allData.length > 0) {
                    window.DataStateManager.initialize(window.allData);
                    console.log('✅ Dati sincronizzati con DataStateManager');
                }
                
            } catch (error) {
                console.error('❌ Errore in loadData:', error);
            }
        };

        // ==========================================
        // HELPER
        // ==========================================
        window.forceSyncData = function() {
            console.log('🔄 Sincronizzazione manuale forzata');
            
            if (window.allData && window.allData.length > 0) {
                window.DataStateManager.initialize(window.allData);
                return true;
            }
            
            console.warn('⚠️ Nessun dato da sincronizzare');
            return false;
        };

        window.debugAppState = function() {
            const data = window.DataStateManager.getData();
            console.log('🔍 DEBUG App State:', {
                total: data.count.total,
                filtered: data.count.filtered,
                percentage: ((data.count.filtered / data.count.total) * 100).toFixed(1) + '%',
                isFiltered: data.count.filtered < data.count.total,
                filters: data.filters
            });
            return data;
        };

        console.log('✅ Integration Bridge configurato correttamente');
    }

})();
