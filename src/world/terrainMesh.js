import * as THREE from 'three';

const TOP_COLORS = {
  grass: new THREE.Color('#86c96e'),
  sand: new THREE.Color('#ead49a'),
  rock: new THREE.Color('#879096')
};

const SIDE_COLORS = {
  grass: new THREE.Color('#70875a'),
  sand: new THREE.Color('#c8ad78'),
  rock: new THREE.Color('#707a80')
};

const ROCK_BOTTOM = new THREE.Color('#616b72');

function blockFaceColor(type, normal, y, minY) {
  if (normal[1] > 0.5) return TOP_COLORS[type] || TOP_COLORS.rock;
  if (normal[1] < -0.5 && y === minY) return ROCK_BOTTOM;
  return SIDE_COLORS[type] || SIDE_COLORS.rock;
}

function pushQuad(buffers, a, b, c, d, normal, color) {
  const base = buffers.positions.length / 3;
  for (const p of [a, b, c, d]) buffers.positions.push(...p);
  for (let i = 0; i < 4; i++) {
    buffers.normals.push(...normal);
    buffers.colors.push(color.r, color.g, color.b);
  }
  buffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

const FACES = [
  {
    d: [1, 0, 0],
    normal: [1, 0, 0],
    quad: (x0, x1, y0, y1, z0, z1) => [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]
  },
  {
    d: [-1, 0, 0],
    normal: [-1, 0, 0],
    quad: (x0, x1, y0, y1, z0, z1) => [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]]
  },
  {
    d: [0, 1, 0],
    normal: [0, 1, 0],
    quad: (x0, x1, y0, y1, z0, z1) => [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]
  },
  {
    d: [0, -1, 0],
    normal: [0, -1, 0],
    quad: (x0, x1, y0, y1, z0, z1) => [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]]
  },
  {
    d: [0, 0, 1],
    normal: [0, 0, 1],
    quad: (x0, x1, y0, y1, z0, z1) => [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]]
  },
  {
    d: [0, 0, -1],
    normal: [0, 0, -1],
    quad: (x0, x1, y0, y1, z0, z1) => [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]
  }
];

export function buildTerrainMesh(world) {
  const b = { positions: [], normals: [], colors: [], indices: [] };
  const ox = -world.width / 2;
  const oz = -world.depth / 2;

  // World data is fully voxelized. Rendering still omits hidden internal faces.
  for (const block of world.blocks.values()) {
    const x0 = ox + block.x;
    const x1 = x0 + 1;
    const y0 = block.y;
    const y1 = y0 + 1;
    const z0 = oz + block.z;
    const z1 = z0 + 1;

    for (const face of FACES) {
      const nx = block.x + face.d[0];
      const ny = block.y + face.d[1];
      const nz = block.z + face.d[2];
      if (world.hasBlock(nx, ny, nz)) continue;

      const q = face.quad(x0, x1, y0, y1, z0, z1);
      const color = blockFaceColor(block.type, face.normal, block.y, world.minY);
      pushQuad(b, q[0], q[1], q[2], q[3], face.normal, color);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(b.colors, 3));
  geometry.setIndex(b.indices);
  geometry.computeBoundingSphere();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}
