// ==========================================
// DASHBOARD MONITORAGGIO PATTI - VERSIONE COMPLETA CON GRAFICI MODERNI
// ==========================================

// Variabili globali
let lastClickedChartValue = null;  // Tiene traccia dell'ultimo valore cliccato
let lastClickedChartType = null;   // Tiene traccia del tipo di grafico ('stato' o 'proponente')
let map;
let miniMap;
let markersLayer;
window.allData = [];
window.filteredData = [];
let allData = window.allData;
let filteredData = window.filteredData;
let chart;
let chart1; // Grafico stato di avanzamento
let chart2; // Grafico proponente

let lastClickedChartValue1 = null;
let lastClickedChartType1 = 'stato';

let lastClickedChartValue2 = null;
let lastClickedChartType2 = 'proponente';

let currentMapLayer = 'standard';
let autocompleteData = [];
let currentSuggestionIndex = -1;

// VARIABILI PER GRAFICI MULTIPLI
let currentChartType = 'stato'; // 'stato' o 'proponente'
let proponenteFilter = ''; // Filtro nascosto per proponente

let allDataMonitoraggio = [];
let uniqueValuesCache = {};

window.chartFilterState = {
    activeChartType: null,      // 'stato', 'proponente', 'ambiti' o null
    activeChartValue: null,     // valore attualmente filtrato dal grafico
    lastUpdateTime: 0,          // timestamp ultimo aggiornamento
    isUpdating: false           // flag per evitare aggiornamenti ricorsivi
};

console.log('✅ chartFilterState inizializzato');

// Coordinate precise di Palermo 38.11703022953232, 13.373426145815962
const PALERMO_CENTER = [38.1516, 13.3617]; // allineato al pulsante Home
const UFFICIO_COORDS = [38.116946349854494, 13.37317517969414];
const PALERMO_BOUNDS = [
    [37.96, 13.20], // Sud-Ovest — confine Comune di Palermo
    [38.26, 13.50]  // Nord-Est  — confine Comune di Palermo
];

// Colori per stato di avanzamento (originali)
const statusColors = {
    'Istruttoria in corso': '#ffdb4d',
    'Respinta': '#ff6b6b',
    'Patto stipulato': '#8fd67d',
    'Proroga e/o Monitoraggio': '#9b59b6',
    'In attesa di integrazione': '#b3e6ff',
	'Archiviata': '#94a3b8'
};


// ==========================================
// FUNZIONE GLOBALE: CHIUDI POPUP E APRI PANNELLO
// ==========================================
function closeMapPopupAndOpenPanel(pattoId) {
    console.log('🔄 Chiusura popup e apertura pannello per patto:', pattoId);
    
    try {
        // Chiudi il popup della mappa
        if (map && typeof map.closePopup === 'function') {
            map.closePopup();
            console.log('✅ Popup mappa chiuso');
        }
        
        // Aspetta un momento e poi apri il pannello
        setTimeout(() => {
            if (typeof window.showPattoDetails === 'function') {
                window.showPattoDetails(pattoId);
                console.log('✅ Pannello aperto per patto:', pattoId);
            } else {
                console.error('❌ Funzione showPattoDetails non trovata');
            }
        }, 100);
    } catch (error) {
        console.error('❌ Errore nella chiusura popup:', error);
    }
}


// ==========================================
// CONFIGURAZIONE GRAFICI MODERNI
// ==========================================

// Palette di colori moderna e intelligente per i grafici
const modernChartColors = {
    // Colori per stati (mantenendo la mappatura esistente ma con tonalità moderne)
    status: {
        'Istruttoria in corso': '#F59E0B',
        'Respinta': '#EF4444', 
        'Patto stipulato': '#10B981',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#8B5CF6',
        'In attesa di integrazione': '#06B6D4',
		'Archiviata': '#64748B'
    },
    // Palette per proponenti (colori dinamici)
    proponenti: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
        '#14B8A6', '#F43F5E', '#64748B', '#22C55E', '#A855F7'
    ]
};

// Funzione per generare colori intelligenti dinamici
function generateIntelligentColors(count, baseHue = 200) {
    const colors = [];
    const saturation = 65;
    const lightness = 55;
    
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 137.508)) % 360; // Golden angle per distribuzione ottimale
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

// Funzione per ottenere colore hover più brillante
function getBrighterColor(color) {
    if (typeof d3 !== 'undefined' && d3.color) {
        const d3Color = d3.color(color);
        if (d3Color) {
            return d3Color.brighter(0.3);
        }
    }
    // Fallback se d3 non è disponibile o per colori Chart.js
    if (color.startsWith('hsl')) {
        return color.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/, (match, h, s, l) => {
            const newL = Math.min(parseInt(l) + 15, 85);
            return `hsl(${h}, ${s}%, ${newL}%)`;
        });
    }
    // Per colori hex, aggiungi opacità o usa una versione più chiara
    return color + 'CC';
}

// Funzione migliorata per formattare valori
function formatChartValue(value, isPercentage = false) {
    if (isPercentage) {
        return `${value.toFixed(1)}%`;
    }
    
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    } else {
        return value.toString();
    }
}

// Plugin personalizzato per etichette dati sofisticate
const smartDataLabelsPlugin = {
    id: 'smartDataLabels',
    afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        ctx.save();
        
        chart.data.datasets.forEach(function(dataset, datasetIndex) {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            meta.data.forEach(function(bar, index) {
                const data = dataset.data[index];
                
                if (data > 0) {
                    // Calcola posizione intelligente del testo
                    const barHeight = Math.abs(bar.y - bar.base);
                    const hasSpaceInside = barHeight > 25; // Spazio minimo per testo interno
                    
                    // Stile del testo
                    ctx.fillStyle = hasSpaceInside ? '#FFFFFF' : '#374151';
                    ctx.font = 'bold 11px "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = hasSpaceInside ? 'middle' : 'bottom';
                    
                    // Posizione del testo
                    const x = bar.x;
                    const y = hasSpaceInside ? 
                        (bar.y + bar.base) / 2 : // Centro della barra
                        bar.y - 8; // Sopra la barra
                    
                    // Ombra per leggibilità
                    if (hasSpaceInside) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 2;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                    } else {
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    }
                    
                    ctx.fillText(formatChartValue(data), x, y);
                }
            });
        });
        
        ctx.restore();
    }
};

// Configurazione moderna per tooltip
const modernTooltipConfig = {
    enabled: true,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    titleColor: '#F1F5F9',
    bodyColor: '#E2E8F0',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    cornerRadius:8,
    displayColors: true,
    padding: 6,
    titleFont: {
        size: 12,
        weight: '600',
        family: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    },
    bodyFont: {
        size: 11,
        family: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    },
    usePointStyle: true,
    filter: function(tooltipItem) {
        return tooltipItem.parsed.y > 0; // Mostra solo per valori positivi
    },
    callbacks: {
        title: function(context) {
            return context[0].label;
        },
        label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const formattedValue = currentChartType === 'stato' ? 
                `${value} patt${value === 1 ? 'o' : 'i'}` :
                `${value} richiest${value === 1 ? 'a' : 'e'}`;
            return `${label}: ${formattedValue}`;
        },
        afterLabel: function(context) {
            if (filteredData && filteredData.length > 0) {
                const percentage = ((context.parsed.y / filteredData.length) * 100).toFixed(1);
                return `Percentuale: ${percentage}%`;
            }
            return '';
        }
    }
};

// ==========================================
// FUNZIONI HELPER PER SICUREZZA DOM
// ==========================================

function safeAddEventListener(elementId, eventType, handler, description) {
    const element = document.getElementById(elementId);
    
    if (element) {
        element.addEventListener(eventType, handler);
        console.log(`Event listener configurato: ${description} (${elementId})`);
        return true;
    } else {
        console.warn(`Elemento non trovato: ${elementId} - ${description}`);
        return false;
    }
}

function safeQuerySelector(selector, description) {
    const element = document.querySelector(selector);
    
    if (element) {
        return element;
    } else {
        console.warn(`Elemento non trovato: ${selector} - ${description}`);
        return null;
    }
}

// ==========================================
// GESTIONE POPUP FILTRI MIGLIORATA
// ==========================================

function updateFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    const title = document.getElementById('filtersPopupTitle');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    if (!popup || !title || !activeFiltersText) {
        console.warn('Elementi popup filtri non trovati');
        return;
    }
    
	const filters = {};
	const stato = document.getElementById('filterStato')?.value?.trim() || '';
	const upl = document.getElementById('filterUpl')?.value?.trim() || '';
	const quartiere = document.getElementById('filterQuartiere')?.value?.trim() || '';
	const circoscrizione = document.getElementById('filterCircoscrizione')?.value?.trim() || '';
	const ambiti = document.getElementById('filterAmbiti')?.value?.trim() || ''; // AGGIUNGI QUESTA RIGA
	const titolo = document.getElementById('filterTitolo')?.value?.trim() || '';

	if (stato) filters['Stato'] = stato;
	if (upl) filters['UPL'] = upl;
	if (quartiere) filters['Quartiere'] = quartiere;
	if (circoscrizione) filters['Circoscrizione'] = circoscrizione;
	if (ambiti) filters['Ambiti'] = ambiti; // AGGIUNGI QUESTA RIGA
	if (titolo) filters['Titolo'] = `"${titolo}"`;
	if (proponenteFilter && proponenteFilter.trim()) filters['Proponente'] = proponenteFilter;
    
    const activeFilters = Object.keys(filters);
    
    if (activeFilters.length === 0) {
        hideFiltersPopup();
        return;
    }
    
    const filteredCount = filteredData ? filteredData.length : 0;
    const totalCount = allData ? allData.length : 0;
    
    let titleText;
    if (filteredCount === 0) {
        titleText = 'Nessuna richiesta trovata';
    } else if (filteredCount === 1) {
        titleText = '1 richiesta selezionata';
    } else {
        titleText = `${filteredCount} richieste selezionate`;
    }
    
    if (filteredCount > 0 && filteredCount < totalCount) {
        titleText += ` di ${totalCount}`;
    }
    
    title.textContent = titleText;
    
    const filterTags = activeFilters.map(filterName => {
        const value = filters[filterName];
        let displayValue = value;
        
        if (value.length > 25) {
            displayValue = value.substring(0, 22) + '...';
        }
        
        return `<span class="filter-tag" title="${filterName}: ${value}">${filterName}: ${displayValue}</span>`;
    }).join('');
    
    if (filterTags) {
        activeFiltersText.innerHTML = filterTags;
    } else {
        activeFiltersText.textContent = 'Nessun filtro attivo';
    }
    
    showFiltersPopup();
}

function showFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    popup.classList.remove('hide');
    popup.offsetHeight;
    popup.classList.add('show');
    popup.style.zIndex = '1110';
}

function hideFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    popup.classList.remove('show');
    
    setTimeout(() => {
        if (!popup.classList.contains('show')) {
            popup.style.zIndex = '';
        }
    }, 300);
}

