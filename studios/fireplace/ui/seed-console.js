// Fireplace Studio — ui/seed-console.js. See README.md for ownership and replacement boundaries.


const SeedConsole = (()=>{


/* Seed Console v2 — one consistent generation console for all ambient studios.
 * v2 adds: a PNG/JPEG thumbnail snapshot is captured from the render canvas
 * whenever a seed is favorited (stored as f.thumb), so pickers elsewhere
 * (e.g. the Render Queue) can show visual favorite cards.
 * USAGE: import SeedConsole, then call SeedConsole.init(adapter).
 *
 * ADAPTER INTERFACE (per studio — the studio author writes this):
 * {
 *   studio:   'molten',            // short id, used for localStorage keys
 *   title:    'Molten',            // display name
 *   getSeed:  () => string,        // current seed as a string
 *   setSeed:  (s) => void|Promise, // rebuild the scene from seed string s
 *   randomSeed: () => string,      // cryptographically random new seed string
 *   remixSeed:  (s) => string,     // quasi-random: derive a "sibling" seed from s
 *   params: [                      // hero parameters for Customize (6-10)
 *     { key, label, min, max, step, get:()=>number, set:(v)=>void }
 *   ],
 *   canvas:   () => HTMLCanvasElement|null,  // main render canvas for recording
 *   fileBase: (seedStr) => string, // filename base for recordings (no extension)
 * }
 * The console calls setSeed on load (with ?seed= override or a random seed).
 */

  'use strict';
  var CSS = [
    '.sc-pill{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:2147483000;',
    'display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;',
    'background:rgba(12,14,18,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
    'border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 30px rgba(0,0,0,.45);',
    'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;color:#e8eaed;',
    'font-size:13px;user-select:none;-webkit-user-select:none;max-width:calc(100vw - 20px)}',
    '.sc-pill.hidden{display:none}',
    '.sc-seed{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.07);',
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;cursor:pointer;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38vw}',
    '.sc-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e8eaed;',
    'border-radius:999px;min-width:44px;min-height:44px;padding:0 12px;font-size:16px;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center}',
    '.sc-btn:active{background:rgba(255,255,255,.18)}',
    '.sc-btn.on{background:rgba(120,200,255,.25);border-color:rgba(120,200,255,.6)}',
    '.sc-btn.rec.on{background:rgba(255,80,80,.35);border-color:rgba(255,80,80,.7)}',
    '.sc-panel{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:2147483000;',
    'width:min(430px,calc(100vw - 24px));max-height:62vh;overflow-y:auto;border-radius:18px;',
    'background:rgba(10,12,16,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);',
    'border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 60px rgba(0,0,0,.55);',
    'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;color:#e8eaed;',
    'padding:14px 14px 16px;font-size:14px}',
    '.sc-panel.hidden{display:none}',
    '.sc-row{display:flex;align-items:center;gap:8px;margin:8px 0}',
    '.sc-seedinput{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);',
    'border-radius:10px;color:#e8eaed;padding:10px;font-family:ui-monospace,Menlo,monospace;font-size:13px;min-width:0}',
    '.sc-sec{margin:12px 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9aa0a6}',
    '.sc-list{display:flex;flex-direction:column;gap:6px;max-height:130px;overflow-y:auto}',
    '.sc-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;',
    'background:rgba(255,255,255,.05);cursor:pointer;font-family:ui-monospace,Menlo,monospace;font-size:12px}',
    '.sc-item:active{background:rgba(255,255,255,.12)}',
    '.sc-item .grow{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.sc-item .meta{color:#9aa0a6;font-size:11px}',
    '.sc-thumb{width:54px;height:31px;object-fit:cover;border-radius:6px;background:#1a1f2b;flex:none}',
    '.sc-param{margin:10px 0}',
    '.sc-param .top{display:flex;align-items:center;gap:8px;margin-bottom:4px}',
    '.sc-param label{flex:1;font-size:13px}',
    '.sc-param .val{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#9aa0a6;min-width:44px;text-align:right}',
    '.sc-param input[type=range]{width:100%;accent-color:#7cc4ff}',
    '.sc-lock{border:1px solid rgba(255,255,255,.16);background:transparent;border-radius:8px;',
    'min-width:36px;min-height:36px;font-size:14px;cursor:pointer;color:#9aa0a6}',
    '.sc-lock.on{color:#ffd76a;border-color:rgba(255,215,106,.6);background:rgba(255,215,106,.12)}',
    '.sc-durs{display:flex;gap:6px;flex-wrap:wrap}',
    '.sc-dur{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e8eaed;',
    'border-radius:10px;padding:10px 12px;font-size:13px;cursor:pointer}',
    '.sc-dur.on{background:rgba(120,200,255,.25);border-color:rgba(120,200,255,.6)}',
    '.sc-status{font-size:12px;color:#9aa0a6;margin-top:8px;min-height:18px}',
    '.sc-status.rec{color:#ff8a80}',
    '.sc-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:76px;z-index:2147483001;',
    'background:rgba(20,22,28,.92);color:#e8eaed;border:1px solid rgba(255,255,255,.16);',
    'border-radius:12px;padding:10px 16px;font-size:13px;font-family:system-ui,sans-serif;',
    'opacity:0;transition:opacity .25s;pointer-events:none}',
    '.sc-toast.show{opacity:1}',
    '.sc-dot{position:fixed;right:10px;bottom:10px;width:14px;height:14px;border-radius:50%;',
    'background:rgba(255,255,255,.25);z-index:2147483000;cursor:pointer}',
    '.sc-dot.hidden{display:none}',
    '.sc-link{color:#7cc4ff;font-size:13px;text-decoration:underline;cursor:pointer;word-break:break-all}'
  ].join('\n');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function store(k) {
    return {
      get: function (dflt) {
        try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; }
        catch (e) { return dflt; }
      },
      set: function (v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SeedConsole = {
    init: function (A) {
      if (!A || typeof A.setSeed !== 'function' || typeof A.getSeed !== 'function') {
        console.error('[SeedConsole] invalid adapter'); return;
      }
      this.A = A;
      this.hist = store('sc.' + A.studio + '.history');
      this.favs = store('sc.' + A.studio + '.favs');
      this.locks = store('sc.' + A.studio + '.locks');
      this.recState = { rec: null, chunks: [], timer: null, t0: 0, dur: 0, mime: '' };
      this.buildUI();
      this.refreshParams();
      var q = null;
      try { q = new URLSearchParams(location.search).get('seed'); } catch (e) {}
      var start = (q && q.trim()) ? q.trim() : A.randomSeed();
      this.applySeed(start, { silent: true });
      // H key or double-tap toggles full chrome hide (clean recordings)
      var self = this;
      document.addEventListener('keydown', function (e) {
        if ((e.key === 'h' || e.key === 'H') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))
          self.toggleChrome();
      });
      var lastTap = 0;
      document.addEventListener('touchend', function () {
        var now = Date.now();
        if (now - lastTap < 300) self.toggleChrome();
        lastTap = now;
      }, { passive: true });
    },

    buildUI: function () {
      var self = this, A = this.A;
      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);

      // pill
      var pill = el('div', 'sc-pill');
      var seedChip = el('div', 'sc-seed', esc(A.getSeed() || '…'));
      seedChip.title = 'Tap to copy seed';
      seedChip.addEventListener('click', function () {
        var s = A.getSeed();
        function done() { self.toast('Seed copied: ' + s); }
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard.writeText(s).then(done, done);
        else done();
      });
      function btn(txt, title, fn, cls) {
        var b = el('button', 'sc-btn' + (cls ? ' ' + cls : ''), txt);
        b.title = title; b.setAttribute('aria-label', title);
        b.addEventListener('click', function (ev) { ev.stopPropagation(); fn(b); });
        return b;
      }
      this.bRandom = btn('🎲', 'Random — brand new world', function () { self.doRandom(); });
      this.bRemix = btn('🌀', 'Remix — same vibe, new details (respects locks)', function () { self.doRemix(); });
      this.bFav = btn('☆', 'Save this seed to favorites', function (b) { self.toggleFav(b); });
      this.bRec = btn('●', 'Record video', function () { self.togglePanelSection('rec'); }, 'rec');
      this.bMore = btn('⚙️', 'Customize: seed, parameters, history', function () { self.togglePanel(); });
      pill.appendChild(seedChip);
      pill.appendChild(this.bRandom); pill.appendChild(this.bRemix);
      pill.appendChild(this.bFav); pill.appendChild(this.bRec); pill.appendChild(this.bMore);
      document.body.appendChild(pill);
      this.pill = pill; this.seedChip = seedChip;

      // dot (restores chrome when hidden)
      var dot = el('div', 'sc-dot hidden');
      dot.title = 'Show controls';
      dot.addEventListener('click', function () { self.toggleChrome(); });
      document.body.appendChild(dot);
      this.dot = dot;

      // panel
      var p = el('div', 'sc-panel hidden');
      p.innerHTML =
        '<div class="sc-row"><input class="sc-seedinput" id="sc-seedfield" spellcheck="false">' +
        '<button class="sc-btn" id="sc-apply" style="font-size:13px">Apply</button></div>' +
        '<div class="sc-sec">Parameters (🔒 = kept on Remix)</div><div id="sc-params"></div>' +
        '<div class="sc-sec">Record video</div><div class="sc-durs" id="sc-durs"></div>' +
        '<div class="sc-row"><button class="sc-btn" id="sc-recbtn" style="font-size:13px">● Start recording</button>' +
        '<button class="sc-btn" id="sc-hideui" style="font-size:13px">Hide UI</button></div>' +
        '<div class="sc-status" id="sc-status"></div><div id="sc-dl"></div>' +
        '<div class="sc-sec">⭐ Favorites</div><div class="sc-list" id="sc-favs"></div>' +
        '<div class="sc-sec">🕘 Recent seeds</div><div class="sc-list" id="sc-hist"></div>';
      document.body.appendChild(p);
      this.panel = p;
      var self2 = this;
      p.querySelector('#sc-apply').addEventListener('click', function () {
        var v = p.querySelector('#sc-seedfield').value.trim();
        if (v) self2.applySeed(v);
      });
      p.querySelector('#sc-hideui').addEventListener('click', function () { self2.toggleChrome(); });
      p.querySelector('#sc-recbtn').addEventListener('click', function () { self2.toggleRecord(); });
      var durs = [['30s', 30], ['5 min', 300], ['30 min', 1800], ['∞ until stopped', 0]];
      var dz = p.querySelector('#sc-durs');
      this.durBtns = [];
      durs.forEach(function (d, i) {
        var b = el('button', 'sc-dur' + (i === 3 ? ' on' : ''), d[0]);
        b.addEventListener('click', function () {
          self2.recState.dur = d[1];
          self2.durBtns.forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
        });
        dz.appendChild(b); self2.durBtns.push(b);
      });
      this.recState.dur = 0;

      // toast
      var t = el('div', 'sc-toast');
      document.body.appendChild(t);
      this.toastEl = t;

      this.renderHist(); this.renderFavs(); this.updateFavBtn();
    },

    toast: function (msg) {
      var t = this.toastEl, self = this;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(function () { t.classList.remove('show'); }, 2200);
    },

    togglePanel: function () { this.panel.classList.toggle('hidden'); },
    togglePanelSection: function () {
      if (this.panel.classList.contains('hidden')) this.panel.classList.remove('hidden');
      this.panel.scrollTop = this.panel.querySelector('.sc-sec').offsetTop - 60;
    },
    toggleChrome: function () {
      var hidden = this.pill.classList.toggle('hidden');
      this.panel.classList.add('hidden');
      this.dot.classList.toggle('hidden', !hidden);
    },

    applySeed: function (s, opts) {
      var self = this;
      opts = opts || {};
      function done() {
        self.seedChip.textContent = s;
        var f = self.panel.querySelector('#sc-seedfield');
        if (f) f.value = s;
        // re-apply locked params after regen so Remix/customize locks hold
        self.applyLocks();
        self.refreshParams();
        if (!opts.silent) self.toast('Seed: ' + s);
        var h = self.hist.get([]);
        h = [s].concat(h.filter(function (x) { return x !== s; })).slice(0, 30);
        self.hist.set(h);
        self.renderHist(); self.updateFavBtn();
      }
      try {
        var r = this.A.setSeed(s);
        if (r && typeof r.then === 'function') r.then(done, function (e) {
          console.error(e); self.toast('Could not apply seed');
        });
        else done();
      } catch (e) { console.error(e); this.toast('Could not apply seed'); }
    },

    doRandom: function () { this.applySeed(this.A.randomSeed()); },
    doRemix: function () { this.applySeed(this.A.remixSeed(this.A.getSeed())); },

    applyLocks: function () {
      var locks = this.locks.get({});
      var self = this;
      (this.A.params || []).forEach(function (p) {
        if (locks[p.key] && self._lockedVals && self._lockedVals[p.key] != null) {
          try { p.set(self._lockedVals[p.key]); } catch (e) {}
        }
      });
    },
    snapshotLocks: function () {
      var locks = this.locks.get({}), vals = {};
      (this.A.params || []).forEach(function (p) {
        if (locks[p.key]) { try { vals[p.key] = p.get(); } catch (e) {} }
      });
      this._lockedVals = vals;
    },

    refreshParams: function () {
      var self = this, A = this.A;
      var box = this.panel.querySelector('#sc-params');
      box.innerHTML = '';
      var locks = this.locks.get({});
      (A.params || []).forEach(function (p) {
        var wrap = el('div', 'sc-param');
        var top = el('div', 'top');
        var lab = el('label', '', esc(p.label));
        var val = el('span', 'val', '');
        var lock = el('button', 'sc-lock' + (locks[p.key] ? ' on' : ''), locks[p.key] ? '🔒' : '🔓');
        lock.title = 'Lock: kept on Remix';
        var cur = null;
        try { cur = p.get(); } catch (e) {}
        function fmt(v) { return (typeof v === 'number' && Math.abs(v) < 10 && p.step < 1) ? v.toFixed(2) : String(v); }
        val.textContent = fmt(cur);
        var slider = document.createElement('input');
        slider.type = 'range'; slider.min = p.min; slider.max = p.max; slider.step = p.step;
        if (cur != null) slider.value = cur;
        slider.addEventListener('input', function () {
          var v = parseFloat(slider.value);
          try { p.set(v); } catch (e) {}
          val.textContent = fmt(v);
          if (locks[p.key]) { self.snapshotLocks(); }
        });
        slider.addEventListener('change', function () { self.snapshotLocks(); });
        lock.addEventListener('click', function () {
          var L = self.locks.get({});
          L[p.key] = !L[p.key];
          self.locks.set(L);
          lock.classList.toggle('on', !!L[p.key]);
          lock.textContent = L[p.key] ? '🔒' : '🔓';
          self.snapshotLocks();
          self.toast(L[p.key] ? p.label + ' locked for Remix' : p.label + ' unlocked');
        });
        top.appendChild(lab); top.appendChild(val); top.appendChild(lock);
        wrap.appendChild(top); wrap.appendChild(slider);
        box.appendChild(wrap);
      });
      this.snapshotLocks();
    },

    toggleFav: function (b) {
      var self = this;
      var s = this.A.getSeed();
      var favs = this.favs.get([]);
      var i = favs.findIndex(function (f) { return f.seed === s; });
      if (i !== -1) {
        favs.splice(i, 1);
        this.favs.set(favs.slice(0, 100));
        this.renderFavs(); this.updateFavBtn();
        this.toast('Removed from favorites');
        return;
      }
      var snap = {};
      try {
        (this.A.params || []).forEach(function (p) { snap[p.key] = p.get(); });
      } catch (e) {}
      // Capture a small thumbnail on the next painted frame so WebGL
      // drawing buffers are fresh, then save the favorite with it.
      function save(thumb) {
        var entry = { seed: s, params: snap, ts: Date.now() };
        if (thumb) entry.thumb = thumb;
        var list = self.favs.get([]);
        list.unshift(entry);
        list = list.slice(0, 100);
        try {
          self.favs.set(list);
        } catch (e) {
          // localStorage full (thumbs are the bulk): strip thumbs, retry once
          try {
            list.forEach(function (f) { delete f.thumb; });
            self.favs.set(list);
          } catch (e2) {}
        }
        self.renderFavs(); self.updateFavBtn();
        self.toast('⭐ Saved to favorites');
      }
      try {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { save(self.captureThumb()); });
        });
      } catch (e) { save(null); }
    },
    captureThumb: function () {
      // Small 240px-wide JPEG snapshot of the current render for favorite cards.
      var canvas = null;
      try { canvas = this.A.canvas(); } catch (e) {}
      if (!canvas || !canvas.width) return null;
      try {
        var w = 240, h = Math.max(1, Math.round(w * canvas.height / canvas.width));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(canvas, 0, 0, w, h);
        var url = c.toDataURL('image/jpeg', 0.72);
        // sanity: reject empty/degenerate captures
        if (!url || url.length < 2000) return null;
        return url;
      } catch (e) { return null; }
    },
    updateFavBtn: function () {
      var s = this.A.getSeed();
      var favs = this.favs.get([]);
      var on = favs.some(function (f) { return f.seed === s; });
      this.bFav.textContent = on ? '★' : '☆';
      this.bFav.classList.toggle('on', on);
    },
    renderFavs: function () {
      var self = this, box = this.panel.querySelector('#sc-favs');
      box.innerHTML = '';
      var favs = this.favs.get([]);
      if (!favs.length) box.innerHTML = '<div class="meta" style="color:#9aa0a6;font-size:12px">Nothing saved yet — tap ☆ on a seed you love.</div>';
      favs.forEach(function (f) {
        var it = el('div', 'sc-item');
        var img = f.thumb
          ? '<img class="sc-thumb" src="' + f.thumb + '" alt="">'
          : '<span class="sc-thumb" style="display:flex;align-items:center;justify-content:center;color:#5a6378;font-size:14px">⭐</span>';
        it.innerHTML = img + '<span class="grow">' + esc(f.seed) + '</span><span class="meta">' +
          new Date(f.ts).toLocaleDateString() + '</span>';
        it.addEventListener('click', function () {
          self.applySeed(f.seed);
          if (f.params) {
            setTimeout(function () {
              (self.A.params || []).forEach(function (p) {
                if (f.params[p.key] != null) { try { p.set(f.params[p.key]); } catch (e) {} }
              });
              self.refreshParams();
            }, 50);
          }
          self.toast('Loaded favorite: ' + f.seed);
        });
        box.appendChild(it);
      });
    },
    renderHist: function () {
      var self = this, box = this.panel.querySelector('#sc-hist');
      box.innerHTML = '';
      var h = this.hist.get([]);
      if (!h.length) box.innerHTML = '<div style="color:#9aa0a6;font-size:12px">Your recent seeds will appear here.</div>';
      h.forEach(function (s) {
        var it = el('div', 'sc-item');
        it.innerHTML = '<span class="grow">' + esc(s) + '</span>';
        it.addEventListener('click', function () { self.applySeed(s); });
        box.appendChild(it);
      });
    },

    // ---- recording ----
    bestMime: function () {
      if (!window.MediaRecorder) return '';
      var cands = ['video/mp4', 'video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9', 'video/webm'];
      for (var i = 0; i < cands.length; i++) {
        try { if (MediaRecorder.isTypeSupported(cands[i])) return cands[i]; } catch (e) {}
      }
      return '';
    },
    toggleRecord: function () {
      if (this.recState.rec) this.stopRecord();
      else this.startRecord();
    },
    startRecord: function () {
      var self = this;
      var canvas = null;
      try { canvas = this.A.canvas(); } catch (e) {}
      if (!canvas || !canvas.captureStream) { this.setStatus('Recording not supported on this canvas.'); return; }
      var mime = this.bestMime();
      if (!mime) { this.setStatus('No supported recording format in this browser.'); return; }
      this.recState.mime = mime;
      this.recState.chunks = [];
      var stream;
      try { stream = canvas.captureStream(60); } catch (e) { this.setStatus('Could not capture stream.'); return; }
      var rec;
      try {
        rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14000000 });
      } catch (e) { this.setStatus('Recorder failed to start.'); return; }
      rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) self.recState.chunks.push(ev.data); };
      rec.onstop = function () { self.finishRecord(); };
      try { rec.start(4000); } catch (e) { this.setStatus('Recorder failed to start.'); return; }
      this.recState.rec = rec;
      this.recState.t0 = Date.now();
      this.bRec.classList.add('on');
      this.panel.querySelector('#sc-recbtn').textContent = '■ Stop recording';
      this.tickStatus();
      if (this.recState.dur > 0) {
        this.recState.timer = setTimeout(function () { self.stopRecord(); }, this.recState.dur * 1000);
      }
      this.toast('● Recording…');
    },
    tickStatus: function () {
      var self = this;
      if (!this.recState.rec) return;
      var s = Math.floor((Date.now() - this.recState.t0) / 1000);
      var mm = Math.floor(s / 60), ss = ('0' + (s % 60)).slice(-2);
      this.setStatus('● REC ' + mm + ':' + ss + ' — tap Stop when done', true);
      setTimeout(function () { self.tickStatus(); }, 1000);
    },
    stopRecord: function () {
      clearTimeout(this.recState.timer);
      try { this.recState.rec.stop(); } catch (e) {}
      this.setStatus('Finishing…');
    },
    finishRecord: function () {
      var self = this;
      this.recState.rec = null;
      this.bRec.classList.remove('on');
      this.panel.querySelector('#sc-recbtn').textContent = '● Start recording';
      var ext = this.recState.mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
      var blob = new Blob(this.recState.chunks, { type: this.recState.mime.split(';')[0] });
      this.recState.chunks = [];
      var base = 'seedconsole';
      try { base = this.A.fileBase(this.A.getSeed()) || base; } catch (e) {}
      var name = base + '.' + ext;
      var file = null;
      try { file = new File([blob], name, { type: blob.type }); } catch (e) {}
      this.setStatus('Done — ' + (blob.size / 1048576).toFixed(1) + ' MB. Share it to Files → your SSD.');
      var dl = this.panel.querySelector('#sc-dl');
      dl.innerHTML = '';
      function fallbackLink() {
        var url = URL.createObjectURL(blob);
        var a = el('a', 'sc-link', '⬇ Download ' + esc(name));
        a.href = url; a.download = name;
        dl.appendChild(a);
      }
      if (file && navigator.canShare && navigator.share) {
        try {
          if (navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: name }).then(function () {
              self.toast('Shared — pick Save to Files → your SSD');
            }, function () { fallbackLink(); });
            return;
          }
        } catch (e) {}
      }
      fallbackLink();
      this.toast('Recording ready below');
    },
    setStatus: function (msg, rec) {
      var s = this.panel.querySelector('#sc-status');
      s.textContent = msg;
      s.classList.toggle('rec', !!rec);
    }
  };

  

return SeedConsole;
})();

export { SeedConsole };
