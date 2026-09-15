import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { BlockWorld } from './world/worldData.js';
import { buildTerrainMesh } from './world/terrainMesh.js';
import { downloadWorld, parseWorld } from './world/worldIO.js';

const app = document.querySelector('#app');
app.innerHTML = [
  '<div class="viewport" data-role="viewport"></div>',
  '<section class="panel panel-left">',
  '<strong>Town Voxel World v0.1</strong>',
  '<span>海岛基底重构 · 五视图参考 · 真实体素 · 无建筑</span>',
  '<span data-role="status"></span>',
  '</section>',
  '<section class="toolbar" aria-label="terrain editor">',
  '<div class="tool-group">',
  '<button data-tool="raise" class="active">抬高</button>',
  '<button data-tool="lower">降低</button>',
  '<button data-tool="paint">材质</button>',
  '</div>',
  '<div class="tool-group">',
  '<button data-surface="grass" class="active">草</button>',
  '<button data-surface="sand">沙</button>',
  '<button data-surface="rock">岩</button>',
  '</div>',
  '<div class="tool-group">',
  '<button data-action="reference-view">海湾视角</button>',
  '<button data-action="top-view">俯视</button>',
  '<button data-action="rear-view">背面视角</button>',
  '<button data-action="undo">撤销</button>',
  '<button data-action="redo">重做</button>',
  '</div>',
  '<div class="tool-group">',
  '<button data-action="export">导出 JSON</button>',
  '<button data-action="import">导入 JSON</button>',
  '<button data-action="reset" class="danger">重置基底</button>',
  '</div>',
  '</section>',
  '<input type="file" accept="application/json,.json" data-role="file" hidden />',
  '<a class="page-switch" href="./house-lab/">房屋实验场</a>',
  '<div class="hint">左键单击地形进行编辑 · 右键/拖动旋转 · 滚轮缩放</div>'
].join('');

const viewport = app.querySelector('[data-role="viewport"]');
const status = app.querySelector('[data-role="status"]');
const fileInput = app.querySelector('[data-role="file"]');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#bdeaf4');
scene.fog = new THREE.Fog('#bdeaf4', 420, 980);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = true;
controls.zoomToCursor = true;
controls.minDistance = 35;
controls.maxDistance = 900;
controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

