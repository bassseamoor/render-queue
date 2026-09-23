// Fireplace Studio — ui/diagnostics.js. See README.md for ownership and replacement boundaries.
import { gl } from '../renderer/context.js';

function showDiagnostics(){
  if(!/[?&]sherr=1/.test(location.search)) return;
  let renderer="n/a";
  try{
    const ext=gl.getExtension("WEBGL_debug_renderer_info");
    renderer=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
  }catch(e){ renderer="err: "+e; }
  const d=document.createElement("div");
  d.id="fp-sherr";
  d.style.cssText="position:fixed;left:0;right:0;top:0;max-height:72vh;overflow:auto;z-index:999999;"+
    "background:rgba(0,0,0,0.93);color:#7dff7d;font:11px/1.45 ui-monospace,Menlo,monospace;"+
    "white-space:pre-wrap;word-break:break-word;padding:12px;margin:0;text-align:left;";
  let t="FIREPLACE SHADER DIAGNOSTICS\nrenderer: "+renderer+
    "\nwebgl2: "+(!!gl).toString()+"  seed: "+(window.__fpGetSeed?window.__fpGetSeed():"n/a")+"\n\n";
  let fails=0;
  for(const e of window.__fpShaderLogs){
    if(!e.ok) fails++;
    t+=(e.ok?"[OK]  ":"[FAIL]")+e.prog+" / "+e.stage+": "+e.log+"\n---\n";
  }
  t+="\n"+fails+" failing stage(s). Screenshot this and send it back.";
  d.textContent=t;
  document.body.appendChild(d);
  window.__fpShaderReport=t;
  /* also stamp the failing-stage summary on the seed chip title (deferred: Seed Console inits later) */
  setTimeout(function(){
    try{
      const chip=document.querySelector(".sc-seed");
      const seed=(window.__fpGetSeed?window.__fpGetSeed():"n/a");
      if(chip) chip.title="SHADER DIAG ("+seed+"): "+fails+" failing stage(s). "+renderer;
    }catch(e){}
  },3000);
}

export { showDiagnostics };
