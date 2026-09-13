export const REFERENCE_WORLD = Object.freeze({
  width: 128,
  depth: 112,
  waterLevel: 0.4,
  maxHeight: 12,
  id: 'shapescape-seaside-reference-coast-v01'
});

// First-pass terrain trace from the single approved reference image.
// Coordinates follow a top-down plan: +x = right/east, +z = down/south.
// Only terrain/coast is represented here. No buildings, roads, piers,
// lighthouse, seawalls or other structures are part of this preset.
export const MAIN_COAST_POLYGON = Object.freeze([
  [5, 14], [9, 10], [15, 8], [23, 7], [32, 6], [41, 5],
  [51, 6], [61, 7], [71, 8], [80, 11], [87, 14], [93, 18],
  [98, 21], [102, 21],

  // Lighthouse-side rocky headland visible at the upper-right of the reference.
  [107, 18], [113, 18], [118, 21], [121, 26], [122, 31], [121, 36],
  [118, 40], [114, 43], [109, 46], [104, 46], [100, 44], [96, 41],
  [94, 38],

  // Inner crescent bay. This is the critical negative-space shape.
  [90, 39], [87, 41], [84, 44], [81, 47], [78, 49], [74, 49],
  [70, 50], [66, 52], [62, 55], [58, 58], [54, 61], [50, 65],
  [47, 68], [44, 72], [41, 76], [39, 80], [38, 83],

  // Foreground green/sandy tongue forming the lower lip of the bay.
  [40, 85], [44, 87], [49, 88], [54, 88], [59, 87], [64, 86],
  [67, 89], [67, 92], [64, 96], [60, 99], [55, 102], [49, 105],
  [42, 107], [35, 109], [28, 109], [21, 108], [15, 105], [11, 102],
  [8, 98], [6, 93], [5, 87], [5, 81], [6, 74], [8, 67], [10, 61],
  [12, 55], [13, 49], [13, 43], [12, 37], [10, 32], [8, 27], [6, 21]
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

function distanceToCoast(x, z) {
  let min = Infinity;
  for (let i = 0; i < MAIN_COAST_POLYGON.length; i++) {
    const a = MAIN_COAST_POLYGON[i];
    const b = MAIN_COAST_POLYGON[(i + 1) % MAIN_COAST_POLYGON.length];
    min = Math.min(min, pointSegmentDistance(x, z, a[0], a[1], b[0], b[1]));
  }
  return min;
}

function isBayBeach(x, z, coastDistance) {
  if (coastDistance > 5.25) return false;
  if (x >= 39 && x <= 87 && z >= 43 && z <= 89) return true;
  if (x >= 46 && x <= 68 && z >= 84 && z <= 99) return true;
  return false;
}

function isRockHeadland(x, z, coastDistance) {
  return x >= 92 && z <= 48 && coastDistance <= 8;
}

function baseHeight(x, z, coastDistance) {
  // Keep this deliberately restrained for the first acceptance pass.
  // The reference shows a low coastal shelf rising gradually inland.
  let height = 2 + Math.min(5, Math.floor(coastDistance / 5.5));

  // Main town mass sits slightly higher than the beach without inventing hills.
  if (x < 82 && z < 69 && coastDistance > 10) height += 1;

  // The lighthouse headland is visibly rocky and slightly raised.
  if (x >= 96 && z <= 46) height = Math.max(height, 4);

  return Math.max(2, Math.min(8, height));
}

export function createReferenceColumns() {
  const columns = new Map();
  const { width, depth } = REFERENCE_WORLD;

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const pz = z + 0.5;
      if (!insidePolygon(px, pz, MAIN_COAST_POLYGON)) continue;

      const coastDistance = distanceToCoast(px, pz);
      const surface = isRockHeadland(px, pz, coastDistance)
        ? 'rock'
        : isBayBeach(px, pz, coastDistance)
          ? 'sand'
          : 'grass';

      columns.set(String(x) + ',' + String(z), {
        x,
        z,
        height: baseHeight(px, pz, coastDistance),
        surface
      });
    }
  }

  return columns;
}
