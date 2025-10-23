// Side Panel Flottante - VERSIONE CORRETTA
// File: js/v5/side-panel.js

console.log('Side Panel: Safe wrapper caricato');

// Stato di readiness
window.sidePanelReady = false;

// Funzione per verificare se la mappa è pronta
function isMapFullyReady() {
    // Verifica che la mappa esista
    if (!window.map || typeof window.map !== 'object') {
        return false;
    }

    // Verifica il contenitore
    if (!window.map._container) {
        return false;
    }

    // Verifica che il contenitore sia nel DOM
    if (!document.body.contains(window.map._container)) {
        return false;
    }

    // Verifica che il contenitore sia visibile
    if (window.map._container.offsetParent === null && window.map._container.offsetHeight === 0) {
        return false;
    }

    // Verifica che Leaflet sia caricato
    if (typeof L === 'undefined') {
        return false;
    }

    // Verifica che i dati siano caricati
    if (!window.allData || !Array.isArray(window.allData) || window.allData.length === 0) {
        return false;
    }

    return true;
}

// Attendi che tutto sia pronto
function initSidePanelWhenReady() {
    console.log('Attesa inizializzazione mappa e dati...');
    
    let attempts = 0;
    const maxAttempts = 120; // 2 minuti max
    
    const checker = setInterval(() => {
        attempts++;
        
        if (isMapFullyReady()) {
            console.log('✓ Tutto pronto - Side panel abilitato');
            window.sidePanelReady = true;
            clearInterval(checker);
            
            // Emetti evento custom per altri script
            window.dispatchEvent(new Event('sidePanelReady'));
        } else if (attempts % 10 === 0) {
            console.log('Tentativo ' + attempts + ':', {
                mapExists: !!window.map,
                mapContainer: !!(window.map && window.map._container),
                containerInDOM: window.map && window.map._container && document.body.contains(window.map._container),
                leafletReady: typeof L !== 'undefined',
                dataExists: !!window.allData,
                dataLength: window.allData ? window.allData.length : 0
            });
        }
        
        if (attempts >= maxAttempts) {
            console.error('Timeout: mappa non pronta dopo 2 minuti');
            clearInterval(checker);
        }
    }, 1000);
}

// Avvia il controllo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidePanelWhenReady);
} else {
    setTimeout(initSidePanelWhenReady, 500);
}

// ============================================================
// VARIABILI GLOBALI
// ============================================================

let panelMiniMap = null;
let currentPanelIndex = 0;
let panelFavorites = [];
let highlightedMarker = null;
let sidePanelData = null;
let currentSidePanelIndex = 0;

// ============================================================
// FUNZIONE GLOBALE: CHIUDI POPUP MAPPA
// ============================================================
window.closeMapPopups = function() {
    console.log('Chiusura popup mappa globale...');
    if (window.map && typeof window.map.closePopup === 'function') {
        try {
            window.map.closePopup();
            console.log('✓ Popup mappa chiuso');
        } catch (e) {
            console.warn('⚠ Errore chiusura popup:', e);
        }
    }
};

