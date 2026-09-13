export const TILE = 16;

export const PALETTE = {
  outline: '#2d2a29',
  shadow: '#25343a',
  water0: '#2a6f92',
  water1: '#347f9f',
  water2: '#4b96b1',
  waterHi: '#78b8c7',
  grass0: '#5c8355',
  grass1: '#6f965f',
  grass2: '#83a96b',
  grassHi: '#9cbb7a',
  dirt0: '#856e52',
  dirt1: '#a08762',
  dirt2: '#b89b70',
  stone0: '#77756f',
  stone1: '#9b978c',
  stone2: '#bdb5a5',
  sand0: '#c8a86b',
  sand1: '#dec286',
  sand2: '#efd8a1',
  cliff0: '#574b41',
  cliff1: '#6d5a49',
  cliff2: '#87705a',
  cliffHi: '#a18b6c',
  wood0: '#6d4932',
  wood1: '#875a3b',
  wood2: '#a46d47',
  rail: '#31383c',
  tie: '#604938',
  wallCream: '#cdbb91',
  wallBlue: '#95aaa6',
  wallRose: '#c49184',
  wallGreen: '#a3ae7e',
  wallLilac: '#b39aae',
  wallTan: '#c0ad86',
  roofRed: '#7d463d',
  roofBlue: '#435d70',
  roofGreen: '#4e694f',
  roofPurple: '#624e65',
  roofBrown: '#624a37',
  trim: '#e4d9b9',
  glass: '#8fc2c7',
  glassHi: '#c9e1d9',
  flowerPink: '#d58da0',
  flowerYellow: '#dfc263',
  flowerPurple: '#9d7aac',
  treeDark: '#31533e',
  treeMid: '#47724a',
  treeLight: '#68945b',
  pineDark: '#29493a',
  pineMid: '#3b6250',
  lamp: '#f0d27d'
};

function canvasSprite(w, h, painter) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  painter(ctx, w, h);
  return canvas;
}

function r(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hash(a, b, c = 0) {
  let n = (a * 374761393 + b * 668265263 + c * 1442695041) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function tileBase(color, accent, seed = 0, density = 4) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, TILE, TILE, color);
    for (let i = 0; i < density; i++) {
      const x = 2 + Math.floor(hash(seed, i, 1) * 12);
      const y = 2 + Math.floor(hash(seed, i, 2) * 12);
      r(ctx, x, y, 2, 2, accent);
    }
  });
}

function grassTile(seed = 0, high = false, low = false) {
  const base = high ? PALETTE.grass2 : low ? PALETTE.grass0 : PALETTE.grass1;
  const accent = high ? PALETTE.grassHi : PALETTE.grass2;
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, base);
    for (let i = 0; i < 5; i++) {
      const x = 1 + Math.floor(hash(seed, i, 3) * 13);
      const y = 3 + Math.floor(hash(seed, i, 4) * 11);
      if (i % 2 === 0) {
        r(ctx, x, y, 1, 3, accent);
        r(ctx, x + 1, y + 1, 1, 2, accent);
      } else {
        r(ctx, x, y, 2, 1, accent);
      }
    }
    if (seed % 7 === 0) {
      r(ctx, 10, 4, 1, 1, '#b7c77c');
      r(ctx, 11, 5, 1, 1, '#b7c77c');
    }
  });
}

function waterTile(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, seed % 3 === 0 ? PALETTE.water0 : PALETTE.water1);
    const y1 = 4 + (seed % 5);
    r(ctx, 1, y1, 7, 1, PALETTE.water2);
    r(ctx, 9, y1 + 4, 5, 1, PALETTE.water2);
    if (seed % 4 === 0) r(ctx, 3, 13, 4, 1, PALETTE.waterHi);
  });
}

