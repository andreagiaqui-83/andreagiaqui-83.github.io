# Misurazione del sito — 22 ottobre 2026

## Interventi nel sito

- Consenso di misurazione pubblicitaria coerente da Home a Preventivo, con importazione GA4 e senza tag Ads aggiuntivo. La landing Lezioni conserva il comportamento approvato.
- Preventivo: visualizzazione e primo utilizzo del modulo, tentativo, errore e conferma distinti; nessun dato personale o materiale caricato nei parametri GA4. Una selezione precompilata dal link non conta come inizio modulo.
- `service_quote_success` solo con UUID confermato dal backend; `generate_lead` distinto per le lezioni. Email, WhatsApp e telefono restano `contact_click` con `contact_method` diverso, mai una prova di contatto acquisito.
- Il rifiuto dei cookie non impedisce la richiesta. Dopo rifiuto nessun tag Google viene caricato: l’assenza di eventi non equivale all’assenza di richieste.
- Indice statico e collegamento alle Lezioni in AG CAD Tools; collegamento al plugin e metadati delle Lezioni affinati. Nessuna variazione al plugin 2.2 o all’offerta commerciale.

## Visite di controllo

Aprire `https://andreagiaquinto.it/?ag_test=1` nella scheda dedicata al collaudo. La scelta blocca caricamento ed eventi Google anche con consenso già concesso; continua tra le pagine nella stessa scheda. Per uscire aprire `https://andreagiaquinto.it/?ag_test=0` oppure chiudere la scheda. Non usare questi link nei profili pubblici. Se sessionStorage è bloccato, il parametro agisce sulla sola pagina che lo contiene.

La modalità non rende innocui gli invii: i test dei moduli devono intercettare il backend. Per verificare gli eventi in Tag Assistant/DebugView usare un ambiente e un filtro sviluppatori correttamente configurati, non `ag_test=1`, che li sopprime completamente.

Non escludere utenti soltanto perché ricorrenti, localizzati a Cosenza o provenienti da Direct/ChatGPT. Eventuali filtri GA4 richiedono regole tecniche note e inizialmente lo stato Testing. Nessuna cancellazione retroattiva. Gli strumenti collegati non espongono la configurazione amministrativa dei filtri: stato non modificato né certificato.

## Link UTM pronti per le sorgenti esterne

Usare nomi minuscoli coerenti; niente dati personali e niente UTM nei link interni. Gli URL canonici rimangono puliti. Questi link sono preparati: salvo il README di questo repository, non risultano applicati ai profili esterni in questa revisione.

| Sorgente | Link da usare nel profilo o nella firma |
|---|---|
| Google Business Locate Varesino | https://andreagiaquinto.it/?utm_source=google_business&utm_medium=organic&utm_campaign=profilo_locate_varesino |
| Google Business Cosenza | https://andreagiaquinto.it/?utm_source=google_business&utm_medium=organic&utm_campaign=profilo_cosenza |
| Professione Architetto | https://andreagiaquinto.it/?utm_source=professionearchitetto&utm_medium=referral&utm_campaign=profilo_professionale |
| Facebook | https://andreagiaquinto.it/?utm_source=facebook&utm_medium=social&utm_campaign=profilo_professionale |
| LinkedIn | https://andreagiaquinto.it/?utm_source=linkedin&utm_medium=social&utm_campaign=profilo_professionale |
| Firma email | https://andreagiaquinto.it/?utm_source=email&utm_medium=email&utm_campaign=firma_professionale |
| Link condiviso in WhatsApp | https://andreagiaquinto.it/preventivo/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=richiesta_preventivo |
| GitHub, repository del sito | https://andreagiaquinto.it/ag-cad-tools/?utm_source=github&utm_medium=referral&utm_campaign=repository_sito |

Nei post usare una campagna pertinente al contenuto, distinguendola da quella del profilo. Non cambiare automaticamente campagne pubblicitarie né sovrascrivere parametri già concordati.

## Report e account esterni

Il foglio Google gratuito è stato letto via Google Drive: aggiornamenti GA4 e Search Console presenti il 22/10/2026. La configurazione resta sulla landing Lezioni; `generate_lead=0` in quel report non dimostra zero preventivi del sito. Estensione pronta in `google-reporting-free/apps-script-analytics-search-console.gs`, ancora da installare e verificare nell’editor esistente con accesso Google. Su richiesta di Andrea, questa operazione è rinviata perché al momento non può accedere; la pubblicazione del sito procede separatamente.

Windsor.ai segnala letture sospese: sei account collegati, uno incluso nel piano gratuito. I dati sostitutivi restituiti dal connettore non sono dati reali e non vengono usati. Nessun abbonamento acquistato, nessun account scollegato. Le corrispondenze fra ID numerici Google Business, città e URL attuali non sono verificabili da questa lettura: i profili non vengono aggiornati sulla base di ipotesi.

## Verifica

Test automatici con richieste intercettate, senza email o contatti reali. Copertura: consenso Home → Preventivo, rifiuto, deduplicazione, tentativo fallito e ripetizione con stesso UUID, contenuti esclusi dagli eventi, modalità collaudo e letture del report fallite/limitate. Il controllo WebKit simula il motore Safari: non equivale a una prova su iPhone fisico.

## URL storici e limiti della verifica

Le tre vecchie landing continuano a portare alle sezioni pertinenti di AG CAD Tools, con canonical e noindex coerenti. Sono pagine ponte HTML, non risposte HTTP 301. Un redirect permanente HTTP richiede una configurazione davanti a GitHub Pages: non è stato attivato né viene dichiarato come completato in questa revisione.

L’audit locale del candidato ha controllato 33 pagine in Chromium, Firefox e WebKit e 16 larghezze da 320 a 1920 px. Verificate visivamente le nuove intestazioni Lezioni e l’indice AG a 390 e 1440 px. Il confronto Lighthouse delle sette destinazioni principali mostra 94–100 su mobile e 100 su desktop per le prestazioni, accessibilità e SEO 100, con CLS nullo. Si tratta di una singola misura sintetica per pagina, non di Core Web Vitals sul campo. La vecchia URL YQArch reindirizzata ha prodotto un campione desktop non valido (NO_LCP), escluso dal confronto; la destinazione AG CAD Tools è stata misurata direttamente. Gli avvisi CORS per le API pubbliche sul server locale non vengono interpretati come errori sul dominio di produzione, verificato separatamente dalla CI live.
