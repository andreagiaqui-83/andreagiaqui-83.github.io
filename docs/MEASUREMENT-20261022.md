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

## Completamento e vincoli del 23 ottobre, secondo controllo
- Nuova FAQ sul metodo pubblicata insieme alla revisione dei download in Disegnatore online e Preventivo; nessun cambiamento a prezzi, campi, backend o consenso.
- Rimosse le release separate YQArch 3.61/3.73/3.78 (17 allegati) ed Express 3.1 (1 allegato), con i relativi tag e i due tag YQArch residui 3.28/YQArch_italian. Verificato tramite GitHub API che entrambi gli elenchi release sono vuoti. I README correnti indirizzano ad AG CAD Tools; workflow temporanei di rimozione eliminati dopo l’esecuzione riuscita. La cronologia dei commit e i rami storici non sono stati riscritti.
- DNS pubblici rilevati: Aruba/Technorail; sito direttamente su GitHub Pages. Regola 301 e piano di attivazione pronti in `REDIRECTS-301.md` e `redirect-ag-cad-tools-cloudflare.json`, **non attivati**. Serve la decisione/accesso per il proxy del dominio; il Worker dei moduli è indipendente.
- Il precedente errore di permessi GA4 è documentato sopra. Nel secondo tentativo l’interfaccia Amministrazione non carica i controlli e registra un errore HTTP di caricamento delle impostazioni; non è stato possibile verificare o modificare filtri ed eventi chiave. Non attribuire automaticamente questo nuovo errore al ruolo dell’account. Il report già installato resta distinto e operativo.

## Esito finale dell’amministrazione GA4 — 23 ottobre 2026

Il blocco di caricamento sopra descritto è stato risolto aprendo una nuova scheda nella stessa sessione Google già autorizzata. Nessuna nuova credenziale o autorizzazione OAuth richiesta. Verificati account Andrea Giaquinto, proprietà `554694086`, stream del sito `15795461390` e ID `G-SQ7LJ1FVVY`, coerente con il codice pubblicato.

- `generate_lead` e `service_quote_success` risultano **già contrassegnati come eventi chiave**. Stato verificato e conservato; non sono stati duplicati né sostituiti. L’interfaccia non mostra dati di stream per questi eventi negli ultimi 28 giorni: la configurazione è distinta dalla ricezione di richieste reali misurate.
- Create e rilette due dimensioni con ambito Evento: **Metodo di contatto** (`contact_method`, valori email/phone/whatsapp) e **Modulo del sito** (`form_id`). Usano esclusivamente i parametri tecnici già trasmessi dal sito. I clic di contatto restano interazioni secondarie, non lead confermati; nessun dato personale o identificatore univoco del cliente aggiunto.
- Creato e verificato **Collaudo sviluppatori AG**, tipo Traffico sviluppatori, operazione Escludi, stato **Test**. Identifica gli eventi con `debug_mode`/`debug_event` tramite la dimensione Nome filtro dati di test; non è un’esclusione attiva. Convalidare su un campione di debug riconoscibile prima di attivarlo.
- Il filtro preesistente **Internal Traffic** è in stato **Test**. Nel tag Google la sezione Regole traffico interno è vuota. Nessun IP è stato inventato o dedotto dalla città o dall’ambiente di lavoro remoto. Per le normali verifiche del sito resta disponibile l’opt-out di scheda `?ag_test=1`; per un’eventuale regola IP servono gli indirizzi pubblici effettivi delle reti dell’autore.
- Secondo la documentazione Google, i filtri possono richiedere 24–36 ore per essere valutati; le nuove dimensioni possono richiedere 24–48 ore dalla raccolta dei dati. Non dichiarare verificati i conteggi futuri o attiva l’esclusione soltanto perché la configurazione è stata salvata.
- La diagnostica del tag segnala un tasso di consenso dello 0% in alcune regioni. Avviso rilevato e conservato: non sono stati forzati consensi o attivata la personalizzazione pubblicitaria per rimuoverlo. I test del sito verificano separatamente consenso concesso/rifiutato, importazione GA4 dei servizi e assenza di richieste Google dopo rifiuto. Rivalutare l’avviso sui dati reali successivi alla correzione del 22 ottobre; nessun lead fittizio inviato alla proprietà.

Riferimenti operativi: https://support.google.com/analytics/answer/13296662 e https://support.google.com/analytics/answer/14239696.

La pubblicazione della revisione del sito è stata verificata: 24 file correnti identici alla copia approvata, tutte le 60 URL dei file ritirati non più disponibili, installer AG CAD Tools 2.2 con hash approvato. L’audit aggiornato copre 21 pagine, 16 larghezze e Chromium/Firefox/WebKit; superati 96 test unitari e di sicurezza. Corretto anche l’ambiente CI con immagine Playwright ufficiale fissata alla versione 1.58.2 e controlli di pubblicazione eseguiti dal runtime Node già installato. I redirect HTTP 301 restano il passaggio infrastrutturale non attivato descritto in `REDIRECTS-301.md`.