function closeFiltersPopupOnly() {
    console.log('Chiusura popup filtri senza reset');
    hideFiltersPopup();
}

function resetFiltersFromPopup() {
    console.log('🔄 Reset filtri dal popup');
    resetAllFiltersAndCharts(); // ✅ DELEGA A FUNZIONE CENTRALIZZATA
}

function setupFiltersPopupEventListeners() {
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFiltersFromPopup);
        console.log('Event listener popup reset configurato');
    }
    
    const closeButton = document.getElementById('filtersPopupClose');
    if (closeButton) {
        closeButton.addEventListener('click', closeFiltersPopupOnly);
        console.log('Event listener popup close configurato');
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('filtersPopup');
            if (popup && popup.classList.contains('show')) {
                closeFiltersPopupOnly();
            }
        }
    });
}

function initializeFiltersPopup() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFiltersPopup);
        return;
    }
    
    console.log('Inizializzazione popup filtri...');
    
    const popup = document.getElementById('filtersPopup');
    if (!popup) {
        console.error('Elemento popup filtri non trovato. Assicurati di aver aggiunto l\'HTML.');
        return;
    }
    
    addCloseButtonToFiltersPopup();
    setupFiltersPopupEventListeners();
    
  //  if (typeof lucide !== 'undefined' && lucide.createIcons) {
  //      setTimeout(() => {
  //          lucide.createIcons();
  //      }, 100);
  //  }
    
    console.log('Popup filtri inizializzato');
}

function addCloseButtonToFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    if (document.getElementById('filtersPopupClose')) return;
    
    const closeButton = document.createElement('button');
    closeButton.id = 'filtersPopupClose';
    closeButton.className = 'filters-popup-close';
    closeButton.title = 'Chiudi popup filtri';
    closeButton.setAttribute('aria-label', 'Chiudi popup filtri');
    closeButton.innerHTML = '<i data-lucide="x" class="h-3 w-3" aria-hidden="true"></i>';
    
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        popup.insertBefore(closeButton, resetButton);
    } else {
        popup.appendChild(closeButton);
    }
    
    addFiltersPopupStyles();
}

function addFiltersPopupStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .filters-popup-close {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 12px;
            margin-left: 8px;
        }
        
        .filters-popup-close:hover {
            background: #4b5563;
            transform: translateY(-1px);
        }

        .filters-popup-reset {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 12px;
        }
        
        .filters-popup-reset:hover {
            background: #dc2626;
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// CONTROLLI MAPPA MIGLIORATI
// ==========================================

function centerMapOnPalermo() {
    console.log('Centrando mappa su Palermo...');
    
    if (!map) {
        console.error('Mappa non inizializzata');
        return;
    }
    
    try {
        map.setView(PALERMO_CENTER, 13, {
            animate: true,
            duration: 1.5
        });
        
        console.log('Mappa centrata su:', PALERMO_CENTER);
        highlightPalermoCenter();
        
    } catch (error) {
        console.error('Errore nel centrare la mappa:', error);
        showNotification('Errore nel centrare la mappa', 'error');
    }
}

function highlightPalermoCenter() {
    const highlightCircle = L.circle(PALERMO_CENTER, {
        radius: 500,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(map);
    
    setTimeout(() => {
        map.removeLayer(highlightCircle);
    }, 2000);
}

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM caricato, inizializzazione...');
    
    addModernChartStyles();
    
  //  if (typeof lucide !== 'undefined' && lucide.createIcons) {
   //     lucide.createIcons();
  //  }
    
    initializeMap();
    
    // ✅ ATTENDI il caricamento dei dati
    try {
        await loadData();
        console.log('✅ Dati caricati con successo:', window.allData.length, 'elementi');
    } catch (error) {
        console.error('❌ Errore nel caricamento dei dati:', error);
    }
    
    setupEventListeners();
    setupAutoUpdate();
    handleViewportResize();
    
    initializeFiltersPopup();
    setupCollapsibleFilters();
    
    setTimeout(() => {
        if (typeof initializeSmartSearchIntegrated === 'function') {
            initializeSmartSearchIntegrated();
            console.log('Ricerca intelligente integrata inizializzata');
        }
    }, 1500);
});


// ==========================================
// INIZIALIZZAZIONE MAPPA
// ==========================================

function initializeMap() {
    console.log('Inizializzazione mappa...');
    
    try {
        if (map) {
            console.log('Rimozione mappa esistente...');
            map.remove();
        }
        
map = L.map('map', {
    maxBounds: PALERMO_BOUNDS,
    maxBoundsViscosity: 1.0,
    maxZoom: 19,
    minZoom: 13,
    zoomControl: false,
    preferCanvas: true,
    closePopupOnClick: false,
    doubleClickZoom: true,
    dragging: true,
    keyboard: true,
    scrollWheelZoom: true,
    touchZoom: true
}).setView(PALERMO_CENTER, 13);

        window.map = map;
        new L.Hash(map);

        
        const baseLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
            maxZoom: 19
        }).addTo(map);
        
        markersLayer = L.layerGroup().addTo(map);
        map.setMaxBounds(PALERMO_BOUNDS);
        
        const centerMarker = L.marker(UFFICIO_COORDS, {
            icon: L.divIcon({
                className: 'center-palermo-marker',
                html: '<div class="center-marker-icon">🏛️</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            interactive: true
        }).addTo(map);
        
        centerMarker
            .bindPopup('<b>Ufficio Rigenerazione Urbana</b><br>Ex Noviziato dei Crociferi<br><small><a href="https://maps.app.goo.gl/LrNfzsmP9t1RhMzs5" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;">📍 Click per ottenere il percorso</a></small>')
            .bindTooltip('Ufficio Rigenerazione Urbana', {permanent: false, direction: 'top'});

        centerMarker.on('click', function() {
            window.open('https://maps.app.goo.gl/LrNfzsmP9t1RhMzs5', '_blank', 'noopener,noreferrer');
        });
        
        currentMapLayer = 'standard';
        console.log('Mappa inizializzata');
        
    } catch (error) {
        console.error('Errore nell\'inizializzazione mappa:', error);
        showNotification('Errore nell\'inizializzazione della mappa', 'error');
    }
}

// ==========================================
// CARICAMENTO E PARSING DATI
// ==========================================
async function loadData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/PalermoHub/Dashboard-Monitoraggio/refs/heads/main/dati/monit_patti_pa.csv');
        const csvText = await response.text();
        
        allData = parseCSV(csvText);
        window.allData = allData; // ✅ AGGIUNGI QUESTA RIGA
        window.filteredData = [...allData]; // ✅ AGGIUNGI QUESTA RIGA
        filteredData = [...allData];
        
        setupAutocomplete();
        updateFilters();
        updateMap();
        // Al primo caricamento usa sempre il centro standard (uguale al pulsante Home)
        map.setView(PALERMO_CENTER, 13);
        updateStatistics();
        addDualChartStyles();
updateChartDual();
        updateLegend();
        updateLastUpdate();
        updateTable();
        
        hideFiltersPopup();
        
        console.log('✅ Dati caricati:', allData.length, 'patti'); // ✅ AGGIUNGI LOG
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati. Riprova più tardi.');
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

function setupAutocomplete() {
    const titoloKey = Object.keys(allData[0] || {}).find(key => 
        key.toLowerCase().includes('titolo') && key.toLowerCase().includes('proposta')
    );
    
    if (titoloKey) {
        autocompleteData = [...new Set(allData.map(item => item[titoloKey]).filter(Boolean))].sort();
    }
}

// ==========================================
// GESTIONE FILTRI CON CASCATA COMPLETA
// ==========================================

function updateFilters() {
    console.log('Aggiornamento filtri con logica cascata...');
    
    // ✅ INCLUDI filterAmbiti nella lista dei mapping
    const filterMappings = [
        { id: 'filterStato', key: 'Stato di avanzamento', isGeographical: false },
        { id: 'filterCircoscrizione', key: 'Circoscrizione', isGeographical: true },
        { id: 'filterQuartiere', key: 'Quartiere', isGeographical: true },
        { id: 'filterUpl', key: 'UPL', isGeographical: true },
        { id: 'filterAmbiti', key: 'Ambiti di azione', isGeographical: true } // NUOVO
    ];

    // ✅ INCLUDI filterAmbiti nei currentFilters
    const currentFilters = {
        stato: document.getElementById('filterStato')?.value || '',
        upl: document.getElementById('filterUpl')?.value || '',
        quartiere: document.getElementById('filterQuartiere')?.value || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value || '',
        ambiti: document.getElementById('filterAmbiti')?.value || '' // NUOVO
    };

    filterMappings.forEach(({ id, key, isGeographical }) => {
        const select = document.getElementById(id);
        if (!select) {
            console.warn(`Elemento ${id} non trovato`);
            return;
        }

        const currentValue = select.value;
        updateFilterAppearance(select, currentValue);
        
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const actualKey = Object.keys(allData[0] || {}).find(k => 
            k.toLowerCase().trim() === key.toLowerCase().trim() ||
            (key.includes('Stato') && k.toLowerCase().includes('stato'))
        );

        if (!actualKey) {
            console.warn(`Chiave non trovata per ${key}`);
            return;
        }

        let dataToFilter = [...allData];
        
        if (isGeographical) {
            if (currentFilters.stato && id !== 'filterStato') {
                const statoKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('stato')
                );
                if (statoKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[statoKey] && item[statoKey].trim() === currentFilters.stato.trim()
                    );
                }
            }
            
            if (currentFilters.circoscrizione && id !== 'filterCircoscrizione') {
                const circKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('circoscrizione')
                );
                if (circKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[circKey] && item[circKey].trim() === currentFilters.circoscrizione.trim()
                    );
                }
            }
            
            if (currentFilters.quartiere && id !== 'filterQuartiere') {
                const quartKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('quartiere')
                );
                if (quartKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[quartKey] && item[quartKey].trim() === currentFilters.quartiere.trim()
                    );
                }
            }
            
            if (currentFilters.upl && id !== 'filterUpl') {
                const uplKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase() === 'upl'
                );
                if (uplKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[uplKey] && item[uplKey].trim() === currentFilters.upl.trim()
                    );
                }
            }

            // ✅ NUOVO: Filtra per ambiti di azione
            if (currentFilters.ambiti && id !== 'filterAmbiti') {
                const ambitiKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('ambiti')
                );
                if (ambitiKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[ambitiKey] && item[ambitiKey].trim() === currentFilters.ambiti.trim()
                    );
                }
            }
        } else {
            if (currentFilters.circoscrizione) {
                const circKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('circoscrizione')
                );
                if (circKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[circKey] && item[circKey].trim() === currentFilters.circoscrizione.trim()
                    );
                }
            }
            
            if (currentFilters.quartiere) {
                const quartKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('quartiere')
                );
                if (quartKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[quartKey] && item[quartKey].trim() === currentFilters.quartiere.trim()
                    );
                }
            }
            
            if (currentFilters.upl) {
                const uplKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase() === 'upl'
                );
                if (uplKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[uplKey] && item[uplKey].trim() === currentFilters.upl.trim()
                    );
                }
            }

            // ✅ NUOVO: Filtra per ambiti
            if (currentFilters.ambiti) {
                const ambitiKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().includes('ambiti')
                );
                if (ambitiKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[ambitiKey] && item[ambitiKey].trim() === currentFilters.ambiti.trim()
                    );
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

    console.log('📊 Aggiornamento filtri completato, notifica grafici');
    updateAllChartsSynchronized();

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

