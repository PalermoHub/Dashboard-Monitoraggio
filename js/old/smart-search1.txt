// ==========================================
// RICERCA INTELLIGENTE UNIFICATA - VERSIONE DEFINITIVA
// Un unico file con tutte le funzionalità corrette
// ==========================================

// Variabili globali per la ricerca intelligente
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

/**
 * Inizializza il sistema di ricerca intelligente completo
 */
function initializeSmartSearchIntegrated() {
    console.log('🔗 Inizializzazione ricerca intelligente unificata...');
    
    if (!allData || allData.length === 0) {
        console.warn('Dati non ancora caricati per ricerca intelligente');
        return;
    }
    
    buildSmartSearchData();
    setupSmartSearchEventListeners();
    integrateWithExistingSystem();
    setupTableModalFixed();
    
    console.log('🔗 Ricerca intelligente unificata inizializzata:', {
        titoli: smartSearchData.titoli.length,
        proponenti: smartSearchData.proponenti.length,
        rappresentanti: smartSearchData.rappresentanti.length,
        indirizzi: smartSearchData.indirizzi.length,
        totale: smartSearchData.combined.length
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
    
    // Combina tutti i dati con metadati
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
        color: getCategoryColor(category),
        searchableText: text.toLowerCase()
    }));
}

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
        stato: Object.keys(firstItem).find(k => k.toLowerCase().includes('stato'))
    };
}

/**
 * Configurazione delle categorie
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
 * Setup degli event listeners completo
 */
function setupSmartSearchEventListeners() {
    const input = document.getElementById('smartSearchInput');
    const suggestions = document.getElementById('smartSearchSuggestions');
    const clearButton = document.getElementById('clearSmartSearch');
    
    if (!input || !suggestions) {
        console.error('Elementi ricerca intelligente non trovati');
        return;
    }
    
    // Rimuovi eventuali listener esistenti
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    // Input con debouncing
    newInput.addEventListener('input', function() {
        const query = this.value.trim();
        currentSmartSearchQuery = query;
        
        // Mostra/nascondi pulsante clear
        if (clearButton) {
            clearButton.style.display = query ? 'flex' : 'none';
        }
        
        updateSmartSearchBadge(query);
        
        if (smartSearchTimeout) {
            clearTimeout(smartSearchTimeout);
        }
        
        smartSearchTimeout = setTimeout(() => {
            performSmartSearchIntegrated(query);
        }, 200);
    });
    
    // Navigazione con tastiera
    newInput.addEventListener('keydown', handleSmartSearchKeydown);
    
    // Pulsante clear
    if (clearButton) {
        const newClearButton = clearButton.cloneNode(true);
        clearButton.parentNode.replaceChild(newClearButton, clearButton);
        
        newClearButton.addEventListener('click', clearSmartSearchOnly);
    }
    
    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!newInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
    
    // Setup opzioni avanzate
    setupAdvancedOptions();
}

/**
 * Esegue la ricerca intelligente sincronizzata
 */
function performSmartSearchIntegrated(query) {
    const startTime = performance.now();
    
    if (query.length < 2) {
        hideSuggestions();
        resetSmartSearchStats();
        currentSmartSearchQuery = '';
        applyFiltersIntegrated();
        return;
    }
    
    // Cache con chiave che include i filtri
    const cacheKey = getCacheKey(query);
    if (smartSearchCache.has(cacheKey)) {
        const cached = smartSearchCache.get(cacheKey);
        displaySmartSearchResults(cached.suggestions, cached.quickResults, cached.filteredCount);
        updateSearchStats(cached.suggestions.length, performance.now() - startTime, cached.categories);
        applyFiltersIntegrated();
        return;
    }
    
    // Prima applica i filtri geografici
    const currentFilters = getCurrentFilters();
    const geographicallyFilteredData = applyGeographicalFilters(allData, currentFilters);
    
    console.log(`Smart search su ${geographicallyFilteredData.length} elementi filtrati da ${allData.length} totali`);
    
    // Ricerca sui dati filtrati
    const results = executeSmartSearchOnFilteredData(query, geographicallyFilteredData);
    const suggestions = generateSuggestions(results, query);
    const quickResults = generateQuickResults(results, query);
    
    // Cache
    smartSearchCache.set(cacheKey, {
        suggestions,
        quickResults,
        categories: new Set(results.map(r => r.category)).size,
        filteredCount: geographicallyFilteredData.length
    });
    
    // Mostra risultati
    displaySmartSearchResults(suggestions, quickResults, geographicallyFilteredData.length);
    updateSearchStats(suggestions.length, performance.now() - startTime, new Set(results.map(r => r.category)).size);
    
    // Applica filtri
    applyFiltersIntegrated();
}

