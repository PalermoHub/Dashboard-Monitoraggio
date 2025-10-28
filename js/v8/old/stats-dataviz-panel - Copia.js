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
                        // ✅ AGGIUNGI QUESTA RIGA:
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
                        // ✅ AGGIUNGI QUESTA RIGA:
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

        // ✅ TOGGLE: Se clicco sulla stessa barra, resetto
        if (statsPanelCloned.activeFilterChart === chartType && 
            statsPanelCloned.activeFilterValue === selectedValue) {
            debugStatsLog('🔄 Reset filtro', null);
            resetChartFilter();
            return;
        }

        // ✅ PRIMO CLICK: Applica il filtro
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
            // ✅ FILTRO STATO
            const select = document.getElementById('filterStato');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } 
        else if (chartType === 'proponente') {
            // ✅ FILTRO PROPONENTE - VERSIONE CORRETTA
            console.log('📊 Applicando filtro proponente:', selectedValue);
            
            // Imposta la variabile globale
            window.proponenteFilter = selectedValue;
            if (typeof proponenteFilter !== 'undefined') {
                proponenteFilter = selectedValue;
            }
            
            // Applica i filtri
            if (typeof applyFilters === 'function') {
                applyFilters();
            } else if (typeof window.applyFiltersUnified === 'function') {
                window.applyFiltersUnified();
            }
            
            console.log('✅ Filtro proponente applicato');
        } 
        else if (chartType === 'ambiti') {
            // ✅ FILTRO AMBITI
            const select = document.getElementById('filterAmbiti');
            if (select) {
                select.value = selectedValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
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

        // ✅ INCLUDI proponenteFilter da monitoraggio_p1
        proponenteFilter = '';
        
        // ✅ SINCRONIZZA globale
        window.filteredData = [...window.allData];
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }

        statsPanelCloned.activeFilterChart = null;
        statsPanelCloned.activeFilterValue = null;

        // ✅ AGGIORNA STATISTICHE DOPO RESET
        setTimeout(() => {
            if (typeof window.updateStatsDisplay === 'function') {
                window.updateStatsDisplay();
            }
            createHorizontalCharts();
        }, 100);

        debugStatsLog('âœ… Filtri resettati', null);

    } catch (error) {
        debugStatsError('âŒ Errore reset filtri', error);
    }
}

// ==========================================
// AGGIORNA STATISTICHE - VERSIONE ULTRA-ROBUSTA
// ==========================================
function updateStatsDisplay() {
    try {
        console.log('📊 Update stats...');
        
        // ⭐ USA SEMPRE window.filteredData (fonte unica di verità)
        const allData = window.allData || [];
        const filteredData = window.filteredData || allData;
        
        console.log(`Dati: ${filteredData.length}/${allData.length}`);
        
        if (!allData || allData.length === 0) {
            console.error('❌ Nessun dato');
            return;
        }
        
        // ⭐ CONTROLLO DI SICUREZZA: Se filteredData sembra errato, usa allData
        if (filteredData.length === 0 && allData.length > 0) {
            console.warn('⚠️ filteredData vuoto, uso allData');
            filteredData = allData;
            window.filteredData = [...allData];
        }

        console.log('📊 Dati utilizzati:', {
            allDataLength: allData.length,
            filteredDataLength: filteredData.length,
            areSame: allData.length === filteredData.length,
            source: filteredData.length === allData.length ? '🔓 RESET (tutti i dati)' : '🔒 FILTRATO',
            percentage: allData.length > 0 
                ? ((filteredData.length / allData.length) * 100).toFixed(1) + '%'
                : 'N/A'
        });

        // Verifica dati validi
        if (!allData || allData.length === 0) {
            console.error('❌ allData vuoto o non valido');
            return;
        }

        // Trova chiave stato
        const statoKey = Object.keys(allData[0]).find(k => k.toLowerCase().includes('stato'));
        
        if (!statoKey) {
            console.error('❌ Chiave stato non trovata');
            console.log('Chiavi disponibili:', Object.keys(allData[0]));
            return;
        }

        console.log('✅ Chiave stato trovata:', statoKey);

        // ✅ CALCOLA STATISTICHE SUI DATI CORRETTI
        const total = filteredData.length;
        const stipulati = filteredData.filter(p => p[statoKey] === 'Patto stipulato').length;
        const istruttoria = filteredData.filter(p => p[statoKey] === 'Istruttoria in corso').length;
        const attesaIntegrazione = filteredData.filter(p => p[statoKey] === 'In attesa di integrazione').length;
        const monitoraggio = filteredData.filter(p => p[statoKey] === 'Proroga e/o Monitoraggio e valutazione dei risultati').length;
        const respinti = filteredData.filter(p => p[statoKey] === 'Respinta').length;
        const archiviati = filteredData.filter(p => p[statoKey] === 'Archiviata').length;

        console.log('📊 Statistiche calcolate:', { 
            total, 
            stipulati, 
            istruttoria, 
            attesaIntegrazione, 
            monitoraggio, 
            respinti, 
            archiviati,
            isReset: total === allData.length,
            checkSum: stipulati + istruttoria + attesaIntegrazione + monitoraggio + respinti + archiviati
        });
        
        // ⚠️ VERIFICA CHECKSUM
        const checkSum = stipulati + istruttoria + attesaIntegrazione + monitoraggio + respinti + archiviati;
        if (checkSum !== total) {
            console.warn('⚠️ Checksum non corrisponde:', {
                total,
                checkSum,
                difference: total - checkSum
            });
        }

        // ✅ AGGIORNA IL DOM
        updatePanelStats({
            total, 
            stipulati, 
            istruttoria, 
            attesaIntegrazione, 
            monitoraggio, 
            respinti, 
            archiviati, 
            statoKey, 
            allData
        });

        // Previeni creazione grafici nel tab statistiche
        preventChartCreationInTab1();

        console.log('📊 ===== updateStatsDisplay COMPLETATO =====');

    } catch (error) {
        console.error('❌ ===== ERRORE CRITICO in updateStatsDisplay =====');
        console.error(error);
        debugStatsError('Errore critico in updateStatsDisplay', error);
    }
}

