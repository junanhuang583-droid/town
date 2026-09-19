import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import './houseLab.css';

const app = document.querySelector('#app');

app.innerHTML = [
  '<div class="house-viewport" data-role="viewport"></div>',
  '<section class="house-panel">',
  '<strong>Town · 房屋实验场 v0.8</strong>',
  '<span>单层住宅样板 · 完整写实 NPC 测试</span>',
  '<span data-role="status">高质量写实 NPC 加载中 · 屋顶显示</span>',
  '</section>',
  '<a class="back-town" href="../">返回 Town</a>',
  '<section class="house-toolbar">',
  '<button data-action="reset-view">重置视角</button>',
  '<button data-action="first-person">第一视角</button>',
  '<button data-action="roof">屋顶：自动</button>',
  '<button data-action="doors">全部开门</button>',
  '</section>',
  '<div class="fp-crosshair" aria-hidden="true">+</div>',
  '<section class="fp-controls" aria-label="第一视角控制">',
  '<div class="move-pad">',
  '<button data-move="forward" aria-label="前进">▲</button>',
  '<button data-move="left" aria-label="左移">◀</button>',
  '<button data-move="back" aria-label="后退">▼</button>',
  '<button data-move="right" aria-label="右移">▶</button>',
  '</div>',
  '<div class="fp-actions">',
  '<button data-fp-action="interact">开 / 关门</button>',
  '</div>',
  '</section>',
  '<div class="house-hint">拖动旋转 · 滚轮/双指缩放 · 点击门开关</div>'
].join('');

const viewport = app.querySelector('[data-role="viewport"]');
const status = app.querySelector('[data-role="status"]');
const roofButton = app.querySelector('[data-action="roof"]');
const doorsButton = app.querySelector('[data-action="doors"]');
const firstPersonButton = app.querySelector('[data-action="first-person"]');
const moveButtons = [...app.querySelectorAll('[data-move]')];

const scene = new THREE.Scene();
scene.background = new THREE.Color('#d8dde0');
scene.fog = new THREE.Fog('#d8dde0', 44, 76);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.zoomToCursor = true;
controls.minDistance = 7.2;
controls.maxDistance = 42;
controls.minPolarAngle = THREE.MathUtils.degToRad(24);
controls.maxPolarAngle = THREE.MathUtils.degToRad(82);
controls.target.set(0, 1.1, 0);

let firstPerson = false;
let fpYaw = -Math.PI / 2;
let fpPitch = -0.03;
const fpEyeHeight = 1.68;
const fpMoveSpeed = 3.0;
const fpPlayerRadius = 0.22;
const fpKeys = new Set();
const fpTouchMove = new Set();
let fpLookPointer = null;
const clock = new THREE.Clock();
const npcMixers = [];

scene.add(new THREE.HemisphereLight(0xffffff, 0x687077, 2.05));

const sun = new THREE.DirectionalLight(0xfff4e4, 3.2);
sun.position.set(-14, 25, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -22;
sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -22;
sun.shadow.bias = -0.0005;
scene.add(sun);

const warm = new THREE.PointLight(0xffd3a3, 18, 20, 2);
warm.position.set(-2.5, 2.7, 0.8);
scene.add(warm);

const cool = new THREE.PointLight(0xddeeff, 12, 16, 2);
cool.position.set(4.2, 2.7, -2.2);
scene.add(cool);

function material(color, roughness = 0.72, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

const mats = {
  ground: material('#b9b4a8', 0.95),
  slab: material('#a9a49a', 0.92),
  wall: material('#eee9df', 0.92),
  trim: material('#d4cec3', 0.8),
  woodFloor: material('#b88961', 0.78),
  kitchenFloor: material('#c9c5bd', 0.86),
  bathFloor: material('#aeb8ba', 0.8),
  roof: material('#3f474b', 0.88),
  roofEdge: material('#2f373b', 0.84),
  darkWood: material('#6c4b36', 0.8),
  lightWood: material('#b98a61', 0.78),
  sofa: material('#9aa4a6', 0.93),
  fabricLight: material('#e7e2d9', 0.96),
  fabricDark: material('#717c80', 0.93),
  black: material('#202629', 0.55),
  metal: material('#aab1b3', 0.35, 0.55),
  white: material('#f4f2ec', 0.88),
  cabinet: material('#d7d0c4', 0.78),
  counter: material('#696d6c', 0.5),
  green: material('#5f8065', 0.9),
  terracotta: material('#9b6651', 0.9),
  blue: material('#7c959e', 0.6)
};

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#b9d8df',
  roughness: 0.08,
  metalness: 0,
  transmission: 0.38,
  transparent: true,
  opacity: 0.42,
  thickness: 0.06,
  side: THREE.DoubleSide
});

const mirrorMaterial = new THREE.MeshStandardMaterial({
  color: '#cbd5d7',
  roughness: 0.14,
  metalness: 0.72
});

const house = new THREE.Group();
scene.add(house);

const avatar = new THREE.Group();
scene.add(avatar);

function avatarPart(geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  avatar.add(mesh);
  return mesh;
}

const avatarSkin = material('#d6a27d', 0.82);
const avatarShirt = material('#4e7080', 0.86);
const avatarPants = material('#37454f', 0.9);
const avatarShoes = material('#22292d', 0.86);

