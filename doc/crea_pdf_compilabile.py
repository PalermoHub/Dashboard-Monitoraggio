"""
Genera 'Modulo_Patto_Collaborazione_compilabile.pdf' con tutti i campi
AcroForm compilabili (testo + checkbox), font 12pt, righe '_____' eliminate.
Richiede: PyMuPDF  (pip install pymupdf)
"""

import fitz
import os

SRC = os.path.join(os.path.dirname(__file__),
                   "Modulo istanza per Patto di Collaborazione ex art. 7 Reg.docx.pdf")
OUT = os.path.join(os.path.dirname(__file__),
                   "Modulo_Patto_Collaborazione_compilabile.pdf")

FS = 12   # font size globale


def erase_underscores(page):
    """Cancella tutti i caratteri '_' con rettangolo bianco."""
    # Raggruppa i rect vicini sulla stessa riga per evitare migliaia di draw
    rects = page.search_for("_")
    if not rects:
        return
    merged = []
    cur = fitz.Rect(rects[0])
    for r in rects[1:]:
        # stessa riga (y sovrapposta) e orizzontalmente adiacente (gap < 5pt)
        if abs(r.y0 - cur.y0) < 5 and r.x0 - cur.x1 < 5:
            cur = fitz.Rect(min(cur.x0, r.x0), min(cur.y0, r.y0),
                            max(cur.x1, r.x1), max(cur.y1, r.y1))
        else:
            merged.append(cur)
            cur = fitz.Rect(r)
    merged.append(cur)
    for r in merged:
        r2 = fitz.Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1)
        page.draw_rect(r2, color=None, fill=(1, 1, 1), overlay=True)


def add_text(page, name, rect, multiline=False):
    # copre prima il contenuto sottostante
    r2 = fitz.Rect(rect[0] - 0.5, rect[1] - 0.5, rect[2] + 0.5, rect[3] + 0.5)
    page.draw_rect(r2, color=None, fill=(1, 1, 1), overlay=True)
    w = fitz.Widget()
    w.rect = fitz.Rect(rect)
    w.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w.field_name = name
    w.field_value = ""
    w.text_fontsize = FS
    w.text_font = "Helv"
    w.text_color = (0, 0, 0)
    w.fill_color = (1, 1, 1)
    w.border_color = (0.55, 0.55, 0.55)
    w.border_width = 0.5
    if multiline:
        w.text_multiline = True
    page.add_widget(w)


def add_check(page, name, rect):
    w = fitz.Widget()
    w.rect = fitz.Rect(rect)
    w.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
    w.field_name = name
    w.field_value = "Off"
    w.fill_color = (1, 1, 1)
    w.border_color = (0, 0, 0)
    w.border_width = 0.8
    page.add_widget(w)


doc = fitz.open(SRC)

# ── PAGINA 1 ──────────────────────────────────────────────────────────────────
p0 = doc[0]
erase_underscores(p0)

# Coordinate ESATTE dalle rect degli underscore (search_for "____")
add_text(p0, "nome_cognome",   (129.5, 376.4, 535.9, 392.5))
add_text(p0, "nato_a",         (79.9,  398.4, 271.2, 414.4))
add_text(p0, "data_nascita",   (288.1, 398.4, 383.7, 414.4))
add_text(p0, "codice_fiscale", (413.2, 398.4, 556.6, 414.4))
add_text(p0, "residente_a",    (93.4,  420.3, 236.8, 436.4))
add_text(p0, "provincia",      (264.7, 420.3, 288.6, 436.4))   # Prov.______
add_text(p0, "via_residenza",  (321.3, 420.3, 536.4, 436.4))

add_check(p0, "qualita_privato",     (36, 499.3, 48, 511.3))
add_check(p0, "qualita_gruppo",      (36, 524.4, 48, 536.4))

add_text(p0, "denominato",     (102.7, 549.6, 533.0, 565.6))
# Composto da: campo multilinea sulle 3 righe tratteggio
add_text(p0, "composto_da",    (36.0,  571.0, 538.0, 643.0), multiline=True)

add_check(p0, "qualita_legale_rapp", (36, 649.9, 48, 661.9))

add_text(p0, "denominata",     (102.1, 675.8, 556.2, 691.9))
add_text(p0, "cf_piva",        (166.2, 700.8, 548.7, 716.8))
add_text(p0, "sede_comune",    (98.3,  725.7, 313.5, 741.8))
add_text(p0, "sede_via",       (336.1, 725.7, 551.2, 741.8))

# ── PAGINA 2 ──────────────────────────────────────────────────────────────────
p1 = doc[1]
erase_underscores(p1)

# Coordinate esatte (search_for "____") — i y sono spostati rispetto alla pag 1
add_text(p1, "email",          (65.9,  59.6, 305.0, 75.7))
add_text(p1, "pec",            (338.0, 59.6, 553.2, 75.7))
add_text(p1, "telefono",       (107.3, 81.6, 298.5, 97.6))
add_text(p1, "cellulare",      (336.9, 81.6, 552.0, 97.6))

