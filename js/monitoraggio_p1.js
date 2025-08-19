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
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6 ',
    'In attesa di integrazione': '#b3e6ff'
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initializeMap();
    loadData();
    setupEventListeners();
    setupAutoUpdate();
    handleViewportResize();
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
        attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. map data Â© <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> under ODbL - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
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

    // Campi da escludere - lista piÃ¹ specifica e completa
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
        'nota per attivitÃ  conclusive'
    ];
    
    // Ottieni tutte le chiavi disponibili
    const allKeys = Object.keys(filteredData[0]);
    
    // Filtra le chiavi escludendo quelle non desiderate con controlli piÃ¹ rigidi
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
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati. Riprova piÃ¹ tardi.');
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
        
        // Evidenzia visivamente se il filtro Ã¨ attivo
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
        
        if (['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].includes(id)) {
            
            // Applica filtro circoscrizione se selezionato e non Ã¨ il filtro corrente
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
            
            // Applica filtro quartiere se selezionato e non Ã¨ il filtro corrente
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
            
            // Applica filtro UPL se selezionato e non Ã¨ il filtro corrente
            if (currentFilters.upl && id !== 'filterUpl') {
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
        
        // Mantieni la selezione se il valore Ã¨ ancora valido
        if (uniqueValues.includes(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = '';
            console.log(`Valore ${currentValue} non piÃ¹ valido per ${key}, resettato`);
        }
        
        // Aggiorna l'aspetto dopo aver impostato il valore
        updateFilterAppearance(select, select.value);
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

// Applicazione filtri con confronto esatto - OTTIMIZZATO
function applyFilters() {
    const filters = {
        stato: document.getElementById('filterStato').value.trim(),
        upl: document.getElementById('filterUpl').value.trim(),
        quartiere: document.getElementById('filterQuartiere').value.trim(),
        circoscrizione: document.getElementById('filterCircoscrizione').value.trim(),
        titolo: document.getElementById('filterTitolo').value.toLowerCase().trim()
    };
    
    console.log('Applicando filtri:', filters);
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        
        // Confronto esatto invece di includes per evitare falsi positivi
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const titoloMatch = !filters.titolo || (item[titoloKey] && item[titoloKey].toLowerCase().includes(filters.titolo));
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && titoloMatch;
    });
    
    console.log(`Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
    // Aggiorna l'aspetto di tutti i filtri
    ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
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
        // Se c'Ã¨ un solo punto, centralo
        map.setView([filteredData[0].lat, filteredData[0].lng], 16);
        return;
    }

    // Se ci sono piÃ¹ punti, calcola i bounds
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

// Aggiornamento grafico con interattivitÃ  e etichette migliorato - OTTIMIZZATO
function updateChart() {
    const statoKey = Object.keys(allData[0] || {}).find(k => k.toLowerCase().includes('stato'));
    const statusCounts = {};
    
    filteredData.forEach(item => {
        const status = item[statoKey] || 'Non specificato';
        // Filtra stati vuoti, undefined o non validi
        if (status && 
            status.toString().trim() !== '' && 
            status.toString().trim().toLowerCase() !== 'undefined' &&
            status.toString().trim().toLowerCase() !== 'null' &&
            status.toString().trim() !== 'N/A') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });
    
    // Filtra ulteriormente per assicurarsi che non ci siano etichette undefined
    const validStatusCounts = {};
    Object.entries(statusCounts).forEach(([key, value]) => {
        if (key && key.trim() && key.trim().toLowerCase() !== 'undefined') {
            validStatusCounts[key.trim()] = value;
        }
    });
    
    const labels = Object.keys(validStatusCounts);
    const data = Object.values(validStatusCounts);
    const colors = labels.map(label => statusColors[label] || '#6b7280');
    
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
                    top: 20 // Padding ridotto per altezza compatta
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
                            return context[0].label;
                        },
                        label: function(context) {
                            return `Numero di patti: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        font: {
                            size: 9 // Font ridotto
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 9 // Font ridotto
                        },
                        stepSize: 1
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const selectedStatus = labels[index];
                    
                    // Applica filtro per stato selezionato
                    document.getElementById('filterStato').value = selectedStatus;
                    applyFilters();
                    
                    // Feedback visivo
                    showNotification(`Filtro applicato: ${selectedStatus}`);
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
                            ctx.font = 'bold 10px Arial'; // Font ridotto
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            
                            const x = bar.x;
                            const y = bar.y - 6; // Spazio ridotto
                            
                            ctx.fillText(data, x, y);
                        }
                    });
                });
                
                ctx.restore();
            }
        }]
    });
}

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