scene.add(new THREE.HemisphereLight(0xffffff, 0x6e8491, 2.1));
const sun = new THREE.DirectionalLight(0xfff0d3, 2.7);
sun.position.set(-90, 155, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -130;
sun.shadow.camera.right = 130;
sun.shadow.camera.top = 130;
sun.shadow.camera.bottom = -130;
scene.add(sun);

let world = BlockWorld.fromReference();
let terrainMesh = null;
let ocean = null;
let tool = 'raise';
let surface = 'grass';
let viewMode = 'reference';
let lastPortrait = window.innerWidth < window.innerHeight;
const undoStack = [];
const redoStack = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

function rebuildOcean() {
  if (ocean) {
    scene.remove(ocean);
    ocean.geometry.dispose();
    ocean.material.dispose();
  }

  const geometry = new THREE.PlaneGeometry(520, 520);
  const material = new THREE.MeshStandardMaterial({
    color: '#39abc9',
    roughness: 0.68,
    metalness: 0,
    transparent: true,
    opacity: 0.86
  });

  ocean = new THREE.Mesh(geometry, material);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = world.waterLevel;
  ocean.receiveShadow = true;
  scene.add(ocean);
}

function rebuildTerrain() {
  if (terrainMesh) {
    scene.remove(terrainMesh);
    terrainMesh.geometry.dispose();
    terrainMesh.material.dispose();
  }
  terrainMesh = buildTerrainMesh(world);
  scene.add(terrainMesh);
  updateStatus();
}

function updateStatus(extra) {
  const suffix = extra ? ' · ' + extra : '';
  status.textContent =
    world.width + '×' + world.depth +
    ' · ' + world.blocks.size.toLocaleString() + ' 实体方块' +
    ' · ' + world.columns.size.toLocaleString() + ' 地表格' +
    ' · ' + tool + '/' + surface + suffix;
}

function fitDistanceForWorld() {
  // Fit a conservative sphere around the whole island using the smaller of
  // vertical/horizontal FOV. This makes portrait phones frame the complete map.
  const radius = Math.hypot(world.width, world.depth) * 0.5 + 18;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const limitingFov = Math.max(THREE.MathUtils.degToRad(18), Math.min(vFov, hFov));
  return radius / Math.sin(limitingFov / 2) * 1.18;
}

function applyView(mode) {
  viewMode = mode;
  camera.fov = 52;
  camera.updateProjectionMatrix();

  const distance = fitDistanceForWorld();
  controls.target.set(0, 3, 0);

  let direction;
  if (mode === 'top') {
    direction = new THREE.Vector3(0, 1, 0.001);
  } else if (mode === 'rear') {
    direction = new THREE.Vector3(0.02, 0.82, -0.57);
  } else {
    direction = new THREE.Vector3(-0.02, 0.82, 0.57);
  }

  direction.normalize();
  camera.position.copy(controls.target).addScaledVector(direction, distance);
  controls.update();
}

function setReferenceView() {
  applyView('reference');
}

function setTopView() {
  applyView('top');
}

function setRearView() {
  applyView('rear');
}

function gridFromHit(hit) {
  const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
  const p = hit.point.clone().addScaledVector(normal, -0.015);
  return {
    x: Math.floor(p.x + world.width / 2),
    z: Math.floor(p.z + world.depth / 2)
  };
}

function applyEdit(x, z) {
  if (!world.inBounds(x, z)) return;
  const before = world.cloneColumn(x, z);
  const current = before || { x, z, height: world.minY - 1, surface };

  if (tool === 'raise') world.set(x, z, current.height + 1, current.surface || surface);
  else if (tool === 'lower') world.set(x, z, current.height - 1, current.surface || surface);
  else if (tool === 'paint' && before) world.set(x, z, current.height, surface);

  const after = world.cloneColumn(x, z);
  if (JSON.stringify(before) === JSON.stringify(after)) return;

  undoStack.push({ x, z, before, after });
  if (undoStack.length > 200) undoStack.shift();
  redoStack.length = 0;
  rebuildTerrain();
}

function doUndo() {
  const cmd = undoStack.pop();
  if (!cmd) return;
  world.restoreColumn(cmd.x, cmd.z, cmd.before);
  redoStack.push(cmd);
  rebuildTerrain();
}

function doRedo() {
  const cmd = redoStack.pop();
  if (!cmd) return;
  world.restoreColumn(cmd.x, cmd.z, cmd.after);
  undoStack.push(cmd);
  rebuildTerrain();
}

function updateButtonStates() {
  app.querySelectorAll('[data-tool]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  app.querySelectorAll('[data-surface]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.surface === surface);
  });
  updateStatus();
}

renderer.domElement.addEventListener('pointerdown', function (event) {
  if (event.button !== 0) return;
  pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', function (event) {
  if (event.button !== 0 || !pointerDown || !terrainMesh) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(terrainMesh, false)[0];
  if (!hit) return;

  const cell = gridFromHit(hit);
  applyEdit(cell.x, cell.z);
});

renderer.domElement.addEventListener('contextmenu', function (event) {
  event.preventDefault();
});

app.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.tool) {
    tool = button.dataset.tool;
    updateButtonStates();
    return;
  }

  if (button.dataset.surface) {
    surface = button.dataset.surface;
    updateButtonStates();
    return;
  }

  switch (button.dataset.action) {
    case 'undo': doUndo(); break;
    case 'redo': doRedo(); break;
    case 'reference-view': setReferenceView(); break;
    case 'top-view': setTopView(); break;
    case 'rear-view': setRearView(); break;
    case 'export': downloadWorld(world); updateStatus('JSON 已导出'); break;
    case 'import': fileInput.click(); break;
    case 'reset':
      if (window.confirm('重置为五视图重构后的 v0.1 真实体素海岛？当前未导出的修改会丢失。')) {
        world = BlockWorld.fromReference();
        undoStack.length = 0;
        redoStack.length = 0;
        rebuildOcean();
        rebuildTerrain();
        setReferenceView();
      }
      break;
  }
});

fileInput.addEventListener('change', async function () {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    world = parseWorld(await file.text());
    undoStack.length = 0;
    redoStack.length = 0;
    rebuildOcean();
    rebuildTerrain();
    setReferenceView();
    updateStatus('JSON 已载入');
  } catch (error) {
    window.alert('导入失败：' + error.message);
  } finally {
    fileInput.value = '';
  }
});

window.addEventListener('keydown', function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? doRedo() : doUndo();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    doRedo();
  }
});

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const portrait = window.innerWidth < window.innerHeight;
  if (portrait !== lastPortrait) {
    lastPortrait = portrait;
    applyView(viewMode);
  }
});

rebuildOcean();
rebuildTerrain();
setReferenceView();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
