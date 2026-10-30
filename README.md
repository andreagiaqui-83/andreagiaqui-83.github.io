# Andrea Giaquinto — Disegnatore CAD e BIM

Sito statico pubblicato con GitHub Pages: [servizi CAD e BIM di Andrea Giaquinto](https://andreagiaquinto.it/?utm_source=github&utm_medium=referral&utm_campaign=repository_sito).
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

## Progetto gratuito per AutoCAD
[AG CAD Tools 2.3](https://andreagiaquinto.it/ag-cad-tools/?utm_source=github&utm_medium=referral&utm_campaign=repository_sito) riunisce i comandi in italiano e BlockHub. [Guida](https://andreagiaquinto.it/downloads/ag-cad-tools/AG_CAD_Tools_Help.html) e [compatibilità](https://andreagiaquinto.it/downloads/ag-cad-tools/AG_CAD_Tools_Compatibilita.html) descrivono requisiti e limiti verificati.

## Download
È distribuito soltanto l’installer approvato di **AG CAD Tools 2.3**, scaricabile dalla pagina del plugin. Versione, dimensione e SHA-256 sono registrati in `downloads/releases.json`. I pacchetti superati e la relativa documentazione sono stati ritirati dal ramo corrente. L’installer collaudato non viene ricostruito durante la pubblicazione del sito.

## Misurazione e collaudo
Per le visite manuali di controllo aprire `https://andreagiaquinto.it/?ag_test=1`: nella stessa scheda i tag Google restano disattivati, anche con consenso già presente. Per uscire aprire `?ag_test=0` o chiudere la scheda. Questa opzione non simula il backend: i test di invio devono continuare a intercettare le richieste.

Servizi: `service_quote_success`; lezioni: `generate_lead`. Clic e inizi modulo sono interazioni secondarie. [Regole operative, UTM e limiti di verifica](docs/MEASUREMENT-20261022.md); [estensione del report gratuito](docs/google-reporting-free/README.md).
