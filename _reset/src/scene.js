export function createVoxelIslandV2(THREE, OrbitControls, app) {
  app.innerHTML = '';

  const STORAGE_KEY = 'town-voxel-island-editor-v2';
  const CELL = 2.0;
  const LEVEL_H = 1.8;
  const MAX_ROCK_INSTANCES = 70000;
  const MAX_CAP_INSTANCES = 14000;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8f2);
  scene.fog = new THREE.Fog(0xbfe8f2, 320, 1200);

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
    5000
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89);
  controls.minDistance = 22;
  controls.maxDistance = 560;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

  scene.add(new THREE.HemisphereLight(0xfffdf7, 0x60717d, 2.15));

  const sun = new THREE.DirectionalLight(0xffefd8, 3.1);
  sun.position.set(-135, 185, -105);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -220;
  sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220;
  sun.shadow.camera.bottom = -220;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 560;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const COLORS = {
    ocean: 0x48b9dd,
    oceanDeep: 0x2f9dc7,
    rock: 0x76818d,
    grass: 0x92ca75,
    sand: 0xf1d39a,
    nakedRock: 0x858f9b
  };

  const deepWater = new THREE.Mesh(
    new THREE.PlaneGeometry(3200, 3200),
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
    new THREE.PlaneGeometry(3200, 3200),
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

  function keyOf(gx, gz) {
    return `${gx},${gz}`;
  }

  function parseKey(key) {
    return key.split(',').map(Number);
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smoothstep(a, b, v) {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  }

  function noise2(x, z) {
    return (
      Math.sin(x * 0.23 + z * 0.11) * 0.52 +
      Math.sin(x * 0.09 - z * 0.31) * 0.31 +
      Math.sin((x + z) * 0.071) * 0.27 +
      Math.sin((x - z) * 0.047) * 0.18
    );
  }

  function gaussian(x, z, cx, cz, rx, rz) {
    const dx = (x - cx) / rx;
    const dz = (z - cz) / rz;
    return Math.exp(-(dx * dx + dz * dz) * 1.75);
  }

  function insideEllipse(x, z, cx, cz, rx, rz) {
    const dx = (x - cx) / rx;
    const dz = (z - cz) / rz;
    return dx * dx + dz * dz <= 1;
  }

  // ------------------------------------------------------------
  // Voxel Island v2 default generator
  //
  // 1 grid cell = 2 m
  // 1 height level = 1.8 m
  //
  // Target physical size is roughly 220 x 175 m.
  // The middle of the island is NOT one flat platform.
  // Only several local buildable terraces are intentionally calmer.
  // ------------------------------------------------------------

  function defaultColumn(gx, gz) {
    const nx = (gx + 2) / 56;
    const nz = (gz + 1) / 44;
    const radial = Math.sqrt(nx * nx + nz * nz);

    // Large irregular island footprint.
    const edgeWarp =
      noise2(gx * 0.75, gz * 0.75) * 0.035 +
      Math.sin(gz * 0.13) * 0.018;

    if (radial > 1 + edgeWarp) return null;

    // Start from a substantial island body, not a low pancake.
    let h = 7 + Math.round(noise2(gx, gz) * 1.15);

    // Natural coast lowering. The edge varies between low rocky shelves and cliffs.
    if (radial > 0.72) {
      const edgeT = clamp01((radial - 0.72) / 0.28);
      const coastTarget = 2 + Math.round((noise2(gx + 41, gz - 19) + 1) * 0.8);
      h = Math.round(THREE.MathUtils.lerp(h, coastTarget, edgeT));
    }

    // Rear mountain/highland mass. It rises as one irregular landform,
    // not a rectangular second platform.
    const rear = smoothstep(10, 39, -gz);
    const ridge =
      0.72 +
      gaussian(gx, gz, -18, -31, 24, 17) * 1.15 +
      gaussian(gx, gz, 13, -29, 17, 14) * 0.75;
    h += Math.round(rear * ridge * 5.2);

    // Secondary hills break the old empty middle plain.
    h += Math.round(gaussian(gx, gz, -34, -5, 15, 18) * 2.7);
    h += Math.round(gaussian(gx, gz, 22, -7, 13, 15) * 2.2);
    h += Math.round(gaussian(gx, gz, 24, 23, 11, 10) * 1.5);

    // A broad, gentle town basin. Still uneven, only less steep.
    const townBasin = gaussian(gx, gz, -7, 7, 31, 24);
    if (townBasin > 0.18) {
      const gentle = 7 + Math.round(noise2(gx * 0.58, gz * 0.58) * 0.75);
      h = Math.round(THREE.MathUtils.lerp(h, gentle, townBasin * 0.58));
    }

    // Several LOCAL buildable terraces for future houses/shops.
    // Their separation prevents the whole center from reading as a giant platform.
    if (insideEllipse(gx, gz, -29, 3, 8, 6)) h = 7;
    if (insideEllipse(gx, gz, -12, 7, 8, 7)) h = 8;
    if (insideEllipse(gx, gz, 7, 9, 8, 7)) h = 7;
    if (insideEllipse(gx, gz, 21, 5, 6, 6)) h = 8;

    // Right-side beach bay carved into the island.
    // The sand is only a surface layer. All vertical drop faces remain rock.
    const bx = (gx - 45) / 18;
    const bz = (gz - 9) / 26;
    const bay = bx * bx + bz * bz;

    let surface = 'grass';

    if (bay < 1.22 && gx > 29) {
      if (gx >= 49) h = Math.min(h, 1);
      else if (gx >= 44) h = Math.min(h, 2);
      else if (gx >= 38) h = Math.min(h, 3);
      else if (gx >= 33) h = Math.min(h, 4);

      if (h <= 2) surface = 'sand';
    }

    // A small southern beach tongue.
    if (gx > 34 && gz > 25 && gz < 36) {
      h = Math.min(h, 1 + Math.round(Math.max(0, (42 - gx) / 7)));
      if (h <= 2) surface = 'sand';
    }

    // Exposed rocky summits and coastal shoulders.
    if (
      h >= 13 &&
      noise2(gx + 9, gz - 17) > 0.62
    ) {
      surface = 'rock';
    }

    // Keep grass off the lowest rocky ledges unless they are explicit sand.
    if (h <= 2 && surface !== 'sand') surface = 'rock';

    return {
      h: Math.max(1, Math.min(18, Math.round(h))),
      surface
    };
  }

  function buildDefaultColumns() {
    const columns = new Map();

    for (let gx = -58; gx <= 58; gx++) {
      for (let gz = -47; gz <= 47; gz++) {
        const column = defaultColumn(gx, gz);
        if (!column) continue;
        columns.set(keyOf(gx, gz), column);
      }
    }

    return columns;
  }

  function serializeColumns(columns) {
    return Array.from(columns, ([key, value]) => {
      const [gx, gz] = parseKey(key);
      return [gx, gz, value.h, value.surface];
    });
  }

  function deserializeColumns(data) {
    const columns = new Map();
    if (!Array.isArray(data)) return columns;

    for (const item of data) {
      if (!Array.isArray(item) || item.length < 4) continue;
      const [gx, gz, h, surface] = item;
      if (!Number.isFinite(gx) || !Number.isFinite(gz) || !Number.isFinite(h)) continue;
      if (!['grass', 'sand', 'rock'].includes(surface)) continue;

      columns.set(
        keyOf(Math.round(gx), Math.round(gz)),
        {
          h: Math.max(1, Math.min(24, Math.round(h))),
          surface
        }
      );
    }

    return columns;
  }

  // Backward-compatible importer for the old V1 block JSON.
  function columnsFromV1Blocks(blocks) {
    if (!Array.isArray(blocks)) return new Map();

    const grouped = new Map();

    for (const item of blocks) {
      if (!Array.isArray(item) || item.length < 4) continue;
      const [x, y, z, type] = item;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;

      const key = keyOf(Math.round(x), Math.round(z));
      const current = grouped.get(key);

      if (!current || y > current.h) {
        grouped.set(key, {
          h: Math.max(1, Math.round(y)),
          surface: type === 'sand' ? 'sand' : type === 'grass' ? 'grass' : 'rock'
        });
      }
    }

    return grouped;
  }

  let columns;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    columns = parsed?.columns ? deserializeColumns(parsed.columns) : buildDefaultColumns();
    if (!columns.size) columns = buildDefaultColumns();
  } catch {
    columns = buildDefaultColumns();
  }

  // ------------------------------------------------------------
  // Minimal walking pet test
  // ------------------------------------------------------------
  // This is intentionally NOT the real pet system yet.
  // It only tests character scale + terrain traversal on the voxel island.
  const PET_SPEED = 2.5;
  const PET_MAX_STEP = 1;

  const pet = new THREE.Group();
  const petVisual = new THREE.Group();

  const petBodyMat = new THREE.MeshStandardMaterial({
    color: 0x6ecbd4,
    roughness: 0.9,
    metalness: 0
  });

  const petLightMat = new THREE.MeshStandardMaterial({
    color: 0xf4fbf8,
    roughness: 0.9,
    metalness: 0
  });

  const petDarkMat = new THREE.MeshStandardMaterial({
    color: 0x304b56,
    roughness: 0.95,
    metalness: 0
  });

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 12),
    petBodyMat
  );
  body.scale.set(0.86, 1.12, 0.76);
  body.position.y = 0.55;
  body.castShadow = true;
  petVisual.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 12),
    petBodyMat
  );
  head.position.set(0, 1.18, 0);
  head.scale.set(1.0, 0.92, 0.92);
  head.castShadow = true;
  petVisual.add(head);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 14, 10),
    petLightMat
  );
  belly.position.set(0, 0.58, 0.31);
  belly.scale.set(0.78, 1.0, 0.35);
  petVisual.add(belly);

  const eyeGeometry = new THREE.SphereGeometry(0.045, 8, 6);
  for (const x of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(eyeGeometry, petDarkMat);
    eye.position.set(x, 1.22, 0.34);
    petVisual.add(eye);
  }

  const footGeometry = new THREE.SphereGeometry(0.14, 10, 8);
  for (const x of [-0.22, 0.22]) {
    const foot = new THREE.Mesh(footGeometry, petDarkMat);
    foot.position.set(x, 0.12, 0.02);
    foot.scale.set(1.0, 0.55, 1.25);
    foot.castShadow = true;
    petVisual.add(foot);
  }

  pet.add(petVisual);
  scene.add(pet);

  let petGrid = null;
  let petPath = [];
  let petPathIndex = 0;
  let petIdleTimer = 0;
  let petWalkTime = 0;
  let petNeedsRespawn = true;

  function petGroundY(gx, gz) {
    const column = columns.get(keyOf(gx, gz));
    if (!column) return null;
    return column.h * LEVEL_H + 0.18;
  }

  function isPetWalkableStep(ax, az, bx, bz) {
    const a = columns.get(keyOf(ax, az));
    const b = columns.get(keyOf(bx, bz));
    if (!a || !b) return false;
    return Math.abs(a.h - b.h) <= PET_MAX_STEP;
  }

  function heuristic(ax, az, bx, bz) {
    return Math.abs(ax - bx) + Math.abs(az - bz);
  }

  function findPetPath(start, goal) {
    const startKey = keyOf(start.gx, start.gz);
    const goalKey = keyOf(goal.gx, goal.gz);
    if (startKey === goalKey) return [start];

    const open = new Map();
    const cameFrom = new Map();
    const gScore = new Map();
    const closed = new Set();

    open.set(startKey, {
      gx: start.gx,
      gz: start.gz,
      f: heuristic(start.gx, start.gz, goal.gx, goal.gz)
    });
    gScore.set(startKey, 0);

    let inspected = 0;
    const maxInspected = 12000;

    while (open.size && inspected < maxInspected) {
      inspected += 1;

      let currentKey = null;
      let current = null;

      for (const [candidateKey, candidate] of open) {
        if (!current || candidate.f < current.f) {
          currentKey = candidateKey;
          current = candidate;
        }
      }

      if (!current || currentKey == null) break;

      if (currentKey === goalKey) {
        const path = [{ gx: goal.gx, gz: goal.gz }];
        let backKey = goalKey;

        while (cameFrom.has(backKey)) {
          backKey = cameFrom.get(backKey);
          const [gx, gz] = parseKey(backKey);
          path.push({ gx, gz });
        }

        path.reverse();
        return path;
      }

      open.delete(currentKey);
      closed.add(currentKey);

      const neighbors = [
        [current.gx + 1, current.gz],
        [current.gx - 1, current.gz],
        [current.gx, current.gz + 1],
        [current.gx, current.gz - 1]
      ];

      for (const [ngx, ngz] of neighbors) {
        const neighborKey = keyOf(ngx, ngz);
        if (closed.has(neighborKey)) continue;
        if (!isPetWalkableStep(current.gx, current.gz, ngx, ngz)) continue;

        const tentative = (gScore.get(currentKey) ?? Infinity) + 1;
        const oldScore = gScore.get(neighborKey) ?? Infinity;

        if (tentative >= oldScore) continue;

        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentative);

        open.set(neighborKey, {
          gx: ngx,
          gz: ngz,
          f: tentative + heuristic(ngx, ngz, goal.gx, goal.gz)
        });
      }
    }

    return null;
  }

  function choosePetSpawn() {
    const candidates = [];

    for (const [key, column] of columns) {
      const [gx, gz] = parseKey(key);

      if (
        Math.abs(gx) <= 28 &&
        Math.abs(gz) <= 24 &&
        column.h >= 5 &&
        column.h <= 10 &&
        column.surface !== 'rock'
      ) {
        candidates.push({ gx, gz });
      }
    }

    if (!candidates.length) {
      for (const key of columns.keys()) {
        const [gx, gz] = parseKey(key);
        candidates.push({ gx, gz });
      }
    }

    if (!candidates.length) return null;

    candidates.sort((a, b) =>
      (Math.abs(a.gx) + Math.abs(a.gz)) -
      (Math.abs(b.gx) + Math.abs(b.gz))
    );

    const pool = candidates.slice(0, Math.min(160, candidates.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function respawnPet() {
    const spawn = choosePetSpawn();
    if (!spawn) {
      pet.visible = false;
      return;
    }

    const y = petGroundY(spawn.gx, spawn.gz);
    if (y == null) return;

    pet.visible = true;
    petGrid = { gx: spawn.gx, gz: spawn.gz };
    pet.position.set(spawn.gx * CELL, y, spawn.gz * CELL);
    petPath = [];
    petPathIndex = 0;
    petIdleTimer = 0.25;
    petNeedsRespawn = false;
  }

  function choosePetDestination() {
    if (!petGrid) return false;

    const candidates = [];

    for (let attempt = 0; attempt < 90; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 28;

      const gx = Math.round(petGrid.gx + Math.cos(angle) * radius);
      const gz = Math.round(petGrid.gz + Math.sin(angle) * radius);
      const column = columns.get(keyOf(gx, gz));

      if (!column) continue;
      candidates.push({ gx, gz });
    }

    for (const goal of candidates) {
      const path = findPetPath(petGrid, goal);
      if (path && path.length > 3) {
        petPath = path;
        petPathIndex = 1;
        return true;
      }
    }

    return false;
  }

  function invalidatePetRoute() {
    petPath = [];
    petPathIndex = 0;

    if (!petGrid || !columns.has(keyOf(petGrid.gx, petGrid.gz))) {
      petNeedsRespawn = true;
      return;
    }

    const ground = petGroundY(petGrid.gx, petGrid.gz);
    if (ground != null) pet.position.y = ground;
    petIdleTimer = 0.2;
  }

  function updatePet(dt) {
    if (editMode) return;

    if (petNeedsRespawn || !petGrid) {
      respawnPet();
      return;
    }

    petWalkTime += dt;

    if (petIdleTimer > 0) {
      petIdleTimer -= dt;
      petVisual.position.y = Math.sin(petWalkTime * 2.4) * 0.018;
      return;
    }

    if (!petPath.length || petPathIndex >= petPath.length) {
      if (!choosePetDestination()) {
        petIdleTimer = 0.7;
      }
      return;
    }

    const node = petPath[petPathIndex];
    const targetGround = petGroundY(node.gx, node.gz);

    if (targetGround == null) {
      invalidatePetRoute();
      return;
    }

    const target = new THREE.Vector3(
      node.gx * CELL,
      targetGround,
      node.gz * CELL
    );

    const delta = target.clone().sub(pet.position);
    const planarDistance = Math.hypot(delta.x, delta.z);

    if (planarDistance < 0.08) {
      pet.position.copy(target);
      petGrid = { gx: node.gx, gz: node.gz };
      petPathIndex += 1;

      if (petPathIndex >= petPath.length) {
        petIdleTimer = 0.25 + Math.random() * 0.35;
      }
      return;
    }

    const moveDistance = Math.min(PET_SPEED * dt, planarDistance);
    const nx = delta.x / planarDistance;
    const nz = delta.z / planarDistance;

    pet.position.x += nx * moveDistance;
    pet.position.z += nz * moveDistance;

    const progress = moveDistance / Math.max(planarDistance, 0.0001);
    pet.position.y = THREE.MathUtils.lerp(
      pet.position.y,
      target.y,
      Math.min(1, progress * 1.8)
    );

    pet.rotation.y = Math.atan2(nx, nz);
    petVisual.position.y = Math.abs(Math.sin(petWalkTime * 8.0)) * 0.055;
    petVisual.rotation.z = Math.sin(petWalkTime * 8.0) * 0.025;
  }

  // ------------------------------------------------------------
  // Rendering rule:
  // The island body is ALWAYS rock.
  // Grass and sand are thin TOP SURFACE caps only.
  // Therefore every exposed height difference automatically becomes a rock wall.
  // ------------------------------------------------------------

  const rockCube = new THREE.BoxGeometry(CELL, LEVEL_H, CELL);
  const capCube = new THREE.BoxGeometry(CELL * 1.005, 0.16, CELL * 1.005);

  const rockMat = new THREE.MeshStandardMaterial({
    color: COLORS.rock,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: COLORS.grass,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });

  const sandMat = new THREE.MeshStandardMaterial({
    color: COLORS.sand,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });

  const nakedRockMat = new THREE.MeshStandardMaterial({
    color: COLORS.nakedRock,
    roughness: 1,
    metalness: 0,
    flatShading: true
  });

  const rockMesh = new THREE.InstancedMesh(
    rockCube,
    rockMat,
    MAX_ROCK_INSTANCES
  );

  const grassCaps = new THREE.InstancedMesh(
    capCube,
    grassMat,
    MAX_CAP_INSTANCES
  );

  const sandCaps = new THREE.InstancedMesh(
    capCube,
    sandMat,
    MAX_CAP_INSTANCES
  );

  const rockCaps = new THREE.InstancedMesh(
    capCube,
    nakedRockMat,
    MAX_CAP_INSTANCES
  );

  for (const mesh of [rockMesh, grassCaps, sandCaps, rockCaps]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
  }

  const rockKeys = [];
  const capKeys = {
    grass: [],
    sand: [],
    rock: []
  };

  const dummy = new THREE.Object3D();

  function columnAt(gx, gz) {
    return columns.get(keyOf(gx, gz));
  }

  function shouldRenderRockBlock(gx, gy, gz, h) {
    if (gy === h) return true;

    const neighbors = [
      columnAt(gx + 1, gz),
      columnAt(gx - 1, gz),
      columnAt(gx, gz + 1),
      columnAt(gx, gz - 1)
    ];

    return neighbors.some(neighbor => !neighbor || neighbor.h < gy);
  }

  function placeInstance(mesh, index, x, y, z, sy = 1) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, sy, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  function rebuildMeshes() {
    rockKeys.length = 0;
    capKeys.grass.length = 0;
    capKeys.sand.length = 0;
    capKeys.rock.length = 0;

    let rockCount = 0;
    const capCount = { grass: 0, sand: 0, rock: 0 };

    for (const [key, column] of columns) {
      const [gx, gz] = parseKey(key);

      for (let gy = 1; gy <= column.h; gy++) {
        if (!shouldRenderRockBlock(gx, gy, gz, column.h)) continue;
        if (rockCount >= MAX_ROCK_INSTANCES) break;

        placeInstance(
          rockMesh,
          rockCount,
          gx * CELL,
          LEVEL_H * (gy - 0.5),
          gz * CELL
        );

        rockKeys[rockCount] = { gx, gy, gz };
        rockCount += 1;
      }

      const surface = column.surface;
      const capMesh =
        surface === 'sand'
          ? sandCaps
          : surface === 'rock'
            ? rockCaps
            : grassCaps;

      const index = capCount[surface];

      if (index < MAX_CAP_INSTANCES) {
        placeInstance(
          capMesh,
          index,
          gx * CELL,
          column.h * LEVEL_H + 0.08,
          gz * CELL
        );

        capKeys[surface][index] = { gx, gz };
        capCount[surface] += 1;
      }
    }

    rockMesh.count = rockCount;
    grassCaps.count = capCount.grass;
    sandCaps.count = capCount.sand;
    rockCaps.count = capCount.rock;

    for (const mesh of [rockMesh, grassCaps, sandCaps, rockCaps]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }

    updateStatus();
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          format: 'TownVoxelIslandV2',
          version: 2,
          cell: CELL,
          levelHeight: LEVEL_H,
          columns: serializeColumns(columns)
        })
      );
      saveBadge.textContent = '已自动保存';
    } catch {
      saveBadge.textContent = '本地保存失败';
    }
  }

  let editMode = false;
  let tool = 'raise';
  let surfaceType = 'grass';
  let brushSize = 1;

  const undoStack = [];
  const redoStack = [];

  function cloneColumn(column) {
    return column ? { h: column.h, surface: column.surface } : null;
  }

  function applyChanges(changes, pushHistory = true) {
    if (!changes.length) return;

    for (const change of changes) {
      if (change.after == null) {
        columns.delete(change.key);
      } else {
        columns.set(change.key, cloneColumn(change.after));
      }
    }

    if (pushHistory) {
      undoStack.push(changes.map(change => ({
        key: change.key,
        before: cloneColumn(change.before),
        after: cloneColumn(change.after)
      })));

      if (undoStack.length > 160) undoStack.shift();
      redoStack.length = 0;
    }

    rebuildMeshes();
    invalidatePetRoute();
    saveLocal();
  }

  function reversed(changes) {
    return changes.map(change => ({
      key: change.key,
      before: cloneColumn(change.after),
      after: cloneColumn(change.before)
    }));
  }

  function undo() {
    const changes = undoStack.pop();
    if (!changes) return;
    applyChanges(reversed(changes), false);
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

  function pointerRay(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  }

  function columnFromHit(hit) {
    if (hit.object === rockMesh && hit.instanceId != null) {
      const item = rockKeys[hit.instanceId];
      if (item) return { gx: item.gx, gz: item.gz };
    }

    for (const [surface, mesh] of [
      ['grass', grassCaps],
      ['sand', sandCaps],
      ['rock', rockCaps]
    ]) {
      if (hit.object === mesh && hit.instanceId != null) {
        const item = capKeys[surface][hit.instanceId];
        if (item) return { gx: item.gx, gz: item.gz };
      }
    }

    return null;
  }

  function pickColumnOrWater(clientX, clientY) {
    pointerRay(clientX, clientY);

    const hits = raycaster.intersectObjects(
      [grassCaps, sandCaps, rockCaps, rockMesh, water],
      false
    );

    if (!hits.length) return null;

    const hit = hits[0];
    const column = columnFromHit(hit);

    if (column) {
      return {
        gx: column.gx,
        gz: column.gz,
        hitExisting: true
      };
    }

    if (hit.object === water) {
      return {
        gx: Math.round(hit.point.x / CELL),
        gz: Math.round(hit.point.z / CELL),
        hitExisting: false
      };
    }

    return null;
  }

  function brushCells(centerGx, centerGz) {
    const radius = (brushSize - 1) / 2;
    const cells = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (brushSize > 1 && Math.hypot(dx, dz) > radius + 0.35) continue;
        cells.push([centerGx + dx, centerGz + dz]);
      }
    }

    return cells;
  }

  function editAt(clientX, clientY) {
    const picked = pickColumnOrWater(clientX, clientY);
    if (!picked) return;

    const changes = [];

    for (const [gx, gz] of brushCells(picked.gx, picked.gz)) {
      if (Math.abs(gx) > 90 || Math.abs(gz) > 78) continue;

      const key = keyOf(gx, gz);
      const before = cloneColumn(columns.get(key));
      let after = cloneColumn(before);

      if (tool === 'raise') {
        if (!after) {
          after = { h: 1, surface: surfaceType };
        } else {
          after.h = Math.min(24, after.h + 1);
        }
      } else if (tool === 'lower') {
        if (!after) continue;
        if (after.h <= 1) after = null;
        else after.h -= 1;
      } else if (tool === 'surface') {
        if (!after) continue;
        after.surface = surfaceType;
      }

      const same =
        before === null && after === null ||
        before && after &&
        before.h === after.h &&
        before.surface === after.surface;

      if (same) continue;

      changes.push({
        key,
        before,
        after
      });
    }

    applyChanges(changes);
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

    const moved = Math.hypot(
      event.clientX - pointerDown.x,
      event.clientY - pointerDown.y
    );

    const elapsed = performance.now() - pointerDown.time;
    pointerDown = null;

    if (moved > 10 || elapsed > 750) return;
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
    button.style.background = active
      ? 'rgba(224,245,255,.98)'
      : 'rgba(255,255,255,.94)';
  }

  const modeButton = addButton('进入编辑', () => {
    editMode = !editMode;
    controls.enabled = !editMode;
    modeButton.textContent = editMode ? '退出编辑' : '进入编辑';
    markActive(modeButton, editMode);
    updateStatus();
  });

  const raiseButton = addButton('抬高', () => {
    tool = 'raise';
    refreshTools();
  });

  const lowerButton = addButton('降低', () => {
    tool = 'lower';
    refreshTools();
  });

  const surfaceButton = addButton('刷表面', () => {
    tool = 'surface';
    refreshTools();
  });

  const grassButton = addButton('草地', () => {
    surfaceType = 'grass';
    refreshSurfaceButtons();
  });

  const sandButton = addButton('沙地', () => {
    surfaceType = 'sand';
    refreshSurfaceButtons();
  });

  const rockButton = addButton('裸岩', () => {
    surfaceType = 'rock';
    refreshSurfaceButtons();
  });

  const brushButton = addButton('画笔1×1', () => {
    brushSize = brushSize === 1 ? 3 : brushSize === 3 ? 5 : 1;
    brushButton.textContent = `画笔${brushSize}×${brushSize}`;
    updateStatus();
  });

  addButton('撤销', undo);
  addButton('重做', redo);

  function setDefaultView() {
    const aspect = window.innerWidth / window.innerHeight;
    const distance =
      aspect < 0.62
        ? 390
        : aspect < 0.85
          ? 335
          : aspect < 1.15
            ? 300
            : 270;

    const dir = new THREE.Vector3(0.60, 0.52, 0.72).normalize();
    controls.target.set(0, 15, 0);
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    controls.update();
  }

  addButton('默认视角', setDefaultView);

  addButton('俯视', () => {
    controls.target.set(0, 13, 0);
    camera.position.set(0.15, 285, 0.15);
    controls.update();
  });

  addButton('侧视', () => {
    controls.target.set(0, 13, 0);
    camera.position.set(235, 30, 12);
    controls.update();
  });

  addButton('导出JSON', () => {
    const payload = {
      format: 'TownVoxelIslandV2',
      version: 2,
      cell: CELL,
      levelHeight: LEVEL_H,
      columns: serializeColumns(columns)
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voxel-island-v2-map.json';
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

      let nextColumns = new Map();

      if (Array.isArray(data.columns)) {
        nextColumns = deserializeColumns(data.columns);
      } else if (Array.isArray(data.blocks)) {
        nextColumns = columnsFromV1Blocks(data.blocks);
      }

      if (!nextColumns.size) throw new Error('empty map');

      columns = nextColumns;
      undoStack.length = 0;
      redoStack.length = 0;
      rebuildMeshes();
      petNeedsRespawn = true;
      invalidatePetRoute();
      saveLocal();
    } catch {
      alert('地图文件无法读取。');
    } finally {
      fileInput.value = '';
    }
  });

  addButton('恢复V2默认', () => {
    if (!confirm('确定恢复 Voxel Island v2 默认岛屿？当前本地修改会被清空。')) {
      return;
    }

    columns = buildDefaultColumns();
    undoStack.length = 0;
    redoStack.length = 0;
    rebuildMeshes();
    petNeedsRespawn = true;
    invalidatePetRoute();
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
    'font:12px/1.4 system-ui,sans-serif',
    'pointer-events:none',
    'max-width:min(94vw,620px)'
  ].join(';');

  const saveBadge = document.createElement('span');

  function toolLabel() {
    if (tool === 'raise') return '抬高';
    if (tool === 'lower') return '降低';
    return '刷表面';
  }

  function surfaceLabel() {
    if (surfaceType === 'grass') return '草地';
    if (surfaceType === 'sand') return '沙地';
    return '裸岩';
  }

  function updateStatus() {
    const mode = editMode ? '编辑模式' : '视角模式';

    status.innerHTML =
      `<b>Voxel Island v2 · ${mode}</b>　工具：${toolLabel()}　表面：${surfaceLabel()}　画笔：${brushSize}×${brushSize}　地块：${columns.size}<br>` +
      (editMode
        ? '点击地形修改；点击海面可直接从海里新增地块。所有高差侧面会自动显示岩壁。 '
        : '单指旋转，双指缩放/平移。进入编辑后再修改地形。 ');

    status.appendChild(saveBadge);
  }

  app.appendChild(status);

  function refreshTools() {
    markActive(raiseButton, tool === 'raise');
    markActive(lowerButton, tool === 'lower');
    markActive(surfaceButton, tool === 'surface');
    updateStatus();
  }

  function refreshSurfaceButtons() {
    markActive(grassButton, surfaceType === 'grass');
    markActive(sandButton, surfaceType === 'sand');
    markActive(rockButton, surfaceType === 'rock');
    updateStatus();
  }

  refreshTools();
  refreshSurfaceButtons();
  rebuildMeshes();

  saveBadge.textContent = localStorage.getItem(STORAGE_KEY)
    ? '已读取V2本地地图'
    : 'V2默认地图';

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

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    controls.update();
    updatePet(dt);
    renderer.render(scene, camera);
  }

  respawnPet();
  animate();

  return {
    scene,
    camera,
    renderer,
    controls,
    getColumns: () => new Map(columns)
  };
}
