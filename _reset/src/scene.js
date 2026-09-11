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

  function gableRoof(w, d, h, color, x, y, z, rot = 0, ridgeAlongX = true) {
    const rw = ridgeAlongX ? w : d;
    const rd = ridgeAlongX ? d : w;
    const verts = [
      -rw/2, 0, -rd/2,   rw/2, 0, -rd/2,
      -rw/2, 0,  rd/2,   rw/2, 0,  rd/2,
      -rw/2, h, 0,       rw/2, h, 0
    ];
    const idx = [
      0,1,4, 1,5,4,
      2,4,3, 3,4,5,
      0,4,2,
      1,3,5,
      0,2,1, 1,2,3
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();

    const m = new THREE.Mesh(g, toon(color));
    m.position.set(x, y, z);
    m.rotation.y = rot + (ridgeAlongX ? 0 : Math.PI / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function hipRoof(w, d, h, color, x, y, z, rot = 0) {
    const g = new THREE.ConeGeometry(Math.max(w, d) * 0.72, h, 4);
    const m = new THREE.Mesh(g, toon(color));
    m.position.set(x, y + h * 0.5, z);
    m.rotation.y = Math.PI / 4 + rot;
    m.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function whiteBuilding({
    x, z, w, d, bodyH, baseY, rot = 0,
    roof = 'gable', roofH = 2.6, ridgeAlongX = true,
    annex = null
  }) {
    box(w, bodyH, d, C.block, x, baseY + bodyH / 2, z, rot);

    if (roof === 'hip') {
      hipRoof(w * 1.08, d * 1.08, roofH, C.block2, x, baseY + bodyH, z, rot);
    } else {
      gableRoof(w * 1.08, d * 1.08, roofH, C.block2, x, baseY + bodyH, z, rot, ridgeAlongX);
    }

    if (annex) {
      const ax = x + annex.dx;
      const az = z + annex.dz;
      box(annex.w, annex.h, annex.d, C.block2, ax, baseY + annex.h / 2, az, rot);
      if (annex.roof !== false) {
        gableRoof(
          annex.w * 1.06,
          annex.d * 1.06,
          annex.roofH || 1.5,
          C.block2,
          ax,
          baseY + annex.h,
          az,
          rot,
          annex.ridgeAlongX !== false
        );
      }
    }
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

  function segmentBeam(x1, z1, x2, z2, height, thickness, y, color) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const rot = -Math.atan2(dz, dx);
    return box(
      len,
      height,
      thickness,
      color,
      (x1 + x2) / 2,
      y,
      (z1 + z2) / 2,
      rot
    );
  }

  function retainingWall(points, baseY, topY, thickness = 0.65) {
    const h = Math.max(0.2, topY - baseY);
    const cy = baseY + h / 2;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i];
      const [x2, z2] = points[i + 1];
      segmentBeam(x1, z1, x2, z2, h, thickness, cy, C.block2);
    }
  }

  function landing(x, z, w, d, y) {
    box(w, 0.45, d, C.road, x, y, z);
  }

  function ringRoad(innerR, outerR, y, x, z) {
    const g = new THREE.RingGeometry(innerR, outerR, 48);
    const m = new THREE.Mesh(g, toon(C.road));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
    return m;
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

  // station white model: main hall + side wing + platform canopy
  whiteBuilding({
    x:-33, z:-35, w:16, d:9, bodyH:6.6, baseY:TOP_Y + 0.6,
    roof:'gable', roofH:3.0, ridgeAlongX:true,
    annex:{ dx:-9.4, dz:0.8, w:7.5, d:6.5, h:4.2, roofH:1.8 }
  });
  box(18, 0.7, 3.0, C.block2, -31.5, TOP_Y + 4.8, -40.0);
  box(0.35, 3.6, 0.35, C.block2, -38, TOP_Y + 2.8, -40.0);
  box(0.35, 3.6, 0.35, C.block2, -31.5, TOP_Y + 2.8, -40.0);
  box(0.35, 3.6, 0.35, C.block2, -25, TOP_Y + 2.8, -40.0);

  // two small upper cottages
  whiteBuilding({
    x:8, z:-31.5, w:8, d:7.5, bodyH:4.8, baseY:TOP_Y + 0.6,
    roof:'gable', roofH:2.3, ridgeAlongX:false,
    annex:{ dx:3.7, dz:2.6, w:3.4, d:3.0, h:2.5, roofH:1.2 }
  });
  whiteBuilding({
    x:27, z:-31.0, w:8.5, d:7.5, bodyH:4.9, baseY:TOP_Y + 0.6,
    roof:'hip', roofH:2.4,
    annex:{ dx:-3.7, dz:2.5, w:3.2, d:3.0, h:2.4, roofH:1.1 }
  });

  ribbon([[-58,-37],[-41,-36],[-24,-35],[-5,-34],[14,-33],[31,-33]], 4.7, TOP_Y + 0.7, C.road);

  // Two upper-to-middle stair connections, matching the blueprint.
  stairs(-29, -19.5, 5.3, 16.5, 16, MID_Y + 0.9, TOP_Y + 0.35, false);
  stairs(11, -17.0, 5.0, 14.0, 14, MID_Y + 0.9, TOP_Y + 0.35, false);

  // Stair landings make the vertical connections read as actual playable routes.
  landing(-29, -27.2, 6.8, 4.0, TOP_Y + 0.68);
  landing(-29, -11.8, 6.8, 4.2, MID_Y + 0.68);
  landing(11, -23.2, 6.5, 4.0, TOP_Y + 0.68);
  landing(11, -10.9, 6.5, 4.0, MID_Y + 0.68);

  // Clean retaining-wall runs on the front of the upper terrace, interrupted at stairs.
  retainingWall([[-55,-24],[-42,-21.5],[-34,-20.8]], MID_Y + 1.0, TOP_Y - 0.3);
  retainingWall([[-24,-20.0],[-10,-19.4],[4,-19.1]], MID_Y + 1.0, TOP_Y - 0.3);
  retainingWall([[18,-19.1],[31,-21.0],[43,-25.0]], MID_Y + 1.0, TOP_Y - 0.3);

  // ------------------------------------------------------------
  // Middle plateau: six simple blocks and central circular plaza
  // ------------------------------------------------------------
  const townBaseY = MID_Y + 0.55;

  // six resort-building white models, intentionally varied in massing
  whiteBuilding({
    x:-46, z:-2, w:13, d:9, bodyH:6.4, baseY:townBaseY,
    roof:'gable', roofH:2.8, ridgeAlongX:true,
    annex:{ dx:-5.6, dz:2.8, w:4.0, d:4.6, h:3.1, roofH:1.4 }
  });

  whiteBuilding({
    x:-28, z:-1, w:12, d:9, bodyH:5.4, baseY:townBaseY,
    roof:'hip', roofH:2.5,
    annex:{ dx:4.6, dz:2.7, w:3.5, d:4.0, h:2.7, roof:false }
  });

  whiteBuilding({
    x:-9, z:0, w:16, d:10, bodyH:6.8, baseY:townBaseY,
    roof:'gable', roofH:3.1, ridgeAlongX:true,
    annex:{ dx:6.5, dz:3.2, w:4.2, d:4.5, h:3.2, roofH:1.5 }
  });

  whiteBuilding({
    x:-47, z:14, w:12, d:9, bodyH:5.7, baseY:townBaseY,
    roof:'hip', roofH:2.6,
    annex:{ dx:-4.8, dz:-2.8, w:3.4, d:3.8, h:2.6, roof:false }
  });

  whiteBuilding({
    x:-28, z:15, w:14, d:10, bodyH:6.1, baseY:townBaseY,
    roof:'gable', roofH:2.9, ridgeAlongX:false,
    annex:{ dx:5.5, dz:-3.1, w:4.0, d:4.1, h:3.0, roofH:1.3, ridgeAlongX:false }
  });

  whiteBuilding({
    x:-9, z:16, w:15, d:10, bodyH:5.8, baseY:townBaseY,
    roof:'hip', roofH:2.7,
    annex:{ dx:-5.8, dz:-3.0, w:3.8, d:4.2, h:2.8, roof:false }
  });

  // Main circulation now reads as one connected playable street network.
  ribbon([[-57,-9],[-44,-8],[-28,-8],[-12,-7],[4,-5],[17,-1]], 4.0, MID_Y + 0.68, C.road);
  ribbon([[-57,8],[-44,8],[-28,9],[-12,10],[2,10],[12,9]], 4.0, MID_Y + 0.68, C.road);
  ribbon([[-54,23],[-38,22],[-22,23],[-7,23],[5,20],[12,15]], 4.0, MID_Y + 0.68, C.road);

  // Two north-south connectors stop the shop rows from reading as isolated strips.
  ribbon([[-39,-8],[-39,0],[-39,8],[-39,20]], 3.4, MID_Y + 0.69, C.road, 32);
  ribbon([[-19,-7],[-18,1],[-18,10],[-17,22]], 3.4, MID_Y + 0.69, C.road, 32);

  // Plaza sits to the right of the six blocks, as in the blueprint.
  cylinder(12.5, 12.5, 0.6, C.plaza, 16, MID_Y + 0.85, 8, 48);
  ringRoad(13.0, 16.0, MID_Y + 0.69, 16, 8);
  ribbon([[12,9],[14,9],[16,9]], 4.0, MID_Y + 0.70, C.road, 16);
  cylinder(4.1, 4.1, 0.9, C.block2, 16, MID_Y + 1.45, 8, 40);
  cylinder(1.45, 1.45, 5.2, C.block2, 16, MID_Y + 4.0, 8, 24);

  // Middle-to-low stair centered below the plaza, with proper landings.
  stairs(16, 27.0, 5.4, 15.5, 14, MID_Y + 0.35, LOW_Y + 0.9, true);
  landing(16, 20.0, 7.0, 4.0, MID_Y + 0.69);
  landing(16, 34.2, 7.0, 4.2, LOW_Y + 0.72);

  // Selected retaining wall along the town's front edge, leaving the stair opening clear.
  retainingWall([[-57,22],[-42,25],[-25,26.5],[-5,26.0],[8,23.5]], LOW_Y + 0.8, MID_Y - 0.35);
  retainingWall([[24,18.0],[29,14.0],[33,8.5]], LOW_Y + 0.8, MID_Y - 0.35);

  // ------------------------------------------------------------
  // Low coast: continuous boardwalk, beach path, pier
  // ------------------------------------------------------------
  ribbon([[-59,29],[-48,32],[-35,35],[-20,37],[-5,38],[10,38],[23,35],[33,31]], 4.2, LOW_Y + 0.75, C.wood);
  ribbon([[33,31],[37,36],[41,42],[45,49]], 3.9, LOW_Y + 0.75, C.wood);

  // Sparse structural supports make the boardwalk read as elevated construction.
  for (const [x,z] of [[-49,32],[-31,36],[-12,38],[8,38],[27,34],[39,39]]) {
    box(0.7, LOW_Y + 0.7, 0.7, C.block2, x, (LOW_Y + 0.7)/2, z);
  }

  // beach-side wooden path
  ribbon([[36,2],[40,9],[43,17],[45,25],[46,32]], 3.5, 1.55, C.wood);

  // Structural tide-pool placeholders, still blockout geometry only.
  cylinder(4.6, 5.2, 0.18, C.ocean, 55, 1.24, 8, 28);
  cylinder(3.2, 3.8, 0.16, C.ocean, 61, 1.22, 18, 24);

  // pier extends rightward and finishes in a wider end platform.
  ribbon([[46,32],[57,32],[69,32],[81,32],[92,32]], 4.0, 1.55, C.wood);
  box(15, 0.46, 9, C.wood, 98, 1.55, 32);

  // Pier posts below the main axis and terminal platform.
  for (const x of [50,60,70,80,90,96,101]) {
    box(0.65, 1.45, 0.65, C.block2, x, 0.75, 30.7);
    box(0.65, 1.45, 0.65, C.block2, x, 0.75, 33.3);
  }

  // pier house white model near the inner pier
  whiteBuilding({
    x:61, z:27.5, w:8.5, d:6.2, bodyH:4.4, baseY:1.5,
    roof:'gable', roofH:2.2, ridgeAlongX:true,
    annex:{ dx:3.8, dz:1.8, w:2.6, d:2.8, h:2.0, roof:false }
  });

  // lighthouse bridge / path, now with a landing and an island approach loop.
  ribbon([[45,49],[49,55],[54,61],[60,66]], 3.8, LOW_Y + 0.95, C.road);
  landing(45.5, 49.5, 6.0, 5.0, LOW_Y + 0.96);
  ribbon([[60,66],[63,66],[65,67],[65,68]], 3.5, LOW_Y + 1.05, C.road, 18);
  ringRoad(6.0, 8.2, LOW_Y + 1.04, 65, 68);

  // lighthouse white model: base, tapered tower, gallery, lantern room, cap
  cylinder(4.8, 4.8, 1.5, C.block2, 65, LOW_Y + 1.8, 68, 32);
  cylinder(2.8, 4.2, 12.8, C.block, 65, LOW_Y + 8.5, 68, 32);
  cylinder(4.0, 4.0, 0.8, C.block2, 65, LOW_Y + 15.2, 68, 32);
  cylinder(2.5, 2.5, 2.5, C.block2, 65, LOW_Y + 16.8, 68, 24);
  const lighthouseCap = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.2, 24), toon(C.block2));
  lighthouseCap.position.set(65, LOW_Y + 19.15, 68);
  lighthouseCap.castShadow = true;
  lighthouseCap.receiveShadow = true;
  scene.add(lighthouseCap);

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