function applyFilters() {
    console.log('🔄 applyFilters() - VERSIONE CORRETTA CON RESET');
    
    // 1️⃣ Raccogli TUTTI i filtri attivi
    const filters = {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
        ambiti: document.getElementById('filterAmbiti')?.value?.trim() || '',
        titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
        proponente: proponenteFilter.trim()
    };
    
    console.log('📋 Filtri attivi:', filters);
    
    // 2️⃣ Filtra i dati - LOGICA UNIFICATA
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const ambitiKey = Object.keys(item).find(k => k.toLowerCase().includes('ambiti'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        // ✅ TUTTI i filtri devono matchare (logica AND)
        const statoMatch = !filters.stato || (item[statoKey] && (
            filters.stato.startsWith('Proroga')
                ? item[statoKey].trim().startsWith('Proroga')
                : item[statoKey].trim() === filters.stato
        ));
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const ambitiMatch = !filters.ambiti || (item[ambitiKey] && item[ambitiKey].trim() === filters.ambiti);
        const titoloMatch = !filters.titolo || (item[titoloKey] && item[titoloKey].toLowerCase().includes(filters.titolo));
        const proponenteMatch = !filters.proponente || (item[proponenteKey] && item[proponenteKey].trim() === filters.proponente);
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && ambitiMatch && titoloMatch && proponenteMatch;
    });
    
    console.log(`✅ Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
    // 3️⃣ Aggiorna componenti MAPPA PRIMA (per visibilità)
    console.log('🗺️ Aggiornamento mappa...');
    updateMap();
    
    console.log('📊 Aggiornamento statistiche...');
    updateStatistics();
    
    console.log('📋 Aggiornamento tabella...');
    updateTable();
    
    console.log('🔔 Aggiornamento popup filtri...');
    updateFiltersPopup();
    
    // 4️⃣ ✅ CRUCIALE: Aggiorna grafici SINCRONIZZATI
    console.log('📈 Trigger updateAllChartsSynchronized()...');
    updateAllChartsSynchronized();
}


// ==========================================
// AGGIORNAMENTO MAPPA - FUNZIONE COMPLETA
// ==========================================

function updateMap() {
    console.log('🗺️ Aggiornamento mappa con', filteredData.length, 'patti');
    
    markersLayer.clearLayers();
    
    filteredData.forEach(patto => {
        const statoKey = Object.keys(patto).find(k => k.toLowerCase().includes('stato'));
        const stato = patto[statoKey] || '';
        const color = statusColors[stato] || '#6b7280';
        
        // Crea il marker circolare
        const marker = L.circleMarker([patto.lat, patto.lng], {
            radius: 6,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markersLayer);
        
        // Keys per i dati
        const titoloKey = Object.keys(patto).find(k => k.toLowerCase().includes('titolo'));
        const uplKey = Object.keys(patto).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(patto).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(patto).find(k => k.toLowerCase().includes('circoscrizione'));
        const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
        const proponenteKey = Object.keys(patto).find(k => k.toLowerCase().includes('proponente'));
        
        const titolo = patto[titoloKey] || 'Titolo non disponibile';
        
        // ==========================================
        // TOOLTIP AL PASSAGGIO DEL MOUSE
        // ==========================================
        marker.bindTooltip(titolo, {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
        });
        
        // ==========================================
        // CONTENUTO DEL POPUP
        // ==========================================
        const popupContent = `
            <div class="p-2 max-w-xs">
                <h3 class="font-semibold text-xs mb-2">${titolo}</h3>
                <div class="text-xs space-y-1">
                    <p><strong>Proponente:</strong> ${patto[proponenteKey] || 'N/A'}</p>
                    <p><strong>UPL:</strong> ${patto[uplKey] || 'N/A'}</p>
                    <p><strong>Quartiere:</strong> ${patto[quartiereKey] || 'N/A'}</p>
                    <p><strong>Circoscrizione:</strong> ${patto[circoscrizioneKey] || 'N/A'}</p>
                    <p><strong>Stato:</strong> 
                        <span style="background-color: ${color}; color: white; padding: 1px 4px; border-radius: 3px; font-size: 9px;">
                            ${stato}
                        </span>
                    </p>
                </div>
                <button onclick="closeMapPopupAndOpenPanel('${patto[idKey]}');" class="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors w-full">
                    Vedi dettagli
                </button>
            </div>
        `;
        
        // ==========================================
        // GESTIONE CLICK SUL MARKER
        // ==========================================
        marker.on('click', function(e) {
            console.log('📍 Click su marker per patto:', patto[idKey]);
            
            // 🔄 CHIUDI TUTTI GLI ALTRI POPUP PRIMA DI APRIRE QUESTO
            if (map && typeof map.closePopup === 'function') {
                map.closePopup();
                console.log('✅ Popup precedente chiuso');
            }
            
            // Apri il popup di questo marker
            this.openPopup();
            
            // Stop propagation per evitare conflitti
            L.DomEvent.stopPropagation(e);
        });
        
        // Bind il popup al marker
        marker.bindPopup(popupContent);
        
        // ==========================================
        // GESTIONE APERTURA POPUP
        // ==========================================
        marker.on('popupopen', function() {
            console.log('✨ Popup aperto per patto:', patto[idKey]);
            
        });
        
        // ==========================================
        // GESTIONE CHIUSURA POPUP
        // ==========================================
        marker.on('popupclose', function() {
            console.log('🔒 Popup chiuso per patto:', patto[idKey]);
        });
    });
    
    console.log('✅ Mappa aggiornata con', filteredData.length, 'marker');
    
    // Centra la mappa sui dati filtrati
    centerMapOnFilteredData();
}

// ==========================================
// FUNZIONE SUPPORTO: CENTRA MAPPA SUI DATI FILTRATI
// ==========================================

function centerMapOnFilteredData() {
    if (!filteredData || filteredData.length === 0) {
        console.log('📍 Nessun dato filtrato, centra su Palermo');
        map.setView(PALERMO_CENTER, 13);
        return;
    }

    if (filteredData.length === 1) {
        console.log('📍 Un solo patto, zoom a 16');
        map.setView([filteredData[0].lat, filteredData[0].lng], 16);
        return;
    }

    console.log('📍 Più patti, calcola bounds');
    const coordinates = filteredData.map(item => [item.lat, item.lng]);
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [15, 15] });
}


function centerMapOnFilteredData() {
    if (filteredData.length === 0 || filteredData.length === allData.length) {
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

// Funzione per evidenziare un patto sulla mappa principale
window.highlightPattoMarkerOnMap = function(patto) {
    if (!map || !patto || !patto.lat || !patto.lng) return false;
    
    try {
        // Rimuovi highlight precedente se esiste
        if (window.currentPattoHighlight) {
            try {
                map.removeLayer(window.currentPattoHighlight);
            } catch (e) {}
        }
        
        // Crea nuovo highlight
        window.currentPattoHighlight = L.circleMarker(
            [parseFloat(patto.lat), parseFloat(patto.lng)],
            {
                radius: 20,
                fillColor: '#3b82f6',
                color: '#ffffff',
                weight: 4,
                opacity: 1,
                fillOpacity: 0.7,
                className: 'side-panel-highlight-pulse',
                interactive: false
            }
        ).addTo(map);
        
        return true;
    } catch (error) {
        console.error('Errore evidenziazione marker:', error);
        return false;
    }
};

// Funzione per rimuovere highlight
window.removePattoHighlight = function() {
    if (window.currentPattoHighlight && map) {
        try {
            map.removeLayer(window.currentPattoHighlight);
            window.currentPattoHighlight = null;
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
};

// ==========================================
// STATISTICHE E GRAFICI MODERNI
// ==========================================

function updateStatistics() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    
    // 🔍 DEBUG: Vedi tutti gli stati unici nei dati
    console.log('=== DEBUG STATI ===');
    const uniqueStati = [...new Set(filteredData.map(p => p[statoKey]).filter(Boolean))];
    console.log('Stati unici trovati:', uniqueStati);
    
    // Vedi i record con stato anomalo
    const anomaliRecords = filteredData.filter(p => {
        const stato = p[statoKey];
        return !stato || 
               stato.trim() === '' || 
               stato.toLowerCase() === 'undefined' ||
               stato.toLowerCase() === 'null' ||
               !['Istruttoria in corso', 'Respinta', 'Patto stipulato', 
                 'Proroga e/o Monitoraggio', 'Proroga e/o Monitoraggio e valutazione dei risultati',
                 'In attesa di integrazione', 'Archiviata'].some(validStato => 
                   stato && stato.trim() === validStato
               );
    });
    console.log('Record con stato anomalo:', anomaliRecords.length);
    anomaliRecords.forEach(r => console.log('  - Stato:', JSON.stringify(r[statoKey])));
    
    // ✅ CORREZIONE: Filtra solo i record con stato VALIDO
    const validStati = [
        'Istruttoria in corso',
        'Respinta',
        'Patto stipulato',
        'Proroga e/o Monitoraggio',
        'Proroga e/o Monitoraggio e valutazione dei risultati',
        'In attesa di integrazione',
        'Archiviata'
    ];
    
    const validRecords = filteredData.filter(p => {
        const stato = (p[statoKey] || '').trim();
        return validStati.includes(stato);
    });
    
    // 📊 Usa il conteggio dei record VALIDI come totale
    const total = validRecords.length;  // ← IMPORTANTE: Usa record validi!
    
    const stipulati = validRecords.filter(p => p[statoKey].trim() === 'Patto stipulato').length;
    const istruttoria = validRecords.filter(p => p[statoKey].trim() === 'Istruttoria in corso').length;
    const attesaIntegrazione = validRecords.filter(p => p[statoKey].trim() === 'In attesa di integrazione').length;
    
    // Gestisci la variazione del nome "Proroga e/o Monitoraggio"
    const monitoraggio = validRecords.filter(p => {
        const stato = p[statoKey].trim();
        return stato.startsWith('Proroga e/o Monitoraggio');
    }).length;
    
    const respinti = validRecords.filter(p => p[statoKey].trim() === 'Respinta').length;
    const archiviati = validRecords.filter(p => p[statoKey].trim() === 'Archiviata').length;
    
    // 📋 Verifica la somma
    const sumCheck = stipulati + istruttoria + attesaIntegrazione + monitoraggio + respinti + archiviati;
    console.log('Somma verifica:', sumCheck, '/ Total:', total);
    
    if (sumCheck !== total) {
        console.warn('⚠️ DISCREPANZA:', total - sumCheck, 'record non conteggiati!');
    }
    
    // Calcola percentuali
    const calcPercentage = (value) => total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    
    updateCounterWithAnimation('totalPatti', total);
    updateCounterWithPercentage('pattiStipulati', stipulati, calcPercentage(stipulati));
    updateCounterWithPercentage('pattiIstruttoria', istruttoria, calcPercentage(istruttoria));
    updateCounterWithPercentage('pattiAttesaIntegrazione', attesaIntegrazione, calcPercentage(attesaIntegrazione));
    updateCounterWithPercentage('pattiMonitoraggio', monitoraggio, calcPercentage(monitoraggio));
    updateCounterWithPercentage('pattiRespinti', respinti, calcPercentage(respinti));
    updateCounterWithPercentage('pattiArchiviati', archiviati, calcPercentage(archiviati));

    updateDonutChart();
    updateLegend();
}

// ✅ ALTERNATIVA PIÙ ROBUSTA: Normalizza gli stati al caricamento
function normalizeStatoField() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    
    allData.forEach(record => {
        if (statoKey) {
            const stato = record[statoKey];
            // Normalizza: trim + standardizza i valori
            if (stato) {
                record[statoKey] = stato.trim();
            }
        }
    });
    
    console.log('✅ Campi "Stato" normalizzati');
}

function updateChartDual() {
    try {
        updateCircoscrizioneChart('rankList4');
        updateQuartiereChart('rankList5');
        updateStatusChart('rankList1');
        updateProponenteChart('rankList2');
        updateAmbitiChart('rankList3');
        updateChartInterfaceDual();
    } catch (error) {
        console.error('Errore aggiornamento classifiche:', error);
    }
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

// NUOVA FUNZIONE: Aggiorna contatore con valore + percentuale
function updateCounterWithPercentage(elementId, newValue, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Estrai il valore numerico corrente (prima della percentuale)
    const currentText = element.textContent;
    const currentValue = parseInt(currentText.match(/\d+/)?.[0]) || 0;
    
    if (currentValue === newValue) return;
    
    const steps = 5;
    const stepValue = (newValue - currentValue) / steps;
    let currentStep = 0;
    
    const interval = setInterval(() => {
        currentStep++;
        const displayValue = Math.round(currentValue + (stepValue * currentStep));
        element.textContent = `${displayValue} (${percentage}%)`;
        
        if (currentStep >= steps) {
            element.textContent = `${newValue} (${percentage}%)`;
            clearInterval(interval);
        }
    }, 20);
}


function createModernChart(labels, data, colors, type, fullLabels = null, canvasId = 'statusChart') {
    console.log(`🎨 createModernChart - Tipo: ${type}, Canvas: ${canvasId}`);
    
    // Distruggi grafico precedente
    if (window.chartsMap && window.chartsMap[canvasId]) {
        try {
            window.chartsMap[canvasId].destroy();
        } catch (e) {}
    }
    
    // Inizializza map se non esiste
    if (!window.chartsMap) {
        window.chartsMap = {};
    }
    
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.warn(`❌ Canvas ${canvasId} non trovato nel DOM`);
        return;
    }

    const context = ctx.getContext('2d');
    
    let chartColors;
    if (type === 'stato') {
        chartColors = labels.map(label => {
            const matchingStatus = Object.keys(modernChartColors.status).find(status => {
                return status.includes(label) || label.includes(status.split(' ')[0]);
            });
            return matchingStatus ? modernChartColors.status[matchingStatus] : '#F59E0B';
        });
    } else {
        chartColors = generateIntelligentColors(data.length, 220);
    }

    const hoverColors = chartColors.map(color => getBrighterColor(color));

    const chartInstance = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: type === 'stato' ? 'N° Patti' : 
                       type === 'proponente' ? 'N° Richieste' :
                       'N° Progetti',
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
                tooltip: modernTooltipConfig
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 70,
                        minRotation: 70,
                        font: { size: 9, weight: '500' },
                        color: '#64748B'
                    },
                    border: { display: false }
                },
                y: {
                    display: false,
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false },
                    beginAtZero: true
                }
            },
			
			onClick: (event, elements) => {
                if (elements.length === 0) return;
                
                const index = elements[0].index;
                const clickedValue = fullLabels ? fullLabels[index] : labels[index];
                
                console.log(`📊 Click su grafico [${type}]: "${clickedValue}"`);
                
                // ✅ LOGICA: Se clicchi lo STESSO valore su STESSO grafico = RESET
                if (window.chartFilterState.activeChartType === type && 
                    window.chartFilterState.activeChartValue === clickedValue) {
                    
                    console.log('🔄 DOPPIO CLICK RILEVATO - Attivazione RESET');
                    resetAllFiltersAndCharts();
                    return;
                }
                
                // ✅ Nuovo filtro: Aggiorna stato centralizzato
                window.chartFilterState.activeChartType = type;
                window.chartFilterState.activeChartValue = clickedValue;
                
                console.log(`📌 Stato grafico aggiornato:`, window.chartFilterState);
                
                // ✅ Applica il filtro e aggiorna TUTTI i grafici
                applyChartFilter(type, clickedValue);
            },


   onHover: (event, elements) => {
                const canvas = event.native?.target;
                if (canvas) {
                    canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        },
        plugins: [smartDataLabelsPlugin]
    });

    chartInstance.update('active');
    window.chartsMap[canvasId] = chartInstance;
    return chartInstance;
}

// ==================== RANK LIST ====================

function createRankingList(containerId, labels, data, colors, type, fullLabels) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const maxVal = Math.max(...data, 1);
    container.innerHTML = labels.map((label, i) => {
        const val = data[i];
        const pct = (val / maxVal * 100).toFixed(1);
        const fullLabel = (fullLabels && fullLabels[i]) ? fullLabels[i] : label;
        const color = (colors && colors[i]) ? colors[i] : '#3b82f6';
        const safeVal = fullLabel.replace(/"/g, '&quot;');
        return `<div class="rank-item" data-type="${type}" data-value="${safeVal}" onclick="handleRankClick(this)">
            <div class="rank-badge">${i + 1}</div>
            <div class="rank-label" title="${fullLabel}">${label}</div>
            <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:${color}"></div></div>
            <div class="rank-count">${val}</div>
        </div>`;
    }).join('');
}

window.handleRankClick = function(el) {
    const type = el.dataset.type;
    const value = el.dataset.value;
    if (window.chartFilterState.activeChartType === type &&
        window.chartFilterState.activeChartValue === value) {
        resetAllFiltersAndCharts();
        return;
    }
    el.closest('.rank-list').querySelectorAll('.rank-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    window.chartFilterState.activeChartType = type;
    window.chartFilterState.activeChartValue = value;
    applyChartFilter(type, value);
};

window.handleKpiCardClick = function(el) {
    const type = el.dataset.type;
    const value = el.dataset.value;
    if (window.chartFilterState.activeChartType === type &&
        window.chartFilterState.activeChartValue === value) {
        resetAllFiltersAndCharts();
        return;
    }
    window.chartFilterState.activeChartType = type;
    window.chartFilterState.activeChartValue = value;
    syncKpiCardState(value);
    applyChartFilter(type, value);
};

function syncKpiCardState(activeValue) {
    document.querySelectorAll('.ts-kpi-card[data-type="stato"]').forEach(card => {
        const matches = activeValue
            ? (activeValue.startsWith('Proroga')
                ? card.dataset.value.startsWith('Proroga')
                : card.dataset.value === activeValue)
            : false;
        card.classList.toggle('active', matches);
        card.classList.toggle('dimmed', activeValue ? !matches : false);
    });
}

function resetAllFiltersAndCharts() {
    console.log('🔄 RESET TOTALE - Filtri + Grafici + Stato (IMPROVED)');
    
    // 1️⃣ Reset stato grafici COMPLETAMENTE
    window.chartFilterState.activeChartType = null;
    window.chartFilterState.activeChartValue = null;
    window.chartFilterState.isUpdating = false;
    window.chartFilterState.lastUpdateTime = 0;
    console.log('✅ Stato grafici resettato');

    // Reset KPI card visual state
    document.querySelectorAll('.ts-kpi-card[data-type="stato"]').forEach(c => {
        c.classList.remove('active', 'dimmed');
    });

    // 2️⃣ Reset input filtri - TUTTI gli ID
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
            updateFilterAppearance(el, '');
            console.log(`✅ Reset filtro: ${id}`);
        }
    });
    
    // 3️⃣ Reset variabili globali filtri
    proponenteFilter = '';
    const suggestions = document.getElementById('autocompleteSuggestions');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    console.log('✅ Variabili filtri resettate');
    
    // 4️⃣ Ripristina dati originali (COPIA PROFONDA)
    filteredData = JSON.parse(JSON.stringify(allData));
    console.log(`✅ Dati ripristinati: ${filteredData.length} elementi`);
    
    // 5️⃣ Aggiorna TUTTO in sequenza CORRETTA
    console.log('🔄 Aggiornamento componenti...');
    
    try {
        updateFilters();
        updateMap();
        updateStatistics();
        updateTable();
        hideFiltersPopup();
        
        console.log('✅ Componenti aggiornati');
        
        // 6️⃣ Aggiorna grafici SINCRONIZZATI
        console.log('📈 Aggiornamento grafici sincronizzati...');
        updateAllChartsSynchronized();
        
        console.log('✅✅ RESET COMPLETATO CON SUCCESSO');
        showNotification('✅ Tutti i filtri resettati', 'info');
        
    } catch (error) {
        console.error('❌ Errore durante reset:', error);
        showNotification('⚠️ Errore durante il reset', 'error');
    }
}

// ✅ NUOVO: Aggiornamento SINCRONIZZATO dei 3 grafici

function updateAllChartsSynchronized() {
    if (window.chartFilterState.isUpdating) return;
    window.chartFilterState.isUpdating = true;
    try {
        updateCircoscrizioneChart('rankList4');
        updateQuartiereChart('rankList5');
        updateStatusChart('rankList1');
        updateProponenteChart('rankList2');
        updateAmbitiChart('rankList3');
        updateChartInterfaceDual();
        updateDonutChart();
        updateLegend();
        window.chartFilterState.lastUpdateTime = Date.now();
    } catch (error) {
        console.error('Errore aggiornamento classifiche:', error);
    } finally {
        window.chartFilterState.isUpdating = false;
    }
}

// ✅ NUOVO: Applica filtro dal grafico + aggiorna altri grafici
function applyChartFilter(chartType, value) {
    console.log(`🔧 FILTER APPLICATION [${chartType}]: "${value}"`);

    if (!value || value.trim() === '') {
        console.warn('⚠️ Valore filtro vuoto, skip');
        return;
    }

    if (chartType === 'stato') {
        syncKpiCardState(value);
    }
    
    // Mappa tipo grafico → ID filtro
    const filterMap = {
        'stato': 'filterStato',
        'ambiti': 'filterAmbiti',
        'circoscrizione': 'filterCircoscrizione',
        'quartiere': 'filterQuartiere',
        'proponente': null // Gestione speciale
    };
    
    // Applica il filtro
    if (chartType === 'proponente') {
        // 🔑 CORREZIONE: Non stai né aggiornando il campo di ricerca NÉ aggiornando l'UI
        console.log(`📝 Impostazione filtro proponente: "${value}"`);
        proponenteFilter = value;
        
        // 🆕 NUOVO: Aggiorna anche il campo ricerca se esiste
        const searchInput = document.getElementById('filterTitolo');
        if (searchInput && proponenteFilter) {
            // Nota: Non cambiamo il titolo, solo logghiamo
            console.log(`ℹ️ Filtro proponente attivato, escludiamo altre colonne`);
        }
        
    } else if (filterMap[chartType]) {
        const filterEl = document.getElementById(filterMap[chartType]);
        if (filterEl) {
            filterEl.value = value;
            updateFilterAppearance(filterEl, value);
            console.log(`📌 Filtro ${chartType} input impostato: "${value}"`);
        } else {
            console.warn(`⚠️ Elemento filtro ${filterMap[chartType]} non trovato`);
        }
    }
    
    // 🔥 FONDAMENTALE: Applica i filtri e aggiorna TUTTO in sequenza
    console.log('🔄 TRIGGER applyFilters() con logica sincronizzata...');
    applyFilters();
}

function updateChartInterfaceDual() {
    const totalVisible = filteredData.length;
    const totalOverall = allData.length;
    const msg = `Stai visualizzando ${totalVisible} di ${totalOverall} richieste`;
    ['chartStats1','chartStats2','chartStats3','chartStats4','chartStats5'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
    });
}

function updateStatusChart(canvasId = 'rankList1') {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    const statusCounts = {};
    
    // 🔥 USA filteredData invece di allData
    filteredData.forEach(item => {
        const status = item[statoKey] || 'Non specificato';
        if (status && status.toString().trim() !== '') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });
    
    const validStatusCounts = {};
    Object.entries(statusCounts).forEach(([key, value]) => {
        if (key && key.trim() && key.trim().toLowerCase() !== 'undefined') {
            validStatusCounts[key.trim()] = value;
        }
    });
    
    const labels = Object.keys(validStatusCounts).map(label => {
        if (label === 'Proroga e/o Monitoraggio e valutazione dei risultati') {
            return 'Proroga/Monitoraggio';
        }
        return label;
    });
    const data = Object.values(validStatusCounts);
    const fullLabels = Object.keys(validStatusCounts);
    
    const colors = labels.map(label => {
        const match = Object.keys(modernChartColors.status).find(s => s.includes(label) || label.includes(s.split(' ')[0]));
        return match ? modernChartColors.status[match] : '#F59E0B';
    });
    createRankingList(canvasId, labels, data, colors, 'stato', fullLabels);
}

function updateProponenteChart(canvasId = 'rankList2') {
    const proponenteKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('proponente'));
    const proponenteCounts = {};
    
    filteredData.forEach(item => {
        const proponente = item[proponenteKey] || 'Non specificato';
        if (proponente && 
            proponente.toString().trim() !== '' && 
            proponente.toString().trim().toLowerCase() !== 'undefined' &&
            proponente.toString().trim().toLowerCase() !== 'null' &&
            proponente.toString().trim() !== 'N/A') {
            const normalizedProponente = proponente.toString().trim();
            proponenteCounts[normalizedProponente] = (proponenteCounts[normalizedProponente] || 0) + 1;
        }
    });
    
    const sortedProponenti = Object.entries(proponenteCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);
    
    const labels = sortedProponenti.map(([label]) => {
        return label.length > 25 ? label.substring(0, 22) + '...' : label;
    });
    const data = sortedProponenti.map(([,count]) => count);
    const fullLabels = sortedProponenti.map(([fullLabel]) => fullLabel);
    
    const colors = Array(data.length).fill('#3B82F6');
    createRankingList(canvasId, labels, data, colors, 'proponente', fullLabels);
}


function updateCircoscrizioneChart(canvasId = 'rankList4') {
    const key = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('circoscrizione'));
    if (!key) { console.warn('⚠️ Colonna "Circoscrizione" non trovata'); return; }
    const counts = {};
    filteredData.forEach(item => {
        const v = (item[key] || '').toString().trim();
        if (v && v.toLowerCase() !== 'undefined' && v.toLowerCase() !== 'null' && v !== 'N/A') {
            counts[v] = (counts[v] || 0) + 1;
        }
    });
    const sorted = Object.entries(counts).sort(([,a],[,b]) => b - a);
    const labels = sorted.map(([l]) => l.length > 25 ? l.substring(0, 22) + '...' : l);
    const data = sorted.map(([,c]) => c);
    const fullLabels = sorted.map(([l]) => l);
    const colors = Array(data.length).fill('#10B981');
    createRankingList(canvasId, labels, data, colors, 'circoscrizione', fullLabels);
}

function updateQuartiereChart(canvasId = 'rankList5') {
    const key = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('quartiere'));
    if (!key) { console.warn('⚠️ Colonna "Quartiere" non trovata'); return; }
    const counts = {};
    filteredData.forEach(item => {
        const v = (item[key] || '').toString().trim();
        if (v && v.toLowerCase() !== 'undefined' && v.toLowerCase() !== 'null' && v !== 'N/A') {
            counts[v] = (counts[v] || 0) + 1;
        }
    });
    const sorted = Object.entries(counts).sort(([,a],[,b]) => b - a).slice(0, 20);
    const labels = sorted.map(([l]) => l.length > 25 ? l.substring(0, 22) + '...' : l);
    const data = sorted.map(([,c]) => c);
    const fullLabels = sorted.map(([l]) => l);
    const colors = Array(data.length).fill('#8B5CF6');
    createRankingList(canvasId, labels, data, colors, 'quartiere', fullLabels);
}

function updateAmbitiChart(canvasId = 'rankList3') {
    const ambitiKey = Object.keys(allData[0] || {}).find(k => 
        k.toLowerCase().includes('ambiti')
    );
    
    if (!ambitiKey) {
        console.warn('⚠️ Colonna "Ambiti" non trovata nei dati');
        return;
    }
    
    const ambitiCounts = {};
    
    filteredData.forEach(item => {
        const ambiti = item[ambitiKey] || 'Non specificato';
        if (ambiti && 
            ambiti.toString().trim() !== '' && 
            ambiti.toString().trim().toLowerCase() !== 'undefined' &&
            ambiti.toString().trim().toLowerCase() !== 'null' &&
            ambiti.toString().trim() !== 'N/A') {
            const normalizedAmbiti = ambiti.toString().trim();
            ambitiCounts[normalizedAmbiti] = (ambitiCounts[normalizedAmbiti] || 0) + 1;
        }
    });
    
    const sortedAmbiti = Object.entries(ambitiCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);
    
    const labels = sortedAmbiti.map(([label]) => {
        return label.length > 25 ? label.substring(0, 22) + '...' : label;
    });
    const data = sortedAmbiti.map(([,count]) => count);
    const fullLabels = sortedAmbiti.map(([fullLabel]) => fullLabel);
    
    const colors = Array(data.length).fill('#F97316');
    createRankingList(canvasId, labels, data, colors, 'ambiti', fullLabels);
}


// Sostituisce la funzione createChart esistente
function createChart(labels, data, colors, type, fullLabels = null) {
    return createModernChart(labels, data, colors, type, fullLabels);
}

function applyProponenteFilter(selectedProponente) {
    proponenteFilter = selectedProponente;
    applyFilters();
}

// CSS aggiuntivo per migliorare l'aspetto del grafico
function addModernChartStyles() {
    if (document.getElementById('modernChartStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'modernChartStyles';
    style.textContent = `
.chart-container {
    padding: 4px 2px 0 2px; /* TOP ridotto, BOTTOM ridotto */
    position: relative;
    overflow: hidden;
    flex: 1;
    height: 300px;
    width: 100%;
    margin: 0; /* AGGIUNGI */
    line-height: 1; /* FORZA line-height zero */
}

.chart-section {
    display: flex;
    flex-direction: column;
    gap: 4px; /* RIDOTTO da 8px */
    padding: 2px 0; /* RIDOTTO da 16px - TOP/BOTTOM a 0 */
    max-height: none;
    overflow: visible;
    margin: 0; /* AGGIUNGI QUESTA RIGA */
}

        
.chart-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0px; /* RIDOTTO da 4px */
    display: none; /* NASCONDI */
}
        
#statusChart {
    transition: filter 0.3s ease;
    width: 100% !important;
    height: 300px !important;
    max-width: none !important; /* FORZA larghezza massima */
}
.stats-container {
    grid-template-columns: 1fr 2fr;
    gap: var(--space-3); /* RIDOTTO da space-6 */
    /*  max-height: 120px;LIMITA altezza statistiche */
}

