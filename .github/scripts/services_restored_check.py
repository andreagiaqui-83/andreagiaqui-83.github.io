import functools, hashlib, http.server, json, os, threading, time
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

BUILD="20260919-servizi-interior-02"
REPORT=Path(os.environ.get("RUNNER_TEMP","/tmp"))/"services-restored-proof"

def sha(b): return hashlib.sha256(b).hexdigest()
def write(n,o):
    REPORT.mkdir(parents=True,exist_ok=True)
    (REPORT/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def static():
    data=Path("index.html").read_bytes(); soup=BeautifulSoup(data,"html.parser")
    assert soup.body.get("data-build")==BUILD
    assert soup.body.get("data-services-state") is None
    assert soup.select_one("#quoteForm")
    cloud=soup.select_one('input[name="Nuvola_di_punti_link_cloud"]')
    assert cloud and cloud.has_attr("disabled") and cloud.get("placeholder")=="Servizio attualmente non disponibile"
    assert soup.select_one('input[name="Output[]"][value="Interior Design"]')
    styles=[x.get_text(" ",strip=True) for x in soup.select(".interior-style-grid span")]
    assert len(styles)==4 and all(f"Proposta contemporanea {i}" in styles[i-1] for i in range(1,5))
    assert "LAS2MESH" in soup.select_one(".interior-design-panel").get_text(" ",strip=True).upper()
    page_text=soup.get_text(" ",strip=True)
    assert "0,20 €" not in page_text and "60 €" not in page_text and "TARIFFA INDICATIVA" not in page_text
    assert "PREVENTIVO PERSONALIZZATO" in page_text and "costi contenuti" in page_text.lower()
    custom=soup.select_one('textarea[name="Interior_Design_5a_proposta_personalizzata"]')
    assert custom and "materiali" in custom.get("placeholder","").lower() and "colori" in custom.get("placeholder","").lower()
    assert soup.select_one('a[href="mailto:andrea.giaqui@gmail.com"]')
    assert soup.select_one("#whatsappQuickContact")
    assert soup.select_one("#formazione-autocad .training-cta[href='/lezioni-autocad/']")
    assert "services-interior-20260919.css" in data.decode()
    assert "reviews-carousel.js" in data.decode()
    write("static.json",{"status":"PASS","build":BUILD,"html_sha256":sha(data),"styles":styles})
    print("STATIC_PASS",flush=True)

def browsers(base,stage):
    REPORT.mkdir(parents=True,exist_ok=True); out=[]
    with sync_playwright() as p:
        for engine,widths in [("chromium",[320,360,393,412,600,768,1024,1440,1920]),("webkit",[390,1440])]:
            browser=getattr(p,engine).launch()
            try:
                for width in widths:
                    ctx=browser.new_context(viewport={"width":width,"height":1000},device_scale_factor=2 if width<768 else 1,is_mobile=width<768,has_touch=width<768,reduced_motion="reduce")
                    page=ctx.new_page(); page.set_default_timeout(25000)
                    r=page.goto(base,wait_until="domcontentloaded"); assert r and r.status==200
                    assert page.locator("body").get_attribute("data-build")==BUILD
                    assert page.locator("#quoteForm").count()==1
                    cloud=page.locator('input[name="Nuvola_di_punti_link_cloud"]')
                    assert cloud.is_disabled() and cloud.get_attribute("placeholder")=="Servizio attualmente non disponibile"
                    panel=page.locator(".interior-design-panel"); panel.scroll_into_view_if_needed()
                    assert panel.locator(".interior-style-grid span").count()==4
                    assert "LAS2MESH" in panel.inner_text().upper()
                    assert all(f"Proposta contemporanea {i}" in panel.locator(".interior-style-grid span").nth(i-1).inner_text() for i in range(1,5))
                    assert page.locator("text=Da 0,20 €").count()==0
                    assert page.locator("text=PREVENTIVO PERSONALIZZATO").count()==1
                    custom=panel.locator('textarea[name="Interior_Design_5a_proposta_personalizzata"]')
                    custom.fill("Legno chiaro, pietra naturale, toni sabbia, illuminazione calda")
                    assert "Legno chiaro" in custom.input_value()
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),width
                    if width<=767:
                        cards=page.locator("#reviewsGrid > .review-card")
                        if cards.count():
                            view=page.locator("#reviewsCarousel").bounding_box(); visible=0
                            for i in range(cards.count()):
                                b=cards.nth(i).bounding_box()
                                if b and min(b["x"]+b["width"],view["x"]+view["width"])-max(b["x"],view["x"])>2: visible+=1
                            assert visible==1,(width,visible)
                    assert page.locator("#whatsappQuickContact").get_attribute("href").startswith("https://wa.me/393337240544")
                    assert page.locator("#formazione-autocad .training-cta").get_attribute("href")=="/lezioni-autocad/"
                    if width in [393,390,1440]:
                        page.locator("#modulo").screenshot(path=str(REPORT/f"{stage}-{engine}-{width}-form.png"),animations="disabled")
                    out.append({"browser":engine,"width":width,"status":"PASS"})
                    print(stage.upper()+"_BROWSER_PASS",engine,width,flush=True)
                    ctx.close()
            finally: browser.close()
    write(stage+"-browsers.json",out)

def local():
    static()
    srv=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(Path.cwd())))
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    try: browsers(f"http://127.0.0.1:{srv.server_port}/","local")
    finally: srv.shutdown()

def live():
    expected=sha(Path("index.html").read_bytes())
    for i in range(80):
        try:
            r=requests.get("https://andreagiaquinto.it/",timeout=25,headers={"Cache-Control":"no-cache"}); r.raise_for_status()
            assert r.status_code==200 and sha(r.content)==expected
            css=requests.get(urljoin(r.url,"services-interior-20260919.css")+"?v="+BUILD,timeout=25); css.raise_for_status()
            assert sha(css.content)==sha(Path("services-interior-20260919.css").read_bytes())
            break
        except (requests.RequestException,AssertionError) as e:
            print("WAIT_PUBLIC",i+1,e,flush=True); time.sleep(10)
    else: raise RuntimeError("Public restored landing not confirmed")
    browsers("https://andreagiaquinto.it/","live")
    print("LIVE_SERVICES_RESTORED_VERIFIED",BUILD,flush=True)

if __name__=="__main__":
    {"local":local,"live":live}[__import__("sys").argv[1]]()
