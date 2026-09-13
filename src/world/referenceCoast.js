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
  [8, 21], [15, 14], [28, 9], [45, 7], [65, 7], [84, 8],
  [103, 10], [120, 12], [135, 17], [146, 25], [152, 36], [155, 49],
  [154, 62], [151, 71], [147, 79],

  // East / lighthouse headland: compact, rocky and connected to the town.
  [150, 87], [148, 97], [143, 105], [136, 111], [129, 113], [123, 111],
  [119, 106], [117, 101],

  // Inner shoreline of the sheltered bay. The five-view set shows a broad
  // horseshoe bay, not the narrow/deep cut used by the rejected first pass.
  [113, 95], [108, 90], [102, 86], [95, 83], [88, 81], [81, 81],
  [74, 83], [67, 86], [61, 90], [56, 95], [52, 101], [49, 108],
  [46, 114],

  // Green west tongue and small sandy cove visible in the top-down/rear views.
  [43, 119], [47, 123], [48, 128], [45, 132], [40, 133], [35, 130],
  [31, 126], [28, 128], [25, 136], [21, 144], [15, 150], [9, 149],
  [5, 142], [3, 132], [3, 119], [5, 105], [8, 92], [10, 80],
  [10, 68], [9, 57], [7, 46], [6, 34]
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
  return x >= 116 && z >= 68 && z <= 116;
}

function isMainBayBeach(x, z, coastDistance) {
  if (coastDistance > 7.5) return false;
  if (x < 60 || x > 105 || z < 78 || z > 115) return false;
  return !isLighthouseHeadland(x, z);
}

function isBaySeawall(x, z, coastDistance) {
  if (coastDistance > 4.25) return false;
  return x >= 43 && x <= 118 && z >= 78 && z <= 118 && !isLighthouseHeadland(x, z);
}

function isWestCoveBeach(x, z, coastDistance) {
  if (coastDistance > 5.5) return false;
  return x >= 17 && x <= 47 && z >= 118 && z <= 151;
}

function islandHeight(x, z, coastDistance, surface) {
  if (surface === 'sand') return 2;

  // Closed, low coastal shelf rising gradually inland. The town-facing shelf is
  // deliberately broad/flat so later streets and dense buildings can sit on it.
  let height = 3 + Math.min(5, Math.floor(coastDistance / 5.25));

  // Main town shelf around the horseshoe bay.
  if (x >= 43 && x <= 126 && z >= 28 && z <= 88) {
    height = Math.max(height, 6);
    if (z < 62 && coastDistance > 10) height = Math.max(height, 7);
  }

  // Wooded west/back side is gently higher, matching the rear and top views.
  if (x <= 48 && z >= 55 && z <= 126) {
    height = Math.max(height, 5 + Math.min(3, Math.floor(coastDistance / 9)));
  }

  // The lighthouse sits on a compact rock platform, not a tall cliff island.
  if (isLighthouseHeadland(x, z)) {
    height = Math.max(4, Math.min(6, height));
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

      // Slightly irregular stepped rocks, still deterministic and editable.
      const jitter = ((x * 17 + z * 31) % 5) === 0 ? 1 : 0;
      columns.set(key, { x, z, height: 2 + jitter, surface: 'rock' });
    }
  }
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
      const headland = isLighthouseHeadland(px, pz);
      const beach = isMainBayBeach(px, pz, coastDistance) || isWestCoveBeach(px, pz, coastDistance);
      const surface = headland && coastDistance <= 9
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

  // The rock breakwater is part of the base silhouette in every useful view.
  addBreakwater(columns);
  return columns;
}
