# Pagine dei progetti AutoCAD in italiano

Landing: `/yqarch-italiano/` e `/express-tools-italiano/`. Guida pratica Express: `/express-tools-italiano/guida/`.

- Conservare stile, SEO, accessibilità e comportamento responsive del sito. File condivisi: `assets/plugins/`.
- I download risiedono nel dominio, in `downloads/`. Pubblicare soltanto file recuperati dal progetto autorizzato e confrontarne gli hash. Non ricompilare o modificare gli EXE durante la pubblicazione del sito.
- Versioni del 27 settembre 2026: YQArch 3.64, ancora da collaudare nativamente; Express Tools 3.2-rc1, candidata non stabile. Non trasformare controlli statici o rilevamento installazioni in garanzie di compatibilità. Aggiornare pagina, FAQ, dati strutturati, guide, impronte e `downloads/releases.json` insieme.
- Fonte YQArch: pacchetto 3.64, guida e rapporto forniti dal progetto. Fonte Express: LEGGIMI e rapporto 3.2-rc1. Nessun supporto universale AutoCAD/LT/Mac; distinguere Windows dell’installer dai requisiti Autodesk della release.
- I contributi economici sostengono il progetto italiano di Andrea Giaquinto. PayPal `andrea.giaqui@gmail.com`; Postepay P2P `333 724 0544`, verificati nel pacchetto YQArch 3.64. Non inventare link PayPal.me.
- Commenti e risposte senza account, con nickname pubblico e consenso. Pubblicazione dopo moderazione tramite email al titolare. Endpoint separati in `cloudflare-worker/src/plugin-comments.js`; nessuna mescolanza con recensioni o richieste servizi.
- GET dei link moderazione mostra soltanto la conferma. POST firmato applica la modifica. Non inviare contributi o notifiche reali per provare il sistema. I test simulano Resend e tutti i POST dei browser.
- Nessun contenuto dei commenti nei tracciamenti. Visite e CTA rispettano il consenso condiviso. I progetti non emettono eventi `generate_lead` o `service_quote_success`.
- Prima della pubblicazione: `node --test scripts/test-*.mjs scripts/test-*.cjs` e workflow `plugins-verified.yml`; controllare screenshot desktop/mobile e integrità dei download. Se cambia homepage, eseguire anche la verifica servizi esistente.

## Aggiornamento 30 settembre 2026
Footer comune senza pulsante LinkedIn; didascalie descrittive senza formule illustrative o riferimenti IA. Ogni pagina secondaria ha pulsanti statici di ritorno in alto e in basso, con destinazioni registrate in `scripts/site-pages.json`. Tariffe e installer invariati. La home amplia render, planimetrie commerciali e virtual staging senza alterare endpoint, consenso, tracciamento o nomi dei campi. I report tecnici mantengono contenuti e limiti dichiarati; cambiano soltanto navigazione, contenitore responsive delle tabelle e footer.

## Release YQArch 3.73 — 1 ottobre 2026
- La 3.73 è stata collaudata dall’autore su AutoCAD 2026 italiano: installazione/aggiornamento, Ribbon e inserimento diretto. Non estendere questa evidenza a tutti i comandi o ad altri ambienti.
- Pubblicare soltanto EXE e ZIP approvati, senza ricostruirli. La 3.72 non va pubblicata; conservare la 3.71 come rollback. Non rimuovere gli archivi già presenti.
- Il manifest include sia EXE sia ZIP. Guida (646 schede), schema Ribbon, catalogo, rapporto, note, compatibilità e SHA devono avere link validi e navigazione comune.
- `finalize-release-assets.yml` ricongiunge eventuali parti di trasporto su un branch `release/**`, verifica dimensioni e SHA prima di salvare i file e rimuove le parti dal tree corrente. Non compila o modifica gli installer.
- Eseguire i test esistenti e `node scripts/audit-site.cjs local`; dopo la pubblicazione ripetere con `live`. Il controllo completo intercetta scritture e analytics. I documenti archiviati mantengono `noindex,follow`.

