const paragrafiPerCapitolo = {
    cap1: [
        { value: 'finalita',          text: 'Finalità' },
        { value: 'cosa-sono',         text: 'Cosa sono i beni comuni' },
        { value: 'cittadini-attivi',  text: 'Chi sono i cittadini attivi' },
        { value: 'patto-collaborazione', text: 'Cos\'è un Patto di Collaborazione' },
        { value: 'differenza-patti',  text: 'Patti ordinari vs complessi' },
        { value: 'uso-civico',        text: 'Uso civico e collettivo urbano' },
        { value: 'dichiarazione-uso', text: 'Dichiarazione di uso civico' },
        { value: 'sostegno-economico',text: 'Sostegno economico del Comune' },
        { value: 'valutazione',       text: 'Valutazione dei risultati' }
    ],
    cap2: [
        { value: 'principi-fondamentali', text: 'Principi Fondamentali' },
        { value: 'principi-operativi',    text: 'Principi Operativi' }
    ],
    cap3: [
        { value: 'patti-ordinari',  text: 'Patti di Collaborazione Ordinari' },
        { value: 'patti-complessi', text: 'Patti di Collaborazione Complessi' },
        { value: 'ulteriori-info',  text: 'Ulteriori Informazioni' }
    ],
    cap4: [
        { value: 'ruolo-cittadini',    text: 'Ruolo dei Cittadini Attivi' },
        { value: 'supporto-comune',    text: 'Supporto dell\'Amministrazione' },
        { value: 'ulteriori-supporti', text: 'Ulteriori forme di Supporto' }
    ],
    cap5: [
        { value: 'principi',    text: 'Principi e Caratteristiche' },
        { value: 'esempi',      text: 'Esempi di Attività' },
        { value: 'trasparenza', text: 'Importanza della Trasparenza' }
    ],
    cap6: [
        { value: 'casi',  text: 'Casi specifici' },
        { value: 'ruolo', text: 'Ruolo della circoscrizione' }
    ],
    cap7: [
        { value: 'tentativo-conciliazione', text: 'Tentativo di Conciliazione' }
    ],
    cap8: [
        { value: 'elementi-patto', text: 'Elementi del Patto' },
        { value: 'proposta',       text: 'Proposta di Collaborazione' },
        { value: 'allegati',       text: 'Allegati necessari' },
        { value: 'procedura',      text: 'Procedura di valutazione' }
    ]
};

function mostraCapitolo(capId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(capId);
    if (el) {
        el.classList.add('active');
        el.querySelectorAll('[data-paragrafo]').forEach(d => { d.style.display = 'block'; });
        el.querySelectorAll('.subsection').forEach(s => s.classList.add('active'));
    }
}

function aggiornaTOC(capId) {
    const tocList = document.getElementById('attiva-toc-list');
    if (!tocList) return;
    tocList.innerHTML = '';
    (paragrafiPerCapitolo[capId] || []).forEach(p => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = p.text;
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(`[data-paragrafo="${p.value}"]`);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            tocList.querySelectorAll('a').forEach(l => l.classList.remove('toc-active'));
            link.classList.add('toc-active');
        });
        li.appendChild(link);
        tocList.appendChild(li);
    });
}

function attivaNavLink(capId) {
    document.querySelectorAll('.mkdocs-nav-link[data-cap]').forEach(l => l.classList.remove('active'));
    const active = document.querySelector(`.mkdocs-nav-link[data-cap="${capId}"]`);
    if (active) active.classList.add('active');
}

function initFromHash() {
    const hash = location.hash.slice(1);
    const capId = paragrafiPerCapitolo[hash] ? hash : 'cap1';
    mostraCapitolo(capId);
    aggiornaTOC(capId);
    attivaNavLink(capId);
}

initFromHash();

// Click sulla nav sinistra
document.querySelectorAll('.mkdocs-nav-link[data-cap]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const capId = link.dataset.cap;
        mostraCapitolo(capId);
        aggiornaTOC(capId);
        attivaNavLink(capId);
        history.replaceState(null, '', '#' + capId);
        const el = document.getElementById(capId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
