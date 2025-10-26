// ================================================
// STATS & DATAVIZ PANEL - RIUTILIZZANDO LE FUNZIONI PRINCIPALI
// ================================================
// Sincronizzazione diretta con monitoraggio_p1-v7.js

console.log('🚀 Stats & DataViz Panel v3: Riutilizzo funzioni principali');

// ==========================================
// VARIABILI GLOBALI
// ==========================================
let statsPanel = null;
let statsClonedChart = null;
let statsPanelCloned = {
    isInitialized: false,
    currentChartType: 'stato'
};

// ==========================================
// DEBUG HELPER
// ==========================================
function debugStatsLog(title, data) {
    console.log(`%c[StatsPanel] ${title}`, 'color: #10b981; font-weight: bold; font-size: 12px;', data);
}

function debugStatsError(title, data) {
    console.error(`%c[StatsPanel] ${title}`, 'color: #ef4444; font-weight: bold; font-size: 12px;', data);
}

// ==========================================
// INIZIALIZZAZIONE PANEL
// ==========================================

function initializeStatsDatavizPanel() {
    console.log('Inizializzazione Stats Panel...');
    
    const panel = document.getElementById('statsDatavizPanel');
    if (!panel) {
        debugStatsError('❌ Panel non trovato nel DOM', null);
        return false;
    }

    debugStatsLog('✅ Panel trovato nel DOM', null);

    // Setup listeners per i tab
    setupTabListeners();
    
    // Setup listeners per chiusura panel
    setupPanelCloseListener();
    
    // Setup interazione con side panel
    setupSidePanelInteraction();
    
    statsPanelCloned.isInitialized = true;
    
    return true;
}

// ==========================================
// SETUP TAB LISTENERS
// ==========================================
function setupTabListeners() {
    const tabButtons = document.querySelectorAll('.stats-tab-btn');
    const tabContents = document.querySelectorAll('.stats-tab-content');

    debugStatsLog('Tab buttons trovati', tabButtons.length);

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            console.log('🔄 Cambio tab a:', targetTab);
            
            // Rimuovi la classe active da tutti i bottoni e contenuti
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Aggiungi la classe active al bottone e contenuto selezionati
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Se è il tab DataViz, ricrea il grafico
                if (targetTab === 'dataviz-tab') {
                    console.log('📊 Tab DataViz attivato - ricreazione grafico');
                    setTimeout(() => {
                        syncAndUpdateChart();
                        if (statsClonedChart && typeof statsClonedChart.resize === 'function') {
                            statsClonedChart.resize();
                        }
                    }, 150);
                }
            }

            debugStatsLog('📍 Tab cambiato', { tab: targetTab });
        });
    });
}

// ==========================================
// SETUP PANEL CLOSE LISTENER
// ==========================================
function setupPanelCloseListener() {
    const closeBtn = document.getElementById('closeStatsPanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeStatsDatavizPanel);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.getElementById('statsDatavizPanel');
            if (panel && panel.classList.contains('open')) {
                closeStatsDatavizPanel();
            }
        }
    });
}

