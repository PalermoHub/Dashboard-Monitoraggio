// ==========================================
// MONITORAGGIO P2 - SOLO MODALI ENHANCED
// ==========================================
// RESPONSABILITÀ: Gestione avanzata delle modali e mini mappa
// SI INTEGRA con showPattoDetails esistente

(function() {
    'use strict';
    
    console.log('📋 Monitoraggio P2 - Inizializzazione enhanced modals...');
    
    // ==========================================
    // ENHANCED PATTO DETAILS
    // ==========================================
    
    /**
     * Versione enhanced di showPattoDetails con mini mappa migliorata
     * NON sovrascrive - viene usata come upgrade
     */
    function showPattoDetailsEnhanced(pattoId) {
        console.log('📋 Enhanced: Mostrando dettagli patto:', pattoId);
        
        if (!window.allData || window.allData.length === 0) {
            console.error('Dati non disponibili');
            return;
        }
        
        const idKey = Object.keys(window.allData[0]).find(k => k.toLowerCase() === 'id');
        const patto = window.allData.find(p => p[idKey] == pattoId);
        
        if (!patto) {
            console.error('Patto non trovato:', pattoId);
            return;
        }
        
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
        
        // Popola modal
        populateModalContent(patto, keys);
        
        // Mostra modal
        const modal = document.getElementById('pattoModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show', 'flex');
        }
        
        // Setup mini mappa DOPO che il modal è visibile
        setTimeout(() => {
            initializeMiniMapEnhanced(patto, keys);
        }, 500);
        
        // Centra mappa principale
        if (window.map && patto.lat && patto.lng) {
            window.map.setView([patto.lat, patto.lng], 16);
        }
        
        // Ricrea icone
        if (window.lucide && window.lucide.createIcons) {
            setTimeout(() => window.lucide.createIcons(), 100);
        }
    }
    
    /**
     * Popola il contenuto del modal
     */
    function populateModalContent(patto, keys) {
        // Titolo
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = patto[keys.titolo] || 'Patto senza titolo';
        }
        
        // Dettagli
        const details = document.getElementById('pattoDetails');
        if (details) {
            details.innerHTML = `
                <p><strong>Proponente:</strong> ${patto[keys.proponente] || 'N/A'}</p>
                <p><strong>Rappresentante:</strong> ${patto[keys.rappresentante] || 'N/A'}</p>
                <p><strong>UPL:</strong> ${patto[keys.upl] || 'N/A'}</p>
                <p><strong>Quartiere:</strong> ${patto[keys.quartiere] || 'N/A'}</p>
                <p><strong>Circoscrizione:</strong> ${patto[keys.circoscrizione] || 'N/A'}</p>
                <p><strong>Indirizzo:</strong> ${patto[keys.indirizzo] || 'N/A'}</p>
            `;
        }
        
        // Stato
        const status = document.getElementById('pattoStatus');
        if (status) {
            const statoText = patto[keys.stato] || 'Non specificato';
            status.textContent = statoText;
            
            const statusColors = {
                'Istruttoria in corso': '#ffdb4d',
                'Respinta': '#ff6b6b',
                'Patto stipulato': '#8fd67d',
                'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
                'In attesa di integrazione': '#b3e6ff'
            };
            
            const statusColor = statusColors[statoText] || '#6b7280';
            status.style.backgroundColor = statusColor;
            status.style.color = 'white';
            status.style.padding = '4px 12px';
            status.style.borderRadius = '6px';
            status.style.fontSize = '0.875rem';
            status.style.fontWeight = '600';
            status.style.display = 'inline-block';
        }
        
        // Note
        const notesContainer = document.getElementById('pattoNotesContainer');
        const notesElement = document.getElementById('pattoNotes');
        if (notesContainer && notesElement) {
            if (keys.note && patto[keys.note] && patto[keys.note].trim()) {
                notesContainer.classList.remove('hidden');
                notesElement.textContent = patto[keys.note];
            } else {
                notesContainer.classList.add('hidden');
            }
        }
        
        // Links
        const links = document.getElementById('pattoLinks');
        if (links) {
            links.innerHTML = '';
            
            if (keys.googlemaps && patto[keys.googlemaps] && patto[keys.googlemaps].trim()) {
                const link = document.createElement('a');
                link.href = patto[keys.googlemaps].trim();
                link.target = '_blank';
                link.rel = 'noopener';
                link.className = 'btn btn-primary';
                link.style.textDecoration = 'none';
                link.innerHTML = `
                    <i data-lucide="map" style="width: 1rem; height: 1rem;"></i>
                    <span>Google Maps</span>
                `;
                links.appendChild(link);
            }
            
            if (keys.geouri && patto[keys.geouri] && patto[keys.geouri].trim()) {
                const link = document.createElement('a');
                link.href = patto[keys.geouri].trim();
                link.className = 'btn btn-secondary';
                link.style.textDecoration = 'none';
                link.innerHTML = `
                    <i data-lucide="map-pin" style="width: 1rem; height: 1rem;"></i>
                    <span>Geo URI</span>
                `;
                links.appendChild(link);
            }
        }
        
        // Foto
        const photoContainer = document.getElementById('photoContainer');
        const photoElement = document.getElementById('pattoPhoto');
        if (photoContainer && photoElement) {
            if (keys.foto && patto[keys.foto] && patto[keys.foto].trim()) {
                photoContainer.classList.remove('hidden');
                photoElement.src = patto[keys.foto].trim();
                photoElement.alt = patto[keys.titolo] || 'Foto patto';
                
                photoElement.onerror = function() {
                    console.error('Errore caricamento immagine:', patto[keys.foto]);
                    photoContainer.classList.add('hidden');
                };
            } else {
                photoContainer.classList.add('hidden');
            }
        }
    }
    
    // ==========================================
    // MINI MAPPA ENHANCED
    // ==========================================
    
    /**
     * Inizializza mini mappa con gestione avanzata errori
     */
    function initializeMiniMapEnhanced(patto, keys) {
        console.log('🗺️ Enhanced: Inizializzazione mini mappa...');
        
        const miniMapElement = document.getElementById('miniMap');
        if (!miniMapElement) {
            console.error('Elemento mini map non trovato');
            return;
        }
        
        // Verifica visibilità
        if (miniMapElement.offsetParent === null) {
            console.warn('Mini map non visibile, riprovo...');
            setTimeout(() => initializeMiniMapEnhanced(patto, keys), 500);
            return;
        }
        
        // Clean up mappa esistente
        if (window.miniMap) {
            try {
                window.miniMap.remove();
            } catch (e) {
                console.log('Errore rimozione mini map:', e);
            }
            window.miniMap = null;
        }
        
        // Clear container
        miniMapElement.innerHTML = '';
        miniMapElement.style.height = '400px';
        miniMapElement.style.width = '100%';
        miniMapElement.style.position = 'relative';
        
        // Verifica coordinate
        if (!patto.lat || !patto.lng || isNaN(patto.lat) || isNaN(patto.lng)) {
            console.error('Coordinate non valide:', patto.lat, patto.lng);
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: var(--color-gray-100); color: var(--color-gray-500); 
                     font-size: 0.875rem; border-radius: var(--border-radius);">
                    📍 Coordinate non disponibili
                </div>
            `;
            return;
        }
        
        // Verifica Leaflet
        if (typeof L === 'undefined') {
            console.error('Leaflet non disponibile');
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: var(--color-gray-100); color: var(--color-gray-500);">
                    🗺️ Libreria mappa non disponibile
                </div>
            `;
            return;
        }
        
        try {
            // Crea mini mappa
            window.miniMap = L.map(miniMapElement, {
                center: [parseFloat(patto.lat), parseFloat(patto.lng)],
                zoom: 17,
                zoomControl: true,
                scrollWheelZoom: true,
                dragging: true
            });
            
            // Tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19
            }).addTo(window.miniMap);
            
            // Marker
            const statusColorMap = {
                'Istruttoria in corso': '#ffdb4d',
                'Respinta': '#ff6b6b',
                'Patto stipulato': '#8fd67d',
                'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
                'In attesa di integrazione': '#b3e6ff'
            };
            
            const currentStatus = patto[keys.stato] || 'Non specificato';
            const markerColor = statusColorMap[currentStatus] || '#6b7280';
            
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
                <div style="text-align: center; font-size: 0.875rem;">
                    <strong>${patto[keys.titolo] || 'Patto'}</strong><br>
                    <span style="color: ${markerColor};">${currentStatus}</span>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            // Refresh sequenza
            [100, 300, 500, 1000].forEach((delay, index) => {
                setTimeout(() => {
                    if (window.miniMap) {
                        try {
                            window.miniMap.invalidateSize(true);
                            window.miniMap.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 17);
                        } catch (e) {
                            console.error(`Errore refresh ${index + 1}:`, e);
                        }
                    }
                }, delay);
            });
            
            console.log('✅ Mini mappa enhanced inizializzata');
            
        } catch (error) {
            console.error('❌ Errore critico mini mappa:', error);
            miniMapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                     background: var(--color-red-50); color: var(--color-red-600);">
                    ⚠️ Errore: ${error.message}
                </div>
            `;
        }
    }
    
    // ==========================================
    // GESTIONE MODALI GENERICHE
    // ==========================================
    
    function setupModalsEnhanced() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show', 'flex');
                    modal.classList.add('hidden');
                    
                    // Clean up mini map
                    if (modal.id === 'pattoModal' && window.miniMap) {
                        window.miniMap.remove();
                        window.miniMap = null;
                    }
                });
            }
            
            // Chiudi su backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeBtn?.click();
                }
            });
            
            // Chiudi su ESC
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeBtn?.click();
                }
            });
        });
        
        console.log('✅ Modali enhanced configurate');
    }
    
    // ==========================================
    // EXPORT & INIZIALIZZAZIONE
    // ==========================================
    
    // Export funzione enhanced
    window.showPattoDetailsEnhanced = showPattoDetailsEnhanced;
    window.initializeMiniMapEnhanced = initializeMiniMapEnhanced;
    
    function initializeP2() {
        console.log('📋 Inizializzazione P2...');
        
        setupModalsEnhanced();
        
        // Ricrea icone
        if (window.lucide && window.lucide.createIcons) {
            setTimeout(() => {
                window.lucide.createIcons();
            }, 500);
        }
        
        console.log('✅ P2 Enhanced inizializzato');
    }
    
    // Auto-inizializzazione
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeP2, 1000);
        });
    } else {
        setTimeout(initializeP2, 1000);
    }
    
    console.log('✅ Monitoraggio P2 Enhanced caricato');
    
})();