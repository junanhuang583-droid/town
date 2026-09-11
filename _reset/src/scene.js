export function createSeasideBlockout(THREE, OrbitControls, app) {
  app.innerHTML = '';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7e3ef);
  scene.fog = new THREE.Fog(0xb7e3ef, 240, 980);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  app.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 5000);

  const controls = new OrbitControls(camera, renderer.domElement);
  const blueprintTarget = new THREE.Vector3(6, 10, 14);
  controls.target.copy(blueprintTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;

  controls.minPolarAngle = 0;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89.4);
  controls.minDistance = 12;
  controls.maxDistance = 520;
  controls.rotateSpeed = 0.72;
  controls.panSpeed = 1.2;
  controls.zoomSpeed = 1.06;

  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

  scene.add(new THREE.HemisphereLight(0xf9fdff, 0x7c806f, 2.2));

  const sun = new THREE.DirectionalLight(0xffefd5, 3.1);
  sun.position.set(-105, 150, -85);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180;
  sun.shadow.camera.bottom = -180;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const C = {
    ocean: 0x47b8db,
    cliff: 0x687382,
    cliffLight: 0x7d8795,
    topGrass: 0xa6d97c,
    midGrass: 0x96cd75,
    lowGrass: 0x86bd6c,
    sand: 0xf0d49a,
    road: 0xd7cdbb,
    plaza: 0xd0d3da,
    wood: 0xaa7853,
    rail: 0x4d555f,
    sleeper: 0x735947,
    block: 0xdcdfe6,
    block2: 0xcbd0d9,
    fence: 0x7a604a
  };

  const toon = (color) => new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide });

  function box(w, h, d, color, x, y, z, rot = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color));
    m.position.set(x, y, z);
    m.rotation.y = rot;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function cylinder(rt, rb, h, color, x, y, z, seg = 32) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function prism(points, bottomY, topY, color) {
    const contour = points.map(([x, z]) => new THREE.Vector2(x, z));
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    const verts = [];
    const idx = [];
    const n = points.length;

    for (const [x, z] of points) verts.push(x, bottomY, z);
    for (const [x, z] of points) verts.push(x, topY, z);

    // Top cap only. Bottom caps are intentionally omitted because terrain tiers
    // stack vertically and hidden coplanar bottoms cause Z-fighting on mobile GPUs.
    for (const tri of faces) {
      idx.push(n + tri[0], n + tri[1], n + tri[2]);
    }

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      idx.push(i, j, n + j, i, n + j, n + i);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();

    const m = new THREE.Mesh(g, toon(color));
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function topSlab(points, y, thickness, color) {
    const epsilon = 0.035;
    return prism(points, y - thickness + epsilon, y, color);
  }

  function ribbon(points, width, y, color, segments = 48) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, y, z)),
      false,
      'catmullrom',
      0.36
    );

    const pos = [];
    const idx = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);

      pos.push(p.x + side.x, y, p.z + side.z);
      pos.push(p.x - side.x, y, p.z - side.z);

      if (i < segments) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();

    const m = new THREE.Mesh(g, toon(color));
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function stairs(x, z, width, depth, count, y0, y1, towardPositiveZ = true) {
    const d = depth / count;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const y = THREE.MathUtils.lerp(y0, y1, t);
      const local = (i - (count - 1) / 2) * d * (towardPositiveZ ? 1 : -1);
      box(width, 0.42, d * 0.94, C.road, x, y, z + local);
    }
  }

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshToonMaterial({ color: C.ocean })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  scene.add(water);

  const LOW_Y = 3.5;
  const MID_Y = 11.5;
  const TOP_Y = 24.0;

  // ------------------------------------------------------------
  // LEVEL 1: narrow coastal shelf following the front edge
  // ------------------------------------------------------------
  const lowShelf = [
    [-62, 27], [-51, 31], [-38, 35], [-23, 38], [-7, 40], [8, 40],
    [21, 38], [31, 34], [36, 29], [34, 25], [24, 23], [10, 22],
    [-8, 22], [-27, 23], [-45, 24], [-57, 25]
  ];
  prism(lowShelf, 0.25, LOW_Y, C.cliffLight);
  topSlab(lowShelf, LOW_Y + 0.5, 0.5, C.lowGrass);

  // ------------------------------------------------------------
  // LEVEL 2: main town plateau, broad central body
  // ------------------------------------------------------------
  const midPlateau = [
    [-63, -12], [-52, -17], [-35, -20], [-17, -20], [2, -18], [19, -13],
    [30, -7], [35, 1], [34, 8], [29, 14], [22, 19], [12, 23],
    [-2, 26], [-18, 27], [-35, 25], [-50, 20], [-59, 13], [-63, 3]
  ];
  prism(midPlateau, LOW_Y, MID_Y, C.cliff);
  topSlab(midPlateau, MID_Y + 0.55, 0.55, C.midGrass);

  // ------------------------------------------------------------
  // LEVEL 3: long rear terrace, clearly separated from town
  // ------------------------------------------------------------
  const topPlateau = [
    [-68, -54], [-47, -57], [-25, -57], [-2, -56], [21, -53], [40, -47],
    [48, -40], [49, -32], [45, -26], [35, -22], [20, -19], [2, -19],
    [-17, -20], [-35, -21], [-51, -24], [-62, -31], [-68, -40]
  ];
  prism(topPlateau, MID_Y, TOP_Y, C.cliff);
  topSlab(topPlateau, TOP_Y + 0.6, 0.6, C.topGrass);

  // Right beach is not a fourth tier. It sits near sea level.
  const beach = [
    [38, -8], [49, -7], [59, -3], [67, 3], [70, 11], [69, 20],
    [64, 28], [57, 34], [49, 38], [42, 36], [38, 30], [36, 21]
  ];
  topSlab(beach, 1.15, 0.35, C.sand);

  // Independent lighthouse island.
  const lighthouseIsland = [
    [46, 53], [56, 48], [68, 48], [79, 53], [86, 61], [88, 70],
    [84, 79], [76, 86], [65, 89], [54, 86], [46, 80], [41, 72], [41, 63]
  ];
  prism(lighthouseIsland, 0.25, LOW_Y + 0.6, C.cliffLight);
  topSlab([
    [50, 57], [58, 53], [68, 53], [77, 57], [82, 63], [83, 70],
    [79, 77], [72, 82], [64, 84], [56, 82], [50, 77], [46, 70], [46, 63]
  ], LOW_Y + 1.0, 0.4, C.lowGrass);

  // ------------------------------------------------------------
  // Upper terrace: railway, station, two houses
  // ------------------------------------------------------------
  box(92, 0.24, 0.24, C.rail, -10, TOP_Y + 0.75, -47.5);
  box(92, 0.24, 0.24, C.rail, -10, TOP_Y + 0.75, -45.6);

  for (let i = 0; i < 38; i++) {
    box(0.28, 0.16, 2.4, C.sleeper, -55 + i * 2.4, TOP_Y + 0.62, -46.55);
  }

  // tunnel masses at left edge
  box(9, 10, 9, C.cliffLight, -64, TOP_Y - 1.5, -46.5);
  box(8, 8, 7, C.cliffLight, -60, MID_Y + 4.0, -24.5);

  // station and two small upper houses
  box(16, 7, 9, C.block2, -33, TOP_Y + 4.1, -35);
  box(8, 5.5, 7.5, C.block, 8, TOP_Y + 3.4, -31.5);
  box(8.5, 5.5, 7.5, C.block, 27, TOP_Y + 3.4, -31.0);

  ribbon([[-58,-37],[-41,-36],[-24,-35],[-5,-34],[14,-33],[31,-33]], 4.7, TOP_Y + 0.7, C.road);

  // Two upper-to-middle stair connections, matching the blueprint.
  stairs(-29, -19.5, 5.3, 16.5, 16, MID_Y + 0.9, TOP_Y + 0.35, false);
  stairs(11, -17.0, 5.0, 14.0, 14, MID_Y + 0.9, TOP_Y + 0.35, false);

  // ------------------------------------------------------------
  // Middle plateau: six simple blocks and central circular plaza
  // ------------------------------------------------------------
  const H = MID_Y + 3.2;
  const townBlocks = [
    [-46, -2, 13, 9],
    [-28, -1, 12, 9],
    [-9,  0, 16, 10],
    [-47, 14, 12, 9],
    [-28, 15, 14, 10],
    [-9, 16, 15, 10]
  ];

  for (const [x,z,w,d] of townBlocks) {
    box(w, 6.2, d, C.block, x, H, z);
  }

  // Main circulation, deliberately simple.
  ribbon([[-57,-9],[-44,-8],[-28,-8],[-12,-7],[4,-5],[17,-1]], 3.8, MID_Y + 0.68, C.road);
  ribbon([[-57,8],[-44,8],[-28,9],[-12,10],[2,10],[15,8]], 3.8, MID_Y + 0.68, C.road);
  ribbon([[-54,23],[-38,22],[-22,23],[-7,23],[5,20],[15,16]], 3.8, MID_Y + 0.68, C.road);

  // Plaza sits to the right of the six blocks, as in the blueprint.
  cylinder(12.5, 12.5, 0.6, C.plaza, 16, MID_Y + 0.85, 8, 48);
  cylinder(4.1, 4.1, 0.9, C.block2, 16, MID_Y + 1.45, 8, 40);
  cylinder(1.45, 1.45, 5.2, C.block2, 16, MID_Y + 4.0, 8, 24);

  // Middle-to-low stair centered below the plaza.
  stairs(16, 27.0, 5.4, 15.5, 14, MID_Y + 0.35, LOW_Y + 0.9, true);

  // ------------------------------------------------------------
  // Low coast: continuous boardwalk, beach path, pier
  // ------------------------------------------------------------
  ribbon([[-59,29],[-48,32],[-35,35],[-20,37],[-5,38],[10,38],[23,35],[33,31]], 4.2, LOW_Y + 0.75, C.wood);
  ribbon([[33,31],[37,36],[41,42],[45,49]], 3.9, LOW_Y + 0.75, C.wood);

  // beach-side wooden path
  ribbon([[36,2],[40,9],[43,17],[45,25],[46,32]], 3.5, 1.55, C.wood);

  // pier extends rightward
  ribbon([[46,32],[57,32],[69,32],[81,32],[92,32]], 4.0, 1.55, C.wood);
  box(13, 0.46, 8, C.wood, 97, 1.55, 32);

  // lighthouse bridge / path
  ribbon([[45,49],[49,55],[54,61],[60,66]], 3.8, LOW_Y + 0.95, C.road);

  cylinder(2.9, 3.9, 13.5, C.block, 65, LOW_Y + 7.6, 68, 30);
  cylinder(3.6, 3.6, 1.2, C.block2, 65, LOW_Y + 14.6, 68, 30);

  // Only a few rocks to explain coast outline.
  const rocks = [
    [-52,44,4.2],[-36,47,3.8],[-19,49,4.2],[-1,48,3.8],[20,43,3.6],
    [61,40,3.6],[68,27,3],[83,86,4.2],[48,85,3.8]
  ];

  for (const [x,z,s] of rocks) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), toon(C.cliffLight));
    rock.position.set(x, s * 0.55, z);
    rock.scale.y = 0.75;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // ------------------------------------------------------------
  // Camera controls
  // ------------------------------------------------------------
  const ui = document.createElement('div');
  ui.style.cssText = [
    'position:fixed',
    'right:10px',
    'top:10px',
    'display:flex',
    'flex-wrap:wrap',
    'justify-content:flex-end',
    'gap:6px',
    'max-width:min(96vw,520px)',
    'z-index:5',
    'font:12px/1 system-ui,sans-serif'
  ].join(';');

  function addButton(label, fn) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = [
      'border:1px solid rgba(0,0,0,.16)',
      'border-radius:8px',
      'padding:8px 10px',
      'background:rgba(255,255,255,.9)',
      'color:#27343b',
      'backdrop-filter:blur(8px)',
      'cursor:pointer'
    ].join(';');
    b.addEventListener('click', fn);
    ui.appendChild(b);
    return b;
  }

  function setBlueprintView() {
    const aspect = window.innerWidth / window.innerHeight;
    const distance = aspect < 0.62 ? 430 : aspect < 0.85 ? 365 : aspect < 1.15 ? 315 : 285;
    const dir = new THREE.Vector3(0.57, 0.50, 0.65).normalize();

    controls.target.copy(blueprintTarget);
    camera.position.copy(blueprintTarget).addScaledVector(dir, distance);
    controls.update();
  }

  addButton('默认', () => {
    setBlueprintView();
  });

  addButton('俯视', () => {
    const t = controls.target.clone();
    camera.position.set(t.x + 0.15, t.y + 120, t.z + 0.15);
    controls.update();
  });

  addButton('平视', () => {
    const t = controls.target.clone();
    camera.position.set(t.x + 95, t.y + 2.5, t.z + 95);
    controls.update();
  });

  let locked = false;
  let moveMode = false;

  const moveButton = addButton('移动模式', () => {
    moveMode = !moveMode;

    if (moveMode) {
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.touches.ONE = THREE.TOUCH.PAN;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      moveButton.textContent = '旋转模式';
    } else {
      controls.enableRotate = !locked;
      controls.enablePan = true;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      moveButton.textContent = '移动模式';
    }
  });

  const lockButton = addButton('锁视角', () => {
    locked = !locked;
    if (!moveMode) controls.enableRotate = !locked;
    lockButton.textContent = locked ? '解锁视角' : '锁视角';
  });

  app.appendChild(ui);

  // Camera can move around the whole current region but not drift infinitely.
  const minTarget = new THREE.Vector3(-100, 0, -80);
  const maxTarget = new THREE.Vector3(115, 32, 110);

  controls.addEventListener('change', () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, minTarget.x, maxTarget.x);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, minTarget.y, maxTarget.y);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, minTarget.z, maxTarget.z);
  });

  function updateZoomLimits() {
    const aspect = window.innerWidth / window.innerHeight;

    // Portrait phones have a very narrow horizontal field of view, so they need
    // a substantially larger orbit radius to fit the whole town.
    if (aspect < 0.62) {
      controls.maxDistance = 520;
    } else if (aspect < 0.85) {
      controls.maxDistance = 465;
    } else if (aspect < 1.15) {
      controls.maxDistance = 400;
    } else {
      controls.maxDistance = 345;
    }
  }

  let firstLayout = true;

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    updateZoomLimits();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (firstLayout) {
      setBlueprintView();
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
  return { scene, camera, renderer, controls };
}
