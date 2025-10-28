/**
 * Tab Modal Controller
 * Gestisce apertura, chiusura e interazioni del modal statistiche su mobile/tablet
 */

class TabModalController {
    constructor() {
        this.modal = document.getElementById('tabsModal');
        this.backdrop = document.getElementById('tabsBackdrop');
        this.openBtn = document.getElementById('openTabsBtn');
        this.closeBtn = document.getElementById('closeTabsBtn');
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        this.isOpen = false;
        this.isMobile = window.innerWidth <= 1024;
        
        this.init();
    }
    
    init() {
        // Event listeners
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.open());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Chiude il modal quando clicchi sul backdrop (solo su mobile)
        if (this.backdrop) {
            this.backdrop.addEventListener('click', (e) => {
                if (e.target === this.backdrop && this.isMobile) {
                    this.close();
                }
            });
        }
        
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });
        
        // Rileva cambio viewport (resize)
        window.addEventListener('resize', () => this.handleResize());
        
        // Inizializza lo stato
        this.setInitialState();
    }
    
    /**
     * Imposta lo stato iniziale
     */
    setInitialState() {
        this.isMobile = window.innerWidth <= 1024;
        
        if (this.isMobile) {
            // Su mobile: chiuso per default
            this.close();
            this.showOpenButton();
        } else {
            // Su desktop: sempre aperto
            this.open();
            this.hideOpenButton();
        }
    }
    
    /**
     * Apre il modal
     */
    open() {
        if (!this.modal || !this.backdrop) return;
        
        this.isOpen = true;
        
        if (this.isMobile) {
            // Mobile: animazione dal basso
            this.modal.classList.remove('collapsed');
            this.backdrop.classList.add('active');
        } else {
            // Desktop: sempre visibile
            this.modal.style.display = 'flex';
            this.backdrop.style.display = 'block';
        }
        
        // Disabilita scroll della pagina
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Chiude il modal
     */
    close() {
        if (!this.modal || !this.backdrop) return;
        
        this.isOpen = false;
        
        if (this.isMobile) {
            // Mobile: animazione verso il basso
            this.modal.classList.add('collapsed');
            this.backdrop.classList.remove('active');
        }
        
        // Ristabilisce scroll della pagina
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Cambia tab attivo
     */
    switchTab(clickedBtn) {
        // Rimuovi active da tutti i pulsanti e pane
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Aggiungi active al pulsante cliccato
        clickedBtn.classList.add('active');
        
        // Attiva il tab corrispondente
        const tabId = clickedBtn.getAttribute('data-tab');
        const tabPane = document.getElementById(tabId);
        if (tabPane) {
            tabPane.classList.add('active');
        }
    }
    
    /**
     * Gestisce il resize della finestra
     */
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 1024;
        
        // Se c'è un cambio di viewport, resetta lo stato
        if (wasMobile !== this.isMobile) {
            this.setInitialState();
        }
    }
    
    /**
     * Mostra il pulsante di apertura (solo mobile)
     */
    showOpenButton() {
        if (this.openBtn) {
            this.openBtn.classList.add('show');
        }
    }
    
    /**
     * Nascondi il pulsante di apertura (solo desktop)
     */
    hideOpenButton() {
        if (this.openBtn) {
            this.openBtn.classList.remove('show');
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new TabModalController();
});