document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('backToTop');
    var footer = document.querySelector('.dashboard-footer');
    if (!btn) return;

    var defaultBottom = 24;

    // Individua il contenitore che scorre effettivamente
    var scroller = null;
    if (document.body.classList.contains('dashboard-app')) {
        scroller = document.querySelector('.dashboard-main');
    } else if (document.body.classList.contains('slim-active')) {
        scroller = document.querySelector('.slim-scroll-wrap');
    }

    function getScrollY() {
        return scroller ? scroller.scrollTop : window.scrollY;
    }

    function update() {
        var scrollY = getScrollY();
        btn.style.display = scrollY > 300 ? 'flex' : 'none';

        if (footer) {
            var footerTop = footer.getBoundingClientRect().top;
            var viewH = window.innerHeight;
            if (footerTop < viewH) {
                btn.style.bottom = (viewH - footerTop + defaultBottom) + 'px';
            } else {
                btn.style.bottom = defaultBottom + 'px';
            }
        }
    }

    if (scroller) {
        scroller.addEventListener('scroll', update, { passive: true });
    } else {
        window.addEventListener('scroll', update, { passive: true });
    }
    update();

    btn.addEventListener('click', function () {
        if (scroller) {
            scroller.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});
