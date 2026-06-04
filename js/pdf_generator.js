document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("istanza-form");
    
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // Dati anagrafici
            document.getElementById("pdf_nome_cognome").innerText = document.getElementById("nome_cognome").value;
            document.getElementById("pdf_luogo_nascita").innerText = document.getElementById("luogo_nascita").value;
            
            let dn = document.getElementById("data_nascita").value;
            if(dn) {
                const parts = dn.split('-');
                document.getElementById("pdf_data_nascita").innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            
            document.getElementById("pdf_codice_fiscale").innerText = document.getElementById("codice_fiscale").value.toUpperCase();
            document.getElementById("pdf_residenza_citta").innerText = document.getElementById("residenza_citta").value;
            document.getElementById("pdf_residenza_prov").innerText = document.getElementById("residenza_prov").value.toUpperCase();
            document.getElementById("pdf_residenza_via").innerText = document.getElementById("residenza_via").value;

            // In qualità di
            const qualita = document.querySelector('input[name="in_qualita_di"]:checked').value;
            document.getElementById("chk_privato").innerText = qualita === 'Privato/a Cittadino/a' ? 'X' : '';
            document.getElementById("chk_gruppo").innerText = qualita === 'Rappresentante gruppo informale' ? 'X' : '';
            document.getElementById("chk_ente").innerText = qualita === 'Legale rappresentante dell\'associazione/ente/società' ? 'X' : '';

            document.getElementById("pdf_gruppo_nome").innerText = document.getElementById("gruppo_nome").value;
            document.getElementById("pdf_gruppo_composizione").innerText = document.getElementById("gruppo_composizione").value;
            
            document.getElementById("pdf_ente_nome").innerText = document.getElementById("ente_nome").value;
            document.getElementById("pdf_ente_cf").innerText = document.getElementById("ente_cf_piva").value;
            document.getElementById("pdf_ente_sede").innerText = document.getElementById("ente_sede").value;
            document.getElementById("pdf_ente_via").innerText = document.getElementById("ente_via").value;

            // Contatti
            document.getElementById("pdf_email").innerText = document.getElementById("contatto_email").value;
            document.getElementById("pdf_pec").innerText = document.getElementById("contatto_pec").value;
            document.getElementById("pdf_tel").innerText = document.getElementById("contatto_tel").value;
            document.getElementById("pdf_cell").innerText = document.getElementById("contatto_cell").value;

            // PROPONE
            document.getElementById("pdf_prop_titolo").innerText = document.getElementById("prop_titolo").value;
            document.getElementById("pdf_prop_bene").innerText = document.getElementById("prop_bene").value;
            document.getElementById("pdf_prop_idea").innerText = document.getElementById("prop_idea").value;
            document.getElementById("pdf_prop_attivita").innerText = document.getElementById("prop_attivita").value;
            document.getElementById("pdf_prop_destinatari").innerText = document.getElementById("prop_destinatari").value;
            document.getElementById("pdf_prop_modello").innerText = document.getElementById("prop_modello").value;

            const durata = document.getElementById("prop_durata").value;
            document.getElementById("chk_breve").innerText = durata.includes('Breve') ? 'X' : '';
            document.getElementById("chk_medio").innerText = durata.includes('Medio') ? 'X' : '';
            document.getElementById("chk_lungo").innerText = durata.includes('Lungo') ? 'X' : '';

            const utilizzo = document.getElementById("prop_utilizzo").value;
            document.getElementById("chk_continuativo").innerText = utilizzo === 'continuativo' ? 'X' : '';
            document.getElementById("chk_periodico").innerText = utilizzo === 'periodico' ? 'X' : '';
            document.getElementById("pdf_prop_utilizzo_dett").innerText = utilizzo === 'periodico' ? document.getElementById("prop_utilizzo_periodico_dett").value : '';

            // Risorse proprie
            const risEuro = document.getElementById("ris_euro").value;
            const risEuroPer = document.getElementById("ris_euro_per").value;
            document.getElementById("chk_ris_proprie").innerText = risEuro || risEuroPer ? 'X' : '';
            document.getElementById("pdf_ris_euro").innerText = risEuro;
            document.getElementById("pdf_ris_euro_per").innerText = risEuroPer;
            
            const risStrum = document.getElementById("ris_strumentali").value;
            document.getElementById("chk_ris_strumentali").innerText = risStrum ? 'X' : '';
            document.getElementById("pdf_ris_strumentali").innerText = risStrum;
            
            const risUmane = document.getElementById("ris_umane").value;
            document.getElementById("chk_ris_umane").innerText = risUmane ? 'X' : '';
            document.getElementById("pdf_ris_umane").innerText = risUmane;

            // Sostegno Comune
            const sostSpazi = document.getElementById("sost_spazi").value;
            document.getElementById("chk_sost_spazi").innerText = sostSpazi ? 'X' : '';
            document.getElementById("pdf_sost_spazi").innerText = sostSpazi;

            const sostBeni = document.getElementById("sost_beni").value;
            document.getElementById("chk_sost_beni").innerText = sostBeni ? 'X' : '';
            document.getElementById("pdf_sost_beni").innerText = sostBeni;

            const sostForm = document.getElementById("sost_formazione").value;
            document.getElementById("chk_sost_formazione").innerText = sostForm ? 'X' : '';
            document.getElementById("pdf_sost_formazione").innerText = sostForm;

            const sostPers = document.getElementById("sost_personale").value;
            document.getElementById("chk_sost_personale").innerText = sostPers ? 'X' : '';
            document.getElementById("pdf_sost_personale").innerText = sostPers;

            const sostAltro = document.getElementById("sost_altro").value;
            document.getElementById("chk_sost_altro").innerText = sostAltro ? 'X' : '';
            document.getElementById("pdf_sost_altro").innerText = sostAltro;

            // Contenzioso
            const cont = document.querySelector('input[name="contenzioso"]:checked').value;
            document.getElementById("chk_cont_no").innerText = cont === 'no' ? 'X' : '';
            document.getElementById("chk_cont_si").innerText = cont === 'si' ? 'X' : '';
            document.getElementById("pdf_cont_doc").innerText = document.getElementById("cont_doc").value;

            // Allegati
            document.getElementById("pdf_all_1").innerText = document.getElementById("all_1").checked ? 'X' : '';
            document.getElementById("pdf_all_2").innerText = document.getElementById("all_2").checked ? 'X' : '';
            document.getElementById("pdf_all_3").innerText = document.getElementById("all_3").checked ? 'X' : '';
            document.getElementById("pdf_all_4").innerText = document.getElementById("all_4").checked ? 'X' : '';
            document.getElementById("pdf_all_5").innerText = document.getElementById("all_5").checked ? 'X' : '';
            document.getElementById("pdf_all_6").innerText = document.getElementById("all_6").checked ? 'X' : '';
            document.getElementById("pdf_all_7").innerText = document.getElementById("all_7").checked ? 'X' : '';
            document.getElementById("pdf_all_8").innerText = document.getElementById("all_8").checked ? 'X' : '';
            document.getElementById("pdf_all_9").innerText = document.getElementById("all_9").checked ? 'X' : '';
            document.getElementById("pdf_all_altro").innerText = document.getElementById("all_9").checked ? document.getElementById("all_altro_testo").value : '';

            // Data
            const oggi = new Date();
            const gg = String(oggi.getDate()).padStart(2, '0');
            const mm = String(oggi.getMonth() + 1).padStart(2, '0');
            const aaaa = oggi.getFullYear();
            document.getElementById("pdf_data_firma").innerText = `${gg}/${mm}/${aaaa}`;

            // Genera il PDF
            const element = document.getElementById('pdf-template');
            element.style.display = 'block';

            // Poiché è un documento lungo (4 pagine), la scala può influire molto
            const opt = {
                margin:       [0, 0, 0, 0], // Margini gestiti via CSS per controllo preciso sulle pagine
                filename:     `Istanza_Patto_${document.getElementById("nome_cognome").value.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const submitBtn = form.querySelector('.btn-submit');
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione in corso...';
            submitBtn.disabled = true;

            html2pdf().set(opt).from(element).save().then(() => {
                element.style.display = 'none';
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                alert("Il PDF è stato generato e scaricato con successo!\nRicordati di firmarlo e inviarlo via PEC o consegnarlo a mano.");
            }).catch(err => {
                console.error("Errore durante la generazione del PDF:", err);
                element.style.display = 'none';
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
            });
        });
    }
});
