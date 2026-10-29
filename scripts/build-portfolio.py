from pathlib import Path
from io import BytesIO
import base64, html, json, math, shutil, hashlib, zipfile
import fitz
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color, white
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tmp/portfolio'; WEB=OUT/'web'; AS=WEB/'assets'; PDF=ROOT/'downloads/portfolio'
for p in [OUT,WEB,AS,PDF,OUT/'qa']:p.mkdir(parents=True,exist_ok=True)
NAVY='#102b3a';TEAL='#236c70';MUTED='#5d6d76';LINE='#d9e3e5';SOFT='#edf3f2';PAPER='#faf9f5';GOLD='#b78a52'
NOTE='Layer, colori, stili di testo e quota, cartigli e altri standard grafici possono derivare dal professionista o dal file sorgente. Sono indicativi e adattabili allo standard richiesto.'
RIGHTS='Riproduzione e diffusione vietate senza autorizzazione.'
for name,file in [('Sans','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))

# Publish only the selected, anonymized project figures already used by the page.
FIG={}
for key,meta in json.loads((ROOT/'assets/portfolio/figures.json').read_text()).items():
 path=ROOT/'assets/portfolio'/(key+'.webp')
 im=Image.open(path).convert('RGB');pdf_asset=OUT/'qa'/(key+'.png')
 if key.startswith(('commerciale','render','scansione')):
  pdf_asset=OUT/'qa'/(key+'.jpg');im.save(pdf_asset,quality=93,optimize=True,subsampling=0)
 else:im.save(pdf_asset)
 FIG[key]={**meta,'path':path,'pdf_path':pdf_asset}

W,H=841.89,595.276;M=36
pdfpath=PDF/'Andrea_Giaquinto_Portfolio.pdf'
c=canvas.Canvas(str(pdfpath),pagesize=(W,H),pageCompression=1)
c.setTitle('Andrea Giaquinto | Portfolio CAD e BIM | Selezione di lavori')
c.setAuthor('Andrea Giaquinto');c.setSubject('Planimetrie commerciali, restituzione CAD, modelli IFC e nuvole di punti')
PAGE=0;CONTENTS=[];BOUNDS=[]
def rect(x,y,w,h,color,stroke=None,r=0):
 c.setFillColor(HexColor(color));c.setStrokeColor(HexColor(stroke or color))
 if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))
 else:c.rect(x,H-y-h,w,h,fill=1,stroke=bool(stroke))
def line(x,y,x2,y2,color=LINE,width=.6):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-y,x2,H-y2)
def text(txt,x,y,size=10,color=NAVY,font='Sans'):
 c.setFont(font,size);c.setFillColor(HexColor(color));c.drawString(x,H-y-size*.82,txt)
def para(txt,x,y,w,size=10,leading=None,color=MUTED,font='Sans',maxh=None):
 st=ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.45,textColor=HexColor(color),spaceAfter=0)
 p=Paragraph(html.escape(txt),st);aw,ah=p.wrap(w,900)
 if maxh is not None:assert ah<=maxh,(PAGE,txt,ah,maxh)
 p.drawOn(c,x,H-y-ah);BOUNDS.append((PAGE,x,y,w,ah,txt));return ah
def pic(key,x,y,w,h,border=False,wm=True,pad=0):
 f=FIG[key];iw,ih=f['width'],f['height'];scale=min((w-2*pad)/iw,(h-2*pad)/ih);dw,dh=iw*scale,ih*scale
 xx=x+(w-dw)/2;yy=y+(h-dh)/2
 c.drawImage(ImageReader(str(f['pdf_path'])),xx,H-yy-dh,width=dw,height=dh,mask='auto')
 if border:line(x,y,x+w,y);line(x,y+h,x+w,y+h)
 if wm:
  c.saveState();c.setFillAlpha(.20);c.setFillColor(HexColor('#e6edf0' if f['dark'] else NAVY));c.setFont('Sans',max(5.8,min(8,w/65)))
  c.drawCentredString(x+w/2,H-y-15 if key.startswith('nuvola') else H-y-h+8,'Andrea Giaquinto | Disegnatore CAD/BIM | andreagiaquinto.it');c.restoreState()
 return xx,yy,dw,dh
