# Revisione landing AutoCAD — versione 17

## Baseline verificata

Repository `andreagiaqui-83/andreagiaqui-83.github.io`, ramo `main`, commit iniziale `11abfd9129f037e5a327441aaf3cf3d43e5422b2`. Browser reale: `https://andreagiaquinto.it/lezioni-autocad/`, build `20260916-autocad-v16`. Cronologia del repository esaminata dalle prime lezioni alla v16. Recuperate le decisioni della conversazione precedente: separazione dalla homepage, foto Andrea, recensioni AutoCAD autentiche, nomi abbreviati, approvazione/eliminazione interna, preferenza AutoCAD italiano 2027, centratura e responsive.

La homepage è una pagina temporanea «in costruzione», servizi CAD/BIM non attivi. Contenuto, stile e stato mantenuti; uniche aggiunte: caricamento del sistema consenso/misurazione condiviso e link privacy/preferenze. CNAME `andreagiaquinto.it` invariato. Nessun account Google verificato né ID trovato nel codice attuale.

## Problemi trovati

- Hero v16: foto sorgente 240×240 ingrandita e tagliata a oltre 430 px di altezza; miniatura CAD 500×205 in un grande riquadro vuoto; menu mobile visibile anche desktop; larghezze minime rigide.
- Ripetizioni fra metodo, vantaggi, pubblico, esami, prezzi; moduli molto lontani dall'inizio. Footer promuoveva servizi temporaneamente inattivi con un'immagine diversa dal riferimento richiesto.
- Landing assente dalla sitemap; Open Graph senza immagine; nessuna pagina privacy nonostante il checkbox ne chiedesse la lettura.
- Due asset della landing non decodificabili con Pillow: `autocad_planimetria.webp` e `dal-progetto-alla-casa-reale.webp`. Nella homepage archiviata esistono inoltre altri WebP precedenti non decodificabili, non utilizzati dall'attuale pagina di manutenzione: non modificati perché fuori dall'uso attuale.
- CSS e JS esterni obsoleti non più richiamati, con testi e comportamenti precedenti. L'attuale JS inline non ricaricava dal backend le nuove recensioni approvate.
- Modulo lezioni collegato al generico preventivo CAD/Revit; nessun tracking conversioni; mancavano validazioni server specifiche e idempotenza lezioni.
- Link email di approvazione/rimozione recensioni modificavano dati con GET, vulnerabili a scansioni automatiche dei link.

## Modifiche

- Conservata l'identità navy/ciano. Nuovo banner orizzontale su desktop, copy prima delle immagini su mobile, foto originale a 64–72 px, H1 esplicito AutoCAD e testo introduttivo 2D/3D online individuale.
- Offerta invariata: prima sessione gratuita di 30 minuti, poi 15 €/ora. Mostrate insieme nella hero; dettaglio unico nella sezione prezzi. CTA chiede il contatto, senza fingere una prenotazione già confermata.
- Programma 2D/layout/3D, metodo pratico in tre passaggi, destinatari compatti, recensioni originali mantenute integralmente, FAQ sintetiche. AutoCAD italiano 2027 suggerito e altre versioni italiane/inglesi ammesse; chiarimento LT/3D.
- Modulo ridotto a nome, email e obiettivo facoltativo; feedback accessibile, errori con dati conservati, timeout, identificativo persistente fra retry nella pagina, blocco doppio invio. Email server con oggetto dedicato alle lezioni.
- Recensioni caricate solo dopo approvazione, filtrate per formazione, costruite con textContent. API pubblica restituisce solo campi pubblici e Nome C. I link di gestione richiedono conferma POST firmata.
- Endpoint lezioni separato con validazione, honeypot, limite di tentativi, HTML email escapato, idempotenza Resend. Pulizia server lezioni 30 giorni, rate limit 2 giorni, contributi non pubblicati 90 giorni.
- CSS/JS separati e specifici. Rimossi dieci file obsoleti della landing, recuperabili dalla cronologia Git. Nessuna libreria frontend, font esterno o widget social.
- Focus visibile, menu con Escape e stato aria coerente, etichette moduli, status live, riduzione movimento, immagini dimensionate, carosello a pagina con una recensione su mobile, sticky CTA nascosta durante compilazione/contatti/dialogo cookie.
- Title, description, canonical, Open Graph/Twitter con JPEG social 1200×630; Person, Service con prezzo orario, WebSite, WebPage, BreadcrumbList. Nessuna recensione o valutazione inventata, nessun Course artificiale con certificato o durata fittizia.
- Sitemap estesa a landing e privacy, 404 dedicata. Contenuti leggibili nel markup anche senza JS; dati coerenti per motori e sistemi IA, senza tecniche speciali o garanzie di comparsa.
- Sistema dominio-wide di consenso v2 base e misurazione predisposto ma inattivo (ID vuoti). Rifiuto e accettazione accessibili, categorie separate, revoca, nessun invio PII nei tag. Scelta gtag diretto; GTM valutato e piano alternativo documentato, non aggiunto in parallelo.

