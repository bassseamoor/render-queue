(function () {
  "use strict";

  var FLIPS = ["3d", "slide", "fade"];

  var SEED_DECKS = {
    spanish: [
      { name: "Spanish Basics", cards: [
        ["Hola", "Hello"],
        ["Gracias", "Thank you"],
        ["Por favor", "Please"],
        ["Adiós", "Goodbye"],
        ["Buenos días", "Good morning"],
        ["¿Cómo estás?", "How are you?"],
        ["Sí", "Yes"],
        ["La biblioteca", "The library"]
      ]},
    ],
    interview: [
      { name: "Interview Prep", cards: [
        ["Tell me about yourself", "Keep it to 2 minutes: present, past, future. End with why this role."],
        ["Your greatest strength", "Pick one strength backed by a real story with numbers."],
        ["Your greatest weakness", "Name a real one you are actively fixing, with proof of progress."],
        ["Why do you want this job?", "Connect their mission to your skills and your track record."],
        ["Describe a conflict you resolved", "Use STAR: situation, task, action, result. Never badmouth anyone."],
        ["Where do you see yourself in 5 years?", "Show ambition tied to growing with this company."],
        ["What are your salary expectations?", "Give a researched range, and ask about the full package."],
        ["Questions for us?", "Always ask 2 or 3: team goals, success metrics, biggest challenges."]
      ]},
    ],
    blank: []
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var FLIP_CSS = {
    "3d": [
      ".fcard{perspective:1400px}",
      ".finner{position:relative;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .5s cubic-bezier(.25,.8,.3,1)}",
      ".fcard.flipped .finner{transform:rotateY(180deg)}",
      ".face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}",
      ".face.back{transform:rotateY(180deg)}"
    ].join("\n"),
    slide: [
      ".finner{position:relative;width:100%;height:100%;overflow:hidden}",
      ".face{position:absolute;inset:0;transition:transform .38s cubic-bezier(.3,.7,.3,1),opacity .38s ease}",
      ".face.front{transform:translateX(0);opacity:1}",
      ".face.back{transform:translateX(104%);opacity:0}",
      ".fcard.flipped .face.front{transform:translateX(-104%);opacity:0}",
      ".fcard.flipped .face.back{transform:translateX(0);opacity:1}"
    ].join("\n"),
    fade: [
      ".finner{position:relative;width:100%;height:100%}",
      ".face{position:absolute;inset:0;transition:opacity .34s ease}",
      ".face.front{opacity:1}",
      ".face.back{opacity:0}",
      ".fcard.flipped .face.front{opacity:0}",
      ".fcard.flipped .face.back{opacity:1}"
    ].join("\n")
  };

  function build(config) {
    config = (config && typeof config === "object") ? config : {};
    var flip = FLIPS.indexOf(config.flip) !== -1 ? config.flip : "3d";
    var aids = Array.isArray(config.aids) ? config.aids : ["shuffle", "grade", "progress"];
    var shuffleAid = aids.indexOf("shuffle") !== -1;
    var gradeAid = aids.indexOf("grade") !== -1;
    var progressAid = aids.indexOf("progress") !== -1;
    var starter = SEED_DECKS.hasOwnProperty(config.starter) ? config.starter : "spanish";

    var cfgJson = JSON.stringify({ flip: flip, shuffle: shuffleAid, grade: gradeAid, progress: progressAid });
    var seedJson = JSON.stringify(SEED_DECKS[starter]);

    var html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0b0b10">
<title>Flashcards</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; }
  body {
    margin: 0; background: #0b0b10;
    background-image: radial-gradient(120% 80% at 50% 0%, #181824 0%, #0b0b10 60%);
    color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    min-height: 100dvh; touch-action: manipulation;
    -webkit-user-select: none; user-select: none;
  }
  input, textarea { -webkit-user-select: text; user-select: text; }
  #app { width: 100%; max-width: 480px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; padding: calc(12px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom)); }
  header.top { display: flex; align-items: center; gap: 10px; padding: 6px 2px 14px; }
  header.top h1 { font-size: 22px; margin: 0; flex: 1; letter-spacing: .2px; }
  header.top .deckname { font-size: 17px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .iconbtn { min-width: 44px; min-height: 44px; border-radius: 14px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: #f5f5f7; font-size: 20px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0 10px; }
  .iconbtn.on { background: rgba(124,158,255,.22); border-color: rgba(124,158,255,.55); }
  .iconbtn.danger.armed { background: rgba(255,90,90,.25); border-color: rgba(255,90,90,.7); font-size: 14px; font-weight: 700; }
  .deck { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.10); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
  .deck .meta { flex: 1; min-width: 0; }
  .deck .nm { font-size: 17px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .deck .sub { font-size: 13px; color: rgba(245,245,247,.55); margin-top: 3px; }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 16px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; padding: 0 18px; }
  .btn.primary { background: #f5f5f7; color: #0b0b10; }
  .btn.ghost { background: rgba(255,255,255,.07); color: #f5f5f7; border: 1px solid rgba(255,255,255,.12); }
  .btn.block { width: 100%; }
  .btn.got { background: rgba(95,214,138,.20); color: #7ce8a4; border: 1px solid rgba(95,214,138,.5); flex: 1; }
  .btn.missed { background: rgba(255,107,107,.16); color: #ff9b9b; border: 1px solid rgba(255,107,107,.5); flex: 1; }
  .empty { text-align: center; padding: 60px 20px; color: rgba(245,245,247,.6); }
  .empty .big { font-size: 52px; margin-bottom: 12px; }
  .prog { height: 6px; border-radius: 3px; background: rgba(255,255,255,.10); overflow: hidden; margin: 2px 2px 4px; }
  .prog > div { height: 100%; background: #7c9eff; border-radius: 3px; transition: width .3s ease; }
  .proglabel { font-size: 13px; color: rgba(245,245,247,.6); text-align: center; margin-bottom: 10px; }
  .stage { flex: 1; display: flex; min-height: 340px; }
  .fcard { flex: 1; min-height: 340px; }
  .face { border-radius: 20px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 22px; text-align: center; cursor: pointer; }
  .face.back { background: rgba(124,158,255,.10); border-color: rgba(124,158,255,.35); }
  .face .tag { font-size: 12px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(245,245,247,.45); margin-bottom: 14px; }
  .face.back .tag { color: rgba(124,158,255,.8); }
  .face .ftext { font-size: 24px; font-weight: 700; line-height: 1.35; }
  .face .fhint { margin-top: 16px; font-size: 13px; color: rgba(245,245,247,.4); }
  .stage.navout .fcard { opacity: 0; transform: translateX(var(--navx, 0)); transition: opacity .16s ease, transform .16s ease; }
  .stage .fcard { transition: opacity .16s ease, transform .16s ease; }
  .navrow { display: flex; gap: 10px; margin-top: 14px; }
  .navrow .btn { flex: 1; }
  .graderow { display: flex; gap: 10px; margin-top: 14px; }
  .gradetip { text-align: center; font-size: 13px; color: rgba(245,245,247,.5); margin-top: 12px; }
  .cardrow { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); border-radius: 14px; padding: 12px; margin-bottom: 8px; }
  .cardrow .tx { flex: 1; min-width: 0; }
  .cardrow .fr { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cardrow .bk { font-size: 13px; color: rgba(245,245,247,.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .mini { min-width: 44px; min-height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: #f5f5f7; font-size: 17px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0 8px; }
  .mini.danger.armed { background: rgba(255,90,90,.25); border-color: rgba(255,90,90,.7); font-size: 13px; font-weight: 700; }
  .modalwrap { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
  .sheet { width: 100%; max-width: 480px; background: #16161f; border-radius: 20px 20px 0 0; border: 1px solid rgba(255,255,255,.12); border-bottom: none; padding: 18px 16px calc(18px + env(safe-area-inset-bottom)); }
  .sheet h2 { margin: 0 0 12px; font-size: 18px; }
  .field { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); border-radius: 14px; color: #f5f5f7; font-size: 16px; padding: 14px; margin-bottom: 10px; font-family: inherit; }
  textarea.field { min-height: 88px; resize: none; }
  .sheet .row { display: flex; gap: 10px; }
  .sheet .row .btn { flex: 1; }
  .sumscore { text-align: center; padding: 26px 0 10px; }
  .sumscore .pct { font-size: 56px; font-weight: 800; }
  .sumscore .frac { font-size: 16px; color: rgba(245,245,247,.6); margin-top: 4px; }
  .missedlist { margin: 8px 0 16px; }
  .missedlist .mh { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,155,155,.85); margin-bottom: 8px; }
  .missedlist .mi { background: rgba(255,107,107,.08); border: 1px solid rgba(255,107,107,.25); border-radius: 12px; padding: 10px 12px; font-size: 14px; margin-bottom: 6px; }
${FLIP_CSS[flip]}
</style>
</head>
<body>
<div id="app"></div>
<script>
(function () {
  "use strict";
  var CFG = ${cfgJson};
  var SEED = ${seedJson};
  var LSKEY = "moor.flashcards.v1";

  function lsGet() { try { return window.localStorage.getItem(LSKEY); } catch (e) { return null; } }
  function lsSet(v) { try { window.localStorage.setItem(LSKEY, v); } catch (e) {} }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function shuffleArr(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var state = { view: "decks", decks: [], scores: {}, deckId: null, study: null, modal: null, armDelete: null };

  function seedDecks() {
    return SEED.map(function (d, di) {
      return { id: "seed" + di, name: d.name, seed: true,
        cards: d.cards.map(function (c, ci) { return { id: "seed" + di + "_" + ci, front: c[0], back: c[1] }; }) };
    });
  }
  function load() {
    var ok = false;
    try {
      var raw = lsGet();
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.decks)) { state.decks = d.decks; state.scores = d.scores || {}; ok = true; }
      }
    } catch (e) {}
    if (!ok) { state.decks = seedDecks(); state.scores = {}; }
  }
  function save() { lsSet(JSON.stringify({ decks: state.decks, scores: state.scores })); }
  function getDeck(id) {
    for (var i = 0; i < state.decks.length; i++) if (state.decks[i].id === id) return state.decks[i];
    return null;
  }
  function getCard(deck, id) {
    for (var i = 0; i < deck.cards.length; i++) if (deck.cards[i].id === id) return deck.cards[i];
    return null;
  }

  function startStudy(deckId) {
    var deck = getDeck(deckId);
    if (!deck || !deck.cards.length) return;
    var order = deck.cards.map(function (c) { return c.id; });
    var sh = CFG.shuffle;
    if (sh) order = shuffleArr(order);
    state.study = { deckId: deckId, order: order, pos: 0, flipped: false, results: {}, shuffle: sh };
    state.view = "study";
    render();
  }

  function studyAdvance(dir) {
    var st = state.study;
    if (!st) return;
    st.pos += dir;
    st.flipped = false;
    if (st.pos >= st.order.length) { finishStudy(); return; }
    if (st.pos < 0) st.pos = 0;
    var stage = document.getElementById("stage");
    if (stage) {
      stage.style.setProperty("--navx", dir > 0 ? "40px" : "-40px");
      stage.classList.add("navout");
      setTimeout(function () { render(); }, 170);
    } else { render(); }
  }

  function finishStudy() {
    var st = state.study;
    var deck = st ? getDeck(st.deckId) : null;
    var got = 0, total = 0, missed = [];
    if (st && deck) {
      for (var i = 0; i < st.order.length; i++) {
        var c = getCard(deck, st.order[i]);
        if (!c) continue;
        total++;
        if (st.results[st.order[i]] === "got") got++;
        else if (CFG.grade && st.results[st.order[i]] !== "got") missed.push(c.front);
      }
    }
    if (deck && CFG.grade && total > 0) {
      var pct = Math.round(got / total * 100);
      var prev = state.scores[deck.id] || 0;
      if (pct > prev) state.scores[deck.id] = pct;
      save();
    }
    state.summary = { deckId: st ? st.deckId : null, got: got, total: total, missed: missed };
    state.study = null;
    state.view = "summary";
    render();
  }

  function viewDecks() {
    var h = '<header class="top"><h1>&#127183; Flashcards</h1>';
    h += '<button class="iconbtn" data-act="new-deck" aria-label="New deck">＋</button></header>';
    if (!state.decks.length) {
      h += '<div class="empty"><div class="big">&#127183;</div><div>No decks yet.<br>Create your first deck to start studying.</div></div>';
    } else {
      for (var i = 0; i < state.decks.length; i++) {
        (function (d) {
          var sc = state.scores[d.id];
          var sub = d.cards.length + (d.cards.length === 1 ? " card" : " cards");
          sub += CFG.grade ? (sc != null ? " · Best " + sc + "%" : " · Not studied yet") : "";
          var armed = state.armDelete === "deck:" + d.id;
          h += '<div class="deck"><div class="meta" data-act="open-deck" data-id="' + d.id + '">'
            + '<div class="nm">' + esc(d.name) + '</div><div class="sub">' + esc(sub) + '</div></div>'
            + '<button class="mini" data-act="study-deck" data-id="' + d.id + '" aria-label="Study">&#9654;</button>'
            + '<button class="mini" data-act="edit-deck" data-id="' + d.id + '" aria-label="Rename">&#9998;</button>'
            + '<button class="mini danger' + (armed ? " armed" : "") + '" data-act="del-deck" data-id="' + d.id + '" aria-label="Delete">'
            + (armed ? "Sure?" : "&#128465;") + '</button></div>';
        })(state.decks[i]);
      }
    }
    h += '<button class="btn primary block" data-act="new-deck" style="margin-top:6px">＋ New deck</button>';
    return h;
  }

  function viewDetail() {
    var d = getDeck(state.deckId);
    if (!d) { state.view = "decks"; return viewDecks(); }
    var h = '<header class="top"><button class="iconbtn" data-act="back-decks" aria-label="Back">&#8592;</button>'
      + '<div class="deckname">' + esc(d.name) + '</div>'
      + '<button class="iconbtn" data-act="edit-deck" data-id="' + d.id + '" aria-label="Rename">&#9998;</button></header>';
    h += '<button class="btn primary block" data-act="study-deck" data-id="' + d.id + '"'
      + (d.cards.length ? "" : " disabled style=\\"opacity:.4\\"") + '>&#9654; Study this deck</button>';
    h += '<div style="height:14px"></div>';
    if (!d.cards.length) {
      h += '<div class="empty"><div class="big">&#128196;</div><div>No cards yet.<br>Add your first card below.</div></div>';
    }
    for (var i = 0; i < d.cards.length; i++) {
      (function (c) {
        var armed = state.armDelete === "card:" + c.id;
        h += '<div class="cardrow"><div class="tx"><div class="fr">' + esc(c.front) + '</div>'
          + '<div class="bk">' + esc(c.back) + '</div></div>'
          + '<button class="mini" data-act="edit-card" data-id="' + c.id + '" aria-label="Edit">&#9998;</button>'
          + '<button class="mini danger' + (armed ? " armed" : "") + '" data-act="del-card" data-id="' + c.id + '" aria-label="Delete">'
          + (armed ? "Sure?" : "&#128465;") + '</button></div>';
      })(d.cards[i]);
    }
    h += '<button class="btn ghost block" data-act="add-card" style="margin-top:6px">＋ Add card</button>';
    return h;
  }

  function viewStudy() {
    var st = state.study;
    var deck = st ? getDeck(st.deckId) : null;
    if (!st || !deck) { state.view = "decks"; return viewDecks(); }
    var card = getCard(deck, st.order[st.pos]);
    if (!card) { state.view = "decks"; return viewDecks(); }
    var h = '<header class="top"><button class="iconbtn" data-act="exit-study" aria-label="Exit">&#8592;</button>'
      + '<div class="deckname">' + esc(deck.name) + '</div>';
    if (CFG.shuffle) {
      h += '<button class="iconbtn' + (st.shuffle ? " on" : "") + '" data-act="toggle-shuffle" aria-label="Shuffle">&#128256;</button>';
    }
    h += '</header>';
    if (CFG.progress) {
      var pct = Math.round((st.pos + 1) / st.order.length * 100);
      h += '<div class="prog"><div style="width:' + pct + '%"></div></div>'
        + '<div class="proglabel">Card ' + (st.pos + 1) + " of " + st.order.length + (st.shuffle ? " · shuffled" : "") + '</div>';
    }
    h += '<div class="stage" id="stage"><div class="fcard flip-' + CFG.flip + (st.flipped ? " flipped" : "") + '" id="fcard">'
      + '<div class="finner"><div class="face front"><div class="tag">Front</div><div class="ftext">' + esc(card.front) + '</div>'
      + '<div class="fhint">tap to flip</div></div>'
      + '<div class="face back"><div class="tag">Back</div><div class="ftext">' + esc(card.back) + '</div>'
      + '<div class="fhint">tap to flip back</div></div></div></div></div>';
    if (CFG.grade && st.flipped) {
      h += '<div class="graderow"><button class="btn missed" data-act="grade-missed">&#10007; Missed</button>'
        + '<button class="btn got" data-act="grade-got">&#10003; Got it</button></div>';
    } else {
      h += '<div class="navrow"><button class="btn ghost" data-act="prev-card">&#8592; Prev</button>'
        + '<button class="btn primary" data-act="next-card">Next &#8594;</button></div>';
      if (CFG.grade) h += '<div class="gradetip">Flip the card, then grade yourself.</div>';
    }
    return h;
  }

  function viewSummary() {
    var s = state.summary || { got: 0, total: 0, missed: [] };
    var h = '<header class="top"><button class="iconbtn" data-act="back-decks" aria-label="Back">&#8592;</button>'
      + '<div class="deckname">Session complete</div></header>';
    h += '<div class="sumscore">';
    if (CFG.grade && s.total > 0) {
      var pct = Math.round(s.got / s.total * 100);
      h += '<div class="pct">' + pct + '%</div><div class="frac">' + s.got + " of " + s.total + " correct</div>";
    } else {
      h += '<div class="pct">&#127881;</div><div class="frac">You reviewed ' + s.total + (s.total === 1 ? " card" : " cards") + ".</div>";
    }
    h += '</div>';
    if (CFG.grade && s.missed.length) {
      h += '<div class="missedlist"><div class="mh">Review these</div>';
      for (var i = 0; i < s.missed.length; i++) h += '<div class="mi">' + esc(s.missed[i]) + '</div>';
      h += '</div>';
    }
    h += '<button class="btn primary block" data-act="again">Study again</button>'
      + '<div style="height:10px"></div>'
      + '<button class="btn ghost block" data-act="back-decks">Back to decks</button>';
    return h;
  }

  function viewModal() {
    var m = state.modal;
    if (!m) return "";
    var h = '<div class="modalwrap" data-act="cancel-modal"><div class="sheet" id="sheet">';
    if (m.kind === "deck") {
      h += '<h2>' + (m.deckId ? "Rename deck" : "New deck") + '</h2>'
        + '<input class="field" id="f-name" maxlength="60" placeholder="Deck name" value="' + esc(m.name || "") + '">'
        + '<div class="row"><button class="btn ghost" data-act="cancel-modal">Cancel</button>'
        + '<button class="btn primary" data-act="save-deck">Save</button></div>';
    } else {
      h += '<h2>' + (m.cardId ? "Edit card" : "New card") + '</h2>'
        + '<textarea class="field" id="f-front" maxlength="500" placeholder="Front — question or term">' + esc(m.front || "") + '</textarea>'
        + '<textarea class="field" id="f-back" maxlength="1000" placeholder="Back — answer or definition">' + esc(m.back || "") + '</textarea>'
        + '<div class="row"><button class="btn ghost" data-act="cancel-modal">Cancel</button>'
        + '<button class="btn primary" data-act="save-card">Save</button></div>';
    }
    return h + '</div></div>';
  }

  function render() {
    var app = document.getElementById("app");
    var h = "";
    if (state.view === "decks") h = viewDecks();
    else if (state.view === "detail") h = viewDetail();
    else if (state.view === "study") h = viewStudy();
    else if (state.view === "summary") h = viewSummary();
    h += viewModal();
    app.innerHTML = h;
    bindSwipe();
  }

  function bindSwipe() {
    var stage = document.getElementById("stage");
    if (!stage) return;
    var sx = 0, moved = false;
    stage.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) { sx = e.touches[0].clientX; moved = false; }
    }, { passive: true });
    stage.addEventListener("touchmove", function (e) {
      if (e.touches.length === 1 && Math.abs(e.touches[0].clientX - sx) > 12) moved = true;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (e.changedTouches.length !== 1 || !moved) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (dx < -60) studyAdvance(1);
      else if (dx > 60) studyAdvance(-1);
    }, { passive: true });
    stage.addEventListener("pointerup", function (e) {
      if (moved) return;
      var t = e.target && e.target.closest ? e.target.closest("#fcard") : null;
      if (t && state.study) {
        e.preventDefault();
        state.study.flipped = !state.study.flipped;
        t.classList.toggle("flipped", state.study.flipped);
        var showGrade = CFG.grade && state.study.flipped;
        setTimeout(function () { render(); }, showGrade ? 320 : 160);
      }
    });
  }

  function act(name, el) {
    state.armDelete = (name === "del-deck" || name === "del-card") ? state.armDelete : null;
    var id = el.getAttribute("data-id");
    if (name === "new-deck") { state.modal = { kind: "deck", deckId: null, name: "" }; }
    else if (name === "edit-deck") {
      var d0 = getDeck(id);
      state.modal = { kind: "deck", deckId: id, name: d0 ? d0.name : "" };
    }
    else if (name === "save-deck") {
      var nm = document.getElementById("f-name");
      var v = nm ? nm.value.trim() : "";
      if (!v) return;
      if (state.modal && state.modal.deckId) { var d1 = getDeck(state.modal.deckId); if (d1) d1.name = v; }
      else state.decks.push({ id: uid("d"), name: v, cards: [] });
      state.modal = null; save();
    }
    else if (name === "del-deck") {
      if (state.armDelete === "deck:" + id) {
        state.decks = state.decks.filter(function (d) { return d.id !== id; });
        delete state.scores[id];
        state.armDelete = null; save();
        if (state.deckId === id) { state.deckId = null; state.view = "decks"; }
      } else state.armDelete = "deck:" + id;
    }
    else if (name === "open-deck") { state.deckId = id; state.view = "detail"; }
    else if (name === "add-card") { state.modal = { kind: "card", cardId: null, front: "", back: "" }; }
    else if (name === "edit-card") {
      var dd = getDeck(state.deckId), cc = dd ? getCard(dd, id) : null;
      state.modal = { kind: "card", cardId: id, front: cc ? cc.front : "", back: cc ? cc.back : "" };
    }
    else if (name === "save-card") {
      var f = document.getElementById("f-front"), b = document.getElementById("f-back");
      var fv = f ? f.value.trim() : "", bv = b ? b.value.trim() : "";
      if (!fv || !bv) return;
      var d2 = getDeck(state.deckId);
      if (d2) {
        if (state.modal && state.modal.cardId) {
          var c2 = getCard(d2, state.modal.cardId);
          if (c2) { c2.front = fv; c2.back = bv; }
        } else d2.cards.push({ id: uid("c"), front: fv, back: bv });
        save();
      }
      state.modal = null;
    }
    else if (name === "del-card") {
      if (state.armDelete === "card:" + id) {
        var d3 = getDeck(state.deckId);
        if (d3) d3.cards = d3.cards.filter(function (c) { return c.id !== id; });
        state.armDelete = null; save();
      } else state.armDelete = "card:" + id;
    }
    else if (name === "study-deck") { startStudy(id); return; }
    else if (name === "exit-study") { state.study = null; state.view = "decks"; }
    else if (name === "back-decks") { state.study = null; state.view = "decks"; }
    else if (name === "prev-card") { studyAdvance(-1); return; }
    else if (name === "next-card") { studyAdvance(1); return; }
    else if (name === "toggle-shuffle") {
      var st = state.study;
      if (st) {
        st.shuffle = !st.shuffle;
        var rest = st.order.slice(st.pos + 1);
        if (st.shuffle) rest = shuffleArr(rest);
        st.order = st.order.slice(0, st.pos + 1).concat(rest);
      }
    }
    else if (name === "grade-got" || name === "grade-missed") {
      var st2 = state.study;
      if (st2) {
        st2.results[st2.order[st2.pos]] = name === "grade-got" ? "got" : "missed";
        studyAdvance(1); return;
      }
    }
    else if (name === "again") {
      var sid = state.summary ? state.summary.deckId : null;
      state.summary = null;
      if (sid) { startStudy(sid); return; }
      state.view = "decks";
    }
    else if (name === "cancel-modal") { state.modal = null; }
    render();
  }

  document.addEventListener("pointerup", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
    if (!t) return;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    e.preventDefault();
    var sheet = document.getElementById("sheet");
    if (t.getAttribute("data-act") === "cancel-modal" && sheet && sheet.contains(e.target) && t !== sheet) return;
    act(t.getAttribute("data-act"), t);
  });

  load();
  render();
})();
</script>
</body>
</html>`;

    return html;
  }

  window.MoorKit = { build: build };
})();