def label(txt,x,y,color=TEAL):text(txt.upper(),x,y,8.1,color,'Bold')
def header(kicker,title,sub=None):
 label(kicker,M,26);text(title,M,49,26,NAVY,'Serif')
 if sub:para(sub,M,87,W-2*M,10,14,maxh=31)
 line(M,125,W-M,125)
def footer(note=True,dark=False):
 fg='#cfdddf' if dark else MUTED
 line(M,H-58,W-M,H-58,'#35515d' if dark else LINE)
 if note:para(NOTE,M,H-50,W-2*M-38,6.3,8.5,fg,maxh=19)
 text('ANDREA GIAQUINTO / DISEGNATORE CAD E BIM',M,H-22,6.2,fg,'Bold')
 text(RIGHTS+'  andreagiaquinto.it',340,H-22,6.1,fg)
 text(f'{PAGE:02}',W-M-13,H-24,9,'#c4a575' if dark else TEAL,'Bold')
def new(title,section=None,dark=False):
 global PAGE
 if PAGE:c.showPage()
 PAGE+=1;CONTENTS.append({'page':PAGE,'title':title,'section':section});rect(0,0,W,H,NAVY if dark else '#ffffff')
 c.bookmarkPage(f'p{PAGE}');c.addOutlineEntry(title,f'p{PAGE}',level=0,closed=False)
def tag(txt,x,y,w=160):
 rect(x,y,w,24,SOFT);text(txt,x+10,y+7,7.8,TEAL,'Bold')
def bullet(title,body,x,y,w):
 label(title,x,y);para(body,x,y+20,w,9.7,14,maxh=72)
def divider(letter,title,desc,key,topics):
 new(title,letter,True);text('PORTFOLIO / '+letter,M,30,9,'#a9c9c9','Bold')
 text(letter,M,78,72,'#355560','Serif')
 lines=title.split('|')
 for i,t in enumerate(lines):text(t,M,185+i*38,31,'#ffffff','Serif')
 para(desc,M,280,280,11,17,'#d5e1e3',maxh=85)
 for i,t in enumerate(topics):text('0'+str(i+1)+'  '+t,M,395+i*27,9,'#d5e1e3')
 rect(365,78,440,398,'#ffffff');pic(key,379,91,411,369,wm=False)
 footer(False,True)

# 01 - editorial cover, all four domains represented using actual project figures.
new('Portfolio CAD e BIM',dark=True)
text('ANDREA GIAQUINTO',M,34,11,'#d7e9e7','Bold');text('DISEGNATORE CAD E BIM',M,55,8,'#a9c4c9')
text('Portfolio',M,121,48,'#ffffff','Serif');text('Dal materiale',M,192,24,'#ffffff','Serif');text('all’elaborato.',M,226,24,'#ffffff','Serif')
para('Restituzione tecnica, DWG editabili, modellazione BIM/IFC e rappresentazione degli spazi.',M,284,255,11,17,'#cfdddf',maxh=75)
line(M,379,276,379,'#4e6c77');text('PRECISIONE / LEGGIBILITÀ / METODO',M,397,7.4,'#b7d5d2','Bold')
text('andreagiaquinto.it',M,463,13,'#ffffff','Bold')
rect(326,34,480,297,'#ffffff');pic('render-esterno',338,45,456,274,wm=False)
for key,x,w in [('stato-comparativo',326,160),('nuvola-planimetria',494,148),('commerciale-ampio-3d',650,156)]:
 rect(x,343,w,161,'#ffffff' if key!='nuvola-planimetria' else '#050708');pic(key,x+8,351,w-16,144,wm=False)
footer(False,True)

