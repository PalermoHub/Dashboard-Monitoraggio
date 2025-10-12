// ==========================================
// RICERCA INTELLIGENTE - INTEGRAZIONE PULITA
// ==========================================
// RESPONSABILITÀ: Ricerca intelligente che SI INTEGRA con filtri esistenti
// NON sovrascrive applyFilters - usa window.currentSmartSearchQuery

(function() {
    'use strict';
    
    console.log('🔍 Smart Search - Inizializzazione...');
    
    // Variabili modulo
    let smartSearchData = {
        titoli: [],
        proponenti: [],
        rappresentanti: [],
        indirizzi: [],
        combined: []
    };
    
    let smartSearchCache = new Map();
    let currentSuggestionIndex = -1;
    let searchTimeout = null;
    
    // Export variabile globale per integrazione con filtri
    window.currentSmartSearchQuery = '';
    
    // ==========================================
    // BUILD DATA
    // ==========================================
    
    function buildSmartSearchData() {
        if (!window.allData || window.allData.length === 0) {
            console.warn('Dati non disponibili per smart search');
            return;
        }
        
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
        
        console.log('✅ Smart search data:', {
            titoli: smartSearchData.titoli.length,
            proponenti: smartSearchData.proponenti.length,
            rappresentanti: smartSearchData.rappresentanti.length,
            indirizzi: smartSearchData.indirizzi.length,
            totale: smartSearchData.combined.length
        });
    }
    
    function findDataKeys() {
        if (!window.allData || window.allData.length === 0) return {};
        
        const firstItem = window.allData[0];
        return {
            titolo: Object.keys(firstItem).find(k => k.toLowerCase().includes('titolo') && k.toLowerCase().includes('proposta')),
            proponente: Object.keys(firstItem).find(k => k.toLowerCase().includes('proponente')),
            rappresentante: Object.keys(firstItem).find(k => k.toLowerCase().includes('rappresentante')),
            indirizzo: Object.keys(firstItem).find(k => k.toLowerCase().includes('indirizzo'))
        };
    }
    
    function extractUniqueValues(fieldKey, category) {
        if (!fieldKey) return [];
        
        const values = [...new Set(window.allData
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
    
    // ==========================================
    // RICERCA
    // ==========================================
    
    function performSmartSearch(query) {
        const startTime = performance.now();
        
        if (query.length < 2) {
            hideSuggestions();
            resetSearchStats();
            window.currentSmartSearchQuery = '';
            
            // Triggera i filtri esistenti
            if (typeof window.applyFilters === 'function') {
                window.applyFilters();
            }
            return;
        }
        
        // Salva query per integrazione con filtri
        window.currentSmartSearchQuery = query;
        
        // Ricerca
        const results = executeSmartSearch(query);
        const suggestions = generateSuggestions(results, query);
        const quickResults = generateQuickResults(results, query);
        
        // Mostra risultati
        displaySmartSearchResults(suggestions, quickResults);
        updateSearchStats(suggestions.length, performance.now() - startTime, new Set(results.map(r => r.category)).size);
        
        // Triggera i filtri esistenti (che useranno window.currentSmartSearchQuery)
        if (typeof window.applyFilters === 'function') {
            window.applyFilters();
        }
    }
    
    function executeSmartSearch(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        smartSearchData.combined.forEach(item => {
            let score = 0;
            
            if (item.searchableText === lowerQuery) score = 100;
            else if (item.searchableText.startsWith(lowerQuery)) score = 80;
            else if (item.searchableText.includes(lowerQuery)) score = 60;
            else {
                const queryWords = lowerQuery.split(' ');
                const itemWords = item.searchableText.split(' ');
                const matchingWords = queryWords.filter(word => 
                    itemWords.some(itemWord => itemWord.includes(word))
                );
                if (matchingWords.length > 0) {
                    score = (matchingWords.length / queryWords.length) * 40;
                }
            }
            
            if (score > 0) {
                results.push({ ...item, score, originalQuery: query });
            }
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
            items: items.slice(0, 4),
            totalItems: items.length
        }));
    }
    
    function generateQuickResults(results, query) {
        if (results.length === 0) return null;
        
        return {
            query,
            total: results.length,
            items: results.slice(0, 3)
        };
    }
    
    // ==========================================
    // UI
    // ==========================================
    
    function displaySmartSearchResults(suggestions, quickResults) {
        const suggestionsContainer = document.getElementById('smartSearchSuggestions');
        const quickResultsContainer = document.getElementById('smartSearchQuickResults');
        
        if (suggestions.length > 0 && suggestionsContainer) {
            suggestionsContainer.innerHTML = suggestions.map(group => `
                <div class="suggestion-category">
                    <div class="suggestion-category-header">
                        <i data-lucide="${group.icon}" class="category-icon" style="color: ${group.color};"></i>
                        <span>${group.categoryLabel}</span>
                        ${group.totalItems > group.items.length ? `<span class="more-count">+${group.totalItems - group.items.length}</span>` : ''}
                    </div>
                    <div class="suggestion-items">
                        ${group.items.map(item => `
                            <div class="smart-suggestion-item" 
                                 data-text="${item.text}" 
                                 data-category="${item.category}">
                                <div class="suggestion-content">
                                    <div class="suggestion-text">${highlightQuery(item.text, item.originalQuery)}</div>
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
                    selectSuggestion(item.dataset.text);
                });
            });
            
            // Ricrea icone Lucide
            if (window.lucide && window.lucide.createIcons) {
                window.lucide.createIcons();
            }
        } else if (suggestionsContainer) {
            suggestionsContainer.classList.add('hidden');
        }
        
        // Quick results
        if (quickResults && quickResultsContainer) {
            quickResultsContainer.innerHTML = `
                <div class="quick-results-header">
                    <span>📊 ${quickResults.total} risultati trovati</span>
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
    
    function selectSuggestion(text) {
        const input = document.getElementById('smartSearchInput');
        if (input) {
            input.value = text;
        }
        
        window.currentSmartSearchQuery = text;
        hideSuggestions();
        
        // Triggera i filtri esistenti
        if (typeof window.applyFilters === 'function') {
            window.applyFilters();
        }
        
        if (input) input.focus();
    }
    
    function hideSuggestions() {
        const suggestions = document.getElementById('smartSearchSuggestions');
        const quickResults = document.getElementById('smartSearchQuickResults');
        
        if (suggestions) suggestions.classList.add('hidden');
        if (quickResults) quickResults.classList.add('hidden');
    }
    
    function updateSearchStats(resultCount, timeMs, categories) {
        const statsContainer = document.getElementById('smartSearchStats');
        if (!statsContainer) return;
        
        const resultsCount = document.getElementById('searchResultsCount');
        const timeMs Element = document.getElementById('searchTimeMs');
        const categoriesFound = document.getElementById('searchCategoriesFound');
        
        if (resultsCount) resultsCount.textContent = resultCount;
        if (timeMsElement) timeMsElement.textContent = Math.round(timeMs) + 'ms';
        if (categoriesFound) categoriesFound.textContent = categories;
        
        statsContainer.style.display = resultCount > 0 ? 'flex' : 'none';
    }
    
    function resetSearchStats() {
        updateSearchStats(0, 0, 0);
    }
    
    function highlightQuery(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
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
    
    // ==========================================
    // CLEAR FUNCTIONS
    // ==========================================
    
    function clearSmartSearchOnly() {
        const input = document.getElementById('smartSearchInput');
        const clearButton = document.getElementById('clearSmartSearch');
        
        if (input) input.value = '';
        if (clearButton) clearButton.style.display = 'none';
        
        window.currentSmartSearchQuery = '';
        hideSuggestions();
        resetSearchStats();
        updateSmartSearchBadge('');
        smartSearchCache.clear();
        currentSuggestionIndex = -1;
        
        // Triggera i filtri esistenti
        if (typeof window.applyFilters === 'function') {
            window.applyFilters();
        }
        
        if (input) input.focus();
    }
    
    // Export per uso esterno
    window.clearSmartSearchCompletely = clearSmartSearchOnly;
    
    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    
    function setupSmartSearchEventListeners() {
        const input = document.getElementById('smartSearchInput');
        const clearButton = document.getElementById('clearSmartSearch');
        const suggestions = document.getElementById('smartSearchSuggestions');
        
        if (!input) {
            console.error('Input smart search non trovato');
            return;
        }
        
        // Input con debouncing
        input.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Mostra/nascondi pulsante clear
            if (clearButton) {
                clearButton.style.display = query ? 'flex' : 'none';
            }
            
            updateSmartSearchBadge(query);
            
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(() => {
                performSmartSearch(query);
            }, 200);
        });
        
        // Navigazione con tastiera
        input.addEventListener('keydown', handleKeydown);
        
        // Pulsante clear
        if (clearButton) {
            clearButton.addEventListener('click', clearSmartSearchOnly);
        }
        
        // Chiudi suggerimenti cliccando fuori
        document.addEventListener('click', function(e) {
            if (suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
                hideSuggestions();
            }
        });
        
        console.log('✅ Smart search event listeners configurati');
    }
    
    function handleKeydown(e) {
        const suggestions = document.getElementById('smartSearchSuggestions');
        if (!suggestions) return;
        
        const suggestionItems = suggestions.querySelectorAll('.smart-suggestion-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
                updateSuggestionHighlight(suggestionItems);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                updateSuggestionHighlight(suggestionItems);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentSuggestionIndex >= 0 && suggestionItems[currentSuggestionIndex]) {
                    suggestionItems[currentSuggestionIndex].click();
                } else {
                    performSmartSearch(e.target.value);
                }
                break;
                
            case 'Escape':
                hideSuggestions();
                currentSuggestionIndex = -1;
                break;
        }
    }
    
    function updateSuggestionHighlight(suggestionItems) {
        suggestionItems.forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    
    function setSmartSearchExample(example) {
        const input = document.getElementById('smartSearchInput');
        if (input) {
            input.value = example;
            window.currentSmartSearchQuery = example;
            performSmartSearch(example);
            input.focus();
        }
    }
    
    // Export per uso da HTML
    window.setSmartSearchExample = setSmartSearchExample;
    
    // ==========================================
    // INIZIALIZZAZIONE
    // ==========================================
    
    function initializeSmartSearch() {
        console.log('🔍 Inizializzazione smart search...');
        
        // Aspetta che i dati siano caricati
        if (!window.allData || window.allData.length === 0) {
            console.log('⏳ Dati non ancora pronti, riprovo...');
            setTimeout(initializeSmartSearch, 500);
            return;
        }
        
        buildSmartSearchData();
        setupSmartSearchEventListeners();
        
        console.log('✅ Smart search inizializzato');
    }
    
    // Auto-inizializzazione
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeSmartSearch, 1500);
        });
    } else {
        setTimeout(initializeSmartSearch, 1500);
    }
    
    console.log('✅ Smart Search caricato');
    
})();