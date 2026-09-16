# Landing AutoCAD — revisione 17.4

Data: 16 settembre 2026. Pagina: https://andreagiaquinto.it/lezioni-autocad/

## Modifiche pubblicate

- H1 esplicito: «Lezioni AutoCAD online, su misura per te.» Il testo iniziale chiarisce 2D/3D, lezioni individuali dal vivo, studenti e professionisti.
- Una testimonianza di Lucia C. compare subito dopo la hero. Il testo è ripreso integralmente dalla recensione già presente, con collegamento alle altre recensioni.
- La sessione gratuita descrive tre risultati: individuare il livello, scegliere un obiettivo concreto e proporre argomenti ed esercizi personalizzati. Restano 30 minuti gratuiti e 15 €/ora per le lezioni successive.
- La sezione prezzi precede il visual CAD → render. Il visual usa un layout compatto con testo e immagine affiancati su desktop, mantenendo l’intera immagine e chiarendo che l’offerta riguarda AutoCAD 2D e 3D.
- Il testo sotto il modulo spiega che giorno e orario vengono concordati dopo il contatto e che la richiesta è senza impegno.
- Titolo Open Graph coerente con la nuova hero; CSS aggiornato con identificativo 17.4.
- Preservati: homepage, immagini dei tre punti approvate nella 17.3, correzione «diverso. La», recensioni, backend, consenso e configurazione del tracking.

Commit della pagina: `2aeae7f3bcfd7072fbaf0c2f95f0156492aa7436`.
GitHub Pages: esecuzione `35160362854`, completata con successo. Il browser pubblico restituisce `20260916-autocad-v17.4`.

## Verifiche eseguite su questa revisione

| Controllo | Esito e limite |
|---|---|
| Test esistenti di modulo, backend, idempotenza e consenso | 11 superati, nessun fallimento |
| Struttura HTML | Un H1, ID univoci, ancore interne valide, JSON-LD interpretabile |
| Testimonianza iniziale | Testo corrispondente alla recensione esistente |
| Desktop, browser pubblico a 1363 px | Hero, prezzi, visual compatto e contatto osservati; nessun overflow orizzontale; nessuna immagine caricata risultata danneggiata |
| Google attualmente inattivo | ID vuoti verificati nel repository; nessuno script Google presente nel DOM osservato |
| Pubblicazione | Distribuzione riuscita e versione verificata sul sito |
| Console | Nei messaggi esaminati risultano errori dell’estensione del browser, non attribuibili al codice della landing |
| Invio reale e ricezione email | Non eseguiti: il controllo automatico di approvazione ha bloccato il test prima della compilazione e dell’invio |

Questi controlli non equivalgono a una nuova verifica completa su 13 larghezze. Il rapporto della versione 17.2 documenta quella verifica precedente; non va presentato come test della 17.4. Restano da ripetere il controllo visivo su smartphone/tablet e le ulteriori larghezze desktop con un ambiente che consenta il cambio della viewport. Nessun nuovo punteggio Lighthouse, PageSpeed o dato Core Web Vitals sul campo è stato misurato.

## Passaggi ancora necessari prima della spesa pubblicitaria

1. **Posta:** autorizzare ed eseguire una richiesta tecnica attraverso il modulo, verificarne arrivo e contenuto nella casella prevista. Il backend configurato usa `onboarding@resend.dev`; verificare/configurare un mittente di dominio verificato prima dell’uso stabile. Una risposta positiva del server non dimostra da sola la consegna nella posta in arrivo.
2. **Google Analytics e Ads:** recuperare gli ID reali delle proprietà/account corretti e completare la procedura in `AUTOCAD-GOOGLE-ADS.md`. La configurazione non è ancora attiva. Importare una sola conversione primaria `generate_lead`; click e aperture sono micro-eventi.
3. **Consenso e attribuzione:** collaudare Tag Assistant/DebugView dopo l’attivazione, verificare rifiuto, consenso e revoca, assenza di duplicati e corretta conversione. Aggiornare contestualmente l’informativa sui servizi effettivamente attivati.
4. **Verifica finale:** ripetere responsive e accessibilità della versione corrente; misurare le prestazioni su mobile. I dati sul campo richiedono traffico reale.
5. **Campagna:** verificare stime nel Keyword Planner, località, lingua, orari, esclusioni, budget sostenibile e annunci. Non sono stati creati né avviati annunci a pagamento. Il piano e le bozze già predisposti non equivalgono a campagne configurate nell’account.

Search Console: proprietà, verifica del dominio e invio della sitemap restano da confermare nell’account. Sitemap e impostazioni lato sito erano già predisposte. Non è stata verificata l’indicizzazione effettiva.

Le immagini dei tre punti restano ricostruzioni dichiarate, non screenshot autentici di AutoCAD 2027. La sostituzione con esercizi reali richiede materiale originale. Nessun aumento del tasso di conversione è stato misurato: le modifiche andranno valutate sul traffico effettivo.

**Esito: GO per continuare la preparazione della campagna; NO-GO per avviare la spesa finché i controlli essenziali sopra restano aperti.**