function dirtTile(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.dirt1);
    r(ctx, 0, 0, 16, 2, PALETTE.dirt2);
    r(ctx, 0, 14, 16, 2, PALETTE.dirt0);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(hash(seed, i, 7) * 11);
      const y = 3 + Math.floor(hash(seed, i, 8) * 9);
      r(ctx, x, y, 2, 1, i % 2 ? PALETTE.dirt0 : PALETTE.dirt2);
    }
  });
}

function sandTile(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.sand1);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(hash(seed, i, 9) * 11);
      const y = 2 + Math.floor(hash(seed, i, 10) * 11);
      r(ctx, x, y, 1, 1, i % 2 ? PALETTE.sand0 : PALETTE.sand2);
    }
    if (seed % 5 === 0) {
      r(ctx, 3, 11, 4, 1, PALETTE.sand2);
      r(ctx, 5, 12, 3, 1, PALETTE.sand2);
    }
  });
}

function stoneTile(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.stone1);
    r(ctx, 0, 0, 16, 1, PALETTE.stone2);
    r(ctx, 0, 15, 16, 1, PALETTE.stone0);
    const sx = seed % 2 ? 2 : 7;
    r(ctx, sx, 4, 5, 1, PALETTE.stone0);
    r(ctx, 10, 10, 4, 1, PALETTE.stone2);
  });
}

function boardTile(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.wood1);
    r(ctx, 0, 0, 16, 2, PALETTE.wood2);
    r(ctx, 0, 14, 16, 2, PALETTE.wood0);
    r(ctx, 3, 0, 1, 16, PALETTE.wood0);
    r(ctx, 11, 0, 1, 16, PALETTE.wood0);
    if (seed % 2 === 0) r(ctx, 7, 7, 2, 1, PALETTE.wood2);
  });
}

function cliffFace(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.cliff1);
    r(ctx, 0, 0, 16, 3, PALETTE.cliffHi);
    r(ctx, 0, 13, 16, 3, PALETTE.cliff0);
    const x = 2 + (seed % 5);
    r(ctx, x, 5, 2, 5, PALETTE.cliff2);
    r(ctx, x + 5, 8, 1, 4, PALETTE.cliff0);
    r(ctx, 12, 4, 2, 3, PALETTE.cliff2);
  });
}

function shoreFoam(seed = 0) {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
    const y = 5 + (seed % 4);
    r(ctx, 1, y, 7, 2, PALETTE.waterHi);
    r(ctx, 8, y + 2, 5, 1, '#b9d9dd');
    r(ctx, 4, y + 5, 8, 1, PALETTE.waterHi);
  });
}

function railTile() {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.grass2);
    r(ctx, 0, 4, 16, 2, PALETTE.rail);
    r(ctx, 0, 10, 16, 2, PALETTE.rail);
    r(ctx, 2, 1, 2, 14, PALETTE.tie);
    r(ctx, 10, 1, 2, 14, PALETTE.tie);
  });
}

function stairsTile() {
  return canvasSprite(TILE, TILE, (ctx) => {
    r(ctx, 0, 0, 16, 16, PALETTE.cliff1);
    for (let y = 1; y < 16; y += 3) {
      r(ctx, 2, y, 12, 2, PALETTE.stone2);
      r(ctx, 2, y + 2, 12, 1, PALETTE.stone0);
    }
  });
}

function roofGable(ctx, x, y, w, color, dark = PALETTE.outline) {
  const step = 4;
  const tiers = Math.max(4, Math.floor(w / 16));
  for (let i = 0; i < tiers; i++) {
    const inset = i * step;
    r(ctx, x + inset, y + i * step, w - inset * 2, 5, dark);
    r(ctx, x + inset + 2, y + i * step + 1, w - inset * 2 - 4, 3, color);
  }
  r(ctx, x + 2, y + tiers * step - 1, w - 4, 4, dark);
}

