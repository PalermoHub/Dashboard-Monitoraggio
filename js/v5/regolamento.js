        // Definizione della struttura degli articoli per ogni capo
        const articoliPerCapo = {
            capo1: [
                { id: 'art1', title: 'Art. 1 - Finalità, oggetto ed ambito di applicazione' },
                { id: 'art2', title: 'Art. 2 - Definizioni' },
                { id: 'art3', title: 'Art. 3 - Principi generali' },
                { id: 'art4', title: 'Art. 4 - I cittadini attivi' },
                { id: 'art5', title: 'Art. 5 - Patto di collaborazione' }
            ],
            capo2: [
                { id: 'art6', title: 'Art. 6 - Disposizioni generali' },
                { id: 'art7', title: 'Art. 7 - Patti di collaborazione ordinari' },
                { id: 'art8', title: 'Art. 8 - Patti di collaborazione complessi' },
                { id: 'art8bis', title: 'Art. 8 bis - Uso civico e collettivo urbano e territoriale' },
                { id: 'art8ter', title: 'Art. 8 ter - Modalità dell\'uso civico e collettivo' },
                { id: 'art8quater', title: 'Art. 8 quater - Dichiarazione di uso civico e collettivo' },
                { id: 'art8quinquies', title: 'Art. 8 quinquies - Disposizioni a carattere generale' }
            ],
            capo3: [
                { id: 'art9', title: 'Art. 9 - Azioni e interventi di cura, rigenerazione e gestione' }
            ],
            capo4: [
                { id: 'art10', title: 'Art. 10 - Forme di Condivisione' },
                { id: 'art11', title: 'Art. 11 - Canoni e tributi locali' },
                { id: 'art12', title: 'Art. 12 - Collaborazioni' },
                { id: 'art13', title: 'Art. 13 - Materiali di consumo e dispositivi di protezione' },
                { id: 'art14', title: 'Art. 14 - Formazione' },
                { id: 'art15', title: 'Art. 15 - Autofinanziamento' }
            ],
            capo5: [
                { id: 'art16', title: 'Art. 16 - Comunicazione di interesse generale' },
                { id: 'art17', title: 'Art. 17 - Misurazione e valutazione delle attività' }
            ],
            capo6: [
                { id: 'art18', title: 'Art. 18 - Formazione per prevenire i rischi' },
                { id: 'art19', title: 'Art. 19 - Riparto delle responsabilità' },
                { id: 'art20', title: 'Art. 20 - Tentativo di conciliazione' }
            ],
            capo7: [
                { id: 'art21', title: 'Art. 21 - Clausole interpretative' },
                { id: 'art22', title: 'Art. 22 - Entrata in vigore e sperimentazione' }
            ]
        };
        
        // Riferimenti agli elementi DOM
        const capoSelect = document.getElementById('capoSelect');
        const articoloSelect = document.getElementById('articoloSelect');
        
        // Funzione per nascondere tutti i capitoli tranne quello selezionato
        function mostraCapitolo(capoId) {
            // Prende tutti gli elementi con classe 'capo'
            const tuttiCapitoli = document.querySelectorAll('.capo');
            
            // Nasconde tutti i capitoli
            tuttiCapitoli.forEach(capo => {
                capo.classList.remove('visible');
                capo.classList.add('hidden');
            });
            
            // Mostra solo il capitolo selezionato
            const capitoloSelezionato = document.getElementById(capoId);
            if (capitoloSelezionato) {
                capitoloSelezionato.classList.remove('hidden');
                capitoloSelezionato.classList.add('visible');
            }
        }
        
        // Funzione per popolare il menu degli articoli
        function popolaArticoli(capoId) {
            // Pulisce il menu
            articoloSelect.innerHTML = '';
            
            // Opzione di default
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Seleziona un articolo --';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            articoloSelect.appendChild(defaultOption);
            
            // Aggiunge gli articoli del capo selezionato
            const articoli = articoliPerCapo[capoId];
            articoli.forEach(articolo => {
                const option = document.createElement('option');
                option.value = articolo.id;
                option.textContent = articolo.title;
                articoloSelect.appendChild(option);
            });
        }
        
        // Funzione per navigare a un elemento
        function navigaA(elementId) {
            const elemento = document.getElementById(elementId);
            if (elemento) {
                elemento.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
                // Aggiunge un piccolo offset per evitare che il titolo vada sotto l'header
                setTimeout(() => {
                    window.scrollBy(0, -20);
                }, 300);
            }
        }
        
        // Event listener per il cambio di capo
        capoSelect.addEventListener('change', function() {
            const capoSelezionato = this.value;
            mostraCapitolo(capoSelezionato);
            popolaArticoli(capoSelezionato);
            navigaA(capoSelezionato);
        });
        
        // Event listener per il cambio di articolo
        articoloSelect.addEventListener('change', function() {
            const articoloSelezionato = this.value;
            if (articoloSelezionato) {
                navigaA(articoloSelezionato);
            }
        });
        
        // Inizializzazione: carica il capo 1 e mostra solo quello
        mostraCapitolo('capo1');
        popolaArticoli('capo1');
        
        // Back to top button
        const backToTop = document.getElementById('backToTop');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
        
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });