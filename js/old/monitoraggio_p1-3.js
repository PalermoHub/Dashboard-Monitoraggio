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
// GESTIONE POPUP FILTRI - NUOVE FUNZIONI
// ==========================================

/**
 * Aggiorna il popup dei filtri attivi
 * Mostra i filtri applicati e il numero di risultati
 */
function updateFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    const title = document.getElementById('filtersPopupTitle');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    // Controllo esistenza elementi
    if (!popup || !title || !activeFiltersText) {
        console.warn('Elementi popup filtri non trovati');
        return;
    }
    
    // Raccogli filtri attivi
    const filters = {};
    const stato = document.getElementById('filterStato')?.value?.trim() || '';
    const upl = document.getElementById('filterUpl')?.value?.trim() || '';
    const quartiere = document.getElementById('filterQuartiere')?.value?.trim() || '';
    const circoscrizione = document.getElementById('filterCircoscrizione')?.value?.trim() || '';
    const titolo = document.getElementById('filterTitolo')?.value?.trim() || '';
    
    // Costruisci oggetto filtri attivi
    if (stato) filters['Stato'] = stato;
    if (upl) filters['UPL'] = upl;
    if (quartiere) filters['Quartiere'] = quartiere;
    if (circoscrizione) filters['Circoscrizione'] = circoscrizione;
    if (titolo) filters['Titolo'] = `"${titolo}"`;
    if (proponenteFilter && proponenteFilter.trim()) filters['Proponente'] = proponenteFilter;
    
    const activeFilters = Object.keys(filters);
    
    // Se non ci sono filtri attivi, nascondi il popup
    if (activeFilters.length === 0) {
        hideFiltersPopup();
        return;
    }
    
    // Aggiorna il titolo con il numero reale di risultati
    const filteredCount = filteredData ? filteredData.length : 0;
    const totalCount = allData ? allData.length : 0;
    
    // Testo dinamico basato sui risultati
    let titleText;
    if (filteredCount === 0) {
        titleText = 'Nessuna richiesta trovata';
    } else if (filteredCount === 1) {
        titleText = 'È stata selezionata 1 richiesta';
    } else {
        titleText = `Sono state selezionate ${filteredCount} richieste`;
    }
    
    // Aggiungi informazione sul totale se significativa
    if (filteredCount > 0 && filteredCount < totalCount) {
        titleText += ` di ${totalCount}`;
    }
    
    title.textContent = titleText;
    
    // Crea i tag dei filtri con truncate intelligente
    const filterTags = activeFilters.map(filterName => {
        const value = filters[filterName];
        let displayValue = value;
        
        // Truncate per valori lunghi
        if (value.length > 25) {
            displayValue = value.substring(0, 22) + '...';
        }
        
        return `<span class="filter-tag" title="${filterName}: ${value}">${filterName}: ${displayValue}</span>`;
    }).join('');
    
    // Aggiorna il testo dei filtri
    if (filterTags) {
        activeFiltersText.innerHTML = filterTags;
    } else {
        activeFiltersText.textContent = 'Nessun filtro attivo';
    }
    
    // Mostra il popup con animazione
    showFiltersPopup();
    
    console.log(`Popup filtri aggiornato: ${activeFilters.length} filtri, ${filteredCount} risultati`);
}

/**
 * Mostra il popup filtri
 */
function showFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    // Rimuovi eventuali classi precedenti
    popup.classList.remove('hide');
    
    // Forza un reflow per assicurare l'animazione
    popup.offsetHeight;
    
    // Aggiungi classe show
    popup.classList.add('show');
    
    // Aggiorna z-index per assicurare che sia sopra altri elementi
    popup.style.zIndex = '1110';
}

/**
 * Nasconde il popup filtri
 */
function hideFiltersPopup() {
    const popup = document.getElementById('filtersPopup');
    if (!popup) return;
    
    popup.classList.remove('show');
    
    // Facoltativo: aggiungi una transizione di uscita
    setTimeout(() => {
        if (!popup.classList.contains('show')) {
            popup.style.zIndex = '';
        }
    }, 300);
}

/**
 * Reset completo dei filtri dal popup
 */