/**
 * Genera chiave cache che include i filtri attivi
 */
function getCacheKey(query) {
    const filters = getCurrentFilters();
    return `${query}|${filters.stato}|${filters.upl}|${filters.quartiere}|${filters.circoscrizione}`;
}

/**
 * Ottieni filtri geografici correnti
 */
function getCurrentFilters() {
    return {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || ''
    };
}

/**
 * Applica solo i filtri geografici
 */
function applyGeographicalFilters(data, filters) {
    return data.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const proponenteNascostoMatch = !proponenteFilter || (item[proponenteKey] && item[proponenteKey].trim() === proponenteFilter);
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && proponenteNascostoMatch;
    });
}

/**
 * Ricerca intelligente sui dati filtrati
 */
function executeSmartSearchOnFilteredData(query, filteredDataToSearch) {
    const keys = findDataKeys();
    const lowerQuery = query.toLowerCase();
    const exactMatch = document.getElementById('exactMatchOption')?.checked || false;
    const caseSensitive = document.getElementById('caseSensitiveOption')?.checked || false;
    
    const searchQuery = caseSensitive ? query : lowerQuery;
    const results = [];
    
    filteredDataToSearch.forEach(item => {
        const fieldsToSearch = [
            { key: keys.titolo, category: 'titolo', text: item[keys.titolo] },
            { key: keys.proponente, category: 'proponente', text: item[keys.proponente] },
            { key: keys.rappresentante, category: 'rappresentante', text: item[keys.rappresentante] },
            { key: keys.indirizzo, category: 'indirizzo', text: item[keys.indirizzo] }
        ];
        
        fieldsToSearch.forEach(field => {
            if (!field.text) return;
            
            const itemText = caseSensitive ? field.text.toString() : field.text.toString().toLowerCase();
            let score = 0;
            
            if (exactMatch) {
                if (itemText === searchQuery) score = 100;
            } else {
                if (itemText === searchQuery) score = 100;
                else if (itemText.startsWith(searchQuery)) score = 80;
                else if (itemText.includes(searchQuery)) score = 60;
                else {
                    const queryWords = searchQuery.split(' ');
                    const itemWords = itemText.split(' ');
                    const matchingWords = queryWords.filter(word => 
                        itemWords.some(itemWord => itemWord.includes(word))
                    );
                    if (matchingWords.length > 0) {
                        score = (matchingWords.length / queryWords.length) * 40;
                    }
                }
            }
            
            if (score > 0) {
                results.push({
                    text: field.text.toString(),
                    category: field.category,
                    categoryLabel: getCategoryLabel(field.category),
                    icon: getCategoryIcon(field.category),
                    color: getCategoryColor(field.category),
                    score: score,
                    originalQuery: query,
                    searchableText: itemText,
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
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.text.length !== b.text.length) return a.text.length - b.text.length;
            return a.text.localeCompare(b.text);
        })
        .slice(0, 12);
}

/**
 * Genera suggerimenti strutturati
 */
function generateSuggestions(results, query) {
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.category]) acc[result.category] = [];
        acc[result.category].push(result);
        return acc;
    }, {});
    
    const showCategories = document.getElementById('showCategoryOption')?.checked !== false;
    
    return Object.entries(groupedResults).map(([category, items]) => ({
        category,
        categoryLabel: getCategoryLabel(category),
        icon: getCategoryIcon(category),
        color: getCategoryColor(category),
        items: items.slice(0, 4),
        showCategory: showCategories,
        totalItems: items.length
    }));
}

