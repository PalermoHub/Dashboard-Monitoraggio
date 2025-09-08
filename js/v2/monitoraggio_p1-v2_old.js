// ==========================================
// DASHBOARD MONITORAGGIO PATTI - VERSIONE MIGLIORATA
// ==========================================

// Variabili globali
let map;
let miniMap;
let markersLayer;
let allData = [];
let filteredData = [];
let chart;
let currentMapLayer = 'standard';
let autocompleteData = [];
let currentSuggestionIndex = -1;

// NUOVE VARIABILI PER GRAFICI MULTIPLI
let currentChartType = 'stato'; // 'stato' o 'proponente'
let proponenteFilter = ''; // Filtro nascosto per proponente

// Coordinate precise di Palermo
const PALERMO_CENTER = [38.1157, 13.3615]; // Centro storico di Palermo
const PALERMO_BOUNDS = [
    [38.0500, 13.2500], // Sud-Ovest (include area metropolitana)
    [38.3000, 13.4200]  // Nord-Est (include Sferracavallo e Bagheria)
];

// Colori per stato di avanzamento
const statusColors = {
    'Istruttoria in corso': '#ffdb4d',
    'Respinta': '#ff6b6b',
    'Patto stipulato': '#8fd67d',
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
    'In attesa di integrazione': '#b3e6ff'
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
    const titolo = document.getElementById('filterTitolo')?.value?.trim() || '';
    
    if (stato) filters['Stato'] = stato;
    if (upl) filters['UPL'] = upl;
    if (quartiere) filters['Quartiere'] = quartiere;
    if (circoscrizione) filters['Circoscrizione'] = circoscrizione;
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

// NUOVA FUNZIONE: Chiudi popup senza resettare filtri
function closeFiltersPopupOnly() {
    console.log('Chiusura popup filtri senza reset');
    hideFiltersPopup();
}

// FUNZIONE SEPARATA: Reset filtri dal popup
function resetFiltersFromPopup() {
    console.log('Reset filtri dal popup');
    
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            updateFilterAppearance(element, '');
        }
    });
    
    proponenteFilter = '';
    
    const suggestions = document.getElementById('autocompleteSuggestions');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    
    filteredData = [...allData];
    
    updateFilters();
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    
    hideFiltersPopup();
    // Rimuovo la notifica di conferma per ridurre il rumore
}

function setupFiltersPopupEventListeners() {
    // Pulsante reset (mantiene funzionalità originale)
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFiltersFromPopup);
        console.log('Event listener popup reset configurato');
    }
    
    // NUOVO: Pulsante chiudi senza reset
    const closeButton = document.getElementById('filtersPopupClose');
    if (closeButton) {
        closeButton.addEventListener('click', closeFiltersPopupOnly);
        console.log('Event listener popup close configurato');
    }
    
    // Mantieni gestione ESC ma ora chiude senza resettare
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
    
    // Aggiungi pulsante chiudi se non esiste
    addCloseButtonToFiltersPopup();
    
    setupFiltersPopupEventListeners();
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }
    
    console.log('Popup filtri inizializzato');
}

// NUOVA FUNZIONE: Aggiunge pulsante di chiusura al popup
function addCloseButtonToFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    // Verifica se il pulsante esiste già
    if (document.getElementById('filtersPopupClose')) return;
    
    // Crea il pulsante di chiusura
    const closeButton = document.createElement('button');
    closeButton.id = 'filtersPopupClose';
    closeButton.className = 'filters-popup-close';
    closeButton.title = 'Chiudi popup filtri';
    closeButton.setAttribute('aria-label', 'Chiudi popup filtri');
    closeButton.innerHTML = '<i data-lucide="x" class="h-3 w-3" aria-hidden="true"></i>';
    
    // Inserisci il pulsante prima del pulsante reset
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        popup.insertBefore(closeButton, resetButton);
    } else {
        popup.appendChild(closeButton);
    }
    
    // Aggiorna gli stili CSS
    addFiltersPopupStyles();
}

