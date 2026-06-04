# Dashboard Monitoraggio — Patti di Collaborazione
### Comune di Palermo · Ufficio Rigenerazione Urbana

Dashboard web interattiva per visualizzare e monitorare i **Patti di Collaborazione** tra il Comune di Palermo e i cittadini attivi (gruppi informali, associazioni, organizzazioni del Terzo Settore) per la cura e rigenerazione dei beni comuni urbani.

**URL pubblica:** https://palermohub.github.io/Dashboard-Monitoraggio/

---

## A cosa serve

I Patti di Collaborazione sono accordi formali con cui il Comune affida a cittadini e associazioni la cura, gestione e rigenerazione di spazi pubblici urbani. La dashboard permette a chiunque di:

- vedere **dove** sono localizzati i patti sul territorio di Palermo
- sapere **in che stato** si trova ciascun patto (stipulato, in istruttoria, archiviato, ecc.)
- filtrare per **ambito di azione**, **territorio** (circoscrizione, quartiere, UPL) o **proponente**
- accedere alle **schede complete** di ciascun patto (documenti PDF, foto, coordinate)
- capire **come attivare** un nuovo Patto di Collaborazione

---

## Struttura delle pagine

| Pagina | File | Contenuto |
|--------|------|-----------|
| Dashboard | `index.html` | Mappa + grafici + filtri — pagina principale |
| Attiva un Patto! | `attiva.html` | Guida al regolamento (spiegato con AI) |
| FAQ | `faq.html` | Domande frequenti sui patti |
| Modulistica | `modulistica.html` | Moduli e documenti scaricabili |
| Riferimenti Normativi | `normativi.html` | Base normativa e delibere |
| Laboratori di Quartiere | `laboratori.html` | Iniziative territoriali di co-progettazione |
| About | `about.html` | Ufficio Rigenerazione Urbana, contatti, responsabili |
| Info App | `info.html` | Guida all'uso della dashboard |

---

## Come funziona la Dashboard (index.html)

### Dati
I patti sono caricati da `dati/monit_patti_pa.csv` — un CSV con una riga per patto contenente:

| Campo | Descrizione |
|-------|-------------|
| `Id` | Codice univoco patto |
| `Lat.` / `Long.` | Coordinate geografiche |
| `Indirizzo` | Localizzazione testuale |
| `UPL` | Unità di Primo Livello |
| `Quartiere` | Quartiere di Palermo |
| `Circoscrizione` | Circoscrizione (I–VIII) |
| `Ambiti di azione` | Tipo di intervento (cura aree, azioni immateriali, riqualificazione, ecc.) |
| `Proponente` | Tipo di soggetto proponente |
| `Titolo proposta` | Nome del progetto |
| `Rappresentante` | Referente del patto |
| `Stato di avanzamento` | Stato corrente (vedi sotto) |
| `Scarica il Patto` | Link al PDF del patto firmato |

### Stati dei patti

| Stato | Colore |
|-------|--------|
| Patto stipulato | Verde `#10b981` |
| Istruttoria in corso | Giallo `#f59e0b` |
| In attesa di integrazione | Arancione `#f97316` |
| Proroga e/o Monitoraggio | Viola `#8b5cf6` |
| Respinta | Rosso `#ef4444` |
| Archiviata | Grigio `#64748b` |

### Mappa interattiva
- Basata su **Leaflet.js** con layer OpenStreetMap
- Marker colorati per stato del patto
- Click su marker → popup con anteprima → click su "Dettagli" → side panel completo
- Navigazione con hash URL (`#lat/lng/zoom`) per condivisione diretta della posizione mappa
- Controllo layer (standard / satellitare / altri)

### Grafici interattivi
- **Grafico stato**: distribuzione dei patti per stato di avanzamento
- **Grafico proponente**: distribuzione per tipo di proponente
- Click su una barra/slice = filtro applicato alla mappa e alla tabella

### Filtri e ricerca
La topbar offre quattro strumenti di filtraggio combinabili tra loro:

