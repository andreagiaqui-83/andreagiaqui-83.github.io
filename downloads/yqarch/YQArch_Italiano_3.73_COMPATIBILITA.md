# Compatibilità YQArch Italiano 3.73

## Stato verificato
La release 3.73 è stata collaudata sul PC di riferimento il 1 ottobre 2026 con AutoCAD 2026: installazione/aggiornamento completati, Ribbon visibile e inserimento diretto dei blocchi verificato. Questo collaudo non viene esteso automaticamente ad altre release AutoCAD/Windows né a tutti i 646 comandi.

## AutoCAD
| Versioni | Stato della 3.73 | Note |
|---|---|---|
| AutoCAD completo 2026 Windows | **Collaudo reale sul PC di riferimento** | Installazione/aggiornamento, caricamento, Ribbon e inserimento blocchi verificati. |
| AutoCAD completo 2010–2025 e 2027 Windows | **Compatibilità progettata e controllata staticamente** | La Ribbon è prevista da ACADVER 18.0 in poi. Non tutte le release sono state eseguite realmente. |
| AutoCAD completo 2007–2009 Windows | **Percorso legacy** | Niente Ribbon moderna della 3.73; usare menu/toolbar e procedura legacy. Tutti i 195 blocchi sono in formati AutoCAD 2007 o precedenti. |
| AutoCAD completo 2004–2006 Windows | **Compatibilità legacy parziale** | 147/195 blocchi sono leggibili; 48 sono AC1021 e richiedono AutoCAD 2007+. La 3.73 li intercetta prima dell'inserimento. |

Il catalogo contiene 195 DWG: 16 AC1009, 2 AC1014, 129 AC1018 e 48 AC1021. Autodesk identifica AC1018 con AutoCAD 2004/2005/2006 e AC1021 con AutoCAD 2007/2008/2009.

AutoCAD LT, AutoCAD per Mac e prodotti CAD alternativi non sono dichiarati compatibili da questa distribuzione.

## Windows
L'installer EXE è Windows x64. Per ogni versione di AutoCAD va usata una combinazione AutoCAD/Windows supportata da Autodesk. Per AutoCAD 2027 Autodesk richiede una versione 64 bit di Windows ancora supportata da Microsoft. Su sistemi legacy o 32 bit usare lo ZIP e la procedura manuale; ciò non costituisce certificazione del sistema.

## Sicurezza
La 3.73 non disattiva SECURELOAD e non modifica automaticamente TRUSTEDPATHS o LISPSYS. L'EXE non è firmato Authenticode, quindi SmartScreen può mostrare un avviso di reputazione. Non disattivare le protezioni di Windows o AutoCAD.

## Ribbon e aree di lavoro
La Ribbon è un CUIx parziale indipendente. Il caricatore non sostituisce acad.cuix, non azzera il profilo e non modifica BlockHub CAD o Express Tools. Gli identificatori interni della scheda e dei pannelli restano stabili.

## Riferimenti Autodesk verificati il 1 ottobre 2026
- Formati DWG: https://www.autodesk.com/it/support/technical/article/caas/sfdcarticles/sfdcarticles/ITA/AutoCAD-drawing-file-format.html
- Codici versione DWG: https://www.autodesk.com/it/support/technical/article/caas/sfdcarticles/sfdcarticles/ITA/drawing-version-codes-for-autocad.html
- Requisiti AutoCAD 2027: https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-ReleaseNotes/files/installation/INSTALLATION_REQUIREMENTS_AUTOCAD_2027.html