// Mostra dettagli patto - OTTIMIZZATO
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
    
    // Debug per verificare le chiavi trovate
    console.log('Chiavi trovate per il patto:', keys);
    console.log('Dati patto completi:', patto);
    
    // Aggiorna il contenuto della modale
    document.getElementById('modalTitle').textContent = patto[keys.titolo] || 'Patto senza titolo';
    
    // Dettagli
    const details = document.getElementById('pattoDetails');
    details.innerHTML = `
        <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
        <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
        <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
        <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
        <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
        <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
    `;
    
    // Stato
    const status = document.getElementById('pattoStatus');
    const statoText = patto[keys.stato] || 'Non specificato';
    status.textContent = statoText;
    status.style.backgroundColor = statusColors[statoText] || '#6b7280';
    
    // Note
    if (keys.note && patto[keys.note]) {
        document.getElementById('pattoNotesContainer').classList.remove('hidden');
        document.getElementById('pattoNotes').textContent = patto[keys.note];
    } else {
        document.getElementById('pattoNotesContainer').classList.add('hidden');
    }
    
    // Collegamenti
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
    
    // Foto
    if (keys.foto && patto[keys.foto] && patto[keys.foto].trim() !== '') {
        document.getElementById('photoContainer').classList.remove('hidden');
        const photo = document.getElementById('pattoPhoto');
        const fotoUrl = patto[keys.foto].trim();
        
        // Gestione errori di caricamento immagine
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
    
    // Mini mappa
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
        
        // Invalidate size per assicurarsi che la mappa si dimensioni correttamente
        setTimeout(() => {
            miniMap.invalidateSize();
        }, 100);
    }, 100);
    
    // Mostra modale
    document.getElementById('pattoModal').classList.remove('hidden');
    document.getElementById('pattoModal').classList.add('flex');
    
    // Centra la mappa principale sul patto
    map.setView([patto.lat, patto.lng], 16);
    
    // Ri-crea le icone
    lucide.createIcons();
}

// Setup autocompletamento - OTTIMIZZATO
function setupAutocompleteEventListeners() {
    const input = document.getElementById('filterTitolo');
    const suggestions = document.getElementById('autocompleteSuggestions');
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        currentSuggestionIndex = -1;
        
        // Aggiorna aspetto filtro
        updateFilterAppearance(this, this.value);
        
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }
        
        const filtered = autocompleteData.filter(item => 
            item.toLowerCase().includes(query)
        ).slice(0, 8); // Ridotto per performance
        
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
    
    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
}

