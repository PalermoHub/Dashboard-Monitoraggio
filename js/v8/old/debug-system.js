// ==========================================
// SISTEMA DI DIAGNOSTICA COMPLETO
// debug-system.js
// ==========================================

(function() {
    'use strict';
    
    console.log('🔧 Sistema di diagnostica in caricamento...');
    
    // Attendi che i dati siano disponibili
    function waitForData(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.allData && window.allData.length > 0) {
                clearInterval(checkInterval);
                console.log('✅ Dati trovati, inizializzazione diagnostica...');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Timeout: dati non trovati dopo', maxAttempts, 'tentativi');
            }
        }, 100);
    }
    
    // Inizializza sistema di diagnostica
    waitForData(function() {
        
        // ==========================================
        // FUNZIONE: debugStatsState
        // ==========================================
        window.debugStatsState = function() {
            const state = {
                // Dati
                windowAllData: window.allData?.length || 0,
                windowFilteredData: window.filteredData?.length || 0,
                localFilteredData: (typeof filteredData !== 'undefined') ? filteredData?.length : 'undefined',
                
                // Sincronizzazione
                isSynced: window.filteredData?.length === window.allData?.length,
                syncPercentage: window.allData?.length > 0 
                    ? ((window.filteredData?.length / window.allData?.length) * 100).toFixed(1) + '%'
                    : 'N/A',
                
                // Stato UI
                updateStatsDisplayExists: typeof window.updateStatsDisplay === 'function',
                panelOpen: document.getElementById('statsDatavizPanel')?.classList.contains('open'),
                activeTab: document.querySelector('.stats-tab-content.active')?.id || 'none',
                
                // Statistiche DOM
                domStats: {
                    total: document.querySelector('[data-stat="total"] .stat-value')?.textContent || 'N/A',
                    stipulati: document.querySelector('[data-stat="stipulati"] .stat-value')?.textContent || 'N/A',
                    istruttoria: document.querySelector('[data-stat="istruttoria"] .stat-value')?.textContent || 'N/A',
                    integrazione: document.querySelector('[data-stat="integrazione"] .stat-value')?.textContent || 'N/A',
                    monitoraggio: document.querySelector('[data-stat="monitoraggio"] .stat-value')?.textContent || 'N/A',
                    respinti: document.querySelector('[data-stat="respinti"] .stat-value')?.textContent || 'N/A',
                    archiviati: document.querySelector('[data-stat="archiviati"] .stat-value')?.textContent || 'N/A'
                },
                
                // Funzioni disponibili
                functions: {
                    updateStatsDisplay: typeof window.updateStatsDisplay === 'function',
                    resetStatsPanelToDefault: typeof window.resetStatsPanelToDefault === 'function',
                    applyFilters: typeof applyFilters === 'function',
                    updateFilters: typeof updateFilters === 'function',
                    resetFiltersFromPopup: typeof resetFiltersFromPopup === 'function'
                }
            };
            
            console.log('%c🔍 DEBUG STATS STATE', 'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            console.table(state);
            
            // Verifica problemi comuni
            const warnings = [];
            const errors = [];
            
            if (state.windowAllData === 0) errors.push('window.allData è vuoto!');
            if (state.windowFilteredData === 0) errors.push('window.filteredData è vuoto!');
            if (!state.isSynced && state.windowFilteredData < state.windowAllData) {
                warnings.push(`Dati non sincronizzati: ${state.windowFilteredData}/${state.windowAllData}`);
            }
            if (!state.updateStatsDisplayExists) errors.push('updateStatsDisplay non trovata!');
            if (!state.panelOpen) warnings.push('Pannello statistiche chiuso');
            
            if (errors.length > 0) {
                console.error('%c❌ ERRORI CRITICI', 'background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
                errors.forEach(err => console.error('  ❌', err));
            }
            
            if (warnings.length > 0) {
                console.warn('%c⚠️ AVVISI', 'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
                warnings.forEach(warn => console.warn('  ⚠️', warn));
            }
            
            if (errors.length === 0 && warnings.length === 0) {
                console.log('%c✅ Tutto OK!', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            }
            
            return state;
        };
        
        // ==========================================
        // FUNZIONE: forceStatsUpdate
        // ==========================================
        window.forceStatsUpdate = function() {
            console.log('%c🔧 FORCE STATS UPDATE', 'background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            
            // 1. Verifica dati
            if (!window.allData || window.allData.length === 0) {
                console.error('❌ window.allData non disponibile');
                return false;
            }
            
            // 2. Forza sincronizzazione
            const beforeSync = window.filteredData?.length || 0;
            window.filteredData = window.filteredData || [...window.allData];
            
            console.log('📊 Sincronizzazione:', {
                prima: beforeSync,
                dopo: window.filteredData.length,
                allData: window.allData.length
            });
            
            // 3. Chiama updateStatsDisplay
            if (typeof window.updateStatsDisplay === 'function') {
                try {
                    window.updateStatsDisplay();
                    console.log('✅ updateStatsDisplay eseguito');
                    
                    // Verifica risultato
                    setTimeout(() => {
                        const total = document.querySelector('[data-stat="total"] .stat-value')?.textContent;
                        console.log('📊 Valore totale nel DOM:', total);
                    }, 100);
                    
                    return true;
                } catch (error) {
                    console.error('❌ Errore in updateStatsDisplay:', error);
                    return false;
                }
            } else {
                console.error('❌ updateStatsDisplay non disponibile');
                return false;
            }
        };
        
        // ==========================================
        // FUNZIONE: testFullReset
        // ==========================================
        window.testFullReset = function() {
            console.log('%c🧪 TEST FULL RESET', 'background: #ec4899; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            
            // Salva stato precedente
            const stateBefore = {
                filteredLength: window.filteredData?.length || 0,
                allLength: window.allData?.length || 0,
                domTotal: document.querySelector('[data-stat="total"] .stat-value')?.textContent
            };
            
            console.log('📊 Stato PRIMA del reset:', stateBefore);
            
            // Esegui reset
            const resetFn = resetFiltersFromPopup || window.resetFiltersFromPopup;
            
            if (typeof resetFn === 'function') {
                resetFn();
            } else {
                console.error('❌ resetFiltersFromPopup non trovata');
                console.log('Funzioni disponibili:', Object.keys(window).filter(k => k.includes('reset')));
                return false;
            }
            
            // Verifica dopo reset
            setTimeout(() => {
                const stateAfter = {
                    filteredLength: window.filteredData?.length || 0,
                    allLength: window.allData?.length || 0,
                    areSynced: window.filteredData?.length === window.allData?.length,
                    domTotal: document.querySelector('[data-stat="total"] .stat-value')?.textContent
                };
                
                console.log('📊 Stato DOPO il reset:', stateAfter);
                
                // Confronto
                console.log('📊 Confronto:', {
                    dataChanged: stateBefore.filteredLength !== stateAfter.filteredLength,
                    dataSynced: stateAfter.areSynced,
                    domUpdated: stateBefore.domTotal !== stateAfter.domTotal
                });
                
                if (stateAfter.areSynced && stateAfter.domTotal == stateAfter.allLength) {
                    console.log('%c✅ Reset completato con successo!', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
                } else {
                    console.error('%c❌ Reset fallito', 'background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px;');
                    console.log('🔧 Tentativo correzione automatica...');
                    window.forceStatsUpdate();
                }
                
                // Mostra stato finale
                setTimeout(() => window.debugStatsState(), 200);
            }, 600);
        };
        
        // ==========================================
        // FUNZIONE: openStatsPanel
        // ==========================================
        window.openStatsPanel = function() {
            console.log('📊 Apertura pannello statistiche...');
            
            if (typeof window.openStatsDatavizPanel === 'function') {
                window.openStatsDatavizPanel();
                setTimeout(() => {
                    console.log('✅ Pannello aperto');
                    window.debugStatsState();
                }, 500);
            } else {
                console.error('❌ openStatsDatavizPanel non disponibile');
            }
        };
        
        // ==========================================
        // MONITOR AUTOMATICO
        // ==========================================
        
        // Intercetta updateStatsDisplay
        if (typeof window.updateStatsDisplay === 'function') {
            const originalUpdate = window.updateStatsDisplay;
            window.updateStatsDisplay = function() {
                console.log('📊 updateStatsDisplay CHIAMATO', {
                    filteredData: window.filteredData?.length,
                    allData: window.allData?.length
                });
                const result = originalUpdate.apply(this, arguments);
                console.log('📊 updateStatsDisplay COMPLETATO');
                return result;
            };
        }
        
        // ==========================================
        // INDICATORE VISIVO
        // ==========================================
        function createDebugIndicator() {
            if (document.getElementById('debugIndicator')) return;
            
            const indicator = document.createElement('div');
            indicator.id = 'debugIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0,0,0,0.85);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 11px;
                font-family: 'Courier New', monospace;
                z-index: 99999;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                min-width: 200px;
                backdrop-filter: blur(10px);
            `;
            
            indicator.innerHTML = `
                <div id="debugContent" style="line-height: 1.6;"></div>
                <button onclick="this.parentElement.style.display='none'" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ef4444;
                    border: none;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    font-weight: bold;
                ">×</button>
            `;
            
            document.body.appendChild(indicator);
        }
        
        function updateDebugIndicator() {
            const indicator = document.getElementById('debugIndicator');
            const content = document.getElementById('debugContent');
            
            if (!indicator || !content) return;
            
            const allLength = window.allData?.length || 0;
            const filteredLength = window.filteredData?.length || 0;
            const isSynced = allLength === filteredLength;
            const domTotal = document.querySelector('[data-stat="total"] .stat-value')?.textContent || '?';
            
            const bgColor = isSynced && domTotal == allLength ? '16,185,129' : '239,68,68';
            const status = isSynced && domTotal == allLength ? '✅' : '⚠️';
            
            indicator.style.background = `rgba(${bgColor},0.9)`;
            indicator.style.backdropFilter = 'blur(10px)';
            
            content.innerHTML = `
                <strong>${status} Debug Stats</strong><br>
                Dati: ${filteredLength}/${allLength}<br>
                DOM: ${domTotal}<br>
                ${isSynced ? 'Sincronizzato ✓' : '<strong>NON Sincronizzato ✗</strong>'}
            `;
            
            // Mostra sempre (rimuovi l'auto-hide)
            indicator.style.display = 'block';
        }
        
        // Crea indicatore
        createDebugIndicator();
        
        // Aggiorna periodicamente
        setInterval(updateDebugIndicator, 2000);
        updateDebugIndicator();
        
        // ==========================================
        // COMANDI CONSOLE
        // ==========================================
        console.log('%c✅ Sistema di diagnostica caricato', 'background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px;');
        console.log('%cComandi disponibili:', 'font-weight: bold; font-size: 13px; margin-top: 10px;');
        console.log('  📊 debugStatsState()    - Mostra stato completo');
        console.log('  🔧 forceStatsUpdate()   - Forza aggiornamento statistiche');
        console.log('  🧪 testFullReset()      - Testa reset completo');
        console.log('  📈 openStatsPanel()     - Apri pannello statistiche');
        console.log('%cEsempio: debugStatsState()', 'color: #3b82f6; font-style: italic;');
    });
    
	// ==========================================
        // FUNZIONE DI EMERGENZA: fixStatsNow
        // ==========================================
        window.fixStatsNow = function() {
            console.log('🚨 FIX STATISTICHE FORZATO');
            
            if (window.allData && window.allData.length > 0) {
                window.filteredData = [...window.allData];
                console.log('✅ Dati forzati a:', window.filteredData.length);
                
                if (typeof window.updateStatsDisplay === 'function') {
                    window.updateStatsDisplay();
                    
                    setTimeout(() => {
                        const domTotal = document.querySelector('[data-stat="total"] .stat-value')?.textContent;
                        console.log('📊 Verifica:', {
                            expected: window.allData.length,
                            got: domTotal,
                            match: domTotal == window.allData.length ? '✅' : '❌'
                        });
                        
                        if (domTotal != window.allData.length) {
                            console.error('❌ Secondo tentativo...');
                            setTimeout(() => window.updateStatsDisplay(), 100);
                        }
                    }, 100);
                }
            } else {
                console.error('❌ allData non disponibile');
            }
        };
        
        // ==========================================
        // COMANDI CONSOLE - AGGIORNATO
        // ==========================================
        console.log('%c✅ Sistema di diagnostica caricato', 'background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px;');
        console.log('%cComandi disponibili:', 'font-weight: bold; font-size: 13px; margin-top: 10px;');
        console.log('  📊 debugStatsState()    - Mostra stato completo');
        console.log('  🔧 forceStatsUpdate()   - Forza aggiornamento statistiche');
        console.log('  🧪 testFullReset()      - Testa reset completo');
        console.log('  📈 openStatsPanel()     - Apri pannello statistiche');
        console.log('  🚨 fixStatsNow()        - Fix forzato statistiche (EMERGENCY)');
        console.log('%cEsempio: debugStatsState()', 'color: #3b82f6; font-style: italic;');
    });
    
	
})();