# Ripresa revisione AutoCAD — 17 settembre 2026

## Baseline da preservare

La pagina di riferimento è la **17.5**, build `20260917-autocad-v17.5`, commit `40662acfd04fc3b6f58e029e8027a6b45b61ca10` (Add accessible AutoCAD image detail viewer and render-free preview). Non ripristinare le vecchie riparazioni v16 o precedenti di altre chat.

La pubblicazione di questa revisione è riuscita: GitHub Pages run `35188341345`, conclusione success. Il contenuto della pagina, gli asset, il backend, il consenso, la homepage dei servizi e i relativi moduli non sono stati riscritti durante questa ripresa. Sono stati aggiunti controlli e documentazione.

## Verifiche completate sulla versione pubblica

Workflow `Verify AutoCAD 17.5 public release`, run **35194054534**, conclusione **success**. Artifact `10485565614`, `autocad-17-5-public-verification`.

- **13/13 viewport**: 320, 360, 375, 390, 412, 430, 600, 768, 800, 1024, 1366, 1440, 1920 pixel.
- Per ogni viewport: build corretta, risposta HTTP 200, immagini caricate e decodificate, un H1, ID univoci, ancore interne valide, JSON-LD interpretabile, canonical corretto, nessun overflow orizzontale oltre la tolleranza di 2 pixel, nessuna eccezione JavaScript osservata, nessun errore HTTP degli asset del dominio.
- **39 aperture delle immagini**: tre immagini per viewport; immagine caricata, dialogo entro il viewport, zoom/ripristino, chiusura con Escape e focus restituito al collegamento.
- Menu mobile e raggiungibilità del modulo contatti controllati.
- **11/11 test isolati** di frontend/backend, consenso, validazioni, idempotenza, errori, separazione recensioni e nomi pubblici. Le email di questi test sono simulate, non consegnate a una casella reale.
- Anteprima `?anteprima=senza-render`: nasconde soltanto `.visual-section`, mantiene i moduli e il canonical della landing; la nota di anteprima appare e la pagina è `noindex`.
- Un primo controllo dell'anteprima considerava soltanto le sezioni con ID, omettendo la sezione render priva di ID. È stato corretto il **test**, non alterata la pagina per ottenere un falso successo.
- Il browser non ha caricato script Google nella configurazione non attivata.

Le richieste non GET/HEAD/OPTIONS sono state bloccate durante il controllo browser. Nessuna richiesta dal modulo o recensione è stata inviata. Esaminate visivamente anche le schermate desktop/mobile e il visualizzatore immagini. Non è una certificazione completa di accessibilità e non comprende tutti i browser/dispositivi reali.

## Prestazioni: misurazione di laboratorio

Workflow `AutoCAD public performance audit`, run **35194304062**, conclusione success. Artifact `10485032690`, `autocad-public-lighthouse`. Lighthouse **12.8.2**, una esecuzione mobile e una desktop il 17/09/2026, circa 07:24 UTC.

| Misura | Mobile simulato | Desktop simulato |
|---|---:|---:|
| Performance | 84/100 | 100/100 |
| Accessibility, punteggio automatico | 100/100 | 100/100 |
| Best practices, punteggio automatico | 100/100 | 100/100 |
| SEO, punteggio automatico | 100/100 | 100/100 |
| LCP | 1,51 s | 0,29 s |
| Total Blocking Time | 649 ms | 0 ms |
| CLS | 0 | 0 |

Non sono Core Web Vitals degli utenti reali, né una previsione garantita di conversione o ranking. I risultati possono variare tra esecuzioni. Il punteggio 100 non elimina gli audit non ponderati: il report segnala una corrispondenza da migliorare fra testo visibile e nome accessibile del link del marchio. Restano opportunità di affinamento di immagini responsive, lavoro del thread principale su mobile e cache. Non peggiorare la nitidezza o rimuovere immagini approvate soltanto per inseguire un punteggio.

## Google Ads: materiale pronto, account non configurato

Le bozze sono conservate in `docs/ADS-AUTOCAD-BOZZE-20260917.json`: cinque gruppi, ciascuno con 12 titoli e quattro descrizioni, più candidati keyword/esclusioni. Limiti di lunghezza controllati nel generatore. Sono **bozze editoriali, non campagne create o annunci approvati da Google**.

Seguire `docs/AUTOCAD-GOOGLE-ADS.md`: lezioni AutoCAD online, 30 minuti gratuiti, poi 15 euro/ora; tenere separati i servizi CAD/BIM/render. Non è ancora stato ottenuto un preventivo CPC/volume dal Keyword Planner.

Sono state proposte le connessioni Adspirer (Google Ads) e Windsor.ai (Analytics/Search Console). **Nessuna connessione confermata** in questa ripresa. Non sono stati inventati ID, conversioni o accessi e non è stata avviata spesa.

## Passaggi aperti e autorizzazioni

1. **Email reale:** il test di consegna era stato sospeso nella chat precedente. Resta sospeso finché Andrea non autorizza esplicitamente una sola richiesta tecnica dal modulo alla propria casella. Dopo autorizzazione verificare risposta server, ricezione e contenuto; verificare anche il mittente configurato e il relativo dominio, senza modifiche DNS non necessarie.
2. **Google:** collegare gli account autorizzati, recuperare le proprietà reali GA4/Ads/Search Console già esistenti ed evitare duplicati. `assets/measurement-config.js` ha ancora `ga4Id`, `adsId`, `adsLeadLabel` vuoti.
3. **Conversioni/consenso:** una primaria `generate_lead` soltanto dopo conferma server; importazione GA4 una volta, conteggio Una. Click WhatsApp/telefono/email secondari. Non assegnare 15 euro come valore del lead. Collaudare Tag Assistant/DebugView, consenso/rifiuto/revoca e aggiornare l'informativa contestualmente all'attivazione dei servizi.
4. **Budget:** nessun budget o durata del test è stato approvato. Chiedere tetto di spesa e periodo. Le eventuali nuove campagne vanno create in pausa; attivare solo dopo le verifiche essenziali e l'approvazione dell'impegno economico.
5. **Search Console:** verifica proprietà, sitemap e stato d'indicizzazione ancora da controllare nell'account. La disponibilità pubblica della landing non dimostra l'indicizzazione.
6. **Ottimizzazioni successive:** valutare gli avvisi Lighthouse con interventi mirati e nuove prove; mantenere la baseline 17.5 e non riaprire i vecchi rifacimenti della hero.

**Stato finale:** revisione 17.5 pubblicata e controlli funzionali/responsive completati; bozze pubblicitarie disponibili; nessuna campagna a pagamento pubblicata o attivata. La variante senza render resta un'anteprima, non un A/B test operativo.
