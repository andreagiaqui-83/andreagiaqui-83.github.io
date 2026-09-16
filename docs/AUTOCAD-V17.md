# Revisione landing AutoCAD — versione 17.2

Pubblicata il 16 settembre 2026: [apri la landing](https://andreagiaquinto.it/lezioni-autocad/). Build verificata `20260916-autocad-v17.2`. Esito campagne: **NO-GO finché non vengono collegati e collaudati Google e la consegna reale del modulo**.

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

## Verifiche live e regressione

- Pubblicazione GitHub Pages e deploy Cloudflare Worker conclusi con successo. Il browser restituisce la build 17.2 e i nuovi CSS/JS con versione nella URL, evitando il riuso dei vecchi file dalla cache.
- **13 viewport reali CSS:** 320, 360, 375, 390, 412, 430, 600, 768, 800, 1024, 1366, 1440 e 1920 px. Zero overflow orizzontali e nessuna immagine danneggiata. Screenshot osservati a tutte le larghezze; ispezioni aggiuntive di programma, prezzi, immagine centrale, modulo, recensioni e dialogo cookie.
- Ambiente Chromium: larghezze impostate in iframe dello stesso dominio; le anteprime più ampie erano ridotte solo per visualizzarle sullo schermo, dopo il rendering alla larghezza corretta. La scrollbar desktop sottraeva 15 px all'area contenuto. Non è un test su dispositivi fisici iOS/Android.
- Desktop: banner a due colonne, contenitore leggibile anche a 1920 px, menu completo, immagini proporzionate. Tablet: passaggio a una colonna e menu compatto senza sovrapposizioni. Mobile: prezzo indivisibile, CTA ampia, modulo prima dei contatti alternativi, visual centrale intero, sticky nascosta quando una CTA principale o il modulo sono già visibili.
- Menu mobile aperto/chiuso con Escape; frecce recensioni avanti e indietro; apertura FAQ; blocco del modulo vuoto; preferenze cookie. Link WhatsApp, telefono ed email controllati senza inviare messaggi.
- Homepage, landing, privacy, sitemap e robots: HTTP 200. Percorso inesistente: HTTP 404. Verificati redirect HTTP→HTTPS e da `andreagiaqui-83.github.io` al dominio canonico.
- Backend pubblico: health e recensioni HTTP 200. Richiesta vuota a `/api/lessons`: HTTP 400, nessuna email. Successo, errore provider, retry e idempotenza coperti dai test isolati, non da un invio reale alla casella.
- Axe, regole WCAG 2 A/AA e 2.1 AA: 29 controlli superati, zero violazioni rilevate. Contrasto segnalato come controllo manuale per i gradienti: combinazioni principali controllate, rapporti superiori a 8:1. Questo non costituisce una certificazione completa di accessibilità.
- Corretto anche il menu prima del primo rendering: la modalità JS viene riconosciuta in testa alla pagina, evitando il passaggio visibile dal menu esteso a quello mobile. Corretto il fallback per JavaScript disattivato e un attributo di griglia improprio nella modalità a contrasto forzato.
- Nessun errore JavaScript attribuibile alla pagina nei controlli; nessuna risorsa Google caricata con gli ID vuoti.
- Pagina temporanea di verifica rimossa a fine collaudo, insieme alla libreria axe usata esclusivamente per i test.

Risultati strutturati in [qa/verification.json](qa/verification.json). Test ripetibili dal repository con `npm ci` e `npm test`: **11 PASS, zero errori**. jsdom è una dipendenza di sviluppo e non viene caricata dal sito.

## Performance: cosa è stato verificato

Nessun framework, font remoto, player o widget incorporato. CSS landing circa 20,8 KB non compressi, JS landing circa 9,5 KB, script consenso/misurazione circa 9,6 KB. Nel browser il trasferimento compresso di questi tre file è rispettivamente circa 5,6 / 3,7 / 3,8 KB, intestazioni incluse. Hero AVIF mobile 480 px: 20.968 byte; ritratto: 3.226 byte. Immagini responsive, dimensioni esplicite, lazy loading per quelle successive.

Una copia temporanea dello stesso codice, aperta autonomamente in Chromium con cache già utilizzata, ha registrato LCP circa 0,42 secondi e nessun evento di layout shift. È una singola osservazione senza rallentamento simulato della rete o della CPU, non un benchmark né un dato sul campo.

I test responsive con ridimensionamento non sono usati come misura del CLS: cambiare deliberatamente la viewport altera il layout. Non è stato ottenuto un report Lighthouse con rete/CPU controllate né un report CrUX/Search Console. **LCP, CLS e INP sul campo restano da validare** con traffico reale e proprietà Google; non vengono dichiarati punteggi o miglioramenti percentuali non misurati.

## GO / NO-GO Google Ads

| Area | Esito | Evidenza o residuo |
|---|---|---|
| Desktop | PASS | 1366, 1440, 1920 px, controllo visivo |
| Mobile | PASS | 320–430 px, 6 larghezze, nessun overflow |
| Tablet | PASS | 600, 768, 800, 1024 px |
| Modulo | PARZIALE | Validazioni e 11 test PASS; ricezione reale da confermare |
| CTA | PASS | Destinazioni, menu, sticky e contatti verificati |
| Tracking | PREDISPOSTO | Codice e consenso testati; ID Google vuoti |
| Conversion tracking | NON ATTIVO | `generate_lead` pronto, nessuna conversione Google operativa |
| SEO tecnico | PASS lato sito | Meta, canonical, sitemap, robots, 404, JSON-LD; indicizzazione non verificata |
| Performance | PARZIALE | Asset e caricamenti ottimizzati; CWV sul campo non disponibili |
| Privacy | IMPLEMENTATA lato sito | Informativa e consenso pubblicati; aggiornamento necessario all'attivazione Google e verifica dei rapporti coi fornitori |
| Accessibilità | PASS nei controlli eseguiti | Axe zero violazioni rilevate, navigazione e contrasto controllati |
| Immagini | PASS | Recupero riferimento, nuove varianti, nessun ritaglio distruttivo |
| Messaggio commerciale | PASS | Individuale, online, su misura, AutoCAD 2D/3D |
| Prezzo | PASS | 30 minuti gratuiti, poi 15 €/ora, coerente in pagina e schema |
| Pertinenza Google Ads | PASS progettuale | Gruppi di intento e annunci coerenti; nessun risultato di campagna inventato |

**Esito complessivo: NO-GO per avviare spesa pubblicitaria.** La landing è pubblicata e utilizzabile, ma non è corretto dichiarare operative conversioni Google mai collaudate.

## Interventi residui del titolare

1. **Account Google:** fornire gli ID reali GA4 e Ads oppure collegare l'account autorizzato; verificare la proprietà Search Console con il token rilasciato da Google. Le istruzioni precise, senza password da condividere, sono nel documento operativo. Completare Tag Assistant/DebugView e verifica della conversione primaria unica; aggiornare il paragrafo privacy sui servizi attivati.
2. **Una richiesta reale:** compilare il modulo e verificare l'arrivo in `andrea.giaqui@gmail.com`, inclusa la cartella spam. Il Worker conserva il mittente Resend preesistente `onboarding@resend.dev`; non è stato configurato un dominio mittente autenticato. Verificare nell'account Resend i limiti del mittente e la consegna prima delle campagne.
3. **Controlli di account:** inviare sitemap, ispezionare URL e seguire indicizzazione/CWV. Non modificare A, CNAME o MX per la sola verifica Search Console; utilizzare esclusivamente il TXT emesso dall'account.

Non servono modifiche alla homepage commerciale per questi passaggi. Il test di invio richiede anche controllare la posta, che non è accessibile in questa sessione.

## Strategia e prossimi test

Sessione gratuita e prezzo insieme nella hero: abbassano la soglia iniziale senza nascondere il costo successivo e aiutano a qualificare il contatto. La sezione prezzi spiega cosa accade nei 30 minuti e cosa è escluso. Non è una vittoria A/B dimostrata: si misureranno richieste confermate e qualità dei contatti.

GA4 diretto è il solo livello di raccolta scelto; GTM resta una migrazione alternativa documentata, non un secondo tag. Query, annunci, micro/macro conversioni, Search Console, GEO e roadmap A/B sono in [AUTOCAD-GOOGLE-ADS.md](AUTOCAD-GOOGLE-ADS.md). L'immagine social è disponibile in [lezioni-autocad-social.jpg](../lezioni-autocad/assets/lezioni-autocad-social.jpg).

Nessuna promessa di ranking, presenza nelle risposte IA o incremento delle conversioni. Le identità, la certificazione e l'esperienza riprendono i dati già dichiarati dal titolare nel materiale precedente; non sono state aggiunte nuove attestazioni o recensioni.
