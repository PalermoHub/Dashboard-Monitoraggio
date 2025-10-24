/**
 * ============================================
 * DIAGNOSTICA SISTEMA HIGHLIGHTING
 * Esegui questo prima di tutto
 * ============================================
 */

console.group('🔍 DIAGNOSTICA COMPLETA HIGHLIGHTING');

// 1. Verifica funzioni originali
console.log('\n📋 FUNZIONI ORIGINALI:');
console.log('✓ openSidePanel exists:', typeof window.openSidePanel === 'function');
console.log('✓ closeSidePanel exists:', typeof window.closeSidePanel === 'function');
console.log('✓ navigateSidePanel exists:', typeof window.navigateSidePanel === 'function');
console.log('✓ showPattoDetails exists:', typeof window.showPattoDetails === 'function');

// 2. Verifica mappa
console.log('\n🗺️ STATO MAPPA:');
console.log('✓ window.map exists:', !!window.map);
if (window.map) {
    console.log('✓ map._container exists:', !!window.map._container);
    console.log('✓ map.getCenter exists:', typeof window.map.getCenter === 'function');
    console.log('✓ map.setView exists:', typeof window.map.setView === 'function');
    try {
        if (typeof window.map.getCenter === 'function') {
            console.log('✓ map center:', window.map.getCenter());
        } else {
            console.log('⚠️ map.getCenter non disponibile ancora');
        }
    } catch (e) {
        console.log('⚠️ Mappa non ancora pronta:', e.message);
    }
} else {
    console.log('⚠️ Mappa NON ANCORA INIZIALIZZATA - Aspetteremo il caricamento');
}

// 3. Verifica dati
console.log('\n📊 DATI:');
console.log('✓ window.allData length:', window.allData?.length || 0);
console.log('✓ window.filteredData length:', window.filteredData?.length || 0);
console.log('✓ window.sidePanelData length:', window.sidePanelData?.length || 0);

// 4. Verifica side panel
console.log('\n📂 SIDE PANEL:');
const panel = document.getElementById('pattoSidePanel');
console.log('✓ Panel exists:', !!panel);
console.log('✓ Panel is open:', panel?.classList.contains('open'));
console.log('✓ Current index:', window.currentSidePanelIndex);

// 5. Verifica highlighting
console.log('\n✨ HIGHLIGHTING:');
console.log('✓ currentHighlightMarker:', typeof window.currentHighlightMarker !== 'undefined' ? typeof window.currentHighlightMarker : 'NON CARICATO');
console.log('✓ currentHighlightedPattoId:', typeof window.currentHighlightedPattoId !== 'undefined' ? window.currentHighlightedPattoId : 'NON CARICATO');

// 6. Verifica funzioni highlighting
console.log('\n🎯 FUNZIONI HIGHLIGHTING:');
console.log('✓ createHighlightMarkerSafe exists:', typeof window.createHighlightMarkerSafe === 'function');
console.log('✓ removeHighlightMarkerSafe exists:', typeof window.removeHighlightMarkerSafe === 'function');

// 7. Verifica CSS
console.log('\n🎨 CSS:');
const highlightStyle = document.getElementById('unifiedHighlightingStyles');
console.log('✓ Highlighting CSS loaded:', !!highlightStyle);

console.groupEnd();

// ============================================
// COMANDI TEST MANUALI
// ============================================

console.log('\n💡 COMANDI PER IL TEST:');
console.log('Esegui nella console:');
console.log('1️⃣  testHighlighting() - Test completo');
console.log('2️⃣  testMarkerCreation() - Crea marker test');
console.log('3️⃣  testAnimation() - Testa animazione');
console.log('4️⃣  testOpenPanel() - Apri panel con highlight');

// ============================================
// ATTESA MAPPA PRONTA
// ============================================

window.waitForMap = function(callback, maxTries = 100) {
    let tries = 0;
    const checker = setInterval(() => {
        tries++;
        if (window.map && typeof window.map.getCenter === 'function') {
            clearInterval(checker);
            console.log('✅ Mappa PRONTA!');
            if (callback) callback();
            return true;
        }
        if (tries % 20 === 0) {
            console.log(`⏳ Aspetta mappa... ${tries}/${maxTries}`);
        }
        if (tries >= maxTries) {
            clearInterval(checker);
            console.error('❌ Timeout: mappa non inizializzata');
            return false;
        }
    }, 100);
};

// ============================================
// COMANDI TEST MANUALI
// ============================================

console.log('\n💡 COMANDI PER IL TEST:');
console.log('Esegui nella console:');
console.log('1️⃣  waitForMap(() => testHighlighting()) - Test completo');
console.log('2️⃣  waitForMap(() => testMarkerCreation()) - Crea marker test');
console.log('3️⃣  waitForMap(() => testAnimation()) - Testa animazione');
console.log('4️⃣  waitForMap(() => testOpenPanel()) - Apri panel con highlight');

// ============================================
// FUNZIONE TEST COMPLETA
// ============================================