.legend-card,
.stats-card {
    padding: var(--space-3); /* RIDOTTO da space-6 */
}

.stats-grid {
    grid-template-columns: repeat(3, 1fr); /* FORZA 3 colonne */
    gap: var(--space-2);
}
.sidebar {
    padding: var(--space-4); /* RIDOTTO da space-6 */
}

.sidebar-content {
    gap: var(--space-2); /* RIDOTTO */
}

.filter-card {
    margin-bottom: var(--space-2); /* RIDOTTO da space-4 */
}

.filter-card-body {
    padding: var(--space-3); /* RIDOTTO da space-5 */
}
.chart-header {
    margin-bottom: 8px; /* RIDOTTO da 20px */
    align-items: center;
    gap: 8px; /* RIDOTTO da 12px */
}
        
.chart-title-enhanced {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem; /* RIDOTTO da 0.75rem */
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    padding: 0;
    line-height: 1;
}
        
        .chart-selector-enhanced select {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .chart-selector-enhanced select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            outline: none;
        }
        
        .chart-info {
            margin-top: 16px;
            padding: 12px;
            background: rgba(59, 130, 246, 0.05);
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
			display: none;
        }
        
		
		
       @media (max-width: 768px) {
   .chart-container {
        padding: 4px;
        margin: 0 -8px; /* ESTENDE oltre i bordi */
        width: calc(100% + 16px);
        border-radius: 8px;
    }
	    .chart-section {
        height: 60vh; /* ALTEZZA FISSA MOBILE */
    }
     .dashboard-main {
        grid-template-columns: 1fr;
        padding: var(--space-2);
        gap: var(--space-2);
    }
    .chart-header {
        flex-direction: column;
        align-items: stretch;
        gap: 4px; /* RIDOTTO da 8px */
    }
}
    `;
    document.head.appendChild(style);
	
	// Stile per highlight del side panel sulla mappa principale
    const sidePanelHighlightStyle = document.createElement('style');
    sidePanelHighlightStyle.id = 'sidePanelHighlightStyle';
    sidePanelHighlightStyle.textContent = `
        @keyframes side-panel-pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.7;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .side-panel-highlight-pulse {
            animation: side-panel-pulse 2s ease-in-out infinite !important;
        }
    `;
    document.head.appendChild(sidePanelHighlightStyle);
}


// ✨ STILI CORRETTI PER I GRAFICI
function addDualChartStyles() {
    if (document.getElementById('dualChartStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'dualChartStyles';
    style.textContent = `
        /* 🎨 Container principale per i grafici */
        .chart-section {
            display: flex;
            flex-direction: column;
            gap:8px;
           /* padding: 16px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);*/
            max-height: none; /* 🔧 RIMOSSO calc() che causava scroll */
            overflow: visible;
        }
        
        /* 🎨 Container per singolo grafico */
