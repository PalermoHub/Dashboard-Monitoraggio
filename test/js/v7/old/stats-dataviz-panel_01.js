// ================================================
// STATS & DATAVIZ PANEL - VERSIONE SAFE (senza duplicati)
// ================================================

// Controlla se lo script è già stato caricato
if (typeof window.statsDatavizPanelLoaded === 'undefined') {
    
console.log('🚀 Stats & DataViz Panel v3: Riutilizzo funzioni principali');

// ==========================================
// VARIABILI GLOBALI - usando window per evitare conflitti
// ==========================================
window.statsClonedChart = null;
window.statsPanelCloned = {
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

    setupTabListeners();
    setupPanelCloseListener();
    setupSidePanelInteraction();
    
    window.statsPanelCloned.isInitialized = true;
    
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
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                if (targetTab === 'dataviz-tab') {
                    console.log('📊 Tab DataViz attivato - ricreazione grafico');
                    setTimeout(() => {
                        syncAndUpdateChart();
                        if (window.statsClonedChart && typeof window.statsClonedChart.resize === 'function') {
                            window.statsClonedChart.resize();
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
        updateStatsDatavizPanelContent();
        
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
// AGGIORNA CONTENUTO PANEL
// ==========================================
function updateStatsDatavizPanelContent() {
    try {
        console.log('🔄 Aggiornamento panel da funzioni principali...');
        
        const statsContainerClone = document.getElementById('statsContainerClone');
        const chartSectionClone = document.getElementById('chartSectionClone');

        if (statsContainerClone && window.filteredData) {
            const originalStats = document.querySelector('.dashboard-main .stats-container');
            if (originalStats) {
                statsContainerClone.innerHTML = originalStats.innerHTML;
                console.log('✅ Statistiche copiate da dashboard principale');
            }
        }

        if (chartSectionClone && window.statusChart) {
            const originalChart = document.querySelector('.dashboard-main .chart-section');
            if (originalChart) {
                chartSectionClone.innerHTML = originalChart.innerHTML;
                console.log('✅ Chart HTML copiato');
            }
            
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
// SINCRONIZZA E AGGIORNA CHART
// ==========================================
function syncAndUpdateChart() {
    try {
        const clonedCanvas = document.querySelector('#chartSectionClone canvas');
        if (!clonedCanvas) {
            console.log('⚠️ Canvas clonato non trovato');
            return;
        }

        if (window.statsClonedChart) {
            window.statsClonedChart.destroy();
            window.statsClonedChart = null;
        }

        if (window.statusChart && window.statusChart.data) {
            console.log('📊 Creazione chart clonato da statusChart originale');
            
            const ctx = clonedCanvas.getContext('2d');
            
            window.statsClonedChart = new Chart(ctx, {
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
// HOOK NEI FILTRI
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
            element.addEventListener('change', function() {
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
    const originalUpdateChart = window.updateChart;
    
    if (typeof originalUpdateChart === 'function') {
        window.updateChart = function() {
            originalUpdateChart.apply(this, arguments);
            
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
    
    setTimeout(() => {
        if (initializeStatsDatavizPanel()) {
            setupFilterSync();
            setupMainUpdateSync();
            
            setTimeout(() => {
                openStatsDatavizPanel();
                debugStatsLog('✅ Panel aperto all\'avvio', null);
            }, 300);
        }
    }, 2000);
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

// ==========================================
// MARCHIA LO SCRIPT COME CARICATO
// ==========================================
window.statsDatavizPanelLoaded = true;

} else {
    console.log('⚠️ Stats & DataViz Panel già caricato - evitati duplicati');
}