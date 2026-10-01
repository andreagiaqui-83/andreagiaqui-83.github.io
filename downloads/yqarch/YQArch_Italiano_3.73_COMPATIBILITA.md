# Compatibilità YQArch Italiano 3.73

## Stato verificato
YQArch Italiano 3.73 deriva direttamente dalla **3.71 collaudata dall'utente** e la release 3.73 è stata a sua volta installata e collaudata con esito positivo sul PC di riferimento con **AutoCAD 2026 italiano**. Sono stati verificati installazione/aggiornamento, Ribbon e il flusso del catalogo blocchi **Seleziona → Inserisci → scegli il punto nel DWG → inserimento completato**.

La build e i test automatici vengono eseguiti in ambiente non-Windows: non equivalgono a un collaudo reale su ogni combinazione AutoCAD/Windows. Per questo la compatibilità è dichiarata per livelli di evidenza, senza estendere il test del PC di riferimento a sistemi non provati.

## AutoCAD
| Versioni | Stato della 3.73 | Note |
|---|---|---|
| AutoCAD completo 2026 italiano | **Collaudo reale completato** | La 3.73 è stata installata e verificata sul PC di riferimento: aggiornamento, Ribbon e inserimento blocchi funzionanti. |
| AutoCAD completo 2010–2026 Windows | **Compatibilità progettata e controllata staticamente** | La Ribbon viene caricata solo con `ACADVER >= 18.0`; i file DWG inclusi sono in formati leggibili da queste versioni. Non tutte le release sono state eseguite realmente. |
| AutoCAD completo 2007–2009 Windows | **Percorso legacy** | Niente Ribbon della 3.73; usare menu/toolbar e installazione legacy. Tutti i 195 blocchi del catalogo sono in formati AutoCAD 2007 o precedenti. |
| AutoCAD completo 2004–2006 Windows | **Compatibilità legacy parziale** | 147 dei 195 blocchi inclusi sono in formato AutoCAD 2004 o precedente; 48 sono `AC1021` (AutoCAD 2007). La 3.73 li riconosce prima dell'inserimento e li blocca con un messaggio chiaro invece di tentare un caricamento incompatibile. |

Il catalogo distribuito contiene 195 DWG: **16 AC1009, 2 AC1014, 129 AC1018 e 48 AC1021**. Autodesk identifica `AC1018` come formato AutoCAD 2004/2005/2006 e `AC1021` come formato AutoCAD 2007/2008/2009. Un AutoCAD precedente non può aprire direttamente un DWG salvato in un formato più recente. I 48 file `AC1021` non vengono quindi presentati come compatibili con AutoCAD 2004–2006.

AutoCAD LT, AutoCAD per Mac e prodotti CAD alternativi **non sono certificati** da questo pacchetto.

## Windows
L'installer `YQArch_Italiano_3.73.exe` è un eseguibile **Windows x64**. La compatibilità effettiva dipende dalla specifica coppia AutoCAD/Windows supportata da Autodesk; per AutoCAD 2027 Autodesk richiede una versione **64 bit di Windows ancora supportata da Microsoft**.

Su sistemi legacy o 32 bit non usare l'EXE x64: utilizzare lo ZIP e la procedura descritta in `INSTALLAZIONE_LEGACY.md`. Questa possibilità di installazione manuale non costituisce certificazione di ogni vecchio sistema operativo.

## Sicurezza e codifica
La 3.73 **non modifica automaticamente** `SECURELOAD`, `TRUSTEDPATHS` o `LISPSYS`. Se il profilo AutoCAD impedisce il caricamento, configurare la cartella del plugin secondo le policy del proprio ambiente senza disattivare globalmente le protezioni.

I nuovi LSP/MNL sono distribuiti in codifica compatibile con il core storico; non viene ricompilato né alterato il FAS/VLX originale. Le DLL storiche delle immagini sono resource-only e vengono preservate.

## Ribbon e aree di lavoro
La Ribbon è un CUIx parziale indipendente. Il caricatore non sostituisce `acad.cuix`, non azzera il profilo e non modifica le interfacce di BlockHub CAD o Express Tools. Gli identificatori interni della scheda e dei pannelli restano volutamente stabili rispetto alla baseline funzionante per ridurre il rischio di regressioni tra aree di lavoro.

## Riferimenti Autodesk verificati il 1 ottobre 2026
- Compatibilità formati DWG: https://www.autodesk.com/it/support/technical/article/caas/sfdcarticles/sfdcarticles/ITA/AutoCAD-drawing-file-format.html
- Codici versione DWG: https://www.autodesk.com/it/support/technical/article/caas/sfdcarticles/sfdcarticles/ITA/drawing-version-codes-for-autocad.html
- Requisiti installazione AutoCAD 2027: https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-ReleaseNotes/files/installation/INSTALLATION_REQUIREMENTS_AUTOCAD_2027.html