.chart-subsection {
    display: flex;
    flex-direction: column;
    gap: 0px; /* RIDOTTO da 2px */
    padding: 0; /* RIDOTTO da 2px */
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    min-height: 330px; /* RIDOTTO da 350px */
    margin: 0; /* AGGIUNGI QUESTA RIGA */
}
        
        /* 🎨 Canvas dei grafici - DIMENSIONI FISSE */
        #statusChart1, #statusChart2, #statusChart3 {
            transition: filter 0.3s ease;
            width: 100% !important;
            height: 280px !important;
            max-width: none !important;
            display: block;
        }
        
        /* 🎨 Header del grafico */
.chart-header-single {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0; /* RIDOTTO da 8px */
    padding: 2px 4px; /* RIDOTTO */
    gap: 4px;
    height: 20px; /* FISSO */
    overflow: hidden;
	display: none;
}
        
        .chart-title-enhanced {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #1e293b;
        }
        
        /* Info sotto il grafico */
 .chart-info {
    font-size: 0.65rem;
    color: #64748b;
    padding: 2px 4px; /* RIDOTTO da 8px */
    margin: 2px 0; /* RIDOTTO da auto */
    background: #f0f9ff;
    border-radius: 4px;
    border-left: 2px solid #3b82f6; /* RIDOTTO da 3px */
    line-height: 1.2;
}
        
        /* 🔧 MEDIA QUERIES */
        @media (max-width: 768px) {
            .chart-section {
                padding:2px;
                gap: 2px;
            }
            
            .chart-subsection {
                padding: 12px;
                min-height: 300px;
            }
            
          #statusChart1, #statusChart2, #statusChart3 {
    transition: filter 0.3s ease;
    width: 100% !important;
    height: 300px !important; /* RIDOTTO da 280px per compensare */
    max-width: none !important;
    display: block;
    padding: 0 !important; /* FORZA zero padding */
    margin: 0 !important; /* FORZA zero margin */
}
        }
    `;
    document.head.appendChild(style);
}


// ==========================================
// GESTIONE TABELLA
// ==========================================

function updateTable() {
    console.log('📊 updateTable() - START');
    console.log(`   filteredData.length = ${filteredData ? filteredData.length : 'undefined'}`);
    
    try {
        if (!filteredData || filteredData.length === 0) {
            console.log('📭 Nessun dato filtrato, svuota tabella');
            
            const tableCount = document.getElementById('tableCount');
            const tableHeader = document.getElementById('tableHeader');
            const tableBody = document.getElementById('tableBody');
            
            if (tableCount) tableCount.textContent = '0';
            if (tableHeader) tableHeader.innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
            if (tableBody) tableBody.innerHTML = '';
            
            console.log('✅ Tabella svuotata');
            return;
        }

        const excludedFields = [
            'foto', 'googlemaps', 'geouri', 'upl',
            'lat.', 'long.', 'lat', 'lng', 'coordinate',
            'quartiere', 'circoscrizione'
        ];
        
        const columnOrder = [
            'id',
            'titolo proposta', 
            'proponente',
            'rappresentante',
            'indirizzo',
            'stato di avanzamento',
            'nota per attività conclusive'
        ];
        
        const allKeys = Object.keys(filteredData[0]);
        console.log(`📋 Chiavi disponibili: ${allKeys.length}`, allKeys.slice(0, 5));
        
        const filteredKeys = allKeys.filter(key => {
            const keyLower = key.toLowerCase().trim();
            return !excludedFields.some(excluded => {
                const excludedLower = excluded.toLowerCase().trim();
                return keyLower === excludedLower || 
                       keyLower.includes(excludedLower) || 
                       excludedLower.includes(keyLower);
            });
        });
        
        console.log(`📋 Chiavi filtrate: ${filteredKeys.length}`, filteredKeys.slice(0, 5));
        
        const orderedKeys = [];
        
        columnOrder.forEach(orderKey => {
            const foundKey = filteredKeys.find(key => {
                const keyLower = key.toLowerCase().trim();
                const orderLower = orderKey.toLowerCase().trim();
                return keyLower === orderLower || 
                       keyLower.includes(orderLower) ||
                       orderLower.includes(keyLower);
            });
            if (foundKey && !orderedKeys.includes(foundKey)) {
                orderedKeys.push(foundKey);
            }
        });
        
        filteredKeys.forEach(key => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });

        console.log(`📋 Ordine finale: ${orderedKeys.length} colonne`);

        // === AGGIORNA CONTATORE ===
        const tableCount = document.getElementById('tableCount');
        if (tableCount) {
            tableCount.textContent = filteredData.length;
            console.log(`✅ Contatore aggiornato: ${filteredData.length}`);
        }

        // === AGGIORNA HEADER ===
        const tableHeader = document.getElementById('tableHeader');
        if (tableHeader) {
            tableHeader.innerHTML = '';
            
            orderedKeys.forEach(key => {
                const th = document.createElement('th');
                th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
                th.textContent = key;
                tableHeader.appendChild(th);
            });

            const actionTh = document.createElement('th');
            actionTh.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            actionTh.textContent = 'Azioni';
            tableHeader.appendChild(actionTh);
            
            console.log(`✅ Header creato con ${orderedKeys.length + 1} colonne`);
        }

        // === AGGIORNA BODY ===
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '';

            filteredData.forEach((item, index) => {
                try {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';

                    orderedKeys.forEach(key => {
                        const td = document.createElement('td');
                        td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
                        
                        let value = item[key] || 'N/A';
                        
                        // ✅ GESTIONE COLONNA STATO (con colori)
                        if (key.toLowerCase().includes('stato')) {
                            const color = statusColors[value] || '#6b7280';
                            td.innerHTML = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${value}</span>`;
                        } 
                        // ✅ GESTIONE COLONNA PDF (con link cliccabile e stile)
                        else if (key.toLowerCase().includes('scarica') && key.toLowerCase().includes('patto')) {
                            if (value && value.trim() !== '' && value !== 'N/A') {
                                const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
                                const pattoId = item[idKey] || 'XX';
                                const color = statusColors['Patto stipulato'] || '#8fd67d';
                                
                                td.innerHTML = `
                                    <a href="${value.trim()}" 
                                       download
                                       target="_blank"
                                       rel="noopener"
                                       title="Scarica il Patto di Collaborazione" 
                                       style="background-color: ${color}; 
                                              color: white; 
                                              padding: 4px 8px; 
                                              border-radius: 4px; 
                                              font-size: 10px;
                                              font-weight: 600;
                                              text-decoration: none;
                                              display: inline-flex;
                                              align-items: center;
                                              gap: 4px;
                                              transition: all 0.2s ease;"
                                       onmouseover="this.style.opacity='0.8'; this.style.transform='translateY(-1px)'"
                                       onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
                                        <i data-lucide="download" style="width: 12px; height: 12px;"></i>
                                        Patto nÂ° ${pattoId}
                                    </a>
                                `;
                            } else {
                                td.innerHTML = `<span style="color: #9ca3af; font-size: 10px;">Non disponibile</span>`;
                            }
                        }
                        // Gestione normale altri campi
                        else {
                            if (value.toString().length > 40) {
                                td.innerHTML = `<span title="${value}">${value.toString().substring(0, 37)}...</span>`;
                            } else {
                                td.textContent = value;
                            }
                        }
                        
                        row.appendChild(td);
                    });

                    // === AZIONI ===
                    const actionTd = document.createElement('td');
                    actionTd.className = 'px-3 py-2 whitespace-nowrap text-xs font-medium';
                    
                    const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
                    actionTd.innerHTML = `
                        <button onclick="showPattoDetails('${item[idKey]}')" 
                                class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition-colors">
                            <i data-lucide="eye" class="h-3 w-3 inline mr-1"></i>
                            Dettagli
                        </button>
                    `;
                    
                    row.appendChild(actionTd);
                    tableBody.appendChild(row);
                    
                } catch (rowError) {
                    console.warn(`⚠️ Errore nella riga ${index}:`, rowError);
                }
            });

            console.log(`✅ Body creato con ${filteredData.length} righe`);
        } else {
            console.error('❌ Elemento #tableBody non trovato');
        }
        
        console.log('✅ updateTable() COMPLETATO');
        
    } catch (error) {
        console.error('❌ ERRORE in updateTable():', error);
        throw error; // Re-throw per essere gestito dall'event listener
    }
}

