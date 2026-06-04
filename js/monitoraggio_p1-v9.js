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
window.getProponenteFilter = () => proponenteFilter;
window.setProponenteFilter = (v) => { proponenteFilter = v; };

let allDataMonitoraggio = [];
let uniqueValuesCache = {};

window.chartFilterState = {
    activeChartType: null,      // 'stato', 'proponente', 'ambiti' o null
    activeChartValue: null,     // valore attualmente filtrato dal grafico
    lastUpdateTime: 0,          // timestamp ultimo aggiornamento
    isUpdating: false           // flag per evitare aggiornamenti ricorsivi
};


// Coordinate precise di Palermo 38.11703022953232, 13.373426145815962
const PALERMO_CENTER = [38.1516, 13.3617]; // allineato al pulsante Home
const UFFICIO_COORDS = [38.116946349854494, 13.37317517969414];
const PALERMO_BOUNDS = [
    [37.96, 13.20], // Sud-Ovest — confine Comune di Palermo
    [38.26, 13.50]  // Nord-Est  — confine Comune di Palermo
];



// ==========================================
// FUNZIONE GLOBALE: CHIUDI POPUP E APRI PANNELLO
// ==========================================
function closeMapPopupAndOpenPanel(pattoId) {
    
    try {
        // Chiudi il popup della mappa
        if (map && typeof map.closePopup === 'function') {
            map.closePopup();
        }
        
        // Aspetta un momento e poi apri il pannello
        setTimeout(() => {
            if (typeof window.showPattoDetails === 'function') {
                window.showPattoDetails(pattoId);
            } else {
                console.error('❌ Funzione showPattoDetails non trovata');
            }
        }, 100);
    } catch (error) {
        console.error('❌ Errore nella chiusura popup:', error);
    }
}


// ==========================================
// FUNZIONI HELPER PER SICUREZZA DOM
// ==========================================

function safeAddEventListener(elementId, eventType, handler, description) {
    const element = document.getElementById(elementId);
    
    if (element) {
        element.addEventListener(eventType, handler);
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
    hideFiltersPopup();
}

function resetFiltersFromPopup() {
    resetAllFiltersAndCharts(); // ✅ DELEGA A FUNZIONE CENTRALIZZATA
}

function setupFiltersPopupEventListeners() {
    const resetButton = document.getElementById('filtersPopupReset');
    if (resetButton) {
        resetButton.addEventListener('click', resetFiltersFromPopup);
    }
    
    const closeButton = document.getElementById('filtersPopupClose');
    if (closeButton) {
        closeButton.addEventListener('click', closeFiltersPopupOnly);
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
    
    
    const popup = document.getElementById('filtersPopup');
    if (!popup) {
        console.error('Elemento popup filtri non trovato. Assicurati di aver aggiunto l\'HTML.');
        return;
    }
    
    addCloseButtonToFiltersPopup();
    setupFiltersPopupEventListeners();
    
    
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
    
}


// ==========================================
// CONTROLLI MAPPA MIGLIORATI
// ==========================================

function centerMapOnPalermo() {
    
    if (!map) {
        console.error('Mappa non inizializzata');
        return;
    }
    
    try {
        map.setView(PALERMO_CENTER, 13, {
            animate: true,
            duration: 1.5
        });
        
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
    
    
    
    initializeMap();
    
    // ✅ ATTENDI il caricamento dei dati
    try {
        await loadData();
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
        }
    }, 1500);
});


// ==========================================
// INIZIALIZZAZIONE MAPPA
// ==========================================

