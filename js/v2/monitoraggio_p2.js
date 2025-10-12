// ==========================================
// DASHBOARD MONITORAGGIO PATTI - PARTE 2 (CORRETTA)
// Funzionalità aggiuntive senza conflitti
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Monitoraggio P2 - Funzionalità aggiuntive inizializzate');
    
    // Enhanced modal handling - Gestione migliorata dei modal
    setupEnhancedModalHandling();
    
    // Setup icone Lucide con retry
    setupLucideIcons();
    
    // Setup osservatore per nuovi elementi (per icone dinamiche)
    setupDynamicIconObserver();
    
    console.log('✅ Monitoraggio P2 caricato con successo');
});

// ==========================================
// GESTIONE MIGLIORATA DEI MODAL
// ==========================================

function setupEnhancedModalHandling() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        
        // Gestione chiusura con pulsante
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeModalEnhanced(modal);
            });
        }
        
        // Chiusura cliccando sul backdrop
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalEnhanced(modal);
            }
        });
        
        // Chiusura con tasto ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (modal.classList.contains('show') || modal.classList.contains('flex')) {
                    closeModalEnhanced(modal);
                }
            }
        });
    });
    
    console.log(`✅ Gestione migliorata configurata per ${modals.length} modal`);
}

/**
 * Chiude un modal in modo sicuro
 */
function closeModalEnhanced(modal) {
    if (!modal) return;
    
    console.log('🔒 Chiusura modal:', modal.id);
    
    // Rimuovi classi di visibilità
    modal.classList.remove('show', 'flex');
    modal.classList.add('hidden');
    
    // Pulisci mini mappa se esiste
    if (modal.id === 'pattoModal' && window.miniMap) {
        try {
            window.miniMap.remove();
            window.miniMap = null;
            console.log('🗑️ Mini mappa rimossa');
        } catch (e) {
            console.warn('⚠️ Errore rimozione mini mappa:', e);
        }
    }
    
    // Ripristina scroll del body se necessario
    const openModals = document.querySelectorAll('.modal.show, .modal.flex');
    if (openModals.length === 0) {
        document.body.style.overflow = '';
    }
}

// ==========================================
// GESTIONE ICONE LUCIDE
// ==========================================

function setupLucideIcons() {
    if (typeof lucide === 'undefined') {
        console.warn('⚠️ Libreria Lucide non disponibile');
        // Retry dopo 500ms
        setTimeout(setupLucideIcons, 500);
        return;
    }
    
    // Crea le icone iniziali
    createLucideIcons();
    
    // Ricrea le icone periodicamente per elementi caricati dinamicamente
    setInterval(createLucideIcons, 2000);
    
    console.log('✅ Setup icone Lucide completato');
}

function createLucideIcons() {
    if (window.lucide && window.lucide.createIcons) {
        try {
            window.lucide.createIcons();
        } catch (e) {
            console.warn('⚠️ Errore creazione icone Lucide:', e);
        }
    }
}

// ==========================================
// OSSERVATORE PER ELEMENTI DINAMICI
// ==========================================

function setupDynamicIconObserver() {
    if (typeof MutationObserver === 'undefined') {
        console.warn('⚠️ MutationObserver non supportato');
        return;
    }
    
    const observer = new MutationObserver(function(mutations) {
        let needsIconUpdate = false;
        
        mutations.forEach(function(mutation) {
            // Controlla se sono stati aggiunti nodi con attributo data-lucide
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.hasAttribute && node.hasAttribute('data-lucide')) {
                        needsIconUpdate = true;
                    } else if (node.querySelector && node.querySelector('[data-lucide]')) {
                        needsIconUpdate = true;
                    }
                }
            });
        });
        
        if (needsIconUpdate) {
            createLucideIcons();
        }
    });
    
    // Osserva il body per cambiamenti
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Osservatore elementi dinamici attivato');
}

// ==========================================
// UTILITY PER NOTIFICHE
// ==========================================

/**
 * Mostra una notifica toast migliorata
 */
