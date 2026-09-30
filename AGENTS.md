# Regole permanenti per il sito

Le modifiche richieste dall’utente devono conservare e sviluppare tutte le ottimizzazioni già implementate: SEO, coerenza con le campagne Google Ads, conversioni e consenso, prestazioni, accessibilità e impaginazione responsive da PC a tablet e smartphone. Controllare grafica, grammatica, ortografia e sintassi dei testi italiani.

- La homepage è la landing dei servizi; `/lezioni-autocad/` è una landing separata, con istruzioni proprie. Conservare collegamenti, ancore usate negli annunci, parametri di attribuzione e distinzione degli eventi di conversione.
- Per i servizi, `service_quote_success` scatta solo dopo l’invio riuscito. Non alterare raccolta del consenso o protezione dei dati nei tracciamenti.
- Mantenere sempre visibili la sezione “Dettagli tecnici e posizione” e il modulo recensioni. Gli allegati e i dettagli tecnici restano facoltativi. I template sono stati spostati sotto la selezione servizi su richiesta dell’utente: mostrarli soltanto per AutoCAD 2D/3D o Revit/BIM, con i relativi campi facoltativi.
- Conservare nomi/ID dei campi e contratti con il backend, salvo una modifica funzionale esplicitamente richiesta. Verificare gli invii con test simulati, senza produrre richieste o recensioni reali.
- Descrivere la compatibilità CAD/BIM con formati e versioni concordati; non promettere compatibilità universale o conservazione integrale di ogni funzione nativa. Incoraggiare materiali complementari pertinenti e disponibili, senza renderli obbligatori.
- Sincronizzare FAQ visibili e dati strutturati. Conservare canonical, metadati, gerarchia dei titoli, immagini ottimizzate e regole in `.github/SERVICES-PUBLICATION.md`.
- Prima della pubblicazione, eseguire le verifiche pertinenti già presenti e controllare le aree modificate alle larghezze desktop e mobile; verificare che i link legali siano allineati. Aggiornare build e versione CSS quando necessario.

## Footer comune e pagine dei progetti — direttiva del 27 settembre 2026
- Tutte le landing pubbliche, le guide web e le pagine di servizio usano il footer comune in `partials/site-footer.html` e `assets/site-footer.css`. Eseguire `node scripts/sync-site-footer.cjs` dopo una modifica al componente; conservare il contenuto HTML statico e i collegamenti accessibili senza JavaScript. Aggiungere al generatore le nuove pagine pubbliche.
- Identità: Andrea Giaquinto, **Disegnatore CAD e BIM**. Telefono +39 333 724 0544, email andrea.giaqui@gmail.com, WhatsApp e Facebook con icone e link verificati (nessun pulsante LinkedIn nel footer); navigazione incrociata, privacy, preferenze cookie e diritti. Non inventare recapiti, partita IVA o profili.
- Anche il modulo recensioni delle lezioni resta sempre visibile, senza riquadri richiudibili. Conservare IDs, consenso e invio separato dalle richieste di lezione.
- I visual dei plugin devono essere professionali e realistici, ottimizzati per dispositivo. Le illustrazioni non vanno presentate come schermate autentiche o lavori consegnati. Su richiesta dell’utente, usare didascalie descrittive senza diciture «illustrativa» o riferimenti all’IA. Non modificare gli installer per un intervento sul sito.
- Per SEO e ricerca IA: contenuti HTML accessibili, navigazione crawlable, canonical, sitemap e dati strutturati aderenti ai testi. Non promettere indicizzazione, citazioni o ranking; non aggiungere testo nascosto o istruzioni rivolte ai crawler.

## Continuità e navigazione — direttiva del 30 settembre 2026
- Conservare la baseline avanzata delle quattro landing e le tariffe pubblicate. Non estendere la tariffa di 10 € a video, walkthrough o pacchetti; tali attività sono concordate nel preventivo.
- Il footer non include «Seguimi su LinkedIn». Conservare gli altri contatti e i riferimenti all’identità nei dati strutturati, salvo nuova richiesta.
- Eliminare nelle didascalie «immagine illustrativa», formule equivalenti e riferimenti all’IA. Distinguere comunque stato attuale e proposta; non presentare un render come lavoro già realizzato.
- Ogni pagina secondaria, guida o rapporto deve dichiarare la pagina di riferimento in `scripts/site-pages.json` e includere pulsanti di ritorno ben visibili in alto e in basso. Usare link HTML espliciti e descrittivi, non `history.back()` o referrer non verificati.
- Dopo aggiunte o aggiornamenti eseguire `node scripts/sync-page-navigation.cjs` e `node scripts/sync-site-footer.cjs`; registrare tutte le nuove pagine HTML, escluse soltanto verifiche di proprietà e frammenti di template. I test impediscono pubblicazioni senza destinazione di ritorno.
- Home: render e planimetrie commerciali si rivolgono anche ad agenzie, property manager, proprietari, imprese e piccoli studi. Preservare gli altri servizi tecnici, i quattro stili e la quinta proposta. Le nuove preferenze visuali usano il contratto esistente `Render_viste[]`: non modificare nomi/ID o backend senza necessità.
