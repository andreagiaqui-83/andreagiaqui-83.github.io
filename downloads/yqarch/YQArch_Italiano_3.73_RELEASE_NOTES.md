# YQArch Italiano 3.73 — Release definitiva

## Base della release
La 3.73 nasce dalla **3.71 collaudata sul PC dell'utente**, nella quale risultano funzionanti la Ribbon aggiornata e l'inserimento diretto dei blocchi. Non viene riscritta l'architettura che ha risolto quei due problemi.

La Ribbon conserva il layout della 3.71: **10 pannelli**, ciascuno con **3 icone grandi + 10 piccole** (130 accessi diretti complessivi), oltre alle **23 categorie** e alle **547 voci** disponibili nelle espansioni.

## Collaudo reale completato
La release 3.73 è stata installata e verificata con esito positivo sul PC di riferimento con **AutoCAD 2026 italiano**. Sono stati confermati l'aggiornamento dell'installazione, la Ribbon e l'inserimento diretto dei blocchi.

## Correzione critica rispetto alla 3.72
La 3.72 poteva interrompersi durante **Aggiornamento profili** quando erano presenti più profili AutoCAD. La causa era una collisione tra la tabella PowerShell `$script:V` e la variabile di ciclo `$v`: PowerShell tratta i nomi delle variabili senza distinzione tra maiuscole e minuscole. La 3.73 usa `$script:VerifiedUnchanged` e `$menuVersion`, verifica la tabella con `.ContainsKey()` e include un test anti-regressione specifico. Il rollback della 3.72 resta valido: in caso di errore i file già modificati vengono ripristinati dal journal.

## Miglioramenti 3.73
- protezione permanente delle strutture e degli identificatori Ribbon già funzionanti;
- mantenimento del flusso blocchi: **Seleziona → Inserisci → punto nel DWG → inserimento completato**;
- controllo preventivo del formato DWG prima dell'inserimento, utile soprattutto con AutoCAD 2004–2006;
- installer alleggerito negli aggiornamenti: evita verifiche hash duplicate sui file già confrontati e identici;
- pulizia più estesa delle sole cache YQArch obsolete, senza toccare menu o CUI di altre applicazioni;
- rimozione di riferimenti di versione obsoleti e uniformazione dei documenti di installazione/pubblicazione;
- guida riesaminata: **646 schede**, introduzione e sezioni catalogo aggiornate, avvisi storici non più attuali rimossi.

## Compatibilità DWG del catalogo
I 195 blocchi inclusi sono suddivisi in:
- 16 file `AC1009`;
- 2 file `AC1014`;
- 129 file `AC1018` (AutoCAD 2004/2005/2006);
- 48 file `AC1021` (AutoCAD 2007/2008/2009).

Di conseguenza AutoCAD 2007 e successivi possono leggere tutti i formati del catalogo; AutoCAD 2004–2006 può leggere 147/195 file. Per i 48 più recenti la 3.73 interrompe l'inserimento con un messaggio esplicito anziché tentare un caricamento incompatibile.

## Compatibilità e collaudo
La compatibilità con AutoCAD e Windows è descritta con livelli di evidenza in `COMPATIBILITA_AUTOCAD_WINDOWS.md`. Non viene dichiarato un collaudo reale su tutte le versioni AutoCAD o Windows. AutoCAD LT e Mac non sono certificati.

I test automatici e statici verificano pacchetto, risorse, sintassi/struttura, catalogo, Ribbon, manifest, installer e regressioni note; non sostituiscono una prova dentro AutoCAD.

## Installazione
Chiudere AutoCAD prima dell'aggiornamento. Per l'EXE seguire la procedura standard; per sistemi legacy o installazioni manuali usare `INSTALLAZIONE_LEGACY.md`.

La 3.71 va conservata come rollback collaudato. Non disattivare le protezioni di AutoCAD e non modificare manualmente il CUI principale.