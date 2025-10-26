// ==========================================
// SIDE PANEL V3 - VERSIONE FUNZIONANTE
// ==========================================

console.log('🚀 Side Panel V3: Caricamento iniziato');

// Variabili globali
let panelMiniMap = null;
let panelChart = null;
let sidePanelData = null;
let currentSidePanelIndex = 0;

// ==========================================
// CREA HTML SIDE PANEL
// ==========================================

function createSidePanelHTML() {
    if (document.getElementById('pattoSidePanel')) {
        console.log('⚠️ Side Panel già esistente');
        return;
    }

    const html = `
        <div id="pattoSidePanel" class="side-panel-v3">
            <!-- HEADER -->
            <div class="side-panel-v3-header">
                <img src="img/patti.png" alt="Logo" class="side-panel-v3-logo">
                <h2 id="sidePanelTitle" class="side-panel-v3-title">Dettagli</h2>
                <button id="closeSidePanel" class="side-panel-v3-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- TAB NAVIGATION -->
            <div class="side-panel-v3-tabs">
                <button class="side-panel-v3-tab active" data-tab="stats">
                    <i class="fas fa-chart-bar"></i>
                    <span>Statistiche</span>
                </button>
                <button class="side-panel-v3-tab" data-tab="charts">
                    <i class="fas fa-chart-pie"></i>
                    <span>DataViz</span>
                </button>
                <button class="side-panel-v3-tab" data-tab="details">
                    <i class="fas fa-info-circle"></i>
                    <span>Dettagli</span>
                </button>
            </div>

            <!-- CONTENT -->
            <div class="side-panel-v3-content">
                <!-- TAB 1: STATISTICHE -->
                <div id="stats-tab" class="side-panel-v3-tab-content active">
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-chart-bar"></i> Statistiche</h3>
                        <div id="panelStats" class="panel-stats-grid"></div>
                    </div>
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Legenda</h3>
                        <div id="panelLegend" class="panel-legend-items"></div>
                    </div>
                </div>

                <!-- TAB 2: DATAVIZ -->
                <div id="charts-tab" class="side-panel-v3-tab-content">
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-chart-pie"></i> Distribuzione Dati</h3>
                        <select id="panelChartType" class="panel-select">
                            <option value="stato">Per stato</option>
                            <option value="proponente">Per proponente</option>
                        </select>
                        <div class="panel-chart-wrapper">
                            <canvas id="panelChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: DETTAGLI -->
                <div id="details-tab" class="side-panel-v3-tab-content">
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-info-circle"></i> Informazioni</h3>
                        <div id="panelDetails"></div>
                    </div>
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-pulse"></i> Stato</h3>
                        <div id="panelStatus"></div>
                    </div>
                    <div id="panelNotesContainer" class="side-panel-v3-section hidden">
                        <h3><i class="fas fa-file-alt"></i> Note</h3>
                        <p id="panelNotes"></p>
                    </div>
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-link"></i> Collegamenti</h3>
                        <div id="panelLinks"></div>
                    </div>
                    <div id="panelPhotoContainer" class="side-panel-v3-section hidden">
                        <h3><i class="fas fa-image"></i> Foto</h3>
                        <img id="panelPhoto" alt="Foto" style="width: 100%; border-radius: 4px;">
                    </div>
                    <div class="side-panel-v3-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Posizione</h3>
                        <div id="panelMiniMap" style="height: 150px; border-radius: 4px;"></div>
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="side-panel-v3-footer">
                <button id="sidePanelPrevious" class="panel-nav-btn">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <span id="sidePanelCounter" class="panel-counter">1/1</span>
                <button id="sidePanelNext" class="panel-nav-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    console.log('✅ Side Panel HTML creato');
}

// ==========================================
// AGGIUNGI CSS
// ==========================================

function addSidePanelCSS() {
    if (document.getElementById('sidePanelV3CSS')) return;

    const css = `
        .side-panel-v3 {
            position: fixed;
            right: -360px;
            top: 0;
            bottom: 0;
            width: 340px;
            background: white;
            box-shadow: -4px 0 20px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            transition: right 0.4s ease;
        }
        
        .side-panel-v3.open {
            right: 0;
        }
        
        .side-panel-v3-header {
            padding: 12px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .side-panel-v3-logo {
            height: 32px;
            width: 32px;
        }
        
        .side-panel-v3-title {
            flex: 1;
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
        }
        
        .side-panel-v3-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .side-panel-v3-close:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .side-panel-v3-tabs {
            display: flex;
            background: #f3f4f6;
            padding: 8px;
            gap: 4px;
        }
        
        .side-panel-v3-tab {
            flex: 1;
            padding: 8px 4px;
            background: transparent;
            border: none;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: #6b7280;
        }
        
        .side-panel-v3-tab:hover {
            background: white;
            color: #1e40af;
        }
        
        .side-panel-v3-tab.active {
            background: #1e40af;
            color: white;
        }
        
        .side-panel-v3-content {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }
        
        .side-panel-v3-tab-content {
            display: none;
        }
        
        .side-panel-v3-tab-content.active {
            display: block;
        }
        
        .side-panel-v3-section {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .side-panel-v3-section.hidden {
            display: none;
        }
        
        .side-panel-v3-section h3 {
            font-size: 0.8rem;
            font-weight: 700;
            color: #374151;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .panel-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        
        .panel-stat-item {
            text-align: center;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
        }
        
        .panel-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .panel-stat-label {
            font-size: 0.7rem;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .panel-legend-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .panel-legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
        }
        
        .legend-color-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .panel-select {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 0.85rem;
        }
        
        .panel-chart-wrapper {
            height: 220px;
            position: relative;
        }
        
        #panelDetails p {
            margin: 0 0 8px 0;
            font-size: 0.85rem;
        }
        
        #panelDetails strong {
            color: #374151;
        }
        
        .side-panel-v3-footer {
            padding: 12px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .panel-nav-btn {
            background: white;
            border: none;
            color: #1e40af;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .panel-nav-btn:hover:not(:disabled) {
            background: #dbeafe;
        }
        
        .panel-nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .panel-counter {
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            min-width: 60px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .side-panel-v3 {
                width: 100%;
                right: -100%;
            }
            
            .side-panel-v3-tab span {
                display: none;
            }
        }
    `;

    const style = document.createElement('style');
    style.id = 'sidePanelV3CSS';
    style.textContent = css;
    document.head.appendChild(style);
    console.log('✅ CSS Side Panel caricato');
}

// ==========================================
// SETUP TAB
// ==========================================

function setupTabs() {
    const tabs = document.querySelectorAll('.side-panel-v3-tab');
    const contents = document.querySelectorAll('.side-panel-v3-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            if (targetTab === 'charts') {
                setTimeout(() => updatePanelChart(), 100);
            }
        });
    });
}

// ==========================================
// AGGIORNA STATISTICHE
// ==========================================

function updatePanelStats() {
    const container = document.getElementById('panelStats');
    if (!container) return;
    
    const data = window.filteredData || window.allData || [];
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9ca3af;">Nessun dato</p>';
        return;
    }
    
    const statoKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('stato'));
    
    const stats = {
        total: data.length,
        stipulati: data.filter(p => p[statoKey] === 'Patto stipulato').length,
        istruttoria: data.filter(p => p[statoKey] === 'Istruttoria in corso').length,
        attesa: data.filter(p => p[statoKey] === 'In attesa di integrazione').length,
        monitoraggio: data.filter(p => p[statoKey]?.includes('Monitoraggio')).length,
        respinti: data.filter(p => p[statoKey] === 'Respinta').length,
        archiviati: data.filter(p => p[statoKey] === 'Archiviata').length
    };
    
    container.innerHTML = `
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #3b82f6;">${stats.total}</div>
            <div class="panel-stat-label">Totale</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #8fd67d;">${stats.stipulati}</div>
            <div class="panel-stat-label">Stipulati</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #ffdb4d;">${stats.istruttoria}</div>
            <div class="panel-stat-label">Istruttoria</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #b3e6ff;">${stats.attesa}</div>
            <div class="panel-stat-label">Attesa</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #9b59b6;">${stats.monitoraggio}</div>
            <div class="panel-stat-label">Monitoraggio</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #ff6b6b;">${stats.respinti}</div>
            <div class="panel-stat-label">Respinti</div>
        </div>
        <div class="panel-stat-item">
            <div class="panel-stat-value" style="color: #94a3b8;">${stats.archiviati}</div>
            <div class="panel-stat-label">Archiviati</div>
        </div>
    `;
}

// ==========================================
// AGGIORNA LEGENDA
// ==========================================

function updatePanelLegend() {
    const container = document.getElementById('panelLegend');
    if (!container) return;
    
    const colors = {
        'Istruttoria in corso': '#ffdb4d',
        'Respinta': '#ff6b6b',
        'Patto stipulato': '#8fd67d',
        'Proroga/Monitoraggio': '#9b59b6',
        'Attesa integrazione': '#b3e6ff',
        'Archiviata': '#94a3b8'
    };
    
    container.innerHTML = Object.entries(colors).map(([label, color]) => `
        <div class="panel-legend-item">
            <div class="legend-color-dot" style="background: ${color};"></div>
            <span>${label}</span>
        </div>
    `).join('');
}

// ==========================================
// AGGIORNA GRAFICO
// ==========================================

function updatePanelChart() {
    const canvas = document.getElementById('panelChart');
    if (!canvas) return;
    
    if (panelChart) {
        panelChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const data = window.filteredData || window.allData || [];
    const type = document.getElementById('panelChartType')?.value || 'stato';
    
    if (data.length === 0) return;
    
    const statoKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('stato'));
    const counts = {};
    
    data.forEach(item => {
        const value = item[statoKey] || 'N/A';
        counts[value] = (counts[value] || 0) + 1;
    });
    
    const colors = ['#8fd67d', '#ffdb4d', '#b3e6ff', '#9b59b6', '#ff6b6b', '#94a3b8'];
    
    panelChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================
// POPOLA DETTAGLI
// ==========================================

function populateDetails(patto) {
    if (!patto) return;
    
    const keys = {
        titolo: Object.keys(patto).find(k => k.toLowerCase().includes('titolo')),
        proponente: Object.keys(patto).find(k => k.toLowerCase().includes('proponente')),
        rappresentante: Object.keys(patto).find(k => k.toLowerCase().includes('rappresentante')),
        upl: Object.keys(patto).find(k => k.toLowerCase() === 'upl'),
        quartiere: Object.keys(patto).find(k => k.toLowerCase().includes('quartiere')),
        circoscrizione: Object.keys(patto).find(k => k.toLowerCase().includes('circoscrizione')),
        indirizzo: Object.keys(patto).find(k => k.toLowerCase().includes('indirizzo')),
        stato: Object.keys(patto).find(k => k.toLowerCase().includes('stato')),
        ambiti: Object.keys(patto).find(k => k.toLowerCase().includes('ambiti'))
    };
    
    document.getElementById('sidePanelTitle').textContent = patto[keys.titolo] || 'Dettagli Patto';
    
    const details = document.getElementById('panelDetails');
    if (details) {
        details.innerHTML = `
            <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
            <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
            <p><strong>Ambito:</strong> ${patto[keys.ambiti] || 'N/A'}</p>
            <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
            <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
            <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
            <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
        `;
    }
    
    const colors = {
        'Istruttoria in corso': '#ffdb4d',
        'Respinta': '#ff6b6b',
        'Patto stipulato': '#8fd67d',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
        'In attesa di integrazione': '#b3e6ff',
        'Archiviata': '#94a3b8'
    };
    
    const stato = patto[keys.stato] || 'Non specificato';
    const color = colors[stato] || '#6b7280';
    
    const status = document.getElementById('panelStatus');
    if (status) {
        status.innerHTML = `<div style="background: ${color}; color: white; padding: 8px 12px; border-radius: 4px; text-align: center; font-weight: 600; font-size: 0.85rem;">${stato}</div>`;
    }
    
    // Minimap
    if (patto.lat && patto.lng) {
        setTimeout(() => initMiniMap(patto), 300);
    }
}

// ==========================================
// INIT MINIMAP
// ==========================================

function initMiniMap(patto) {
    if (panelMiniMap) {
        panelMiniMap.remove();
    }
    
    const container = document.getElementById('panelMiniMap');
    if (!container || !patto.lat || !patto.lng) return;
    
    panelMiniMap = L.map(container, {
        center: [parseFloat(patto.lat), parseFloat(patto.lng)],
        zoom: 16,
        dragging: true,
        scrollWheelZoom: false,
        zoomControl: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(panelMiniMap);
    
    L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
        radius: 8,
        fillColor: '#3b82f6',
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(panelMiniMap);
    
    setTimeout(() => panelMiniMap.invalidateSize(), 100);
}

// ==========================================
// APRI SIDE PANEL
// ==========================================

function openSidePanel(pattoId) {
    console.log('📖 Apertura Side Panel per ID:', pattoId);
    
    createSidePanelHTML();
    addSidePanelCSS();
    
    const data = window.filteredData || window.allData || [];
    if (data.length === 0) {
        console.error('❌ Nessun dato disponibile');
        return;
    }
    
    const idKey = Object.keys(data[0]).find(k => k.toLowerCase() === 'id');
    const patto = data.find(p => p[idKey] == pattoId);
    
    if (!patto) {
        console.error('❌ Patto non trovato:', pattoId);
        return;
    }
    
    sidePanelData = data;
    currentSidePanelIndex = data.indexOf(patto);
    
    setupTabs();
    updatePanelStats();
    updatePanelLegend();
    populateDetails(patto);
    
    const panel = document.getElementById('pattoSidePanel');
    panel.classList.add('open');
    
    // Listeners
    document.getElementById('closeSidePanel').onclick = closeSidePanel;
    document.getElementById('panelChartType').onchange = updatePanelChart;
    
    document.getElementById('sidePanelPrevious').onclick = () => navigate(-1);
    document.getElementById('sidePanelNext').onclick = () => navigate(1);
    
    updateCounter();
    
    console.log('✅ Side Panel aperto');
}

// ==========================================
// CHIUDI SIDE PANEL
// ==========================================

function closeSidePanel() {
    const panel = document.getElementById('pattoSidePanel');
    if (panel) {
        panel.classList.remove('open');
    }
    
    if (panelMiniMap) {
        panelMiniMap.remove();
        panelMiniMap = null;
    }
    
    if (panelChart) {
        panelChart.destroy();
        panelChart = null;
    }
}

// ==========================================
// NAVIGAZIONE
// ==========================================

function navigate(direction) {
    const newIndex = currentSidePanelIndex + direction;
    
    if (newIndex >= 0 && newIndex < sidePanelData.length) {
        currentSidePanelIndex = newIndex;
        const patto = sidePanelData[currentSidePanelIndex];
        
        populateDetails(patto);
        updateCounter();
        
        const activeTab = document.querySelector('.side-panel-v3-tab.active').getAttribute('data-tab');
        if (activeTab === 'stats') {
            updatePanelStats();
            updatePanelLegend();
        } else if (activeTab === 'charts') {
            updatePanelChart();
        }
    }
}

function updateCounter() {
    const counter = document.getElementById('sidePanelCounter');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');
    
    const total = sidePanelData?.length || 1;
    const current = currentSidePanelIndex + 1;
    
    if (counter) counter.textContent = `${current}/${total}`;
    if (prevBtn) prevBtn.disabled = current === 1;
    if (nextBtn) nextBtn.disabled = current === total;
}

// ==========================================
// AGGIORNA DA FILTRI
// ==========================================

window.updateSidePanelForFilters = function() {
    const panel = document.getElementById('pattoSidePanel');
    if (!panel || !panel.classList.contains('open')) return;
    
    updatePanelStats();
    updatePanelLegend();
    
    const activeTab = document.querySelector('.side-panel-v3-tab.active')?.getAttribute('data-tab');
    if (activeTab === 'charts') {
        updatePanelChart();
    }
};

// ==========================================
// ESPOSIZIONE GLOBALE
// ==========================================

window.showPattoDetails = openSidePanel;

console.log('✅ Side Panel V3 caricato e pronto');