export const MAP_W = 96;
export const MAP_H = 72;

function grid(fill = null) {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill(fill));
}

function insidePolygon(x, y, points) {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];

    const hit =
      ((yi > y) !== (yj > y)) &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || 0.00001) + xi;

    if (hit) inside = !inside;
  }

  return inside;
}

function fillPolygon(layer, points, value) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(MAP_W - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(MAP_H - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (insidePolygon(x + 0.5, y + 0.5, points)) {
        layer[y][x] = value;
      }
    }
  }
}

function fillRect(layer, x, y, w, h, value) {
  for (let yy = Math.max(0, y); yy < Math.min(MAP_H, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(MAP_W, x + w); xx++) {
      layer[yy][xx] = value;
    }
  }
}

function paintDisc(layer, cx, cy, radius, value) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(MAP_W - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(MAP_H - 1, Math.ceil(cy + radius));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;

      if (dx * dx + dy * dy <= radius * radius) {
        layer[y][x] = value;
      }
    }
  }
}

function paintPath(layer, points, radius, value) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];

    const steps = Math.ceil(Math.max(1, Math.hypot(x1 - x0, y1 - y0)) * 5);

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      paintDisc(
        layer,
        x0 + (x1 - x0) * t,
        y0 + (y1 - y0) * t,
        radius,
        value
      );
    }
  }
}

function addMany(target, type, list, extra = {}) {
  for (const item of list) {
    const [x, y, scale = 1] = item;
    target.push({ type, x, y, scale, ...extra });
  }
}

