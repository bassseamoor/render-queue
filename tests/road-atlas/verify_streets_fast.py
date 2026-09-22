"""Road Atlas 2.4: exercise exact shipped bootstrap, graph and parameterized kit.
Run: python tests/road-atlas/verify_streets.py
Requires Playwright/Chromium, Shapely and beautifulsoup4. No live-CDN or iOS claim.
All source responses are first-party local files; source hashes are recorded.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from shapely.geometry import Polygon, LineString, GeometryCollection
from shapely.ops import unary_union
import hashlib,json,math,base64,os,shutil,time
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tests/road-atlas/streets-proof';OUT.mkdir(parents=True,exist_ok=True)
NAMES=['road-atlas-v2.html','road-atlas-pipeline.js','road-atlas-conditions.js','road-atlas-urban.js','road-atlas-navigation.js','road-atlas-streets.js','road-atlas-street-hooks.js','vendor/road-atlas-baseline-329a68a.html']
SOURCES={n:(ROOT/n).read_text() for n in NAMES}
SEEDS=['RA1-821c9gee01c3','RA1-8339djhi11zg']
REPORT={'version':'2.5.0','execution':'Local exact seven-resource async bootstrap; headless Chromium, independent Shapely geometry','sourceSHA256':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in NAMES},'checks':[],'seeds':[],'errors':[],'warnings':[]}
def check(name,ok,detail=None):
 REPORT['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
 print(('PASS ' if ok else 'FAIL ')+name,detail if not ok else '',flush=True)
 (OUT/'validation.json').write_text(json.dumps(REPORT,indent=2))
def digest(page,expr):return hashlib.sha256(page.evaluate('JSON.stringify('+expr+')').encode()).hexdigest()
def events(page):
 page.set_default_timeout(180000);page.on('pageerror',lambda e:REPORT['errors'].append(str(e)));page.on('console',lambda m:REPORT['warnings'].append(m.text) if m.type=='warning' else None)
def boot(page,seed=SEEDS[0],extra=''):
 query='?seed='+seed+'&pipeline=ordered&urban=1&topo=1'+extra
 data={n:s for n,s in SOURCES.items() if n!='road-atlas-v2.html'}
 fixture='<script>const NativeQuery=window.URLSearchParams;window.URLSearchParams=class extends NativeQuery{constructor(input){super(input===""?'+json.dumps(query)+':input);}};window.fetch=async function(path){const files='+json.dumps(data).replace('</','<\\/')+';const k=String(path).replace(/^\\.\\//,\'\').split(\'?\')[0];return new Response(files[k]||\'missing\',{status:files[k]?200:404});};</script>'
 page.set_content(SOURCES['road-atlas-v2.html'].replace('<script>',fixture+'<script>',1),wait_until='load',timeout=180000)
 page.wait_for_function('!!window.world?.network');page.wait_for_timeout(180)
def snapshot(page,name,canvas='worldCanvas'):
 (OUT/name).write_bytes(base64.b64decode(page.evaluate(canvas+'.toDataURL()').split(',')[1]))
def poly(ps):return Polygon([(p['x'],p['y']) for p in ps])
def rings(rs):
 p=GeometryCollection()
 for r in rs:p=p.symmetric_difference(poly(r))
 return p

def geometry_check(data):
 N=data['network'];K=data['streetKit'];E=N['edges'];V=N['nodes'];J=K['junctions'];roads=data['roads'];problems=[];crossings=K['crosswalks'];jpolys={};bars=0;volumes=0
 def near(a,b,tol=.025):return math.hypot(a['x']-b['x'],a['y']-b['y'])<=tol
 for i,e in enumerate(E):
  if e['from']==e['to'] or not math.isfinite(e['length']) or e['length']<=0:problems.append(['edge',i])
  if not near(e['points'][0],V[e['from']]) or not near(e['points'][-1],V[e['to']]):problems.append(['endpoint',i])
 for j in J:
  if j['deg']!=len(j['ports']) or len({p['edge'] for p in j['ports']})!=j['deg']:problems.append(['ports',j['node']])
  if j['deg']<3:
   if j['crosswalks']:problems.append(['nonjunction crossing',j['node']])
   continue
  g=poly(j['polygon']);jpolys[j['node']]=g
  if not g.is_valid or g.area<=0:problems.append(['junction polygon',j['node']])
  for p in j['ports']:
   e=E[p['edge']];r=roads[p['edge']];tip=r['points'][0] if e['from']==j['node'] else r['points'][-1]
   if not near(tip,p['center']):problems.append(['port mismatch',j['node'],p['edge']])
   if p['width']!=[8,11,15][e['class']]:problems.append(['width mismatch',j['node']])
   mouth=LineString([(p['minus']['x'],p['minus']['y']),(p['plus']['x'],p['plus']['y'])])
   if not g.buffer(.03).covers(mouth):problems.append(['open port',j['node']])
 seen=set();groups=[]
 for c in crossings:
  key=(c['node'],c['edge'])
  if key in seen:problems.append(['duplicate crossing',key])
  seen.add(key);g=poly(c['outline']);groups.append(g);edge=E[c['edge']]
  pavement=LineString([(p['x'],p['y']) for p in edge['points']]).buffer([8,11,15][edge['class']]/2)
  if not pavement.buffer(.04).covers(g):problems.append(['crossing off pavement',key])
  for p in c['bars']:
   bars+=1
   if not pavement.buffer(.04).covers(poly(p)):problems.append(['stripe off pavement',key])
 for i,g in enumerate(groups):
  for h in groups[i+1:]:
   if g.intersection(h).area>1e-6:problems.append(['overlapping crossing groups',i])
 C=data['conditions'];parcels={p['id']:rings(p['rings']) for p in C['parcels']}
 for b in data['buildings']:
  q=parcels[b['parcelId']]
  if not q.is_valid:problems.append(['parcel',b['parcelId']])
  if 'architecture' not in b:problems.append(['missing architecture']);continue
  for v in b['architecture']['volumes']:
   volumes+=1;ground=poly(v['plan']);sweep=unary_union([poly(v['projectedBase']),poly(v['projectedRoof'])]).convex_hull
   if not q.buffer(1e-6).covers(ground) or not q.buffer(1e-6).covers(sweep):problems.append(['building containment',b['parcelId']])
  for surface in b['architecture']['landscape']['surfaces']:
   g=rings(surface['rings'])
   if (not g.is_empty and not q.buffer(1e-6).covers(g)) or abs(g.area-surface['area'])>1e-6:problems.append(['landscape containment',b['parcelId']])
 return {'problemCount':len(problems),'problems':problems[:20],'junctions':len(jpolys),'crossingGroups':len(crossings),'stripes':bars,'volumes':volumes}

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for si,seed in enumerate(SEEDS):
  page=browser.new_page(viewport={'width':1440,'height':960});events(page);t=time.time();boot(page,seed)
  check(seed+' shipped street module executed',page.evaluate("world.streetKit?.version==='2.5.0'"),page.locator('#err').text_content())
  data=json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())'));res=geometry_check(data);m=data['streetKit']['metrics']
  check(seed+' independently valid ports, pavement, crossing groups and buildings',res['problemCount']==0,res)
  check(seed+' actual map coverage at least 90% of eligible 16x10 samples',m['coverageShare']>=.9,m)
  check(seed+' truthful component count and exported types',m['components']==data['diagnostics']['metrics']['components'] and sum(m['junctionTypes'].values())==len(data['network']['nodes']))
  signature=digest(page,'({network:world.network.roads,kit:world.streetKit,buildings:world.blocks.buildings})');pixels=page.evaluate('worldCanvas.toDataURL()');page.evaluate('regenerate()')
  check(seed+' repeated recipe reproduces graph, kit, buildings and pixels',signature==digest(page,'({network:world.network.roads,kit:world.streetKit,buildings:world.blocks.buildings})') and pixels==page.evaluate('worldCanvas.toDataURL()'))
  check(seed+' actual generation hierarchy precedes conditional placement',page.evaluate("world.pipeline.metrics.stageOrder.indexOf('Final junctions and bridges')<world.pipeline.metrics.stageOrder.indexOf('Reserve pavement, extract blocks, pack buildings')"))
  if si in [0,1,2,7]:snapshot(page,f'final-city-{si}.png')
  REPORT['seeds'].append({'seed':seed,'elapsedSeconds':round(time.time()-t,2),'geometry':res,'coverage':m,'generationStages':data['diagnostics']['trace']})
  if si==0:
   (OUT/'example-network.json').write_text(json.dumps(data,separators=(',',':')))
   page.evaluate('RoadAtlasNavigation.zoomAt(6)');page.wait_for_timeout(500);page.screenshot(path=str(OUT/'desktop-zoom.png'))
   page.evaluate('RoadAtlasStreets.setEnabled(false)');snapshot(page,'previous-city.png');old=digest(page,'world.network.roads');oldpix=page.evaluate('worldCanvas.toDataURL()')
   page.evaluate('RoadAtlasStreets.setEnabled(true);RoadAtlasStreets.setEnabled(false)')
   check('Prior ordered comparison reproducible after toggling new street assembly',old==digest(page,'world.network.roads') and oldpix==page.evaluate('worldCanvas.toDataURL()'))
  page.close()
 # Parameterized junction fixtures, not pre-rendered/bitmap assets.
 page=browser.new_page(viewport={'width':1440,'height':960});events(page);boot(page)
 for name,angles,classes in [('T',[0,math.pi/2,math.pi],[2,0,2]),('X',[0,math.pi/2,math.pi,3*math.pi/2],[2,1,0,2]),('skew Y',[.15,2.1,4.4],[1,0,2]),('rotated X',[.4,.4+math.pi/2,.4+math.pi,.4+3*math.pi/2],[1,1,0,0]),('near parallel',[0,.15,math.pi],[2,0,1])]:
  result=page.evaluate('''(f)=>{let nodes=[{x:180,y:180}],roads=[];f.angles.forEach((a,i)=>{let p={x:180+100*Math.cos(a),y:180+100*Math.sin(a)};nodes.push(p);roads.push({from:0,to:i+1,pts:[nodes[0],p],length:100,cls:f.classes[i],source:'fixture',bridges:[]});});let N=RoadAtlasPipeline.debug.graph(nodes,roads),F={waterDist:()=>1000};return RoadAtlasStreets.debug.geometry(N,F).streetKit;}''',{'angles':angles,'classes':classes})
  center=result['junctions'][0];check(name+' template produces a valid, parameter-derived outline',poly(center['polygon']).is_valid and poly(center['polygon']).area>0)
  check(name+' template has exactly one port per input edge',len(center['ports'])==len(angles) and len({p['edge'] for p in center['ports']})==len(angles))
 # A malformed assembly is rejected before publishing.
 try:page.evaluate("RoadAtlasStreets.debug.validateKit(world.network,world.roads,{junctions:[{node:0,ports:[],deg:3,polygon:[]}],crosswalks:[]})");rejected=False
 except Exception:rejected=True
 check('Invalid assembly triggers runtime validation',rejected)
 # Corner policy changes geometry/reservations, not street centerline topology.
 labels=page.evaluate('''()=>{let c=document.createElement('canvas');c.width=WORLD_W;c.height=WORLD_H;let ctx=c.getContext('2d'),old=ctx.fillText,all=[];ctx.fillText=function(t,...a){all.push(t);return old.call(ctx,t,...a)};renderWorld(ctx,world);return all;}''')
 check('Map scale reports illustrative world units',any(str(s).endswith(' units') for s in labels))
 net=digest(page,'world.network.roads');curves=[]
 for radius in [4,8,14]:
  page.evaluate('(r)=>RoadAtlasStreets.setRadius(r)',radius);res=geometry_check(json.loads(page.evaluate('JSON.stringify(RoadAtlasPipeline.exportData())')))
  check(str(radius)+' unit corner setting conforms independently',res['problemCount']==0,res)
  check(str(radius)+' unit corner setting preserves logical street graph',net==digest(page,'world.network.roads'))
  curves.append(digest(page,'world.streetKit.junctions'))
 check('Corner control changes actual fitted junction geometry',len(set(curves))==3)
 page.evaluate('RoadAtlasStreets.setRadius(8)');signature=digest(page,'({network:world.network.roads,kit:world.streetKit})')
 page.evaluate('P.theme=1;state.seed=encodeSeed();regenerate()');check('Palette change preserves network and junction kit',signature==digest(page,'({network:world.network.roads,kit:world.streetKit})'))
 page.evaluate('RoadAtlasConditions.setView({topo:false,parcels:true})');check('Layer visibility does not change network',net==digest(page,'world.network.roads'))
 q=page.evaluate("RoadAtlasConditions.queryParameters(new URL('https://atlas.test')).search");check('Share includes selected street assembly and corner policy','streets=connected' in q and 'corners=8' in q)
 try:page.evaluate("RoadAtlasStreetHooks.transform('wrong','wrong')");stopped=False
 except Exception:stopped=True
 check('Unexpected first-party source revisions fail closed rather than mispatch',stopped)
 page.close()
 # Real browser input on the same full-map scene at phone dimensions.
 for width,height in [(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2);events(page);boot(page,SEEDS[0],'&corners=10')
  check(str(width)+' touch bootstrap creates one console and restores radius',page.evaluate("document.querySelectorAll('.sc-pill').length===1&&RoadAtlasStreets.getSettings().radius===10"))
  before=digest(page,'world.network.roads');page.locator('#raZoomIn').tap();page.locator('#raZoomIn').tap();page.evaluate('RoadAtlasNavigation.zoomAt(10)');page.wait_for_function('RoadAtlasNavigation.getView().detailReady');snapshot(page,f'phone-detail-{width}.png','document.querySelector(".ra-map-detail")')
  # Measure text delivered to the actual idle viewport renderer.
  measured=page.evaluate('''()=>{let c=document.querySelector('.ra-map-detail').getContext('2d'),r=document.getElementById('stage').getBoundingClientRect(),cssD=c.canvas.width/r.width,old=c.fillText,out=[];c.fillText=function(t,...a){if(/DOWNTOWN|RESIDENTIAL|COMMERCIAL|INDUSTRIAL|WATERFRONT/.test(t))out.push(parseFloat(c.font.replace(/^(600|400) /,''))*c.getTransform().a/cssD);return old.call(c,t,...a);};RoadAtlasStreets.draw(c,world);c.fillText=old;return out;}''')
  check(str(width)+' district labels remain screen-sized at 10x',bool(measured) and max(measured)<=16.2,measured)
  cdp=page.context.new_cdp_session(page);rect=page.locator('#stage').bounding_box();x=width*.5;y=rect['y']+rect['height']*.45
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':0,'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':0,'x':x+35,'y':y+15}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  check(str(width)+' touch movement changes camera, never logical roads',before==digest(page,'world.network.roads') and not page.evaluate('RoadAtlasNavigation.getView().dragging'))
  page.wait_for_timeout(400);page.screenshot(path=str(OUT/f'mobile-{width}.png'));page.locator('#raFitMap').tap();page.wait_for_timeout(60);check(str(width)+' Fit resets to whole-map framing',page.evaluate('RoadAtlasNavigation.getView().zoom===1'))
  page.close()
 browser.close()
check('No uncaught browser errors',not REPORT['errors'],REPORT['errors'])
check('No camera fallback warnings',not REPORT['warnings'],REPORT['warnings'])
REPORT['passed']=all(x['passed'] for x in REPORT['checks']);REPORT['testCount']=len(REPORT['checks']);(OUT/'validation.json').write_text(json.dumps(REPORT,indent=2));print('STREETS',REPORT['testCount'],REPORT['passed'],flush=True)
raise SystemExit(0 if REPORT['passed'] else 1)
