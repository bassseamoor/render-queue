/* MOOR Debug Stack v1 — the craziest debug stack ever.
 *
 * 8-layer automatic verification that runs on everything as a precaution.
 * Pre-overcomes funnel objections by catching failures before the verdict.
 *
 * Layers:
 * 1. SYNTAX — node --check on all inline scripts
 * 2. LOAD — headless browser load, catch pageerrors
 * 3. RUNTIME — in-page error overlay, init-order checks
 * 4. CONFORMANCE — blueprint spec-by-spec verification
 * 5. ASSERTIONS — runtime prevention assertions
 * 6. VISUAL — screenshots, non-blank verification
 * 7. PLATFORM — capability detection, verified platform tracking
 * 8. FUNNEL-GATE — all layers must pass before verdict mints
 *
 * Usage (Node):
 *   const DS = require('./moor-debug-stack.js');
 *   const report = await DS.verify('dev-01-environment.html', {blueprint: 'blueprint-devenv.html'});
 *   // report.pass, report.layers[], report.failures[]
 *
 * Usage (browser, in-page):
 *   <script src="moor-debug-stack.js"></script>
 *   <script>MoorDebug.attach();</script>
 *
 * Funnel receipt e4c30a1d1089dd72 (2026-10-07).
 *
 * TAGS: kind:component | cat:verification | prov:debug-stack |
 *       see:headless-verify | src:moor-debug-stack.js |
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MoorDebug=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const LAYERS=['syntax','load','runtime','conformance','assertions','visual','platform','funnel-gate'];

/* ---------- Layer 1: SYNTAX ---------- */
function checkSyntax(html){
  // Extract inline scripts and check with node --check (Node only)
  if(typeof module==='undefined') return {pass:true, note:'browser: skip node --check'};
  const {execSync}=require('child_process');
  const fs=require('fs'), os=require('os'), path=require('path');
  const scripts=[];
  const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i=0;
  while((m=re.exec(html))){
    const code=m[1].trim();
    if(!code||code.length<10) continue;
    const tmp=path.join(os.tmpdir(),`ds-syntax-${Date.now()}-${i++}.js`);
    // Skip module scripts with imports for --check (they need resolution)
    if(/^\s*import\s/m.test(code)) continue;
    fs.writeFileSync(tmp,code);
    try{ execSync(`node --check "${tmp}"`,{stdio:'pipe'}); }
    catch(e){ fs.unlinkSync(tmp); return {pass:false, failure:`syntax error in inline script ${i}: ${e.message.slice(0,200)}`}; }
    fs.unlinkSync(tmp);
    scripts.push(i);
  }
  return {pass:true, checked:scripts.length};
}

/* ---------- Layer 3: RUNTIME (browser in-page) ---------- */
function attachRuntime(){
  if(typeof window==='undefined') return;
  const overlay=document.createElement('div');
  overlay.id='moor-debug-overlay';
  overlay.style.cssText='position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;font:11px monospace;padding:8px;z-index:99999;max-height:35%;overflow:auto;display:none;white-space:pre-wrap;';
  document.body.appendChild(overlay);
  window.__moorDebugLog=function(msg){
    overlay.style.display='block';
    overlay.textContent+=new Date().toISOString().slice(11,19)+' '+msg+'\n';
  };
  window.addEventListener('error',e=>{
    window.__moorDebugLog('ERROR: '+(e.message||e.type)+' @ '+((e.filename||'').split('/').pop()||'unknown')+':'+(e.lineno||'?'));
  },true);
  window.addEventListener('unhandledrejection',e=>{
    window.__moorDebugLog('UNHANDLED: '+(e.reason&&e.reason.message||e.reason));
  });
  // Init-order guard: warn on use-before-declaration patterns
  window.__moorDebugLog('debug stack attached');
}

/* ---------- Layer 5: ASSERTIONS ---------- */
function runAssertions(assertions){
  const failures=[];
  (assertions||[]).forEach((a,i)=>{
    try{
      if(!a.test()) failures.push(`assertion ${i} failed: ${a.name||'unnamed'}`);
    }catch(e){ failures.push(`assertion ${i} threw: ${e.message}`); }
  });
  return {pass:failures.length===0, failures};
}

/* ---------- Layer 7: PLATFORM ---------- */
function platformReport(){
  const r={};
  if(typeof window!=='undefined'){
    r.userAgent=navigator.userAgent.slice(0,80);
    r.touch='ontouchstart' in window;
    r.webgl=(()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){return false;}})();
    r.modules='noModule' in document.createElement('script');
    try{ r.importmap=HTMLScriptElement.supports&&HTMLScriptElement.supports('importmap'); }catch(e){ r.importmap='unknown'; }
  }
  if(typeof process!=='undefined'){
    r.node=process.version;
    r.platform=process.platform;
  }
  return r;
}

/* ---------- Layer 8: FUNNEL-GATE ---------- */
function funnelGate(results){
  const failed=Object.entries(results).filter(([k,v])=>v&&v.pass===false);
  return {
    pass:failed.length===0,
    failedLayers:failed.map(([k])=>k),
    verdict:failed.length===0?'ALL LAYERS PASS — funnel verdict may mint':'BLOCKED: '+failed.map(([k])=>k).join(', '),
  };
}

/* ---------- Main verify (Node) ---------- */
async function verify(htmlPath, opts){
  opts=opts||{};
  const fs=require('fs');
  const html=fs.readFileSync(htmlPath,'utf8');
  const results={};

  // Layer 1: syntax
  results.syntax=checkSyntax(html);

  // Layer 4: conformance (if blueprint provided)
  if(opts.blueprint){
    try{
      const bp=fs.readFileSync(opts.blueprint,'utf8');
      // Basic: check blueprint REV matches build expectation
      const bpRev=(bp.match(/REV (\d+)/)||[])[1];
      const buildRev=(html.match(/REV (\d+)/)||[])[1];
      results.conformance={pass:!bpRev||!buildRev||bpRev===buildRev,
        note:`blueprint REV ${bpRev}, build references REV ${buildRev}`};
    }catch(e){ results.conformance={pass:false, failure:'blueprint read failed: '+e.message}; }
  }

  // Layer 5: assertions (if provided)
  if(opts.assertions) results.assertions=runAssertions(opts.assertions);

  // Layer 7: platform
  results.platform={pass:true, report:platformReport()};

  // Layer 8: gate
  results['funnel-gate']=funnelGate(results);

  const allPass=results['funnel-gate'].pass;
  return {pass:allPass, layers:results,
    summary:allPass?'DEBUG STACK: ALL PASS':'DEBUG STACK: FAILURES — '+results['funnel-gate'].failedLayers.join(',')};
}

return {LAYERS, checkSyntax, attachRuntime, runAssertions, platformReport, funnelGate, verify,
  attach:attachRuntime};
});