function resetFiltersFromPopup() {
    console.log('Reset filtri dal popup');
    
    // Reset di tutti i filtri
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            // Rimuovi evidenziazione visiva
            updateFilterAppearance(element, '');
        }
    });
    
    // Reset del filtro proponente nascosto
    proponenteFilter = '';
    
    // Nascondi suggerimenti autocomplete
    const suggestions = document.getElementById('autocompleteSuggestions');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    
    // Reset dei dati filtrati
    filteredData = [...allData];
    
    // Aggiorna tutte le viste
    updateFilters();
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    
    // Nascondi il popup
    hideFiltersPopup();
    
    // Mostra notifica
    showNotification('Tutti i filtri sono stati rimossi', 'info');
}

/**
 * Setup event listeners per il popup filtri
 * Da chiamare durante l'inizializzazione
 */
function setupFiltersPopupEventListeners() {
    // Event listener per il reset dal popup
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFiltersFromPopup);
        console.log('Event listener popup reset configurato');
    } else {
        console.warn('Pulsante reset popup non trovato');
    }
    
    // Event listener per chiudere il popup con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('filtersPopup');
            if (popup && popup.classList.contains('show')) {
                hideFiltersPopup();
            }
        }
    });
}

/**
 * Inizializza il popup filtri in modo sicuro
 * Chiama questa funzione dopo che tutto è caricato
 */
function initializeFiltersPopup() {
    // Attendi che il DOM sia completamente caricato
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFiltersPopup);
        return;
    }
    
    console.log('Inizializzazione popup filtri...');
    
    // Verifica che gli elementi esistano
    const popup = document.getElementById('filtersPopup');
    if (!popup) {
        console.error('Elemento popup filtri non trovato. Assicurati di aver aggiunto l\'HTML.');
        return;
    }
    
    // Setup event listeners
    setupFiltersPopupEventListeners();
    
    // Crea icone Lucide se disponibile
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }
    
    console.log('Popup filtri inizializzato con successo');
}

// Setup per filtri collassabili individuali
function setupCollapsibleFilters() {
    const filterGroups = document.querySelectorAll('.filter-group');
    
    filterGroups.forEach(group => {
        const header = group.querySelector('.filter-group-header');
        const content = group.querySelector('.filter-group-content');
        const formElement = content.querySelector('select, input');
        
        if (header && content && formElement) {
            // Inizializza lo stato in base al valore
            updateFilterGroupState(group, formElement);
            
            header.addEventListener('click', function(e) {
                // Non collassare se il click è su un elemento interattivo
                if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || 
                    e.target.closest('select') || e.target.closest('input')) {
                    return;
                }
                
                group.classList.toggle('collapsed');
                
                // Se si sta espandendo, assicurati che sia visibile
                if (!group.classList.contains('collapsed')) {
                    setTimeout(() => {
                        formElement.focus();
                    }, 300);
                }
            });
            
            // Previeni la propagazione del click per elementi interattivi
            if (formElement) {
                formElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Aggiorna lo stato quando il valore cambia
                formElement.addEventListener('change', function() {
                    updateFilterGroupState(group, this);
                });
                
                formElement.addEventListener('input', function() {
                    updateFilterGroupState(group, this);
                });
            }
        }
    });
    
    // Espandi automaticamente il filtro quando viene interagito
    document.querySelectorAll('.filter-select, .filter-input').forEach(element => {
        element.addEventListener('focus', function() {
            const group = this.closest('.filter-group');
            if (group && group.classList.contains('collapsed')) {
                group.classList.remove('collapsed');
            }
        });
    });
}

// Aggiorna lo stato visivo del gruppo filtro
function updateFilterGroupState(group, formElement) {
    const hasValue = formElement.value !== '' && formElement.value !== null;
    
    if (hasValue) {
        group.classList.add('has-value');
        
        // Aggiungi badge con il valore selezionato (per i select)
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
        
        // Rimuovi badge se presente
        const badge = group.querySelector('.filter-value-badge');
        if (badge) {
            badge.remove();
        }
    }
}

// Fix per la ricerca intelligente (autocomplete)
function fixAutocomplete() {
    const input = document.getElementById('filterTitolo');
    const suggestions = document.getElementById('autocompleteSuggestions');
    
    if (!input || !suggestions) return;
    
    // Sostituisci il listener esistente
    input.removeEventListener('input', window.originalInputHandler);
    
    window.originalInputHandler = function() {
        const query = this.value.toLowerCase();
        currentSuggestionIndex = -1;
        
        // Aggiorna aspetto filtro
        updateFilterAppearance(this, this.value);
        
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            updateSearchFilterHeight(); // Aggiorna altezza quando i suggerimenti vengono nascosti
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
        // Aggiorna l'altezza della card quando i suggerimenti vengono mostrati
        updateSearchFilterHeight();
    };
    
    input.addEventListener('input', window.originalInputHandler);
}

