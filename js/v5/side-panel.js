// Side Panel Flottante - Versione Migliorata
// File: js/v5/side-panel.js

console.log('Side Panel: Inizio caricamento');

// Variabili globali
let panelMiniMap = null;
let currentPanelIndex = 0;
let panelFavorites = [];
let highlightedMarker = null; // ✅ NUOVO: Per evidenziare il marker corrente
let sidePanelData = null;      // Array dei dati correnti (filtrati o no)
let currentSidePanelIndex = 0;  // Indice nel sidePanelData

// Carica preferiti da localStorage
function loadPanelFavorites() {
    try {
        panelFavorites = JSON.parse(localStorage.getItem('pattoFavorites') || '[]');
    } catch (e) {
        panelFavorites = [];
    }
}

// Salva preferiti
function savePanelFavorites() {
    localStorage.setItem('pattoFavorites', JSON.stringify(panelFavorites));
}

// Crea HTML del pannello
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

        <div id="sidePanelOverlay" class="side-panel-overlay"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    console.log('Side Panel HTML creato');
}

// ✅ CORREZIONE: Aggiungi CSS con altezza corretta
function addSidePanelStyles() {
    if (document.getElementById('sidePanelStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'sidePanelStyles';
    styles.textContent = `
        .side-panel {
            position: fixed;
            right: -400px;
            top: 70px; /* ✅ Inizia dopo l'header */
            bottom: 60px; /* ✅ Finisce prima del footer */
            width: 400px;
            background: var(--color-white);
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            z-index: 1200;
            display: flex;
            flex-direction: column;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 1px solid var(--border-color);
        }

        .side-panel.open {
            right: 0;
        }

        .side-panel-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0);
            z-index: 1199;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            pointer-events: none;
        }

       /* .side-panel.open ~ .side-panel-overlay {
            opacity: 0.3;
            visibility: visible;
            pointer-events: auto;
        }*/

        .side-panel-header {
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
            color: var(--color-white);
            flex-shrink: 0;
            gap: 12px;
        }

        .side-panel-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin: 0;
            flex: 1;
        }

        .side-panel-close {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: var(--color-white);
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            min-height: 36px;
        }

        .side-panel-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .side-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            scroll-behavior: smooth;
        }

        .panel-section {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
        }

        .panel-section.hidden {
            display: none;
        }

        .panel-section-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--color-gray-800);
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .panel-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .panel-details p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--color-gray-700);
            line-height: 1.5;
        }

        .panel-details strong {
            color: var(--color-gray-800);
            font-weight: 600;
        }

        .panel-status {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        /* ✅ CORREZIONE: Stato con colori dinamici */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--color-white);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* ✅ NUOVO: Pulsante PDF download */
        .download-pdf-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: var(--status-stipulato);
            color: var(--color-white);
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .download-pdf-btn:hover {
            background: var(--color-success);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .download-pdf-btn i {
            width: 16px;
            height: 16px;
        }

        .panel-notes {
            margin: 0;
            padding: 12px;
            background: var(--color-gray-50);
            border-left: 4px solid var(--color-accent);
            border-radius: 4px;
            font-size: 0.875rem;
            color: var(--color-gray-700);
            line-height: 1.6;
        }

        .panel-links {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .panel-link-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: var(--color-gray-50);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: var(--color-accent);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.875rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .panel-link-btn:hover {
            background: var(--color-accent);
            color: var(--color-white);
            border-color: var(--color-accent);
            transform: translateX(4px);
        }

        .panel-photo {
            width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }

        .panel-photo:hover {
            transform: scale(1.02);
        }

        .panel-minimap-wrapper {
            position: relative;
            width: 100%;
            height: 250px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .panel-minimap {
            width: 100%;
            height: 100%;
            background: var(--color-gray-100);
        }

        .side-panel-footer {
            padding: 16px;
            border-top: 1px solid var(--border-color);
            background: var(--color-gray-50);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .panel-nav-btn {
            background: var(--color-gray-200);
            border: none;
            color: var(--color-gray-700);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
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
            font-size: 0.875rem;
            color: var(--color-gray-600);
            font-weight: 600;
            min-width: 60px;
            text-align: center;
        }

        /* ✅ MOBILE: Pannello a schermo intero */
        @media (max-width: 768px) {
            .side-panel {
                width: 100%;
                right: -100%;
                top: 60px; /* Dopo header mobile */
                bottom: 0; /* Fino al fondo (copre footer) */
            }
        }
		/* Animazione highlight mappa */
        @keyframes side-panel-pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.7;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .side-panel-highlight-pulse {
            animation: side-panel-pulse 2s ease-in-out infinite !important;
        }
		
    `;

    document.head.appendChild(styles);
    console.log('Side Panel CSS aggiunto');
}

// ✅ NUOVO: Funzione per evidenziare marker nella mappa
function highlightMarkerOnMap(patto) {
    if (!window.map || !window.markersLayer) return;
    
    // Rimuovi l'evidenziazione precedente
    if (highlightedMarker) {
        window.map.removeLayer(highlightedMarker);
        highlightedMarker = null;
    }
    
    if (!patto || !patto.lat || !patto.lng) return;
    
    // Crea un marker pulsante piÃ¹ grande
    highlightedMarker = L.circleMarker([patto.lat, patto.lng], {
        radius: 15,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 4,
        opacity: 1,
        fillOpacity: 0.7,
        className: 'highlighted-marker-pulse'
    }).addTo(window.map);
    
    // Centra la mappa sul marker
    window.map.setView([patto.lat, patto.lng], 16, {
        animate: true,
        duration: 0.5
    });
    
    // Aggiungi animazione CSS per il pulse
    addPulseAnimation();
}

// ✅ NUOVO: Animazione pulse per marker evidenziato
function addPulseAnimation() {
    if (document.getElementById('markerPulseAnimation')) return;
    
    const style = document.createElement('style');
    style.id = 'markerPulseAnimation';
    style.textContent = `
        @keyframes marker-pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.3);
                opacity: 0.7;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .highlighted-marker-pulse {
            animation: marker-pulse 1.5s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

// Apri panel
function openSidePanel(pattoId) {
    console.log('📷 Apertura panel per patto:', pattoId);

    createSidePanelHTML();
    addSidePanelStyles();

    if (!window.allData || !Array.isArray(window.allData) || window.allData.length === 0) {
        console.error('❌ Nessun dato disponibile. Dati:', window.allData);
        alert('I dati non sono ancora stati caricati. Attendi qualche secondo e riprova.');
        return;
    }

    const idKey = Object.keys(window.allData[0]).find(k => k.toLowerCase() === 'id');
    const patto = window.allData.find(p => p[idKey] == pattoId);

    if (!patto) {
        console.error('❌ Patto non trovato con ID:', pattoId);
        console.log('🔍 IDs disponibili:', window.allData.map(p => p[idKey]));
        alert('Patto non trovato.');
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

    console.log('✅ Panel aperto con successo');
	
	    // Sincronizza con mappa principale
    setTimeout(() => {
        const patto = window.allData[currentPanelIndex];
        if (patto) {
            syncMapWithSidePanel(patto);
        }
    }, 300);
}

// ✅ CORREZIONE: Popola contenuto con colori stati e PDF
function populateSidePanelContent(patto) {
    const keys = {
        titolo: Object.keys(patto).find(k => k.toLowerCase().includes('titolo')),
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
        id: Object.keys(patto).find(k => k.toLowerCase() === 'id')
    };

    // Titolo
    const titleEl = document.getElementById('sidePanelTitle');
    if (titleEl) titleEl.textContent = patto[keys.titolo] || 'Patto senza titolo';

    // Dettagli
    const details = document.getElementById('panelDetails');
    if (details) {
        details.innerHTML = `
            <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
            <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
            <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
            <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
            <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
            <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
        `;
    }

    // ✅ CORREZIONE: Stato con colore IDENTICO alla tabella
    const status = document.getElementById('panelStatus');
    const statoText = patto[keys.stato] || 'Non specificato';
    
    // Usa gli stessi colori della tabella (da monitoraggio_p1-v2.js)
    const statusColors = {
        'Istruttoria in corso': '#ffdb4d',
        'Respinta': '#ff6b6b',
        'Patto stipulato': '#8fd67d',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
        'In attesa di integrazione': '#b3e6ff',
        'Archiviata': '#94a3b8'
    };
    
    const statusColor = statusColors[statoText] || '#6b7280';

    if (status) {
        let statusHTML = `
            <div class="status-badge" style="background-color: ${statusColor};">
                ${statoText}
            </div>
        `;

        // ✅ NUOVO: Aggiungi pulsante PDF se il patto è stipulato
        if (statoText === 'Patto stipulato' && keys.pdf && patto[keys.pdf] && patto[keys.pdf].trim() !== '') {
            const pattoId = patto[keys.id] || 'XX';
            statusHTML += `
                <a href="${patto[keys.pdf].trim()}" 
                   download
                   target="_blank"
                   rel="noopener"
                   class="download-pdf-btn"
                   title="Scarica il Patto di Collaborazione">
                    <i data-lucide="download"></i>
                    <span>Patto n° ${pattoId}</span>
                </a>
            `;
        }

        status.innerHTML = statusHTML;
    }

    // Note
    const notesContainer = document.getElementById('panelNotesContainer');
    const notesEl = document.getElementById('panelNotes');
    if (keys.nota && patto[keys.nota] && notesContainer && notesEl) {
        notesContainer.classList.remove('hidden');
        notesEl.textContent = patto[keys.nota];
    } else if (notesContainer) {
        notesContainer.classList.add('hidden');
    }

    // Link
    const links = document.getElementById('panelLinks');
    if (links) {
        links.innerHTML = '';

        if (keys.googlemaps && patto[keys.googlemaps]) {
            const link = document.createElement('a');
            link.href = patto[keys.googlemaps].trim();
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'panel-link-btn';
            link.innerHTML = '<i data-lucide="map" style="width: 16px; height: 16px;"></i> <span>Google Maps</span>';
            links.appendChild(link);
        }

        if (keys.geouri && patto[keys.geouri]) {
            const link = document.createElement('a');
            link.href = patto[keys.geouri];
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'panel-link-btn';
            link.innerHTML = '<i data-lucide="map-pin" style="width: 16px; height: 16px;"></i> <span>Navigatore</span>';
            links.appendChild(link);
        }
    }

    // Foto
    const photoContainer = document.getElementById('panelPhotoContainer');
    const photoEl = document.getElementById('panelPhoto');
    if (keys.foto && patto[keys.foto] && patto[keys.foto].trim() !== '' && photoContainer && photoEl) {
        photoContainer.classList.remove('hidden');
        photoEl.src = patto[keys.foto].trim();
        photoEl.alt = patto[keys.titolo] || 'Foto';
    } else if (photoContainer) {
        photoContainer.classList.add('hidden');
    }

    // ✅ NUOVO: Evidenzia marker nella mappa
    highlightMarkerOnMap(patto);

    // Nuovo: Sincronizzazione con mappa principale
    if (window.syncSidePanelWithMap && typeof window.syncSidePanelWithMap === 'function') {
        setTimeout(() => {
            window.syncSidePanelWithMap(patto);
        }, 50);
    }

    // Minimap
    setTimeout(() => initializeSidePanelMiniMap(patto), 300);

    updateSidePanelCounter();

    // Ricrea icone Lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// Minimap
function initializeSidePanelMiniMap(patto) {
    if (panelMiniMap) {
        try {
            panelMiniMap.remove();
        } catch (e) {}
        panelMiniMap = null;
    }

    const container = document.getElementById('panelMiniMap');
    if (!container || !patto.lat || !patto.lng) return;

    container.innerHTML = '';
    container.style.height = '250px';

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

// ✅ CORREZIONE: Chiudi panel e rimuovi evidenziazione
function closeSidePanel() {
    // Rimuovi highlight dalla mappa
    if (window.currentPattoHighlight && window.map && typeof window.map.removeLayer === 'function') {
        try {
            window.map.removeLayer(window.currentPattoHighlight);
            window.currentPattoHighlight = null;
            console.log('✓ Highlight rimosso');
        } catch (e) {}
    }
    
    const panel = document.getElementById('pattoSidePanel');
    if (panel) {
        panel.classList.remove('open');
        if (panelMiniMap) {
            try {
                panelMiniMap.remove();
            } catch (e) {}
            panelMiniMap = null;
        }
        
        if (highlightedMarker && window.map) {
            window.map.removeLayer(highlightedMarker);
            highlightedMarker = null;
        }
    }
}

// Setup listener
function setupSidePanelListeners() {
    const closeBtn = document.getElementById('closeSidePanel');
    const overlay = document.getElementById('sidePanelOverlay');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');

    if (closeBtn) closeBtn.addEventListener('click', closeSidePanel);
    if (overlay) overlay.addEventListener('click', closeSidePanel);

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


// ✅ CORREZIONE: Naviga con evidenziazione
function navigateSidePanel(direction) {
    const newIndex = currentPanelIndex + direction;
    if (newIndex >= 0 && newIndex < window.allData.length) {
        currentPanelIndex = newIndex;
        const patto = window.allData[currentPanelIndex];
        
        console.log('📋 Navigazione Side Panel:', direction > 0 ? 'NEXT' : 'PREV');
        
        populateSidePanelContent(patto);
        
        // SINCRONIZZAZIONE CON MAPPA
        setTimeout(() => {
            syncMapWithSidePanel(patto);
        }, 100);
        
        const content = document.querySelector('.side-panel-content');
        if (content) content.scrollTop = 0;

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        updateSidePanelCounter();
    }
}

// ==========================================
// SINCRONIZZAZIONE MAPPA CON SIDE PANEL
// ==========================================

function syncMapWithSidePanel(patto) {
    if (!patto || !patto.lat || !patto.lng) {
        console.warn('Sync: Dati patto incompleti');
        return;
    }
    
    if (!window.map || typeof window.map.setView !== 'function') {
        console.warn('Sync: Mappa non disponibile');
        return;
    }
    
    console.log('🔄 Sincronizzazione mappa:', patto.id);
    
    try {
        // 1. Chiudi popup
        try {
            window.map.closePopup();
        } catch (e) {}
        
        // 2. Rimuovi highlight precedente
        if (window.currentPattoHighlight && window.map && typeof window.map.removeLayer === 'function') {
            try {
                window.map.removeLayer(window.currentPattoHighlight);
            } catch (e) {}
        }
        
        // 3. Crea nuovo highlight
        if (window.markersLayer) {
            window.currentPattoHighlight = L.circleMarker(
                [parseFloat(patto.lat), parseFloat(patto.lng)],
                {
                    radius: 20,
                    fillColor: '#3b82f6',
                    color: '#ffffff',
                    weight: 4,
                    opacity: 1,
                    fillOpacity: 0.7,
                    className: 'side-panel-highlight-pulse',
                    interactive: false
                }
            ).addTo(window.map);
            
            console.log('✓ Marker highlight creato');
        }
        
        // 4. ZOOM con delay
        setTimeout(() => {
            try {
                const lat = parseFloat(patto.lat);
                const lng = parseFloat(patto.lng);
                
                console.log(`📍 Zoom a: ${lat}, ${lng}`);
                
                if (typeof window.map.flyTo === 'function') {
                    window.map.flyTo([lat, lng], 17, {
                        duration: 1.0,
                        easeLinearity: 0.25
                    });
                    console.log('✓ Zoom flyTo eseguito');
                } else {
                    window.map.setView([lat, lng], 17, {
                        animate: true,
                        duration: 1000
                    });
                    console.log('✓ Zoom setView eseguito');
                }
            } catch (error) {
                console.error('Errore durante zoom:', error);
            }
        }, 50);
        
    } catch (error) {
        console.error('Errore sincronizzazione:', error);
    }
}

// Aggiorna counter
function navigateSidePanel(direction) {
    const newIndex = currentPanelIndex + direction;
    if (newIndex >= 0 && newIndex < window.allData.length) {
        currentPanelIndex = newIndex;
        const patto = window.allData[currentPanelIndex];
        populateSidePanelContent(patto);
        
        // NUOVO: Sincronizzazione mappa
        if (window.syncSidePanelWithMap && typeof window.syncSidePanelWithMap === 'function') {
            window.syncSidePanelWithMap(patto);
        }
        
        const content = document.querySelector('.side-panel-content');
        if (content) content.scrollTop = 0;

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}function updateSidePanelCounter() {
    const counter = document.getElementById('sidePanelCounter');
    const prevBtn = document.getElementById('sidePanelPrevious');
    const nextBtn = document.getElementById('sidePanelNext');

    if (counter) counter.textContent = `${currentPanelIndex + 1}/${window.allData.length}`;
    if (prevBtn) prevBtn.disabled = currentPanelIndex === 0;
    if (nextBtn) nextBtn.disabled = currentPanelIndex === window.allData.length - 1;
}

// Sostituisci showPattoDetails
window.showPattoDetails = openSidePanel;

// Carica preferiti
loadPanelFavorites();


// Esponi funzioni globali per sincronizzazione con mappa
window.highlightMarkerOnMapFromSidePanel = highlightMarkerOnMap;
window.getCurrentSidePanelPatto = function() {
    if (window.allData && currentPanelIndex >= 0 && currentPanelIndex < window.allData.length) {
        return window.allData[currentPanelIndex];
    }
    return null;
};

// Aggancia il close panel per pulire la mappa
const originalCloseSidePanel = closeSidePanel;
closeSidePanel = function() {
    // Rimuovi evidenziazione dalla mappa
    if (window.removeMainMapHighlight && typeof window.removeMainMapHighlight === 'function') {
        window.removeMainMapHighlight();
    }
    // Chiama originale
    originalCloseSidePanel();
};

console.log('Side Panel caricato correttamente');