function showEnhancedNotification(message, type = 'info', duration = 3000) {
    // Rimuovi notifiche esistenti
    const existingToasts = document.querySelectorAll('.enhanced-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `enhanced-toast enhanced-toast-${type}`;
    
    const icons = {
        'success': 'check-circle',
        'error': 'x-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    };
    
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i data-lucide="${icons[type] || 'info'}" 
               style="width: 1.25rem; height: 1.25rem; color: ${colors[type] || colors.info};" 
               aria-hidden="true"></i>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; cursor: pointer; padding: 0.25rem; opacity: 0.7; transition: opacity 0.2s;"
                    aria-label="Chiudi notifica">
                <i data-lucide="x" style="width: 1rem; height: 1rem;" aria-hidden="true"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Crea le icone nel toast
    createLucideIcons();
    
    // Mostra il toast con animazione
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Rimuovi automaticamente dopo la durata specificata
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Aggiungi stili per i toast
function addEnhancedToastStyles() {
    if (document.getElementById('enhanced-toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'enhanced-toast-styles';
    style.textContent = `
        .enhanced-toast {
            position: fixed;
            top: calc(var(--header-height) + 1rem);
            right: 1rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 1rem 1.25rem;
            z-index: 10000;
            min-width: 320px;
            max-width: 480px;
            font-size: 0.875rem;
            color: #1f2937;
            border-left: 4px solid #3b82f6;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .enhanced-toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .enhanced-toast-success {
            border-left-color: #10b981;
        }
        
        .enhanced-toast-error {
            border-left-color: #ef4444;
        }
        
        .enhanced-toast-warning {
            border-left-color: #f59e0b;
        }
        
        .enhanced-toast-info {
            border-left-color: #3b82f6;
        }
        
        @media (max-width: 640px) {
            .enhanced-toast {
                top: calc(var(--header-height) + 0.5rem);
                right: 0.5rem;
                left: 0.5rem;
                min-width: auto;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// Inizializza gli stili dei toast
addEnhancedToastStyles();

// ==========================================
// UTILITY PER DEBUG
// ==========================================

/**
 * Funzione di test per verificare che i modal funzionino
 */
window.testModalSystem = function() {
    console.log('🧪 Test sistema modal...');
    
    const modals = {
        info: document.getElementById('infoModal'),
        patto: document.getElementById('pattoModal'),
        table: document.getElementById('tableModal')
    };
    
    console.log('Modal trovati:', {
        info: !!modals.info,
        patto: !!modals.patto,
        table: !!modals.table
    });
    
    // Test apertura modal info
    if (modals.info) {
        console.log('Apertura modal info...');
        modals.info.classList.remove('hidden');
        modals.info.classList.add('show', 'flex');
        
        setTimeout(() => {
            console.log('Chiusura modal info...');
            closeModalEnhanced(modals.info);
        }, 2000);
    }
    
    return modals;
};

/**
 * Verifica lo stato dell'applicazione
 */
window.checkAppStatus = function() {
    const status = {
        dataLoaded: !!(window.allData && window.allData.length > 0),
        dataCount: window.allData ? window.allData.length : 0,
        filteredDataCount: window.filteredData ? window.filteredData.length : 0,
        mapInitialized: !!window.map,
        markersLayerExists: !!window.markersLayer,
        chartInitialized: !!window.chart,
        lucideAvailable: typeof window.lucide !== 'undefined',
        functionsAvailable: {
            updateTable: typeof window.updateTable === 'function',
            showPattoDetails: typeof window.showPattoDetails === 'function',
            updateMap: typeof window.updateMap === 'function',
            applyFilters: typeof window.applyFilters === 'function'
        }
    };
    
    console.table(status);
    return status;
};

/**
 * Test completo della tabella
 */
window.testTableSystem = function() {
    console.log('🧪 Test sistema tabella...');
    
    const elements = {
        button: document.getElementById('showTableBtn'),
        modal: document.getElementById('tableModal'),
        closeBtn: document.getElementById('closeTableModal'),
        tableCount: document.getElementById('tableCount'),
        tableHeader: document.getElementById('tableHeader'),
        tableBody: document.getElementById('tableBody')
    };
    
    console.log('Elementi tabella trovati:', {
        button: !!elements.button,
        modal: !!elements.modal,
        closeBtn: !!elements.closeBtn,
        tableCount: !!elements.tableCount,
        tableHeader: !!elements.tableHeader,
        tableBody: !!elements.tableBody
    });
    
    if (!elements.modal) {
        console.error('❌ Modal tabella non trovato! Assicurati di aver aggiunto il HTML del modal.');
        return false;
    }
    
    // Verifica funzione updateTable
    if (typeof window.updateTable !== 'function') {
        console.error('❌ Funzione updateTable non disponibile!');
        return false;
    }
    
    // Test apertura
    try {
        console.log('Test apertura modal tabella...');
        if (window.filteredData && window.filteredData.length > 0) {
            window.updateTable();
            elements.modal.classList.remove('hidden');
            elements.modal.classList.add('flex', 'show');
            console.log('✅ Modal tabella aperto con successo');
            
            setTimeout(() => {
                console.log('Test chiusura modal tabella...');
                closeModalEnhanced(elements.modal);
                console.log('✅ Modal tabella chiuso con successo');
            }, 2000);
        } else {
            console.warn('⚠️ Nessun dato disponibile per il test');
        }
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
        return false;
    }
    
    return true;
};

// ==========================================
// MIGLIORAMENTI ACCESSIBILITÀ
// ==========================================

/**
 * Migliora l'accessibilità dei modal
 */
function enhanceModalAccessibility() {
    document.addEventListener('keydown', function(e) {
        // Trap focus nei modal aperti
        const openModal = document.querySelector('.modal.show, .modal.flex');
        if (!openModal) return;
        
        const focusableElements = openModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Tab cycling
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

enhanceModalAccessibility();

// ==========================================
// ESPORTAZIONE FUNZIONI GLOBALI
// ==========================================

window.showEnhancedNotification = showEnhancedNotification;
window.closeModalEnhanced = closeModalEnhanced;
window.createLucideIcons = createLucideIcons;

// ==========================================
// LOG FINALE
// ==========================================

console.log('✅ Monitoraggio P2 - Tutte le funzionalità aggiuntive caricate');
console.log('📦 Funzioni disponibili:', {
    showEnhancedNotification: typeof showEnhancedNotification,
    closeModalEnhanced: typeof closeModalEnhanced,
    testModalSystem: typeof window.testModalSystem,
    checkAppStatus: typeof window.checkAppStatus,
    testTableSystem: typeof window.testTableSystem
});