avatarPart(new THREE.SphereGeometry(0.18, 24, 16), avatarSkin, 0, 1.72, 0);
avatarPart(new THREE.CapsuleGeometry(0.2, 0.52, 7, 16), avatarShirt, 0, 1.2, 0);
avatarPart(new THREE.CapsuleGeometry(0.08, 0.62, 6, 12), avatarPants, -0.11, 0.55, 0);
avatarPart(new THREE.CapsuleGeometry(0.08, 0.62, 6, 12), avatarPants, 0.11, 0.55, 0);
avatarPart(new THREE.BoxGeometry(0.18, 0.1, 0.34), avatarShoes, -0.11, 0.12, -0.08);
avatarPart(new THREE.BoxGeometry(0.18, 0.1, 0.34), avatarShoes, 0.11, 0.12, -0.08);
avatarPart(new THREE.BoxGeometry(0.08, 0.08, 0.05), mats.black, 0, 1.73, -0.175);

const playerPosition = new THREE.Vector3(-6.5, 0.6, -1.2);
avatar.position.copy(playerPosition);


const REALISTIC_NPC_SOURCE_URL =
  'https://three.ws/avatars/realistic-female.glb';
const REALISTIC_NPC_URL =
  'https://three.ws/api/glb?src=' + encodeURIComponent(REALISTIC_NPC_SOURCE_URL);