# Sezioni 1-7 — spazio bianco tra i titoli numerati
add_text(p1, "titolo_proposta",  (36, 261,  556, 292),  multiline=True)
add_text(p1, "bene_comune",      (36, 306,  556, 367),  multiline=True)
add_text(p1, "descrizione_idea", (36, 381,  556, 441),  multiline=True)
add_text(p1, "attivita",         (36, 455,  556, 516),  multiline=True)
add_text(p1, "destinatari",      (36, 530,  556, 592),  multiline=True)
add_text(p1, "modello_partecip", (36, 606,  556, 667),  multiline=True)
add_text(p1, "durata",           (36, 681,  556, 698),  multiline=False)

# ── PAGINA 3 ──────────────────────────────────────────────────────────────────
p2 = doc[2]
# Nessun underscore su pag.3 (search_for "____" = 0 risultati)

add_check(p2, "breve_termine",          (41.25, 37.3,  53.25, 49.3))
add_check(p2, "medio_termine",          (238.5, 37.3,  250.5, 49.3))
add_check(p2, "lungo_termine",          (401.25, 37.3, 413.25, 49.3))

add_check(p2, "utilizzo_continuativo",  (117.0, 58.7, 129.0, 70.7))
add_check(p2, "utilizzo_periodico",     (210.0, 58.2, 222.0, 70.2))
add_text(p2,  "periodicita",            (272.0, 57.0, 556.0, 73.0))

add_check(p2, "risorse_proprie",        (41.25, 118.5, 53.25, 130.5))
add_text(p2,  "risorse_euro",           (185.0, 118.0, 264.0, 132.5))
add_text(p2,  "risorse_per",            (283.0, 118.0, 556.0, 132.5))

add_check(p2, "risorse_strumentali",    (41.25, 140.1, 53.25, 152.1))
add_text(p2,  "risorse_strumentali_det",(170.0, 139.0, 556.0, 153.5))

add_check(p2, "risorse_umane",          (41.25, 161.7, 53.25, 173.7))
add_text(p2,  "risorse_umane_det",      (167.0, 160.5, 556.0, 175.0))

add_check(p2, "sostegno_spazi",         (41.25, 205.3, 53.25, 217.3))
add_check(p2, "sostegno_beni",          (41.25, 227.0, 53.25, 239.0))
add_check(p2, "sostegno_formazione",    (41.25, 248.6, 53.25, 260.6))
add_check(p2, "sostegno_affiancamento", (41.25, 270.2, 53.25, 282.2))
add_check(p2, "sostegno_altro",         (41.25, 291.8, 53.25, 303.8))
add_text(p2,  "sostegno_altro_det",     (100.0, 290.5, 556.0, 305.0))

add_check(p2, "dichiara_no_esclusione", (36, 348.6, 48, 360.6))
add_check(p2, "dichiara_no_contenz",    (36, 381.1, 48, 393.1))
add_check(p2, "dichiara_si_contenz",    (36, 428.6, 48, 440.6))
add_text(p2,  "contenz_documento",      (185.0, 443.0, 556.0, 457.0))

add_check(p2, "dichiara_preso_visione", (36, 462.6, 48, 474.6))
add_check(p2, "dichiara_autorizza_pub", (36, 525.1, 48, 537.1))
add_check(p2, "dichiara_a_conoscenza",  (36, 558.4, 48, 570.4))
add_check(p2, "dichiara_tratt_dati",    (36, 650.2, 48, 662.2))

# ── PAGINA 4 ──────────────────────────────────────────────────────────────────
p3 = doc[3]
erase_underscores(p3)

add_check(p3, "all_doc_riconosc",       (36, 107.6, 50, 121.6))
add_check(p3, "all_mappa",              (36, 141.8, 50, 155.8))
add_check(p3, "all_elaborato",          (36, 158.9, 50, 172.9))
add_check(p3, "all_foto",               (36, 176.0, 50, 190.0))
add_check(p3, "all_planimetria",        (36, 193.0, 50, 207.0))
add_check(p3, "all_atto_costitutivo",   (36, 210.1, 50, 224.1))
add_check(p3, "all_doc_partecipaz",     (36, 227.2, 50, 241.2))
add_check(p3, "all_verbale",            (36, 244.3, 50, 258.3))
add_check(p3, "all_altro",              (35.6, 261.4, 49.6, 275.4))
# Coordinate esatte da search_for "____" pag.4
add_text(p3,  "all_altro_det",          (81.9, 292.3, 528.3, 311.0))

# Linee vettoriali Data/Firma: copre con bianco e aggiunge campi
# Data: linea a y≈398.2, x=75.6-165.2  → campo testo
p3.draw_rect(fitz.Rect(74, 391, 167, 403), color=None, fill=(1, 1, 1), overlay=True)
add_text(p3, "luogo_data",             (74.0, 391.0, 167.0, 403.0))
# Firma: linea a y≈413.4, x=354.9-553.5 → campo testo
p3.draw_rect(fitz.Rect(353, 406, 555, 418), color=None, fill=(1, 1, 1), overlay=True)
add_text(p3, "luogo_firma",            (353.0, 406.0, 555.0, 418.0))

doc.save(OUT)
doc.close()
print("Salvato:", OUT)
