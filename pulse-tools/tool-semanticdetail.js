/* Semantic Detail Expander — Pulse tool.
 * Paste a rich description of a desired environment, experience, interface, object,
 * place, app, or world. The expander mines it for concrete design specifications —
 * dimensions, materials, lighting, composition, interaction — each tagged with
 * provenance (explicit / implied / inferred / creative / unresolved), and projects
 * the result as a human-legible blueprint section and a builder checklist.
 *
 * It answers: WHAT WOULD HAVE TO BE TRUE for the description to be true.
 * Generation is not authority: creative and inferred items are labeled, never
 * presented as Sebastian-authored truth.
 *
 * TAGS: tool:semanticdetail | cat:creation cat:interface | kind:interactive |
 *       dep:semantic-detail-core dep:localstorage |
 *       prov:semantic-detail-expansion | see:evergrove see:moor-blueprint-standard |
 *       src:pulse-tools/tool-semanticdetail.js
 */
(function(){
'use strict';

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function loadCore(){
  if(window.SemanticDetail)return window.SemanticDetail;
  return null;
}

TOOLS.semanticdetail = { mount: function(host){
  host.innerHTML =
    '<div class="t-sec"><div class="eyebrow">Semantic Detail Expander v1</div>'+
    '<div class="meta">Paste a rich description of the environment, place, or experience you want. '+
    'The expander extracts the semantics and compiles them into concrete design specifications — '+
    'each tagged explicit, implied, inferred, creative, or unresolved. It will not silently '+
    'present its own inventions as your decisions.</div></div>'+
    '<div class="t-sec"><div class="eyebrow">Source description</div>'+
    '<textarea id="sd-src" rows="6" style="width:100%" spellcheck="false" placeholder="e.g. A serene courtyard garden at dusk. Weathered oak benches sit beside a still reflecting pool. Warm lantern light glows against limestone walls..."></textarea>'+
    '<div class="t-row" style="margin-top:8px;gap:8px;display:flex;flex-wrap:wrap">'+
    '<input id="sd-seed" placeholder="seed (optional)" style="width:140px">'+
    '<input id="sd-domain" placeholder="domain (optional)" style="width:140px">'+
    '<button class="btn primary" id="sd-go">Expand to specifications</button></div>'+
    '<div class="meta" id="sd-err" style="color:#e88"></div></div>'+
    '<div class="t-sec" id="sd-out-wrap" style="display:none">'+
    '<div class="eyebrow">Human projection <span class="meta" id="sd-count"></span></div>'+
    '<div id="sd-human" style="white-space:pre-wrap"></div>'+
    '<div class="eyebrow" style="margin-top:12px">Builder checklist</div>'+
    '<div id="sd-builder" style="white-space:pre-wrap"></div></div>';

  host.querySelector('#sd-go').addEventListener('click',function(){
    var err=host.querySelector('#sd-err');err.textContent='';
    var SD=loadCore();
    if(!SD){err.textContent='Semantic detail core not loaded. It ships with the next dashboard build.';return;}
    var src=host.querySelector('#sd-src').value.trim();
    if(src.length<40){err.textContent='Give it a richer description — a sentence or two is not enough semantic raw material.';return;}
    var seed=host.querySelector('#sd-seed').value.trim()||('s'+Date.now().toString(36));
    var domain=host.querySelector('#sd-domain').value.trim()||'environment';
    try{
      var sem=SD.extractSemanticsWithText?SD.extractSemanticsWithText(src):SD.extractSemantics(src);
      var spec=SD.expandToSpecs(sem,{seed:seed,domain:domain});
      host.querySelector('#sd-human').textContent=SD.projectForHuman(spec,domain);
      host.querySelector('#sd-builder').textContent=SD.projectForBuilder(spec);
      host.querySelector('#sd-count').textContent='· '+spec.specs.length+' items';
      host.querySelector('#sd-out-wrap').style.display='';
    }catch(e){err.textContent='Expansion failed: '+e.message;}
  });
}, unmount: function(){/* stateless */} };
})();
