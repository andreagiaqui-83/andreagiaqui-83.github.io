# Collegamento Google e piano campagne — AutoCAD v17

## Decisione tecnica

Tag Google diretto (gtag.js) unico per tutto il dominio. Su questo sito statico, con un modulo principale, evita di aggiungere un contenitore e configurazioni duplicate. GTM è stato valutato; non è installato e non ha un ID inventato. Non installare insieme un secondo Google tag attraverso GTM, plugin o snippet manuali.

L'unico file di configurazione è `assets/measurement-config.js`. Gli ID sono vuoti: non avviene alcuna raccolta Google. Il codice è presente nella homepage, nella landing e nell'informativa. Nessun cambiamento ai DNS o al CNAME.

## Attivazione con l'account del titolare

1. Recuperare o creare nell'account corretto una proprietà GA4 e il flusso web per `https://andreagiaquinto.it`. Inserire il suo ID reale in `ga4Id`. Se esiste una proprietà usarla, senza crearne una duplicata.
2. Nel flusso GA4 disabilitare le misurazioni avanzate automatiche di moduli, scroll e click in uscita: questi eventi sono già gestiti dal sito. La pagina invia un solo `page_view` manuale dopo il consenso; non aggiungere ulteriori tag di visualizzazione. Verificare la retention dell'account e aggiornare l'informativa quando il servizio è attivato.
3. Marcare **solo `generate_lead`** come evento chiave del modulo. Le richieste devono avere risposta positiva del server. Non creare un evento chiave da `form_submit_attempt`, `form_start`, WhatsApp, telefono o email.
4. Collegare GA4 a Google Ads e importare `generate_lead` una sola volta come conversione primaria, conteggio «Una». Il valore economico del contatto non è noto: non assegnare 15 € a ogni lead. Il prezzo di una lezione non è il valore di una richiesta.
5. Alternativa alla conversione importata: compilare `adsId` e `adsLeadLabel` con valori reali e impostare `conversionMode: 'direct'`. Usare la conversione diretta come primaria **al posto** dell'importazione GA4, mai entrambe per lo stesso modulo. Il codice invia `transaction_id` per deduplicare e richiede consenso pubblicitario. Personalizzazione annunci e Google Signals restano disabilitati.
6. Fare una sessione di Tag Assistant/DebugView: rifiuto, consenso statistiche, consenso pubblicitario, revoca e nuova visita. Verificare almeno una richiesta realmente ricevuta nella casella del titolare. I test automatici non certificano la consegna nella posta.
7. Aggiornare il paragrafo dell'informativa che dichiara i servizi inattivi, indicando quelli effettivamente attivati. Solo dopo questi controlli passare a GO Ads.

Nessun accesso Google, ID, token Search Console o credenziale è stato inventato. Le configurazioni dell'account, dei contratti con i fornitori e dei trasferimenti devono essere completate/verificate dal titolare nell'account di sua competenza.

## Eventi e conversioni

| Evento | Quando | Ruolo |
|---|---|---|
| `page_view` | Una volta, dopo il consenso statistiche | Visita |
| `cta_click` | CTA con identificativo stabile (`hero`, `header`, `price`, `mobile_sticky`) | Micro |
| `contact_click` | Click WhatsApp, telefono o email | Micro, non prova del contatto |
| `form_view` | Modulo visibile | Micro |
| `form_start` | Prima compilazione | Micro |
| `form_complete` | Campi necessari validi e presa visione spuntata | Micro |
| `form_submit_attempt` | Tentativo di invio valido | Micro |
| `form_error` | Invio non confermato o timeout | Diagnostica |
| `generate_lead` | Server conferma invio e identificativo della richiesta | Macro |
| `scroll_depth` | 50% e 90%, una volta per soglia | Micro |

GA4 determina sorgente, campagna e dispositivo secondo il funzionamento del servizio. Nel codice vengono conservati in `page_location` solo i parametri campagna ammessi, senza query libere o valori del modulo. Non inserire dati personali nei parametri UTM. Con consenso negato non si inviano eventi e non si recuperano retroattivamente le interazioni precedenti.

Non esiste al momento un calendario di prenotazione: inviare il modulo non significa avere una prenotazione confermata. Eventuali contatti qualificati e lezioni concordate andranno misurati separatamente, con una futura integrazione autorizzata.

## Se in futuro si preferisce GTM

Migrare in un unico rilascio disattivando il loader gtag diretto. Un contenitore web, un Google tag per GA4, un tag eventi con allowlist, un'eventuale conversione Ads. Un CMP/template consenso con API GTM `setDefaultConsentState` e `updateConsentState`, trigger Consent Initialization, stati iniziali negati. Non usare Custom HTML per aggirare il consenso.

| Tag | Trigger | Variabili ammesse |
|---|---|---|
| Google tag GA4 | Consenso statistiche ottenuto, una volta | ID GA4 reale, percorso pagina pulito |
| GA4 eventi | Eventi applicativi espliciti, consenso statistiche | nome evento, form_id, cta_id, contact_method, percent_scrolled, error_type |
| Conversione Ads | Solo conferma `generate_lead`, consenso pubblicitario | ID/label reali, identificativo richiesta |
| Conversion Linker | Consenso pubblicitario | Impostazioni standard, senza PII |

