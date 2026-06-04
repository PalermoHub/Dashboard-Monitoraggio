// ==========================================
// PATTI DI COLLABORAZIONE — COMPONENTI CONDIVISI
// Header e footer centralizzati — elimina la duplicazione su tutte le pagine
// ==========================================

(function () {
    'use strict';

    // ─── MAPPA PAGINE ─────────────────────────────────────────
    const PAGE_MAP = {
        'index.html':       'dashboard',
        '':                 'dashboard',
        '/':                'dashboard',
        'normativi.html':   'normativi',
        'faq.html':         'faq',
        'attiva.html':      'attiva',
        'modulistica.html': 'modulistica',
        'laboratori.html':  'laboratori',
        'about.html':       'about',
        'info.html':        'info',
    };

    // ─── CONFIGURAZIONE NAV TABS ──────────────────────────────
    const NAV_TABS = [
        { id: 'dashboard',   href: 'index.html',       icon: 'fas fa-map-marked-alt',  label: 'Dashboard' },
        { id: 'normativi',   href: 'normativi.html',   icon: 'fas fa-book-open',        label: 'Riferimenti Normativi' },
        { id: 'faq',         href: 'faq.html',         icon: 'fas fa-handshake-angle',  label: 'FAQ' },
        { id: 'attiva',      href: 'attiva.html',      icon: 'fas fa-rocket',           label: 'Attiva un Patto!' },
        { id: 'modulistica', href: 'modulistica.html', icon: 'fas fa-file-lines',       label: 'Modulistica' },
        { id: 'laboratori',  href: 'laboratori.html',  icon: 'fas fa-users',            label: 'Laboratori di Quartiere' },
        { id: 'about',       href: 'about.html',       icon: 'fas fa-heart',            label: 'About' },
        { id: 'info',        href: 'info.html',        icon: 'fas fa-circle-question',  label: 'Info App' },
    ];

    // ─── RILEVA PAGINA ATTIVA ─────────────────────────────────
    function detectActivePage() {
        const file = window.location.pathname.split('/').pop();
        return PAGE_MAP[file] || PAGE_MAP[file + '.html'] || 'dashboard';
    }

    // ─── COSTRUISCE HEADER ────────────────────────────────────
    function buildHeader(activePage) {
        const isDashboard = activePage === 'dashboard';

        const tabsHTML = NAV_TABS.map(tab => {
            const isActive = tab.id === activePage;
            const activeAttr  = isActive ? ' active' : '';
            const currentAttr = isActive ? ' aria-current="page"' : '';
            return `<a href="${tab.href}" class="header-patto-tab${activeAttr}"${currentAttr}>
                <i class="${tab.icon}" aria-hidden="true"></i>
                <span>${tab.label}</span>
            </a>`;
        }).join('\n        ');

        const updateBand = isDashboard
            ? `<div class="nh-update" role="status" aria-live="polite">
                <i class="fas fa-rotate" aria-hidden="true"></i>
                <span>Aggiornamento: <time id="lastUpdate">Caricamento...</time></span>
            </div>`
            : '';

        return `<header class="dashboard-header" role="banner">

    <!-- L1: SLIM BAR -->
    <div class="nh-slim" id="nhSlim">
        <div class="nh-slim-inner">
            <a href="https://www.comune.palermo.it/" target="_blank" rel="noopener"
               title="Sito Istituzionale Città di Palermo">
                <img src="img/logo_pa_gb.svg" class="nh-slim-logo" alt="Comune di Palermo">
            </a>
        </div>
    </div>

    <!-- L2: MAIN BAND -->
    <div class="nh-main">
        <div class="nh-main-inner">
            <div class="nh-org">
                <h1 class="nh-org-title">Area Urbanistica della Rigenerazione Urbana</h1>
                <p class="nh-org-sub">Ufficio per la Rigenerazione Urbana<span class="nh-org-sub-detail"> e la qualità dello spazio pubblico e dell'abitare - aree monumentali e pedonali</span></p>
            </div>
        </div>
    </div>

    <!-- L3: PROJECT BAND -->
    <div class="nh-project">
        <div class="nh-project-inner">
            <h2 class="nh-project-title">
                <img src="img/patti.png" alt="" class="nh-project-icon">
                <span>Patti di Collaborazione</span>
                <span class="nh-title-sep">&middot;</span>
                <span class="nh-title-full">Report di monitoraggio</span>
            </h2>
            ${updateBand}
        </div>
    </div>

    <!-- L4: NAV TABS -->
    <nav class="header-patto-nav" aria-label="Sezioni Patto di Collaborazione">
        ${tabsHTML}
    </nav>
</header>`;
    }

    // ─── COSTRUISCE FOOTER ────────────────────────────────────
    function buildFooter() {
        const year = new Date().getFullYear();
        return `<footer class="dashboard-footer" role="contentinfo">

    <!-- SEZIONE SUPERIORE: Organizzazione e Loghi -->
    <div class="footer-top-section">
        <div class="footer-org-box">
            <div class="footer-org-icon">
                <img src="img/logo_pa_01.png" loading="lazy"
                     alt="Logo Ufficio per la Rigenerazione Urbana"
                     class="footer-logo">
            </div>
            <div class="footer-org-text">
                <div class="footer-org-title">Città di Palermo</div>
                <div class="footer-org-description">
                    <span>Area Urbanistica della Rigenerazione Urbana, della mobilità e del centro storico</span>
                    <span>Ufficio per la Rigenerazione Urbana e la qualità dello spazio pubblico e dell'abitare - aree monumentali e pedonali</span>
                </div>
            </div>
        </div>
    </div>

    <!-- SEZIONE CONTATTI: 5 Colonne -->
    <div class="footer-contacts-section">

        <!-- Colonna 1: Ufficio -->
        <div class="footer-contact-column">
            <h4 class="footer-column-title">Ufficio Rigenerazione Urbana</h4>
            <div class="footer-column-content">
                <div class="footer-address">
                    <strong>Ex Noviziato dei Crociferi - II&deg; piano</strong><br>
                    <a href="https://maps.app.goo.gl/Sr8z5ftNV8wWGdAT6" title="Il nostro indirizzo"
                       target="_blank" rel="noopener">Foro Umberto I, 14</a><br>
                    90133 Palermo PA - Italia
                </div>
                <div class="footer-hours-label">Orari ricevimento:</div>
                <div class="footer-hours-box">
                    <span>Lunedì 10-13</span>
                    <span>Mercoledì 16-17:30</span>
                </div>
            </div>
        </div>

        <!-- Colonna 2: Corrispondenza -->
        <div class="footer-contact-column">
            <h4 class="footer-column-title">Corrispondenza</h4>
            <div class="footer-column-content">
                <div class="footer-address">
                    <strong><a href="https://maps.app.goo.gl/Sr8z5ftNV8wWGdAT6"
                               title="Il nostro indirizzo" target="_blank" rel="noopener">
                        Foro Umberto I, 14</a></strong><br>
                    90133 Palermo PA - Italia
                </div>
            </div>
        </div>

        <!-- Colonna 3: Email -->
        <div class="footer-contact-column">
            <h4 class="footer-column-title">Indirizzi di posta elettronica</h4>
            <div class="footer-column-content">
                <div class="footer-contact-row">
                    <span class="footer-label">Assessore al ramo:</span>
                    <a href="mailto:m.carta@comune.palermo.it" class="footer-link">Maurizio Carta</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Capo Area:</span>
                    <a href="mailto:m.ciralli@comune.palermo.it" class="footer-link">Marco Ciralli</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Dirigente:</span>
                    <a href="mailto:a.s.difrancisca@comune.palermo.it" class="footer-link">Adriano Salvatore Di Francisca</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Funzionario:</span>
                    <a href="mailto:paolo.porretto@comune.palermo.it" class="footer-link">Paolo Porretto</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Funzionario:</span>
                    <a href="mailto:p.caselli@comune.palermo.it" class="footer-link">Paola Caselli</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">PEC:</span>
                    <a href="mailto:cittastorica@cert.comune.palermo.it" class="footer-link">cittastorica@cert.comune.palermo.it</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Email:</span>
                    <a href="mailto:rigenerazioneurbana@comune.palermo.it" class="footer-link">Ufficio rigenerazione urbana</a>
                </div>
            </div>
        </div>

        <!-- Colonna 4: Telefoni -->
        <div class="footer-contact-column">
            <h4 class="footer-column-title">Recapiti telefonici</h4>
            <div class="footer-column-content">
                <div class="footer-contact-row">
                    <span class="footer-label">Capo Area:</span>
                    <a href="tel:+390917406803" class="footer-link">091 7406803</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Segr. Capo Area:</span>
                    <a href="tel:+390917406802" class="footer-link">091 7406802</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Dirigente:</span>
                    <a href="tel:+390917406837" class="footer-link">091 7406837</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Segr. Dirigente:</span>
                    <a href="tel:+390917406844" class="footer-link">091 7406844</a>
                </div>
                <div class="footer-contact-row">
                    <span class="footer-label">Centralino:</span>
                    <a href="tel:+390917401111" class="footer-link">091 7401111</a>
                </div>
            </div>
        </div>

        <!-- Colonna 5: Social -->
        <div class="footer-contact-column">
            <h4 class="footer-column-title">Seguici su</h4>
            <div class="footer-column-content">
                <div class="footer-social-links">
                    <a href="http://twitter.com/ComunePalermo/" class="footer-social-link"
                       title="X/Twitter" aria-label="X/Twitter">
                        <i class="fab fa-x-twitter" aria-hidden="true"></i>
                    </a>
                    <a href="http://www.facebook.com/ComunediPalermo/" class="footer-social-link"
                       title="Facebook" aria-label="Facebook">
                        <i class="fab fa-facebook-f" aria-hidden="true"></i>
                    </a>
                    <a href="https://www.instagram.com/comunepalermo/" class="footer-social-link"
                       title="Instagram" aria-label="Instagram">
                        <i class="fab fa-instagram" aria-hidden="true"></i>
                    </a>
                    <a href="https://www.youtube.com/user/ComunediPalermo1/" class="footer-social-link"
                       title="YouTube" aria-label="YouTube">
                        <i class="fab fa-youtube" aria-hidden="true"></i>
                    </a>
                    <a href="#" class="footer-social-link" title="RSS Feed" aria-label="RSS Feed">
                        <i class="fas fa-rss" aria-hidden="true"></i>
                    </a>
                </div>
                <div class="footer-logo-bottom">
                    <img src="img/s_rosalia_white.png" loading="lazy" alt="Logo Santa Rosalia">
                </div>
            </div>
        </div>

    </div>

    <!-- SEZIONE BASSA: Copyright e Links -->
    <div class="footer-bottom">
        <div class="footer-bottom-left">
            <div class="footer-copyright">&copy; ${year} Comune di Palermo - Tutti i diritti riservati</div>
            <div class="footer-credits">
                <span>Sviluppo &amp; Rielaborazione dataset by
                    <a href="https://www.linkedin.com/in/gbvitrano/" target="_blank" rel="noopener noreferrer">@gbvitrano</a>
                </span>
                <span>|</span>
                <span><a href="https://creativecommons.org/licenses/by/4.0/deed.it"
                         target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
            </div>
        </div>
        <div class="footer-bottom-right">
            <a href="privacy.html" title="Privacy Policy">Privacy policy</a>
            <span class="separator">&bull;</span>
            <a href="cookie.html" title="Cookie Policy">Cookie</a>
            <span class="separator">&bull;</span>
            <a href="accessibilita.html" title="Accessibilità">Accessibilità</a>
        </div>
    </div>

    <button id="backToTop" class="back-to-top" title="Torna in cima" aria-label="Torna in cima">
        <i class="fas fa-chevron-up" aria-hidden="true"></i>
    </button>

</footer>`;
    }

    // ─── INIZIALIZZAZIONE SINCRONA ────────────────────────────
    // components.js è il PRIMO script in fondo al body.
    // A quel punto tutto l'HTML sopra è già nel DOM:
    // #app-header e #app-footer sono disponibili immediatamente.
    // Eseguiamo la sostituzione ORA, in modo che slim-header.js
    // (IIFE sincrono, caricato dopo) trovi già #nhSlim e .dashboard-footer
    // nella versione corretta e centralizzata.
    (function init() {
        const activePage = detectActivePage();

        const headerEl = document.getElementById('app-header');
        if (headerEl) {
            headerEl.innerHTML = buildHeader(activePage);
        }

        const footerEl = document.getElementById('app-footer');
        if (footerEl) {
            footerEl.innerHTML = buildFooter();
        }
    }());

})();
