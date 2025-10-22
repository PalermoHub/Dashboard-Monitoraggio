// ==========================================
// SIDE PANEL RESPONSIVE - RIDIMENSIONAMENTO DINAMICO
// Sostituisce la versione statica in side-panel.js
// ==========================================

console.log('Side Panel Responsive: Inizializzazione');

// Configurazione responsive
const SIDE_PANEL_CONFIG = {
    minWidth: 300,      // Larghezza minima (px)
    maxWidth: 450,      // Larghezza massima (px)
    desktopWidth: 380,  // Larghezza di default desktop
    gapRight: 12,       // Spazio dal bordo destro (px)
    gapBottom: 70,      // Spazio dal footer (px)
    gapTop: 70          // Spazio dall'header (px)
};

// Funzione principale per calcolare dimensioni pannello
function calculateSidePanelDimensions() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const mapContainer = document.querySelector('.content-area');
    
    // Fallback se la mappa non è trovata
    if (!mapContainer) {
        return {
            width: SIDE_PANEL_CONFIG.desktopWidth,
            height: windowHeight - SIDE_PANEL_CONFIG.gapTop - SIDE_PANEL_CONFIG.gapBottom,
            available: true
        };
    }

    const mapRect = mapContainer.getBoundingClientRect();
    
    // Calcola larghezza disponibile
    let panelWidth = SIDE_PANEL_CONFIG.desktopWidth;
    const availableWidth = windowWidth - mapRect.left - SIDE_PANEL_CONFIG.gapRight;
    
    if (availableWidth < SIDE_PANEL_CONFIG.desktopWidth) {
        panelWidth = Math.max(SIDE_PANEL_CONFIG.minWidth, availableWidth - 10);
    }
    
    panelWidth = Math.min(panelWidth, SIDE_PANEL_CONFIG.maxWidth);

    // Calcola altezza disponibile
    const panelHeight = windowHeight - SIDE_PANEL_CONFIG.gapTop - SIDE_PANEL_CONFIG.gapBottom;

    return {
        width: Math.round(panelWidth),
        height: Math.max(300, Math.round(panelHeight)), // Minimo 300px di altezza
        available: panelWidth >= SIDE_PANEL_CONFIG.minWidth
    };
}

// Applica le dimensioni al pannello
function applySidePanelDimensions() {
    const panel = document.getElementById('pattoSidePanel');
    if (!panel) return;

    const dimensions = calculateSidePanelDimensions();
    
    panel.style.width = `${dimensions.width}px`;
    panel.style.height = `${dimensions.height}px`;
    
    console.log(`Side Panel: ${dimensions.width}px × ${dimensions.height}px`);
}

