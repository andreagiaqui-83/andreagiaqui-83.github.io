# Revisione cumulativa del sito — 4 ottobre 2026

Baseline remota: `82335957bac1a6edde02003f1ef3915d5ed58e72`. Prima delle modifiche ogni file locale è stato confrontato con la tree Git remota. Nessun installer o archivio software modificato.

## Interventi
- Dieci destinazioni statiche in header/footer, nuovo Disegnatore online, pannello mobile con tastiera e funzionamento senza JavaScript. Ritorni Home/Torna/breadcrumb rimossi anche da guide e report; registri, generatori e test aggiornati.
- Home: servizi riequilibrati, prezzi sintetici e trattabili per superficie complessiva, teaser collaboratore, fiducia personale compatta, CTA preventivo, lezioni sintetiche, portfolio distinto dai tre plugin.
- FAQ: Home 6, Lezioni 4, AG CAD Tools 4, Contatti 4, Disegnatore online 3; YQArch conserva 5 domande brevi sui limiti effettivi. Informazioni tecniche estese negli ambiti della nuova landing e vicino ai campi pertinenti. JSON-LD aderente al testo visibile.
- Ribbon AG: screenshot originale `assets/plugins/ag-cad-tools-ribbon-original.png`, identico alla fonte fornita. Visualizzazione larga e bassa tramite contenitore CSS; clic per aprire il file completo. Non modificata né ricostruita l'interfaccia.
- Nuovo visual Recensioni: `assets/reviews/studio-{640,960}.{jpg,webp}`; nessun cliente o lavoro consegnato fittizio. Prompt: studio CAD/BIM editoriale di fascia professionale, disegni architettonici, modello fisico di casa e laptop, quercia/navy/bianco caldo, luce naturale, senza persone, loghi, stelle, recensioni o testo leggibile. Generazione ImageGen; esportazioni ottimizzate per dispositivo. Ritratto Contatti estratto dal ritratto reale già presente, senza modifiche all'identità.
- Privacy pubblica ripulita dall'app privata JobMailer, trasferita in pagina dedicata noindex,nofollow e assente da sitemap/menu. Il vecchio hash reindirizza alla policy separata. Nessun codice pubblico Gmail API; URL configurato nella console OAuth dell'app privata non accessibile da questo repository.

## Profili Google Maps

I reindirizzamenti sono stati risolti; Google ha poi richiesto un CAPTCHA per leggere gli indirizzi. L’utente ha confermato direttamente l’associazione il 4 ottobre 2026: link `jGcqtu9IW1WccgA6V` = Locate Varesino (CO), link `w1R3HKoVL3Cqr5KmB` = Cosenza (CS). Footer ordinato Cosenza, poi Locate Varesino, con le due diciture esatte richieste.

## Preventivo: difetti corretti e contratti conservati
- Campi inattivi disabilitati senza perdere le scelte; catalogo escluso quando non pertinente; completezza nuvola incide solo su servizi Scan. Campi nuvola/catalogo/localizzazione realmente visibili (rimossa regola CSS generale che li nascondeva).
- Superficie usata una sola volta, soglie/minimi e coefficienti conservati. Riepilogo include opzioni attive, non soltanto il nome del servizio. Superficie assente e richieste non calcolabili passano alla valutazione personale.
- Validazione intervalli/link HTTP(S), nomi dei file inseriti come testo, timeout, blocco doppio clic, sessione e payload riutilizzati al retry. Allegati completati non caricati nuovamente. Backend già dotato di deduplicazione upload, token, limiti, rate limit, storage e idempotenza submit: nessuna modifica al Worker.
- Successo solo per risposta HTTP positiva, `ok: true`, UUID coincidente con la sessione. Nessun lead per errori o conferme incomplete. Copia email opzionale e fallback esplicito.
- PDF informativo con riferimento, dati principali, dettagli/opzioni, filigrana, contatti e dicitura NON È UN PREVENTIVO DEFINITIVO. Stampa simulata e controllata graficamente; nessun invio reale nei test.

## Verifiche
Test unitari e sicurezza eseguiti localmente, inclusi nuovi casi di formule singole, sinergie, Scan, Revit, computi, catalogo, arrotondamenti, attendibilità e retry. Percorso completo del preventivo verificato con richieste intercettate. Il controllo iniziale su 33 pagine ha individuato overflow in due guide e focus mancante su una tabella: corretti con wrapping/min-width e regione tastiera.

La matrice CI verifica Chromium, Firefox e WebKit a 320, 360, 375, 390, 393, 412, 430, 600, 768, 800, 820, 1024, 1280, 1366, 1440, 1920 px. Verifica anche immagini, risorse interne, titoli, ID, consenso, axe, navigazione senza JS e invii simulati. Lighthouse confronta candidato e baseline in condizioni uguali: misure di laboratorio, non Core Web Vitals sul campo.

## Evidenze della versione di rilascio

- 91 test unitari/sicurezza superati localmente. Il candidato `0f43170010fc6daa8a5664f4f26519a39f84569e` ha superato l’audit completo delle 33 pagine nei tre motori e nelle 16 larghezze, il flusso preventivo simulato nei tre motori e la regressione Servizi.
- Il confronto Lighthouse ha identificato un salto mobile comune dovuto all’attivazione tardiva del menu. La versione finale applica lo stato JavaScript prima del primo rendering, mantenendo le dieci destinazioni visibili senza JavaScript. Sono stati corretti anche il contrasto delle etichette nel pannello cookie e il caricamento responsive dell’immagine del preventivo; l’audit axe ora verifica esplicitamente anche il pannello aperto.
- Controllo Lighthouse mobile mirato dopo queste correzioni: YQArch 98 prestazioni / 100 accessibilità / 100 SEO; Preventivo 98 / 100 / 100; CLS 0 per entrambe. Singole misure locali di laboratorio: non rappresentano dati utenti reali e possono variare tra esecuzioni. I confronti completi e gli artefatti CI della versione finale sono collegati alla [PR #16](https://github.com/andreagiaqui-83/andreagiaqui-83.github.io/pull/16).
- La pipeline sul ramo main attende la versione pubblicata, confronta le risorse e ripete i controlli live, con invii intercettati. La cronologia della PR e delle esecuzioni GitHub Actions costituisce la traccia del rilascio, senza trasformare un risultato locale in una dichiarazione di pubblicazione.

## Limiti della verifica

Nessun invio reale di email né collaudo dentro AutoCAD. Installer/ZIP lasciati invariati rispetto alla baseline. La configurazione della console OAuth di JobMailer non è accessibile dal repository; sono verificabili la policy separata e il reindirizzamento dal vecchio hash. Lighthouse è una misura sintetica, non una certificazione di Core Web Vitals sul campo.

## Ripresa e chiusura del candidato — 5 ottobre 2026

Recuperati i file finali e completato il trasferimento rimasto interrotto. Corretto il contrasto del titolo del pannello cookie anche nel rapporto storico YQArch 3.73, dove la regola locale dei titoli prevaleva sul colore del dialogo. Ripetuti e superati i 91 test, i controlli di sincronizzazione di navigazione/header/footer/checksum e l'audit Chromium delle 33 pagine alle 16 larghezze, con zero anomalie, compreso il pannello cookie aperto. I controlli remoti sul commit definitivo e la verifica della pubblicazione restano tracciati dalla PR #16 e dalle relative esecuzioni GitHub Actions.
