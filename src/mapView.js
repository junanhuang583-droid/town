export function mountMap(app) {
  app.innerHTML = '';

  const viewport = document.createElement('div');
  viewport.className = 'map-viewport';

  const stage = document.createElement('div');
  stage.className = 'map-stage';

  const img = document.createElement('img');
  img.className = 'map-image';
  img.alt = '海边度假小镇地图';
  img.draggable = false;
  img.src = location.pathname.endsWith('preview.html') ? './public/seaside-map.svg' : './seaside-map.svg';

  stage.appendChild(img);
  viewport.appendChild(stage);
  app.appendChild(viewport);

  const MAP_W = 1800;
  const MAP_H = 1180;
  let scale = 1;
  let minScale = 0.2;
  const maxScale = 2.4;
  let x = 0;
  let y = 0;
  let dragging = false;
  let dragId = null;
  let lastX = 0;
  let lastY = 0;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  const pointers = new Map();

  function clampPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = MAP_W * scale;
    const sh = MAP_H * scale;
    const margin = Math.min(vw, vh) * 0.14;

    x = sw <= vw ? (vw - sw) / 2 : Math.min(margin, Math.max(vw - sw - margin, x));
    y = sh <= vh ? (vh - sh) / 2 : Math.min(margin, Math.max(vh - sh - margin, y));
  }

  function render() {
    clampPan();
    stage.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')';
  }

  function fitMap() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const fit = Math.min(vw / MAP_W, vh / MAP_H) * 0.965;
    minScale = Math.max(0.16, fit * 0.82);
    scale = fit;
    x = (vw - MAP_W * scale) / 2;
    y = (vh - MAP_H * scale) / 2;
    render();
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const worldX = (px - x) / scale;
    const worldY = (py - y) / scale;
    const next = Math.min(maxScale, Math.max(minScale, scale * factor));
    x = px - worldX * next;
    y = py - worldY * next;
    scale = next;
    render();
  }

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89);
  }, { passive: false });

  viewport.addEventListener('pointerdown', (e) => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      dragging = true;
      dragId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      viewport.classList.add('dragging');
    } else if (pointers.size === 2) {
      dragging = false;
      const pts = [...pointers.values()];
      pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartScale = scale;
    }
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const target = Math.min(maxScale, Math.max(minScale, pinchStartScale * (distance / pinchStartDistance)));
      zoomAt(cx, cy, target / scale);
      return;
    }

    if (dragging && e.pointerId === dragId) {
      x += e.clientX - lastX;
      y += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      render();
    }
  });

  function release(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDistance = 0;
    if (pointers.size === 0) {
      dragging = false;
      dragId = null;
      viewport.classList.remove('dragging');
    } else if (pointers.size === 1) {
      const [id, p] = pointers.entries().next().value;
      dragging = true;
      dragId = id;
      lastX = p.x;
      lastY = p.y;
    }
  }

  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  window.addEventListener('resize', fitMap);
  img.addEventListener('load', fitMap);
  requestAnimationFrame(fitMap);

  return { fitMap };
}
