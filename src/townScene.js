export function createTownScene(THREE, OrbitControls, app) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9e5f6);
  scene.fog = new THREE.Fog(0xb9e5f6, 95, 180);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  app.appendChild(renderer.domElement);

  const frustum = 62;
  const camera = new THREE.OrthographicCamera(-30, 30, 30, -30, 0.1, 260);
  camera.position.set(58, 52, 64);
  camera.lookAt(0, 2, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 5);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.enableRotate = true;
  controls.zoomToCursor = true;
  controls.minZoom = 0.24;
  controls.maxZoom = 2.4;
  controls.minPolarAngle = THREE.MathUtils.degToRad(38);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(67);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-32);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(82);

  const hemi = new THREE.HemisphereLight(0xf3fbff, 0x9f876f, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffefd0, 2.7);
  sun.position.set(-35, 55, -35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -75;
  sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 75;
  sun.shadow.camera.bottom = -75;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const C = {
    water: 0x69c9df,
    deepWater: 0x3fa7c7,
    baseRock: 0xb3a38e,
    lowGrass: 0x8cc98d,
    midGrass: 0x83bf82,
    highGrass: 0x78b779,
    sand: 0xf0d49a,
    road: 0x66747b,
    path: 0xdbc9a9,
    plaza: 0xe7d7bc,
    wood: 0xa8734e,
    woodDark: 0x76523d,
    station: 0x779ab2,
    placeholder1: 0xe9b6a6,
    placeholder2: 0xf3cf7e,
    placeholder3: 0xa9c9d9,
    placeholder4: 0xaecb9e,
    placeholder5: 0xd6b2cf,
    placeholder6: 0xc8b18e,
    lighthouse: 0xf2eee2,
    lighthouseTop: 0xc95e58,
    rock: 0x8f8377,
    cliff: 0x9f8f7b
  };

  const toon = (color) => new THREE.MeshToonMaterial({ color });
  const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0, flatShading: true });

  function prism(points, bottomY, topY, color, opts = {}) {
    const contour = points.map(([x, z]) => new THREE.Vector2(x, z));
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    const vertices = [];
    const indices = [];
    const n = points.length;

    for (const [x, z] of points) vertices.push(x, bottomY, z);
    for (const [x, z] of points) vertices.push(x, topY, z);

    for (const tri of faces) {
      indices.push(n + tri[0], n + tri[1], n + tri[2]);
      indices.push(tri[2], tri[1], tri[0]);
    }

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, j, n + j, i, n + j, n + i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, opts.matte ? matte(color) : toon(color));
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function box(w, h, d, color, x, y, z, rot = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function cylinder(rt, rb, h, color, x, y, z, seg = 20) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function ribbon(points, width, y, color) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', 0.4);
    const segments = 90;
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
    const mesh = new THREE.Mesh(g, toon(color));
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function circlePad(r, y, color, x, z, sx = 1, sz = 1) {
    const g = new THREE.CircleGeometry(r, 42);
    const mesh = new THREE.Mesh(g, toon(color));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sz, 1);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // --- Water ---
  const waterUniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(C.deepWater) },
    uShallow: { value: new THREE.Color(C.water) }
  };
  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      varying vec2 vUv;
      void main() {
        float a = sin(vUv.x * 38.0 + uTime * 0.55) * 0.5 + 0.5;
        float b = sin(vUv.y * 62.0 - uTime * 0.8 + sin(vUv.x * 8.0)) * 0.5 + 0.5;
        vec3 c = mix(uDeep, uShallow, vUv.y * 0.55 + a * 0.04 + b * 0.03);
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(190, 150), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.12, 18);
  scene.add(water);

  // --- Irregular coastal land ---
  const baseLand = [
    [-52,-38],[-30,-44],[-5,-46],[24,-42],[44,-32],[50,-18],[49,-5],[43,5],[34,11],
    [28,16],[27,21],[31,25],[38,28],[44,34],[44,41],[38,48],[29,52],[21,49],[17,43],
    [16,35],[17,29],[14,24],[9,20],[3,17],[-5,17],[-14,20],[-23,26],[-32,29],[-41,27],
    [-49,20],[-53,10],[-55,-4],[-55,-20]
  ];
  prism(baseLand, -0.2, 1.15, C.baseRock, { matte: true });

  const lowLand = [
    [-49,-36],[-28,-41],[-4,-42],[22,-39],[40,-30],[45,-17],[44,-6],[38,4],[30,10],
    [24,15],[23,21],[28,26],[35,30],[39,34],[39,39],[34,44],[28,47],[23,44],[20,38],
    [20,32],[18,27],[14,23],[8,19],[2,16],[-6,16],[-15,20],[-24,25],[-33,27],[-41,24],
    [-47,18],[-50,8],[-52,-5],[-52,-20]
  ];
  prism(lowLand, 1.10, 1.65, C.lowGrass);

  // Mid level: left-side resort/service zone.
  const midLand = [
    [-47,-34],[-29,-38],[-7,-39],[14,-36],[27,-30],[31,-22],[28,-12],[20,-5],[11,0],
    [4,3],[-4,5],[-13,9],[-23,15],[-32,17],[-40,14],[-46,7],[-49,-4],[-50,-20]
  ];
  prism(midLand, 1.62, 2.55, C.midGrass);

  // Upper level: road + station + sparse permanent housing.
  const highLand = [
    [-47,-35],[-28,-38],[-6,-38],[10,-35],[17,-30],[16,-24],[8,-20],[-3,-18],[-14,-15],
    [-27,-13],[-38,-15],[-45,-21]
  ];
  prism(highLand, 2.52, 3.75, C.highGrass);

  // Right-side beach and shallow tide zone.
  const beach = [
    [7,15],[15,18],[20,23],[22,29],[21,36],[24,42],[29,46],[34,43],[37,38],[37,33],
    [32,29],[27,25],[24,20],[24,15],[19,11],[13,11]
  ];
  prism(beach, 0.7, 1.42, C.sand, { matte: true });

  // Rocky left coast ledges.
  prism([[-45,9],[-37,18],[-28,22],[-23,26],[-31,29],[-41,27],[-48,20],[-51,12]], 0.5, 1.28, C.cliff, { matte: true });
  prism([[-49,-2],[-44,6],[-42,15],[-48,19],[-52,12],[-54,3]], 0.35, 1.0, C.cliff, { matte: true });

  // --- Main road and station ---
  ribbon([[-56,-31],[-44,-31],[-33,-30],[-22,-27],[-12,-24],[1,-24],[14,-27]], 5.2, 3.82, C.road);
  ribbon([[-31,-28],[-29,-22],[-25,-16],[-20,-10],[-16,-5]], 2.4, 2.62, C.path);

  // Station skeleton in upper-left.
  box(10.5, 0.35, 3.2, C.station, -35, 4.35, -27, 0.04);
  box(0.35, 3.0, 0.35, 0x5b6870, -39.2, 5.75, -27.6);
  box(0.35, 3.0, 0.35, 0x5b6870, -30.8, 5.75, -27.6);

  // Sparse resident blocks behind station, only to indicate permanent habitation.
  box(6.0, 3.5, 5.0, 0xb6caa9, -27, 5.5, -18, -0.12);
  box(5.2, 3.2, 4.8, 0xc9baa8, -17, 5.35, -17, 0.08);

  // --- Resort commercial/service skeleton: six approved buildings ---
  // Sweet shop
  box(5.8, 3.1, 5.0, C.placeholder2, -26, 4.1, -9, 0.10);
  // Souvenir / general shop
  box(6.3, 3.5, 5.4, C.placeholder4, -18, 4.3, -7, -0.08);
  // Small inn
  box(8.0, 5.2, 6.2, C.placeholder3, -31, 5.15, -1, 0.18);
  // Sea-view cafe
  box(7.6, 4.0, 6.0, C.placeholder1, -18, 4.55, 2, 0.10);
  // Seafood restaurant
  box(7.0, 3.8, 5.8, C.placeholder5, -10, 4.45, 7, -0.08);
  // Rental/activity hut
  box(4.7, 2.8, 4.2, C.placeholder6, -2, 3.95, 11, 0.12);

  // Curving pedestrian spine through the resort.
  ribbon([[-28,-14],[-25,-8],[-20,-3],[-15,1],[-10,5],[-5,9],[-1,12]], 2.2, 2.64, C.path);

  // --- Sea-breeze plaza, left-middle / lower ---
  circlePad(7.2, 2.67, C.plaza, -11, 10, 1.15, 0.88);
  cylinder(1.0, 1.35, 0.8, 0xc8b9a4, -11, 3.08, 10, 26);

  // --- Boardwalk follows the bay instead of a straight line ---
  ribbon([[-27,23],[-21,21],[-14,19],[-7,18],[-1,18],[6,20],[11,23],[15,27]], 2.5, 1.73, C.wood);

  // --- Beach circulation path ---
  ribbon([[7,14],[12,16],[17,19],[20,23],[22,28],[22,34]], 1.8, 1.48, C.path);

  // Tide pools.
  circlePad(2.4, 1.46, 0x75d2dc, 25, 32, 1.4, 0.72);
  circlePad(1.7, 1.47, 0x76d0da, 30, 37, 1.2, 0.78);
  circlePad(1.25, 1.47, 0x78cbd5, 20, 38, 1.3, 0.7);

  // --- Small pier in right-middle, separated from lighthouse ---
  ribbon([[17,26],[22,29],[27,31],[33,31]], 2.3, 1.62, C.wood);
  box(5.0, 0.35, 3.0, C.wood, 34.5, 1.62, 31, 0.02);

  // --- Lighthouse cape in lower-right ---
  const cape = [
    [19,33],[18,39],[21,46],[27,51],[35,53],[42,50],[46,44],[45,38],[40,34],[34,31],[27,30]
  ];
  prism(cape, 0.35, 1.24, C.cliff, { matte: true });
  prism([[22,35],[22,41],[25,47],[31,50],[37,49],[42,45],[42,39],[37,35],[30,33]], 1.22, 1.55, C.lowGrass);

  // Simple lighthouse placeholder only.
  cylinder(1.7, 2.15, 8.0, C.lighthouse, 35, 5.55, 43, 24);
  cylinder(2.0, 2.0, 0.8, C.lighthouseTop, 35, 9.95, 43, 24);
  cylinder(1.25, 1.25, 1.1, 0x8dbfd0, 35, 10.9, 43, 18);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.6, 24), toon(C.lighthouseTop));
  roof.position.set(35, 12.15, 43);
  roof.castShadow = true;
  scene.add(roof);

  // --- Natural blank areas: intentionally sparse ---
  const rockPositions = [
    [-42,15,1.2],[-38,21,0.9],[-34,24,1.1],[-47,7,0.8],
    [17,39,0.7],[27,43,0.8],[32,47,0.9],[39,42,1.0]
  ];
  for (const [x,z,s] of rockPositions) {
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), toon(C.rock));
    r.position.set(x, 1.45 + s * 0.35, z);
    r.scale.set(1.25, 0.72, 1.0);
    r.castShadow = true;
    r.receiveShadow = true;
    scene.add(r);
  }

  // Distant islands, still skeleton-level.
  const islandMat = matte(0x7ca58b);
  for (const [x,z,s] of [[-35,73,2.6],[-8,78,2.2],[22,74,2.9]]) {
    const island = new THREE.Mesh(new THREE.ConeGeometry(5.2 * s, 5.6 * s, 7), islandMat);
    island.position.set(x, 1.0, z);
    island.scale.y = 0.32;
    scene.add(island);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    camera.left = -frustum * aspect / 2;
    camera.right = frustum * aspect / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;

    // Full-map framing is deliberately generous, especially in portrait.
    camera.zoom = aspect < 0.72 ? 0.28 : aspect < 1 ? 0.40 : 0.60;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    waterUniforms.uTime.value = clock.getElapsedTime();
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { scene, camera, renderer, controls };
}