function normalizeBoneName(name) {
  return String(name || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function findHumanoidBone(root, names) {
  const wanted = new Set(names.map(normalizeBoneName));
  let found = null;

  root.traverse((object) => {
    if (found || !object.isBone) return;
    if (wanted.has(normalizeBoneName(object.name))) found = object;
  });

  return found;
}

function aimBoneAtWorldPoint(bone, child, targetPoint) {
  if (!bone || !child || !bone.parent) return false;

  bone.updateWorldMatrix(true, true);
  child.updateWorldMatrix(true, true);

  const bonePos = bone.getWorldPosition(new THREE.Vector3());
  const childPos = child.getWorldPosition(new THREE.Vector3());
  const currentDirection = childPos.sub(bonePos).normalize();
  const desiredDirection = targetPoint.clone().sub(bonePos).normalize();

  if (
    !Number.isFinite(currentDirection.x) ||
    !Number.isFinite(desiredDirection.x) ||
    currentDirection.lengthSq() < 0.5 ||
    desiredDirection.lengthSq() < 0.5
  ) {
    return false;
  }

  const worldRotation = bone.getWorldQuaternion(new THREE.Quaternion());
  const correction = new THREE.Quaternion().setFromUnitVectors(
    currentDirection,
    desiredDirection
  );
  const desiredWorldRotation = correction.multiply(worldRotation).normalize();

  const parentWorldRotation = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion
    .copy(parentWorldRotation.invert().multiply(desiredWorldRotation))
    .normalize();

  bone.updateWorldMatrix(true, true);
  return true;
}

function relaxHumanoidArms(model) {
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const height = box.max.y - box.min.y;
  const center = box.getCenter(new THREE.Vector3());

  const sides = [
    {
      upper: ['LeftArm', 'LeftUpperArm', 'mixamorigLeftArm'],
      lower: ['LeftForeArm', 'LeftLowerArm', 'mixamorigLeftForeArm'],
      hand: ['LeftHand', 'mixamorigLeftHand']
    },
    {
      upper: ['RightArm', 'RightUpperArm', 'mixamorigRightArm'],
      lower: ['RightForeArm', 'RightLowerArm', 'mixamorigRightForeArm'],
      hand: ['RightHand', 'mixamorigRightHand']
    }
  ];

  let posedSides = 0;

  for (const side of sides) {
    const upper = findHumanoidBone(model, side.upper);
    const lower = findHumanoidBone(model, side.lower);
    const hand = findHumanoidBone(model, side.hand);
    if (!upper || !lower || !hand) continue;

    const upperPos = upper.getWorldPosition(new THREE.Vector3());
    const sign = Math.sign(upperPos.x - center.x) || 1;

    // A quiet standing pose: elbows hang below the rib cage and wrists rest
    // beside the hips. This removes the stock bind/A-pose without inventing an
    // animation system for the first visual test.
    const elbowTarget = new THREE.Vector3(
      center.x + sign * height * 0.19,
      box.min.y + height * 0.60,
      center.z + height * 0.015
    );
    const wristTarget = new THREE.Vector3(
      center.x + sign * height * 0.20,
      box.min.y + height * 0.405,
      center.z + height * 0.025
    );

    const upperOk = aimBoneAtWorldPoint(upper, lower, elbowTarget);
    model.updateMatrixWorld(true);
    const lowerOk = aimBoneAtWorldPoint(lower, hand, wristTarget);
    model.updateMatrixWorld(true);

    if (upperOk && lowerOk) posedSides += 1;
  }

  return posedSides;
}

function inspectNpcModel(model) {
  const materials = new Set();
  const textures = new Set();
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let boneCount = 0;

  model.traverse((object) => {
    if (object.isBone) boneCount += 1;
    if (!object.isMesh && !object.isSkinnedMesh) return;

    meshCount += 1;
    if (object.isSkinnedMesh) skinnedMeshCount += 1;

    const list = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];

    list.forEach((material) => {
      materials.add(material);
      [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
        material.alphaMap,
        material.emissiveMap
      ].forEach((texture) => {
        if (texture) textures.add(texture);
      });
    });
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  const valid =
    meshCount >= 1 &&
    skinnedMeshCount >= 1 &&
    boneCount >= 20 &&
    materials.size >= 1 &&
    textures.size >= 1 &&
    Number.isFinite(size.x) &&
    Number.isFinite(size.y) &&
    Number.isFinite(size.z) &&
    size.y > 1.55 &&
    size.y < 1.82;

  return {
    valid,
    meshCount,
    skinnedMeshCount,
    boneCount,
    materialCount: materials.size,
    textureCount: textures.size,
    size
  };
}

function loadLivingRoomNpc() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.setCrossOrigin('anonymous');

  loader.load(
    REALISTIC_NPC_URL,
    (gltf) => {
      try {
        const npcModel = gltf.scene;
      const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

      npcModel.traverse((object) => {
        if (!object.isMesh && !object.isSkinnedMesh) return;

        object.castShadow = true;
        object.receiveShadow = true;

        const list = Array.isArray(object.material)
          ? object.material
          : object.material
            ? [object.material]
            : [];

        list.forEach((material) => {
          [
            material.map,
            material.normalMap,
            material.roughnessMap,
            material.metalnessMap,
            material.alphaMap,
            material.emissiveMap
          ].forEach((texture) => {
            if (texture) texture.anisotropy = maxAnisotropy;
          });

          material.needsUpdate = true;
        });
      });

      // First normalize only the overall height. Do not reshape the body.
      npcModel.updateMatrixWorld(true);
      const originalBox = new THREE.Box3().setFromObject(npcModel);
      const originalHeight = originalBox.max.y - originalBox.min.y;

      if (!Number.isFinite(originalHeight) || originalHeight < 0.25) {
        throw new Error('NPC model has an invalid bounding box.');
      }

      npcModel.scale.setScalar(1.70 / originalHeight);
      npcModel.updateMatrixWorld(true);

      // Centre the authored avatar around its own feet before posing it.
      let scaledBox = new THREE.Box3().setFromObject(npcModel);
      let center = scaledBox.getCenter(new THREE.Vector3());
      npcModel.position.x -= center.x;
      npcModel.position.z -= center.z;
      npcModel.position.y -= scaledBox.min.y;
      npcModel.updateMatrixWorld(true);

      // The source avatar is a standard rigged humanoid. For this first test we
      // need a believable *standing* person, not its stock bind pose.
      const posedSides = relaxHumanoidArms(npcModel);

      // Re-ground after the arm pose because the full bounding box changed.
      scaledBox = new THREE.Box3().setFromObject(npcModel);
      center = scaledBox.getCenter(new THREE.Vector3());
      npcModel.position.x -= center.x;
      npcModel.position.z -= center.z;
      npcModel.position.y -= scaledBox.min.y;
      npcModel.updateMatrixWorld(true);

      const qa = inspectNpcModel(npcModel);
      if (!qa.valid || posedSides !== 2) {
        const details = {
          meshCount: qa.meshCount,
          skinnedMeshCount: qa.skinnedMeshCount,
          boneCount: qa.boneCount,
          materialCount: qa.materialCount,
          textureCount: qa.textureCount,
          height: Number(qa.size.y.toFixed(3)),
          width: Number(qa.size.x.toFixed(3)),
          depth: Number(qa.size.z.toFixed(3)),
          posedSides
        };
        const failed = [];
        if (qa.meshCount < 1) failed.push('mesh');
        if (qa.skinnedMeshCount < 1) failed.push('skinned');
        if (qa.boneCount < 20) failed.push('bones');
        if (qa.materialCount < 1) failed.push('material');
        if (qa.textureCount < 1) failed.push('texture');
        if (!(qa.size.y > 1.55 && qa.size.y < 1.82)) failed.push('height');
        if (posedSides !== 2) failed.push('arm-pose');

        const error = new Error('NPC validation failed: ' + failed.join(','));
        error.qaDetails = details;
        throw error;
      }

      const npcRoot = new THREE.Group();
      npcRoot.name = 'living-room-realistic-npc-v05';
      npcRoot.position.set(-1.65, 0.61, 2.05);
      npcRoot.rotation.y = THREE.MathUtils.degToRad(145);
      npcRoot.add(npcModel);
      house.add(npcRoot);

      // Leave the first version deliberately static. The point of v0.5 is to
      // judge the finished character model itself before adding behaviour.
      status.textContent = '写实 NPC 已加载 · 模型验收通过 · 门可交互';

      window.__HOUSE_LAB_NPC_QA__ = {
        ok: true,
        model: 'three.ws realistic-female',
        meshCount: qa.meshCount,
        skinnedMeshCount: qa.skinnedMeshCount,
        boneCount: qa.boneCount,
        materialCount: qa.materialCount,
        textureCount: qa.textureCount,
        height: Number(qa.size.y.toFixed(3)),
        width: Number(qa.size.x.toFixed(3)),
        depth: Number(qa.size.z.toFixed(3)),
        relaxedArms: posedSides === 2
      };
      } catch (error) {
        console.error('Realistic NPC runtime validation failed:', error);
        const qaDetails = error?.qaDetails || null;
        window.__HOUSE_LAB_NPC_QA__ = {
          ok: false,
          stage: 'runtime-validation',
          error: String(error?.message || error),
          details: qaDetails
        };

        const shortReason = String(error?.message || error)
          .replace('NPC validation failed: ', '')
          .slice(0, 60);

        status.textContent = '写实 NPC 验收失败 · ' + shortReason;
      }
    },
    (event) => {
      if (!event.total) {
        status.textContent = '写实 NPC 下载中 · 屋顶显示';
        return;
      }
      const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
      status.textContent = '写实 NPC 下载中 ' + pct + '% · 屋顶显示';
    },
    (error) => {
      console.error('Finished realistic living-room NPC failed to load:', error);
      const message = String(error?.message || error || 'unknown error');
      window.__HOUSE_LAB_NPC_QA__ = {
        ok: false,
        stage: 'network-or-parse',
        error: message,
        source: REALISTIC_NPC_SOURCE_URL,
        viaProxy: REALISTIC_NPC_URL
      };
      status.textContent = '写实 NPC 加载失败 · ' + message.slice(0, 42);
    }
  );
}

loadLivingRoomNpc();

function box(parent, width, height, depth, mat, x, y, z, rotationY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, segments, mat, x, y, z, rotationX = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    mat
  );
  mesh.position.set(x, y, z);
  mesh.rotation.x = rotationX;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function wall(x1, z1, x2, z2, height = 3.15, thickness = 0.18) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const angle = -Math.atan2(dz, dx);
  return box(
    house,
    length,
    height,
    thickness,
    mats.wall,
    (x1 + x2) / 2,
    0.55 + height / 2,
    (z1 + z2) / 2,
    angle
  );
}

function floorPatch(width, depth, mat, x, z) {
  return box(house, width, 0.055, depth, mat, x, 0.585, z);
}

function addWindowOnZ(x, z, width = 2.6) {
  box(house, width + 0.16, 1.65, 0.07, mats.trim, x, 1.9, z);
  const pane = box(house, width, 1.48, 0.08, glassMaterial, x, 1.9, z + (z > 0 ? 0.045 : -0.045));
  box(house, 0.055, 1.48, 0.1, mats.roofEdge, x, 1.9, z);
  box(house, width, 0.05, 0.1, mats.roofEdge, x, 1.9, z);
  pane.castShadow = false;
}

function addWindowOnX(x, z, width = 2.4) {
  box(house, 0.07, 1.65, width + 0.16, mats.trim, x, 1.9, z);
  const pane = box(house, 0.08, 1.48, width, glassMaterial, x + (x > 0 ? 0.045 : -0.045), 1.9, z);
  box(house, 0.1, 1.48, 0.055, mats.roofEdge, x, 1.9, z);
  box(house, 0.1, 0.05, width, mats.roofEdge, x, 1.9, z);
  pane.castShadow = false;
}

// Site slab and simple urban pad.
box(house, 31, 0.28, 23, mats.ground, 0, -0.14, 0);
box(house, 19.2, 0.58, 13.2, mats.slab, 0, 0.27, 0);
box(house, 18, 0.08, 1.7, material('#8f8c85', 0.92), 0, 0.06, 7.2);

// Room floors.
floorPatch(8.95, 9.65, mats.woodFloor, -3.35, 0);
floorPatch(6.55, 3.85, mats.kitchenFloor, 4.58, 2.9);
floorPatch(6.55, 5.42, material('#a97c58', 0.8), 4.58, -2.15);
floorPatch(2.08, 2.55, mats.bathFloor, 6.76, -3.55);

// Outer shell, with front-door opening.
wall(-8, -5, 8, -5);
wall(-8, 5, -5.35, 5);
wall(-3.9, 5, 8, 5);
wall(-8, -5, -8, 5);
wall(8, -5, 8, 5);

// Living / bedroom / kitchen boundary.
wall(1.2, -5, 1.2, -1.62);
wall(1.2, -0.18, 1.2, 1.46);
wall(1.2, 4.14, 1.2, 5);

// Ensuite bathroom enclosure inside bedroom.
wall(5.62, -5, 5.62, -3.92);
wall(5.62, -2.68, 5.62, -2.28);
wall(5.62, -2.28, 8, -2.28);

// Exterior window accents.
addWindowOnZ(-0.2, 5.095, 3.15);
addWindowOnZ(4.6, 5.095, 2.65);
addWindowOnZ(-3.9, -5.095, 3.0);
addWindowOnX(-8.095, 0.4, 2.7);
addWindowOnX(8.095, 2.5, 2.2);
addWindowOnX(8.095, -1.1, 1.8);

const doorControllers = new Map();
const doorHitTargets = [];

function tagDoor(mesh, id) {
  mesh.userData.doorId = id;
  doorHitTargets.push(mesh);
}

function createSwingDoor({ id, x, z, width, orientation, openAngle, color }) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, z);
  house.add(pivot);

  const doorMat = material(color, 0.78);
  let panel;

  if (orientation === 'x') {
    panel = box(pivot, width, 2.38, 0.085, doorMat, width / 2, 1.74, 0);
    const handle = cylinder(pivot, 0.055, 0.055, 0.12, 18, mats.metal, width - 0.16, 1.72, -0.08, Math.PI / 2);
    tagDoor(handle, id);
  } else {
    panel = box(pivot, 0.085, 2.38, width, doorMat, 0, 1.74, width / 2);
    const handle = cylinder(pivot, 0.055, 0.055, 0.12, 18, mats.metal, -0.08, 1.72, width - 0.16, Math.PI / 2);
    tagDoor(handle, id);
  }

  tagDoor(panel, id);

  const controller = {
    id,
    open: false,
    setOpen(value) { this.open = value; },
    update() {
      const target = this.open ? openAngle : 0;
      pivot.rotation.y += (target - pivot.rotation.y) * 0.16;
    }
  };

  doorControllers.set(id, controller);
  return controller;
}

