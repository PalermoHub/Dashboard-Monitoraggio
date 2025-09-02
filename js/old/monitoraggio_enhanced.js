// Enhanced Dashboard JavaScript - Versione Completa Corretta
// File: monitoraggio_enhanced.js

// ==========================================
// VARIABILI GLOBALI
// ==========================================
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
let currentChartType = 'stato';
let proponenteFilter = '';

// Coordinate precise di Palermo
const PALERMO_CENTER = [38.1157, 13.3615];
const PALERMO_BOUNDS = [
    [38.0500, 13.2500],
    [38.3000, 13.4200]
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
// FUNZIONI CORRETTE PER CARD COLLASSABILI
// ==========================================

/**
 * Funzione toggle corretta per le card
 */
function toggleFilterCard(targetId) {
    const content = document.getElementById(targetId);
    const header = document.querySelector(`[onclick="toggleFilterCard('${targetId}')"]`);
    
    if (!content || !header) {
        console.error('Elementi card non trovati:', targetId);
        return;
    }
    
    const icon = header.querySelector('.collapse-icon');
    const isExpanded = content.classList.contains('expanded');
    
    // Chiudi tutte le altre card prima di aprire questa
    if (!isExpanded) {
        // Chiudi tutte le card tranne quella cliccata
        document.querySelectorAll('.filter-card-content.expanded').forEach(otherContent => {
            if (otherContent.id !== targetId) {
                otherContent.classList.remove('expanded');
                const otherHeader = document.querySelector(`[onclick="toggleFilterCard('${otherContent.id}')"]`);
                if (otherHeader) {
                    otherHeader.classList.remove('active');
                    const otherIcon = otherHeader.querySelector('.collapse-icon');
                    if (otherIcon) otherIcon.classList.remove('rotated');
                }
            }
        });
    }
    
    if (isExpanded) {
        // Chiudi la card
        content.classList.remove('expanded');
        header.classList.remove('active');
        if (icon) icon.classList.remove('rotated');
        
        console.log(`Card ${targetId} chiusa`);
    } else {
        // Apri la card
        content.classList.add('expanded');
        header.classList.add('active');
        if (icon) icon.classList.add('rotated');
        
        console.log(`Card ${targetId} aperta`);
        
        // Scrolla la card nella vista se necessario (solo per mobile)
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    // Forza il ridimensionamento della sidebar
    setTimeout(() => {
        if (map) map.invalidateSize();
        if (window.miniMap) window.miniMap.invalidateSize();
    }, 300);
    
    // Rigenera le icone Lucide per i nuovi elementi
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => {
            lucide.createIcons();
        }, 50);
    }
}

/**
 * Funzione corretta per aggiornare i badge dei filtri
 */
function updateFilterBadges() {
    console.log('Aggiornamento badge filtri...');
    
    // Calcola i filtri attivi per ogni categoria
    const filterCounts = {
        'status-filters': 0,
        'geo-filters': 0,
        'search-filters': 0
    };
    
    // Conta filtri di stato (incluso proponente nascosto)
    if (document.getElementById('filterStato').value) {
        filterCounts['status-filters']++;
    }
    if (proponenteFilter && proponenteFilter.trim()) {
        filterCounts['status-filters']++;
    }
    
    // Conta filtri geografici
    ['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        if (document.getElementById(id).value) {
            filterCounts['geo-filters']++;
        }
    });
    
    // Conta filtri di ricerca
    if (document.getElementById('filterTitolo').value.trim()) {
        filterCounts['search-filters']++;
    }
    
    // Aggiorna i badge con visibilità migliorata
    Object.entries(filterCounts).forEach(([cardId, count]) => {
        const badgeId = cardId.replace('-filters', '-badge');
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.textContent = count;
            if (count > 0) {
                badge.style.display = 'flex';
                badge.style.opacity = '1';
            } else {
                badge.style.display = 'none';
            }
        }
    });
    
    // Aggiorna indicatore filtri attivi globale
    const totalFilters = Object.values(filterCounts).reduce((sum, count) => sum + count, 0);
    const activeFiltersIndicator = document.getElementById('activeFiltersCount');
    
    if (activeFiltersIndicator) {
        if (totalFilters > 0) {
            const text = totalFilters === 1 ? '1 filtro attivo' : `${totalFilters} filtri attivi`;
            activeFiltersIndicator.textContent = text;
            activeFiltersIndicator.style.display = 'inline-block';
        } else {
            activeFiltersIndicator.style.display = 'none';
        }
    }
    
    // Aggiorna conteggio risultati con testo più chiaro
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        const total = filteredData ? filteredData.length : 0;
        const totalAll = allData ? allData.length : 0;
        
        let text;
        if (total === 0) {
            text = 'Nessun risultato';
        } else if (total === totalAll) {
            text = `Tutti i ${total} patti`;
        } else {
            text = `${total} di ${totalAll} patti`;
        }
        
        resultsCount.textContent = text;
    }
    
    console.log(`Badge aggiornati: ${totalFilters} filtri attivi totali`);
}

