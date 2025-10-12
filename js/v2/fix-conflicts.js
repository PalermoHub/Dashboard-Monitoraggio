// ==========================================
// FIX CONFLICTS - RISOLUZIONE DEFINITIVA
// ==========================================
// Questo file risolve i conflitti tra i vari moduli
// Caricalo come ULTIMO script nell'HTML

(function() {
    'use strict';
    
    console.log('🔧 Applicazione fix ai conflitti...');
    
    // ==========================================
    // FIX 1: TABELLA - Funzione unificata definitiva
    // ==========================================
    
    function updateTableUnified() {
        console.log('📊 Aggiornamento tabella unificato');
        
        const tableCount = document.getElementById('tableCount');
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        
        if (!tableCount || !tableHeader || !tableBody) {
            console.error('❌ Elementi tabella non trovati');
            return;
        }
        
        // Verifica dati
        if (!window.filteredData || window.filteredData.length === 0) {
            tableCount.textContent = '0';
            tableHeader.innerHTML = '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nessun dato disponibile</th>';
            tableBody.innerHTML = '<tr><td colspan="100%" class="px-3 py-4 text-center text-gray-500">Nessun risultato trovato</td></tr>';
            return;
        }
        
        // Campi da escludere
        const excludedFields = ['foto', 'googlemaps', 'geouri', 'upl', 'lat.', 'long.', 'lat', 'lng', 'coordinate', 'quartiere', 'circoscrizione'];
        
        const allKeys = Object.keys(window.filteredData[0]);
        const filteredKeys = allKeys.filter(key => {
            const keyLower = key.toLowerCase().trim();
            return !excludedFields.some(excluded => {
                const excludedLower = excluded.toLowerCase().trim();
                return keyLower === excludedLower || keyLower.includes(excludedLower);
            });
        });
        
        // Ordine preferito
        const columnOrder = ['id', 'titolo proposta', 'proponente', 'rappresentante', 'indirizzo', 'stato di avanzamento', 'nota per attività conclusive'];
        
        const orderedKeys = [];
        columnOrder.forEach(orderKey => {
            const foundKey = filteredKeys.find(key => {
                const keyLower = key.toLowerCase().trim();
                const orderLower = orderKey.toLowerCase().trim();
                return keyLower === orderLower || keyLower.includes(orderLower) || orderLower.includes(keyLower);
            });
            if (foundKey && !orderedKeys.includes(foundKey)) {
                orderedKeys.push(foundKey);
            }
        });
        
        filteredKeys.forEach(key => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });
        
        // Aggiorna contatore
        tableCount.textContent = window.filteredData.length;
        
        // Crea header
        tableHeader.innerHTML = '';
        orderedKeys.forEach(key => {
            const th = document.createElement('th');
            th.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = key;
            tableHeader.appendChild(th);
        });
        
        const actionTh = document.createElement('th');
        actionTh.className = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        actionTh.textContent = 'Azioni';
        tableHeader.appendChild(actionTh);
        
        // Crea righe
        tableBody.innerHTML = '';
        
        const statusColors = {
            'Istruttoria in corso': '#ffdb4d',
            'Respinta': '#ff6b6b',
            'Patto stipulato': '#8fd67d',
            'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
            'In attesa di integrazione': '#b3e6ff'
        };
        
        window.filteredData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            orderedKeys.forEach(key => {
                const td = document.createElement('td');
                td.className = 'px-3 py-2 whitespace-nowrap text-xs text-gray-900';
                
                let value = item[key] || 'N/A';
                
                if (key.toLowerCase().includes('stato')) {
                    const color = statusColors[value] || '#6b7280';
                    td.innerHTML = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${value}</span>`;
                } else {
                    if (value.toString().length > 40) {
                        td.innerHTML = `<span title="${value}">${value.toString().substring(0, 37)}...</span>`;
                    } else {
                        td.textContent = value;
                    }
                }
                
                row.appendChild(td);
            });
            
            const actionTd = document.createElement('td');
            actionTd.className = 'px-3 py-2 whitespace-nowrap text-xs font-medium';
            
            const idKey = Object.keys(item).find(k => k.toLowerCase() === 'id');
            actionTd.innerHTML = `
                <button onclick="window.showPattoDetailsFixed('${item[idKey]}')" 
                        class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition-colors">
                    <i data-lucide="eye" class="h-3 w-3 inline mr-1"></i>
                    Dettagli
                </button>
            `;
            
            row.appendChild(actionTd);
            tableBody.appendChild(row);
        });
        
        // Ricrea icone Lucide
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
        
        console.log('✅ Tabella aggiornata:', window.filteredData.length, 'elementi');
    }
    
    // ==========================================
    // FIX 2: LISTENER TABELLA - Unico e definitivo
    // ==========================================
    
    function setupTableButtonFixed() {
        const showTableBtn = document.getElementById('showTableBtn');
        const tableModal = document.getElementById('tableModal');
        const closeTableModal = document.getElementById('closeTableModal');
        
        if (!showTableBtn || !tableModal || !closeTableModal) {
            console.error('❌ Elementi tabella non trovati nel DOM');
            return;
        }
        
        // Clona per rimuovere TUTTI i listener precedenti
        const newShowTableBtn = showTableBtn.cloneNode(true);
        showTableBtn.parentNode.replaceChild(newShowTableBtn, showTableBtn);
        
        console.log('🔄 Pulsante tabella ricreato senza listener vecchi');
        
        // Aggiungi UNICO listener
        newShowTableBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📊 Click su pulsante tabella');
            
            try {
                updateTableUnified();
                tableModal.classList.remove('hidden');
                tableModal.classList.add('flex', 'show');
                console.log('✅ Modal tabella aperto');
            } catch (error) {
                console.error('❌ Errore apertura tabella:', error);
                alert('Errore nel caricamento della tabella. Vedi console per dettagli.');
            }
        });
        
        // Chiusura modal
        const newCloseTableModal = closeTableModal.cloneNode(true);
        closeTableModal.parentNode.replaceChild(newCloseTableModal, closeTableModal);
        
        newCloseTableModal.addEventListener('click', function() {
            tableModal.classList.add('hidden');
            tableModal.classList.remove('flex', 'show');
        });
        
        // Chiudi cliccando fuori
        tableModal.addEventListener('click', function(e) {
            if (e.target === tableModal) {
                newCloseTableModal.click();
            }
        });
        
        console.log('✅ Listener tabella configurati');
    }
    
    // ==========================================
    // FIX 3: DETTAGLI PATTO - Funzione unificata robusta
    // ==========================================
    
    function showPattoDetailsFixed(pattoId) {
        console.log('🔍 Apertura dettagli patto:', pattoId);
        
        // Verifica dati
        if (!window.allData || window.allData.length === 0) {
            console.error('❌ Nessun dato disponibile');
            alert('Dati non ancora caricati. Attendi il caricamento.');
            return;
        }
        
        // Trova il patto
        const idKey = Object.keys(window.allData[0] || {}).find(k => k.toLowerCase() === 'id');
        const patto = window.allData.find(p => p[idKey] == pattoId);
        
        if (!patto) {
            console.error('❌ Patto non trovato:', pattoId);
            alert('Patto non trovato. ID: ' + pattoId);
            return;
        }
        
        console.log('✅ Patto trovato:', patto);
        
        // Trova tutte le chiavi
        const keys = {
            titolo: Object.keys(patto).find(k => k.toLowerCase().includes('titolo')),
            proponente: Object.keys(patto).find(k => k.toLowerCase().includes('proponente')),
            rappresentante: Object.keys(patto).find(k => k.toLowerCase().includes('rappresentante')),
            upl: Object.keys(patto).find(k => k.toLowerCase() === 'upl'),
            quartiere: Object.keys(patto).find(k => k.toLowerCase().includes('quartiere')),
            circoscrizione: Object.keys(patto).find(k => k.toLowerCase().includes('circoscrizione')),
            indirizzo: Object.keys(patto).find(k => k.toLowerCase().includes('indirizzo')),
            stato: Object.keys(patto).find(k => k.toLowerCase().includes('stato')),
            note: Object.keys(patto).find(k => k.toLowerCase().includes('nota')),
            googlemaps: Object.keys(patto).find(k => k.toLowerCase().includes('googlemaps')),
            geouri: Object.keys(patto).find(k => k.toLowerCase().includes('geouri')),
            foto: Object.keys(patto).find(k => k.toLowerCase().includes('foto'))
        };
        
        // Popola il modal
        const modal = document.getElementById('pattoModal');
        const modalTitle = document.getElementById('modalTitle');
        const pattoDetails = document.getElementById('pattoDetails');
        const pattoStatus = document.getElementById('pattoStatus');
        const pattoNotesContainer = document.getElementById('pattoNotesContainer');
        const pattoNotes = document.getElementById('pattoNotes');
        const pattoLinks = document.getElementById('pattoLinks');
        const photoContainer = document.getElementById('photoContainer');
        const pattoPhoto = document.getElementById('pattoPhoto');
        
        if (!modal) {
            console.error('❌ Modal non trovato');
            return;
        }
        
        // Titolo
        if (modalTitle) {
            modalTitle.textContent = patto[keys.titolo] || 'Patto senza titolo';
        }
        
        // Dettagli
        if (pattoDetails) {
            pattoDetails.innerHTML = `
                <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
                <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
                <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
                <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
                <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
                <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
            `;
        }
        
        // Stato
        if (pattoStatus) {
            const statoText = patto[keys.stato] || 'Non specificato';
            const statusColors = {
                'Istruttoria in corso': '#ffdb4d',
                'Respinta': '#ff6b6b',
                'Patto stipulato': '#8fd67d',
                'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
                'In attesa di integrazione': '#b3e6ff'
            };
            const statusColor = statusColors[statoText] || '#6b7280';
            
            pattoStatus.textContent = statoText;
            pattoStatus.style.backgroundColor = statusColor;
            pattoStatus.style.color = 'white';
            pattoStatus.style.padding = '4px 12px';
            pattoStatus.style.borderRadius = '6px';
            pattoStatus.style.fontSize = '0.875rem';
            pattoStatus.style.fontWeight = '600';
            pattoStatus.style.display = 'inline-block';
        }
        
        // Note
        if (pattoNotesContainer && pattoNotes) {
            if (keys.note && patto[keys.note] && patto[keys.note].trim()) {
                pattoNotesContainer.classList.remove('hidden');
                pattoNotes.textContent = patto[keys.note];
            } else {
                pattoNotesContainer.classList.add('hidden');
            }
        }
        
        // Links
        if (pattoLinks) {
            pattoLinks.innerHTML = '';
            
            if (keys.googlemaps && patto[keys.googlemaps] && patto[keys.googlemaps].trim()) {
                const link = document.createElement('a');
                link.href = patto[keys.googlemaps].trim();
                link.target = '_blank';
                link.rel = 'noopener';
                link.className = 'inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors';
                link.innerHTML = `
                    <i data-lucide="map" class="h-4 w-4"></i>
                    <span>Google Maps</span>
                    <i data-lucide="external-link" class="h-3 w-3"></i>
                `;
                pattoLinks.appendChild(link);
            }
            
            if (keys.geouri && patto[keys.geouri] && patto[keys.geouri].trim()) {
                const link = document.createElement('a');
                link.href = patto[keys.geouri].trim();
                link.className = 'inline-flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors';
                link.innerHTML = `
                    <i data-lucide="map-pin" class="h-4 w-4"></i>
                    <span>Geo URI</span>
                    <i data-lucide="external-link" class="h-3 w-3"></i>
                `;
                pattoLinks.appendChild(link);
            }
        }
        
        // Foto
        if (photoContainer && pattoPhoto) {
            if (keys.foto && patto[keys.foto] && patto[keys.foto].trim()) {
                photoContainer.classList.remove('hidden');
                pattoPhoto.src = patto[keys.foto].trim();
                pattoPhoto.alt = patto[keys.titolo] || 'Foto patto';
                
                pattoPhoto.onerror = function() {
                    console.error('❌ Errore caricamento immagine');
                    photoContainer.classList.add('hidden');
                };
            } else {
                photoContainer.classList.add('hidden');
            }
        }
        
        // Apri modal
        modal.classList.remove('hidden');
        modal.classList.add('show', 'flex');
        
        // Mini mappa con gestione errori robusta
        setTimeout(() => {
            initializeMiniMapRobust(patto, keys);
        }, 300);
        
        // Centra mappa principale
        if (window.map && patto.lat && patto.lng && !isNaN(patto.lat) && !isNaN(patto.lng)) {
            window.map.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 16, {
                animate: true,
                duration: 1
            });
        }
        
        // Ricrea icone
        if (window.lucide && window.lucide.createIcons) {
            setTimeout(() => window.lucide.createIcons(), 100);
        }
        
        console.log('✅ Modal dettagli aperto');
    }
    
    // ==========================================
    // FIX 4: MINI MAPPA - Inizializzazione robusta
    // ==========================================
    
    function initializeMiniMapRobust(patto, keys) {
        console.log('🗺️ Inizializzazione mini mappa robusta');
        
        const miniMapElement = document.getElementById('miniMap');
        
        if (!miniMapElement) {
            console.error('❌ Elemento mini mappa non trovato');
            return;
        }
        
        // Verifica coordinate
        if (!patto.lat || !patto.lng || isNaN(patto.lat) || isNaN(patto.lng)) {
            console.warn('⚠️ Coordinate non valide');
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: #f3f4f6; color: #6b7280; font-size: 0.875rem; border-radius: 0.5rem;">
                    📍 Coordinate non disponibili
                </div>
            `;
            return;
        }
        
        // Verifica Leaflet
        if (typeof L === 'undefined') {
            console.error('❌ Libreria Leaflet non caricata');
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: #f3f4f6; color: #6b7280; font-size: 0.875rem; border-radius: 0.5rem;">
                    🗺️ Libreria mappa non disponibile
                </div>
            `;
            return;
        }
        
        // Pulisci mappa esistente
        if (window.miniMap) {
            try {
                window.miniMap.remove();
                console.log('🗑️ Mini mappa precedente rimossa');
            } catch (e) {
                console.warn('⚠️ Errore rimozione mappa:', e);
            }
            window.miniMap = null;
        }
        
        // Prepara container
        miniMapElement.innerHTML = '';
        miniMapElement.style.height = '400px';
        miniMapElement.style.width = '100%';
        miniMapElement.style.position = 'relative';
        
        try {
            // Crea mappa
            window.miniMap = L.map(miniMapElement, {
                center: [parseFloat(patto.lat), parseFloat(patto.lng)],
                zoom: 17,
                zoomControl: true,
                scrollWheelZoom: true,
                dragging: true,
                touchZoom: true
            });
            
            // Aggiungi tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(window.miniMap);
            
            // Colore marker
            const statusColors = {
                'Istruttoria in corso': '#ffdb4d',
                'Respinta': '#ff6b6b',
                'Patto stipulato': '#8fd67d',
                'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
                'In attesa di integrazione': '#b3e6ff'
            };
            const currentStatus = patto[keys.stato] || 'Non specificato';
            const markerColor = statusColors[currentStatus] || '#6b7280';
            
            // Aggiungi marker
            const marker = L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
                radius: 12,
                fillColor: markerColor,
                color: 'white',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(window.miniMap);
            
            // Popup
            const popupContent = `
                <div style="text-align: center; font-size: 0.875rem; min-width: 150px;">
                    <strong style="display: block; margin-bottom: 0.5rem;">${patto[keys.titolo] || 'Patto'}</strong>
                    <span style="color: ${markerColor}; font-weight: 500;">${currentStatus}</span>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Rinfresca mappa con sequenza di delay
            [100, 300, 500].forEach(delay => {
                setTimeout(() => {
                    if (window.miniMap) {
                        window.miniMap.invalidateSize(true);
                    }
                }, delay);
            });
            
            console.log('✅ Mini mappa inizializzata');
            
        } catch (error) {
            console.error('❌ Errore critico mini mappa:', error);
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: #fee; color: #c00; font-size: 0.875rem; border-radius: 0.5rem; border: 1px solid #fcc;">
                    ⚠️ Errore caricamento mappa: ${error.message}
                </div>
            `;
        }
    }
    
    // ==========================================
    // ESPORTAZIONE FUNZIONI GLOBALI
    // ==========================================
    
    window.updateTableUnified = updateTableUnified;
    window.showPattoDetailsFixed = showPattoDetailsFixed;
    window.initializeMiniMapRobust = initializeMiniMapRobust;
    
    // Sostituisci le funzioni esistenti
    window.updateTable = updateTableUnified;
    window.showPattoDetails = showPattoDetailsFixed;
    
    // ==========================================
    // APPLICAZIONE FIX AUTOMATICA
    // ==========================================
    
    function applyAllFixes() {
        console.log('🔧 Applicazione automatica di tutti i fix...');
        
        // Attendi che il DOM sia completamente caricato
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyAllFixes);
            return;
        }
        
        // Attendi che i dati siano caricati
        const checkDataInterval = setInterval(() => {
            if (window.allData && window.allData.length > 0) {
                clearInterval(checkDataInterval);
                
                // Applica i fix
                setTimeout(() => {
                    setupTableButtonFixed();
                    console.log('✅ Tutti i fix applicati con successo');
                }, 1000);
            }
        }, 100);
        
        // Timeout di sicurezza
        setTimeout(() => {
            clearInterval(checkDataInterval);
            if (!window.allData || window.allData.length === 0) {
                console.warn('⚠️ Dati non ancora disponibili dopo 10 secondi');
            }
        }, 10000);
    }
    
    // Avvia l'applicazione dei fix
    applyAllFixes();
    
    console.log('✅ Fix conflicts caricato');
    
})();
