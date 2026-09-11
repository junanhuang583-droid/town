import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const app = document.querySelector('#app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9ddf7);
scene.fog = new THREE.Fog(0xbfe8f5, 62, 125);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
app.appendChild(renderer.domElement);

const frustum = 38;
const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 220);
camera.position.set(34, 30, 38);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 1.5);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minZoom = 0.62;
controls.maxZoom = 2.2;
controls.minPolarAngle = THREE.MathUtils.degToRad(38);
controls.maxPolarAngle = THREE.MathUtils.degToRad(66);
controls.minAzimuthAngle = THREE.MathUtils.degToRad(-24);
controls.maxAzimuthAngle = THREE.MathUtils.degToRad(104);
controls.zoomToCursor = true;

const hemi = new THREE.HemisphereLight(0xeafaff, 0x9e8061, 2.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3d7, 3.1);
sun.position.set(-26, 42, -28);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48;
sun.shadow.camera.bottom = -48;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.00025;
scene.add(sun);

const palette = {
  ink: 0x5a6570,
  grass: 0x8fcf8e,
  cliff: 0xc5b69e,
  sand: 0xf4dca7,
  sand2: 0xeccf90,
  road: 0x60717a,
  sidewalk: 0xe7d9c0,
  wood: 0xa9724c,
  woodDark: 0x76513b,
  white: 0xf9f3e7,
  blue: 0x6eb9df,
  coral: 0xe98670,
  yellow: 0xf1c766,
  teal: 0x64b9aa,
  pink: 0xeaa0b1,
  red: 0xcf5f55,
  roofBlue: 0x6f9fc1,
  roofOrange: 0xd98357,
  roofMint: 0x77ad9f,
  roofRose: 0xc98491
};

const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, ...opts });
const flat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02, flatShading: true, ...opts });
const edgeMat = new THREE.LineBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.32 });

function shadowify(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addEdges(mesh, opacity = 0.24) {
  const mat = edgeMat.clone();
  mat.opacity = opacity;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 24), mat);
  edges.renderOrder = 3;
  mesh.add(edges);
  return mesh;
}

function box(w, h, d, color, x, y, z, opts = {}) {
  const mesh = shadowify(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.toon === false ? flat(color) : toon(color)));
  mesh.position.set(x, y, z);
  if (opts.rotateY) mesh.rotation.y = opts.rotateY;
  if (opts.edges !== false) addEdges(mesh, opts.edgeOpacity ?? 0.2);
  scene.add(mesh);
  return mesh;
}

function cylinder(rTop, rBottom, h, color, x, y, z, segments = 24, opts = {}) {
  const mesh = shadowify(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), opts.toon === false ? flat(color) : toon(color)));
  mesh.position.set(x, y, z);
  if (opts.edges) addEdges(mesh, 0.18);
  scene.add(mesh);
  return mesh;
}

function sphere(r, color, x, y, z, sx = 1, sy = 1, sz = 1) {
  const mesh = shadowify(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), toon(color)));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  scene.add(mesh);
  return mesh;
}

function house({ x, z, w = 4.2, d = 3.5, h = 3.1, wall = palette.white, roofColor = palette.roofBlue, rotation = 0, awning = null }) {
  const baseY = 1.55;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);

  const wallMesh = shadowify(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(wall)));
  wallMesh.position.y = baseY + h / 2;
  addEdges(wallMesh, 0.2);
  group.add(wallMesh);

  const rGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.8, 4);
  const r = shadowify(new THREE.Mesh(rGeom, toon(roofColor)));
  r.position.y = baseY + h + 0.85;
  r.rotation.y = Math.PI / 4;
  r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  addEdges(r, 0.2);
  group.add(r);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.55, 0.09), toon(0x8b6b58));
  door.position.set(0, baseY + 0.78, d / 2 + 0.05);
  addEdges(door, 0.32);
  group.add(door);

  for (const wx of [-w * 0.28, w * 0.28]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.8, 0.09), toon(0x86c8df));
    win.position.set(wx, baseY + h * 0.58, d / 2 + 0.06);
    addEdges(win, 0.32);
    group.add(win);
  }

  if (awning) {
    const awn = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, 0.16, 0.9), toon(awning));
    awn.position.set(0, baseY + 1.95, d / 2 + 0.43);
    awn.rotation.x = -0.18;
    addEdges(awn, 0.22);
    group.add(awn);
  }

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.15, 0.45), toon(0xd6c0a5));
  chimney.position.set(w * 0.24, baseY + h + 0.8, -d * 0.12);
  addEdges(chimney, 0.18);
  group.add(chimney);
  return group;
}

