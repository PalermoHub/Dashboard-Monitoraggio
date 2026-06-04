// Side Panel Flottante - VERSIONE DEBUG COMPLETA
// File: js/v5/side-panel.js
// Icons: Font Awesome

console.log('🚀 Side Panel: Inizio caricamento');

let panelMiniMap = null;
let panelFavorites = [];
let highlightedMarker = null;
let sidePanelData = null;

let currentSidePanelIndex = 0;
let lastOpenedPattoId = null;

// ==========================================
// VARIABILI GLOBALI
// ==========================================

if (typeof window.allData === 'undefined') {
    window.allData = [];
}

if (typeof window.filteredData === 'undefined') {
    window.filteredData = [];
}

if (typeof window.sidePanelData === 'undefined') {
    window.sidePanelData = null;
}

if (typeof window.currentSidePanelIndex === 'undefined') {
    window.currentSidePanelIndex = 0;
}

if (typeof window.lastOpenedPattoId === 'undefined') {
    window.lastOpenedPattoId = null;
}

if (typeof window.currentHighlightedPattoId === 'undefined') {
    window.currentHighlightedPattoId = null;
}

// ==========================================
// 🟢 DEBUG HELPER FUNCTIONS
// ==========================================

function debugLog(title, data) {
    console.log(`%c${title}`, 'color: #3B82F6; font-weight: bold; font-size: 12px;', data);
}

function debugError(title, data) {
    console.error(`%c${title}`, 'color: #EF4444; font-weight: bold; font-size: 12px;', data);
}

// ==========================================
// 🟢 FUNZIONE HELPER: DETERMINA PERCORSO BASE
// ==========================================

// ==========================================
// 🟢 FUNZIONE HELPER: PERCORSO IMMAGINE
// ==========================================

function getImagePath(imageName) {
    // ✅ PERCORSO SEMPLICE: L'immagine è nella stessa cartella dello script
    // js/v5/side-panel.js -> js/v5/mirino.png
    const relativePath = imageName;
    
    debugLog('📂 Percorso immagine', {
        imageName,
        relativePath,
        location: 'mirino.png'
    });
    
    return relativePath;
}

// ==========================================
// 🟢 FUNZIONE PER VERIFICARE DISPONIBILITÀ IMMAGINE
// ==========================================

function checkImageAvailability(imagePath) {
    return new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
            debugError('⏱️ Timeout caricamento immagine', imagePath);
            resolve(false);
        }, 5000);
        
        img.onload = () => {
            clearTimeout(timeout);
            debugLog('✅ Immagine disponibile', imagePath);
            resolve(true);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            debugError('❌ Immagine non trovata', imagePath);
            resolve(false);
        };
        
        img.src = imagePath;
    });
}

// ==========================================
// FUNZIONE PER VERIFICARE SE LA MAPPA È PRONTA
// ==========================================

function isMapReady() {
    return window.map && 
           window.map._container &&
           window.map.getCenter &&
           typeof window.map.setView === 'function';
}

// ==========================================
// FUNZIONE GLOBALE PER CHIUDERE POPUP MAPPA
// ==========================================

window.closeMapPopups = function() {
    debugLog('📄 Chiusura popup mappa globale', null);
    if (window.map && typeof window.map.closePopup === 'function') {
        try {
            window.map.closePopup();
            debugLog('✅ Popup mappa chiuso', null);
        } catch (e) {
            debugError('⚠️ Errore chiusura popup', e);
        }
    }
};

function loadPanelFavorites() {
    try {
        panelFavorites = JSON.parse(localStorage.getItem('pattoFavorites') || '[]');
    } catch (e) {
        panelFavorites = [];
    }
}

function savePanelFavorites() {
    localStorage.setItem('pattoFavorites', JSON.stringify(panelFavorites));
}

