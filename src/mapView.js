import { TILE, createPixelAssets } from './pixelAssets.js';
import { buildTownMap } from './mapData.js';
import { loadPunyWorldAssets } from './punyWorld.js';

export async function mountMap(app) {
  app.innerHTML = '';

  const map = buildTownMap();
  const fallback = createPixelAssets();

  const WORLD_W = map.width * TILE;
  const WORLD_H = map.height * TILE;

  const viewport = document.createElement('div');
  viewport.className = 'pixel-viewport';

  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-map';
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  canvas.setAttribute('aria-label', 'Pixel Town v0.2 Puny World integration');
  viewport.appendChild(canvas);
  app.appendChild(viewport);

  const hud = document.createElement('div');
  hud.className = 'pixel-hud';
  hud.innerHTML =
    '<b>Pixel Town v0.2</b>' +
    '<span>Puny World 原始素材接入中…</span>';
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

  let puny = null;

  try {
    puny = await loadPunyWorldAssets();
    hud.innerHTML =
      '<b>Pixel Town v0.2</b>' +
      '<span>海滨小镇 · Puny World 原始素材验证版</span>';
  } catch (error) {
    console.error(error);
    hud.innerHTML =
      '<b>Pixel Town v0.2</b>' +
      '<span>素材加载失败 · 使用旧占位资源</span>';
  }

  function hash(x, y, seed = 0) {
    let n = (x * 374761393 + y * 668265263 + seed * 1442695041) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < map.width && y < map.height;
  }

  function terrainAt(x, y) {
    if (!inBounds(x, y)) return 'water';
    return map.terrain[y][x];
  }

  function pathAt(x, y) {
    if (!inBounds(x, y)) return null;
    return map.paths[y][x];
  }

  function variant(list, x, y, seed = 0) {
    const index = Math.floor(hash(x, y, seed) * list.length) % list.length;
    return list[index];
  }

  function sideMask(test) {
    let mask = 0;
    if (test(0, -1)) mask |= 1;
    if (test(1, 0)) mask |= 2;
    if (test(0, 1)) mask |= 4;
    if (test(-1, 0)) mask |= 8;
    return mask;
  }

  function distanceToLand(x, y, radius = 3) {
    for (let r = 1; r <= radius; r++) {
      for (let yy = y - r; yy <= y + r; yy++) {
        for (let xx = x - r; xx <= x + r; xx++) {
          if (Math.max(Math.abs(xx - x), Math.abs(yy - y)) !== r) continue;
          if (terrainAt(xx, yy) !== 'water') return r;
        }
      }
    }
    return radius + 1;
  }

  function punyTerrainSprite(type, x, y) {
    if (!puny) return null;

    if (type === 'sand') {
      return variant(puny.beach, x, y, 11);
    }

    if (
      type === 'grass' ||
      type === 'grassHigh' ||
      type === 'grassLow'
    ) {
      return variant(puny.grass, x, y, type === 'grassHigh' ? 14 : 12);
    }

    if (type === 'water') {
      const distance = distanceToLand(x, y, 3);
      if (distance <= 1) return puny.water.shallow;
      if (distance <= 3) return puny.water.medium;
      return puny.water.deep;
    }

    return null;
  }

  function fallbackTerrainSprite(type, x, y) {
    if (type === 'grass') return variant(fallback.terrain.grass, x, y, 1);
    if (type === 'grassHigh') return variant(fallback.terrain.grassHigh, x, y, 2);
    if (type === 'grassLow') return variant(fallback.terrain.grassLow, x, y, 3);
    if (type === 'sand') return variant(fallback.terrain.sand, x, y, 4);
    return variant(fallback.terrain.water, x, y, 5);
  }

  function drawTerrain() {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const type = terrainAt(x, y);
        const sprite =
          punyTerrainSprite(type, x, y) ||
          fallbackTerrainSprite(type, x, y);

        ctx.drawImage(sprite, x * TILE, y * TILE);
      }
    }
  }

  function drawTerrainEdges() {
    // Step 3 intentionally keeps only a light compatibility edge pass.
    // The next Town-art pass will replace this with a Town-specific coast autotile.
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const type = terrainAt(x, y);
        if (type === 'water') continue;

        const waterMask = sideMask((dx, dy) =>
          terrainAt(x + dx, y + dy) === 'water'
        );

        if (waterMask) {
          const foamSet = fallback.terrain.foam[waterMask];
          const foam =
            foamSet[Math.floor(hash(x, y, 42) * foamSet.length) % foamSet.length];

          ctx.globalAlpha = 0.7;
          ctx.drawImage(foam, x * TILE, y * TILE);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function drawPaths() {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const type = pathAt(x, y);
        if (!type) continue;

        if (type === 'rail') {
          ctx.drawImage(fallback.terrain.rail, x * TILE, y * TILE);
          continue;
        }

        if (type === 'stairs') {
          ctx.drawImage(fallback.terrain.stairs, x * TILE, y * TILE);
          continue;
        }

        const mask = sideMask((dx, dy) =>
          pathAt(x + dx, y + dy) === type
        );

        if (puny && type === 'dirt') {
          ctx.drawImage(puny.dirtPaths[mask], x * TILE, y * TILE);
          continue;
        }

        const group = fallback.paths[type];
        if (!group) continue;

        const options = group[mask];
        const sprite =
          options[Math.floor(hash(x, y, 30) * options.length) % options.length];

        ctx.drawImage(sprite, x * TILE, y * TILE);
      }
    }
  }

  function drawCliffs() {
    for (const item of map.cliffs) {
      if (puny) {
        const cliff = puny.cliff[item.variant % puny.cliff.length];
        ctx.drawImage(cliff, item.x * TILE, item.y * TILE);
      } else {
        const cliff =
          fallback.terrain.cliff[item.variant % fallback.terrain.cliff.length];
        ctx.drawImage(cliff, item.x * TILE, item.y * TILE);
      }
    }
  }

  function drawSpriteAtFoot(sprite, footX, footY, scale = 1) {
    const width = Math.round(sprite.width * scale);
    const height = Math.round(sprite.height * scale);

    const x = Math.round(footX * TILE - width / 2);
    const y = Math.round(footY * TILE - height);

    ctx.drawImage(sprite, x, y, width, height);
  }

  function punyBuildingFor(type) {
    if (!puny) return null;

    const mapping = {
      station: ['largeA', 1.32],
      homeRed: ['smallA', 1.28],
      homeGreen: ['smallB', 1.28],
      homeBlue: ['smallC', 1.28],
      inn: ['largeB', 1.38],
      sweets: ['smallD', 1.3],
      general: ['smallA', 1.34],
      cafe: ['largeC', 1.35],
      seafood: ['largeA', 1.34],
      rental: ['smallB', 1.25],
      lighthouseHouse: ['smallC', 1.24]
    };

    const spec = mapping[type];
    if (!spec) return null;

    return {
      sprite: puny.buildings[spec[0]],
      scale: spec[1]
    };
  }

  function punyDecorFor(item) {
    if (!puny) return null;

    if (item.type === 'tree') {
      return {
        sprite: variant(puny.trees, Math.floor(item.x), Math.floor(item.y), 61),
        scale: 1.72
      };
    }

    if (item.type === 'pine') {
      return {
        sprite: variant(puny.trees, Math.floor(item.x), Math.floor(item.y), 67),
        scale: 1.55
      };
    }

    const mapping = {
      bush: ['bush', 1.15],
      flowerPink: ['flowerA', 1],
      flowerYellow: ['flowerB', 1],
      flowerPurple: ['flowerC', 1],
      rock: ['rock', 1],
      sign: ['sign', 1],
      crate: ['crate', 1]
    };

    const spec = mapping[item.type];
    if (!spec) return null;

    return {
      sprite: puny.decor[spec[0]],
      scale: spec[1]
    };
  }

  function drawWorldObjects() {
    const drawables = [];

    for (const item of map.buildings) {
      const punyBuilding = punyBuildingFor(item.type);

      if (punyBuilding) {
        drawables.push({
          sprite: punyBuilding.sprite,
          x: item.x,
          y: item.y,
          scale: punyBuilding.scale * (item.scale || 1),
          order: 0
        });
        continue;
      }

      const sprite = fallback.buildings[item.type];
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
      const punyDecor = punyDecorFor(item);

      if (punyDecor) {
        drawables.push({
          sprite: punyDecor.sprite,
          x: item.x,
          y: item.y,
          scale: punyDecor.scale * (item.scale || 1),
          order: 1
        });
        continue;
      }

      const sprite = fallback.decor[item.type];
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
      if (Math.abs(a.y - b.y) > 0.001) return a.y - b.y;
      return a.order - b.order;
    });

    for (const item of drawables) {
      drawSpriteAtFoot(item.sprite, item.x, item.y, item.scale);
    }
  }

  function renderWorld() {
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    drawTerrain();
    drawTerrainEdges();
    drawPaths();
    drawCliffs();
    drawWorldObjects();
  }

  renderWorld();

  let scale = 1;
  let minScale = 0.25;
  const maxScale = 5;
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
      offsetX = Math.min(margin, Math.max(vw - sw - margin, offsetX));
    }

    if (sh <= vh) {
      offsetY = (vh - sh) / 2;
    } else {
      offsetY = Math.min(margin, Math.max(vh - sh - margin, offsetY));
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

    minScale = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.94;

    scale = minScale;
    offsetX = (vw - WORLD_W * scale) / 2;
    offsetY = (vh - WORLD_H * scale) / 2;
    applyTransform();
  }

  function focusTown() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    minScale = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.94;

    if (vw / vh < 0.72) {
      scale = Math.max(
        minScale,
        Math.min(1.32, vh / WORLD_H * 1.2)
      );

      const focusX = 47 * TILE;
      const focusY = 34 * TILE;

      offsetX = vw / 2 - focusX * scale;
      offsetY = vh / 2 - focusY * scale;
    } else {
      scale = Math.max(
        minScale,
        Math.min(
          1.3,
          Math.min(vw / WORLD_W, vh / WORLD_H) * 1.16
        )
      );

      offsetX = (vw - WORLD_W * scale) / 2;
      offsetY = (vh - WORLD_H * scale) / 2;
    }

    applyTransform();
  }

  function zoomAt(nextScale, cx, cy) {
    nextScale = Math.max(minScale, Math.min(maxScale, nextScale));

    const worldX = (cx - offsetX) / scale;
    const worldY = (cy - offsetY) / scale;

    scale = nextScale;
    offsetX = cx - worldX * scale;
    offsetY = cy - worldY * scale;
    applyTransform();
  }

  viewport.addEventListener(
    'wheel',
    event => {
      event.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;

      zoomAt(
        scale * (event.deltaY < 0 ? 1.15 : 0.87),
        cx,
        cy
      );
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
      const points = [...activePointers.values()];

      pinchStartDistance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
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
      const points = [...activePointers.values()];

      const distance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
      );

      const rect = viewport.getBoundingClientRect();

      const cx =
        (points[0].x + points[1].x) / 2 -
        rect.left;

      const cy =
        (points[0].y + points[1].y) / 2 -
        rect.top;

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

    zoomAt(
      scale * (action === 'in' ? 1.25 : 0.8),
      rect.width / 2,
      rect.height / 2
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
