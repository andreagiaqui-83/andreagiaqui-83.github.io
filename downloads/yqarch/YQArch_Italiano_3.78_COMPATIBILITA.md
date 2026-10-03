# Compatibilità YQArch Italiano 3.78

## Evidenza disponibile
Collaudo nativo della 3.77 approvato dall'utente il 3 ottobre 2026: AutoCAD 2027 italiano, ACADVER 26.0s, LISPSYS=1, Windows NT 10.0 Intel64. Comandi definiti 646/646, menu e struttura PASS, Ribbon alla stessa altezza di Inizio. La 3.78 conserva byte per byte il CUIx e i componenti funzionali della 3.77; cambiano riferimenti di versione, descrizione diagnostica e documentazione. Il report non esegue né certifica la geometria di ogni comando. Le prove storiche su AutoCAD 2026 restano riferite alle loro versioni.

| Versioni | Livello verificato |
|---|---|
| AutoCAD completo 2010–2027 Windows | Percorsi progettati e controlli statici; nessuna certificazione di tutte le versioni. CUIx caricato da ACADVER 18.0. Layout della 3.77 verificato su AutoCAD 2027 italiano e conservato nella 3.78. |
| AutoCAD completo 2007–2009 Windows | Percorso legacy menu/toolbar; 195 formati DWG leggibili. Prova nativa non eseguita. |
| AutoCAD completo 2004–2006 Windows | Percorso legacy parziale: 147 DWG leggibili, 48 AC1021 bloccati preventivamente. Prova nativa non eseguita. |

Il catalogo contiene 16 AC1009, 2 AC1014, 129 AC1018, 48 AC1021, tutti preservati. La leggibilità del formato non certifica l'intero plugin.
AutoCAD LT, Mac e CAD alternativi non sono certificati.

## Windows e sicurezza
EXE x64 con PowerShell e WPF dell'installer storico. Dipende dalla specifica coppia AutoCAD/Windows supportata da Autodesk. I requisiti Autodesk 2027 consultati richiedono Windows a 64 bit ancora supportato da Microsoft e .NET 10. Per le altre release valgono i loro requisiti; non è stata eseguita qui una prova Windows.
SECURELOAD, TRUSTEDPATHS e LISPSYS non sono modificati. SmartScreen può segnalare la reputazione dell'EXE non firmato: verificare provenienza e SHA senza disattivare le protezioni.

## Ribbon
Un'unica riga principale: 1 grande e 5 piccoli affiancati in sottopannello 3+2. Altri 7 accessi per pannello nel flyout, categorie originali conservate. Le schermate della 3.77 confermano la stessa altezza di Inizio sul PC dell’utente. Questo riscontro non viene esteso a ogni risoluzione, scala DPI o altra versione AutoCAD.

## Fonti
- https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-ReleaseNotes/files/installation/INSTALLATION_REQUIREMENTS_AUTOCAD_2027.html
- https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-Customization/files/GUID-5DAC6811-BA2D-422D-9B2E-BC1E6C9A5C90.htm
- https://www.autodesk.com/it/support/technical/article/caas/sfdcarticles/sfdcarticles/ITA/drawing-version-codes-for-autocad.html