function createSidePanelHTML() {
    if (document.getElementById('pattoSidePanel')) {
        debugLog('⚠️ Side Panel HTML esiste già', null);
        return;
    }

    const html = `
        <div id="pattoSidePanel" class="side-panel">
            <div class="side-panel-header">
                <img src="img/patti.png" alt="Logo Patti" class="side-panel-logo" title="Patti di Collaborazione">
                <h2 id="sidePanelTitle" class="side-panel-title">Dettagli Patto</h2>
                <button id="closeSidePanel" class="side-panel-close" title="Chiudi">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="side-panel-content">
                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i class="fas fa-info-circle"></i>
                        Informazioni Generali
                    </h3>
                    <div id="panelDetails" class="panel-details"></div>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i class="fas fa-pulse"></i>
                        Stato
                    </h3>
                    <div id="panelStatus" class="panel-status"></div>
                </div>

                <div id="panelNotesContainer" class="panel-section hidden">
                    <h3 class="panel-section-title">
                        <i class="fas fa-file-alt"></i>
                        Note
                    </h3>
                    <p id="panelNotes" class="panel-notes"></p>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i class="fas fa-link"></i>
                        Collegamenti
                    </h3>
                    <div id="panelLinks" class="panel-links"></div>
                </div>

                <div id="panelPhotoContainer" class="panel-section hidden">
                    <h3 class="panel-section-title">
                        <i class="fas fa-image"></i>
                        Foto
                    </h3>
                    <img id="panelPhoto" alt="Foto patto" class="panel-photo">
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        Posizione
                    </h3>
                    <div id="panelMiniMapWrapper" class="panel-minimap-wrapper">
                        <div id="panelMiniMap" class="panel-minimap"></div>
                    </div>
                </div>
            </div>

            <div class="side-panel-footer">
                <button id="sidePanelPrevious" class="panel-nav-btn" title="Precedente">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <span id="sidePanelCounter" class="panel-counter">1/1</span>
                <button id="sidePanelNext" class="panel-nav-btn" title="Successivo">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
    `;

    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.insertAdjacentHTML('beforeend', html);
        debugLog('✅ Side Panel HTML creato', 'dentro map-container');
    } else {
        document.body.insertAdjacentHTML('beforeend', html);
        debugError('⚠️ map-container non trovato', 'Side Panel HTML creato nel body');
    }
}

// ==========================================
// 🟢 FUNZIONE PRINCIPALE: APRI SIDE PANEL
// ==========================================

function openSidePanel(pattoId) {
    debugLog('📖 OPEN PANEL', pattoId);
    
    createSidePanelHTML();

    if (!window.allData || window.allData.length === 0) {
        debugError('❌ Nessun dato in window.allData', null);
        return;
    }

    const idKey = Object.keys(window.allData[0]).find(k => k.toLowerCase() === 'id');
    
    let searchIn = window.allData;
    let source = 'allData';
    
    if (window.filteredData && window.filteredData.length > 0) {
        searchIn = window.filteredData;
        source = 'filteredData';
    }
    
    debugLog(`🔍 Cercando in ${source}`, {
        elementi: searchIn.length,
        pattoId
    });
    
    const patto = searchIn.find(p => p[idKey] == pattoId);

    if (!patto) {
        debugError('❌ Patto non trovato', pattoId);
        return;
    }

    sidePanelData = searchIn;
    currentSidePanelIndex = sidePanelData.indexOf(patto);
    lastOpenedPattoId = pattoId;

    debugLog('✅ Patto trovato', {
        source,
        indice: currentSidePanelIndex,
        totale: sidePanelData.length,
        titolo: patto[Object.keys(patto).find(k => k.toLowerCase().includes('titolo'))]
    });

    window.closeMapPopups?.();
    populateSidePanelContent(patto);
    setupSidePanelListeners();

    const panel = document.getElementById('pattoSidePanel');

    // Su mobile sposta nel body così position:fixed è relativo al viewport reale
    if (window.innerWidth <= 768 && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }

    panel.classList.add('open');

    if (window.map) {
        syncMapWithSidePanel(patto);
    }
    
    updateSidePanelCounter();
}