/**
 * Genera risultati rapidi
 */
function generateQuickResults(results, query) {
    if (results.length === 0) return null;
    
    return {
        query,
        total: results.length,
        items: results.slice(0, 3)
    };
}

/**
 * Mostra i risultati con conteggio corretto
 */
function displaySmartSearchResults(suggestions, quickResults, filteredDataCount) {
    const suggestionsContainer = document.getElementById('smartSearchSuggestions');
    const quickResultsContainer = document.getElementById('smartSearchQuickResults');
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(group => `
            <div class="suggestion-category">
                ${group.showCategory ? `
                    <div class="suggestion-category-header">
                        <i data-lucide="${group.icon}" class="category-icon" style="color: ${group.color};"></i>
                        <span>${group.categoryLabel}</span>
                        ${group.totalItems > group.items.length ? `<span class="more-count">+${group.totalItems - group.items.length}</span>` : ''}
                    </div>
                ` : ''}
                <div class="suggestion-items">
                    ${group.items.map(item => `
                        <div class="smart-suggestion-item" 
                             data-text="${item.text}" 
                             data-category="${item.category}"
                             data-lat="${item.dataItem ? item.dataItem.lat : ''}"
                             data-lng="${item.dataItem ? item.dataItem.lng : ''}">
                            <div class="suggestion-content">
                                <div class="suggestion-text">${highlightQuery(item.text, item.originalQuery)}</div>
                                ${!group.showCategory ? `<span class="suggestion-category-label" style="color: ${item.color};">${item.categoryLabel}</span>` : ''}
                            </div>
                            <div class="suggestion-score">${Math.round(item.score)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        suggestionsContainer.classList.remove('hidden');
        
        // Event listeners per selezione con centering
        suggestionsContainer.querySelectorAll('.smart-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const text = item.dataset.text;
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                selectSmartSearchSuggestionWithCentering(text, lat, lng);
            });
        });
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } else {
        suggestionsContainer.classList.add('hidden');
    }
    
    // Quick results
    if (quickResults && quickResultsContainer) {
        const totalInContext = filteredDataCount > 0 ? ` (su ${filteredDataCount} già filtrati)` : '';
        quickResultsContainer.innerHTML = `
            <div class="quick-results-header">
                <span>📊 Anteprima risultati: ${quickResults.total} trovati${totalInContext}</span>
            </div>
            <div class="quick-results-items">
                ${quickResults.items.map(item => `
                    <div class="quick-result-item" style="border-left: 3px solid ${item.color};">
                        <div class="quick-result-text">${highlightQuery(item.text, quickResults.query)}</div>
                        <div class="quick-result-category">${item.categoryLabel}</div>
                    </div>
                `).join('')}
            </div>
        `;
        quickResultsContainer.classList.remove('hidden');
    } else if (quickResultsContainer) {
        quickResultsContainer.classList.add('hidden');
    }
}

/**
 * Selezione con centering automatico della mappa
 */
function selectSmartSearchSuggestionWithCentering(text, lat, lng) {
    const input = document.getElementById('smartSearchInput');
    input.value = text;
    currentSmartSearchQuery = text;
    
    hideSuggestions();
    applyFiltersIntegrated();
    
    // Centering automatico sulla mappa
    if (window.map && !isNaN(lat) && !isNaN(lng)) {
        console.log(`Centrando mappa su: ${lat}, ${lng} per "${text}"`);
        
        map.setView([lat, lng], 17, { 
            animate: true,
            duration: 1
        });
        
        setTimeout(() => {
            highlightMarkerOnMap(lat, lng);
        }, 500);
        
        if (typeof showNotification === 'function') {
            showNotification(`Mappa centrata su: ${text}`, 'info');
        }
    }
    
    input.focus();
}

