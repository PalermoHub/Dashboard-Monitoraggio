// ==========================================
// DATA STATE MANAGER - SISTEMA CENTRALIZZATO
// ==========================================
// ⭐ UNICA FONTE DI VERITÀ PER TUTTI I DATI
// ⭐ ELIMINA RACE CONDITIONS E INCONSISTENZE

(function() {
    'use strict';

    // ==========================================
    // STATO GLOBALE CENTRALIZZATO
    // ==========================================
    const AppState = {
        // Dati
        allData: [],
        filteredData: [],
        
        // Filtri attivi
        activeFilters: {
            stato: '',
            upl: '',
            quartiere: '',
            circoscrizione: '',
            ambiti: '',
            titolo: '',
            proponente: ''
        },
        
        // Stato UI
        isUpdating: false,
        lastUpdate: null,
        
        // Osservatori (pattern Observer)
        observers: {
            data: [],
            filters: [],
            stats: [],
            charts: [],
            map: [],
            table: []
        }
    };

    // ==========================================
    // CORE: GESTIONE DATI
    // ==========================================
    
    const DataManager = {
        /**
         * Inizializza i dati - UNICO PUNTO DI INGRESSO
         */
        initialize(data) {
            console.log('📊 DataManager: Inizializzazione con', data.length, 'elementi');
            
            AppState.allData = Object.freeze([...data]); // Immutabile
            AppState.filteredData = [...data];
            AppState.lastUpdate = new Date();
            
            // Sincronizza globali (backward compatibility)
            window.allData = AppState.allData;
            window.filteredData = AppState.filteredData;
            
            this.notifyObservers('data');
            
            console.log('✅ Dati inizializzati correttamente');
            return true;
        },

        /**
         * Ottieni dati - UNICO PUNTO DI LETTURA
         */
        getData() {
            return {
                all: AppState.allData,
                filtered: AppState.filteredData,
                count: {
                    total: AppState.allData.length,
                    filtered: AppState.filteredData.length
                }
            };
        },

        /**
         * Applica filtri - UNICO PUNTO DI FILTRAGGIO
         */
        applyFilters(filters) {
            if (AppState.isUpdating) {
                console.warn('⚠️ Aggiornamento già in corso, skip');
                return false;
            }

            AppState.isUpdating = true;
            console.log('🔍 Applicazione filtri:', filters);

            try {
                // Aggiorna stato filtri
                AppState.activeFilters = { ...filters };

                // Filtra i dati
                AppState.filteredData = this._filterData(AppState.allData, filters);
                
                // Sincronizza globali
                window.filteredData = AppState.filteredData;
                
                console.log(`✅ Filtrati ${AppState.filteredData.length}/${AppState.allData.length} elementi`);
                
                // Notifica TUTTI gli osservatori in sequenza
                this.notifyObservers('filters');
                this.notifyObservers('stats');
                this.notifyObservers('charts');
                this.notifyObservers('map');
                this.notifyObservers('table');
                
                return true;
            } catch (error) {
                console.error('❌ Errore applicazione filtri:', error);
                return false;
            } finally {
                setTimeout(() => {
                    AppState.isUpdating = false;
                }, 100);
            }
        },

        /**
         * Reset COMPLETO - UNICO PUNTO DI RESET
         */
        resetFilters() {
            console.log('🔄 Reset COMPLETO filtri e dati');

            if (AppState.isUpdating) {
                console.warn('⚠️ Aggiornamento in corso, attendo...');
                setTimeout(() => this.resetFilters(), 100);
                return;
            }

            AppState.isUpdating = true;

            try {
                // 1. Reset filtri
                AppState.activeFilters = {
                    stato: '',
                    upl: '',
                    quartiere: '',
                    circoscrizione: '',
                    ambiti: '',
                    titolo: '',
                    proponente: ''
                };

                // 2. Reset dati filtrati = tutti i dati
                AppState.filteredData = [...AppState.allData];
                
                // 3. Sincronizza globali
                window.filteredData = AppState.filteredData;
                window.proponenteFilter = '';
                
                // 4. Reset UI filtri
                this._resetFilterInputs();
                
                console.log('✅ Reset dati completato:', {
                    total: AppState.allData.length,
                    filtered: AppState.filteredData.length,
                    areEqual: AppState.allData.length === AppState.filteredData.length
                });

                // 5. Notifica TUTTI gli osservatori in sequenza
                this.notifyObservers('filters');
                this.notifyObservers('stats');
                this.notifyObservers('charts');
                this.notifyObservers('map');
                this.notifyObservers('table');

                return true;
            } catch (error) {
                console.error('❌ Errore reset filtri:', error);
                return false;
            } finally {
                setTimeout(() => {
                    AppState.isUpdating = false;
                }, 150);
            }
        },

        /**
         * Logica di filtraggio interna
         */
        _filterData(data, filters) {
            return data.filter(item => {
                // Trova le chiavi dinamicamente
                const keys = {
                    stato: Object.keys(item).find(k => k.toLowerCase().includes('stato')),
                    upl: Object.keys(item).find(k => k.toLowerCase() === 'upl'),
                    quartiere: Object.keys(item).find(k => k.toLowerCase().includes('quartiere')),
                    circoscrizione: Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione')),
                    ambiti: Object.keys(item).find(k => k.toLowerCase().includes('ambiti')),
                    titolo: Object.keys(item).find(k => k.toLowerCase().includes('titolo')),
                    proponente: Object.keys(item).find(k => k.toLowerCase().includes('proponente'))
                };

                // Applica ogni filtro
                const matches = {
                    stato: !filters.stato || (item[keys.stato]?.trim() === filters.stato.trim()),
                    upl: !filters.upl || (item[keys.upl]?.trim() === filters.upl.trim()),
                    quartiere: !filters.quartiere || (item[keys.quartiere]?.trim() === filters.quartiere.trim()),
                    circoscrizione: !filters.circoscrizione || (item[keys.circoscrizione]?.trim() === filters.circoscrizione.trim()),
                    ambiti: !filters.ambiti || (item[keys.ambiti]?.trim() === filters.ambiti.trim()),
                    titolo: !filters.titolo || (item[keys.titolo]?.toLowerCase().includes(filters.titolo.toLowerCase())),
                    proponente: !filters.proponente || (item[keys.proponente]?.trim() === filters.proponente.trim())
                };

                return Object.values(matches).every(match => match);
            });
        },

        /**
         * Reset input HTML
         */
        _resetFilterInputs() {
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
                    
                    // Reset aspetto visivo
                    el.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
                    el.classList.add('border-gray-300');
                    el.style.fontWeight = 'normal';
                }
            });

            // Reset Smart Search
            if (typeof window.clearSmartSearchCompletely === 'function') {
                window.clearSmartSearchCompletely();
            }
        },

        /**
         * Notifica osservatori
         */
        notifyObservers(type) {
            const observers = AppState.observers[type] || [];
            console.log(`📢 Notifica ${observers.length} osservatori di tipo "${type}"`);
            
            observers.forEach(callback => {
                try {
                    callback(this.getData());
                } catch (error) {
                    console.error(`Errore in osservatore ${type}:`, error);
                }
            });
        },

        /**
         * Registra osservatore
         */
        subscribe(type, callback) {
            if (!AppState.observers[type]) {
                AppState.observers[type] = [];
            }
            AppState.observers[type].push(callback);
            console.log(`✅ Osservatore registrato per "${type}"`);
            return () => this.unsubscribe(type, callback);
        },

        /**
         * Rimuovi osservatore
         */
        unsubscribe(type, callback) {
            if (AppState.observers[type]) {
                AppState.observers[type] = AppState.observers[type].filter(cb => cb !== callback);
            }
        }
    };

    // ==========================================
    // ESPOSIZIONE GLOBALE - API PUBBLICA
    // ==========================================
    window.DataStateManager = DataManager;

    // Metodi di convenienza globali
    window.getAppData = () => DataManager.getData();
    window.applyFiltersUnified = (filters) => DataManager.applyFilters(filters);
    window.resetFiltersUnified = () => DataManager.resetFilters();

    console.log('✅ DataStateManager caricato e pronto');

})();
