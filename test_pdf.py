import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            accept_downloads=True
        )
        page = await context.new_page()

        await page.goto("http://localhost:8743/compila_istanza.html", wait_until="networkidle")
        await page.wait_for_timeout(1500)

        await page.screenshot(path="test_01_pagina.png", full_page=False)
        print("Screenshot 1: pagina caricata")

        await page.evaluate("window.scrollTo(0, 500)")
        await page.wait_for_timeout(400)
        await page.screenshot(path="test_02_qualita_di.png", full_page=False)
        print("Screenshot 2: sezione qualita di")

        # Compila campi
        await page.fill("#nome_cognome", "Mario Rossi")
        await page.fill("#luogo_nascita", "Palermo")
        await page.fill("#data_nascita", "1985-03-15")
        await page.fill("#codice_fiscale", "RSSMRA85C15G273X")
        await page.fill("#residenza_citta", "Palermo")
        await page.fill("#residenza_prov", "PA")
        await page.fill("#residenza_via", "Via Roma 1")
        await page.check("#qualita_privato")
        await page.fill("#contatto_email", "mario.rossi@test.it")
        await page.fill("#contatto_cell", "3331234567")
        await page.fill("#prop_titolo", "Riqualificazione Giardino di Via Roma")
        await page.fill("#prop_bene", "Giardino pubblico Via Roma angolo Via Maqueda - Palermo")
        await page.fill("#prop_idea", "Progetto di rigenerazione dello spazio verde con attivita di giardinaggio comunitario.")
        await page.fill("#prop_attivita", "Fase 1: mappatura. Fase 2: pulizia. Fase 3: piantumazione. Durata 12 mesi.")
        await page.fill("#prop_destinatari", "Residenti del quartiere, bambini, anziani.")
        await page.fill("#prop_modello", "Assemblee pubbliche mensili con i residenti del quartiere.")

        await page.evaluate("window.scrollTo(0, 2000)")
        await page.wait_for_timeout(400)
        await page.screenshot(path="test_03_propone.png", full_page=False)
        print("Screenshot 3: sezione PROPONE compilata")

        # Cattura tutti i messaggi console
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))

        # Genera PDF
        async with page.expect_download(timeout=35000) as dl_info:
            await page.click("button[type='submit']")
        download = await dl_info.value
        dest = os.path.join(os.path.abspath("."), "doc", "test_output.pdf")
        await download.save_as(dest)
        size = os.path.getsize(dest)
        print(f"PDF scaricato: {dest} ({size} bytes)")

        await page.wait_for_timeout(500)
        if errors:
            print("=== CONSOLE ERRORS ===")
            for e in errors:
                print(e)

        await browser.close()
        print("DONE")

asyncio.run(main())
