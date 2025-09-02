// ==========================================
// DASHBOARD MONITORAGGIO PATTI - VERSIONE UNIFICATA COMPLETA
// Sistema di filtri scalabile con ricerca intelligente integrata
// ==========================================

// ==========================================
// VARIABILI GLOBALI
// ==========================================

// Variabili principali
let map;
let miniMap;
let markersLayer;
let allData = [];
let filteredData = [];
let chart;
let currentMapLayer = 'standard';
let currentChartType = 'stato';
let proponenteFilter = '';

// Variabili per ricerca intelligente
let smartSearchData = {
    titoli: [],
    proponenti: [],
    rappresentanti: [],
    indirizzi: [],
    combined: []
};
let smartSearchCache = new Map();
let currentSmartSuggestionIndex = -1;
let smartSearchTimeout = null;
let currentSmartSearchQuery = '';

// Variabili per autocomplete classico
let autocompleteData = [];
let currentSuggestionIndex = -1;

// Configurazione
const PALERMO_CENTER = [38.1157, 13.3615];
const PALERMO_BOUNDS = [
    [38.0500, 13.2500],
    [38.3000, 13.4200]
];

const statusColors = {
    'Istruttoria in corso': '#ffdb4d',
    'Respinta': '#ff6b6b',
    'Patto stipulato': '#8fd67d',
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
    'In attesa di integrazione': '#b3e6ff'
};

// ==========================================
// SISTEMA DI FILTRI UNIFICATO E SCALABILE
// ==========================================

/**
 * FUNZIONE PRINCIPALE: Applica tutti i filtri in modo efficiente e scalabile
 */
function applyFilters() {
    console.log('🔍 Applicazione filtri unificata...');
    
    const startTime = performance.now();
    
    // 1. Raccogli tutti i filtri attivi
    const filters = gatherAllActiveFilters();
    console.log('Filtri raccolti:', filters);
    
    // 2. Applica tutti i filtri in una sola passata (efficiente)
    filteredData = applyAllFiltersToData(allData, filters);
    console.log(`✅ Filtrati ${filteredData.length} di ${allData.length} elementi in ${Math.round(performance.now() - startTime)}ms`);
    
    // 3. Aggiorna tutte le viste
    updateAllViews();
    
    // 4. Aggiorna popup filtri
    updateFiltersPopup();
    
    // 5. Aggiorna aspetto visivo dei filtri
    updateAllFilterAppearances(filters);
}

/**
 * Raccoglie tutti i filtri attivi da tutte le fonti
 */
function gatherAllActiveFilters() {
    return {
        // Filtri geografici
        stato: getFilterValue('filterStato'),
        upl: getFilterValue('filterUpl'), 
        quartiere: getFilterValue('filterQuartiere'),
        circoscrizione: getFilterValue('filterCircoscrizione'),
        
        // Filtri di ricerca
        titolo: getFilterValue('filterTitolo').toLowerCase(),
        smartSearch: currentSmartSearchQuery.toLowerCase().trim(),
        
        // Filtro nascosto
        proponente: proponenteFilter.trim()
    };
}

/**
 * Ottiene il valore di un filtro in modo sicuro
 */
function getFilterValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value.trim() : '';
}

/**
 * Applica tutti i filtri ai dati in una singola passata (O(n) invece di O(n²))
 */
function applyAllFiltersToData(data, filters) {
    // Pre-calcola le chiavi per evitare ricerche ripetute
    const keys = findDataKeys();
    
    return data.filter(item => {
        // Filtri geografici esatti
        if (filters.stato && item[keys.stato]?.trim() !== filters.stato) return false;
        if (filters.upl && item[keys.upl]?.trim() !== filters.upl) return false;
        if (filters.quartiere && item[keys.quartiere]?.trim() !== filters.quartiere) return false;
        if (filters.circoscrizione && item[keys.circoscrizione]?.trim() !== filters.circoscrizione) return false;
        
        // Filtro proponente nascosto
        if (filters.proponente && item[keys.proponente]?.trim() !== filters.proponente) return false;
        
        // Filtri di ricerca (se entrambi sono presenti, devono corrispondere entrambi)
        if (filters.titolo && !item[keys.titolo]?.toLowerCase().includes(filters.titolo)) return false;
        
        if (filters.smartSearch) {
            const searchableText = createSearchableText(item, keys).toLowerCase();
            if (!searchableText.includes(filters.smartSearch)) return false;
        }
        
        return true;
    });
}