// NUOVA FUNZIONE: Aggiunge stili per il pulsante di chiusura
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
        
        .filters-popup {
            display: flex;
            align-items: center;
            gap: 12px;
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
// CONTROLLI MAPPA MIGLIORATI (senza notifiche eccessive)
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

function switchMapLayer(layerType) {
    console.log(`Cambiando layer mappa a: ${layerType}`);
    
    if (!map) {
        console.error('Mappa non inizializzata per cambio layer');
        return;
    }
    
    try {
        currentMapLayer = layerType;
        updateLayerButtons(layerType);
        
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                console.log('Rimozione layer:', layer);
                map.removeLayer(layer);
            }
        });
        
        let newTileLayer;
        
        if (layerType === 'satellite') {
            newTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Satellite - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
                maxZoom: 18,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            });
        } else {
            newTileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
                maxZoom: 18
            });
        }
        
        newTileLayer.addTo(map);
        console.log(`Layer ${layerType} applicato`);
        
    } catch (error) {
        console.error('Errore nel cambio layer:', error);
        showNotification('Errore nel cambio mappa', 'error');
        
        if (layerType !== 'standard') {
            console.log('Fallback a layer standard...');
            switchMapLayer('standard');
        }
    }
}

function updateLayerButtons(activeLayer) {
    console.log(`Aggiornando UI pulsanti per layer: ${activeLayer}`);
    
    const standardBtn = document.getElementById('mapStandard');
    const satelliteBtn = document.getElementById('mapSatellite');
    
    if (!standardBtn || !satelliteBtn) {
        console.warn('Pulsanti layer non trovati nel DOM');
        return;
    }
    
    const activeClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white font-semibold';
    const inactiveClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    if (activeLayer === 'standard') {
        standardBtn.className = activeClasses;
        satelliteBtn.className = inactiveClasses;
    } else {
        standardBtn.className = inactiveClasses;
        satelliteBtn.className = activeClasses;
    }
}

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM caricato, inizializzazione...');
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    initializeMap();
    loadData();
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
            maxZoom: 18,
            minZoom: 11,
            zoomControl: true,
            preferCanvas: true,
            closePopupOnClick: true,
            doubleClickZoom: true,
            dragging: true,
            keyboard: true,
            scrollWheelZoom: true,
            touchZoom: true
        }).setView(PALERMO_CENTER, 12);
        
        const baseLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
            maxZoom: 18
        }).addTo(map);
        
        markersLayer = L.layerGroup().addTo(map);
        map.setMaxBounds(PALERMO_BOUNDS);
        
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
            .bindPopup('<b>Centro Storico di Palermo</b><br>Palazzo delle Aquile<br><small>Click per centrare qui</small>')
            .bindTooltip('Centro di Palermo', {permanent: false, direction: 'top'});
        
        centerMarker.on('click', function() {
            centerMapOnPalermo();
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
        filteredData = [...allData];
        
        setupAutocomplete();
        updateFilters();
        updateMap();
        updateStatistics();
        updateChart();
        updateLegend();
        updateLastUpdate();
        updateTable();
        
        hideFiltersPopup();
        
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
            console.log(`Valore "${currentValue}" non più valido per ${key}, resettato`);
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

function applyFilters() {
    const filters = {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
        titolo: document.getElementById('filterTitolo')?.value?.toLowerCase()?.trim() || '',
        proponente: proponenteFilter.trim()
    };
    
    console.log('Applicando filtri:', filters);
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const titoloMatch = !filters.titolo || (item[titoloKey] && item[titoloKey].toLowerCase().includes(filters.titolo));
        const proponenteMatch = !filters.proponente || (item[proponenteKey] && item[proponenteKey].trim() === filters.proponente);
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && titoloMatch && proponenteMatch;
    });
    
    console.log(`Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            updateFilterAppearance(element, element.value);
        }
    });
    
    const titoloField = document.getElementById('filterTitolo');
    if (titoloField) {
        updateFilterAppearance(titoloField, titoloField.value);
    }
    
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
        const uplKey = Object.keys(patto).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(patto).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(patto).find(k => k.toLowerCase().includes('circoscrizione'));
        const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
        
        const titolo = patto[titoloKey] || 'Titolo non disponibile';
        marker.bindTooltip(titolo, {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
        });
        
        const popupContent = `
            <div class="p-2 max-w-xs">
                <h3 class="font-semibold text-xs mb-2">${titolo}</h3>
                <div class="text-xs space-y-1">
                    <p><strong>UPL:</strong> ${patto[uplKey] || 'N/A'}</p>
                    <p><strong>Quartiere:</strong> ${patto[quartiereKey] || 'N/A'}</p>
                    <p><strong>Circoscrizione:</strong> ${patto[circoscrizioneKey] || 'N/A'}</p>
                    <p><strong>Stato:</strong> 
                        <span style="background-color: ${color}; color: white; padding: 1px 4px; border-radius: 3px; font-size: 9px;">
                            ${stato}
                        </span>
                    </p>
                </div>
                <button onclick="showPattoDetails('${patto[idKey]}')" class="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
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

function updateChartInterface() {
    const titleElement = document.getElementById('chartTitle');
    const helpElement = document.getElementById('chartHelp');
    const statsElement = document.getElementById('chartStats');
    
    if (titleElement) {
        if (currentChartType === 'stato') {
            titleElement.textContent = 'Richieste per stato di avanzamento';
        } else {
            titleElement.textContent = 'Richieste per proponente';
        }
    }
    
    if (statsElement) {
        const totalVisible = filteredData.length;
        const totalOverall = allData.length;
        statsElement.textContent = `Stai visualizzando ${totalVisible} di ${totalOverall} richieste`;
    }
}

function updateChart() {
    if (currentChartType === 'stato') {
        updateStatusChart();
    } else {
        updateProponenteChart();
    }
    updateChartInterface();
}

function updateStatusChart() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    const statusCounts = {};
    
    filteredData.forEach(item => {
        const status = item[statoKey] || 'Non specificato';
        if (status && 
            status.toString().trim() !== '' && 
            status.toString().trim().toLowerCase() !== 'undefined' &&
            status.toString().trim().toLowerCase() !== 'null' &&
            status.toString().trim() !== 'N/A') {
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
            return 'Proroga e/o Monitoraggio';
        }
        return label;
    });
    const data = Object.values(validStatusCounts);
    const colors = labels.map(label => statusColors[label] || '#6b7280');
    
    createChart(labels, data, colors, 'stato');
}

function updateProponenteChart() {
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
    const colors = generateProponenteColors(data.length);
    
    createChart(labels, data, colors, 'proponente', sortedProponenti.map(([fullLabel]) => fullLabel));
}

function generateProponenteColors(count) {
    const baseColors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
        '#14B8A6', '#F43F5E', '#8E9AAF', '#22C55E', '#A855F7'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
            colors.push(baseColors[i]);
        } else {
            const hue = (i * 137.508) % 360;
            colors.push(`hsl(${hue}, 65%, 50%)`);
        }
    }
    return colors;
}

