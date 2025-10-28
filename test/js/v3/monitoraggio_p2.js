// Enhanced functionality - Parte 2
// Questo file contiene funzionalità aggiuntive e la gestione avanzata delle modali

document.addEventListener('DOMContentLoaded', function() {
    console.log('Monitoraggio P2 initialized');
    
    // Enhanced modal handling
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show', 'flex');
                modal.classList.add('hidden');
                
                // Clean up mini map if exists - IMPROVED CLEANUP
                if (modal.id === 'pattoModal' && window.miniMap) {
                    try {
                        window.miniMap.off();
                        window.miniMap._container = null;
                        window.miniMap.remove();
                    } catch (e) {
                        console.log('Error during map cleanup:', e);
                    }
                    window.miniMap = null;
                    
                    // Also clear the wrapper to ensure complete cleanup
                    const miniMapWrapper = document.getElementById('miniMapWrapper');
                    if (miniMapWrapper) {
                        miniMapWrapper.innerHTML = '<div id="miniMap"></div>';
                    }
                }
            });
        }
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeBtn?.click();
            }
        });
        
        // Close on escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeBtn?.click();
            }
        });
    });

    // Create icons - Make sure this runs after everything is loaded
    setTimeout(() => {
        if (window.lucide) {
            window.lucide.createIcons();
            console.log('Icons created by P2');
        }
    }, 500);

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

    // Ensure showPattoDetails is available globally and enhanced
    setTimeout(() => {
        if (typeof window.showPattoDetails === 'function') {
            console.log('showPattoDetails function is available');
        } else {
            console.error('showPattoDetails function not available');
            // Fallback implementation
            window.showPattoDetails = showPattoDetailsEnhanced;
        }
    }, 1000);
});

// Enhanced showPattoDetails function - SIMPLIFIED AND ROBUST
function showPattoDetailsEnhanced(pattoId) {
    console.log('showPattoDetailsEnhanced called with ID:', pattoId);
    
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
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'btn btn-primary';
            link.style.textDecoration = 'none';
            link.innerHTML = `
                <i data-lucide="navigation" style="width: 1rem; height: 1rem;"></i>
                <span>Navigatore</span>
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
            
            photoElement.onerror = function() {
                console.error('Error loading image:', patto[keys.foto]);
                photoContainer.classList.add('hidden');
            };
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
        initializeMiniMapEnhanced(patto, keys);
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
}

// Enhanced function for mini map initialization
function initializeMiniMapEnhanced(patto, keys) {
    console.log('=== ENHANCED MINI MAP INITIALIZATION START ===');
    
    // First, completely clean up any existing map
    if (window.miniMap) {
        try {
            console.log('Removing existing mini map...');
            window.miniMap.off();
            window.miniMap._container = null;
            window.miniMap.remove();
            window.miniMap = null;
        } catch (e) {
            console.log('Error removing old map:', e);
            window.miniMap = null;
        }
    }
    
    // Reset the wrapper HTML completely
    const miniMapWrapper = document.getElementById('miniMapWrapper');
    if (miniMapWrapper) {
        miniMapWrapper.innerHTML = '<div id="miniMap"></div>';
    }
    
    const miniMapElement = document.getElementById('miniMap');
    if (!miniMapElement) {
        console.error('Mini map element not found');
        return;
    }
    
    console.log('Mini map element found:', miniMapElement);
    console.log('Element dimensions:', miniMapElement.offsetWidth, 'x', miniMapElement.offsetHeight);
    console.log('Element is visible:', miniMapElement.offsetParent !== null);
    
    // Set styles for the container
    miniMapElement.style.height = '400px';
    miniMapElement.style.width = '100%';
    miniMapElement.style.position = 'relative';
    miniMapElement.style.zIndex = '1';
    miniMapElement.style.display = 'block';
    
    // Check coordinates
    if (!patto.lat || !patto.lng || isNaN(patto.lat) || isNaN(patto.lng)) {
        console.error('Invalid coordinates:', patto.lat, patto.lng);
        miniMapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                 background: var(--color-gray-100); color: var(--color-gray-500); 
                 font-size: 0.875rem; border-radius: var(--border-radius);">
                🔍 Coordinate non disponibili
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
    
    console.log('Leaflet available, creating enhanced map...');
    
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
        
        console.log('Enhanced map object created successfully');
        
        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
        });
        
        tileLayer.addTo(window.miniMap);
        console.log('Tile layer added to enhanced map');
        
        // Get status color
        const statusColorMap = {
            'Istruttoria in corso': '#ffdb4d',
            'Respinta': '#ff6b6b',
            'Patto stipulato': '#8fd67d',
            'Proroga e/o Monitoraggio e valutazione dei risultati': '#9b59b6',
            'In attesa di integrazione': '#b3e6ff'
        };
        
        const currentStatus = patto[keys.stato] || 'Non specificato';
        const markerColor = statusColorMap[currentStatus] || '#6b7280';
        console.log('Using enhanced marker color:', markerColor, 'for status:', currentStatus);
        
        // Create and add enhanced marker
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
        console.log('Enhanced marker added to map');
        
        // Add popup with info
        const popupContent = `
            <div style="text-align: center; font-size: 0.875rem; min-width: 150px;">
                <strong style="display: block; margin-bottom: 0.5rem;">${patto[keys.titolo] || 'Patto'}</strong>
                <span style="color: ${markerColor}; font-weight: 500;">${currentStatus}</span>
            </div>
        `;
        marker.bindPopup(popupContent);
        
        // Enhanced map refresh sequence with better handling
        const refreshSequence = [100, 300, 500, 1000];
        refreshSequence.forEach((delay, index) => {
            setTimeout(() => {
                if (window.miniMap && window.miniMap._container) {
                    console.log(`Enhanced map refresh ${index + 1}...`);
                    try {
                        window.miniMap.invalidateSize(true);
                        // Force a redraw
                        window.miniMap.setView([parseFloat(patto.lat), parseFloat(patto.lng)], 17);
                        console.log(`Enhanced map refresh ${index + 1} completed`);
                    } catch (e) {
                        console.error(`Error during enhanced refresh ${index + 1}:`, e);
                    }
                }
            }, delay);
        });
        
        console.log('=== ENHANCED MINI MAP INITIALIZATION COMPLETE ===');
        
    } catch (error) {
        console.error('Critical error creating enhanced mini map:', error);
        miniMapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                 background: var(--color-red-50); color: var(--color-red-600); 
                 font-size: 0.875rem; border-radius: var(--border-radius); border: 1px solid var(--color-red-200);">
                ⌫ Errore nel caricamento della mappa: ${error.message}
            </div>
        `;
    }
}

// Global exports for enhanced functionality
window.showPattoDetailsEnhanced = showPattoDetailsEnhanced;
window.initializeMiniMapEnhanced = initializeMiniMapEnhanced;