// ==========================================
// INIZIALIZZAZIONE PRINCIPALE
// ==========================================

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initializeMap();
    loadData();
    setupEventListeners();
    setupAutoUpdate();
    handleViewportResize();
    
    // Inizializza popup filtri
    initializeFiltersPopup();
    
    // Inizializza filtri collassabili
    setupCollapsibleFilters();
});

// Gestione resize viewport
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

// Inizializzazione mappa con coordinate precise di Palermo - OTTIMIZZATA
function initializeMap() {
    map = L.map('map', {
        maxBounds: PALERMO_BOUNDS,
        maxZoom: 18,
        minZoom: 11,
        zoomControl: true,
        preferCanvas: true // Migliora performance
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

// Funzione per centrare la mappa su Palermo
function centerMapOnPalermo() {
    map.setView(PALERMO_CENTER, 13);
    showNotification('Mappa centrata sul Centro Storico', 'info');
}

// Aggiornamento tabella - OTTIMIZZATO
function updateTable() {
    if (!filteredData || filteredData.length === 0) {
        document.getElementById('tableCount').textContent = '0';
        document.getElementById('tableHeader').innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
        document.getElementById('tableBody').innerHTML = '';
        return;
    }

    // Campi da escludere - lista più specifica e completa
    const excludedFields = [
        'foto', 'googlemaps', 'geouri', 'upl',
        'lat.', 'long.', 'lat', 'lng', 'coordinate',
        'quartiere', 'circoscrizione'  // Rimuovo anche questi per semplificare
    ];
    
    // Ordine specifico delle colonne
    const columnOrder = [
        'id',
        'titolo proposta', 
        'proponente',
        'rappresentante',
        'indirizzo',
        'stato di avanzamento',
        'nota per attività conclusive'
    ];
    
    // Ottieni tutte le chiavi disponibili
    const allKeys = Object.keys(filteredData[0]);
    
    // Filtra le chiavi escludendo quelle non desiderate con controlli più rigidi
    const filteredKeys = allKeys.filter(key => {
        const keyLower = key.toLowerCase().trim();
        return !excludedFields.some(excluded => {
            const excludedLower = excluded.toLowerCase().trim();
            return keyLower === excludedLower || 
                   keyLower.includes(excludedLower) || 
                   excludedLower.includes(keyLower);
        });
    });
    
    // Ordina le chiavi secondo l'ordine specificato
    const orderedKeys = [];
    
    // Prima aggiungi le chiavi nell'ordine specificato
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
    
    // Poi aggiungi le chiavi rimanenti che non sono nell'ordine specificato
    filteredKeys.forEach(key => {
        if (!orderedKeys.includes(key)) {
            orderedKeys.push(key);
        }
    });

    // Aggiorna conteggio
    document.getElementById('tableCount').textContent = filteredData.length;

    // Crea header tabella
    const tableHeader = document.getElementById('tableHeader');
    tableHeader.innerHTML = '';
    
    orderedKeys.forEach(key => {
        const th = document.createElement('th');
        th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = key;
        tableHeader.appendChild(th);
    });

    // Aggiungi colonna azioni
    const actionTh = document.createElement('th');
    actionTh.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    actionTh.textContent = 'Azioni';
    tableHeader.appendChild(actionTh);

    // Crea body tabella
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        orderedKeys.forEach(key => {
            const td = document.createElement('td');
            td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
            
            let value = item[key] || 'N/A';
            
            // Formattazione speciale per stato
            if (key.toLowerCase().includes('stato')) {
                const color = statusColors[value] || '#6b7280';
                td.innerHTML = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${value}</span>`;
            } else {
                // Limita lunghezza testo per celle troppo lunghe
                if (value.toString().length > 40) {
                    td.innerHTML = `<span title="${value}">${value.toString().substring(0, 37)}...</span>`;
                } else {
                    td.textContent = value;
                }
            }
            
            row.appendChild(td);
        });

        // Aggiungi cella azioni
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

    // Ricrea le icone per i nuovi elementi
    lucide.createIcons();
}

// Caricamento dati - OTTIMIZZATO
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
        
        // Nascondi popup filtri al caricamento
        hideFiltersPopup();
        
        // Inizializza ricerca intelligente dopo caricamento dati
        setTimeout(() => {
            if (typeof initializeSmartSearchIntegrated === 'function') {
                initializeSmartSearchIntegrated();
                console.log('🔗 Ricerca intelligente integrata inizializzata');
            }
        }, 500);
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati. Riprova più tardi.');
    }
}

// Parser CSV migliorato
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

// Parser per singola riga CSV
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

// Setup autocompletamento
function setupAutocomplete() {
    const titoloKey = Object.keys(allData[0] || {}).find(key => 
        key.toLowerCase().includes('titolo') && key.toLowerCase().includes('proposta')
    );
    
    if (titoloKey) {
        autocompleteData = [...new Set(allData.map(item => item[titoloKey]).filter(Boolean))].sort();
    }
}

// Aggiornamento filtri con evidenziazione visiva - OTTIMIZZATO
function updateFilters() {
    console.log('Aggiornamento filtri...');
    
    const filterMappings = [
        { id: 'filterStato', key: 'Stato di avanzamento' },
        { id: 'filterUpl', key: 'UPL' },
        { id: 'filterQuartiere', key: 'Quartiere' },
        { id: 'filterCircoscrizione', key: 'Circoscrizione' }
    ];

    // Ottieni i valori attualmente selezionati
    const currentFilters = {
        stato: document.getElementById('filterStato').value,
        upl: document.getElementById('filterUpl').value,
        quartiere: document.getElementById('filterQuartiere').value,
        circoscrizione: document.getElementById('filterCircoscrizione').value
    };

    console.log('Filtri correnti:', currentFilters);

    filterMappings.forEach(({ id, key }) => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        
        // Evidenzia visivamente se il filtro è attivo
        updateFilterAppearance(select, currentValue);
        
        // Pulisci opzioni esistenti (tranne la prima)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Trova la chiave corretta nel dataset
        const actualKey = Object.keys(allData[0] || {}).find(k => 
            k.toLowerCase().trim() === key.toLowerCase().trim()
        );

        if (!actualKey) {
            console.warn(`Chiave non trovata per ${key}`);
            return;
        }

        // Per i filtri geografici, applica la logica cascata
        let dataToFilter = [...allData];
        
        if (['filterUPL', 'filterQuartiere', 'filterCircoscrizione'].includes(id)) {
            
            // Applica filtro circoscrizione se selezionato e non è il filtro corrente
            if (currentFilters.circoscrizione && id !== 'filterCircoscrizione') {
                const circKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim().includes('circoscrizione')
                );
                if (circKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[circKey] && item[circKey].trim() === currentFilters.circoscrizione.trim()
                    );
                    console.log(`Filtro circoscrizione applicato: ${dataToFilter.length} elementi`);
                }
            }
            
            // Applica filtro quartiere se selezionato e non è il filtro corrente
            if (currentFilters.quartiere && id !== 'filterQuartiere') {
                const quartKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim().includes('quartiere')
                );
                if (quartKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[quartKey] && item[quartKey].trim() === currentFilters.quartiere.trim()
                    );
                    console.log(`Filtro quartiere applicato: ${dataToFilter.length} elementi`);
                }
            }
            
            // Applica filtro UPL se selezionato e non è il filtro corrente
            if (currentFilters.upl && id !== 'filterUPL') {
                const uplKey = Object.keys(allData[0] || {}).find(k => 
                    k.toLowerCase().trim() === 'upl'
                );
                if (uplKey) {
                    dataToFilter = dataToFilter.filter(item => 
                        item[uplKey] && item[uplKey].trim() === currentFilters.upl.trim()
                    );
                    console.log(`Filtro UPL applicato: ${dataToFilter.length} elementi`);
                }
            }
        }
        
        // Ottieni valori unici dai dati filtrati
        const uniqueValues = [...new Set(
            dataToFilter
                .map(item => item[actualKey])
                .filter(value => value && value.toString().trim() !== '')
                .map(value => value.toString().trim())
        )].sort();
        
        console.log(`Valori unici per ${key}:`, uniqueValues);
        
        // Popola il select
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        
        // Mantieni la selezione se il valore è ancora valido
        if (uniqueValues.includes(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = '';
            console.log(`Valore ${currentValue} non più valido per ${key}, resettato`);
        }
        
        // Aggiorna l'aspetto dopo aver impostato il valore
        updateFilterAppearance(select, select.value);
        
        // Aggiungi event listener per il cambio di valore (solo se non è già stato aggiunto)
        if (!select.hasAttribute('data-listener-added')) {
            select.addEventListener('change', function() {
                console.log(`Filtro ${key} cambiato:`, this.value);
                if (typeof applyFiltersUnified === 'function') {
                    applyFiltersUnified();
                } else {
                    applyFilters();
                }
            });
            select.setAttribute('data-listener-added', 'true');
        }
    });
}

// Funzione per evidenziare filtri attivi
function updateFilterAppearance(selectElement, value) {
    if (value && value.trim() !== '') {
        // Filtro attivo
        selectElement.classList.remove('border-gray-300');
        selectElement.classList.add('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
        selectElement.style.fontWeight = '600';
    } else {
        // Filtro inattivo
        selectElement.classList.remove('border-blue-500', 'bg-blue-50', 'ring-1', 'ring-blue-200');
        selectElement.classList.add('border-gray-300');
        selectElement.style.fontWeight = 'normal';
    }
}

// Applicazione filtri con confronto esatto - OTTIMIZZATO CON FILTRO PROPONENTE E POPUP
function applyFilters() {
    const filters = {
        stato: document.getElementById('filterStato').value.trim(),
        upl: document.getElementById('filterUpl').value.trim(),
        quartiere: document.getElementById('filterQuartiere').value.trim(),
        circoscrizione: document.getElementById('filterCircoscrizione').value.trim(),
        titolo: document.getElementById('filterTitolo').value.toLowerCase().trim(),
        proponente: proponenteFilter.trim() // Filtro nascosto
    };
    
    console.log('Applicando filtri (incluso proponente):', filters);
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        // Confronto esatto invece di includes per evitare falsi positivi
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const titoloMatch = !filters.titolo || (item[titoloKey] && item[titoloKey].toLowerCase().includes(filters.titolo));
        const proponenteMatch = !filters.proponente || (item[proponenteKey] && item[proponenteKey].trim() === filters.proponente);
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && titoloMatch && proponenteMatch;
    });
    
    console.log(`Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
    // Aggiorna l'aspetto di tutti i filtri
    ['filterStato', 'filterUPL', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        const element = document.getElementById(id);
        updateFilterAppearance(element, element.value);
    });
    
    // Aggiorna anche il campo titolo
    const titoloField = document.getElementById('filterTitolo');
    updateFilterAppearance(titoloField, titoloField.value);
    
    updateMap();
    updateStatistics();
    updateChart();
    updateTable();
    
    // *** AGGIORNAMENTO POPUP FILTRI ***
    updateFiltersPopup();
}

// Aggiornamento mappa - OTTIMIZZATO per performance
function updateMap() {
    markersLayer.clearLayers();
    
    filteredData.forEach(patto => {
        const statoKey = Object.keys(patto).find(k => k.toLowerCase().includes('stato'));
        const stato = patto[statoKey] || '';
        const color = statusColors[stato] || '#6b7280';
        
        const marker = L.circleMarker([patto.lat, patto.lng], {
            radius: 6, // Ridotto per performance
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
    
    // Centra la mappa sui dati filtrati
    centerMapOnFilteredData();
}

// Centra la mappa sui dati filtrati
function centerMapOnFilteredData() {
    if (filteredData.length === 0) {
        // Se non ci sono dati filtrati, mostra tutto Palermo
        map.setView(PALERMO_CENTER, 13);
        return;
    }

    if (filteredData.length === 1) {
        // Se c'è un solo punto, centralo
        map.setView([filteredData[0].lat, filteredData[0].lng], 16);
        return;
    }

    // Se ci sono più punti, calcola i bounds
    const coordinates = filteredData.map(item => [item.lat, item.lng]);
    const bounds = L.latLngBounds(coordinates);
    
    // Aggiungi un po' di padding ai bounds
    map.fitBounds(bounds, { padding: [15, 15] });
}

// Aggiornamento statistiche basato sui dati filtrati - OTTIMIZZATO
function updateStatistics() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    
    // Calcola tutto basandosi sui dati filtrati
    const total = filteredData.length;
    const stipulati = filteredData.filter(p => p[statoKey] === 'Patto stipulato').length;
    const istruttoria = filteredData.filter(p => p[statoKey] === 'Istruttoria in corso').length;
    const attesaIntegrazione = filteredData.filter(p => p[statoKey] === 'In attesa di integrazione').length;
    const monitoraggio = filteredData.filter(p => p[statoKey] === 'Proroga e/o Monitoraggio e valutazione dei risultati').length;
    const respinti = filteredData.filter(p => p[statoKey] === 'Respinta').length;
    
    // Aggiorna i contatori con animazione
    updateCounterWithAnimation('totalPatti', total);
    updateCounterWithAnimation('pattiStipulati', stipulati);
    updateCounterWithAnimation('pattiIstruttoria', istruttoria);
    updateCounterWithAnimation('pattiAttesaIntegrazione', attesaIntegrazione);
    updateCounterWithAnimation('pattiMonitoraggio', monitoraggio);
    updateCounterWithAnimation('pattiRespinti', respinti);
    
    console.log('Statistiche aggiornate:', { total, stipulati, istruttoria, attesaIntegrazione, monitoraggio, respinti });
}

// Funzione per animare i contatori - OTTIMIZZATA
function updateCounterWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    
    if (currentValue === newValue) return;
    
    // Animazione semplificata per performance
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

// === NUOVE FUNZIONI PER GESTIONE GRAFICI MULTIPLI ===

// Funzione per aggiornare l'interfaccia del grafico
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
    
    // Aggiorna statistiche
    const totalVisible = filteredData.length;
    const totalOverall = allData.length;
    statsElement.textContent = `Stai visualizzando ${totalVisible} di ${totalOverall} richieste`;
}

// Funzione principale per aggiornamento grafico - SOSTITUISCE LA VECCHIA updateChart
function updateChart() {
    if (currentChartType === 'stato') {
        updateStatusChart();
    } else {
        updateProponenteChart();
    }
    updateChartInterface();
}

// Funzione per il grafico degli stati (versione originale ottimizzata)
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
        // Abbrevia l'etichetta lunga solo per la visualizzazione
        if (label === 'Proroga e/o Monitoraggio e valutazione dei risultati') {
            return 'Proroga e/o Monitoraggio';
        }
        return label;
    });
    const data = Object.values(validStatusCounts);
    const colors = labels.map(label => statusColors[label] || '#6b7280');
    
    createChart(labels, data, colors, 'stato');
}

// Nuova funzione per il grafico dei proponenti
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
    
    // Ordina per numero di occorrenze (decrescente) e prendi i primi 15
    const sortedProponenti = Object.entries(proponenteCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15);
    
    const labels = sortedProponenti.map(([label]) => {
        // Accorcia i nomi troppo lunghi per la visualizzazione
        return label.length > 25 ? label.substring(0, 22) + '...' : label;
    });
    const data = sortedProponenti.map(([,count]) => count);
    
    // Genera colori dinamici per i proponenti
    const colors = generateProponenteColors(data.length);
    
    createChart(labels, data, colors, 'proponente', sortedProponenti.map(([fullLabel]) => fullLabel));
}

// Funzione per generare colori per i proponenti
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
            // Genera colori aggiuntivi con una formula
            const hue = (i * 137.508) % 360; // Golden angle
            colors.push(`hsl(${hue}, 65%, 50%)`);
        }
    }
    return colors;
}

