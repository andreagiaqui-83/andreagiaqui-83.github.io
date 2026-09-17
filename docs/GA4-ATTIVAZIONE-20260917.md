# Attivazione GA4 — 17 settembre 2026

## Identificativo autorizzato

Il titolare ha fornito lo screenshot dei dettagli dello stream «Andrea Giaquinto - Sito web», URL https://andreagiaquinto.it, ID stream 15795461390, **ID misurazione G-SQ7LJ1FVVY**. La misurazione avanzata nello screenshot è disattivata.

Il tag Google pubblico relativo all'ID risponde HTTP 200 e contiene l'ID di misurazione. L'ID numerico dello stream non è esposto nel tag scaricato: non è stato presentato come una verifica nell'account.

## Configurazione pubblicata

- ID GA4 inserito nell'unico file `assets/measurement-config.js`.
- Google Ads resta non configurato: `adsId` e `adsLeadLabel` vuoti. Nessuna campagna, spesa, remarketing o conversione diretta Ads attivata.
- Consent Mode base: nessuno script o evento Google prima del consenso alle statistiche; rifiuto e revoca rispettati.
- Versione delle preferenze portata a 2 per richiedere una nuova scelta quando il servizio diventa disponibile. Preferenze della configurazione inattiva non riutilizzate come consenso.
- Riferimento alla configurazione aggiornato con cache-busting in homepage, landing e informativa.
- Informativa aggiornata per descrivere Analytics, consenso, cookie e fornitori effettivi. Nessuna garanzia legale di conformità totale.
- Codice di misurazione, CSS, immagini, foto, contenuti della landing 17.6, prezzi, recensioni e backend restano invariati.

## Verifiche del candidato

Branch `ga4-activation-20260917`, candidato `42795c309b99159053f211b8b23ddd809ce7f16a`.
Workflow `35213841948`, success; artifact `10494247820`.

**11/11 test isolati** esistenti e **51/51 controlli browser** superati, con il tag Google reale e richieste di raccolta intercettate:

- blocco iniziale e rifiuto persistente su homepage, landing e privacy;
- un solo page_view dopo consenso, destinazione corretta, parametri di campagna ammessi e assenza dei dati personali di test negli eventi;
- cookie Analytics soltanto dopo consenso, nessun cookie pubblicitario;
- invio del modulo simulato: un generate_lead soltanto dopo risposta positiva simulata; WhatsApp resta contact_click;
- revoca, rimozione cookie e nessun caricamento successivo del tag;
- nuovo consenso per preferenze di versione precedente;
- dialogo, immagini e assenza di overflow verificati a 320, 390, 768, 1366 e 1920 pixel; screenshot mobile/desktop esaminati.

I test del modulo non hanno inviato email vere. I test del candidato non hanno inviato eventi reali a Google: gli endpoint sono stati intercettati. Il parser di test gestisce correttamente i batch GA4 con più eventi in un POST.

## Pubblicazione e verifica sul dominio

Commit di attivazione su main: `fd60059e6bec40a5ff19093c188e6e504ed350eb`.
GitHub Pages run `35214176985`: **success**, completato il 17 settembre 2026 alle 11:09:33 UTC.

Workflow pubblico `35214229794`: **success**, artifact `10493838630` (ga4-live-verification).

- Tutti e quattro i file pubblicati corrispondono byte per byte al candidato verificato (SHA-256 registrati nell'artifact).
- **54/54 controlli browser sul sito pubblico superati**, inclusi consenso, rifiuto, revoca, cookie, eventi, layout e immagini.
- Una sola visita tecnica effettiva, etichettata `utm_source=technical_check&utm_medium=qa&utm_campaign=ga4_activation`, ha inviato a Google un `page_view` con `tid=G-SQ7LJ1FVVY`.
- L'endpoint Google ha risposto **HTTP 204**. Il controllo è stato eseguito intorno alle 11:10 UTC.
- Tutti gli altri eventi diagnostici e tutti gli invii dei moduli sono stati intercettati. **In questa fase automatizzata: zero email reali, zero lead fittizi inviati alla proprietà reale, zero campagne attivate.**

La risposta dell'endpoint dimostra la trasmissione tecnica, non la presenza nei report privati dell'account. La verifica successiva da parte del titolare è documentata sotto; non va confusa con un accesso amministrativo diretto dell'assistente.

## Prova reale eseguita e confermata dal titolare

Il 17 settembre 2026, dopo la configurazione di `generate_lead`, Andrea ha fornito due screenshot del report Tempo reale della proprietà `andreagiaquinto.it` e ha confermato esplicitamente: «L'email è arrivata».

Esito di questa singola prova:

- Ricezione dell'email del modulo **confermata dal titolare**; l'assistente non ha letto né ispezionato direttamente il messaggio nella casella.
- Nel riquadro «Eventi chiave da Nome evento» dello screenshot compare **`generate_lead`, conteggio 1**. La ricezione dell'evento e la sua classificazione come evento chiave sono quindi documentate nell'interfaccia dell'account.
- Gli screenshot mostrano anche `page_view` (7), `user_engagement`, `scroll_depth`, `first_visit`, `session_start` e `form_view`. Sono evidenze della sessione di collaudo, non risultati di campagne pubblicitarie.
- La verifica richiesta «modulo → email ricevuta → evento chiave GA4» è completata per questa prova. Non costituisce garanzia universale di consegna futura o di assenza di duplicazioni in tutti i casi.
- L'evento di prova deve essere considerato un contatto tecnico, **non un nuovo cliente o una lezione acquistata**. Nessun filtro retroattivo o cancellazione del dato è stato applicato; registrare questo limite nei confronti futuri.
- Gli screenshot e il contenuto della posta non vengono copiati nel repository pubblico.

Non occorre ripetere lo stesso invio soltanto per riconfermare l'esito. Non modificare la landing funzionante per questa conferma.

## Passaggi ancora aperti nell'account

1. Verificare conservazione dei dati della proprietà e impostazioni del servizio con il titolare; la durata configurata dei cookie (180 giorni) è distinta dalla conservazione dei report.
2. Collegare l'account Google Ads corretto alla proprietà GA4; verificare prima gli account già presenti e non crearne duplicati. Mantenere disattivata la pubblicità personalizzata secondo l'impostazione del progetto.
3. Dopo il collegamento, configurare una sola conversione Google Ads primaria basata su `generate_lead`, senza doppio invio diretto più importazione. La presenza come evento chiave GA4 non dimostra ancora l'importazione in Ads. Valore del contatto non equiparato automaticamente al prezzo orario delle lezioni.
4. Confermare Search Console, eventuali integrazioni di reporting, budget e durata approvati prima di avviare campagne. La configurazione Google Ads nel sito risulta ancora vuota alla verifica di questo aggiornamento.
5. Collaudare l'attribuzione delle campagne e il consenso prima della spesa. Nessuna nuova campagna è stata creata o attivata in questo passaggio.

## Fonti operative

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://support.google.com/analytics/answer/11198161?hl=it
- https://support.google.com/analytics/answer/9379420?hl=it
- https://www.garanteprivacy.it/faq/cookie
