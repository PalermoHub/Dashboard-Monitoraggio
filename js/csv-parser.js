// ==========================================
// PATTI DI COLLABORAZIONE — CSV PARSER
// Funzioni pure di parsing CSV — nessuna dipendenza DOM o stato globale
// Caricato PRIMA di monitoraggio_p1-v9.js
// ==========================================

/**
 * Parsa un testo CSV completo e restituisce un array di oggetti.
 * Accetta virgolette per i campi con virgole interne.
 * Filtra automaticamente le righe senza coordinate lat/lng valide.
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const record = {};

        headers.forEach((header, index) => {
            record[header.trim()] = values[index] ? values[index].trim() : '';
        });

        const latKey = headers.find(h => h.toLowerCase().includes('lat'));
        const lngKey = headers.find(h => h.toLowerCase().includes('long'));

        if (latKey && lngKey) {
            record.lat = parseFloat(record[latKey]);
            record.lng = parseFloat(record[lngKey]);
            if (!isNaN(record.lat) && !isNaN(record.lng)) {
                records.push(record);
            }
        }
    }

    return records;
}

/**
 * Parsa una singola riga CSV rispettando le virgolette.
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}