function tree(x, z, size = 1, leaf = 0x71b97a) {
  cylinder(0.18 * size, 0.23 * size, 1.8 * size, 0x8b6546, x, 2.35 * size, z, 10);
  sphere(1.05 * size, leaf, x - 0.35 * size, 3.55 * size, z, 1, 0.95, 1);
  sphere(0.9 * size, leaf, x + 0.55 * size, 3.7 * size, z + 0.1 * size, 1, 1, 1);
  sphere(0.82 * size, 0x8acc86, x + 0.05 * size, 4.15 * size, z - 0.15 * size, 1, 1, 1);
}

function flowerPatch(x, z, radius = 2.2, count = 18) {
  const colors = [0xf28c9b, 0xf4cf67, 0xf7f2de, 0x9ac8ef, 0xc89be7];
  for (let i = 0; i < count; i++) {
    const a = (i * 2.399963) % (Math.PI * 2);
    const r = radius * Math.sqrt((i + 1) / count) * 0.86;
    const px = x + Math.cos(a) * r;
    const pz = z + Math.sin(a) * r;
    cylinder(0.025, 0.025, 0.28, 0x5b9e68, px, 1.76, pz, 6, { edges: false });
    sphere(0.1, colors[i % colors.length], px, 1.95, pz);
  }
}

function lamp(x, z, h = 2.6) {
  cylinder(0.06, 0.08, h, 0x364957, x, 1.55 + h / 2, z, 8);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe7ac, emissive: 0xffc65f, emissiveIntensity: 0.8 }));
  glow.position.set(x, 1.55 + h, z);
  scene.add(glow);
}

function bench(x, z, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, 1.62, z);
  g.rotation.y = rot;
  scene.add(g);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.5), toon(palette.wood));
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.14), toon(palette.wood));
  back.position.set(0, 0.8, -0.2);
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), toon(palette.woodDark));
  leg1.position.set(-0.55, 0.2, 0);
  const leg2 = leg1.clone();
  leg2.position.x = 0.55;
  [seat, back, leg1, leg2].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
}

function boardwalk(x, z, w, d) {
  const base = box(w, 0.24, d, palette.wood, x, 1.73, z, { edgeOpacity: 0.13 });
  const count = Math.floor(w / 0.7);
  for (let i = 0; i < count; i++) {
    const px = x - w / 2 + (i + 0.5) * (w / count);
    box(0.028, 0.015, d * 0.94, 0x79543e, px, 1.86, z, { edges: false });
  }
  return base;
}

function rail(x, z, length, alongX = true) {
  const step = 1.6;
  const n = Math.floor(length / step);
  for (let i = 0; i <= n; i++) {
    const t = -length / 2 + (i / n) * length;
    const px = x + (alongX ? t : 0);
    const pz = z + (alongX ? 0 : t);
    cylinder(0.045, 0.055, 1.0, palette.woodDark, px, 2.25, pz, 8);
  }
  box(alongX ? length : 0.09, 0.08, alongX ? 0.09 : length, palette.woodDark, x, 2.65, z, { edges: false });
  box(alongX ? length : 0.07, 0.06, alongX ? 0.07 : length, palette.woodDark, x, 2.28, z, { edges: false });
}

