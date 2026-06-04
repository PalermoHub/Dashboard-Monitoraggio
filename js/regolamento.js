const articoliPerCapo = {
    capo1: [
        { id: 'art1', title: 'Art. 1 — Finalità, oggetto ed ambito' },
        { id: 'art2', title: 'Art. 2 — Definizioni' },
        { id: 'art3', title: 'Art. 3 — Principi generali' },
        { id: 'art4', title: 'Art. 4 — I cittadini attivi' },
        { id: 'art5', title: 'Art. 5 — Patto di collaborazione' }
    ],
    capo2: [
        { id: 'art6',          title: 'Art. 6 — Disposizioni generali' },
        { id: 'art7',          title: 'Art. 7 — Patti ordinari' },
        { id: 'art8',          title: 'Art. 8 — Patti complessi' },
        { id: 'art8bis',       title: 'Art. 8 bis — Uso civico e collettivo' },
        { id: 'art8ter',       title: 'Art. 8 ter — Modalità uso civico' },
        { id: 'art8quater',    title: 'Art. 8 quater — Dichiarazione uso civico' },
        { id: 'art8quinquies', title: 'Art. 8 quinquies — Disposizioni generali usi civici' }
    ],
    capo3: [
        { id: 'art9', title: 'Art. 9 — Azioni e interventi di cura' }
    ],
    capo4: [
        { id: 'art10', title: 'Art. 10 — Forme di Condivisione' },
        { id: 'art11', title: 'Art. 11 — Canoni e tributi locali' },
        { id: 'art12', title: 'Art. 12 — Collaborazioni' },
        { id: 'art13', title: 'Art. 13 — Materiali e DPI' },
        { id: 'art14', title: 'Art. 14 — Formazione' },
        { id: 'art15', title: 'Art. 15 — Autofinanziamento' }
    ],
    capo5: [
        { id: 'art16', title: 'Art. 16 — Comunicazione di interesse generale' },
        { id: 'art17', title: 'Art. 17 — Misurazione e valutazione' }
    ],
    capo6: [
        { id: 'art18', title: 'Art. 18 — Formazione per prevenire i rischi' },
        { id: 'art19', title: 'Art. 19 — Riparto delle responsabilità' },
        { id: 'art20', title: 'Art. 20 — Tentativo di conciliazione' }
    ],
    capo7: [
        { id: 'art21', title: 'Art. 21 — Clausole interpretative' },
        { id: 'art22', title: 'Art. 22 — Entrata in vigore' }
    ]
};

function mostraCapitolo(capoId) {
    document.querySelectorAll('.capo').forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('visible');
    });
    const el = document.getElementById(capoId);
    if (el) {
        el.classList.remove('hidden');
        el.classList.add('visible');
    }
}

function aggiornaTOC(capoId) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    tocList.innerHTML = '';
    (articoliPerCapo[capoId] || []).forEach(a => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#' + a.id;
        link.textContent = a.title;
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(a.id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + a.id);
            tocList.querySelectorAll('a').forEach(l => l.classList.remove('toc-active'));
            link.classList.add('toc-active');
        });
        li.appendChild(link);
        tocList.appendChild(li);
    });
}

function attivaNavLink(capoId) {
    document.querySelectorAll('.mkdocs-nav-link[data-capo]').forEach(l => l.classList.remove('active'));
    const active = document.querySelector(`.mkdocs-nav-link[data-capo="${capoId}"]`);
    if (active) active.classList.add('active');
}

// Mappa inversa artId → capoId per deep link agli articoli
const artToCapo = {};
Object.entries(articoliPerCapo).forEach(([capo, arts]) => {
    arts.forEach(a => { artToCapo[a.id] = capo; });
});

function initFromHash() {
    const hash = location.hash.slice(1);
    if (articoliPerCapo[hash]) {
        mostraCapitolo(hash); aggiornaTOC(hash); attivaNavLink(hash);
        return;
    }
    const capo = artToCapo[hash];
    if (capo) {
        mostraCapitolo(capo); aggiornaTOC(capo); attivaNavLink(capo);
        setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
    }
    mostraCapitolo('capo1'); aggiornaTOC('capo1'); attivaNavLink('capo1');
}

initFromHash();

// Click sulla nav sinistra
document.querySelectorAll('.mkdocs-nav-link[data-capo]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const capoId = link.dataset.capo;
        mostraCapitolo(capoId);
        aggiornaTOC(capoId);
        attivaNavLink(capoId);
        history.replaceState(null, '', '#' + capoId);
        const el = document.getElementById(capoId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
