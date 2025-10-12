// ==========================================
// DASHBOARD MONITORAGGIO PATTI - FILE PRINCIPALE CORRETTO
// ==========================================
// RESPONSABILITÀ: Mappa base, dati, filtri, statistiche, grafici, tabella

// Variabili globali
let map;
let miniMap;
let markersLayer;
let allData = [];
let filteredData = [];
let chart;
let currentMapLayer = 'standard';
let currentChartType = 'stato';
let proponenteFilter = '';

// Coordinate Palermo
const PALERMO_CENTER = [38.1157, 13.3615];
const PALERMO_BOUNDS = [
    [38.0500, 13.2500],
    [38.3000, 13.4200]
];

// Colori per stato
const statusColors = {
    'Istruttoria in corso': '#ffdb4d',
    'Respinta': '#ff6b6b',
    'Patto stipulato': '#8fd67d',
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
    'In attesa di integrazione': '#b3e6ff'
};

// Palette grafici moderni
const modernChartColors = {
    status: {
        'Istruttoria in corso': '#F59E0B',
        'Respinta': '#EF4444', 
        'Patto stipulato': '#10B981',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#8B5CF6',
        'In attesa di integrazione': '#06B6D4'
    },
    proponenti: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
        '#14B8A6', '#F43F5E', '#64748B', '#22C55E', '#A855F7'
    ]
};

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard Monitoraggio - Inizializzazione...');
    
    addModernChartStyles();
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    initializeMap();
    loadData();
    setupEventListeners();
    handleViewportResize();
    
    initializeFiltersPopup();
    
    // Smart search si inizializza da solo quando i dati sono pronti
});

// ==========================================
// INIZIALIZZAZIONE MAPPA (SOLO BASE)
// ==========================================

function initializeMap() {
    console.log('🗺️ Inizializzazione mappa...');
    
    try {
        if (map) {
            console.log('Rimozione mappa esistente...');
            map.remove();
        }
        
        map = L.map('map', {
            maxBounds: PALERMO_BOUNDS,
            maxZoom: 18,
            minZoom: 11,
            zoomControl: true,
            preferCanvas: true
        }).setView(PALERMO_CENTER, 12);
        
        const baseLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'CartoDB - Rielaborazione @gbvitrano - 2025',
            maxZoom: 18
        }).addTo(map);
        
        markersLayer = L.layerGroup().addTo(map);
        map.setMaxBounds(PALERMO_BOUNDS);
        
        // Marker centro - listener viene aggiunto da map-controls.js
        const centerMarker = L.marker(PALERMO_CENTER, {
            icon: L.divIcon({
                className: 'center-palermo-marker',
                html: '<div class="center-marker-icon">🏛️</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            interactive: true
        }).addTo(map);
        
        centerMarker
            .bindPopup('<b>Centro Storico di Palermo</b><br>Palazzo delle Aquile')
            .bindTooltip('Centro di Palermo', {permanent: false, direction: 'top'});
        
        currentMapLayer = 'standard';
        console.log('✅ Mappa inizializzata');
        
    } catch (error) {
        console.error('❌ Errore inizializzazione mappa:', error);
    }
}

// ==========================================
// CARICAMENTO DATI
// ==========================================

