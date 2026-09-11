export function createSeasideBlockout(THREE, OrbitControls, app) {
  app.innerHTML = '';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaedff0);
  scene.fog = new THREE.Fog(0xaedff0, 190, 760);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  app.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 4000);
  camera.position.set(86, 72, 94);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;

  // Camera rules:
  // near-complete top-down to near-horizontal, never flip under the world.
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89.4);
  controls.minDistance = 14;
  controls.maxDistance = 220;
  controls.rotateSpeed = 0.7;
  controls.panSpeed = 1.15;
  controls.zoomSpeed = 1.05;

  // Touch/mouse defaults: one finger / left drag rotates, two fingers can zoom+pan.
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

  scene.add(new THREE.HemisphereLight(0xf7fcff, 0x79816c, 2.2));
  const sun = new THREE.DirectionalLight(0xfff0d4, 3.2);
  sun.position.set(-90, 125, -75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const C = {
    ocean: 0x45b8d8,
    ocean2: 0x55c7e4,
    cliff: 0x69717d,
    cliff2: 0x7e8794,
    grassUpper: 0xa7d67d,
    grassMid: 0x93ca74,
    grassLow: 0x83bb6c,
    sand: 0xf0d294,
    road: 0xd6cbb8,
    wood: 0xa8744f,
    white: 0xd9dce4,
    white2: 0xc9ced8,
    rail: 0x4f5660,
    fence: 0x7a5f49,
    plaza: 0xcfd2d9
  };

  const toon = (color) => new THREE.MeshToonMaterial({ color });

  function meshBox(w, h, d, color, x, y, z, rot = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color));
    m.position.set(x, y, z);
    m.rotation.y = rot;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function meshCylinder(rt, rb, h, color, x, y, z, seg = 32) {
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

  function slab(points, y, thickness, color) {
    return prism(points, y - thickness, y, color);
  }

  function ribbon(points, width, y, color, segments = 56) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, y, z)),
      false,
      'catmullrom',
      0.42
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

  function steps(x, z, width, depth, count, y0, y1, direction = 1) {
    const stepD = depth / count;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const y = THREE.MathUtils.lerp(y0, y1, t);
      meshBox(width, 0.45, stepD * 0.94, C.road, x, y, z + direction * (i - (count - 1) / 2) * stepD);
    }
  }

  // Infinite-feeling sea: far larger than the playable region.
  const waterMat = new THREE.MeshToonMaterial({ color: C.ocean });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  scene.add(water);

  // LEVEL 1: low coastal shelf, boardwalk and beach, y = 3.
  const LOW_Y = 3.0;
  const lowShelf = [
    [-63, 25], [-55, 36], [-40, 43], [-22, 47], [-1, 47], [18, 43], [30, 35],
    [34, 24], [30, 15], [18, 10], [1, 8], [-18, 10], [-38, 13], [-55, 18]
  ];
  prism(lowShelf, 0.2, LOW_Y, C.cliff2);
  slab(lowShelf, LOW_Y + 0.45, 0.45, C.grassLow);

  // LEVEL 2: main town plateau, y = 10.
  const MID_Y = 10.0;
  const midPlateau = [
    [-58, -12], [-45, -18], [-25, -21], [-6, -20], [12, -16], [24, -9],
    [29, 0], [26, 11], [18, 19], [5, 25], [-12, 28], [-31, 27], [-47, 22],
    [-57, 14], [-62, 4]
  ];
  prism(midPlateau, LOW_Y, MID_Y, C.cliff);
  slab(midPlateau, MID_Y + 0.5, 0.5, C.grassMid);

  // LEVEL 3: rear station terrace, y = 21.
  const TOP_Y = 21.0;
  const topPlateau = [
    [-63, -48], [-38, -52], [-10, -51], [16, -48], [35, -41], [39, -31],
    [33, -22], [19, -17], [1, -16], [-18, -18], [-38, -17], [-54, -22], [-63, -32]
  ];
  prism(topPlateau, MID_Y, TOP_Y, C.cliff);
  slab(topPlateau, TOP_Y + 0.55, 0.55, C.grassUpper);

  // Right beach remains at sea level so the upper/middle cliff heights stay obvious.
  const beach = [
    [31, -9], [42, -8], [53, -2], [60, 7], [60, 18], [55, 28], [46, 35],
    [35, 35], [29, 27], [27, 16]
  ];
  slab(beach, 1.1, 0.35, C.sand);

  // Separate lighthouse island, also a low-tier landform.
  const lighthouseIsland = [
    [24, 47], [33, 43], [44, 46], [52, 53], [54, 63], [49, 72], [39, 78],
    [28, 76], [19, 70], [16, 60], [19, 52]
  ];
  prism(lighthouseIsland, 0.2, LOW_Y + 0.4, C.cliff2);
  slab([
    [23, 51], [32, 48], [42, 50], [48, 56], [49, 64], [44, 70], [35, 73],
    [27, 70], [22, 65], [20, 58]
  ], LOW_Y + 0.85, 0.45, C.grassLow);

  // Upper railway and tunnel block.
  meshBox(74, 0.25, 0.24, C.rail, -16, TOP_Y + 0.75, -41.5);
  meshBox(74, 0.25, 0.24, C.rail, -16, TOP_Y + 0.75, -39.8);
  for (let i = 0; i < 30; i++) {
    meshBox(0.28, 0.18, 2.25, C.fence, -51 + i * 2.5, TOP_Y + 0.62, -40.65);
  }
  meshBox(8, 8, 8, C.cliff2, -59, TOP_Y - 1.2, -40.5);

  // Pure blockout buildings: no final architecture.
  meshBox(14, 7, 8, C.white2, -32, TOP_Y + 4.1, -31);
  meshBox(8, 5, 7, C.white, 4, TOP_Y + 3.1, -29);
  meshBox(8, 5, 7, C.white, 21, TOP_Y + 3.1, -28);

  // Top terrace road and two explicit vertical connections to the middle plateau.
  ribbon([[-57,-31],[-40,-30],[-22,-28],[-3,-27],[16,-26],[30,-28]], 4.4, TOP_Y + 0.65, C.road);
  steps(-34, -18, 5.2, 14.5, 14, MID_Y + 0.8, TOP_Y + 0.4, -1);
  steps(11, -16, 5.2, 13.5, 13, MID_Y + 0.8, TOP_Y + 0.4, -1);

  // Six town blocks: three upper row + three lower row, as in the structural blueprint.
  const blockY = MID_Y + 3.0;
  const townBlocks = [
    [-43,-3,13,9], [-26,-2,12,9], [-7,-1,16,10],
    [-45,13,12,9], [-27,14,14,10], [-8,14,15,10]
  ];
  for (const [x,z,w,d] of townBlocks) {
    meshBox(w, 6, d, C.white, x, blockY, z);
  }

  // Simple road slabs around the blocks.
  ribbon([[-55,-10],[-44,-8],[-30,-8],[-15,-7],[0,-6],[10,-3]], 3.8, MID_Y + 0.65, C.road);
  ribbon([[-55,8],[-43,7],[-28,8],[-12,8],[2,7],[12,5]], 3.8, MID_Y + 0.65, C.road);
  ribbon([[-52,22],[-35,21],[-17,22],[-2,21],[10,17]], 3.8, MID_Y + 0.65, C.road);

  // Central plaza: still structural only.
  meshCylinder(12, 12, 0.55, C.plaza, 15, MID_Y + 0.8, 7, 48);
  meshCylinder(3.7, 3.7, 1.0, C.white2, 15, MID_Y + 1.4, 7, 32);
  meshCylinder(1.4, 1.4, 5.0, C.white2, 15, MID_Y + 4.0, 7, 24);

  // Connection from middle plateau down to the low coastal shelf.
  steps(15, 24, 5.4, 14, 13, LOW_Y + 0.8, MID_Y + 0.4, 1);

  // Low-tier boardwalk hugging the cliff.
  ribbon([[-56,28],[-43,34],[-27,38],[-9,40],[8,39],[23,34],[31,28]], 4.5, LOW_Y + 0.7, C.wood);
  ribbon([[31,28],[35,34],[36,42],[34,48]], 4.0, LOW_Y + 0.7, C.wood);

  // Beach boardwalk and pier.
  ribbon([[29,6],[34,13],[38,21],[38,29]], 3.4, 1.55, C.wood);
  ribbon([[38,29],[47,31],[59,31],[70,31]], 4.0, 1.55, C.wood);
  meshBox(12, 0.45, 8, C.wood, 74, 1.55, 31);

  // Lighthouse bridge and structural lighthouse cylinder.
  ribbon([[34,48],[31,54],[29,59],[31,63]], 3.8, LOW_Y + 0.85, C.road);
  meshCylinder(2.8, 3.8, 13.0, C.white, 36, LOW_Y + 7.1, 61, 28);
  meshCylinder(3.5, 3.5, 1.2, C.white2, 36, LOW_Y + 13.8, 61, 28);

  // A few large coast rocks only to explain the silhouette, not for decoration.
  const rocks = [
    [-52,48,5],[-36,50,4],[-20,53,5],[-1,52,4],[20,46,4],
    [53,36,4],[58,23,3],[49,78,5],[20,76,4]
  ];
  for (const [x,z,s] of rocks) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), toon(C.cliff2));
    rock.position.set(x, s * 0.55, z);
    rock.scale.y = 0.75;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // Minimal camera toolbar: Default / Top / Low / Lock.
  const ui = document.createElement('div');
  ui.style.cssText = [
    'position:fixed',
    'right:12px',
    'top:12px',
    'display:flex',
    'gap:6px',
    'z-index:5',
    'font:12px/1 system-ui,sans-serif'
  ].join(';');

  function addButton(label, fn) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = [
      'border:1px solid rgba(0,0,0,.18)',
      'border-radius:8px',
      'padding:8px 10px',
      'background:rgba(255,255,255,.88)',
      'color:#27343b',
      'backdrop-filter:blur(8px)',
      'cursor:pointer'
    ].join(';');
    b.addEventListener('click', fn);
    ui.appendChild(b);
    return b;
  }

  addButton('默认', () => {
    camera.position.set(116, 92, 128);
    controls.target.set(0, 10, 4);
    controls.update();
  });

  addButton('俯视', () => {
    const t = controls.target.clone();
    camera.position.set(t.x + 0.2, t.y + 92, t.z + 0.2);
    controls.update();
  });

  addButton('平视', () => {
    const t = controls.target.clone();
    camera.position.set(t.x + 72, t.y + 2.2, t.z + 72);
    controls.update();
  });

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

  let locked = false;
  const lockButton = addButton('锁视角', () => {
    locked = !locked;
    if (!moveMode) controls.enableRotate = !locked;
    lockButton.textContent = locked ? '解锁视角' : '锁视角';
  });

  app.appendChild(ui);

  // Let the camera target travel across the whole playable region.
  // The surrounding sea is huge, so movement never reveals a rectangular world edge.
  const minTarget = new THREE.Vector3(-85, 0, -65);
  const maxTarget = new THREE.Vector3(95, 28, 95);

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