## Release YQArch 3.78 — 3 ottobre 2026
- Collaudo nativo della 3.77 acquisito su AutoCAD 2027 italiano: 646/646 definizioni, menu e Ribbon confermati. CUIx e risorse funzionali conservati nella 3.78; aggiornati versione, descrizione diagnostica e documenti.
- EXE/ZIP 3.78 già ricostruiti e verificati nel progetto; sul sito copiarli senza modificarli. Conservare gli archivi precedenti.
- Conteggi Ribbon: 10 grandi + 50 piccoli visibili + 70 nel flyout. 23 categorie e 547 voci; guida con 646 schede e limiti dichiarati.
- Nessuna nuova certificazione di tutte le geometrie o di altri ambienti. Conservare separazione fra prove native 3.77 e verifiche automatiche 3.78.

## AG CAD Tools 2.0 e BlockHub CAD — 3 ottobre 2026
- AG CAD Tools: 198 strumenti (93 principali, 100 da cinque fonti MIT, 5 personali), 200 schede inclusi servizi; 541 nomi non sono 541 strumenti. Manifest AutoCAD completo 2024–2027 Windows x64 IT/EN, collaudo nativo documentato 2027 italiano e campione di comandi. LT/Mac/Web/altro CAD esclusi.
- Non presentare AG come traduzione ufficiale né come copia integrale del comportamento Autodesk; fonti, attribuzioni e limiti sono consultabili. Le copie web della documentazione aggiungono navigazione e adattamenti grafici; ZIP/EXE restano identici.
- BlockHub: pagina e bacheca, nessun download o numero definitivo finché la release è in lavorazione.


## Release BlockHub CAD 1.23 — 5 ottobre 2026
- La RC7 è stata collaudata positivamente dall’autore su AutoCAD 2027 italiano / Windows x64 ed è la baseline stabile della release definitiva. Non reintrodurre il wrapper RC6 `Exec + AppActivate + ReadAll`, che aveva causato una regressione su Libreria → Strumenti.
- Release definitiva: `BlockHub_CAD_1.23_Setup.exe`, 51.399.168 byte, SHA-256 `918caed28076087166133320c09d7ed457b521e66d5ecc2916573a948bf53a5d`. Pubblicare esattamente questi byte senza ricompilare o modificare l'installer.
- Base standard: 4.029 asset = 3.496 baseline BlockHub + 348 CADdillo CC0 + 185 asset autorizzati; i 185 comprendono 153 dinamici/parametrici e 32 statici.
- Runtime offline-first: nessun catalogo web nella galleria; nuovi file esterni entrano soltanto tramite Importa. Importazioni personali, Preferiti e Recenti restano locali.
- Ripristino 1.23: completo oppure selettivo; può mantenere copie `_mod_N`, nomi/classificazioni personalizzati e blocchi standard rimossi.
- Compatibilità pubblica: AutoCAD completo 2024–2027 Windows x64. Collaudo reale completo solo su AutoCAD 2027 italiano; 2024/2025/2026 e AutoCAD inglese sono verificati strutturalmente/API e non vanno presentati come fisicamente collaudati. Windows 11 x64 supportato; Windows 10 solo legacy/non supportato; AutoCAD LT, macOS, Web e Windows ARM esclusi.
- Visual di release: `assets/plugins/blockhub-cad-1.23-libreria.webp` e `assets/plugins/blockhub-cad-1.23-installazione.webp`. Usare didascalie descrittive; non chiamarli screenshot autentici se sono stati ottimizzati/ricostruiti.
- La landing `/blockhub-cad/` sostituisce lo stato “in aggiornamento”; il download va attivato soltanto nella fase finale, dopo assemblaggio/copia dell’EXE approvato nel dominio, verifica SHA-256 e test locali. Homepage e dati strutturati devono restare coerenti con la landing.

## Pubblicazione BlockHub CAD e menu — 7 ottobre 2026
- Download definitivo attivo in `/downloads/blockhub-cad/`, con note, compatibilità e impronte. Il file EXE resta identico a BH-123-FINALE; corretti soltanto i refusi dei recapiti nelle note web.
- Header comune con «Plugin per AutoCAD» e tre destinazioni; disclosure nativa anche senza JavaScript, chiusura da tastiera e su interazione esterna.
- Link Maps esclusivamente nei Contatti con associazione corretta del 7 ottobre; nessun profilo nel footer.
