import { BlockWorld } from './worldData.js';

export const WORLD_JSON_VERSION = 'town-voxel-world-v0.1';

export function serializeWorld(world) {
  const columns = Array.from(world.columns.values())
    .sort((a, b) => a.z - b.z || a.x - b.x)
    .map(({ x, z, height, surface }) => [x, z, height, surface]);

  return {
    schema: WORLD_JSON_VERSION,
    kind: 'coast-skeleton',
    grid: {
      width: world.width,
      depth: world.depth,
      maxHeight: world.maxHeight,
      blockSize: 1
    },
    waterLevel: world.waterLevel,
    columns
  };
}

export function stringifyWorld(world) {
  return JSON.stringify(serializeWorld(world), null, 2);
}

export function parseWorld(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || data.schema !== WORLD_JSON_VERSION) {
    throw new Error('不支持的地图 JSON：' + (data?.schema || 'missing schema'));
  }

  const width = Number(data.grid?.width);
  const depth = Number(data.grid?.depth);
  const maxHeight = Number(data.grid?.maxHeight ?? 12);
  const waterLevel = Number(data.waterLevel ?? 0.4);

  if (!Number.isInteger(width) || !Number.isInteger(depth) || width <= 0 || depth <= 0) {
    throw new Error('地图尺寸无效');
  }

  const world = new BlockWorld({ width, depth, maxHeight, waterLevel, columns: new Map() });

  for (const row of data.columns || []) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const [x, z, height, surface] = row;
    world.set(Number(x), Number(z), Number(height), surface);
  }

  return world;
}

export function downloadWorld(world, filename = 'town-voxel-world-v0.1-coast.json') {
  const blob = new Blob([stringifyWorld(world)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