// ==========================================
// AUTOCOMPLETAMENTO
// ==========================================

function setupAutocompleteEventListeners() {
    const input = document.getElementById('filterTitolo');
    const suggestions = document.getElementById('autocompleteSuggestions');
    
    if (!input || !suggestions) return;
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        currentSuggestionIndex = -1;
        
        updateFilterAppearance(this, this.value);
        
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }
        
        const filtered = autocompleteData.filter(item => 
            item.toLowerCase().includes(query)
        ).slice(0, 8);
        
        if (filtered.length === 0) {
            suggestions.classList.add('hidden');
            return;
        }
        
        suggestions.innerHTML = '';
        filtered.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-suggestion';
            div.textContent = item;
            div.addEventListener('click', () => {
                input.value = item;
                suggestions.classList.add('hidden');
                updateFilterAppearance(input, input.value);
                applyFilters();
            });
            suggestions.appendChild(div);
        });
        
        suggestions.classList.remove('hidden');
    });
    
    input.addEventListener('keydown', function(e) {
        const suggestionItems = suggestions.querySelectorAll('.autocomplete-suggestion');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
            updateSuggestionHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
            updateSuggestionHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentSuggestionIndex >= 0) {
                suggestionItems[currentSuggestionIndex].click();
            } else {
                applyFilters();
                suggestions.classList.add('hidden');
            }
        } else if (e.key === 'Escape') {
            suggestions.classList.add('hidden');
            currentSuggestionIndex = -1;
        }
    });
    
    function updateSuggestionHighlight() {
        const suggestionItems = suggestions.querySelectorAll('.autocomplete-suggestion');
        suggestionItems.forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
}

// ==========================================
// SETUP EVENT LISTENERS MIGLIORATO
// ==========================================