// ==========================================
// RESET STATISTICHE PANEL - VERSIONE ROBUSTA
// ==========================================
function resetStatsPanelToDefault() {
    console.log('🔄 Reset statistiche panel a valori default');
    
    try {
        // ✅ VERIFICA DATI GLOBALI
        if (!window.allData || window.allData.length === 0) {
            console.error('❌ allData non disponibile');
            return false;
        }
        
        // ✅ FORZA RESET filteredData
        window.filteredData = [...window.allData];
        
        console.log('📊 Dati resettati:', {
            allData: window.allData.length,
            filteredData: window.filteredData.length,
            areEqual: window.allData.length === window.filteredData.length
        });
        
        // ✅ AGGIORNA DISPLAY CON DELAY PER STABILITÀ
        setTimeout(() => {
            if (typeof updateStatsDisplay === 'function') {
                updateStatsDisplay();
                console.log('✅ updateStatsDisplay chiamato');
            } else {
                console.error('❌ updateStatsDisplay non disponibile');
                return false;
            }
        }, 50);
        
        // ✅ RESET GRAFICI SE TAB ATTIVO
        setTimeout(() => {
            const datavizTab = document.getElementById('dataviz-tab');
            if (datavizTab && datavizTab.classList.contains('active')) {
                console.log('🔄 Reset grafici DataViz');
                
                if (typeof cleanupCharts === 'function') {
                    cleanupCharts();
                }
                
                setTimeout(() => {
                    if (typeof createHorizontalCharts === 'function') {
                        createHorizontalCharts();
                        console.log('✅ Grafici ricreati');
                    }
                }, 100);
            }
        }, 150);
        
        console.log('✅ Reset panel completato');
        return true;
        
    } catch (error) {
        console.error('❌ Errore reset panel:', error);
        return false;
    }
}

// ✅ ESPORTA GLOBALMENTE
window.resetStatsPanelToDefault = resetStatsPanelToDefault;


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
        if (!container) {
            console.error('❌ statsContainerClone non trovato');
            return;
        }
        
        // ✅ VERIFICA CHE stats sia valido
        if (!stats) {
            console.error('❌ Stats undefined in updatePanelStats');
            return;
        }

        console.log('📊 Aggiornamento DOM con stats:', stats);

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
                
                <div class="stats-grid" id="statsGridContent">
                    <div class="stat-box" data-stat="total">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Richieste</div>
                    </div>
                    <div class="stat-box" data-stat="stipulati">
                        <div class="stat-value" style="color: #8fd67d;">${stats.stipulati}</div>
                        <div class="stat-label">Stipulati</div>
                    </div>
                    <div class="stat-box" data-stat="istruttoria">
                        <div class="stat-value" style="color: #ffdb4d;">${stats.istruttoria}</div>
                        <div class="stat-label">Istruttoria</div>
                    </div>
                    <div class="stat-box" data-stat="integrazione">
                        <div class="stat-value" style="color: #b3e6ff;">${stats.attesaIntegrazione}</div>
                        <div class="stat-label">Integrazione</div>
                    </div>
                    <div class="stat-box" data-stat="monitoraggio">
                        <div class="stat-value" style="color: #9b59b6;">${stats.monitoraggio}</div>
                        <div class="stat-label">Monitoraggio</div>
                    </div>
                    <div class="stat-box" data-stat="respinti">
                        <div class="stat-value" style="color: #ff6b6b;">${stats.respinti}</div>
                        <div class="stat-label">Respinti</div>
                    </div>
                    <div class="stat-box" data-stat="archiviati">
                        <div class="stat-value" style="color: #94a3b8;">${stats.archiviati}</div>
                        <div class="stat-label">Archiviati</div>
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
        
        console.log('✅ DOM aggiornato con successo');
        
        // ✅ ANIMATE i contatori
        animateStatsCounters(stats);

    } catch (error) {
        debugStatsError('❌ Errore aggiornamento DOM', error);
    }
}