async function loadData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/PalermoHub/Dashboard-Monitoraggio/refs/heads/main/dati/monit_patti_pa.csv');
        const csvText = await response.text();
        
        allData = parseCSV(csvText);
        filteredData = [...allData];
        
        updateFilters();
        updateMap();
        updateStatistics();
        updateChart();
        updateLegend();
        updateLastUpdate();
        updateTable();
        
        hideFiltersPopup();
        
        console.log('✅ Dati caricati:', allData.length);
        
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = parseCSVLine(lines[0]);
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const record = {};
            
            headers.forEach((header, index) => {
                record[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            const latKey = headers.find(h => h.toLowerCase().includes('lat'));
            const lngKey = headers.find(h => h.toLowerCase().includes('long'));
            
            if (latKey && lngKey) {
                record.lat = parseFloat(record[latKey]);
                record.lng = parseFloat(record[lngKey]);
                
                if (!isNaN(record.lat) && !isNaN(record.lng)) {
                    records.push(record);
                }
            }
        }
    }
    
    return records;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// ==========================================
// GESTIONE FILTRI (INTEGRATA CON SMART SEARCH)
// ==========================================

function updateFilters() {
    console.log('🔄 Aggiornamento filtri...');
    
    const filterMappings = [
        { id: 'filterStato', key: 'Stato di avanzamento', isGeographical: false },
        { id: 'filterUpl', key: 'UPL', isGeographical: true },
        { id: 'filterQuartiere', key: 'Quartiere', isGeographical: true },
        { id: 'filterCircoscrizione', key: 'Circoscrizione', isGeographical: true }
    ];

    const currentFilters = {
        stato: document.getElementById('filterStato')?.value || '',
        upl: document.getElementById('filterUpl')?.value || '',
        quartiere: document.getElementById('filterQuartiere')?.value || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value || ''
    };

    filterMappings.forEach(({ id, key, isGeographical }) => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        updateFilterAppearance(select, currentValue);
        
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const actualKey = Object.keys(allData[0] || {}).find(k => 
            k.toLowerCase().trim() === key.toLowerCase().trim() ||
            (key.includes('Stato') && k.toLowerCase().includes('stato'))
        );

        if (!actualKey) return;

        let dataToFilter = [...allData];
        
        // Applica filtri geografici esistenti
        if (isGeographical) {
            if (currentFilters.stato && id !== 'filterStato') {
                const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
                if (statoKey) {
                    dataToFilter = dataToFilter.filter(item => item[statoKey]?.trim() === currentFilters.stato.trim());
                }
            }
            
            if (currentFilters.circoscrizione && id !== 'filterCircoscrizione') {
                const circKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('circoscrizione'));
                if (circKey) {
                    dataToFilter = dataToFilter.filter(item => item[circKey]?.trim() === currentFilters.circoscrizione.trim());
                }
            }
            
            if (currentFilters.quartiere && id !== 'filterQuartiere') {
                const quartKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('quartiere'));
                if (quartKey) {
                    dataToFilter = dataToFilter.filter(item => item[quartKey]?.trim() === currentFilters.quartiere.trim());
                }
            }
            
            if (currentFilters.upl && id !== 'filterUpl') {
                const uplKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase() === 'upl');
                if (uplKey) {
                    dataToFilter = dataToFilter.filter(item => item[uplKey]?.trim() === currentFilters.upl.trim());
                }
            }
        }
        
        const uniqueValues = [...new Set(
            dataToFilter
                .map(item => item[actualKey])
                .filter(value => value && value.toString().trim() !== '')
                .map(value => value.toString().trim())
        )].sort();
        
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        
        if (uniqueValues.includes(currentValue)) {
            select.value = currentValue;
        } else if (currentValue) {
            select.value = '';
        }
        
        updateFilterAppearance(select, select.value);
    });
}

function updateFilterAppearance(selectElement, value) {
    if (value && value.trim() !== '') {
        selectElement.classList.remove('border-gray-300');
        selectElement.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
        selectElement.style.fontWeight = '600';
    } else {
        selectElement.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
        selectElement.classList.add('border-gray-300');
        selectElement.style.fontWeight = 'normal';
    }
}

/**
 * FUNZIONE PRINCIPALE FILTRI
 * Integrata con smart search - NON sovrascrivere da altri file!
 */
function applyFilters() {
    console.log('🔍 Applicazione filtri...');
    
    const filters = {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
        titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
        proponente: proponenteFilter.trim(),
        smartSearch: window.currentSmartSearchQuery?.trim() || '' // Integrazione smart search
    };
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        const rappresentanteKey = Object.keys(item).find(k => k.toLowerCase().includes('rappresentante'));
        const indirizzoKey = Object.keys(item).find(k => k.toLowerCase().includes('indirizzo'));
        
        const statoMatch = !filters.stato || (item[statoKey]?.trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey]?.trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey]?.trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey]?.trim() === filters.circoscrizione);
        const titoloMatch = !filters.titolo || (item[titoloKey]?.toLowerCase().includes(filters.titolo));
        const proponenteMatch = !filters.proponente || (item[proponenteKey]?.trim() === filters.proponente);
        
        // Smart search match (se attiva)
        let smartSearchMatch = true;
        if (filters.smartSearch) {
            const fieldsToSearch = [
                item[titoloKey],
                item[proponenteKey],
                item[rappresentanteKey],
                item[indirizzoKey]
            ];
            smartSearchMatch = fieldsToSearch.some(field => 
                field?.toLowerCase().includes(filters.smartSearch.toLowerCase())
            );
        }
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && 
               titoloMatch && proponenteMatch && smartSearchMatch;
    });
    
    console.log(`✅ Filtrati ${filteredData.length}/${allData.length}`);
    
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    updateFiltersPopup();
}

// ==========================================
// AGGIORNAMENTO MAPPA
// ==========================================