createSwingDoor({
  id: 'entry',
  x: -5.35,
  z: 5,
  width: 1.45,
  orientation: 'x',
  openAngle: Math.PI * 0.5,
  color: '#6c4b36'
});

createSwingDoor({
  id: 'bedroom',
  x: 1.2,
  z: -1.62,
  width: 1.44,
  orientation: 'z',
  openAngle: Math.PI * 0.5,
  color: '#76543e'
});

createSwingDoor({
  id: 'bathroom',
  x: 5.62,
  z: -3.92,
  width: 1.24,
  orientation: 'z',
  openAngle: Math.PI * 0.5,
  color: '#80604a'
});

function createSlidingGlassDoor() {
  const group = new THREE.Group();
  group.position.set(1.2, 0, 2.8);
  house.add(group);

  box(group, 0.11, 0.07, 2.82, mats.metal, 0, 2.98, 0);
  box(group, 0.11, 0.07, 2.82, mats.metal, 0, 0.62, 0);

  const left = new THREE.Group();
  const right = new THREE.Group();
  group.add(left, right);

  function makePanel(panel, id) {
    const glass = box(panel, 0.055, 2.26, 1.27, glassMaterial, 0, 1.79, 0);
    glass.castShadow = false;
    tagDoor(glass, id);
    box(panel, 0.075, 2.26, 0.05, mats.metal, 0, 1.79, -0.61);
    box(panel, 0.075, 2.26, 0.05, mats.metal, 0, 1.79, 0.61);
    box(panel, 0.075, 0.05, 1.27, mats.metal, 0, 0.68, 0);
    box(panel, 0.075, 0.05, 1.27, mats.metal, 0, 2.9, 0);
  }

  makePanel(left, 'kitchen');
  makePanel(right, 'kitchen');

  left.position.z = -0.655;
  right.position.z = 0.655;

  const controller = {
    id: 'kitchen',
    open: false,
    setOpen(value) { this.open = value; },
    update() {
      const leftTarget = this.open ? -1.45 : -0.655;
      const rightTarget = this.open ? 1.45 : 0.655;
      left.position.z += (leftTarget - left.position.z) * 0.17;
      right.position.z += (rightTarget - right.position.z) * 0.17;
    }
  };

  doorControllers.set('kitchen', controller);
}

