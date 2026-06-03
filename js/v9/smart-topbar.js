// ============================================================
// PATTI SMART TOPBAR — Bridge, Dropdown, Drawer, Chips
// ============================================================

const PST_STATUS_COLORS = {
    'stipulato':  '#10b981',
    'istruttoria':'#f59e0b',
    'integrazione':'#f97316',
    'monitoraggio':'#8b5cf6',
    'respinto':   '#ef4444',
    'archiviato': '#64748b'
};

function pstStatusColor(val) {
    if (!val) return '#94a3b8';
    const lc = val.toLowerCase();
    for (const [k, c] of Object.entries(PST_STATUS_COLORS)) {
        if (lc.includes(k)) return c;
    }
    return '#94a3b8';
}

// ── Bridge ────────────────────────────────────────────────────
function pattiSetFilter(selectId, value) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.value = value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
}

// ── Dropdown open/close ───────────────────────────────────────
let _openDd = null;

function pstOpenDd(ddId) {
    if (_openDd && _openDd !== ddId) {
        document.getElementById(_openDd)?.classList.remove('open');
    }
    const dd = document.getElementById(ddId);
    if (!dd) return;
    const wasOpen = dd.classList.contains('open');
    dd.classList.toggle('open', !wasOpen);
    _openDd = wasOpen ? null : ddId;
}

function pstCloseDds() {
    document.querySelectorAll('.pst-dd.open').forEach(d => d.classList.remove('open'));
    _openDd = null;
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.pst-btn-wrap') && !e.target.closest('.pst-search-wrap')) {
        pstCloseDds();
    }
});

// ── Stato dropdown ────────────────────────────────────────────
function pstToggleStatoDD() {
    const sel = document.getElementById('filterStato');
    const inner = document.getElementById('pst-stato-dd-inner');
    if (!sel || !inner) return;

    inner.innerHTML = '';
    const current = sel.value;

    Array.from(sel.options).forEach(opt => {
        if (!opt.value) return;
        const div = document.createElement('div');
        div.className = 'pst-dd-item' + (opt.value === current ? ' selected' : '');
        const color = pstStatusColor(opt.value);
        div.innerHTML = `<span class="pst-dd-status-dot" style="background:${color}"></span>
            <span class="pst-dd-check">${opt.value === current ? '✓' : ''}</span>
            ${opt.text}`;
        div.addEventListener('click', () => {
            pattiSetFilter('filterStato', opt.value === current ? '' : opt.value);
            pstCloseDds();
        });
        inner.appendChild(div);
    });

    if (!inner.children.length) {
        inner.innerHTML = '<div class="pst-dd-empty">Caricamento...</div>';
    }
    pstOpenDd('pst-stato-dd');
}

// ── Ambiti dropdown ───────────────────────────────────────────
function pstToggleAmbitiDD() {
    const sel = document.getElementById('filterAmbiti');
    const inner = document.getElementById('pst-ambiti-dd-inner');
    if (!sel || !inner) return;

    inner.innerHTML = '';
    const current = sel.value;

    Array.from(sel.options).forEach(opt => {
        if (!opt.value) return;
        const div = document.createElement('div');
        div.className = 'pst-dd-item' + (opt.value === current ? ' selected' : '');
        div.innerHTML = `<span class="pst-dd-check">${opt.value === current ? '✓' : ''}</span>${opt.text}`;
        div.addEventListener('click', () => {
            pattiSetFilter('filterAmbiti', opt.value === current ? '' : opt.value);
            pstCloseDds();
        });
        inner.appendChild(div);
    });

    if (!inner.children.length) {
        inner.innerHTML = '<div class="pst-dd-empty">Caricamento...</div>';
    }
    pstOpenDd('pst-ambiti-dd');
}

// ── Geo Drawer ────────────────────────────────────────────────

// Unique sorted values from allData, filtered by optional circoscrizione/quartiere constraints
function _pstGeoOptions(colMatch, constraints) {
    const data = window.allData || [];
    if (!data.length) return [];
    const sample = data[0];
    const colKey = Object.keys(sample).find(k => {
        const lc = k.toLowerCase();
        return colMatch === 'upl' ? lc === 'upl' : lc.includes(colMatch);
    });
    if (!colKey) return [];
    let filtered = data;
    if (constraints.circoscrizione) {
        const ck = Object.keys(sample).find(k => k.toLowerCase().includes('circoscrizione'));
        if (ck) filtered = filtered.filter(r => r[ck]?.trim() === constraints.circoscrizione.trim());
    }
    if (constraints.quartiere) {
        const qk = Object.keys(sample).find(k => k.toLowerCase().includes('quartiere'));
        if (qk) filtered = filtered.filter(r => r[qk]?.trim() === constraints.quartiere.trim());
    }
    return [...new Set(filtered.map(r => r[colKey]).filter(Boolean).map(v => v.trim()))].sort();
}

