# YQArch Italiano 3.78 — 3 ottobre 2026

Release di pubblicazione successiva al collaudo della 3.77. Il CUIx della Ribbon, le icone, le macro, il core compilato, il catalogo e le anteprime restano identici alla versione appena provata. Non vengono introdotte nuove modifiche geometriche.

## Ribbon e comandi
Dieci pannelli: ciascuno contiene un comando principale grande affiancato a cinque piccoli su due righe interne (3+2), più sette accessi nel flyout. Totale: 60 accessi visibili e 70 nel flyout, 130 accessi promossi conservati; 23 categorie e 547 voci del menu storico. Gli identificatori 367/372 rimangono stabili.
La diagnostica completa ora descrive correttamente 10 grandi + 50 piccoli visibili + 70 nel flyout. Il registro comprende 646 comandi, inclusi helper e pannelli.

## Evidenza nativa acquisita
Il 3 ottobre 2026 l'utente ha approvato la 3.77 su AutoCAD 2027 italiano, ACADVER 26.0s, LISPSYS=1, Windows NT 10.0 Intel64. Il log rileva 646/646 comandi definiti, zero mancanti, un menu principale, 23/23 categorie, 547 voci e DLL icone presenti. Le due schermate Inizio/YQArch confermano la medesima altezza della Ribbon nel suo ambiente. I pannelli possono ridursi in base alla larghezza disponibile.
Il bootstrap YQArch ha misurato 1922 ms: non è il tempo dell'intero avvio AutoCAD. I comandi non sono stati eseguiti dal report e non viene certificata individualmente la loro geometria. La 3.78 è verificata automaticamente; il riscontro grafico nativo riguarda la 3.77 con CUIx identico.

## Installazione completa
Chiudere AutoCAD, avviare YQArch_Italiano_3.78.exe e riaprire AutoCAD. Backup, journal, rollback, impostazioni personali e gestione di più profili sono preservati. La pulizia delle cache comprende le versioni precedenti fino alla 3.77. Nessuna copia manuale richiesta.
SECURELOAD, TRUSTEDPATHS, LISPSYS, CUI principale e altri plugin non vengono modificati. Il launcher PE storico 3.71 è conservato e contiene il payload completo ricostruito; non è una patch differenziale e non è firmato Authenticode.

## Catalogo e documentazione
Preservati 195 DWG, 17 categorie e 195 anteprime; inserimento Selezione → Inserisci → punto nel DWG → completamento, con riapertura solo opzionale dopo successo. Le cinque funzioni blocchi complete del core e gli strumenti rapidi separati restano invariati.
Guida con 646 schede, schema Ribbon, compatibilità e pagina Sostieni aggiornati. Le schede del core non esaminabile conservano indicazioni generali: non viene dichiarata la revisione specifica di ogni procedura né la traduzione completa di ogni prompt originale. Vedere KNOWN_ISSUES.md.

## Verifiche
Risultati della release in AUDIT_3.78; prove delle versioni precedenti in STORICO_AUDIT_3.76 e STORICO_AUDIT_3.77. Verifiche statiche, simulazioni, integrità dell'EXE e riproducibilità sono distinte dal collaudo nativo. La compatibilità con ogni altra coppia AutoCAD/Windows richiede una prova specifica.