// ============================================================
// FUNZIONE PRINCIPALE: SINCRONIZZAZIONE MAPPA (CON RETRY SMART)
// ============================================================
function syncMapWithCurrentPatto(patto) {
    if (!patto || !patto.lat || !patto.lng) {
        console.warn('Sync fallito: coordinate mancanti');
        return false;
    }

    // Se side panel non è pronto, aspetta
    if (!window.sidePanelReady) {
        console.log('Side panel non pronto, ritento tra 300ms');
        setTimeout(() => syncMapWithCurrentPatto(patto), 300);
        return false;
    }

    try {
        // Verifica che la mappa sia disponibile e pronta
        if (!window.map || !isMapFullyReady()) {
            console.log('Mappa non completamente pronta, ritento tra 300ms');
            setTimeout(() => syncMapWithCurrentPatto(patto), 300);
            return false;
        }

        const lat = parseFloat(patto.lat);
        const lng = parseFloat(patto.lng);

        // Valida coordinate
        if (isNaN(lat) || isNaN(lng)) {
            console.warn('Coordinate non valide:', { lat: patto.lat, lng: patto.lng });
            return false;
        }

        // Rimuovi pulse marker precedente se esiste
        if (window.currentPulseMarker) {
            try {
                if (window.map.hasLayer(window.currentPulseMarker)) {
                    window.map.removeLayer(window.currentPulseMarker);
                }
            } catch (e) {
                console.warn('Errore rimozione pulse marker:', e);
            }
            window.currentPulseMarker = null;
        }

        // Crea nuovo pulse marker
        window.currentPulseMarker = L.circleMarker(
            [lat, lng],
            {
                radius: 20,
                fillColor: '#3b82f6',
                color: '#ffffff',
                weight: 4,
                opacity: 1,
                fillOpacity: 0.7,
                className: 'map-pulse-marker'
            }
        ).addTo(window.map);

        // Centra e zooma la mappa
        window.map.setView(
            [lat, lng],
            17,
            {
                animate: true,
                duration: 1.0,
                easeLinearity: 0.25
            }
        );

        console.log('✓ Mappa sincronizzata:', lat, lng);
        return true;

    } catch (error) {
        console.error('Errore sincronizzazione mappa:', error);
        console.log('Ritento tra 300ms');
        setTimeout(() => syncMapWithCurrentPatto(patto), 300);
        return false;
    }
}

// ============================================================
// MINIMAP NEL SIDE PANEL
// ============================================================
function initializeSidePanelMiniMap(patto) {
    console.log('Inizializzazione minimap side panel');
    
    // Pulisci minimap precedente
    if (panelMiniMap) {
        try { 
            panelMiniMap.remove(); 
        } catch (e) {
            console.warn('Errore rimozione minimap precedente:', e);
        }
        panelMiniMap = null;
    }

    // Ottieni container
    const container = document.getElementById('panelMiniMap');
    if (!container) {
        console.warn('Container panelMiniMap non trovato');
        return false;
    }

    // Verifica coordinate
    if (!patto || !patto.lat || !patto.lng) {
        console.warn('Coordinate mancanti per minimap');
        return false;
    }

    // Pulisci completamente il container
    container.innerHTML = '';

    try {
        // Verifica che Leaflet sia disponibile
        if (typeof L === 'undefined') {
            console.error('Leaflet non disponibile');
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Mappa non disponibile</p>';
            return false;
        }

        // Crea la minimap con delay per permettere al container di renderizzarsi
        setTimeout(() => {
            try {
                // Verifica che il container sia nel DOM
                if (!document.body.contains(container)) {
                    console.warn('Container non nel DOM');
                    return;
                }

                // Inizializza Leaflet map
                panelMiniMap = L.map(container, {
                    center: [parseFloat(patto.lat), parseFloat(patto.lng)],
                    zoom: 16,
                    dragging: true,
                    scrollWheelZoom: false,
                    zoomControl: true,
                    touchZoom: true,
                    doubleClickZoom: true
                });

                // Aggiungi tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap',
                    maxZoom: 19
                }).addTo(panelMiniMap);

                // Aggiungi marker
                L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
                    radius: 8,
                    fillColor: '#3b82f6',
                    color: 'white',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(panelMiniMap);

                // Forza il resize della mappa dopo il caricamento
                setTimeout(() => {
                    if (panelMiniMap && panelMiniMap._container) {
                        panelMiniMap.invalidateSize(true);
                        console.log('✓ Minimap inizializzata correttamente');
                    }
                }, 100);

            } catch (error) {
                console.error('Errore durante creazione minimap:', error);
                container.innerHTML = '<p style="text-align: center; color: #f87171; padding: 20px;">Errore caricamento mappa</p>';
            }
        }, 100);

        return true;

    } catch (error) {
        console.error('Errore inizializzazione minimap:', error);
        container.innerHTML = '<p style="text-align: center; color: #f87171; padding: 20px;">Errore caricamento mappa</p>';
        return false;
    }
}

