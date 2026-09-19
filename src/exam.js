import * as THREE from 'three';
import './exam.css';

const app = document.querySelector('#app');
app.innerHTML = [
  '<div class="exam-viewport" data-role="viewport"></div>',
  '<section class="exam-panel">',
  '<strong>Town Prototype Zero-A · 考试验收</strong>',
  '<span>PZ 房屋路线复刻测试 · 一栋住宅</span>',
  '<span data-role="status">室外 · 固定斜俯视</span>',
  '</section>',
  '<a class="exam-back" href="../">返回 Town</a>',
  '<div class="exam-help">WASD / 方向键移动 · E 开关门</div>',
  '<section class="touch-controls" aria-label="移动控制">',
  '<div class="touch-pad" aria-label="方向移动">',
  '<button data-move="forward" aria-label="向前">▲</button>',
  '<button data-move="left" aria-label="向左">◀</button>',
  '<button data-move="back" aria-label="向后">▼</button>',
  '<button data-move="right" aria-label="向右">▶</button>',
  '</div>',
  '<button class="door-action" data-action="door" aria-label="开关门">门</button>',
  '</section>'
].join('');

const viewport = app.querySelector('[data-role="viewport"]');
const status = app.querySelector('[data-role="status"]');
const moveButtons = [...app.querySelectorAll('[data-move]')];
const doorButton = app.querySelector('[data-action="door"]');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87948f');
scene.fog = new THREE.Fog('#87948f', 25, 52);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
const cameraOffset = new THREE.Vector3(10, 13, 10);
const cameraTarget = new THREE.Vector3(0, 0.8, 6.5);

