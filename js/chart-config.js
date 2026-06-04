// ==========================================
// PATTI DI COLLABORAZIONE — CONFIGURAZIONE GRAFICI
// Costanti e configurazioni pure — nessuna dipendenza DOM
// Caricato PRIMA di monitoraggio_p1-v9.js
// ==========================================

// ── Colori stati — allineati alle CSS variables ──────────────
// (unico punto di verità, risolve inconsistenza A5)
const statusColors = {
    'Istruttoria in corso':    '#f59e0b',  // var(--status-istruttoria)
    'Respinta':                '#ef4444',  // var(--status-respinto)
    'Patto stipulato':         '#10b981',  // var(--status-stipulato)
    'Proroga e/o Monitoraggio': '#8b5cf6', // var(--status-monitoraggio)
    'Proroga e/o Monitoraggio e valutazione dei risultati': '#8b5cf6',
    'In attesa di integrazione': '#f97316', // var(--status-integrazione)
    'Archiviata':              '#64748b',  // var(--status-archiviato)
};

// ── Palette colori grafici ─────────────────────────────────────
const modernChartColors = {
    status: {
        'Istruttoria in corso':    '#F59E0B',
        'Respinta':                '#EF4444',
        'Patto stipulato':         '#10B981',
        'Proroga e/o Monitoraggio e valutazione dei risultati': '#8B5CF6',
        'In attesa di integrazione': '#F97316',
        'Archiviata':              '#64748B',
    },
    proponenti: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
        '#14B8A6', '#F43F5E', '#64748B', '#22C55E', '#A855F7',
    ]
};

// ── Utilità colori ─────────────────────────────────────────────
function generateIntelligentColors(count, baseHue = 200) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 137.508)) % 360;
        colors.push(`hsl(${hue}, 65%, 55%)`);
    }
    return colors;
}

function getBrighterColor(color) {
    if (color.startsWith('hsl')) {
        return color.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/, (_, h, s, l) => {
            return `hsl(${h}, ${s}%, ${Math.min(parseInt(l) + 15, 85)}%)`;
        });
    }
    return color + 'CC';
}

function formatChartValue(value, isPercentage = false) {
    if (isPercentage)      return `${value.toFixed(1)}%`;
    if (value >= 1000000)  return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000)     return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
}

// ── Plugin etichette dati ──────────────────────────────────────
const smartDataLabelsPlugin = {
    id: 'smartDataLabels',
    afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        ctx.save();
        chart.data.datasets.forEach(function(dataset, datasetIndex) {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach(function(bar, index) {
                const data = dataset.data[index];
                if (data > 0) {
                    const barHeight = Math.abs(bar.y - bar.base);
                    const inside = barHeight > 25;
                    ctx.fillStyle = inside ? '#FFFFFF' : '#374151';
                    ctx.font = 'bold 11px "Inter", system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = inside ? 'middle' : 'bottom';
                    const x = bar.x;
                    const y = inside ? (bar.y + bar.base) / 2 : bar.y - 8;
                    if (inside) {
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 2;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                    } else {
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fillText(formatChartValue(data), x, y);
                }
            });
        });
        ctx.restore();
    }
};

// ── Configurazione tooltip ─────────────────────────────────────
// Nota: le callback accedono a currentChartType e filteredData
// (globali definiti in monitoraggio_p1-v9.js, disponibili a runtime)
const modernTooltipConfig = {
    enabled: true,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    titleColor: '#F1F5F9',
    bodyColor: '#E2E8F0',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    cornerRadius: 8,
    displayColors: true,
    padding: 6,
    titleFont: { size: 12, weight: '600', family: '"Inter", system-ui, sans-serif' },
    bodyFont:  { size: 11, family: '"Inter", system-ui, sans-serif' },
    usePointStyle: true,
    filter: function(tooltipItem) { return tooltipItem.parsed.y > 0; },
    callbacks: {
        title: function(context) { return context[0].label; },
        label: function(context) {
            const value = context.parsed.y;
            const fmt = window.currentChartType === 'stato'
                ? `${value} patt${value === 1 ? 'o' : 'i'}`
                : `${value} richiest${value === 1 ? 'a' : 'e'}`;
            return `${context.dataset.label || ''}: ${fmt}`;
        },
        afterLabel: function(context) {
            if (window.filteredData && window.filteredData.length > 0) {
                return `Percentuale: ${((context.parsed.y / window.filteredData.length) * 100).toFixed(1)}%`;
            }
            return '';
        }
    }
};