// NUOVA FUNZIONE: Anima i contatori
function animateStatsCounters(stats) {
    const counters = [
        { element: document.querySelector('[data-stat="total"] .stat-value'), value: stats.total },
        { element: document.querySelector('[data-stat="stipulati"] .stat-value'), value: stats.stipulati },
        { element: document.querySelector('[data-stat="istruttoria"] .stat-value'), value: stats.istruttoria },
        { element: document.querySelector('[data-stat="integrazione"] .stat-value'), value: stats.attesaIntegrazione },
        { element: document.querySelector('[data-stat="monitoraggio"] .stat-value'), value: stats.monitoraggio },
        { element: document.querySelector('[data-stat="respinti"] .stat-value'), value: stats.respinti },
        { element: document.querySelector('[data-stat="archiviati"] .stat-value'), value: stats.archiviati }
    ];

    counters.forEach(({ element, value }) => {
        if (!element) return;
        
        const startValue = parseInt(element.textContent) || 0;
        const difference = value - startValue;
        
        if (difference === 0) return;
        
        const steps = 10;
        const stepValue = difference / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const displayValue = Math.round(startValue + (stepValue * currentStep));
            element.textContent = displayValue;
            element.style.opacity = '0.7';

            if (currentStep >= steps) {
                element.textContent = value;
                element.style.opacity = '1';
                clearInterval(interval);
            }
        }, 30);
    });
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
    if (isUpdatingPanel) {
        console.log('⚠️ Aggiornamento già in corso, skip');
        return;
    }
    
    try {
        isUpdatingPanel = true;
        
        const panel = document.getElementById('statsDatavizPanel');
        if (panel && panel.classList.contains('open')) {
            const activeTab = document.querySelector('.stats-tab-content.active');
            
            if (activeTab && activeTab.id === 'legenda-tab') {
                console.log('♻️ Aggiornamento statistiche in TEMPO REALE');
                updateStatsDisplay();
            } 
            else if (activeTab && activeTab.id === 'dataviz-tab') {
                console.log('♻️ Aggiornamento grafici DataViz in TEMPO REALE');
                cleanupCharts();
                setTimeout(() => {
                    createHorizontalCharts();
                }, 100);
            }
        }
    } catch (error) {
        debugStatsError('❌ Errore aggiornamento panel', error);
    } finally {
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
window.handleChartClick = handleChartClick;
window.applyChartFilter = applyChartFilter;

// ==========================================
// INIZIALIZZAZIONE AL CARICAMENTO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    debugStatsLog('⏳ DOM caricato, attesa dati...', null);
    setTimeout(waitForDataAndInitialize, 1000);
});

if (!document.getElementById('stat-animation-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'stat-animation-styles';
    styleEl.textContent = `
        /* ANIMAZIONE CONTATORI STATISTICHE */
        .stat-value {
            transition: opacity 0.3s ease, transform 0.3s ease;
            font-weight: 700;
        }
        
        .stat-value:active {
            transform: scale(1.05);
        }
        
        /* GRIGLIA STATISTICHE */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.75rem;
        }
        
        /* SINGOLA STATISTICA */
        .stat-box {
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 0.5rem;
            text-align: center;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .stat-box:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 500;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(styleEl);
    console.log('🎨 Stili statistiche iniettati');
}

debugStatsLog('✅ Script caricato e funzioni globali registrate', null);

function setupFilterSyncListeners() {
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterAmbiti', 'filterTitolo'];
    
    filterIds.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', function() {
                console.log(`🔄 Filtro ${filterId} cambiato, trigger update statistiche`);
                
                // Attendi che applyFilters completi il suo lavoro
                setTimeout(() => {
                    if (typeof window.updateStatsDisplay === 'function') {
                        window.updateStatsDisplay();
                        console.log('✅ Statistiche aggiornate dopo cambio filtro');
                    }
                }, 100);
            });
            
            console.log(`✅ Listener configurato per ${filterId}`);
        }
    });
}

// Inizializza i listener
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupFilterSyncListeners();
        console.log('✅ Listener sincronizzazione filtri configurati');
    }, 2000);
});