1. **Smart Search** — ricerca testuale su titolo, proponente, rappresentante, indirizzo, quartiere, UPL, circoscrizione. Autocomplete con suggerimenti in tempo reale e cache lato client.
2. **Stato** — dropdown con tutti gli stati disponibili
3. **Ambito** — dropdown con gli ambiti di azione
4. **Territorio** — drawer con select per Circoscrizione, Quartiere e UPL

I filtri attivi vengono mostrati come **chip** nella barra e come **popup galleggiante** con contatore dei risultati. Tutti i filtri vengono codificati nell'**URL** (query string) per permettere deep linking e condivisione di viste filtrate.

### Side panel
Cliccando su un patto (da mappa o tabella) si apre un pannello laterale con:
- Titolo, proponente, rappresentante
- Stato con badge colorato
- Indirizzo, circoscrizione, quartiere, UPL, ambito
- Mini-mappa con la posizione precisa
- Link al PDF del patto firmato
- Navigazione patto precedente/successivo tra i risultati filtrati

### Vista tabella
Il pulsante **Tabella** nella topbar apre una vista a griglia di tutti i patti filtrati.

---

## Architettura tecnica

### Stack
- **HTML/CSS/JS puro** — nessun framework, nessun build step
- **Hosting**: GitHub Pages (branch `gh-pages`)
- **Dati**: CSV statici in `dati/` — nessun backend

### Librerie esterne (CDN)

| Libreria | Versione | Uso |
|----------|----------|-----|
| Leaflet.js | 1.9.4 | Mappa interattiva |
| Font Awesome | 6.5.1 | Icone |
| Titillium Web | — | Font (Google Fonts) |
| Google Analytics | — | Tracking (G-KHR1GHDRQS) |

### File JavaScript

| File | Responsabilità |
|------|----------------|
| `components.js` | Header e footer condivisi tra tutte le pagine |
| `chart-config.js` | Colori e palette grafici (unica fonte di verità) |
| `monitoraggio_p1-v9.js` | Core: caricamento CSV, mappa, grafici, filtri, logica principale |
| `monitoraggio_p2.js` | Gestione avanzata modal, cleanup mini-mappa |
| `smart-search-v2.js` | Ricerca intelligente con autocomplete e cache |
| `side-panel.js` | Pannello laterale flottante per dettaglio patto |
| `url-routing.js` | Sincronizzazione filtri ↔ URL (deep linking) |
| `map-controls_layer.js` | Controlli layer e zoom mappa |
| `csv-parser.js` | Parsing CSV lato client |
| `tab-modal.js` | Gestione tab e modal |
| `mobile-nav.js` | Navigazione responsive |
| `leaflet-hash.js` | Sincronizzazione posizione mappa con hash URL |
| `focus-trap.js` | Accessibilità: trap focus nelle modal |
| `back_to_top.js` | Pulsante torna in cima |
| `slim-header.js` | Comportamento header slim su scroll |
| `logger.js` | Logger centralizzato |

### File CSS

| File | Responsabilità |
|------|----------------|
| `patti_pa_general.css` | Stili base e layout dashboard |
| `patti_pa_media.css` | Media query responsive |
| `patti_pa_footer.css` / `_media.css` | Footer |
| `smart_topbar.css` | Topbar filtri |
| `side_panel.css` | Side panel |
| `map_control.css` | Controlli mappa |
| `tab_modal.css` | Tab e modal |
| `reg_att.css` | Pagine regolamento e attivazione |

---

## Aggiornare i dati

Per aggiornare i patti modificare `dati/monit_patti_pa.csv` rispettando le colonne esistenti. Il file viene letto via `fetch()` al caricamento della pagina — nessun backend necessario, basta fare commit e push su `gh-pages`.

I PDF dei patti stipulati vanno in `patti/patto_XXX.pdf` (es. `patti/patto_001.pdf`).

---

## Sviluppato da

[OpenDataSicilia](https://opendatasicilia.it) / [PalermoHub](https://palermohub.opendatasicilia.it) per l'**Ufficio Rigenerazione Urbana** del Comune di Palermo.
