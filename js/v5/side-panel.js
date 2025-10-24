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

function addSidePanelStyles() {
    if (document.getElementById('sidePanelStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'sidePanelStyles';
    styles.textContent = `
        .side-panel {
            position: absolute;
            right: -340px;
            top: 0;
            bottom: 0;
            width: 320px;
            max-width: 40%;
            background: var(--color-white);
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            z-index: 1200;
            display: flex;
            flex-direction: column;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 1px solid var(--border-color);
            overflow: hidden;
        }

        .side-panel.open {
            right: 0;
        }

        .side-panel-header {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
            color: var(--color-white);
            flex-shrink: 0;
            gap: 8px;
            min-height: 48px;
        }

        .side-panel-logo {
            height: 32px;
            width: auto;
            max-width: 32px;
            object-fit: contain;
            flex-shrink: 0;
            transition: transform 0.3s ease;
        }

        .side-panel-logo:hover {
            transform: scale(1.05) rotate(-5deg);
        }

        .side-panel-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .side-panel-close {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: var(--color-white);
            border-radius: 4px;
            padding: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            min-width: 28px;
        }

        .side-panel-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .side-panel-close i {
            font-size: 16px;
        }

        .side-panel-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 12px;
            scroll-behavior: smooth;
        }

        .side-panel-content::-webkit-scrollbar {
            width: 5px;
        }

        .side-panel-content::-webkit-scrollbar-track {
            background: var(--color-gray-100);
        }

        .side-panel-content::-webkit-scrollbar-thumb {
            background: var(--color-gray-400);
            border-radius: 3px;
        }

        .side-panel-footer {
            padding: 10px;
            border-top: 1px solid var(--border-color);
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-shrink: 0;
            min-height: 44px;
        }

        .panel-nav-btn {
            background: var(--color-gray-200);
            border: none;
            color: var(--color-gray-700);
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            padding: 0;
            min-width: 28px;
        }

        .panel-nav-btn i {
            font-size: 14px;
        }

        .panel-nav-btn:hover:not(:disabled) {
            background: var(--color-accent);
            color: var(--color-white);
            transform: scale(1.1);
        }

        .panel-nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .panel-counter {
            font-size: 0.75rem;
            color: #ffffff;
            font-weight: 600;
            min-width: 50px;
            text-align: center;
        }

        .panel-section {
            margin-bottom: 14px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
        }

        .panel-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .panel-section.hidden {
            display: none;
        }

        .panel-section-title {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-gray-800);
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .panel-section-title i {
            font-size: 12px;
        }

        .panel-details {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .panel-details p {
            margin: 0;
            font-size: 0.8rem;
            color: var(--color-gray-700);
            line-height: 1.4;
        }

        .panel-details strong {
            color: var(--color-gray-800);
            font-weight: 600;
        }

        .panel-status {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 10px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.7rem;
            color: var(--color-white);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
        }

        .download-pdf-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 10px;
            background: var(--status-stipulato);
            color: var(--color-white);
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.7rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .download-pdf-btn i {
            font-size: 12px;
        }

        .download-pdf-btn:hover {
            background: var(--color-success);
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
        }

        .panel-notes {
            margin: 0;
            padding: 8px;
            background: var(--color-gray-50);
            border-left: 2px solid var(--color-accent);
            border-radius: 3px;
            font-size: 0.8rem;
            color: var(--color-gray-700);
            line-height: 1.5;
        }

        .panel-links {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .panel-link-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px;
            background: var(--color-gray-50);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--color-accent);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.8rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .panel-link-btn i {
            font-size: 14px;
        }

        .panel-link-btn:hover {
            background: var(--color-accent);
            color: var(--color-white);
            border-color: var(--color-accent);
            transform: translateX(2px);
        }

        .panel-photo {
            width: 100%;
            height: auto;
            max-height: 150px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
            object-fit: cover;
        }

        .panel-photo:hover {
            transform: scale(1.02);
        }

        .panel-minimap-wrapper {
            position: relative;
            width: 100%;
            height: 120px;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .panel-minimap {
            width: 100%;
            height: 100%;
            background: var(--color-gray-100);
        }

        @media (max-width: 1400px) {
            .side-panel {
                width: 300px;
                right: -320px;
                max-width: 35%;
            }
        }

        @media (max-width: 768px) {
            .side-panel {
                position: fixed;
                width: 100%;
                right: -100%;
                top: 0;
                bottom: 0;
                max-width: none;
            }
        }
    `;

    document.head.appendChild(styles);
    debugLog('✅ Side Panel CSS aggiunto', null);
}

// ==========================================
// 🟢 FUNZIONE PRINCIPALE: APRI SIDE PANEL
// ==========================================

function openSidePanel(pattoId) {
    debugLog('📖 OPEN PANEL', pattoId);
    
    createSidePanelHTML();
    addSidePanelStyles();

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
        <p><strong>Ambiti:</strong> ${patto[keys.ambiti] || 'N/A'}</p>
        <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
        <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
        <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
        <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
    `;

    const statoText = patto[keys.stato] || 'Non specificato';
    const statusColors = {
        'Istruttoria in corso': '#ffdb4d',
        'Respinta': '#ff6b6b',
        'Patto stipulato': '#8fd67d',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
        'In attesa di integrazione': '#b3e6ff',
        'Archiviata': '#94a3b8'
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
// 🟢 FUNZIONE HIGHLIGHT MARKER - VERSIONE CORRETTA
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
        
        // 🔭 CREA L'ICONA CON EMOJI (AFFIDABILE E SEMPLICE)
        const icon = L.divIcon({
            className: 'viewfinder-fallback',
            html: `
<div style="
    border: 2px solid #a09090;
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
    <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: #a09090;"></div>
    
    <!-- Linea orizzontale sinistra -->
    <div style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: #a09090;"></div>
    
    <!-- Linea orizzontale destra -->
    <div style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 16px; height:2px; background: #a09090;"></div>
    
    <!-- Linea verticale inferiore -->
    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: 16px; background: #a09090;"></div>
    
    <!-- Punto centrale
    <div style="width: 5px; height:5px; background:#a09090; border-radius: 50%;"></div> -->
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
            tipo: 'EMOJI'
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

function addPulseAnimation() {
    if (document.getElementById('pulseAnimationStyle')) return;
    
    const style = document.createElement('style');
    style.id = 'pulseAnimationStyle';
    style.textContent = `
        @keyframes pulseMarker {
            0% { 
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
        }
    `;
    document.head.appendChild(style);
    debugLog('✅ Animazione pulse aggiunta', null);
}

// ==========================================
// INIZIALIZZAZIONE
// ==========================================

loadPanelFavorites();
addPulseAnimation();

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