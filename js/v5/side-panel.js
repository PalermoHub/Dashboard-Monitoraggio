// Side Panel Flottante - Versione Corretta
// File: js/v5/side-panel.js

console.log('Side Panel: Inizio caricamento');

let panelMiniMap = null;
let currentPanelIndex = 0;
let panelFavorites = [];
let highlightedMarker = null;
let sidePanelData = null;
let currentSidePanelIndex = 0;

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
    if (document.getElementById('pattoSidePanel')) return;

    const html = `
        <div id="pattoSidePanel" class="side-panel">
            <div class="side-panel-header">
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
        console.log('Side Panel HTML creato dentro map-container');
    } else {
        // Fallback: inserisci nel body se map-container non esiste
        document.body.insertAdjacentHTML('beforeend', html);
        console.log('Side Panel HTML creato nel body (map-container non trovato)');
    }
}

function addSidePanelStyles() {
    if (document.getElementById('sidePanelStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'sidePanelStyles';
    styles.textContent = `
        /* SIDE PANEL - CONTAINER PRINCIPALE */
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

        .side-panel-overlay {
            display: none !important;
            visibility: hidden;
            opacity: 0;
        }

        /* HEADER */
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

        /* CONTENT */
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

        .side-panel-content::-webkit-scrollbar-thumb:hover {
            background: var(--color-gray-500);
        }

        /* FOOTER */
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

        /* SEZIONI */
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

        @keyframes side-panel-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
        }

        .side-panel-highlight-pulse {
            animation: side-panel-pulse 1.5s ease-in-out infinite !important;
        }

        /* MEDIA QUERY - DESKTOP GRANDE */
        @media (max-width: 1400px) {
            .side-panel {
                width: 300px;
                right: -320px;
                max-width: 35%;
            }
            .panel-minimap-wrapper {
                height: 100px;
            }
        }

        @media (max-width: 1024px) {
            .side-panel {
                width: 280px;
                right: -300px;
                max-width: 30%;
            }
            .side-panel-header {
                min-height: 44px;
                padding: 10px;
            }
            .panel-minimap-wrapper {
                height: 90px;
            }
        }

        /* MEDIA QUERY - TABLET */
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
    console.log('Side Panel CSS aggiunto');
}

function openSidePanel(pattoId) {
    console.log('Apertura panel per patto:', pattoId);
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
        console.error('Patto non trovato');
        return;
    }

    currentPanelIndex = window.allData.indexOf(patto);
    populateSidePanelContent(patto);
    setupSidePanelListeners();

    const panel = document.getElementById('pattoSidePanel');
    panel.classList.add('open');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => lucide.createIcons(), 100);
    }

    setTimeout(() => {
        const patto = window.allData[currentPanelIndex];
        if (patto) syncMapWithSidePanel(patto);
    }, 300);
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
                <i data-lucide="download"></i>
                <span>Patto n° ${pattoId}</span>
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
        link.innerHTML = '<i data-lucide="map"></i> <span>Google Maps</span>';
        links.appendChild(link);
    }

    const photoContainer = document.getElementById('panelPhotoContainer');
    if (keys.foto && patto[keys.foto]) {
        photoContainer.classList.remove('hidden');
        document.getElementById('panelPhoto').src = patto[keys.foto];
    } else {
        photoContainer.classList.add('hidden');
    }

    highlightMarkerOnMap(patto);
    setTimeout(() => initializeSidePanelMiniMap(patto), 300);
    updateSidePanelCounter();

    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 100);
}

function highlightMarkerOnMap(patto) {
    if (!window.map || !patto.lat || !patto.lng) return;
    if (!window.map._container) return; // Verifica che la mappa sia inizializzata
    
    try {
        if (highlightedMarker) {
            try {
                window.map.removeLayer(highlightedMarker);
            } catch (e) {}
        }
        
        highlightedMarker = L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
            radius: 15,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 4,
            opacity: 1,
            fillOpacity: 0.7,
            className: 'highlighted-marker-pulse'
        }).addTo(window.map);

        window.map.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 16, { 
            animate: true, 
            duration: 0.5 
        });
    } catch (error) {
        console.warn('Errore highlight marker:', error);
    }
}

function initializeSidePanelMiniMap(patto) {
    if (panelMiniMap) {
        try { panelMiniMap.remove(); } catch (e) {}
        panelMiniMap = null;
    }

    const container = document.getElementById('panelMiniMap');
    if (!container || !patto.lat || !patto.lng) return;

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
    } catch (error) {
        console.error('Errore minimap:', error);
    }
}

function closeSidePanel() {
    const panel = document.getElementById('pattoSidePanel');
    if (panel) {
        panel.classList.remove('open');
        if (panelMiniMap) {
            try { panelMiniMap.remove(); } catch (e) {}
            panelMiniMap = null;
        }
        if (highlightedMarker && window.map) {
            window.map.removeLayer(highlightedMarker);
            highlightedMarker = null;
        }
    }
}

function setupSidePanelListeners() {
    const closeBtn = document.getElementById('closeSidePanel');
    if (closeBtn) closeBtn.addEventListener('click', closeSidePanel);

    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateSidePanel(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateSidePanel(1));

    document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('pattoSidePanel');
        if (!panel || !panel.classList.contains('open')) return;
        if (e.key === 'Escape') closeSidePanel();
        if (e.key === 'ArrowUp') navigateSidePanel(-1);
        if (e.key === 'ArrowDown') navigateSidePanel(1);
    });
}

function navigateSidePanel(direction) {
    const newIndex = currentPanelIndex + direction;
    if (newIndex >= 0 && newIndex < window.allData.length) {
        currentPanelIndex = newIndex;
        const patto = window.allData[currentPanelIndex];
        populateSidePanelContent(patto);
        const content = document.querySelector('.side-panel-content');
        if (content) content.scrollTop = 0;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        updateSidePanelCounter();
    }
}

function updateSidePanelCounter() {
    const counter = document.getElementById('sidePanelCounter');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');

    if (counter) counter.textContent = `${currentPanelIndex + 1}/${window.allData.length}`;
    if (prevBtn) prevBtn.disabled = currentPanelIndex === 0;
    if (nextBtn) nextBtn.disabled = currentPanelIndex === window.allData.length - 1;
}

function syncMapWithSidePanel(patto) {
    if (!patto || !patto.lat || !patto.lng || !window.map) return;
    
    try {
        if (!window.map._container) return; // Verifica che la mappa sia inizializzata
        
        window.map.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 17, {
            animate: true,
            duration: 1.0,
            easeLinearity: 0.25
        });
    } catch (error) {
        console.warn('Errore sincronizzazione mappa:', error);
    }
}

window.showPattoDetails = openSidePanel;
loadPanelFavorites();

console.log('Side Panel caricato correttamente');