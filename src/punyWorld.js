export const PUNY_TILE = 16;
const COLS = 27;

const SHEET_URL = new URL(
  '../assets/town/base/punyworld-overworld-tileset.png',
  import.meta.url
).href;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load Puny World tileset'));
    image.src = url;
  });
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function cropTile(sheet, id) {
  const canvas = makeCanvas(PUNY_TILE, PUNY_TILE);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const sx = (id % COLS) * PUNY_TILE;
  const sy = Math.floor(id / COLS) * PUNY_TILE;

  ctx.drawImage(
    sheet,
    sx,
    sy,
    PUNY_TILE,
    PUNY_TILE,
    0,
    0,
    PUNY_TILE,
    PUNY_TILE
  );

  return canvas;
}

function cropBlock(sheet, col, row, wTiles, hTiles) {
  const w = wTiles * PUNY_TILE;
  const h = hTiles * PUNY_TILE;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    sheet,
    col * PUNY_TILE,
    row * PUNY_TILE,
    w,
    h,
    0,
    0,
    w,
    h
  );

  return canvas;
}

// Puny World's dirt pathway Wang set mapped to our N/E/S/W 4-bit mask.
const DIRT_PATH_IDS = {
  0: 38,
  1: 57,
  2: 85,
  3: 58,
  4: 3,
  5: 30,
  6: 4,
  7: 31,
  8: 87,
  9: 60,
  10: 86,
  11: 59,
  12: 6,
  13: 33,
  14: 5,
  15: 32
};

const SAND_PATH_IDS = {
  0: 50,
  1: 69,
  2: 97,
  3: 70,
  4: 15,
  5: 42,
  6: 16,
  7: 43,
  8: 99,
  9: 72,
  10: 98,
  11: 71,
  12: 18,
  13: 45,
  14: 17,
  15: 44
};

function tileMap(sheet, ids) {
  const out = {};
  for (const [key, id] of Object.entries(ids)) {
    out[key] = cropTile(sheet, id);
  }
  return out;
}

export async function loadPunyWorldAssets() {
  const sheet = await loadImage(SHEET_URL);

  const grass = [0, 1, 2, 27, 28, 29, 54, 55, 56].map(id =>
    cropTile(sheet, id)
  );

  const beach = [50, 23, 24, 49, 51, 76, 77, 78].map(id =>
    cropTile(sheet, id)
  );

  const cliff = [
    108, 109, 110, 111, 112,
    135, 136, 137, 138, 139,
    162, 163, 164, 173, 174, 175
  ].map(id => cropTile(sheet, id));

  const trees = [197, 206, 224, 233].map(id => cropTile(sheet, id));

  const decor = {
    bush: cropTile(sheet, 704),
    flowerA: cropTile(sheet, 705),
    flowerB: cropTile(sheet, 730),
    flowerC: cropTile(sheet, 732),
    rock: cropTile(sheet, 784),
    sign: cropTile(sheet, 811),
    crate: cropTile(sheet, 837)
  };

  // Puny World groups its larger building art into rectangular regions.
  // The 21×4 block at rows 26-29 contains three 7×4 building variants.
  // The 20×4 block at rows 33-36 contains four 5×4 variants.
  const buildings = {
    largeA: cropBlock(sheet, 4, 26, 7, 4),
    largeB: cropBlock(sheet, 11, 26, 7, 4),
    largeC: cropBlock(sheet, 18, 26, 7, 4),

    smallA: cropBlock(sheet, 4, 33, 5, 4),
    smallB: cropBlock(sheet, 9, 33, 5, 4),
    smallC: cropBlock(sheet, 14, 33, 5, 4),
    smallD: cropBlock(sheet, 19, 33, 5, 4),

    // Compact original building/structure strip retained for later docks/props.
    compact: cropBlock(sheet, 4, 30, 6, 2)
  };

  const water = {
    shallow: cropTile(sheet, 310),
    medium: cropTile(sheet, 315),
    deep: cropTile(sheet, 320)
  };

  return {
    sheet,
    grass,
    beach,
    cliff,
    trees,
    decor,
    buildings,
    water,
    dirtPaths: tileMap(sheet, DIRT_PATH_IDS),
    sandPaths: tileMap(sheet, SAND_PATH_IDS)
  };
}
