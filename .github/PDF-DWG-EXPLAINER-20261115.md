# Approfondimento PDF → DWG — 15 novembre 2026

Richiesta dell’autore e pacchetto `Astra_Aggiornamento_sito_AUTOCAD_PDF_DWG(1).zip`: integrare un esempio tecnico-commerciale nella pagina esistente `/pdf-in-dwg/`, con un richiamo dal riquadro IA sempre visibile in Disegnatore online. Nessuna nuova pagina e nessun contatto duplicato.

## Contenuto e immagine

- Ancora pubblica: `/pdf-in-dwg/#conversione-automatica-dwg`.
- Quattro controlli nativi espandibili: spessori, gradini/collegamenti, aperture, retini/quote/layer. I numeri sono esempi di anomalie possibili, non risultati misurati su una conversione reale o standard dimensionali obbligatori.
- Infografica rielaborata come SVG vettoriale originale, ingrandibile e senza JavaScript. Riprende il confronto schematico del materiale fornito; non è un elaborato CAD da misurare. Lo spessore 0,3089 m è quotato perpendicolarmente alle facce del muro. Testo alternativo, descrizione interna SVG e didascalia espliciti.
- L’SVG sostituisce la composizione raster molto affollata: nessuna scritta «prezzo lordo», nessuna promessa di errori inevitabili o di PDF sempre incluso, nessun ricampionamento che alteri un disegno tecnico del portfolio. La grafica è scalabile senza dipendere dalla risoluzione di un bitmap.
- 100 m² lordi × tariffa di partenza 0,20 €/m² = 20 € è soltanto l’esempio commerciale richiesto. Superficie lorda e trattamento fiscale sono distinti; scope, tempi, costo e oneri si confermano dopo la valutazione dei materiali.
- Il PDF tecnico è citato esclusivamente come formato di consegna concordato del servizio. Nessun PDF o CAD del portfolio viene creato o pubblicato.

Terminologia verificata nella documentazione primaria Autodesk: [Importazione PDF](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-LT/files/GUID-1202CC8A-364F-4E93-8E86-6F476CD83C72.htm) e [Importa PDF](https://help.autodesk.com/cloudhelp/2025/ITA/AutoCAD-Core/files/GUID-F94D7059-5B4A-4396-97FE-765B1D037D56.htm). PDF vettoriali e scansioni raster non sono equivalenti; alcuni oggetti composti possono diventare entità separate. I valori numerici illustrativi provengono dall’autore, non dalle fonti Autodesk.

## Perimetro preservato

Home, navigazione/footer, moduli, API, consenso, reporting gratuito, misurazione, plugin, installer, redirect e `llms.txt` invariati. CSS limitato ai nuovi componenti. Nessun framework, script o servizio aggiunto.

Il prompt più recente impone di non modificare `sitemap.xml`: il file e le sue date restano byte-identici. In `scripts/sitemap-content.json` sono registrati soltanto i nuovi hash semantici delle due pagine, conservando i `lastmod` esistenti. Il generatore e il test deterministico non vengono alterati; non si inventano nuove date nella sitemap. I `dateModified` delle due pagine riflettono la modifica effettiva del 15 novembre.

## Verifica

Baseline: main `adbfbdde0e42266e59c33ba554b96d9af98bd117`, due pagine pubbliche verificate identiche alle sorgenti prima della modifica. Rerun storico del workflow plugin ora verde; non è stato ritoccato il test privacy.

Controlli locali: 118 test passati, sincronizzazione header/footer e sitemap deterministica conformi. Anteprima visuale e interazione dei disclosure, apertura SVG e collegamento contestuale verificati nel browser. Le verifiche complete del repository su Chromium, Firefox e WebKit e il confronto prestazioni vengono eseguiti sul candidato prima della promozione; la versione pubblica viene poi verificata dopo il deploy. Nessun invio reale.
