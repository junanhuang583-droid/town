export function createSeasideBlockout(THREE, OrbitControls, app) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8deea);
  scene.fog = new THREE.Fog(0xa8deea, 105, 190);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  app.appendChild(renderer.domElement);

  const frustum = 84;
  const camera = new THREE.OrthographicCamera(-42, 42, 42, -42, 0.1, 300);
  camera.position.set(76, 72, 82);
  camera.lookAt(0, 4, 8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 8);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.minZoom = 0.42;
  controls.maxZoom = 2.35;
  controls.minPolarAngle = THREE.MathUtils.degToRad(42);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(59);
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(20);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(70);

  scene.add(new THREE.HemisphereLight(0xf3fbff, 0x8f806e, 2.15));
  const sun = new THREE.DirectionalLight(0xfff0d6, 3.0);
  sun.position.set(-48, 70, -35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const C = {
    water: 0x58bfd7,
    waterDeep: 0x3ca0c1,
    cliff: 0x8d8274,
    cliffLight: 0xaa9a85,
    grassHigh: 0xa9d38e,
    grassMid: 0x97c887,
    grassLow: 0x84b879,
    sand: 0xebcf91,
    road: 0xb9aa91,
    stone: 0xc4bbaa,
    plaza: 0xd9d0bd,
    wood: 0x9a6f4f,
    rail: 0x4d5559,
    station: 0x9db5bc,
    cottage: 0xc9c0ab,
    inn: 0x9fb5c0,
    dessert: 0xe7b6a9,
    general: 0xa8bd92,
    cafe: 0xd7a59a,
    seafood: 0xb8a2b7,
    rental: 0xbba98d,
    lighthouse: 0xe9e5d8,
    red: 0xbd5e58,
    blue: 0x6b8fa7,
    green: 0x6f8f70,
    foliage: 0x668e68
  };

  const mat = (color) => new THREE.MeshToonMaterial({ color });

  function box(w, h, d, color, x, y, z, rot = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function cylinder(rt, rb, h, color, x, y, z, seg = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
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

    const mesh = new THREE.Mesh(g, mat(color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function ribbon(points, width, y, color, segments = 90) {
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

    const mesh = new THREE.Mesh(g, mat(color));
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function roof(w, d, color, x, y, z, rot = 0) {
    const span = Math.max(w, d);
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(span * 0.72, Math.max(1.8, w * 0.28), 4), mat(color));
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI * 0.25 + rot;
    mesh.scale.set(w / span, 1, d / span);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function building({ x, z, w, d, h, body, roofColor, rot = 0, level = 4.15 }) {
    box(w, h, d, body, x, level + h * 0.5, z, rot);
    roof(w * 1.08, d * 1.08, roofColor, x, level + h + 1.15, z, rot);
  }

  function treeMass(x, z, s = 1, level = 1.75) {
    cylinder(0.24 * s, 0.3 * s, 1.7 * s, 0x80644c, x, level + 0.85 * s, z, 10);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * s, 1), mat(C.foliage));
    crown.position.set(x, level + 2.25 * s, z);
    crown.scale.set(1.05, 1.2, 1.05);
    crown.castShadow = true;
    scene.add(crown);
  }

  function stairs(x, z, w, length, steps, lowY, rise) {
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(1, steps - 1);
      const pz = z + (t - 0.5) * length;
      box(w, 0.24, length / steps * 0.94, C.stone, x, lowY + t * rise, pz);
    }
  }

  function railTrack(z) {
    box(58, 0.17, 0.18, C.rail, -19, 7.35, z, -0.025);
    box(58, 0.17, 0.18, C.rail, -19, 7.35, z + 1.15, -0.025);
    for (let i = 0; i < 24; i++) {
      box(0.22, 0.12, 1.7, 0x725c49, -47 + i * 2.45, 7.18, z + 0.58, -0.025);
    }
  }

  const waterUniforms = {
    uTime: { value: 0 },
    uA: { value: new THREE.Color(C.waterDeep) },
    uB: { value: new THREE.Color(C.water) }
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
      uniform vec3 uA;
      uniform vec3 uB;
      varying vec2 vUv;
      void main() {
        float w1 = sin(vUv.x * 48.0 + uTime * 0.45) * 0.5 + 0.5;
        float w2 = sin(vUv.y * 70.0 - uTime * 0.62 + vUv.x * 9.0) * 0.5 + 0.5;
        vec3 c = mix(uA, uB, 0.44 + vUv.y * 0.25 + w1 * 0.035 + w2 * 0.025);
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });

  const water = new THREE.Mesh(new THREE.PlaneGeometry(180, 160), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(10, -0.25, 20);
  scene.add(water);

  const base = [
    [-60,-48],[-25,-52],[5,-51],[30,-47],[50,-37],[57,-23],[55,-9],[47,0],[39,6],[32,12],
    [29,20],[34,27],[44,31],[51,38],[50,46],[43,54],[32,59],[22,56],[15,50],[10,45],[3,43],
    [-5,45],[-16,51],[-29,54],[-41,51],[-51,43],[-57,31],[-61,15],[-62,-5],[-62,-27]
  ];
  prism(base, -0.15, 1.05, C.cliff);

  const low = [
    [-57,-45],[-27,-49],[3,-48],[27,-44],[46,-35],[52,-22],[50,-10],[42,-1],[35,5],[28,12],
    [26,20],[31,27],[41,31],[47,37],[46,43],[40,49],[32,53],[23,51],[17,46],[11,42],[3,40],
    [-5,42],[-17,48],[-29,50],[-40,47],[-49,40],[-54,29],[-57,14],[-58,-4],[-58,-24]
  ];
  prism(low, 1.0, 1.75, C.grassLow);

  const mid = [
    [-55,-42],[-30,-45],[-5,-45],[18,-42],[33,-35],[37,-25],[34,-16],[26,-10],[17,-4],[11,4],
    [8,14],[2,20],[-8,24],[-18,29],[-31,30],[-43,26],[-51,17],[-54,4]
  ];
  prism(mid, 1.73, 4.15, C.grassMid);

  const high = [
    [-54,-41],[-29,-44],[-3,-43],[20,-39],[30,-32],[31,-24],[25,-17],[15,-14],[4,-15],
    [-9,-17],[-22,-15],[-35,-13],[-46,-18],[-52,-28]
  ];
  prism(high, 4.12, 7.0, C.grassHigh);

  const beach = [
    [31,-8],[40,-7],[48,-2],[53,6],[54,15],[51,23],[47,28],[43,31],[37,29],[32,24],
    [30,17],[28,10],[28,2]
  ];
  prism(beach, 0.75, 1.35, C.sand);

  const cape = [
    [28,34],[36,34],[44,38],[50,45],[51,53],[46,61],[38,66],[28,64],[20,59],[17,52],[20,44]
  ];
  prism(cape, 0.3, 1.3, C.cliffLight);
  prism([[23,38],[32,37],[41,41],[46,47],[46,54],[41,59],[33,62],[26,59],[22,54],[21,46]], 1.28, 1.72, C.grassLow);

  railTrack(-35.2);
  ribbon([[-61,-31],[-49,-31],[-38,-30],[-26,-29],[-14,-29],[0,-30],[17,-32],[28,-34]], 4.8, 7.1, C.road);
  ribbon([[-40,-26],[-36,-19],[-31,-12],[-25,-6],[-19,-1]], 2.3, 4.3, C.road);
  ribbon([[-22,-4],[-12,-6],[-3,-5],[6,-1],[13,5],[17,12]], 2.7, 4.3, C.road);
  ribbon([[-28,7],[-18,10],[-8,13],[2,14],[11,13],[19,10]], 2.6, 4.3, C.road);
  ribbon([[-13,22],[-6,24],[2,25],[9,23],[15,20]], 2.2, 1.9, C.road);

  stairs(-33, -17, 4.2, 8.5, 8, 4.1, 2.6);
  stairs(6, 1, 4.2, 8.5, 8, 4.1, 2.6);
  stairs(15, 17, 4.0, 7.5, 7, 1.7, 2.3);

  building({ x:-38, z:-27, w:10.5, d:6.4, h:4.4, body:C.station, roofColor:C.blue, level:7.0 });
  box(4.7, 0.45, 0.65, 0x7d6a57, -51, 9.5, -28.5, 0.06);
  box(0.3, 3.0, 0.3, 0x695b4c, -53.1, 8.1, -28.5);
  building({ x:-8, z:-27, w:6.2, d:5.2, h:3.6, body:C.cottage, roofColor:C.blue, rot:-0.08, level:7.0 });
  building({ x:4, z:-26, w:6.4, d:5.2, h:3.6, body:C.cottage, roofColor:C.red, rot:0.1, level:7.0 });

  building({ x:-36, z:-8, w:10.5, d:7.0, h:5.0, body:C.inn, roofColor:C.blue });
  building({ x:-22, z:-7, w:6.3, d:5.4, h:3.8, body:C.dessert, roofColor:C.red });
  building({ x:-10, z:-5, w:7.2, d:5.8, h:4.0, body:C.general, roofColor:C.green });
  building({ x:-34, z:8, w:9.2, d:6.8, h:4.3, body:C.cafe, roofColor:C.blue });
  building({ x:-20, z:10, w:8.8, d:6.4, h:4.3, body:C.seafood, roofColor:C.blue });
  building({ x:-7, z:12, w:7.0, d:5.7, h:3.7, body:C.rental, roofColor:C.blue });

  cylinder(9.2, 9.2, 0.32, C.plaza, 4, 4.35, 9, 48);
  cylinder(3.0, 3.6, 0.6, C.stone, 4, 4.72, 9, 40);
  cylinder(2.15, 2.15, 0.34, 0x87c3cf, 4, 5.15, 9, 40);
  cylinder(0.45, 0.6, 2.2, C.stone, 4, 6.3, 9, 20);

  ribbon([[-43,23],[-33,25],[-22,26],[-12,27],[-2,28],[8,28],[17,29],[25,31]], 3.0, 1.88, C.wood);
  ribbon([[25,31],[30,34],[34,38]], 2.7, 1.88, C.wood);

  ribbon([[27,-2],[31,4],[34,10],[35,17],[34,23]], 1.8, 1.47, C.road);
  cylinder(2.3, 2.6, 0.16, 0x74c9d7, 38, 1.48, 8, 28);
  cylinder(1.6, 1.9, 0.15, 0x74c9d7, 43, 1.48, 15, 26);
  cylinder(1.15, 1.4, 0.13, 0x74c9d7, 36, 1.48, 20, 24);

  ribbon([[27,23],[34,24],[41,24],[48,23]], 3.0, 1.72, C.wood);
  box(8.0, 0.35, 5.0, C.wood, 51, 1.72, 23, 0.03);
  building({ x:45, z:18, w:6.2, d:4.6, h:3.2, body:C.station, roofColor:C.blue, rot:0.03, level:1.75 });
  box(5.0, 0.75, 1.8, 0xe9e6da, 49, 0.75, 28, -0.12);
  box(3.8, 0.65, 1.5, 0xe9e6da, 55, 0.72, 20, 0.08);

  ribbon([[34,38],[33,43],[31,48],[30,53]], 2.2, 1.85, C.road);
  cylinder(1.8, 2.35, 9.2, C.lighthouse, 34, 6.3, 52, 24);
  cylinder(2.1, 2.1, 0.8, C.red, 34, 11.2, 52, 24);
  cylinder(1.3, 1.3, 1.25, 0x8fc1cc, 34, 12.25, 52, 20);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.6, 24), mat(C.red));
  top.position.set(34, 13.65, 52);
  top.castShadow = true;
  scene.add(top);

  const trees = [
    [-52,-18,1.2,4.15],[-47,-13,1.0,4.15],[-45,-2,1.1,4.15],[-44,8,1.2,4.15],[-40,17,1.0,4.15],[-31,18,0.9,4.15],
    [-18,-16,0.9,7.0],[-3,-17,1.0,7.0],[11,-18,1.0,7.0],[20,-15,1.1,7.0],[24,-8,1.0,4.15],
    [20,2,0.9,4.15],[22,10,1.0,4.15],[18,20,0.95,1.75],[11,24,0.8,1.75],[-3,25,0.8,1.75],
    [44,-2,0.8,1.35],[49,5,0.9,1.35],[47,29,0.9,1.75],[43,34,0.8,1.75],[27,44,0.8,1.72],[41,57,0.9,1.72]
  ];
  for (const [x,z,s,level] of trees) treeMass(x,z,s,level);

  for (let i = 0; i < 8; i++) {
    box(0.18, 1.1, 0.18, 0x7a624f, 22 + i * 2.1, 2.35, 34 + i * 0.45);
    if (i < 7) box(2.2, 0.16, 0.16, 0x8a6d54, 23 + i * 2.1, 2.55, 34.2 + i * 0.45, 0.2);
  }

  const islandMat = mat(0x769b7c);
  for (const [x,z,s] of [[-28,78,1.0],[8,81,0.85],[45,76,1.1]]) {
    const island = new THREE.Mesh(new THREE.ConeGeometry(5.5 * s, 3.3 * s, 7), islandMat);
    island.position.set(x, 1.2, z);
    island.scale.y = 0.6;
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
    camera.zoom = aspect < 0.75 ? 0.57 : aspect < 1 ? 0.72 : 0.92;
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
