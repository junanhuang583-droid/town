export function mountMap(app) {
  app.innerHTML = '';

  const TILE = 16;
  const MAP_W = 96;
  const MAP_H = 72;
  const WORLD_W = MAP_W * TILE;
  const WORLD_H = MAP_H * TILE;

  const P = {
    sea0: '#235f87',
    sea1: '#2f789e',
    sea2: '#428fb0',
    foam: '#91c6d3',
    grass0: '#547f53',
    grass1: '#638f59',
    grass2: '#77a666',
    grassHi: '#829d60',
    cliff0: '#55483f',
    cliff1: '#6a594a',
    cliff2: '#806b55',
    sand0: '#c8aa6b',
    sand1: '#ddc184',
    sand2: '#ead49b',
    road0: '#816f59',
    road1: '#a08a68',
    road2: '#b59e76',
    stone0: '#77756e',
    stone1: '#969188',
    stone2: '#b4ada0',
    wood0: '#6b4732',
    wood1: '#87583a',
    wood2: '#a56c44',
    outline: '#2f2c2c',
    ink: '#202628',
    wallCream: '#c7b68e',
    wallBlue: '#93aead',
    wallRose: '#c18f82',
    wallGreen: '#9baa78',
    roofRed: '#78463e',
    roofBlue: '#415c72',
    roofGreen: '#4d684d',
    roofPurple: '#5e4c66',
    roofBrown: '#624a37',
    window: '#8fc1c3',
    lamp: '#f2d58a',
    flowerPink: '#d68b9d',
    flowerYellow: '#e1c56c',
    flowerPurple: '#9877a9',
    treeDark: '#355944',
    treeMid: '#497250',
    treeLight: '#608a5a',
    pineDark: '#294d3d',
    pineMid: '#3b6550'
  };

  const viewport = document.createElement('div');
  viewport.className = 'pixel-viewport';

  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-map';
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  canvas.setAttribute('aria-label', 'Pixel Town v0.1 海滨小镇地图');
  viewport.appendChild(canvas);
  app.appendChild(viewport);

  const hud = document.createElement('div');
  hud.className = 'pixel-hud';
  hud.innerHTML = '<b>Pixel Town v0.1</b><span>海滨小镇 · 世界初版</span>';
  app.appendChild(hud);

  const controls = document.createElement('div');
  controls.className = 'pixel-controls';
  controls.innerHTML =
    '<button data-action="out">−</button>' +
    '<button data-action="fit">全图</button>' +
    '<button data-action="in">＋</button>';
  app.appendChild(controls);

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  function tx(v) { return Math.round(v * TILE); }
  function ty(v) { return Math.round(v * TILE); }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function tileRect(x, y, w, h, color) {
    rect(tx(x), ty(y), tx(w), ty(h), color);
  }

  function poly(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tx(points[0][0]), ty(points[0][1]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(tx(points[i][0]), ty(points[i][1]));
    }
    ctx.closePath();
    ctx.fill();
  }

  function hash(x, y, seed = 0) {
    let n = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  function pixelNoiseArea(x0, y0, x1, y1, color, density, seed = 1) {
    ctx.fillStyle = color;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (hash(x, y, seed) < density) {
          const px = tx(x) + Math.floor(hash(x, y, seed + 9) * 12) + 2;
          const py = ty(y) + Math.floor(hash(x, y, seed + 17) * 12) + 2;
          rect(px, py, 2, 2, color);
        }
      }
    }
  }

  function drawSea() {
    rect(0, 0, WORLD_W, WORLD_H, P.sea0);
    for (let y = 1; y < MAP_H; y += 2) {
      const offset = (y % 4) * 4;
      for (let x = -1; x < MAP_W; x += 5) {
        const k = hash(x, y, 31);
        if (k < 0.45) continue;
        const px = tx(x) + offset;
        const py = ty(y) + 7;
        rect(px, py, 18, 2, k > 0.76 ? P.sea2 : P.sea1);
        if (k > 0.88) rect(px + 5, py - 3, 8, 2, P.foam);
      }
    }
  }

  const MAIN_LAND = [
    [0, 0], [74, 0], [74, 3], [79, 3], [79, 8], [82, 8], [82, 14],
    [85, 14], [85, 20], [83, 20], [83, 27], [87, 27], [87, 34],
    [84, 34], [84, 39], [81, 39], [81, 44], [77, 44], [77, 49],
    [72, 49], [72, 53], [67, 53], [67, 57], [59, 57], [59, 60],
    [48, 60], [48, 62], [38, 62], [38, 64], [26, 64], [26, 63],
    [16, 63], [16, 61], [8, 61], [8, 58], [0, 58]
  ];

  function drawLand() {
    const cliff = MAIN_LAND.map(([x, y]) => [x, y + 1.15]);
    poly(cliff, P.cliff0);
    poly(MAIN_LAND, P.grass1);

    const highland = [
      [0, 0], [72, 0], [72, 4], [75, 4], [75, 9], [72, 9], [72, 13],
      [67, 13], [67, 15], [58, 15], [58, 17], [45, 17], [45, 16],
      [31, 16], [31, 18], [19, 18], [19, 17], [8, 17], [8, 15], [0, 15]
    ];
    poly(highland, P.grassHi);

    tileRect(0, 15, 74, 1, P.cliff2);
    tileRect(0, 16, 74, 1, P.cliff0);
    for (let x = 0; x < 74; x += 2) {
      rect(tx(x) + 3, ty(15) + 4, 10, 3, P.cliff1);
    }

    const lowShelf = [
      [0, 50], [16, 50], [16, 52], [30, 52], [30, 51], [45, 51],
      [45, 53], [58, 53], [58, 56], [67, 56], [67, 58], [59, 58],
      [59, 61], [48, 61], [48, 63], [38, 63], [38, 65], [26, 65],
      [26, 64], [16, 64], [16, 62], [8, 62], [8, 59], [0, 59]
    ];
    poly(lowShelf, P.grass0);

    tileRect(0, 49, 59, 1, P.cliff2);
    tileRect(0, 50, 59, 1, P.cliff0);
    for (let x = 1; x < 58; x += 3) {
      rect(tx(x), ty(49) + 3, 14, 3, P.cliff1);
    }

    const beach = [
      [67, 33], [74, 33], [74, 35], [79, 35], [79, 39], [83, 39],
      [83, 44], [80, 44], [80, 48], [75, 48], [75, 52], [69, 52],
      [65, 49], [64, 43], [65, 38]
    ];
    poly(beach, P.sand1);
    pixelNoiseArea(66, 35, 81, 51, P.sand2, 0.22, 44);

    const lightIsland = [
      [80, 54], [85, 52], [91, 53], [95, 57], [95, 66], [92, 70],
      [85, 71], [80, 68], [78, 62]
    ];
    const lightCliff = lightIsland.map(([x, y]) => [x, y + 0.8]);
    poly(lightCliff, P.cliff0);
    poly(lightIsland, P.grass0);

    pixelNoiseArea(0, 0, 74, 15, '#91aa70', 0.18, 5);
    pixelNoiseArea(0, 18, 66, 49, '#79a15f', 0.11, 7);
    pixelNoiseArea(0, 51, 58, 62, '#63894f', 0.1, 8);
  }

  function roadRect(x, y, w, h, shade = P.road1) {
    tileRect(x - 0.2, y - 0.2, w + 0.4, h + 0.4, P.road0);
    tileRect(x, y, w, h, shade);
    if (w > h) {
      for (let i = 0; i < w; i += 2) {
        rect(tx(x + i) + 4, ty(y) + Math.floor(tx(h) / 2), 8, 2, P.road2);
      }
    }
  }

  function drawRoads() {
    roadRect(4, 18, 64, 3);
    roadRect(12, 18, 3, 29);
    roadRect(28, 18, 3, 30);
    roadRect(46, 18, 3, 31);
    roadRect(62, 18, 3, 30);

    roadRect(12, 29, 53, 3);
    roadRect(12, 43, 53, 3);
    roadRect(27, 48, 3, 4);
    roadRect(46, 48, 3, 4);

    tileRect(14, 15, 5, 3, P.stone1);
    tileRect(15, 16, 3, 1, P.stone2);
    tileRect(50, 15, 5, 3, P.stone1);
    tileRect(51, 16, 3, 1, P.stone2);

    roadRect(64, 35, 3, 13, P.sand0);

    tileRect(34, 51, 31, 3, P.wood0);
    tileRect(35, 51, 30, 2.5, P.wood1);
    for (let x = 35; x < 65; x += 2) {
      rect(tx(x), ty(51), 2, ty(2.5), P.wood2);
    }

    tileRect(64, 44, 16, 3, P.wood0);
    tileRect(65, 44, 15, 2, P.wood1);
    for (let x = 65; x < 80; x += 2) {
      rect(tx(x), ty(44), 2, ty(2), P.wood2);
    }

    tileRect(76, 45, 3, 10, P.wood0);
    tileRect(77, 45, 2, 10, P.wood1);
  }

  function roofPixels(x, y, w, color) {
    const px = tx(x);
    const py = ty(y);
    const ww = tx(w);
    rect(px + 4, py, ww - 8, 4, P.outline);
    rect(px, py + 4, ww, 7, P.outline);
    rect(px + 4, py + 4, ww - 8, 5, color);
    rect(px + 8, py, ww - 16, 5, color);
    rect(px + 6, py + 9, ww - 12, 3, '#9a6958');
  }

  function windowPx(x, y) {
    rect(x, y, 12, 11, P.outline);
    rect(x + 2, y + 2, 8, 7, P.window);
    rect(x + 6, y + 2, 2, 7, '#d9ece4');
  }

  function building(x, y, w, h, wall, roof, opts = {}) {
    const px = tx(x);
    const py = ty(y);
    const ww = tx(w);
    const hh = tx(h);

    rect(px + 5, py + 9, ww, hh, '#26363a55');
    rect(px, py + 8, ww, hh - 8, P.outline);
    rect(px + 3, py + 11, ww - 6, hh - 14, wall);

    roofPixels(x - 0.25, y, w + 0.5, roof);

    const doorW = 12;
    const doorH = 19;
    const doorX = px + Math.floor(ww / 2) - Math.floor(doorW / 2);
    const doorY = py + hh - doorH - 2;
    rect(doorX, doorY, doorW, doorH, P.outline);
    rect(doorX + 2, doorY + 2, doorW - 4, doorH - 2, '#5d493b');

    if (w >= 6) {
      windowPx(px + 10, py + hh - 30);
      windowPx(px + ww - 22, py + hh - 30);
    }

    if (opts.awning) {
      rect(px + 8, py + hh - 35, ww - 16, 7, opts.awning);
      for (let xx = px + 10; xx < px + ww - 10; xx += 12) {
        rect(xx, py + hh - 35, 5, 7, '#efe0c1');
      }
    }

    if (opts.sign) {
      rect(px + ww - 16, py + 16, 12, 12, P.outline);
      rect(px + ww - 14, py + 18, 8, 8, opts.sign);
    }

    if (opts.chimney) {
      rect(px + ww - 19, py + 1, 7, 13, P.outline);
      rect(px + ww - 17, py + 3, 3, 10, '#735449');
    }
  }

  function station(x, y) {
    building(x, y, 12, 7, P.wallBlue, P.roofBlue, { chimney: true });
    const px = tx(x);
    const py = ty(y);
    rect(px + 14, py + 61, tx(9), 4, P.stone0);
    rect(px + 18, py + 65, tx(8), 3, P.stone2);
    rect(px + tx(12) + 8, py + 20, 18, 12, P.outline);
    rect(px + tx(12) + 10, py + 22, 14, 8, '#d59c58');
  }

  function drawBuildings() {
    station(7, 5);

    building(29, 5, 7, 6, P.wallCream, P.roofRed, { chimney: true });
    building(42, 6, 7, 6, P.wallGreen, P.roofGreen, { chimney: true });
    building(56, 5, 8, 6, P.wallCream, P.roofBlue);

    building(6, 22, 10, 7, P.wallBlue, P.roofBlue, { chimney: true });
    building(21, 22, 7, 6, P.wallCream, P.roofRed, { awning: '#c97967' });
    building(34, 22, 8, 6, P.wallGreen, P.roofGreen, { awning: '#739364' });

    building(6, 35, 10, 7, P.wallRose, P.roofRed, { awning: '#c47b72', chimney: true });
    building(21, 36, 9, 7, '#bca4b7', P.roofPurple, { awning: '#8b6c88', sign: '#73abc0' });
    building(35, 36, 8, 6, '#c8b794', P.roofBrown, { sign: '#67aebf' });

    building(52, 22, 8, 6, '#b9ab88', P.roofBrown, { chimney: true });
    building(52, 35, 8, 6, '#b6c29a', P.roofGreen, { chimney: true });

    building(70, 39, 6, 5, P.wallBlue, P.roofBlue, { sign: '#66abc0' });

    building(83, 59, 6, 6, P.wallCream, P.roofRed);
  }

  function plaza() {
    tileRect(44, 31, 14, 11, P.stone0);
    tileRect(45, 32, 12, 9, P.stone1);
    for (let y = 32; y < 41; y++) {
      for (let x = 45; x < 57; x++) {
        if ((x + y) % 2 === 0) rect(tx(x) + 2, ty(y) + 2, 3, 3, P.stone2);
      }
    }

    tileRect(49, 34, 4, 4, P.outline);
    tileRect(49.25, 34.25, 3.5, 3.5, '#6f9ba2');
    tileRect(50, 35, 2, 2, '#9bc5c7');
    rect(tx(50.75), ty(33.2), 8, 18, P.stone2);
    rect(tx(50.95), ty(32.9), 4, 10, P.lamp);
  }

  function tree(x, y, s = 1) {
    const px = tx(x);
    const py = ty(y);
    const u = Math.max(1, Math.round(s * 2));

    rect(px - 3 * u, py + 6 * u, 6 * u, 12 * u, '#5e4635');
    rect(px - 11 * u, py - 1 * u, 22 * u, 15 * u, P.treeDark);
    rect(px - 8 * u, py - 7 * u, 18 * u, 16 * u, P.treeMid);
    rect(px - 2 * u, py - 10 * u, 10 * u, 8 * u, P.treeLight);
    rect(px + 3 * u, py - 6 * u, 4 * u, 4 * u, '#79a76a');
  }

  function pine(x, y, s = 1) {
    const px = tx(x);
    const py = ty(y);
    const u = Math.max(1, Math.round(s * 2));
    rect(px - 2 * u, py + 4 * u, 4 * u, 12 * u, '#5a4332');
    rect(px - 10 * u, py + 1 * u, 20 * u, 6 * u, P.pineDark);
    rect(px - 8 * u, py - 5 * u, 16 * u, 7 * u, P.pineMid);
    rect(px - 6 * u, py - 10 * u, 12 * u, 6 * u, P.pineDark);
  }

  function flowerPatch(x, y, color) {
    rect(tx(x), ty(y), tx(2.3), 6, P.treeDark);
    for (let i = 0; i < 5; i++) {
      rect(tx(x) + 3 + i * 6, ty(y) - (i % 2) * 2, 4, 4, color);
    }
  }

  function lamp(x, y) {
    rect(tx(x) + 5, ty(y), 3, 18, '#343d3e');
    rect(tx(x) + 2, ty(y) - 3, 9, 7, P.outline);
    rect(tx(x) + 4, ty(y) - 1, 5, 3, P.lamp);
  }

  function bench(x, y) {
    rect(tx(x), ty(y), 24, 5, P.wood2);
    rect(tx(x), ty(y) + 7, 24, 4, P.wood1);
    rect(tx(x) + 3, ty(y) + 11, 3, 8, P.outline);
    rect(tx(x) + 18, ty(y) + 11, 3, 8, P.outline);
  }

  function drawDecor() {
    const highTrees = [
      [3, 4, 1], [23, 5, 1], [26, 10, 1], [38, 4, 1], [52, 4, 1],
      [68, 4, 1], [70, 10, 1], [3, 12, 1], [23, 13, 1], [37, 13, 1],
      [64, 13, 1]
    ];
    highTrees.forEach(([x, y, s], i) => (i % 3 === 0 ? pine(x, y, s) : tree(x, y, s)));

    for (let x = 1; x < 74; x += 4) {
      if ([9, 13, 17, 29, 33, 45, 49, 57, 61].includes(x)) continue;
      if (hash(x, 12, 90) > 0.42) pine(x, 14, 0.9);
    }

    const townTrees = [
      [3, 23], [18, 24], [32, 24], [47, 23], [66, 23],
      [4, 34], [18, 35], [32, 34], [65, 35],
      [4, 46], [18, 46], [33, 46], [60, 46],
      [10, 54], [19, 56], [31, 55], [54, 55], [61, 54]
    ];
    townTrees.forEach(([x, y], i) => tree(x, y, i % 4 === 0 ? 1.05 : 0.9));

    flowerPatch(17, 27, P.flowerPink);
    flowerPatch(35, 28, P.flowerYellow);
    flowerPatch(5, 44, P.flowerPurple);
    flowerPatch(21, 44, P.flowerPink);
    flowerPatch(53, 44, P.flowerYellow);
    flowerPatch(59, 28, P.flowerPurple);

    bench(42, 39);
    bench(57, 39);
    lamp(43, 33);
    lamp(59, 33);
    lamp(18, 31);
    lamp(34, 31);
    lamp(61, 31);

    for (let x = 6; x < 64; x += 8) {
      rect(tx(x), ty(47), 3, 12, '#4a3c31');
      rect(tx(x), ty(47), tx(5), 3, '#78604a');
    }

    // Beach details
    rect(tx(72), ty(36), 3, 28, '#6e4f3c');
    rect(tx(69.8), ty(35.5), 34, 4, '#b85d5d');
    rect(tx(70.5), ty(35.75), 20, 3, '#e9d69e');

    tileRect(72, 48, 3, 1.4, '#65a6ae');
    tileRect(76, 46.5, 2.3, 1.2, '#5b9da7');
    tileRect(68.5, 45, 2.4, 1.1, '#72adb1');

    // Lighthouse
    rect(tx(86) + 5, ty(56), 20, 80, P.outline);
    rect(tx(86) + 9, ty(56) + 4, 12, 76, '#ddd6c4');
    rect(tx(86) + 9, ty(59), 12, 10, '#a64d45');
    rect(tx(86) + 4, ty(55), 22, 10, P.outline);
    rect(tx(86) + 7, ty(55) + 2, 16, 6, '#6fa5ad');
    rect(tx(86) + 1, ty(54) + 4, 28, 5, P.roofRed);
  }

  function drawCoastFoam() {
    const foam = [
      [75, 50, 10], [68, 55, 11], [58, 61, 9], [47, 64, 10], [35, 66, 9],
      [80, 42, 7], [85, 35, 6], [90, 52, 5], [94, 57, 5]
    ];
    foam.forEach(([x, y, w], i) => {
      rect(tx(x), ty(y), tx(w * 0.6), 2, i % 2 ? P.foam : '#a7d2d9');
      rect(tx(x) + 8, ty(y) + 5, tx(w * 0.35), 2, P.foam);
    });
  }

  function drawTown() {
    drawSea();
    drawLand();
    drawRoads();
    plaza();
    drawBuildings();
    drawDecor();
    drawCoastFoam();

    // Tiny rail line across the highland.
    tileRect(2, 3, 67, 0.35, '#2f3437');
    tileRect(2, 4.1, 67, 0.35, '#2f3437');
    for (let x = 2; x < 69; x += 2) {
      rect(tx(x), ty(3.35), 3, 15, '#5d493a');
    }
  }

  drawTown();

  let scale = 1;
  let minScale = 0.25;
  let maxScale = 3.2;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function clampView() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = WORLD_W * scale;
    const sh = WORLD_H * scale;

    const margin = 80;

    if (sw <= vw) offsetX = (vw - sw) / 2;
    else offsetX = Math.min(margin, Math.max(vw - sw - margin, offsetX));

    if (sh <= vh) offsetY = (vh - sh) / 2;
    else offsetY = Math.min(margin, Math.max(vh - sh - margin, offsetY));
  }

  function applyTransform() {
    clampView();
    canvas.style.transform =
      'translate3d(' + Math.round(offsetX) + 'px,' +
      Math.round(offsetY) + 'px,0) scale(' + scale.toFixed(4) + ')';
  }

  function fitWholeMap() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    minScale = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.94;
    scale = minScale;
    offsetX = (vw - WORLD_W * scale) / 2;
    offsetY = (vh - WORLD_H * scale) / 2;
    applyTransform();
  }

  function focusTown() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    minScale = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.94;

    if (vw / vh < 0.72) {
      scale = Math.max(minScale, vh / WORLD_H * 0.9);
      const focusX = tx(48);
      const focusY = ty(34);
      offsetX = vw / 2 - focusX * scale;
      offsetY = vh / 2 - focusY * scale;
    } else {
      scale = Math.max(minScale, Math.min(vw / WORLD_W, vh / WORLD_H) * 1.08);
      offsetX = (vw - WORLD_W * scale) / 2;
      offsetY = (vh - WORLD_H * scale) / 2;
    }

    applyTransform();
  }

  function zoomAt(nextScale, cx, cy) {
    nextScale = Math.max(minScale, Math.min(maxScale, nextScale));
    const wx = (cx - offsetX) / scale;
    const wy = (cy - offsetY) / scale;

    scale = nextScale;
    offsetX = cx - wx * scale;
    offsetY = cy - wy * scale;
    applyTransform();
  }

  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    const rectV = viewport.getBoundingClientRect();
    const cx = event.clientX - rectV.left;
    const cy = event.clientY - rectV.top;
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(scale * factor, cx, cy);
  }, { passive: false });

  viewport.addEventListener('pointerdown', event => {
    viewport.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 1) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      viewport.classList.add('dragging');
    } else if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartScale = scale;
      dragging = false;
    }
  });

  viewport.addEventListener('pointermove', event => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rectV = viewport.getBoundingClientRect();
      const cx = (pts[0].x + pts[1].x) / 2 - rectV.left;
      const cy = (pts[0].y + pts[1].y) / 2 - rectV.top;

      if (pinchStartDistance > 0) {
        zoomAt(pinchStartScale * (distance / pinchStartDistance), cx, cy);
      }
      return;
    }

    if (!dragging) return;
    offsetX += event.clientX - lastX;
    offsetY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyTransform();
  });

  function releasePointer(event) {
    activePointers.delete(event.pointerId);

    if (activePointers.size === 1) {
      const point = [...activePointers.values()][0];
      dragging = true;
      lastX = point.x;
      lastY = point.y;
    } else {
      dragging = false;
      viewport.classList.remove('dragging');
    }
  }

  viewport.addEventListener('pointerup', releasePointer);
  viewport.addEventListener('pointercancel', releasePointer);

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'fit') {
      fitWholeMap();
      return;
    }

    const rectV = viewport.getBoundingClientRect();
    const cx = rectV.width / 2;
    const cy = rectV.height / 2;
    zoomAt(scale * (action === 'in' ? 1.2 : 0.84), cx, cy);
  });

  let resizeTimer = null;

  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      focusTown();
    }, 40);
  }

  window.addEventListener('resize', resize);
  requestAnimationFrame(focusTown);

  return {
    canvas,
    viewport,
    fitWholeMap,
    focusTown
  };
}
