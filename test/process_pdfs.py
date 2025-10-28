import os
import re
import time
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
    if not url:
        return None
    patterns = [
        r'/d/([a-zA-Z0-9-_]+)',
        r'id=([a-zA-Z0-9-_]+)',
        r'/file/d/([a-zA-Z0-9-_]+)',
        r'open\?id=([a-zA-Z0-9-_]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, str(url))
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
        print(f"    Errore download Drive: {e}")
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
        print(f"    Errore download URL: {e}")
        return False

def get_all_links_batch(sheets_service, spreadsheet_id, sheet_name, start_row, end_row):
    """Legge tutte le celle della colonna AF in batch per evitare rate limiting"""
    try:
        cell_range = f"'{sheet_name}'!AF{start_row}:AF{end_row}"
        result = sheets_service.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            ranges=[cell_range],
            fields='sheets(data(rowData(values(hyperlink,formattedValue,userEnteredValue))))'
        ).execute()
        
        links = []
        sheets = result.get('sheets', [])
        if not sheets:
            return links
            
        data = sheets[0].get('data', [])
        if not data:
            return links
            
        rows = data[0].get('rowData', [])
        
        for row in rows:
            values = row.get('values', [])
            if not values:
                links.append(None)
                continue
                
            cell = values[0]
            link = None
            
            # Prova a estrarre il link
            if 'hyperlink' in cell:
                link = cell['hyperlink']
            elif 'userEnteredValue' in cell:
                user_value = cell['userEnteredValue']
                if 'formulaValue' in user_value:
                    formula = user_value['formulaValue']
                    match = re.search(r'HYPERLINK\("([^"]+)"', formula, re.IGNORECASE)
                    if match:
                        link = match.group(1)
            
            # Se non c'è link, memorizza il nome del file
            if not link and 'formattedValue' in cell:
                link = cell['formattedValue']
            
            links.append(link)
        
        return links
        
    except Exception as e:
        print(f"Errore nel batch read: {e}")
        return []

def search_file_in_drive(service, filename):
    """Cerca un file su Google Drive per nome"""
    try:
        # Pulisci il nome del file
        clean_name = filename.strip()
        
        query = f"name='{clean_name}' and mimeType='application/pdf'"
        results = service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name, webViewLink)',
            pageSize=1
        ).execute()
        
        files = results.get('files', [])
        if files:
            return files[0]['id']
        return None
    except Exception as e:
        print(f"    Errore ricerca file: {e}")
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
    
    # Client Sheets API v4
    sheets_service = build('sheets', 'v4', credentials=creds)
    
    # Apri il foglio Google Sheets
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    
    sh = gc.open_by_key(spreadsheet_id)
    worksheet = sh.get_worksheet_by_id(2067285561)
    sheet_name = worksheet.title
    
    # Leggi la colonna A (Id_Prog) dalla riga 3 in poi
    id_prog_values = worksheet.col_values(1)[2:]
    
    print(f"📊 Trovate {len(id_prog_values)} righe da processare\n")
    print("🔍 Lettura links in batch dalla colonna AF...")
    
    # Leggi tutti i link in batch (dalla riga 3 in poi)
    start_row = 3
    end_row = start_row + len(id_prog_values) - 1
    pdf_links = get_all_links_batch(sheets_service, spreadsheet_id, sheet_name, start_row, end_row)
    
    print(f"✓ Letti {len(pdf_links)} link\n")
    
    # Crea la cartella patti se non esiste
    os.makedirs('patti', exist_ok=True)
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Processa ogni riga
    for idx, (id_prog, pdf_link) in enumerate(zip(id_prog_values, pdf_links), start=3):
        try:
            # Salta righe vuote o intestazione
            if not id_prog or id_prog == 'Id_Prog.':
                continue
            
            if not pdf_link:
                skipped_count += 1
                continue
            
            print(f"📄 Riga {idx}: Id_Prog={id_prog}")
            print(f"   Link/Nome: {pdf_link[:80]}...")
            
            # Nome del file finale
            final_path = f"patti/patto_{id_prog}.pdf"
            
            # Download del PDF
            success = False
            
            # 1. Prova come link Google Drive
            file_id = extract_file_id_from_url(pdf_link)
            if file_id:
                print(f"   → Google Drive ID: {file_id}")
                success = download_pdf_from_drive(drive_service, file_id, final_path)
            
            # 2. Prova come URL diretto
            if not success and isinstance(pdf_link, str) and pdf_link.startswith(('http://', 'https://')):
                print(f"   → Tentativo URL diretto")
                success = download_pdf_from_url(pdf_link, final_path)
            
            # 3. Cerca il file su Drive per nome
            if not success and isinstance(pdf_link, str) and not pdf_link.startswith('http'):
                print(f"   → Ricerca file su Drive per nome...")
                file_id = search_file_in_drive(drive_service, pdf_link)
                if file_id:
                    print(f"   → File trovato! ID: {file_id}")
                    success = download_pdf_from_drive(drive_service, file_id, final_path)
                    # Aggiungi delay per evitare rate limiting
                    time.sleep(0.5)
            
            if success:
                file_size = os.path.getsize(final_path)
                print(f"   ✓ Salvato: {final_path} ({file_size/1024:.1f} KB)\n")
                processed_count += 1
            else:
                print(f"   ✗ Download fallito\n")
                error_count += 1
                
        except Exception as e:
            print(f"   ✗ Errore: {e}\n")
            error_count += 1
            continue
    
    # Riepilogo finale
    print(f"\n{'='*60}")
    print(f"✓ File scaricati:  {processed_count}")
    print(f"⊘ Saltati (vuoti): {skipped_count}")
    print(f"✗ Errori:          {error_count}")
    print(f"{'='*60}\n")
    
    # Lista file nella cartella
    if os.path.exists('patti') and os.listdir('patti'):
        print("📁 File nella cartella patti:")
        for filename in sorted(os.listdir('patti')):
            filepath = os.path.join('patti', filename)
            size = os.path.getsize(filepath)
            print(f"   • {filename} ({size/1024:.1f} KB)")
    else:
        print("⚠ Nessun file scaricato")
        print("\n💡 Suggerimento: Verifica che i file PDF siano:")
        print("   1. Condivisi con il service account")
        print("   2. Accessibili come link di Google Drive nelle celle")
        print("   3. Non siano allegati locali dello Sheets")
    
    return processed_count

if __name__ == "__main__":
    main()