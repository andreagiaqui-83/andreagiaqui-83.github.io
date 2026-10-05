# Regole permanenti per il sito

Le modifiche richieste dall’utente devono conservare e sviluppare tutte le ottimizzazioni già implementate: SEO, coerenza con le campagne Google Ads, conversioni e consenso, prestazioni, accessibilità e impaginazione responsive da PC a tablet e smartphone. Controllare grafica, grammatica, ortografia e sintassi dei testi italiani.

- La homepage è la landing dei servizi; `/lezioni-autocad/` è una landing separata, con istruzioni proprie. Conservare collegamenti, ancore usate negli annunci, parametri di attribuzione e distinzione degli eventi di conversione.
- Per i servizi, `service_quote_success` scatta solo dopo l’invio riuscito. Non alterare raccolta del consenso o protezione dei dati nei tracciamenti.
- Nel Preventivo online, per gli edifici e in particolare per le nuvole di punti, sono ammessi indirizzo fisico, coordinate geografiche e link Google Maps/Google Earth; restano facoltativi e non vanno inviati ai sistemi di misurazione. Nel modulo storico mantenuto solo per compatibilità preservare i contratti esistenti. Allegati e dettagli restano facoltativi.
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
- Ogni pagina pubblica resta registrata in `scripts/site-pages.json`. Le landing secondarie usano il menu globale e non mostrano più il pulsante/breadcrumb Home ridondante. La direttiva finale del 4 ottobre rimuove anche i ritorni di guide e rapporti: usare il menu globale statico, senza `history.back()` o referrer.
- Dopo aggiunte o aggiornamenti eseguire `node scripts/sync-page-navigation.cjs` e `node scripts/sync-site-footer.cjs`; registrare tutte le nuove pagine HTML, escluse soltanto verifiche di proprietà e frammenti di template. I test devono essere superati prima della pubblicazione; ogni pagina deve avere le dieci destinazioni globali valide e nessun pulsante di ritorno ridondante.
- Home: render e planimetrie commerciali si rivolgono anche ad agenzie, property manager, proprietari, imprese e piccoli studi. Preservare gli altri servizi tecnici, i quattro stili e la quinta proposta. Le nuove preferenze visuali usano il contratto esistente `Render_viste[]`: non modificare nomi/ID o backend senza necessità.

## Richieste guidate — aggiornamento del 30 settembre 2026
- Dal carosello recensioni della home, il link «Lascia la tua recensione» porta a `#lascia-recensione`, senza invii né eventi lead.
- Specifiche CAD/BIM: mantenere `Indicazioni_output`, con istruzioni pertinenti alle selezioni attive; template esistenti conservati subito dopo.
- «Altro» nei render apre `Render_personalizzato`; Disegno meccanico apre `Indicazioni_disegno_meccanico`; «Altro / da valutare» apre `Richiesta_personalizzata`. Ogni nuovo testo è facoltativo, massimo 3000 caratteri, validato anche dal backend.
- Nascondere e disabilitare i campi inattivi senza cancellarne il testo nella pagina; riattivarli con le scelte precedenti. Nessun autofocus al cambio servizio; ripristino dopo errore e azzeramento solo dopo invio confermato.
- La landing Lezioni AutoCAD non usa più il breadcrumb «Home / Lezioni AutoCAD»: la navigazione avviene tramite l’header globale statico, disponibile anche senza JavaScript.

## DOCFA e navigazione Home — 30 settembre 2026
- Planimetrie DOCFA apre `docfaPreferences` con il campo `Indicazioni_planimetria_DOCFA`: facoltativo, massimo 3000 caratteri, validato e trasmesso soltanto per il servizio attivo. Conservazione temporanea in pagina, esclusione quando deselezionato, reset soltanto dopo invio riuscito. Nessun dato catastale nei tracciamenti.
- Il servizio DOCFA è supporto grafico al professionista, non una pratica completa con firma e presentazione. Chiedere dati identificativi, rilievo e riferimenti pertinenti, senza richiedere credenziali o documenti d’identità. Per testi e aggiornamenti consultare le fonti annotate in `.github/DOCFA-CONTENT-SOURCES.md`.
- Le landing non mostrano pulsanti Home aggiuntivi. `sync-page-navigation.cjs` rimuove i breadcrumb Home dalle landing; guide e report usano anch’essi il menu globale senza ritorni aggiuntivi. Non introdurre varianti locali concorrenti.

## Struttura del sito — 3 ottobre 2026
- Navigazione globale statica tramite `scripts/sync-site-header.cjs`, con 10 destinazioni, inclusi Preventivo online e Disegnatore online. Sulle landing il menu globale è il riferimento principale; evitare header duplicati visibili. Eseguire i tre sincronizzatori (ritorni, footer, header) e controllare anche senza JavaScript.
- AG CAD Tools 2.0 sostituisce la landing Express Tools; URL precedente mantenuto con collegamento al nuovo progetto e canonical coerente. Archivio Express non promosso per download correnti. La chiave backend `express-tools` conserva la bacheca storica sotto il nome AG CAD Tools.
- BlockHub CAD resta in aggiornamento senza download fino a rilascio autorizzato. Contatti ha endpoint privato `/api/contact`, distinto da preventivi e lezioni, senza conversioni commerciali. Proposte con link passano dal modulo privato; i commenti pubblici restano moderati.
- Portfolio web e PDF mostrano chiaramente lo stato di aggiornamento; non inserire progetti fittizi. Recensioni approvate ordinate dalla più recente; date non fornite e voti non vanno inventati. Vincenzo G. è una testimonianza sulle lezioni, non sui servizi CAD.
- Tariffe CAD 0,20 e 0,30 €/m² lordo complessivo dei piani trattabili secondo fabbricato, anche al ribasso. Render e piante Interior Design a partire da 10 € per elaborato; numero, complessità e altre attività concordati nel preventivo. FAQ visibili e JSON-LD allineati.