window.testHighlighting = function() {
    console.group('🧪 TEST HIGHLIGHTING COMPLETO');
    
    if (!window.map) {
        console.error('❌ Mappa non pronta!');
        console.groupEnd();
        return false;
    }
    
    if (!window.allData || window.allData.length === 0) {
        console.error('❌ Nessun dato disponibile!');
        console.groupEnd();
        return false;
    }
    
    if (typeof window.createHighlightMarkerSafe !== 'function') {
        console.error('❌ Funzione createHighlightMarkerSafe non caricata!');
        console.error('Verifica che side-panel-highlight-sync.js sia caricato');
        console.groupEnd();
        return false;
    }
    
    // Prendi il primo patto
    const patto = window.allData[0];
    const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
    
    console.log('Test patto:', {
        id: patto[idKey],
        lat: patto.lat,
        lng: patto.lng
    });
    
    // Testa creazione
    console.log('\n📍 Creando marker highlight...');
    const success = window.createHighlightMarkerSafe(patto, true);
    
    if (success) {
        console.log('✅ Marker creato con successo!');
        
        // Verifica marker
        if (typeof window.currentHighlightMarker !== 'undefined' && window.currentHighlightMarker !== null) {
            console.log('✅ currentHighlightMarker è definito');
            
            const latLng = window.currentHighlightMarker.getLatLng();
            const style = window.currentHighlightMarker.options;
            
            console.log('Marker details:', {
                position: latLng,
                radius: style.radius,
                fillColor: style.fillColor,
                weight: style.weight,
                fillOpacity: style.fillOpacity,
                className: style.className
            });
            
            console.log('✅ TEST COMPLETATO CON SUCCESSO!');
        } else {
            console.error('❌ Marker non trovato nel DOM');
        }
    } else {
        console.error('❌ Errore nella creazione del marker');
    }
    
    console.groupEnd();
    return success;
};

// ============================================
// TEST CREAZIONE MARKER
// ============================================

window.testMarkerCreation = function() {
    console.group('🔴 TEST CREAZIONE MARKER');
    
    if (!window.map) {
        console.error('❌ Mappa non disponibile');
        console.groupEnd();
        return;
    }
    
    console.log('Creando marker test...');
    
    // Rimuovi highlight precedente
    if (typeof window.removeHighlightMarkerSafe === 'function') {
        window.removeHighlightMarkerSafe();
    }
    
    // Crea marker test manualmente
    const testMarker = L.circleMarker([38.1170, 13.3734], {
        radius: 28,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 5,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'marker-pulse',
        pane: 'markerPane'
    }).addTo(window.map);
    
    testMarker.bringToFront();
    
    console.log('✅ Marker test creato');
    console.log('Opzioni:', testMarker.options);
    console.log('Posizione:', testMarker.getLatLng());
    
    // Centro mappa su marker
    window.map.setView([38.1170, 13.3734], 16);
    
    console.groupEnd();
};

// ============================================
// TEST ANIMAZIONE
// ============================================

window.testAnimation = function() {
    console.group('🎬 TEST ANIMAZIONE');
    
    const style = document.getElementById('unifiedHighlightingStyles');
    
    if (!style) {
        console.error('❌ Stili non trovati!');
        console.groupEnd();
        return;
    }
    
    console.log('📝 Contenuto stili CSS:');
    console.log(style.textContent);
    
    // Verifica animazione
    const hasMarkerPulse = style.textContent.includes('markerPulse');
    console.log('✓ Contiene animazione markerPulse:', hasMarkerPulse);
    
    const hasMarkerPulseClass = style.textContent.includes('.marker-pulse');
    console.log('✓ Contiene classe .marker-pulse:', hasMarkerPulseClass);
    
    console.groupEnd();
};

// ============================================
// TEST APERTURA PANEL
// ============================================

window.testOpenPanel = function() {
    console.group('📂 TEST APERTURA PANEL CON HIGHLIGHT');
    
    if (!window.allData || window.allData.length === 0) {
        console.error('❌ Nessun dato disponibile');
        console.groupEnd();
        return;
    }
    
    const patto = window.allData[0];
    const idKey = Object.keys(patto).find(k => k.toLowerCase() === 'id');
    const pattoId = patto[idKey];
    
    console.log('Aprendo panel per patto:', pattoId);
    
    // Chiama openSidePanel (che dovrebbe attivare highlight)
    if (typeof window.openSidePanel === 'function') {
        window.openSidePanel(pattoId);
        console.log('✅ openSidePanel chiamato');
    } else {
        console.error('❌ openSidePanel non trovato');
    }
    
    // Verifica dopo 500ms
    setTimeout(() => {
        console.log('\n📊 Stato dopo 500ms:');
        console.log('Panel aperto:', document.getElementById('pattoSidePanel')?.classList.contains('open'));
        console.log('Highlight marker:', typeof currentHighlightMarker);
        console.log('Highlight ID:', currentHighlightedPattoId);
    }, 500);
    
    console.groupEnd();
};

// ============================================
// RESET COMPLETO
// ============================================

window.resetHighlighting = function() {
    console.log('🔄 Reset completo highlighting...');
    
    if (typeof window.removeHighlightMarkerSafe === 'function') {
        window.removeHighlightMarkerSafe();
    }
    
    if (typeof window.closeSidePanel === 'function') {
        window.closeSidePanel();
    }
    
    console.log('✅ Reset completato');
};

console.log('\n✅ Diagnostica caricata - Usa i comandi di test sopra');