function setupEventListeners() {
    console.log('🔧 Configurazione event listeners...');
    
    let successCount = 0;
    let totalAttempts = 0;
    
    // === MOBILE TOGGLE ===
    totalAttempts++;
    const mobileToggle = document.getElementById('mobileFiltersToggle');
    const filtersContent = document.getElementById('filtersContent');
    
    if (mobileToggle && filtersContent) {
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = filtersContent.classList.contains('open');
            
            if (isOpen) {
                filtersContent.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            } else {
                filtersContent.classList.add('open');
                mobileToggle.setAttribute('aria-expanded', 'true');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!mobileToggle.contains(e.target) && !filtersContent.contains(e.target)) {
                if (filtersContent.classList.contains('open')) {
                    filtersContent.classList.remove('open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && filtersContent.classList.contains('open')) {
                filtersContent.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        successCount++;
    }
    
    // === FILTRI CON LOGICA CASCATA + AGGIORNAMENTO GRAFICI ===
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterAmbiti'];

    filterIds.forEach(id => {
        totalAttempts++;
        const element = document.getElementById(id);
        
        if (element) {
            element.addEventListener('change', function() {
                console.log(`🔄 Filtro ${id} cambiato a: "${this.value}"`);
                
                // ✅ Reset stato grafico quando cambi manualmente filtri
                if (window.chartFilterState.activeChartType !== null) {
                    console.log(`🔄 Reset stato grafico perché filtro manuale`);
                    window.chartFilterState.activeChartType = null;
                    window.chartFilterState.activeChartValue = null;
                }
                
                // 🔥 Applica i filtri (che a sua volta chiama updateAllChartsSynchronized)
                applyFilters();
                
                // Aggiorna i dropdown in cascata
                setTimeout(() => {
                    console.log('🔄 Aggiornamento cascata filtri...');
                    updateFilters();
                }, 100);
            });
            
            successCount++;
        }
    });

    // === MODAL INFO ===
    totalAttempts++;
    if (safeAddEventListener('infoBtn', 'click', function() {
        console.log('ℹ️ Apertura modal info...');
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }, 'Pulsante info')) {
        successCount++;
    }
    
    totalAttempts++;
    if (safeAddEventListener('closeInfoModal', 'click', function() {
        console.log('ℹ️ Chiusura modal info...');
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }, 'Chiusura modal info')) {
        successCount++;
    }
    
    const infoModal = document.getElementById('infoModal');
    if (infoModal) {
        infoModal.addEventListener('click', function(e) {
            if (e.target === infoModal) {
                const closeBtn = document.getElementById('closeInfoModal');
                if (closeBtn) closeBtn.click();
            }
        });
    }

    // === FILTRO AMBITI ===
    totalAttempts++;
    if (safeAddEventListener('filterAmbiti', 'change', function() {
        console.log(`Filtro Ambiti cambiato a: "${this.value}"`);
        
        if (typeof window.applyFiltersUnified === 'function') {
            window.applyFiltersUnified();
        } else {
            applyFilters();
        }
        
        setTimeout(() => {
            updateFilters();
        }, 100);
    }, 'Filtro Ambiti di azione')) {
        successCount++;
    }

    // === RESET FILTRI ===
    totalAttempts++;
    if (safeAddEventListener('clearFilters', 'click', function() {
        console.log('🔄 Reset filtri richiesto');
        resetAllFiltersAndCharts();
    }, 'Reset filtri')) {
        successCount++;
    }
    
    // Controlli mappa gestiti da map-controls_layer.js
    
    // === MOSTRA TABELLA - VERSIONE DEBUGGED ===
    totalAttempts++;
    console.log('🔍 Ricerca elemento #showTableBtn...');
    const showTableBtn = document.getElementById('showTableBtn');
    
    if (showTableBtn) {
        console.log('✅ Elemento #showTableBtn trovato, aggiunta event listener');
        
        showTableBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📋 CLICK su showTableBtn rilevato');
            console.log('📊 Aggiornamento tabella...');
            
            try {
                updateTable();
                console.log('✅ updateTable() completato senza errori');
            } catch (error) {
                console.error('❌ Errore in updateTable():', error);
                showNotification('⚠️ Errore nell\'aggiornamento della tabella', 'error');
                return;
            }
            
            const modal = document.getElementById('tableModal');
            console.log('🔍 Ricerca modale #tableModal...');
            
            if (!modal) {
                console.error('❌ Modale #tableModal NON TROVATO nel DOM');
                console.log('📄 Elementimodali disponibili:', Array.from(document.querySelectorAll('[id*="modal"]')).map(el => el.id));
                showNotification('❌ Errore: Modale tabella non trovato', 'error');
                return;
            }
            
            console.log('✅ Modale #tableModal trovato');
            console.log('📊 Classi prima:', modal.className);
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            console.log('📊 Classi dopo:', modal.className);
            console.log('✅ Modale tabella aperta');
            
            // Debug: Verifica che il modale sia effettivamente visibile
            setTimeout(() => {
                const isVisible = modal.offsetHeight > 0;
                console.log(`👁️ Modale visibile: ${isVisible}`);
            }, 100);
        });
        
        successCount++;
    } else {
        console.error('❌ Elemento #showTableBtn NON TROVATO nel DOM');
        console.log('🔍 Elementi disponibili con ID:', Array.from(document.querySelectorAll('[id]')).slice(0, 20).map(el => el.id));
    }
    
    // === CHIUDI TABELLA - VERSIONE DEBUGGED ===
    totalAttempts++;
    console.log('🔍 Ricerca elemento #closeTableModal...');
    const closeTableBtn = document.getElementById('closeTableModal');
    
    if (closeTableBtn) {
        console.log('✅ Elemento #closeTableModal trovato, aggiunta event listener');
        
        closeTableBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📋 CLICK su closeTableModal rilevato');
            
            const modal = document.getElementById('tableModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                console.log('✅ Modale tabella chiusa');
            } else {
                console.warn('⚠️ Modale #tableModal non trovato al momento della chiusura');
            }
        });
        
        successCount++;
    } else {
        console.error('❌ Elemento #closeTableModal NON TROVATO nel DOM');
    }
    
    // === CHIUDI CLICCANDO FUORI ===
    totalAttempts++;
    const tableModal = document.getElementById('tableModal');
    if (tableModal) {
        tableModal.addEventListener('click', function(e) {
            if (e.target === tableModal) {
                console.log('🖱️ Click su backdrop, chiusura modale');
                const closeBtn = document.getElementById('closeTableModal');
                if (closeBtn) closeBtn.click();
            }
        });
        successCount++;
    }
    
    // === MODALE DETTAGLI PATTO ===
    totalAttempts++;
    if (safeAddEventListener('closeModal', 'click', function() {
        console.log('📄 Chiusura modal dettagli patto');
        const modal = document.getElementById('pattoModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        if (miniMap) {
            try {
                miniMap.remove();
            } catch (e) {}
            miniMap = null;
        }
        
        // 🔧 CORREZIONE: Pulire COMPLETAMENTE il container nel modal close
        const miniMapContainer = document.getElementById('miniMap');
        if (miniMapContainer) {
            miniMapContainer.innerHTML = '';
            miniMapContainer.textContent = '';
            miniMapContainer.style.cssText = '';
            miniMapContainer.className = '';
            
            // Rimuovere tutti gli attributi
            while (miniMapContainer.attributes.length > 0) {
                miniMapContainer.removeAttribute(miniMapContainer.attributes[0].name);
            }
            
            // Reimpostare l'ID
            miniMapContainer.id = 'miniMap';
        }
    }, 'Chiudi modal dettagli')) {
        successCount++;
    }
    
    const pattoModal = document.getElementById('pattoModal');
    if (pattoModal) {
        pattoModal.addEventListener('click', function(e) {
            if (e.target === pattoModal) {
                const closeBtn = document.getElementById('closeModal');
                if (closeBtn) closeBtn.click();
            }
        });
    }
    
    // === SETUP ALTRI COMPONENTI ===
    setupFiltersPopupEventListeners();
    setupAutocompleteEventListeners();
    
    // === REPORT FINALE ===
    console.log(`✅ Event listeners configurati: ${successCount}/${totalAttempts}`);
    console.log(`⚠️ Missing: ${totalAttempts - successCount}`);
    
    return {
        success: successCount,
        total: totalAttempts,
        missing: totalAttempts - successCount
    };
}

// ==========================================
// FUNZIONI COLLASSABILI E UTILITÀ
// ==========================================

function setupCollapsibleFilters() {
    const filterGroups = document.querySelectorAll('.filter-group');
    
    filterGroups.forEach(group => {
        const header = group.querySelector('.filter-group-header');
        const content = group.querySelector('.filter-group-content');
        const formElement = content ? content.querySelector('select, input') : null;
        
        if (header && content && formElement) {
            updateFilterGroupState(group, formElement);
            
            header.addEventListener('click', function(e) {
                if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || 
                    e.target.closest('select') || e.target.closest('input')) {
                    return;
                }
                
                group.classList.toggle('collapsed');
                
                if (!group.classList.contains('collapsed')) {
                    setTimeout(() => {
                        formElement.focus();
                    }, 300);
                }
            });
            
            if (formElement) {
                formElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                formElement.addEventListener('change', function() {
                    updateFilterGroupState(group, this);
                });
                
                formElement.addEventListener('input', function() {
                    updateFilterGroupState(group, this);
                });
            }
        }
    });
    
    document.querySelectorAll('.filter-select, .filter-input').forEach(element => {
        element.addEventListener('focus', function() {
            const group = this.closest('.filter-group');
            if (group && group.classList.contains('collapsed')) {
                group.classList.remove('collapsed');
            }
        });
    });
}

function updateFilterGroupState(group, formElement) {
    const hasValue = formElement.value !== '' && formElement.value !== null;
    
    if (hasValue) {
        group.classList.add('has-value');
        
        if (formElement.tagName === 'SELECT') {
            let badge = group.querySelector('.filter-value-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-value-badge';
                badge.style.cssText = 'margin-left: auto; font-size: 0.75rem; background: var(--color-accent); color: white; padding: 2px 6px; border-radius: 10px; margin-left: 8px;';
                const title = group.querySelector('.filter-group-title');
                if (title) title.appendChild(badge);
            }
            const selectedOption = formElement.options[formElement.selectedIndex];
            if (selectedOption) {
                badge.textContent = selectedOption.text.length > 15 
                    ? selectedOption.text.substring(0, 12) + '...' 
                    : selectedOption.text;
            }
        }
    } else {
        group.classList.remove('has-value');
        
        const badge = group.querySelector('.filter-value-badge');
        if (badge) {
            badge.remove();
        }
    }
}