function pixelWindow(ctx, x, y, wide = false) {
  const w = wide ? 18 : 12;
  r(ctx, x, y, w, 13, PALETTE.outline);
  r(ctx, x + 2, y + 2, w - 4, 9, PALETTE.glass);
  r(ctx, x + Math.floor(w / 2) - 1, y + 2, 2, 9, PALETTE.glassHi);
  r(ctx, x + 2, y + 6, w - 4, 1, '#d5e5dd');
}

function pixelDoor(ctx, x, y, color = '#60483b') {
  r(ctx, x, y, 14, 24, PALETTE.outline);
  r(ctx, x + 2, y + 2, 10, 22, color);
  r(ctx, x + 9, y + 12, 2, 2, PALETTE.lamp);
}

function awning(ctx, x, y, w, color) {
  r(ctx, x, y, w, 9, PALETTE.outline);
  r(ctx, x + 2, y + 2, w - 4, 5, color);
  for (let i = 4; i < w - 4; i += 10) {
    r(ctx, x + i, y + 2, 4, 5, PALETTE.trim);
  }
  for (let i = 4; i < w - 4; i += 12) {
    r(ctx, x + i, y + 7, 6, 3, color);
  }
}

function flowerBox(ctx, x, y, w, color) {
  r(ctx, x, y + 4, w, 5, PALETTE.wood1);
  for (let i = 2; i < w - 2; i += 6) {
    r(ctx, x + i, y, 3, 3, color);
    r(ctx, x + i + 1, y + 3, 1, 2, PALETTE.treeMid);
  }
}

function makeBuilding({
  tw = 7,
  th = 6,
  wall = PALETTE.wallCream,
  roof = PALETTE.roofRed,
  awningColor = null,
  signColor = null,
  chimney = false,
  porch = false,
  flowerColor = null,
  upperWindow = false,
  roofAccent = null
} = {}) {
  const w = tw * TILE;
  const h = (th + 2) * TILE;
  return canvasSprite(w, h, (ctx) => {
    const wallTop = 44;
    const baseY = h - 10;

    r(ctx, 8, baseY - 4, w - 8, 7, 'rgba(28,39,41,.3)');
    r(ctx, 5, wallTop, w - 10, h - wallTop - 10, PALETTE.outline);
    r(ctx, 8, wallTop + 3, w - 16, h - wallTop - 16, wall);

    roofGable(ctx, 0, 7, w, roof);
    if (roofAccent) {
      r(ctx, 18, 24, w - 36, 3, roofAccent);
      r(ctx, 24, 30, w - 48, 2, roofAccent);
    }

    if (chimney) {
      r(ctx, w - 28, 8, 12, 30, PALETTE.outline);
      r(ctx, w - 25, 11, 6, 24, '#725144');
      r(ctx, w - 30, 7, 16, 5, PALETTE.outline);
    }

    if (upperWindow) pixelWindow(ctx, Math.floor(w / 2) - 9, 36, true);

    pixelWindow(ctx, 16, baseY - 42, tw >= 8);
    pixelWindow(ctx, w - (tw >= 8 ? 36 : 28), baseY - 42, tw >= 8);

    pixelDoor(ctx, Math.floor(w / 2) - 7, baseY - 28);

    if (awningColor) awning(ctx, 12, baseY - 54, w - 24, awningColor);

    if (porch) {
      r(ctx, 9, baseY - 1, w - 18, 5, PALETTE.wood0);
      r(ctx, 12, baseY - 4, w - 24, 4, PALETTE.wood2);
      r(ctx, 13, baseY - 9, 3, 9, PALETTE.wood1);
      r(ctx, w - 16, baseY - 9, 3, 9, PALETTE.wood1);
    }

    if (flowerColor) {
      flowerBox(ctx, 13, baseY - 27, 30, flowerColor);
      flowerBox(ctx, w - 43, baseY - 27, 30, flowerColor);
    }

    if (signColor) {
      r(ctx, w - 17, 52, 14, 18, PALETTE.outline);
      r(ctx, w - 14, 55, 8, 10, signColor);
      r(ctx, w - 12, 57, 4, 2, PALETTE.trim);
    }
  });
}

