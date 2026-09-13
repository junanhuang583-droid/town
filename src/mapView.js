import { TILE, createPixelAssets } from './pixelAssets.js';
import { buildTownMap } from './mapData.js';

export function mountMap(app) {
  app.innerHTML = '';

  const map = buildTownMap();
  const assets = createPixelAssets();
  const WORLD_W = map.width * TILE;
  const WORLD_H = map.height * TILE;

  const viewport = document.createElement('div');
  viewport.className = 'pixel-viewport';

  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-map';
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  canvas.setAttribute('aria-label', 'Pixel Town v0.2 海滨小镇地图');
  viewport.appendChild(canvas);
  app.appendChild(viewport);

  const hud = document.createElement('div');
  hud.className = 'pixel-hud';
  hud.innerHTML =
    '<b>Pixel Town v0.2</b>' +
    '<span>海滨小镇 · 美术升级版</span>';
  app.appendChild(hud);

  const controls = document.createElement('div');
  controls.className = 'pixel-controls';
  controls.innerHTML =
    '<button data-action="out" aria-label="缩小">−</button>' +
    '<button data-action="fit">全图</button>' +
    '<button data-action="in" aria-label="放大">＋</button>';
  app.appendChild(controls);

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  function hash(x, y, seed = 0) {
    let n = (x * 374761393 + y * 668265263 + seed * 1442695041) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function tileVariant(list, x, y, seed = 0) {
    if (!Array.isArray(list)) return list;
    const index = Math.floor(hash(x, y, seed) * list.length) % list.length;
    return list[index];
  }

  function tileAsset(type, x, y) {
    switch (type) {
      case 'water':
        return tileVariant(assets.tiles.water, x, y, 1);
      case 'grass':
        return tileVariant(assets.tiles.grass, x, y, 2);
      case 'grassHigh':
        return tileVariant(assets.tiles.grassHigh, x, y, 3);
      case 'grassLow':
        return tileVariant(assets.tiles.grassLow, x, y, 4);
      case 'dirt':
        return tileVariant(assets.tiles.dirt, x, y, 5);
      case 'sand':
        return tileVariant(assets.tiles.sand, x, y, 6);
      case 'stone':
        return tileVariant(assets.tiles.stone, x, y, 7);
      case 'board':
        return tileVariant(assets.tiles.board, x, y, 8);
      case 'rail':
        return assets.tiles.rail;
      case 'stairs':
        return assets.tiles.stairs;
      default:
        return tileVariant(assets.tiles.water, x, y, 9);
    }
  }

  function drawGround() {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = tileAsset(map.ground[y][x], x, y);
        ctx.drawImage(tile, x * TILE, y * TILE);
      }
    }
  }

  function drawOverlay(item) {
    const sprite =
      item.type === 'cliff'
        ? assets.tiles.cliff[item.variant % assets.tiles.cliff.length]
        : assets.tiles.shore[item.variant % assets.tiles.shore.length];

    ctx.drawImage(sprite, item.x * TILE, item.y * TILE);
  }

  function spriteFootDraw(sprite, footX, footY, scale = 1) {
    const width = Math.round(sprite.width * scale);
    const height = Math.round(sprite.height * scale);
    const x = Math.round(footX * TILE - width / 2);
    const y = Math.round(footY * TILE - height);
    ctx.drawImage(sprite, x, y, width, height);
  }

  function renderWorld() {
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    drawGround();

    // Ground-attached cliff/foam overlays.
    for (const item of map.overlays) drawOverlay(item);

    // Sort every standing object by its ground contact Y.
    const drawables = [];

    for (const item of map.buildings) {
      const sprite = assets.buildings[item.type];
      if (!sprite) continue;
      drawables.push({
        sprite,
        x: item.x,
        y: item.y,
        scale: item.scale || 1,
        order: 0
      });
    }

    for (const item of map.objects) {
      const sprite = assets.decor[item.type];
      if (!sprite) continue;
      drawables.push({
        sprite,
        x: item.x,
        y: item.y,
        scale: item.scale || 1,
        order: 1
      });
    }

    drawables.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.order - b.order;
    });

    for (const item of drawables) {
      spriteFootDraw(item.sprite, item.x, item.y, item.scale);
    }
  }

  renderWorld();

  let scale = 1;
  let minScale = 0.25;
  const maxScale = 4;
  let offsetX = 0;
  let offsetY = 0;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function clampView() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = WORLD_W * scale;
    const sh = WORLD_H * scale;
    const margin = 72;

    if (sw <= vw) {
      offsetX = (vw - sw) / 2;
    } else {
      offsetX = Math.min(
        margin,
        Math.max(vw - sw - margin, offsetX)
      );
    }

    if (sh <= vh) {
      offsetY = (vh - sh) / 2;
    } else {
      offsetY = Math.min(
        margin,
        Math.max(vh - sh - margin, offsetY)
      );
    }
  }

  function applyTransform() {
    clampView();

    canvas.style.transform =
      'translate3d(' +
      Math.round(offsetX) +
      'px,' +
      Math.round(offsetY) +
      'px,0) scale(' +
      scale.toFixed(4) +
      ')';
  }

  function fitWholeMap() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    minScale = Math.min(
      vw / WORLD_W,
      vh / WORLD_H
    ) * 0.94;

    scale = minScale;
    offsetX = (vw - WORLD_W * scale) / 2;
    offsetY = (vh - WORLD_H * scale) / 2;
    applyTransform();
  }

  function focusTown() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    minScale = Math.min(
      vw / WORLD_W,
      vh / WORLD_H
    ) * 0.94;

    if (vw / vh < 0.72) {
      // Portrait phones open slightly closer, centred on the actual town.
      scale = Math.max(
        minScale,
        Math.min(1.12, vh / WORLD_H * 1.08)
      );

      const focusX = 48 * TILE;
      const focusY = 34 * TILE;

      offsetX = vw / 2 - focusX * scale;
      offsetY = vh / 2 - focusY * scale;
    } else {
      scale = Math.max(
        minScale,
        Math.min(1.15, Math.min(vw / WORLD_W, vh / WORLD_H) * 1.1)
      );

      offsetX = (vw - WORLD_W * scale) / 2;
      offsetY = (vh - WORLD_H * scale) / 2;
    }

    applyTransform();
  }

  function zoomAt(nextScale, cx, cy) {
    nextScale = Math.max(
      minScale,
      Math.min(maxScale, nextScale)
    );

    const wx = (cx - offsetX) / scale;
    const wy = (cy - offsetY) / scale;

    scale = nextScale;
    offsetX = cx - wx * scale;
    offsetY = cy - wy * scale;
    applyTransform();
  }

  viewport.addEventListener(
    'wheel',
    event => {
      event.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.15 : 0.87;

      zoomAt(scale * factor, cx, cy);
    },
    { passive: false }
  );

  viewport.addEventListener('pointerdown', event => {
    viewport.setPointerCapture(event.pointerId);

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (activePointers.size === 1) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      viewport.classList.add('dragging');
      return;
    }

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];

      pinchStartDistance = Math.hypot(
        pts[0].x - pts[1].x,
        pts[0].y - pts[1].y
      );

      pinchStartScale = scale;
      dragging = false;
    }
  });

  viewport.addEventListener('pointermove', event => {
    if (!activePointers.has(event.pointerId)) return;

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];

      const distance = Math.hypot(
        pts[0].x - pts[1].x,
        pts[0].y - pts[1].y
      );

      const rect = viewport.getBoundingClientRect();
      const cx = (pts[0].x + pts[1].x) / 2 - rect.left;
      const cy = (pts[0].y + pts[1].y) / 2 - rect.top;

      if (pinchStartDistance > 0) {
        zoomAt(
          pinchStartScale * (distance / pinchStartDistance),
          cx,
          cy
        );
      }

      return;
    }

    if (!dragging) return;

    offsetX += event.clientX - lastX;
    offsetY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    applyTransform();
  });

  function releasePointer(event) {
    activePointers.delete(event.pointerId);

    if (activePointers.size === 1) {
      const point = [...activePointers.values()][0];
      dragging = true;
      lastX = point.x;
      lastY = point.y;
      return;
    }

    dragging = false;
    viewport.classList.remove('dragging');
  }

  viewport.addEventListener('pointerup', releasePointer);
  viewport.addEventListener('pointercancel', releasePointer);

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'fit') {
      fitWholeMap();
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    zoomAt(
      scale * (action === 'in' ? 1.25 : 0.8),
      cx,
      cy
    );
  });

  let resizeTimer = null;

  function resize() {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      focusTown();
    }, 40);
  }

  window.addEventListener('resize', resize);
  requestAnimationFrame(focusTown);

  return {
    canvas,
    viewport,
    fitWholeMap,
    focusTown,
    renderWorld
  };
}