function updateMap() {
    markersLayer.clearLayers();
    
    filteredData.forEach(patto => {
        const statoKey = Object.keys(patto).find(k => k.toLowerCase().includes('stato'));
        const stato = patto[statoKey] || '';
        const color = statusColors[stato] || '#6b7280';
        
        const marker = L.circleMarker([patto.lat, patto.lng], {
            radius: 6,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markersLayer);
        
        const titoloKey = Object.keys(patto).find(k => k.toLowerCase().includes('titolo'));
        const titolo = patto[titoloKey] || 'Titolo non disponibile';
        
        marker.bindTooltip(titolo, {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
        });
        
        const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
        
        const popupContent = `
            <div class="p-2 max-w-xs">
                <h3 class="font-semibold text-xs mb-2">${titolo}</h3>
                <button onclick="showPattoDetails('${patto[idKey]}')" 
                        class="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">
                    Vedi dettagli
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });
    
    centerMapOnFilteredData();
}

function centerMapOnFilteredData() {
    if (filteredData.length === 0) {
        map.setView(PALERMO_CENTER, 13);
        return;
    }

    if (filteredData.length === 1) {
        map.setView([filteredData[0].lat, filteredData[0].lng], 16);
        return;
    }

    const coordinates = filteredData.map(item => [item.lat, item.lng]);
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [15, 15] });
}

// ==========================================
// STATISTICHE E GRAFICI
// ==========================================

function updateStatistics() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    
    const total = filteredData.length;
    const stipulati = filteredData.filter(p => p[statoKey] === 'Patto stipulato').length;
    const istruttoria = filteredData.filter(p => p[statoKey] === 'Istruttoria in corso').length;
    const attesaIntegrazione = filteredData.filter(p => p[statoKey] === 'In attesa di integrazione').length;
    const monitoraggio = filteredData.filter(p => p[statoKey] === 'Proroga e/o Monitoraggio e valutazione dei risultati').length;
    const respinti = filteredData.filter(p => p[statoKey] === 'Respinta').length;
    
    updateCounterWithAnimation('totalPatti', total);
    updateCounterWithAnimation('pattiStipulati', stipulati);
    updateCounterWithAnimation('pattiIstruttoria', istruttoria);
    updateCounterWithAnimation('pattiAttesaIntegrazione', attesaIntegrazione);
    updateCounterWithAnimation('pattiMonitoraggio', monitoraggio);
    updateCounterWithAnimation('pattiRespinti', respinti);
}

function updateCounterWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === newValue) return;
    
    const steps = 5;
    const stepValue = (newValue - currentValue) / steps;
    let currentStep = 0;
    
    const interval = setInterval(() => {
        currentStep++;
        const displayValue = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = displayValue;
        
        if (currentStep >= steps) {
            element.textContent = newValue;
            clearInterval(interval);
        }
    }, 20);
}

function updateChart() {
    if (currentChartType === 'stato') {
        updateStatusChart();
    } else {
        updateProponenteChart();
    }
}

function updateStatusChart() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    const statusCounts = {};
    
    filteredData.forEach(item => {
        const status = item[statoKey] || 'Non specificato';
        if (status && status.toString().trim() !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    createModernChart(labels, data, null, 'stato');
}

function updateProponenteChart() {
    const proponenteKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('proponente'));
    const proponenteCounts = {};
    
    filteredData.forEach(item => {
        const proponente = item[proponenteKey] || 'Non specificato';
        if (proponente && proponente.toString().trim() !== '') {
            proponenteCounts[proponente] = (proponenteCounts[proponente] || 0) + 1;
        }
    });
    
    const sortedProponenti = Object.entries(proponenteCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);
    
    const labels = sortedProponenti.map(([label]) => label);
    const data = sortedProponenti.map(([,count]) => count);
    
    createModernChart(labels, data, null, 'proponente', labels);
}

function createModernChart(labels, data, colors, type, fullLabels = null) {
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    let chartColors;
    if (type === 'stato') {
        chartColors = labels.map(label => {
            const matchingStatus = Object.keys(modernChartColors.status).find(status => 
                status.includes(label) || label.includes(status.split(' ')[0])
            );
            return matchingStatus ? modernChartColors.status[matchingStatus] : modernChartColors.status['Istruttoria in corso'];
        });
    } else {
        chartColors = generateIntelligentColors(data.length, 220);
    }

    const hoverColors = chartColors.map(color => getBrighterColor(color));

    chart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: type === 'stato' ? 'Numero di patti' : 'Numero di richieste',
                data: data,
                backgroundColor: chartColors,
                borderColor: chartColors,
                borderWidth: 2,
                borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                hoverBackgroundColor: hoverColors,
                hoverBorderColor: hoverColors,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            layout: { padding: { top: 20, bottom: 5, left: 0, right: 0 } },
            animation: { duration: 1000, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#F1F5F9',
                    bodyColor: '#E2E8F0',
                    padding: 16,
                    cornerRadius: 12
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 70,
                        minRotation: 70,
                        font: { size: 9, weight: '500' },
                        color: '#64748B'
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    if (type === 'stato') {
                        const selectedStatus = fullLabels ? fullLabels[index] : labels[index];
                        const statusSelect = document.getElementById('filterStato');
                        if (statusSelect) {
                            statusSelect.value = selectedStatus;
                            applyFilters();
                        }
                    } else {
                        const selectedProponente = fullLabels ? fullLabels[index] : labels[index];
                        proponenteFilter = selectedProponente;
                        applyFilters();
                    }
                }
            }
        }
    });

    return chart;
}

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

function getBrighterColor(color) {
    if (color.startsWith('hsl')) {
        return color.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/, (match, h, s, l) => {
            const newL = Math.min(parseInt(l) + 15, 85);
            return `hsl(${h}, ${s}%, ${newL}%)`;
        });
    }
    return color + 'CC';
}

function addModernChartStyles() {
    if (document.getElementById('modernChartStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'modernChartStyles';
    style.textContent = `
        .chart-container {
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
            padding: 4px;
            position: relative;
            overflow: hidden;
            flex: 1;
            height: 300px;
            width: 100%;
        }
        
        #statusChart {
            width: 100% !important;
            height: 300px !important;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// TABELLA
// ==========================================

function updateTable() {
    if (!filteredData || filteredData.length === 0) {
        const tableCount = document.getElementById('tableCount');
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        
        if (tableCount) tableCount.textContent = '0';
        if (tableHeader) tableHeader.innerHTML = '<th>Nessun dato</th>';
        if (tableBody) tableBody.innerHTML = '';
        return;
    }

    const excludedFields = ['foto', 'googlemaps', 'geouri', 'upl', 'lat.', 'long.', 'lat', 'lng', 'coordinate', 'quartiere', 'circoscrizione'];
    
    const allKeys = Object.keys(filteredData[0]);
    const filteredKeys = allKeys.filter(key => {
        const keyLower = key.toLowerCase().trim();
        return !excludedFields.some(excluded => keyLower.includes(excluded.toLowerCase()));
    });

    const tableCount = document.getElementById('tableCount');
    if (tableCount) tableCount.textContent = filteredData.length;

    const tableHeader = document.getElementById('tableHeader');
    if (tableHeader) {
        tableHeader.innerHTML = '';
        
        filteredKeys.forEach(key => {
            const th = document.createElement('th');
            th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase';
            th.textContent = key;
            tableHeader.appendChild(th);
        });

        const actionTh = document.createElement('th');
        actionTh.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase';
        actionTh.textContent = 'Azioni';
        tableHeader.appendChild(actionTh);
    }

    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = '';

        filteredData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            filteredKeys.forEach(key => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
                
                let value = item[key] || 'N/A';
                
                if (key.toLowerCase().includes('stato')) {
                    const color = statusColors[value] || '#6b7280';
                    td.innerHTML = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px;">${value}</span>`;
                } else {
                    td.textContent = value.toString().length > 40 ? value.toString().substring(0, 37) + '...' : value;
                }
                
                row.appendChild(td);
            });

            const actionTd = document.createElement('td');
            actionTd.className = 'px-3 py-2 whitespace-nowrap text-xs';
            
            const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
            actionTd.innerHTML = `
                <button onclick="showPattoDetails('${item[idKey]}')" 
                        class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-xs">
                    Dettagli
                </button>
            `;
            
            row.appendChild(actionTd);
            tableBody.appendChild(row);
        });

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

// ==========================================
// DETTAGLI PATTO (BASE - enhanced in monitoraggio_p2.js)
// ==========================================

function showPattoDetails(pattoId) {
    // Usa versione enhanced se disponibile
    if (typeof showPattoDetailsEnhanced === 'function') {
        showPattoDetailsEnhanced(pattoId);
        return;
    }
    
    // Fallback base
    const idKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase() === 'id');
    const patto = allData.find(p => p[idKey] === pattoId);
    if (!patto) return;
    
    const modal = document.getElementById('pattoModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// ==========================================
// SETUP EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    console.log('🎮 Setup event listeners...');
    
    // Chart selector
    const chartSelector = document.getElementById('chartTypeSelector');
    if (chartSelector) {
        chartSelector.addEventListener('change', function() {
            currentChartType = this.value;
            updateChart();
        });
    }
    
    // Filtri geografici
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                applyFilters();
                setTimeout(() => updateFilters(), 100);
            });
        }
    });
    
    // Reset filtri
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Tabella
    const showTableBtn = document.getElementById('showTableBtn');
    if (showTableBtn) {
        showTableBtn.addEventListener('click', () => {
            updateTable();
            const modal = document.getElementById('tableModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    const closeTableBtn = document.getElementById('closeTableModal');
    if (closeTableBtn) {
        closeTableBtn.addEventListener('click', () => {
            const modal = document.getElementById('tableModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
    
    // Info modal
    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
            const modal = document.getElementById('infoModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    const closeInfoBtn = document.getElementById('closeInfoModal');
    if (closeInfoBtn) {
        closeInfoBtn.addEventListener('click', () => {
            const modal = document.getElementById('infoModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
    
    // Dettagli patto modal
    const closePattoBtn = document.getElementById('closeModal');
    if (closePattoBtn) {
        closePattoBtn.addEventListener('click', () => {
            const modal = document.getElementById('pattoModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            if (window.miniMap) {
                window.miniMap.remove();
                window.miniMap = null;
            }
        });
    }
}

function clearAllFilters() {
    console.log('🔄 Reset tutti i filtri...');
    
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            updateFilterAppearance(element, '');
        }
    });
    
    // Reset smart search se esiste
    if (typeof clearSmartSearchCompletely === 'function') {
        clearSmartSearchCompletely();
    }
    
    proponenteFilter = '';
    filteredData = [...allData];
    
    updateFilters();
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    hideFiltersPopup();
}

// ==========================================
// POPUP FILTRI
// ==========================================

function updateFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    const title = document.getElementById('filtersPopupTitle');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    if (!popup || !title || !activeFiltersText) return;
    
    const filters = {};
    const stato = document.getElementById('filterStato')?.value?.trim() || '';
    const upl = document.getElementById('filterUpl')?.value?.trim() || '';
    const quartiere = document.getElementById('filterQuartiere')?.value?.trim() || '';
    const circoscrizione = document.getElementById('filterCircoscrizione')?.value?.trim() || '';
    const smartSearch = window.currentSmartSearchQuery?.trim() || '';
    
    if (stato) filters['Stato'] = stato;
    if (upl) filters['UPL'] = upl;
    if (quartiere) filters['Quartiere'] = quartiere;
    if (circoscrizione) filters['Circoscrizione'] = circoscrizione;
    if (smartSearch) filters['Ricerca'] = `"${smartSearch}"`;
    if (proponenteFilter) filters['Proponente'] = proponenteFilter;
    
    const activeFilters = Object.keys(filters);
    
    if (activeFilters.length === 0) {
        hideFiltersPopup();
        return;
    }
    
    const filteredCount = filteredData.length;
    const totalCount = allData.length;
    
    title.textContent = `${filteredCount} ${filteredCount === 1 ? 'richiesta' : 'richieste'} ${filteredCount < totalCount ? `di ${totalCount}` : ''}`;
    
    const filterTags = activeFilters.map(filterName => {
        const value = filters[filterName];
        return `<span class="filter-tag">${filterName}: ${value.length > 25 ? value.substring(0, 22) + '...' : value}</span>`;
    }).join('');
    
    activeFiltersText.innerHTML = filterTags || 'Nessun filtro';
    showFiltersPopup();
}

function showFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (popup) {
        popup.classList.remove('hide');
        popup.classList.add('show');
    }
}

function hideFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

function initializeFiltersPopup() {
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', clearAllFilters);
    }
}

// ==========================================
// UTILITY
// ==========================================

function updateLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = '';
    
    Object.entries(statusColors).forEach(([status, color]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-1';
        div.innerHTML = `
            <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
            <span class="text-xs text-gray-600">${status}</span>
        `;
        legend.appendChild(div);
    });
}

function updateLastUpdate() {
    const now = new Date();
    const formatted = now.toLocaleString('it-IT');
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) lastUpdate.textContent = formatted;
}

function handleViewportResize() {
    window.addEventListener('resize', function() {
        if (map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
        if (chart) {
            setTimeout(() => chart.resize(), 100);
        }
    });
}

// Export globale per modale
window.showPattoDetails = showPattoDetails;

console.log('✅ Dashboard Monitoraggio P1 caricato');