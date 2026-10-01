# YQArch Italiano 3.73 — Release definitiva

## Stato
La 3.73 è la release pubblicabile del 1 ottobre 2026. Deriva dalla 3.71 collaudata e preserva la Ribbon e il flusso di inserimento blocchi. Dopo la correzione dell'installer 3.72, la 3.73 è stata installata e collaudata sul PC di riferimento con AutoCAD 2026.

## Correzione critica
La 3.72 poteva interrompersi durante Aggiornamento profili in presenza di più profili AutoCAD. PowerShell non distingue maiuscole/minuscole nei nomi delle variabili: la tabella $script:V entrava in collisione con la variabile di ciclo $v. La 3.73 usa nomi distinti, verifica .ContainsKey() e include un test anti-regressione specifico.

## Funzioni preservate e miglioramenti
- Ribbon: 10 pannelli, 3 icone grandi + 10 piccole per pannello, 130 accessi diretti.
- 23 categorie e 547 voci nelle espansioni.
- Inserimento blocchi: Seleziona → Inserisci → punto nel DWG → inserimento completato.
- Controllo preventivo del formato DWG, utile soprattutto su AutoCAD 2004–2006.
- Installer ottimizzato evitando verifiche hash duplicate sui file già identici.
- Backup, journal e rollback conservati.
- Guida aggiornata con 646 schede.

## Catalogo
195 DWG: 16 AC1009, 2 AC1014, 129 AC1018, 48 AC1021. AutoCAD 2004–2006 può leggere 147/195 blocchi; i 48 AC1021 richiedono AutoCAD 2007+ e vengono intercettati prima dell'inserimento.

## Verifiche
184/184 test logici e anti-regressione, 71/71 controlli statici/risorse, 31/31 verifiche di packaging, ripetizione delle suite sul vero EXE estratto e seconda ricostruzione byte-identica. A questi si aggiunge il collaudo reale sul PC di riferimento di installazione/aggiornamento, Ribbon e inserimento blocchi.

La verifica non equivale a certificazione Autodesk e non prova ogni comando su ogni combinazione AutoCAD/Windows. La 3.71 resta il rollback collaudato. La 3.72 non deve essere distribuita.
