// Molten Studio — fixed-step render-mode controller (verbatim from molten.html).
import { Mp4Muxer } from './muxer.js';

/* ============================================================
   RENDER MODE — headless deterministic video render.
   URL: ?render=1&seed=SEED&fps=30&seconds=300&qid=ID&w=1280&h=720
   The studio's rAF loop must honor window.__renderMode (see surgical
   edit in the studio's frame loop): fixed dt = 1/fps, time = frame/fps.
   Encoding: WebCodecs VideoEncoder (H.264) + inlined mp4-muxer.
   Same seed + same settings = identical video, every time.
   ============================================================ */
(function () {
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
    '<button id="rmSound" style="margin-top:12px;font-size:14px;font-weight:700;border:0;border-radius:12px;padding:12px 20px;background:#1a2236;color:#c6cfe4">\uD83D\uDD0A Sound on</button>' +
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
     render with zero muxed chunks is a 581-byte empty shell, not a video.
     rawChunks counts encoder output directly, before the muxer can drop
     anything; muxedChunks counts chunks actually written to the file.
     If the two diverge, the loss is downstream of the encoder. */
  var framesAttempted = 0, encodeErrors = 0, rawChunks = 0, muxedChunks = 0;
  var muxErrors = 0, firstMuxError = '';

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

  /* Shared "empty video" message: frames drained through the encoder,
     nothing (or nothing usable) landed in the file. Names the raw
     encoder count vs the muxed count so the next report is self-
     diagnosing: equal-and-zero means a silent encoder, divergent means
     chunks were lost downstream. */
  function failEmpty() {
    var detail = framesAttempted + ' frames went in, the encoder produced ' + rawChunks +
      ' chunks, but the file kept ' + muxedChunks + ' of them.';
    if (muxErrors) detail += ' File errors: ' + muxErrors + (firstMuxError ? ' (first: ' + firstMuxError + ').' : '.');
    if (encodeErrors) detail += ' The encoder rejected ' + encodeErrors + ' frames.';
    fail('The video came out empty \u2014 ' + detail + ' Please try again; if it keeps happening, use a lower resolution.');
  }

  /* ---- iOS decoderConfig recovery ----
     iOS Safari's WebCodecs encoder can emit chunks whose metadata has no
     decoderConfig. Without it the muxer cannot write the avcC box, and its
     finalize() then crashes reading decoderConfig.colorSpace of null.
     Recover the config from key chunks' SPS/PPS NAL units (H.264 carries
     them inline), retrying on EVERY keyframe — real hardware encoders
     don't all package NALs like the software encoder this was first
     tested against, so both Annex-B and length-prefixed layouts are
     tried before giving up on a keyframe. */
  var _avcDc = null, avcKeyTries = 0;
  function withAvcDecoderConfig(chunk, meta) {
    meta = meta || {};
    if (meta.decoderConfig) { _avcDc = meta.decoderConfig; return meta; }
    if (_avcDc) return { decoderConfig: _avcDc };
    var dc = null;
    try {
      if (chunk && chunk.type === 'key' && chunk.byteLength > 0) {
        avcKeyTries++;
        var buf = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buf);
        dc = avcDcFromNalUnits(buf);
      }
    } catch (e) { dc = null; }
    if (dc) { _avcDc = dc; return { decoderConfig: dc }; }
    return meta;
  }
  /* Split one H.264 sample into NAL units, tolerating both Annex-B
     (start codes) and length-prefixed (avcC) layouts. Unknown NAL types
     (AUD, SEI, …) are skipped over, not choked on. */
  function splitNals(buf, annexB) {
    var nals = [], i, j, m, p, len, sc, scLen, end;
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
    return nals;
  }
  function spsPpsFromNals(nals) {
    var sps = null, pps = null, k, t;
    for (k = 0; k < nals.length; k++) {
      t = nals[k][0] & 31;
      if (t === 7 && !sps) sps = nals[k];
      else if (t === 8 && !pps) pps = nals[k];
      if (sps && pps) break;
    }
    return (sps && pps && sps.length >= 4) ? { sps: sps, pps: pps } : null;
  }
  function avcDcFromNalUnits(buf) {
    if (!buf || buf.length < 5) return null;
    var annexB = buf[0] === 0 && buf[1] === 0 &&
      (buf[2] === 1 || (buf[2] === 0 && buf[3] === 1));
    var found = spsPpsFromNals(splitNals(buf, annexB));
    if (!found) found = spsPpsFromNals(splitNals(buf, !annexB));
    if (!found) return null;
    var sps = found.sps, pps = found.pps;
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

  /* ---- procedural ambience ----
     Every sound is synthesized with Web Audio — no audio files, no
     network. A seeded recipe per studio builds a quiet ambient bed
     (rain, water, rumble, pads…), rendered offline into a seamless
     60-second loop, then tiled across the full video duration.
     Seeded from the render seed: same seed = same bed, every time.
     Best-effort by design: any failure here yields a video-only
     render, never a failed render. */
  var soundOn = true, audioPlan = null, audioNote = '', audioMuxed = 0;

  function hashSeed(s) {
    var h = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pickAmbience() {
    var t = (studioLabel || '').toLowerCase();
    if (t.indexOf('parallax') >= 0) {
      var m = /^PX1-([0-5])/.exec(seed || '');
      var r = m ? +m[1] : (hashSeed(seed) % 6);
      return ['px-forest', 'px-canal', 'px-ember', 'px-cloud', 'px-mycel', 'px-orbital'][r];
    }
    if (t.indexOf('rainforest') >= 0) return 'rainforest';
    if (t.indexOf('molten') >= 0) return 'molten';
    if (t.indexOf('alien') >= 0) return 'alien';
    if (t.indexOf('aquarium') >= 0) return 'aquarium';
    if (t.indexOf('canal') >= 0) return 'canal';
    if (t.indexOf('turtle') >= 0) return 'turtle';
    if (t.indexOf('window') >= 0 || t.indexOf('weather') >= 0) return 'rainwindow';
    if (t.indexOf('road') >= 0 || t.indexOf('atlas') >= 0) return 'road';
    return 'neutral';
  }
  /* ---- procedural ambience: pure sample synthesis ----
     The whole 60-second bed is computed directly to Float32Arrays —
     no Web Audio graph, no oscillator/filter nodes. Every sample is
     pure math from the seeded rng, so the same seed renders
     bit-identical audio on every device, independent of any browser's
     audio engine. (Audio nodes proved nondeterministic across runs in
     one test browser's software audio engine; sample math removes the
     entire class of risk.) Recipes keep their musical shape — only the
     DSP backend changed. */
  function ambBiquadCoefs(type, freq, q, sr) {
    /* RBJ Audio EQ Cookbook, normalized. */
    var w0 = 2 * Math.PI * freq / sr, cw = Math.cos(w0), sw = Math.sin(w0);
    var alpha = sw / (2 * q), b0, b1, b2;
    if (type === 'highpass') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; }
    else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; }
    else { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
    var a0 = 1 + alpha;
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: -2 * cw / a0, a2: (1 - alpha) / a0 };
  }
  function ambContext(sr, L, seedStr, kind) {
    var len = Math.ceil(sr * L), i;
    var rng = mulberry32(hashSeed(seedStr + '|' + kind));
    var noise = new Float32Array(len);
    for (i = 0; i < len; i++) noise[i] = rng() * 2 - 1;
    return { sr: sr, L: L, len: len, rng: rng, noise: noise,
             mixL: new Float32Array(len), mixR: new Float32Array(len) };
  }
  /* Looped filtered noise. The LFO rate is k/L so it stays periodic
     across the loop seam — no clicks, ever. */
  function ambWash(g, o) {
    var co = ambBiquadCoefs(o.type || 'lowpass', o.freq, o.q || 0.6, g.sr);
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0, n;
    var lfoK = o.lfoK || 0;
    var lfoDepth = (o.lfoDepth != null ? o.lfoDepth : o.gain * 0.4);
    var ph = 0, lfoInc = lfoK / g.L / g.sr, TAU = 2 * Math.PI;
    for (n = 0; n < g.len; n++) {
      var x = g.noise[n];
      var y = co.b0 * x + co.b1 * x1 + co.b2 * x2 - co.a1 * y1 - co.a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      var gg = o.gain;
      if (lfoK) { ph += lfoInc; if (ph >= 1) ph -= 1; gg += lfoDepth * Math.sin(TAU * ph); }
      g.mixL[n] += y * gg; g.mixR[n] += y * gg;
    }
  }
  /* Short enveloped tone (chirp, ping, drip, horn). Full decay before
     the loop seam, so it never clicks. */
  function ambTone(g, t, f0, f1, dur, gain, type) {
    f0 = Math.max(f0, 1);
    var fEnd = (f1 && f1 !== f0) ? Math.max(f1, 1) : f0;
    var startN = Math.floor(t * g.sr);
    var nDur = Math.max(1, Math.ceil(dur * g.sr));
    var atk = Math.max(1, Math.ceil(Math.min(0.02, dur * 0.2) * g.sr));
    var sq = (type === 'square');
    var g0 = 0.0001, g1 = Math.max(gain, 0.0002), TAU = 2 * Math.PI;
    var pan = g.rng() * 1.2 - 0.6, pa = (pan + 1) * Math.PI / 4;
    var lg = Math.cos(pa), rg = Math.sin(pa);
    var ph = 0, n;
    for (n = 0; n < nDur; n++) {
      var idx = startN + n;
      if (idx >= g.len) break;
      var env = (n < atk) ? g0 * Math.pow(g1 / g0, n / atk)
                          : g1 * Math.pow(g0 / g1, (n - atk) / (nDur - atk));
      var f = f0 * Math.pow(fEnd / f0, n / nDur);
      ph += f / g.sr; if (ph >= 1) ph -= 1;
      var w = Math.sin(TAU * ph);
      var s = (sq ? (w < 0 ? -1 : 1) : w) * env;
      g.mixL[idx] += s * lg; g.mixR[idx] += s * rg;
    }
  }
  /* Short filtered-noise tick (crackle, droplet hit, lap). */
  function ambDrop(g, t, dur, gain, freq) {
    var rate = 0.7 + g.rng() * 0.6;
    var maxOff = Math.max(0.1, g.noise.length / g.sr - dur - 0.1);
    var off = Math.floor(g.rng() * maxOff * g.sr);
    var startN = Math.floor(t * g.sr);
    var nlen = Math.ceil(dur * g.sr);
    var co = ambBiquadCoefs('bandpass', freq, 1.2, g.sr);
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0, n;
    var atkN = Math.max(1, Math.ceil(0.008 * g.sr));
    var g1 = Math.max(gain, 0.0002), g0 = 0.0001;
    var nlast = g.noise.length - 1;
    for (n = 0; n < nlen; n++) {
      var idx = startN + n;
      if (idx >= g.len) break;
      var pos = off + n * rate;
      var i0 = Math.floor(pos), fr = pos - i0;
      var x = g.noise[i0] * (1 - fr) + g.noise[i0 + 1 > nlast ? nlast : i0 + 1] * fr;
      var y = co.b0 * x + co.b1 * x1 + co.b2 * x2 - co.a1 * y1 - co.a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      var env = (n < atkN) ? g0 * Math.pow(g1 / g0, n / atkN)
                           : g1 * Math.pow(g0 / g1, (n - atkN) / (nlen - atkN));
      g.mixL[idx] += y * env; g.mixR[idx] += y * env;
    }
  }
  /* Slow evolving chord. Voice frequencies are quantized to k/L so the
     whole pad is periodic over the loop — seamless by construction. */
  function ambPad(g, base, ratios, gain) {
    var nV = ratios.length, freq = [], lfoK = [], v;
    for (v = 0; v < nV; v++) {
      var det = g.rng() * 8 - 4;
      var f = base * ratios[v] * Math.pow(2, det / 1200);
      freq.push(Math.round(f * g.L) / g.L);
      lfoK.push(1 + v);
    }
    var a = 1 - Math.exp(-2 * Math.PI * 700 / g.sr), TAU = 2 * Math.PI;
    var ph = [], lph = [], v2;
    for (v2 = 0; v2 < nV; v2++) { ph.push(0); lph.push(0); }
    var lp = 0, n;
    for (n = 0; n < g.len; n++) {
      var x = 0;
      for (v2 = 0; v2 < nV; v2++) {
        ph[v2] += freq[v2] / g.sr; if (ph[v2] >= 1) ph[v2] -= 1;
        lph[v2] += lfoK[v2] / g.L / g.sr; if (lph[v2] >= 1) lph[v2] -= 1;
        var tri = 2 * Math.abs(2 * ph[v2] - 1) - 1;
        x += tri * (1 + 0.35 * Math.sin(TAU * lph[v2]));
      }
      lp += a * (x * gain - lp);
      g.mixL[n] += lp; g.mixR[n] += lp;
    }
  }
  /* Constant low drone with a slow fade at the loop edges. */
  function ambDrone(g, targetFreq, gain) {
    var f = Math.round(targetFreq * g.L) / g.L, inc = f / g.sr, ph = 0, n, TAU = 2 * Math.PI;
    for (n = 0; n < g.len; n++) {
      ph += inc; if (ph >= 1) ph -= 1;
      var t = n / g.sr, env;
      if (t < 2) env = 0.0001 + (gain - 0.0001) * (t / 2);
      else if (t > g.L - 2) env = 0.0001 + (gain - 0.0001) * ((g.L - t) / 2);
      else env = gain;
      var s = Math.sin(TAU * ph) * env;
      g.mixL[n] += s; g.mixR[n] += s;
    }
  }
  function ambBuild(kind, g) {
    var L = g.L, i, rng = g.rng;
    function ev(n, fn) { for (i = 0; i < n; i++) fn(0.5 + rng() * (L - 1.5)); }
    switch (kind) {
      case 'rainforest':
        ambWash(g, { type: 'bandpass', freq: 4200, q: 0.5, gain: 0.11, lfoK: 2, lfoDepth: 0.025 });
        ambWash(g, { type: 'lowpass', freq: 240, gain: 0.05, lfoK: 1, lfoDepth: 0.02 });
        ev(7, function (tt) {
          var f = 2300 + rng() * 2300, r0 = 2 + ((rng() * 3) | 0);
          for (var r = 0; r < r0; r++) ambTone(g, tt + r * 0.13, f * (0.92 + rng() * 0.16), f * 1.25, 0.09, 0.030);
        });
        ev(9, function (tt) { ambTone(g, tt, 1500, 480, 0.12, 0.028); });
        break;
      case 'px-forest':
        ambWash(g, { type: 'bandpass', freq: 900, q: 0.4, gain: 0.07, lfoK: 1, lfoDepth: 0.03 });
        ambWash(g, { type: 'lowpass', freq: 140, gain: 0.06 });
        ev(5, function (tt) { var f = 1800 + rng() * 1600; ambTone(g, tt, f, f * 1.3, 0.12, 0.025); });
        ev(12, function (tt) { ambTone(g, tt, 1200, 420, 0.14, 0.030); });
        break;
      case 'aquarium':
        ambWash(g, { type: 'lowpass', freq: 750, gain: 0.09, lfoK: 2, lfoDepth: 0.03 });
        ambWash(g, { type: 'lowpass', freq: 180, gain: 0.05 });
        ev(10, function (tt) { ambTone(g, tt, 500 + rng() * 300, 1300 + rng() * 500, 0.16, 0.035); });
        break;
      case 'molten':
      case 'px-ember':
        ambWash(g, { type: 'lowpass', freq: 110, gain: 0.17, lfoK: 1, lfoDepth: 0.06 });
        ev(14, function (tt) { ambDrop(g, tt, 0.05 + rng() * 0.09, 0.05, 1800 + rng() * 2500); });
        ev(3, function (tt) { ambTone(g, tt, 48, 38, 1.6, 0.06); });
        break;
      case 'rainwindow':
        ambWash(g, { type: 'bandpass', freq: 5200, q: 0.4, gain: 0.10, lfoK: 3, lfoDepth: 0.02 });
        ev(12, function (tt) { ambTone(g, tt, 1900, 950, 0.07, 0.030); });
        ev(2, function (tt) { ambTone(g, tt, 55, 40, 2.2, 0.035); });
        break;
      case 'alien':
      case 'px-orbital':
        ambPad(g, 110, [1, 1.5, 2.02, 2.98], 0.026);
        ambWash(g, { type: 'bandpass', freq: 700, q: 0.5, gain: 0.032, lfoK: 1, lfoDepth: 0.014 });
        ev(6, function (tt) { var f = 840 + rng() * 480; ambTone(g, tt, f, f * 1.015, 1.4, 0.014); });
        ev(2, function (tt) { ambTone(g, tt, 300 + rng() * 200, 700 + rng() * 300, 2.5, 0.018); });
        break;
      case 'px-cloud':
        ambPad(g, 130, [1, 1.26, 1.5, 2.0], 0.024);
        ambWash(g, { type: 'bandpass', freq: 500, q: 0.4, gain: 0.05, lfoK: 2, lfoDepth: 0.025 });
        break;
      case 'px-mycel':
        ambPad(g, 55, [1, 1.5, 2.0], 0.035);
        ambWash(g, { type: 'lowpass', freq: 200, gain: 0.05 });
        ev(14, function (tt) { ambTone(g, tt, 900 + rng() * 500, 350, 0.18, 0.024); });
        break;
      case 'canal':
      case 'px-canal':
        ambWash(g, { type: 'lowpass', freq: 480, gain: 0.085, lfoK: 3, lfoDepth: 0.04 });
        ambDrone(g, 98, 0.016); ambDrone(g, 196, 0.010);
        ev(3, function (tt) { ambTone(g, tt, 520, 505, 0.5, 0.018, 'square'); });
        ev(6, function (tt) { ambDrop(g, tt, 0.2, 0.03, 900 + rng() * 400); });
        break;
      case 'turtle':
        ambWash(g, { type: 'lowpass', freq: 380, gain: 0.10, lfoK: 1, lfoDepth: 0.055 });
        ambWash(g, { type: 'bandpass', freq: 280, q: 0.5, gain: 0.035, lfoK: 2, lfoDepth: 0.015 });
        break;
      case 'road':
        ambWash(g, { type: 'bandpass', freq: 320, q: 0.5, gain: 0.030, lfoK: 1, lfoDepth: 0.015 });
        ambWash(g, { type: 'lowpass', freq: 140, gain: 0.05, lfoK: 1, lfoDepth: 0.02 });
        break;
      default: /* neutral */
        ambWash(g, { type: 'bandpass', freq: 400, q: 0.5, gain: 0.04, lfoK: 1, lfoDepth: 0.02 });
    }
  }

  /* Render the seeded bed offline, then AAC-encode it, tiled across the
     full video duration. Returns {chunks, decoderConfig, ...} or null.
     Never throws past this boundary — audio is best-effort. */
  async function prepareAudio() {
    audioPlan = null; audioMuxed = 0;
    if (!soundOn) { audioNote = 'off'; return null; }
    try {
      if (typeof AudioEncoder === 'undefined') { audioNote = 'no audio encoder'; return null; }
      var sr = 44100, L = 60, kind = pickAmbience();
      /* The bed is synthesized directly to samples — no audio nodes,
         so there is no offline render step at all. */
      var g = ambContext(sr, L, seed, kind);
      ambBuild(kind, g);
      var n, MG = 0.55; /* master gain */
      for (n = 0; n < g.len; n++) { g.mixL[n] *= MG; g.mixR[n] *= MG; }
      var ch0 = g.mixL, ch1 = g.mixR, loopLen = g.len;
      /* Determinism fingerprint: same seed must yield the same bed. */
      var fh = 2166136261 >>> 0, fi;
      for (fi = 0; fi < loopLen; fi += 97) {
        fh ^= (ch0[fi] * 1e6) | 0; fh = Math.imul(fh, 16777619);
        fh ^= (ch1[fi] * 1e6) | 0; fh = Math.imul(fh, 16777619);
      }
      var bedHash = (fh >>> 0).toString(16);
      var chunks = [], dc = null, encErr = '', nomDur = Math.round(1024 * 1e6 / sr), tsAcc = 0;
      var aenc = new AudioEncoder({
        output: function (ch, meta) {
          if (meta && meta.decoderConfig && !dc) dc = meta.decoderConfig;
          var b = new Uint8Array(ch.byteLength);
          try { ch.copyTo(b); } catch (e) { return; }
          var dur = (ch.duration > 0 && isFinite(ch.duration)) ? ch.duration : nomDur;
          var ts = (ch.timestamp >= 0 && isFinite(ch.timestamp)) ? ch.timestamp : tsAcc;
          tsAcc = ts + dur;
          chunks.push({ ts: Math.round(ts), dur: Math.round(dur), bytes: b });
        },
        error: function (e) { encErr = (e && e.message) || String(e); }
      });
      /* Note: like the video path, we configure directly instead of
         trusting isConfigSupported — iOS can misreport. */
      aenc.configure({ codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: 2, bitrate: 128000 });
      var total = Math.max(1, Math.ceil(seconds * sr)), frameLen = 1024, pos = 0, ts = 0;
      while (pos < total) {
        var n = Math.min(frameLen, total - pos);
        var data = new Float32Array(n * 2), lp;
        for (var i = 0; i < n; i++) { lp = (pos + i) % loopLen; data[2 * i] = ch0[lp]; data[2 * i + 1] = ch1[lp]; }
        var ad = new AudioData({ format: 'f32', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: ts, data: data });
        aenc.encode(ad);
        try { ad.close(); } catch (e) {}
        ts += Math.round(n * 1e6 / sr); pos += n;
      }
      await aenc.flush();
      try { aenc.close(); } catch (e) {}
      if (!chunks.length) { audioNote = 'encoder silent' + (encErr ? ': ' + encErr : ''); return null; }
      if (!dc || !dc.description) {
        /* AAC-LC, 44100 Hz, stereo AudioSpecificConfig. */
        dc = { codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: 2, description: new Uint8Array([0x12, 0x10]) };
      }
      audioNote = 'aac';
      audioPlan = { chunks: chunks, decoderConfig: dc, sampleRate: sr, channels: 2, bedHash: bedHash, kind: kind };
      try { window.__renderAudio = { bedHash: bedHash, note: audioNote, chunks: chunks.length, kind: kind }; } catch (e) {}
      return audioPlan;
    } catch (e) {
      audioNote = 'failed: ' + (((e && e.message) || String(e)).slice(0, 80));
      return null;
    }
  }

  RM.onPhase = function (phase) {
    if (phase === 'reset') doReset();
    else if (phase === 'done') finishRender();
  };

  function doReset() {
    RM.phase = 'reset';
    try { if (typeof window.__renderReset === 'function') window.__renderReset(); } catch (e) {}
    RM.frame = 0;
    /* The sound choice locks when the render starts. */
    var sb = document.getElementById('rmSound');
    if (sb) { sb.disabled = true; sb.style.opacity = 0.45; }
    setStatus(soundOn ? 'Preparing sound\u2026' : 'Preparing\u2026');
    /* Audio first (fast, offline), then the video encoder — the muxer
       needs to know up front whether it carries an audio track. */
    prepareAudio().then(function (plan) {
      if (RM.phase === 'cancelled') return;
      if (!setupEncoder(!!plan)) return;
      RM.phase = 'record';
      t0 = performance.now();
      setStatus('Rendering\u2026');
    });
  }

  function setupEncoder(withAudio) {
    if (typeof VideoEncoder === 'undefined') {
      fail('This browser can\u2019t do headless rendering (needs WebCodecs). Try Safari on iOS 17.4+.');
      return false;
    }
    if (typeof Mp4Muxer === 'undefined') { fail('Video muxer failed to load.'); return false; }
    try {
      var mopts = {
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
      };
      if (withAudio && audioPlan) {
        mopts.audio = { codec: 'aac', sampleRate: audioPlan.sampleRate, numberOfChannels: audioPlan.channels };
      }
      muxer = new Mp4Muxer.Muxer(mopts);
      encoder = new VideoEncoder({
        output: function (chunk, meta) {
          /* Counted before anything can drop it: this is what the
             encoder actually produced, independent of the muxer. */
          rawChunks++;
          try {
            /* Never trust the chunk's own timing fields. iOS Safari's
               hardware encoder emits duration null, and mp4-muxer throws
               on a non-finite duration — which used to silently discard
               EVERY chunk (the "frames in, 0 recorded" empty file).
               Copy the bytes once and pass an explicit timestamp plus
               the nominal frame duration instead. */
            var ts = (chunk.timestamp != null && isFinite(chunk.timestamp) && chunk.timestamp >= 0)
              ? chunk.timestamp : Math.round(rawChunks * 1e6 / fps);
            var dur = (chunk.duration != null && isFinite(chunk.duration) && chunk.duration > 0)
              ? chunk.duration : Math.round(1e6 / fps);
            var bytes = new Uint8Array(chunk.byteLength);
            chunk.copyTo(bytes);
            muxer.addVideoChunkRaw(bytes, chunk.type, ts, dur, withAvcDecoderConfig(chunk, meta));
            muxedChunks++;
          } catch (e) {
            /* Recorded, never silently swallowed: a divergence between
               rawChunks and muxedChunks is itself the diagnosis. */
            muxErrors++;
            if (!firstMuxError) firstMuxError = (e && e.message) || String(e);
          }
          if (RM._bp && encoder.encodeQueueSize < 20) RM._bp = false;
          /* Fail fast if the video format info never arrives: two
             keyframes attempted without readable SPS/PPS means the file
             could never be playable — stop loudly instead of rendering
             a broken file to the end. */
          if (RM.phase === 'record' && !_avcDc && avcKeyTries >= 2) {
            fail('The video\u2019s format info never arrived \u2014 the encoder produced ' + rawChunks +
              ' chunks but their layout couldn\u2019t be read' +
              (muxErrors ? ' (' + muxErrors + ' file errors' + (firstMuxError ? ', first: ' + firstMuxError : '') + ')' : '') +
              '. Please try again; if it keeps happening, use a lower resolution.');
          }
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
    if (eta) eta.textContent = '\u2248 ' + fmtTime(remain) + ' left \u00B7 ' + rate.toFixed(1) + ' fps wall \u00B7 ' + rawChunks + ' enc \u00B7 ' + muxedChunks + ' mux \u00B7 q' + encoder.encodeQueueSize + (audioPlan ? ' \u00B7 \u266A aac' : (soundOn ? ' \u00B7 \u266A\u2026' : ''));
  }

  async function finishRender() {
    RM.phase = 'done'; RM.onFrame = null;
    updateProgress();
    setStatus('Finishing video\u2026');
    try {
      if (encoder) await encoder.flush();
      /* Best-effort audio: a mux problem here must never sink the video. */
      if (audioPlan && audioPlan.chunks.length) {
        try {
          var sentDc = false;
          for (var ai = 0; ai < audioPlan.chunks.length; ai++) {
            var ac = audioPlan.chunks[ai];
            var eac = new EncodedAudioChunk({ type: 'key', timestamp: ac.ts, duration: ac.dur, data: ac.bytes });
            if (!sentDc) { muxer.addAudioChunk(eac, { decoderConfig: audioPlan.decoderConfig }); sentDc = true; }
            else muxer.addAudioChunk(eac);
            audioMuxed++;
          }
        } catch (ae) {
          audioNote = 'mux failed: ' + (((ae && ae.message) || String(ae)).slice(0, 60));
          audioPlan = null; audioMuxed = 0;
        }
      }
      if (muxer) muxer.finalize();
    } catch (e) { fail('Couldn\u2019t finish the video: ' + e.message); return; }
    var buf = muxer.target.buffer;
    if (!buf || !buf.byteLength) { fail('The video came out empty.'); return; }
    if (muxedChunks === 0) { failEmpty(); return; }
    /* Chunks without format info would make an unplayable file: never
       hand the user a broken "ready" video. Fail loudly instead. */
    if (!_avcDc) {
      fail('The video recorded ' + muxedChunks + ' chunks but their format info never arrived, so no playable file could be made. ' +
        'Please try again; if it keeps happening, use a lower resolution.');
      return;
    }
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
      '<div style="font-size:13px;color:#8b95ab;margin-bottom:20px;font-family:ui-monospace,monospace">' + esc(name) + ' \u00B7 ' + mb + ' MB' + (audioMuxed > 0 ? ' \u00B7 \uD83D\uDD0A sound' : '') + '</div>' +
      '<button id="rmShare" style="font-size:17px;font-weight:800;border:0;border-radius:14px;padding:16px 30px;background:#2f7bff;color:#fff;margin-bottom:12px">Share video</button>' +
      '<div style="font-size:12px;color:#8b95ab;max-width:300px;line-height:1.6">Share \u2192 Save to Files \u2192 your SSD.<br>Or use the download link below.</div>' +
      '<a id="rmDl" href="' + url + '" download="' + esc(name) + '" style="margin-top:14px;color:#9cc3ff;font-size:14px">Download instead</a>' +
      '<div><button id="rmBackDone" ' +
      'style="margin-top:22px;font-size:16px;font-weight:700;border:0;border-radius:12px;padding:14px 24px;background:#1a2236;color:#fff">Back to queue</button></div>';
    document.getElementById('rmBackDone').onclick = function () {
      location.href = 'https://bassseamoor.github.io/render-queue/';
    };
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

  document.getElementById('rmSound').onclick = function () {
    soundOn = !soundOn;
    this.textContent = soundOn ? '\uD83D\uDD0A Sound on' : '\uD83D\uDD07 Muted';
  };
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
    /* Was: inline onclick with \u2018\u2019 curly quotes around the URL —
       a JS syntax error, so tapping the button silently did nothing. */
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
})();