/**
 * Inizializzazione corretta delle filter cards
 */
function initializeFilterCards() {
    console.log('Inizializzazione filter cards...');
    
    // Chiudi TUTTE le card di default
    document.querySelectorAll('.filter-card-content').forEach(content => {
        content.classList.remove('expanded');
    });
    
    document.querySelectorAll('.filter-card-header').forEach(header => {
        header.classList.remove('active');
        const icon = header.querySelector('.collapse-icon');
        if (icon) icon.classList.remove('rotated');
    });
    
    // NESSuna card aperta di default
    console.log('Tutte le card chiuse di default');
    
    // Inizializza badge come nascosti
    ['status-badge', 'geo-badge', 'search-badge'].forEach(badgeId => {
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }
    });
    
    console.log('Filter cards inizializzate correttamente');
}

/**
 * Aggiorna l'interfaccia del grafico enhanced
 */
function updateChartInterface() {
    const titleElement = document.getElementById('chartTitle');
    const statsElement = document.getElementById('chartStats');
    
    if (currentChartType === 'stato') {
        titleElement.textContent = 'Per Stato di Avanzamento';
    } else {
        titleElement.textContent = 'Per Proponente';
    }
    
    // Aggiorna statistiche
    const totalVisible = filteredData.length;
    const totalOverall = allData.length;
    if (totalVisible === totalOverall) {
        statsElement.textContent = `Visualizzando tutti i ${totalOverall} patti di collaborazione`;
    } else {
        statsElement.textContent = `Visualizzando ${totalVisible} di ${totalOverall} patti di collaborazione`;
    }
}

// ==========================================
// GESTIONE POPUP FILTRI
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
        titleText = 'È stata selezionata 1 richiesta';
    } else {
        titleText = `Sono state selezionate ${filteredCount} richieste`;
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

function resetFiltersFromPopup() {
    console.log('Reset filtri dal popup');
    resetAllFilters();
}

function setupFiltersPopupEventListeners() {
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFiltersFromPopup);
        console.log('Event listener popup reset configurato');
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

function initializeFiltersPopup() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFiltersPopup);
        return;
    }
    
    console.log('Inizializzazione popup filtri...');
    
    const popup = document.getElementById('filtersPopup');
    if (!popup) {
        console.error('Elemento popup filtri non trovato');
        return;
    }
    
    setupFiltersPopupEventListeners();
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }
    
    console.log('Popup filtri inizializzato con successo');
}



// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initializeMap();
    loadData();
    setupEventListeners();
    setupAutoUpdate();
    handleViewportResize();
    initializeFiltersPopup();
    
    // Inizializza le card come chiuse di default
    setTimeout(() => {
        initializeFilterCards();
    }, 100);
});

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

// ==========================================
// INIZIALIZZAZIONE MAPPA
// ==========================================

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
    
    map.setMaxBounds(PALERMO_BOUNDS);
    
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