function populateSidePanelContent(patto) {
    const findDataKeys = () => {
        if (!patto) return {};
        return {
            titolo: Object.keys(patto).find(k => k.toLowerCase().includes('titolo') && k.toLowerCase().includes('proposta')),
            proponente: Object.keys(patto).find(k => k.toLowerCase().includes('proponente')),
            rappresentante: Object.keys(patto).find(k => k.toLowerCase().includes('rappresentante')),
            upl: Object.keys(patto).find(k => k.toLowerCase() === 'upl'),
            quartiere: Object.keys(patto).find(k => k.toLowerCase().includes('quartiere')),
            circoscrizione: Object.keys(patto).find(k => k.toLowerCase().includes('circoscrizione')),
            indirizzo: Object.keys(patto).find(k => k.toLowerCase().includes('indirizzo')),
            stato: Object.keys(patto).find(k => k.toLowerCase().includes('stato')),
            nota: Object.keys(patto).find(k => k.toLowerCase().includes('nota')),
            googlemaps: Object.keys(patto).find(k => k.toLowerCase().includes('googlemaps')),
            geouri: Object.keys(patto).find(k => k.toLowerCase().includes('geouri')),
            foto: Object.keys(patto).find(k => k.toLowerCase().includes('foto')),
            pdf: Object.keys(patto).find(k => k.toLowerCase().includes('scarica') && k.toLowerCase().includes('patto')),
            ambiti: Object.keys(patto).find(k => k.toLowerCase().includes('ambiti')),
            id: Object.keys(patto).find(k => k.toLowerCase() === 'id')
        };
    };

    const keys = findDataKeys();

    document.getElementById('sidePanelTitle').textContent = patto[keys.titolo] || 'Patto senza titolo';

    const details = document.getElementById('panelDetails');
    details.innerHTML = `
        <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
        <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
        <p><strong>Ambito:</strong> ${patto[keys.ambiti] || 'N/A'}</p>
        <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
        <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
        <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
        <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
    `;

    const statoText = patto[keys.stato] || 'Non specificato';
    const statusColors = {
    'Istruttoria in corso':     '#f59e0b',  // var(--status-istruttoria)
    'Respinta':                 '#ef4444',  // var(--status-respinto)
    'Patto stipulato':          '#10b981',  // var(--status-stipulato)
    'Proroga e/o Monitoraggio': '#8b5cf6',  // var(--status-monitoraggio)
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#8b5cf6',
    'In attesa di integrazione':'#f97316',  // var(--status-integrazione)
    'Archiviata':               '#64748b',  // var(--status-archiviato)
    'Archiviato':               '#64748b'
};

    const status = document.getElementById('panelStatus');
    let statusHTML = `<div class="status-badge" style="background-color: ${statusColors[statoText] || '#6b7280'};">${statoText}</div>`;

    if (statoText === 'Patto stipulato' && keys.pdf && patto[keys.pdf]) {
        const pattoId = patto[keys.id] || 'XX';
        statusHTML += `
            <a href="${patto[keys.pdf].trim()}" download target="_blank" rel="noopener" class="download-pdf-btn">
                <i class="fas fa-download"></i>
                <span>Patto nº ${pattoId}</span>
            </a>
        `;
    }
    status.innerHTML = statusHTML;

    const notesContainer = document.getElementById('panelNotesContainer');
    if (keys.nota && patto[keys.nota]) {
        notesContainer.classList.remove('hidden');
        document.getElementById('panelNotes').textContent = patto[keys.nota];
    } else {
        notesContainer.classList.add('hidden');
    }

    const links = document.getElementById('panelLinks');
    links.innerHTML = '';
    if (keys.googlemaps && patto[keys.googlemaps]) {
        const link = document.createElement('a');
        link.href = patto[keys.googlemaps];
        link.target = '_blank';
        link.className = 'panel-link-btn';
        link.innerHTML = '<i class="fas fa-map"></i> <span>Google Maps</span>';
        links.appendChild(link);
    }

    const photoContainer = document.getElementById('panelPhotoContainer');
    if (keys.foto && patto[keys.foto]) {
        photoContainer.classList.remove('hidden');
        document.getElementById('panelPhoto').src = patto[keys.foto];
    } else {
        photoContainer.classList.add('hidden');
    }

    // 🟢 HIGHLIGHT MARKER SULLA MAPPA PRINCIPALE
    highlightSidePanelMarker(patto);
    
    setTimeout(() => initializeSidePanelMiniMap(patto), 300);
    updateSidePanelCounter();
}

