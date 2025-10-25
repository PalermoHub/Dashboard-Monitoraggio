// ==========================================
// CORREZIONI PER CONTROLLI MAPPA
// ==========================================

// *** CORREZIONE 1: FUNZIONE centerMapOnPalermo MIGLIORATA ***
function centerMapOnPalermo() {
    console.log('🎯 Centrando mappa su Palermo...');
    
    // Verifica che la mappa sia inizializzata
    if (!map) {
        console.error('❌ Mappa non inizializzata');
        showNotification('Errore: mappa non disponibile', 'error');
        return;
    }
    
    try {
        // Centra la mappa con animazione
        map.setView(PALERMO_CENTER, 13, {
            animate: true,
            duration: 1.5
        });
        
        console.log('✅ Mappa centrata su:', PALERMO_CENTER);
        showNotification('Mappa centrata sul Centro Storico', 'info');
        
        // Opzionale: evidenzia brevemente il centro
        highlightPalermoCenter();
        
    } catch (error) {
        console.error('❌ Errore nel centrare la mappa:', error);
        showNotification('Errore nel centrare la mappa', 'error');
    }
}

// Funzione per evidenziare brevemente il centro di Palermo
function highlightPalermoCenter() {
    // Crea un cerchio temporaneo per evidenziare il centro
    const highlightCircle = L.circle(PALERMO_CENTER, {
        radius: 500,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(map);
    
    // Rimuovi dopo 2 secondi
    setTimeout(() => {
        map.removeLayer(highlightCircle);
    }, 2000);
}

// *** CORREZIONE 2: FUNZIONE switchMapLayer COMPLETAMENTE RISCRITTA ***
function switchMapLayer(layerType) {
    console.log(`🗺️  Cambiando layer mappa a: ${layerType}`);
    
    // Verifica che la mappa sia inizializzata
    if (!map) {
        console.error('❌ Mappa non inizializzata per cambio layer');
        showNotification('Errore: mappa non disponibile', 'error');
        return;
    }
    
    try {
        // Salva il layer type corrente
        currentMapLayer = layerType;
        
        // Aggiorna UI dei pulsanti
        updateLayerButtons(layerType);
        
        // Rimuovi tutti i layer di tile esistenti
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                console.log('Rimozione layer:', layer);
                map.removeLayer(layer);
            }
        });
        
        // Aggiungi il nuovo layer
        let newTileLayer;
        
        if (layerType === 'satellite') {
            // Layer satellitare Google
            newTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Satellite - Rielaborazione dataset di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
                maxZoom: 18,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            });
        } else {
            // Layer standard CartoDB
            newTileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
                maxZoom: 18
            });
        }
        
        // Aggiungi il nuovo layer alla mappa
        newTileLayer.addTo(map);
        
        console.log(`✅ Layer ${layerType} applicato con successo`);
        showNotification(`Mappa ${layerType === 'satellite' ? 'satellitare' : 'standard'} attivata`, 'info');
        
    } catch (error) {
        console.error('❌ Errore nel cambio layer:', error);
        showNotification('Errore nel cambio mappa', 'error');
        
        // Fallback al layer standard
        if (layerType !== 'standard') {
            console.log('Fallback a layer standard...');
            switchMapLayer('standard');
        }
    }
}

// *** CORREZIONE 3: AGGIORNAMENTO UI PULSANTI LAYER ***
function updateLayerButtons(activeLayer) {
    console.log(`🔄 Aggiornando UI pulsanti per layer: ${activeLayer}`);
    
    const standardBtn = document.getElementById('mapStandard');
    const satelliteBtn = document.getElementById('mapSatellite');
    
    if (!standardBtn || !satelliteBtn) {
        console.warn('⚠️ Pulsanti layer non trovati nel DOM');
        return;
    }
    
    // Classi CSS per stati attivo e inattivo
    const activeClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-blue-600 text-white font-semibold';
    const inactiveClasses = 'w-full text-xs p-1.5 rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    // Aggiorna pulsante Standard
    if (activeLayer === 'standard') {
        standardBtn.className = activeClasses;
        satelliteBtn.className = inactiveClasses;
    } else {
        standardBtn.className = inactiveClasses;
        satelliteBtn.className = activeClasses;
    }
    
    console.log('✅ UI pulsanti aggiornata');
}

