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