function createChart(labels, data, colors, type, fullLabels = null) {
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('statusChart');
    if (!ctx) {
        console.warn('Canvas statusChart non trovato');
        return;
    }
    
    chart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverBackgroundColor: colors.map(color => color + 'CC')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            if (type === 'proponente' && fullLabels) {
                                return fullLabels[context[0].dataIndex];
                            }
                            return context[0].label;
                        },
                        label: function(context) {
                            const label = type === 'stato' ? 'Numero di patti' : 'Numero di richieste';
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: type === 'proponente' ? 45 : 45,
                        font: {
                            size: type === 'proponente' ? 8 : 9
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 9
                        },
                        stepSize: 1
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    
                    if (type === 'stato') {
                        const selectedStatus = labels[index];
                        const statusSelect = document.getElementById('filterStato');
                        if (statusSelect) {
                            statusSelect.value = selectedStatus;
                            applyFilters();
                        }
                    } else {
                        const selectedProponente = fullLabels ? fullLabels[index] : labels[index];
                        applyProponenteFilter(selectedProponente);
                    }
                }
            },
            onHover: (event, elements) => {
                const canvas = event.native.target;
                canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            }
        },
        plugins: [{
            id: 'dataLabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.save();
                
                chart.data.datasets.forEach(function(dataset, datasetIndex) {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    
                    meta.data.forEach(function(bar, index) {
                        const data = dataset.data[index];
                        
                        if (data > 0) {
                            ctx.fillStyle = '#374151';
                            ctx.font = 'bold 10px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            
                            const x = bar.x;
                            const y = bar.y - 6;
                            
                            ctx.fillText(data, x, y);
                        }
                    });
                });
                
                ctx.restore();
            }
        }]
    });
}