// *** CORREZIONE 4: SETUP CONTROLLI MAPPA CON CONTROLLI DI SICUREZZA ***
function setupMapControlsFixed() {
    console.log('🛠️ Configurando controlli mappa...');
    
    // Lista di controlli da configurare
    const mapControls = [
        {
            id: 'centerPalermo',
            event: 'click',
            handler: centerMapOnPalermo,
            description: 'Pulsante centra Palermo'
        },
        {
            id: 'layerToggle',
            event: 'click',
            handler: function(e) {
                e.stopPropagation();
                toggleLayerMenu();
            },
            description: 'Toggle menu layer'
        },
        {
            id: 'mapStandard',
            event: 'click',
            handler: function() {
                switchMapLayer('standard');
                hideLayerMenu();
            },
            description: 'Pulsante mappa standard'
        },
        {
            id: 'mapSatellite',
            event: 'click',
            handler: function() {
                switchMapLayer('satellite');
                hideLayerMenu();
            },
            description: 'Pulsante mappa satellitare'
        }
    ];
    
    let configuredControls = 0;
    
    // Configura ogni controllo con controlli di sicurezza
    mapControls.forEach(control => {
        const element = document.getElementById(control.id);
        
        if (element) {
            // Rimuovi eventuali listener esistenti clonando l'elemento
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Aggiungi il nuovo event listener
            newElement.addEventListener(control.event, control.handler);
            
            console.log(`✅ ${control.description} configurato`);
            configuredControls++;
        } else {
            console.warn(`⚠️ Elemento ${control.id} non trovato - ${control.description}`);
        }
    });
    
    // Setup chiusura menu cliccando fuori
    setupLayerMenuOutsideClick();
    
    console.log(`🛠️ Configurati ${configuredControls}/${mapControls.length} controlli mappa`);
    
    if (configuredControls === mapControls.length) {
        console.log('✅ Tutti i controlli mappa configurati con successo');
        showNotification('Controlli mappa attivati', 'success');
    } else {
        console.warn('⚠️ Alcuni controlli mappa non sono stati configurati');
    }
}

// *** CORREZIONE 5: GESTIONE MENU LAYER MIGLIORATA ***
function toggleLayerMenu() {
    const menu = document.getElementById('layerMenu');
    const toggle = document.getElementById('layerToggle');
    
    if (!menu) {
        console.error('❌ Menu layer non trovato');
        return;
    }
    
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
        showLayerMenu();
    } else {
        hideLayerMenu();
    }
    
    // Aggiorna attributi di accessibilità
    if (toggle) {
        toggle.setAttribute('aria-expanded', !isHidden);
    }
}

function showLayerMenu() {
    const menu = document.getElementById('layerMenu');
    if (menu) {
        menu.classList.remove('hidden');
        console.log('📋 Menu layer mostrato');
    }
}

function hideLayerMenu() {
    const menu = document.getElementById('layerMenu');
    if (menu) {
        menu.classList.add('hidden');
        console.log('📋 Menu layer nascosto');
    }
}

function setupLayerMenuOutsideClick() {
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('layerMenu');
        const toggle = document.getElementById('layerToggle');
        
        if (menu && toggle) {
            // Se il click non è sul menu o sul toggle, nascondi il menu
            if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                if (!menu.classList.contains('hidden')) {
                    hideLayerMenu();
                    toggle.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });
}