La migrazione richiede aggiornare il dispatcher a eventi `dataLayer.push({event: ...})`, configurare i trigger e verificare che non resti il vecchio invio diretto. Questo è il piano di migrazione, non un contenitore già operativo.

## Search Console

- La sitemap include `/`, `/lezioni-autocad/` e `/privacy/` con canonical coerenti. Robots permette l'indicizzazione. La 404 è una vera pagina di errore gestita da GitHub Pages.
- Accedere all'account del titolare e verificare se `andreagiaquinto.it` è già presente. Per una proprietà Dominio aggiungere al DNS soltanto il TXT esatto emesso da Google; non modificare record A/CNAME/MX esistenti. Senza accesso DNS, una proprietà prefisso URL HTTPS può essere verificata con il file o meta tag fornito da Google.
- Inviare `https://andreagiaquinto.it/sitemap.xml`, ispezionare la landing, richiedere indicizzazione e controllare Pagine, HTTPS, Core Web Vitals e dati strutturati.
- Nessun dato di indicizzazione, ranking o Core Web Vitals sul campo può essere dichiarato verificato senza i report della proprietà. Una pagina accessibile non è automaticamente indicizzata.

## Intento di ricerca e annunci

Ricerca qualitativa sulle espressioni del settore e sulle pagine disponibili: nessun accesso a Keyword Planner, volumi, CPC o dati di conversione. Le query seguenti sono ipotesi pertinenti da validare con termini di ricerca e lead qualificati, non una classifica per volume.

| Gruppo | Query iniziali (frase/esatta) | Messaggio | Destinazione |
|---|---|---|---|
| Lezioni individuali | lezioni autocad online; insegnante autocad online; docente autocad | confronto dal vivo, personalizzazione | landing principale |
| Corso 2D | corso autocad online; corso autocad 2d; imparare autocad da zero | basi, layer, quote e stampa | stessa landing, programma |
| Corso 3D | corso autocad 3d; lezioni autocad 3d online | solidi, UCS, geometria | stessa landing, programma |
| Ripetizioni | ripetizioni autocad; ripetizioni autocad università; autocad studenti geometri | esercizi e programma del docente | stessa landing, destinatari |
| Professionisti | corso autocad per architetti; autocad per ingegneri; lezioni autocad geometri | problemi reali, metodo DWG | stessa landing, metodo |

Non creare cinque pagine quasi identiche. Per la prima campagna usare una landing coerente e gruppi annunci distinti, con UTM per distinguere intenti. Valutare pagine dedicate solo se dati e contenuti specifici lo giustificano; in quel caso evitare duplicati e impostare canonical coerenti.

Titoli di esempio (entro 30 caratteri):
- Lezioni AutoCAD su misura
- AutoCAD online, 2D e 3D
- Prima sessione: 30 min gratis
- Lezioni individuali a 15 €/ora
- Ripetizioni AutoCAD online
- Impara sul tuo progetto

Descrizioni di esempio (entro 90 caratteri):
- Lezioni individuali online. Chiedi, prova e correggi: un percorso adatto ai tuoi obiettivi.
- Primi 30 minuti gratuiti, poi 15 €/ora. AutoCAD 2D e 3D con Andrea Giaquinto.

Esclusioni da valutare: crack, torrent, download software, licenza gratis, offerte di lavoro. Non escludere genericamente «gratis»: la sessione gratuita è parte dell'offerta. Non promettere diploma, certificazione inclusa, risultati garantiti o render fotorealistici inclusi nel corso.

## Roadmap A/B

Misurare richieste confermate e quota di contatti pertinenti, segmentando dispositivi. Una variabile per volta; assegnazione persistente, esclusione dei test interni, stessa qualità del traffico. Definire prima metrica, minimo effetto utile e campione in base al tasso osservato; evitare vincitori decisi dopo pochi click.

1. Headline attuale vs «Lezioni AutoCAD online, costruite sui tuoi obiettivi».
2. CTA «Richiedi i tuoi 30 minuti» vs «Parliamo del tuo obiettivo».
3. Visual architettonico attuale vs esercizio didattico autentico fornito da Andrea.
4. Prezzo insieme alla sessione gratuita vs stesso prezzo immediatamente sotto la CTA (mai nascosto).
5. Ordine metodo/programma vs programma/metodo.
6. Nome+email+messaggio facoltativo vs nome+recapito preferito.
7. Solo quando c'è traffico sufficiente: contenuti mirati studenti/professionisti.

Nessun incremento di conversione è stato misurato durante la revisione: sono state implementate scelte ragionate da validare con dati reali.

## Fonti ufficiali consultate

- Google, Consent Mode: https://developers.google.com/tag-platform/security/guides/consent
- Google, eventi GA4: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Google, AI features e siti: https://developers.google.com/search/docs/appearance/ai-features
- Search Console, verifica proprietà: https://support.google.com/webmasters/answer/9008080
- Garante, cookie: https://www.garanteprivacy.it/faq/cookie
- Resend, idempotenza (24 ore): https://resend.com/docs/dashboard/emails/idempotency-keys
