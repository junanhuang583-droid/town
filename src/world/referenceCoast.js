export const REFERENCE_WORLD = Object.freeze({
  width: 160,
  depth: 160,
  waterLevel: 0.35,
  maxHeight: 16,
  id: 'shapescape-seaside-five-view-v01'
});

// v0.1 coast rebuild based on the five approved views of the same seaside town.
// Coordinates are top-down: +x = east/right, +z = south/open sea.
// This file intentionally contains terrain only. Buildings and wooden piers are
// deferred until the island base passes visual acceptance.
export const MAIN_COAST_POLYGON = Object.freeze([
  [8, 22], [16, 15], [29, 10], [47, 8], [66, 8], [86, 9],
  [105, 11], [122, 14], [137, 20], [147, 29], [153, 41], [155, 54],
  [154, 67], [151, 78],

  // East / lighthouse headland.
  // Tightened from the reference close-up + top view: the cape is a compact
  // grass-topped rocky point, not the broad fan-shaped platform from the draft.
  [150, 84], [148, 90], [145, 96], [141, 101], [136, 105], [130, 107],
  [125, 106], [121, 104], [118, 102],

  // Rebuilt inner bay from the five views:
  // much wider, substantially shallower, and less U-shaped than the rejected pass.
  [116, 101], [110, 97], [103, 94], [95, 92], [86, 91], [77, 92],
  [69, 94], [62, 97], [56, 101], [51, 105], [47, 109],

  // West green tongue / small cove.
  [43, 113], [40, 118], [41, 123], [45, 126], [47, 130], [45, 134],
  [40, 136], [35, 134], [31, 131], [28, 132], [26, 138], [22, 145],
  [16, 150], [10, 149], [6, 143], [4, 134], [4, 122], [6, 109],
  [8, 96], [10, 84], [10, 71], [9, 58], [7, 46], [6, 34]
]);

export const BREAKWATER_PATH = Object.freeze([
  [46, 111], [53, 114], [61, 116], [69, 117], [77, 117], [84, 115]
]);

function insidePolygon(x, z, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    const crosses = ((zi > z) !== (zj > z)) &&
      x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-6) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointSegmentDistance(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const ab2 = abx * abx + abz * abz;
  const t = ab2 > 0 ? Math.max(0, Math.min(1, (apx * abx + apz * abz) / ab2)) : 0;
  const dx = px - (ax + abx * t);
  const dz = pz - (az + abz * t);
  return Math.hypot(dx, dz);
}

function distanceToPolyline(x, z, points) {
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    min = Math.min(min, pointSegmentDistance(x, z, a[0], a[1], b[0], b[1]));
  }
  return min;
}

function distanceToCoast(x, z) {
  let min = Infinity;
  for (let i = 0; i < MAIN_COAST_POLYGON.length; i++) {
    const a = MAIN_COAST_POLYGON[i];
    const b = MAIN_COAST_POLYGON[(i + 1) % MAIN_COAST_POLYGON.length];
    min = Math.min(min, pointSegmentDistance(x, z, a[0], a[1], b[0], b[1]));
  }
  return min;
}

function isLighthouseHeadland(x, z) {
  // Only the compact cape/connector is treated as lighthouse terrain.
  // Other coast and town cells stay on their previous rules.
  return x >= 116 && z >= 74 && z <= 108;
}

function isMainBayBeach(x, z, coastDistance) {
  if (coastDistance > 6.5) return false;
  if (x < 59 || x > 106 || z < 87 || z > 111) return false;
  return !isLighthouseHeadland(x, z);
}

function isBaySeawall(x, z, coastDistance) {
  if (coastDistance > 4.25) return false;
  return x >= 43 && x <= 118 && z >= 86 && z <= 114 && !isLighthouseHeadland(x, z);
}

function isWestCoveBeach(x, z, coastDistance) {
  if (coastDistance > 5.5) return false;
  return x >= 17 && x <= 47 && z >= 118 && z <= 151;
}

function islandHeight(x, z, coastDistance, surface) {
  if (surface === 'sand') return 2;

  let height = 3 + Math.min(5, Math.floor(coastDistance / 5.25));

  // Broad, buildable town shelf behind the shallow bay.
  if (x >= 43 && x <= 126 && z >= 28 && z <= 88) {
    height = Math.max(height, 6);
    if (z < 62 && coastDistance > 10) height = Math.max(height, 7);
  }

  if (x <= 48 && z >= 55 && z <= 126) {
    height = Math.max(height, 5 + Math.min(3, Math.floor(coastDistance / 9)));
  }

  if (isLighthouseHeadland(x, z)) {
    // User-counted reference: the main lighthouse/street platform is about
    // 12 visible blocks above sea level. With block y=11, the top face is y=12.
    // Submerged foundation blocks are not counted.
    if (coastDistance <= 1.25) {
      height = 3 + ((Math.floor(x) + Math.floor(z)) % 2);
    } else if (coastDistance <= 2.5) {
      height = 6 + ((Math.floor(x * 3 + z)) % 2);
    } else if (coastDistance <= 4.25) {
      height = 9;
    } else {
      height = 11;
    }

    return Math.max(2, Math.min(11, height));
  }

  return Math.max(2, Math.min(9, height));
}

function addBreakwater(columns) {
  const { width, depth } = REFERENCE_WORLD;
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const d = distanceToPolyline(x + 0.5, z + 0.5, BREAKWATER_PATH);
      if (d > 2.35) continue;
      const key = `${x},${z}`;
      if (columns.has(key)) continue;

      const jitter = ((x * 17 + z * 31) % 5) === 0 ? 1 : 0;
      columns.set(key, { x, z, height: 2 + jitter, surface: 'rock' });
    }
  }
}

export function createReferenceColumns() {
  const columns = new Map();
  const { width, depth } = REFERENCE_WORLD;

  // Every horizontal cell inside the polygon is present. Heights are solid columns
  // from the foundation floor to the surface; there are no intentional cavities.
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const pz = z + 0.5;
      if (!insidePolygon(px, pz, MAIN_COAST_POLYGON)) continue;

      const coastDistance = distanceToCoast(px, pz);
      const headland = isLighthouseHeadland(px, pz);
      const beach = isMainBayBeach(px, pz, coastDistance) || isWestCoveBeach(px, pz, coastDistance);
      const surface = headland && coastDistance <= 4.25
        ? 'rock'
        : beach
          ? 'sand'
          : isBaySeawall(px, pz, coastDistance)
            ? 'rock'
            : 'grass';

      columns.set(`${x},${z}`, {
        x,
        z,
        height: islandHeight(px, pz, coastDistance, surface),
        surface
      });
    }
  }

  addBreakwater(columns);
  return columns;
}