const waterUniforms = { uTime: { value: 0 }, uDeep: { value: new THREE.Color(0x2b9fcb) }, uShallow: { value: new THREE.Color(0x65cee0) } };
const waterMat = new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uDeep;
    uniform vec3 uShallow;
    varying vec2 vUv;
    void main(){
      float bands = sin((vUv.y * 58.0) + sin(vUv.x * 12.0) * 2.0 + uTime * 0.8) * 0.5 + 0.5;
      float ripples = sin((vUv.x * 48.0) + uTime * 1.25) * sin((vUv.y * 44.0) - uTime * 1.0);
      float shore = smoothstep(0.1, 0.72, 1.0 - vUv.y);
      vec3 c = mix(uDeep, uShallow, vUv.y * 0.62 + bands * 0.06);
      c += vec3(0.16, 0.22, 0.19) * max(ripples, 0.0) * 0.12;
      c += vec3(0.14, 0.18, 0.17) * shore * 0.13;
      gl_FragColor = vec4(c, 1.0);
    }`
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 78), waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(0, -0.06, 32);
scene.add(water);

box(44, 2.8, 29, palette.cliff, 0, 0.15, -4.5, { toon: false, edgeOpacity: 0.13 });
box(43.4, 0.35, 28.4, palette.grass, 0, 1.72, -4.5, { edges: false });
box(44, 0.55, 11.5, palette.sand2, 0, 0.12, 15.5, { toon: false, edgeOpacity: 0.08 });
box(43.5, 0.22, 11.1, palette.sand, 0, 0.5, 15.5, { edges: false });

box(48, 0.14, 4.5, palette.road, 0, 1.98, -16.2, { toon: false, edges: false });
box(48, 0.1, 1.2, palette.sidewalk, 0, 2.02, -13.45, { edges: false });
for (let x = -20; x <= 20; x += 4) box(1.7, 0.025, 0.12, 0xf7e9c6, x, 2.07, -16.2, { edges: false });

box(7.0, 0.25, 2.0, palette.roofBlue, -10.5, 4.15, -13.0, { edgeOpacity: 0.18 });
for (const x of [-13.2, -7.8]) cylinder(0.07, 0.08, 2.2, 0x485b67, x, 3.05, -13.0, 8);
bench(-10.5, -12.7, Math.PI);
box(0.22, 2.3, 0.22, 0x485b67, -5.7, 3.1, -13.0, { edges: false });
box(1.2, 0.72, 0.08, palette.blue, -5.7, 3.75, -13.0, { edgeOpacity: 0.16 });

box(6.4, 0.08, 13.2, 0xe6d4b3, -4.2, 1.98, -6.6, { toon: false, edges: false, rotateY: 0.06 });
box(24, 0.08, 5.2, 0xe5d2af, -3.0, 1.99, 0.5, { toon: false, edges: false });

house({ x: -15.2, z: -8.9, w: 4.8, d: 4.2, wall: 0xfff2d7, roofColor: palette.roofBlue, rotation: 0.05, awning: palette.yellow });
house({ x: -9.5, z: -7.7, w: 4.2, d: 3.7, wall: 0xf8e3e6, roofColor: palette.roofRose, rotation: -0.06, awning: palette.pink });
house({ x: -2.9, z: -9.3, w: 4.5, d: 3.8, wall: 0xe9f2dc, roofColor: palette.roofMint, rotation: 0.03, awning: palette.teal });
house({ x: 4.0, z: -7.2, w: 5.0, d: 4.1, wall: 0xffedd2, roofColor: palette.roofOrange, rotation: -0.04 });
house({ x: 10.4, z: -6.2, w: 4.3, d: 3.5, wall: 0xe2eff7, roofColor: palette.roofBlue, rotation: 0.06 });
house({ x: -14.1, z: 5.8, w: 4.0, d: 3.4, wall: 0xf7e6ce, roofColor: palette.roofOrange, rotation: 0.08 });
house({ x: 4.1, z: 6.0, w: 4.3, d: 3.6, wall: 0xf6e2d9, roofColor: palette.roofRose, rotation: -0.06 });

cylinder(7.2, 7.2, 0.18, 0xe8d8bd, -3.4, 2.0, 1.4, 48, { toon: false });
cylinder(2.05, 2.25, 0.35, 0xd5c5ad, -3.4, 2.2, 1.4, 32, { edges: true });
cylinder(1.15, 1.35, 0.55, 0xe4d7c4, -3.4, 2.57, 1.4, 28, { edges: true });
cylinder(0.22, 0.38, 1.35, 0xd8c8b1, -3.4, 3.25, 1.4, 20);
const fountainTop = sphere(0.32, 0xd5f1f7, -3.4, 4.0, 1.4, 1, 1.25, 1);
fountainTop.material.transparent = true;
fountainTop.material.opacity = 0.82;
for (const [x,z,r] of [[-8.8,2.2,0.1], [2.0,2.7,-0.1], [-5.8,6.4,0], [0.7,-1.6,Math.PI]]) bench(x, z, r);
for (const [x,z] of [[-9.1,-1.6], [2.1,-2.0], [-8.9,6.0], [1.6,6.4]]) lamp(x, z);
flowerPatch(-10.8, 4.2, 1.7, 16);
flowerPatch(0.8, 4.7, 1.5, 14);

for (const t of [[-19,-11,1.0],[-17,-3,0.9],[15,-11,1.05],[17,-7,0.9],[13,5,0.8],[-18,8,0.8],[8,-12,0.75],[17,7,0.85]]) tree(t[0], t[1], t[2]);

boardwalk(0, 9.45, 39, 2.5);
rail(0, 10.62, 37.5, true);
for (let x = -17; x <= 17; x += 5.5) {
  lamp(x, 8.95, 2.35);
  if (Math.abs(x) > 3) bench(x + 0.6, 9.05, 0);
}

boardwalk(10.8, 15.8, 3.0, 13.7);
rail(9.38, 15.8, 12.8, false);
rail(12.22, 15.8, 12.8, false);
for (let z = 10.0; z <= 21.5; z += 3.0) {
  cylinder(0.11, 0.13, 2.1, palette.woodDark, 9.55, 0.8, z, 10);
  cylinder(0.11, 0.13, 2.1, palette.woodDark, 12.05, 0.8, z, 10);
}
box(2.4, 0.18, 2.6, palette.roofBlue, 10.8, 4.1, 13.6, { edgeOpacity: 0.18 });
for (const x of [9.85, 11.75]) for (const z of [12.7, 14.5]) cylinder(0.05, 0.06, 2.2, 0x526471, x, 3.0, z, 8);

function umbrella(x, z, color) {
  cylinder(0.035, 0.05, 1.5, 0x8d765d, x, 1.3, z, 8);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.45, 24), toon(color));
  cap.position.set(x, 2.15, z);
  cap.rotation.y = 0.12;
  cap.castShadow = true;
  scene.add(cap);
}
umbrella(-9.7, 15.1, palette.blue);
umbrella(-4.4, 17.2, palette.coral);
bench(-9.5, 17.1, -0.08);
bench(-4.0, 19.0, 0.1);

const rockColors = [0xa28f7b, 0x8f8378, 0xb5a38d];
for (let i = 0; i < 25; i++) {
  const x = 3.5 + ((i * 7.1) % 16);
  const z = 17.8 + ((i * 4.7) % 8.2);
  const r = 0.35 + ((i * 0.17) % 0.55);
  sphere(r, rockColors[i % rockColors.length], x, 0.75 + r * 0.35, z, 1.2, 0.7, 1);
}
for (const [x,z,r] of [[7,20.0,1.9],[13.7,22.6,1.5],[18.2,19.2,1.2]]) {
  const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshToonMaterial({ color: 0x78d6df, transparent: true, opacity: 0.78 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.66, z);
  scene.add(pool);
}

const foam = [];
for (let i = 0; i < 5; i++) {
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(34 - i * 2.6, 0.22), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 - i * 0.045 }));
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(-4 + i * 0.7, 0.045, 22.8 + i * 1.25);
  scene.add(stripe);
  foam.push(stripe);
}

cylinder(5.0, 6.2, 4.0, 0xb8a58d, 17.1, 1.55, 4.0, 18, { toon: false, edges: true });
cylinder(4.7, 4.7, 0.35, 0x7fb878, 17.1, 3.72, 4.0, 20);
cylinder(1.45, 1.75, 7.2, 0xf6efe1, 17.1, 7.45, 4.0, 24, { edges: true });
cylinder(1.6, 1.6, 0.55, palette.red, 17.1, 11.15, 4.0, 24, { edges: true });
cylinder(0.95, 0.95, 1.25, 0x82bed2, 17.1, 12.0, 4.0, 18, { edges: true });
const topCone = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.3, 24), toon(palette.red));
topCone.position.set(17.1, 13.3, 4.0);
topCone.castShadow = true;
scene.add(topCone);
for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
  const x = 17.1 + Math.cos(a) * 1.62;
  const z = 4.0 + Math.sin(a) * 1.62;
  cylinder(0.025, 0.03, 0.8, 0x455764, x, 11.7, z, 6);
}
for (let i = 0; i < 8; i++) box(1.7, 0.22, 0.85, 0xd5c2a7, 12.7 + i * 0.48, 2.0 + i * 0.22, 4.6 + i * 0.02, { toon: false, edgeOpacity: 0.1 });

flowerPatch(12.0, 8.0, 1.7, 16);
flowerPatch(18.6, -0.2, 1.45, 12);
flowerPatch(-18.0, 1.8, 1.7, 16);

const islandMat = toon(0x78a987);
for (const [x,z,s] of [[-24,45,2.6],[-12,49,3.1],[4,48,2.2],[23,46,3.0]]) {
  const island = new THREE.Mesh(new THREE.ConeGeometry(5 * s, 6 * s, 7), islandMat);
  island.position.set(x, 1.2, z);
  island.scale.y = 0.42;
  scene.add(island);
}

for (let x = -21; x <= 21; x += 2.1) sphere(0.62, x % 4.2 === 0 ? 0x75b975 : 0x84c481, x, 2.35, -12.6, 1.15, 0.72, 0.9);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  camera.left = -frustum * aspect / 2;
  camera.right = frustum * aspect / 2;
  camera.top = frustum / 2;
  camera.bottom = -frustum / 2;
  camera.zoom = aspect < 0.8 ? 0.72 : 0.92;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  waterUniforms.uTime.value = t;
  foam.forEach((f, i) => {
    f.position.z = 22.8 + i * 1.25 + Math.sin(t * 0.6 + i * 0.9) * 0.16;
    f.material.opacity = 0.25 + Math.sin(t * 0.8 + i) * 0.06 + (4 - i) * 0.025;
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();
