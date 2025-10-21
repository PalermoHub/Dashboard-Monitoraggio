import os
import re
import requests
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# Configurazione scopes
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

def extract_file_id_from_url(url):
    """Estrae l'ID del file da un URL di Google Drive"""
    patterns = [
        r'/d/([a-zA-Z0-9-_]+)',
        r'id=([a-zA-Z0-9-_]+)',
        r'/file/d/([a-zA-Z0-9-_]+)',
        r'open\?id=([a-zA-Z0-9-_]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def download_pdf_from_drive(service, file_id, destination):
    """Scarica un PDF da Google Drive"""
    try:
        request = service.files().get_media(fileId=file_id)
        with open(destination, 'wb') as f:
            f.write(request.execute())
        return True
    except Exception as e:
        print(f"Errore nel download del file {file_id}: {e}")
        return False

def download_pdf_from_url(url, destination):
    """Scarica un PDF da un URL diretto"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Errore nel download da URL {url}: {e}")
        return False

def get_cell_formula(sheets_service, spreadsheet_id, cell_range):
    """Legge la formula di una cella per ottenere il link reale dagli smart chip"""
    try:
        result = sheets_service.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            ranges=[cell_range],
            fields='sheets(data(rowData(values(hyperlink,formattedValue,userEnteredValue))))'
        ).execute()
        
        sheets = result.get('sheets', [])
        if not sheets:
            return None
            
        data = sheets[0].get('data', [])
        if not data:
            return None
            
        rows = data[0].get('rowData', [])
        if not rows:
            return None
            
        values = rows[0].get('values', [])
        if not values:
            return None
            
        cell = values[0]
        
        # Prova a estrarre il link in ordine di priorità
        # 1. Hyperlink diretto
        if 'hyperlink' in cell:
            return cell['hyperlink']
        
        # 2. UserEnteredValue per formule
        if 'userEnteredValue' in cell:
            user_value = cell['userEnteredValue']
            if 'formulaValue' in user_value:
                formula = user_value['formulaValue']
                # Estrai URL da formula HYPERLINK
                match = re.search(r'HYPERLINK\("([^"]+)"', formula, re.IGNORECASE)
                if match:
                    return match.group(1)
        
        # 3. FormattedValue come fallback (potrebbe essere solo il nome)
        if 'formattedValue' in cell:
            return cell['formattedValue']
            
        return None
    except Exception as e:
        print(f"Errore nella lettura della cella {cell_range}: {e}")
        return None

def main():
    # Autenticazione
    creds = Credentials.from_service_account_file(
        'credentials.json',
        scopes=SCOPES
    )
    
    # Client Google Sheets
    gc = gspread.authorize(creds)
    
    # Client Google Drive
    drive_service = build('drive', 'v3', credentials=creds)
    
    # Client Sheets API v4 (per leggere le formule)
    sheets_service = build('sheets', 'v4', credentials=creds)
    
    # Apri il foglio Google Sheets
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    
    sh = gc.open_by_key(spreadsheet_id)
    # Apri il foglio specifico usando il gid
    worksheet = sh.get_worksheet_by_id(2067285561)
    
    # Ottieni il nome del foglio
    sheet_name = worksheet.title
    
    # Leggi la colonna A (Id_Prog) dalla riga 3 in poi
    id_prog_values = worksheet.col_values(1)[2:]  # Colonna A, skip prime 2 righe
    
    print(f"Trovate {len(id_prog_values)} righe da processare")
    
    # Crea la cartella patti se non esiste
    os.makedirs('patti', exist_ok=True)
    
    processed_count = 0
    
    # Processa ogni riga
    for idx, id_prog in enumerate(id_prog_values, start=3):
        try:
            # Salta righe vuote
            if not id_prog:
                continue
            
            # Leggi la cella AF per questa riga usando Sheets API v4
            cell_range = f"'{sheet_name}'!AF{idx}"
            pdf_link = get_cell_formula(sheets_service, spreadsheet_id, cell_range)
            
            if not pdf_link:
                print(f"Riga {idx}: Link PDF non trovato (Id_Prog={id_prog})")
                continue
            
            print(f"\nProcessando riga {idx}: Id_Prog={id_prog}")
            print(f"  Link estratto: {pdf_link}")
            
            # Nome del file finale nella cartella patti
            final_path = f"patti/patto_{id_prog}.pdf"
            
            # Commenta queste righe per sovrascrivere file esistenti
            # if os.path.exists(final_path):
            #     print(f"File {final_path} già esistente, skip")
            #     continue
            
            # Download del PDF
            success = False
            
            # Prova prima come link Google Drive
            file_id = extract_file_id_from_url(pdf_link)
            if file_id:
                print(f"  → Rilevato Google Drive, ID: {file_id}")
                success = download_pdf_from_drive(drive_service, file_id, final_path)
            
            # Se non è Google Drive o il download è fallito, prova come URL diretto
            if not success and pdf_link.startswith(('http://', 'https://')):
                print(f"  → Tentativo download da URL diretto")
                success = download_pdf_from_url(pdf_link, final_path)
            
            if not success:
                print(f"  ✗ Impossibile scaricare il PDF (link non valido o non accessibile)")
                continue
            
            print(f"  ✓ File salvato: {final_path}")
            processed_count += 1
                
        except Exception as e:
            print(f"Errore nella riga {idx}: {e}")
            continue
    
    print(f"\n{'='*60}")
    print(f"Processamento completato! {processed_count} file scaricati")
    print(f"{'='*60}")
    
    # Lista tutti i file nella cartella patti
    if os.path.exists('patti') and os.listdir('patti'):
        print("\n📁 File presenti nella cartella patti:")
        for filename in sorted(os.listdir('patti')):
            filepath = os.path.join('patti', filename)
            size = os.path.getsize(filepath)
            print(f"  - {filename} ({size/1024:.1f} KB)")
    else:
        print("\n⚠ La cartella patti è vuota!")
    
    return processed_count

if __name__ == "__main__":
    main()