function donutPolar(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(cx, cy, rO, rI, a1, a2) {
    const s  = donutPolar(cx, cy, rO, a1);
    const e  = donutPolar(cx, cy, rO, a2);
    const si = donutPolar(cx, cy, rI, a2);
    const ei = donutPolar(cx, cy, rI, a1);
    const lg = (a2 - a1) > 180 ? 1 : 0;
    const f  = v => v.toFixed(3);
    return `M${f(s.x)},${f(s.y)} A${rO},${rO} 0 ${lg} 1 ${f(e.x)},${f(e.y)} L${f(si.x)},${f(si.y)} A${rI},${rI} 0 ${lg} 0 ${f(ei.x)},${f(ei.y)} Z`;
}

window.handleDonutClick = function(el) {
    const stato = el.dataset.stato;
    if (window.chartFilterState.activeChartType === 'stato' &&
        window.chartFilterState.activeChartValue === stato) {
        resetAllFiltersAndCharts();
    } else {
        window.chartFilterState.activeChartType = 'stato';
        window.chartFilterState.activeChartValue = stato;
        applyChartFilter('stato', stato);
    }
};

function updateDonutChart() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    if (!statoKey) return;

    const counts = {};
    filteredData.forEach(item => {
        const v = (item[statoKey] || '').trim();
        if (v && v.toLowerCase() !== 'undefined' && v.toLowerCase() !== 'null') {
            counts[v] = (counts[v] || 0) + 1;
        }
    });

    const entries = Object.entries(counts).sort(([,a],[,b]) => b - a);
    const total = entries.reduce((s,[,v]) => s + v, 0);

    const donutTotalEl = document.getElementById('donutTotal');
    if (donutTotalEl) donutTotalEl.textContent = total;

    const svg = document.getElementById('donutSVG');
    if (!svg) return;

    if (total === 0) {
        svg.innerHTML = `<circle cx="100" cy="100" r="72" fill="none" stroke="#e2e8f0" stroke-width="28"/>`;
        return;
    }

    const cx = 100, cy = 100, rO = 86, rI = 58, gap = 1.5;
    const activeStato = window.chartFilterState.activeChartType === 'stato'
        ? window.chartFilterState.activeChartValue : null;
    let angle = 0;

    svg.innerHTML = entries.map(([stato, count]) => {
        const sweep = (count / total) * 360;
        const a1 = angle + gap / 2;
        const a2 = angle + sweep - gap / 2;
        angle += sweep;
        if (sweep < 0.5) return '';

        const color = modernChartColors.status[stato] ||
            (stato.startsWith('Proroga') ? modernChartColors.status[Object.keys(modernChartColors.status).find(k => k.startsWith('Proroga'))] : '#94a3b8');
        const display = stato.startsWith('Proroga e/o Monitoraggio') ? 'Proroga/Monitoraggio' : stato;
        const pct = ((count / total) * 100).toFixed(1);
        const dim = activeStato && activeStato !== stato;
        const safe = stato.replace(/"/g, '&quot;');

        return `<path d="${donutArcPath(cx, cy, rO, rI, a1, a2)}"
                     fill="${color}"
                     opacity="${dim ? '0.3' : '1'}"
                     stroke="white" stroke-width="1.5"
                     data-stato="${safe}"
                     onclick="handleDonutClick(this)"
                     style="cursor:pointer;transition:opacity .2s">
                  <title>${display}: ${count} (${pct}%)</title>
                </path>`;
    }).join('');
}

function updateLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;

    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    const counts = {};
    filteredData.forEach(item => {
        const stato = (item[statoKey] || '').trim();
        if (stato && stato.toLowerCase() !== 'undefined' && stato.toLowerCase() !== 'null') {
            counts[stato] = (counts[stato] || 0) + 1;
        }
    });

    // Includi tutti gli stati possibili (anche con 0)
    Object.keys(modernChartColors.status).forEach(k => { if (counts[k] === undefined) counts[k] = 0; });

    const activeFilter = window.chartFilterState.activeChartType === 'stato'
        ? window.chartFilterState.activeChartValue : null;

    const sorted = Object.entries(counts).sort(([,a],[,b]) => b - a);

    legend.innerHTML = sorted.map(([stato, count]) => {
        const color = modernChartColors.status[stato] ||
            (stato.startsWith('Proroga') ? modernChartColors.status['Proroga e/o Monitoraggio e valutazione dei risultati'] : '#94a3b8');
        const displayLabel = stato.startsWith('Proroga e/o Monitoraggio') ? 'Proroga/Monitoraggio' : stato;
        const isActive = activeFilter === stato;
        const safeStato = stato.replace(/"/g, '&quot;');
        return `<button class="legend-filter-btn${isActive ? ' active' : ''}"
                        data-stato="${safeStato}"
                        onclick="handleLegendFilterClick(this)"
                        title="Filtra: ${safeStato}">
            <span class="legend-dot" style="background:${color}"></span>
            <span class="legend-name">${displayLabel}</span>
            <span class="legend-count">${count}</span>
        </button>`;
    }).join('');
}

window.handleLegendFilterClick = function(btn) {
    const stato = btn.dataset.stato;
    if (window.chartFilterState.activeChartType === 'stato' &&
        window.chartFilterState.activeChartValue === stato) {
        resetAllFiltersAndCharts();
    } else {
        window.chartFilterState.activeChartType = 'stato';
        window.chartFilterState.activeChartValue = stato;
        applyChartFilter('stato', stato);
    }
};

// Funzione per chiudere popup dalla mappa - esposta globalmente
window.closeMainMapPopup = function() {
    if (map && typeof map.closePopup === 'function') {
        try {
            map.closePopup();
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
};

function updateLastUpdate() {
    const now = new Date();
    const formatted = now.toLocaleString('it-IT');
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) lastUpdate.textContent = formatted;
}

function handleViewportResize() {
    window.addEventListener('resize', function() {
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
        
        if (chart) {
            setTimeout(() => {
                chart.resize();
            }, 100);
        }
    });
}

function setupAutoUpdate() {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 14 && now.getMinutes() === 45) {
            loadData();
        }
    }, 60000);
}

// ==========================================
// NOTIFICHE RIDOTTE
// ==========================================

function showNotification(message, type = 'info') {
    // Mostra errori, warning e info importanti
    if (type !== 'error' && type !== 'warning' && type !== 'info') {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-[11000] fade-in text-sm ${
        type === 'error' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Funzione globale per mostrare dettagli (chiamata dai popup)
// window.showPattoDetails = showPattoDetails;

// CSS aggiuntivo per il marker centro
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .center-palermo-marker .center-marker-icon {
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border: 2px solid #3B82F6;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .center-palermo-marker:hover .center-marker-icon {
            transform: scale(1.2);
            background: #3B82F6;
        }
        
        .autocomplete-suggestion {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .autocomplete-suggestion:hover,
        .autocomplete-suggestion.highlighted {
            background-color: #f3f4f6;
        }
        
        .filter-tag {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            margin: 2px;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// MODAL FULLSCREEN CON TAB SYSTEM
// ==========================================

function initializeFullscreenModal() {
    console.log('Inizializzazione modal fullscreen con tab...');
    
    const modal = document.getElementById('infoModal');
    const openBtn = document.getElementById('infoBtn');
    const closeBtn = document.getElementById('closeInfoModal');
    const tabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.modal-tab-content');
    const backToTop = document.getElementById('backToTop');
    const modalBody = document.querySelector('.modal-fullscreen-body');
    
    if (!modal || !openBtn || !closeBtn) {
        console.warn('Elementi modal fullscreen non trovati');
        return;
    }
    
    // Apri modal
    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Apertura modal fullscreen...');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Aggiorna statistiche nel tab About
        setTimeout(updateAboutStats, 500);
        
    });
    
    // Chiudi modal
    closeBtn.addEventListener('click', function() {
        console.log('Chiusura modal fullscreen...');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset scroll
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    });
    
    // Chiudi con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeBtn.click();
        }
    });
    
    // Chiudi cliccando fuori (sul backdrop)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeBtn.click();
        }
    });
    
    // Gestione Tab
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            console.log('Cambio tab:', targetTab);
            
            // Rimuovi classe active da tutti i tab
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Aggiungi classe active al tab cliccato
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Nascondi tutti i contenuti
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostra il contenuto del tab selezionato
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Scroll al top del contenuto
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }
                   
		});
    });
    
    // Back to Top functionality
    if (backToTop && modalBody) {
        modalBody.addEventListener('scroll', function() {
            if (this.scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', function() {
            modalBody.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    console.log('Modal fullscreen inizializzato con successo');
}


// ==========================================
// EFFETTO PULSE SUL PULSANTE INFO
// ==========================================

function initializePulseEffect() {
    console.log('Inizializzazione effetto pulse...');
    
    const infoBtn = document.getElementById('infoBtn');
    
    if (!infoBtn) {
        console.warn('Pulsante info non trovato per effetto pulse');
        return;
    }
    
    // Funzione per triggerare il pulse
    function triggerPulse() {
        infoBtn.classList.add('pulsing');
        
        // Rimuovi la classe dopo l'animazione (2s)
        setTimeout(() => {
            infoBtn.classList.remove('pulsing');
        }, 2000);
    }
    
    // Sequenza di pulse nei primi 10 secondi
    const pulseTimings = [
        1000,  // Primo pulse dopo 1s
        3500,  // Secondo pulse dopo 3.5s
        6000,  // Terzo pulse dopo 6s
        8500   // Quarto pulse dopo 8.5s
    ];
    
    pulseTimings.forEach(timing => {
        setTimeout(triggerPulse, timing);
    });
    
    // Pulse singolo quando la pagina torna visibile (se l'utente cambia tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(triggerPulse, 500);
        }
    });
    
    console.log('Effetto pulse configurato con successo');
}



// Inizializza il pulse quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aspetta che la pagina sia completamente caricata
    setTimeout(initializePulseEffect, 500);
});



// Funzione per aggiornare le statistiche nel tab About
function updateAboutStats() {
    const totalElement = document.getElementById('aboutStatTotal');
    if (totalElement && typeof filteredData !== 'undefined') {
        animateCounter(totalElement, filteredData.length);
    }
}

// Funzione helper per animare i contatori
function animateCounter(element, targetValue) {
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeFullscreenModal, 500);
});


// ==========================================
// MENÙ LINEARE PAGINE NELL'HEADER PRINCIPALE
// ==========================================

function initializePattoNav() {
    const navBtns = document.querySelectorAll('.header-patto-tab');
    const modal = document.getElementById('infoModal');
    const modalBody = document.querySelector('.modal-fullscreen-body');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.modal-tab-content');

    if (!modal || navBtns.length === 0) return;

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-patto-tab');

            // Apri modal
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Aggiorna tab nel modal
            modalTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => c.classList.remove('active'));

            const targetModalTab = document.querySelector(`.modal-tab[data-tab="${targetTab}"]`);
            if (targetModalTab) {
                targetModalTab.classList.add('active');
                targetModalTab.setAttribute('aria-selected', 'true');
            }

            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
                if (modalBody) modalBody.scrollTop = 0;
            }

            // Marca attivo nel nav header
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (targetTab === 'about') setTimeout(updateAboutStats, 500);
        });
    });

    // Rimuovi active dal nav header quando il modal si chiude
    const closeBtn = document.getElementById('closeInfoModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            navBtns.forEach(b => b.classList.remove('active'));
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializePattoNav, 600);
});


console.log('Dashboard Monitoraggio Patti - Versione Completa con Grafici Moderni caricata');

