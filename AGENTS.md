# Regole permanenti per il sito

Le modifiche richieste dall’utente devono conservare e sviluppare tutte le ottimizzazioni già implementate: SEO, coerenza con le campagne Google Ads, conversioni e consenso, prestazioni, accessibilità e impaginazione responsive da PC a tablet e smartphone. Controllare grafica, grammatica, ortografia e sintassi dei testi italiani.

- La homepage è la landing dei servizi; `/lezioni-autocad/` è una landing separata, con istruzioni proprie. Conservare collegamenti, ancore usate negli annunci, parametri di attribuzione e distinzione degli eventi di conversione.
- Per i servizi, `service_quote_success` scatta solo dopo l’invio riuscito. Non alterare raccolta del consenso o protezione dei dati nei tracciamenti.
- Mantenere sempre visibili la posizione dell’immobile (indirizzo e coordinate, senza campo Google Maps/Earth) e il modulo recensioni. Le specifiche CAD/BIM compaiono sotto i servizi quando si seleziona AutoCAD 2D, AutoCAD 3D o Revit/BIM. Allegati e dettagli restano facoltativi. I template sono stati spostati sotto la selezione servizi su richiesta dell’utente: mostrarli soltanto per AutoCAD 2D/3D o Revit/BIM, con i relativi campi facoltativi.
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
- Dopo aggiunte o aggiornamenti eseguire `node scripts/sync-page-navigation.cjs` e `node scripts/sync-site-footer.cjs`; registrare tutte le nuove pagine HTML, escluse soltanto verifiche di proprietà e frammenti di template. I test devono essere superati prima della pubblicazione; ogni pagina secondaria deve avere una destinazione di ritorno valida.
- Home: render e planimetrie commerciali si rivolgono anche ad agenzie, property manager, proprietari, imprese e piccoli studi. Preservare gli altri servizi tecnici, i quattro stili e la quinta proposta. Le nuove preferenze visuali usano il contratto esistente `Render_viste[]`: non modificare nomi/ID o backend senza necessità.

## Richieste guidate — aggiornamento del 30 settembre 2026
- Dal carosello recensioni della home, il link «Lascia la tua recensione» porta a `#lascia-recensione`, senza invii né eventi lead.
- Specifiche CAD/BIM: mantenere `Indicazioni_output`, con istruzioni pertinenti alle selezioni attive; template esistenti conservati subito dopo.
- «Altro» nei render apre `Render_personalizzato`; Disegno meccanico apre `Indicazioni_disegno_meccanico`; «Altro / da valutare» apre `Richiesta_personalizzata`. Ogni nuovo testo è facoltativo, massimo 3000 caratteri, validato anche dal backend.
- Nascondere e disabilitare i campi inattivi senza cancellarne il testo nella pagina; riattivarli con le scelte precedenti. Nessun autofocus al cambio servizio; ripristino dopo errore e azzeramento solo dopo invio confermato.
- Il breadcrumb «Home / Lezioni AutoCAD» precede il titolo delle lezioni. Il collegamento Home deve funzionare anche senza JavaScript.

## DOCFA e navigazione Home — 30 settembre 2026
- Planimetrie DOCFA apre `docfaPreferences` con il campo `Indicazioni_planimetria_DOCFA`: facoltativo, massimo 3000 caratteri, validato e trasmesso soltanto per il servizio attivo. Conservazione temporanea in pagina, esclusione quando deselezionato, reset soltanto dopo invio riuscito. Nessun dato catastale nei tracciamenti.
- Il servizio DOCFA è supporto grafico al professionista, non una pratica completa con firma e presentazione. Chiedere dati identificativi, rilievo e riferimenti pertinenti, senza richiedere credenziali o documenti d’identità. Per testi e aggiornamenti consultare le fonti annotate in `.github/DOCFA-CONTENT-SOURCES.md`.
- Home e ritorni alle pagine di riferimento usano la medesima classe `page-back-button` in `assets/site-footer.css`; niente varianti locali concorrenti in CSS delle lezioni o dei plugin. I collegamenti Home sono marcati `data-home-link` e generati da `sync-page-navigation.cjs`. Guide e report conservano il collegamento al proprio plugin o pagina madre.

## Struttura del sito — 3 ottobre 2026
- Navigazione globale statica tramite `scripts/sync-site-header.cjs`, con 8 destinazioni. Conservare navigazione locale e landing distinte. Eseguire i tre sincronizzatori (ritorni, footer, header) e controllare anche senza JavaScript.
- AG CAD Tools 2.0 sostituisce la landing Express Tools; URL precedente mantenuto con collegamento al nuovo progetto e canonical coerente. Archivio Express non promosso per download correnti. La chiave backend `express-tools` conserva la bacheca storica sotto il nome AG CAD Tools.
- BlockHub CAD resta in aggiornamento senza download fino a rilascio autorizzato. Contatti ha endpoint privato `/api/contact`, distinto da preventivi e lezioni, senza conversioni commerciali. Proposte con link passano dal modulo privato; i commenti pubblici restano moderati.
- Portfolio web e PDF mostrano chiaramente lo stato di aggiornamento; non inserire progetti fittizi. Recensioni approvate ordinate dalla più recente; date non fornite e voti non vanno inventati. Vincenzo G. è una testimonianza sulle lezioni, non sui servizi CAD.
- Tariffe CAD 0,20 e 0,30 €/m² lordo per piano trattabili secondo fabbricato, anche al ribasso. Render e piante Interior Design a partire da 10 € per elaborato; numero, complessità e altre attività concordati nel preventivo. FAQ visibili e JSON-LD allineati.

## Superfici per il Preventivo online — 4 ottobre 2026
- Tutti i calcoli basati sui metri quadrati usano la **superficie lorda complessiva dei piani effettivamente interessati dall'incarico**, già sommata tra i piani e misurata al lordo delle murature. Non moltiplicare mai nuovamente tale valore per il numero dei piani.
- Dalla superficie lorda vanno esclusi balconi, terrazzi, cortili, giardini, aree esterne, porticati o logge aperte e altre pertinenze/accessori esterni, salvo che siano essi stessi oggetto della lavorazione richiesta. Eventuali opere esterne restano richieste distinte e non devono alterare la superficie lorda dei piani.
