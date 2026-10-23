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

## Direttiva prevalente — 7 ottobre 2026
- Il menu globale raggruppa YQArch Italiano, AG CAD Tools e BlockHub CAD in un’unica voce «Plugin per AutoCAD», con sottomenu accessibile anche senza JavaScript. Le dieci destinazioni restano presenti; nel footer possono rimanere link diretti.
- Eliminare i due profili Google Maps da tutti i footer. Mantenerli soltanto nel contenuto della pagina Contatti, invertiti su esplicita correzione dell’utente: `https://share.google/jGcqtu9IW1WccgA6V` = Cosenza (CS); `https://share.google/w1R3HKoVL3Cqr5KmB` = Locate Varesino (CO). Questa associazione sostituisce quella errata del 4 ottobre.
- Pubblicazione autorizzata di BlockHub CAD 1.23 definitiva BH-123-FINALE, installer approvato byte-identico. Aggiornare landing, homepage, FAQ, dati strutturati e manifest con download attivo; non pubblicare candidature AG CAD Tools non approvate.

## Preventivi e digitalizzazione CAD/BIM — 10 ottobre 2026
- La pagina Preventivo offre subito due percorsi: contatto diretto per un preventivo personalizzato, con email e WhatsApp visibili, oppure simulazione indicativa nel modulo sottostante. Conservare recapiti, consenso e distinzione fra clic di contatto e invio riuscito.
- La homepage presenta il servizio da carta, PDF e immagini a DWG/DXF AutoCAD e RVT Revit prima della sezione nuvole di punti. Ridisegno CAD e modellazione BIM sono lavorazioni concordate sui dati disponibili, senza promessa di conversione automatica o precisione indipendente dai materiali.
- Immagini pertinenti ottimizzate per dispositivo, didascalie descrittive e testo alternativo. Non presentare i visual come progetti consegnati o schermate software reali. Tariffe, formule, campi, endpoint, plugin e navigazione restano invariati.

## Ribbon AG CAD Tools — 11 ottobre 2026
- Nella pagina AG CAD Tools non mostrare mai la dicitura della versione didattica/non commerciale presente nella barra del titolo dello screenshot sorgente. Presentare soltanto la scheda Ribbon e i comandi autentici, escludendo barra del titolo, menu superiore e area di disegno.
- Anche la vista ingrandita deve usare lo stesso ritaglio, senza collegamenti o file pubblici che aprano lo screenshot integrale. La risorsa SVG autonoma mantiene il ritaglio anche quando viene aperta direttamente; lo screenshot sorgente completo resta recuperabile nella storia Git. Conservare icone, etichette e proporzioni originali; niente ricostruzioni dell’interfaccia. Ingrandimento e scorrimento devono funzionare anche senza JavaScript.

## Direttiva prevalente del 15 ottobre 2026 — pagina unica e richiesta semplice
Questa direttiva esplicita di Andrea sostituisce le indicazioni storiche incompatibili sopra.
- Una sola landing plugin: `/ag-cad-tools/`, voce globale esatta «Plugin AG CAD Tools». Header/footer hanno otto destinazioni dirette. Le vecchie landing YQArch, BlockHub e Express sono ponti noindex verso le sezioni pertinenti, con canonical della pagina unica; mantenere archivi e URL storici senza promuoverli come release correnti.
- Pubblicare soltanto l’installer AG CAD Tools 2.2 approvato dall’autore: 51.700.736 byte, SHA256 `42f7cc51d4ef4bbf1931bd08bbfe64e33e41e7142c987b2fbe7c40d1737192c3`. Non ricompilarlo o modificarlo. Include BlockHub (solo questo nome nelle prose attuali), 219 strumenti AG, 2 servizi e 20 accessi a comandi nativi (241 schede), 16 categorie AG più BlockHub. La nuova Ribbon autentica include BlockHub e non contiene la barra del titolo educativa.
- BlockHub: 4.029 asset con anteprime, inclusi 153 blocchi dinamici; non chiamare dinamica l’intera libreria. YQArch è spiegato soltanto come riferimento della futura integrazione di funzioni analoghe indipendenti: non è incluso nella 2.2. Il repertorio Express Tools è riproposto con implementazioni AG proprie, non componenti Autodesk né garanzia di identica implementazione in ogni caso.
- Compatibilità dichiarata AutoCAD completo Windows x64 2024–2027. Riferimento verificato dall’autore: 2027 italiano/Windows 11. Non estendere la prova a tutte le versioni, lingue o funzioni. La copia web della guida può aggiornare nome/stato di pubblicazione; preservare schede, limiti e licenze. Sincronizzare gli hash con `sync-download-checksums.cjs` (file corrente 2.2).
- Render e Interior Design: da 0,10 €/m² di superficie lorda complessiva. Restano le tariffe CAD 0,20/0,30 e le regole della superficie complessiva (nessuna moltiplicazione ulteriore per piani). Non estendere la tariffa render a video o altre prestazioni.
- `/preventivo/`: mantenere il riquadro blu e i contatti diretti, sostituire il simulatore con un solo modulo: selezione multipla elaborati, file di qualsiasi formato pertinente, link cloud, note e recapiti. Nome/email/consenso e almeno un elaborato obbligatori; materiale, telefono e note facoltativi. Andrea risponde via email con preventivo personalizzato. Nessun calcolo/stima automatica nel nuovo percorso.
- Preservare sessione firmata, upload privato con dimensione reale, 90 MiB/file e 500 MiB totali, idempotenza e UUID di conferma; ammettere anche formati nuvola di punti entro i limiti, consigliando cloud per materiale grande. Mantenere compatibilità del backend con moduli storici, distinguendo la copia email della richiesta dalla vecchia stima automatica. Solo conferma positiva con UUID atteso genera `service_quote_success`; niente dati personali/materiali nei tracciamenti.
- Disegnatore online: titolo «I vantaggi del disegnatore online», vantaggi economici e lavoro remoto, documentazione fiscale secondo regime applicabile senza inventare partita IVA o regime. Email e WhatsApp con pulsanti accessibili.
- Recensioni: carosello compatto, tutte le testimonianze conservate, approvate più recenti prima; non inventare date. Modulo recensioni sempre disponibile e separato dalle conversioni commerciali.

