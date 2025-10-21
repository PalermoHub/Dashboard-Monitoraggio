        // Struttura dati per i paragrafi di ogni capitolo
        const paragrafiPerCapitolo = {
            cap1: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'finalita', text: 'Finalità' },
                { value: 'cosa-sono', text: 'Cosa sono i beni comuni' },
                { value: 'cittadini-attivi', text: 'Chi sono i cittadini attivi' },
                { value: 'patto-collaborazione', text: 'Cos\'è un Patto di Collaborazione' },
                { value: 'differenza-patti', text: 'Differenza tra patti ordinari e complessi' },
                { value: 'uso-civico', text: 'Uso civico e collettivo urbano' },
                { value: 'dichiarazione-uso', text: 'Dichiarazione di uso civico' },
                { value: 'sostegno-economico', text: 'Sostegno economico del Comune' },
                { value: 'valutazione', text: 'Valutazione dei risultati' }
            ],
            cap2: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'principi-fondamentali', text: 'Principi Fondamentali' },
                { value: 'principi-operativi', text: 'Principi Operativi' }
            ],
            cap3: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'patti-ordinari', text: 'Patti di Collaborazione Ordinari' },
                { value: 'patti-complessi', text: 'Patti di Collaborazione Complessi' },
                { value: 'ulteriori-info', text: 'Ulteriori Informazioni' }
            ],
            cap4: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'ruolo-cittadini', text: 'Ruolo dei Cittadini Attivi' },
                { value: 'supporto-comune', text: 'Supporto dell\'Amministrazione Comunale' },
                { value: 'ulteriori-supporti', text: 'Ulteriori forme di Supporto' }
            ],
            cap5: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'principi', text: 'Principi e Caratteristiche' },
                { value: 'esempi', text: 'Esempi di Attività' },
                { value: 'trasparenza', text: 'Importanza della Trasparenza' }
            ],
            cap6: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'casi', text: 'Casi specifici' },
                { value: 'ruolo', text: 'Ruolo della circoscrizione' }
            ],
            cap7: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'tentativo-conciliazione', text: 'Tentativo di Conciliazione' }
            ],
            cap8: [
                { value: 'all', text: 'Tutto il capitolo' },
                { value: 'elementi-patto', text: 'Elementi del Patto di Collaborazione' },
                { value: 'proposta', text: 'Proposta di Collaborazione' },
                { value: 'allegati', text: 'Allegati necessari' },
                { value: 'procedura', text: 'Procedura di valutazione' }
            ]
        };

        const capitoloSelect = document.getElementById('capitolo-select');
        const paragrafoSelect = document.getElementById('paragrafo-select');

        // Funzione per aggiornare i paragrafi in base al capitolo selezionato
        function aggiornaParagrafi(capitolo) {
            paragrafoSelect.innerHTML = '';
            const paragrafi = paragrafiPerCapitolo[capitolo];
            
            paragrafi.forEach(p => {
                const option = document.createElement('option');
                option.value = p.value;
                option.textContent = p.text;
                paragrafoSelect.appendChild(option);
            });
        }

        // Funzione per mostrare il contenuto selezionato
        function mostraContenuto() {
            const capitoloSelezionato = capitoloSelect.value;
            const paragrafoSelezionato = paragrafoSelect.value;

            // Nascondi tutti i capitoli
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Mostra il capitolo selezionato
            const capitolo = document.getElementById(capitoloSelezionato);
            capitolo.classList.add('active');

            // Gestisci i paragrafi
            const subsections = capitolo.querySelectorAll('[data-paragrafo]');
            
            if (paragrafoSelezionato === 'all') {
                // Mostra tutto il capitolo
                subsections.forEach(sub => {
                    sub.style.display = 'block';
                });
            } else {
                // Nascondi tutto tranne i titoli h1
                const h1 = capitolo.querySelector('h1');
                if (h1 && h1.parentElement.hasAttribute('data-paragrafo')) {
                    h1.parentElement.style.display = 'none';
                }
                
                subsections.forEach(sub => {
                    if (sub.getAttribute('data-paragrafo') === 'all') {
                        // Nascondi il contenitore "all" ma mantieni visibile h1
                        const h1Clone = sub.querySelector('h1');
                        if (h1Clone) {
                            h1Clone.style.display = 'block';
                            h1Clone.parentElement.style.display = 'block';
                        }
                        // Nascondi i div figli
                        sub.querySelectorAll('div[data-paragrafo]').forEach(child => {
                            child.style.display = 'none';
                        });
                    } else {
                        sub.style.display = 'none';
                    }
                });
                
                // Mantieni sempre visibile l'h1 principale
                const mainH1 = capitolo.querySelector('.subsection[data-paragrafo="all"] > h1');
                if (mainH1) {
                    mainH1.parentElement.style.display = 'block';
                    mainH1.style.display = 'block';
                }
                
                // Mostra il titolo h1 e il paragrafo selezionato
                const paragrafoDiv = capitolo.querySelector(`.subsection[data-paragrafo="all"] > div[data-paragrafo="${paragrafoSelezionato}"]`);
                if (paragrafoDiv) {
                    paragrafoDiv.style.display = 'block';
                }
            }
        }

        // Event listeners
        capitoloSelect.addEventListener('change', function() {
            aggiornaParagrafi(this.value);
            paragrafoSelect.value = 'all';
            mostraContenuto();
        });

        paragrafoSelect.addEventListener('change', mostraContenuto);

        // Inizializzazione
        aggiornaParagrafi('cap1');
        mostraContenuto();