// Funzione unificata per creare i grafici
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
                            // Mostra il nome completo nel tooltip se disponibile
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
                        // Gestione click per proponente
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

// Funzione per applicare il filtro proponente (nascosto)
function applyProponenteFilter(selectedProponente) {
    proponenteFilter = selectedProponente;
    applyFilters();
}

// === FINE NUOVE FUNZIONI GRAFICI ===

// Aggiornamento legenda - OTTIMIZZATO
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

// Aggiornamento ultima modifica
function updateLastUpdate() {
    const now = new Date();
    const formatted = now.toLocaleString('it-IT');
    document.getElementById('lastUpdate').textContent = formatted;
}

// Funzione per gestire le card dei filtri
function toggleFilterCard(cardId) {
    const cardContent = document.getElementById(cardId);
    const cardHeader = cardContent.previousElementSibling;
    const collapseIcon = cardHeader.querySelector('.collapse-icon');
    
    // Toggle della classe expanded
    cardContent.classList.toggle('expanded');
    collapseIcon.classList.toggle('rotated');
    
    // Aggiorna l'aria-expanded per accessibilità
    const isExpanded = cardContent.classList.contains('expanded');
    cardHeader.setAttribute('aria-expanded', isExpanded);
}

// Inizializza le card dei filtri al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    // Inizializza tutte le card come collassate tranne la prima
    const filterCards = document.querySelectorAll('.filter-card-content');
    filterCards.forEach((card, index) => {
        if (index !== 0) {
            card.classList.remove('expanded');
            const collapseIcon = card.previousElementSibling.querySelector('.collapse-icon');
            if (collapseIcon) {
                collapseIcon.classList.remove('rotated');
            }
        }
    });
});

