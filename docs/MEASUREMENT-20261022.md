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

Non escludere utenti soltanto perché ricorrenti, localizzati a Cosenza o provenienti da Direct/ChatGPT. Eventuali filtri GA4 richiedono regole tecniche note e inizialmente lo stato Testing. Nessuna cancellazione retroattiva. Il 23 ottobre l’accesso browser alla proprietà 554694086 ha mostrato i report, ma la schermata Filtri dati, dopo un caricamento senza esito e una sola ricarica, ha risposto «Autorizzazioni errate — Non disponi di autorizzazioni sufficienti per accedere a questa pagina». Filtri e configurazione degli eventi chiave non modificati né certificati; nessuna richiesta automatica di nuovi permessi.

## Link UTM pronti per le sorgenti esterne

Usare nomi minuscoli coerenti; niente dati personali e niente UTM nei link interni. Gli URL canonici rimangono puliti. Il README di questo repository usa già il link GitHub. I due profili Google Business sono stati verificati nel browser il 23 ottobre: contengono già i link distinti riportati sotto, conservati per continuità. Per gli altri canali i link rimangono proposte pronte, non applicazioni certificate in questa revisione.

| Sorgente | Link da usare nel profilo o nella firma |
|---|---|
| Google Business Locate Varesino, già presente | https://andreagiaquinto.it/?utm_source=google&utm_medium=organic&utm_campaign=google_business_profile_locate_varesino |
| Google Business Cosenza, già presente | https://andreagiaquinto.it/?utm_source=google&utm_medium=organic&utm_campaign=google_business_profile |
| Professione Architetto | https://andreagiaquinto.it/?utm_source=professionearchitetto&utm_medium=referral&utm_campaign=profilo_professionale |
| Facebook | https://andreagiaquinto.it/?utm_source=facebook&utm_medium=social&utm_campaign=profilo_professionale |
| LinkedIn | https://andreagiaquinto.it/?utm_source=linkedin&utm_medium=social&utm_campaign=profilo_professionale |
| Firma email | https://andreagiaquinto.it/?utm_source=email&utm_medium=email&utm_campaign=firma_professionale |
| Link condiviso in WhatsApp | https://andreagiaquinto.it/preventivo/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=richiesta_preventivo |
| GitHub, repository del sito | https://andreagiaquinto.it/ag-cad-tools/?utm_source=github&utm_medium=referral&utm_campaign=repository_sito |

Nei post usare una campagna pertinente al contenuto, distinguendola da quella del profilo. Non cambiare automaticamente campagne pubblicitarie né sovrascrivere parametri già concordati.

## Report e account esterni

Il 23/10/2026, dopo l’accesso Google fornito da Andrea, l’estensione è stata installata nel progetto Apps Script esistente e verificata con esecuzione reale conclusa alle 15:11:30 Europe/Rome. Il report gratuito conserva la landing Lezioni, la campagna configurata, il budget e il singolo attivatore `runDailyGoogleReporting` già esistente. Manifest e permessi OAuth invariati. Il codice live preesistente è stato conservato, aggiungendo due chiamate e le quattro funzioni dell’estensione; non è stato sostituito con una diversa versione del report storico.

I nuovi fogli `GA4_Site_Events` e `GA4_Site_Status` separano i due lead e le interazioni del modulo. Letture 20–22 ottobre completate con stato `OK`, senza eventi corrispondenti restituiti dall’API. `Daily_Report` contiene sei righe distinte per preventivi confermati, richieste lezioni, visualizzazione, avvio, tentativo ed errore del modulo. Uno zero riguarda soltanto gli eventi misurati con consenso e non dimostra l’assenza di richieste effettive via email o WhatsApp. Nessun contatto reale è stato generato per la verifica.

La prova live ha individuato la conversione automatica delle date ISO in date native da parte dei nuovi fogli. `ensureSiteSheet_` ora normalizza soltanto la colonna data dei due nuovi fogli e la mantiene come testo, evitando righe duplicate e riepiloghi non trovati. Test dedicato per date native, conversione e ripetizione idempotente; 96 test automatici superati. Riletti dati, configurazione e codice salvato; controllata l’impaginazione dei nuovi fogli e delle nuove righe del riepilogo.

Windsor.ai segnala letture sospese: sei account collegati, uno incluso nel piano gratuito. I dati sostitutivi restituiti dal connettore non sono dati reali e non vengono usati. Nessun abbonamento acquistato, nessun account scollegato. La verifica successiva nel browser Google Business ha confermato `1368806434677392904` = Cosenza e `8282407350731054896` = Locate Varesino, entrambi relativi ai servizi CAD/BIM. Gli URL hanno già UTM differenti; nessuna modifica necessaria. Gli altri due profili, estranei ai servizi CAD/BIM, non sono stati modificati.

## Verifica

Test automatici con richieste intercettate, senza email o contatti reali. Copertura: consenso Home → Preventivo, rifiuto, deduplicazione, tentativo fallito e ripetizione con stesso UUID, contenuti esclusi dagli eventi, modalità collaudo e letture del report fallite/limitate. Il controllo WebKit simula il motore Safari: non equivale a una prova su iPhone fisico.

## URL storici e limiti della verifica

Le tre vecchie landing continuano a portare alle sezioni pertinenti di AG CAD Tools, con canonical e noindex coerenti. Sono pagine ponte HTML, non risposte HTTP 301. Un redirect permanente HTTP richiede una configurazione davanti a GitHub Pages: non è stato attivato né viene dichiarato come completato in questa revisione.

L’audit locale del candidato ha controllato 33 pagine in Chromium, Firefox e WebKit e 16 larghezze da 320 a 1920 px. Verificate visivamente le nuove intestazioni Lezioni e l’indice AG a 390 e 1440 px. Il confronto Lighthouse delle sette destinazioni principali mostra 94–100 su mobile e 100 su desktop per le prestazioni, accessibilità e SEO 100, con CLS nullo. Si tratta di una singola misura sintetica per pagina, non di Core Web Vitals sul campo. La vecchia URL YQArch reindirizzata ha prodotto un campione desktop non valido (NO_LCP), escluso dal confronto; la destinazione AG CAD Tools è stata misurata direttamente. Gli avvisi CORS per le API pubbliche sul server locale non vengono interpretati come errori sul dominio di produzione, verificato separatamente dalla CI live.
