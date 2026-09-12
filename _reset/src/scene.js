export function createVoxelIslandV1(THREE, OrbitControls, app) {
  app.innerHTML = '';

  const STORAGE_KEY = 'town-voxel-island-editor-v1';
  const CELL = 3.0;
  const LEVEL_H = 2.4;
  const MAX_INSTANCES = 60000;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8f2);
  scene.fog = new THREE.Fog(0xbfe8f2, 260, 950);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.style.touchAction = 'none';
  app.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    36,
    window.innerWidth / window.innerHeight,
    0.1,
    4000
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89);
  controls.minDistance = 24;
  controls.maxDistance = 430;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

  scene.add(new THREE.HemisphereLight(0xfffdf7, 0x63717c, 2.15));

  const sun = new THREE.DirectionalLight(0xffefd8, 3.1);
  sun.position.set(-100, 145, -80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180;
  sun.shadow.camera.bottom = -180;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 460;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const COLORS = {
    ocean: 0x48b9dd,
    oceanDeep: 0x2f9dc7,
    grass: 0x94c978,
    rock: 0x78828f,
    sand: 0xf1d39a
  };

  const deepWater = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshStandardMaterial({
      color: COLORS.oceanDeep,
      roughness: 1,
      metalness: 0
    })
  );
  deepWater.rotation.x = -Math.PI / 2;
  deepWater.position.y = -0.18;
  scene.add(deepWater);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshStandardMaterial({
      color: COLORS.ocean,
      roughness: 0.88,
      metalness: 0
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  scene.add(water);

  function keyOf(gx, gy, gz) {
    return `${gx},${gy},${gz}`;
  }

  function parseKey(key) {
    return key.split(',').map(Number);
  }

  function edgeNoise(x, z) {
    return (
      Math.sin(x * 0.11 + z * 0.037) * 0.045 +
      Math.sin(z * 0.13 - x * 0.031) * 0.035
    );
  }

  function islandMask(x, z) {
    const nx = (x + 5) / 68;
    const nz = (z + 4) / 56;
    let d = nx * nx + nz * nz;
    d -= Math.max(0, (-z - 24) / 80) * 0.10;
    d -= Math.max(0, (-x - 24) / 90) * 0.04;
    d += Math.max(0, (x - 46) / 28) * 0.13;
    return d < 1.0 + edgeNoise(x, z);
  }

  function beachBand(x, z) {
    const bz = (z - 10) / 26;
    const bx = (x - 48) / 23;
    return bx * bx + bz * bz;
  }

  function defaultLevelAt(x, z) {
    if (!islandMask(x, z)) return 0;

    let level = 4;

    if (z <= -39 && x > -58 && x < 34) level = 8;
    else if (z <= -34 && x > -62 && x < 38) level = 7;
    else if (z <= -29 && x > -64 && x < 41) level = 6;
    else if (z <= -24 && x > -66 && x < 43) level = 5;

    const nx = (x + 5) / 68;
    const nz = (z + 4) / 56;
    const radial = nx * nx + nz * nz;

    if (radial > 0.89 && z > 20 && x < 30) level = Math.min(level, 3);
    if (radial > 0.96 && z > 26 && x < 24) level = Math.min(level, 2);

    const bay = beachBand(x, z);
    if (bay < 1.18 && x > 30) {
      if (x >= 48) level = Math.min(level, 1);
      else if (x >= 42) level = Math.min(level, 2);
      else if (x >= 36) level = Math.min(level, 3);
    }

    if (x > 43 && z > 24 && z < 36) {
      level = Math.min(level, 1);
    }

    return Math.max(0, Math.round(level));
  }

  function buildDefaultBlocks() {
    const blocks = new Map();
    const minX = -72;
    const maxX = 69;
    const minZ = -60;
    const maxZ = 51;

    for (let x = minX; x <= maxX; x += CELL) {
      for (let z = minZ; z <= maxZ; z += CELL) {
        const level = defaultLevelAt(x, z);
        if (level <= 0) continue;

        const gx = Math.round(x / CELL);
        const gz = Math.round(z / CELL);
        const sandy = beachBand(x, z) < 1.35 && x > 34;

        for (let gy = 1; gy <= level; gy++) {
          let type = 'rock';
          if (sandy) type = 'sand';
          else if (gy === level) type = 'grass';
          blocks.set(keyOf(gx, gy, gz), type);
        }
      }
    }
    return blocks;
  }

  function serializeBlocks(blocks) {
    return Array.from(blocks, ([key, type]) => {
      const [x, y, z] = parseKey(key);
      return [x, y, z, type];
    });
  }

  function deserializeBlocks(data) {
    const blocks = new Map();
    if (!Array.isArray(data)) return blocks;

    for (const item of data) {
      if (!Array.isArray(item) || item.length < 4) continue;
      const [x, y, z, type] = item;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      if (!['grass', 'rock', 'sand'].includes(type)) continue;
      blocks.set(keyOf(x, y, z), type);
    }
    return blocks;
  }

  let blocks;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    blocks = parsed?.blocks ? deserializeBlocks(parsed.blocks) : buildDefaultBlocks();
    if (!blocks.size) blocks = buildDefaultBlocks();
  } catch {
    blocks = buildDefaultBlocks();
  }

  const cube = new THREE.BoxGeometry(CELL, LEVEL_H, CELL);

  const materials = {
    grass: new THREE.MeshStandardMaterial({
      color: COLORS.grass,
      roughness: 1,
      metalness: 0,
      flatShading: true
    }),
    rock: new THREE.MeshStandardMaterial({
      color: COLORS.rock,
      roughness: 1,
      metalness: 0,
      flatShading: true
    }),
    sand: new THREE.MeshStandardMaterial({
      color: COLORS.sand,
      roughness: 1,
      metalness: 0,
      flatShading: true
    })
  };

  const meshes = {
    grass: new THREE.InstancedMesh(cube, materials.grass, MAX_INSTANCES),
    rock: new THREE.InstancedMesh(cube, materials.rock, MAX_INSTANCES),
    sand: new THREE.InstancedMesh(cube, materials.sand, MAX_INSTANCES)
  };

  for (const mesh of Object.values(meshes)) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
  }

  const instanceKeys = {
    grass: [],
    rock: [],
    sand: []
  };

  const dummy = new THREE.Object3D();

  function rebuildMeshes() {
    instanceKeys.grass = [];
    instanceKeys.rock = [];
    instanceKeys.sand = [];

    const counts = { grass: 0, rock: 0, sand: 0 };

    for (const [key, type] of blocks) {
      if (!(type in meshes)) continue;
      if (counts[type] >= MAX_INSTANCES) continue;

      const [gx, gy, gz] = parseKey(key);
      dummy.position.set(gx * CELL, LEVEL_H * (gy - 0.5), gz * CELL);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      meshes[type].setMatrixAt(counts[type], dummy.matrix);
      instanceKeys[type][counts[type]] = key;
      counts[type] += 1;
    }

    for (const type of Object.keys(meshes)) {
      meshes[type].count = counts[type];
      meshes[type].instanceMatrix.needsUpdate = true;
      meshes[type].computeBoundingSphere();
    }

    updateStatus();
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          cell: CELL,
          levelHeight: LEVEL_H,
          blocks: serializeBlocks(blocks)
        })
      );
      saveBadge.textContent = '已自动保存';
    } catch {
      saveBadge.textContent = '本地保存失败';
    }
  }

  let tool = 'add';
  let materialType = 'grass';
  let editMode = false;
  const undoStack = [];
  const redoStack = [];

  function applyChanges(changes, pushHistory = true) {
    if (!changes.length) return;

    for (const change of changes) {
      if (change.after == null) blocks.delete(change.key);
      else blocks.set(change.key, change.after);
    }

    if (pushHistory) {
      undoStack.push(changes);
      if (undoStack.length > 200) undoStack.shift();
      redoStack.length = 0;
    }

    rebuildMeshes();
    saveLocal();
  }

  function reverseChanges(changes) {
    return changes.map(change => ({
      key: change.key,
      before: change.after,
      after: change.before
    }));
  }

  function undo() {
    const changes = undoStack.pop();
    if (!changes) return;
    applyChanges(reverseChanges(changes), false);
    redoStack.push(changes);
  }

  function redo() {
    const changes = redoStack.pop();
    if (!changes) return;
    applyChanges(changes, false);
    undoStack.push(changes);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function meshTypeFromObject(object) {
    for (const [type, mesh] of Object.entries(meshes)) {
      if (mesh === object) return type;
    }
    return null;
  }

  function intersectVoxel(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(Object.values(meshes), false);
    if (!hits.length) return null;

    const hit = hits[0];
    const type = meshTypeFromObject(hit.object);
    if (!type || hit.instanceId == null) return null;

    const key = instanceKeys[type][hit.instanceId];
    if (!key) return null;

    return { hit, key, type };
  }

  function editAt(clientX, clientY) {
    const result = intersectVoxel(clientX, clientY);
    if (!result) return;

    const { hit, key } = result;
    const [gx, gy, gz] = parseKey(key);

    if (tool === 'delete') {
      applyChanges([{
        key,
        before: blocks.get(key),
        after: null
      }]);
      return;
    }

    if (tool === 'paint') {
      const before = blocks.get(key);
      if (before === materialType) return;
      applyChanges([{
        key,
        before,
        after: materialType
      }]);
      return;
    }

    const n = hit.face?.normal;
    if (!n) return;

    const dx = Math.round(n.x);
    const dy = Math.round(n.y);
    const dz = Math.round(n.z);

    const next = {
      x: gx + dx,
      y: gy + dy,
      z: gz + dz
    };

    if (next.y < 1 || next.y > 24) return;
    if (Math.abs(next.x) > 45 || Math.abs(next.z) > 45) return;

    const nextKey = keyOf(next.x, next.y, next.z);
    if (blocks.has(nextKey)) return;

    applyChanges([{
      key: nextKey,
      before: null,
      after: materialType
    }]);
  }

  let pointerDown = null;

  renderer.domElement.addEventListener('pointerdown', event => {
    pointerDown = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now()
    };
  });

  renderer.domElement.addEventListener('pointerup', event => {
    if (!editMode || !pointerDown) return;

    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    const moved = Math.hypot(dx, dy);
    const elapsed = performance.now() - pointerDown.time;
    pointerDown = null;

    if (moved > 10 || elapsed > 700) return;
    editAt(event.clientX, event.clientY);
  });

  renderer.domElement.addEventListener('pointercancel', () => {
    pointerDown = null;
  });

  const ui = document.createElement('div');
  ui.style.cssText = [
    'position:fixed',
    'left:10px',
    'right:10px',
    'top:10px',
    'display:flex',
    'gap:6px',
    'flex-wrap:wrap',
    'align-items:center',
    'z-index:10',
    'font:12px/1 system-ui,sans-serif',
    'pointer-events:none'
  ].join(';');

  function addButton(label, fn) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = [
      'border:1px solid rgba(0,0,0,.18)',
      'border-radius:8px',
      'padding:8px 10px',
      'background:rgba(255,255,255,.94)',
      'color:#27343b',
      'box-shadow:0 2px 10px rgba(0,0,0,.08)',
      'pointer-events:auto'
    ].join(';');
    button.addEventListener('click', fn);
    ui.appendChild(button);
    return button;
  }

  function markActive(button, active) {
    button.style.outline = active ? '2px solid #355f75' : 'none';
    button.style.background = active ? 'rgba(224,245,255,.98)' : 'rgba(255,255,255,.94)';
  }

  const modeButton = addButton('进入编辑', () => {
    editMode = !editMode;
    controls.enabled = !editMode;
    modeButton.textContent = editMode ? '退出编辑' : '进入编辑';
    markActive(modeButton, editMode);
    updateStatus();
  });

  const addToolButton = addButton('添加', () => {
    tool = 'add';
    refreshToolButtons();
  });

  const deleteToolButton = addButton('删除', () => {
    tool = 'delete';
    refreshToolButtons();
  });

  const paintToolButton = addButton('涂材质', () => {
    tool = 'paint';
    refreshToolButtons();
  });

  const grassButton = addButton('草地', () => {
    materialType = 'grass';
    refreshMaterialButtons();
  });

  const rockButton = addButton('岩石', () => {
    materialType = 'rock';
    refreshMaterialButtons();
  });

  const sandButton = addButton('沙地', () => {
    materialType = 'sand';
    refreshMaterialButtons();
  });

  addButton('撤销', undo);
  addButton('重做', redo);

  addButton('默认视角', () => {
    setDefaultView();
  });

  addButton('俯视', () => {
    controls.target.set(0, 9, 0);
    camera.position.set(0.15, 205, 0.15);
    controls.update();
  });

  addButton('导出JSON', () => {
    const payload = {
      format: 'TownVoxelIsland',
      version: 1,
      cell: CELL,
      levelHeight: LEVEL_H,
      blocks: serializeBlocks(blocks)
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voxel-island-map.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  addButton('导入JSON', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      const nextBlocks = deserializeBlocks(data.blocks);
      if (!nextBlocks.size) throw new Error('empty map');
      blocks = nextBlocks;
      undoStack.length = 0;
      redoStack.length = 0;
      rebuildMeshes();
      saveLocal();
    } catch {
      alert('地图文件无法读取。');
    } finally {
      fileInput.value = '';
    }
  });

  addButton('恢复默认', () => {
    if (!confirm('确定恢复到 Voxel Island v1 默认岛屿？当前本地修改会被清空。')) return;
    blocks = buildDefaultBlocks();
    undoStack.length = 0;
    redoStack.length = 0;
    rebuildMeshes();
    saveLocal();
  });

  app.appendChild(ui);

  const status = document.createElement('div');
  status.style.cssText = [
    'position:fixed',
    'left:10px',
    'bottom:10px',
    'z-index:10',
    'padding:8px 10px',
    'border-radius:8px',
    'background:rgba(255,255,255,.9)',
    'color:#27343b',
    'font:12px/1.35 system-ui,sans-serif',
    'pointer-events:none',
    'max-width:min(92vw,560px)'
  ].join(';');

  const saveBadge = document.createElement('span');

  function materialLabel() {
    return materialType === 'grass' ? '草地' : materialType === 'rock' ? '岩石' : '沙地';
  }

  function toolLabel() {
    return tool === 'add' ? '添加' : tool === 'delete' ? '删除' : '涂材质';
  }

  function updateStatus() {
    const mode = editMode ? '编辑模式' : '视角模式';
    status.innerHTML =
      `<b>${mode}</b>　工具：${toolLabel()}　材质：${materialLabel()}　方块：${blocks.size}<br>` +
      (editMode
        ? '轻点方块进行编辑；退出编辑后可旋转、平移和缩放视角。 '
        : '单指旋转，双指缩放/平移。进入编辑后再点方块修改。 ');
    status.appendChild(saveBadge);
  }

  app.appendChild(status);

  function refreshToolButtons() {
    markActive(addToolButton, tool === 'add');
    markActive(deleteToolButton, tool === 'delete');
    markActive(paintToolButton, tool === 'paint');
    updateStatus();
  }

  function refreshMaterialButtons() {
    markActive(grassButton, materialType === 'grass');
    markActive(rockButton, materialType === 'rock');
    markActive(sandButton, materialType === 'sand');
    updateStatus();
  }

  function setDefaultView() {
    const aspect = window.innerWidth / window.innerHeight;
    const distance = aspect < 0.62 ? 290 : aspect < 0.85 ? 250 : 220;
    const dir = new THREE.Vector3(0.62, 0.58, 0.73).normalize();
    controls.target.set(0, 10, 0);
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    controls.update();
  }

  refreshToolButtons();
  refreshMaterialButtons();
  rebuildMeshes();
  saveBadge.textContent = localStorage.getItem(STORAGE_KEY) ? '已读取本地地图' : '默认地图';
  updateStatus();

  let firstLayout = true;

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (firstLayout) {
      setDefaultView();
      firstLayout = false;
    }
  }

  window.addEventListener('resize', resize);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  return {
    scene,
    camera,
    renderer,
    controls,
    getBlocks: () => new Map(blocks)
  };
}