function centerMapOnPalermo() {
    map.setView(PALERMO_CENTER, 13);
    showNotification('Mappa centrata sul Centro Storico', 'info');
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
        updateFilterBadges();
        
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
// GESTIONE FILTRI
// ==========================================

function updateFilters() {
    console.log('Aggiornamento filtri...');
    
    const filterMappings = [
        { id: 'filterStato', key: 'Stato di avanzamento' },
        { id: 'filterUpl', key: 'UPL' },
        { id: 'filterQuartiere', key: 'Quartiere' },
        { id: 'filterCircoscrizione', key: 'Circoscrizione' }
    ];

    const currentFilters = {
        stato: document.getElementById('filterStato').value,
        upl: document.getElementById('filterUpl').value,
        quartiere: document.getElementById('filterQuartiere').value,
        circoscrizione: document.getElementById('filterCircoscrizione').value
    };

    filterMappings.forEach(({ id, key }) => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        updateFilterAppearance(select, currentValue);
        
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

        let dataToFilter = [...allData];
        
        if (['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].includes(id)) {
            if (currentFilters.circoscrizione && id !== 'filterCircoscrizione') {
                const circKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim().includes('circoscrizione')
                );
                if (circKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[circKey] && item[circKey].trim() === currentFilters.circoscrizione.trim()
                    );
                }
            }
            
            if (currentFilters.quartiere && id !== 'filterQuartiere') {
                const quartKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim().includes('quartiere')
                );
                if (quartKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[quartKey] && item[quartKey].trim() === currentFilters.quartiere.trim()
                    );
                }
            }
            
            if (currentFilters.upl && id !== 'filterUpl') {
                const uplKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim() === 'upl'
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
        } else {
            select.value = '';
        }
        
        updateFilterAppearance(select, select.value);
    });
}

function updateFilterAppearance(selectElement, value) {
    if (value && value.trim() !== '') {
        selectElement.classList.remove('border-gray-300');
        selectElement.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200', 'active');
        selectElement.style.fontWeight = '600';
    } else {
        selectElement.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200', 'active');
        selectElement.classList.add('border-gray-300');
        selectElement.style.fontWeight = 'normal';
    }
}

/**
 * Funzione corretta per applicare filtri con badge update
 */
function applyFilters() {
    const filters = {
        stato: document.getElementById('filterStato').value.trim(),
        upl: document.getElementById('filterUpl').value.trim(),
        quartiere: document.getElementById('filterQuartiere').value.trim(),
        circoscrizione: document.getElementById('filterCircoscrizione').value.trim(),
        titolo: document.getElementById('filterTitolo').value.toLowerCase().trim(),
        proponente: proponenteFilter.trim()
    };
    
    console.log('Applicando filtri con badge update:', filters);
    
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
    
    // Aggiorna aspetto filtri
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'].forEach(id => {
        const element = document.getElementById(id);
        updateFilterAppearance(element, element.value);
    });
    
    // Aggiorna tutto
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    updateFilterBadges(); // Chiamata corretta
    updateFiltersPopup();
}

/**
 * Funzione corretta per reset filtri
 */
function resetAllFilters() {
    console.log('Reset completo di tutti i filtri');
    
    // Reset elementi form
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            updateFilterAppearance(element, '');
        }
    });
    
    // Reset filtro proponente nascosto
    proponenteFilter = '';
    
    // Nascondi suggerimenti autocomplete
    const suggestions = document.getElementById('autocompleteSuggestions');
    const searchCard = document.querySelector('.search-filter');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    if (searchCard) {
        searchCard.classList.remove('active-search');
    }
    
    // Reset dei dati
    filteredData = [...allData];
    
    // Aggiorna tutto
    updateFilters();
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    updateFilterBadges();
    
    hideFiltersPopup();
    
    showNotification('Tutti i filtri sono stati rimossi', 'info');
    
    console.log('Reset completato');
}

// ==========================================
// GESTIONE MAPPA
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
// GESTIONE STATISTICHE
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

