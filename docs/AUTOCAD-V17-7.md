# AutoCAD 17.7 — invito ai servizi CAD/BIM, render e interior design

19 settembre 2026. Landing: https://andreagiaquinto.it/lezioni-autocad/#servizi-progetto

## Intervento pubblicato

Inserita una sezione dopo il modulo delle lezioni e prima del footer. Il messaggio «La tua idea merita di prendere forma» invita a richiedere disegni CAD, modelli BIM, render e proposte di interior design, partendo da idee, schizzi, bozze, foto, disegni, PDF e altri elaborati. Il testo rimane in HTML. Immagine e pulsante conducono entrambi alla homepage dei servizi, ora attiva.

La lavorazione da nuvole di punti risulta temporaneamente sospesa nella pagina di destinazione e nelle regole correnti del repository. Non è quindi presentata nel testo promozionale come disponibile. La homepage e il suo modulo non sono stati modificati da questo intervento.

Rimossa dal footer la dicitura obsoleta «Servizi CAD/BIM attualmente in preparazione». La CTA mobile delle lezioni si nasconde quando la nuova sezione è visibile. I due collegamenti usano gli eventi CTA già esistenti (`services_visual`, `services_footer`); i clic non diventano invii o conversioni lead. La configurazione Google corrente è stata preservata.

## Visual

Creazione tramite generatore di immagini integrato, modalità nuova immagine. Illustrazione promozionale originale, non fotografia di un lavoro consegnato né schermata del software.

Brief di generazione: composizione professionale in formato 3:2 con un unico ambiente residenziale coerente che evolve da linee CAD ciano e geometria tecnica a modello BIM chiaro e ambiente arredato fotorealistico; schizzi, planimetria e riferimenti fotografici in primo piano; fondo blu notte, luce calda, legno, tessuti chiari e materiali naturali. Nessun testo, logo, interfaccia o pulsante incorporato.

Asset di progetto: `lezioni-autocad/assets/servizi-cad-bim-interior-{640,960,1440}.{avif,webp}`. Sei varianti responsive, senza ritagli della composizione. AVIF circa 33/70/136 kB; WebP circa 69/145/294 kB. Caricamento differito, dimensioni esplicite e testo alternativo descrittivo. Nessun preload aggiuntivo.

## Verifiche eseguite

- Pubblicazione del banner: commit `14997f73a18c0f05e0ce689e44d4d21bef419427`, distribuzione GitHub Pages completata con successo; build osservata nel browser `20260919-autocad-v17.7`.
- Clic effettivo sul pulsante: destinazione verificata `https://andreagiaquinto.it/`.
- 13 viewport CSS: 320, 360, 375, 390, 412, 430, 600, 768, 800, 1024, 1366, 1440 e 1920 px. Nessun overflow orizzontale del documento; immagine del banner caricata. La verifica usa una cornice della larghezza indicata; la barra di scorrimento desktop occupa 15 px.
- Screenshot osservati per smartphone a 320 e 390 px, tablet a 768 px, desktop a 1440 px e pagina autonoma a 1363 px. Immagine intera nel layout, testo e CTA adattati alla larghezza; la sezione può richiedere scorrimento verticale sui dispositivi piccoli.
- Sticky delle lezioni nascosta mentre il banner è visibile su mobile.
- Completata la verifica del visualizzatore dei tre disegni introdotto nella versione 17.5: apertura delle tre immagini; adattamento iniziale senza overflow su mobile; zoom a 1200 px con scorrimento interno; ritorno alla vista adattata; chiusura con pulsante ed Escape; focus restituito al collegamento di apertura dopo Escape.
- `npm test`: 11 test esistenti superati, inclusi consenso, deduplicazione e conferma del modulo solo dopo successo del server. Nessun invio reale effettuato.
- Controllo sintassi JavaScript, `git diff --check`, riferimenti agli asset e collegamenti: superati.
- Pagina temporanea `qa/autocad-v17-5.html` rimossa al termine delle verifiche.

## Limiti della verifica

Questo intervento verifica il nuovo banner e le interazioni citate. Non costituisce un collaudo end-to-end della ricezione email, delle conversioni nell'account Google Ads o dei Core Web Vitals sul campo. Nessun account, budget o campagna è stato modificato.