createSlidingGlassDoor();

// Living room: sofa, rug, coffee table, TV and one plant.
box(house, 4.5, 0.035, 3.0, material('#d7d0c5', 0.98), -3.0, 0.625, 0.8);
box(house, 3.5, 0.55, 1.05, mats.sofa, -4.15, 0.93, 1.25);
box(house, 3.5, 0.82, 0.22, mats.fabricDark, -4.15, 1.45, 1.72);
box(house, 0.24, 0.72, 1.05, mats.fabricDark, -5.88, 1.25, 1.25);
box(house, 0.24, 0.72, 1.05, mats.fabricDark, -2.42, 1.25, 1.25);
box(house, 1.9, 0.13, 0.9, mats.lightWood, -3.55, 1.02, -0.25);
box(house, 1.5, 0.52, 0.48, mats.darkWood, 0.1, 0.89, -0.3);
box(house, 1.65, 0.95, 0.08, mats.black, 0.1, 1.62, -0.35);
cylinder(house, 0.35, 0.27, 0.45, 24, mats.terracotta, -6.55, 0.86, -3.25);
cylinder(house, 0.5, 0.25, 1.2, 18, mats.green, -6.55, 1.63, -3.25);

// Bedroom: bed, nightstands and wardrobe.
box(house, 3.25, 0.36, 4.0, mats.darkWood, 3.28, 0.82, -2.55);
box(house, 3.05, 0.34, 3.78, mats.fabricLight, 3.28, 1.1, -2.48);
box(house, 3.05, 0.48, 0.16, mats.fabricDark, 3.28, 1.66, -4.32);
box(house, 1.22, 0.18, 0.55, mats.white, 2.55, 1.34, -3.85);
box(house, 1.22, 0.18, 0.55, mats.white, 4.0, 1.34, -3.85);
box(house, 0.62, 0.48, 0.62, mats.lightWood, 1.52, 0.87, -3.62);
box(house, 0.62, 0.48, 0.62, mats.lightWood, 5.0, 0.87, -3.62);
box(house, 1.85, 2.15, 0.62, mats.cabinet, 6.65, 1.64, -1.1);