// *** CORREZIONE 6: VERIFICA STATO MAPPA ***
function verifyMapState() {
    console.log('🔍 Verifica stato mappa...');
    
    const checks = {
        mapExists: !!map,
        mapInitialized: !!(map && map.getContainer()),
        markersLayerExists: !!markersLayer,
        centerCorrect: map ? (
            Math.abs(map.getCenter().lat - PALERMO_CENTER[0]) < 0.1 &&
            Math.abs(map.getCenter().lng - PALERMO_CENTER[1]) < 0.1
        ) : false,
        boundsCorrect: map ? !!map.options.maxBounds : false
    };
    
    console.log('Stato mappa:', checks);
    
    let issuesFound = 0;
    Object.entries(checks).forEach(([check, passed]) => {
        if (!passed) {
            console.warn(`⚠️ Check fallito: ${check}`);
            issuesFound++;
        } else {
            console.log(`✅ Check OK: ${check}`);
        }
    });
    
    if (issuesFound === 0) {
        console.log('✅ Mappa completamente operativa');
        return true;
    } else {
        console.warn(`⚠️ ${issuesFound} problemi trovati nella mappa`);
        return false;
    }
}

// *** CORREZIONE 7: INIZIALIZZAZIONE MAPPA MIGLIORATA ***
function initializeMapFixed() {
    console.log('🗺️ Inizializzazione mappa migliorata...');
    
    try {
        // Rimuovi mappa esistente se presente
        if (map) {
            console.log('Rimozione mappa esistente...');
            map.remove();
        }
        
        // Crea nuova mappa con configurazione migliorata
        map = L.map('map', {
            maxBounds: PALERMO_BOUNDS,
            maxZoom: 18,
            minZoom: 11,
            zoomControl: true,
            preferCanvas: true,
            closePopupOnClick: true,
            doubleClickZoom: true,
            dragging: true,
            keyboard: true,
            scrollWheelZoom: true,
            touchZoom: true
        }).setView(PALERMO_CENTER, 12);
		
		window.map = map;  // ← AGGIUNGI QUESTA RIGA
        
        // Aggiungi layer di base standard
        const baseLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps" target="_blank">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY 3.0</a>. Data © <a href="http://osm.org/copyright" target="_blank">OpenStreetMap contributors</a> - Rielaborazione di <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - 2025',
            maxZoom: 18
        }).addTo(map);
        
        // Crea layer per i marker
        markersLayer = L.layerGroup().addTo(map);
        
        // Imposta i bounds di Palermo
        map.setMaxBounds(PALERMO_BOUNDS);
        
        // Aggiungi marker del centro di Palermo
        const centerMarker = L.marker(PALERMO_CENTER, {
            icon: L.divIcon({
                className: 'center-palermo-marker',
                html: '<div class="center-marker-icon">🏛️</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            interactive: true
        }).addTo(map);
        
        centerMarker
            .bindPopup('<b>Ufficio Rigenerazione Urbana</b><br>Ex Noviziato dei Crociferi<br><small>Click per centrare qui</small>')
            .bindTooltip('Ufficio Rigenerazione Urbana', {permanent: false, direction: 'top'});
        
        // Event listener per il marker centrale
        centerMarker.on('click', function() {
            centerMapOnPalermo();
        });
        
        // Imposta il currentMapLayer
        currentMapLayer = 'standard';
        
        console.log('✅ Mappa inizializzata con successo');
        
        // Verifica stato dopo inizializzazione
        setTimeout(() => {
            const isHealthy = verifyMapState();
            if (isHealthy) {
                console.log('✅ Mappa verificata e funzionante');
                
                // Configura i controlli dopo che la mappa è pronta
                setTimeout(() => {
                    setupMapControlsFixed();
                }, 500);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione mappa:', error);
        showNotification('Errore nell\'inizializzazione della mappa', 'error');
    }
}

// *** CORREZIONE 8: DIAGNOSTICA CONTROLLI MAPPA ***
function diagnoseMapControls() {
    console.log('🔧 Diagnostica controlli mappa...');
    
    const requiredElements = [
        'centerPalermo',
        'layerToggle', 
        'layerMenu',
        'mapStandard',
        'mapSatellite'
    ];
    
    const results = {};
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        results[id] = {
            exists: !!element,
            visible: element ? !element.classList.contains('hidden') : false,
            hasEventListener: element ? element.onclick !== null || element.addEventListener !== undefined : false
        };
    });
    
    console.table(results);
    
    // Test funzioni
    const functions = [
        'centerMapOnPalermo',
        'switchMapLayer', 
        'toggleLayerMenu'
    ];
    
    functions.forEach(funcName => {
        const func = window[funcName];
        console.log(`Funzione ${funcName}:`, typeof func === 'function' ? '✅ OK' : '❌ MANCANTE');
    });
    
    return results;
}

// *** CORREZIONE 9: FUNZIONE PRINCIPALE DI CORREZIONE ***
function fixMapControlsIssues() {
    console.log('🔧 Applicando correzioni controlli mappa...');
    
    // 1. Diagnostica iniziale
    const diagnosis = diagnoseMapControls();
    
    // 2. Re-inizializza la mappa se necessario
    if (!map || !verifyMapState()) {
        console.log('🔄 Re-inizializzazione mappa necessaria...');
        initializeMapFixed();
    } else {
        // 3. Configura solo i controlli se la mappa è OK
        setupMapControlsFixed();
    }
    
    // 4. Aggiorna UI layer buttons
    updateLayerButtons(currentMapLayer || 'standard');
    
    // 5. Test finale
    setTimeout(() => {
        console.log('🧪 Test finale controlli mappa...');
        const finalDiagnosis = diagnoseMapControls();
        
        let issues = 0;
        Object.entries(finalDiagnosis).forEach(([id, data]) => {
            if (!data.exists) issues++;
        });
        
        if (issues === 0) {
            console.log('✅ Tutti i controlli mappa sono ora funzionanti');
            showNotification('Controlli mappa riparati con successo!', 'success');
        } else {
            console.warn(`⚠️ ${issues} controlli ancora problematici`);
            showNotification(`${issues} controlli necessitano ancora attenzione`, 'warning');
        }
    }, 2000);
}

// *** CORREZIONE 10: INTEGRAZIONE CON IL SISTEMA ESISTENTE ***
// Sostituisci le funzioni esistenti
if (typeof window !== 'undefined') {
    // Salva le funzioni originali per backup
    window.originalCenterMapOnPalermo = window.centerMapOnPalermo;
    window.originalSwitchMapLayer = window.switchMapLayer;
    window.originalInitializeMap = window.initializeMap;
    
    // Sostituisci con le versioni corrette
    window.centerMapOnPalermo = centerMapOnPalermo;
    window.switchMapLayer = switchMapLayer;
    window.initializeMap = initializeMapFixed;
    
    // Aggiungi nuove funzioni
    window.setupMapControlsFixed = setupMapControlsFixed;
    window.diagnoseMapControls = diagnoseMapControls;
    window.fixMapControlsIssues = fixMapControlsIssues;
    window.verifyMapState = verifyMapState;
    
    console.log('🔄 Funzioni controlli mappa sostituite');
}

// *** AUTO-ESECUZIONE ***
// Se il DOM è già caricato, applica immediatamente le correzioni
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(fixMapControlsIssues, 1000);
        });
    } else {
        // DOM già caricato
        setTimeout(fixMapControlsIssues, 1000);
    }
}

// *** CSS AGGIUNTIVO PER MARKER CENTRO ***
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .center-palermo-marker .center-marker-icon {
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border: 2px solid #3B82F6;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .center-palermo-marker:hover .center-marker-icon {
            transform: scale(1.2);
            background: #3B82F6;
        }
    `;
    document.head.appendChild(style);
}

console.log('🗺️ Script correzioni controlli mappa caricato');

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        centerMapOnPalermo,
        switchMapLayer,
        initializeMapFixed,
        setupMapControlsFixed,
        diagnoseMapControls,
        fixMapControlsIssues,
        verifyMapState
    };
}