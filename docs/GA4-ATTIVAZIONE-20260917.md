# Attivazione GA4 — 17 settembre 2026

## Identificativo autorizzato

Il titolare ha fornito lo screenshot dei dettagli dello stream «Andrea Giaquinto - Sito web», URL https://andreagiaquinto.it, ID stream 15795461390, **ID misurazione G-SQ7LJ1FVVY**. La misurazione avanzata nello screenshot è disattivata.

Il tag Google pubblico relativo all'ID risponde HTTP 200 e contiene l'ID di misurazione. L'ID numerico dello stream non è esposto nel tag scaricato: non è stato presentato come una verifica nell'account.

## Configurazione

- ID GA4 inserito nell'unico file `assets/measurement-config.js`.
- Google Ads resta non configurato: `adsId` e `adsLeadLabel` vuoti. Nessuna campagna, spesa, remarketing o conversione diretta Ads attivata.
- Consent Mode base: nessuno script o evento Google prima del consenso alle statistiche; rifiuto e revoca rispettati.
- Versione delle preferenze portata a 2 per richiedere una nuova scelta quando il servizio diventa disponibile. Preferenze della configurazione inattiva non riutilizzate come consenso.
- Riferimento alla configurazione aggiornato con cache-busting in homepage, landing e informativa.
- Informativa aggiornata per descrivere Analytics, consenso, cookie e fornitori effettivi. Nessuna garanzia legale di conformità totale.
- Codice di misurazione, CSS, immagini, foto, contenuti della landing 17.6, prezzi, recensioni e backend restano invariati.

## Verifiche del candidato

Branch `ga4-activation-20260917`, candidato `42795c309b99159053f211b8b23ddd809ce7f16a`.
Workflow `35213841948`, success; artifact `10494247820`.

**11/11 test isolati** esistenti e **51/51 controlli browser** superati, con il tag Google reale e richieste di raccolta intercettate:

- blocco iniziale e rifiuto persistente su homepage, landing e privacy;
- un solo page_view dopo consenso, destinazione corretta, parametri di campagna ammessi e assenza dei dati personali di test negli eventi;
- cookie Analytics soltanto dopo consenso, nessun cookie pubblicitario;
- invio del modulo simulato: un generate_lead soltanto dopo risposta positiva simulata; WhatsApp resta contact_click;
- revoca, rimozione cookie e nessun caricamento successivo del tag;
- nuovo consenso per preferenze di versione precedente;
- dialogo, immagini e assenza di overflow verificati a 320, 390, 768, 1366 e 1920 pixel; screenshot mobile/desktop esaminati.

I test del modulo non hanno inviato email vere. I test del candidato non hanno inviato eventi reali a Google: gli endpoint sono stati intercettati. Il parser di test gestisce correttamente i batch GA4 con più eventi in un POST.

## Verifica dopo pubblicazione

Da completare dopo il deploy: confronto dei file pubblicati con il candidato, ripetizione dei controlli di consenso e una sola visita tecnica con evento page_view inviato a Google, etichettata `utm_source=technical_check&utm_medium=qa&utm_campaign=ga4_activation`. Nessun lead fittizio deve essere inviato alla proprietà reale.

La risposta dell'endpoint di raccolta non dimostra che i report privati siano già popolati. Occorre confermare nel pannello Tempo reale del titolare o tramite una connessione autorizzata alla proprietà.

## Passaggi ancora aperti nell'account

- Confermare la prima visita nei report Tempo reale.
- Verificare conservazione dei dati della proprietà e impostazioni del servizio con il titolare; non è stata inventata una durata dell'account. La durata configurata dei cookie è distinta dalla conservazione dei report.
- Configurare generate_lead come evento chiave nell'account, senza duplicare conversioni future in Ads.
- Prova di ricezione email reale ancora subordinata all'autorizzazione esplicita già richiesta.
- Collegamento GA4–Ads, Search Console, eventuali integrazioni di reporting e campagne non ancora completati. Non dichiararli attivi solo perché è stato installato GA4.