new('Una selezione in continua evoluzione')
header('INCARICHI REALI / SPECIFICHE DEL COMMITTENTE','Un portfolio che continua a crescere.')
para('Qui trovi solo una parte dei lavori svolti per professionisti. Aggiornerò progressivamente il portfolio e il PDF con altri elaborati: ho molti progetti, appartenenti a diverse tipologie di lavorazione, ancora da presentare.',M,153,740,15,22,maxh=90)
line(M,265,W-M,265)
bullet('Richieste reali','Gli elaborati sono stati sviluppati su incarichi reali, secondo le richieste, i materiali e le specifiche dei professionisti committenti.',M,292,225)
bullet('Standard personalizzabili','Non sono modelli standard da riprodurre. Geometrie, layer, stili, contenuti e impaginazione vengono adattati alle esigenze di ogni nuovo incarico.',305,292,225)
bullet('Uso del portfolio','Immagini e tavole sono presentate per documentare il lavoro svolto. Le riproduzioni sono fuori scala e non sostituiscono gli elaborati originali.',574,292,225)
rect(M,427,W-2*M,83,SOFT)
label('Tutela dei contenuti',M+16,439)
para('È vietata la copia, la riproduzione, la ripubblicazione su altri siti e la diffusione, anche parziale, dei contenuti senza autorizzazione scritta. Il PDF è scaricabile per consultazione personale e per valutare una collaborazione.',M+16,459,W-2*M-32,9.5,14,maxh=43)
footer()

new('Percorsi e contenuti')
header('SELEZIONE DI ELABORATI','Tre percorsi, un metodo comune.','Leggere il materiale di partenza. Organizzare le informazioni. Restituire elaborati utili al lavoro tecnico e alla presentazione.')
for i,(letter,title,desc,key,pno) in enumerate([
 ('A','Dai documenti al CAD/BIM','DWG e schizzi, scansioni, viste renderizzate e modello IFC: tre percorsi di restituzione.','stato-progetto',4),
 ('B','Dalla nuvola al CAD','La sezione del rilievo e la planimetria ottenuta, con lettura e controllo delle geometrie.','nuvola-planimetria',14),
 ('C','Planimetrie commerciali','Due casi residenziali, rappresentati in pianta arredata e in vista tridimensionale.','commerciale-compatto-3d',17)]):
 x=M+i*263;pic(key,x,145,245,188,wm=False);label(letter+' / '+title,x,351);para(desc,x,376,235,10,15,maxh=63)
 text(f'Da pagina {pno:02}',x,468,8.5,TEAL,'Bold');c.linkRect('',f'p{pno}',(x,H-495,x+245,H-144),relative=0,thickness=0)
para('Riproduzioni di presentazione, fuori scala. Per misure e contenuti tecnici fanno fede gli elaborati originali.',M,507,730,7.2,10,maxh=12)
footer()

divider('A','Dai documenti|al CAD e al BIM','Schizzi, file esistenti, PDF e scansioni diventano disegni modificabili, tavole coordinate e modelli di interscambio.','stato-progetto',['DWG + schizzo / progetto e comparativo','Scansione / planimetria DWG','Tavola PDF / viste 3D e IFC'])

new('DWG e schizzi: elaborati di partenza','A')
header('CASO 01 / DWG ESISTENTE + SCHIZZI','Prima, leggere e confrontare.','La base CAD definisce il riferimento geometrico; gli schizzi descrivono le modifiche distributive richieste.')
label('Base CAD ricevuta',M,145);pic('base-cad',M,170,478,306)
label('Schizzi del committente',545,145);pic('schizzo-primo',545,170,260,144);pic('schizzo-terra',545,331,260,160)
para('Base metrica e modifiche vengono confrontate prima di organizzare le tavole finali.',M,494,478,9,13,maxh=28);footer()

for key,title,kicker,desc in [
 ('stato-fatto','Lo stato di fatto, coordinato.','CASO 01 / RIFERIMENTO','Piante dei due livelli organizzate per confrontare geometrie, aperture, collegamenti e quote.'),
 ('stato-progetto','Le modifiche diventano disegno.','CASO 01 / ELABORATO OTTENUTO','La nuova distribuzione viene restituita in tavole CAD coordinate, mantenendo leggibile il rapporto con la base esistente.'),
 ('stato-comparativo','Un confronto che si legge.','CASO 01 / ELABORATO OTTENUTO','Demolizioni e costruzioni vengono rappresentate in una tavola comparativa, separando gli interventi dalle parti mantenute.')]:
 new(title,'A');header(kicker,title,desc);pic(key,M,141,W-2*M,345)
 if key=='stato-comparativo':
  rect(M,500,10,5,'#e6c326');text('Demolizioni',M+18,496,8)
  rect(M+122,500,10,5,'#d12d37');text('Costruzioni',M+140,496,8)
  text('Colori secondo la convenzione del file sorgente.',M+280,496,8,MUTED)
 else:tag('DWG EDITABILE / TAVOLE COORDINATE',M,494,260)
 footer()