// Setup event listeners
function setupEventListeners() {
    // Event listener per il filtro stato
    const statoFilter = document.getElementById('filterStato');
    if (statoFilter) {
        statoFilter.addEventListener('change', function() {
            console.log('Filtro stato cambiato:', this.value);
            // Chiama direttamente la funzione unificata
            if (typeof applyFiltersUnified === 'function') {
                applyFiltersUnified();
            } else {
                applyFilters();
            }
        });
    }
    
    // Event listener per il reset dei filtri
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (typeof clearAllFiltersIncludingSmart === 'function') {
                clearAllFiltersIncludingSmart();
            } else {
                // Fallback alla funzione originale
                const filterIds = ['filterStato', 'filterUPL', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'];
                filterIds.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.value = '';
                });
                applyFilters();
            }
        });
    }
    
    // Event listener per il tipo di grafico
    const chartTypeSelector = document.getElementById('chartTypeSelector');
    if (chartTypeSelector) {
        chartTypeSelector.addEventListener('change', function() {
            currentChartType = this.value;
            updateChart();
        });
    }
    
    // Event listener per i controlli della mappa
    const centerPalermoBtn = document.getElementById('centerPalermo');
    if (centerPalermoBtn) {
        centerPalermoBtn.addEventListener('click', centerMapOnPalermo);
    }
    
    const layerToggle = document.getElementById('layerToggle');
    if (layerToggle) {
        layerToggle.addEventListener('click', function() {
            const layerMenu = document.getElementById('layerMenu');
            layerMenu.classList.toggle('hidden');
        });
    }
    
    const mapStandard = document.getElementById('mapStandard');
    if (mapStandard) {
        mapStandard.addEventListener('click', function() {
            changeMapLayer('standard');
        });
    }
    
    const mapSatellite = document.getElementById('mapSatellite');
    if (mapSatellite) {
        mapSatellite.addEventListener('click', function() {
            changeMapLayer('satellite');
        });
    }
    
    // Event listener per i modali
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
    
    const closeTableModal = document.getElementById('closeTableModal');
    if (closeTableModal) {
        closeTableModal.addEventListener('click', function() {
            document.getElementById('tableModal').classList.add('hidden');
        });
    }
    
    const showTableBtn = document.getElementById('showTableBtn');
    if (showTableBtn) {
        showTableBtn.addEventListener('click', function() {
            document.getElementById('tableModal').classList.remove('hidden');
        });
    }
    
    // Event listener per il mobile toggle
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    if (mobileFiltersToggle) {
        mobileFiltersToggle.addEventListener('click', function() {
            document.getElementById('filtersContent').classList.toggle('hidden');
        });
    }
}

