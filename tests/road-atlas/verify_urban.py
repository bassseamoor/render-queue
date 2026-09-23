"""Independent 2.4 site-massing validation and actual browser proof.
Run from repo: python tests/road-atlas/verify_urban.py
Requires beautifulsoup4, playwright, shapely and Chromium (CHROMIUM overrides).
Tests use exact first-party local bytes, not live delivery or actual iPhone Safari.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from shapely.geometry import Polygon, GeometryCollection, box, Point
from shapely.ops import unary_union
import hashlib, json, math, base64, os, shutil

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tests/road-atlas/urban-proof'; OUT.mkdir(parents=True,exist_ok=True)
FILES=['road-atlas-pipeline.js','road-atlas-conditions.js','road-atlas-urban.js','road-atlas-v2.html']
sources={f:(ROOT/f).read_text() for f in FILES}
baseline=(ROOT/'vendor/road-atlas-baseline-329a68a.html').read_text()
scripts=[s.text for s in BeautifulSoup(baseline,'html.parser').find_all('script')]
head=sources['road-atlas-v2.html'].split('<script>')[0]
SEEDS=['RA1-821c9gee01aa','RA1-821c9gee01ab','RA1-821c9gee01c3','RA1-821c9gee01z9','RA1-c21c9gee01r2','RA1-g42o9kee01m3','RA1-04269a8a01x7','RA1-821c90ee01w0']
report={'version':'2.4.0','execution':'Headless Chromium; local source + first-party async fetch fixture', 'sourceSHA256':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in FILES},'checks':[],'seeds':[],'errors':[]}
def check(name,ok,detail=None):
 report['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
 if not ok: print('FAIL',name,detail,flush=True)
def html(seed,urban=True,legacy=False):
 ss=scripts.copy();ss[0]=ss[0].replace('randomSeed:function(){return randomSeedStr();}',"randomSeed:function(){return '"+seed+"';}")
 mods=[] if legacy else [sources['road-atlas-pipeline.js'],sources['road-atlas-conditions.js']]+([sources['road-atlas-urban.js']] if urban else [])
 return head+''.join('<script>'+s+'</script>' for s in [ss[0],*mods,*ss[1:]])+'</body></html>'
def signature(page,expr):
 return hashlib.sha256(page.evaluate('JSON.stringify('+expr+')').encode()).hexdigest()
def snapshot(page,path,canvas='worldCanvas'):
 (path).write_bytes(base64.b64decode(page.evaluate(canvas+".toDataURL('image/png')").split(',')[1]))
def polygon(points): return Polygon([(p['x'],p['y']) for p in points])
def shape(rings):
 g=GeometryCollection()
 for r in rings: g=g.symmetric_difference(polygon(r))
 return g

def independent(data):
 C=data['conditions']; parcels={q['id']:shape(q['rings']) for q in C['parcels']}
 cell=C['resolution'];rw=C['raster']['w'];owners=C['raster']['parcelOwner'];flags=C['raster']['flags']
 errors=[];masses=0;surfaces=0;forms={};ground_sum=0;envelope_sum=0
 def sq(k): return box(k%rw*cell,k//rw*cell,(k%rw+1)*cell,(k//rw+1)*cell)
 for b in data['buildings']:
  m=b['architecture']; q=parcels[b['parcelId']]; volumes=m['volumes']; plans=[];ground=[];forms[m['form']]=forms.get(m['form'],0)+1
  if m['parcelId']!=b['parcelId']: errors.append(['owner',b['parcelId']])
  envelope_sum+=b['w']*b['h']
  for i,v in enumerate(volumes):
   masses+=1; plan=polygon(v['plan']); bottom=polygon(v['projectedBase']);roof=polygon(v['projectedRoof']);sweep=unary_union([bottom,roof]).convex_hull
   if not plan.is_valid or not q.buffer(1e-7).covers(plan) or not q.buffer(1e-7).covers(sweep):errors.append(['containment',b['parcelId'],i])
   if not all(math.isfinite(t) for t in [v['z0'],v['z1'],plan.area]) or v['z1']<=v['z0'] or plan.area<=0:errors.append(['nonfinite',b['parcelId'],i])
   if v['parent'] is not None:
    par=volumes[v['parent']]
    if v['parent']>=i or abs(par['z1']-v['z0'])>1e-7 or not polygon(par['plan']).buffer(1e-7).covers(plan):errors.append(['support',b['parcelId'],i])
   else:
    if v['z0']!=0:errors.append(['floating',b['parcelId'],i])
    ground.append(plan)
   plans.append(plan)
  for i,a in enumerate(volumes):
   for j in range(i+1,len(volumes)):
    z=volumes[j]
    if min(a['z1'],z['z1'])-max(a['z0'],z['z0'])>1e-7 and plans[i].intersection(plans[j]).area>1e-6:errors.append(['interpenetration',b['parcelId'],i,j])
  footprint=unary_union(ground)
  if abs(sum(p.area for p in ground)-footprint.area)>1e-6:errors.append(['ground-overlap',b['parcelId']])
  if abs(footprint.area-m['metrics']['groundArea'])>1e-6 or abs(footprint.area/q.area-m['metrics']['groundCoverage'])>1e-6:errors.append(['metrics',b['parcelId']])
  ground_sum+=footprint.area
  seen=set()
  for a in m['landscape']['surfaces']:
   surfaces+=1;g=shape(a['rings'])
   if abs(g.area-a['area'])>1e-6 or (not g.is_empty and not q.buffer(1e-7).covers(g)) or g.intersection(footprint).area>1e-6:errors.append(['landscape',b['parcelId'],a['kind']])
   if abs(g.area-len(a['cells'])*cell*cell)>1e-6:errors.append(['surface cells',b['parcelId']])
   for k in a['cells']:
    if owners[k]!=b['parcelId'] or flags[k]!=0 or k in seen:errors.append(['surface owner',b['parcelId'],k])
    seen.add(k)
  path=m['landscape']['internalPath']
  if path['publicConnectionVerified'] is not False:errors.append(['unsupported public access claim',b['parcelId']])
  for i,k in enumerate(path['cells']):
   if owners[k]!=b['parcelId'] or flags[k] or sq(k).intersection(footprint).area>1e-6:errors.append(['path collision',b['parcelId']])
   if i and abs(k%rw-path['cells'][i-1]%rw)+abs(k//rw-path['cells'][i-1]//rw)!=1:errors.append(['path jump',b['parcelId']])
  for t in m['landscape']['trees']:
   if not q.buffer(1e-7).covers(Point(t['x'],t['y']).buffer(t['r'])) or Point(t['x'],t['y']).buffer(t['r']).intersection(footprint).area>1e-6:errors.append(['tree',b['parcelId']])
 if abs(ground_sum-data['urban']['metrics']['groundArea'])>1e-6:errors.append('total metrics')
 return {'errors':errors[:25],'errorCount':len(errors),'masses':masses,'surfaces':surfaces,'forms':forms,'envelopeCoverage':ground_sum/envelope_sum if envelope_sum else 0}

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for n,seed in enumerate(SEEDS):
  page=browser.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.set_content(html(seed,False),wait_until='load',timeout=120000)
  net=signature(page,'RoadAtlasPipeline.exportData().network');lots=signature(page,'world.conditions.parcels');envelopes=signature(page,'world.blocks.buildings');pixels=page.evaluate('worldCanvas.toDataURL()')
  page.add_script_tag(content=sources['road-atlas-urban.js']);page.evaluate('regenerate()')
  check(seed+' committed site grammar',page.evaluate('!!world?.urban?.enabled'),page.locator('#err').text_content())
  check(seed+' roads and parcel ownership unchanged',net==signature(page,'RoadAtlasPipeline.exportData().network') and lots==signature(page,'world.conditions.parcels'))
  check(seed+' old fitted envelopes unchanged',envelopes==signature(page,'world.blocks.buildings.map(({architecture,...b})=>b)'))
  data=json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())'));res=independent(data)
  check(seed+' independent full prism/parcel/surface/support validation',not res['errors'],res)
  check(seed+' fitted envelopes receive dense ground coverage',res['envelopeCoverage']>=.62 and abs(data['urban']['metrics']['envelopeCoverage']-res['envelopeCoverage'])<1e-6,res)
  model=signature(page,'world.blocks.buildings');newpix=page.evaluate('worldCanvas.toDataURL()');page.evaluate('regenerate()')
  check(seed+' same seed reproduces volumes and pixels',model==signature(page,'world.blocks.buildings') and newpix==page.evaluate('worldCanvas.toDataURL()'))
  page.evaluate('RoadAtlasUrban.setSettings({enabled:false})')
  check(seed+' disabled grammar restores cartographic pixels and envelopes',pixels==page.evaluate('worldCanvas.toDataURL()') and envelopes==signature(page,'world.blocks.buildings'))
  page.evaluate('RoadAtlasUrban.setSettings({enabled:true})')
  check(seed+' enabling grammar restores exact 2.4 output',newpix==page.evaluate('worldCanvas.toDataURL()'))
  if n in (0,2,5): snapshot(page,OUT/f'city-{n}.png');page.locator('#urbanDesignBtn').click();page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'study-{n}.png'));page.evaluate('RoadAtlasUrban.closeStudy()')
  if n==0:(OUT/'example-city.json').write_text(json.dumps(data,separators=(',',':')))
  report['seeds'].append({'seed':seed,'validation':res,'metrics':data['urban']['metrics']});page.close();print(seed,res['masses'],'masses',len(res['errors']),'errors',flush=True)
  (OUT/'validation.json').write_text(json.dumps(report,indent=2))
 # Policy extremes are genuine geometry changes, not UI-only variations.
 page=browser.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)));page.set_content(html(SEEDS[2]),wait_until='load',timeout=120000)
 net=signature(page,'RoadAtlasPipeline.exportData().network');lots=signature(page,'world.conditions.parcels');variants=set()
 for character in ['balanced','courtyard','terraced','compact']:
  for op,relief in [(.15,1.25),(.65,.25)]:
   page.evaluate('(s)=>RoadAtlasUrban.setSettings(s)',{'character':character,'openness':op,'relief':relief})
   d=json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())'));r=independent(d);variants.add(signature(page,'world.blocks.buildings'))
   check(f'{character} {op}/{relief} conforms independently',not r['errors'],r)
   check(f'{character} {op}/{relief} preserves roads and parcels',signature(page,'RoadAtlasPipeline.exportData().network')==net and signature(page,'world.conditions.parcels')==lots)
 check('All eight policy/extreme settings change actual model geometry',len(variants)==8)
 page.evaluate("RoadAtlasUrban.setSettings({character:'balanced',openness:.32,relief:.85})")
 model=signature(page,'world.blocks.buildings');page.evaluate('RoadAtlasConditions.setView({topo:false,parcels:true})')
 check('Overlay changes never reroll model geometry',signature(page,'world.blocks.buildings')==model)
 page.evaluate('RoadAtlasConditions.setView({topo:true,parcels:false})')
 model=signature(page,'world.blocks.buildings');page.evaluate('P.theme=1;state.seed=encodeSeed();regenerate()')
 check('Palette changes preserve same models',signature(page,'world.blocks.buildings')==model)
 page.evaluate('P.theme=0;state.seed=encodeSeed();regenerate()')
 page.evaluate('RoadAtlasConditions.setSettings({setback:9,slopeLimit:.3})')
 r=independent(json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())')))
 check('Stricter conditional placement still yields valid massing',not r['errors'],r)
 check('Stricter placement does not reroll roads',signature(page,'RoadAtlasPipeline.exportData().network')==net)
 page.evaluate('RoadAtlasConditions.setSettings({setback:3,slopeLimit:.85})')
 # UI phases and diagram exports render the committed selected model.
 page.locator('#urbanDesignBtn').click();snap=[]
 for i in range(6):
  page.locator(f'[data-urban-phase="{i}"]').click();snap.append(page.evaluate('document.getElementById("urbanStudyCanvas").toDataURL()'))
 check('All six study stages produce different real renders',len(set(snap))==6)
 page.locator('#urbanPlateBtn').click();page.wait_for_function('window.__urbanPlate?.width===1680')
 snapshot(page,OUT/'six-stage-plate.png','window.__urbanPlate')
 check('Six-stage export produces full resolution canvas',page.evaluate('window.__urbanPlate.height===2040'))
 page.locator('#urbanSiteDataBtn').click();check('Site JSON includes owner, rings, settings and actual volumes',page.evaluate("window.__urbanSiteExport.format==='MOOR-Site-2.4'&&window.__urbanSiteExport.parcel.rings.length>0&&window.__urbanSiteExport.model.volumes.length>0&&window.__urbanSiteExport.model.parcelId===window.__urbanSiteExport.parcel.id"))
 page.screenshot(path=str(OUT/'study-controls.png'))
 page.locator('#urbanNext').click();check('Site navigation selects a different committed parcel',page.locator('#urbanSiteSelect').input_value()!='')
 page.keyboard.press('Escape');check('Escape closes study and restores focus',not page.locator('#urbanStudy').is_visible() and page.evaluate('document.activeElement.id')=='urbanDesignBtn')
 page.evaluate('RoadAtlasConditions.inspectAt(world.blocks.buildings[0].cx,world.blocks.buildings[0].cy)')
 check('Existing point inspector gains a real site-study action',page.locator('#urbanInspectStudy').is_visible());page.locator('#urbanInspectStudy').click();check('Inspector action opens the same parcel',page.locator('#urbanSiteSelect').input_value()==str(page.evaluate('world.blocks.buildings[0].parcelId')));page.evaluate('RoadAtlasUrban.closeStudy()')
 page.locator('#layersBtn').click();page.locator('#urbanPatterns').click();check('Neighborhood pattern overlay responds',page.locator('#urbanPatterns').get_attribute('aria-pressed')=='true');page.locator('#layersBtn').click();snapshot(page,OUT/'patterns.png','scene')
 # Share codec includes every new design setting and rejects invalid values.
 q=page.evaluate("()=>RoadAtlasConditions.queryParameters(new URL('https://example.com/')).search")
 check('Shared recipe includes architecture state',all(k in q for k in ['urban=1','character=balanced','openness=0.32','relief=0.85']))
 page.evaluate("RoadAtlasUrban.setSettings({character:'__proto__',openness:NaN,relief:Infinity})")
 check('Invalid numeric/enum settings preserve valid state',page.evaluate("RoadAtlasUrban.getSettings().character==='balanced'&&RoadAtlasUrban.getSettings().openness===.32&&RoadAtlasUrban.getSettings().relief===.85"))
 page.evaluate("RoadAtlasPipeline.setMode('legacy')");legacy=page.evaluate('worldCanvas.toDataURL()')
 orig=browser.new_page();orig.set_content(html(SEEDS[2],legacy=True),wait_until='load');check('Original V1 remains pixel-identical with urban module loaded',orig.evaluate('worldCanvas.toDataURL()')==legacy);orig.close();page.close()
 # Actual seven-resource loader, parameter roundtrip, and mobile touch controls.
 for viewport in [{'width':390,'height':844},{'width':844,'height':390}]:
  page=browser.new_page(viewport=viewport,device_scale_factor=2,is_mobile=True,has_touch=True);page.set_default_timeout(120000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  files={k:v for k,v in sources.items() if k.endswith('.js')};files['road-atlas-navigation.js']=(ROOT/'road-atlas-navigation.js').read_text();files['road-atlas-streets.js']=(ROOT/'road-atlas-streets.js').read_text();files['road-atlas-street-hooks.js']=(ROOT/'road-atlas-street-hooks.js').read_text();files['vendor/road-atlas-baseline-329a68a.html']=baseline
  mock='<script>window.fetch=async function(path){const f='+json.dumps(files).replace('</','<\\/')+';const k=String(path).replace(/^\\.\\//,\'\').split(\'?\')[0];return new Response(f[k]||\'missing\',{status:f[k]?200:404});};</script>'
  boot=sources['road-atlas-v2.html'].replace('<script>',mock+'<script>',1)
  # Navigation is blocked in this build environment. Supply URLSearchParams
  # through a local query fixture, while loading unmodified runtime file bytes.
  url='https://atlas.test/road-atlas-v2.html?seed='+SEEDS[0]+'&urban=1&character=courtyard&openness=0.45&relief=0.65'
  query_fixture='<script>const NativeQuery=window.URLSearchParams;window.URLSearchParams=class extends NativeQuery {constructor(input){super(input===""?'+json.dumps('?'+url.split('?',1)[1])+':input);}};</script>'
  page.set_content(query_fixture+boot,wait_until='load',timeout=120000);page.wait_for_function('world?.urban?.enabled')
  check(str(viewport)+' seven-resource boot exactly once',page.evaluate("RoadAtlasPipeline.version==='2.3.0'&&RoadAtlasUrban.version==='2.4.0'&&document.querySelectorAll('.sc-pill').length===1"))
  check(str(viewport)+' shared settings restored on boot',page.evaluate("RoadAtlasUrban.getSettings().character==='courtyard'&&RoadAtlasUrban.getSettings().openness===.45&&RoadAtlasUrban.getSettings().relief===.65"))
  check(str(viewport)+' wrapped toolbar and stage fit',page.evaluate('document.getElementById("topbar").scrollWidth<=innerWidth && document.getElementById("stage").getBoundingClientRect().top>=document.getElementById("topbar").getBoundingClientRect().bottom-1'))
  page.locator('#urbanDesignBtn').tap();check(str(viewport)+' touch study opens without horizontal overflow',page.evaluate('document.getElementById("urbanStudy").open && document.getElementById("urbanStudy").scrollWidth<=document.getElementById("urbanStudy").clientWidth+1'))
  page.locator('[data-urban-phase="2"]').tap();check(str(viewport)+' touch phases respond',page.locator('[data-urban-phase="2"]').get_attribute('aria-pressed')=='true')
  if viewport['width']==390:page.screenshot(path=str(OUT/'mobile-study.png'));page.locator('[data-urban-setting="character"]').select_option('terraced');check('Mobile design controls change models',page.evaluate("world.urban.settings.character==='terraced'"));page.screenshot(path=str(OUT/'mobile-controls.png'))
  page.locator('#urbanStudy .urbanClose').tap();check(str(viewport)+' touch close returns to city',not page.locator('#urbanStudy').is_visible());page.close()
 browser.close()
check('No uncaught browser errors',not report['errors'],report['errors'])
report['passed']=all(c['passed'] for c in report['checks']);report['testCount']=len(report['checks']);report['totalDefaultMasses']=sum(s['validation']['masses'] for s in report['seeds'])
(OUT/'validation.json').write_text(json.dumps(report,indent=2));print('CHECKS',report['testCount'],'PASSED',report['passed'],flush=True)
raise SystemExit(0 if report['passed'] else 1)