// ============================================================
// HIGHLIGHT MARKER SULLA MAPPA PRINCIPALE
// ============================================================
function highlightMarkerOnMap(patto) {
    console.log('Evidenziamento marker per patto');
    
    if (!window.map || !patto || !patto.lat || !patto.lng) {
        console.warn('Mappa o coordinate non disponibili');
        return false;
    }
    
    if (!window.map._container) {
        console.warn('Contenitore mappa non inizializzato');
        return false;
    }
    
    try {
        // Rimuovi highlight precedente
        if (highlightedMarker) {
            try {
                window.map.removeLayer(highlightedMarker);
                console.log('Marker precedente rimosso');
            } catch (e) {
                console.warn('Errore rimozione marker precedente:', e);
            }
        }
        
        // Crea nuovo highlight con animazione pulse
        highlightedMarker = L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
            radius: 15,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 4,
            opacity: 1,
            fillOpacity: 0.7,
            className: 'highlighted-marker-pulse'
        }).addTo(window.map);

        console.log('✓ Marker evidenziato');
        return true;

    } catch (error) {
        console.error('Errore highlight marker:', error);
        return false;
    }
}

// ============================================================
// GESTIONE FAVORITI
// ============================================================
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

// ============================================================
// CREAZIONE HTML SIDE PANEL
// ============================================================
function createSidePanelHTML() {
    if (document.getElementById('pattoSidePanel')) {
        console.log('Side Panel HTML esiste già');
        return;
    }

    const html = `
        <div id="pattoSidePanel" class="side-panel">
            <div class="side-panel-header">
                <img src="img/patti.png" alt="Logo Patti" class="side-panel-logo" title="Patti di Collaborazione">
                <h2 id="sidePanelTitle" class="side-panel-title">Dettagli Patto</h2>
                <button id="closeSidePanel" class="side-panel-close" title="Chiudi">
                    <i data-lucide="x" class="h-5 w-5"></i>
                </button>
            </div>

            <div class="side-panel-content">
                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i data-lucide="info" class="h-4 w-4"></i>
                        Informazioni Generali
                    </h3>
                    <div id="panelDetails" class="panel-details"></div>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i data-lucide="activity" class="h-4 w-4"></i>
                        Stato
                    </h3>
                    <div id="panelStatus" class="panel-status"></div>
                </div>

                <div id="panelNotesContainer" class="panel-section hidden">
                    <h3 class="panel-section-title">
                        <i data-lucide="file-text" class="h-4 w-4"></i>
                        Note
                    </h3>
                    <p id="panelNotes" class="panel-notes"></p>
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i data-lucide="external-link" class="h-4 w-4"></i>
                        Collegamenti
                    </h3>
                    <div id="panelLinks" class="panel-links"></div>
                </div>

                <div id="panelPhotoContainer" class="panel-section hidden">
                    <h3 class="panel-section-title">
                        <i data-lucide="image" class="h-4 w-4"></i>
                        Foto
                    </h3>
                    <img id="panelPhoto" alt="Foto patto" class="panel-photo">
                </div>

                <div class="panel-section">
                    <h3 class="panel-section-title">
                        <i data-lucide="map-pin" class="h-4 w-4"></i>
                        Posizione
                    </h3>
                    <div id="panelMiniMapWrapper" class="panel-minimap-wrapper">
                        <div id="panelMiniMap" class="panel-minimap"></div>
                    </div>
                </div>
            </div>

            <div class="side-panel-footer">
                <button id="sidePanelPrevious" class="panel-nav-btn" title="Precedente">
                    <i data-lucide="chevron-up" class="h-4 w-4"></i>
                </button>
                <span id="sidePanelCounter" class="panel-counter">1/1</span>
                <button id="sidePanelNext" class="panel-nav-btn" title="Successivo">
                    <i data-lucide="chevron-down" class="h-4 w-4"></i>
                </button>
            </div>
        </div>
    `;

    // Inserisci il pannello DENTRO .map-container
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.insertAdjacentHTML('beforeend', html);
        console.log('✓ Side Panel HTML creato dentro map-container');
    } else {
        document.body.insertAdjacentHTML('beforeend', html);
        console.log('⚠ Side Panel HTML creato nel body');
    }
}