function applyProponenteFilter(selectedProponente) {
    proponenteFilter = selectedProponente;
    applyFilters();
}

// ==========================================
// GESTIONE TABELLA
// ==========================================

function updateTable() {
    if (!filteredData || filteredData.length === 0) {
        const tableCount = document.getElementById('tableCount');
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        
        if (tableCount) tableCount.textContent = '0';
        if (tableHeader) tableHeader.innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
        if (tableBody) tableBody.innerHTML = '';
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
    
    const filteredKeys = allKeys.filter(key => {
        const keyLower = key.toLowerCase().trim();
        return !excludedFields.some(excluded => {
            const excludedLower = excluded.toLowerCase().trim();
            return keyLower === excludedLower || 
                   keyLower.includes(excludedLower) || 
                   excludedLower.includes(keyLower);
        });
    });
    
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

    const tableCount = document.getElementById('tableCount');
    if (tableCount) tableCount.textContent = filteredData.length;

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
    }

    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = '';

        filteredData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            orderedKeys.forEach(key => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
                
                let value = item[key] || 'N/A';
                
                if (key.toLowerCase().includes('stato')) {
                    const color = statusColors[value] || '#6b7280';
                    td.innerHTML = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${value}</span>`;
                } else {
                    if (value.toString().length > 40) {
                        td.innerHTML = `<span title="${value}">${value.toString().substring(0, 37)}...</span>`;
                    } else {
                        td.textContent = value;
                    }
                }
                
                row.appendChild(td);
            });

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
        });

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

// ==========================================
// DETTAGLI PATTO
// ==========================================

function showPattoDetails(pattoId) {
    const idKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase() === 'id');
    const patto = allData.find(p => p[idKey] === pattoId);
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
        note: Object.keys(patto).find(k => k.toLowerCase().includes('nota')),
        googlemaps: Object.keys(patto).find(k => k.toLowerCase().includes('googlemaps')),
        geouri: Object.keys(patto).find(k => k.toLowerCase().includes('geouri')),
        foto: Object.keys(patto).find(k => k.toLowerCase().includes('foto'))
    };
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = patto[keys.titolo] || 'Patto senza titolo';
    
    const details = document.getElementById('pattoDetails');
    if (details) {
        details.innerHTML = `
            <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
            <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
            <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
            <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
            <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
            <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
        `;
    }
    
    const status = document.getElementById('pattoStatus');
    const statoText = patto[keys.stato] || 'Non specificato';
    if (status) {
        status.textContent = statoText;
        status.style.backgroundColor = statusColors[statoText] || '#6b7280';
    }
    
    const notesContainer = document.getElementById('pattoNotesContainer');
    const notes = document.getElementById('pattoNotes');
    if (keys.note && patto[keys.note] && notesContainer && notes) {
        notesContainer.classList.remove('hidden');
        notes.textContent = patto[keys.note];
    } else if (notesContainer) {
        notesContainer.classList.add('hidden');
    }
    
    const links = document.getElementById('pattoLinks');
    if (links) {
        links.innerHTML = '';
        
        if (keys.googlemaps && patto[keys.googlemaps]) {
            const link = document.createElement('a');
            link.href = patto[keys.googlemaps].trim();
            link.target = '_blank';
            link.className = 'inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors';
            link.innerHTML = `
                <i data-lucide="map" class="h-4 w-4"></i>
                <span>Google Maps</span>
                <i data-lucide="external-link" class="h-3 w-3"></i>
            `;
            links.appendChild(link);
        }
        
        if (keys.geouri && patto[keys.geouri]) {
            const link = document.createElement('a');
            link.href = patto[keys.geouri];
            link.className = 'inline-flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors';
            link.innerHTML = `
                <i data-lucide="map-pin" class="h-4 w-4"></i>
                <span>Geo URI</span>
                <i data-lucide="external-link" class="h-3 w-3"></i>
            `;
            links.appendChild(link);
        }
    }
    
    const photoContainer = document.getElementById('photoContainer');
    const photo = document.getElementById('pattoPhoto');
    if (keys.foto && patto[keys.foto] && patto[keys.foto].trim() !== '' && photoContainer && photo) {
        photoContainer.classList.remove('hidden');
        const fotoUrl = patto[keys.foto].trim();
        
        photo.onload = function() {
            console.log('Immagine caricata:', fotoUrl);
        };
        
        photo.onerror = function() {
            console.error('Errore caricamento immagine:', fotoUrl);
            photoContainer.classList.add('hidden');
        };
        
        photo.src = fotoUrl;
        photo.alt = patto[keys.titolo] || 'Foto patto';
    } else if (photoContainer) {
        photoContainer.classList.add('hidden');
    }
    
    // Mini mappa
    setTimeout(() => {
        if (miniMap) {
            miniMap.remove();
        }
        
        const miniMapContainer = document.getElementById('miniMap');
        if (miniMapContainer) {
            miniMap = L.map('miniMap').setView([patto.lat, patto.lng], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(miniMap);
            
            const color = statusColors[statoText] || '#6b7280';
            L.circleMarker([patto.lat, patto.lng], {
                radius: 8,
                fillColor: color,
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(miniMap);
            
            setTimeout(() => {
                miniMap.invalidateSize();
            }, 100);
        }
    }, 100);
    
    const modal = document.getElementById('pattoModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    map.setView([patto.lat, patto.lng], 16);
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
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
// SETUP EVENT LISTENERS MIGLIORATO (senza notifiche eccessive)
// ==========================================

function setupEventListeners() {
    console.log('Configurazione event listeners...');
    
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
    
    // === CHART TYPE SELECTOR ===
    totalAttempts++;
    if (safeAddEventListener('chartTypeSelector', 'change', function() {
        currentChartType = this.value;
        updateChart();
        updateChartInterface();
    }, 'Selettore tipo grafico')) {
        successCount++;
    }
    
    // === FILTRI CON LOGICA CASCATA ===
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'];
    
    filterIds.forEach(id => {
        totalAttempts++;
        const element = document.getElementById(id);
        
        if (element) {
            element.addEventListener('change', function() {
                console.log(`Filtro ${id} cambiato a: "${this.value}"`);
                
                if (typeof window.applyFiltersUnified === 'function') {
                    window.applyFiltersUnified();
                } else {
                    applyFilters();
                }
                
                setTimeout(() => {
                    updateFilters();
                }, 100);
            });
            
            successCount++;
        }
    });
    
    // === MODAL INFO ===
    totalAttempts++;
    if (safeAddEventListener('infoBtn', 'click', function() {
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
    
    // === RESET FILTRI ===
    totalAttempts++;
    if (safeAddEventListener('clearFilters', 'click', function() {
        console.log('Reset filtri richiesto');
        
        const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
                updateFilterAppearance(element, '');
            }
        });
        
        const suggestions = document.getElementById('autocompleteSuggestions');
        if (suggestions) {
            suggestions.classList.add('hidden');
        }
        
        proponenteFilter = '';
        filteredData = [...allData];
        
        updateFilters();
        updateMap();
        updateStatistics();
        updateChart();
        updateTable();
        hideFiltersPopup();
        
    }, 'Reset filtri')) {
        successCount++;
    }
    
    // === CONTROLLI MAPPA ===
    totalAttempts++;
    if (safeAddEventListener('centerPalermo', 'click', centerMapOnPalermo, 'Centra Palermo')) {
        successCount++;
    }
    
    totalAttempts++;
    if (safeAddEventListener('layerToggle', 'click', function(e) {
        e.stopPropagation();
        const menu = document.getElementById('layerMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }, 'Toggle layer menu')) {
        successCount++;
    }
    
    const layerMenu = document.getElementById('layerMenu');
    const layerToggle = document.getElementById('layerToggle');
    if (layerMenu && layerToggle) {
        document.addEventListener('click', function(e) {
            if (!layerMenu.contains(e.target) && !layerToggle.contains(e.target)) {
                layerMenu.classList.add('hidden');
            }
        });
    }
    
    totalAttempts++;
    if (safeAddEventListener('mapStandard', 'click', function() {
        switchMapLayer('standard');
        const menu = document.getElementById('layerMenu');
        if (menu) menu.classList.add('hidden');
    }, 'Mappa standard')) {
        successCount++;
    }
    
    totalAttempts++;
    if (safeAddEventListener('mapSatellite', 'click', function() {
        switchMapLayer('satellite');
        const menu = document.getElementById('layerMenu');
        if (menu) menu.classList.add('hidden');
    }, 'Mappa satellite')) {
        successCount++;
    }
    
    // === POPUP TABELLA ===
    totalAttempts++;
    if (safeAddEventListener('showTableBtn', 'click', function() {
        updateTable();
        
        const modal = document.getElementById('tableModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }, 'Mostra tabella')) {
        successCount++;
    }
    
    totalAttempts++;
    if (safeAddEventListener('closeTableModal', 'click', function() {
        const modal = document.getElementById('tableModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }, 'Chiudi tabella')) {
        successCount++;
    }
    
    const tableModal = document.getElementById('tableModal');
    if (tableModal) {
        tableModal.addEventListener('click', function(e) {
            if (e.target === tableModal) {
                const closeBtn = document.getElementById('closeTableModal');
                if (closeBtn) closeBtn.click();
            }
        });
    }
    
    // === MODALE DETTAGLI PATTO ===
    totalAttempts++;
    if (safeAddEventListener('closeModal', 'click', function() {
        const modal = document.getElementById('pattoModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        if (miniMap) {
            miniMap.remove();
            miniMap = null;
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
    
    // === REPORT FINALE (senza notifica eccessiva) ===
    console.log(`Event listeners configurati: ${successCount}/${totalAttempts}`);
    
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

function updateLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = '';
    
    Object.entries(statusColors).forEach(([status, color]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-1';
        div.innerHTML = `
            <div class="w-3 h-3 rounded-full border border-white shadow-sm" style="background-color: ${color}"></div>
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
// NOTIFICHE RIDOTTE (solo per errori reali)
// ==========================================

function showNotification(message, type = 'info') {
    // Mostra solo notifiche di errore e warning importanti
    if (type !== 'error' && type !== 'warning') {
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
window.showPattoDetails = showPattoDetails;

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

console.log('Dashboard Monitoraggio Patti - Versione Migliorata caricata');