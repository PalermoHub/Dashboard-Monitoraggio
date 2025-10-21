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
        r'/file/d/([a-zA-Z0-9-_]+)'
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
    
    # Apri il foglio Google Sheets
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    
    sh = gc.open_by_key(spreadsheet_id)
    # Apri il foglio specifico usando il gid
    worksheet = sh.get_worksheet_by_id(2067285561)
    
    # Leggi la colonna A (Id_Prog) dalla riga 3 in poi
    id_prog_values = worksheet.col_values(1)[2:]  # Colonna A, skip prime 2 righe
    
    # Leggi la colonna AF (link PDF) dalla riga 3 in poi
    # AF è la colonna 32 (A=1, B=2, ... Z=26, AA=27, ... AF=32)
    pdf_links = worksheet.col_values(32)[2:]  # Colonna AF, skip prime 2 righe
    
    print(f"Trovate {len(id_prog_values)} righe da processare")
    
    # Crea la cartella patti se non esiste
    os.makedirs('patti', exist_ok=True)
    
    processed_count = 0
    
    # Processa ogni riga
    for idx, (id_prog, pdf_link) in enumerate(zip(id_prog_values, pdf_links), start=3):
        try:
            # Salta righe vuote
            if not id_prog or not pdf_link:
                if id_prog or pdf_link:  # Stampa solo se una delle due è presente
                    print(f"Riga {idx}: Dati incompleti (Id_Prog={id_prog}, Link={pdf_link})")
                continue
            
            if not pdf_link:
                print(f"Riga {idx}: Link PDF non trovato")
                continue
            
            # Pulisci il link dagli smart chip (potrebbe contenere testo extra)
            # Gli smart chip possono avere formato "=HYPERLINK(url, label)" o contenere solo l'url
            if '=HYPERLINK' in pdf_link.upper():
                # Estrai l'URL dalla formula HYPERLINK
                match = re.search(r'HYPERLINK\("([^"]+)"', pdf_link, re.IGNORECASE)
                if match:
                    pdf_link = match.group(1)
            
            print(f"\nProcessando riga {idx}: Id_Prog={id_prog}, Link={pdf_link}")
            
            # Nome del file finale nella cartella patti
            final_path = f"patti/patto_{id_prog}.pdf"
            
            # Se il file esiste già, salta (opzionale, rimuovi questo check per sovrascrivere)
            if os.path.exists(final_path):
                print(f"File {final_path} già esistente, skip")
                continue
            
            # Download del PDF
            success = False
            
            # Prova prima come link Google Drive
            file_id = extract_file_id_from_url(pdf_link)
            if file_id:
                print(f"Rilevato link Google Drive, ID: {file_id}")
                success = download_pdf_from_drive(drive_service, file_id, final_path)
            
            # Se non è Google Drive o il download è fallito, prova come URL diretto
            if not success:
                print("Tentativo download da URL diretto")
                success = download_pdf_from_url(pdf_link, final_path)
            
            if not success:
                print(f"Impossibile scaricare il PDF dalla riga {idx}")
                continue
            
            print(f"✓ File salvato con successo: {final_path}")
            processed_count += 1
                
        except Exception as e:
            print(f"Errore nella riga {idx}: {e}")
            continue
    
    print(f"\nProcessamento completato! {processed_count} file scaricati nella cartella patti/")

if __name__ == "__main__":
    main()