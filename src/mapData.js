export const MAP_W = 96;
export const MAP_H = 72;

function grid(fill = 'water') {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill(fill));
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 0.00001) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}

function fillPolygon(layer, points, type) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(MAP_W - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(MAP_H - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (insidePolygon(x + 0.5, y + 0.5, points)) {
        layer[y][x] = type;
      }
    }
  }
}

function paintDisc(layer, cx, cy, radius, type) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(MAP_W - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(MAP_H - 1, Math.ceil(cy + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        layer[y][x] = type;
      }
    }
  }
}

function paintPath(layer, points, radius, type) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dist = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
    const steps = Math.ceil(dist * 4);

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      paintDisc(layer, x, y, radius, type);
    }
  }
}

function fillRect(layer, x, y, w, h, type) {
  for (let yy = Math.max(0, y); yy < Math.min(MAP_H, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(MAP_W, x + w); xx++) {
      layer[yy][xx] = type;
    }
  }
}

function pushCluster(target, type, points, scale = 1) {
  for (const [x, y, variant = 0] of points) {
    target.push({ type, x, y, variant, scale });
  }
}

export function buildTownMap() {
  const ground = grid('water');
  const overlays = [];
  const objects = [];
  const buildings = [];

  const mainLand = [
    [0,0],[73,0],[73,3],[78,3],[78,8],[81,8],[81,13],[84,13],
    [84,19],[82,22],[82,28],[86,28],[86,34],[83,36],[83,40],
    [80,42],[79,47],[74,49],[72,53],[67,54],[64,58],[58,59],
    [54,62],[47,63],[40,65],[32,65],[26,64],[19,64],[15,62],
    [8,61],[4,59],[0,59]
  ];
  fillPolygon(ground, mainLand, 'grass');

  const highland = [
    [0,0],[72,0],[72,3],[76,4],[76,9],[73,12],[67,13],[62,15],
    [54,15],[49,17],[41,16],[34,17],[28,18],[21,17],[16,18],
    [10,16],[0,16]
  ];
  fillPolygon(ground, highland, 'grassHigh');

  const lowShelf = [
    [0,49],[12,49],[18,51],[28,51],[35,52],[43,52],[50,53],
    [58,54],[64,57],[61,60],[55,61],[48,63],[40,65],[31,65],
    [25,64],[17,64],[12,62],[5,61],[0,60]
  ];
  fillPolygon(ground, lowShelf, 'grassLow');

  const beach = [
    [64,33],[71,31],[77,32],[82,35],[85,40],[84,45],[81,49],
    [76,52],[70,53],[66,50],[63,45],[63,39]
  ];
  fillPolygon(ground, beach, 'sand');

  const lighthouseIsland = [
    [79,54],[84,52],[90,52],[95,56],[95,65],[92,69],[86,71],
    [80,68],[78,63]
  ];
  fillPolygon(ground, lighthouseIsland, 'grassLow');

  // Curved town roads. These deliberately avoid the old checkerboard layout.
  paintPath(ground, [[7,18],[16,19],[25,20],[34,20],[43,19],[53,19],[62,20],[69,22]], 1.45, 'dirt');
  paintPath(ground, [[15,19],[14,25],[15,31],[17,37],[20,43],[25,48]], 1.25, 'dirt');
  paintPath(ground, [[31,20],[30,25],[31,30],[35,34],[39,37]], 1.15, 'dirt');
  paintPath(ground, [[50,19],[49,24],[48,29],[48,34],[49,39],[52,44]], 1.2, 'dirt');
  paintPath(ground, [[65,21],[62,27],[61,33],[62,39],[65,44]], 1.15, 'dirt');
  paintPath(ground, [[17,31],[27,31],[37,32],[47,33],[58,33],[65,31]], 1.15, 'dirt');
  paintPath(ground, [[20,43],[30,44],[40,45],[51,45],[60,43],[65,41]], 1.05, 'dirt');
  paintPath(ground, [[25,48],[34,50],[43,50],[52,50],[61,49]], 0.95, 'dirt');
  paintPath(ground, [[65,41],[67,43],[69,44]], 0.85, 'dirt');

  // Plaza.
  fillRect(ground, 40, 31, 14, 11, 'stone');
  paintDisc(ground, 40, 36, 1.8, 'stone');
  paintDisc(ground, 54, 36, 1.8, 'stone');

  // Boardwalk and pier.
  paintPath(ground, [[28,53],[36,54],[45,54],[54,54],[63,53],[69,50]], 1.05, 'board');
  paintPath(ground, [[68,45],[73,45],[78,46]], 0.95, 'board');
  paintPath(ground, [[78,46],[80,49],[80,54]], 0.85, 'board');

  // Railway and station platform.
  for (let x = 2; x < 70; x++) {
    ground[3][x] = 'rail';
  }
  fillRect(ground, 5, 12, 18, 2, 'stone');

  // Two stair corridors through the highland cliff and two to the lower coast.
  fillRect(ground, 15, 15, 3, 3, 'stairs');
  fillRect(ground, 50, 15, 3, 3, 'stairs');
  fillRect(ground, 25, 49, 3, 3, 'stairs');
  fillRect(ground, 56, 50, 3, 3, 'stairs');

  // Cliff faces under the highland and lower shelf.
  for (let x = 0; x < 73; x++) {
    if (x >= 15 && x <= 17) continue;
    if (x >= 50 && x <= 52) continue;
    overlays.push({ type: 'cliff', x, y: 16, variant: x % 4 });
  }

  for (let x = 0; x < 61; x++) {
    if (x >= 25 && x <= 27) continue;
    if (x >= 56 && x <= 58) continue;
    const y = x < 17 ? 50 : x < 33 ? 51 : x < 48 ? 52 : 53;
    overlays.push({ type: 'cliff', x, y, variant: (x + 1) % 4 });
  }

  // Shore foam: any non-water tile with water directly beneath or to the right.
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (ground[y][x] === 'water') continue;
      const touchesWater =
        ground[y + 1][x] === 'water' ||
        ground[y][x + 1] === 'water' ||
        ground[y + 1][x + 1] === 'water';
      if (touchesWater && (x + y) % 2 === 0) {
        overlays.push({ type: 'shore', x, y, variant: (x * 3 + y) % 4 });
      }
    }
  }

  // Buildings: footX/footY are the sorting/ground contact points.
  buildings.push(
    { type: 'station', x: 14, y: 13.5 },
    { type: 'homeRed', x: 33, y: 14.5 },
    { type: 'homeGreen', x: 46, y: 15.5 },
    { type: 'homeBlue', x: 61, y: 14.5 },

    { type: 'inn', x: 11.5, y: 30 },
    { type: 'sweets', x: 28, y: 29.5 },
    { type: 'general', x: 37.5, y: 30.5 },

    { type: 'cafe', x: 12.5, y: 43.5 },
    { type: 'seafood', x: 30.5, y: 44.5 },
    { type: 'rental', x: 58.5, y: 42.5 },

    { type: 'homeBlue', x: 59.5, y: 29.5 },
    { type: 'homeGreen', x: 58.5, y: 48.5 },

    { type: 'lighthouseHouse', x: 86.5, y: 66 },
    { type: 'lighthouse', x: 88, y: 63.5 }
  );

  // Tree belts make the map feel inhabited instead of empty.
  pushCluster(objects, 'pine', [
    [2,11],[6,8],[23,12],[26,8],[29,13],[38,9],[42,13],[55,10],[66,11],[70,8],
    [3,15],[9,14],[22,16],[36,15],[44,16],[63,15],[69,14]
  ]);

  pushCluster(objects, 'tree', [
    [3,25],[8,21],[19,24],[24,22],[43,23],[55,23],[69,25],
    [4,35],[9,32],[22,35],[35,34],[58,35],[68,35],
    [4,45],[10,46],[22,46],[38,48],[53,47],[62,47],
    [8,54],[14,57],[20,55],[33,58],[47,58],[57,57],[64,54],
    [73,29],[77,30],[80,32],[78,53],[83,55],[93,57],[92,67],[82,67]
  ]);

  pushCluster(objects, 'bush', [
    [17,24],[19,25],[41,27],[44,27],[52,27],[55,27],[7,39],[24,39],
    [46,44],[48,44],[61,36],[64,37],[34,55],[36,55],[50,56],[52,56],
    [69,34],[71,33],[75,51],[77,50]
  ]);

  pushCluster(objects, 'flowerPink', [
    [18,28],[20,28],[10,42],[12,42],[45,29],[55,43],[57,43],[31,57],[33,57]
  ]);
  pushCluster(objects, 'flowerYellow', [
    [34,29],[36,29],[18,40],[20,40],[52,28],[54,28],[42,55],[44,55]
  ]);
  pushCluster(objects, 'flowerPurple', [
    [8,29],[10,29],[27,42],[29,42],[59,39],[61,39],[24,55],[26,55]
  ]);

  pushCluster(objects, 'rock', [
    [6,56],[17,59],[42,61],[67,56],[72,38],[79,41],[82,48],[84,69]
  ]);

  // Plaza + town props.
  objects.push(
    { type: 'fountain', x: 47, y: 38.2 },
    { type: 'bench', x: 41.5, y: 40.5 },
    { type: 'bench', x: 52.5, y: 40.5 },
    { type: 'lamp', x: 40.5, y: 34.5 },
    { type: 'lamp', x: 54.5, y: 34.5 },
    { type: 'lamp', x: 18, y: 33 },
    { type: 'lamp', x: 35, y: 33 },
    { type: 'lamp', x: 62, y: 33 },
    { type: 'barrel', x: 27, y: 51 },
    { type: 'barrel', x: 58, y: 51 },
    { type: 'crate', x: 65, y: 50 },
    { type: 'crate', x: 77, y: 47 },
    { type: 'sign', x: 6, y: 18 },
    { type: 'sign', x: 69, y: 31 },

    // Beach leisure details.
    { type: 'parasol', x: 72, y: 39 },
    { type: 'parasol', x: 78, y: 42 },
    { type: 'bench', x: 65, y: 50 }
  );

  return {
    width: MAP_W,
    height: MAP_H,
    ground,
    overlays,
    objects,
    buildings
  };
}