// ==========================================
// GESTIONE GRAFICI ENHANCED
// ==========================================

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
    
    const labels = Object.keys(validStatusCounts);
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

function applyProponenteFilter(selectedProponente) {
    proponenteFilter = selectedProponente;
    applyFilters();
}

// ==========================================
// GESTIONE LEGENDA E TABELLA
// ==========================================

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

function updateLastUpdate() {
    const now = new Date();
    const formatted = now.toLocaleString('it-IT');
    document.getElementById('lastUpdate').textContent = formatted;
}

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

// ==========================================
// MOSTRA DETTAGLI PATTO
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
    
    document.getElementById('modalTitle').textContent = patto[keys.titolo] || 'Patto senza titolo';
    
    const details = document.getElementById('pattoDetails');
    details.innerHTML = `
        <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
        <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
        <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
        <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
        <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
        <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
    `;
    
    const status = document.getElementById('pattoStatus');
    const statoText = patto[keys.stato] || 'Non specificato';
    status.textContent = statoText;
    status.style.backgroundColor = statusColors[statoText] || '#6b7280';
    
    if (keys.note && patto[keys.note]) {
        document.getElementById('pattoNotesContainer').classList.remove('hidden');
        document.getElementById('pattoNotes').textContent = patto[keys.note];
    } else {
        document.getElementById('pattoNotesContainer').classList.add('hidden');
    }
    
    const links = document.getElementById('pattoLinks');
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
    
    if (keys.foto && patto[keys.foto] && patto[keys.foto].trim() !== '') {
        document.getElementById('photoContainer').classList.remove('hidden');
        const photo = document.getElementById('pattoPhoto');
        const fotoUrl = patto[keys.foto].trim();
        
        photo.onload = function() {
            console.log('Immagine caricata con successo:', fotoUrl);
        };
        
        photo.onerror = function() {
            console.error('Errore nel caricamento dell\'immagine:', fotoUrl);
            document.getElementById('photoContainer').classList.add('hidden');
            showNotification('Impossibile caricare l\'immagine', 'warning');
        };
        
        photo.src = fotoUrl;
        photo.alt = patto[keys.titolo] || 'Foto patto';
    } else {
        document.getElementById('photoContainer').classList.add('hidden');
    }
    
    setTimeout(() => {
        if (miniMap) {
            miniMap.remove();
        }
        
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
    }, 100);
    
    document.getElementById('pattoModal').classList.remove('hidden');
    document.getElementById('pattoModal').classList.add('flex');
    
    map.setView([patto.lat, patto.lng], 16);
    
    lucide.createIcons();
}

// ==========================================
// AUTOCOMPLETAMENTO CORRETTI - FIXED
// ==========================================

function setupAutocompleteEventListeners() {
    const input = document.getElementById('filterTitolo');
    const suggestions = document.getElementById('autocompleteSuggestions');
    const searchCard = document.querySelector('.search-filter');
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        currentSuggestionIndex = -1;
        
        updateFilterAppearance(this, this.value);
        
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            searchCard.classList.remove('active-search');
            return;
        }
        
        const filtered = autocompleteData.filter(item => 
            item.toLowerCase().includes(query)
        ).slice(0, 8);
        
        if (filtered.length === 0) {
            suggestions.classList.add('hidden');
            searchCard.classList.remove('active-search');
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
                searchCard.classList.remove('active-search');
                updateFilterAppearance(input, input.value);
                applyFilters();
            });
            suggestions.appendChild(div);
        });
        
        suggestions.classList.remove('hidden');
        searchCard.classList.add('active-search');
        
        // Scrolla la card nella vista
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                searchCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
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
                searchCard.classList.remove('active-search');
            }
        } else if (e.key === 'Escape') {
            suggestions.classList.add('hidden');
            searchCard.classList.remove('active-search');
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
            searchCard.classList.remove('active-search');
        }
    });
}

// ==========================================
// EVENT LISTENERS CORRETTI - FIXED
// ==========================================