function makeStation() {
  const w = 12 * TILE;
  const h = 9 * TILE;
  return canvasSprite(w, h, (ctx) => {
    r(ctx, 10, h - 14, w - 12, 7, 'rgba(28,39,41,.3)');
    r(ctx, 8, 54, w - 16, h - 66, PALETTE.outline);
    r(ctx, 12, 58, w - 24, h - 74, PALETTE.wallBlue);
    roofGable(ctx, 0, 8, w, PALETTE.roofBlue);

    r(ctx, 24, 51, w - 48, 9, PALETTE.outline);
    r(ctx, 27, 53, w - 54, 5, '#668995');
    r(ctx, Math.floor(w / 2) - 12, 44, 24, 18, PALETTE.outline);
    r(ctx, Math.floor(w / 2) - 9, 47, 18, 12, PALETTE.glass);

    pixelDoor(ctx, Math.floor(w / 2) - 7, h - 46);
    pixelWindow(ctx, 25, h - 55, true);
    pixelWindow(ctx, w - 43, h - 55, true);

    r(ctx, 18, h - 16, w - 36, 5, PALETTE.stone0);
    r(ctx, 24, h - 11, w - 48, 3, PALETTE.stone2);

    r(ctx, w - 24, 60, 16, 12, PALETTE.outline);
    r(ctx, w - 21, 63, 10, 6, '#d49c55');
    r(ctx, w - 18, 66, 4, 2, PALETTE.trim);
  });
}

function makeLighthouse() {
  return canvasSprite(64, 128, (ctx) => {
    r(ctx, 17, 117, 34, 5, 'rgba(28,39,41,.3)');
    r(ctx, 21, 40, 22, 78, PALETTE.outline);
    r(ctx, 24, 43, 16, 72, '#e2dcc9');
    r(ctx, 24, 64, 16, 12, '#a45148');
    r(ctx, 20, 32, 24, 14, PALETTE.outline);
    r(ctx, 23, 35, 18, 8, '#75a8ad');
    r(ctx, 14, 27, 36, 8, PALETTE.outline);
    r(ctx, 18, 29, 28, 4, PALETTE.roofRed);
    r(ctx, 22, 20, 20, 9, PALETTE.roofRed);
    r(ctx, 26, 15, 12, 7, PALETTE.roofRed);
    r(ctx, 29, 12, 6, 4, PALETTE.outline);
    pixelDoor(ctx, 25, 91, '#6a5141');
    pixelWindow(ctx, 26, 52, false);
  });
}

function makeTree() {
  return canvasSprite(40, 56, (ctx) => {
    r(ctx, 15, 35, 10, 17, '#604636');
    r(ctx, 5, 20, 30, 24, PALETTE.outline);
    r(ctx, 7, 18, 26, 22, PALETTE.treeDark);
    r(ctx, 4, 25, 15, 15, PALETTE.treeMid);
    r(ctx, 18, 13, 17, 21, PALETTE.treeMid);
    r(ctx, 9, 8, 20, 18, PALETTE.treeLight);
    r(ctx, 13, 9, 7, 5, '#7ca168');
    r(ctx, 26, 20, 5, 5, '#769c65');
  });
}

function makePine() {
  return canvasSprite(38, 60, (ctx) => {
    r(ctx, 16, 39, 6, 17, '#5b4334');
    r(ctx, 3, 35, 32, 10, PALETTE.pineDark);
    r(ctx, 6, 26, 26, 12, PALETTE.pineMid);
    r(ctx, 9, 17, 20, 12, PALETTE.pineDark);
    r(ctx, 12, 9, 14, 11, PALETTE.pineMid);
    r(ctx, 16, 4, 6, 8, PALETTE.pineDark);
  });
}

