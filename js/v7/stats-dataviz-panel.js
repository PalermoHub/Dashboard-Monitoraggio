// ================================================
// STATS & DATAVIZ PANEL - VERSIONE COMPLETA E CORRETTA
// ================================================

console.log('🚀 Stats & DataViz Panel: Inizio caricamento');

// ==========================================
// VARIABILI GLOBALI
// ==========================================
let horizontalCharts = {
    stato: null,
    proponente: null,
    ambiti: null
};

let statsPanelCloned = {
    isInitialized: false,
    activeFilterChart: null,
    activeFilterValue: null
};

let isUpdatingPanel = false;

// ==========================================
// DEBUG HELPER
// ==========================================
function debugStatsLog(title, data) {
    const style = 'color: #10b981; font-weight: bold; font-size: 12px;';
    console.log(`%c[StatsPanel] ${title}`, style, data || '');
}

function debugStatsError(title, data) {
    const style = 'color: #ef4444; font-weight: bold; font-size: 12px;';
    console.error(`%c[StatsPanel] ${title}`, style, data || '');
}

// ==========================================
// ATTENDI DATI E INIZIALIZZA
// ==========================================
function waitForDataAndInitialize() {
    debugStatsLog('⏳ Attesa dati globali...', null);
    
    if (window.allData && window.allData.length > 0 && window.Chart) {
        debugStatsLog('✅ Dati e Chart.js trovati!', { 
            totalData: window.allData.length,
            Chart: !!window.Chart
        });
        
        if (initializeStatsDatavizPanel()) {
            debugStatsLog('✅ Inizializzazione completata', null);
        }
    } else {
        setTimeout(waitForDataAndInitialize, 500);
    }
}

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================
function initializeStatsDatavizPanel() {
    try {
        debugStatsLog('⏳ Inizializzazione panel...', null);
        
        const panel = document.getElementById('statsDatavizPanel');
        if (!panel) {
            debugStatsError('❌ Panel non trovato nel DOM', null);
            return false;
        }

        setupTabListeners();
        setupPanelCloseListener();
        setupSidePanelInteraction();
        
        statsPanelCloned.isInitialized = true;
        
        debugStatsLog('✅ Panel inizializzato', null);
        return true;
        
    } catch (error) {
        debugStatsError('❌ Errore durante inizializzazione', error);
        return false;
    }
}

// ==========================================
// SETUP TAB LISTENERS - VERSIONE CORRETTA
// ==========================================

// ==========================================
// SETUP TAB LISTENERS - VERSIONE CORRETTA
// ==========================================

function setupTabListeners() {
    try {
        const tabButtons = document.querySelectorAll('.stats-tab-btn');
        const tabContents = document.querySelectorAll('.stats-tab-content');

        tabButtons.forEach((btn) => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Rimuovi active da tutti
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Aggiungi active al selezionato
                this.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                
                if (targetContent) {
                    targetContent.classList.add('active');
                    
                    // ✅ TAB 2: DataViz - CREA grafici SOLO qui
                    if (targetTab === 'dataviz-tab') {
                        console.log('📊 Tab DataViz aperto - Creazione grafici...');
                        cleanupCharts();  // 🔥 PULIZIA PRIMA
                        setTimeout(() => {
                            createHorizontalCharts();
                        }, 150);
                    } 
                    // ✅ TAB 1: Statistiche - NON crea grafici, solo statistiche
                    else if (targetTab === 'legenda-tab') {
                        console.log('📈 Tab Statistiche aperto - Solo statistiche (NO grafici)');
                        cleanupCharts();  // 🔥 PULIZIA grafici residui
                        // 🚫 NON chiamare createHorizontalCharts() qui!
                        setTimeout(() => {
                            updateStatsDisplay();
                        }, 100);
                    }
                }
            });
        });

        debugStatsLog('✅ Tab listeners configurati', null);

    } catch (error) {
        debugStatsError('❌ Errore setup tab listeners', error);
    }
}