export function buildTownMap() {
  const terrain = grid('water');
  const paths = grid(null);
  const cliffs = [];
  const buildings = [];
  const objects = [];

  // ------------------------------------------------------------
  // Coast and elevation masses
  // ------------------------------------------------------------

  const mainLand = [
    [0,0],[72,0],[72,2],[77,3],[77,7],[81,9],[81,14],[84,16],
    [83,21],[81,24],[82,28],[86,31],[86,36],[83,39],[82,44],
    [78,47],[75,51],[69,53],[65,57],[58,59],[54,62],[47,63],
    [41,65],[33,66],[26,65],[19,64],[13,62],[7,61],[0,60]
  ];
  fillPolygon(terrain, mainLand, 'grass');

  const highland = [
    [0,0],[70,0],[72,3],[75,5],[74,10],[70,13],[64,14],[59,16],
    [52,15],[47,17],[40,16],[34,18],[27,17],[21,18],[15,16],[9,17],[0,15]
  ];
  fillPolygon(terrain, highland, 'grassHigh');

  const lowerCoast = [
    [0,49],[11,49],[16,51],[24,51],[30,53],[38,52],[45,54],[53,54],
    [60,56],[64,58],[60,61],[54,61],[48,64],[40,65],[32,66],
    [25,65],[18,64],[12,62],[6,61],[0,60]
  ];
  fillPolygon(terrain, lowerCoast, 'grassLow');

  const beach = [
    [63,31],[70,30],[76,31],[81,34],[84,38],[85,43],[83,47],
    [79,51],[74,53],[69,52],[65,49],[62,44],[62,38]
  ];
  fillPolygon(terrain, beach, 'sand');

  const lighthouseIsland = [
    [78,55],[82,52],[88,52],[93,55],[95,59],[95,65],[92,69],
    [86,71],[81,69],[78,64]
  ];
  fillPolygon(terrain, lighthouseIsland, 'grassLow');

  // Small beach/tide shelf interruptions keep the coast from reading as one curve.
  fillPolygon(terrain, [[54,57],[61,56],[66,58],[64,61],[58,61],[53,60]], 'sand');
  fillPolygon(terrain, [[73,47],[79,46],[82,48],[80,52],[75,53],[72,51]], 'sand');

  // ------------------------------------------------------------
  // Paths layer
  // ------------------------------------------------------------

  // Highland approach.
  paintPath(paths, [[5,13],[13,14],[22,14],[31,15],[40,15],[50,14],[60,14],[69,15]], 1.0, 'dirt');

  // Main town circulation.
  paintPath(paths, [[8,21],[15,22],[23,22],[31,21],[39,20],[48,20],[58,21],[67,23]], 1.15, 'dirt');
  paintPath(paths, [[14,22],[13,27],[14,32],[17,37],[20,42],[24,47]], 1.1, 'dirt');
  paintPath(paths, [[31,21],[30,26],[31,31],[35,35],[40,38]], 1.0, 'dirt');
  paintPath(paths, [[49,20],[49,25],[48,30],[48,36],[51,41],[56,44]], 1.0, 'dirt');
  paintPath(paths, [[64,23],[62,28],[61,33],[62,38],[65,42],[68,44]], 0.95, 'dirt');
  paintPath(paths, [[15,32],[24,32],[33,32],[41,33],[50,33],[58,32],[64,30]], 0.95, 'dirt');
  paintPath(paths, [[19,42],[27,43],[36,44],[45,44],[54,44],[62,42]], 0.9, 'dirt');
  paintPath(paths, [[24,47],[32,49],[40,50],[49,50],[58,49],[66,47]], 0.85, 'dirt');

  // Irregular stone civic plaza, not a perfect rectangle.
  fillRect(paths, 39, 30, 15, 11, 'stone');
  paintDisc(paths, 39, 35, 2.3, 'stone');
  paintDisc(paths, 54, 35, 2.3, 'stone');
  paintDisc(paths, 47, 41, 2.1, 'stone');

  // Boardwalk, beach pier and lighthouse connection.
  paintPath(paths, [[28,53],[35,54],[43,54],[51,54],[59,53],[66,51],[70,49]], 1.05, 'board');
  paintPath(paths, [[67,44],[72,45],[77,45],[81,47]], 0.95, 'board');
  paintPath(paths, [[80,47],[80,51],[80,55]], 0.8, 'board');
  paintPath(paths, [[80,55],[82,57],[83,60]], 0.8, 'board');

  // Railway and platforms remain special path types.
  for (let x = 2; x < 70; x++) paths[3][x] = 'rail';
  fillRect(paths, 5, 11, 19, 2, 'stone');

  // Stairs are explicit connectors through cliff rows.
  fillRect(paths, 14, 15, 3, 3, 'stairs');
  fillRect(paths, 50, 15, 3, 3, 'stairs');
  fillRect(paths, 24, 49, 3, 3, 'stairs');
  fillRect(paths, 55, 51, 3, 3, 'stairs');

  // ------------------------------------------------------------
  // Cliff faces
  // ------------------------------------------------------------

  for (let x = 0; x <= 72; x++) {
    if (x >= 14 && x <= 16) continue;
    if (x >= 50 && x <= 52) continue;

    const y =
      x < 9 ? 15 :
      x < 22 ? 16 :
      x < 35 ? 17 :
      x < 48 ? 16 :
      x < 60 ? 15 : 14;

    cliffs.push({ x, y, variant: x % 4 });
  }

  for (let x = 0; x <= 62; x++) {
    if (x >= 24 && x <= 26) continue;
    if (x >= 55 && x <= 57) continue;

    const y =
      x < 12 ? 50 :
      x < 25 ? 51 :
      x < 39 ? 52 :
      x < 52 ? 53 : 54;

    cliffs.push({ x, y, variant: (x + 2) % 4 });
  }

  // ------------------------------------------------------------
  // Buildings
  // ------------------------------------------------------------

  buildings.push(
    // Highland station zone.
    { type: 'station', x: 14, y: 12.5 },
    { type: 'homeRed', x: 33, y: 14.6 },
    { type: 'homeGreen', x: 46, y: 14.8 },
    { type: 'homeBlue', x: 61, y: 14.4 },

    // Upper/middle town.
    { type: 'inn', x: 11.5, y: 30.5 },
    { type: 'sweets', x: 26.5, y: 29.3 },
    { type: 'general', x: 36.5, y: 29.6 },
    { type: 'homeBlue', x: 59.5, y: 29.4 },

    // Lower main street.
    { type: 'cafe', x: 12.5, y: 43.7 },
    { type: 'seafood', x: 29.5, y: 44.2 },
    { type: 'homeGreen', x: 58.8, y: 48.2 },

    // Beach activity hut.
    { type: 'rental', x: 69.5, y: 43.5 },

    // Lighthouse island.
    { type: 'lighthouseHouse', x: 85, y: 67.4 },
    { type: 'lighthouse', x: 89.2, y: 63.8 }
  );

  // ------------------------------------------------------------
  // Nature and yard clusters
  // ------------------------------------------------------------

  addMany(objects, 'pine', [
    [2,11],[6,8],[22,11],[26,7],[30,12],[39,9],[43,12],
    [55,9],[65,11],[70,8],[3,15],[9,14],[21,16],[36,15],[44,16],[64,15]
  ]);

  addMany(objects, 'tree', [
    [3,24],[8,21],[19,24],[24,22],[43,23],[54,23],[69,25],
    [4,34],[9,32],[22,35],[34,34],[58,35],[68,35],
    [4,45],[10,46],[22,46],[38,48],[53,47],[62,47],
    [8,54],[14,57],[20,55],[33,58],[47,58],[57,57],[64,54],
    [73,29],[77,30],[80,32],[78,53],[83,55],[93,57],[92,68],[82,67]
  ]);

  addMany(objects, 'bush', [
    [17,24],[19,25],[41,27],[44,27],[52,27],[55,27],[7,39],[24,39],
    [46,44],[48,44],[61,36],[64,37],[34,55],[36,55],[50,56],[52,56],
    [69,34],[71,33],[75,51],[77,50],[31,16],[34,16],[45,17],[48,17]
  ]);

  addMany(objects, 'tallGrass', [
    [2,29],[5,28],[7,27],[10,26],[22,27],[24,26],[56,25],[58,25],
    [67,28],[70,27],[5,41],[8,42],[35,39],[37,39],[60,39],[63,40],
    [11,53],[15,54],[18,56],[40,57],[45,56],[61,55],[66,53]
  ]);

  // Flowers in deliberate clumps around homes and civic spaces.
  addMany(objects, 'flowerPink', [
    [18,28],[20,28],[10,42],[12,42],[45,28],[54,42],[56,42],
    [31,57],[33,57],[32,16],[34,16],[84,67]
  ]);
  addMany(objects, 'flowerYellow', [
    [34,28],[36,28],[18,40],[20,40],[52,27],[54,27],
    [42,55],[44,55],[45,17],[47,17],[87,68]
  ]);
  addMany(objects, 'flowerPurple', [
    [8,28],[10,28],[27,42],[29,42],[59,39],[61,39],
    [24,55],[26,55],[60,17],[62,17],[82,66]
  ]);

  // Yard fences and mailboxes make residential areas feel lived in.
  addMany(objects, 'fence', [
    [29,16.8],[32,16.8],[35,16.8],
    [42,17.3],[45,17.3],[48,17.3],
    [56,16.6],[59,16.6],[62,16.6],
    [55,50.3],[58,50.3],[61,50.3]
  ]);

  addMany(objects, 'mailbox', [
    [31.2,16.7],[44.1,17.2],[58.2,16.5],[57.3,50.2]
  ]);

  addMany(objects, 'rock', [
    [6,56],[17,59],[42,61],[67,56],[72,38],[79,41],[82,48],[84,69]
  ]);

  // ------------------------------------------------------------
  // Civic and coastal props
  // ------------------------------------------------------------

  objects.push(
    { type: 'fountain', x: 47, y: 38.4 },
    { type: 'bench', x: 41.2, y: 40.7 },
    { type: 'bench', x: 52.7, y: 40.7 },
    { type: 'lamp', x: 40.6, y: 34.2 },
    { type: 'lamp', x: 54.4, y: 34.2 },
    { type: 'lamp', x: 18, y: 33 },
    { type: 'lamp', x: 35, y: 33 },
    { type: 'lamp', x: 62, y: 33 },

    { type: 'barrel', x: 27, y: 51 },
    { type: 'barrel', x: 58, y: 51 },
    { type: 'crate', x: 65, y: 50 },
    { type: 'crate', x: 77, y: 47 },
    { type: 'sign', x: 6, y: 18 },
    { type: 'sign', x: 69, y: 31 },

    { type: 'parasol', x: 72, y: 39 },
    { type: 'parasol', x: 78, y: 42 },
    { type: 'bench', x: 65, y: 50 },
    { type: 'barrel', x: 72, y: 44 },
    { type: 'crate', x: 74, y: 44 }
  );

  return {
    width: MAP_W,
    height: MAP_H,
    terrain,
    paths,
    cliffs,
    buildings,
    objects
  };
}