/**
 * Crea testo ricercabile da un elemento dati
 */
function createSearchableText(item, keys) {
    return [
        item[keys.titolo] || '',
        item[keys.proponente] || '',
        item[keys.rappresentante] || '',
        item[keys.indirizzo] || ''
    ].join(' ').trim();
}

/**
 * Aggiorna l'aspetto visivo di tutti i filtri
 */
function updateAllFilterAppearances(filters) {
    const filterElements = [
        { id: 'filterStato', value: filters.stato },
        { id: 'filterUpl', value: filters.upl },
        { id: 'filterQuartiere', value: filters.quartiere },
        { id: 'filterCircoscrizione', value: filters.circoscrizione },
        { id: 'filterTitolo', value: filters.titolo }
    ];
    
    filterElements.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) {
            updateFilterAppearance(element, value);
        }
    });
    
    // Aggiorna badge smart search
    updateSmartSearchBadge(filters.smartSearch);
}

/**
 * Aggiorna tutte le viste dell'applicazione
 */
function updateAllViews() {
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
}

// ==========================================
// SISTEMA DI RICERCA INTELLIGENTE
// ==========================================

/**
 * Inizializza il sistema di ricerca intelligente
 */
function initializeSmartSearch() {
    console.log('🔍 Inizializzazione ricerca intelligente...');
    
    if (!allData || allData.length === 0) {
        console.warn('Dati non ancora caricati per ricerca intelligente');
        return;
    }
    
    buildSmartSearchData();
    setupSmartSearchEventListeners();
    
    console.log('🔍 Ricerca intelligente inizializzata:', {
        totali: smartSearchData.combined.length
    });
}

/**
 * Costruisce i dati per la ricerca intelligente
 */
function buildSmartSearchData() {
    const keys = findDataKeys();
    
    smartSearchData.titoli = extractUniqueValues(keys.titolo, 'titolo');
    smartSearchData.proponenti = extractUniqueValues(keys.proponente, 'proponente');
    smartSearchData.rappresentanti = extractUniqueValues(keys.rappresentante, 'rappresentante');
    smartSearchData.indirizzi = extractUniqueValues(keys.indirizzo, 'indirizzo');
    
    smartSearchData.combined = [
        ...smartSearchData.titoli,
        ...smartSearchData.proponenti,
        ...smartSearchData.rappresentanti,
        ...smartSearchData.indirizzi
    ].sort((a, b) => a.text.localeCompare(b.text));
}

/**
 * Estrae valori unici da un campo specifico
 */
function extractUniqueValues(fieldKey, category) {
    if (!fieldKey) return [];
    
    const values = [...new Set(allData
        .map(item => item[fieldKey])
        .filter(value => value && value.toString().trim() !== '')
        .map(value => value.toString().trim())
    )];
    
    return values.map(text => ({
        text: text,
        category: category,
        categoryLabel: getCategoryLabel(category),
        icon: getCategoryIcon(category),
        color: getCategoryColor(category)
    }));
}

/**
 * Setup event listeners per ricerca intelligente
 */
function setupSmartSearchEventListeners() {
    const input = document.getElementById('smartSearchInput');
    const suggestions = document.getElementById('smartSearchSuggestions');
    const clearButton = document.getElementById('clearSmartSearch');
    
    if (!input || !suggestions) {
        console.error('Elementi ricerca intelligente non trovati');
        return;
    }
    
    // Rimuovi listener esistenti per evitare duplicati
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    // Input con debouncing
    newInput.addEventListener('input', function() {
        const query = this.value.trim();
        currentSmartSearchQuery = query;
        
        if (clearButton) {
            clearButton.style.display = query ? 'flex' : 'none';
        }
        
        if (smartSearchTimeout) {
            clearTimeout(smartSearchTimeout);
        }
        
        smartSearchTimeout = setTimeout(() => {
            performSmartSearch(query);
        }, 300);
    });
    
    // Navigazione tastiera
    newInput.addEventListener('keydown', handleSmartSearchKeydown);
    
    // Clear button
    if (clearButton) {
        const newClearButton = clearButton.cloneNode(true);
        clearButton.parentNode.replaceChild(newClearButton, clearButton);
        
        newClearButton.addEventListener('click', clearSmartSearch);
    }
    
    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!newInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
}

/**
 * Esegue la ricerca intelligente
 */
