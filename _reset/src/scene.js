export function createIsland3D(THREE, OrbitControls, app) {
  app.innerHTML = '';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8f2);
  scene.fog = new THREE.Fog(0xbfe8f2, 260, 980);

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
  controls.minDistance = 35;
  controls.maxDistance = 460;
  controls.target.set(0, 9, 0);
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

  const hemi = new THREE.HemisphereLight(0xfffdf7, 0x64717c, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffefd8, 3.0);
  sun.position.set(-95, 135, -75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -170;
  sun.shadow.camera.right = 170;
  sun.shadow.camera.top = 170;
  sun.shadow.camera.bottom = -170;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const COLORS = {
    ocean: new THREE.Color(0x49b9dc),
    oceanDeep: new THREE.Color(0x2f9ec8),
    grass: new THREE.Color(0x96c978),
    highGrass: new THREE.Color(0xa9d984),
    cliff: new THREE.Color(0x76808d),
    cliffLight: new THREE.Color(0x8d97a3),
    sand: new THREE.Color(0xf2d59d)
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
      roughness: 0.86,
      metalness: 0
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  scene.add(water);

  // ------------------------------------------------------------------
  // Island3D v1
  //
  // One continuous island mesh.
  // No stacked platforms, no separate "middle/upper slabs".
  //
  // Coordinate convention:
  //   -Z = rear / station side
  //   +Z = front / open sea
  //   +X = beach side
  //
  // The right-side beach is part of this same footprint.
  // ------------------------------------------------------------------

  const coastline = [
    [-68,-48],[-56,-55],[-39,-59],[-20,-61],[1,-60],[21,-56],
    [37,-50],[48,-42],[54,-33],[54,-25],[50,-18],[44,-13],
    [41,-9],[45,-5],[53,0],[60,7],[64,15],[65,23],
    [62,31],[56,38],[47,43],[34,47],[18,49],[-1,49],
    [-20,46],[-38,41],[-52,34],[-62,25],[-68,14],[-71,1],
    [-72,-14],[-71,-30],[-70,-41]
  ];

  const MIN_X = -76;
  const MAX_X = 70;
  const MIN_Z = -65;
  const MAX_Z = 54;
  const STEP = 2.0;

  const MAIN_H = 10.8;
  const HIGH_H = 22.5;
  const BEACH_H = 1.15;

  function smoothstep(a, b, value) {
    const t = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function rangeMask(value, min, max, feather) {
    return smoothstep(min - feather, min + feather, value) *
      (1 - smoothstep(max - feather, max + feather, value));
  }

  function pointInPolygon(x, z, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1];
      const xj = poly[j][0], zj = poly[j][1];
      const intersects =
        ((zi > z) !== (zj > z)) &&
        (x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-9) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function heightAt(x, z) {
    // Large central/main plain.
    let h = MAIN_H;

    // Rear highland is part of the SAME mesh.
    // It becomes flat at the rear, with a steep transition into the main plain.
    const rear = 1 - smoothstep(-29, -18, z);
    const leftTaper = smoothstep(-70, -58, x);
    const rightTaper = 1 - smoothstep(35, 49, x);
    const highland = rear * leftTaper * rightTaper;
    h = THREE.MathUtils.lerp(h, HIGH_H, highland);

    // Right-side beach bay, also part of the SAME mesh.
    // Main plain remains high inland, then drops sharply toward the beach.
    const beachZ = rangeMask(z, -11, 33, 6);
    const beachX = smoothstep(34, 43, x);
    const beach = beachX * beachZ;
    h = THREE.MathUtils.lerp(h, BEACH_H, beach);

    // Slightly soften the extreme shoreline so the island does not look cut by a knife.
    const frontSoft = smoothstep(43, 49, z);
    h -= frontSoft * 0.6;

    return h;
  }

  function colorAt(x, z) {
    const h = heightAt(x, z);
    const eps = 0.65;
    const dx = (heightAt(x + eps, z) - heightAt(x - eps, z)) / (eps * 2);
    const dz = (heightAt(x, z + eps) - heightAt(x, z - eps)) / (eps * 2);
    const slope = Math.hypot(dx, dz);

    if (h < 3.0) return COLORS.sand;
    if (slope > 0.78) return COLORS.cliff;
    if (h > 17.5) return COLORS.highGrass;
    return COLORS.grass;
  }

  const positions = [];
  const colors = [];

  function pushVertex(x, y, z, color) {
    positions.push(x, y, z);
    colors.push(color.r, color.g, color.b);
  }

  function pushTopTriangle(ax, az, bx, bz, cx, cz) {
    const mx = (ax + bx + cx) / 3;
    const mz = (az + bz + cz) / 3;
    if (!pointInPolygon(mx, mz, coastline)) return;

    const ah = heightAt(ax, az);
    const bh = heightAt(bx, bz);
    const ch = heightAt(cx, cz);

    pushVertex(ax, ah, az, colorAt(ax, az));
    pushVertex(bx, bh, bz, colorAt(bx, bz));
    pushVertex(cx, ch, cz, colorAt(cx, cz));
  }

  // Terrain surface grid.
  for (let x = MIN_X; x < MAX_X; x += STEP) {
    for (let z = MIN_Z; z < MAX_Z; z += STEP) {
      pushTopTriangle(
        x, z,
        x + STEP, z,
        x + STEP, z + STEP
      );
      pushTopTriangle(
        x, z,
        x + STEP, z + STEP,
        x, z + STEP
      );
    }
  }

  // Coastline skirt, part of the same BufferGeometry.
  // This turns the height-field surface into a solid-looking island volume.
  const skirtBottom = 0.15;
  const coastSamples = [];

  for (let i = 0; i < coastline.length; i++) {
    const a = coastline[i];
    const b = coastline[(i + 1) % coastline.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const count = Math.max(1, Math.ceil(len / 2.4));

    for (let s = 0; s < count; s++) {
      const t = s / count;
      coastSamples.push([
        THREE.MathUtils.lerp(a[0], b[0], t),
        THREE.MathUtils.lerp(a[1], b[1], t)
      ]);
    }
  }

  const cliffSideColor = COLORS.cliffLight;
  for (let i = 0; i < coastSamples.length; i++) {
    const a = coastSamples[i];
    const b = coastSamples[(i + 1) % coastSamples.length];
    const ay = heightAt(a[0], a[1]);
    const by = heightAt(b[0], b[1]);

    pushVertex(a[0], ay, a[1], cliffSideColor);
    pushVertex(a[0], skirtBottom, a[1], cliffSideColor);
    pushVertex(b[0], skirtBottom, b[1], cliffSideColor);

    pushVertex(a[0], ay, a[1], cliffSideColor);
    pushVertex(b[0], skirtBottom, b[1], cliffSideColor);
    pushVertex(b[0], by, b[1], cliffSideColor);
  }

  const islandGeometry = new THREE.BufferGeometry();
  islandGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  islandGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );
  islandGeometry.computeVertexNormals();
  islandGeometry.computeBoundingSphere();

  const islandMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const island = new THREE.Mesh(islandGeometry, islandMaterial);
  island.castShadow = true;
  island.receiveShadow = true;
  scene.add(island);

  // Simple UI only for inspecting the island itself.
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
    const distance = aspect < 0.62 ? 285 : aspect < 0.85 ? 245 : 215;
    const dir = new THREE.Vector3(0.62, 0.55, 0.72).normalize();
    controls.target.set(0, 9, 0);
    camera.position.copy(controls.target).addScaledVector(dir, distance);
    controls.update();
  }

  addButton('默认', setDefaultView);

  addButton('俯视', () => {
    controls.target.set(0, 8, 0);
    camera.position.set(0.2, 190, 0.2);
    controls.update();
  });

  addButton('侧视', () => {
    controls.target.set(0, 9, 0);
    camera.position.set(155, 18, 12);
    controls.update();
  });

  let wireframe = false;
  const wireButton = addButton('网格', () => {
    wireframe = !wireframe;
    islandMaterial.wireframe = wireframe;
    wireButton.textContent = wireframe ? '实体' : '网格';
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
    island,
    islandGeometry
  };
}
