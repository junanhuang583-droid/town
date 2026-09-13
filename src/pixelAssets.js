export const TILE = 16;

export const PALETTE = {
  outline: '#32282b',
  outline2: '#46343a',
  shadow: '#29403f',
  water0: '#2d78a3',
  water1: '#3f8db3',
  water2: '#5aa3c0',
  waterHi: '#8fcbd3',
  grass0: '#60934e',
  grass1: '#73a85a',
  grass2: '#8cbd67',
  grassHi: '#b4cf78',
  dirt0: '#8b6845',
  dirt1: '#a98055',
  dirt2: '#c19b69',
  stone0: '#77736e',
  stone1: '#a19a8d',
  stone2: '#c5b9a6',
  sand0: '#c9a461',
  sand1: '#dfbe78',
  sand2: '#f1d493',
  cliff0: '#59463a',
  cliff1: '#755b45',
  cliff2: '#957455',
  cliffHi: '#b08d67',
  wood0: '#69452f',
  wood1: '#8a5b39',
  wood2: '#ac7447',
  rail: '#34383d',
  tie: '#644934',
  wallCream: '#d7c493',
  wallBlue: '#9eb7ad',
  wallRose: '#c99582',
  wallGreen: '#a9bb7d',
  wallLilac: '#b7a0b1',
  wallTan: '#c6af81',
  roofRed: '#8b493f',
  roofBlue: '#45687c',
  roofGreen: '#4f704f',
  roofPurple: '#6c506a',
  roofBrown: '#6b4d36',
  trim: '#eadcb4',
  glass: '#8fc7c8',
  glassHi: '#d6eee4',
  flowerPink: '#df8da3',
  flowerYellow: '#e3c55f',
  flowerPurple: '#a27db5',
  treeDark: '#2f5b3e',
  treeMid: '#477b49',
  treeLight: '#70a957',
  pineDark: '#264a39',
  pineMid: '#3c6850',
  lamp: '#f3d37a',
  white: '#f3ead0'
};