// ============================================================
// AGGIUNGI STILI CSS
// ============================================================
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
            background: var(--color-gray-50);
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
            color: var(--color-gray-600);
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

        @keyframes highlighted-marker-pulse {
            0%, 100% { 
                transform: scale(1); 
                opacity: 1;
            }
            50% { 
                transform: scale(1.3); 
                opacity: 0.7;
            }
        }

        .highlighted-marker-pulse {
            animation: highlighted-marker-pulse 1.5s ease-in-out infinite !important;
        }

        @media (max-width: 1400px) {
            .side-panel {
                width: 300px;
                right: -320px;
                max-width: 35%;
            }
        }

        @media (max-width: 1024px) {
            .side-panel {
                width: 280px;
                right: -300px;
                max-width: 30%;
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
            .side-panel.open {
                right: 0;
            }
        }
    `;

    document.head.appendChild(styles);
    console.log('✓ Side Panel CSS aggiunto');
}

// ============================================================
// POPOLA CONTENUTO SIDE PANEL
// ============================================================
function populateSidePanelContent(patto) {
    if (!patto) {
        console.error('Patto non valido');
        return;
    }

    const findDataKeys = () => {
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
            foto: Object.keys(patto).find(k => k.toLowerCase().includes('foto')),
            pdf: Object.keys(patto).find(k => k.toLowerCase().includes('scarica') && k.toLowerCase().includes('patto')),
            ambiti: Object.keys(patto).find(k => k.toLowerCase().includes('ambiti')),
            id: Object.keys(patto).find(k => k.toLowerCase() === 'id')
        };
    };

    const keys = findDataKeys();
    const statusColors = {
        'Istruttoria in corso': '#ffdb4d',
        'Respinta': '#ff6b6b',
        'Patto stipulato': '#8fd67d',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
        'In attesa di integrazione': '#b3e6ff',
        'Archiviata': '#94a3b8'
    };

    // Titolo
    document.getElementById('sidePanelTitle').textContent = patto[keys.titolo] || 'Patto senza titolo';

    // Dettagli
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

    // Stato
    const statoText = patto[keys.stato] || 'Non specificato';
    const status = document.getElementById('panelStatus');
    let statusHTML = `<div class="status-badge" style="background-color: ${statusColors[statoText] || '#6b7280'};">${statoText}</div>`;

    if (statoText === 'Patto stipulato' && keys.pdf && patto[keys.pdf]) {
        const pattoId = patto[keys.id] || 'XX';
        statusHTML += `
            <a href="${patto[keys.pdf].trim()}" download target="_blank" rel="noopener" class="download-pdf-btn" style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; background: #8fd67d; color: white; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 0.7rem;">
                <i data-lucide="download"></i>
                <span>Patto nº ${pattoId}</span>
            </a>
        `;
    }
    status.innerHTML = statusHTML;

    // Note
    const notesContainer = document.getElementById('panelNotesContainer');
    if (keys.nota && patto[keys.nota]) {
        notesContainer.classList.remove('hidden');
        document.getElementById('panelNotes').textContent = patto[keys.nota];
    } else {
        notesContainer.classList.add('hidden');
    }

    // Link
    const links = document.getElementById('panelLinks');
    links.innerHTML = '';
    if (keys.googlemaps && patto[keys.googlemaps]) {
        const link = document.createElement('a');
        link.href = patto[keys.googlemaps];
        link.target = '_blank';
        link.className = 'panel-link-btn';
        link.innerHTML = '<i data-lucide="map"></i> <span>Google Maps</span>';
        links.appendChild(link);
    }

    // Foto
    const photoContainer = document.getElementById('panelPhotoContainer');
    if (keys.foto && patto[keys.foto]) {
        photoContainer.classList.remove('hidden');
        document.getElementById('panelPhoto').src = patto[keys.foto];
    } else {
        photoContainer.classList.add('hidden');
    }

    // Highlight marker sulla mappa principale
    highlightMarkerOnMap(patto);

    // Inizializza minimap
    initializeSidePanelMiniMap(patto);

    // Sincronizza mappa principale
    syncMapWithCurrentPatto(patto);

    // Aggiorna counter
    updateSidePanelCounter();

    // Ricrea icone Lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// ============================================================
// NAVIGAZIONE SIDE PANEL
// ============================================================
function navigateSidePanel(direction) {
    const newIndex = currentPanelIndex + direction;
    
    console.log(`Navigazione: indice attuale ${currentPanelIndex}, nuovo indice ${newIndex}`);
    
    if (newIndex >= 0 && newIndex < window.allData.length) {
        currentPanelIndex = newIndex;
        const patto = window.allData[currentPanelIndex];
        
        console.log('Caricamento patto:', patto);
        
        // Chiudi popup della mappa
        window.closeMapPopups();
        
        // Popola il pannello
        populateSidePanelContent(patto);
        
        // Scroll al top
        const content = document.querySelector('.side-panel-content');
        if (content) content.scrollTop = 0;
        
        // Ricrea icone
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } else {
        console.warn('Indice fuori range:', newIndex);
    }
}

// ============================================================
// AGGIORNA COUNTER
// ============================================================
function updateSidePanelCounter() {
    const counter = document.getElementById('sidePanelCounter');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');

    if (counter) {
        counter.textContent = `${currentPanelIndex + 1}/${window.allData.length}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPanelIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPanelIndex === window.allData.length - 1;
    }
}

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================
function setupSidePanelListeners() {
    const closeBtn = document.getElementById('closeSidePanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidePanel);
        console.log('Event listener close panel configurato');
    }

    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            console.log('Navigazione pannello: PRECEDENTE');
            navigateSidePanel(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            console.log('Navigazione pannello: SUCCESSIVO');
            navigateSidePanel(1);
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('pattoSidePanel');
        if (!panel || !panel.classList.contains('open')) return;
        
        if (e.key === 'Escape') {
            console.log('Tasto ESC - Chiusura pannello');
            closeSidePanel();
        }
        if (e.key === 'ArrowUp') {
            console.log('Freccia SU - Navigazione precedente');
            navigateSidePanel(-1);
        }
        if (e.key === 'ArrowDown') {
            console.log('Freccia GIU - Navigazione successivo');
            navigateSidePanel(1);
        }
    });
}