// Funzione per cambiare il layer della mappa
function changeMapLayer(layer) {
    if (layer === 'satellite') {
        // Cambia a satellite (implementazione specifica necessaria)
        showNotification('Layer satellite non disponibile', 'warning');
    } else {
        // Cambia a standard
        showNotification('Layer standard attivo', 'info');
    }
    
    // Aggiorna l'interfaccia
    document.getElementById('mapStandard').classList.toggle('active', layer === 'standard');
    document.getElementById('mapSatellite').classList.toggle('active', layer === 'satellite');
    
    // Nascondi il menu
    document.getElementById('layerMenu').classList.add('hidden');
}

// Funzione per mostrare i dettagli di un patto
function showPattoDetails(pattoId) {
    // Trova il patto nell'array
    const patto = allData.find(item => {
        const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
        return item[idKey] === pattoId;
    });
    
    if (!patto) {
        showNotification('Patto non trovato', 'error');
        return;
    }
    
    // Popola il modal con i dettagli
    populatePattoModal(patto);
    
    // Mostra il modal
    document.getElementById('pattoModal').classList.remove('hidden');
}

// Funzione per popolare il modal con i dettagli del patto
function populatePattoModal(patto) {
    // Trova le chiavi necessarie
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
    
    // Aggiorna il titolo del modal
    document.getElementById('modalTitle').textContent = patto[titoloKey] || 'Dettagli Patto';
    
    // Popola i dettagli
    const detailsHtml = `
        <div><strong>ID:</strong> ${patto[idKey] || 'N/A'}</div>
        <div><strong>Titolo:</strong> ${patto[titoloKey] || 'N/A'}</div>
        <div><strong>Proponente:</strong> ${patto[proponenteKey] || 'N/A'}</div>
        <div><strong>Rappresentante:</strong> ${patto[rappresentanteKey] || 'N/A'}</div>
        <div><strong>Indirizzo:</strong> ${patto[indirizzoKey] || 'N/A'}</div>
    `;
    document.getElementById('pattoDetails').innerHTML = detailsHtml;
    
    // Aggiorna lo stato
    const stato = patto[statoKey] || 'N/A';
    const color = statusColors[stato] || '#6b7280';
    document.getElementById('pattoStatus').innerHTML = `
        <span style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">
            ${stato}
        </span>
    `;
    
    // Aggiorna le note se presenti
    if (patto[noteKey] && patto[noteKey].trim() !== '') {
        document.getElementById('pattoNotes').textContent = patto[noteKey];
        document.getElementById('pattoNotesContainer').classList.remove('hidden');
    } else {
        document.getElementById('pattoNotesContainer').classList.add('hidden');
    }
    
    // Aggiorna i link se presenti
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
    
    // Aggiorna la foto se presente
    if (patto[fotoKey] && patto[fotoKey].trim() !== '') {
        document.getElementById('pattoPhoto').src = patto[fotoKey];
        document.getElementById('photoContainer').classList.remove('hidden');
    } else {
        document.getElementById('photoContainer').classList.add('hidden');
    }
    
    // Crea la mini mappa
    createMiniMap(patto.lat, patto.lng);
    
    // Ricrea le icone
    lucide.createIcons();
}

