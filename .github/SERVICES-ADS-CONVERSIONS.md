# Conversioni servizi — 20 settembre 2026

La homepage invia `service_quote_success` soltanto dopo la conferma positiva del backend. La pagina lezioni mantiene `generate_lead`. Le due conversioni hanno scopi commerciali distinti.

L'evento servizi sostituisce il precedente `generate_lead` della homepage: non viene emesso in aggiunta. `form_complete` resta un segnale diagnostico e non va importato come ulteriore conversione primaria. Deduplicazione tramite ID della richiesta conservata; ID, campi, nomi file e altri dati personali non sono inviati a GA4. Consenso e blocco dei tag prima della scelta rimangono invariati.

## Configurazione dell'account prima della campagna

1. Verificare la proprietà GA4 corrispondente all'ID di misurazione già configurato, senza creare nuovi ID.
2. Registrare `service_quote_success` come evento chiave, riutilizzandolo se già presente. Non derivarlo da `generate_lead`: il browser invia già l'evento dedicato.
3. Importarlo una sola volta in Google Ads, con conteggio «Una», senza assegnare un valore economico inventato.
4. Usare un obiettivo specifico della campagna servizi che includa soltanto questa conversione. Preservare gli obiettivi delle lezioni e le impostazioni delle campagne esistenti.
5. Mantenere WhatsApp, telefono, email, clic CTA e scroll come segnali secondari. Un clic non dimostra un contatto ricevuto.
6. Confermare un invio reale del modulo servizi, ricezione email, evento GA4 e successiva attribuzione Ads. Un test simulato o una risposta HTTP non dimostrano da soli la consegna o l'attribuzione.

Il tag AW diretto e GTM non sono necessari per l'importazione GA4 e non sono stati aggiunti. Non attivare contemporaneamente un tag Ads diretto per lo stesso obiettivo.

## Baseline e limiti

Baseline di questa modifica: `57df1aa2b030908a2bc2d9661f3f4ee3df5d97e1`, che include le regole AGENTS delle lezioni aggiunte in parallelo. Il controllo di conservazione confronta l'intera cartella lezioni con questa baseline aggiornata.

Al momento della preparazione, l'accesso Google non ha completato la verifica dell'identità. L'evento nel codice non dimostra che sia già configurato come evento chiave o conversione Ads. Budget giornaliero e durata della nuova campagna restano vuoti finché Andrea non li fornisce e non possono essere modificati autonomamente. Nessuna campagna viene avviata da questa modifica.
