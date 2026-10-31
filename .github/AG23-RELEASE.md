# AG CAD Tools 2.3 — rilascio confermato

Il 30 ottobre 2026 Andrea ha confermato il collaudo dell’installer corretto: apertura di BlockHub, inserimento di un blocco, riapertura e nuovo avvio dopo il riavvio di AutoCAD. Il rapporto aggiornato della chat del plugin registra quattro aperture concluse senza violazioni di accesso, caricamento 222/222 strumenti e 573/573 nomi di comando, alias e servizi, Ribbon 2.3 attiva e verifiche di Disegna muri e Muro stratigrafico su AutoCAD 2027 italiano. La precedente sospensione della pubblicazione è chiusa.

## Pacchetto invariato

- Installer: `AG_CAD_Tools_2.3_Setup.exe`, 63.328.768 byte.
- SHA-256: `81c232304e3402adea26f90531e7c77f5c18ffddf993b08eccf8d52fdda719a5`.
- Non usare il primo EXE 2.3, hash `92bc55d1bf7d8512c20bf6ee67d9ef0ddadd923706063335f95276385a8c62d8`.
- L’installer non è stato ricompilato dopo il collaudo. La guida e la compatibilità web aggiornano lo stato di conferma; i documenti incorporati nell’EXE conservano la situazione precedente al riscontro.
- I test su questo ambiente non costituiscono una matrice nativa completa Windows/AutoCAD/lingua.

## Sito

Nuova pagina con gratuità in evidenza, sei novità, quattro comandi personali, BlockHub, Muri e pilastri, Ribbon, guida e programma 2.4. Immagini autentiche fornite dall’autore; conteggi del pacchetto distinti da quelli delle schermate personalizzate: 222 strumenti AG, 20 scorciatoie native, 5.131 blocchi standard in 100 categorie, 298 schede della guida e sette gruppi Ribbon.

Aggiornati Home, ponti storici, README, manifest, checksum e controlli di rilascio. Un solo installer corrente. Conservati alias storici nella mappa CSV, licenze e limiti documentati. CSS della guida circoscritto al contenuto. Nessuna modifica a backend, prezzi, portfolio, moduli, consenso o misurazione.

## Verifica

- Identità SHA-256 dell’EXE e degli 11.068 file incorporati verificate senza eseguire o ricostruire il software.
- 101 test automatici del sito superati; collegamenti e ricerca della guida verificati.
- Anteprima desktop e mobile 320 px, con correzione della larghezza dei contatori.
- La pubblicazione richiede inoltre i workflow `plugins-verified.yml` e `site-complete-audit.yml` e la verifica dell’installer pubblico. Nessun invio, commento o lead reale durante i test.

## 31 ottobre 2026 — Icone e schermata BlockHub

Le quattro schede dei comandi personali utilizzano i PNG originali estratti senza modifiche dalle rispettive schede della guida distribuita. Gli asset sono in `assets/plugins/commands/`; nessuna modifica a guida o installer.

Schermata aggiornata: `assets/plugins/blockhub-2.3-corrected.png`. Rimosso soltanto il suffisso errato dopo «prospetto» nella prima tessera e nel dettaglio selezionato. Modifica con imagegen integrato, poi integrazione limitata alle due aree del refuso sull’originale, preservando tutti gli altri pixel e le dimensioni 1352 × 878. Prompt: «Remove ONLY the accidental nonsense suffix after the word prospetto in TWO places: the selected green-bordered first cabinet tile and the bold selected-item heading. Both labels must end at prospetto. Preserve all other screenshot content, text, layout and colors.»