function preventChartCreationInTab1() {
    // Blocca la creazione di grafici nel tab legenda
    const legendTab = document.getElementById('legenda-tab');
    if (legendTab) {
        // Nasconde eventuali canvas residui
        const canvases = legendTab.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            canvas.style.display = 'none';
            canvas.style.visibility = 'hidden';
        });
        
        // Nascondi i contenitori grafici
        const chartContainers = legendTab.querySelectorAll('[id^="chart"]');
        chartContainers.forEach(container => {
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.height = '0';
            container.style.width = '0';
            container.style.margin = '0';
            container.style.padding = '0';
        });
        
        console.log('🚫 Grafici bloccati nel TAB 1 (Statistiche)');
    }
}


// ==========================================
// SETUP PANEL CLOSE LISTENER
// ==========================================
function setupPanelCloseListener() {
    try {
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

    } catch (error) {
        debugStatsError('❌ Errore setup close listener', error);
    }
}

// ==========================================
// SETUP SIDE PANEL INTERACTION
// ==========================================
function setupSidePanelInteraction() {
    try {
        const sidePanel = document.getElementById('pattoSidePanel');
        if (!sidePanel) return;

        const observer = new MutationObserver(function(mutations) {
            const isOpen = sidePanel.classList.contains('open');
            const statsPanel = document.getElementById('statsDatavizPanel');
            
            if (isOpen && statsPanel && statsPanel.classList.contains('open')) {
                closeStatsDatavizPanel();
            }
        });

        observer.observe(sidePanel, { attributes: true, attributeFilter: ['class'] });
        
    } catch (error) {
        debugStatsError('❌ Errore setup side panel', error);
    }
}

// ==========================================
// CREA GRAFICI ORIZZONTALI
// ==========================================
function createHorizontalCharts() {
    try {
        debugStatsLog('🎨 Creazione grafici orizzontali...', null);

        const allData = window.allData || [];
        const filteredData = window.filteredData || allData;

        if (!allData || allData.length === 0) {
            debugStatsError('❌ Nessun dato disponibile', null);
            return;
        }

        // Trova le chiavi
        const statoKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('stato'));
        const proponenteKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('proponente'));
        const ambitiKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('ambiti'));

        // Grafico STATO
        if (statoKey) {
            createChartStato(filteredData, statoKey);
        }

        // Grafico PROPONENTE
        if (proponenteKey) {
            createChartProponente(filteredData, proponenteKey);
        }

        // Grafico AMBITI
        if (ambitiKey) {
            createChartAmbiti(filteredData, ambitiKey);
        }

        debugStatsLog('✅ Grafici creati', null);

    } catch (error) {
        debugStatsError('❌ Errore creazione grafici', error);
    }
}