function setupEventListeners() {
    // MOBILE TOGGLE ENHANCED
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
    }
    
    // CHART TYPE SELECTOR
    document.getElementById('chartTypeSelector').addEventListener('change', function() {
        currentChartType = this.value;
        updateChart();
        updateChartInterface();
    });
    
    // FILTRI CORRETTI CON CALLBACK BADGE UPDATE
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                applyFilters();
                if (['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].includes(id)) {
                    setTimeout(() => updateFilters(), 50);
                }
            });
        }
    });
    
    // Event listener per ricerca con debounce
    const searchInput = document.getElementById('filterTitolo');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300); // Debounce di 300ms
        });
    }
    
    // INFO MODAL
    document.getElementById('infoBtn').addEventListener('click', () => {
        document.getElementById('infoModal').classList.remove('hidden');
        document.getElementById('infoModal').classList.add('flex');
    });
    
    document.getElementById('closeInfoModal').addEventListener('click', () => {
        document.getElementById('infoModal').classList.add('hidden');
        document.getElementById('infoModal').classList.remove('flex');
    });
    
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) {
            document.getElementById('closeInfoModal').click();
        }
    });
    
    // SETUP AUTOCOMPLETAMENTO
    setupAutocompleteEventListeners();
    
    // CLEAR FILTERS ENHANCED
    document.getElementById('clearFilters').addEventListener('click', resetAllFilters);
    
    // CENTRA MAPPA
    document.getElementById('centerPalermo').addEventListener('click', centerMapOnPalermo);
    
    // LAYER MENU
    document.getElementById('layerToggle').addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('layerMenu');
        menu.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('layerMenu');
        const toggle = document.getElementById('layerToggle');
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
    
    document.getElementById('mapStandard').addEventListener('click', () => {
        switchMapLayer('standard');
        document.getElementById('layerMenu').classList.add('hidden');
    });
    document.getElementById('mapSatellite').addEventListener('click', () => {
        switchMapLayer('satellite');
        document.getElementById('layerMenu').classList.add('hidden');
    });
    
    // TABLE MODAL
    document.getElementById('showTableBtn').addEventListener('click', () => {
        updateTable();
        document.getElementById('tableModal').classList.remove('hidden');
        document.getElementById('tableModal').classList.add('flex');
    });
    
    document.getElementById('closeTableModal').addEventListener('click', () => {
        document.getElementById('tableModal').classList.add('hidden');
        document.getElementById('tableModal').classList.remove('flex');
    });
    
    document.getElementById('tableModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('tableModal')) {
            document.getElementById('closeTableModal').click();
        }
    });
    
    // DETAIL MODAL
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('pattoModal').classList.add('hidden');
        document.getElementById('pattoModal').classList.remove('flex');
        if (miniMap) {
            miniMap.remove();
            miniMap = null;
        }
    });
    
    document.getElementById('pattoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('pattoModal')) {
            document.getElementById('closeModal').click();
        }
    });
    
    setupFiltersPopupEventListeners();
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-[11000] fade-in text-sm ${
        type === 'info' ? 'bg-blue-500 text-white' : 
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'warning' ? 'bg-yellow-500 text-white' : 
        'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2500);
}

function switchMapLayer(layer) {
    currentMapLayer = layer;
    
    document.getElementById('mapStandard').className = layer === 'standard' 
        ? 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white'
        : 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    document.getElementById('mapSatellite').className = layer === 'satellite' 
        ? 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white'
        : 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    const tileLayer = layer === 'satellite'
        ? L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
        })
        : L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. map data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> under ODbL - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
        });
    
    tileLayer.addTo(map);
}

function setupAutoUpdate() {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 14 && now.getMinutes() === 45) {
            loadData();
        }
    }, 60000);
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

// GLOBAL FUNCTION EXPORT
window.showPattoDetails = showPattoDetails;
window.toggleFilterCard = toggleFilterCard;
window.updateFilterBadges = updateFilterBadges;
window.resetAllFilters = resetAllFilters;