// Kitchen: cabinets, worktop, fridge and island.
box(house, 0.66, 0.86, 4.55, mats.cabinet, 7.25, 1.02, 2.58);
box(house, 0.78, 0.12, 4.7, mats.counter, 7.16, 1.5, 2.58);
box(house, 1.08, 2.25, 0.86, material('#c5c7c5', 0.55, 0.1), 6.83, 1.7, 4.2);
box(house, 2.5, 0.9, 1.05, mats.cabinet, 4.08, 1.02, 2.78);
box(house, 2.62, 0.12, 1.15, mats.counter, 4.08, 1.54, 2.78);
const sink = box(house, 0.74, 0.06, 0.5, mats.black, 6.98, 1.59, 2.3);
sink.castShadow = false;
for (let i = 0; i < 4; i++) {
  cylinder(house, 0.13, 0.13, 0.025, 20, mats.black, 4.55 + (i % 2) * 0.5, 1.61, 2.55 + Math.floor(i / 2) * 0.42);
}

// Bathroom: toilet, vanity, mirror and shower.
cylinder(house, 0.38, 0.42, 0.36, 28, mats.white, 7.16, 0.86, -4.0);
box(house, 0.62, 0.82, 0.24, mats.white, 7.16, 1.2, -4.45);
box(house, 0.9, 0.68, 0.52, mats.cabinet, 6.25, 0.95, -2.72);
box(house, 0.96, 0.1, 0.58, mats.white, 6.25, 1.34, -2.72);
box(house, 0.75, 0.9, 0.05, mirrorMaterial, 6.25, 1.95, -2.985);
box(house, 1.02, 0.08, 1.0, mats.white, 7.28, 0.66, -3.0);
const showerGlass = box(house, 0.05, 1.9, 1.0, glassMaterial, 6.78, 1.57, -3.0);
showerGlass.castShadow = false;

const ceilingFixtures = new THREE.Group();
house.add(ceilingFixtures);

function ceilingLight(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.035, 24),
    material('#f8f0d8', 0.5)
  );
  mesh.position.set(x, 2.98, z);
  mesh.rotation.x = Math.PI / 2;
  ceilingFixtures.add(mesh);
}
ceilingLight(-3.0, 0.2);
ceilingLight(4.4, 2.5);
ceilingLight(3.6, -2.2);
ceilingLight(6.7, -3.55);

const roofGroup = new THREE.Group();
house.add(roofGroup);