## Immagini

| Asset | Intervento |
|---|---|
| Foto Andrea | Originale mantenuto, ridotta l'esposizione per evitare sgranatura |
| Hero 2D/3D | Nuova illustrazione architettonica raster generata, senza interfacce false; AVIF/WebP 480/800/1200 |
| Pianta e impaginazione | Due schemi didattici vettoriali precisi, dichiarati illustrativi; nessuna finta schermata software |
| Dal progetto CAD al render architettonico | Recuperato PNG originale dal materiale precedente; migliorato con image editing, rimosse interfacce fittizie, preservata composizione; AVIF/WebP 640/1200/1672, immagine intera su mobile |
| Condivisione social | Nuovo visual derivato con offerta e foto, JPEG 1200×630, testo verificato |
| Vecchie miniature | Rimosse dall'uso pubblico e dal ramo corrente insieme agli asset danneggiati; storia Git conservata |

Immagini concettuali dichiarate, non presentate come progetti o schermate reali di Andrea. Il rendering è contestualizzato come applicazione successiva, non un servizio aggiunto al corso.

Generazione con strumento immagini integrato. Prompt hero: illustrazione editoriale premium, singola casa credibile in assonometria, transizione da wireframe ciano a volumi, palette navy, nessun testo/interfaccia/logo. Prompt recupero: preservare planimetria/modello/render e palette dell'originale; togliere tutti i menu, toolbar e icone fittizie; aumentare nitidezza. Prompt social: riuso hero e ritratto originale, testo «AutoCAD, su misura per te», lezioni individuali online 2D/3D e prezzo reale.

## Verifiche automatiche prima della pubblicazione

- 6 test server: validazione/consenso/honeypot, successo/escaping/idempotenza, errore provider e retry, limite tentativi, isolamento recensioni, GET gestione non mutante.
- 5 test frontend in DOM isolato: nessuna raccolta senza ID, caricamento dopo consenso e pageview unico, rifiuto, deduplicazione lead, invio fallito e retry senza falso lead.
- Parsing di HTML e JSON-LD, un H1 per pagina, ID unici, link e frammenti locali esistenti, dimensioni/ALT delle immagini, sitemap XML valida.
- Sintassi JS verificata. I test non spediscono email reali e non contattano Google.

## Verifiche live

Da integrare dopo pubblicazione con misure responsive e controllo visivo. Le misure di laboratorio non equivalgono a Core Web Vitals sul campo. GO/NO-GO Ads iniziale: **NO-GO**, in attesa di collegamento Google e verifica della ricezione reale nella casella.

Per eventi, attivazione, Search Console, gruppi annunci e roadmap A/B vedere `AUTOCAD-GOOGLE-ADS.md`.
