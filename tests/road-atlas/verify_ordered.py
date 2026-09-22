"""Offline browser validation. Uses the exact vendored first-party script bytes.
Run: python tests/road-atlas/verify_ordered.py (Python Playwright + Chromium required).
Browser navigation is blocked in the build container; document.set_content is
used, so these tests verify execution/rendering, not live-network deployment.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import base64,json,hashlib,time
ROOT=Path(__file__).resolve().parents[2]; SITE=ROOT; OUT=ROOT/'tests/road-atlas/proof';OUT.mkdir(parents=True,exist_ok=True)
baseline=(ROOT/'vendor/road-atlas-baseline-329a68a.html').read_text()
scripts=[s.text for s in BeautifulSoup(baseline,'html.parser').find_all('script')]
module=(SITE/'road-atlas-pipeline.js').read_text()
head=(SITE/'road-atlas-v2.html').read_text().split('<script>')[0]
def html(seed,ordered=True):
 ss=scripts.copy();ss[0]=ss[0].replace('randomSeed:function(){return randomSeedStr();}',"randomSeed:function(){return '"+seed+"';}")
 return head+''.join('<script>'+t+'</script>' for t in [ss[0],*([module] if ordered else []),*ss[1:]])+'</body></html>'

def fingerprint(page,expr):
 return page.evaluate('()=>{const s=JSON.stringify('+expr+');let h=2166136261,k=5381;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619);k=Math.imul(k,33)^s.charCodeAt(i);}return (h>>>0).toString(16)+":"+(k>>>0).toString(16)+":"+s.length;}')

def picture(page,path):
 v=page.evaluate("worldCanvas.toDataURL('image/png')");path.write_bytes(base64.b64decode(v.split(',')[1]));return hashlib.sha256(v.encode()).hexdigest()

# Same layout values, different salts and the legal scale/density/water extremes.
SEEDS=['RA1-821c9gee01aa','RA1-821c9gee01ab','RA1-821c9gee01c3','RA1-821c9gee01z9',
       'RA1-c21c9gee01r2','RA1-g42o9kee01m3','RA1-04269a8a01x7','RA1-821c90ee01w0']
report={'sourceCommit':'329a68a46c825cc96708c377638f7c5415f14a96','execution':'Chromium headless; local source via set_content','seeds':[],'checks':[],'errors':[]}
def check(name,condition,details=None):
 report['checks'].append({'name':name,'passed':bool(condition),'details':details})
 if not condition:print('FAIL:',name,details,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for count,seed in enumerate(SEEDS):
  print('START',seed,flush=True)
  page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1);page.set_default_timeout(60000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.set_content(html(seed,False),wait_until='load',timeout=60000)
  page.evaluate('window.__baselinePixels=worldCanvas.toDataURL()')
  beforeHash=None
  before=page.evaluate('({roads:world.roads.length,buildings:world.blocks.buildings.length,blocks:world.blocks.blocks.length})')
  if count<2:picture(page,OUT/('before-'+str(count)+'.png'))
  # Install ordered pass before regeneration, preserving the same original source.
  page.add_script_tag(content=module);page.evaluate('regenerate()')
  check(seed+' committed ordered result',page.evaluate('!!(world && world.pipeline)'),page.locator('#err').text_content())
  m=page.evaluate('world.pipeline.metrics');m['generationMs']=page.evaluate('world.pipeline.trace.reduce((a,t)=>a+t.ms,0)')
  # Fully independent projection of the exported graph's endpoint requirements.
  invariants=page.evaluate('''()=>{const N=world.network;
   let invalid=0;N.roads.forEach(r=>{if(r.from<0||r.to<0||r.from>=N.nodes.length||r.to>=N.nodes.length)invalid++;
    const a=r.pts[0],b=r.pts.at(-1),n=N.nodes[r.from],z=N.nodes[r.to];if(Math.hypot(a.x-n.x,a.y-n.y)>.001||Math.hypot(b.x-z.x,b.y-z.y)>.001)invalid++;});
   const D=RoadAtlasPipeline.exportData();
   return {invalid,transitMatches:world.layers.transit.every(t=>t.edges.every(e=>e>=0&&e<N.roads.length)),
    finiteField:Array.from(world.layers.acc.data).every(x=>Number.isFinite(x)&&x>=0&&x<=1),
    exportValid:JSON.parse(JSON.stringify(D)).network.edges.length===N.roads.length,
    components:N.components.length};}''')
  check(seed+' valid graph/export/transit/field',invariants['invalid']==0 and invariants['transitMatches'] and invariants['finiteField'] and invariants['exportValid'],invariants)
  sig=fingerprint(page,'RoadAtlasPipeline.exportData().network');pixel=None;page.evaluate('window.__orderedPixels=worldCanvas.toDataURL()')
  page.evaluate('regenerate()')
  check(seed+' identical repeat graph',fingerprint(page,'RoadAtlasPipeline.exportData().network')==sig)
  check(seed+' identical repeat pixels',page.evaluate('worldCanvas.toDataURL()===window.__orderedPixels'))
  if count<2:picture(page,OUT/('after-'+str(count)+'.png'));page.screenshot(path=str(OUT/('desktop-'+str(count)+'.png')))
  # Compare legacy mode to the untouched baseline's exact pixels.
  page.evaluate("RoadAtlasPipeline.setMode('legacy')")
  check(seed+' original-mode pixel parity',page.evaluate('worldCanvas.toDataURL()===window.__baselinePixels'))
  report['seeds'].append({'seed':seed,'before':before,'ordered':m})
  (OUT/'validation.json').write_text(json.dumps(report,indent=2))
  print(seed,'baseline',before,'ordered',m['edges'],m['buildings'],m['components'],'components',round(m['generationMs']), 'ms',flush=True)
  page.close()
 # Unit geometry fixtures, interaction controls and presentation independence.
 page=browser.new_page(viewport={'width':1440,'height':1000});page.set_content(html(SEEDS[0]),wait_until='load')
 unit=page.evaluate('''()=>{const p=RoadAtlasPipeline.debug.planarize,dry={waterDist:()=>100},wet={waterDist:()=>-100},
 r=(a,b)=>({cls:0,pts:[{x:a[0],y:a[1]},{x:b[0],y:b[1]}]}),
 x=p([r([0,50],[100,50]),r([50,0],[50,100])],dry),
 t=p([r([0,50],[100,50]),r([50,0],[50,50])],dry),
 c=p([r([0,0],[100,0]),r([20,0],[80,0])],dry),
 z=p([r([0,50],[100,50]),r([50,0],[50,100])],wet);
 return {xEdges:x.roads.length,xDegree:Math.max(...x.adj.map(a=>a.length)),tEdges:t.roads.length,tDegree:Math.max(...t.adj.map(a=>a.length)),collinearEdges:c.roads.length,collinearLength:c.roads.reduce((a,r)=>a+r.length,0),waterComponents:z.components.length};}''')
 check('X crossing has four edges and one degree-four node',unit['xEdges']==4 and unit['xDegree']==4,unit)
 check('T crossing has three edges and one degree-three node',unit['tEdges']==3 and unit['tDegree']==3,unit)
 check('Collinear overlap deduplicates',unit['collinearEdges']==3 and abs(unit['collinearLength']-100)<1e-7,unit)
 check('Crossing bridge spans do not invent a junction',unit['waterComponents']==2,unit)
 sig=fingerprint(page,'RoadAtlasPipeline.exportData().network')
 page.evaluate("P.theme=1;P.labelsOn=0;state.seed=encodeSeed();regenerate()")
 check('Theme and label changes do not regenerate layout',fingerprint(page,'RoadAtlasPipeline.exportData().network')==sig)
 baseHash=fingerprint(page,'worldCanvas.toDataURL()')
 page.locator('#layersBtn').click();page.locator('[data-layer="acc"]').click()
 check('Heatmap toggle does not mutate base geometry',fingerprint(page,'RoadAtlasPipeline.exportData().network')==sig and fingerprint(page,'worldCanvas.toDataURL()')==baseHash)
 page.locator('#analysisBtn').click();page.select_option('#pipelineMode','legacy')
 check('Comparison dropdown works',page.evaluate("RoadAtlasPipeline.getMode()==='legacy'"))
 page.select_option('#pipelineMode','ordered')
 check('Ordered dropdown restores ordered generator',page.evaluate('!!world.pipeline'))
 page.close()
 # Mobile viewport, actual tap targets, bounds and expanded analysis panel.
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 page.set_content(html(SEEDS[1]),wait_until='load')
 page.locator('#analysisBtn').tap();page.screenshot(path=str(OUT/'mobile-analysis.png'))
 check('Mobile analysis visible',page.locator('#analysisPanel').is_visible())
 check('Mobile top bar fits viewport',page.evaluate("document.getElementById('topbar').scrollWidth<=innerWidth"))
 page.locator('#analysisBtn').tap();page.locator('#layersBtn').tap()
 check('Mobile layer panel opens',page.locator('#layersPanel').is_visible())
 page.locator('[data-layer="transit"]').tap();page.locator('#layersBtn').tap();page.screenshot(path=str(OUT/'mobile-city.png'))
 page.close()
 # Test the actual shipped asynchronous boot path with local first-party fetch
 # fixtures. This tests DOMParser/script sequence, not internet availability.
 page=browser.new_page(viewport={'width':1024,'height':768})
 bootErrors=[];page.on('pageerror',lambda e:bootErrors.append(str(e)))
 sources={'vendor/road-atlas-baseline-329a68a.html':baseline.replace('randomSeed:function(){return randomSeedStr();}',"randomSeed:function(){return '"+SEEDS[0]+"';}"),'road-atlas-pipeline.js':module}
 mock='<script>window.fetch=async function(path){const f='+json.dumps(sources).replace('</','<\\/')+';const k=String(path).replace(/^\\.\\//,\'\').split(\'?\')[0];return new Response(f[k]||\'missing\',{status:f[k]?200:404});};</script>'
 boot=(SITE/'road-atlas-v2.html').read_text().replace('<script>',mock+'<script>',1)
 page.set_content(boot,wait_until='load');page.wait_for_function('window.RoadAtlasPipeline && world && world.pipeline')
 check('Shipped asynchronous boot executes exactly one initial build',page.evaluate("world.pipeline.version==='2.1.0' && document.querySelectorAll('.sc-pill').length===1") and not bootErrors,bootErrors)
 page.close();browser.close()
check('No uncaught browser errors',not report['errors'],report['errors'])
report['passed']=all(c['passed'] for c in report['checks']);report['testCount']=len(report['checks'])
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('CHECKS',report['testCount'],'PASSED',report['passed'],flush=True)