function makeBush() {
  return canvasSprite(24, 20, (ctx) => {
    r(ctx, 3, 8, 18, 10, PALETTE.outline);
    r(ctx, 5, 6, 14, 10, PALETTE.treeDark);
    r(ctx, 2, 10, 10, 7, PALETTE.treeMid);
    r(ctx, 12, 9, 10, 8, PALETTE.treeLight);
    r(ctx, 8, 6, 5, 4, '#7ca168');
  });
}

function makeFlower(color) {
  return canvasSprite(16, 16, (ctx) => {
    r(ctx, 3, 10, 10, 3, PALETTE.treeDark);
    r(ctx, 5, 6, 3, 3, color);
    r(ctx, 10, 8, 3, 3, color);
    r(ctx, 2, 8, 3, 3, color);
    r(ctx, 7, 11, 2, 3, PALETTE.treeMid);
  });
}

function makeRock() {
  return canvasSprite(18, 14, (ctx) => {
    r(ctx, 2, 6, 14, 7, PALETTE.outline);
    r(ctx, 4, 4, 10, 7, PALETTE.stone1);
    r(ctx, 6, 3, 7, 4, PALETTE.stone2);
    r(ctx, 4, 10, 9, 2, PALETTE.stone0);
  });
}

function makeBench() {
  return canvasSprite(32, 22, (ctx) => {
    r(ctx, 3, 4, 26, 5, PALETTE.outline);
    r(ctx, 5, 5, 22, 3, PALETTE.wood2);
    r(ctx, 4, 11, 24, 5, PALETTE.outline);
    r(ctx, 6, 12, 20, 3, PALETTE.wood1);
    r(ctx, 7, 15, 3, 6, PALETTE.outline);
    r(ctx, 22, 15, 3, 6, PALETTE.outline);
  });
}

function makeLamp() {
  return canvasSprite(18, 36, (ctx) => {
    r(ctx, 8, 10, 3, 24, PALETTE.outline);
    r(ctx, 5, 7, 9, 9, PALETTE.outline);
    r(ctx, 7, 9, 5, 5, PALETTE.lamp);
    r(ctx, 6, 31, 7, 3, PALETTE.outline);
    r(ctx, 4, 34, 11, 2, PALETTE.outline);
  });
}

function makeBarrel() {
  return canvasSprite(16, 20, (ctx) => {
    r(ctx, 3, 3, 10, 15, PALETTE.outline);
    r(ctx, 5, 2, 6, 16, PALETTE.wood1);
    r(ctx, 4, 5, 8, 2, PALETTE.wood2);
    r(ctx, 4, 12, 8, 2, PALETTE.wood0);
  });
}

function makeCrate() {
  return canvasSprite(18, 18, (ctx) => {
    r(ctx, 2, 2, 14, 14, PALETTE.outline);
    r(ctx, 4, 4, 10, 10, PALETTE.wood1);
    r(ctx, 5, 5, 8, 2, PALETTE.wood2);
    r(ctx, 5, 11, 8, 2, PALETTE.wood0);
    r(ctx, 8, 5, 2, 8, PALETTE.outline);
  });
}

function makeParasol() {
  return canvasSprite(34, 38, (ctx) => {
    r(ctx, 16, 17, 3, 19, '#6d513e');
    r(ctx, 3, 9, 28, 8, PALETTE.outline);
    r(ctx, 6, 6, 22, 9, '#c45f62');
    r(ctx, 11, 6, 5, 9, PALETTE.trim);
    r(ctx, 21, 6, 5, 9, PALETTE.trim);
    r(ctx, 9, 35, 17, 2, PALETTE.outline);
  });
}