## Revisione dei contenuti — 15 ottobre 2026, seconda richiesta
- Home: mantenere soltanto i quattro riquadri prezzo e una CTA al Preventivo nella sezione tariffe. Dettagli economici, trattabilità anche al ribasso, superficie lorda e trattamento fiscale sono nella pagina Preventivo. Le tariffe sono compensi netti indicativi; IVA, ritenute e oneri applicabili vengono distinti nel preventivo senza inventare un regime fiscale.
- Le indicazioni sui materiali da carta/PDF/immagini e sulle nuvole di punti sono sintetiche in home e complete nel Preventivo, visibili al selezionare degli elaborati pertinenti. Nessun nuovo campo obbligatorio o passaggio: indirizzo/coordinate e riferimenti restano facoltativi nelle note.
- Disegnatore online include l’invito a chi usa altri software CAD/BIM, con formati di interscambio e limiti concordati. Ambiti ed elaborati sempre espansi e non richiudibili. CTA finale con tre pulsanti di uguale dimensione: preventivo, Email e WhatsApp, affiancati su desktop e adattati su mobile.
- AG significa Andrea Giaquinto. Spiegare in linguaggio semplice la licenza MIT e il suo perimetro limitato ai componenti identificati. Visual installer 2.2 originale dal pacchetto verifiche della release, senza modifiche all’interfaccia o all’EXE.
- Contatti: certificazione personale dichiarata dall’utente Autodesk Certified User (ACU) per AutoCAD; non estenderla a Revit/BIM. Dopo le FAQ, sezione Sostieni i miei progetti con gli stessi destinatari e controlli di copia della pagina AG CAD Tools.

## Rifiniture richieste — 16 ottobre 2026
- La voce Contatti usa lo stesso stile delle altre voci del menu, inclusi hover, focus e pagina corrente; nessuna evidenza verde dedicata.
- Home: tariffe e invito al preventivo riuniti in una sola sezione con quattro prezzi e un unico pulsante. Conservare le ancore `#tariffe` e `#modulo`, ora nello stesso blocco; nessun cambiamento a prezzi, consenso o modulo storico di compatibilità.
- Contatti: prima il profilo Google Maps di Locate Varesino (CO), poi quello di Cosenza (CS), senza cambiare associazione fra URL ed etichetta.
- Sotto il link cloud del Preventivo, promemoria sempre visibile per accompagnare la nuvola di punti con foto interne/esterne, planimetrie e indirizzo fisico, se disponibili. Riferimenti facoltativi, indirizzo nelle note; nessun campo aggiuntivo o obbligo.

## Direttiva prevalente — 16 ottobre 2026, approfondimento economico
- La home mantiene quattro prezzi e il pulsante al Preventivo, aggiungendo soltanto «Costi indicativi e trattabili» e il rimando «Perché conviene un disegnatore online?» alla sezione `/disegnatore-online/#compenso-a-progetto`.
- Nel Preventivo usare «Prezzi indicativi e trattabili», senza «anche al ribasso», con lo stesso rimando. Questa scelta sostituisce le precedenti formulazioni incompatibili; importi, superficie lorda e condizioni fiscali restano invariati.
- Disegnatore online: approfondimento dopo i vantaggi sulla convenienza del compenso a progetto rispetto alle ore, tratto dall’articolo dell’autore. Distinguere lavoro da remoto e criterio di compenso; nessuna promessa di risparmio automatico, tempi o qualità garantiti. Importo stabile per attività e condizioni definite, revisioni incluse esplicite, variazioni concordate prima dell’esecuzione. Lavoro orario utile per esigenze non ancora delimitate.
- Visual editoriale illustrativo, senza presentarlo come un progetto eseguito: varianti WebP 640/1120 px, caricamento differito e dimensioni dichiarate. Tabelle HTML e testo leggibile senza JavaScript, FAQ visibili e JSON-LD allineati.

