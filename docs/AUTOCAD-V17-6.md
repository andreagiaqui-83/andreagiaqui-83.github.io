# AutoCAD 17.6 — aggiornamento dei testi delle immagini

17 settembre 2026. Baseline: 17.5, commit `33d42d3238083c16180ee6e455831a81dfbe463c`.

## Richiesta e modifica

Rimossi, su richiesta del titolare, i riferimenti alla generazione con IA dalla landing: nota sotto le tre immagini didattiche, nota del visual CAD/render, testi alternativi delle tre immagini e descrizione della finestra di ingrandimento. Restano le descrizioni del contenuto delle immagini, le istruzioni di zoom e la frase «Gli esercizi vengono scelti in base al tuo percorso». Non sono state introdotte affermazioni di autenticità degli screenshot.

Unico file pubblico modificato: `lezioni-autocad/index.html`. Build `20260917-autocad-v17.6`. I file CSS e JavaScript restano quelli della 17.5, perché non sono stati modificati. Immagini, sorgenti responsive, link, ID, hero, recensioni, moduli, prezzi, backend, consenso e homepage dei servizi sono preservati. Nessun caricamento o ricampionamento di immagini.

## Verifica prima della pubblicazione

Candidate commit `e27ca179d86c7861d857dc7b6e3b2a23c0d4e17b`, blob HTML `a930e5eb089c4e6980b3308894084ac6fa99151e`.

Workflow di staging: `35209862758`, completato con successo. Artifact `10491388996` (autocad-copy-176-validated).

- 11 controlli strutturali di preservazione superati, inclusi 12 elementi img/source invariati salvo i testi alternativi richiesti.
- 11/11 test isolati di frontend e backend superati; email simulate.
- 13/13 larghezze browser, da 320 a 1920 pixel, superate sul candidato servito localmente nel runner.
- 39 aperture delle immagini, zoom, Escape e ritorno del focus verificate.
- Anteprima senza render verificata.
- Schermate desktop e visualizzatore mobile esaminate.

Questi risultati riguardano il candidato prima del deploy; non costituiscono da soli prova di pubblicazione né nuovi punteggi Lighthouse. La pubblicazione e i controlli sul dominio vanno confermati dopo il deploy. Nessuna email reale inviata e nessuna campagna attivata.

## Google — stato invariato

`assets/measurement-config.js` conserva gli ID reali ancora vuoti. GA4 e Ads non sono stati attivati. Restano necessari l'accesso del titolare agli account, l'identificativo reale dello stream GA4, il collaudo di consenso/conversioni e l'aggiornamento dell'informativa prima dell'attivazione. Le integrazioni per leggere i report sono separate dall'installazione del tag sul sito. Non inventare ID o budget; non avviare spesa pubblicitaria.