function makeFountain() {
  return canvasSprite(56, 52, (ctx) => {
    r(ctx, 6, 31, 44, 14, PALETTE.outline);
    r(ctx, 9, 28, 38, 14, PALETTE.stone1);
    r(ctx, 13, 29, 30, 9, '#71aeb7');
    r(ctx, 18, 30, 20, 6, '#9bc9c8');
    r(ctx, 25, 13, 6, 20, PALETTE.outline);
    r(ctx, 27, 10, 2, 18, PALETTE.stone2);
    r(ctx, 24, 7, 8, 6, PALETTE.outline);
    r(ctx, 26, 8, 4, 4, '#a9d3d2');
  });
}

function makeSign(color = '#d79c5a') {
  return canvasSprite(20, 30, (ctx) => {
    r(ctx, 8, 12, 4, 16, PALETTE.outline);
    r(ctx, 4, 4, 12, 12, PALETTE.outline);
    r(ctx, 6, 6, 8, 8, color);
    r(ctx, 8, 8, 4, 2, PALETTE.trim);
  });
}

export function createPixelAssets() {
  const tiles = {
    water: [0,1,2,3].map(i => waterTile(i)),
    grass: [0,1,2,3].map(i => grassTile(i)),
    grassHigh: [0,1,2,3].map(i => grassTile(i, true, false)),
    grassLow: [0,1,2,3].map(i => grassTile(i, false, true)),
    dirt: [0,1,2,3].map(i => dirtTile(i)),
    sand: [0,1,2,3].map(i => sandTile(i)),
    stone: [0,1,2,3].map(i => stoneTile(i)),
    board: [0,1].map(i => boardTile(i)),
    cliff: [0,1,2,3].map(i => cliffFace(i)),
    shore: [0,1,2,3].map(i => shoreFoam(i)),
    rail: railTile(),
    stairs: stairsTile()
  };

  const buildings = {
    station: makeStation(),
    homeRed: makeBuilding({ tw: 7, th: 6, wall: PALETTE.wallCream, roof: PALETTE.roofRed, chimney: true, porch: true, flowerColor: PALETTE.flowerPink }),
    homeGreen: makeBuilding({ tw: 7, th: 6, wall: PALETTE.wallGreen, roof: PALETTE.roofGreen, chimney: true, porch: true, flowerColor: PALETTE.flowerYellow }),
    homeBlue: makeBuilding({ tw: 8, th: 6, wall: PALETTE.wallBlue, roof: PALETTE.roofBlue, porch: true, upperWindow: true }),
    inn: makeBuilding({ tw: 10, th: 7, wall: PALETTE.wallBlue, roof: PALETTE.roofBlue, chimney: true, porch: true, flowerColor: PALETTE.flowerPink, upperWindow: true, roofAccent: '#58778b' }),
    sweets: makeBuilding({ tw: 7, th: 6, wall: PALETTE.wallCream, roof: PALETTE.roofRed, awningColor: '#c87968', signColor: PALETTE.flowerYellow, porch: true }),
    general: makeBuilding({ tw: 8, th: 6, wall: PALETTE.wallGreen, roof: PALETTE.roofGreen, awningColor: '#6f8b5f', signColor: '#d6bb66', porch: true }),
    cafe: makeBuilding({ tw: 10, th: 7, wall: PALETTE.wallRose, roof: PALETTE.roofRed, awningColor: '#c37b72', chimney: true, porch: true, flowerColor: PALETTE.flowerYellow, upperWindow: true }),
    seafood: makeBuilding({ tw: 9, th: 7, wall: PALETTE.wallLilac, roof: PALETTE.roofPurple, awningColor: '#8b6d8a', signColor: '#67a9bc', porch: true }),
    rental: makeBuilding({ tw: 8, th: 6, wall: PALETTE.wallTan, roof: PALETTE.roofBrown, signColor: '#69aabb', porch: true }),
    lighthouseHouse: makeBuilding({ tw: 6, th: 5, wall: PALETTE.wallCream, roof: PALETTE.roofRed, porch: true }),
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
    sign: makeSign()
  };

  return { tiles, buildings, decor };
}
