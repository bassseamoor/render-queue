import { Mp4Muxer } from './mp4-muxer.js';

/* ============================================================
   RENDER MODE — headless deterministic video render.
   URL: ?render=1&seed=SEED&fps=30&seconds=300&qid=ID&w=1280&h=720
   core/clock.js honors window.__renderMode:
   fixed dt = 1/fps, time = frame/fps.
   Encoding: WebCodecs VideoEncoder (H.264) + vendored mp4-muxer.
   Same seed + same settings = identical video, every time.
   ============================================================ */
export function startRenderMode() {
  'use strict';
  var qs = new URLSearchParams(location.search);
  if (qs.get('render') !== '1') return;

  var fps = Math.min(120, Math.max(1, parseInt(qs.get('fps'), 10) || 30));
  var seconds = Math.min(3600, Math.max(5, parseInt(qs.get('seconds'), 10) || 300));
  var _wu = parseInt(qs.get('warmup'), 10);
  var warmupFrames = (isNaN(_wu) || _wu < 0) ? 90 : Math.min(_wu, 600);
  var totalFrames = fps * seconds;
  var seed = qs.get('seed') || '';
  var qid = qs.get('qid') || '';
  var W = parseInt(qs.get('w'), 10) || 1280;
  var H = parseInt(qs.get('h'), 10) || 720;
  var studioLabel = ((document.title || 'Studio').split('\u2014')[0] || 'Studio').trim();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDur(s) { s = +s; return s >= 60 ? (s / 60) + ' min' : s + ' sec'; }
  function fmtTime(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }

  /* ---- shared state read by the studio's frame loop ---- */
  var RM = window.__renderMode = {
    fps: fps, W: W, H: H,
    frame: 0, warmup: warmupFrames, totalFrames: totalFrames,
    phase: 'warmup', paused: false, _bp: false,
    onPhase: null, onFrame: null
  };

  /* ---- take over the page ----
     Generic: works no matter what the studio names its canvas or how deep
     it sits in the DOM. The canvas's ancestor chain is kept visible so the
     small live preview survives; everything else is hidden for speed. */
  var css = document.createElement('style');
  css.textContent =
    'body.rendering>*:not(#rmOverlay):not(script):not(style):not([data-rm-keep]){display:none!important;}' +
    'body.rendering #rmOverlay{display:flex!important;}';
  document.head.appendChild(css);
  document.body.classList.add('rendering');
  try {
    var _rc = window.__renderCanvas || document.querySelector('canvas');
    if (_rc) {
      var _n = _rc;
      while (_n && _n !== document.body) { _n.setAttribute('data-rm-keep', '1'); _n = _n.parentElement; }
      _rc.style.setProperty('display', 'block', 'important');
      _rc.style.setProperty('position', 'fixed', 'important');
      _rc.style.setProperty('right', '12px', 'important');
      _rc.style.setProperty('top', '12px', 'important');
      _rc.style.setProperty('width', '168px', 'important');
      _rc.style.setProperty('height', '94px', 'important');
      _rc.style.setProperty('z-index', '60', 'important');
      _rc.style.setProperty('border-radius', '10px', 'important');
      _rc.style.setProperty('border', '1px solid rgba(255,255,255,.25)', 'important');
    }
  } catch (e) {}

  var overlay = document.createElement('div');
  overlay.id = 'rmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;background:#0b0e14;color:#e8ecf4;' +
    'font-family:-apple-system,system-ui,sans-serif;padding:24px;text-align:center;';
  overlay.innerHTML =
    '<div style="font-size:15px;color:#8b95ab;margin-bottom:6px">\uD83C\uDFAC Rendering</div>' +
    '<div style="font-size:22px;font-weight:800;margin-bottom:4px">' + esc(studioLabel) + '</div>' +
    '<div style="font-size:13px;color:#8b95ab;margin-bottom:18px;font-family:ui-monospace,monospace">seed ' + esc(seed) + ' \u00B7 ' + W + '\u00D7' + H + ' \u00B7 ' + fps + 'fps \u00B7 ' + fmtDur(seconds) + '</div>' +
    '<div style="width:min(320px,80vw);height:10px;background:#1a2236;border-radius:99px;overflow:hidden;margin-bottom:10px">' +
    '<div id="rmBar" style="height:100%;width:0%;background:#2f7bff;border-radius:99px;transition:width .3s"></div></div>' +
    '<div id="rmStatus" style="font-size:14px;color:#c6cfe4;margin-bottom:4px">Preparing\u2026</div>' +
    '<div id="rmEta" style="font-size:12px;color:#8b95ab;margin-bottom:22px"></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="rmPause" style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 22px;background:#1a2236;color:#fff">\u23F8 Pause</button>' +
    '<button id="rmCancel" style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 22px;background:#3a1d1d;color:#ff9c9c">\u2715 Cancel</button>' +
    '</div>' +
    '<div style="font-size:12px;color:#5b6b8c;margin-top:18px;max-width:300px;line-height:1.6">Keep this tab open while rendering.<br>You can pause anytime \u2014 but closing this tab loses the render.</div>';
  document.body.appendChild(overlay);

  function setStatus(s) { var el = document.getElementById('rmStatus'); if (el) el.textContent = s; }
  function fail(msg) {
    RM.phase = 'cancelled'; RM.onFrame = null;
    try { if (encoder) encoder.close(); } catch (e) {}
    setStatus('\u26A0\uFE0F ' + msg);
    var b = document.getElementById('rmEta');
    if (b) b.textContent = 'Nothing was rendered.';
  }

  /* ---- encoder ---- */
  var encoder = null, muxer = null, encodedFrames = 0, t0 = 0;
  /* Counters that prove the iOS path actually produced media. A finished
     render with zero muxed chunks is a 581-byte empty shell, not a video. */
  var framesAttempted = 0, encodeErrors = 0, muxedChunks = 0;

  /* If the device encoder rejects frames, say so fast and plainly instead of
     spending the whole render on output that can only come out empty. */
  function noteEncodeError() {
    encodeErrors++;
    if (encodeErrors >= 20 && muxedChunks === 0 && RM.phase === 'record') {
      fail('This device\u2019s video encoder rejected ' + encodeErrors +
        ' frames and recorded nothing, so the video can\u2019t be made here. ' +
        'Try a lower resolution, or close and reopen Safari and try again.');
    }
  }
  var rcanvas = window.__renderCanvas || document.querySelector('canvas');

  /* ---- iOS-safe frame source ----
     Never hand the encoder a VideoFrame taken straight from the studio's
     WebGL canvas: on iOS Safari the hardware H.264 encoder silently drops
     those frames (no error, zero output chunks — the classic 581-byte empty
     MP4). Copying through a plain 2D canvas first works everywhere. */
  var frame2d = null, fctx = null;
  function ensureFrame2d() {
    if (frame2d && frame2d.width === W && frame2d.height === H && fctx) return true;
    try {
      frame2d = document.createElement('canvas');
      frame2d.width = W; frame2d.height = H;
      fctx = frame2d.getContext('2d');
      return !!fctx;
    } catch (e) { frame2d = null; fctx = null; return false; }
  }

  /* Shared "empty video" message: 60+ frames drained through the encoder,
     zero chunks came out. Used both mid-render (fail fast) and at finish. */
  function failEmpty() {
    fail('The video came out empty \u2014 ' + framesAttempted + ' frames went in, but this device\u2019s encoder recorded 0 of them' +
      (encodeErrors ? ' (' + encodeErrors + ' were rejected).' : '.') +
      ' Please try again; if it keeps happening, use a lower resolution.');
  }
  var _avcDc = null;
  function withAvcDecoderConfig(chunk, meta) {
    meta = meta || {};
    if (meta.decoderConfig) { _avcDc = meta.decoderConfig; return meta; }
    if (_avcDc) return { decoderConfig: _avcDc };
    var dc = null;
    try {
      if (chunk && chunk.type === 'key' && chunk.byteLength > 0) {
        var buf = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buf);
        dc = avcDcFromNalUnits(buf);
      }
    } catch (e) { dc = null; }
    if (dc) { _avcDc = dc; return { decoderConfig: dc }; }
    return meta;
  }
  function avcDcFromNalUnits(buf) {
    var nals = [], i, j, k, m, p, len, sc, scLen, end, t;
    var annexB = buf.length > 4 && buf[0] === 0 && buf[1] === 0 &&
      (buf[2] === 1 || (buf[2] === 0 && buf[3] === 1));
    if (annexB) {
      i = 0;
      while (i + 3 < buf.length) {
        sc = -1; scLen = 0;
        for (j = i; j + 3 < buf.length; j++) {
          if (buf[j] === 0 && buf[j + 1] === 0 && buf[j + 2] === 1) { sc = j; scLen = 3; break; }
          if (buf[j] === 0 && buf[j + 1] === 0 && buf[j + 2] === 0 && buf[j + 3] === 1) { sc = j; scLen = 4; break; }
        }
        if (sc < 0) break;
        end = buf.length;
        for (m = sc + scLen; m + 3 < buf.length; m++) {
          if (buf[m] === 0 && buf[m + 1] === 0 &&
            (buf[m + 2] === 1 || (buf[m + 2] === 0 && buf[m + 3] === 1))) { end = m; break; }
        }
        if (sc + scLen < end) nals.push(buf.subarray(sc + scLen, end));
        i = end;
      }
    } else {
      p = 0;
      while (p + 4 <= buf.length) {
        len = (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3];
        if (len <= 0 || p + 4 + len > buf.length) break;
        nals.push(buf.subarray(p + 4, p + 4 + len));
        p += 4 + len;
      }
    }
    var sps = null, pps = null;
    for (k = 0; k < nals.length; k++) {
      t = nals[k][0] & 31;
      if (t === 7 && !sps) sps = nals[k];
      else if (t === 8 && !pps) pps = nals[k];
      if (sps && pps) break;
    }
    if (!sps || !pps || sps.length < 4) return null;
    var avcC = new Uint8Array(11 + sps.length + pps.length);
    avcC[0] = 1; avcC[1] = sps[1]; avcC[2] = sps[2]; avcC[3] = sps[3];
    avcC[4] = 0xFF; avcC[5] = 0xE1;
    avcC[6] = (sps.length >> 8) & 255; avcC[7] = sps.length & 255;
    avcC.set(sps, 8);
    var o = 8 + sps.length;
    avcC[o] = 1; avcC[o + 1] = (pps.length >> 8) & 255; avcC[o + 2] = pps.length & 255;
    avcC.set(pps, o + 3);
    function hx(b) { return ('0' + b.toString(16)).slice(-2); }
    return { codec: 'avc1.' + hx(sps[1]) + hx(sps[2]) + hx(sps[3]), description: avcC };
  }

  RM.onPhase = function (phase) {
    if (phase === 'reset') doReset();
    else if (phase === 'done') finishRender();
  };

  function doReset() {
    RM.phase = 'reset';
    try { if (typeof window.__renderReset === 'function') window.__renderReset(); } catch (e) {}
    RM.frame = 0;
    if (!setupEncoder()) return;
    RM.phase = 'record';
    t0 = performance.now();
    setStatus('Rendering\u2026');
  }

  function setupEncoder() {
    if (typeof VideoEncoder === 'undefined') {
      fail('This browser can\u2019t do headless rendering (needs WebCodecs). Try Safari on iOS 17.4+.');
      return false;
    }
    if (typeof Mp4Muxer === 'undefined') { fail('Video muxer failed to load.'); return false; }
    try {
      muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
      });
      encoder = new VideoEncoder({
        output: function (chunk, meta) {
          try { muxer.addVideoChunk(chunk, withAvcDecoderConfig(chunk, meta)); muxedChunks++; } catch (e) {}
          if (RM._bp && encoder.encodeQueueSize < 20) RM._bp = false;
        },
        error: function (e) { fail('Encoder error: ' + (e && e.message)); }
      });
      /* Note: iOS Safari's isConfigSupported can falsely report H.264 as
         unsupported, so we skip the check and just configure. */
      encoder.configure({
        codec: 'avc1.640028', width: W, height: H,
        bitrate: Math.min(40000000, Math.round(12000000 * (W * H) / (1280 * 720))),
        framerate: fps
      });
      ensureFrame2d();
      RM.onFrame = encodeFrame;
      return true;
    } catch (e) {
      fail('Couldn\u2019t start the encoder: ' + e.message);
      return false;
    }
  }

  function encodeFrame(idx) {
    if (!encoder || RM.phase !== 'record' || !rcanvas) return;
    if (encoder.encodeQueueSize > 90) { RM._bp = true; return; }
    var src = rcanvas;
    if (fctx && frame2d) {
      try { fctx.drawImage(rcanvas, 0, 0, W, H); src = frame2d; }
      catch (e) { noteEncodeError(); return; }
    }
    var vf = null;
    try { vf = new VideoFrame(src, { timestamp: Math.round(idx * 1e6 / fps), alpha: 'discard' }); }
    catch (e) { noteEncodeError(); return; }
    framesAttempted++;
    try { encoder.encode(vf, { keyFrame: idx % (fps * 5) === 0 }); }
    catch (e) { noteEncodeError(); }
    try { vf.close(); } catch (e) {}
    encodedFrames = idx + 1;
    /* Fail fast on a silently stalled encoder: 60 frames fully drained,
       nothing recorded. Saves the user sitting through a doomed render. */
    if (framesAttempted >= 60 && muxedChunks === 0 && encoder.encodeQueueSize === 0) {
      failEmpty();
      return;
    }
    if ((idx & 15) === 0) updateProgress();
  }

  function updateProgress() {
    var pct = Math.min(100, (encodedFrames / totalFrames) * 100);
    var bar = document.getElementById('rmBar');
    if (bar) bar.style.width = pct.toFixed(1) + '%';
    var el = (performance.now() - t0) / 1000;
    var rate = encodedFrames / Math.max(el, 0.1);
    var remain = rate > 0.01 ? (totalFrames - encodedFrames) / rate : 0;
    setStatus('Frame ' + encodedFrames.toLocaleString() + ' / ' + totalFrames.toLocaleString() + ' (' + pct.toFixed(0) + '%)');
    var eta = document.getElementById('rmEta');
    if (eta) eta.textContent = '\u2248 ' + fmtTime(remain) + ' left \u00B7 ' + rate.toFixed(1) + ' fps wall \u00B7 ' + muxedChunks + ' chunks \u00B7 q' + encoder.encodeQueueSize;
  }

  async function finishRender() {
    RM.phase = 'done'; RM.onFrame = null;
    updateProgress();
    setStatus('Finishing video\u2026');
    try {
      if (encoder) await encoder.flush();
      if (muxer) muxer.finalize();
    } catch (e) { fail('Couldn\u2019t finish the video: ' + e.message); return; }
    var buf = muxer.target.buffer;
    if (!buf || !buf.byteLength) { fail('The video came out empty.'); return; }
    if (muxedChunks === 0) { failEmpty(); return; }
    try { window.__renderResult = buf; } catch (e) {} /* lets automated tests grab the MP4 */
    var blob = new Blob([buf], { type: 'video/mp4' });
    var cleanSeed = seed.replace(/[^A-Za-z0-9]+/g, '').slice(0, 14) || 'seed';
    var name = studioLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
      '-' + cleanSeed + '-' + seconds + 's.mp4';
    showDone(blob, name);
    markQueueDone();
  }

  function showDone(blob, name) {
    var url = URL.createObjectURL(blob);
    var mb = (blob.size / 1048576).toFixed(1);
    overlay.innerHTML =
      '<div style="font-size:44px;margin-bottom:10px">\u2705</div>' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:6px">Your video is ready</div>' +
      '<div style="font-size:13px;color:#8b95ab;margin-bottom:20px;font-family:ui-monospace,monospace">' + esc(name) + ' \u00B7 ' + mb + ' MB</div>' +
      '<button id="rmShare" style="font-size:17px;font-weight:800;border:0;border-radius:14px;padding:16px 30px;background:#2f7bff;color:#fff;margin-bottom:12px">Share video</button>' +
      '<div style="font-size:12px;color:#8b95ab;max-width:300px;line-height:1.6">Share \u2192 Save to Files \u2192 your SSD.<br>Or use the download link below.</div>' +
      '<a id="rmDl" href="' + url + '" download="' + esc(name) + '" style="margin-top:14px;color:#9cc3ff;font-size:14px">Download instead</a>';
    document.getElementById('rmShare').onclick = function () {
      var file = new File([blob], name, { type: 'video/mp4' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: name }).catch(function () {});
      } else {
        document.getElementById('rmDl').click();
      }
    };
  }

  async function markQueueDone() {
    var token = null;
    try { token = localStorage.getItem('rq_token'); } catch (e) {}
    if (!token || !qid) return;
    try {
      var api = 'https://api.github.com/repos/bassseamoor/render-queue/contents/queue.json';
      var h = { Authorization: 'Bearer ' + token };
      var r = await fetch(api, { headers: h });
      if (!r.ok) return;
      var j = await r.json();
      var data = JSON.parse(atob(j.content));
      var it = (data.items || []).find(function (x) { return x.id === qid; });
      if (!it) return;
      it.status = 'done';
      await fetch(api, {
        method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, h),
        body: JSON.stringify({
          message: 'Mark render done', sha: j.sha,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
        })
      });
    } catch (e) {}
  }

  document.getElementById('rmPause').onclick = function () {
    if (RM.phase !== 'record' && RM.phase !== 'warmup') return;
    RM.paused = !RM.paused;
    this.textContent = RM.paused ? '\u25B6 Resume' : '\u23F8 Pause';
    setStatus(RM.paused ? 'Paused \u2014 nothing is lost.' : (RM.phase === 'record' ? 'Rendering\u2026' : 'Preparing\u2026'));
  };
  document.getElementById('rmCancel').onclick = function () {
    RM.phase = 'cancelled'; RM.onFrame = null;
    try { if (encoder) encoder.close(); } catch (e) {}
    overlay.innerHTML =
      '<div style="font-size:20px;font-weight:800;margin-bottom:8px">Cancelled</div>' +
      '<div style="font-size:13px;color:#8b95ab;margin-bottom:18px">No video was saved.</div>' +
      '<button id="rmBack" ' +
      'style="font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 24px;background:#1a2236;color:#fff">Back to queue</button>';
    /* Was: inline onclick with curly quotes around the URL — a JS syntax
       error, so tapping the button silently did nothing. */
    document.getElementById('rmBack').onclick = function () {
      location.href = 'https://bassseamoor.github.io/render-queue/';
    };
  };

  /* ---- force render-size drawing buffer, keep screen awake ----
     Set the buffer directly (reliable) and also try the studio's own
     resize path if it exposes one (it may reallocate its targets). */
  try {
    if (rcanvas) { rcanvas.width = W; rcanvas.height = H; }
    if (typeof loop !== 'undefined' && loop && loop.resize) { try { loop.resize(); } catch (e) {} }
  } catch (e) {}
  try {
    if (navigator.wakeLock) {
      var keepAwake = function () { navigator.wakeLock.request('screen').catch(function () {}); };
      keepAwake();
      document.addEventListener('visibilitychange', function () { if (!document.hidden) keepAwake(); });
    }
  } catch (e) {}
  setStatus('Preparing\u2026 (warming up)');
}
