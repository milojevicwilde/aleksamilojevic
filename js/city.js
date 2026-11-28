// =============================================================================
// A pixel "ideal city" along the bottom of the page, after the Renaissance
// Ideal City panels (Urbino, Baltimore, Berlin): one-point perspective with the
// vanishing point exactly mid-screen, a round temple on the axis, palazzi
// receding on both sides, a patterned piazza, a pair of columns, a few figures.
// Everything is computed per pixel at low resolution and scaled up with hard
// edges. The sky is the page itself; small white clouds drift across it one
// pixel at a time.
// =============================================================================
(function () {
  'use strict';

  var cityWrap = document.querySelector('.city');
  var cloudWrap = document.querySelector('.clouds');
  if (!cityWrap) return;
  var cityC = cityWrap.querySelector('canvas');
  var cctx = cityC.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- palette (muted, after the panels) ----------------------------------
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  var C = {
    stone:    hex('#E3DED0'),
    greyblue: hex('#B9C0C8'),
    ochre:    hex('#D9C79C'),
    terra:    hex('#C47C5E'),
    pale:     hex('#EDE9DE'),
    grey:     hex('#CFCDC6'),
    window:   hex('#3E3934'),
    void:     hex('#4C4640'),
    paveA:    hex('#E8E4D8'),
    paveB:    hex('#B9BCA4'),     // grey-green panels
    paveC:    hex('#B4BAC2'),     // blue-grey panels
    paveBand: hex('#F2EFE7'),
    paveLine: hex('#9C978A'),
    paveMed:  hex('#C9CED3'),
    hillA:    hex('#B5BFAE'),
    hillB:    hex('#C7CFC9'),
    tStone:   hex('#E6E2D6'),
    tPanel:   hex('#5E6874'),     // dark blue-grey panels between columns
    tLattice: hex('#A9B0B6'),
    tRoof:    hex('#D5D7D9'),
    tRib:     hex('#9EA3A9'),
    tDoor:    hex('#6B4B33'),
    porph:    hex('#5B4B4C'),     // porphyry column
    redcol:   hex('#A65E43'),
    capital:  hex('#C99C5E'),
    statue:   hex('#EEEBE3'),
    skin:     hex('#D9B08C'),
    robes:    [hex('#B5533C'), hex('#4F6C9E'), hex('#C98B3A'), hex('#6F7A5A'), hex('#8E4B55')]
  };

  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

  // ---- pixel buffer -------------------------------------------------------
  var Gw = 0, Gh = 0, P = 4, buf = null, img = null;
  function put(x, y, c) {
    if (x < 0 || y < 0 || x >= Gw || y >= Gh) return;
    var i = (y * Gw + x) * 4;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
  }

  // ---- camera ---------------------------------------------------------------
  // screen x = cx + f·X/Z, screen y = hy + f·(Hc − Y)/Z   (metres, Z = depth)
  var cx, hy, f, Hc = 3.2;
  var S = 11, D = 16;          // street half-width, depth of the palazzi
  var W = 1;                   // world scale: wide screens get a wider piazza (more storeys, finer windows)
  function sx(X, Z) { return cx + f * X / Z; }
  function sy(Y, Z) { return hy + f * (Hc - Y) / Z; }
  function maxH(Z, margin) { return Hc + (hy - margin) * Z / f; }   // tallest that still fits

  // ---- piazza -------------------------------------------------------------
  var MED_Z = 19;
  function pave(X, Z, fp) {
    var M = 7, bw = 1.0, col;
    var u = ((X + M / 2) % M + M) % M, v = ((Z - 2) % M + M) % M;
    var i = Math.floor((X + M / 2) / M), j = Math.floor((Z - 2) / M);
    if (u < bw || v < bw) {
      col = C.paveBand;
      if (Math.abs(u - bw) < 0.07 || Math.abs(v - bw) < 0.07 || u < 0.07 || v < 0.07) col = mix(C.paveBand, C.paveLine, 0.45);
    } else {
      col = (i + j) & 1 ? C.paveB : (i & 1 ? C.paveC : C.paveA);
    }
    // central diamond medallion
    var d = Math.abs(X) * 1.15 + Math.abs(Z - MED_Z);
    if (d < 6.2) col = d < 5.2 ? (d < 2.2 ? C.paveBand : C.paveMed) : C.paveBand;
    // fade the pattern into its average tone with distance (no moiré)
    return mix(col, mix(C.paveA, C.paveB, 0.42), clamp01((fp - 0.3) / 1.1));
  }

  function drawGround() {
    for (var y = Math.ceil(hy); y < Gh; y++) {
      var Z = f * Hc / (y + 0.5 - hy);
      var fp = Math.max(Z * Z / (f * Hc), Z / f);
      // the pattern grows with the piazza, so it is laid out in scaled units
      for (var x = 0; x < Gw; x++) put(x, y, pave((x + 0.5 - cx) * Z / f / W, Z / W, fp / W));
    }
  }

  function drawHills() {
    for (var x = 0; x < Gw; x++) {
      var d = (x + 0.5 - cx) / Gw;
      var h = 1.4 + 1.2 * Math.sin(d * 19 + 1.3) + 0.9 * Math.sin(d * 47) + (Math.abs(d) > 0.18 ? 1.2 : 0);
      for (var k = 1; k <= Math.round(h); k++) put(x, Math.floor(hy) - k, k > h - 1 ? C.hillB : C.hillA);
    }
  }

  // ---- palazzi ----------------------------------------------------------------
  var STYLES = [
    { color: C.stone,    arcade: true,  arched: true,  pil: true,  bay: 3.6 },
    { color: C.greyblue, arcade: false, arched: false, pil: true,  bay: 3.2 },
    { color: C.ochre,    arcade: true,  arched: true,  pil: false, bay: 3.4 },
    { color: C.terra,    arcade: false, arched: false, pil: false, bay: 3.0 },
    { color: C.pale,     arcade: true,  arched: false, pil: true,  bay: 3.4 },
    { color: C.grey,     arcade: false, arched: true,  pil: false, bay: 3.2 },
    { color: C.ochre,    arcade: false, arched: false, pil: true,  bay: 3.2 }
  ];
  var BLOCKS = [[8, 21], [23, 34], [36, 46], [48, 59], [61, 74], [76, 92], [94, 125]];
  var HEIGHT = [1.0, 1.14, 0.96, 1.18, 1.05, 1.12, 1.0];

  function facade(b, u, Y, len, fp) {
    var wall = b.color, fh = b.fh, col = wall;
    var detail = 1 - clamp01((fp - 0.42) / 0.9);
    if (Y > b.h - 0.5) col = shade(wall, 0.78);                   // cornice
    else if (Y > b.h - 0.75) col = shade(wall, 1.06);
    else {
      var fl = Math.floor(Y / fh), v = Y - fl * fh;
      if (fl > 0 && v < 0.24) col = shade(wall, 0.86);           // string course
      else {
        var span = len - 1.4, nb = Math.max(1, Math.round(span / b.bay)), bw = span / nb, uu = u - 0.7;
        if (uu < 0 || uu > span) col = shade(wall, 1.05);         // corner quoins
        else {
          var k = uu % bw, c = bw / 2, dx = Math.abs(k - c);
          if (b.pil && (k < 0.22 || k > bw - 0.22)) col = shade(wall, 1.06);
          if (fl === 0 && b.arcade) {
            var w2 = bw * 0.36, spring = fh * 0.58;
            if (dx < w2 && (v < spring || (v - spring) * (v - spring) + dx * dx < w2 * w2)) col = C.void;
          } else {
            var ww = Math.min(1.15, bw * 0.34), wb = fh * 0.3, wt = fh * 0.74, hw = ww / 2;
            if (dx < hw + 0.2 && v > wb - 0.2 && v < wt + 0.32) col = shade(wall, 1.08);
            if (dx < hw && v > wb && v < wt) {
              var top = wt - hw;
              col = b.arched && v > top && (v - top) * (v - top) + dx * dx > hw * hw ? shade(wall, 1.08) : C.window;
            }
          }
        }
      }
    }
    return mix(b.avg, col, detail);
  }

  // inner face of a block: the plane X = side·S, from z1 to z2
  function drawSide(b, side, light) {
    var X = side * S;
    var xa = sx(X, b.z1), xb = sx(X, b.z2);
    var x0 = Math.floor(Math.min(xa, xb)), x1 = Math.ceil(Math.max(xa, xb));
    for (var x = x0; x <= x1; x++) {
      var Z = f * X / (x + 0.5 - cx);
      if (!(Z >= b.z1 && Z <= b.z2)) continue;
      var yt = Math.floor(sy(b.h, Z)), yb = Math.ceil(sy(0, Z));
      var fp = Math.max(Z * Z / (f * S), Z / f);
      for (var y = Math.max(0, yt); y < Math.min(Gh, yb); y++) {
        var Y = Hc - (y + 0.5 - hy) * Z / f;
        if (Y < 0 || Y > b.h) continue;
        put(x, y, shade(facade(b, Z - b.z1, Y, b.z2 - b.z1, fp), light));
      }
    }
  }
  // front face of a block: the plane Z = z1, from X = side·S outwards
  function drawFront(b, side, light) {
    var Z = b.z1, Xa = side * S, Xb = side * (S + D);
    var x0 = Math.floor(Math.min(sx(Xa, Z), sx(Xb, Z))), x1 = Math.ceil(Math.max(sx(Xa, Z), sx(Xb, Z)));
    var y0 = Math.floor(sy(b.h, Z)), y1 = Math.ceil(sy(0, Z));
    var fp = Z / f;
    for (var x = Math.max(0, x0); x <= Math.min(Gw - 1, x1); x++) {
      var X = (x + 0.5 - cx) * Z / f, u = Math.abs(X) - S;
      if (u < 0 || u > D) continue;
      for (var y = Math.max(0, y0); y < Math.min(Gh, y1); y++) {
        var Y = Hc - (y + 0.5 - hy) * Z / f;
        if (Y < 0 || Y > b.h) continue;
        put(x, y, shade(facade(b, u, Y, D, fp), light));
      }
    }
  }

  // ---- round temple on the axis ---------------------------------------------
  var ZT = 33, R = 9;
  function splatCyl(r, y0, y1, Zc, colorFn) {
    var tmax = Math.acos(Math.min(0.999, r / Zc));
    var dth = 0.3 * Zc / (f * r), dY = 0.3 * Zc / f;
    for (var th = -tmax; th <= tmax; th += dth) {
      var X = r * Math.sin(th), Z = Zc - r * Math.cos(th);
      var px = Math.floor(cx + f * X / Z);
      for (var Y = y0; Y < y1; Y += dY) {
        var c = colorFn(th, Y, X);
        if (c) put(px, Math.floor(hy + f * (Hc - Y) / Z), c);
      }
    }
  }
  function splatDisc(r0, r1, Y, Zc, col) {          // top of a step, seen from above
    var dr = 0.3 * Zc / f;
    for (var r = r0; r <= r1; r += dr) {
      var dth = 0.3 * Zc / (f * r);
      for (var th = -Math.PI; th <= Math.PI; th += dth) {
        var X = r * Math.sin(th), Z = Zc - r * Math.cos(th);
        put(Math.floor(cx + f * X / Z), Math.floor(hy + f * (Hc - Y) / Z), col);
      }
    }
  }
  function splatCone(rb, y0, h, Zc, colorFn) {
    var tmax = Math.acos(Math.min(0.999, rb / Zc));
    var dY = 0.25 * Zc / f;
    for (var Y = y0; Y < y0 + h; Y += dY) {
      var r = rb * (1 - (Y - y0) / h);
      if (r < 0.05) break;
      var dth = 0.3 * Zc / (f * r);
      for (var th = -tmax; th <= tmax; th += dth) {
        var X = r * Math.sin(th), Z = Zc - r * Math.cos(th);
        put(Math.floor(cx + f * X / Z), Math.floor(hy + f * (Hc - Y) / Z), colorFn(th, Y));
      }
    }
  }
  function light(th) { return 0.8 + 0.22 * Math.cos(th + 0.65); }   // sun from the upper left

  function drawTemple() {
    var top = maxH(ZT - R, 3) * 0.97;               // tallest that fits above the front edge
    var steps = 0.9, a1 = 0.9 * R, e1 = 0.75, a2 = 0.46 * R, e2 = 0.45, hr = 0.62 * R, lan = 0.3 * R;
    var total = steps + a1 + e1 + a2 + e2 + hr + lan;
    var k = Math.min(1, (top - steps) / (total - steps));
    // when space is short, the roof keeps its shape and the drums give way
    var kr = Math.sqrt(k), ke = k;
    var drums = Math.max(0.35 * (a1 + a2), top - steps - (hr + lan) * kr - (e1 + e2) * ke);
    var kd = Math.min(1, drums / (a1 + a2));
    a1 *= kd; a2 *= kd; e1 *= ke; e2 *= ke; hr *= kr; lan *= kr;

    // three steps
    for (var s = 0; s < 3; s++) {
      var rs = R + 1.5 - s * 0.5, ys = s * 0.3;
      splatCyl(rs, ys, ys + 0.3, ZT, function (th) { return shade(C.tStone, 0.82 * light(th)); });
      splatDisc(rs - 0.5, rs, ys + 0.3, ZT, shade(C.tStone, 1.02));
    }
    // lower drum: colonnade with dark panels, door on the axis
    var y1 = steps + a1, nCol = 20;
    splatCyl(R, steps, y1, ZT, function (th, Y, X) {
      var L = light(th), seg = (th / (2 * Math.PI) * nCol) % 1; if (seg < 0) seg += 1;
      var colW = Math.abs(seg - 0.5) > 0.32;
      var v = (Y - steps) / a1;
      if (Math.abs(X) < 1.1 && v < 0.5) return v > 0.46 ? shade(C.tStone, 1.05) : C.tDoor;
      if (Math.abs(X) < 1.6 && v < 0.62) return shade(C.tStone, 1.06 * L);      // door frame + pediment
      if (colW) return shade(C.tStone, L * (v > 0.93 ? 0.9 : 1));                // columns + capitals
      if (v < 0.22) return shade(C.tLattice, L);
      return shade(C.tPanel, 0.9 + 0.15 * L);
    });
    // entablature
    splatCyl(R + 0.15, y1, y1 + e1, ZT, function (th, Y) {
      var v = (Y - y1) / e1;
      return shade(C.tStone, light(th) * (v < 0.2 ? 0.8 : v > 0.8 ? 1.05 : 0.95));
    });
    // upper drum with pilasters and small windows
    var y2 = y1 + e1, r2 = 0.8 * R;
    splatCyl(r2, y2, y2 + a2, ZT, function (th, Y) {
      var L = light(th), seg = (th / (2 * Math.PI) * 16) % 1; if (seg < 0) seg += 1;
      var v = (Y - y2) / a2;
      if (Math.abs(seg - 0.5) > 0.4) return shade(C.tStone, L * 1.04);
      if (v > 0.3 && v < 0.7 && Math.abs(seg - 0.5) < 0.16) return C.window;
      return shade(C.tStone, L * 0.93);
    });
    var y3 = y2 + a2;
    splatCyl(r2 + 0.25, y3, y3 + e2, ZT, function (th, Y) {
      return shade(C.tStone, light(th) * ((Y - y3) / e2 < 0.35 ? 0.8 : 1));
    });
    // conical roof with ribs, then the lantern
    var y4 = y3 + e2;
    splatCone(r2 + 0.3, y4, hr, ZT, function (th) {
      var seg = (th / (2 * Math.PI) * 16) % 1; if (seg < 0) seg += 1;
      return Math.abs(seg - 0.5) > 0.42 ? C.tRib : shade(C.tRoof, light(th));
    });
    var y5 = y4 + hr * 0.8, rl = 0.12 * R;
    splatCyl(rl, y5, y5 + lan * 0.65, ZT, function (th) { return shade(C.tStone, light(th)); });
    splatCone(rl * 1.25, y5 + lan * 0.65, lan * 0.45, ZT, function (th) { return shade(C.tRib, light(th)); });
  }

  // ---- foreground: a pair of columns with statues -----------------------------
  function box(X0, X1, Z, Y0, Y1, col) {
    var x0 = Math.floor(sx(X0, Z)), x1 = Math.ceil(sx(X1, Z)) - 1;
    var y0 = Math.floor(sy(Y1, Z)), y1 = Math.ceil(sy(Y0, Z)) - 1;
    for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) {
      var t = (x - x0) / Math.max(1, x1 - x0);
      put(x, y, shade(col, t < 0.3 ? 1.06 : t > 0.75 ? 0.86 : 1));
    }
  }
  function drawColumn(X, Z, shaft) {
    var top = maxH(Z, 3) * 0.97;
    var k = Math.pow(W, 0.7);
    var ped = 1.5 * k, cap = 0.45 * k, st = 1.15 * k, h = Math.max(4, top - ped - cap - st);
    box(X - 0.8 * k, X + 0.8 * k, Z, 0, ped, C.stone);
    box(X - 0.9 * k, X + 0.9 * k, Z, ped - 0.15 * k, ped, shade(C.stone, 1.05));
    box(X - 0.32 * k, X + 0.32 * k, Z, ped, ped + h, shaft);
    box(X - 0.5 * k, X + 0.5 * k, Z, ped + h, ped + h + cap, C.capital);
    // statue: a small standing figure
    box(X - 0.22 * k, X + 0.22 * k, Z, ped + h + cap, ped + h + cap + st * 0.78, C.statue);
    box(X - 0.12 * k, X + 0.12 * k, Z, ped + h + cap + st * 0.78, ped + h + cap + st, C.statue);
  }

  // ---- figures in the piazza --------------------------------------------------
  var PEOPLE = [[-3.2, 15, 0], [2.4, 17.5, 1], [-6.5, 26, 2], [5.6, 24, 3], [0.9, 11, 4], [-8.5, 40, 1], [7.8, 44, 0]];
  function drawPerson(X, Z, robe) {
    var hpx = f * 1.75 * Math.pow(W, 0.75) / Z;
    if (hpx < 3) return;
    var xc = sx(X, Z), yb = sy(0, Z);
    var w = Math.max(1, Math.round(hpx * 0.26)), x0 = Math.round(xc - w / 2);
    var head = Math.max(1, Math.round(hpx * 0.16)), legs = Math.max(1, Math.round(hpx * 0.22));
    var body = Math.max(1, Math.round(hpx) - head - legs);
    var y = Math.round(yb);
    for (var i = 0; i < legs; i++, y--) for (var a = 0; a < w; a++) if (w < 3 || a !== Math.floor(w / 2)) put(x0 + a, y - 1, C.window);
    for (i = 0; i < body; i++, y--) for (a = 0; a < w; a++) put(x0 + a, y - 1, shade(robe, a === 0 ? 1.08 : 1));
    var hw = Math.max(1, w - 2), hx = x0 + Math.floor((w - hw) / 2);
    for (i = 0; i < head; i++, y--) for (a = 0; a < hw; a++) put(hx + a, y - 1, C.skin);
  }

  // ---- render -------------------------------------------------------------------
  function pixelSize() { return Math.max(2, Math.round(window.innerWidth / 300)); }

  function renderCity() {
    var w = cityWrap.clientWidth, h = cityWrap.clientHeight;
    if (!w || !h) return;
    P = pixelSize();
    Gw = Math.ceil(w / P); if (Gw % 2) Gw++;
    Gh = Math.floor(h / P);
    cityC.width = Gw; cityC.height = Gh;
    cityC.style.width = Gw * P + 'px'; cityC.style.height = Gh * P + 'px';
    img = cctx.createImageData(Gw, Gh); buf = img.data;

    cx = Gw / 2;
    hy = Math.round(Gh * 0.62);
    W = Math.max(1, Math.min(2.6, (Gw / Gh) / 2));
    S = 11 * W; D = 16 * W; Hc = 3.2 * W;
    ZT = 33 * W; R = 9 * Math.pow(W, 0.8);
    var Z1 = BLOCKS[0][0] * W;
    f = cx * Z1 / (S + 7 * W);            // the screen edge cuts the nearest palazzo 7 m out

    // palazzi: the nearest sets the floor height, the others follow it
    var h0 = maxH(Z1, 3) * 0.98;
    var floors = Math.max(2, Math.min(4, Math.floor((h0 - 0.75) / 2.7)));
    var fh = (h0 - 0.75) / floors;
    var blocks = BLOCKS.map(function (z, i) {
      var st = STYLES[i % STYLES.length], z1 = z[0] * W, z2 = z[1] * W;
      var hh = Math.min(h0 * HEIGHT[i], maxH(z1, 3) * 0.98);
      var fl = Math.max(2, Math.floor((hh - 0.75) / fh));
      return { z1: z1, z2: z2, h: fl * fh + 0.75, fh: fh, color: st.color, arcade: st.arcade,
               arched: st.arched, pil: st.pil, bay: st.bay, avg: mix(st.color, C.window, 0.2) };
    });

    drawGround();
    drawHills();
    for (var i = blocks.length - 1; i >= 0; i--) {
      var b = blocks[i];
      drawSide(b, -1, 1.0);    // left row faces the light
      drawSide(b, 1, 0.84);    // right row in shade
      drawFront(b, -1, 0.95);
      drawFront(b, 1, 0.95);
    }
    drawTemple();
    PEOPLE.forEach(function (p) { drawPerson(p[0] * W, p[1] * W, C.robes[p[2]]); });
    drawColumn(-9.2 * W, 10.5 * W, C.porph);
    drawColumn(9.2 * W, 10.5 * W, C.porph);

    cctx.putImageData(img, 0, 0);
  }

  // ---- clouds: a few small white clouds, moving one pixel at a time -----------
  var cloudC = cloudWrap && cloudWrap.querySelector('canvas');
  var kctx = cloudC && cloudC.getContext('2d');
  var clouds = [], Cw = 0, Ch = 0;

  function seeded(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function makeCloud(rnd, w) {
    var h = Math.max(4, Math.round(w * 0.36)), c = document.createElement('canvas');
    c.width = w; c.height = h + 1;
    var g = c.getContext('2d'), fill = [];
    var puffs = 3 + Math.floor(rnd() * 3);
    for (var y = 0; y < h; y++) fill.push(new Array(w).fill(false));
    for (var p = 0; p < puffs; p++) {
      var px = w * (0.18 + 0.64 * (p / (puffs - 1))) + (rnd() - 0.5) * w * 0.08;
      var rx = w * (0.16 + rnd() * 0.12), ry = h * (0.42 + rnd() * 0.45);
      for (y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var dx = (x + 0.5 - px) / rx, dy = (y + 0.5 - h) / ry;
        if (dx * dx + dy * dy < 1) fill[y][x] = true;
      }
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (!fill[y][x]) continue;
      g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 1, 1);
    }
    // a faint underside so the white reads on the off-white sky
    for (x = 0; x < w; x++) for (y = h - 1; y >= 0; y--) if (fill[y][x]) { g.fillStyle = '#ECECE7'; g.fillRect(x, y + 1, 1, 1); break; }
    return c;
  }

  function setupClouds() {
    if (!cloudC) return;
    Cw = Math.ceil(window.innerWidth / P); Ch = Math.ceil(window.innerHeight / P);
    cloudC.width = Cw; cloudC.height = Ch;
    cloudC.style.width = Cw * P + 'px'; cloudC.style.height = Ch * P + 'px';
    var rnd = seeded(7), n = Cw > 220 ? 5 : 3, skyRows = Math.max(20, Ch - cityWrap.clientHeight / P);
    clouds = [];
    for (var i = 0; i < n; i++) {
      var w = Math.round(12 + rnd() * 16);
      clouds.push({
        img: makeCloud(rnd, w),
        x: Math.round((i + 0.2 + rnd() * 0.5) / n * (Cw + w)) - w,
        y: Math.round(skyRows * (0.08 + rnd() * 0.62)),
        every: 900 + Math.round(rnd() * 900),     // ms per pixel
        last: 0
      });
    }
    drawClouds();
  }
  function drawClouds() {
    kctx.clearRect(0, 0, Cw, Ch);
    clouds.forEach(function (c) { kctx.drawImage(c.img, c.x, c.y); });
  }
  function tick(now) {
    var moved = false;
    clouds.forEach(function (c) {
      if (now - c.last >= c.every) {
        c.last = now; c.x += 1; moved = true;
        if (c.x > Cw) c.x = -c.img.width;
      }
    });
    if (moved) drawClouds();
  }

  // ---- run ------------------------------------------------------------------------
  renderCity();
  setupClouds();
  if (!reduce && cloudC) setInterval(function () { if (!document.hidden) tick(performance.now()); }, 120);

  var lastW = window.innerWidth, lastH = window.innerHeight, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (Math.abs(window.innerWidth - lastW) < 2 && Math.abs(window.innerHeight - lastH) < 80) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      renderCity(); setupClouds();
    }, 150);
  });
})();