// ==========================================
// GRAFICO STATO DI AVANZAMENTO
// ==========================================
function createChartStato(filteredData, statoKey) {
    try {
        const container = document.getElementById('chartStato');
        if (!container) {
            debugStatsError('❌ Container chartStato non trovato', null);
            return;
        }

        const statoCounts = {};
        filteredData.forEach(item => {
            const status = item[statoKey] || 'Non specificato';
            statoCounts[status] = (statoCounts[status] || 0) + 1;
        });

        const statusColors = {
            'Istruttoria in corso': '#ffdb4d',
            'Respinta': '#ff6b6b',
            'Patto stipulato': '#8fd67d',
            'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
            'In attesa di integrazione': '#b3e6ff',
            'Archiviata': '#94a3b8'
        };

        const sortedStati = Object.entries(statoCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedStati.map(([label]) => {
            if (label === 'Proroga e/o Monitoraggio e valutazione dei risultati') {
                return 'Proroga/Monitoraggio';
            }
            return label.substring(0, 25);
        });

        const data = sortedStati.map(([,count]) => count);
        const colors = sortedStati.map(([status]) => statusColors[status] || '#6b7280');
        const fullLabels = sortedStati.map(([label]) => label);

        container.innerHTML = '<canvas id="canvasChartStato" style="display: block !important;"></canvas>';
        const canvas = document.getElementById('canvasChartStato');

        if (horizontalCharts.stato) {
            horizontalCharts.stato.destroy();
        }

        horizontalCharts.stato = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numero Patti',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: colors.map(c => lightenColor(c))
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#F1F5F9',
                        bodyColor: '#E2E8F0',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.x} patti`;
                            }
                        }
                    }
                },
                scales: {
                    x: { beginAtZero: true, display: true },
                    y: { display: true }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const selectedValue = fullLabels[index];
                        handleChartClick('stato', selectedValue);
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        });

        debugStatsLog('✅ Grafico STATO creato', { items: labels.length });

    } catch (error) {
        debugStatsError('❌ Errore creazione grafico STATO', error);
    }
}

// ==========================================
// GRAFICO PROPONENTE
// ==========================================
function createChartProponente(filteredData, proponenteKey) {
    try {
        const container = document.getElementById('chartProponente');
        if (!container) {
            debugStatsError('❌ Container chartProponente non trovato', null);
            return;
        }

        const proponenteCounts = {};
        filteredData.forEach(item => {
            const proponente = item[proponenteKey] || 'Non specificato';
            proponenteCounts[proponente] = (proponenteCounts[proponente] || 0) + 1;
        });

        const sortedProponenti = Object.entries(proponenteCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 12);

        const labels = sortedProponenti.map(([label]) => 
            label.length > 30 ? label.substring(0, 27) + '...' : label
        );
        const data = sortedProponenti.map(([,count]) => count);
        const fullLabels = sortedProponenti.map(([label]) => label);

        const colors = generateIntelligentColors(data.length, 220);

        container.innerHTML = '<canvas id="canvasChartProponente" style="display: block !important;"></canvas>';
        const canvas = document.getElementById('canvasChartProponente');

        if (horizontalCharts.proponente) {
            horizontalCharts.proponente.destroy();
        }

        horizontalCharts.proponente = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numero Richieste',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#F1F5F9',
                        bodyColor: '#E2E8F0',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                scales: {
                    x: { beginAtZero: true, display: true },
                    y: { display: true }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const selectedValue = fullLabels[index];
                        handleChartClick('proponente', selectedValue);
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        });

        debugStatsLog('✅ Grafico PROPONENTE creato', { items: labels.length });

    } catch (error) {
        debugStatsError('❌ Errore creazione grafico PROPONENTE', error);
    }
}

// ==========================================
// GRAFICO AMBITI DI AZIONE
// ==========================================
function createChartAmbiti(filteredData, ambitiKey) {
    try {
        const container = document.getElementById('chartAmbiti');
        if (!container) {
            debugStatsError('❌ Container chartAmbiti non trovato', null);
            return;
        }

        const ambitiCounts = {};
        filteredData.forEach(item => {
            const ambito = item[ambitiKey] || 'Non specificato';
            ambitiCounts[ambito] = (ambitiCounts[ambito] || 0) + 1;
        });

        const sortedAmbiti = Object.entries(ambitiCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedAmbiti.map(([label]) => 
            label.length > 30 ? label.substring(0, 27) + '...' : label
        );
        const data = sortedAmbiti.map(([,count]) => count);
        const fullLabels = sortedAmbiti.map(([label]) => label);

        const colors = generateIntelligentColors(data.length, 120);

        container.innerHTML = '<canvas id="canvasChartAmbiti" style="display: block !important;"></canvas>';
        const canvas = document.getElementById('canvasChartAmbiti');

        if (horizontalCharts.ambiti) {
            horizontalCharts.ambiti.destroy();
        }

        horizontalCharts.ambiti = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numero Patti',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#F1F5F9',
                        bodyColor: '#E2E8F0',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                scales: {
                    x: { beginAtZero: true, display: true },
                    y: { display: true }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const selectedValue = fullLabels[index];
                        handleChartClick('ambiti', selectedValue);
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        });

        debugStatsLog('✅ Grafico AMBITI creato', { items: labels.length });

    } catch (error) {
        debugStatsError('❌ Errore creazione grafico AMBITI', error);
    }
}

// ==========================================
// GESTIONE CLICK SU GRAFICI (FILTRI)
// ==========================================
function handleChartClick(chartType, selectedValue) {
    try {
        debugStatsLog('📊 Click su grafico', { chartType, selectedValue });

        if (statsPanelCloned.activeFilterChart === chartType && 
            statsPanelCloned.activeFilterValue === selectedValue) {
            debugStatsLog('🔄 Reset filtro', null);
            resetChartFilter();
            return;
        }

        applyChartFilter(chartType, selectedValue);

    } catch (error) {
        debugStatsError('❌ Errore gestione click', error);
    }
}

// ==========================================
// APPLICA FILTRO DAL GRAFICO
// ==========================================
function applyChartFilter(chartType, selectedValue) {
    try {
        debugStatsLog('✅ Applicazione filtro', { chartType, selectedValue });

        statsPanelCloned.activeFilterChart = chartType;
        statsPanelCloned.activeFilterValue = selectedValue;

        if (chartType === 'stato') {
            const select = document.getElementById('filterStato');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change'));
            }
        } else if (chartType === 'proponente') {
            window.proponenteFilter = selectedValue;
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        } else if (chartType === 'ambiti') {
            const select = document.getElementById('filterAmbiti');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change'));
            }
        }

        debugStatsLog('✅ Filtro applicato', null);

    } catch (error) {
        debugStatsError('❌ Errore applicazione filtro', error);
    }
}

// ==========================================
// RESET FILTRO DAL GRAFICO
// ==========================================
function resetChartFilter() {
    try {
        const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterAmbiti', 'filterTitolo'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        window.proponenteFilter = '';
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }

        statsPanelCloned.activeFilterChart = null;
        statsPanelCloned.activeFilterValue = null;

        createHorizontalCharts();

        debugStatsLog('✅ Filtri resettati', null);

    } catch (error) {
        debugStatsError('❌ Errore reset filtri', error);
    }
}

// ==========================================
// AGGIORNA STATISTICHE
// ==========================================

function updateStatsDisplay() {
    try {
        const allData = window.allData || [];
        const filteredData = window.filteredData || allData;

        if (!allData || allData.length === 0) {
            setTimeout(updateStatsDisplay, 500);
            return;
        }

        const statoKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('stato'));
        
        if (!statoKey) return;

        const total = filteredData.length;
        const stipulati = filteredData.filter(p => p[statoKey] === 'Patto stipulato').length;
        const istruttoria = filteredData.filter(p => p[statoKey] === 'Istruttoria in corso').length;
        const attesaIntegrazione = filteredData.filter(p => p[statoKey] === 'In attesa di integrazione').length;
        const monitoraggio = filteredData.filter(p => p[statoKey] === 'Proroga e/o Monitoraggio e valutazione dei risultati').length;
        const respinti = filteredData.filter(p => p[statoKey] === 'Respinta').length;
        const archiviati = filteredData.filter(p => p[statoKey] === 'Archiviata').length;

        updatePanelStats({
            total, stipulati, istruttoria, attesaIntegrazione, 
            monitoraggio, respinti, archiviati, statoKey, allData
        });

        // 🚫 AGGIUNGI QUESTA LINEA ALLA FINE:
        preventChartCreationInTab1();

    } catch (error) {
        debugStatsError('❌ Errore aggiornamento stats', error);
    }
}

// ==========================================
// PULIZIA GRAFICI
// ==========================================

// Aggiungi questa funzione in stats-dataviz-panel.js
function cleanupCharts() {
    try {
        if (horizontalCharts.stato) {
            horizontalCharts.stato.destroy();
            horizontalCharts.stato = null;
        }
        if (horizontalCharts.proponente) {
            horizontalCharts.proponente.destroy();
            horizontalCharts.proponente = null;
        }
        if (horizontalCharts.ambiti) {
            horizontalCharts.ambiti.destroy();
            horizontalCharts.ambiti = null;
        }
        
        // Pulisci i container
        const containers = ['chartStato', 'chartProponente', 'chartAmbiti'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '';
            }
        });
        
        debugStatsLog('✅ Grafici puliti', null);
    } catch (error) {
        debugStatsError('❌ Errore pulizia grafici', error);
    }
}


// ==========================================
// AGGIORNA DOM STATISTICHE
// ==========================================
function updatePanelStats(stats) {
    try {
        const container = document.getElementById('statsContainerClone');
        if (!container) return;

        const statusColors = {
            'Istruttoria in corso': '#ffdb4d',
            'Respinta': '#ff6b6b',
            'Patto stipulato': '#8fd67d',
            'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
            'In attesa di integrazione': '#b3e6ff',
            'Archiviata': '#94a3b8'
        };

        const statsHTML = `
            <div class="stats-card">
                <h3 class="section-title">
                    <i data-lucide="bar-chart-4" class="h-4 w-4"></i>
                    Statistiche
                </h3>
                
                <div class="stats-grid">
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.25rem;">${stats.total}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Richieste</div>
                    </div>
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #8fd67d; margin-bottom: 0.25rem;">${stats.stipulati}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Stipulati</div>
                    </div>
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #ffdb4d; margin-bottom: 0.25rem;">${stats.istruttoria}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Istruttoria</div>
                    </div>
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #b3e6ff; margin-bottom: 0.25rem;">${stats.attesaIntegrazione}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Integrazione</div>
                    </div>
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #9b59b6; margin-bottom: 0.25rem;">${stats.monitoraggio}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Monitoraggio</div>
                    </div>
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #ff6b6b; margin-bottom: 0.25rem;">${stats.respinti}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Respinti</div>
                    </div>
                </div>
            </div>

            <div class="legend-card">
                <h3 class="section-title">
                    <i data-lucide="info" class="h-4 w-4"></i>
                    Legenda
                </h3>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem;">
                    ${Object.entries(statusColors).map(([status, color]) => `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%; border: 1px solid white;"></div>
                            <span>${status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = statsHTML;

    } catch (error) {
        debugStatsError('❌ Errore aggiornamento DOM', error);
    }
}

// ==========================================
// FUNZIONI UTILITY
// ==========================================
function generateIntelligentColors(count, baseHue = 200) {
    const colors = [];
    const saturation = 65;
    const lightness = 55;
    
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 137.508)) % 360;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

function lightenColor(color) {
    if (color.startsWith('hsl')) {
        return color.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/, (match, h, s, l) => {
            const newL = Math.min(parseInt(l) + 15, 85);
            return `hsl(${h}, ${s}%, ${newL}%)`;
        });
    }
    return color + 'CC';
}

// ==========================================
// APRI/CHIUDI PANEL
// ==========================================
function openStatsDatavizPanel() {
    const panel = document.getElementById('statsDatavizPanel');
    if (panel) {
        panel.classList.add('open');
        const firstTabBtn = document.querySelector('[data-tab="legenda-tab"]');
        if (firstTabBtn) {
            firstTabBtn.click();
        }
    }
}

function closeStatsDatavizPanel() {
    const panel = document.getElementById('statsDatavizPanel');
    if (panel) {
        panel.classList.remove('open');
    }
}

// ==========================================
// AGGIORNA PANEL - NON crea grafici
// ==========================================

function updateStatsDatavizPanelContent() {
    // ✅ PROTEZIONE: Evita chiamate multiple
    if (isUpdatingPanel) {
        console.log('⚠️ Aggiornamento già in corso, skip');
        return;
    }
    
    try {
        isUpdatingPanel = true;  // 🔒 LOCK
        
        const panel = document.getElementById('statsDatavizPanel');
        if (panel && panel.classList.contains('open')) {
            const activeTab = document.querySelector('.stats-tab-content.active');
            
            // Se il tab attivo è Statistiche
            if (activeTab && activeTab.id === 'legenda-tab') {
                console.log('♻️ Aggiornamento statistiche (NO grafici)');
                updateStatsDisplay();
            } 
            // Se il tab attivo è DataViz
            else if (activeTab && activeTab.id === 'dataviz-tab') {
                console.log('♻️ Aggiornamento grafici DataViz');
                cleanupCharts(); // 🔥 Pulizia
                setTimeout(() => {
                    createHorizontalCharts();
                }, 100);
            }
        }
    } catch (error) {
        debugStatsError('❌ Errore aggiornamento panel', error);
    } finally {
        // 🔓 UNLOCK dopo 300ms
        setTimeout(() => {
            isUpdatingPanel = false;
        }, 300);
    }
}

// ==========================================
// ESPORTA FUNZIONI GLOBALI
// ==========================================
window.openStatsDatavizPanel = openStatsDatavizPanel;
window.closeStatsDatavizPanel = closeStatsDatavizPanel;
window.updateStatsDatavizPanelContent = updateStatsDatavizPanelContent;
window.createHorizontalCharts = createHorizontalCharts;
window.resetChartFilter = resetChartFilter;

// ==========================================
// INIZIALIZZAZIONE AL CARICAMENTO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    debugStatsLog('⏳ DOM caricato, attesa dati...', null);
    setTimeout(waitForDataAndInitialize, 1000);
});

debugStatsLog('✅ Script caricato e funzioni globali registrate', null);

