export function createVoxelIslandV1(THREE, OrbitControls, app) {
  app.innerHTML = '';

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
  controls.minDistance = 30;
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

  const C = {
    ocean: 0x48b9dd,
    oceanDeep: 0x2f9dc7,
    grass: 0x91c873,
    highGrass: 0xa7d681,
    rock: 0x77818e,
    rockLight: 0x8d97a4,
    sand: 0xf1d39a,
    sandDeep: 0xd8b77f
  };

  const deepWater = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshStandardMaterial({
      color: C.oceanDeep,
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
      color: C.ocean,
      roughness: 0.88,
      metalness: 0
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  scene.add(water);

  // ------------------------------------------------------------
  // Voxel Island v1
  // ------------------------------------------------------------
  // One data-driven voxel island:
  // - rear highland
  // - broad middle plain
  // - front/side cliffs
  // - right-side stepped beach bay
  //
  // No buildings, roads, boardwalks or lighthouse yet.
  // ------------------------------------------------------------

  const CELL = 3.0;
  const LEVEL_H = 2.4;
  const MIN_X = -72;
  const MAX_X = 69;
  const MIN_Z = -60;
  const MAX_Z = 51;

  const cols = Math.floor((MAX_X - MIN_X) / CELL) + 1;
  const rows = Math.floor((MAX_Z - MIN_Z) / CELL) + 1;

  function edgeNoise(x, z) {
    return (
      Math.sin(x * 0.11 + z * 0.037) * 0.045 +
      Math.sin(z * 0.13 - x * 0.031) * 0.035
    );
  }

  function islandMask(x, z) {
    // Slightly asymmetric main footprint.
    const nx = (x + 5) / 68;
    const nz = (z + 4) / 56;
    let d = nx * nx + nz * nz;

    // Broaden the rear-left shoulder.
    d -= Math.max(0, (-z - 24) / 80) * 0.10;
    d -= Math.max(0, (-x - 24) / 90) * 0.04;

    // Trim the far right so the beach bay feels carved from the island.
    d += Math.max(0, (x - 46) / 28) * 0.13;

    return d < 1.0 + edgeNoise(x, z);
  }

  function beachBand(x, z) {
    const bz = (z - 10) / 26;
    const bx = (x - 48) / 23;
    return bx * bx + bz * bz;
  }

  function levelAt(x, z) {
    if (!islandMask(x, z)) return 0;

    // Main plain baseline.
    let level = 4;

    // Rear highland, still voxel-stepped rather than a second slab.
    if (z <= -39 && x > -58 && x < 34) level = 8;
    else if (z <= -34 && x > -62 && x < 38) level = 7;
    else if (z <= -29 && x > -64 && x < 41) level = 6;
    else if (z <= -24 && x > -66 && x < 43) level = 5;

    // Small irregularity along the front/left coast so it does not read as a perfect wall.
    const nx = (x + 5) / 68;
    const nz = (z + 4) / 56;
    const radial = nx * nx + nz * nz;
    if (radial > 0.89 && z > 20 && x < 30) {
      level = Math.min(level, 3);
    }
    if (radial > 0.96 && z > 26 && x < 24) {
      level = Math.min(level, 2);
    }

    // Right-side beach bay:
    // main plain -> cliff steps -> sand shelf -> sea.
    const bay = beachBand(x, z);
    if (bay < 1.18 && x > 30) {
      if (x >= 48) level = Math.min(level, 1);
      else if (x >= 42) level = Math.min(level, 2);
      else if (x >= 36) level = Math.min(level, 3);
    }

    // A little extra sand tongue toward the lower-right.
    if (x > 43 && z > 24 && z < 36) {
      level = Math.min(level, 1);
    }

    return Math.max(0, Math.round(level));
  }

  function topType(x, z, level) {
    if (level <= 0) return 'none';
    const bay = beachBand(x, z);
    if ((level <= 2 && bay < 1.35 && x > 34) || (x > 43 && z > 22)) {
      return 'sand';
    }
    if (level >= 6) return 'highGrass';
    return 'grass';
  }

  const voxelData = [];
  for (let ix = 0; ix < cols; ix++) {
    const x = MIN_X + ix * CELL;
    for (let iz = 0; iz < rows; iz++) {
      const z = MIN_Z + iz * CELL;
      const level = levelAt(x, z);
      if (level <= 0) continue;

      voxelData.push({
        x,
        z,
        level,
        top: topType(x, z, level)
      });
    }
  }

  let rockCount = 0;
  let grassCount = 0;
  let highGrassCount = 0;
  let sandCount = 0;

  for (const cell of voxelData) {
    if (cell.top === 'sand') {
      sandCount += cell.level;
    } else {
      rockCount += Math.max(0, cell.level - 1);
      if (cell.top === 'highGrass') highGrassCount += 1;
      else grassCount += 1;
    }
  }

  const cube = new THREE.BoxGeometry(CELL, LEVEL_H, CELL);

  const rockMat = new THREE.MeshStandardMaterial({
    color: C.rock,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });
  const grassMat = new THREE.MeshStandardMaterial({
    color: C.grass,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });
  const highGrassMat = new THREE.MeshStandardMaterial({
    color: C.highGrass,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });
  const sandMat = new THREE.MeshStandardMaterial({
    color: C.sand,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });

  const rockMesh = new THREE.InstancedMesh(cube, rockMat, Math.max(rockCount, 1));
  const grassMesh = new THREE.InstancedMesh(cube, grassMat, Math.max(grassCount, 1));
  const highGrassMesh = new THREE.InstancedMesh(cube, highGrassMat, Math.max(highGrassCount, 1));
  const sandMesh = new THREE.InstancedMesh(cube, sandMat, Math.max(sandCount, 1));

  for (const mesh of [rockMesh, grassMesh, highGrassMesh, sandMesh]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  const dummy = new THREE.Object3D();
  let rockIndex = 0;
  let grassIndex = 0;
  let highGrassIndex = 0;
  let sandIndex = 0;

  function setInstance(mesh, index, x, layer, z) {
    dummy.position.set(x, LEVEL_H * (layer - 0.5), z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  for (const cell of voxelData) {
    if (cell.top === 'sand') {
      for (let layer = 1; layer <= cell.level; layer++) {
        setInstance(sandMesh, sandIndex++, cell.x, layer, cell.z);
      }
      continue;
    }

    for (let layer = 1; layer < cell.level; layer++) {
      setInstance(rockMesh, rockIndex++, cell.x, layer, cell.z);
    }

    if (cell.top === 'highGrass') {
      setInstance(highGrassMesh, highGrassIndex++, cell.x, cell.level, cell.z);
    } else {
      setInstance(grassMesh, grassIndex++, cell.x, cell.level, cell.z);
    }
  }

  rockMesh.count = rockIndex;
  grassMesh.count = grassIndex;
  highGrassMesh.count = highGrassIndex;
  sandMesh.count = sandIndex;

  rockMesh.instanceMatrix.needsUpdate = true;
  grassMesh.instanceMatrix.needsUpdate = true;
  highGrassMesh.instanceMatrix.needsUpdate = true;
  sandMesh.instanceMatrix.needsUpdate = true;

  scene.add(rockMesh, grassMesh, highGrassMesh, sandMesh);

  // Inspection UI.
  const ui = document.createElement('div');
  ui.style.cssText = [
    'position:fixed',
    'right:10px',
    'top:10px',
    'display:flex',
    'gap:6px',
    'flex-wrap:wrap',
    'justify-content:flex-end',
    'z-index:5',
    'font:12px/1 system-ui,sans-serif'
  ].join(';');

  function addButton(label, fn) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = [
      'border:1px solid rgba(0,0,0,.18)',
      'border-radius:8px',
      'padding:8px 10px',
      'background:rgba(255,255,255,.92)',
      'color:#27343b'
    ].join(';');
    button.addEventListener('click', fn);
    ui.appendChild(button);
    return button;
  }

  function setDefaultView() {
    const aspect = window.innerWidth / window.innerHeight;
    const distance = aspect < 0.62 ? 290 : aspect < 0.85 ? 250 : 220;
    const dir = new THREE.Vector3(0.62, 0.58, 0.73).normalize();
    controls.target.set(0, 10, 0);
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    controls.update();
  }

  addButton('默认', setDefaultView);

  addButton('俯视', () => {
    controls.target.set(0, 9, 0);
    camera.position.set(0.15, 200, 0.15);
    controls.update();
  });

  addButton('侧视', () => {
    controls.target.set(0, 9, 0);
    camera.position.set(170, 20, 8);
    controls.update();
  });

  let locked = false;
  const lockButton = addButton('锁视角', () => {
    locked = !locked;
    controls.enableRotate = !locked;
    lockButton.textContent = locked ? '解锁视角' : '锁视角';
  });

  app.appendChild(ui);

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
    voxelData,
    meshes: {
      rockMesh,
      grassMesh,
      highGrassMesh,
      sandMesh
    }
  };
}