// ==========================================
// SETUP SIDE PANEL INTERACTION
// ==========================================
function setupSidePanelInteraction() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                const sidePanel = document.getElementById('pattoSidePanel');
                const statsPanel = document.getElementById('statsDatavizPanel');
                
                if (!sidePanel || !statsPanel) return;

                const isSidePanelOpen = sidePanel.classList.contains('open');
                const isStatsPanelOpen = statsPanel.classList.contains('open');
                
                if (isSidePanelOpen && isStatsPanelOpen) {
                    statsPanel.classList.remove('open');
                    debugStatsLog('🔙 Side panel aperto - Stats panel chiuso', null);
                }
            }
        });
    });

    const sidePanel = document.getElementById('pattoSidePanel');
    if (sidePanel) {
        observer.observe(sidePanel, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
}

// ==========================================
// APRI STATS & DATAVIZ PANEL
// ==========================================
function openStatsDatavizPanel() {
    try {
        const sidePanel = document.getElementById('pattoSidePanel');
        if (sidePanel && sidePanel.classList.contains('open')) {
            if (typeof window.closeSidePanel === 'function') {
                window.closeSidePanel();
            } else {
                sidePanel.classList.remove('open');
            }
        }

        const panel = document.getElementById('statsDatavizPanel');
        if (!panel) {
            debugStatsError('❌ Panel non trovato', null);
            return;
        }

        panel.classList.add('open');
        
        // Aggiorna il contenuto
        updateStatsDatavizPanelContent();
        
        // Attiva il primo tab
        const firstTabBtn = document.querySelector('[data-tab="legenda-tab"]');
        if (firstTabBtn) {
            firstTabBtn.click();
        }

        debugStatsLog('✅ Panel aperto', null);

    } catch (error) {
        debugStatsError('❌ Errore apertura panel', error);
    }
}

// ==========================================
// CHIUDI STATS & DATAVIZ PANEL
// ==========================================
function closeStatsDatavizPanel() {
    try {
        const panel = document.getElementById('statsDatavizPanel');
        if (panel) {
            panel.classList.remove('open');
            debugStatsLog('🔒 Panel chiuso', null);
        }
    } catch (error) {
        debugStatsError('❌ Errore chiusura panel', error);
    }
}

// ==========================================
// AGGIORNA CONTENUTO PANEL - RIUTILIZZANDO FUNZIONI PRINCIPALI
// ==========================================
function updateStatsDatavizPanelContent() {
    try {
        console.log('🔄 Aggiornamento panel da funzioni principali...');
        
        // Usa le funzioni ORIGINALI di monitoraggio_p1-v7.js
        const statsContainerClone = document.getElementById('statsContainerClone');
        const chartSectionClone = document.getElementById('chartSectionClone');

        if (statsContainerClone && window.filteredData) {
            // Ricopia le statistiche DIRETTAMENTE dalla pagina principale
            const originalStats = document.querySelector('.dashboard-main .stats-container');
            if (originalStats) {
                // Copia il contenuto HTML completo
                statsContainerClone.innerHTML = originalStats.innerHTML;
                console.log('✅ Statistiche copiate da dashboard principale');
            }
        }

        if (chartSectionClone && window.statusChart) {
            // Ricopia il grafico
            const originalChart = document.querySelector('.dashboard-main .chart-section');
            if (originalChart) {
                chartSectionClone.innerHTML = originalChart.innerHTML;
                console.log('✅ Chart HTML copiato');
            }
            
            // Ricrea il canvas per il grafico clonato
            setTimeout(() => {
                syncAndUpdateChart();
            }, 100);
        }

        console.log('✅ Panel completamente aggiornato');

    } catch (error) {
        debugStatsError('❌ Errore aggiornamento panel', error);
    }
}

// ==========================================
// SINCRONIZZA E AGGIORNA CHART - RIUTILIZZANDO LOGICA PRINCIPALE
// ==========================================
function syncAndUpdateChart() {
    try {
        const clonedCanvas = document.querySelector('#chartSectionClone canvas');
        if (!clonedCanvas) {
            console.log('⚠️ Canvas clonato non trovato');
            return;
        }

        // Distruggi il grafico precedente
        if (statsClonedChart) {
            statsClonedChart.destroy();
            statsClonedChart = null;
        }

        // Usa il grafico ORIGINALE come riferimento
        if (window.statusChart && window.statusChart.data) {
            console.log('📊 Creazione chart clonato da statusChart originale');
            
            const ctx = clonedCanvas.getContext('2d');
            
            // Copia la configurazione originale
            statsClonedChart = new Chart(ctx, {
                type: window.statusChart.config?.type || 'bar',
                data: JSON.parse(JSON.stringify(window.statusChart.data)),
                options: JSON.parse(JSON.stringify(window.statusChart.options || {}))
            });

            console.log('✅ Chart ricreato con successo');
        } else {
            console.warn('⚠️ window.statusChart non disponibile');
        }

    } catch (error) {
        debugStatsError('❌ Errore sync chart', error);
    }
}

// ==========================================
// HOOK NEI FILTRI PER AGGIORNAMENTO REAL-TIME
// ==========================================
function setupFilterSync() {
    const filterElements = [
        'filterStato',
        'filterAmbiti',
        'filterUpl',
        'filterQuartiere',
        'filterCircoscrizione',
        'filterTitolo'
    ];

    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Aggancia il listener originale
            const originalChangeHandler = element.onchange;
            
            element.addEventListener('change', function() {
                // Chiama il handler originale (che aggiorna tutto)
                if (originalChangeHandler) {
                    originalChangeHandler.call(this);
                }
                
                // Se il panel è aperto, aggiorna il contenuto
                const panel = document.getElementById('statsDatavizPanel');
                if (panel && panel.classList.contains('open')) {
                    setTimeout(() => {
                        updateStatsDatavizPanelContent();
                        debugStatsLog('🔄 Filtro cambiato - Panel aggiornato', { filter: id });
                    }, 250);
                }
            });
        }
    });

    debugStatsLog('✅ Filtri sincronizzati', null);
}

// ==========================================
// SINCRONIZZA ANCHE GLI UPDATE PRINCIPALI
// ==========================================
function setupMainUpdateSync() {
    // Monitora quando updateChart() viene chiamato nel file principale
    const originalUpdateChart = window.updateChart;
    
    if (typeof originalUpdateChart === 'function') {
        window.updateChart = function() {
            // Chiama la funzione originale
            originalUpdateChart.apply(this, arguments);
            
            // Se il panel è aperto e nel tab DataViz, aggiorna il grafico
            const panel = document.getElementById('statsDatavizPanel');
            const datavizTab = document.getElementById('dataviz-tab');
            
            if (panel && panel.classList.contains('open') && datavizTab && datavizTab.classList.contains('active')) {
                setTimeout(() => {
                    syncAndUpdateChart();
                    console.log('📊 Chart panel sincronizzato con update principale');
                }, 100);
            }
        };
        
        debugStatsLog('✅ Update principale sincronizzato', null);
    }
}

// ==========================================
// INIZIALIZZAZIONE
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    debugStatsLog('🚀 DOMContentLoaded', null);
    
    // Attendi che i dati principali siano caricati
    setTimeout(() => {
        if (initializeStatsDatavizPanel()) {
            setupFilterSync();
            setupMainUpdateSync();
            
            setTimeout(() => {
                openStatsDatavizPanel();
                debugStatsLog('✅ Panel aperto all\'avvio', null);
            }, 300);
        }
    }, 2000); // Aumentato per attendere caricamento dati principali
});

// ==========================================
// ESPORTA FUNZIONI GLOBALI
// ==========================================
window.openStatsDatavizPanel = openStatsDatavizPanel;
window.closeStatsDatavizPanel = closeStatsDatavizPanel;
window.updateStatsDatavizPanelContent = updateStatsDatavizPanelContent;

debugStatsLog('✅ Script caricato - Sincronizzazione con funzioni principali attiva', {
    panelId: 'statsDatavizPanel',
    riutilizzaFunzioniPrincipali: true,
    monitoraggioP1Integrato: true
});