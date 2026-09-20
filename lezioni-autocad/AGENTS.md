# Regole permanenti — landing lezioni AutoCAD

Direttiva di Andrea del 20 settembre 2026. Si applica a ogni futura modifica della pagina `/lezioni-autocad/`, richiesta dall'utente o proposta autonomamente, comprese le modifiche alle risorse condivise che producono effetti su questa landing.

## Principio

Ogni intervento deve tenere conto di tutte le ottimizzazioni già implementate. Conservare i miglioramenti validi e verificarne l'integrità; sostituire una soluzione solo quando la nuova soluzione soddisfa gli stessi requisiti e migliora il risultato. Una correzione locale non deve introdurre regressioni nelle altre aree.

## Prima di intervenire

- Leggere lo stato corrente del repository e della pagina pubblicata, i report pertinenti in `docs/AUTOCAD-*.md` e le decisioni commerciali più recenti. I report storici non dimostrano che una configurazione sia ancora attiva o che un test sia ancora valido.
- Controllare modifiche locali e aggiornamenti remoti. Integrare gli interventi concorrenti senza sovrascriverli.
- Valutare l'impatto della modifica su tutte le aree elencate sotto, anche quando la richiesta riguarda solo un testo, un'immagine o una singola sezione.
- Mantenere distinta la landing delle lezioni dalla homepage dei servizi. Verificare la destinazione dei collegamenti tra le due pagine e l'effettiva disponibilità dei servizi promossi.

## Aree da preservare e migliorare

1. **SEO e comprensione dei contenuti:** intento di ricerca, testi naturali, titoli e gerarchia delle intestazioni, metadati, canonical, indicizzabilità, dati strutturati veritieri, ALT e collegamenti. Evitare ripetizioni e keyword stuffing; conservare le ottimizzazioni pertinenti a GEO/AI Search.
2. **Google Ads e conversioni:** coerenza tra query, annuncio, offerta, pagina e CTA; visibilità e chiarezza del percorso di contatto; corretto funzionamento del modulo. Preservare gli eventi e distinguere clic e altre micro-conversioni da richieste realmente confermate. Budget e durata delle campagne restano quelli stabiliti dall'utente.
3. **Impaginazione responsive:** PC, tablet e smartphone; titoli, interruzioni di riga, immagini, griglie, spaziature, menu, footer, moduli, CTA fisse e banner cookie. Nessun overflow orizzontale, sovrapposizione o ritaglio che renda il contenuto incomprensibile.
4. **Qualità grafica:** coerenza visiva, proporzioni, allineamenti, contrasto, leggibilità, nitidezza e credibilità tecnica delle immagini. Non presentare illustrazioni come schermate autentiche o lavori realmente consegnati.
5. **Lingua:** controllo grammaticale, ortografico e sintattico dei testi modificati e delle frasi adiacenti. Controllare punteggiatura, accenti, apostrofi, spazi tra parole e dopo i segni di interpunzione, anche quando tag HTML o a capo vengono nascosti su mobile. Rileggere il risultato effettivamente visualizzato.
6. **Accessibilità e usabilità:** struttura semantica, nomi accessibili, testi alternativi, etichette, focus, tastiera, dimensioni dei controlli e feedback comprensibile dei moduli.
7. **Prestazioni e stabilità:** immagini responsive ottimizzate, caricamento appropriato, dimensioni esplicite, assenza di risorse inutili e spostamenti di layout evitabili. Tenere conto di LCP, CLS e INP senza sacrificare la qualità visiva.
8. **Misurazione, consenso e privacy:** preservare le configurazioni effettivamente presenti, le preferenze di consenso e la prevenzione dei duplicati. Non inventare ID, dati, recensioni o risultati e non trasmettere dati personali nei parametri degli eventi.

## Verifica e conclusione

- Eseguire controlli pertinenti al tipo di modifica; per testi e documentazione non creare test automatici che replichino semplicemente il contenuto.
- Per modifiche che incidono su grafica o impaginazione, controllare nel browser desktop, tablet e mobile e osservare screenshot reali. Verificare le larghezze concordate: 320, 360, 375, 390, 412, 430, 600, 768, 800, 1024, 1366, 1440 e 1920 px. Registrare quelle effettivamente controllate e qualsiasi limite degli strumenti.
- Provare le interazioni interessate; eseguire i test esistenti pertinenti quando vengono modificati codice, moduli, consenso o tracking. Gli invii reali e le azioni sugli account seguono le autorizzazioni dell'utente già disponibili.
- Ricontrollare la versione pubblicata quando l'intervento modifica il sito. Rimuovere eventuali pagine temporanee di verifica.
- Documentare cambiamenti, controlli eseguiti, eventuali regressioni corrette e problemi residui. Distinguere preparazione tecnica e verifica effettiva negli account; dichiarare soltanto risultati realmente verificati.
- Non considerare automaticamente la landing pronta per una campagna perché una modifica grafica è riuscita. Il giudizio di prontezza deve riflettere anche stato reale di modulo, consenso, tracking e conversioni.

Le successive istruzioni esplicite dell'utente possono aggiornare queste regole. Non usare questo documento per aggiungere richieste di approvazione a interventi già autorizzati.
