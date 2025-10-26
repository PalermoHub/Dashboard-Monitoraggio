// ==========================================
// RICERCA INTELLIGENTE UNIFICATA - VERSIONE CORRETTA CON AMBITI
// ==========================================

// Variabili globali per la ricerca intelligente
let smartSearchData = {
    titoli: [],
    proponenti: [],
    rappresentanti: [],
    indirizzi: [],
    ambiti: [], // NUOVO
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
    console.log('🔍— Inizializzazione ricerca intelligente unificata...');
    
    if (!allData || allData.length === 0) {
        console.warn('Dati non ancora caricati per ricerca intelligente');
        return;
    }
    
    buildSmartSearchData();
    setupSmartSearchEventListeners();
    integrateWithExistingSystem();
    
    console.log('🔍— Ricerca intelligente unificata inizializzata:', {
        titoli: smartSearchData.titoli.length,
        proponenti: smartSearchData.proponenti.length,
        rappresentanti: smartSearchData.rappresentanti.length,
        indirizzi: smartSearchData.indirizzi.length,
        ambiti: smartSearchData.ambiti.length,
        totale: smartSearchData.combined.length
    });
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
        ambiti: Object.keys(firstItem).find(k => k.toLowerCase().includes('ambiti')), // NUOVO
        stato: Object.keys(firstItem).find(k => k.toLowerCase().includes('stato'))
    };
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
    smartSearchData.ambiti = extractUniqueValues(keys.ambiti, 'ambiti'); // NUOVO
    
    // Combina tutti i dati con metadati
    smartSearchData.combined = [
        ...smartSearchData.titoli,
        ...smartSearchData.proponenti,
        ...smartSearchData.rappresentanti,
        ...smartSearchData.indirizzi,
        ...smartSearchData.ambiti // NUOVO
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
 * Configurazione delle categorie
 */
function getCategoryLabel(category) {
    const labels = {
        'titolo': 'Titoli Progetti',
        'proponente': 'Proponenti',
        'rappresentante': 'Rappresentanti',
        'indirizzo': 'Indirizzi',
        'ambiti': 'Ambiti di Azione' // NUOVO
    };
    return labels[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'titolo': 'file-text',
        'proponente': 'building-2',
        'rappresentante': 'user-check',
        'indirizzo': 'map-pin',
        'ambiti': 'target' // NUOVO
    };
    return icons[category] || 'circle';
}

function getCategoryColor(category) {
    const colors = {
        'titolo': '#3b82f6',
        'proponente': '#10b981',
        'rappresentante': '#f59e0b',
        'indirizzo': '#ef4444',
        'ambiti': '#8b5cf6' // NUOVO - viola
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
        applyFiltersUnified();
        return;
    }
    
    // Cache con chiave che include i filtri
    const cacheKey = getCacheKey(query);
    if (smartSearchCache.has(cacheKey)) {
        const cached = smartSearchCache.get(cacheKey);
        displaySmartSearchResults(cached.suggestions, cached.quickResults, cached.filteredCount);
        updateSearchStats(cached.suggestions.length, performance.now() - startTime, cached.categories);
        applyFiltersUnified();
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
    applyFiltersUnified();
}

/**
 * Genera chiave cache che include i filtri attivi
 */
function getCacheKey(query) {
    const filters = getCurrentFilters();
    return `${query}|${filters.stato}|${filters.upl}|${filters.quartiere}|${filters.circoscrizione}|${filters.ambiti}`;
}

/**
 * Ottieni filtri geografici correnti
 */
function getCurrentFilters() {
    return {
        stato: document.getElementById('filterStato')?.value?.trim() || '',
        upl: document.getElementById('filterUpl')?.value?.trim() || '',
        quartiere: document.getElementById('filterQuartiere')?.value?.trim() || '',
        circoscrizione: document.getElementById('filterCircoscrizione')?.value?.trim() || '',
        ambiti: document.getElementById('filterAmbiti')?.value?.trim() || '' // NUOVO
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
        const ambitiKey = Object.keys(item).find(k => k.toLowerCase().includes('ambiti')); // NUOVO
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const ambitiMatch = !filters.ambiti || (item[ambitiKey] && item[ambitiKey].trim() === filters.ambiti); // NUOVO
        const proponenteNascostoMatch = !proponenteFilter || (item[proponenteKey] && item[proponenteKey].trim() === proponenteFilter);
        
        return statoMatch && uplMatch && quartiereMatch && circoscrizioneMatch && ambitiMatch && proponenteNascostoMatch;
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
            { key: keys.indirizzo, category: 'indirizzo', text: item[keys.indirizzo] },
            { key: keys.ambiti, category: 'ambiti', text: item[keys.ambiti] } // NUOVO
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
        
        // Event listeners per selezione
        suggestionsContainer.querySelectorAll('.smart-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const text = item.dataset.text;
                const category = item.dataset.category;
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                selectSmartSearchSuggestionWithCentering(text, category, lat, lng);
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
function selectSmartSearchSuggestionWithCentering(text, category, lat, lng) {
    const input = document.getElementById('smartSearchInput');
    input.value = text;
    currentSmartSearchQuery = text;
    
    hideSuggestions();
    applyFiltersUnified();
    
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
 * FUNZIONE UNIFICATA PER APPLICARE TUTTI I FILTRI
 */
function applyFiltersUnified() {
    console.log('🔍 Applicando filtri unificati...');
    
    const filters = {};
    filters.stato = document.getElementById('filterStato')?.value?.trim() || '';
    filters.upl = document.getElementById('filterUpl')?.value?.trim() || '';
    filters.quartiere = document.getElementById('filterQuartiere')?.value?.trim() || '';
    filters.circoscrizione = document.getElementById('filterCircoscrizione')?.value?.trim() || '';
    filters.ambiti = document.getElementById('filterAmbiti')?.value?.trim() || ''; // NUOVO
    
    const titoloField = document.getElementById('filterTitolo');
    filters.titolo = titoloField ? titoloField.value.toLowerCase().trim() : '';
    
    filters.smartSearch = currentSmartSearchQuery.trim();
    
    filters.proponenteNascosto = (typeof proponenteFilter !== 'undefined') ? proponenteFilter.trim() : '';
    
    filteredData = allData.filter(item => {
        const statoKey = Object.keys(item).find(k => k.toLowerCase().includes('stato'));
        const uplKey = Object.keys(item).find(k => k.toLowerCase() === 'upl');
        const quartiereKey = Object.keys(item).find(k => k.toLowerCase().includes('quartiere'));
        const circoscrizioneKey = Object.keys(item).find(k => k.toLowerCase().includes('circoscrizione'));
        const ambitiKey = Object.keys(item).find(k => k.toLowerCase().includes('ambiti')); // NUOVO
        const titoloKey = Object.keys(item).find(k => k.toLowerCase().includes('titolo'));
        const proponenteKey = Object.keys(item).find(k => k.toLowerCase().includes('proponente'));
        const rappresentanteKey = Object.keys(item).find(k => k.toLowerCase().includes('rappresentante'));
        const indirizzoKey = Object.keys(item).find(k => k.toLowerCase().includes('indirizzo'));
        
        const statoMatch = !filters.stato || (item[statoKey] && item[statoKey].trim() === filters.stato);
        const uplMatch = !filters.upl || (item[uplKey] && item[uplKey].trim() === filters.upl);
        const quartiereMatch = !filters.quartiere || (item[quartiereKey] && item[quartiereKey].trim() === filters.quartiere);
        const circoscrizioneMatch = !filters.circoscrizione || (item[circoscrizioneKey] && item[circoscrizioneKey].trim() === filters.circoscrizione);
        const ambitiMatch = !filters.ambiti || (item[ambitiKey] && item[ambitiKey].trim() === filters.ambiti); // NUOVO
        const proponenteNascostoMatch = !filters.proponenteNascosto || (item[proponenteKey] && item[proponenteKey].trim() === filters.proponenteNascosto);
        
        let titoloMatch = true;
        if (filters.titolo && filters.titolo.length >= 2) {
            if (titoloKey && item[titoloKey]) {
                titoloMatch = item[titoloKey].toLowerCase().includes(filters.titolo);
            } else {
                titoloMatch = false;
            }
        }
        
        let smartSearchMatch = true;
        if (filters.smartSearch && filters.smartSearch.length >= 2) {
            const exactMatch = document.getElementById('exactMatchOption')?.checked || false;
            const caseSensitive = document.getElementById('caseSensitiveOption')?.checked || false;
            
            const searchQuery = caseSensitive ? filters.smartSearch : filters.smartSearch.toLowerCase();
            
            const fieldsToSearch = [
                item[titoloKey],
                item[proponenteKey], 
                item[rappresentanteKey],
                item[indirizzoKey],
                item[ambitiKey] // NUOVO
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
               ambitiMatch && proponenteNascostoMatch && titoloMatch && smartSearchMatch;
    });
    
    console.log(`🔍 Filtrati ${filteredData.length} elementi da ${allData.length} totali`);
    
        updateAllViewsUnified();
    
    // ✅ NUOVO: Sincronizza side panel
    if (typeof syncSidePanelWithFilters === 'function') {
        setTimeout(() => {
            syncSidePanelWithFilters();
        }, 100);
    }
}

/**
 * Aggiorna tutte le viste in modo unificato
 */
function updateAllViewsUnified() {
	
	window.filteredData = filteredData;
	
    if (typeof updateMap === 'function') updateMap();
    if (typeof updateStatistics === 'function') updateStatistics();
    if (typeof updateChart === 'function') updateChart();
    if (typeof updateTable === 'function') updateTable();
    if (typeof updateFiltersPopup === 'function') updateFiltersPopup();
}

/**
 * Integrazione con il sistema esistente
 */
function integrateWithExistingSystem() {
    if (typeof window.applyFilters === 'function') {
        window.originalApplyFilters = window.applyFilters;
        window.applyFilters = applyFiltersUnified;
        console.log('Funzione applyFilters sostituita con applyFiltersUnified');
    }
    
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
}

/**
 * Reset completo di tutti i filtri
 */
function clearAllFiltersIncludingSmart() {
    console.log('🔄 Reset completo unificato...');
    
    const filterIds = ['filterStato', 'filterUpl', 'filterQuartiere', 'filterCircoscrizione', 'filterAmbiti', 'filterTitolo'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
            if (typeof updateFilterAppearance === 'function') {
                updateFilterAppearance(element, '');
            }
        }
    });
    
    clearSmartSearchCompletely();
    
    if (typeof proponenteFilter !== 'undefined') {
        proponenteFilter = '';
    }
    
    filteredData = [...allData];
    
    if (typeof updateFilters === 'function') {
        console.log('🔄 Rigenerando opzioni dropdown...');
        updateFilters();
    } else {
        console.warn('⚠️ updateFilters non disponibile');
    }
    
    if (typeof updateAllViewsUnified === 'function') {
        updateAllViewsUnified();
    } else {
        console.warn('⚠️ updateAllViewsUnified non disponibile');
    }
    
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
    applyFiltersUnified();
    
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
 * Export delle funzioni principali
 */
window.initializeSmartSearchIntegrated = initializeSmartSearchIntegrated;
window.applyFiltersUnified = applyFiltersUnified;
window.clearAllFiltersIncludingSmart = clearAllFiltersIncludingSmart;
window.setSmartSearchExample = setSmartSearchExample;
window.toggleAdvancedOptions = toggleAdvancedOptions;

/**
 * Auto-inizializzazione
 */
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof allData !== 'undefined' && allData.length > 0) {
            initializeSmartSearchIntegrated();
        }
    }, 1500);
});

console.log('🔍— Smart Search Unificato caricato - versione corretta con ambiti');