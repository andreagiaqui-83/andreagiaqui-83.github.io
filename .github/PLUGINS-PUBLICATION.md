# Pagine dei progetti AutoCAD in italiano

Landing: `/yqarch-italiano/` e `/express-tools-italiano/`.

- Conservare stile, SEO, accessibilità e comportamento responsive del sito. File condivisi: `assets/plugins/`.
- Su richiesta dell’utente, tutti i pacchetti distribuiti e la relativa documentazione sono stati ritirati. Non ripubblicare installer, archivi, guide, rapporti, impronte o informazioni sulle versioni senza una nuova richiesta.
- Le landing presentano i progetti in termini generali. Non promettere download, disponibilità di guide o compatibilità di una distribuzione non pubblicata. Mantenere FAQ e dati strutturati coerenti con il contenuto visibile.
- I contributi economici sostengono il progetto italiano di Andrea Giaquinto. PayPal `andrea.giaqui@gmail.com`; Postepay P2P `333 724 0544`. Non inventare link PayPal.me.
- Commenti e risposte senza account, con nickname pubblico e consenso. Pubblicazione dopo moderazione tramite email al titolare. Endpoint separati in `cloudflare-worker/src/plugin-comments.js`; nessuna mescolanza con recensioni o richieste servizi.
- GET dei link moderazione mostra soltanto la conferma. POST firmato applica la modifica. Non inviare contributi o notifiche reali per provare il sistema. I test simulano Resend e tutti i POST dei browser.
- Nessun contenuto dei commenti nei tracciamenti. Visite e CTA rispettano il consenso condiviso. I progetti non emettono eventi `generate_lead` o `service_quote_success`.
- Prima della pubblicazione: `npm test` e workflow `plugins-verified.yml`; controllare screenshot desktop/mobile e assenza di collegamenti ai materiali rimossi. Se cambia homepage, eseguire anche la verifica servizi esistente.