// ==========================================
// 🎯 FUNZIONE HIGHLIGHT MARKER - VERSIONE CON COLORE DINAMICO
// Sostituisci la funzione highlightSidePanelMarker esistente in side-panel.js
// ==========================================

async function highlightSidePanelMarker(patto) {
    debugLog('🟯 highlightSidePanelMarker CHIAMATA', {
        id: patto?.id,
        lat: patto?.lat,
        lng: patto?.lng,
        mapReady: isMapReady()
    });
    
    if (!patto.lat || !patto.lng) {
        debugError('❌ Coordinate mancanti', { lat: patto?.lat, lng: patto?.lng });
        return;
    }

    if (!window.map) {
        debugError('❌ Mappa non disponibile', null);
        return;
    }
    
    try {
        // Rimuovi marker precedente
        if (window.currentHighlightMarker && window.map) {
            try {
                window.map.removeLayer(window.currentHighlightMarker);
                debugLog('🔭 Marker precedente rimosso', null);
            } catch (e) {}
        }
        
        const lat = parseFloat(patto.lat);
        const lng = parseFloat(patto.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            debugError('❌ Coordinate invalide', { lat, lng });
            return;
        }
        
        debugLog('🟯 Coordinate valide', { lat, lng });
        
        // 🎨 DETERMINA IL COLORE IN BASE AL LAYER ATTIVO
        let viewfinderColor = '#a09090'; // Default grigio
        
        // Controlla quale layer è attivo
        if (window.mapLayerSwitcher && window.mapLayerSwitcher.currentLayerType === 'satellite') {
            viewfinderColor = '#ff9900'; // Arancione per satellite
            debugLog('🛰️ Layer satellite attivo - usando colore arancione', null);
        } else {
            debugLog('🗺️ Layer standard attivo - usando colore grigio', null);
        }
        
        // 🔭 CREA L'ICONA MIRINO CON IL COLORE CORRETTO
        const icon = L.divIcon({
            className: 'viewfinder-fallback',
            html: `
<div style="
    border: 2px solid ${viewfinderColor};
    border-radius: 4px;
    width: 30px; 
    height: 30px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(59, 130, 246, 0.7);
    animation: pulseMarker 2s infinite;
">
    <!-- Linea verticale superiore -->
    <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: ${viewfinderColor};"></div>
    
    <!-- Linea orizzontale sinistra -->
    <div style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: ${viewfinderColor};"></div>
    
    <!-- Linea orizzontale destra -->
    <div style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: ${viewfinderColor};"></div>
    
    <!-- Linea verticale inferiore -->
    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: ${viewfinderColor};"></div>
</div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        // 🔭 AGGIUNGI IL MARKER ALLA MAPPA
        window.currentHighlightMarker = L.marker([lat, lng], {
            icon: icon,
            zIndexOffset: 1000
        }).addTo(window.map);
        
        debugLog('🔭 Marker aggiunto alla mappa', {
            lat,
            lng,
            colore: viewfinderColor,
            tipo: viewfinderColor === '#ff9900' ? 'SATELLITE' : 'STANDARD'
        });
        
    } catch (error) {
        debugError('❌ Errore highlightSidePanelMarker', error);
    }
}

function initializeSidePanelMiniMap(patto) {
    debugLog('🗺️ Inizializzazione minimap', { lat: patto?.lat, lng: patto?.lng });
    
    if (panelMiniMap) {
        try { 
            panelMiniMap.remove(); 
        } catch (e) {}
        panelMiniMap = null;
    }

    const container = document.getElementById('panelMiniMap');
    if (!container || !patto.lat || !patto.lng) {
        debugError('❌ Container o coordinate mancanti', null);
        return;
    }

    container.innerHTML = '';

    try {
        panelMiniMap = L.map(container, {
            center: [parseFloat(patto.lat), parseFloat(patto.lng)],
            zoom: 16,
            dragging: true,
            scrollWheelZoom: false,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(panelMiniMap);

        L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
            radius: 8,
            fillColor: '#3b82f6',
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(panelMiniMap);

        setTimeout(() => panelMiniMap && panelMiniMap.invalidateSize(true), 100);
        debugLog('✅ Minimap inizializzata', null);
    } catch (error) {
        debugError('❌ Errore minimap', error);
    }
}

function closeSidePanel() {
    debugLog('📖 Chiusura panel', null);
    
    const panel = document.getElementById('pattoSidePanel');
    if (panel) {
        panel.classList.remove('open');
        
        if (panelMiniMap) {
            try { 
                panelMiniMap.remove(); 
            } catch (e) {}
            panelMiniMap = null;
        }
        
        // Rimuovi marker viewfinder
        if (window.currentHighlightMarker && window.map) {
            try {
                window.map.removeLayer(window.currentHighlightMarker);
                debugLog('✅ Marker rimosso', null);
            } catch (e) {}
            window.currentHighlightMarker = null;
        }
    }
}

function setupSidePanelListeners() {
    const closeBtn = document.getElementById('closeSidePanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidePanel);
    }

    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            debugLog('📼 Navigazione pannello: PRECEDENTE', null);
            navigateSidePanel(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            debugLog('📽 Navigazione pannello: SUCCESSIVO', null);
            navigateSidePanel(1);
        });
    }

    document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('pattoSidePanel');
        if (!panel || !panel.classList.contains('open')) return;
        
        if (e.key === 'Escape') closeSidePanel();
        if (e.key === 'ArrowUp') navigateSidePanel(-1);
        if (e.key === 'ArrowDown') navigateSidePanel(1);
    });
}

function navigateSidePanel(direction) {
    debugLog('📄 NAVIGATE', {
        direction,
        dataLength: sidePanelData?.length
    });

    if (!sidePanelData || sidePanelData.length === 0) {
        debugError('❌ Nessun dato', null);
        return;
    }

    const newIndex = currentSidePanelIndex + direction;

    if (newIndex >= 0 && newIndex < sidePanelData.length) {
        currentSidePanelIndex = newIndex;
        const patto = sidePanelData[currentSidePanelIndex];

        debugLog(`📄 Navigazione a patto`, {
            indice: currentSidePanelIndex + 1,
            totale: sidePanelData.length
        });

        window.closeMapPopups?.();
        populateSidePanelContent(patto);

        const content = document.querySelector('.side-panel-content');
        if (content) content.scrollTop = 0;
        
        updateSidePanelCounter();

        setTimeout(() => {
            if (window.map) {
                syncMapWithSidePanel(patto);
            }
        }, 300);
    }
}

function updateSidePanelCounter() {
    const counter = document.getElementById('sidePanelCounter');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');

    const total = sidePanelData?.length || 1;
    const current = currentSidePanelIndex || 0;

    if (counter) {
        counter.textContent = `${current + 1}/${total}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = current === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = current === (total - 1);
    }
}

function syncMapWithSidePanel(patto) {
    debugLog('🗺️ Sincronizzazione mappa', {
        id: patto?.id,
        lat: patto?.lat,
        lng: patto?.lng
    });
    
    if (!patto || !patto.lat || !patto.lng) {
        debugError('❌ Dati mancanti', null);
        return;
    }
    
    if (!isMapReady()) {
        debugError('❌ Mappa non pronta', null);
        return;
    }
    
    try {
        window.map.setView(
            [parseFloat(patto.lat), parseFloat(patto.lng)], 
            17, 
            {
                animate: true,
                duration: 1.0,
                easeLinearity: 0.25
            }
        );
        
        debugLog('✅ Mappa sincronizzata', null);
    } catch (error) {
        debugError('❌ Errore sincronizzazione mappa', error);
    }
}

// ==========================================
// AGGIUNTA ANIMAZIONE CSS PULSE
// ==========================================

loadPanelFavorites();

window.showPattoDetails = openSidePanel;

// 🟢 RENDI LE FUNZIONI GLOBALI PER DEBUG
window.debugLog = debugLog;
window.debugError = debugError;
window.getImagePath = getImagePath;
window.checkImageAvailability = checkImageAvailability;

// 🟢 LOG FINALE
debugLog('✅ Side Panel caricato correttamente', {
    imagePath: getImagePath('mirino.png'),
    mapReady: isMapReady(),
    dataAvailable: window.allData?.length > 0
});