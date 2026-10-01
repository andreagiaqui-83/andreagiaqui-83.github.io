# Andrea Giaquinto — Disegnatore CAD e BIM

Sito statico pubblicato con GitHub Pages su https://andreagiaquinto.it/.
La homepage presenta i servizi; lezioni AutoCAD e progetti gratuiti hanno landing separate.

## Manutenzione e pubblicazione
Leggere `AGENTS.md`, `lezioni-autocad/AGENTS.md`, `.github/SERVICES-PUBLICATION.md` e `.github/PLUGINS-PUBLICATION.md`.
Prezzi, recapiti, consenso e contratti dei moduli vanno preservati.

Le pagine pubbliche sono censite in `scripts/site-pages.json`. Dopo un aggiornamento:

```sh
npm ci
node scripts/sync-page-navigation.cjs
node scripts/sync-site-footer.cjs
npm test
```

I workflow verificano pagine locali e pubblicate con Chromium, Firefox e WebKit. I test dei moduli usano richieste ed email simulate.

## Moduli e dati
Preventivi, lezioni, recensioni e commenti usano il Worker in `cloudflare-worker/`, con Cloudflare R2 e notifiche tramite Resend. FormSubmit non è il backend attuale.
Gli allegati dei preventivi hanno limiti di 90 MiB per file e 500 MiB complessivi; per le nuvole di punti si usa il campo link cloud. I valori effettivi e la validazione sono definiti nel Worker. Non inviare richieste reali durante i test.

Il consenso condiviso è gestito da `assets/measurement.js`; la configurazione è in `assets/measurement-config.js`. Nessun tag Google viene caricato prima del consenso. I commenti dei progetti non generano conversioni commerciali.

## Download
Gli installer approvati sono ospitati in `downloads/`. Versioni, dimensioni e SHA-256 correnti sono registrati in `downloads/releases.json`. Gli EXE e ZIP collaudati non vengono ricostruiti durante la pubblicazione del sito.
