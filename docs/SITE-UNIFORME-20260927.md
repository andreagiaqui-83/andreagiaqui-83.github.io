# Revisione comune delle landing — 27 settembre 2026

Richiesta di Andrea: footer uniforme, immagini professionali per i due plugin, sostegno più curato, recensioni lezioni sempre visibili e controllo SEO/linguistico.

## Cambiamenti
- Footer HTML statico da una sorgente comune: `partials/site-footer.html`; sincronizzazione con `scripts/sync-site-footer.cjs`; stile isolato in `assets/site-footer.css`. Sei pagine, quattro collegamenti alle landing e tutti i contatti verificati.
- Modulo recensioni delle lezioni sempre visibile. Nessun invio prima del caricamento del JavaScript; dati conservati in caso di errore. CTA mobile nascosta mentre il modulo è visibile. Contratto backend invariato.
- Sostegno con schede PayPal e Postepay, colori riconoscibili, pulsanti copia e contributo facoltativo esplicito.
- Due visual illustrativi realistici, creati con il generatore immagini integrato (non CLI). Nessuna schermata autentica o lavoro consegnato dichiarato. WebP a 640/960/1536 px e anteprime social JPEG a 1200×630, dimensioni esplicite e srcset.
- Identità Person coerente (Disegnatore CAD e BIM, LinkedIn e Facebook), relazioni WebPage, FAQ delle lezioni aderenti alle risposte visibili, sitemap aggiornata e testi riletti. Recensioni originali conservate alla lettera.
- Robots già consente la scansione. Le landing restano indicizzabili. Non sono introdotti markup speciali per IA, testo nascosto o promesse di ranking.

## Fonti primarie consultate
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

## Immagini e prompt finali
Asset YQArch: `assets/plugins/yqarch-realistic-{640,960,1536}.webp`, `assets/plugins/yqarch-social-v2.jpg`.

Use case: ads-marketing. Asset type: professional Italian CAD architecture website hero, landscape 3:2 composition. Primary request: a beautiful highly realistic architectural visualization for a page about YQArch architectural drafting tools. Subject: a refined contemporary single-storey Mediterranean home as a precise physical scale model with roof removed, revealing furnished living room, kitchen, bedrooms, doors and windows, sitting on a large crisp architectural drawing sheet on a dark blue-green architect's desk. A warm oak material sample and pencil in the periphery. Editorial architecture photography / photorealistic architectural rendering, believable materials, beautiful soft daylight, subtle shadows, pale stone and oak, warm white interiors, muted sage accents, navy background. The house is the central subject, all rooms and coherent wall thickness visible from an elevated three-quarter view; polished premium architecture publication, detailed and inviting. No people, no logos, no readable text, no invented UI, no dimensional numbers, no sketchy line-art dominant treatment. This is a conceptual architectural illustration, not evidence of actual plugin output. Produce one image.

Asset Express Tools: `assets/plugins/express-tools-realistic-{640,960,1536}.webp`, `assets/plugins/express-tools-social-v2.jpg`.

Use case: ads-marketing. Asset type: premium Italian CAD drafting website hero, landscape 3:2 composition. Primary request: a beautiful photorealistic editorial photograph of a modern professional technical drawing workstation for a landing about Express Tools utilities for AutoCAD. Scene: an architect's refined desk in a contemporary studio, matte dark navy desktop, warm natural oak, soft sunlight from the side. Main subject: an elegant large widescreen monitor in a natural slightly angled three-quarter view displaying a sophisticated detailed 2D architectural floor plan on a dark CAD-like canvas with subtle white, cyan and muted green lines, organized repeated furniture blocks and a small adjacent enlarged detail panel. The drawing is an illustrative conceptual screen, not a screenshot of any actual software. In the foreground a professional keyboard, precise mouse, a tidy large plotted architectural sheet with detailed floor plan, and a slim pen. Focus on beautiful believable textures, sharp monitor and drawings, restrained sage green accents, warm whites, soft background blur, premium professional visual, strong uncluttered composition. No people, no logos, no readable UI text or labels, no decorative floating icons, no cartoon, no rough sketch. This image symbolizes precision and efficient CAD workflows. Produce one image.

## Verifiche
I test JavaScript esistenti, la sincronizzazione dei footer e i controlli di sintassi vengono eseguiti prima della pubblicazione. Gli script browser verificano i tre motori, le quattro landing, le pagine di servizio; le lezioni vengono controllate alle 13 larghezze previste. I POST, le notifiche e le richieste analytics sono simulati. Gli esiti e gli screenshot effettivi sono conservati negli artefatti dei workflow; la sola presenza di uno script non equivale a un esito superato. La verifica live è richiesta dopo la promozione. Nessuna campagna o account pubblicitario viene modificato.