function updateCameraProjection() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewHeight = aspect < 0.75 ? 24 : 16.5;
  camera.left = -(viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

scene.add(new THREE.HemisphereLight(0xdde7e3, 0x4b514c, 2.15));
const sun = new THREE.DirectionalLight(0xffeed2, 2.75);
sun.position.set(8, 18, 11);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.bias = -0.00035;
scene.add(sun);

function makePattern(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (kind === 'grass') {
    ctx.fillStyle = '#687f5d';
    ctx.fillRect(0, 0, 64, 64);
    for (let y = 2; y < 64; y += 7) {
      for (let x = 2; x < 64; x += 7) {
        const v = (x * 17 + y * 31) % 3;
        ctx.fillStyle = ['#5c7353', '#738967', '#627958'][v];
        ctx.fillRect(x + ((y / 7) % 2) * 2, y, 2, 3);
      }
    }
  } else if (kind === 'wood') {
    ctx.fillStyle = '#9a7758';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#745942';
    ctx.lineWidth = 2;
    for (let y = 0; y <= 64; y += 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (let y = 0; y < 64; y += 12) {
      const offset = (y / 12) % 2 ? 20 : 42;
      ctx.beginPath(); ctx.moveTo(offset, y); ctx.lineTo(offset, y + 12); ctx.stroke();
    }
  } else if (kind === 'tile') {
    ctx.fillStyle = '#b5b6ac';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#8f938d';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 64; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
    }
  } else if (kind === 'asphalt') {
    ctx.fillStyle = '#4b504e';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 80; i += 1) {
      const x = (i * 29) % 64;
      const y = (i * 47) % 64;
      ctx.fillStyle = i % 3 ? '#555a58' : '#3e4341';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipMapNearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const textures = {
  grass: makePattern('grass'),
  wood: makePattern('wood'),
  tile: makePattern('tile'),
  asphalt: makePattern('asphalt')
};
textures.grass.repeat.set(10, 8);
textures.wood.repeat.set(4, 4);
textures.tile.repeat.set(3, 3);
textures.asphalt.repeat.set(12, 3);

function mat(color, roughness = 0.86, map = null) {
  return new THREE.MeshStandardMaterial({ color, roughness, map });
}

const mats = {
  grass: mat('#ffffff', 0.98, textures.grass),
  asphalt: mat('#ffffff', 0.98, textures.asphalt),
  sidewalk: mat('#9fa39b', 0.96),
  foundation: mat('#6f716b', 0.96),
  wall: mat('#d0c2a4', 0.94),
  wallInner: mat('#d9d0bd', 0.94),
  trim: mat('#ece5d3', 0.88),
  woodFloor: mat('#ffffff', 0.9, textures.wood),
  tileFloor: mat('#ffffff', 0.93, textures.tile),
  roof: mat('#6d4b3e', 0.97),
  roofEdge: mat('#4d3932', 0.93),
  door: mat('#6f5139', 0.9),
  darkWood: mat('#5d4736', 0.9),
  lightWood: mat('#9c7654', 0.9),
  sofa: mat('#66796f', 0.98),
  bed: mat('#c8c0ae', 0.98),
  blanket: mat('#6e7f86', 0.98),
  cabinet: mat('#a38b69', 0.9),
  counter: mat('#5d625e', 0.75),
  porcelain: mat('#d8d8cf', 0.82),
  metal: mat('#727b7b', 0.55),
  black: mat('#282d2d', 0.85)
};

const glass = new THREE.MeshStandardMaterial({
  color: '#96b7bd',
  roughness: 0.28,
  transparent: true,
  opacity: 0.58,
  side: THREE.DoubleSide
});

const world = new THREE.Group();
scene.add(world);
const house = new THREE.Group();
world.add(house);
const cutawayGroup = new THREE.Group();
house.add(cutawayGroup);
const solidWallGroup = new THREE.Group();
house.add(solidWallGroup);
const roofGroup = new THREE.Group();
house.add(roofGroup);
const furniture = new THREE.Group();
house.add(furniture);

function box(parent, w, h, d, material, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = h > 0.08;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

box(world, 30, 0.18, 24, mats.grass, 0, -0.12, 0);
box(world, 30, 0.08, 5.8, mats.asphalt, 0, -0.01, 9.1);
box(world, 30, 0.09, 1.2, mats.sidewalk, 0, 0.01, 5.85);
box(world, 1.25, 0.07, 2.4, mats.sidewalk, -0.48, 0.02, 4.65);
box(house, 10.4, 0.28, 8.4, mats.foundation, 0, 0.08, 0);

// Room floors, deliberately aligned to a fixed tile-like footprint.
box(house, 5.0, 0.08, 4.0, mats.woodFloor, -2.5, 0.25, 2.0);
box(house, 5.0, 0.08, 4.0, mats.tileFloor, -2.5, 0.25, -2.0);
box(house, 5.0, 0.08, 4.0, mats.woodFloor, 2.5, 0.25, -2.0);
box(house, 3.0, 0.08, 4.0, mats.woodFloor, 1.5, 0.25, 2.0);
box(house, 2.0, 0.08, 4.0, mats.tileFloor, 4.0, 0.25, 2.0);

const WALL_H = 2.45;
const WALL_T = 0.14;

function wallX(parent, x0, x1, z, material = mats.wall, h = WALL_H, y = h / 2 + 0.28) {
  return box(parent, x1 - x0, h, WALL_T, material, (x0 + x1) / 2, y, z);
}
function wallZ(parent, x, z0, z1, material = mats.wall, h = WALL_H, y = h / 2 + 0.28) {
  return box(parent, WALL_T, h, z1 - z0, material, x, y, (z0 + z1) / 2);
}

function windowX(parent, cx, z, width = 1.25) {
  wallX(parent, cx - width / 2, cx + width / 2, z, mats.wall, 0.72, 0.64);
  wallX(parent, cx - width / 2, cx + width / 2, z, mats.wall, 0.55, 2.46);
  const pane = box(parent, width - 0.12, 1.0, 0.035, glass, cx, 1.55, z + 0.01);
  pane.castShadow = false;
  box(parent, width + 0.08, 0.07, 0.08, mats.trim, cx, 1.04, z + 0.02);
  box(parent, width + 0.08, 0.07, 0.08, mats.trim, cx, 2.06, z + 0.02);
  box(parent, 0.07, 1.05, 0.08, mats.trim, cx - width / 2, 1.55, z + 0.02);
  box(parent, 0.07, 1.05, 0.08, mats.trim, cx + width / 2, 1.55, z + 0.02);
}

function windowZ(parent, x, cz, width = 1.25) {
  wallZ(parent, x, cz - width / 2, cz + width / 2, mats.wall, 0.72, 0.64);
  wallZ(parent, x, cz - width / 2, cz + width / 2, mats.wall, 0.55, 2.46);
  const pane = box(parent, 0.035, 1.0, width - 0.12, glass, x + 0.01, 1.55, cz);
  pane.castShadow = false;
  box(parent, 0.08, 0.07, width + 0.08, mats.trim, x + 0.02, 1.04, cz);
  box(parent, 0.08, 0.07, width + 0.08, mats.trim, x + 0.02, 2.06, cz);
  box(parent, 0.08, 1.05, 0.07, mats.trim, x + 0.02, 1.55, cz - width / 2);
  box(parent, 0.08, 1.05, 0.07, mats.trim, x + 0.02, 1.55, cz + width / 2);
}

// Back wall: full-height, with two windows.
wallX(solidWallGroup, -5, -4.2, -4);
windowX(solidWallGroup, -3.55, -4, 1.3);
wallX(solidWallGroup, -2.9, 1.1, -4);
windowX(solidWallGroup, 1.75, -4, 1.3);
wallX(solidWallGroup, 2.4, 5, -4);

// Left wall.
wallZ(solidWallGroup, -5, -4, -2.7);
windowZ(solidWallGroup, -5, -2.0, 1.35);
wallZ(solidWallGroup, -5, -1.3, 1.0);
windowZ(solidWallGroup, -5, 1.75, 1.35);
wallZ(solidWallGroup, -5, 2.5, 4);

// Front wall, including the only exterior door. This whole side becomes the PZ-style cutaway.
wallX(cutawayGroup, -5, -4.25, 4);
windowX(cutawayGroup, -3.55, 4, 1.4);
wallX(cutawayGroup, -2.85, -1.0, 4);
wallX(cutawayGroup, -1.0, 0.1, 4, mats.wall, 0.42, 2.52);
wallX(cutawayGroup, 0.1, 1.05, 4);
windowX(cutawayGroup, 1.7, 4, 1.3);
wallX(cutawayGroup, 2.35, 5, 4);

// Right wall, also on the camera-facing cutaway side.
wallZ(cutawayGroup, 5, -4, -3.1);
windowZ(cutawayGroup, 5, -2.35, 1.35);
wallZ(cutawayGroup, 5, -1.6, 0.9);
windowZ(cutawayGroup, 5, 1.55, 1.0);
wallZ(cutawayGroup, 5, 2.1, 4);

// Interior partitions. Camera-facing pieces join the cutaway layer to keep rooms readable.
wallX(solidWallGroup, -5, -1.25, 0, mats.wallInner);
wallX(solidWallGroup, -0.15, 1.0, 0, mats.wallInner);
wallX(cutawayGroup, 2.0, 5, 0, mats.wallInner);
wallZ(cutawayGroup, 3.0, 0, 1.25, mats.wallInner);
wallZ(cutawayGroup, 3.0, 2.25, 4, mats.wallInner);

// Interior open doors, fixed in an open state to keep the test focused on exterior entry.
box(furniture, 0.08, 2.0, 0.95, mats.door, 1.98, 1.28, -0.47, Math.PI / 2);
box(furniture, 0.08, 2.0, 0.95, mats.door, 3.47, 1.28, 2.23);

// Exterior door controller.
const entryPivot = new THREE.Group();
entryPivot.position.set(-1.0, 0.28, 4.0);
cutawayGroup.add(entryPivot);
const entryDoor = box(entryPivot, 1.0, 2.08, 0.09, mats.door, 0.5, 1.04, 0.0);
box(entryDoor, 0.06, 0.06, 0.08, mats.metal, 0.38, 0.0, -0.06);
let doorOpen = false;
let doorAngle = 0;

// Living room.
box(furniture, 2.4, 0.55, 0.9, mats.sofa, -3.65, 0.64, 1.15);
box(furniture, 2.4, 0.65, 0.18, mats.sofa, -3.65, 1.05, 1.51);
box(furniture, 1.25, 0.16, 0.72, mats.lightWood, -2.1, 0.52, 2.0);
box(furniture, 1.6, 0.48, 0.45, mats.darkWood, -0.8, 0.52, 0.55);
box(furniture, 1.45, 0.86, 0.06, mats.black, -0.8, 1.12, 0.32);

// Kitchen.
box(furniture, 3.5, 0.82, 0.62, mats.cabinet, -3.05, 0.69, -3.55);
box(furniture, 3.55, 0.1, 0.68, mats.counter, -3.05, 1.15, -3.55);
box(furniture, 0.72, 1.85, 0.7, mats.metal, -4.4, 1.2, -2.65);
box(furniture, 1.8, 0.12, 0.9, mats.lightWood, -1.9, 0.66, -1.6);
box(furniture, 0.38, 0.65, 0.38, mats.lightWood, -2.65, 0.61, -1.6);
box(furniture, 0.38, 0.65, 0.38, mats.lightWood, -1.15, 0.61, -1.6);

// Bedroom.
box(furniture, 2.0, 0.34, 3.05, mats.darkWood, 3.55, 0.52, -2.2);
box(furniture, 1.86, 0.32, 2.86, mats.bed, 3.55, 0.81, -2.12);
box(furniture, 1.86, 0.16, 1.15, mats.blanket, 3.55, 1.0, -1.32);
box(furniture, 0.92, 1.8, 0.58, mats.cabinet, 0.7, 1.18, -3.55);

// Bathroom.
box(furniture, 1.25, 0.48, 0.7, mats.porcelain, 4.15, 0.56, 3.2);
box(furniture, 0.56, 0.48, 0.64, mats.porcelain, 4.3, 0.55, 0.75);
box(furniture, 1.05, 0.75, 0.5, mats.cabinet, 3.65, 0.68, 1.75);
box(furniture, 1.08, 0.08, 0.56, mats.porcelain, 3.65, 1.08, 1.75);

// Gabled roof. It remains visible outside and dissolves only for the current building.
const roofMaterials = [
  mats.roof.clone(),
  mats.roof.clone(),
  mats.roofEdge.clone()
];
roofMaterials.forEach((m) => { m.transparent = true; m.opacity = 1; });
const roofAngle = Math.atan2(1.55, 4.25);
const slopeLength = Math.hypot(4.25, 1.55);
box(roofGroup, 10.9, 0.12, slopeLength, roofMaterials[0], 0, 3.35, 2.05, -0.0).rotation.x = -roofAngle;
box(roofGroup, 10.9, 0.12, slopeLength, roofMaterials[1], 0, 3.35, -2.05, -0.0).rotation.x = roofAngle;
box(roofGroup, 10.95, 0.16, 0.16, roofMaterials[2], 0, 4.08, 0);

// Simple chimney gives the roof one clear PZ-like silhouette break.
box(roofGroup, 0.62, 1.1, 0.62, mats.roofEdge, 2.8, 4.15, -1.25);

const player = new THREE.Group();
scene.add(player);
const skin = mat('#c99d78', 0.86);
const shirt = mat('#536c72', 0.9);
const pants = mat('#39474b', 0.94);
const shoes = mat('#252a29', 0.92);
box(player, 0.34, 0.66, 0.28, shirt, 0, 0.92, 0);
box(player, 0.13, 0.62, 0.16, pants, -0.11, 0.36, 0);
box(player, 0.13, 0.62, 0.16, pants, 0.11, 0.36, 0);
box(player, 0.18, 0.09, 0.3, shoes, -0.11, 0.04, -0.04);
box(player, 0.18, 0.09, 0.3, shoes, 0.11, 0.04, -0.04);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), skin);
head.position.set(0, 1.42, 0);
head.castShadow = true;
player.add(head);
box(player, 0.26, 0.12, 0.18, mats.black, 0, 1.56, 0.01);

const playerPos = new THREE.Vector3(-0.45, 0.3, 7.0);
player.position.copy(playerPos);
const input = new Set();
const touchInput = new Set();
const clock = new THREE.Clock();
const playerRadius = 0.22;
let cutawayAmount = 1;
let roofOpacity = 1;
let wasInside = false;
let walkPhase = 0;

const collisionRects = [
  { minX: -5.08, maxX: 5.08, minZ: -4.08, maxZ: -3.90 },
  { minX: -5.08, maxX: -4.90, minZ: -4.08, maxZ: 4.08 },
  { minX: 4.90, maxX: 5.08, minZ: -4.08, maxZ: 4.08 },
  { minX: -5.08, maxX: -1.0, minZ: 3.90, maxZ: 4.08 },
  { minX: 0.1, maxX: 5.08, minZ: 3.90, maxZ: 4.08 },
  { minX: -5.0, maxX: -1.25, minZ: -0.08, maxZ: 0.08 },
  { minX: -0.15, maxX: 1.0, minZ: -0.08, maxZ: 0.08 },
  { minX: 2.0, maxX: 5.0, minZ: -0.08, maxZ: 0.08 },
  { minX: 2.92, maxX: 3.08, minZ: 0.0, maxZ: 1.25 },
  { minX: 2.92, maxX: 3.08, minZ: 2.25, maxZ: 4.0 },
  { minX: -4.95, maxX: -2.35, minZ: 0.6, maxZ: 1.7 },
  { minX: -3.95, maxX: -0.75, minZ: -3.95, maxZ: -3.15 },
  { minX: 2.45, maxX: 4.65, minZ: -3.8, maxZ: -0.55 }
];

function blocked(x, z) {
  const p = playerRadius;
  for (const r of collisionRects) {
    if (x > r.minX - p && x < r.maxX + p && z > r.minZ - p && z < r.maxZ + p) return true;
  }
  if (!doorOpen && x > -1.05 - p && x < 0.15 + p && z > 3.86 - p && z < 4.12 + p) return true;
  return false;
}

function movePlayer(dx, dz) {
  const nx = THREE.MathUtils.clamp(playerPos.x + dx, -13.5, 13.5);
  const nz = THREE.MathUtils.clamp(playerPos.z + dz, -10.8, 11.4);
  if (!blocked(nx, playerPos.z)) playerPos.x = nx;
  if (!blocked(playerPos.x, nz)) playerPos.z = nz;
  player.position.x = playerPos.x;
  player.position.z = playerPos.z;
}

function isInsideHouse() {
  return playerPos.x > -4.88 && playerPos.x < 4.88 && playerPos.z > -3.88 && playerPos.z < 3.88;
}

function currentRoom() {
  if (!isInsideHouse()) return '室外';
  if (playerPos.z < 0 && playerPos.x < 0) return '厨房';
  if (playerPos.z < 0 && playerPos.x >= 0) return '卧室';
  if (playerPos.z >= 0 && playerPos.x >= 3) return '卫生间';
  if (playerPos.z >= 0 && playerPos.x >= 0) return '门厅';
  return '客厅';
}

function toggleDoor() {
  const d = Math.hypot(playerPos.x + 0.45, playerPos.z - 4.0);
  if (d > 1.55) {
    status.textContent = currentRoom() + ' · 靠近前门再操作';
    return;
  }
  doorOpen = !doorOpen;
  status.textContent = currentRoom() + (doorOpen ? ' · 前门已打开' : ' · 前门已关闭');
}

doorButton.addEventListener('click', toggleDoor);

for (const button of moveButtons) {
  const dir = button.dataset.move;
  const press = (event) => {
    event.preventDefault();
    event.stopPropagation();
    touchInput.add(dir);
    button.classList.add('pressed');
  };
  const release = (event) => {
    event.preventDefault();
    event.stopPropagation();
    touchInput.delete(dir);
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

window.addEventListener('keydown', (event) => {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
    input.add(event.code);
  }
  if (event.code === 'KeyE') toggleDoor();
});
window.addEventListener('keyup', (event) => input.delete(event.code));
window.addEventListener('blur', () => { input.clear(); touchInput.clear(); });

function updateMovement(delta) {
  const forward = Number(input.has('KeyW') || input.has('ArrowUp') || touchInput.has('forward')) -
    Number(input.has('KeyS') || input.has('ArrowDown') || touchInput.has('back'));
  const right = Number(input.has('KeyD') || input.has('ArrowRight') || touchInput.has('right')) -
    Number(input.has('KeyA') || input.has('ArrowLeft') || touchInput.has('left'));

  if (!forward && !right) {
    player.position.y = 0.3;
    return;
  }

  const len = Math.hypot(forward, right) || 1;
  const f = forward / len;
  const r = right / len;
  const screenForwardX = -Math.SQRT1_2;
  const screenForwardZ = -Math.SQRT1_2;
  const screenRightX = Math.SQRT1_2;
  const screenRightZ = -Math.SQRT1_2;
  const dx = screenForwardX * f + screenRightX * r;
  const dz = screenForwardZ * f + screenRightZ * r;
  const speed = 3.0 * Math.min(delta, 0.04);
  movePlayer(dx * speed, dz * speed);
  player.rotation.y = Math.atan2(dx, dz);
  walkPhase += delta * 10;
  player.position.y = 0.3 + Math.sin(walkPhase) * 0.025;
}

function updateBuildingOcclusion(delta) {
  const inside = isInsideHouse();
  if (inside !== wasInside) {
    wasInside = inside;
    status.textContent = currentRoom() + (inside ? ' · 当前建筑切层' : ' · 屋顶恢复');
  } else if (inside) {
    status.textContent = currentRoom() + ' · 当前建筑切层';
  }

  const targetCut = inside ? 0.28 : 1;
  const targetRoof = inside ? 0 : 1;
  cutawayAmount = THREE.MathUtils.lerp(cutawayAmount, targetCut, 1 - Math.exp(-delta * 11));
  roofOpacity = THREE.MathUtils.lerp(roofOpacity, targetRoof, 1 - Math.exp(-delta * 9));
  cutawayGroup.scale.y = cutawayAmount;
  roofMaterials.forEach((m) => { m.opacity = roofOpacity; });
  roofGroup.visible = roofOpacity > 0.025;
}

function updateDoor(delta) {
  const target = doorOpen ? -Math.PI * 0.52 : 0;
  doorAngle = THREE.MathUtils.lerp(doorAngle, target, 1 - Math.exp(-delta * 12));
  entryPivot.rotation.y = doorAngle;
}

function updateCamera(delta) {
  cameraTarget.x = THREE.MathUtils.lerp(cameraTarget.x, playerPos.x, 1 - Math.exp(-delta * 5));
  cameraTarget.z = THREE.MathUtils.lerp(cameraTarget.z, playerPos.z - 0.4, 1 - Math.exp(-delta * 5));
  camera.position.copy(cameraTarget).add(cameraOffset);
  camera.lookAt(cameraTarget);
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCameraProjection();
}
window.addEventListener('resize', onResize);
updateCameraProjection();
updateCamera(1);

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  updateMovement(delta);
  updateDoor(delta);
  updateBuildingOcclusion(delta);
  updateCamera(delta);
  renderer.render(scene, camera);
});
