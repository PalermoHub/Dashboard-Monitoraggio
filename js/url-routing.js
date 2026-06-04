// ==========================================
// URL ROUTING — Sincronizzazione filtri con indirizzo web
// ==========================================

const URL_FILTER_MAP = {
    stato:          'filterStato',
    ambiti:         'filterAmbiti',
    circoscrizione: 'filterCircoscrizione',
    quartiere:      'filterQuartiere',
    upl:            'filterUpl'
};

let _urlUpdateScheduled = false;
let _applyingFromURL = false;

function updateURL() {
    const params = new URLSearchParams();

    for (const [key, id] of Object.entries(URL_FILTER_MAP)) {
        const val = document.getElementById(id)?.value || '';
        if (val) params.set(key, val);
    }

    const q = document.getElementById('smartSearchInput')?.value?.trim() || '';
    if (q) params.set('q', q);

    const proponente = typeof window.getProponenteFilter === 'function'
        ? window.getProponenteFilter()
        : '';
    if (proponente) params.set('proponente', proponente);

    const search = params.toString() ? '?' + params.toString() : location.pathname;
    history.replaceState(null, '', search + location.hash);
}

function scheduleURLUpdate() {
    if (_applyingFromURL) return;
    if (_urlUpdateScheduled) return;
    _urlUpdateScheduled = true;
    requestAnimationFrame(() => {
        _urlUpdateScheduled = false;
        updateURL();
    });
}

function applyURLParams() {
    const params = new URLSearchParams(location.search);
    if (!params.toString()) return;

    _applyingFromURL = true;

    for (const [key, id] of Object.entries(URL_FILTER_MAP)) {
        const val = params.get(key);
        if (val) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }
    }

    const proponente = params.get('proponente') || '';
    if (proponente) {
        if (typeof window.setProponenteFilter === 'function') {
            window.setProponenteFilter(proponente);
        }
        if (window.chartFilterState) {
            window.chartFilterState.activeChartType = 'proponente';
            window.chartFilterState.activeChartValue = proponente;
        }
    }

    const q = params.get('q') || '';

    if (typeof window.applyExternalSmartSearch === 'function') {
        window.applyExternalSmartSearch(q);
    } else if (typeof window.applyFiltersUnified === 'function') {
        window.applyFiltersUnified();
    }

    if (typeof window.syncTopbarFromSelects === 'function') {
        setTimeout(() => window.syncTopbarFromSelects(), 150);
    }

    setTimeout(() => { _applyingFromURL = false; }, 300);
}

function initURLRouting() {
    // Ascolta cambio su tutti i select-filtro nascosti
    Object.values(URL_FILTER_MAP).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', scheduleURLUpdate);
    });

    // Smart search con debounce
    let searchDebounce = null;
    const searchInput = document.getElementById('smartSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(scheduleURLUpdate, 400);
        });
    }

    // Patcha applyFiltersUnified per aggiornare URL dopo ogni filtro
    const _origUnified = window.applyFiltersUnified;
    if (typeof _origUnified === 'function') {
        window.applyFiltersUnified = function() {
            _origUnified.apply(this, arguments);
            scheduleURLUpdate();
        };
        // Mantieni window.applyFilters sincronizzato
        if (typeof window.applyFilters === 'function' && window.applyFilters !== _origUnified) {
            // applyFilters è già l'unified — aggiorna il riferimento
        }
        window.applyFilters = window.applyFiltersUnified;
    }

    // Applica params URL dopo caricamento dati
    document.addEventListener('patti:dataLoaded', () => {
        setTimeout(applyURLParams, 100);
    });
}

document.addEventListener('DOMContentLoaded', initURLRouting);
