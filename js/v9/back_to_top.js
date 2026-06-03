document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('backToTop');
    var footer = document.querySelector('.dashboard-footer');
    if (!btn) return;

    var defaultBottom = 24;

    function update() {
        var scrollY = window.scrollY;
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

    window.addEventListener('scroll', update);
    update();

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