function sprite(w, h, painter) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  painter(ctx, w, h);
  return canvas;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hash(a, b, c = 0) {
  let n = (a * 374761393 + b * 668265263 + c * 1442695041) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function grassTile(seed = 0, tone = 'normal') {
  const base = tone === 'high' ? PALETTE.grass2 : tone === 'low' ? PALETTE.grass0 : PALETTE.grass1;
  const hi = tone === 'high' ? PALETTE.grassHi : PALETTE.grass2;
  const dark = tone === 'high' ? PALETTE.grass1 : PALETTE.grass0;

  return sprite(16, 16, ctx => {
    px(ctx, 0, 0, 16, 16, base);

    for (let i = 0; i < 6; i++) {
      const x = 1 + Math.floor(hash(seed, i, 10) * 13);
      const y = 3 + Math.floor(hash(seed, i, 11) * 11);
      const col = i % 3 === 0 ? hi : dark;

      if (i % 2 === 0) {
        px(ctx, x, y, 1, 3, col);
        px(ctx, x + 1, y + 1, 1, 2, col);
      } else {
        px(ctx, x, y, 2, 1, col);
      }
    }

    if (seed % 4 === 0) {
      px(ctx, 11, 4, 1, 1, '#c6d481');
      px(ctx, 12, 5, 1, 1, '#c6d481');
    }
  });
}

function waterTile(seed = 0) {
  return sprite(16, 16, ctx => {
    const base = seed % 3 === 0 ? PALETTE.water0 : PALETTE.water1;
    px(ctx, 0, 0, 16, 16, base);

    const y = 3 + (seed % 5);
    px(ctx, 1, y, 7, 1, PALETTE.water2);
    px(ctx, 10, y + 4, 5, 1, PALETTE.water2);

    if (seed % 2 === 0) {
      px(ctx, 4, 13, 5, 1, PALETTE.waterHi);
      px(ctx, 6, 12, 3, 1, PALETTE.water2);
    }
  });
}

function sandTile(seed = 0) {
  return sprite(16, 16, ctx => {
    px(ctx, 0, 0, 16, 16, PALETTE.sand1);

    for (let i = 0; i < 5; i++) {
      const x = 2 + Math.floor(hash(seed, i, 20) * 11);
      const y = 2 + Math.floor(hash(seed, i, 21) * 11);
      px(ctx, x, y, 1, 1, i % 2 ? PALETTE.sand0 : PALETTE.sand2);
    }

    if (seed % 4 === 0) {
      px(ctx, 3, 11, 5, 1, PALETTE.sand2);
      px(ctx, 5, 12, 3, 1, PALETTE.sand2);
    }
  });
}

function terrainTransition(kind, mask) {
  const isSand = kind === 'sand';
  const light = isSand ? PALETTE.sand2 : PALETTE.grassHi;
  const dark = isSand ? PALETTE.sand0 : PALETTE.grass0;

  return sprite(16, 16, ctx => {
    const n = mask & 1;
    const e = mask & 2;
    const s = mask & 4;
    const w = mask & 8;

    if (n) {
      px(ctx, 0, 0, 16, 2, dark);
      px(ctx, 2, 2, 12, 1, light);
    }
    if (s) {
      px(ctx, 0, 14, 16, 2, dark);
      px(ctx, 3, 13, 10, 1, light);
    }
    if (w) {
      px(ctx, 0, 0, 2, 16, dark);
      px(ctx, 2, 3, 1, 10, light);
    }
    if (e) {
      px(ctx, 14, 0, 2, 16, dark);
      px(ctx, 13, 2, 1, 11, light);
    }
  });
}

function pathTile(kind, mask, seed = 0) {
  const cfg = {
    dirt: [PALETTE.dirt0, PALETTE.dirt1, PALETTE.dirt2],
    stone: [PALETTE.stone0, PALETTE.stone1, PALETTE.stone2],
    board: [PALETTE.wood0, PALETTE.wood1, PALETTE.wood2]
  }[kind];

  const [dark, base, hi] = cfg;

  return sprite(16, 16, ctx => {
    const n = mask & 1;
    const e = mask & 2;
    const s = mask & 4;
    const w = mask & 8;

    const organic = kind === 'dirt';
    const inset = organic ? 3 : 2;

    px(ctx, inset, inset, 16 - inset * 2, 16 - inset * 2, base);

    if (n) px(ctx, inset, 0, 16 - inset * 2, 8, base);
    if (s) px(ctx, inset, 8, 16 - inset * 2, 8, base);
    if (w) px(ctx, 0, inset, 8, 16 - inset * 2, base);
    if (e) px(ctx, 8, inset, 8, 16 - inset * 2, base);

    if (n && w) px(ctx, 0, 0, 8, 8, base);
    if (n && e) px(ctx, 8, 0, 8, 8, base);
    if (s && w) px(ctx, 0, 8, 8, 8, base);
    if (s && e) px(ctx, 8, 8, 8, 8, base);

    if (!n) {
      px(ctx, inset, inset, 16 - inset * 2, 1, hi);
      if (organic) px(ctx, inset + 2, inset - 1, 4, 1, hi);
    }
    if (!s) px(ctx, inset, 15 - inset, 16 - inset * 2, 1, dark);
    if (!w) px(ctx, inset, inset + 2, 1, 10 - inset, dark);
    if (!e) px(ctx, 15 - inset, inset + 1, 1, 10 - inset, dark);

    if (kind === 'dirt') {
      if (seed % 2 === 0) px(ctx, 7, 7, 2, 1, dark);
      if (seed % 3 === 0) px(ctx, 11, 11, 2, 1, hi);
    }

    if (kind === 'stone') {
      px(ctx, 3, 6, 5, 1, dark);
      px(ctx, 10, 10, 4, 1, hi);
      px(ctx, 8, 2, 1, 5, dark);
    }

    if (kind === 'board') {
      for (let x = 2; x < 16; x += 5) px(ctx, x, 0, 1, 16, dark);
      px(ctx, 0, 3, 16, 1, hi);
      px(ctx, 0, 12, 16, 1, dark);
    }
  });
}

function cliffFace(seed = 0) {
  return sprite(16, 18, ctx => {
    px(ctx, 0, 0, 16, 18, PALETTE.cliff1);
    px(ctx, 0, 0, 16, 3, PALETTE.cliffHi);
    px(ctx, 0, 15, 16, 3, PALETTE.cliff0);

    const a = 2 + seed % 4;
    px(ctx, a, 4, 2, 6, PALETTE.cliff2);
    px(ctx, a + 6, 8, 1, 5, PALETTE.cliff0);
    px(ctx, 12, 5, 2, 4, PALETTE.cliff2);
    px(ctx, 4, 12, 6, 1, PALETTE.cliffHi);
  });
}

function foamTile(mask, seed = 0) {
  return sprite(16, 16, ctx => {
    const n = mask & 1;
    const e = mask & 2;
    const s = mask & 4;
    const w = mask & 8;
    const c = seed % 2 ? PALETTE.waterHi : '#b9dfe0';

    if (n) {
      px(ctx, 1, 1, 7, 1, c);
      px(ctx, 9, 2, 5, 1, c);
    }
    if (s) {
      px(ctx, 2, 14, 8, 1, c);
      px(ctx, 11, 13, 3, 1, c);
    }
    if (w) {
      px(ctx, 1, 3, 1, 7, c);
      px(ctx, 2, 11, 1, 3, c);
    }
    if (e) {
      px(ctx, 14, 2, 1, 8, c);
      px(ctx, 13, 11, 1, 3, c);
    }
  });
}

function railTile() {
  return sprite(16, 16, ctx => {
    px(ctx, 0, 0, 16, 16, PALETTE.grass2);
    px(ctx, 0, 3, 16, 2, PALETTE.rail);
    px(ctx, 0, 11, 16, 2, PALETTE.rail);
    px(ctx, 2, 1, 2, 14, PALETTE.tie);
    px(ctx, 10, 1, 2, 14, PALETTE.tie);
    px(ctx, 0, 5, 16, 1, '#78806e');
  });
}

function stairsTile() {
  return sprite(16, 16, ctx => {
    px(ctx, 0, 0, 16, 16, PALETTE.cliff1);
    for (let y = 1; y < 16; y += 3) {
      px(ctx, 2, y, 12, 2, PALETTE.stone2);
      px(ctx, 2, y + 2, 12, 1, PALETTE.stone0);
    }
  });
}

function roofShingles(ctx, x, y, w, h, color, dark = PALETTE.outline) {
  const rows = Math.max(4, Math.floor(h / 6));

  for (let row = 0; row < rows; row++) {
    const inset = row * 4;
    const yy = y + row * 5;
    const ww = Math.max(8, w - inset * 2);

    px(ctx, x + inset, yy, ww, 6, dark);
    px(ctx, x + inset + 2, yy + 1, ww - 4, 4, color);

    for (let sx = x + inset + 6 + (row % 2) * 4; sx < x + inset + ww - 4; sx += 12) {
      px(ctx, sx, yy + 4, 5, 1, '#ffffff18');
    }
  }
}

function roofHip(ctx, x, y, w, h, color) {
  const rows = Math.max(4, Math.floor(h / 5));

  for (let row = 0; row < rows; row++) {
    const inset = row * 3;
    const yy = y + row * 4;
    const ww = Math.max(10, w - inset * 2);
    px(ctx, x + inset, yy, ww, 5, PALETTE.outline);
    px(ctx, x + inset + 2, yy + 1, ww - 4, 3, color);
  }
}

function windowSprite(ctx, x, y, wide = false) {
  const w = wide ? 20 : 13;
  px(ctx, x, y, w, 14, PALETTE.outline);
  px(ctx, x + 2, y + 2, w - 4, 10, PALETTE.glass);
  px(ctx, x + Math.floor(w / 2) - 1, y + 2, 2, 10, PALETTE.glassHi);
  px(ctx, x + 2, y + 7, w - 4, 1, '#dff1e7');
  px(ctx, x - 1, y + 13, w + 2, 2, '#5d463b');
}

function doorSprite(ctx, x, y, color = '#684b3b', double = false) {
  const w = double ? 24 : 15;
  px(ctx, x, y, w, 27, PALETTE.outline);
  px(ctx, x + 2, y + 2, w - 4, 25, color);

  if (double) {
    px(ctx, x + 11, y + 2, 2, 25, PALETTE.outline2);
  }

  px(ctx, x + w - 5, y + 13, 2, 2, PALETTE.lamp);
}

function flowerBox(ctx, x, y, w, color) {
  px(ctx, x, y + 4, w, 5, PALETTE.wood0);
  px(ctx, x + 1, y + 4, w - 2, 2, PALETTE.wood2);

  for (let i = 3; i < w - 2; i += 7) {
    px(ctx, x + i, y, 3, 3, color);
    px(ctx, x + i + 1, y + 3, 1, 2, PALETTE.treeMid);
  }
}

function awning(ctx, x, y, w, color) {
  px(ctx, x, y, w, 11, PALETTE.outline);
  px(ctx, x + 2, y + 2, w - 4, 6, color);

  for (let i = 4; i < w - 4; i += 12) {
    px(ctx, x + i, y + 2, 5, 6, PALETTE.trim);
  }

  for (let i = 3; i < w - 3; i += 10) {
    px(ctx, x + i, y + 8, 6, 3, color);
  }
}

function wallTexture(ctx, x, y, w, h, wall, kind = 'plaster') {
  px(ctx, x, y, w, h, wall);

  if (kind === 'timber') {
    for (let yy = y + 8; yy < y + h - 4; yy += 16) {
      px(ctx, x + 3, yy, w - 6, 2, '#7f5e45');
    }
    for (let xx = x + 8; xx < x + w - 6; xx += 24) {
      px(ctx, xx, y + 3, 2, h - 6, '#7f5e45');
    }
  } else {
    for (let yy = y + 7; yy < y + h - 4; yy += 12) {
      px(ctx, x + 4 + (yy % 3), yy, 9, 1, '#ffffff16');
    }
  }
}

function makeHouse({
  tw = 7,
  th = 6,
  wall = PALETTE.wallCream,
  roof = PALETTE.roofRed,
  roofType = 'gable',
  wallKind = 'plaster',
  chimney = true,
  porch = true,
  flowerColor = null,
  dormer = false
} = {}) {
  const w = tw * 16;
  const h = (th + 3) * 16;

  return sprite(w, h, ctx => {
    const wallTop = 58;
    const groundY = h - 11;

    px(ctx, 10, groundY - 2, w - 12, 8, '#20373555');
    px(ctx, 7, wallTop, w - 14, h - wallTop - 12, PALETTE.outline);
    wallTexture(ctx, 10, wallTop + 3, w - 20, h - wallTop - 18, wall, wallKind);

    if (roofType === 'hip') roofHip(ctx, 1, 12, w - 2, 46, roof);
    else roofShingles(ctx, 0, 10, w, 48, roof);

    if (chimney) {
      px(ctx, w - 30, 10, 13, 34, PALETTE.outline);
      px(ctx, w - 27, 13, 7, 28, '#805544');
      px(ctx, w - 32, 8, 17, 6, PALETTE.outline);
      px(ctx, w - 29, 9, 11, 3, '#a36d54');
    }

    if (dormer) {
      px(ctx, Math.floor(w / 2) - 15, 29, 30, 23, PALETTE.outline);
      px(ctx, Math.floor(w / 2) - 12, 32, 24, 18, wall);
      roofShingles(ctx, Math.floor(w / 2) - 18, 20, 36, 16, roof);
      windowSprite(ctx, Math.floor(w / 2) - 7, 35, false);
    }

    windowSprite(ctx, 15, groundY - 44, tw >= 8);
    windowSprite(ctx, w - (tw >= 8 ? 38 : 30), groundY - 44, tw >= 8);
    doorSprite(ctx, Math.floor(w / 2) - 7, groundY - 30);

    if (flowerColor) {
      flowerBox(ctx, 13, groundY - 26, 28, flowerColor);
      flowerBox(ctx, w - 41, groundY - 26, 28, flowerColor);
    }

    if (porch) {
      px(ctx, 9, groundY - 1, w - 18, 6, PALETTE.wood0);
      px(ctx, 12, groundY - 4, w - 24, 4, PALETTE.wood2);
      px(ctx, 14, groundY - 10, 3, 10, PALETTE.wood1);
      px(ctx, w - 17, groundY - 10, 3, 10, PALETTE.wood1);
    }
  });
}

function makeStore({
  tw = 8,
  th = 7,
  wall = PALETTE.wallCream,
  roof = PALETTE.roofRed,
  awningColor = '#c87968',
  signColor = PALETTE.flowerYellow,
  roofType = 'gable',
  upper = true,
  sideWing = false
} = {}) {
  const w = tw * 16;
  const h = (th + 3) * 16;

  return sprite(w, h, ctx => {
    const wallTop = 55;
    const groundY = h - 11;

    px(ctx, 10, groundY - 2, w - 12, 8, '#20373555');
    px(ctx, 6, wallTop, w - 12, h - wallTop - 12, PALETTE.outline);
    wallTexture(ctx, 9, wallTop + 3, w - 18, h - wallTop - 18, wall, 'plaster');

    if (roofType === 'hip') roofHip(ctx, 0, 10, w, 45, roof);
    else roofShingles(ctx, 0, 8, w, 48, roof);

    if (upper) {
      windowSprite(ctx, 22, 61, true);
      windowSprite(ctx, w - 42, 61, true);
    }

    awning(ctx, 12, groundY - 61, w - 24, awningColor);
    windowSprite(ctx, 16, groundY - 44, true);
    windowSprite(ctx, w - 36, groundY - 44, true);
    doorSprite(ctx, Math.floor(w / 2) - 7, groundY - 30);

    px(ctx, w - 19, 52, 15, 20, PALETTE.outline);
    px(ctx, w - 16, 55, 9, 12, signColor);
    px(ctx, w - 14, 58, 5, 2, PALETTE.trim);

    px(ctx, 9, groundY - 1, w - 18, 5, PALETTE.wood0);
    px(ctx, 12, groundY - 4, w - 24, 3, PALETTE.wood2);

    if (sideWing) {
      px(ctx, 2, groundY - 54, 18, 42, PALETTE.outline);
      px(ctx, 5, groundY - 51, 12, 36, wall);
      px(ctx, 1, groundY - 58, 20, 8, roof);
    }
  });
}

function makeInn() {
  const w = 10 * 16;
  const h = 11 * 16;

  return sprite(w, h, ctx => {
    const groundY = h - 11;

    px(ctx, 10, groundY - 2, w - 12, 8, '#20373555');
    px(ctx, 8, 66, w - 16, h - 78, PALETTE.outline);
    wallTexture(ctx, 12, 70, w - 24, h - 86, PALETTE.wallBlue, 'timber');

    roofShingles(ctx, 0, 8, w, 58, PALETTE.roofBlue);

    // Twin dormers and central sign create a real landmark silhouette.
    for (const dx of [32, w - 58]) {
      px(ctx, dx, 35, 26, 26, PALETTE.outline);
      px(ctx, dx + 3, 38, 20, 20, PALETTE.wallBlue);
      roofShingles(ctx, dx - 4, 28, 34, 14, PALETTE.roofBlue);
      windowSprite(ctx, dx + 7, 42, false);
    }

    px(ctx, w / 2 - 22, 62, 44, 15, PALETTE.outline);
    px(ctx, w / 2 - 19, 65, 38, 9, '#b98553');
    px(ctx, w / 2 - 9, 67, 18, 3, PALETTE.trim);

    windowSprite(ctx, 20, groundY - 47, true);
    windowSprite(ctx, w - 40, groundY - 47, true);
    doorSprite(ctx, w / 2 - 12, groundY - 31, '#5e4638', true);

    flowerBox(ctx, 18, groundY - 28, 32, PALETTE.flowerPink);
    flowerBox(ctx, w - 50, groundY - 28, 32, PALETTE.flowerYellow);

    px(ctx, 8, groundY - 1, w - 16, 6, PALETTE.wood0);
    px(ctx, 12, groundY - 4, w - 24, 4, PALETTE.wood2);
  });
}

function makeStation() {
  const w = 12 * 16;
  const h = 10 * 16;

  return sprite(w, h, ctx => {
    const groundY = h - 10;

    px(ctx, 9, groundY - 3, w - 10, 8, '#20373555');
    px(ctx, 8, 65, w - 16, h - 77, PALETTE.outline);
    wallTexture(ctx, 12, 69, w - 24, h - 85, PALETTE.wallBlue, 'timber');

    roofHip(ctx, 0, 8, w, 56, PALETTE.roofBlue);

    px(ctx, 24, 60, w - 48, 12, PALETTE.outline);
    px(ctx, 28, 63, w - 56, 6, '#6c9099');

    windowSprite(ctx, 24, groundY - 55, true);
    windowSprite(ctx, w - 44, groundY - 55, true);
    doorSprite(ctx, w / 2 - 12, groundY - 32, '#5f493b', true);

    // Clock.
    px(ctx, w / 2 - 10, 46, 20, 20, PALETTE.outline);
    px(ctx, w / 2 - 7, 49, 14, 14, PALETTE.trim);
    px(ctx, w / 2 - 1, 52, 2, 7, PALETTE.outline2);
    px(ctx, w / 2 - 1, 58, 6, 2, PALETTE.outline2);

    px(ctx, 18, groundY - 2, w - 36, 6, PALETTE.stone0);
    px(ctx, 24, groundY + 4, w - 48, 3, PALETTE.stone2);

    px(ctx, w - 25, 70, 18, 14, PALETTE.outline);
    px(ctx, w - 22, 73, 12, 8, '#d29a54');
  });
}

function makeRental() {
  const w = 7 * 16;
  const h = 8 * 16;

  return sprite(w, h, ctx => {
    const groundY = h - 10;
    px(ctx, 7, groundY - 2, w - 9, 7, '#20373555');
    px(ctx, 8, 52, w - 16, h - 64, PALETTE.outline);
    wallTexture(ctx, 11, 55, w - 22, h - 70, PALETTE.wallTan, 'timber');
    roofShingles(ctx, 0, 12, w, 42, PALETTE.roofBrown);

    windowSprite(ctx, 15, groundY - 43, false);
    doorSprite(ctx, w - 34, groundY - 30);

    px(ctx, 13, 61, 32, 14, PALETTE.outline);
    px(ctx, 16, 64, 26, 8, '#599aae');
    px(ctx, 20, 66, 18, 3, PALETTE.trim);

    px(ctx, 8, groundY - 1, w - 16, 5, PALETTE.wood0);
  });
}

function makeLighthouse() {
  return sprite(72, 144, ctx => {
    px(ctx, 16, 132, 40, 6, '#20373555');
    px(ctx, 21, 45, 30, 90, PALETTE.outline);

    for (let y = 48; y < 132; y += 18) {
      px(ctx, 25, y, 22, 16, '#e9e1c9');
    }

    px(ctx, 25, 72, 22, 13, '#ae5147');
    px(ctx, 25, 108, 22, 12, '#ae5147');

    px(ctx, 18, 34, 36, 18, PALETTE.outline);
    px(ctx, 22, 38, 28, 10, '#79afb4');
    px(ctx, 14, 29, 44, 8, PALETTE.outline);
    px(ctx, 19, 31, 34, 4, PALETTE.roofRed);

    px(ctx, 22, 20, 28, 11, PALETTE.roofRed);
    px(ctx, 27, 14, 18, 8, PALETTE.roofRed);
    px(ctx, 32, 10, 8, 5, PALETTE.outline);

    doorSprite(ctx, 29, 105);
    windowSprite(ctx, 30, 58, false);
    windowSprite(ctx, 30, 90, false);
  });
}

function makeTree() {
  return sprite(48, 64, ctx => {
    px(ctx, 18, 40, 12, 19, '#654734');
    px(ctx, 8, 23, 34, 28, PALETTE.outline);
    px(ctx, 10, 20, 30, 27, PALETTE.treeDark);
    px(ctx, 4, 28, 21, 19, PALETTE.treeMid);
    px(ctx, 24, 18, 20, 24, PALETTE.treeMid);
    px(ctx, 10, 11, 26, 25, PALETTE.treeLight);
    px(ctx, 14, 10, 10, 7, '#89b967');
    px(ctx, 31, 23, 6, 6, '#7bad61');
    px(ctx, 9, 34, 6, 5, '#5c914e');
  });
}

function makePine() {
  return sprite(44, 68, ctx => {
    px(ctx, 18, 45, 8, 18, '#604634');
    px(ctx, 3, 39, 38, 12, PALETTE.outline);
    px(ctx, 6, 35, 32, 13, PALETTE.pineDark);
    px(ctx, 9, 26, 26, 14, PALETTE.pineMid);
    px(ctx, 12, 17, 20, 13, PALETTE.pineDark);
    px(ctx, 15, 8, 14, 13, PALETTE.pineMid);
    px(ctx, 20, 3, 5, 8, PALETTE.pineDark);
  });
}

function makeBush() {
  return sprite(28, 22, ctx => {
    px(ctx, 3, 10, 22, 10, PALETTE.outline);
    px(ctx, 6, 7, 17, 11, PALETTE.treeDark);
    px(ctx, 2, 12, 12, 7, PALETTE.treeMid);
    px(ctx, 14, 10, 12, 8, PALETTE.treeLight);
    px(ctx, 9, 6, 7, 5, '#82ae63');
  });
}

function makeFlower(color) {
  return sprite(16, 16, ctx => {
    px(ctx, 2, 10, 12, 3, PALETTE.treeDark);
    px(ctx, 4, 6, 3, 3, color);
    px(ctx, 10, 7, 3, 3, color);
    px(ctx, 7, 4, 3, 3, color);
    px(ctx, 7, 10, 2, 4, PALETTE.treeMid);
  });
}

function makeRock() {
  return sprite(20, 16, ctx => {
    px(ctx, 2, 7, 16, 7, PALETTE.outline);
    px(ctx, 5, 4, 11, 8, PALETTE.stone1);
    px(ctx, 7, 3, 8, 4, PALETTE.stone2);
    px(ctx, 5, 11, 10, 2, PALETTE.stone0);
  });
}

function makeBench() {
  return sprite(34, 24, ctx => {
    px(ctx, 3, 4, 28, 6, PALETTE.outline);
    px(ctx, 5, 5, 24, 4, PALETTE.wood2);
    px(ctx, 4, 12, 26, 5, PALETTE.outline);
    px(ctx, 6, 13, 22, 3, PALETTE.wood1);
    px(ctx, 8, 16, 3, 7, PALETTE.outline);
    px(ctx, 23, 16, 3, 7, PALETTE.outline);
  });
}

function makeLamp() {
  return sprite(20, 40, ctx => {
    px(ctx, 9, 11, 3, 26, PALETTE.outline);
    px(ctx, 5, 6, 11, 11, PALETTE.outline);
    px(ctx, 7, 8, 7, 6, PALETTE.lamp);
    px(ctx, 6, 35, 9, 3, PALETTE.outline);
    px(ctx, 3, 38, 15, 2, PALETTE.outline);
  });
}

function makeBarrel() {
  return sprite(18, 22, ctx => {
    px(ctx, 3, 4, 12, 16, PALETTE.outline);
    px(ctx, 5, 3, 8, 17, PALETTE.wood1);
    px(ctx, 4, 7, 10, 2, PALETTE.wood2);
    px(ctx, 4, 14, 10, 2, PALETTE.wood0);
  });
}

function makeCrate() {
  return sprite(20, 20, ctx => {
    px(ctx, 2, 2, 16, 16, PALETTE.outline);
    px(ctx, 4, 4, 12, 12, PALETTE.wood1);
    px(ctx, 5, 5, 10, 2, PALETTE.wood2);
    px(ctx, 5, 13, 10, 2, PALETTE.wood0);
    px(ctx, 9, 5, 2, 10, PALETTE.outline);
  });
}

function makeParasol() {
  return sprite(38, 42, ctx => {
    px(ctx, 18, 18, 3, 22, '#714e39');
    px(ctx, 3, 10, 32, 9, PALETTE.outline);
    px(ctx, 6, 7, 26, 10, '#cd5f64');
    px(ctx, 11, 7, 5, 10, PALETTE.trim);
    px(ctx, 22, 7, 5, 10, PALETTE.trim);
    px(ctx, 9, 39, 21, 2, PALETTE.outline);
  });
}

function makeFountain() {
  return sprite(60, 58, ctx => {
    px(ctx, 6, 36, 48, 15, PALETTE.outline);
    px(ctx, 10, 32, 40, 15, PALETTE.stone1);
    px(ctx, 14, 33, 32, 10, '#6faeb8');
    px(ctx, 19, 34, 22, 7, '#9ed0cc');
    px(ctx, 27, 13, 6, 22, PALETTE.outline);
    px(ctx, 29, 10, 2, 20, PALETTE.stone2);
    px(ctx, 25, 7, 10, 7, PALETTE.outline);
    px(ctx, 28, 8, 4, 5, '#b7dcda');
  });
}

function makeSign(color = '#d69b55') {
  return sprite(22, 32, ctx => {
    px(ctx, 9, 13, 4, 17, PALETTE.outline);
    px(ctx, 4, 4, 14, 13, PALETTE.outline);
    px(ctx, 7, 7, 8, 7, color);
    px(ctx, 9, 9, 4, 2, PALETTE.trim);
  });
}

function makeFence() {
  return sprite(32, 18, ctx => {
    px(ctx, 2, 2, 4, 16, PALETTE.outline);
    px(ctx, 26, 2, 4, 16, PALETTE.outline);
    px(ctx, 4, 6, 24, 5, PALETTE.outline);
    px(ctx, 5, 7, 22, 3, PALETTE.wood2);
    px(ctx, 4, 12, 24, 4, PALETTE.outline);
    px(ctx, 5, 13, 22, 2, PALETTE.wood1);
  });
}

function makeTallGrass() {
  return sprite(20, 18, ctx => {
    px(ctx, 4, 10, 2, 7, PALETTE.treeDark);
    px(ctx, 7, 6, 2, 11, PALETTE.treeLight);
    px(ctx, 10, 9, 2, 8, PALETTE.treeMid);
    px(ctx, 13, 5, 2, 12, PALETTE.treeLight);
    px(ctx, 16, 10, 1, 7, PALETTE.treeDark);
  });
}

function makeMailbox() {
  return sprite(20, 30, ctx => {
    px(ctx, 9, 13, 3, 15, '#664b38');
    px(ctx, 4, 5, 13, 12, PALETTE.outline);
    px(ctx, 6, 7, 9, 8, '#8c6b4d');
    px(ctx, 14, 8, 5, 3, '#b7504e');
  });
}

export function createPixelAssets() {
  const terrain = {
    water: [0,1,2,3].map(i => waterTile(i)),
    grass: [0,1,2,3].map(i => grassTile(i, 'normal')),
    grassHigh: [0,1,2,3].map(i => grassTile(i, 'high')),
    grassLow: [0,1,2,3].map(i => grassTile(i, 'low')),
    sand: [0,1,2,3].map(i => sandTile(i)),
    grassEdge: Array.from({ length: 16 }, (_, mask) => terrainTransition('grass', mask)),
    sandEdge: Array.from({ length: 16 }, (_, mask) => terrainTransition('sand', mask)),
    cliff: [0,1,2,3].map(i => cliffFace(i)),
    foam: Array.from({ length: 16 }, (_, mask) =>
      [0,1].map(seed => foamTile(mask, seed))
    ),
    rail: railTile(),
    stairs: stairsTile()
  };

  const paths = {
    dirt: Array.from({ length: 16 }, (_, mask) =>
      [0,1,2].map(seed => pathTile('dirt', mask, seed))
    ),
    stone: Array.from({ length: 16 }, (_, mask) =>
      [0,1].map(seed => pathTile('stone', mask, seed))
    ),
    board: Array.from({ length: 16 }, (_, mask) =>
      [0,1].map(seed => pathTile('board', mask, seed))
    )
  };

  const buildings = {
    station: makeStation(),
    homeRed: makeHouse({
      tw: 7, th: 6, wall: PALETTE.wallCream, roof: PALETTE.roofRed,
      roofType: 'gable', flowerColor: PALETTE.flowerPink, dormer: true
    }),
    homeGreen: makeHouse({
      tw: 7, th: 6, wall: PALETTE.wallGreen, roof: PALETTE.roofGreen,
      roofType: 'hip', flowerColor: PALETTE.flowerYellow
    }),
    homeBlue: makeHouse({
      tw: 8, th: 6, wall: PALETTE.wallBlue, roof: PALETTE.roofBlue,
      roofType: 'gable', dormer: true
    }),
    inn: makeInn(),
    sweets: makeStore({
      tw: 7, th: 6, wall: PALETTE.wallCream, roof: PALETTE.roofRed,
      awningColor: '#d67a6c', signColor: PALETTE.flowerYellow, upper: false
    }),
    general: makeStore({
      tw: 8, th: 7, wall: PALETTE.wallGreen, roof: PALETTE.roofGreen,
      awningColor: '#71935f', signColor: '#d8bb5e', roofType: 'hip'
    }),
    cafe: makeStore({
      tw: 10, th: 8, wall: PALETTE.wallRose, roof: PALETTE.roofRed,
      awningColor: '#ca7c72', signColor: '#e6c05b', sideWing: true
    }),
    seafood: makeStore({
      tw: 9, th: 8, wall: PALETTE.wallLilac, roof: PALETTE.roofPurple,
      awningColor: '#8d6c8d', signColor: '#6eb5c3'
    }),
    rental: makeRental(),
    lighthouseHouse: makeHouse({
      tw: 6, th: 5, wall: PALETTE.wallCream, roof: PALETTE.roofRed,
      roofType: 'hip', chimney: false
    }),
    lighthouse: makeLighthouse()
  };

  const decor = {
    tree: makeTree(),
    pine: makePine(),
    bush: makeBush(),
    flowerPink: makeFlower(PALETTE.flowerPink),
    flowerYellow: makeFlower(PALETTE.flowerYellow),
    flowerPurple: makeFlower(PALETTE.flowerPurple),
    rock: makeRock(),
    bench: makeBench(),
    lamp: makeLamp(),
    barrel: makeBarrel(),
    crate: makeCrate(),
    parasol: makeParasol(),
    fountain: makeFountain(),
    sign: makeSign(),
    fence: makeFence(),
    tallGrass: makeTallGrass(),
    mailbox: makeMailbox()
  };

  return { terrain, paths, buildings, decor };
}
