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
  camera.position.set(118, 94, 142);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 8);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;

  controls.minPolarAngle = 0;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89.4);
  controls.minDistance = 12;
  controls.maxDistance = 285;
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

  const toon = (color) => new THREE.MeshToonMaterial({ color });

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

    for (const tri of faces) {
      idx.push(n + tri[0], n + tri[1], n + tri[2]);
      idx.push(tri[2], tri[1], tri[0]);
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
    return prism(points, y - thickness, y, color);
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
    [-66, 26], [-58, 35], [-46, 42], [-31, 47], [-14, 50], [4, 50],
    [18, 47], [29, 41], [36, 34], [37, 27], [32, 22], [20, 19],
    [4, 18], [-15, 19], [-34, 20], [-52, 22]
  ];
  prism(lowShelf, 0.25, LOW_Y, C.cliffLight);
  topSlab(lowShelf, LOW_Y + 0.5, 0.5, C.lowGrass);

  // ------------------------------------------------------------
  // LEVEL 2: main town plateau, broad central body
  // ------------------------------------------------------------
  const midPlateau = [
    [-65, -13], [-55, -18], [-38, -22], [-20, -24], [2, -24], [20, -21],
    [31, -15], [36, -7], [36, 2], [32, 11], [25, 18], [17, 23],
    [6, 27], [-9, 29], [-27, 29], [-44, 26], [-56, 20], [-64, 12]
  ];
  prism(midPlateau, LOW_Y, MID_Y, C.cliff);
  topSlab(midPlateau, MID_Y + 0.55, 0.55, C.midGrass);

  // ------------------------------------------------------------
  // LEVEL 3: long rear terrace, clearly separated from town
  // ------------------------------------------------------------
  const topPlateau = [
    [-68, -55], [-50, -58], [-29, -59], [-5, -58], [18, -55], [38, -49],
    [47, -41], [48, -32], [43, -24], [33, -19], [18, -16], [0, -15],
    [-19, -16], [-38, -17], [-54, -21], [-64, -29], [-69, -40]
  ];
  prism(topPlateau, MID_Y, TOP_Y, C.cliff);
  topSlab(topPlateau, TOP_Y + 0.6, 0.6, C.topGrass);

  // Right beach is not a fourth tier. It sits near sea level.
  const beach = [
    [36, -9], [47, -8], [57, -4], [65, 3], [68, 12], [66, 21],
    [61, 29], [53, 35], [45, 38], [38, 35], [35, 29], [34, 20]
  ];
  topSlab(beach, 1.15, 0.35, C.sand);

  // Independent lighthouse island.
  const lighthouseIsland = [
    [24, 50], [33, 46], [44, 47], [53, 52], [58, 61], [57, 70],
    [51, 78], [42, 83], [32, 82], [22, 77], [16, 69], [15, 60], [19, 54]
  ];
  prism(lighthouseIsland, 0.25, LOW_Y + 0.6, C.cliffLight);
  topSlab([
    [22, 54], [31, 50], [41, 51], [49, 55], [53, 62], [52, 69],
    [47, 75], [39, 78], [30, 77], [23, 72], [20, 65], [20, 59]
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
  cylinder(12.5, 12.5, 0.6, C.plaza, 18, MID_Y + 0.85, 9, 48);
  cylinder(4.1, 4.1, 0.9, C.block2, 18, MID_Y + 1.45, 9, 40);
  cylinder(1.45, 1.45, 5.2, C.block2, 18, MID_Y + 4.0, 9, 24);

  // Middle-to-low stair centered below the plaza.
  stairs(18, 27.5, 5.4, 15.5, 14, MID_Y + 0.35, LOW_Y + 0.9, true);

  // ------------------------------------------------------------
  // Low coast: continuous boardwalk, beach path, pier
  // ------------------------------------------------------------
  ribbon([[-59,30],[-48,35],[-34,40],[-18,43],[-2,44],[14,42],[27,37],[35,31]], 4.4, LOW_Y + 0.75, C.wood);
  ribbon([[35,31],[38,37],[39,43],[37,49]], 4.0, LOW_Y + 0.75, C.wood);

  // beach-side wooden path
  ribbon([[34,3],[38,10],[41,18],[42,27],[41,34]], 3.5, 1.55, C.wood);

  // pier extends rightward
  ribbon([[40,31],[50,31],[60,31],[70,31],[79,31]], 4.0, 1.55, C.wood);
  box(12, 0.46, 8, C.wood, 83, 1.55, 31);

  // lighthouse bridge / path
  ribbon([[37,49],[34,55],[32,61],[33,66]], 3.8, LOW_Y + 0.95, C.road);

  cylinder(2.9, 3.9, 13.5, C.block, 37, LOW_Y + 7.6, 65, 30);
  cylinder(3.6, 3.6, 1.2, C.block2, 37, LOW_Y + 14.6, 65, 30);

  // Only a few rocks to explain coast outline.
  const rocks = [
    [-54,48,4.5],[-39,52,4],[-23,54,4.5],[-5,53,4],[19,48,3.8],
    [56,39,3.8],[62,26,3],[52,82,4.5],[21,79,4]
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

  addButton('默认', () => {
    camera.position.set(118, 94, 142);
    controls.target.set(0, 10, 8);
    controls.update();
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

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
