"""Reproducible checks for the 2.2 conditional-boundary/topo pass.
Requires Python: beautifulsoup4, playwright, shapely; Chromium in PATH.
Uses local first-party bytes with set_content and local fetch fixtures.
This validates code/rendering, NOT actual iPhone Safari or live network delivery.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from shapely.geometry import Polygon, GeometryCollection
from shapely.strtree import STRtree
import base64,hashlib,json,math,shutil,time,os
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'tests/road-atlas/conditions-proof';OUT.mkdir(parents=True,exist_ok=True)
baseline=(ROOT/'vendor/road-atlas-baseline-329a68a.html').read_text()
scripts=[s.text for s in BeautifulSoup(baseline,'html.parser').find_all('script')]
module=(ROOT/'road-atlas-pipeline.js').read_text();conditions=(ROOT/'road-atlas-conditions.js').read_text()
head=(ROOT/'road-atlas-v2.html').read_text().split('<script>')[0]
# Previous pipeline bytes are included beside this test for same-seed regression.
previous_path=ROOT/'tests/road-atlas/fixtures/pipeline-2.1.0.js'
previous=previous_path.read_text()
SEEDS=['RA1-821c9gee01aa','RA1-821c9gee01ab','RA1-821c9gee01c3','RA1-821c9gee01z9',
       'RA1-c21c9gee01r2','RA1-g42o9kee01m3','RA1-04269a8a01x7','RA1-821c90ee01w0']
report={'version':'2.2.0','execution':'Headless Chromium, local first-party source','seeds':[],'checks':[],'errors':[], 'sourceSHA256':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['road-atlas-pipeline.js','road-atlas-conditions.js','road-atlas-v2.html']}}
def html(seed,which='new'):
 ss=scripts.copy();ss[0]=ss[0].replace('randomSeed:function(){return randomSeedStr();}',"randomSeed:function(){return '"+seed+"';}")
 extra=[module,conditions] if which=='new' else [previous] if which=='previous' else []
 return head+''.join('<script>'+s+'</script>' for s in [ss[0],*extra,*ss[1:]])+'</body></html>'
def check(name,value,details=None):
 report['checks'].append({'name':name,'passed':bool(value),'details':details})
 if not value:print('FAIL',name,details,flush=True)
def js_hash(page,expr):
 s=page.evaluate('JSON.stringify('+expr+')');return hashlib.sha256(s.encode()).hexdigest()
def picture(page,path):
 v=page.evaluate("scene.toDataURL('image/png')");path.write_bytes(base64.b64decode(v.split(',')[1]))
def shape(rings):
 g=GeometryCollection()
 for r in rings:
  p=Polygon([(v['x'],v['y']) for v in r]);
  if not p.is_valid:raise ValueError('invalid ring')
  g=g.symmetric_difference(p)
 return g

def quad(b,roof=False):
 a=b['ang'];c,s=math.cos(a),math.sin(a);off=-b['hgt']*.42 if roof else 0
 return Polygon([(b['cx']+(x+off)*c-(y+off)*s,b['cy']+(x+off)*s+(y+off)*c) for x,y in [(-b['w']/2,-b['h']/2),(b['w']/2,-b['h']/2),(b['w']/2,b['h']/2),(-b['w']/2,b['h']/2)]])
def boundary_checks(d):
 C=d['conditions'];parcels=C['parcels'];flags=C['raster']['flags'];owner=C['raster']['parcelOwner'];cell=C['resolution'];counts={}
 for k,i in enumerate(owner):
  if i>=0:
   if flags[k]!=0:return {'error':'Assigned parcel overlaps forbidden cell','cell':k}
   counts[i]=counts.get(i,0)+1
 geoms=[shape(p['rings']) for p in parcels];bad=[]
 for q,g in zip(parcels,geoms):
  if abs(g.area-q['area'])>1e-6 or abs(g.area-counts.get(q['id'],0)*cell*cell)>1e-6:bad.append(['area',q['id']])
 for i,b in enumerate(d['buildings']):
  g=geoms[b['parcelId']].buffer(1e-7)
  for roof in (False,True):
   if not g.covers(quad(b,roof)):bad.append(['roof' if roof else 'footprint',i,quad(b,roof).difference(g).area])
 tree=STRtree(geoms);overlaps=[]
 for i,g in enumerate(geoms):
  for j in tree.query(g):
   if j>i and g.intersection(geoms[j]).area>1e-7:overlaps.append([i,int(j)])
 return {'bad':bad,'overlappingParcels':overlaps,'buildings':len(d['buildings']),'parcels':len(parcels),'assignedCells':sum(counts.values())}

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for n,seed in enumerate(SEEDS):
  print('START',seed,flush=True)
  old=browser.new_page(viewport={'width':1440,'height':1000});old.set_content(html(seed,'previous'),wait_until='load',timeout=120000)
  network=js_hash(old,'RoadAtlasPipeline.exportData().network');before=old.evaluate('world.blocks.buildings.length')
  if n==0:picture(old,OUT/'before.png')
  old.close()
  page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.set_content(html(seed),wait_until='load',timeout=120000)
  check(seed+' conditions committed',page.evaluate('!!world?.conditions'),page.locator('#err').text_content())
  check(seed+' unchanged road graph vs 2.1',js_hash(page,'RoadAtlasPipeline.exportData().network')==network)
  data=json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())'))
  result=boundary_checks(data)
  check(seed+' exact parcel areas and base/roof containment',not result.get('error') and not result.get('bad'),result)
  check(seed+' parcels never overlap',not result.get('overlappingParcels') and not result.get('error'))
  check(seed+' valid conditioned service hosts',page.evaluate('world.layers.pois.every(p=>Number.isInteger(p.parcelId)&&Number.isInteger(p.hostBuildingId))'))
  sig=js_hash(page,'RoadAtlasPipeline.exportData().buildings');pixel=page.evaluate('worldCanvas.toDataURL()');page.evaluate('regenerate()')
  check(seed+' deterministic fitted objects and pixels',sig==js_hash(page,'RoadAtlasPipeline.exportData().buildings') and pixel==page.evaluate('worldCanvas.toDataURL()'))
  check(seed+' finite contour points in world bounds',page.evaluate('RoadAtlasConditions.exportData(world).contours.every(c=>c.lines.every(l=>l.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=WORLD_W&&p.y<=WORLD_H)))'))
  if n in (0,2,5):
   picture(page,OUT/('city-'+str(n)+'.png'))
   page.evaluate('RoadAtlasConditions.setView({parcels:true,blocks:true})');picture(page,OUT/('boundaries-'+str(n)+'.png'))
  if n==0:
   (OUT/'example-city.json').write_text(json.dumps(data,separators=(',',':')))
  metric=page.evaluate('({counts:world.conditions.counts,ms:world.pipeline.trace.reduce((a,b)=>a+b.ms,0),networkComponents:world.network.components.length})')
  report['seeds'].append({'seed':seed,'beforeBuildings':before,'after':metric,'boundaries':result})
  page.close();print(seed,'buildings',before,'->',metric['counts']['accepted'],'ms',round(metric['ms']),flush=True)
  (OUT/'validation.json').write_text(json.dumps(report,indent=2))
 # Math fixtures and inspector/UI behavior.
 page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:report['errors'].append(str(e)));page.set_content(html(SEEDS[0]),wait_until='load')
 f=page.evaluate('''()=>{const D=RoadAtlasConditions.debug, grid=(fn)=>({w:11,h:11,dx:10,dy:10,data:Array.from({length:121},(_,i)=>fn(i%11,i/11|0))});
 const ramp=D.contourGrid(grid((x,y)=>x/10),[.15,.25,.55]);
 const hill=D.contourGrid(grid((x,y)=>1-((x-5)**2+(y-5)**2)/50),[.55]);
 const saddle=(a)=>D.contourGrid({w:2,h:2,dx:1,dy:1,data:a},[0]);
 const rings=D.ringsFromCells([0,1,2,3,5,6,7,8],3,4),diag=D.ringsFromCells([0,3],2,4);
 const C={w:3,h:3,cell:4,flags:new Uint8Array(9),owner:new Int32Array(9).fill(0)};C.flags[4]=2;
 return {ramp:ramp.every(c=>c.lines.length===1&&c.lines[0].every(p=>Math.abs(p.x-c.level*100)<1e-8)),hillClosed:hill.every(c=>c.lines.every(l=>Math.hypot(l[0].x-l.at(-1).x,l[0].y-l.at(-1).y)<1e-8)),saddlePlus:saddle([2,-1,-1,2]),saddleMinus:saddle([1,-2,-2,1]),rings,diag,holeRejected:!D.allowed(C,{cx:6,cy:6,w:11,h:11,ang:0},0)};}''')
 check('Analytic ramp contours interpolate exactly',f['ramp'])
 check('Hill contours are stitched closed rings',f['hillClosed'])
 plus=f['saddlePlus'][0]['lines'];minus=f['saddleMinus'][0]['lines']
 check('Saddle determinant selects distinct connectivity',len(plus)==2 and len(minus)==2 and any(any(abs(v['y'])<1e-8 for v in l) and any(abs(v['x']-1)<1e-8 for v in l) for l in plus) and any(any(abs(v['y'])<1e-8 for v in l) and any(abs(v['x'])<1e-8 for v in l) for l in minus))
 check('Raster boundary preserves hole',abs(shape(f['rings']).area-128)<1e-8 and len(f['rings'])==2)
 check('Diagonal cell contacts are separate valid rings',len(f['diag'])==2 and abs(shape(f['diag']).area-32)<1e-8)
 check('Full-area footprint rejects a hole missed by corner tests',f['holeRejected'])
 net=js_hash(page,'RoadAtlasPipeline.exportData().network');objects=js_hash(page,'world.blocks.buildings');pixels=page.evaluate('worldCanvas.toDataURL()')
 page.evaluate('RoadAtlasConditions.setView({topo:false})');check('Topo toggles pixels',page.evaluate('worldCanvas.toDataURL()')!=pixels)
 page.evaluate('RoadAtlasConditions.setView({topo:true})');check('Topo roundtrip identical; geometry untouched',page.evaluate('worldCanvas.toDataURL()')==pixels and js_hash(page,'world.blocks.buildings')==objects and js_hash(page,'RoadAtlasPipeline.exportData().network')==net)
 page.evaluate('RoadAtlasConditions.setView({interval:.01,opacity:.9,labels:false})');check('Contour style does not reroll roads or objects',js_hash(page,'world.blocks.buildings')==objects and js_hash(page,'RoadAtlasPipeline.exportData().network')==net)
 page.evaluate('RoadAtlasConditions.setSettings({setback:9,slopeLimit:.3})')
 check('Stricter conditions actually change placement, never roads',js_hash(page,'world.blocks.buildings')!=objects and js_hash(page,'RoadAtlasPipeline.exportData().network')==net)
 data=json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())'));strict=boundary_checks(data)
 check('Strict settings retain full boundary conformance',not strict.get('error') and not strict['bad'] and not strict['overlappingParcels'],strict)
 check('Share preserves physical and contour recipe',page.evaluate("()=>{const u=RoadAtlasConditions.queryParameters(new URL('https://example.com'));return u.searchParams.get('setback')==='9'&&u.searchParams.get('slopeLimit')==='0.3'&&u.searchParams.get('contour')==='0.01';}"))
 page.evaluate('RoadAtlasConditions.setSettings({setback:3,slopeLimit:.85});RoadAtlasConditions.setView({interval:.02,opacity:.62,labels:true,parcels:true,blocks:true})')
 page.evaluate('RoadAtlasConditions.inspectAt(world.blocks.buildings[0].cx,world.blocks.buildings[0].cy)');check('Civic intents produce valid host parcels',page.evaluate('world.layers.pois.length>0 && world.layers.pois.every(p=>world.conditions.parcels[p.parcelId]?.buildingId===p.hostBuildingId)'));check('Point inspector reports actual parcel',page.locator('#conditionInspector').is_visible() and 'Parcel' in page.locator('#conditionTitle').text_content());page.screenshot(path=str(OUT/'inspector-desktop.png'))
 page.locator('#conditionInspector .close').click();page.locator('#layersBtn').click();page.locator('summary',has_text='Boundary / field').click();page.locator('[data-condition-view="buildable"]').click();check('Layer UI responds',page.evaluate('RoadAtlasConditions.getView().buildable'))
 page.locator('#layersBtn').click();picture(page,OUT/'conditions-mask.png')
 page.locator('#dataBtn').click() # exercise existing event path
 # Original mode must remain pixel-identical to the immutable V1 reference.
 page.evaluate("RoadAtlasPipeline.setMode('legacy')");legacy=page.evaluate('worldCanvas.toDataURL()')
 base=browser.new_page();base.set_content(html(SEEDS[0],'baseline'),wait_until='load')
 check('Legacy comparison exact pixel parity with pinned V1',legacy==base.evaluate('worldCanvas.toDataURL()'));base.close();page.close()
 # Actual async boot and touch interaction at phone size.
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);page.on('pageerror',lambda e:report['errors'].append(str(e)))
 sources={'vendor/road-atlas-baseline-329a68a.html':baseline.replace('randomSeed:function(){return randomSeedStr();}',"randomSeed:function(){return '"+SEEDS[0]+"';}"),'road-atlas-pipeline.js':module,'road-atlas-conditions.js':conditions,'road-atlas-urban.js':(ROOT/'road-atlas-urban.js').read_text()}
 mock='<script>window.fetch=async function(path){const f='+json.dumps(sources).replace('</','<\\/')+';const k=String(path).replace(/^\\.\\//,\'\').split(\'?\')[0];return new Response(f[k]||\'missing\',{status:f[k]?200:404});};</script>'
 boot=(ROOT/'road-atlas-v2.html').read_text().replace('<script>',mock+'<script>',1)
 page.set_content(boot,wait_until='load');page.wait_for_function('world?.conditions && world?.pipeline')
 check('Shipped four-file async boot completes once',page.evaluate("RoadAtlasPipeline.version==='2.3.0'&&RoadAtlasConditions.version==='2.2.0'&&document.querySelectorAll('.sc-pill').length===1"))
 check('Mobile toolbar fits',page.evaluate('document.getElementById("topbar").scrollWidth<=innerWidth'));check('Mobile stage clears full wrapped toolbar',page.evaluate('document.getElementById("stage").getBoundingClientRect().top>=document.getElementById("topbar").getBoundingClientRect().bottom-1'))
 page.locator('#layersBtn').tap();check('Touch layers open',page.locator('#layersPanel').is_visible());page.screenshot(path=str(OUT/'mobile-layers.png'))
 page.locator('#inspectConditions').tap();bld=page.evaluate('({x:world.blocks.buildings[0].cx,y:world.blocks.buildings[0].cy,W:WORLD_W,H:WORLD_H})');box=page.locator('#scene').bounding_box();page.touchscreen.tap(box['x']+box['width']*bld['x']/bld['W'],box['y']+box['height']*bld['y']/bld['H']);check('Touch parcel inspection works',page.locator('#conditionInspector').is_visible());page.screenshot(path=str(OUT/'mobile-inspector.png'))
 page.locator('#conditionInspector .close').tap();page.locator('#analysisBtn').tap();page.locator('#conditionRules summary').tap();check('Touch placement rule controls reachable',page.locator('#conditionSetback').is_visible());page.screenshot(path=str(OUT/'mobile-rules.png'))
 page.close();browser.close()
check('No uncaught browser errors',not report['errors'],report['errors'])
report['passed']=all(c['passed'] for c in report['checks']);report['testCount']=len(report['checks'])
(OUT/'validation.json').write_text(json.dumps(report,indent=2));print('CHECKS',report['testCount'],'PASSED',report['passed'],flush=True)
raise SystemExit(0 if report['passed'] else 1)
