import * as THREE from 'three';

const SURFACE_COLORS = {
  grass: new THREE.Color('#86c96e'),
  sand: new THREE.Color('#ead49a'),
  rock: new THREE.Color('#879096')
};
const ROCK_CORE = new THREE.Color('#707a80');
const ROCK_CORE_DARK = new THREE.Color('#616b72');

function pushQuad(buffers, a, b, c, d, normal, color) {
  const base = buffers.positions.length / 3;
  for (const p of [a, b, c, d]) buffers.positions.push(...p);
  for (let i = 0; i < 4; i++) {
    buffers.normals.push(...normal);
    buffers.colors.push(color.r, color.g, color.b);
  }
  buffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function coreColor(y) {
  return y <= 1 ? ROCK_CORE_DARK : ROCK_CORE;
}

export function buildTerrainMesh(world) {
  const b = { positions: [], normals: [], colors: [], indices: [] };
  const ox = -world.width / 2;
  const oz = -world.depth / 2;

  for (const column of world.columns.values()) {
    const { x, z, height, surface } = column;
    const x0 = ox + x;
    const x1 = x0 + 1;
    const z0 = oz + z;
    const z1 = z0 + 1;
    const topColor = SURFACE_COLORS[surface] || SURFACE_COLORS.grass;

    // Surface cap. Grass/sand are only the top layer; the island body is rock.
    pushQuad(b, [x0, height, z0], [x0, height, z1], [x1, height, z1], [x1, height, z0], [0, 1, 0], topColor);

    const sides = [
      { dx: 1, dz: 0, normal: [1, 0, 0], quad: y => [[x1, y, z0], [x1, y, z1], [x1, y + 1, z1], [x1, y + 1, z0]] },
      { dx: -1, dz: 0, normal: [-1, 0, 0], quad: y => [[x0, y, z1], [x0, y, z0], [x0, y + 1, z0], [x0, y + 1, z1]] },
      { dx: 0, dz: 1, normal: [0, 0, 1], quad: y => [[x1, y, z1], [x0, y, z1], [x0, y + 1, z1], [x1, y + 1, z1]] },
      { dx: 0, dz: -1, normal: [0, 0, -1], quad: y => [[x0, y, z0], [x1, y, z0], [x1, y + 1, z0], [x0, y + 1, z0]] }
    ];

    for (const side of sides) {
      const neighbor = world.get(x + side.dx, z + side.dz);
      const neighborHeight = neighbor?.height || 0;
      for (let y = neighborHeight; y < height; y++) {
        const q = side.quad(y);
        pushQuad(b, q[0], q[1], q[2], q[3], side.normal, coreColor(y));
      }
    }

    // Close the underside. The previous mesh was an open shell; with transparent
    // water and oblique cameras that made the island read as hollow/leaking.
    pushQuad(
      b,
      [x0, 0, z1], [x0, 0, z0], [x1, 0, z0], [x1, 0, z1],
      [0, -1, 0], ROCK_CORE_DARK
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(b.colors, 3));
  geometry.setIndex(b.indices);
  geometry.computeBoundingSphere();

  const material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}
