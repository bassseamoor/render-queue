"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("scene");
  const frame = $("frame");
  const STYLE = {
    MN: {
      title: "The Winter Manor", note: "QUIET FIRE · COLD GLASS · WARM STONE",
      wall: ["#26302e", "#1b2322", "#141a1a"], panel: "#35403c",
      stone: ["#c6b99e", "#918572", "#e0d3b6"], trim: "#e0d1b2",
      wood: ["#513a2d", "#241d19", "#795640"], metal: "#383937",
      fire: ["#5c2a1b", "#3b211a"], rug: "#28342d", fabric: "#293630",
      detail: "limestone"
    },
    AL: {
      title: "The Alpine Lodge", note: "HAND-HEWN OAK · SLATE · DEEP WINTER",
      wall: ["#392d25", "#251f1a", "#181715"], panel: "#59412e",
      stone: ["#857968", "#514d43", "#b5a58a"], trim: "#c49764",
      wood: ["#845b3b", "#3a291f", "#ad7b4d"], metal: "#393633",
      fire: ["#563020", "#332019"], rug: "#414032", fabric: "#3b342a",
      detail: "timber"
    },
    MD: {
      title: "Quiet Modern", note: "SMOKED PLASTER · BLACK STEEL · LOW FLAME",
      wall: ["#343a39", "#252c2b", "#191f1e"], panel: "#505754",
      stone: ["#c0beb3", "#8f958e", "#e3ded0"], trim: "#ded9ca",
      wood: ["#50463a", "#292723", "#776750"], metal: "#202524",
      fire: ["#44271d", "#211b18"], rug: "#353934", fabric: "#353c37",
      detail: "plaster"
    },
    GT: {
      title: "The Old Stone Room", note: "CARVED STONE · DARK GREEN · CANDLE GLOW",
      wall: ["#24302f", "#1a2424", "#111918"], panel: "#35423f",
      stone: ["#869087", "#4c5a54", "#b1b29b"], trim: "#c0b28e",
      wood: ["#3f3128", "#211e1a", "#6d5238"], metal: "#333c39",
      fire: ["#49271e", "#2c1d19"], rug: "#25332e", fabric: "#293735",
      detail: "carved"
    }
  };
  const STYLE_CODES = Object.keys(STYLE);
  const FIRE_WORDS = ["Embers", "Gentle", "Steady", "Lively"];
  const SNOW_WORDS = ["Clear", "Sparse", "Soft", "Drifting"];
  const LOOP_SECONDS = 15;
  let config;
  let bgCache = null;
  let bgKey = "";
  let manualStart = performance.now();

  function hash(value) {
    let h = 2166136261;
    const text = String(value);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function rngFor(value) {
    let a = hash(value) || 1;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randomHex4() {
    const bytes = new Uint16Array(1);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else bytes[0] = Math.floor(Math.random() * 65536);
    return bytes[0].toString(16).toUpperCase().padStart(4, "0");
  }
  function seedFor(c) {
    return "HEARTH1-" + c.style + "-" + c.variant + "-" + c.fire + c.snow;
  }
  function configFromSeed(seed) {
    const m = /^HEARTH1-(MN|AL|MD|GT)-([0-9A-F]{4})-([1-4])([0-3])$/i.exec(String(seed || ""));
    if (m) return { style: m[1].toUpperCase(), variant: m[2].toUpperCase(), fire: +m[3], snow: +m[4] };
    const r = rngFor(seed || "winter-room");
    return {
      style: STYLE_CODES[Math.floor(r() * STYLE_CODES.length)],
      variant: Math.floor(r() * 65536).toString(16).toUpperCase().padStart(4, "0"),
      fire: 1 + Math.floor(r() * 4),
      snow: Math.floor(r() * 4)
    };
  }
  function newConfig() {
    const r = rngFor("new:" + Date.now() + ":" + randomHex4());
    return {
      style: STYLE_CODES[Math.floor(r() * STYLE_CODES.length)],
      variant: randomHex4(),
      fire: 1 + Math.floor(r() * 4),
      snow: Math.floor(r() * 4)
    };
  }
  function urlWithConfig(c) {
    const u = new URL(location.href);
    u.searchParams.delete("render");
    u.searchParams.delete("fps");
    u.searchParams.delete("seconds");
    u.searchParams.delete("w");
    u.searchParams.delete("h");
    u.searchParams.delete("qid");
    u.searchParams.set("seed", seedFor(c));
    return u;
  }
  function syncUrl() {
    if (new URLSearchParams(location.search).get("render") === "1") return;
    try { history.replaceState(null, "", urlWithConfig(config)); } catch (e) {}
  }
  function applyConfig(next, updateUrl) {
    config = {
      style: STYLE[next.style] ? next.style : "MN",
      variant: /^[0-9A-F]{4}$/i.test(next.variant) ? next.variant.toUpperCase() : "8F31",
      fire: Math.max(1, Math.min(4, +next.fire || 1)),
      snow: Math.max(0, Math.min(3, +next.snow || 0))
    };
    $("seedChip").textContent = seedFor(config);
    $("fire").value = config.fire;
    $("snow").value = config.snow;
    $("fireOut").textContent = FIRE_WORDS[config.fire - 1];
    $("snowOut").textContent = SNOW_WORDS[config.snow];
    document.querySelectorAll(".preset").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.style === config.style)));
    const preset = STYLE[config.style];
    $("sceneTitle").textContent = preset.title;
    $("sceneNote").textContent = preset.note;
    bgCache = null;
    bgKey = "";
    if (updateUrl) syncUrl();
  }

  function roundRectPath(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function linear(c, x1, y1, x2, y2, stops) {
    const g = c.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    return g;
  }
  function fillRound(c, x, y, w, h, r, fill, stroke, lineWidth) {
    roundRectPath(c, x, y, w, h, r);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = lineWidth || 1; c.strokeStyle = stroke; c.stroke(); }
  }
  function geometry(w, preset) {
    const portrait = w < 760;
    const square = !portrait && w < 1260;
    let win, fire, sofa, table;
    if (portrait) {
      win = { x: w * .60, y: 72, w: w * .33, h: 242 };
      fire = { x: w * .09, y: 332, w: w * .82, h: 432 };
      sofa = { x: w * .035, y: 820, w: w * .93, h: 170 };
      table = null;
    } else if (square) {
      win = { x: w * .055, y: 112, w: w * .255, h: 494 };
      fire = { x: w * .515, y: 306, w: w * .425, h: 453 };
      sofa = { x: w * .025, y: 794, w: w * .43, h: 190 };
      table = { x: w * .385, y: 799, w: w * .14, h: 90 };
    } else {
      win = { x: w * .058, y: 116, w: w * .276, h: 500 };
      fire = { x: w * .59, y: 299, w: w * .35, h: 464 };
      sofa = { x: w * .022, y: 792, w: w * .355, h: 192 };
      table = { x: w * .42, y: 814, w: w * .13, h: 84 };
    }
    const modern = preset.detail === "plaster";
    const margin = modern ? .13 : .18;
    const box = {
      x: fire.x + fire.w * margin,
      y: fire.y + fire.h * .34,
      w: fire.w * (1 - margin * 2),
      h: fire.h * .54
    };
    return { portrait, square, win, fire, box, sofa, table, floorY: 758 };
  }
  function drawPine(c, x, base, size, color) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x, base - size); c.lineTo(x - size * .45, base - size * .35);
    c.lineTo(x - size * .23, base - size * .35); c.lineTo(x - size * .64, base);
    c.lineTo(x + size * .64, base); c.lineTo(x + size * .22, base - size * .36);
    c.lineTo(x + size * .47, base - size * .36); c.closePath(); c.fill();
    c.fillStyle = "#171d20"; c.fillRect(x - size * .035, base - size * .22, size * .07, size * .22);
  }
  function windowPath(c, r, arch) {
    c.beginPath();
    if (arch) {
      c.moveTo(r.x, r.y + r.h); c.lineTo(r.x, r.y + r.w * .48);
      c.quadraticCurveTo(r.x + r.w * .5, r.y - r.w * .18, r.x + r.w, r.y + r.w * .48);
      c.lineTo(r.x + r.w, r.y + r.h);
    } else {
      c.rect(r.x, r.y, r.w, r.h);
    }
    c.closePath();
  }
  function drawWindow(c, r, preset, seed) {
    const arch = preset.detail === "carved";
    c.save();
    windowPath(c, r, arch); c.clip();
    c.fillStyle = linear(c, r.x, r.y, r.x + r.w, r.y + r.h,
      [[0, "#172333"], [.45, "#263c4b"], [1, "#111b22"]]);
    c.fillRect(r.x, r.y - 40, r.w, r.h + 80);
    const moon = c.createRadialGradient(r.x + r.w * .73, r.y + r.h * .22, 2, r.x + r.w * .73, r.y + r.h * .22, r.w * .32);
    moon.addColorStop(0, "#d5d4c699"); moon.addColorStop(.18, "#b8c7c733"); moon.addColorStop(1, "#bdced300");
    c.fillStyle = moon; c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = "#d8d6c5"; c.globalAlpha = .8;
    c.beginPath(); c.arc(r.x + r.w * .73, r.y + r.h * .22, Math.max(5, r.w * .045), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.fillStyle = "#71818a"; c.globalAlpha = .22;
    c.beginPath(); c.moveTo(r.x, r.y + r.h * .69); c.quadraticCurveTo(r.x + r.w * .43, r.y + r.h * .57, r.x + r.w, r.y + r.h * .72); c.lineTo(r.x + r.w, r.y + r.h); c.lineTo(r.x, r.y + r.h); c.fill(); c.globalAlpha = 1;
    const rand = rngFor("pines:" + seed + ":" + preset.detail);
    for (let i = 0; i < 9; i++) {
      const x = r.x - r.w * .08 + rand() * r.w * 1.16;
      const base = r.y + r.h * (.88 + rand() * .09);
      const size = r.h * (.19 + rand() * .29);
      drawPine(c, x, base, size, ["#172322", "#1b292a", "#202f32"][i % 3]);
    }
    c.fillStyle = linear(c, r.x, r.y + r.h * .65, r.x, r.y + r.h,
      [[0, "#dce7e71c"], [1, "#dce7e700"]]);
    c.fillRect(r.x, r.y + r.h * .62, r.w, r.h * .38);
    c.restore();
    const woodFrame = preset.detail === "plaster" ? preset.metal : preset.wood[1];
    fillRound(c, r.x - 7, r.y - 7, r.w + 14, r.h + 14, arch ? r.w * .43 : 5, "rgba(0,0,0,0)", "#111615", 10);
    c.strokeStyle = linear(c, r.x, r.y, r.x + r.w, r.y, [[0, preset.trim], [1, woodFrame]]);
    c.lineWidth = preset.detail === "plaster" ? 8 : 12;
    windowPath(c, r, arch); c.stroke();
    c.strokeStyle = "#e3d7bd55"; c.lineWidth = 2;
    if (arch) {
      c.beginPath(); c.moveTo(r.x + r.w * .5, r.y + r.w * .29); c.lineTo(r.x + r.w * .5, r.y + r.h); c.stroke();
      c.beginPath(); c.moveTo(r.x, r.y + r.h * .55); c.lineTo(r.x + r.w, r.y + r.h * .55); c.stroke();
    } else {
      c.beginPath(); c.moveTo(r.x + r.w * .5, r.y); c.lineTo(r.x + r.w * .5, r.y + r.h); c.stroke();
      c.beginPath(); c.moveTo(r.x, r.y + r.h * .57); c.lineTo(r.x + r.w, r.y + r.h * .57); c.stroke();
    }
    c.fillStyle = "#dde4d822";
    c.beginPath(); c.moveTo(r.x + r.w * .08, r.y + 14); c.lineTo(r.x + r.w * .12, r.y + 14); c.lineTo(r.x + r.w * .12, r.y + r.h * .36); c.lineTo(r.x + r.w * .08, r.y + r.h * .31); c.fill();
  }
  function drawWall(c, w, p, seed) {
    const wall = c.createLinearGradient(0, 0, w, 1000);
    wall.addColorStop(0, p.wall[0]); wall.addColorStop(.5, p.wall[1]); wall.addColorStop(1, p.wall[2]);
    c.fillStyle = wall; c.fillRect(0, 0, w, 1000);
    const glow = c.createRadialGradient(w * .68, 490, 20, w * .68, 490, 620);
    glow.addColorStop(0, "#d28c4d0a"); glow.addColorStop(1, "#d28c4d00");
    c.fillStyle = glow; c.fillRect(0, 0, w, 790);
    c.fillStyle = "#111614"; c.fillRect(0, 0, w, 74);
    c.fillStyle = linear(c, 0, 70, 0, 102, [[0, p.wood[2]], [.45, p.wood[0]], [1, p.wood[1]]]);
    c.fillRect(0, 66, w, 22);
    c.fillStyle = "#e4d6b722"; c.fillRect(0, 66, w, 2);
    c.fillStyle = p.panel;
    if (p.detail !== "plaster") {
      for (let x = 0; x < w; x += Math.max(84, Math.min(210, w * .115))) {
        c.globalAlpha = .25; c.fillRect(x, 105, 2, 620);
        c.globalAlpha = .11; c.fillRect(x + 5, 108, 1, 615);
      }
      c.globalAlpha = 1;
      c.fillStyle = "#0f1413"; c.fillRect(0, 715, w, 40);
      c.fillStyle = linear(c, 0, 715, 0, 755, [[0, p.wood[0]], [1, p.wood[1]]]); c.fillRect(0, 716, w, 7);
      c.fillStyle = "#d4c6a31c"; c.fillRect(0, 726, w, 2);
      c.fillStyle = p.panel; c.fillRect(0, 743, w, 4);
    } else {
      c.fillStyle = "#e1ded422"; c.fillRect(0, 180, w, 2);
      c.fillStyle = "#111816"; c.fillRect(0, 716, w, 2);
      c.fillStyle = "#dfd8c416"; c.fillRect(0, 719, w, 32);
    }
    c.fillStyle = "#080b0a88"; c.fillRect(0, 88, w, 9);
    c.fillStyle = "#d2c2a04a"; c.fillRect(0, 96, w, 3);
    const rand = rngFor("wallgrain:" + seed + ":" + p.detail);
    if (p.detail === "timber") {
      c.save(); c.globalAlpha = .11; c.strokeStyle = "#d9ae77"; c.lineWidth = 1;
      for (let i = 0; i < 68; i++) {
        const x = rand() * w, y = 118 + rand() * 560, len = 8 + rand() * 90;
        c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * .3, y - 3, x + len * .7, y + 3, x + len, y + 1); c.stroke();
      }
      c.restore();
    }
    const floor = c.createLinearGradient(0, 758, 0, 1000);
    floor.addColorStop(0, "#302820"); floor.addColorStop(.26, "#211d19"); floor.addColorStop(1, "#111312");
    c.fillStyle = floor; c.fillRect(0, 758, w, 242);
    c.fillStyle = "#0b0e0d"; c.fillRect(0, 758, w, 8);
    c.strokeStyle = "#c4a97a24"; c.lineWidth = 2;
    for (let y = 804; y < 1000; y += 47) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    c.strokeStyle = "#0b0e0d55"; c.lineWidth = 2;
    for (let x = 0; x < w; x += 235) {
      c.beginPath(); c.moveTo(x + 55, 760); c.lineTo(x - 35, 1000); c.stroke();
    }
    c.save();
    const vignette = c.createRadialGradient(w * .53, 420, 150, w * .53, 460, Math.max(w, 1000));
    vignette.addColorStop(0, "#00000000"); vignette.addColorStop(1, "#0507068c");
    c.fillStyle = vignette; c.fillRect(0, 0, w, 1000); c.restore();
  }
  function stoneBlock(c, x, y, w, h, p, radius) {
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, p.stone[2]); g.addColorStop(.23, p.stone[0]); g.addColorStop(.62, p.stone[1]); g.addColorStop(1, p.stone[0]);
    fillRound(c, x, y, w, h, radius || 5, g, "#0f141279", 2);
    c.save(); c.beginPath(); c.rect(x + 2, y + 2, w - 4, h - 4); c.clip();
    c.strokeStyle = "#f1e8d42c"; c.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const yy = y + h * i / 5;
      c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy + (i % 2 ? 2 : -2)); c.stroke();
    }
    c.restore();
  }
  function drawFireplace(c, w, g, p, seed) {
    const f = g.fire, b = g.box, modern = p.detail === "plaster", gothic = p.detail === "carved";
    c.save();
    c.shadowColor = "#050706aa"; c.shadowBlur = 26; c.shadowOffsetY = 16;
    if (modern) {
      fillRound(c, f.x - 18, f.y + 24, f.w + 36, f.h - 12, 3,
        linear(c, f.x, f.y, f.x + f.w, f.y + f.h, [[0, "#575d58"], [.5, "#333b38"], [1, "#222a28"]]), "#c9c5b4aa", 2);
    } else {
      stoneBlock(c, f.x, f.y, f.w, f.h, p, gothic ? 45 : 5);
      stoneBlock(c, f.x - f.w * .05, f.y + f.h * .19, f.w * 1.10, f.h * .14, p, gothic ? 23 : 4);
      stoneBlock(c, f.x - f.w * .10, f.y + f.h * .09, f.w * 1.20, f.h * .12, p, 5);
      stoneBlock(c, f.x - f.w * .13, f.y + f.h * .78, f.w * 1.26, f.h * .12, p, 5);
      stoneBlock(c, f.x - f.w * .17, f.y + f.h * .89, f.w * 1.34, f.h * .10, p, 4);
      stoneBlock(c, f.x - f.w * .04, f.y + f.h * .30, f.w * .13, f.h * .48, p, 3);
      stoneBlock(c, f.x + f.w * .91, f.y + f.h * .30, f.w * .13, f.h * .48, p, 3);
      c.fillStyle = "#f1e7d05d"; c.fillRect(f.x - f.w * .10, f.y + f.h * .10, f.w * 1.2, 3);
      if (gothic) {
        c.strokeStyle = "#d8cfb063"; c.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const xx = f.x + f.w * (.18 + i * .16);
          c.beginPath(); c.moveTo(xx, f.y + f.h * .21); c.lineTo(xx, f.y + f.h * .30); c.stroke();
        }
      } else if (p.detail === "timber") {
        c.strokeStyle = "#d0a36a73"; c.lineWidth = 4;
        c.beginPath(); c.moveTo(f.x - f.w * .09, f.y + f.h * .105); c.lineTo(f.x + f.w * 1.09, f.y + f.h * .105); c.stroke();
      }
    }
    c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetY = 0;
    const opening = c.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    opening.addColorStop(0, "#141513"); opening.addColorStop(.64, p.fire[0]); opening.addColorStop(1, "#171311");
    if (gothic) {
      c.beginPath(); c.moveTo(b.x, b.y + b.h); c.lineTo(b.x, b.y + b.w * .45);
      c.quadraticCurveTo(b.x + b.w * .50, b.y - b.w * .24, b.x + b.w, b.y + b.w * .45);
      c.lineTo(b.x + b.w, b.y + b.h); c.closePath();
      c.fillStyle = opening; c.fill(); c.strokeStyle = "#101514"; c.lineWidth = 7; c.stroke();
    } else {
      fillRound(c, b.x, b.y, b.w, b.h, modern ? 1 : Math.min(36, b.w * .07), opening, "#111514", modern ? 5 : 8);
    }
    const logY = b.y + b.h * .82;
    c.lineCap = "round";
    c.lineWidth = Math.max(8, b.h * .105);
    c.strokeStyle = linear(c, b.x, logY, b.x + b.w, logY + 8, [[0, p.wood[0]], [.5, p.wood[1]], [1, p.wood[2]]]);
    c.beginPath(); c.moveTo(b.x + b.w * .20, logY + b.h * .035); c.lineTo(b.x + b.w * .77, logY - b.h * .025); c.stroke();
    c.strokeStyle = p.wood[1]; c.lineWidth = Math.max(5, b.h * .07);
    c.beginPath(); c.moveTo(b.x + b.w * .32, logY - b.h * .015); c.lineTo(b.x + b.w * .84, logY + b.h * .03); c.stroke();
    c.fillStyle = "#f88b36"; c.globalAlpha = .64;
    for (let i = 0; i < 6; i++) {
      const ember = rngFor(seed + ":coal:" + i)();
      c.beginPath(); c.arc(b.x + b.w * (.19 + ember * .62), logY + b.h * .08, 2 + ember * 4, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    if (!modern) {
      c.fillStyle = "#e9ddc3"; c.globalAlpha = .88;
      const mant = { x: f.x - f.w * .21, y: f.y + f.h * .17, w: f.w * 1.42, h: f.h * .055 };
      fillRound(c, mant.x, mant.y, mant.w, mant.h, 4, linear(c, mant.x, mant.y, mant.x, mant.y + mant.h, [[0, p.stone[2]], [1, p.stone[0]]]), "#151917", 2);
      c.globalAlpha = 1;
      c.fillStyle = "#f4e4c7"; c.globalAlpha = .65; c.fillRect(mant.x + 5, mant.y + 3, mant.w - 10, 2); c.globalAlpha = 1;
      const bookX = mant.x + mant.w * .15;
      fillRound(c, bookX, mant.y - 13, mant.w * .19, 8, 1, "#49352b", "#171916", 1);
      fillRound(c, bookX + 5, mant.y - 21, mant.w * .17, 8, 1, "#785a3f", "#171916", 1);
      const candleX = mant.x + mant.w * .79;
      fillRound(c, candleX, mant.y - 20, mant.w * .035, 20, 2, "#d9cfb4", "#443d31", 1);
      c.fillStyle = "#ffd487"; c.beginPath(); c.ellipse(candleX + mant.w * .017, mant.y - 23, mant.w * .018, 5, 0, 0, Math.PI * 2); c.fill();
    } else {
      c.fillStyle = "#d8d3c8"; c.fillRect(f.x - f.w * .12, f.y + f.h * .18, f.w * 1.24, 9);
      c.fillStyle = "#f5ebda77"; c.fillRect(f.x - f.w * .12, f.y + f.h * .18, f.w * 1.24, 2);
    }
    c.restore();
  }
  function drawRug(c, w, g, p) {
    const centerX = g.portrait ? w * .5 : g.fire.x + g.fire.w * .28;
    const rx = g.portrait ? w * .48 : Math.min(w * .29, 470);
    const ry = 112;
    c.save();
    c.translate(centerX, 875);
    c.scale(1, .40);
    const rg = c.createRadialGradient(0, 0, rx * .1, 0, 0, rx);
    rg.addColorStop(0, p.rug); rg.addColorStop(.8, p.rug); rg.addColorStop(1, "#11151400");
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#d0bc8b34"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, rx * .76, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#d0bc8b1f"; c.beginPath(); c.arc(0, 0, rx * .65, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 7; i++) {
      c.globalAlpha = .16; c.strokeStyle = i % 2 ? "#e8d5a4" : "#0c1110";
      c.beginPath(); c.ellipse((i - 3) * rx * .12, 0, rx * .12, ry * .34, 0, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1; c.restore();
  }
  function drawSofa(c, r, p) {
    c.save();
    c.shadowColor = "#0009"; c.shadowBlur = 22; c.shadowOffsetY = 15;
    const velvet = linear(c, r.x, r.y, r.x + r.w, r.y + r.h, [[0, "#101614"], [.25, p.fabric], [.7, "#202a25"], [1, "#111615"]]);
    fillRound(c, r.x, r.y + r.h * .20, r.w, r.h * .75, Math.min(32, r.w * .09), velvet, "#7d806b59", 2);
    c.shadowColor = "transparent";
    fillRound(c, r.x + r.w * .09, r.y, r.w * .82, r.h * .52, Math.min(29, r.w * .07), linear(c, r.x, r.y, r.x, r.y + r.h, [[0, "#475247"], [.5, p.fabric], [1, "#1b2521"]]), "#a9a17e32", 2);
    fillRound(c, r.x, r.y + r.h * .33, r.w * .17, r.h * .61, 22, "#242e29", "#7d806b59", 2);
    fillRound(c, r.x + r.w * .83, r.y + r.h * .33, r.w * .17, r.h * .61, 22, "#202925", "#7d806b59", 2);
    c.shadowColor = "#0008"; c.shadowBlur = 10;
    for (let i = 0; i < 2; i++) {
      const x = r.x + r.w * (.20 + i * .34);
      fillRound(c, x, r.y + r.h * .35, r.w * .30, r.h * .36, 12,
        linear(c, x, r.y + r.h * .35, x + r.w * .3, r.y + r.h * .7, [[0, "#626751"], [.6, "#41483e"], [1, "#28312b"]]), "#b4a9824a", 1);
      c.strokeStyle = "#eee0c222"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + 8, r.y + r.h * .42); c.quadraticCurveTo(x + r.w * .15, r.y + r.h * .52, x + r.w * .3 - 8, r.y + r.h * .42); c.stroke();
    }
    c.shadowColor = "transparent"; c.fillStyle = "#171c19"; c.fillRect(r.x + r.w * .13, r.y + r.h * .90, r.w * .06, r.h * .10); c.fillRect(r.x + r.w * .80, r.y + r.h * .90, r.w * .06, r.h * .10);
    c.restore();
  }
  function drawTable(c, r, p) {
    if (!r) return;
    c.save();
    c.shadowColor = "#0009"; c.shadowBlur = 10; c.shadowOffsetY = 8;
    fillRound(c, r.x, r.y, r.w, 13, 5, linear(c, r.x, r.y, r.x, r.y + 13, [[0, p.wood[2]], [1, p.wood[1]]]), "#0f1211", 2);
    c.shadowColor = "transparent";
    c.fillStyle = p.wood[1]; c.fillRect(r.x + r.w * .18, r.y + 12, 5, r.h * .67); c.fillRect(r.x + r.w * .80, r.y + 12, 5, r.h * .67);
    fillRound(c, r.x + r.w * .31, r.y - 19, r.w * .30, 18, 2, "#554338", "#171716", 1);
    fillRound(c, r.x + r.w * .34, r.y - 23, r.w * .29, 15, 2, "#877158", "#211c18", 1);
    c.fillStyle = "#c2b28a"; c.beginPath(); c.ellipse(r.x + r.w * .76, r.y - 5, r.w * .07, 5, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function drawRoom(c, w, p, seed, g) {
    drawWall(c, w, p, seed);
    drawWindow(c, g.win, p, seed);
    drawFireplace(c, w, g, p, seed);
    drawStoneFlecks(c, g, p, seed);
    drawRug(c, w, g, p);
    drawTable(c, g.table, p);
    drawSofa(c, g.sofa, p);
  }
  function drawStoneFlecks(c, g, p, seed) {
    const f = g.fire, modern = p.detail === "plaster";
    const areas = modern ? [
      { x: f.x - f.w * .05, y: f.y + f.h * .25, w: f.w * 1.1, h: f.h * .16 },
      { x: f.x - f.w * .05, y: f.y + f.h * .78, w: f.w * 1.1, h: f.h * .12 }
    ] : [
      { x: f.x, y: f.y, w: f.w, h: f.h * .09 },
      { x: f.x - f.w * .10, y: f.y + f.h * .09, w: f.w * 1.20, h: f.h * .12 },
      { x: f.x - f.w * .04, y: f.y + f.h * .30, w: f.w * .13, h: f.h * .48 },
      { x: f.x + f.w * .91, y: f.y + f.h * .30, w: f.w * .13, h: f.h * .48 },
      { x: f.x - f.w * .13, y: f.y + f.h * .78, w: f.w * 1.26, h: f.h * .12 }
    ];
    const rand = rngFor("stoneflecks:" + seed + ":" + p.detail);
    c.save(); c.globalAlpha = .15;
    areas.forEach((r, region) => {
      c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
      for (let i = 0; i < 28; i++) {
        const x = r.x + rand() * r.w, y = r.y + rand() * r.h;
        const size = .7 + rand() * 1.5;
        c.fillStyle = (i + region) % 3 ? "#f1e5cd" : "#292d29";
        c.fillRect(x, y, size, size);
      }
      c.restore();
    });
    c.restore();
  }
  function mod(n, d) { return ((n % d) + d) % d; }
  function drawSnow(c, win, seed, level, t, arch) {
    if (!level) return;
    const rand = rngFor("weather:" + seed);
    const count = level * 29;
    c.save();
    const snowWindow = { x: win.x + 8, y: win.y + 8, w: win.w - 16, h: win.h - 16 };
    windowPath(c, snowWindow, arch); c.clip();
    for (let i = 0; i < count; i++) {
      const x = rand(), y = rand(), size = .7 + rand() * (level * .55), phase = rand() * Math.PI * 2;
      const period = i % 7 === 0 ? 5 : 15;
      const drift = (rand() - .5) * win.w * .035;
      const speed = win.h / period;
      const px = win.x + x * win.w + Math.sin((Math.PI * 2 * t / period) + phase) * drift;
      const py = win.y + mod(y * win.h + t * speed, win.h);
      const alpha = .24 + .40 * (.5 + .5 * Math.sin(phase + t * Math.PI * 2 / period));
      c.globalAlpha = alpha;
      c.fillStyle = i % 11 === 0 ? "#fff9e9" : "#c5d6df";
      c.beginPath(); c.arc(px, py, size, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1; c.restore();
  }
  function drawFire(c, box, seed, fire, t) {
    const base = box.y + box.h * .88;
    const strength = fire / 4;
    const rand = rngFor("flames:" + seed);
    const count = 5 + fire * 2;
    const pulse = .88 + .07 * Math.sin(Math.PI * 2 * t / 3) + .05 * Math.sin(Math.PI * 2 * t / 5 + .7);
    const glow = c.createRadialGradient(box.x + box.w * .5, base - box.h * .36, 4, box.x + box.w * .5, base - box.h * .28, box.w * (.72 + strength * .18));
    glow.addColorStop(0, "rgba(255,142,56," + (.16 + strength * .19) + ")");
    glow.addColorStop(.42, "rgba(227,92,30," + (.055 + strength * .07) + ")");
    glow.addColorStop(1, "rgba(177,62,26,0)");
    c.save(); c.globalCompositeOperation = "screen"; c.fillStyle = glow;
    c.fillRect(0, 0, c.canvas.width / (c.canvas.height / 1000), 1000); c.restore();
    c.save();
    for (let i = 0; i < count; i++) {
      const n = i / Math.max(1, count - 1);
      const width = box.w * (.12 + rand() * .10);
      const x = box.x + box.w * (.07 + n * .82) + Math.sin(Math.PI * 2 * t / 5 + i * 1.73) * box.w * .016;
      const height = box.h * (.34 + rand() * .22 + strength * .28) * pulse;
      const tipX = x + width * (.3 + .4 * Math.sin(t * Math.PI * 2 / 3 + i));
      const gradient = c.createLinearGradient(0, base - height, 0, base);
      gradient.addColorStop(0, i % 3 === 0 ? "#fff4c8" : "#ffc356");
      gradient.addColorStop(.18, "#ffb341"); gradient.addColorStop(.50, "#ef6728");
      gradient.addColorStop(.84, "#a53b20"); gradient.addColorStop(1, "#6b2c1d00");
      c.beginPath();
      c.moveTo(x - width * .5, base);
      c.bezierCurveTo(x - width * .62, base - height * .24, tipX - width * .08, base - height * .55, tipX, base - height);
      c.bezierCurveTo(tipX + width * .38, base - height * .68, x + width * .7, base - height * .28, x + width * .5, base);
      c.closePath(); c.fillStyle = gradient; c.fill();
    }
    const core = c.createRadialGradient(box.x + box.w * .5, base - box.h * .18, 1, box.x + box.w * .5, base - box.h * .10, box.w * .32);
    core.addColorStop(0, "rgba(255,234,167," + (.42 + strength * .18) + ")"); core.addColorStop(1, "rgba(255,174,67,0)");
    c.fillStyle = core; c.fillRect(box.x, base - box.h * .4, box.w, box.h * .4);
    c.restore();
  }
  function drawEmbers(c, box, seed, t, level) {
    if (level < 2) return;
    const rand = rngFor("embers:" + seed);
    const base = box.y + box.h * .78;
    const count = 4 + level * 3;
    c.save(); c.globalCompositeOperation = "screen";
    for (let i = 0; i < count; i++) {
      const x = box.x + box.w * (.18 + rand() * .64);
      const phase = rand();
      const period = i % 4 === 0 ? 5 : 15;
      const u = mod(t / period + phase, 1);
      const y = base - u * box.h * (.66 + rand() * .2);
      const drift = Math.sin(Math.PI * 2 * u + i) * box.w * .04;
      const alpha = Math.sin(Math.PI * u) * (.3 + rand() * .45);
      c.globalAlpha = alpha;
      c.fillStyle = i % 3 ? "#ffad53" : "#ffe7a6";
      c.beginPath(); c.arc(x + drift, y, 1 + rand() * 2.1, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1; c.restore();
  }
  function renderFrame(target, time) {
    if (!target || !target.width || !target.height) return;
    const unit = target.height / 1000;
    const w = target.width / unit;
    const preset = STYLE[config.style];
    const key = [target.width, target.height, config.style, config.variant].join(":");
    if (!bgCache || key !== bgKey) {
      const pixelScale = Math.max(.45, Math.min(2, unit));
      const bg = document.createElement("canvas");
      bg.width = Math.max(1, Math.round(w * pixelScale));
      bg.height = Math.max(1, Math.round(1000 * pixelScale));
      const bctx = bg.getContext("2d", { alpha: false });
      bctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
      const geom = geometry(w, preset);
      drawRoom(bctx, w, preset, config.variant, geom);
      bgCache = { canvas: bg, geom: geom, width: target.width, height: target.height };
      bgKey = key;
    }
    const g = bgCache.geom;
    const loopTime = mod(time, LOOP_SECONDS);
    const out = target.getContext("2d", { alpha: false, desynchronized: true });
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.drawImage(bgCache.canvas, 0, 0, target.width, target.height);
    out.setTransform(unit, 0, 0, unit, 0, 0);
    drawSnow(out, g.win, config.variant, config.snow, loopTime, preset.detail === "carved");
    drawFire(out, g.box, config.variant, config.fire, loopTime);
    drawEmbers(out, g.box, config.variant, loopTime, config.fire);
    const vignette = out.createRadialGradient(w * .52, 450, 110, w * .52, 480, Math.max(w, 1000));
    vignette.addColorStop(0, "#00000000"); vignette.addColorStop(1, "#06090857");
    out.fillStyle = vignette; out.fillRect(0, 0, w, 1000);
    out.setTransform(1, 0, 0, 1, 0, 0);
  }
  function resizePreview() {
    if (window.__renderMode) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height; bgCache = null; bgKey = "";
    }
  }
  function tick(now) {
    if (window.__renderMode) {
      const rm = window.__renderMode;
      if (!rm.paused && !rm._bp && rm.phase !== "done" && rm.phase !== "cancelled" && rm.phase !== "reset") {
        if (canvas.width !== rm.W || canvas.height !== rm.H) {
          canvas.width = rm.W; canvas.height = rm.H; bgCache = null; bgKey = "";
        }
        renderFrame(canvas, rm.frame / rm.fps);
        if (rm.phase === "warmup") {
          rm.frame++;
          if (rm.frame >= rm.warmup && rm.onPhase) { try { rm.onPhase("reset"); } catch (e) {} }
        } else if (rm.phase === "record") {
          if (rm.onFrame) { try { rm.onFrame(rm.frame); } catch (e) {} }
          rm.frame++;
          if (rm.frame >= rm.totalFrames && rm.onPhase) { try { rm.onPhase("done"); } catch (e) {} }
        }
      }
    } else {
      resizePreview();
      renderFrame(canvas, ((now - manualStart) / 1000) % LOOP_SECONDS);
    }
    requestAnimationFrame(tick);
  }
  function setFormat(format, persist) {
    const portrait = format === "portrait";
    frame.dataset.format = portrait ? "portrait" : "landscape";
    $("portrait").setAttribute("aria-pressed", String(portrait));
    $("landscape").setAttribute("aria-pressed", String(!portrait));
    requestAnimationFrame(resizePreview);
    if (persist && new URLSearchParams(location.search).get("render") !== "1") {
      const u = urlWithConfig(config);
      u.searchParams.set("format", portrait ? "portrait" : "landscape");
      try { history.replaceState(null, "", u); } catch (e) {}
    }
  }
  function setStatus(message) { $("status").textContent = message || ""; }
  function downloadBlob(blob, name) {
    if (!blob) { setStatus("Could not export this frame. Try again."); return; }
    const file = new File([blob], name, { type: blob.type || "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(() => {});
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus("Still saved as " + name);
  }
  function exportStill() {
    const portrait = frame.dataset.format === "portrait";
    const off = document.createElement("canvas");
    off.width = portrait ? 1080 : 1920; off.height = portrait ? 1920 : 1080;
    renderFrame(off, 4.1);
    const name = "moor-fireplace-" + seedFor(config).toLowerCase() + ".png";
    if (off.toBlob) off.toBlob(blob => downloadBlob(blob, name), "image/png");
    else {
      const a = document.createElement("a"); a.href = off.toDataURL("image/png"); a.download = name; a.click();
    }
  }
  function startLoopExport() {
    const portrait = frame.dataset.format === "portrait";
    const url = urlWithConfig(config);
    url.searchParams.set("render", "1");
    url.searchParams.set("fps", "30");
    url.searchParams.set("seconds", String(LOOP_SECONDS));
    url.searchParams.set("w", String(portrait ? 1080 : 1920));
    url.searchParams.set("h", String(portrait ? 1920 : 1080));
    location.href = url.toString();
  }
  function copySeed() {
    const u = urlWithConfig(config);
    u.searchParams.set("format", frame.dataset.format);
    const text = u.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => setStatus("Scene link copied.")).catch(() => setStatus(text));
    } else {
      setStatus(text);
    }
  }
  const params = new URLSearchParams(location.search);
  config = configFromSeed(params.get("seed") || "HEARTH1-MN-8F31-32");
  applyConfig(config, false);
  const initialFormat = params.get("h") && params.get("w")
    ? (+params.get("h") > +params.get("w") ? "portrait" : "landscape")
    : params.get("format") === "portrait" ? "portrait" : "landscape";
  setFormat(initialFormat, false);
  document.querySelectorAll(".preset").forEach(button => {
    button.addEventListener("click", () => applyConfig(Object.assign({}, config, { style: button.dataset.style }), true));
  });
  $("fire").addEventListener("input", e => applyConfig(Object.assign({}, config, { fire: +e.target.value }), true));
  $("snow").addEventListener("input", e => applyConfig(Object.assign({}, config, { snow: +e.target.value }), true));
  $("landscape").addEventListener("click", () => setFormat("landscape", true));
  $("portrait").addEventListener("click", () => setFormat("portrait", true));
  $("newScene").addEventListener("click", () => { applyConfig(newConfig(), true); setStatus("A new room, with a fresh seed."); });
  $("remix").addEventListener("click", () => { applyConfig(Object.assign({}, config, { variant: randomHex4() }), true); setStatus("Same room family, new construction details."); });
  $("saveStill").addEventListener("click", exportStill);
  $("renderLoop").addEventListener("click", startLoopExport);
  $("copySeed").addEventListener("click", copySeed);
  window.__renderCanvas = canvas;
  window.__renderReset = function () { manualStart = performance.now(); bgCache = null; bgKey = ""; };
  /* ---- Seed Console v2 bridge (the adapter in fireplace.html reads through this) ---- */
  window.__fireplaceBridge = {
    getSeed: function () { return seedFor(config); },
    setSeed: function (s) { applyConfig(configFromSeed(s), true); },
    randomSeed: function () { return seedFor(newConfig()); },
    remixSeed: function (s) {
      var c = configFromSeed(s);
      c.variant = randomHex4();
      return seedFor(c);
    },
    styleIndex: function () { return STYLE_CODES.indexOf(config.style) + 1; },
    setStyleIndex: function (i) {
      i = Math.max(1, Math.min(4, Math.round(i)));
      applyConfig(Object.assign({}, config, { style: STYLE_CODES[i - 1] }), true);
    },
    variantNum: function () { return parseInt(config.variant, 16); },
    setVariantNum: function (v) {
      v = Math.max(0, Math.min(65535, Math.round(v)));
      applyConfig(Object.assign({}, config, { variant: v.toString(16).toUpperCase().padStart(4, "0") }), true);
    },
    getFire: function () { return config.fire; },
    setFire: function (v) { applyConfig(Object.assign({}, config, { fire: v }), true); },
    getSnow: function () { return config.snow; },
    setSnow: function (v) { applyConfig(Object.assign({}, config, { snow: v }), true); },
    canvas: function () { return canvas; }
  };
  if (window.ResizeObserver) new ResizeObserver(resizePreview).observe(frame);
  window.addEventListener("resize", resizePreview, { passive: true });
  requestAnimationFrame(() => { resizePreview(); requestAnimationFrame(tick); });
})();
