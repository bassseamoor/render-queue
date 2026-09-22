"""Map camera regression, browser gestures and screenshots.
Run: python tests/road-atlas/verify_navigation.py
Uses exact local files through the real asynchronous loader with a first-party
fetch/query fixture (the build sandbox blocks browser URL navigation).
Desktop mouse/keyboard and Chromium-generated multi-touch are tested; this is
not an actual iPhone Safari or long MP4 test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, hashlib, json, os, shutil

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tests/road-atlas/navigation-proof';OUT.mkdir(parents=True,exist_ok=True)
NAMES=['road-atlas-v2.html','road-atlas-navigation.js','road-atlas-conditions.js','road-atlas-pipeline.js','road-atlas-urban.js','road-atlas-streets.js','road-atlas-street-hooks.js','vendor/road-atlas-baseline-329a68a.html']
SOURCES={n:(ROOT/n).read_text() for n in NAMES}
SEED='RA1-821c9gee01aa'
REPORT={'version':'navigation-1.0.0','environment':'Headless Chromium / exact local seven-resource loader fixture; CDP multi-touch', 'sourceSHA256':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in NAMES},'checks':[],'errors':[],'warnings':[]}
def check(label,ok,details=None):
 REPORT['checks'].append({'name':label,'passed':bool(ok),'details':details})
 print(('PASS ' if ok else 'FAIL ')+label, details if not ok else '', flush=True)
 (OUT/'validation.json').write_text(json.dumps(REPORT,indent=2))
def digest(page,expr):return hashlib.sha256(page.evaluate('JSON.stringify('+expr+')').encode()).hexdigest()
def view(page):return page.evaluate('RoadAtlasNavigation.getView()')
def camera_tuple(page):
 v=view(page);return (v['zoom'],v['center']['x'],v['center']['y'])
def near(a,b,tol=1e-5):return max(abs(x-y) for x,y in zip(a,b))<tol

def boot(page,query=None,nav=True):
 query=query or '?seed='+SEED+'&pipeline=ordered&urban=1&topo=1'
 data={n:s for n,s in SOURCES.items() if n!='road-atlas-v2.html'}
 fixture='<script>const NativeQuery=window.URLSearchParams;window.URLSearchParams=class extends NativeQuery{constructor(input){super(input===""?'+json.dumps(query)+':input);}};window.__fetchPaths=[];window.fetch=async function(path){const files='+json.dumps(data).replace('</','<\\/')+';const k=String(path).replace(/^\\.\\//,\'\').split(\'?\')[0];window.__fetchPaths.push(k);return new Response(files[k]||\'missing\',{status:files[k]?200:404});};</script>'
 html=SOURCES['road-atlas-v2.html']
 if not nav:html=html.replace('run(texts[4]);','').replace('||!window.RoadAtlasNavigation','')
 page.set_content(html.replace('<script>',fixture+'<script>',1),wait_until='load',timeout=120000)
 page.wait_for_function('window.world?.urban?.enabled',timeout=120000)
 page.wait_for_timeout(250)
def events(page):
 page.on('pageerror',lambda e:REPORT['errors'].append(str(e)))
 page.on('console',lambda m:REPORT['warnings'].append(m.text) if m.type=='warning' else None)
 page.set_default_timeout(120000)
def touch(cdp,kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'id':i,'x':x,'y':y,'radiusX':2,'radiusY':2} for i,x,y in points]})
def tap_count(page):return page.evaluate('window.__mapTaps||0')
def close_inspector(page):
 if page.locator('#conditionInspector').is_visible():page.locator('#conditionInspector .close').click()

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':960});events(page);boot(page,nav=False)
 before=digest(page,'RoadAtlasPipeline.exportData()');geoexpr='({network:RoadAtlasPipeline.exportData().network,buildings:RoadAtlasPipeline.exportData().buildings,parcels:world.conditions.parcels})';geometry_before=digest(page,geoexpr);pixels=digest(page,'worldCanvas.toDataURL()');scene=digest(page,'scene.toDataURL()')
 page.add_script_tag(content=SOURCES['road-atlas-navigation.js']);page.wait_for_timeout(300)
 check('Camera installation leaves full city data and canvas pixels unchanged',before==digest(page,'RoadAtlasPipeline.exportData()') and pixels==digest(page,'worldCanvas.toDataURL()') and scene==digest(page,'scene.toDataURL()'))
 check('Canvas retains original world-sized buffer',page.evaluate('scene.width===WORLD_W&&scene.height===WORLD_H'))
 check('Fit map lies inside the visible stage',page.evaluate('()=>{const a=scene.getBoundingClientRect(),b=document.getElementById("stage").getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;}'))
 page.locator('#raZoomIn').click();check('Plus zooms in',view(page)['zoom']==1.5)
 page.locator('#raZoomOut').click();check('Minus returns to fit',view(page)['zoom']==1)
 page.evaluate('RoadAtlasNavigation.zoomAt(3)')
 point={'x':790,'y':505};a=page.evaluate('(p)=>RoadAtlasNavigation.screenToWorld(p.x,p.y)',point)
 page.mouse.move(point['x'],point['y']);page.mouse.wheel(0,-180);page.wait_for_timeout(80)
 b=page.evaluate('(p)=>RoadAtlasNavigation.screenToWorld(p.x,p.y)',point)
 check('Wheel zoom keeps the point under the cursor',view(page)['zoom']>3 and near([a['x'],a['y']],[b['x'],b['y']]))
 page.wait_for_function('RoadAtlasNavigation.getView().detailReady')
 check('Idle zoom redraws sharper retained geometry within a 4MP viewport budget',page.evaluate('document.querySelector(".ra-map-detail").width*document.querySelector(".ra-map-detail").height<=4005000'),view(page)['detailRenderMs'])
 check('Detail redraw changes no source pixels or generated scene data',pixels==digest(page,'worldCanvas.toDataURL()') and before==digest(page,'RoadAtlasPipeline.exportData()'))
 page.evaluate('RoadAtlasNavigation.fit();RoadAtlasNavigation.zoomAt(3)')
 v=view(page);page.mouse.move(710,460);page.mouse.down();page.mouse.move(815,506,steps=12);page.mouse.up()
 q=view(page);check('Mouse drag pans by its world-space distance',near([q['center']['x'],q['center']['y']],[v['center']['x']-105/v['scale'],v['center']['y']-46/v['scale']],.05))
 check('Pointer release clears dragging state',not q['dragging'])
 page.mouse.dblclick(750,480);check('Double-click zooms in around clicked place',abs(view(page)['zoom']-6)<1e-8)
 page.evaluate('RoadAtlasNavigation.zoomAt(99999)');check('Maximum zoom is bounded at 16x',view(page)['zoom']==16)
 page.evaluate('RoadAtlasNavigation.pan(1e8,-1e8)');check('Panning cannot lose the entire map offscreen',page.evaluate('()=>{let a=scene.getBoundingClientRect(),s=document.getElementById("stage").getBoundingClientRect();return a.right>s.left+100&&a.left<s.right-100&&a.bottom>s.top+100&&a.top<s.bottom-100;}'))
 page.locator('#raFitMap').click();check('Fit map recenters and resets zoom',near(camera_tuple(page),(1,800,500)))
 page.evaluate('RoadAtlasNavigation.zoomAt(3)');page.locator('#stage').focus();v=camera_tuple(page);page.keyboard.press('ArrowRight');check('Arrow keys pan a focused map',camera_tuple(page)[1]>v[1]);page.keyboard.press('+');check('Keyboard plus zooms',view(page)['zoom']==4.5);page.keyboard.press('Home');check('Home fits the map',view(page)['zoom']==1)
 page.evaluate('RoadAtlasNavigation.zoomAt(3)');page.locator('#raFocusMap').click();page.wait_for_timeout(100)
 check('Focus mode expands map without changing its layout',page.locator('#stage').bounding_box()['y']==0 and not page.locator('#topbar').is_visible() and view(page)['zoom']==3)
 page.keyboard.press('Escape');page.wait_for_timeout(100);check('Escape restores toolbar and seed controls',page.locator('#topbar').is_visible() and page.locator('.sc-pill').is_visible() and not view(page)['focus'])
 mini=page.locator('.ra-overview canvas').bounding_box();page.mouse.click(mini['x']+mini['width']*.65,mini['y']+mini['height']*.55)
 check('Clicking overview recenters camera',near(camera_tuple(page)[1:],(1040,550),1))
 page.locator('#raMiniToggle').click();check('Overview can be hidden',not page.locator('.ra-overview').is_visible());page.locator('#raMiniToggle').click()
 page.evaluate('window.__mapTaps=0;document.getElementById("stage").addEventListener("roadatlas:maptap",()=>window.__mapTaps++)')
 # Center a real occupied parcel and inspect by a real DOM mouse click.
 target=page.evaluate('()=>{const b=world.blocks.buildings.reduce((a,b)=>Math.hypot(b.cx-800,b.cy-500)<Math.hypot(a.cx-800,a.cy-500)?b:a);return {x:b.cx,y:b.cy,id:b.parcelId};}')
 page.evaluate('(p)=>{RoadAtlasNavigation.fit();RoadAtlasNavigation.zoomAt(4);const v=RoadAtlasNavigation.getView();RoadAtlasNavigation.pan((v.center.x-p.x)*v.scale,(v.center.y-p.y)*v.scale);}',target)
 page.locator('#layersBtn').click();page.locator('#inspectConditions').click();screen=page.evaluate('(p)=>RoadAtlasNavigation.worldToScreen(p.x,p.y)',target)
 page.mouse.click(screen['x'],screen['y']);check('Zoomed parcel inspection identifies the actual parcel',page.locator('#conditionTitle').inner_text().startswith('Parcel '+str(target['id'])+' '))
 check('Screen/world coordinate inverse remains accurate after pan/zoom',near([target['x'],target['y']],list(page.evaluate('(p)=>{const q=RoadAtlasNavigation.screenToWorld(p.x,p.y);return [q.x,q.y]}',screen))))
 close_inspector(page);n=tap_count(page);page.mouse.move(720,500);page.mouse.down();page.mouse.move(810,560,steps=5);page.mouse.move(720,500,steps=5);page.mouse.up()
 check('A drag returning to its start is not mistaken for a parcel tap',tap_count(page)==n and not page.locator('#conditionInspector').is_visible())
 v=camera_tuple(page);page.evaluate('RoadAtlasConditions.setView({parcels:true})');check('Layer redraw preserves camera',near(camera_tuple(page),v))
 page.wait_for_function('RoadAtlasNavigation.getView().detailReady');page.screenshot(path=str(OUT/'desktop-zoom.png'))
 page.evaluate('RoadAtlasConditions.setView({parcels:false})');page.locator('#layersBtn').click();beforewheel=camera_tuple(page);page.locator('#layersPanel').hover();page.mouse.wheel(0,220);check('Scrolling a controls panel does not zoom the map',near(camera_tuple(page),beforewheel));page.locator('#layersBtn').click()
 v=camera_tuple(page);page.evaluate('P.theme=1;state.seed=encodeSeed();regenerate()');check('Palette-only rebuild keeps the same framing',near(camera_tuple(page),v));page.evaluate('P.theme=0;state.seed=encodeSeed();regenerate()')
 check('Navigation and palette roundtrip preserve network, building and parcel geometry',geometry_before==digest(page,geoexpr))
 v=camera_tuple(page);page.evaluate('RoadAtlasUrban.setSettings({character:"courtyard"})');check('Architecture editing keeps framing',near(camera_tuple(page),v));page.evaluate('RoadAtlasUrban.setSettings({character:"balanced"})')
 query=page.evaluate('RoadAtlasConditions.queryParameters(new URL("https://atlas.test/")).search')
 check('Share recipe includes current zoom and map center',all(k in query for k in ['mapZoom=','mapX=','mapY=']))
 linked=browser.new_page(viewport={'width':1440,'height':960});events(linked);boot(linked,query+'&seed='+SEED+'&pipeline=ordered');check('Shared framing reopens at the same camera',near(camera_tuple(linked),camera_tuple(page),.002));linked.close()
 page.evaluate('SeedConsoleAdapter.setSeed("RA1-821c9gee01c3")');check('A new seed resets camera to fit its new map',view(page)['zoom']==1)
 page.evaluate('RoadAtlasNavigation.zoomAt(4)');v=camera_tuple(page);page.set_viewport_size({'width':1200,'height':800});page.wait_for_timeout(200);check('Window resize preserves center and relative zoom',near(camera_tuple(page),v,.05))
 # Reset safely on lost/cancelled gestures; excluded controls cannot initiate a drag.
 page.mouse.move(620,430);page.mouse.down();page.mouse.move(650,450);page.evaluate('window.dispatchEvent(new Event("blur"))');page.mouse.up();check('Window blur clears any captured drag',not view(page)['dragging'])
 page.locator('#raFitMap').click();page.wait_for_timeout(250);page.screenshot(path=str(OUT/'desktop-fit.png'));page.close()
 # Browser-generated touch events: genuine pinch, finger release, cancel, double tap.
 for dims in [{'width':390,'height':844},{'width':844,'height':390}]:
  label=str(dims);page=browser.new_page(viewport=dims,device_scale_factor=2,is_mobile=True,has_touch=True);events(page);boot(page)
  check(label+' exact seven-resource async boot creates one camera and one seed console',page.evaluate('window.__fetchPaths.length===7&&document.querySelectorAll(".ra-camera-controls").length===1&&document.querySelectorAll(".sc-pill").length===1'))
  check(label+' toolbar, navigation controls and canvas fit',page.evaluate('()=>{const s=document.getElementById("stage").getBoundingClientRect(),b=document.querySelector(".ra-camera-controls").getBoundingClientRect();return document.getElementById("topbar").scrollWidth<=innerWidth&&b.right<=innerWidth&&b.top>=s.top&&getComputedStyle(scene).touchAction==="none";}'))
  page.evaluate('window.__mapTaps=0;document.getElementById("stage").addEventListener("roadatlas:maptap",()=>window.__mapTaps++)')
  cdp=page.context.new_cdp_session(page);r=page.locator('#stage').bounding_box();x=dims['width']/2;y=r['y']+r['height']*.53
  # At initial fit, choose points away from the upper control bar.
  touch(cdp,'touchStart',[(0,x-35,y),(1,x+35,y)]);touch(cdp,'touchMove',[(0,x-70,y),(1,x+70,y)]);touch(cdp,'touchEnd',[])
  check(label+' native two-finger pinch doubles zoom',abs(view(page)['zoom']-2)<.03)
  check(label+' pinch does not emit inspection taps',tap_count(page)==0)
  start=view(page);touch(cdp,'touchStart',[(0,x,y)]);touch(cdp,'touchMove',[(0,x+26,y+24)]);touch(cdp,'touchEnd',[])
  check(label+' one-finger drag pans the map',not near(camera_tuple(page)[1:],[start['center']['x'],start['center']['y']]))
  page.evaluate('RoadAtlasNavigation.fit();RoadAtlasNavigation.zoomAt(4)');n=tap_count(page)
  touch(cdp,'touchStart',[(0,x-30,y),(1,x+30,y)]);touch(cdp,'touchMove',[(0,x-40,y),(1,x+40,y)]);touch(cdp,'touchEnd',[(0,x-40,y)]);beforeone=camera_tuple(page);touch(cdp,'touchMove',[(0,x-30,y)]);touch(cdp,'touchEnd',[])
  check(label+' pinch-to-one-finger transition has no jump or accidental tap',abs(camera_tuple(page)[0]-beforeone[0])<1e-8 and abs(camera_tuple(page)[1]-beforeone[1])<30 and tap_count(page)==n and not view(page)['dragging'])
  touch(cdp,'touchStart',[(0,x,y)]);touch(cdp,'touchMove',[(0,x+15,y+15)]);touch(cdp,'touchCancel',[]);check(label+' touch cancellation clears capture',not view(page)['dragging'])
  page.evaluate('RoadAtlasNavigation.fit()');touch(cdp,'touchStart',[(0,x,y)]);touch(cdp,'touchEnd',[]);page.wait_for_timeout(70);touch(cdp,'touchStart',[(0,x,y)]);touch(cdp,'touchEnd',[])
  check(label+' double-tap zooms in',abs(view(page)['zoom']-2)<1e-6)
  check(label+' map gestures do not trigger the legacy hide-UI shortcut',page.locator('.sc-pill').is_visible())
  page.locator('#raFocusMap').tap();page.wait_for_timeout(100);check(label+' touch focus mode opens without overflow',view(page)['focus'] and page.locator('#stage').bounding_box()['y']==0 and page.locator('.ra-camera-controls').bounding_box()['x']+page.locator('.ra-camera-controls').bounding_box()['width']<=dims['width'])
  page.locator('#raFocusMap').tap();page.wait_for_timeout(100);check(label+' touch focus button restores normal UI',not view(page)['focus'] and page.locator('#topbar').is_visible() and page.locator('.sc-pill').is_visible())
  page.evaluate('RoadAtlasNavigation.fit();RoadAtlasNavigation.zoomAt(3)');page.wait_for_timeout(350)
  page.screenshot(path=str(OUT/('mobile-portrait.png' if dims['width']==390 else 'mobile-landscape.png')))
  check(label+' device pixels bounded while source canvas stays full-size',page.evaluate('document.querySelector(".ra-map-detail").width*document.querySelector(".ra-map-detail").height<=4005000&&scene.width===WORLD_W&&scene.height===WORLD_H'))
  page.close()
 # Render mode should never inherit the interactive camera (nor alter its buffer).
 render=browser.new_page(viewport={'width':1200,'height':800});events(render);boot(render,'?seed='+SEED+'&pipeline=ordered&render=1&warmup=0&seconds=5')
 check('Dedicated render mode disables all navigation hooks and UI',render.evaluate('RoadAtlasNavigation.disabled&&!document.getElementById("stage").classList.contains("ra-navigable")&&!document.querySelector(".ra-camera-controls")'))
 render.close();browser.close()
check('No uncaught browser errors',not REPORT['errors'],REPORT['errors'])
check('No fallback detail-render errors',not REPORT['warnings'],REPORT['warnings'])
REPORT['passed']=all(c['passed'] for c in REPORT['checks']);REPORT['testCount']=len(REPORT['checks'])
(OUT/'validation.json').write_text(json.dumps(REPORT,indent=2));print('CHECKS',REPORT['testCount'],'PASSED',REPORT['passed'],flush=True)
raise SystemExit(0 if REPORT['passed'] else 1)
