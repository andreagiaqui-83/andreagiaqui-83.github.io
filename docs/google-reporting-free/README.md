# Report Google gratuito — Andrea Giaquinto

Questa soluzione elimina la dipendenza da plugin a pagamento/trial per il monitoraggio della landing `https://andreagiaquinto.it/lezioni-autocad/`.

## Costi

- Google Sheets: gratuito nell'account Google.
- Google Apps Script: gratuito entro le normali quote Google.
- Google Analytics Data API: nessun abbonamento; usa le quote standard della proprietà GA4.
- Google Search Console API: nessun abbonamento; usa le quote standard Google.
- Google Ads Scripts: gratuito dentro Google Ads e non richiede developer token.
- Nessun plugin esterno è necessario per alimentare il foglio.

Le API hanno quote tecniche, ma non sono piani trial e non scadono dopo 7/14/30 giorni.

## Foglio centrale già creato

`https://docs.google.com/spreadsheets/d/1Zxf83wL3gAJRF2tw-Lz9gGghHMVW6qbUcuAjkezndu0/edit`

Contiene:

- `Dashboard`
- `Config`
- `Ads_Daily`
- `Ads_Keywords`
- `Ads_Search_Terms`
- `Ads_Devices`
- `GA4_Daily`
- `GA4_Sources`
- `GSC_Queries`
- `GSC_Pages`
- `Daily_Report`

I parametri della campagna corrente sono già inseriti nel tab `Config`.

## 1. Collegare Google Analytics 4 + Search Console

1. Apri il foglio centrale.
2. Vai su **Estensioni → Apps Script**.
3. Sostituisci il contenuto di `Code.gs` con il file:
   `apps-script-analytics-search-console.gs`.
4. In **Impostazioni progetto**, abilita la visualizzazione del file manifest `appsscript.json`.
5. Sostituisci il manifest con il file `appsscript.json` di questa cartella.
6. Nel pannello **Servizi** di Apps Script, aggiungi **Google Analytics Data API** se non compare già.
7. Per Search Console, abilita **Search Console API** per il progetto Apps Script. Se compare tra i Servizi, aggiungila. In alternativa apri il progetto Google Cloud associato e abilita `Search Console API` dalla Libreria API. Non serve attivare fatturazione per questa API.
8. Salva.
9. Seleziona la funzione `testConnections` e premi **Esegui**.
10. Accetta le autorizzazioni Google usando l'account che ha accesso a GA4 e Search Console.
11. Se il test è OK, esegui una volta `runDailyGoogleReporting`.
12. Infine esegui una volta `installDailyTrigger`.

Il trigger aggiorna automaticamente GA4 e Search Console ogni mattina.

### Note Search Console

Lo script rileva automaticamente una proprietà tra:

- `sc-domain:andreagiaquinto.it`
- `https://andreagiaquinto.it/`
- `https://www.andreagiaquinto.it/`

Search Console può avere un ritardo di 24–72 ore: lo script rilegge una finestra mobile di più giorni per aggiornare i dati quando diventano disponibili.

## 2. Collegare Google Ads senza API a pagamento

1. Apri Google Ads con l'account `andrea_autocad`.
2. Vai su **Strumenti → Azioni collettive / Script** (il nome può variare leggermente nell'interfaccia).
3. Crea un nuovo script.
4. Incolla il contenuto di `google-ads-script.js`.
5. Autorizza lo script.
6. Premi **Anteprima** se disponibile, quindi **Esegui** una volta.
7. Controlla nel foglio centrale che compaiano dati nei tab `Ads_*`.
8. Imposta la pianificazione **giornaliera**, preferibilmente al mattino presto (es. fascia 06:00–07:00).

Lo script è solo di lettura/reportistica: non cambia budget, durata, keyword, annunci o stato della campagna.

## 3. Report ChatGPT giornaliero

Il report ChatGPT può leggere il foglio centrale via Google Drive e preparare il riepilogo quotidiano. La regola permanente è:

> Budget giornaliero, budget totale, durata e date delle campagne sono sempre decisi esclusivamente dall'utente e non vengono modificati automaticamente.

## Campagna monitorata

- Nome: `Lezioni AutoCAD Online - Ricerca - Manuale`
- Cliente Google Ads: `5762338732`
- Periodo: `2026-09-18` → `2026-09-24`
- Budget totale: `35 €`
- Landing: `https://andreagiaquinto.it/lezioni-autocad/`
- Evento principale: `generate_lead`

## Dati raccolti

### Google Ads

- stato campagna
- impressioni
- clic
- CTR
- costo
- CPC medio
- conversioni
- tasso di conversione
- CPA
- quota impressioni ricerca
- keyword e match type
- termini di ricerca reali
- performance per dispositivo

### Google Analytics 4

- utenti attivi
- nuovi utenti
- sessioni
- visualizzazioni landing
- sessioni coinvolte
- engagement rate
- tempo medio di coinvolgimento
- key events
- `generate_lead`
- source / medium
- campaign
- channel group

### Search Console

- query organiche reali che portano alla landing
- clic
- impressioni
- CTR
- posizione media
- pagine di destinazione

## Sicurezza

Non inserire password, token OAuth, client secret o chiavi API nel repository. L'autorizzazione avviene direttamente nell'account Google tramite Apps Script e Google Ads Scripts.