function createRoofGeometry() {
  const yEave = 3.24;
  const yRidge = 3.86;
  const xEave = 8.65;
  const zEave = 5.62;
  const xRidge = 5.45;
  const zRidge = 0.78;

  const v = [
    // Front slope
    -xEave, yEave, zEave,
     xEave, yEave, zEave,
     xRidge, yRidge, zRidge,
    -xEave, yEave, zEave,
     xRidge, yRidge, zRidge,
    -xRidge, yRidge, zRidge,

    // Back slope
     xEave, yEave, -zEave,
    -xEave, yEave, -zEave,
    -xRidge, yRidge, -zRidge,
     xEave, yEave, -zEave,
    -xRidge, yRidge, -zRidge,
     xRidge, yRidge, -zRidge,

    // Left hip
    -xEave, yEave, -zEave,
    -xEave, yEave, zEave,
    -xRidge, yRidge, zRidge,
    -xEave, yEave, -zEave,
    -xRidge, yRidge, zRidge,
    -xRidge, yRidge, -zRidge,

    // Right hip
     xEave, yEave, zEave,
     xEave, yEave, -zEave,
     xRidge, yRidge, -zRidge,
     xEave, yEave, zEave,
     xRidge, yRidge, -zRidge,
     xRidge, yRidge, zRidge,

    // Ridge cap
    -xRidge, yRidge, -zRidge,
    -xRidge, yRidge, zRidge,
     xRidge, yRidge, zRidge,
    -xRidge, yRidge, -zRidge,
     xRidge, yRidge, zRidge,
     xRidge, yRidge, -zRidge
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const roof = new THREE.Mesh(createRoofGeometry(), mats.roof);
roof.castShadow = true;
roof.receiveShadow = true;
roofGroup.add(roof);

// A simple interior ceiling keeps first-person visits feeling enclosed while
// the exterior roof remains physically present. It disappears with the roof
// only when the user explicitly hides the roof.
box(roofGroup, 15.65, 0.07, 9.7, material('#ece9e1', 0.96), 0, 3.1, 0);

box(roofGroup, 17.45, 0.16, 0.18, mats.roofEdge, 0, 3.2, 5.63);
box(roofGroup, 17.45, 0.16, 0.18, mats.roofEdge, 0, 3.2, -5.63);
box(roofGroup, 0.18, 0.16, 11.25, mats.roofEdge, 8.66, 3.2, 0);
box(roofGroup, 0.18, 0.16, 11.25, mats.roofEdge, -8.66, 3.2, 0);

let roofMode = 'auto';
let lastRoofVisible = true;

function refreshRoofButton() {
  if (firstPerson && roofMode === 'auto') {
    roofButton.textContent = '屋顶：显示';
    return;
  }

  roofButton.textContent =
    roofMode === 'auto' ? '屋顶：自动' :
    roofMode === 'show' ? '屋顶：显示' :
    '屋顶：隐藏';
}

function updateRoofVisibility() {
  const distance = camera.position.distanceTo(controls.target);
  let visible;

  if (firstPerson) {
    // First-person visits keep the physical roof in place. It only disappears
    // after the user explicitly presses the roof button.
    visible = roofMode !== 'hide';
  } else if (roofMode === 'show') {
    visible = true;
  } else if (roofMode === 'hide') {
    visible = false;
  } else {
    visible = distance >= 19;
  }

  roofGroup.visible = visible;
  ceilingFixtures.visible = visible;

  if (visible !== lastRoofVisible) {
    lastRoofVisible = visible;
    status.textContent =
      (firstPerson ? '第一视角 · ' : '') +
      (visible ? '屋顶显示' : '屋顶隐藏') +
      ' · 门可交互';
  }
}

function setOverview() {
  if (firstPerson) exitFirstPerson(false);
  camera.position.set(18.5, 16.5, 19.5);
  controls.target.set(0, 1.05, 0);
  controls.update();
  updateRoofVisibility();
}

setOverview();

function toggleDoor(id) {
  const controller = doorControllers.get(id);
  if (!controller) return;
  controller.setOpen(!controller.open);
}

function setAllDoors(open) {
  doorControllers.forEach((controller) => controller.setOpen(open));
  doorsButton.textContent = open ? '全部关门' : '全部开门';
}

let allDoorsOpen = false;

doorsButton.addEventListener('click', () => {
  allDoorsOpen = !allDoorsOpen;
  setAllDoors(allDoorsOpen);
});

app.querySelector('[data-action="reset-view"]').addEventListener('click', setOverview);

roofButton.addEventListener('click', () => {
  if (firstPerson) {
    roofMode = roofMode === 'hide' ? 'show' : 'hide';
  } else {
    if (roofMode === 'auto') roofMode = 'show';
    else if (roofMode === 'show') roofMode = 'hide';
    else roofMode = 'auto';
  }

  refreshRoofButton();
  updateRoofVisibility();
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

const staticCollisionRects = [
  // Exterior walls.
  { minX: -8.25, maxX: 8.25, minZ: -5.18, maxZ: -4.82 },
  { minX: -8.25, maxX: -5.35, minZ: 4.82, maxZ: 5.18 },
  { minX: -3.9, maxX: 8.25, minZ: 4.82, maxZ: 5.18 },
  { minX: -8.18, maxX: -7.82, minZ: -5.2, maxZ: 5.2 },
  { minX: 7.82, maxX: 8.18, minZ: -5.2, maxZ: 5.2 },

  // Interior walls.
  { minX: 1.02, maxX: 1.38, minZ: -5.0, maxZ: -1.62 },
  { minX: 1.02, maxX: 1.38, minZ: -0.18, maxZ: 1.46 },
  { minX: 1.02, maxX: 1.38, minZ: 4.14, maxZ: 5.0 },
  { minX: 5.44, maxX: 5.8, minZ: -5.0, maxZ: -3.92 },
  { minX: 5.44, maxX: 5.8, minZ: -2.68, maxZ: -2.28 },
  { minX: 5.62, maxX: 8.0, minZ: -2.46, maxZ: -2.1 },

  // Large furniture that should not be walked through.
  { minX: -6.05, maxX: -2.25, minZ: 0.55, maxZ: 1.9 },
  { minX: -4.65, maxX: -2.45, minZ: -0.8, maxZ: 0.3 },
  { minX: -0.85, maxX: 0.9, minZ: -0.7, maxZ: 0.2 },
  { minX: 1.45, maxX: 5.1, minZ: -4.65, maxZ: -0.35 },
  { minX: 5.65, maxX: 7.65, minZ: -1.5, maxZ: -0.65 },
  { minX: 6.65, maxX: 7.75, minZ: 0.1, maxZ: 4.9 },
  { minX: 2.7, maxX: 5.45, minZ: 2.1, maxZ: 3.45 },
  { minX: 5.75, maxX: 6.78, minZ: -3.2, maxZ: -2.4 },
  { minX: 6.55, maxX: 7.75, minZ: -4.65, maxZ: -3.45 }
];

function pointBlocked(x, z) {
  const pad = fpPlayerRadius;
  for (const rect of staticCollisionRects) {
    if (
      x > rect.minX - pad &&
      x < rect.maxX + pad &&
      z > rect.minZ - pad &&
      z < rect.maxZ + pad
    ) {
      return true;
    }
  }

  // Closed doors block their own openings. Once opened, the openings become walkable.
  if (!doorControllers.get('entry')?.open) {
    if (x > -5.55 && x < -3.7 && z > 4.78 && z < 5.22) return true;
  }
  if (!doorControllers.get('bedroom')?.open) {
    if (x > 0.98 && x < 1.42 && z > -1.72 && z < -0.05) return true;
  }
  if (!doorControllers.get('kitchen')?.open) {
    if (x > 0.98 && x < 1.42 && z > 1.3 && z < 4.3) return true;
  }
  if (!doorControllers.get('bathroom')?.open) {
    if (x > 5.4 && x < 5.84 && z > -4.02 && z < -2.56) return true;
  }

  return false;
}

function movePlayer(dx, dz) {
  const nextX = THREE.MathUtils.clamp(playerPosition.x + dx, -14.5, 14.5);
  const nextZ = THREE.MathUtils.clamp(playerPosition.z + dz, -10.5, 10.5);

  if (!pointBlocked(nextX, playerPosition.z)) playerPosition.x = nextX;
  if (!pointBlocked(playerPosition.x, nextZ)) playerPosition.z = nextZ;

  avatar.position.copy(playerPosition);
}

function syncFirstPersonCamera() {
  camera.position.set(playerPosition.x, playerPosition.y + fpEyeHeight, playerPosition.z);
  camera.quaternion.setFromEuler(new THREE.Euler(fpPitch, fpYaw, 0, 'YXZ'));
}

function enterFirstPerson() {
  if (firstPerson) return;
  firstPerson = true;
  controls.enabled = false;
  avatar.visible = false;
  app.classList.add('first-person');
  firstPersonButton.textContent = '退出第一视角';
  status.textContent = '第一视角 · 屋顶显示 · 门可交互';
  refreshRoofButton();
  syncFirstPersonCamera();
  updateRoofVisibility();
}

function exitFirstPerson(resetCamera = true) {
  if (!firstPerson) return;
  firstPerson = false;
  controls.enabled = true;
  avatar.visible = true;
  app.classList.remove('first-person');
  firstPersonButton.textContent = '第一视角';
  fpKeys.clear();
  fpTouchMove.clear();
  fpLookPointer = null;
  refreshRoofButton();

  if (resetCamera) {
    camera.position.set(18.5, 16.5, 19.5);
    controls.target.set(0, 1.05, 0);
    controls.update();
  }

  updateRoofVisibility();
}

function interactFromFirstPerson() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(doorHitTargets, false);
  const hit = hits.find((item) => item.distance <= 4.0);

  if (hit?.object?.userData?.doorId) {
    toggleDoor(hit.object.userData.doorId);
    return;
  }

  let bestId = null;
  let bestDistance = Infinity;
  for (const target of doorHitTargets) {
    const p = new THREE.Vector3();
    target.getWorldPosition(p);
    const d = p.distanceTo(camera.position);
    if (d < bestDistance && d <= 3.8) {
      bestDistance = d;
      bestId = target.userData.doorId;
    }
  }

  if (bestId) toggleDoor(bestId);
}

function updateFirstPerson(delta) {
  if (!firstPerson) return;

  const forward = Number(fpKeys.has('KeyW') || fpKeys.has('ArrowUp') || fpTouchMove.has('forward')) -
    Number(fpKeys.has('KeyS') || fpKeys.has('ArrowDown') || fpTouchMove.has('back'));
  const strafe = Number(fpKeys.has('KeyD') || fpKeys.has('ArrowRight') || fpTouchMove.has('right')) -
    Number(fpKeys.has('KeyA') || fpKeys.has('ArrowLeft') || fpTouchMove.has('left'));

  if (forward !== 0 || strafe !== 0) {
    const length = Math.hypot(forward, strafe) || 1;
    const f = forward / length;
    const s = strafe / length;
    const speed = fpMoveSpeed * Math.min(delta, 0.04);

    const forwardX = -Math.sin(fpYaw);
    const forwardZ = -Math.cos(fpYaw);
    const rightX = Math.cos(fpYaw);
    const rightZ = -Math.sin(fpYaw);

    movePlayer(
      (forwardX * f + rightX * s) * speed,
      (forwardZ * f + rightZ * s) * speed
    );
  }

  avatar.rotation.y = fpYaw;
  syncFirstPersonCamera();
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (firstPerson) {
    fpLookPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture?.(event.pointerId);
    return;
  }
  pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!firstPerson || !fpLookPointer || fpLookPointer.id !== event.pointerId) return;

  const dx = event.clientX - fpLookPointer.x;
  const dy = event.clientY - fpLookPointer.y;
  fpLookPointer.x = event.clientX;
  fpLookPointer.y = event.clientY;

  fpYaw -= dx * 0.0042;
  fpPitch -= dy * 0.0035;
  fpPitch = THREE.MathUtils.clamp(fpPitch, -1.18, 1.05);
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (firstPerson) {
    if (fpLookPointer?.id === event.pointerId) fpLookPointer = null;
    return;
  }

  if (!pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 7) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(doorHitTargets, false);
  if (!hits.length) return;

  const id = hits[0].object.userData.doorId;
  if (id) toggleDoor(id);
});

renderer.domElement.addEventListener('pointercancel', () => {
  fpLookPointer = null;
  pointerDown = null;
});

window.addEventListener('keydown', (event) => {
  if (!firstPerson) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
    fpKeys.add(event.code);
  }
  if (event.code === 'KeyE') interactFromFirstPerson();
  if (event.code === 'Escape') exitFirstPerson();
});

window.addEventListener('keyup', (event) => {
  fpKeys.delete(event.code);
});

for (const button of moveButtons) {
  const direction = button.dataset.move;

  const press = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fpTouchMove.add(direction);
  };

  const release = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fpTouchMove.delete(direction);
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

app.querySelector('[data-fp-action="interact"]').addEventListener('click', interactFromFirstPerson);

firstPersonButton.addEventListener('click', () => {
  if (firstPerson) exitFirstPerson();
  else enterFirstPerson();
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  npcMixers.forEach((mixer) => mixer.update(delta));

  if (firstPerson) updateFirstPerson(delta);
  else controls.update();

  doorControllers.forEach((controller) => controller.update());
  updateRoofVisibility();
  renderer.render(scene, camera);
});
