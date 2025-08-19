        // Enhanced functionality
        document.addEventListener('DOMContentLoaded', function() {
            const mobileToggle = document.getElementById('mobileFiltersToggle');
            const filtersContent = document.getElementById('filtersContent');
            
            if (mobileToggle && filtersContent) {
                mobileToggle.addEventListener('click', function() {
                    const isOpen = filtersContent.classList.contains('open');
                    
                    if (isOpen) {
                        filtersContent.classList.remove('open');
                        mobileToggle.setAttribute('aria-expanded', 'false');
                    } else {
                        filtersContent.classList.add('open');
                        mobileToggle.setAttribute('aria-expanded', 'true');
                    }
                });
                
                // Close on outside click
                document.addEventListener('click', function(e) {
                    if (!mobileToggle.contains(e.target) && !filtersContent.contains(e.target)) {
                        filtersContent.classList.remove('open');
                        mobileToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            // Enhanced modal handling
            const modals = document.querySelectorAll('.modal');
            
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.modal-close');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        modal.classList.remove('show', 'flex');
                        modal.classList.add('hidden');
                        
                        // Clean up mini map if exists
                        if (modal.id === 'pattoModal' && window.miniMap) {
                            window.miniMap.remove();
                            window.miniMap = null;
                        }
                    });
                }
                
                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeBtn.click();
                    }
                });
                
                // Close on escape key
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeBtn.click();
                    }
                });
            });

            // Enhanced button handlers
            document.getElementById('infoBtn')?.addEventListener('click', () => {
                const modal = document.getElementById('infoModal');
                modal.classList.remove('hidden');
                modal.classList.add('show', 'flex');
            });

            document.getElementById('showTableBtn')?.addEventListener('click', () => {
                const modal = document.getElementById('tableModal');
                modal.classList.remove('hidden');
                modal.classList.add('show', 'flex');
            });

            // Create icons
            if (window.lucide) {
                window.lucide.createIcons();
            }

            // Debug function to test modal
            window.testModal = function() {
                console.log('Testing modal...');
                const modal = document.getElementById('pattoModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('show', 'flex');
                    console.log('Modal should be visible');
                } else {
                    console.error('Modal not found');
                }
            };

            // Ensure showPattoDetails is available globally
            setTimeout(() => {
                if (typeof window.showPattoDetails === 'function') {
                    console.log('showPattoDetails function is available');
                } else {
                    console.error('showPattoDetails function not available');
                }
            }, 1000);
        });

        // Enhanced showPattoDetails function - SIMPLIFIED AND ROBUST
        window.showPattoDetails = function(pattoId) {
            console.log('showPattoDetails called with ID:', pattoId);
            
            // Ensure we have the data
            if (!window.allData || window.allData.length === 0) {
                console.error('No data available');
                // Try to access data from global scope
                if (typeof allData !== 'undefined' && allData.length > 0) {
                    window.allData = allData;
                } else {
                    console.error('Cannot find data');
                    return;
                }
            }

            const modal = document.getElementById('pattoModal');
            if (!modal) {
                console.error('Modal not found');
                return;
            }
            
            // Find the patto by ID
            const idKey = Object.keys(window.allData[0] || {}).find(k => k.toLowerCase() === 'id');
            const patto = window.allData.find(p => p[idKey] == pattoId); // Use == for loose comparison
            
            if (!patto) {
                console.error('Patto not found:', pattoId);
                console.log('Available IDs:', window.allData.map(p => p[idKey]));
                return;
            }
            
            console.log('Found patto:', patto);
            
            // Get all the keys we need
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
            
            console.log('Keys found:', keys);
            
            // Set modal title
            const titleElement = document.getElementById('modalTitle');
            if (titleElement) {
                titleElement.textContent = patto[keys.titolo] || 'Patto senza titolo';
            }
            
            // Set details
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
            
            // Set status
            const status = document.getElementById('pattoStatus');
            if (status) {
                const statoText = patto[keys.stato] || 'Non specificato';
                status.textContent = statoText;
                
                // Status color mapping
                const statusColors = {
                    'Istruttoria in corso': 'status-istruttoria',
                    'Respinta': 'status-respinto', 
                    'Patto stipulato': 'status-stipulato',
                    'Proroga e/o Monitoraggio e valutazione dei risultati': 'status-monitoraggio',
                    'In attesa di integrazione': 'status-integrazione'
                };
                
                status.className = `status-badge ${statusColors[statoText] || ''}`;
            }
            
            // Handle notes
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
            
            // Handle links
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
            
            // Handle photo
            const photoContainer = document.getElementById('photoContainer');
            const photoElement = document.getElementById('pattoPhoto');
            if (photoContainer && photoElement) {
                if (keys.foto && patto[keys.foto] && patto[keys.foto].trim()) {
                    photoContainer.classList.remove('hidden');
                    photoElement.src = patto[keys.foto].trim();
                    photoElement.alt = patto[keys.titolo] || 'Foto patto';
                } else {
                    photoContainer.classList.add('hidden');
                }
            }
            
            // Show modal - Use both systems for compatibility
            console.log('Showing modal...');
            modal.classList.remove('hidden');
            modal.classList.add('show', 'flex');
            
            // Setup mini map AFTER modal is visible
            setTimeout(() => {
                initializeMiniMap(patto, keys);
            }, 500);
            
            // Center main map on the patto
            if (window.map && patto.lat && patto.lng) {
                window.map.setView([patto.lat, patto.lng], 16);
            }
            
            // Create icons for new elements
            setTimeout(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }, 100);
            
            console.log('Modal should be visible now');
        };

        // Separate function for mini map initialization
        function initializeMiniMap(patto, keys) {
            console.log('=== MINI MAP INITIALIZATION START ===');
            
            const miniMapElement = document.getElementById('miniMap');
            if (!miniMapElement) {
                console.error('Mini map element not found');
                return;
            }
            
            console.log('Mini map element found:', miniMapElement);
            console.log('Element dimensions:', miniMapElement.offsetWidth, 'x', miniMapElement.offsetHeight);
            console.log('Element is visible:', miniMapElement.offsetParent !== null);
            
            // Clean up existing map
            if (window.miniMap) {
                try {
                    console.log('Removing existing mini map...');
                    window.miniMap.remove();
                } catch (e) {
                    console.log('Error removing old map:', e);
                }
                window.miniMap = null;
            }
            
            // Clear the container completely
            miniMapElement.innerHTML = '';
            miniMapElement.style.height = '400px';
            miniMapElement.style.width = '100%';
            miniMapElement.style.position = 'relative';
            miniMapElement.style.zIndex = '1';
            
            // Check coordinates
            if (!patto.lat || !patto.lng || isNaN(patto.lat) || isNaN(patto.lng)) {
                console.error('Invalid coordinates:', patto.lat, patto.lng);
                miniMapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                         background: var(--color-gray-100); color: var(--color-gray-500); 
                         font-size: 0.875rem; border-radius: var(--border-radius);">
                        📍 Coordinate non disponibili
                    </div>
                `;
                return;
            }
            
            console.log('Valid coordinates found:', patto.lat, patto.lng);
            
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.error('Leaflet library not loaded');
                miniMapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                         background: var(--color-gray-100); color: var(--color-gray-500); 
                         font-size: 0.875rem; border-radius: var(--border-radius);">
                        🗺️ Libreria mappa non disponibile
                    </div>
                `;
                return;
            }
            
            console.log('Leaflet available, creating map...');
            
            try {
                // Create the map with explicit options
                window.miniMap = L.map(miniMapElement, {
                    center: [parseFloat(patto.lat), parseFloat(patto.lng)],
                    zoom: 17,
                    zoomControl: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    dragging: true,
                    touchZoom: true,
                    boxZoom: false,
                    keyboard: false,
                    attributionControl: true
                });
                
                console.log('Map object created successfully');
                
                // Add tile layer
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                    subdomains: ['a', 'b', 'c']
                });
                
                tileLayer.addTo(window.miniMap);
                console.log('Tile layer added');
                
                // Get status color
                const statusColorMap = {
                    'Istruttoria in corso': '#f59e0b',
                    'Respinta': '#ef4444',
                    'Patto stipulato': '#10b981',
                    'Proroga e/o Monitoraggio e valutazione dei risultati': '#8b5cf6',
                    'In attesa di integrazione': '#f97316'
                };
                
                const currentStatus = patto[keys.stato] || 'Non specificato';
                const markerColor = statusColorMap[currentStatus] || '#6b7280';
                console.log('Using marker color:', markerColor, 'for status:', currentStatus);
                
                // Create and add marker
                const marker = L.circleMarker([parseFloat(patto.lat), parseFloat(patto.lng)], {
                    radius: 12,
                    fillColor: markerColor,
                    color: 'white',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8,
                    stroke: true
                });
                
                marker.addTo(window.miniMap);
                console.log('Marker added to map');
                
                // Add popup with info
                const popupContent = `
                    <div style="text-align: center; font-size: 0.875rem; min-width: 150px;">
                        <strong style="display: block; margin-bottom: 0.5rem;">${patto[keys.titolo] || 'Patto'}</strong>
                        <span style="color: ${markerColor}; font-weight: 500;">${currentStatus}</span>
                    </div>
                `;
                marker.bindPopup(popupContent);
                
                // Force map to render correctly
                setTimeout(() => {
                    if (window.miniMap) {
                        console.log('Invalidating map size...');
                        try {
                            window.miniMap.invalidateSize();
                            // Force a redraw
                            window.miniMap.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 17);
                            console.log('Map invalidated and recentered');
                        } catch (e) {
                            console.error('Error during invalidateSize:', e);
                        }
                    }
                }, 100);
                
                // Additional forced refresh
                setTimeout(() => {
                    if (window.miniMap) {
                        window.miniMap.invalidateSize(true);
                        console.log('Final map refresh completed');
                    }
                }, 500);
                
                console.log('=== MINI MAP INITIALIZATION COMPLETE ===');
                
            } catch (error) {
                console.error('Critical error creating mini map:', error);
                miniMapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                         background: var(--color-red-50); color: var(--color-red-600); 
                         font-size: 0.875rem; border-radius: var(--border-radius); border: 1px solid var(--color-red-200);">
                        ❌ Errore nel caricamento della mappa: ${error.message}
                    </div>
                `;
            }
        }
        };