// Repopulate a visible drawer select preserving the first empty option
function _pstFillVisSelect(id, values, keepValue) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const first = sel.options[0];
    sel.innerHTML = '';
    if (first) sel.appendChild(first.cloneNode(true));
    values.forEach(v => {
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        sel.appendChild(o);
    });
    if (keepValue && values.includes(keepValue)) sel.value = keepValue;
}

function pstOpenGeoDrawer() {
    _syncGeoDrawerOptions();
    _pstAttachDrawerCascade();
    document.getElementById('pst-drawer-overlay').classList.add('open');
    document.getElementById('pst-geo-drawer').classList.add('open');
}

function pstCloseGeoDrawer() {
    document.getElementById('pst-drawer-overlay').classList.remove('open');
    document.getElementById('pst-geo-drawer').classList.remove('open');
}

// Populate visible drawer selects from allData, respecting currently applied filter values
function _syncGeoDrawerOptions() {
    const circVal  = document.getElementById('filterCircoscrizione')?.value || '';
    const quartVal = document.getElementById('filterQuartiere')?.value || '';
    const uplVal   = document.getElementById('filterUpl')?.value || '';

    _pstFillVisSelect('pst-vis-filterCircoscrizione',
        _pstGeoOptions('circoscrizione', {}), circVal);
    _pstFillVisSelect('pst-vis-filterQuartiere',
        _pstGeoOptions('quartiere', { circoscrizione: circVal }), quartVal);
    _pstFillVisSelect('pst-vis-filterUpl',
        _pstGeoOptions('upl', { circoscrizione: circVal, quartiere: quartVal }), uplVal);
}

// Attach live cascade listeners inside the drawer (once per element)
function _pstAttachDrawerCascade() {
    const circSel  = document.getElementById('pst-vis-filterCircoscrizione');
    const quartSel = document.getElementById('pst-vis-filterQuartiere');

    if (circSel && !circSel._pstCascade) {
        circSel.addEventListener('change', function () {
            const circVal = this.value;
            _pstFillVisSelect('pst-vis-filterQuartiere',
                _pstGeoOptions('quartiere', { circoscrizione: circVal }), '');
            _pstFillVisSelect('pst-vis-filterUpl',
                _pstGeoOptions('upl', { circoscrizione: circVal, quartiere: '' }), '');
        });
        circSel._pstCascade = true;
    }

    if (quartSel && !quartSel._pstCascade) {
        quartSel.addEventListener('change', function () {
            const circVal  = document.getElementById('pst-vis-filterCircoscrizione')?.value || '';
            const quartVal = this.value;
            _pstFillVisSelect('pst-vis-filterUpl',
                _pstGeoOptions('upl', { circoscrizione: circVal, quartiere: quartVal }), '');
        });
        quartSel._pstCascade = true;
    }
}

function pstApplyGeo() {
    ['filterCircoscrizione', 'filterQuartiere', 'filterUpl'].forEach(id => {
        const vis = document.getElementById('pst-vis-' + id);
        const hidden = document.getElementById(id);
        if (vis && hidden) hidden.value = vis.value;
    });
    _pstRunFilterCycle();
    pstCloseGeoDrawer();
}

function pstResetGeo() {
    ['filterCircoscrizione', 'filterQuartiere', 'filterUpl'].forEach(id => {
        const hidden = document.getElementById(id);
        if (hidden) hidden.value = '';
    });
    _pstRunFilterCycle();
    pstCloseGeoDrawer();
}

function _pstRunFilterCycle() {
    if (window.chartFilterState?.activeChartType !== null) {
        window.chartFilterState.activeChartType = null;
        window.chartFilterState.activeChartValue = null;
    }
    if (typeof applyFilters === 'function') applyFilters();
    setTimeout(() => { if (typeof updateFilters === 'function') updateFilters(); }, 100);
}

// ── Sync topbar UI from hidden selects ───────────────────────
function syncTopbarFromSelects() {
    _pstUpdateBadges();
    _pstRenderChips();
    _pstUpdateResultsCount();
}

function _pstUpdateBadges() {
    const stato = document.getElementById('filterStato')?.value;
    const statoBadge = document.getElementById('pst-stato-badge');
    const statoBtn  = document.getElementById('pst-stato-btn');
    if (statoBadge) statoBadge.style.display = stato ? 'inline-flex' : 'none';
    if (statoBtn)   statoBtn.classList.toggle('has-filter', !!stato);

    const ambiti = document.getElementById('filterAmbiti')?.value;
    const ambitiBadge = document.getElementById('pst-ambiti-badge');
    const ambitiBtn   = document.getElementById('pst-ambiti-btn');
    if (ambitiBadge) ambitiBadge.style.display = ambiti ? 'inline-flex' : 'none';
    if (ambitiBtn)   ambitiBtn.classList.toggle('has-filter', !!ambiti);

    const geoCount = ['filterCircoscrizione','filterQuartiere','filterUpl']
        .filter(id => document.getElementById(id)?.value).length;
    const geoBadge = document.getElementById('pst-geo-badge');
    const geoBtn   = document.getElementById('pst-geo-btn');
    if (geoBadge) {
        geoBadge.style.display = geoCount ? 'inline-flex' : 'none';
        geoBadge.textContent = geoCount || '';
    }
    if (geoBtn) geoBtn.classList.toggle('has-filter', !!geoCount);
}