// Funzione per creare la mini mappa nel modal
function createMiniMap(lat, lng) {
    // Distruggi la mini mappa esistente se presente
    if (miniMap) {
        miniMap.remove();
    }
    
    // Crea la mini mappa
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
    
    // Aggiungi il tile layer
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(miniMap);
    
    // Aggiungi il marker
    L.marker([lat, lng]).addTo(miniMap);
    
    // Aggiungi un padding per la mini mappa
    setTimeout(() => {
        miniMap.invalidateSize();
    }, 100);
}

// Funzione per mostrare notifiche
function showNotification(message, type = 'info') {
    // Crea l'elemento di notifica
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Aggiungi al body
    document.body.appendChild(notification);
    
    // Mostra la notifica
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Rimuovi la notifica dopo 5 secondi
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Event listener per chiudere la notifica
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Funzione per mostrare errori
function showError(message) {
    showNotification(message, 'error');
}

// Funzione per l'auto-update
function setupAutoUpdate() {
    // Aggiorna ogni 5 minuti
    setInterval(() => {
        updateLastUpdate();
    }, 300000);
}

// Funzione per aggiornare l'altezza della card di ricerca
function updateSearchFilterHeight() {
    const searchCard = document.querySelector('.filter-card:has(#filterTitolo)');
    const suggestions = document.getElementById('autocompleteSuggestions');
    
    if (searchCard && suggestions) {
        if (suggestions.classList.contains('hidden')) {
            searchCard.style.height = '';
        } else {
            const suggestionsHeight = suggestions.offsetHeight;
            searchCard.style.height = `${searchCard.offsetHeight + suggestionsHeight}px`;
        }
    }
}

console.log('Monitoraggio Patti caricato - v2.2');