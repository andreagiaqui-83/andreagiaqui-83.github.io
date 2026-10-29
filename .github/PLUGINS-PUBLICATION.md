# Pubblicazione di AG CAD Tools

Stato corrente: 23 ottobre 2026. Questa specifica sostituisce le istruzioni storiche di pubblicazione dei prodotti separati.

- Una sola pagina: `/ag-cad-tools/`, voce «Plugin AG CAD Tools». AG sono le iniziali di Andrea Giaquinto. BlockHub fa parte del plugin; non usare «BlockHub CAD» nelle prose correnti.
- Unico installer: AG CAD Tools 2.2, 51.700.736 byte, SHA-256 `42f7cc51d4ef4bbf1931bd08bbfe64e33e41e7142c987b2fbe7c40d1737192c3`. Non ricompilare o modificare l’EXE. Il manifest `downloads/releases.json` contiene soltanto questa distribuzione.
- Ritirati dal ramo corrente tutti i pacchetti e la documentazione delle vecchie versioni, come richiesto dall’autore. Non recuperarli automaticamente dalla storia Git. Le vecchie landing sono ponti noindex con canonical verso AG CAD Tools; la vecchia guida Express rimanda alla guida corrente.
- Conservare tutte le 241 schede della guida: 219 strumenti AG, 2 servizi e 20 accessi nativi; 16 categorie AG più BlockHub. Mantenere limiti, mappa dei comandi e attribuzioni.
- BlockHub comprende 4.029 asset, inclusi 153 blocchi dinamici. Non definire dinamica l’intera libreria. YQArch non è incluso nella 2.2: descriverlo soltanto come riferimento per una futura implementazione indipendente di funzioni analoghe. Express Tools: implementazioni proprie, non componenti Autodesk né garanzia di comportamento identico.
- Compatibilità dichiarata: AutoCAD completo Windows x64 2024–2027. Riferimento nativo verificato dall’autore: 2027 italiano, Windows 11. Non estendere la verifica a tutti gli ambienti. LT, Mac, Web e altri CAD non sono certificati.
- Le fonti MIT sono componenti riutilizzabili e modificabili alle condizioni della relativa licenza; conservarne gli avvisi. Non dichiarare tutto il plugin MIT. [Testo MIT ufficiale](https://opensource.org/license/mit).
- Ribbon autentica con BlockHub: solo il ritaglio senza la barra del titolo educativa, anche nell’ingrandimento. Installer: schermata autentica della 2.2. Non ricostruire l’interfaccia.
- Sostegno volontario: PayPal `andrea.giaqui@gmail.com`, Postepay P2P `333 724 0544`. Non inventare altri destinatari o collegamenti. Nessun trasferimento automatico.
- Bacheca AG: conservare la chiave tecnica `express-tools` e i contratti del backend. Commenti moderati, nessun dato dei commenti nei tracciamenti, nessuna conversione commerciale. Non inviare commenti o notifiche reali durante il collaudo.
- Sincronizzare header/footer/navigazione e checksum. Eseguire unit test e workflow `plugins-verified.yml`, verificare le pagine desktop/mobile e l’integrità dei download pubblici prima di dichiarare completato il rilascio.


### 2026-10-29 — Bacheca AG CAD Tools

Il modulo pubblico presenta nome/nickname e commento, oltre al consenso privacy. I precedenti campi tipo/ambiente sono nascosti e mantengono il contratto API; risposte, moderazione firmata e antispam restano invariati. La grafica dedicata è in `assets/plugins/discussion.css`. Verificare sempre l’invio con API simulate, senza creare contributi reali.