/**
 * Evidenzia marker sulla mappa
 */
function highlightMarkerOnMap(lat, lng) {
    if (!window.markersLayer) return;
    
    const tolerance = 0.0001;
    
    markersLayer.eachLayer(function(layer) {
        if (layer instanceof L.CircleMarker) {
            const markerLat = layer.getLatLng().lat;
            const markerLng = layer.getLatLng().lng;
            
            if (Math.abs(markerLat - lat) < tolerance && Math.abs(markerLng - lng) < tolerance) {
                const originalRadius = layer.getRadius();
                const originalWeight = layer.options.weight;
                
                layer.setRadius(12);
                layer.setStyle({ weight: 4 });
                
                if (layer.getPopup()) {
                    layer.openPopup();
                }
                
                setTimeout(() => {
                    layer.setRadius(originalRadius);
                    layer.setStyle({ weight: originalWeight });
                }, 3000);
                
                return;
            }
        }
    });
}

/**
 * Applica filtri integrati - versione unificata
 */
function applyFiltersIntegrated() {
    console.log('🔗 Applicando filtri integrati unificati...');
    
    const filters = getCurrentFilters();
    filters.smartSearch = currentSmartSearchQuery.trim();
    filters.proponenteNascosto = (typeof proponenteFilter !== 'undefined') ? proponenteFilter.trim() : '';
    
    filteredData = allData.filter(item => {
        const keys = findDataKeys();
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        // Filtri geografici
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const proponenteNascostoMatch = !filters.proponenteNascosto || (item[proponenteKey] && item[proponenteKey].trim() === filters.proponenteNascosto);
        
        // Ricerca intelligente
        let smartSearchMatch = true;
        if (filters.smartSearch && filters.smartSearch.length >= 2) {
            const exactMatch = document.getElementById('exactMatchOption')?.checked || false;
            const caseSensitive = document.getElementById('caseSensitiveOption')?.checked || false;
            
            const searchQuery = caseSensitive ? filters.smartSearch : filters.smartSearch.toLowerCase();
            
            const fieldsToSearch = [
                item[keys.titolo],
                item[keys.proponente], 
                item[keys.rappresentante],
                item[keys.indirizzo]
            ];
            
            smartSearchMatch = fieldsToSearch.some(field => {
                if (!field) return false;
                
                const fieldText = caseSensitive ? field.toString() : field.toString().toLowerCase();
                
                if (exactMatch) {
                    return fieldText === searchQuery;
                } else {
                    return fieldText.includes(searchQuery);
                }
            });
        }
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && 
               proponenteNascostoMatch && smartSearchMatch;
    });
    
    console.log(`🔗 Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
    // Aggiorna viste
    updateAllViewsIntegrated();
}

/**
 * Aggiorna tutte le viste
 */
function updateAllViewsIntegrated() {
    if (typeof updateMap === 'function') updateMap();
    if (typeof updateStatistics === 'function') updateStatistics();
    if (typeof updateChart === 'function') updateChart();
    if (typeof updateTable === 'function') updateTable();
    if (typeof updateFiltersPopupWithSmart === 'function') updateFiltersPopupWithSmart();
}

/**
 * Setup tabella corretto
 */
function setupTableModalFixed() {
    const showTableBtn = document.getElementById('showTableBtn');
    const tableModal = document.getElementById('tableModal');
    const closeTableModal = document.getElementById('closeTableModal');
    
    if (!showTableBtn || !tableModal || !closeTableModal) {
        console.error('Elementi tabella non trovati');
        return;
    }
    
    // Rimuovi eventuali listener esistenti
    const newShowTableBtn = showTableBtn.cloneNode(true);
    showTableBtn.parentNode.replaceChild(newShowTableBtn, showTableBtn);
    
    newShowTableBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Apertura tabella...');
        
        try {
            updateTableFixed();
            tableModal.classList.remove('hidden');
            tableModal.classList.add('flex', 'show');
            console.log('Tabella mostrata correttamente');
        } catch (error) {
            console.error('Errore apertura tabella:', error);
            if (typeof showNotification === 'function') {
                showNotification('Errore nell\'apertura della tabella', 'error');
            }
        }
    });
    
    // Chiusura tabella
    const newCloseTableModal = closeTableModal.cloneNode(true);
    closeTableModal.parentNode.replaceChild(newCloseTableModal, closeTableModal);
    
    newCloseTableModal.addEventListener('click', function() {
        tableModal.classList.add('hidden');
        tableModal.classList.remove('flex', 'show');
    });
    
    tableModal.addEventListener('click', function(e) {
        if (e.target === tableModal) {
            newCloseTableModal.click();
        }
    });
}

/**
 * Aggiornamento tabella corretto
 */
function updateTableFixed() {
    const tableCount = document.getElementById('tableCount');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    if (!tableCount || !tableHeader || !tableBody) return;
    
    if (!filteredData || filteredData.length === 0) {
        tableCount.textContent = '0';
        tableHeader.innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
        tableBody.innerHTML = '<tr><td colspan="100%" class="px-3 py-4 text-center text-gray-500">Nessun elemento trovato</td></tr>';
        return;
    }
    
    const excludedFields = ['foto', 'googlemaps', 'geouri', 'upl', 'lat.', 'long.', 'lat', 'lng', 'coordinate'];
    const allKeys = Object.keys(filteredData[0]);
    const filteredKeys = allKeys.filter(key => {
        const keyLower = key.toLowerCase().trim();
        return !excludedFields.some(excluded => {
            const excludedLower = excluded.toLowerCase().trim();
            return keyLower === excludedLower || keyLower.includes(excludedLower);
        });
    });
    
    tableCount.textContent = filteredData.length;
    
    // Header
    tableHeader.innerHTML = '';
    filteredKeys.forEach(key => {
        const th = document.createElement('th');
        th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = key;
        tableHeader.appendChild(th);
    });
    
    const actionTh = document.createElement('th');
    actionTh.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    actionTh.textContent = 'Azioni';
    tableHeader.appendChild(actionTh);
    
    // Body
    tableBody.innerHTML = '';
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        filteredKeys.forEach(key => {
            const td = document.createElement('td');
            td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
            
            let value = item[key] || 'N/A';
            
            if (key.toLowerCase().includes('stato')) {
                const statusColors = {
                    'Istruttoria in corso': '#ffdb4d',
                    'Respinta': '#ff6b6b',
                    'Patto stipulato': '#8fd67d',
                    'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
                    'In attesa di integrazione': '#b3e6ff'
                };
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
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Integrazione con il sistema esistente
 */
function integrateWithExistingSystem() {
    // Reset completo unificato
    const existingClearFilters = document.getElementById('clearFilters');
    if (existingClearFilters) {
        const newClearButton = existingClearFilters.cloneNode(true);
        existingClearFilters.parentNode.replaceChild(newClearButton, existingClearFilters);
        
        newClearButton.addEventListener('click', clearAllFiltersIncludingSmart);
    }

    const popupResetButton = document.getElementById('filtersPopupReset');
    if (popupResetButton) {
        const newPopupReset = popupResetButton.cloneNode(true);
        popupResetButton.parentNode.replaceChild(newPopupReset, popupResetButton);
        
        newPopupReset.addEventListener('click', clearAllFiltersIncludingSmart);
    }

    // Estendi popup filtri
    if (typeof window.updateFiltersPopup === 'function') {
        window.originalUpdateFiltersPopup = window.updateFiltersPopup;
        window.updateFiltersPopup = updateFiltersPopupWithSmart;
    }
}

/**
 * Reset completo di tutti i filtri
 */
function clearAllFiltersIncludingSmart() {
    console.log('🔄 Reset completo unificato...');
    
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            if (typeof updateFilterAppearance === 'function') {
                updateFilterAppearance(element, '');
            }
        }
    });
    
    // Reset vecchio filtro titolo se presente
    const oldTitleFilter = document.getElementById('filterTitolo');
    if (oldTitleFilter) {
        oldTitleFilter.value = '';
        if (typeof updateFilterAppearance === 'function') {
            updateFilterAppearance(oldTitleFilter, '');
        }
    }
    
    // Reset ricerca intelligente
    clearSmartSearchCompletely();
    
    if (typeof proponenteFilter !== 'undefined') {
        proponenteFilter = '';
    }
    
    filteredData = [...allData];
    updateAllViewsIntegrated();
    
    if (typeof hideFiltersPopup === 'function') {
        hideFiltersPopup();
    }
    
    if (typeof showNotification === 'function') {
        showNotification('Tutti i filtri sono stati resettati', 'success');
    }
}

/**
 * Reset solo ricerca intelligente
 */
function clearSmartSearchOnly() {
    clearSmartSearchCompletely();
    applyFiltersIntegrated();
    
    const input = document.getElementById('smartSearchInput');
    if (input) input.focus();
}

function clearSmartSearchCompletely() {
    const input = document.getElementById('smartSearchInput');
    const clearButton = document.getElementById('clearSmartSearch');
    
    if (input) input.value = '';
    if (clearButton) clearButton.style.display = 'none';
    
    currentSmartSearchQuery = '';
    hideSuggestions();
    resetSmartSearchStats();
    updateSmartSearchBadge('');
    smartSearchCache.clear();
    currentSmartSuggestionIndex = -1;
}

/**
 * Popup filtri esteso con ricerca intelligente
 */
function updateFiltersPopupWithSmart() {
    const popup = document.getElementById('filtersPopup');
    const title = document.getElementById('filtersPopupTitle');
    const activeFiltersText = document.getElementById('activeFiltersText');
    
    if (!popup || !title || !activeFiltersText) {
        if (typeof window.originalUpdateFiltersPopup === 'function') {
            window.originalUpdateFiltersPopup();
        }
        return;
    }
    
    const filters = {};
    const currentFilters = getCurrentFilters();
    const smartSearch = currentSmartSearchQuery.trim();
    const proponenteHidden = (typeof proponenteFilter !== 'undefined') ? proponenteFilter.trim() : '';
    
    if (currentFilters.stato) filters['Stato'] = currentFilters.stato;
    if (currentFilters.upl) filters['UPL'] = currentFilters.upl;
    if (currentFilters.quartiere) filters['Quartiere'] = currentFilters.quartiere;
    if (currentFilters.circoscrizione) filters['Circoscrizione'] = currentFilters.circoscrizione;
    if (smartSearch) filters['🧠 Ricerca Intelligente'] = `"${smartSearch}"`;
    if (proponenteHidden) filters['Proponente (grafico)'] = proponenteHidden;
    
    // Opzioni ricerca avanzata
    const exactMatch = document.getElementById('exactMatchOption')?.checked;
    const caseSensitive = document.getElementById('caseSensitiveOption')?.checked;
    if (smartSearch && (exactMatch || caseSensitive)) {
        let searchOptions = [];
        if (exactMatch) searchOptions.push('esatta');
        if (caseSensitive) searchOptions.push('maiusc/minusc');
        filters['⚙️ Opzioni ricerca'] = searchOptions.join(' + ');
    }
    
    const activeFilters = Object.keys(filters);
    
    if (activeFilters.length === 0) {
        if (typeof hideFiltersPopup === 'function') {
            hideFiltersPopup();
        }
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
    
    activeFiltersText.innerHTML = filterTags || 'Nessun filtro attivo';
    
    if (typeof showFiltersPopup === 'function') {
        showFiltersPopup();
    }
}

/**
 * Setup opzioni avanzate
 */
function setupAdvancedOptions() {
    const exactMatch = document.getElementById('exactMatchOption');
    const caseSensitive = document.getElementById('caseSensitiveOption');
    const showCategory = document.getElementById('showCategoryOption');
    
    [exactMatch, caseSensitive, showCategory].forEach(option => {
        if (option) {
            option.addEventListener('change', () => {
                const input = document.getElementById('smartSearchInput');
                if (input.value.trim()) {
                    performSmartSearchIntegrated(input.value.trim());
                }
            });
        }
    });
}

/**
 * Gestione navigazione con tastiera
 */
function handleSmartSearchKeydown(e) {
    const suggestions = document.getElementById('smartSearchSuggestions');
    const suggestionItems = suggestions.querySelectorAll('.smart-suggestion-item');
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentSmartSuggestionIndex = Math.min(currentSmartSuggestionIndex + 1, suggestionItems.length - 1);
            updateSmartSuggestionHighlight(suggestionItems);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            currentSmartSuggestionIndex = Math.max(currentSmartSuggestionIndex - 1, -1);
            updateSmartSuggestionHighlight(suggestionItems);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (currentSmartSuggestionIndex >= 0 && suggestionItems[currentSmartSuggestionIndex]) {
                suggestionItems[currentSmartSuggestionIndex].click();
            } else {
                performSmartSearchIntegrated(e.target.value);
            }
            break;
            
        case 'Escape':
            hideSuggestions();
            currentSmartSuggestionIndex = -1;
            break;
    }
}

/**
 * Funzioni utility
 */
function updateSmartSuggestionHighlight(suggestionItems) {
    suggestionItems.forEach((item, index) => {
        if (index === currentSmartSuggestionIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function hideSuggestions() {
    document.getElementById('smartSearchSuggestions')?.classList.add('hidden');
    document.getElementById('smartSearchQuickResults')?.classList.add('hidden');
}

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

function updateSearchStats(resultCount, timeMs, categories) {
    const statsContainer = document.getElementById('smartSearchStats');
    if (!statsContainer) return;
    
    document.getElementById('searchResultsCount').textContent = resultCount;
    document.getElementById('searchTimeMs').textContent = Math.round(timeMs) + 'ms';
    document.getElementById('searchCategoriesFound').textContent = categories;
    
    statsContainer.style.display = resultCount > 0 ? 'flex' : 'none';
}

function resetSmartSearchStats() {
    updateSearchStats(0, 0, 0);
}

function highlightQuery(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function toggleAdvancedOptions() {
    const content = document.getElementById('advancedOptionsContent');
    const icon = document.querySelector('.advanced-toggle-icon');
    
    if (content && icon) {
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            content.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

function setSmartSearchExample(example) {
    const input = document.getElementById('smartSearchInput');
    input.value = example;
    currentSmartSearchQuery = example;
    performSmartSearchIntegrated(example);
    input.focus();
}

// Export delle funzioni principali
window.initializeSmartSearchIntegrated = initializeSmartSearchIntegrated;
window.applyFiltersIntegrated = applyFiltersIntegrated;
window.clearAllFiltersIncludingSmart = clearAllFiltersIncludingSmart;
window.setSmartSearchExample = setSmartSearchExample;
window.toggleAdvancedOptions = toggleAdvancedOptions;

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof allData !== 'undefined' && allData.length > 0) {
            initializeSmartSearchIntegrated();
        }
    }, 1500);
});

console.log('🔗 Smart Search Unificato caricato - versione definitiva');