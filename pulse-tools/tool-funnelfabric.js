/* Funnel Fabric — Pulse tool.
 * Describe what you want a funnel for (messy is fine) -> the Fabric compiles
 * a funnel definition (stages, per-stage questions, usage plan, done criteria)
 * -> run it through the real v44-sealed kernel -> real receipt.
 * The Fabric generates configurations; the kernel mints receipts.
 *
 * TAGS: tool:funnelfabric | cat:creation cat:interface | kind:interactive |
 *       dep:funnel-fabric-core dep:localstorage |
 *       prov:procedural-funnel-generation | see:funnel-kernel |
 *       src:pulse-tools/tool-funnelfabric.js
 */
(function(){
'use strict';

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

TOOLS.funnelfabric = { mount: function(host){
  host.innerHTML =
    '<div class="t-sec"><div class="eyebrow">Funnel Fabric v1</div>'+
    '<div class="meta">Describe what you want a funnel for — messy is fine. The Fabric compiles it into a funnel definition, then runs it on the real v44-sealed kernel. What comes out is a working funnel with a real receipt, not a chat answer.</div></div>'+
    '<div class="t-sec"><div class="eyebrow">Describe it</div>'+
    '<textarea id="ff-desc" rows="4" style="width:100%" placeholder="e.g. I want a funnel for planning my week. It is kind of messy — I never know what matters most. Do not turn it into a rigid schedule. It must keep the big rocks first." spellcheck="false"></textarea>'+
    '<div class="t-row" style="margin-top:8px"><button class="btn primary" id="ff-gen">Generate funnel</button></div>'+
    '<div class="meta" id="ff-err" style="color:#e88"></div></div>'+
    '<div class="t-sec" id="ff-def-wrap" style="display:none"><div class="eyebrow">Generated funnel definition</div>'+
    '<div class="meta" id="ff-def-meta"></div>'+
    '<div id="ff-def-stages"></div>'+
    '<div class="eyebrow" style="margin-top:8px">Done criteria</div>'+
    '<div class="meta" id="ff-def-done"></div>'+
    '<div class="t-row" style="margin-top:8px"><button class="btn primary" id="ff-run">Run it through the funnel</button></div>'+
    '<div class="meta" id="ff-run-status"></div></div>'+
    '<div class="t-sec" id="ff-receipt-wrap" style="display:none"><div class="eyebrow">Receipt</div>'+
    '<div class="meta" id="ff-receipt"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Honest limits (v1)</div>'+
    '<div class="meta">Compiles descriptions into funnel definitions and runs them on funnel-kernel.js (v44-sealed). '+
    'Not implemented: recursive solver society, resource forecasting, 3D foundry editing of funnel topology, new funnel law or stage types. '+
    'Generated runs carry machine provenance (<span class="mono">generated</span>) — the kernel mints the receipt, the Fabric only proposes the configuration. '+
    'Generated funnels live in this browser\u2019s funnel ledger until you decide what to do with them.</div></div>';

  var Fabric = window.FunnelFabric, Kernel = window.MOORFunnelKernel;
  var def = null;

  function fail(msg){
    host.querySelector('#ff-err').textContent = msg;
  }

  host.querySelector('#ff-gen').onclick = function(){
    fail('');
    host.querySelector('#ff-receipt-wrap').style.display='none';
    if(!Fabric||!Kernel){ fail('Funnel Fabric core or kernel not loaded in this page.'); return; }
    var desc = host.querySelector('#ff-desc').value;
    try { def = Fabric.compile(desc); }
    catch(e){ fail('Could not compile: '+e.message); return; }
    var ra = def.usage_plan.request_analysis||{};
    host.querySelector('#ff-def-meta').innerHTML =
      'Page 0 hash <span class="mono">'+esc(def.page0_hash)+'</span> · mode <b>'+esc(ra.mode||'?')+'</b> · '+
      def.obligations.length+' obligations · '+def.stages.reduce(function(n,s){return n+s.questions.length;},0)+' questions';
    host.querySelector('#ff-def-stages').innerHTML = def.stages.map(function(s){
      return '<div class="meta" style="margin-top:6px"><b>'+esc(s.stage)+'</b><br>'+
        s.questions.map(function(q,i){ return (i+1)+'. '+esc(q); }).join('<br>')+'</div>';
    }).join('');
    host.querySelector('#ff-def-done').innerHTML =
      def.done_criteria.map(function(c){ return '• '+esc(c); }).join('<br>');
    host.querySelector('#ff-def-wrap').style.display='';
    host.querySelector('#ff-run-status').textContent='';
  };

  host.querySelector('#ff-run').onclick = function(){
    if(!def){ fail('Generate a funnel first.'); return; }
    var btn = host.querySelector('#ff-run');
    btn.disabled = true;
    host.querySelector('#ff-run-status').textContent = 'Running on the v44 kernel…';
    setTimeout(function(){
      var out;
      try { out = Fabric.execute(def, Kernel); }
      catch(e){
        host.querySelector('#ff-run-status').textContent = 'Run failed: '+e.message;
        btn.disabled = false;
        return;
      }
      host.querySelector('#ff-run-status').textContent =
        'Done — '+def.stages.length+' stages advanced, receipt minted.';
      host.querySelector('#ff-receipt').innerHTML =
        'Fingerprint <span class="mono">'+esc(out.receipt.fingerprint)+'</span><br>'+
        'Valid: <b>'+(out.valid?'✓ yes':'✗ NO')+'</b> · law <span class="mono">'+esc(out.receipt.law_version)+'</span><br>'+
        '<span class="meta">request <span class="mono">'+esc(out.receipt.request_id)+'</span> · destination: '+esc(out.session.stages.verdict.destination||'(none)')+'</span>';
      host.querySelector('#ff-receipt-wrap').style.display='';
      btn.disabled = false;
    }, 30);
  };
}};

})();
