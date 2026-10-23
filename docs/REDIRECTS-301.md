# Redirect delle precedenti pagine plugin

Preparazione del 23 ottobre 2026; configurazione **non attivata**.

## Stato verificato
- Il dominio è servito direttamente da GitHub Pages (record A 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153).
- Nameserver pubblici: dns.technorail.com, dns2.technorail.com, dns3.arubadns.net, dns4.arubadns.cz. Il dominio è quindi gestito su DNS Aruba, non risulta dietro il proxy Cloudflare.
- Il Worker dei moduli resta separato e funzionante. La presenza del Worker non abilita redirect HTTP sul dominio del sito.
- I ponti HTML attuali restano disponibili, ma non sono redirect HTTP 301.

## Regola pronta
Il file `redirect-ag-cad-tools-cloudflare.json` contiene una singola regola da aggiungere, senza sostituire regole esistenti, alla fase `http_request_dynamic_redirect` di una zona Cloudflare correttamente attivata. Riguarda soltanto GET/HEAD delle tre pagine elencate, comprese le varianti senza slash e con index.html, sui due hostname del sito.

| Origine | Destinazione | Stato |
|---|---|---|
| /blockhub-cad/ | https://andreagiaquinto.it/ag-cad-tools/ | 301 |
| /yqarch-italiano/ | https://andreagiaquinto.it/ag-cad-tools/ | 301 |
| /express-tools-italiano/ | https://andreagiaquinto.it/ag-cad-tools/ | 301 |

Conserva i parametri query per l’attribuzione dei link in ingresso. Non intercetta richieste del backend, pagine correnti, file scaricabili o la vecchia sottoguida Express. Non cambia il sito di destinazione né crea un redirect generale verso la Home.

## Passaggio che richiede accesso e decisione dell’autore
Attivare il proxy Cloudflare per il dominio mantenendo GitHub Pages come origine comporta una modifica dell’infrastruttura DNS. Prima dell’applicazione servono accesso ai pannelli Aruba/Cloudflare, autorizzazione al cambio e inventario completo dei record esistenti, inclusi posta, verifica dominio e sottodomini. Non sostituire i record sulla base dei soli A/NS sopra, né cambiare il Worker dei moduli. Verificare HTTPS, dominio www e servizi esistenti dopo il passaggio; conservare i valori originali per un ripristino.

Dopo l’attivazione verificare stato 301 e Location per ogni origine e variante, con e senza query; destinazione 200, nessun ciclo, Home/Preventivo/installer inalterati. Solo allora dichiarare concluso il lavoro sui redirect.

Riferimenti ufficiali: https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/ e https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/.