## Superfici per il Preventivo online — 4 ottobre 2026
- Tutti i calcoli basati sui metri quadrati usano la **superficie lorda complessiva dei piani effettivamente interessati dall'incarico**, già sommata tra i piani e misurata al lordo delle murature. Non moltiplicare mai nuovamente tale valore per il numero dei piani.
- Dalla superficie lorda vanno esclusi balconi, terrazzi, cortili, giardini, aree esterne, porticati o logge aperte e altre pertinenze/accessori esterni, salvo che siano essi stessi oggetto della lavorazione richiesta. Eventuali opere esterne restano richieste distinte e non devono alterare la superficie lorda dei piani.

## Navigazione e portfolio — 4 ottobre 2026
- Sulla homepage deve essere visibile un solo header/menu principale. L'eventuale header locale storico non deve comparire né creare un secondo menu su smartphone; la homepage non contiene più il vecchio `topbar` locale.
- Su smartphone il menu globale si apre come pannello verticale a larghezza utile, con scorrimento interno se necessario, chiusura su link/Escape/click esterno e blocco dello scroll della pagina durante l'apertura.
- Le landing secondarie non mostrano pulsanti/breadcrumb Home ridondanti. Anche guide e report non mostrano ritorni aggiuntivi alla pagina madre.
- Nella home, «Strumenti per il tuo AutoCAD» è una sezione visivamente separata dal portfolio, con titolo più grande, margine superiore e separatore dedicato.

## Backend Preventivo online — 4 ottobre 2026
- La pagina `/preventivo/` usa esclusivamente il Worker esistente `cad-bim-preventivi.andrea-giaqui.workers.dev`: sessione firmata, token, upload a `/api/upload/{sessionId}` e invio a `/api/submit`. Non introdurre endpoint paralleli non verificati.
- Il backend accetta sia i valori storici di `Output[]` sia i servizi del nuovo preventivatore (CAD 2D/3D, Revit/BIM, Scan to CAD/BIM, computi, DOCFA, meccanica, planimetrie commerciali/3D, render, virtual staging, Interior Design, video/walkthrough e Altro).
- `service_quote_success` può essere emesso anche dalla pagina `preventivo`, ma soltanto dopo una risposta positiva del backend con requestId UUID; nessun dato personale, importo o contenuto dei campi va inviato a GA4.
- La copia email al cliente è facoltativa e viene tentata soltanto se richiesta; un eventuale errore della copia non deve invalidare la richiesta principale. La UI deve mostrare un fallback onesto alla copia stampabile/PDF.
- La copia stampabile della stima resta informativa, con filigrana e disclaimer; non è un preventivo definitivo né un documento da firmare o accettare.

## Revisione finale cumulativa — 4 ottobre 2026
- Ordine unico di header e footer: Servizi, Preventivo online, Disegnatore online, Lezioni AutoCAD, YQArch Italiano, AG CAD Tools, BlockHub CAD, Portfolio, Recensioni, Contatti. L'HTML resta utilizzabile senza JavaScript. Mobile: pannello scorrevole, Escape/link/esterno chiudono, focus visibile.
- La home mantiene prezzi iniziali sintetici, trattabilità anche al ribasso e rinvio al Preventivo; la nuova landing `/disegnatore-online/` presenta la collaborazione esterna con responsabilità e confini chiari. PDF tecnici gratuiti; catalogo distinto.
- Nessun controllo Home/Torna/breadcrumb in landing, guide e report. Eseguire i sincronizzatori navigazione, header e footer; devono essere idempotenti anche con `--check`. Aggiornare i checksum dei documenti web senza modificare gli archivi software.
- Il preventivatore conserva la configurazione economica. Testare formule singole, combinazioni, minimi, Scan, computi, catalogo, fallback manuale e invio. Escludere i campi inattivi, preservare valori al cambio, congelare il payload durante invio/retry; una conferma incompleta non è successo.
- Nuvole, localizzazione facoltativa e catalogo devono essere effettivamente visibili quando pertinenti. Non usare una regola CSS generale che nasconda tutte le schede dettagli. Il PDF stampa riferimento, dati principali, filigrana e limiti; non è un'offerta firmabile.
- La Ribbon AG è lo screenshot originale PNG fornito dall'utente; nessuna interfaccia inventata. Recensioni: visual di contesto senza clienti, stelle o testimonianze fittizie. Contatti: piccolo ritratto reale, collaborazione online in Italia, senza affermazioni territoriali.
- Il sito pubblico non usa Gmail API. La policy dell'app privata CAD/BIM JobMailer è separata in `/cad-bim-job-mailer/privacy/`, `noindex,nofollow`, esclusa da sitemap e menu. Il vecchio deep link privacy con hash resta compatibile.
- Per questa revisione verificare Chromium, Firefox e WebKit alle larghezze 320, 360, 375, 390, 393, 412, 430, 600, 768, 820, 1024, 1366, 1440, 1920 (800 e 1280 aggiuntive). Nessun invio reale nei test. Pubblicare solo dopo CI pertinente verde e verificare i file online.

- Associazione dei profili Maps confermata dall'utente il 4 ottobre 2026: `https://share.google/jGcqtu9IW1WccgA6V` = Locate Varesino (CO); `https://share.google/w1R3HKoVL3Cqr5KmB` = Cosenza (CS). Nel footer ordine Cosenza, poi Locate Varesino, con etichette complete «Vedi il mio profilo Google Maps di …». Non dedurre le zone operative dai profili.
