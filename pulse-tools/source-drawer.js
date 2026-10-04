/* Project Pulse — Source drawer (non-invasive).
 * One button in the header (</>) opens this drawer. It exposes the
 * underlying logic for AI/human reuse: the machine-readable manifest,
 * per-tool panel sources, component sources, and dependency notes.
 * No dashboard restructuring; purely additive. */
(function(){
'use strict';
var MANIFEST_URL='pulse-manifest.json';
var RAW_BASE='https://bassseamoor.github.io/render-queue/';

function el(tag, cls, html){
  var e=document.createElement(tag);
  if (cls) e.className=cls;
  if (html!=null) e.innerHTML=html;
  return e;
}
function esc(s){
  return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
}

var drawer=null, manifest=null, manifestFailed=false;

function ensureDrawer(){
  if (drawer) return drawer;
  drawer=el('div','src-drawer');
  drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-label','Underlying source and logic');
  drawer.innerHTML=
    '<div class="src-drawer-head">'+
      '<strong>&lt;/&gt; Underlying logic</strong>'+
      '<span class="src-drawer-sub">For builders &amp; AIs: what each tool is made of, and how to reuse it.</span>'+
      '<button class="btn src-close" aria-label="Close">&times;</button>'+
    '</div>'+
    '<div class="src-drawer-body">'+
      '<div class="src-sec"><div class="eyebrow">Machine-readable manifest</div>'+
      '<p class="meta">One JSON file describes every tool, its sources, and its dependencies. '+
      'Hand this URL to any AI with the Pulse link:</p>'+
      '<div class="src-row"><code class="mono src-url" id="src-manifest-url"></code>'+
      '<button class="btn" id="src-copy-manifest">Copy URL</button>'+
      '<a class="btn" id="src-open-manifest" target="_blank" rel="noopener">Open</a></div>'+
      '<div class="meta" id="src-manifest-status">Loading manifest&hellip;</div></div>'+
      '<div class="src-sec"><div class="eyebrow">Tools &amp; their sources</div>'+
      '<div class="meta">Panel source = the interactive page code (runs in Pulse). '+
      'Component source = the recovered/original software it is built on, verbatim where noted.</div>'+
      '<div id="src-tool-list"></div></div>'+
      '<div class="src-sec"><div class="eyebrow">How to reuse</div>'+
      '<div class="meta" id="src-reuse"></div></div>'+
    '</div>';
  document.body.appendChild(drawer);
  drawer.querySelector('.src-close').onclick=function(){ drawer.classList.remove('open'); };
  var url=RAW_BASE+MANIFEST_URL;
  drawer.querySelector('#src-manifest-url').textContent=url;
  drawer.querySelector('#src-open-manifest').href=url;
  drawer.querySelector('#src-copy-manifest').onclick=function(){
    var done=function(){ this.textContent='Copied'; }.bind(this);
    if (navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done, done);
    } else {
      var t=document.createElement('textarea'); t.value=url;
      document.body.appendChild(t); t.select();
      try{ document.execCommand('copy'); }catch(e){}
      document.body.removeChild(t); done();
    }
  };
  loadManifest();
  return drawer;
}

function loadManifest(){
  fetch(MANIFEST_URL,{cache:'no-store'}).then(function(r){
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(m){
    manifest=m; renderManifest(m);
  }).catch(function(err){
    manifestFailed=true;
    var st=document.querySelector('#src-manifest-status');
    if (st) st.textContent='Manifest not reachable ('+err.message+'). Tool sources below still work.';
    renderToolListFallback();
  });
}

function renderManifest(m){
  var st=document.querySelector('#src-manifest-status');
  if (st) st.textContent='Manifest v'+esc(m.version)+' · generated '+esc(m.generated)+' · '+
    (m.tools?m.tools.length:0)+' tools described.';
  var reuse=document.querySelector('#src-reuse');
  if (reuse){
    reuse.innerHTML=
      '<p><b>For an AI handed the Pulse link:</b> fetch <span class="mono">'+esc(RAW_BASE+MANIFEST_URL)+'</span> '+
      'for the full inventory. Each tool lists its <span class="mono">panel_source_url</span> '+
      '(the interactive implementation, plain browser JS) and its <span class="mono">component_source</span> '+
      '(the underlying recovered software, verbatim).</p>'+
      '<p><b>To reuse a tool as a dependency:</b> take its panel source file; the manifest\'s '+
      '<span class="mono">depends_on</span> lists the globals it needs '+
      '(e.g. <span class="mono">streamFrom</span> from seed-rng, <span class="mono">MoorWorld</span>, '+
      '<span class="mono">MAT</span> palettes). Shared libs are also published under '+
      '<span class="mono">pulse-tools/</span>.</p>'+
      '<p><b>Build:</b> '+esc(m.build&&m.build.description||'assembled single-file page')+'</p>';
  }
  renderToolList(m.tools||[]);
}

function toolEntries(){
  // dashboard.js exposes the component inventory as PULSE_COMPONENTS if present,
  // otherwise fall back to window.__PULSE_COMPONENTS set by the build.
  return (window.PULSE_COMPONENTS||window.__PULSE_COMPONENTS||[]);
}

function renderToolList(tools){
  var host=document.querySelector('#src-tool-list');
  if (!host) return;
  var comps=toolEntries();
  var byId={};
  comps.forEach(function(c){ byId[c.id]=c; });
  // Prefer manifest tools; fall back to dashboard inventory
  var list=tools.length?tools:comps.map(function(c){
    return {id:c.id,label:c.label,panel_source:c.toolSrc,
      panel_source_url:c.toolSrc?RAW_BASE+c.toolSrc:null,
      component_source:c.source, depends_on:[], reuse_notes:c.toolGap||''};
  });
  host.innerHTML='';
  list.forEach(function(t){
    var c=byId[t.id]||{};
    var d=el('div','src-tool');
    var deps=(t.depends_on||[]).map(function(x){return '<code class="mono">'+esc(x)+'</code>';}).join(' ');
    d.innerHTML=
      '<div class="src-tool-head"><b>'+esc(t.label||t.id)+'</b>'+
      '<span class="mono src-tool-id">'+esc(t.id)+'</span></div>'+
      (t.panel_source_url?
        '<div class="src-row"><span class="meta">Panel source:</span> '+
        '<a class="mono" target="_blank" rel="noopener" href="'+esc(t.panel_source_url)+'">'+esc(t.panel_source||'')+'</a>'+
        '<button class="btn src-view" data-src="'+esc(t.panel_source_url)+'">View</button></div>' : '')+
      (t.component_source?
        '<div class="src-row"><span class="meta">Component:</span> '+
        '<span class="mono">'+esc(t.component_source)+'</span></div>' : '')+
      (deps? '<div class="src-row"><span class="meta">Needs:</span> '+deps+'</div>' : '')+
      (t.reuse_notes? '<div class="meta src-notes">'+esc(t.reuse_notes)+'</div>' : '')+
      '<div class="src-codewrap" style="display:none"><div class="src-row">'+
      '<span class="meta">Source preview</span>'+
      '<button class="btn src-copy-code">Copy code</button></div>'+
      '<pre class="mono src-code"></pre></div>';
    host.appendChild(d);
  });
  host.querySelectorAll('.src-view').forEach(function(b){
    b.onclick=function(){ viewSource(b.getAttribute('data-src'), b); };
  });
}

function renderToolListFallback(){
  renderToolList([]);
}

function viewSource(url, btn){
  var wrap=btn.closest('.src-tool').querySelector('.src-codewrap');
  var pre=wrap.querySelector('.src-code');
  if (wrap.style.display!=='none'){ wrap.style.display='none'; btn.textContent='View'; return; }
  btn.textContent='Loading…';
  fetch(url,{cache:'no-store'}).then(function(r){
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.text();
  }).then(function(txt){
    pre.textContent=txt.slice(0,60000)+(txt.length>60000?'\n… (truncated, full file at URL)':'');
    wrap.style.display='';
    btn.textContent='Hide';
    wrap.querySelector('.src-copy-code').onclick=function(){
      var done=function(){ this.textContent='Copied'; }.bind(this);
      if (navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done, done);
      } else done();
    };
  }).catch(function(err){
    pre.textContent='Could not load: '+err.message;
    wrap.style.display='';
    btn.textContent='Hide';
  });
}

// Wire the header button (injected by the build as #src-toggle)
function init(){
  function wire(){
    var b=document.getElementById('src-toggle');
    if (!b){ setTimeout(wire, 500); return; }
    b.addEventListener('click', function(){
      var d=ensureDrawer();
      d.classList.toggle('open');
    });
  }
  if (document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', wire);
  } else wire();
}
init();
})();