const PST_CHIP_LABELS = {
    filterStato:           { label: 'Stato',           icon: 'fa-circle-half-stroke' },
    filterAmbiti:          { label: 'Ambito',          icon: 'fa-bullseye' },
    filterCircoscrizione:  { label: 'Circoscrizione',  icon: 'fa-map' },
    filterQuartiere:       { label: 'Quartiere',       icon: 'fa-map-pin' },
    filterUpl:             { label: 'UPL',             icon: 'fa-map-location-dot' }
};

function _pstRenderChips() {
    const bar = document.getElementById('activeFilterChips');
    if (!bar) return;
    bar.innerHTML = '';
    let count = 0;

    Object.entries(PST_CHIP_LABELS).forEach(([id, cfg]) => {
        const sel = document.getElementById(id);
        if (!sel?.value) return;
        count++;
        const chip = document.createElement('span');
        chip.className = 'pst-chip';
        chip.innerHTML = `<i class="fas ${cfg.icon}" style="font-size:.63rem;opacity:.7"></i>&nbsp;${cfg.label}: <strong>&nbsp;${sel.value}</strong>
            <button class="pst-chip-remove" title="Rimuovi filtro" aria-label="Rimuovi ${cfg.label}">
                <i class="fas fa-times"></i>
            </button>`;
        chip.querySelector('.pst-chip-remove').addEventListener('click', () => pattiSetFilter(id, ''));
        bar.appendChild(chip);
    });

    // Smart search chip
    const ssq = window.currentSmartSearchQuery || '';
    if (ssq.length >= 2) {
        count++;
        const chip = document.createElement('span');
        chip.className = 'pst-chip';
        chip.innerHTML = `<i class="fas fa-search" style="font-size:.63rem;opacity:.7"></i>&nbsp;Cerca: <strong>&nbsp;${ssq}</strong>
            <button class="pst-chip-remove" title="Rimuovi ricerca" aria-label="Rimuovi ricerca">
                <i class="fas fa-times"></i>
            </button>`;
        chip.querySelector('.pst-chip-remove').addEventListener('click', () => {
            if (typeof clearSmartSearchOnly === 'function') clearSmartSearchOnly();
        });
        bar.appendChild(chip);
    }

    bar.classList.toggle('has-chips', count > 0);
}

function _pstUpdateResultsCount() {
    const el = document.getElementById('pst-results-count');
    if (!el) return;
    const count = (typeof filteredData !== 'undefined') ? filteredData.length : '—';
    const total = (typeof allData !== 'undefined') ? allData.length : '';
    el.innerHTML = total
        ? `<strong>${count}</strong> / ${total}`
        : `<strong>${count}</strong>`;
}

// ── Hook into updateAllViewsUnified via polling ───────────────
(function pstHookWhenReady() {
    let attempts = 0;
    const iv = setInterval(() => {
        attempts++;
        if (attempts > 100) { clearInterval(iv); return; }

        if (typeof window.updateAllViewsUnified === 'function' && !window._pstHooked) {
            const orig = window.updateAllViewsUnified;
            window.updateAllViewsUnified = function() {
                orig.apply(this, arguments);
                syncTopbarFromSelects();
            };
            window._pstHooked = true;
        }

        // MutationObserver on filterCircoscrizione options = proxy for updateFilters() completion
        const circ = document.getElementById('filterCircoscrizione');
        if (circ && !window._pstObserver) {
            const obs = new MutationObserver(() => syncTopbarFromSelects());
            ['filterStato','filterAmbiti','filterCircoscrizione','filterQuartiere','filterUpl']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) obs.observe(el, { childList: true });
                });
            window._pstObserver = obs;
        }

        if (window._pstHooked && window._pstObserver) clearInterval(iv);
    }, 150);
})();

// Initial sync after data load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(syncTopbarFromSelects, 2000);
});

// Expose globals
window.pattiSetFilter       = pattiSetFilter;
window.pstToggleStatoDD     = pstToggleStatoDD;
window.pstToggleAmbitiDD    = pstToggleAmbitiDD;
window.pstOpenGeoDrawer     = pstOpenGeoDrawer;
window.pstCloseGeoDrawer    = pstCloseGeoDrawer;
window.pstApplyGeo          = pstApplyGeo;
window.pstResetGeo          = pstResetGeo;
window.syncTopbarFromSelects= syncTopbarFromSelects;
window.pstCloseDds          = pstCloseDds;
