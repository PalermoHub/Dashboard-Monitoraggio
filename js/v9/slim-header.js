(function () {
    'use strict';

    var slim   = document.getElementById('nhSlim');
    var header = document.querySelector('.dashboard-header');
    if (!slim || !header) return;

    var THRESHOLD = 30;

    // Aggiorna --header-height in tempo reale
    if (window.ResizeObserver) {
        new ResizeObserver(function () {
            document.documentElement.style.setProperty(
                '--header-height',
                header.getBoundingClientRect().height + 'px'
            );
        }).observe(header);
    }

    function onScroll(pos) {
        slim.classList.toggle('hidden', pos > THRESHOLD);
    }

    var isApp = document.body.classList.contains('dashboard-app');

    if (isApp) {
        // index.html: body fisso (dashboard-app), scroll interno in .dashboard-main
        var mainApp = document.querySelector('.dashboard-main');
        if (mainApp) {
            mainApp.addEventListener('scroll', function () {
                onScroll(mainApp.scrollTop);
            }, { passive: true });
        }
        return;
    }

    // Pagine secondarie: avvolgi patto-page-main + footer in un wrapper scrollabile.
    // Questo replica il pattern di index.html (body fisso, contenuto scorre dentro),
    // evitando sia il problema dello sticky che il footer che copre il contenuto.
    var pageMain   = document.querySelector('.patto-page-main');
    var pageFooter = document.querySelector('.dashboard-footer');

    if (!pageMain) return;

    var wrap = document.createElement('div');
    wrap.className = 'slim-scroll-wrap';
    pageMain.parentNode.insertBefore(wrap, pageMain);
    wrap.appendChild(pageMain);
    if (pageFooter) wrap.appendChild(pageFooter);

    document.body.classList.add('slim-active');

    wrap.addEventListener('scroll', function () {
        onScroll(wrap.scrollTop);
    }, { passive: true });
}());
