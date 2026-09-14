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


const LIGHTHOUSE_PATCH_BOUNDS = Object.freeze({
  minX: 112,
  maxX: 156,
  minZ: 76,
  maxZ: 112
});

// Hand-authored coastline for the lighthouse corner. This deliberately avoids
// concentric distance bands: the reference has unequal fingers, notches and
// broken ledges around the cape.
const LIGHTHOUSE_CAPE_POLYGON = Object.freeze([
  [113, 82], [119, 82], [123, 79], [129, 81], [133, 79], [138, 81],
  [143, 80], [146, 83], [150, 84], [149, 88], [153, 89], [151, 92],
  [155, 95], [152, 98], [153, 101], [148, 103], [147, 107], [142, 106],
  [139, 110], [135, 108], [132, 111], [128, 108], [124, 110], [122, 106],
  [118, 107], [119, 103], [114, 103], [116, 99], [112, 97], [115, 93],
  [112, 90], [116, 87], [113, 84]
]);

// Each zone is a deliberately irregular shelf seen in the lighthouse close-ups.
// Lower green shelves are intentional: grass is not restricted to the topmost
// 12-block platform in the reference.
const LIGHTHOUSE_TERRAIN_ZONES = Object.freeze([
  {
    height: 11,
    surface: 'grass',
    polygon: [[119, 86], [125, 84], [130, 85], [134, 83], [140, 84], [145, 87],
      [144, 91], [147, 94], [143, 97], [142, 101], [136, 100], [132, 104],
      [128, 102], [123, 104], [122, 99], [118, 97], [120, 92], [118, 89]]
  },
  {
    height: 9,
    surface: 'grass',
    polygon: [[114, 84], [120, 82], [124, 82], [124, 87], [121, 90],
      [122, 94], [117, 96], [114, 93], [116, 89]]
  },
  {
    height: 8,
    surface: 'grass',
    polygon: [[143, 84], [148, 85], [149, 89], [147, 92], [150, 95],
      [146, 98], [142, 96], [144, 92], [141, 89]]
  },
  {
    height: 8,
    surface: 'rock',
    polygon: [[114, 94], [119, 92], [122, 95], [120, 100], [116, 101],
      [113, 98]]
  },
  {
    height: 7,
    surface: 'rock',
    polygon: [[136, 101], [143, 99], [147, 102], [144, 106], [140, 105],
      [138, 108], [134, 106]]
  },
  {
    height: 6,
    surface: 'grass',
    polygon: [[124, 103], [130, 101], [135, 104], [133, 108], [129, 107],
      [126, 109], [122, 106]]
  },
  {
    height: 6,
    surface: 'grass',
    polygon: [[147, 94], [152, 94], [151, 98], [152, 101], [148, 102],
      [145, 100]]
  },
  {
    height: 5,
    surface: 'grass',
    polygon: [[117, 101], [122, 100], [124, 104], [121, 107], [117, 106],
      [115, 103]]
  },
  {
    height: 5,
    surface: 'rock',
    polygon: [[132, 106], [138, 105], [140, 109], [136, 110], [133, 109]]
  },
  {
    height: 4,
    surface: 'grass',
    polygon: [[145, 102], [150, 101], [149, 105], [146, 107], [142, 105]]
  },
  {
    height: 4,
    surface: 'rock',
    polygon: [[121, 106], [126, 106], [128, 109], [124, 110], [120, 108]]
  }
]);

const LIGHTHOUSE_ROCK_OUTCROPS = Object.freeze([
  { height: 5, polygon: [[151, 89], [154, 90], [153, 93], [150, 92]] },
  { height: 4, polygon: [[149, 101], [153, 101], [151, 105], [147, 104]] },
  { height: 4, polygon: [[137, 108], [141, 108], [140, 111], [136, 111]] },
  { height: 3, polygon: [[119, 107], [123, 108], [122, 111], [118, 110]] }
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


function lighthouseZoneAt(x, z) {
  for (const zone of LIGHTHOUSE_TERRAIN_ZONES) {
    if (insidePolygon(x, z, zone.polygon)) return zone;
  }
  for (const outcrop of LIGHTHOUSE_ROCK_OUTCROPS) {
    if (insidePolygon(x, z, outcrop.polygon)) {
      return { height: outcrop.height, surface: 'rock' };
    }
  }
  return null;
}

function fallbackLighthouseRock(x, z) {
  // Remaining cape cells are exposed rock, but still intentionally uneven.
  // These are authored sectors rather than distance rings.
  if (z >= 104 && x <= 132) return { height: 3, surface: 'rock' };
  if (x >= 147 && z >= 96) return { height: 3, surface: 'rock' };
  if (x >= 148 && z <= 94) return { height: 4, surface: 'rock' };
  if (z >= 101) return { height: 4, surface: 'rock' };
  if (x <= 118 && z >= 94) return { height: 5, surface: 'rock' };
  return { height: 6, surface: 'rock' };
}

function applyLighthouseTerrainPatch(columns) {
  const { minX, maxX, minZ, maxZ } = LIGHTHOUSE_PATCH_BOUNDS;

  // Remove the old algorithmic cape only inside this local construction window.
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      columns.delete(String(x) + ',' + String(z));
    }
  }

  // Rebuild the cape cell by cell from the hand-authored footprint and shelves.
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const pz = z + 0.5;
      if (!insidePolygon(px, pz, LIGHTHOUSE_CAPE_POLYGON)) continue;

      const zone = lighthouseZoneAt(px, pz);
      const spec = zone || fallbackLighthouseRock(px, pz);
      columns.set(String(x) + ',' + String(z), {
        x,
        z,
        height: spec.height,
        surface: spec.surface
      });
    }
  }

  // Add a few shoreline rock clusters that extend beyond the main footprint.
  for (const outcrop of LIGHTHOUSE_ROCK_OUTCROPS) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const pz = z + 0.5;
        if (!insidePolygon(px, pz, outcrop.polygon)) continue;
        columns.set(String(x) + ',' + String(z), {
          x,
          z,
          height: outcrop.height,
          surface: 'rock'
        });
      }
    }
  }
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

  // Replace only the lighthouse corner with the irregular hand-authored terrain.
  applyLighthouseTerrainPatch(columns);
  addBreakwater(columns);
  return columns;
}