// CSS aggiornato con supporto responsive
function updateSidePanelStyles() {
    if (document.getElementById('sidePanelStylesResponsive')) return;

    const styles = document.createElement('style');
    styles.id = 'sidePanelStylesResponsive';
    styles.textContent = `
        /* ============================================
           SIDE PANEL RESPONSIVE - CONTAINER
           ============================================ */
        
        .side-panel {
            position: absolute;
            right: -500px; /* Nascosto inizialmente */
            top: var(--side-panel-top, 70px);
            /* height e width impostati da JS */
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
            right: 12px; /* 12px dal bordo destro */
        }

        /* ============================================
           SIDE PANEL - HEADER
           ============================================ */
        
        .side-panel-header {
            padding: 14px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
            color: var(--color-white);
            flex-shrink: 0;
            gap: 10px;
            min-height: 52px;
        }

        .side-panel-title {
            font-size: 1rem;
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
            padding: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            flex-shrink: 0;
        }

        .side-panel-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        /* ============================================
           SIDE PANEL - CONTENT
           ============================================ */
        
        .side-panel-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 14px;
            scroll-behavior: smooth;
        }

        /* Scrollbar personalizzata */
        .side-panel-content::-webkit-scrollbar {
            width: 6px;
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

        /* ============================================
           SIDE PANEL - SEZIONI
           ============================================ */
        
        .panel-section {
            margin-bottom: 18px;
            padding-bottom: 14px;
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
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--color-gray-800);
            margin: 0 0 10px 0;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ============================================
           SIDE PANEL - DETTAGLI
           ============================================ */
        
        .panel-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
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

        /* ============================================
           SIDE PANEL - STATUS
           ============================================ */
        
        .panel-status {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 5px;
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--color-white);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
        }

        .download-pdf-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            background: var(--status-stipulato);
            color: var(--color-white);
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 0.75rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .download-pdf-btn:hover {
            background: var(--color-success);
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }

        .download-pdf-btn i {
            width: 14px;
            height: 14px;
        }

        /* ============================================
           SIDE PANEL - NOTE
           ============================================ */
        
        .panel-notes {
            margin: 0;
            padding: 10px;
            background: var(--color-gray-50);
            border-left: 3px solid var(--color-accent);
            border-radius: 3px;
            font-size: 0.8rem;
            color: var(--color-gray-700);
            line-height: 1.5;
        }

        /* ============================================
           SIDE PANEL - LINK
           ============================================ */
        
        .panel-links {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .panel-link-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            background: var(--color-gray-50);
            border: 1px solid var(--border-color);
            border-radius: 5px;
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
            transform: translateX(3px);
        }

        /* ============================================
           SIDE PANEL - FOTO
           ============================================ */
        
        .panel-photo {
            width: 100%;
            height: auto;
            max-height: 200px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
            object-fit: cover;
        }

        .panel-photo:hover {
            transform: scale(1.02);
        }

        /* ============================================
           SIDE PANEL - MINIMAP
           ============================================ */
        
        .panel-minimap-wrapper {
            position: relative;
            width: 100%;
            height: 150px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .panel-minimap {
            width: 100%;
            height: 100%;
            background: var(--color-gray-100);
        }

        /* ============================================
           SIDE PANEL - FOOTER
           ============================================ */
        
        .side-panel-footer {
            padding: 12px;
            border-top: 1px solid var(--border-color);
            background: var(--color-gray-50);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-shrink: 0;
            min-height: 48px;
        }

        .panel-nav-btn {
            background: var(--color-gray-200);
            border: none;
            color: var(--color-gray-700);
            border-radius: 50%;
            width: 32px;
            height: 32px;
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
            font-size: 0.8rem;
            color: var(--color-gray-600);
            font-weight: 600;
            min-width: 55px;
            text-align: center;
        }

        /* ============================================
           MEDIA QUERY - TABLET/IPAD
           ============================================ */
        
        @media (max-width: 1024px) {
            .side-panel {
                right: -400px; /* Reset per tablet */
            }

            .side-panel-header {
                padding: 12px;
                min-height: 48px;
            }

            .side-panel-content {
                padding: 12px;
            }

            .panel-minimap-wrapper {
                height: 120px;
            }

            .panel-section-title {
                font-size: 0.75rem;
            }

            .panel-details p {
                font-size: 0.75rem;
            }
        }

        /* ============================================
           MEDIA QUERY - MOBILE
           ============================================ */
        
        @media (max-width: 768px) {
            .side-panel {
                position: fixed;
                width: 100% !important;
                height: 100% !important;
                right: -100%;
                top: 0 !important;
                bottom: 0 !important;
                border-radius: 0;
                border-left: none;
            }

            .side-panel.open {
                right: 0;
            }

            .side-panel-header {
                padding: 16px;
                min-height: 56px;
            }

            .side-panel-title {
                font-size: 1.1rem;
            }

            .side-panel-footer {
                min-height: 56px;
            }
        }

        /* ============================================
           ANIMAZIONE HIGHLIGHT
           ============================================ */
        
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
            animation: side-panel-pulse 1.5s ease-in-out infinite !important;
        }
    `;

    document.head.appendChild(styles);
    console.log('CSS Responsive caricato');
}

// Observer per il resize della finestra
function setupSidePanelResizeObserver() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            applySidePanelDimensions();
            
            // Ridimensiona minimap se aperto
            if (document.getElementById('pattoSidePanel')?.classList.contains('open')) {
                const minimap = document.getElementById('panelMiniMap');
                if (minimap && window.panelMiniMap) {
                    setTimeout(() => window.panelMiniMap.invalidateSize(true), 100);
                }
            }
        }, 250);
    });

    console.log('Resize observer configurato');
}

// Inizializza al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateSidePanelStyles();
        setupSidePanelResizeObserver();
        
        // Applica dimensioni quando il pannello si apre
        const originalOpen = window.openSidePanel;
        window.openSidePanel = function(pattoId) {
            originalOpen(pattoId);
            setTimeout(() => applySidePanelDimensions(), 100);
        };
    }, 500);
});

// Esporta funzioni
window.applySidePanelDimensions = applySidePanelDimensions;
window.calculateSidePanelDimensions = calculateSidePanelDimensions;

console.log('Side Panel Responsive: Caricato');