## Direttiva prevalente — 16 ottobre 2026, convenienza del servizio di Andrea
- La pagina Disegnatore online promuove esplicitamente il servizio di Andrea da remoto e a progetto, con prezzi economici, elaborati curati e collaborazione semplice da documentare. Sostituisce il precedente confronto neutrale fra formule. Eliminare la FAQ «Un disegnatore a progetto costa sempre meno di uno a ore?» sia dal contenuto visibile sia dal JSON-LD.
- Esempio dichiarato dall’autore: casa con 3 piani da 100 m² lordi = 300 m² complessivi; 300 × 0,20 € = 60 € indicativi e trattabili secondo tipologia di edificio e incarico. Comprende nell’esempio le tre planimetrie, pianta della copertura, DWG dettagliato, layer professionali, stili testo/quote/stampa, layout, cartiglio e tavola; PDF tecnici se richiesti. La copertura non aggiunge 100 m² alla base dell’esempio.
- Confronto numerico richiesto: 3/4 ore a 25/45 €/ora danno 75/135/100/180 €. Differenza rispetto a 60 €: da 15 a 120 €, 20% nel caso 3 ore × 25 €. Presentare ore e tariffe come ipotesi esplicite, non misurazioni, media nazionale o preventivo di un concorrente. Comparare compensi sulla stessa base prima degli oneri fiscali; nessuna affermazione di superiorità qualitativa dimostrata sui concorrenti.
- Mettere in evidenza qualità concreta della consegna, standard dello studio, gestione da remoto e ricevuta/fattura secondo regime applicabile, senza inventare regime, partita IVA o detraibilità. Conservare gli attuali prezzi e le condizioni del Preventivo, formati di interscambio, ambiti sempre espansi e CTA finali uniformi.

## Misurazione e collegamenti — 22 ottobre 2026
- Consenso pubblicitario per importazione GA4 coerente tra Home servizi e Preventivo; comportamento della landing Lezioni preservato. Basic Consent Mode: nessuna richiesta Google dopo rifiuto; nessun recupero retroattivo delle interazioni precedenti al consenso.
- Nel Preventivo, `form_view` e `form_start` sono micro-eventi deduplicati con `form_id=online_quote`; soltanto conferma UUID del backend genera `service_quote_success`. `generate_lead` resta distinto per le lezioni.
- Le visite di collaudo possono usare `?ag_test=1`, opt-out dei tag Google limitato alla scheda e conservato in sessionStorage. `?ag_test=0` lo rimuove. Non classificare automaticamente come interno il traffico di Cosenza, Direct, ChatGPT o ricorrente.
- UTM soltanto nei link esterni in ingresso, mai nei collegamenti fra pagine del sito; non inserire dati personali. Guida operativa in `docs/MEASUREMENT-20261022.md`.
- Il report gratuito delle lezioni resta dedicato alla landing e alla campagna configurata. L’estensione `GA4_Site_Events` raccoglie separatamente i due lead e il funnel del Preventivo; dichiarare attiva l’automazione soltanto dopo installazione e verifica in Apps Script. Non convertire errori di lettura in zeri.
- AG CAD Tools conserva la 2.2 approvata, con indice statico compatto. Lezioni: metadati per lezioni private/ripetizioni, senza alterare prezzi o offerta.

## Direttiva prevalente — 23 ottobre 2026, distribuzione unica e metodo di lavoro
- Su richiesta esplicita dell’autore rimuovere dalla distribuzione corrente gli installer e i documenti di YQArch, BlockHub autonomo, Express Tools e AG CAD Tools 2.0. Questa scelta sostituisce le vecchie istruzioni di conservazione degli archivi pubblici. Mantenere soltanto AG CAD Tools 2.2, il suo installer byte-identico, guida, compatibilità, sostegno, mappa dei comandi e licenze pertinenti.
- Le vecchie landing restano ponti verso AG CAD Tools per non interrompere i collegamenti. Anche la vecchia guida Express rimanda alla guida attuale. Non ripubblicare i pacchetti ritirati dai vecchi commit o dai workflow storici.
- BlockHub integrato e la futura roadmap di funzioni analoghe a YQArch restano descritti nella pagina AG CAD Tools; non confonderli con download autonomi correnti.
- FAQ sul metodo nella pagina Disegnatore online: collaborazione con disegnatori esperti, prevalenza della lavorazione manuale, AutoLISP/AG CAD Tools/IA come supporto ad attività ripetitive e controllo professionale. Tempi e costo sono concordati sul materiale; non promettere CAD/BIM completi e corretti in automatico. FAQ visibili e JSON-LD coerenti.
- La rimozione dal ramo corrente e dalle release pubblicate non equivale alla cancellazione della cronologia Git. Non riscrivere la storia o eliminare repository interi durante la normale manutenzione del sito.

## Preventivo online — semplificazione del 23 ottobre 2026
- Nel blocco finale del Preventivo mostrare soltanto un collegamento graficamente evidente alla pagina Disegnatore online, dove restano spiegazione del metodo e FAQ completa. Non duplicare domanda e risposta nel Preventivo né mantenerne uno schema FAQPage senza contenuto visibile. Conservare modulo, tariffe e altre CTA.
