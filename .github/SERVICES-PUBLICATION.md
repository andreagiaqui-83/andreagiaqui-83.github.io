# Stato della landing servizi — 16 settembre 2026

## Regola operativa
La landing principale https://andreagiaquinto.it/ è in costruzione su richiesta di Andrea. I servizi CAD/BIM/Render non sono attivi fino alla conclusione del progetto LAS2Mesh e alla successiva richiesta esplicita di riattivazione. Non riattivare automaticamente la landing con modifiche alla pagina corsi.
La landing https://andreagiaquinto.it/lezioni-autocad/ resta separata e non deve essere sospesa o sovrascritta.

La schermata pubblica contiene solo l'avviso, Andrea Giaquinto, telefono 3337240544, e-mail andrea.giaquinto@gmail.com (indirizzo esplicitamente fornito per QUESTO avviso), WhatsApp e il collegamento alla pagina corsi. Nessun popup chiudibile, modulo, upload, script dei preventivi o recensioni. Il pubblico non accede alla landing precedente da questa schermata, anche senza JavaScript o usando vecchi frammenti URL.
Non sono stati modificati backend, richieste già ricevute, dati, DNS, credenziali, robots.txt, sitemap o file della landing corsi. La sospensione è della pubblicazione frontend; i vecchi endpoint API non sono disattivati globalmente perché condivisi con la formazione.

## Baseline completa preservata
- Repository: andreagiaqui-83/andreagiaqui-83.github.io
- Branch di salvataggio: backup/servizi-prima-costruzione-20260916
- Commit completo: fdbcdf1289136f8daafd891e508d42728fe8fe18
- Il branch di salvataggio NON è la sorgente di GitHub Pages. Non è creata una copia pubblica alternativa dell'HTML della landing.

## Riattivazione futura
1. Leggere main aggiornato e salvare uno snapshot prima della modifica.
2. Recuperare SOLO index.html della landing servizi dal commit di salvataggio (git show fdbcdf1289136f8daafd891e508d42728fe8fe18:index.html), mantenendo tutti gli aggiornamenti successivi della landing corsi e di ogni altro componente. NON fare reset o force-push dell'intero repository.
3. Verificare i riferimenti ad asset/CSS/JS, il recapito e-mail voluto al momento della riapertura, i moduli e il backend, il render approvato, una recensione intera alla volta su mobile, WhatsApp e il collegamento alla formazione.
4. Rimuovere lo stato construction soltanto dopo richiesta esplicita, aggiornare data-build e questo documento/stato JSON.
5. Pubblicare con fast-forward oppure merge selettivo senza perdere lavoro parallelo, controllare il deploy e testare il sito pubblico in Chromium e WebKit, desktop/mobile. Non confermare l'attivazione sulla sola riuscita del build.

## Pubblicazione e ricerca
La home informativa restituisce 200 ed è indicizzabile, con titolo/descrizione che dicono chiaramente che i servizi non sono attivi; rimossi i precedenti dati strutturati di offerta/servizio/FAQ. Non vengono applicati blocchi SEO all'intero dominio. Per sospensioni lunghe, riferimento: https://developers.google.com/search/docs/crawling-indexing/pause-online-business