function initializeMap() {
    
    try {
        if (map) {
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
        
    } catch (error) {
        console.error('Errore nell\'inizializzazione mappa:', error);
        showNotification('Errore nell\'inizializzazione della mappa', 'error');
    }
}

// ==========================================
// CARICAMENTO E PARSING DATI
// ==========================================
async function loadData() {
    // U6 — overlay caricamento
    const loadingOverlay = document.getElementById('mapLoadingOverlay');
    const errorOverlay   = document.getElementById('mapErrorOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    if (errorOverlay)   errorOverlay.classList.remove('visible');

    try {
        const response = await fetch('dati/monit_patti_pa.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        
        allData = parseCSV(csvText);
        window.allData = allData;
        window.filteredData = [...allData];
        filteredData = [...allData];
        
        setupAutocomplete();
        updateFilters();
        updateMap();
        // Al primo caricamento usa sempre il centro standard (uguale al pulsante Home)
        map.setView(PALERMO_CENTER, 13);
        updateStatistics();
        updateChartDual();
        updateLegend();
        updateLastUpdate();
        updateTable();
        
        hideFiltersPopup();

        // Nasconde overlay al termine
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        console.log('✅ Dati caricati:', allData.length, 'patti');
        document.dispatchEvent(new CustomEvent('patti:dataLoaded'));

    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (errorOverlay)   errorOverlay.classList.add('visible');
    }
}

// Espone la funzione per il bottone "Riprova" (U6)
window.retryLoadData = loadData;



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

    updateAllChartsSynchronized();

}

function updateFilterAppearance(selectElement, value) {
    if (value && value.trim() !== '') {
        selectElement.classList.add('filter-select--active');
    } else {
        selectElement.classList.remove('filter-select--active');
    }
}

function applyFilters() {
    
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
    
    
    // 3️⃣ Aggiorna componenti MAPPA PRIMA (per visibilità)
    updateMap();
    
    updateStatistics();
    
    updateTable();
    
    updateFiltersPopup();
    
    // 4️⃣ ✅ CRUCIALE: Aggiorna grafici SINCRONIZZATI
    updateAllChartsSynchronized();
}


// ==========================================
// AGGIORNAMENTO MAPPA - FUNZIONE COMPLETA
// ==========================================

function updateMap() {
    
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
            <div class="map-popup-card">
                <h3 class="map-popup-title">${titolo}</h3>
                <div class="map-popup-meta">
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
                <button onclick="closeMapPopupAndOpenPanel('${patto[idKey]}');" class="map-popup-btn">
                    Vedi dettagli
                </button>
            </div>
        `;
        
        // ==========================================
        // GESTIONE CLICK SUL MARKER
        // ==========================================
        marker.on('click', function(e) {

            // 🔄 CHIUDI TUTTI GLI ALTRI POPUP PRIMA DI APRIRE QUESTO
            if (map && typeof map.closePopup === 'function') {
                map.closePopup();
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
        });
        
        // ==========================================
        // GESTIONE CHIUSURA POPUP
        // ==========================================
        marker.on('popupclose', function() {
        });
    });
    
    
    // Centra la mappa sui dati filtrati
    centerMapOnFilteredData();
}

// ==========================================
// FUNZIONE SUPPORTO: CENTRA MAPPA SUI DATI FILTRATI
// ==========================================



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
    const uniqueStati = [...new Set(filteredData.map(p => p[statoKey]).filter(Boolean))];
    
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
                
                
                // ✅ LOGICA: Se clicchi lo STESSO valore su STESSO grafico = RESET
                if (window.chartFilterState.activeChartType === type && 
                    window.chartFilterState.activeChartValue === clickedValue) {
                    
                    resetAllFiltersAndCharts();
                    return;
                }
                
                // ✅ Nuovo filtro: Aggiorna stato centralizzato
                window.chartFilterState.activeChartType = type;
                window.chartFilterState.activeChartValue = clickedValue;
                
                
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
    
    // 1️⃣ Reset stato grafici COMPLETAMENTE
    window.chartFilterState.activeChartType = null;
    window.chartFilterState.activeChartValue = null;
    window.chartFilterState.isUpdating = false;
    window.chartFilterState.lastUpdateTime = 0;

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
        }
    });
    
    // 3️⃣ Reset variabili globali filtri
    proponenteFilter = '';
    const suggestions = document.getElementById('autocompleteSuggestions');
    if (suggestions) {
        suggestions.classList.add('hidden');
    }
    
    // 4️⃣ Ripristina dati originali (COPIA PROFONDA)
    filteredData = JSON.parse(JSON.stringify(allData));
    
    // 5️⃣ Aggiorna TUTTO in sequenza CORRETTA
    
    try {
        updateFilters();
        updateMap();
        updateStatistics();
        updateTable();
        hideFiltersPopup();
        
        
        // 6️⃣ Aggiorna grafici SINCRONIZZATI
        updateAllChartsSynchronized();
        
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
        proponenteFilter = value;
        
        // 🆕 NUOVO: Aggiorna anche il campo ricerca se esiste
        const searchInput = document.getElementById('filterTitolo');
        if (searchInput && proponenteFilter) {
            // Nota: Non cambiamo il titolo, solo logghiamo
        }
        
    } else if (filterMap[chartType]) {
        const filterEl = document.getElementById(filterMap[chartType]);
        if (filterEl) {
            filterEl.value = value;
            updateFilterAppearance(filterEl, value);
        } else {
            console.warn(`⚠️ Elemento filtro ${filterMap[chartType]} non trovato`);
        }
    }
    
    // 🔥 FONDAMENTALE: Applica i filtri e aggiorna TUTTO in sequenza
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


// ==========================================
// GESTIONE TABELLA
// ==========================================

function updateTable() {
    
    try {
        if (!filteredData || filteredData.length === 0) {
            
            const tableCount = document.getElementById('tableCount');
            const tableHeader = document.getElementById('tableHeader');
            const tableBody = document.getElementById('tableBody');
            
            if (tableCount) tableCount.textContent = '0';
            if (tableHeader) tableHeader.innerHTML = '<th class="tbl-th">Nessun dato disponibile</th>';
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


        // === AGGIORNA CONTATORE ===
        const tableCount = document.getElementById('tableCount');
        if (tableCount) {
            tableCount.textContent = filteredData.length;
        }

        // === AGGIORNA HEADER ===
        const tableHeader = document.getElementById('tableHeader');
        if (tableHeader) {
            tableHeader.innerHTML = '';
            
            orderedKeys.forEach(key => {
                const th = document.createElement('th');
                th.className = 'tbl-th';
                th.textContent = key;
                tableHeader.appendChild(th);
            });

            const actionTh = document.createElement('th');
            actionTh.className = 'tbl-th';
            actionTh.textContent = 'Azioni';
            tableHeader.appendChild(actionTh);
            
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
                        td.className = 'tbl-td';
                        
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
                                const color = statusColors['Patto stipulato'] || '#10b981';
                                
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
                    actionTd.className = 'tbl-td-action';
                    
                    const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
                    actionTd.innerHTML = `
                        <button onclick="showPattoDetails('${item[idKey]}')" 
                                class="tbl-btn-detail">
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

        } else {
            console.error('❌ Elemento #tableBody non trovato');
        }
        
        
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
                
                // ✅ Reset stato grafico quando cambi manualmente filtri
                if (window.chartFilterState.activeChartType !== null) {
                    window.chartFilterState.activeChartType = null;
                    window.chartFilterState.activeChartValue = null;
                }
                
                // 🔥 Applica i filtri (che a sua volta chiama updateAllChartsSynchronized)
                applyFilters();
                
                // Aggiorna i dropdown in cascata
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

    // === FILTRO AMBITI ===
    totalAttempts++;
    if (safeAddEventListener('filterAmbiti', 'change', function() {
        
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
        resetAllFiltersAndCharts();
    }, 'Reset filtri')) {
        successCount++;
    }
    
    // Controlli mappa gestiti da map-controls_layer.js
    
    // === MOSTRA TABELLA - VERSIONE DEBUGGED ===
    totalAttempts++;
    const showTableBtn = document.getElementById('showTableBtn');
    
    if (showTableBtn) {
        
        showTableBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            
            try {
                updateTable();
            } catch (error) {
                console.error('❌ Errore in updateTable():', error);
                showNotification('⚠️ Errore nell\'aggiornamento della tabella', 'error');
                return;
            }
            
            const modal = document.getElementById('tableModal');
            
            if (!modal) {
                console.error('❌ Modale #tableModal NON TROVATO nel DOM');
                showNotification('❌ Errore: Modale tabella non trovato', 'error');
                return;
            }
            
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            
            // Debug: Verifica che il modale sia effettivamente visibile
            setTimeout(() => {
                const isVisible = modal.offsetHeight > 0;
            }, 100);
        });
        
        successCount++;
    } else {
        console.error('❌ Elemento #showTableBtn NON TROVATO nel DOM');
    }
    
    // === CHIUDI TABELLA - VERSIONE DEBUGGED ===
    totalAttempts++;
    const closeTableBtn = document.getElementById('closeTableModal');
    
    if (closeTableBtn) {
        
        closeTableBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            
            const modal = document.getElementById('tableModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
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
                const closeBtn = document.getElementById('closeTableModal');
                if (closeBtn) closeBtn.click();
            }
        });
        successCount++;
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
    const bg = type === 'error' ? '#ef4444' : '#f59e0b';
    notification.style.cssText = [
        'position:fixed','top:16px','right:16px',
        `background:${bg}`,'color:#fff',
        'padding:10px 18px','border-radius:8px',
        'box-shadow:0 4px 16px rgba(0,0,0,.2)',
        'z-index:11000','font-size:.84rem',
        "font-family:'Titillium Web',sans-serif",
        'max-width:320px','line-height:1.4'
    ].join(';');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = [
        'position:fixed', 'top:16px', 'right:16px',
        'background:#ef4444', 'color:#fff',
        'padding:10px 18px', 'border-radius:8px',
        'box-shadow:0 4px 16px rgba(0,0,0,.2)',
        'z-index:9999', 'font-size:.84rem',
        "font-family:'Titillium Web',sans-serif",
        'max-width:320px', 'line-height:1.4'
    ].join(';');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

// Funzione globale per mostrare dettagli (chiamata dai popup)
// window.showPattoDetails = showPattoDetails;