new('Scansioni: materiale di partenza','A')
header('CASO 02 / PDF E SCANSIONI','Dalla carta alla geometria.','Dettagli dei documenti ricevuti: una base scansionata e le annotazioni con misure e indicazioni di rilievo.')
label('Dettaglio della scansione',M,147);pic('scansione-base',M,174,370,282)
label('Dettaglio con misure e annotazioni',435,147);pic('scansione-annotata',435,174,370,310)
para('I margini identificativi sono esclusi dalla presentazione. Le annotazioni tecniche vengono interpretate e confrontate con la base disponibile.',M,491,740,9,13,maxh=30);footer()

new('Scansione: planimetria DWG finale','A')
header('CASO 02 / ELABORATO OTTENUTO','Un DWG che si può aggiornare.','Geometria vettoriale, ambienti, aperture e quote organizzati in un elaborato modificabile.')
pic('dwg-scansione',M,139,470,386)
bullet('Restituzione CAD','Ricostruzione della planimetria e lettura coordinata di muri, aperture e spazi accessori.',548,154,248)
bullet('Utilizzo del file','Aggiornamento del disegno, impaginazione delle tavole e adeguamento agli standard del professionista.',548,257,248)
pic('dwg-editor',548,350,248,164);footer()

new('Tavola scansionata: piante, prospetti e sezioni','A')
header('CASO 03 / TAVOLA PDF SCANSIONATA','Leggere l’edificio nel suo insieme.','Piante, copertura, prospetti e sezioni vengono messi in relazione prima della ricostruzione tridimensionale.')
label('Prospetti e sezione',M,145);pic('scansione-prospetti',M,167,584,113)
label('Piante e copertura',M,304);pic('scansione-piante',M,327,584,191)
label('Sezioni',650,145);pic('scansione-sezioni',650,166,154,347);footer()

new('Viste renderizzate e sezioni tridimensionali','A')
header('CASO 03 / ELABORATI OTTENUTI','Volumi, facciate, relazioni.','Viste del modello e sezioni tridimensionali per comunicare l’organizzazione dell’edificio.')
pic('render-esterno',M,145,500,362)
pic('render-alternativo',555,145,250,175);label('Vista alternativa',555,325)
pic('render-sezioni',550,358,255,128);label('Sezioni tridimensionali',555,498);footer()

new('Modello IFC visualizzato in Revit','A')
header('CASO 03 / ELABORATO OTTENUTO','Un modello aperto all’interscambio.','Vista del modello IFC importato in Revit, con una lettura chiara di copertura, aperture e livelli.')
pic('modello-ifc-revit',M,147,540,361)
bullet('IFC / ambiente BIM','Il modello viene scambiato e consultato in software compatibili con IFC, secondo le esigenze del progetto.',607,170,195)
bullet('Ambito del lavoro','Ricostruzione delle geometrie dai documenti disponibili. Le parti non definite dalle quote richiedono verifica.',607,290,195)
tag('VISTA DEL MODELLO IN REVIT',607,451,198);footer()

divider('B','Dalla nuvola|di punti al CAD','Il rilievo viene sezionato, letto e interpretato per ottenere una planimetria coerente e modificabile.','nuvola-planimetria',['Lettura della sezione del rilievo','Interpretazione di muri e aperture','Restituzione e controllo in CAD'])

new('Nuvola di punti: dal rilievo alla planimetria','B')
header('CASO 04 / SCAN TO CAD','Dal dato misurato al disegno.','La sezione della nuvola e la restituzione CAD sono mostrate separatamente, per rendere leggibile il passaggio.')
label('Elaborato di partenza / nuvola',M,148);pic('nuvola-sezione',M,175,366,317)
label('Elaborato ottenuto / planimetria',439,148);pic('nuvola-planimetria',439,175,366,317)
para('Il lavoro comprende lettura delle discontinuità, riconoscimento delle aperture e controllo delle connessioni geometriche.',M,501,755,8.5,12,maxh=25);footer()

