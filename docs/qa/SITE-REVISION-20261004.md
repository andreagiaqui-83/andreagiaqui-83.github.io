# Revisione cumulativa del sito — 4 ottobre 2026

Baseline remota: `82335957bac1a6edde02003f1ef3915d5ed58e72`. Prima delle modifiche ogni file locale è stato confrontato con la tree Git remota. Nessun installer o archivio software modificato.

## Interventi
- Dieci destinazioni statiche in header/footer, nuovo Disegnatore online, pannello mobile con tastiera e funzionamento senza JavaScript. Ritorni Home/Torna/breadcrumb rimossi anche da guide e report; registri, generatori e test aggiornati.
- Home: servizi riequilibrati, prezzi sintetici e trattabili per superficie complessiva, teaser collaboratore, fiducia personale compatta, CTA preventivo, lezioni sintetiche, portfolio distinto dai tre plugin.
- FAQ: Home 6, Lezioni 4, AG CAD Tools 4, Contatti 4, Disegnatore online 3; YQArch conserva 5 domande brevi sui limiti effettivi. Informazioni tecniche estese negli ambiti della nuova landing e vicino ai campi pertinenti. JSON-LD aderente al testo visibile.
- Ribbon AG: screenshot originale `assets/plugins/ag-cad-tools-ribbon-original.png`, identico alla fonte fornita. Visualizzazione larga e bassa tramite contenitore CSS; clic per aprire il file completo. Non modificata né ricostruita l'interfaccia.
- Nuovo visual Recensioni: `assets/reviews/studio-{640,960}.{jpg,webp}`; nessun cliente o lavoro consegnato fittizio. Prompt: studio CAD/BIM editoriale di fascia professionale, disegni architettonici, modello fisico di casa e laptop, quercia/navy/bianco caldo, luce naturale, senza persone, loghi, stelle, recensioni o testo leggibile. Generazione ImageGen; esportazioni ottimizzate per dispositivo. Ritratto Contatti estratto dal ritratto reale già presente, senza modifiche all'identità.
- Privacy pubblica ripulita dall'app privata JobMailer, trasferita in pagina dedicata noindex,nofollow e assente da sitemap/menu. Il vecchio hash reindirizza alla policy separata. Nessun codice pubblico Gmail API; URL configurato nella console OAuth dell'app privata non accessibile da questo repository.

## Preventivo: difetti corretti e contratti conservati
- Campi inattivi disabilitati senza perdere le scelte; catalogo escluso quando non pertinente; completezza nuvola incide solo su servizi Scan. Campi nuvola/catalogo/localizzazione realmente visibili (rimossa regola CSS generale che li nascondeva).
- Superficie usata una sola volta, soglie/minimi e coefficienti conservati. Riepilogo include opzioni attive, non soltanto il nome del servizio. Superficie assente e richieste non calcolabili passano alla valutazione personale.
- Validazione intervalli/link HTTP(S), nomi dei file inseriti come testo, timeout, blocco doppio clic, sessione e payload riutilizzati al retry. Allegati completati non caricati nuovamente. Backend già dotato di deduplicazione upload, token, limiti, rate limit, storage e idempotenza submit: nessuna modifica al Worker.
- Successo solo per risposta HTTP positiva, `ok: true`, UUID coincidente con la sessione. Nessun lead per errori o conferme incomplete. Copia email opzionale e fallback esplicito.
- PDF informativo con riferimento, dati principali, dettagli/opzioni, filigrana, contatti e dicitura NON È UN PREVENTIVO DEFINITIVO. Stampa simulata e controllata graficamente; nessun invio reale nei test.

## Verifiche
Test unitari e sicurezza eseguiti localmente, inclusi nuovi casi di formule singole, sinergie, Scan, Revit, computi, catalogo, arrotondamenti, attendibilità e retry. Percorso completo del preventivo verificato con richieste intercettate. Il controllo iniziale su 33 pagine ha individuato overflow in due guide e focus mancante su una tabella: corretti con wrapping/min-width e regione tastiera.

La matrice CI verifica Chromium, Firefox e WebKit a 320, 360, 375, 390, 393, 412, 430, 600, 768, 800, 820, 1024, 1280, 1366, 1440, 1920 px. Verifica anche immagini, risorse interne, titoli, ID, consenso, axe, navigazione senza JS e invii simulati. Lighthouse confronta candidato e baseline in condizioni uguali: misure di laboratorio, non Core Web Vitals sul campo.

Stato di pubblicazione e risultati CI finali: da completare dopo le esecuzioni remote e la verifica del sito online. Non equiparare un test simulato alla consegna reale delle email o a un collaudo dentro AutoCAD.
