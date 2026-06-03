// ==========================================
// MAP TOOLBAR CONTROLLER
// Gestisce layer switcher, home button e zoom slider
// ==========================================

const MAP_LAYERS = {
    standard: {
        name: 'Carto Base',
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
        options: { maxZoom: 19, subdomains: ['a', 'b', 'c'] }
    },
    satellite: {
        name: 'Satellite',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Satellite - 2025',
        options: { maxZoom: 19 }
    }
};

class MapToolbarController {
    constructor(map) {
        this.map = map;
        this.currentLayerType = 'standard';
        this.initialized = false;
        this.el = {};
    }

    init() {
        if (this.initialized) return false;
        if (!this.map) return false;

        this._findElements();
        this._disableMapEvents();
        this._bindEvents();
        this._switchLayer('standard', false);
        this._initZoomSlider();

        this.initialized = true;
        console.log('✅ MapToolbarController pronto');
        return true;
    }

    _findElements() {
        this.el.standardBtn  = document.getElementById('mapStandard');
        this.el.satelliteBtn = document.getElementById('mapSatellite');
        this.el.homeBtn      = document.getElementById('toolbarHome');
        this.el.zoomSlider   = document.getElementById('toolbarZoom');
        this.el.zoomValue    = document.getElementById('toolbarZoomValue');
    }

    /* Impedisce a Leaflet di catturare click e scroll sulla toolbar */
    _disableMapEvents() {
        const toolbar = document.getElementById('mapToolbar');
        if (!toolbar) return;
        L.DomEvent.disableClickPropagation(toolbar);
        L.DomEvent.disableScrollPropagation(toolbar);
    }

    /* Clona il nodo per rimuovere eventuali listener precedenti */
    _clone(key) {
        const el = this.el[key];
        if (!el || !el.parentNode) return;
        const fresh = el.cloneNode(true);
        el.parentNode.replaceChild(fresh, el);
        this.el[key] = fresh;
    }

    _bindEvents() {
        this._clone('homeBtn');
        if (this.el.homeBtn) {
            this.el.homeBtn.addEventListener('click', () => centerMapOnPalermo());
        }

        this._clone('standardBtn');
        if (this.el.standardBtn) {
            this.el.standardBtn.addEventListener('click', () => this._switchLayer('standard'));
        }

        this._clone('satelliteBtn');
        if (this.el.satelliteBtn) {
            this.el.satelliteBtn.addEventListener('click', () => this._switchLayer('satellite'));
        }
    }

    _switchLayer(type, notify = true) {
        if (!MAP_LAYERS[type] || !this.map) return;

        /* Rimuove TUTTI i tile layer esistenti (incluso quello di monitoraggio_p1) */
        const toRemove = [];
        this.map.eachLayer(l => { if (l instanceof L.TileLayer) toRemove.push(l); });
        toRemove.forEach(l => { try { this.map.removeLayer(l); } catch (_) {} });

        const cfg = MAP_LAYERS[type];
        const newLayer = L.tileLayer(cfg.url, { attribution: cfg.attribution, ...cfg.options });
        newLayer.addTo(this.map);
        this.currentLayerType = type;

        this._updateLayerUI();
        this._updateViewfinderColor(type);

        setTimeout(() => { this.map.invalidateSize && this.map.invalidateSize(); }, 100);

        if (notify) this._notify(`Mappa ${cfg.name} attivata`, 'success');
    }

    _updateLayerUI() {
        if (this.el.standardBtn)  this.el.standardBtn.classList.toggle('active',  this.currentLayerType === 'standard');
        if (this.el.satelliteBtn) this.el.satelliteBtn.classList.toggle('active', this.currentLayerType === 'satellite');
    }

    _updateViewfinderColor(type) {
        if (!window.currentHighlightMarker) return;
        const color = type === 'satellite' ? '#ff9900' : '#a09090';
        try {
            window.currentHighlightMarker.setIcon(L.divIcon({
                className: 'viewfinder-fallback',
                html: `<div style="border:2px solid ${color};border-radius:4px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.4);animation:pulseMarker 2s infinite">
                    <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:2px;height:16px;background:${color}"></div>
                    <div style="position:absolute;left:-10px;top:50%;transform:translateY(-50%);width:16px;height:2px;background:${color}"></div>
                    <div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);width:16px;height:2px;background:${color}"></div>
                    <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:2px;height:16px;background:${color}"></div>
                </div>`,
                iconSize: [30, 30], iconAnchor: [15, 15]
            }));
        } catch (_) {}
    }

    _initZoomSlider() {
        const slider = this.el.zoomSlider;
        const label  = this.el.zoomValue;
        if (!slider || !this.map) return;

        const setVal = (z) => {
            const clamped = Math.min(19, Math.max(13, Math.round(z)));
            slider.value = clamped;
            if (label) label.textContent = clamped;
        };

        slider.addEventListener('input', (e) => {
            const z = parseInt(e.target.value, 10);
            this.map.setZoom(z);
            if (label) label.textContent = z;
        });

        this.map.on('zoomend', () => setVal(this.map.getZoom()));

        setVal(this.map.getZoom());
    }

    _notify(msg, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(msg, type);
            return;
        }
        const n = document.createElement('div');
        n.textContent = msg;
        Object.assign(n.style, {
            position: 'fixed', top: '20px', right: '20px',
            padding: '10px 20px',
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000', fontSize: '14px'
        });
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }
}

// ==========================================
// FUNZIONI GLOBALI
// ==========================================

let mapToolbarInstance = null;

function centerMapOnPalermo() {
    if (!window.map) return;
    const PALERMO_CENTER = [38.1516, 13.3617];
    window.map.setView(PALERMO_CENTER, 13, { animate: true, duration: 1.5 });
    const c = L.circle(PALERMO_CENTER, {
        radius: 500, color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.2, weight: 2
    }).addTo(window.map);
    setTimeout(() => window.map.removeLayer(c), 2000);
}

function switchMapLayer(type) {
    if (mapToolbarInstance) mapToolbarInstance._switchLayer(type);
}

window.syncMapWithSidePanel = function(patto) {
    if (!patto || !patto.lat || !patto.lng || !window.map) return false;
    try {
        window.map.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 17,
            { animate: true, duration: 1.0, easeLinearity: 0.25 });
        return true;
    } catch (_) { return false; }
};

// ==========================================
// INIZIALIZZAZIONE (800ms — window.map è già settato da monitoraggio_p1)
// ==========================================

function initMapToolbar() {
    const m = window.map;
    if (!m || typeof m.removeLayer !== 'function') {
        setTimeout(initMapToolbar, 500);
        return;
    }

    mapToolbarInstance = new MapToolbarController(m);
    if (mapToolbarInstance.init()) {
        window.mapToolbar         = mapToolbarInstance;
        window.centerMapOnPalermo = centerMapOnPalermo;
        window.switchMapLayer     = switchMapLayer;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initMapToolbar, 800));
} else {
    setTimeout(initMapToolbar, 800);
}

console.log('🗺️ map-controls_layer.js (toolbar) caricato');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapToolbarController, initMapToolbar, centerMapOnPalermo, switchMapLayer };
}