// Setup event listeners - OTTIMIZZATO CON MOBILE TOGGLE
function setupEventListeners() {
    // === MOBILE TOGGLE - GESTIONE FILTRI MOBILE ===
    const mobileToggle = document.getElementById('mobileFiltersToggle');
    const filtersContent = document.getElementById('filtersContent');
    
    console.log('Setup mobile toggle:', { mobileToggle, filtersContent });
    
    if (mobileToggle && filtersContent) {
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = filtersContent.classList.contains('open');
            console.log('Mobile toggle clicked, currently open:', isOpen);
            
            if (isOpen) {
                filtersContent.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                console.log('Closing mobile filters');
            } else {
                filtersContent.classList.add('open');
                mobileToggle.setAttribute('aria-expanded', 'true');
                console.log('Opening mobile filters');
            }
            
            console.log('Filter content classes after toggle:', filtersContent.className);
        });
        
        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!mobileToggle.contains(e.target) && !filtersContent.contains(e.target)) {
                if (filtersContent.classList.contains('open')) {
                    console.log('Closing filters due to outside click');
                    filtersContent.classList.remove('open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && filtersContent.classList.contains('open')) {
                console.log('Closing filters due to escape key');
                filtersContent.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    } else {
        console.error('Mobile toggle elements not found:', { mobileToggle, filtersContent });
    }
    
    // === ALTRI EVENT LISTENERS ===
    
    // Filtri - eventi separati per gestire la cascata
    ['filterStato'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
    
    // Filtri geografici con logica cascata
    ['filterUpl', 'filterQuartiere', 'filterCircoscrizione'].forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            console.log(`Filtro ${id} cambiato`);
            applyFilters();
            // Aggiorna i filtri dopo l'applicazione per la cascata
            setTimeout(() => updateFilters(), 50);
        });
    });
    
    // Info modal
    document.getElementById('infoBtn').addEventListener('click', () => {
        document.getElementById('infoModal').classList.remove('hidden');
        document.getElementById('infoModal').classList.add('flex');
    });
    
    document.getElementById('closeInfoModal').addEventListener('click', () => {
        document.getElementById('infoModal').classList.add('hidden');
        document.getElementById('infoModal').classList.remove('flex');
    });
    
    // Chiusura info modal cliccando fuori
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) {
            document.getElementById('closeInfoModal').click();
        }
    });
    
    // Setup autocompletamento
    setupAutocompleteEventListeners();
    
    // Pulisci filtri con reset completo
    document.getElementById('clearFilters').addEventListener('click', () => {
        ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterTitolo'].forEach(id => {
            const element = document.getElementById(id);
            element.value = '';
            updateFilterAppearance(element, '');
        });
        document.getElementById('autocompleteSuggestions').classList.add('hidden');
        
        // Reset dei dati filtrati a tutti i dati
        filteredData = [...allData];
        updateFilters();
        updateMap();
        updateStatistics();
        updateChart();
        updateTable();
        
        showNotification('Filtri resettati', 'info');
    });
    
    // Pulsante centra su Palermo
    document.getElementById('centerPalermo').addEventListener('click', centerMapOnPalermo);
    
    // Menu layer
    document.getElementById('layerToggle').addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('layerMenu');
        menu.classList.toggle('hidden');
    });
    
    // Chiudi menu layer quando si clicca fuori
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('layerMenu');
        const toggle = document.getElementById('layerToggle');
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
    
    // Cambio layer mappa
    document.getElementById('mapStandard').addEventListener('click', () => {
        switchMapLayer('standard');
        document.getElementById('layerMenu').classList.add('hidden');
    });
    document.getElementById('mapSatellite').addEventListener('click', () => {
        switchMapLayer('satellite');
        document.getElementById('layerMenu').classList.add('hidden');
    });
    
    // Popup tabella
    document.getElementById('showTableBtn').addEventListener('click', () => {
        updateTable(); // Aggiorna la tabella prima di mostrarla
        document.getElementById('tableModal').classList.remove('hidden');
        document.getElementById('tableModal').classList.add('flex');
    });
    
    document.getElementById('closeTableModal').addEventListener('click', () => {
        document.getElementById('tableModal').classList.add('hidden');
        document.getElementById('tableModal').classList.remove('flex');
    });
    
    // Chiusura popup tabella cliccando fuori
    document.getElementById('tableModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('tableModal')) {
            document.getElementById('closeTableModal').click();
        }
    });
    
    // Chiusura modale dettagli patto
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('pattoModal').classList.add('hidden');
        document.getElementById('pattoModal').classList.remove('flex');
        if (miniMap) {
            miniMap.remove();
            miniMap = null;
        }
    });
    
    // Chiusura modale cliccando fuori
    document.getElementById('pattoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('pattoModal')) {
            document.getElementById('closeModal').click();
        }
    });
}

// Funzione per mostrare notifiche - OTTIMIZZATA
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

// Cambio layer mappa
function switchMapLayer(layer) {
    currentMapLayer = layer;
    
    // Aggiorna pulsanti
    document.getElementById('mapStandard').className = layer === 'standard' 
        ? 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white'
        : 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    document.getElementById('mapSatellite').className = layer === 'satellite' 
        ? 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white'
        : 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    // Rimuovi layer esistenti
    map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    // Aggiungi nuovo layer
    const tileLayer = layer === 'satellite'
        ? L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
        })
        : L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. map data Â© <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> under ODbL - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano </a> - 2025'
        });
    
    tileLayer.addTo(map);
}

// Setup aggiornamento automatico
function setupAutoUpdate() {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 14 && now.getMinutes() === 45) {
            loadData();
        }
    }, 60000); // Controlla ogni minuto
}

// Funzione per mostrare errori - OTTIMIZZATA
function showError(message) {
    // Crea un toast di errore
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