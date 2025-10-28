// Elementi DOM
    const openBtn = document.getElementById('openTabsBtn');
    const closeBtn = document.getElementById('closeTabsBtn');
    const backdrop = document.getElementById('tabsBackdrop');
    const modal = document.getElementById('tabsModal');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Verifica se siamo su desktop o mobile
    const isDesktop = () => window.innerWidth >= 1024;
    const isMobile = () => window.innerWidth < 768;

    // APRI/CHIUDI MODAL (toggle su mobile)
    openBtn.addEventListener('click', () => {
        if (isMobile()) {
            modal.classList.remove('collapsed');
            openBtn.classList.remove('show');
            document.body.style.overflow = 'hidden';
        }
    });

    // CHIUDI MODAL -> Collassa a icona su mobile
    const closeModal = () => {
        if (isMobile()) {
            modal.classList.add('collapsed');
            openBtn.classList.add('show');
            document.body.style.overflow = '';
        }
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // COLLASSA quando clicchi su header (mobile)
    const modalHeader = document.querySelector('.tabs-modal-header');
    if (isMobile()) {
        modalHeader.style.cursor = 'pointer';
        modalHeader.addEventListener('click', closeModal);
    }

    // GESTIONE TAB
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Rimuovi active da tutti i tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Aggiungi active al tab cliccato
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // CHIUDI CON ESC (solo su mobile quando espanso)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobile() && !modal.classList.contains('collapsed')) {
            closeModal();
        }
    });

    // KEYBOARD NAVIGATION
    document.addEventListener('keydown', (e) => {
        const currentButton = document.querySelector('.tab-button.active');
        const allButtons = Array.from(tabButtons);
        const currentIndex = allButtons.indexOf(currentButton);

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % allButtons.length;
            allButtons[nextIndex].click();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + allButtons.length) % allButtons.length;
            allButtons[prevIndex].click();
        }
    });

    // Al caricamento: gestisci stato iniziale
    window.addEventListener('load', () => {
        if (isDesktop()) {
            openBtn.classList.remove('show');
            backdrop.classList.remove('active');
            modal.classList.remove('collapsed');
        } else if (isMobile()) {
            openBtn.classList.add('show');
            modal.classList.add('collapsed');
        } else {
            openBtn.classList.remove('show');
            modal.classList.remove('collapsed');
        }
    });

    // Gestisci resize
    window.addEventListener('resize', () => {
        if (isDesktop()) {
            openBtn.classList.remove('show');
            backdrop.classList.remove('active');
            modal.classList.remove('collapsed');
            document.body.style.overflow = '';
        } else if (isMobile()) {
            openBtn.classList.add('show');
            modal.classList.add('collapsed');
            document.body.style.overflow = '';
        } else {
            openBtn.classList.remove('show');
            modal.classList.remove('collapsed');
        }
    });