// ============================================================
// APRI SIDE PANEL
// ============================================================
function openSidePanel(pattoId) {
    console.log('Apertura panel per patto ID:', pattoId);
    
    createSidePanelHTML();
    addSidePanelStyles();

    if (!window.allData || !Array.isArray(window.allData) || window.allData.length === 0) {
        console.error('Nessun dato disponibile');
        alert('I dati non sono ancora stati caricati. Attendi e riprova.');
        return;
    }

    const idKey = Object.keys(window.allData[0]).find(k => k.toLowerCase() === 'id');
    const patto = window.allData.find(p => p[idKey] == pattoId);

    if (!patto) {
        console.error('Patto non trovato:', pattoId);
        return;
    }

    currentPanelIndex = window.allData.indexOf(patto);
    
    // Chiudi popup della mappa
    window.closeMapPopups();
    
    // Popola il pannello
    populateSidePanelContent(patto);
    setupSidePanelListeners();

    const panel = document.getElementById('pattoSidePanel');
    panel.classList.add('open');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// ============================================================
// CHIUDI SIDE PANEL
// ============================================================
function closeSidePanel() {
    console.log('Chiusura side panel');
    
    const panel = document.getElementById('pattoSidePanel');
    if (panel) {
        panel.classList.remove('open');
        
        // Chiudi minimap
        if (panelMiniMap) {
            try { 
                panelMiniMap.remove(); 
            } catch (e) {}
            panelMiniMap = null;
        }
        
        // Rimuovi highlight marker
        if (highlightedMarker && window.map) {
            try {
                window.map.removeLayer(highlightedMarker);
                console.log('Highlight marker rimosso');
            } catch (e) {
                console.warn('Errore rimozione highlight:', e);
            }
            highlightedMarker = null;
        }

        // Rimuovi pulse marker dalla mappa principale
        if (window.currentPulseMarker && window.map) {
            try {
                window.map.removeLayer(window.currentPulseMarker);
                window.currentPulseMarker = null;
                console.log('Pulse marker rimosso');
            } catch (e) {
                console.warn('Errore rimozione pulse:', e);
            }
        }
    }
}

// ============================================================
// FUNZIONE GLOBALE PER APERTURA DETTAGLI
// ============================================================
window.showPattoDetails = openSidePanel;

// ============================================================
// CARICA FAVORITI ALL'AVVIO
// ============================================================
loadPanelFavorites();

console.log('✓ Side Panel caricato correttamente');