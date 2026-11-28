// Pixel garden: a few flowers along the bottom of the page, a bee flying from
// flower to flower, and a dalmatian napping in the corner. Plain canvas, no
// libraries. Sprites come from js/sprites.js.
(function () {
  'use strict';
  var S = window.SPRITES;
  var garden = document.querySelector('.garden');
  if (!S || !garden) return;
  var canvas = garden.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- sprite sheets: draw each sprite once at 1 px per pixel ------------
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function dark(h) { var c = hex(h); return 'rgb(' + c.map(function (v) { return Math.round(v * 0.55); }).join(',') + ')'; }

  function bake(sp, rows) {
    rows = rows || sp.rows;
    var h = rows.length, w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    var c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 2;
    var g = c.getContext('2d');
    var filled = function (x, y) { return y >= 0 && y < h && x >= 0 && x < (rows[y] || '').length && rows[y][x] !== '.'; };
    if (sp.outline) {
      for (var y = 0; y < h; y++) for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x]; if (ch === '.') continue;
        g.fillStyle = sp.outline === 'auto' ? dark(S.palette[ch]) : sp.outline;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          if (!filled(x + d[0], y + d[1])) g.fillRect(x + d[0] + 1, y + d[1] + 1, 1, 1);
        });
      }
    }
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < rows[yy].length; xx++) {
      var cc = rows[yy][xx]; if (cc === '.') continue;
      g.fillStyle = S.palette[cc]; g.fillRect(xx + 1, yy + 1, 1, 1);
    }
    return c;
  }

  // flower with a longer stem: repeat the last (stem) row
  function longer(sp, extra) {
    var rows = sp.rows.slice(), last = rows[rows.length - 1];
    for (var i = 0; i < extra; i++) rows.push(last);
    return bake(sp, rows);
  }

  // dog breathing: second frame lifts the back by one pixel
  function dogFrames() {
    var rows = S.dog.rows, w = rows[0].length, blank = new Array(w + 1).join('.');
    var a = [blank].concat(rows);
    var b = a.map(function (r) { return r.split(''); });
    for (var x = 3; x <= 21; x++) {
      for (var y = 1; y < b.length; y++) if (b[y][x] !== '.') { b[y - 1][x] = 'W'; break; }
    }
    return [bake(S.dog, a), bake(S.dog, b.map(function (r) { return r.join(''); }))];
  }

  var FLOWER_TYPES = ['daisy', 'tulip', 'cosmos', 'bluebell'];
  var bee = [bake(S.bee0), bake(S.bee1)];
  var dog = dogFrames();
  var zed = bake(S.z);
  var grass = bake(S.grass);

  // deterministic "random" so the garden looks the same on every visit
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ---- layout ---------------------------------------------------------------
  var W, H, DPR, P, ground, flowers, tufts, dogPos;
  function layout() {
    var r = garden.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    P = W < 600 ? 3 : (W < 1200 ? 4 : 5);     // CSS px per sprite pixel
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.imageSmoothingEnabled = false;
    ground = H - Math.round(P * 3) - (parseFloat(getComputedStyle(garden).paddingBottom) || 0);

    seed = 7;
    var dogW = dog[0].width * P, pad = Math.max(16, W * 0.045);
    dogPos = { x: Math.round(W - pad - dogW), y: ground - dog[0].height * P };

    // wide screens (garden pinned behind the page): keep flowers right of the text
    var left = pad;
    if (window.matchMedia('(min-width: 900px)').matches) {
      var bio = document.querySelector('.bio');
      if (bio) left = Math.max(left, bio.getBoundingClientRect().right + P * 10);
    }
    var span = dogPos.x - left - P * 10;
    var n = Math.max(3, Math.min(8, Math.floor(span / (P * 22))));
    flowers = [];
    for (var i = 0; i < n; i++) {
      var type = FLOWER_TYPES[i % FLOWER_TYPES.length];
      var img = longer(S[type], Math.round(rnd() * 12));
      var cx = left + span * (i + 0.5) / n + (rnd() - 0.5) * span / n * 0.5;
      var x = Math.round(cx - img.width * P / 2);
      flowers.push({ img: img, x: x, y: ground - img.height * P,
                     head: { x: x + img.width * P / 2, y: ground - img.height * P + P * 6 } });
    }
    tufts = [];
    for (var t = 0; t < n + 3; t++) tufts.push(Math.round(left + rnd() * (dogPos.x - left - P * 6)));
  }

  function snap(v) { return Math.round(v * DPR) / DPR; }
  function draw(img, x, y, flip) {
    var w = img.width * P, h = img.height * P;
    x = snap(x); y = snap(y);
    if (flip) {
      ctx.save(); ctx.translate((x + w) * DPR, y * DPR); ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w * DPR, h * DPR); ctx.restore();
    } else ctx.drawImage(img, x * DPR, y * DPR, w * DPR, h * DPR);
  }

  // ---- bee ----------------------------------------------------------------------
  var b = { x: 0, y: 0, from: null, to: 0, t0: 0, dur: 0, hoverUntil: 0, arc: 0, flip: false, mode: 'hover' };
  function beeStart(now) {
    var f = flowers[0];
    b.x = f.head.x; b.y = f.head.y - P * 8; b.to = 0; b.mode = 'hover'; b.hoverUntil = now + 1200;
  }
  function beeNext(now) {
    var next;
    do { next = Math.floor(Math.random() * flowers.length); } while (flowers.length > 1 && next === b.to);
    var f = flowers[next];
    b.from = { x: b.x, y: b.y };
    b.target = { x: f.head.x + (Math.random() - 0.5) * P * 4, y: f.head.y - P * 8 };
    var dist = Math.hypot(b.target.x - b.x, b.target.y - b.y);
    b.dur = Math.max(1400, dist / 0.11);                     // ~110 px per second
    b.arc = Math.min(Math.max(0, b.from.y - P * 12) * 0.9, 40 + dist * 0.25) * (0.6 + Math.random() * 0.5);
    b.t0 = now; b.to = next; b.mode = 'fly';
    b.flip = b.target.x < b.x;
  }
  function beeUpdate(now) {
    if (b.mode === 'hover') {
      var k = now / 1000;
      b.dx = Math.sin(k * 3.1) * P * 1.5; b.dy = Math.sin(k * 5.3) * P;
      if (now > b.hoverUntil) beeNext(now);
      return;
    }
    var t = Math.min(1, (now - b.t0) / b.dur);
    var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;      // ease in-out
    b.x = b.from.x + (b.target.x - b.from.x) * e;
    b.y = b.from.y + (b.target.y - b.from.y) * e - Math.sin(Math.PI * e) * b.arc
          + Math.sin(now / 160) * P * 1.2;                               // little bob
    b.dx = 0; b.dy = 0;
    if (t >= 1) { b.mode = 'hover'; b.hoverUntil = now + 1500 + Math.random() * 1700; }
  }

  // ---- zzz ----------------------------------------------------------------------
  var zs = [], lastZ = -1e9;
  function zUpdate(now) {
    if (now - lastZ > 1500) { zs.push({ t0: now }); lastZ = now; }
    zs = zs.filter(function (z) { return now - z.t0 < 3200; });
  }

  // ---- frame ------------------------------------------------------------------------
  function frame(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tufts.forEach(function (x) { draw(grass, x, ground - grass.height * P + P); });
    flowers.forEach(function (f) { draw(f.img, f.x, f.y); });

    // dog + zzz
    var breathe = reduce ? 0 : (Math.floor(now / 1700) % 2);
    draw(dog[breathe], dogPos.x, dogPos.y - (breathe ? P : 0) + P);
    var hx = dogPos.x + dog[0].width * P * 0.78, hy = dogPos.y + P;
    if (reduce) {
      draw(zed, hx, hy - P * 8);
    } else {
      zs.forEach(function (z) {
        var t = (now - z.t0) / 3200;
        ctx.globalAlpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        draw(zed, hx + t * P * 9 + Math.sin(t * 6) * P, hy - P * 4 - t * P * 16);
        ctx.globalAlpha = 1;
      });
    }

    // bee
    var wing = reduce ? 0 : Math.floor(now / 70) % 2;
    draw(bee[wing], b.x + (b.dx || 0) - bee[0].width * P / 2, b.y + (b.dy || 0) - bee[0].height * P / 2, b.flip);
  }

  function loop(now) {
    beeUpdate(now); zUpdate(now); frame(now);
    requestAnimationFrame(loop);
  }

  layout();
  beeStart(performance.now());
  if (reduce) frame(0); else requestAnimationFrame(loop);

  var rt, lastW = W;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var w = garden.getBoundingClientRect().width;
      if (Math.abs(w - lastW) < 2) return;
      lastW = w; layout(); beeStart(performance.now());
      if (reduce) frame(0);
    }, 150);
  });
})();
