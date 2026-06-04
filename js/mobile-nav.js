/* Mobile Navigation Drawer
   Iniettato dinamicamente in tutte le pagine a ≤640px */
(function () {
    'use strict';

    var LINKS = [
        { href: 'index.html',       icon: 'fas fa-home',            label: 'Dashboard' },
        { href: 'normativi.html',   icon: 'fas fa-book-open',       label: 'Riferimenti Normativi' },
        { href: 'faq.html',         icon: 'fas fa-question-circle', label: 'FAQ' },
        { href: 'attiva.html',      icon: 'fas fa-rocket',          label: 'Attiva un Patto!' },
        { href: 'modulistica.html', icon: 'fas fa-file-alt',        label: 'Modulistica' },
        { href: 'laboratori.html',  icon: 'fas fa-users',           label: 'Laboratori di Quartiere' },
        { href: 'about.html',       icon: 'fas fa-info-circle',     label: 'About' },
        { href: 'info.html',        icon: 'fas fa-cog',             label: 'Info App' }
    ];

    function init() {
        var header = document.querySelector('.dashboard-header');
        if (!header) return;

        var currentFile = location.pathname.split('/').pop() || 'index.html';
        if (!currentFile || currentFile === '') currentFile = 'index.html';
        var active = LINKS.find(function(l){ return l.href === currentFile; }) || LINKS[0];

        /* ── Mobile bar ─────────────────────────── */
        var bar = document.createElement('div');
        bar.className = 'nh-mobile-bar';
        var backTopHtml = currentFile !== 'index.html'
            ? '<button class="nh-back-top" aria-label="Torna in cima">' +
                  '<i class="fas fa-arrow-up"></i><span>Torna in cima</span>' +
              '</button>'
            : '';
        bar.innerHTML =
            '<button class="nh-hamburger" id="nhHamburger" aria-label="Apri menu">' +
                '<i class="fas fa-bars"></i>' +
            '</button>' +
            '<span class="nh-mobile-title">' + active.label + '</span>' +
            backTopHtml;
        header.appendChild(bar);

        if (currentFile !== 'index.html') {
            bar.querySelector('.nh-back-top').addEventListener('click', function () {
                var wrap = document.querySelector('.slim-scroll-wrap');
                if (wrap) wrap.scrollTo({ top: 0, behavior: 'smooth' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        /* ── Overlay ────────────────────────────── */
        var overlay = document.createElement('div');
        overlay.className = 'nh-drawer-overlay';
        document.body.appendChild(overlay);

        /* ── Drawer ─────────────────────────────── */
        var logoEl  = document.querySelector('.nh-project-icon');
        var logoSrc = logoEl ? logoEl.getAttribute('src') : '';
        var logoHtml = logoSrc ? '<img src="' + logoSrc + '" alt="" class="nh-drawer-logo">' : '';

        var items = LINKS.map(function(l) {
            var cls = 'nh-drawer-link' + (l.href === currentFile ? ' active' : '');
            return '<li><a href="' + l.href + '" class="' + cls + '">' +
                '<i class="' + l.icon + '"></i><span>' + l.label + '</span>' +
            '</a></li>';
        }).join('');

        var drawer = document.createElement('nav');
        drawer.className = 'nh-drawer';
        drawer.setAttribute('aria-label', 'Navigazione principale');
        drawer.innerHTML =
            '<div class="nh-drawer-header">' +
                logoHtml +
                '<span class="nh-drawer-title">Patti di Collaborazione · Report di monitoraggio </span>' +
                '<button class="nh-drawer-close" id="nhDrawerClose" aria-label="Chiudi menu">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</div>' +
            '<ul class="nh-drawer-list">' + items + '</ul>';
        document.body.appendChild(drawer);

        /* ── Events ─────────────────────────────── */
        function openDrawer() {
            drawer.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeDrawer() {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        document.getElementById('nhHamburger').addEventListener('click', openDrawer);
        document.getElementById('nhDrawerClose').addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