function performSmartSearch(query) {
    if (query.length < 2) {
        hideSuggestions();
        applyFilters();
        return;
    }
    
    // Cerca nei dati che sono già filtrati dagli altri filtri
    const otherFilters = gatherAllActiveFilters();
    otherFilters.smartSearch = '';
    
    const preFilteredData = applyAllFiltersToData(allData, otherFilters);
    const results = executeSmartSearchOnData(query, preFilteredData);
    const suggestions = generateSuggestions(results, query);
    
    displaySmartSearchResults(suggestions, query);
    applyFilters();
}

/**
 * Esegue ricerca intelligente sui dati pre-filtrati
 */
function executeSmartSearchOnData(query, data) {
    const keys = findDataKeys();
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    data.forEach(item => {
        const fieldsToSearch = [
            { key: keys.titolo, category: 'titolo', text: item[keys.titolo] },
            { key: keys.proponente, category: 'proponente', text: item[keys.proponente] },
            { key: keys.rappresentante, category: 'rappresentante', text: item[keys.rappresentante] },
            { key: keys.indirizzo, category: 'indirizzo', text: item[keys.indirizzo] }
        ];
        
        fieldsToSearch.forEach(field => {
            if (!field.text) return;
            
            const itemText = field.text.toString().toLowerCase();
            let score = 0;
            
            if (itemText === lowerQuery) score = 100;
            else if (itemText.startsWith(lowerQuery)) score = 80;
            else if (itemText.includes(lowerQuery)) score = 60;
            
            if (score > 0) {
                results.push({
                    text: field.text.toString(),
                    category: field.category,
                    categoryLabel: getCategoryLabel(field.category),
                    icon: getCategoryIcon(field.category),
                    color: getCategoryColor(field.category),
                    score: score,
                    dataItem: item
                });
            }
        });
    });
    
    // Rimuovi duplicati e ordina
    const uniqueResults = [];
    const seen = new Set();
    
    results.forEach(result => {
        const key = `${result.category}:${result.text}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(result);
        }
    });
    
    return uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

/**
 * Genera suggerimenti dai risultati
 */
function generateSuggestions(results, query) {
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.category]) acc[result.category] = [];
        acc[result.category].push(result);
        return acc;
    }, {});
    
    return Object.entries(groupedResults).map(([category, items]) => ({
        category,
        categoryLabel: getCategoryLabel(category),
        icon: getCategoryIcon(category),
        color: getCategoryColor(category),
        items: items.slice(0, 4)
    }));
}

/**
 * Mostra risultati ricerca intelligente
 */
function displaySmartSearchResults(suggestions, query) {
    const suggestionsContainer = document.getElementById('smartSearchSuggestions');
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(group => `
            <div class="suggestion-category">
                <div class="suggestion-category-header">
                    <i data-lucide="${group.icon}" class="category-icon" style="color: ${group.color};"></i>
                    <span>${group.categoryLabel}</span>
                </div>
                <div class="suggestion-items">
                    ${group.items.map(item => `
                        <div class="smart-suggestion-item" 
                             data-text="${item.text}" 
                             data-category="${item.category}">
                            <div class="suggestion-content">
                                <div class="suggestion-text">${highlightQuery(item.text, query)}</div>
                            </div>
                            <div class="suggestion-score">${Math.round(item.score)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        suggestionsContainer.classList.remove('hidden');
        
        // Event listeners per selezione
        suggestionsContainer.querySelectorAll('.smart-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                selectSmartSearchSuggestion(item.dataset.text);
            });
        });
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } else {
        suggestionsContainer.classList.add('hidden');
    }
}

/**
 * Seleziona un suggerimento
 */
function selectSmartSearchSuggestion(text) {
    const input = document.getElementById('smartSearchInput');
    input.value = text;
    currentSmartSearchQuery = text;
    
    hideSuggestions();
    applyFilters();
    input.focus();
}

/**
 * Pulisci ricerca intelligente
 */
function clearSmartSearch() {
    const input = document.getElementById('smartSearchInput');
    const clearButton = document.getElementById('clearSmartSearch');
    
    if (input) input.value = '';
    if (clearButton) clearButton.style.display = 'none';
    
    currentSmartSearchQuery = '';
    hideSuggestions();
    applyFilters();
}

/**
 * Nascondi suggerimenti
 */
function hideSuggestions() {
    document.getElementById('smartSearchSuggestions')?.classList.add('hidden');
}

/**
 * Gestione navigazione tastiera
 */
function handleSmartSearchKeydown(e) {
    const suggestions = document.getElementById('smartSearchSuggestions');
    const suggestionItems = suggestions.querySelectorAll('.smart-suggestion-item');
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentSmartSuggestionIndex = Math.min(currentSmartSuggestionIndex + 1, suggestionItems.length - 1);
            updateSuggestionHighlight(suggestionItems);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            currentSmartSuggestionIndex = Math.max(currentSmartSuggestionIndex - 1, -1);
            updateSuggestionHighlight(suggestionItems);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (currentSmartSuggestionIndex >= 0 && suggestionItems[currentSmartSuggestionIndex]) {
                suggestionItems[currentSmartSuggestionIndex].click();
            }
            break;
            
        case 'Escape':
            hideSuggestions();
            currentSmartSuggestionIndex = -1;
            break;
    }
}

/**
 * Aggiorna evidenziazione suggerimenti
 */
function updateSuggestionHighlight(suggestionItems) {
    suggestionItems.forEach((item, index) => {
        if (index === currentSmartSuggestionIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

// ==========================================
// RESET FILTRI UNIFICATO
// ==========================================

/**
 * Reset completo di tutti i filtri
 */
function clearAllFilters() {
    console.log('🔄 Reset completo tutti i filtri...');
    
    // Reset filtri geografici
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            updateFilterAppearance(element, '');
        }
    });
    
    // Reset ricerca intelligente
    clearSmartSearch();
    
    // Reset filtro proponente nascosto
    proponenteFilter = '';
    
    // Reset autocomplete
    const suggestions = document.getElementById('autocompleteSuggestions');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    
    // Applica filtri (che ora sono tutti vuoti)
    filteredData = [...allData];
    updateAllViews();
    hideFiltersPopup();
    
    showNotification('Tutti i filtri sono stati resettati', 'success');
}

// ==========================================
// GESTIONE POPUP FILTRI
// ==========================================

/**
 * Aggiorna il popup dei filtri attivi
 */
function updateFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    const title = document.getElementById('filtersPopupTitle');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    if (!popup || !title || !activeFiltersText) return;
    
    // Raccogli filtri attivi
    const filters = gatherAllActiveFilters();
    const activeFilters = {};
    
    if (filters.stato) activeFilters['Stato'] = filters.stato;
    if (filters.upl) activeFilters['UPL'] = filters.upl;
    if (filters.quartiere) activeFilters['Quartiere'] = filters.quartiere;
    if (filters.circoscrizione) activeFilters['Circoscrizione'] = filters.circoscrizione;
    if (filters.titolo) activeFilters['Titolo'] = `"${filters.titolo}"`;
    if (filters.smartSearch) activeFilters['Ricerca'] = `"${filters.smartSearch}"`;
    if (filters.proponente) activeFilters['Proponente'] = filters.proponente;
    
    const activeCount = Object.keys(activeFilters).length;
    
    if (activeCount === 0) {
        hideFiltersPopup();
        return;
    }
    
    // Aggiorna titolo
    const filteredCount = filteredData ? filteredData.length : 0;
    const totalCount = allData ? allData.length : 0;
    
    let titleText;
    if (filteredCount === 0) {
        titleText = 'Nessuna richiesta trovata';
    } else if (filteredCount === 1) {
        titleText = 'È stata selezionata 1 richiesta';
    } else {
        titleText = `Sono state selezionate ${filteredCount} richieste`;
    }
    
    if (filteredCount > 0 && filteredCount < totalCount) {
        titleText += ` di ${totalCount}`;
    }
    
    title.textContent = titleText;
    
    // Crea tag filtri
    const filterTags = Object.entries(activeFilters).map(([filterName, value]) => {
        let displayValue = value;
        if (value.length > 25) {
            displayValue = value.substring(0, 22) + '...';
        }
        
        return `<span class="filter-tag" title="${filterName}: ${value}">${filterName}: ${displayValue}</span>`;
    }).join('');
    
    activeFiltersText.innerHTML = filterTags;
    showFiltersPopup();
}

/**
 * Mostra popup filtri
 */
function showFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    popup.classList.remove('hide');
    popup.offsetHeight; // Force reflow
    popup.classList.add('show');
    popup.style.zIndex = '1110';
}

/**
 * Nascondi popup filtri
 */
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

/**
 * Setup popup filtri
 */
function initializeFiltersPopup() {
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', clearAllFilters);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('filtersPopup');
            if (popup && popup.classList.contains('show')) {
                hideFiltersPopup();
            }
        }
    });
}

// ==========================================
// AGGIORNAMENTO INTERFACCIA FILTRI
// ==========================================

/**
 * Aggiorna i filtri con logica cascata efficiente
 */
function updateFilters() {
    console.log('Aggiornamento filtri...');
    
    const filterMappings = [
        { id: 'filterStato', key: 'Stato di avanzamento' },
        { id: 'filterUpl', key: 'UPL' },
        { id: 'filterQuartiere', key: 'Quartiere' },
        { id: 'filterCircoscrizione', key: 'Circoscrizione' }
    ];

    const currentFilters = gatherAllActiveFilters();

    filterMappings.forEach(({ id, key }) => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        updateFilterAppearance(select, currentValue);
        
        // Conserva opzioni esistenti tranne quelle dinamiche
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const actualKey = Object.keys(allData[0] || {}).find(k => 
            k.toLowerCase().trim() === key.toLowerCase().trim()
        );

        if (!actualKey) {
            console.warn(`Chiave non trovata per ${key}`);
            return;
        }

        // Ottieni dati da filtrare per cascata
        let dataToFilter = getDataForFilterCascade(currentFilters, id);
        
        // Ottieni valori unici
        const uniqueValues = [...new Set(
            dataToFilter
                .map(item => item[actualKey])
                .filter(value => value && value.toString().trim() !== '')
                .map(value => value.toString().trim())
        )].sort();
        
        // Popola select
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        
        // Mantieni selezione se valida
        if (uniqueValues.includes(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = '';
        }
        
        updateFilterAppearance(select, select.value);
        
        // Aggiungi event listener (solo se non esiste già)
        if (!select.hasAttribute('data-listener-added')) {
            select.addEventListener('change', applyFilters);
            select.setAttribute('data-listener-added', 'true');
        }
    });
}

/**
 * Ottieni dati per cascata filtri (ottimizzato)
 */
function getDataForFilterCascade(currentFilters, currentFilterId) {
    let dataToFilter = [...allData];
    
    // Applica filtri in ordine gerarchico, escludendo il filtro corrente
    if (['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].includes(currentFilterId)) {
        if (currentFilters.circoscrizione && currentFilterId !== 'filterCircoscrizione') {
            const keys = findDataKeys();
            dataToFilter = dataToFilter.filter(item => 
                item[keys.circoscrizione]?.trim() === currentFilters.circoscrizione
            );
        }
        
        if (currentFilters.quartiere && currentFilterId !== 'filterQuartiere') {
            const keys = findDataKeys();
            dataToFilter = dataToFilter.filter(item => 
                item[keys.quartiere]?.trim() === currentFilters.quartiere
            );
        }
        
        if (currentFilters.upl && currentFilterId !== 'filterUpl') {
            const keys = findDataKeys();
            dataToFilter = dataToFilter.filter(item => 
                item[keys.upl]?.trim() === currentFilters.upl
            );
        }
    }
    
    return dataToFilter;
}

/**
 * Aggiorna aspetto visivo filtro
 */
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

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

/**
 * Inizializzazione principale
 */
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initializeMap();
    loadData();
    setupEventListeners();
    setupAutoUpdate();
    handleViewportResize();
    initializeFiltersPopup();
    setupCollapsibleFilters();
});

/**
 * Gestione resize viewport
 */
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

/**
 * Inizializzazione mappa
 */
function initializeMap() {
    map = L.map('map', {
        maxBounds: PALERMO_BOUNDS,
        maxZoom: 18,
        minZoom: 11,
        zoomControl: true,
        preferCanvas: true
    }).setView(PALERMO_CENTER, 12);
    
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. map data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> under ODbL - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
    }).addTo(map);
    
    markersLayer = L.layerGroup().addTo(map);
    
    // Limita il panning ai bounds di Palermo
    map.setMaxBounds(PALERMO_BOUNDS);
    
    // Aggiungi un marker del centro di Palermo come riferimento
    L.marker(PALERMO_CENTER, {
        icon: L.divIcon({
            className: 'text-red-500',
            html: '<i data-lucide="landmark" class="h-5 w-5"></i>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map)
      .bindPopup('<b>Centro Storico di Palermo</b><br>Palazzo delle Aquile')
      .bindTooltip('Centro di Palermo', {permanent: false, direction: 'top'});
}

/**
 * Caricamento dati
 */
async function loadData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/PalermoHub/Dashboard-Monitoraggio/refs/heads/main/dati/monit_patti_pa.csv');
        const csvText = await response.text();
        
        allData = parseCSV(csvText);
        filteredData = [...allData];
        
        setupAutocomplete();
        updateFilters();
        updateAllViews();
        updateLegend();
        updateLastUpdate();
        
        hideFiltersPopup();
        
        // Inizializza ricerca intelligente dopo caricamento dati
        setTimeout(() => {
            initializeSmartSearch();
        }, 500);
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati. Riprova più tardi.');
    }
}

/**
 * Parser CSV migliorato
 */
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
            
            // Parsing coordinate
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

/**
 * Parser per singola riga CSV
 */
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

/**
 * Setup autocompletamento
 */
function setupAutocomplete() {
    const titoloKey = Object.keys(allData[0] || {}).find(key => 
        key.toLowerCase().includes('titolo') && key.toLowerCase().includes('proposta')
    );
    
    if (titoloKey) {
        autocompleteData = [...new Set(allData.map(item => item[titoloKey]).filter(Boolean))].sort();
    }
}

/**
 * Aggiornamento mappa
 */
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
        
        // Tooltip al passaggio del mouse
        const titolo = patto[titoloKey] || 'Titolo non disponibile';
        marker.bindTooltip(titolo, {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
        });
        
        // Popup al click
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

/**
 * Centra la mappa sui dati filtrati
 */
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

/**
 * Aggiornamento statistiche
 */
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

/**
 * Animazione contatori
 */
function updateCounterWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
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

/**
 * Aggiornamento grafico
 */
function updateChart() {
    if (currentChartType === 'stato') {
        updateStatusChart();
    } else {
        updateProponenteChart();
    }
    updateChartInterface();
}

/**
 * Grafico stati
 */
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

/**
 * Grafico proponenti
 */
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

/**
 * Genera colori per proponenti
 */
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

/**
 * Aggiorna interfaccia grafico
 */
function updateChartInterface() {
    const titleElement = document.getElementById('chartTitle');
    const helpElement = document.getElementById('chartHelp');
    const statsElement = document.getElementById('chartStats');
    
    if (currentChartType === 'stato') {
        titleElement.textContent = 'Richieste per stato di avanzamento';
        helpElement.textContent = '';
    } else {
        titleElement.textContent = 'Richieste per proponente';
        helpElement.textContent = '';
    }
    
    const totalVisible = filteredData.length;
    const totalOverall = allData.length;
    statsElement.textContent = `Stai visualizzando ${totalVisible} di ${totalOverall} richieste`;
}

/**
 * Crea grafico unificato
 */
function createChart(labels, data, colors, type, fullLabels = null) {
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('statusChart').getContext('2d');
    chart = new Chart(ctx, {
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
                        document.getElementById('filterStato').value = selectedStatus;
                        applyFilters();
                        showNotification(`Filtro applicato: ${selectedStatus}`);
                    } else {
                        const selectedProponente = fullLabels ? fullLabels[index] : labels[index];
                        applyProponenteFilter(selectedProponente);
                        showNotification(`Filtro proponente: ${selectedProponente.length > 30 ? selectedProponente.substring(0, 27) + '...' : selectedProponente}`);
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

/**
 * Applica filtro proponente
 */
function applyProponenteFilter(selectedProponente) {
    proponenteFilter = selectedProponente;
    applyFilters();
}

/**
 * Aggiornamento tabella
 */
function updateTable() {
    if (!filteredData || filteredData.length === 0) {
        document.getElementById('tableCount').textContent = '0';
        document.getElementById('tableHeader').innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
        document.getElementById('tableBody').innerHTML = '';
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

    document.getElementById('tableCount').textContent = filteredData.length;

    const tableHeader = document.getElementById('tableHeader');
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

    const tableBody = document.getElementById('tableBody');
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

    lucide.createIcons();
}

/**
 * Aggiornamento legenda
 */
function updateLegend() {
    const legend = document.getElementById('legend');
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

/**
 * Aggiornamento ultima modifica
 */
function updateLastUpdate() {
    const now = new Date();
    const formatted = now.toLocaleString('it-IT');
    document.getElementById('lastUpdate').textContent = formatted;
}

/**
 * Mostra dettagli patto
 */
function showPattoDetails(pattoId) {
    const patto = allData.find(item => {
        const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
        return item[idKey] === pattoId;
    });
    
    if (!patto) {
        showNotification('Patto non trovato', 'error');
        return;
    }
    
    populatePattoModal(patto);
    document.getElementById('pattoModal').classList.remove('hidden');
}

/**
 * Popola modal patto
 */
function populatePattoModal(patto) {
    const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
    const titoloKey = Object.keys(patto).find(k => k.toLowerCase().includes('titolo'));
    const proponenteKey = Object.keys(patto).find(k => k.toLowerCase().includes('proponente'));
    const rappresentanteKey = Object.keys(patto).find(k => k.toLowerCase().includes('rappresentante'));
    const indirizzoKey = Object.keys(patto).find(k => k.toLowerCase().includes('indirizzo'));
    const statoKey = Object.keys(patto).find(k => k.toLowerCase().includes('stato'));
    const noteKey = Object.keys(patto).find(k => k.toLowerCase().includes('nota'));
    const fotoKey = Object.keys(patto).find(k => k.toLowerCase().includes('foto'));
    const googleMapsKey = Object.keys(patto).find(k => k.toLowerCase().includes('googlemaps'));
    const geoUriKey = Object.keys(patto).find(k => k.toLowerCase().includes('geouri'));
    
    document.getElementById('modalTitle').textContent = patto[titoloKey] || 'Dettagli Patto';
    
    const detailsHtml = `
        <div><strong>ID:</strong> ${patto[idKey] || 'N/A'}</div>
        <div><strong>Titolo:</strong> ${patto[titoloKey] || 'N/A'}</div>
        <div><strong>Proponente:</strong> ${patto[proponenteKey] || 'N/A'}</div>
        <div><strong>Rappresentante:</strong> ${patto[rappresentanteKey] || 'N/A'}</div>
        <div><strong>Indirizzo:</strong> ${patto[indirizzoKey] || 'N/A'}</div>
    `;
    document.getElementById('pattoDetails').innerHTML = detailsHtml;
    
    const stato = patto[statoKey] || 'N/A';
    const color = statusColors[stato] || '#6b7280';
    document.getElementById('pattoStatus').innerHTML = `
        <span style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">
            ${stato}
        </span>
    `;
    
    if (patto[noteKey] && patto[noteKey].trim() !== '') {
        document.getElementById('pattoNotes').textContent = patto[noteKey];
        document.getElementById('pattoNotesContainer').classList.remove('hidden');
    } else {
        document.getElementById('pattoNotesContainer').classList.add('hidden');
    }
    
    const linksHtml = [];
    if (patto[googleMapsKey] && patto[googleMapsKey].trim() !== '') {
        linksHtml.push(`
            <a href="${patto[googleMapsKey]}" target="_blank" class="btn btn-sm btn-primary">
                <i data-lucide="map" class="h-4 w-4 mr-1"></i> Google Maps
            </a>
        `);
    }
    if (patto[geoUriKey] && patto[geoUriKey].trim() !== '') {
        linksHtml.push(`
            <a href="${patto[geoUriKey]}" target="_blank" class="btn btn-sm btn-secondary">
                <i data-lucide="navigation" class="h-4 w-4 mr-1"></i> Naviga
            </a>
        `);
    }
    
    if (linksHtml.length > 0) {
        document.getElementById('pattoLinks').innerHTML = linksHtml.join('');
    } else {
        document.getElementById('pattoLinks').innerHTML = '<span class="text-gray-500">Nessun link disponibile</span>';
    }
    
    if (patto[fotoKey] && patto[fotoKey].trim() !== '') {
        document.getElementById('pattoPhoto').src = patto[fotoKey];
        document.getElementById('photoContainer').classList.remove('hidden');
    } else {
        document.getElementById('photoContainer').classList.add('hidden');
    }
    
    createMiniMap(patto.lat, patto.lng);
    lucide.createIcons();
}

/**
 * Crea mini mappa
 */
function createMiniMap(lat, lng) {
    if (miniMap) {
        miniMap.remove();
    }
    
    miniMap = L.map('miniMap', {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false
    }).setView([lat, lng], 16);
    
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(miniMap);
    
    L.marker([lat, lng]).addTo(miniMap);
    
    setTimeout(() => {
        miniMap.invalidateSize();
    }, 100);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Reset filtri
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Tipo grafico
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    if (chartTypeSelector) {
        chartTypeSelector.addEventListener('change', function() {
            currentChartType = this.value;
            updateChart();
        });
    }
    
    // Controlli mappa
    const centerPalermoBtn = document.getElementById('centerPalermo');
    if (centerPalermoBtn) {
        centerPalermoBtn.addEventListener('click', centerMapOnPalermo);
    }
    
    // Modali
    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) {
        infoBtn.addEventListener('click', function() {
            document.getElementById('infoModal').classList.remove('hidden');
        });
    }
    
    const closeInfoModal = document.getElementById('closeInfoModal');
    if (closeInfoModal) {
        closeInfoModal.addEventListener('click', function() {
            document.getElementById('infoModal').classList.add('hidden');
        });
    }
    
    const showTableBtn = document.getElementById('showTableBtn');
    if (showTableBtn) {
        showTableBtn.addEventListener('click', function() {
            document.getElementById('tableModal').classList.remove('hidden');
        });
    }
    
    const closeTableModal = document.getElementById('closeTableModal');
    if (closeTableModal) {
        closeTableModal.addEventListener('click', function() {
            document.getElementById('tableModal').classList.add('hidden');
        });
    }
}

/**
 * Centra mappa su Palermo
 */
function centerMapOnPalermo() {
    map.setView(PALERMO_CENTER, 13);
    showNotification('Mappa centrata sul Centro Storico', 'info');
}

/**
 * Mostra notifiche
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

/**
 * Mostra errore
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * Setup auto-update
 */
function setupAutoUpdate() {
    setInterval(() => {
        updateLastUpdate();
    }, 300000);
}

/**
 * Setup filtri collassabili
 */
function setupCollapsibleFilters() {
    const filterGroups = document.querySelectorAll('.filter-group');
    
    filterGroups.forEach(group => {
        const header = group.querySelector('.filter-group-header');
        const content = group.querySelector('.filter-group-content');
        const formElement = content.querySelector('select, input');
        
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

/**
 * Aggiorna stato gruppo filtro
 */
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
                group.querySelector('.filter-group-title').appendChild(badge);
            }
            const selectedOption = formElement.options[formElement.selectedIndex];
            badge.textContent = selectedOption.text.length > 15 
                ? selectedOption.text.substring(0, 12) + '...' 
                : selectedOption.text;
        }
    } else {
        group.classList.remove('has-value');
        
        const badge = group.querySelector('.filter-value-badge');
        if (badge) {
            badge.remove();
        }
    }
}

// ==========================================
// UTILITÀ E CONFIGURAZIONE
// ==========================================

/**
 * Trova le chiavi corrette nei dati
 */
function findDataKeys() {
    if (!allData || allData.length === 0) return {};
    
    const firstItem = allData[0];
    return {
        titolo: Object.keys(firstItem).find(k => k.toLowerCase().includes('titolo') && k.toLowerCase().includes('proposta')),
        proponente: Object.keys(firstItem).find(k => k.toLowerCase().includes('proponente')),
        rappresentante: Object.keys(firstItem).find(k => k.toLowerCase().includes('rappresentante')),
        indirizzo: Object.keys(firstItem).find(k => k.toLowerCase().includes('indirizzo')),
        stato: Object.keys(firstItem).find(k => k.toLowerCase().includes('stato')),
        upl: Object.keys(firstItem).find(k => k.toLowerCase() === 'upl'),
        quartiere: Object.keys(firstItem).find(k => k.toLowerCase().includes('quartiere')),
        circoscrizione: Object.keys(firstItem).find(k => k.toLowerCase().includes('circoscrizione'))
    };
}

/**
 * Configurazione categorie ricerca intelligente
 */
function getCategoryLabel(category) {
    const labels = {
        'titolo': 'Titoli Progetti',
        'proponente': 'Proponenti',
        'rappresentante': 'Rappresentanti',
        'indirizzo': 'Indirizzi'
    };
    return labels[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'titolo': 'file-text',
        'proponente': 'building-2',
        'rappresentante': 'user-check',
        'indirizzo': 'map-pin'
    };
    return icons[category] || 'circle';
}

function getCategoryColor(category) {
    const colors = {
        'titolo': '#3b82f6',
        'proponente': '#10b981',
        'rappresentante': '#f59e0b',
        'indirizzo': '#ef4444'
    };
    return colors[category] || '#6b7280';
}

/**
 * Evidenzia query nei risultati
 */
function highlightQuery(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Aggiorna badge ricerca intelligente
 */
function updateSmartSearchBadge(query) {
    const badge = document.getElementById('smart-search-badge');
    if (badge) {
        if (query && query.trim().length >= 2) {
            badge.textContent = '1';
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

console.log('✅ Dashboard Monitoraggio Patti - Sistema Unificato COMPLETO caricato');