new('Nuvola di punti: restituzione CAD di piano','B')
header('CASO 04 / ELABORATO OTTENUTO','Geometrie organizzate, lettura pulita.','La planimetria ricostruisce perimetri, partizioni e collegamenti sulla base delle evidenze disponibili nel rilievo.')
pic('nuvola-planimetria',M,140,520,383)
bullet('Lettura e interpretazione','Distinguere muri, porte, finestre, vano scala e altri elementi dalle tracce del rilievo.',592,165,205)
bullet('Controllo delle geometrie','Verificare spessori, allineamenti e connessioni. Foto, planimetrie e misure integrative aiutano a risolvere le incertezze.',592,292,205)
tag('DWG / DXF / TAVOLE PDF',592,467,205);footer()

divider('C','Planimetrie|commerciali','Spazi leggibili, arredi coordinati e una presentazione immediata delle possibilità abitative.','commerciale-ampio-3d',['Lettura della distribuzione','Proposte di arredo e materiali','Viste 2D e 3D coordinate'])
for key,title,sub,view2,view3 in [
 ('A1','Una casa, più modi di viverla.','Caso 05 / appartamento con tre camere','commerciale-ampio-2d','commerciale-ampio-3d'),
 ('A2','Spazi compatti, lettura immediata.','Caso 06 / appartamento con due camere','commerciale-compatto-2d','commerciale-compatto-3d')]:
 new(title,'C');header(sub,title,'Proposte di rappresentazione e arredo: la pianta chiarisce gli ambienti, la vista 3D ne rende percepibili volumi e relazioni.')
 label('Lettura in pianta',M,146);pic(view2,M,169,245,250)
 bullet('Metodo','Distribuzione, arredi e finiture organizzati per rendere riconoscibili funzioni e collegamenti.',M,438,245)
 label('Elaborato ottenuto / vista 3D',310,146);pic(view3,302,171,504,345)
 footer()

new('Collaborazioni e contatti',dark=True)
text('DAL TUO MATERIALE AL PROSSIMO ELABORATO',M,35,9,'#b9d8d4','Bold')
text('Parliamo del tuo progetto.',M,91,35,'#ffffff','Serif')
para('Collaboro con professionisti, studi tecnici e clienti per trasformare documenti e rilievi in elaborati chiari, ordinati e utilizzabili.',M,161,575,13,20,'#d3e1e3',maxh=65)
for x,title,body in [(M,'01 / MATERIALE','Invia i documenti disponibili e descrivi l’elaborato che ti serve.'),(303,'02 / CONFRONTO','Definiamo contenuti, formati, tempi e standard grafici.'),(570,'03 / CONSEGNA','Il lavoro viene organizzato secondo le specifiche concordate.')]:
 label(title,x,266,'#b9d8d4');para(body,x,292,231,10,16,'#d3e1e3',maxh=65)
line(M,374,W-M,374,'#35515d');text('Andrea Giaquinto',M,398,20,'#ffffff','Serif')
text('andrea.giaqui@gmail.com',M,435,11,'#ffffff');text('+39 333 724 0544',M,459,11,'#ffffff')
text('andreagiaquinto.it',487,409,19,'#ffffff','Bold');text('Richiedi un preventivo per il tuo progetto',487,448,10,'#d3e1e3')
c.linkURL('mailto:andrea.giaqui@gmail.com',(M,H-453,270,H-430),relative=0)
c.linkURL('tel:+393337240544',(M,H-479,225,H-456),relative=0)
c.linkURL('https://andreagiaquinto.it/preventivo/',(480,H-470,805,H-400),relative=0)
footer(False,True)
c.save()
assert PAGE==20,PAGE
for p,x,y,w,h,t in BOUNDS:assert x>=0 and y>=0 and x+w<=W+1 and y+h<=H-20,(p,t)
(OUT/'indice.json').write_text(json.dumps(CONTENTS,ensure_ascii=False,indent=2))
(OUT/'figure.json').write_text(json.dumps({k:{'width':v['width'],'height':v['height'],'dark':v['dark']} for k,v in FIG.items()},indent=2))
print('PDF',pdfpath,'pages',PAGE)
