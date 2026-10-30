# Pubblicazione di AG CAD Tools

Stato corrente: 30 ottobre 2026. Questa specifica sostituisce le istruzioni storiche di pubblicazione dei prodotti separati.

- Una sola pagina: `/ag-cad-tools/`, voce «Plugin AG CAD Tools». AG sono le iniziali di Andrea Giaquinto. BlockHub fa parte del plugin; non usare «BlockHub CAD» nelle prose correnti.
- Unico installer: AG CAD Tools 2.3, 63.328.768 byte, SHA-256 `81c232304e3402adea26f90531e7c77f5c18ffddf993b08eccf8d52fdda719a5`. Non ricompilare o modificare l’EXE. Il manifest `downloads/releases.json` contiene soltanto questa distribuzione.
- Ritirati dal ramo corrente tutti i pacchetti e la documentazione delle vecchie versioni, come richiesto dall’autore. Non recuperarli automaticamente dalla storia Git. Le vecchie landing sono ponti noindex con canonical verso AG CAD Tools; la vecchia guida Express rimanda alla guida corrente.
- Conservare tutte le 298 schede della guida: 222 strumenti AG e 20 accessi nativi; 573 nomi pubblici comprendono comandi, alias e servizi, non 573 strumenti distinti. Mantenere limiti, mappa dei comandi e attribuzioni.
- BlockHub comprende 5.131 asset standard in 100 categorie, inclusi i blocchi dinamici conservati dalla libreria precedente. Non definire dinamica l’intera libreria. YQArch non è incluso: nella 2.3 sono disponibili implementazioni AG indipendenti analoghe alle funzioni di Muri e pilastri; Porte e finestre è nel programma 2.4. Non promettere equivalenza completa. Express Tools: implementazioni proprie, non componenti Autodesk né garanzia di comportamento identico.
- Compatibilità dichiarata: AutoCAD completo Windows x64 2024–2027. Riferimento nativo verificato dall’autore: 2027 italiano, Windows 11. Non estendere la verifica a tutti gli ambienti. LT, Mac, Web e altri CAD non sono certificati.
- Le fonti MIT sono componenti riutilizzabili e modificabili alle condizioni della relativa licenza; conservarne gli avvisi. Non dichiarare tutto il plugin MIT. [Testo MIT ufficiale](https://opensource.org/license/mit).
- Ribbon autentica con BlockHub: solo il ritaglio senza la barra del titolo educativa, anche nell’ingrandimento. Installer: schermata autentica della 2.3. Non ricostruire l’interfaccia.
- Sostegno volontario: PayPal `andrea.giaqui@gmail.com`, Postepay P2P `333 724 0544`. Non inventare altri destinatari o collegamenti. Nessun trasferimento automatico.
- Bacheca AG: conservare la chiave tecnica `express-tools` e i contratti del backend. Commenti moderati, nessun dato dei commenti nei tracciamenti, nessuna conversione commerciale. Non inviare commenti o notifiche reali durante il collaudo.
- Sincronizzare header/footer/navigazione e checksum. Eseguire unit test e workflow `plugins-verified.yml`, verificare le pagine desktop/mobile e l’integrità dei download pubblici prima di dichiarare completato il rilascio.


### 2026-10-29 — Bacheca AG CAD Tools

Il modulo pubblico presenta nome/nickname e commento, oltre al consenso privacy. I precedenti campi tipo/ambiente sono nascosti e mantengono il contratto API; risposte, moderazione firmata e antispam restano invariati. La grafica dedicata è in `assets/plugins/discussion.css`. Verificare sempre l’invio con API simulate, senza creare contributi reali.

### 2026-10-30 — Versione 2.3 confermata

La richiesta autorizza la sostituzione con la 2.3. Il rapporto aggiornato e la conferma diretta dell’autore attestano il buon funzionamento dell’EXE corretto su AutoCAD 2027 italiano. La sospensione relativa a BlockHub è chiusa. Identità e perimetro in `.github/AG23-RELEASE.md`. Conservare l’EXE byte per byte e aggiornare lo stato solo nella documentazione web. Non estendere la prova nativa alle altre configurazioni.
