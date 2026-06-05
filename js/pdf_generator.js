// pdf_generator.js — defer, DOM già pronto
(function () {
    'use strict';

    const form = document.getElementById('istanza-form');
    if (!form) return;

    // ─── NOTIFICA ERRORI (fixed top) ───────────────────────────
    function showAlert(errors) {
        let box = document.getElementById('pdf-validation-alert');
        if (!box) {
            box = document.createElement('div');
            box.id = 'pdf-validation-alert';
            box.style.cssText = [
                'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
                'background:#c0392b', 'color:#fff', 'font-family:inherit',
                'padding:14px 20px', 'font-size:0.9rem', 'line-height:1.7',
                'box-shadow:0 4px 12px rgba(0,0,0,.3)'
            ].join(';');
            document.body.appendChild(box);
        }
        box.innerHTML =
            '<strong>⚠ Campi obbligatori mancanti — compilare prima di generare il PDF:</strong><br>' +
            errors.map(function (e) { return '• ' + e; }).join(' &nbsp;|&nbsp; ') +
            ' &nbsp;<button onclick="document.getElementById(\'pdf-validation-alert\').remove()" ' +
            'style="float:right;background:transparent;border:1px solid #fff;color:#fff;' +
            'padding:2px 10px;border-radius:3px;cursor:pointer;font-size:0.85rem;">&#x2715;</button>';
        box.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearAlert() {
        const box = document.getElementById('pdf-validation-alert');
        if (box) box.remove();
        form.querySelectorAll('.field-error').forEach(function (el) {
            el.classList.remove('field-error');
        });
    }

    // ─── VALIDAZIONE ───────────────────────────────────────────
    function validate() {
        clearAlert();

        var required = [
            { id: 'nome_cognome',     label: 'Nome e Cognome' },
            { id: 'luogo_nascita',    label: 'Nato/a a' },
            { id: 'data_nascita',     label: 'Data di nascita' },
            { id: 'codice_fiscale',   label: 'Codice Fiscale' },
            { id: 'residenza_citta',  label: 'Residente a' },
            { id: 'residenza_prov',   label: 'Provincia' },
            { id: 'residenza_via',    label: 'Via' },
            { id: 'prop_titolo',      label: 'Titolo proposta' },
            { id: 'prop_bene',        label: 'Bene comune' },
            { id: 'prop_idea',        label: 'Idea progettuale' },
            { id: 'prop_attivita',    label: 'Attività previste' },
            { id: 'prop_destinatari', label: 'Destinatari' },
            { id: 'prop_modello',     label: 'Modello partecipativo' },
        ];

        var errors = [];
        required.forEach(function (f) {
            var el = document.getElementById(f.id);
            if (!el || !el.value.trim()) {
                errors.push(f.label);
                if (el) el.classList.add('field-error');
            }
        });

        if (!document.querySelector('input[name="in_qualita_di"]:checked')) {
            errors.push('In qualità di');
        }

        return errors;
    }

    // ─── SUBMIT ────────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var errors = validate();
        if (errors.length > 0) {
            showAlert(errors);
            return;
        }

        // Dati anagrafici
        document.getElementById('pdf_nome_cognome').innerText = document.getElementById('nome_cognome').value;
        document.getElementById('pdf_luogo_nascita').innerText = document.getElementById('luogo_nascita').value;

        var dn = document.getElementById('data_nascita').value;
        if (dn) {
            var parts = dn.split('-');
            document.getElementById('pdf_data_nascita').innerText = parts[2] + '/' + parts[1] + '/' + parts[0];
        }

        document.getElementById('pdf_codice_fiscale').innerText = document.getElementById('codice_fiscale').value.toUpperCase();
        document.getElementById('pdf_residenza_citta').innerText = document.getElementById('residenza_citta').value;
        document.getElementById('pdf_residenza_prov').innerText = document.getElementById('residenza_prov').value.toUpperCase();
        document.getElementById('pdf_residenza_via').innerText = document.getElementById('residenza_via').value;

        // In qualità di
        var qualitaChecked = document.querySelector('input[name="in_qualita_di"]:checked');
        var qualita = qualitaChecked ? qualitaChecked.value : '';
        document.getElementById('chk_privato').innerText = qualita === 'Privato/a Cittadino/a' ? 'X' : '';
        document.getElementById('chk_gruppo').innerText = qualita === 'Rappresentante gruppo informale' ? 'X' : '';
        document.getElementById('chk_ente').innerText = qualita === "Legale rappresentante dell'associazione/ente/società" ? 'X' : '';

        document.getElementById('pdf_gruppo_nome').innerText = document.getElementById('gruppo_nome').value;
        document.getElementById('pdf_gruppo_composizione').innerText = document.getElementById('gruppo_composizione').value;
        document.getElementById('pdf_ente_nome').innerText = document.getElementById('ente_nome').value;
        document.getElementById('pdf_ente_cf').innerText = document.getElementById('ente_cf_piva').value;
        document.getElementById('pdf_ente_sede').innerText = document.getElementById('ente_sede').value;
        document.getElementById('pdf_ente_via').innerText = document.getElementById('ente_via').value;

        // Contatti
        document.getElementById('pdf_email').innerText = document.getElementById('contatto_email').value;
        document.getElementById('pdf_pec').innerText = document.getElementById('contatto_pec').value;
        document.getElementById('pdf_tel').innerText = document.getElementById('contatto_tel').value;
        document.getElementById('pdf_cell').innerText = document.getElementById('contatto_cell').value;

        // PROPONE
        document.getElementById('pdf_prop_titolo').innerText = document.getElementById('prop_titolo').value;
        document.getElementById('pdf_prop_bene').innerText = document.getElementById('prop_bene').value;
        document.getElementById('pdf_prop_idea').innerText = document.getElementById('prop_idea').value;
        document.getElementById('pdf_prop_attivita').innerText = document.getElementById('prop_attivita').value;
        document.getElementById('pdf_prop_destinatari').innerText = document.getElementById('prop_destinatari').value;
        document.getElementById('pdf_prop_modello').innerText = document.getElementById('prop_modello').value;

        var durata = document.getElementById('prop_durata').value;
        document.getElementById('chk_breve').innerText = durata.includes('Breve') ? 'X' : '';
        document.getElementById('chk_medio').innerText = durata.includes('Medio') ? 'X' : '';
        document.getElementById('chk_lungo').innerText = durata.includes('Lungo') ? 'X' : '';

        var utilizzo = document.getElementById('prop_utilizzo').value;
        document.getElementById('chk_continuativo').innerText = utilizzo === 'continuativo' ? 'X' : '';
        document.getElementById('chk_periodico').innerText = utilizzo === 'periodico' ? 'X' : '';
        document.getElementById('pdf_prop_utilizzo_dett').innerText = utilizzo === 'periodico' ? document.getElementById('prop_utilizzo_periodico_dett').value : '';

        // Risorse proprie
        var risEuro = document.getElementById('ris_euro').value;
        var risEuroPer = document.getElementById('ris_euro_per').value;
        document.getElementById('chk_ris_proprie').innerText = risEuro || risEuroPer ? 'X' : '';
        document.getElementById('pdf_ris_euro').innerText = risEuro;
        document.getElementById('pdf_ris_euro_per').innerText = risEuroPer;

        var risStrum = document.getElementById('ris_strumentali').value;
        document.getElementById('chk_ris_strumentali').innerText = risStrum ? 'X' : '';
        document.getElementById('pdf_ris_strumentali').innerText = risStrum;

        var risUmane = document.getElementById('ris_umane').value;
        document.getElementById('chk_ris_umane').innerText = risUmane ? 'X' : '';
        document.getElementById('pdf_ris_umane').innerText = risUmane;

        // Sostegno Comune
        var sostSpazi = document.getElementById('sost_spazi').value;
        document.getElementById('chk_sost_spazi').innerText = sostSpazi ? 'X' : '';
        document.getElementById('pdf_sost_spazi').innerText = sostSpazi;

        var sostBeni = document.getElementById('sost_beni').value;
        document.getElementById('chk_sost_beni').innerText = sostBeni ? 'X' : '';
        document.getElementById('pdf_sost_beni').innerText = sostBeni;

        var sostForm = document.getElementById('sost_formazione').value;
        document.getElementById('chk_sost_formazione').innerText = sostForm ? 'X' : '';
        document.getElementById('pdf_sost_formazione').innerText = sostForm;

        var sostPers = document.getElementById('sost_personale').value;
        document.getElementById('chk_sost_personale').innerText = sostPers ? 'X' : '';
        document.getElementById('pdf_sost_personale').innerText = sostPers;

        var sostAltro = document.getElementById('sost_altro').value;
        document.getElementById('chk_sost_altro').innerText = sostAltro ? 'X' : '';
        document.getElementById('pdf_sost_altro').innerText = sostAltro;

        // Contenzioso
        var contChecked = document.querySelector('input[name="contenzioso"]:checked');
        var cont = contChecked ? contChecked.value : '';
        document.getElementById('chk_cont_no').innerText = cont === 'no' ? 'X' : '';
        document.getElementById('chk_cont_si').innerText = cont === 'si' ? 'X' : '';
        document.getElementById('pdf_cont_doc').innerText = document.getElementById('cont_doc').value;

        // Allegati
        ['1','2','3','4','5','6','7','8','9'].forEach(function (n) {
            document.getElementById('pdf_all_' + n).innerText = document.getElementById('all_' + n).checked ? 'X' : '';
        });
        document.getElementById('pdf_all_altro').innerText = document.getElementById('all_9').checked ? document.getElementById('all_altro_testo').value : '';

        // Data firma
        var oggi = new Date();
        var gg = String(oggi.getDate()).padStart(2, '0');
        var mm = String(oggi.getMonth() + 1).padStart(2, '0');
        var aaaa = oggi.getFullYear();
        document.getElementById('pdf_data_firma').innerText = gg + '/' + mm + '/' + aaaa;

        showWipModal();
        window.print();
    });

}());
