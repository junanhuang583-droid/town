export function createTownMap(app) {
  app.innerHTML = '';

  const viewport = document.createElement('div');
  viewport.className = 'map-viewport';

  const stage = document.createElement('div');
  stage.className = 'map-stage';
  stage.innerHTML = String.raw\`
  <svg class="town-map" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="海边度假小镇地图">
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#82d7e6"/>
        <stop offset="0.55" stop-color="#64c6dd"/>
        <stop offset="1" stop-color="#51b2d0"/>
      </linearGradient>
      <linearGradient id="grass" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#a9d59a"/>
        <stop offset="1" stop-color="#87bf86"/>
      </linearGradient>
      <linearGradient id="grassHi" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#b9dfa8"/>
        <stop offset="1" stop-color="#8dc98d"/>
      </linearGradient>
      <linearGradient id="sand" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f5dfac"/>
        <stop offset="1" stop-color="#e8c989"/>
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#78878d"/>
        <stop offset="1" stop-color="#66767d"/>
      </linearGradient>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#49666a" flood-opacity="0.20"/>
      </filter>
      <filter id="smallShadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#49666a" flood-opacity="0.18"/>
      </filter>
      <pattern id="waterSparkle" width="95" height="58" patternUnits="userSpaceOnUse">
        <path d="M8 27 Q25 18 42 27 T76 27" fill="none" stroke="#d8f8fb" stroke-width="4" stroke-linecap="round" opacity=".45"/>
      </pattern>
    </defs>

    <!-- SEA -->
    <rect width="1600" height="1000" fill="url(#sea)"/>
    <rect class="water-sparkles" width="1600" height="1000" fill="url(#waterSparkle)" opacity=".55"/>

    <!-- DISTANT WATER DECOR -->
    <g opacity=".38">
      <ellipse cx="1350" cy="195" rx="110" ry="28" fill="#7ec1bc"/>
      <ellipse cx="1430" cy="178" rx="55" ry="20" fill="#78b8ae"/>
      <ellipse cx="1190" cy="110" rx="70" ry="20" fill="#8bcac0"/>
    </g>

    <!-- MAIN LANDMASS: connected to the larger world, not an island -->
    <path d="
      M0 0 H1080
      C1145 38 1178 92 1162 145
      C1144 205 1092 234 1088 292
      C1084 340 1126 367 1101 420
      C1070 486 985 478 956 545
      C934 597 969 655 937 701
      C905 746 838 728 794 767
      C746 810 747 875 698 913
      C632 965 521 948 438 930
      C330 906 221 919 0 942 Z"
      fill="url(#grass)" stroke="#6ea477" stroke-width="8"/>

    <!-- HIGH BACKLAND -->
    <path d="
      M0 0 H1020
      C1068 58 1068 120 1032 161
      C987 211 892 199 840 241
      C784 286 794 341 738 363
      C655 395 528 340 424 347
      C286 356 165 417 0 410 Z"
      fill="url(#grassHi)" opacity=".98"/>

    <!-- UPPER COAST ROAD -->
    <path d="M-20 122 C170 94 332 98 474 126 C621 156 736 166 870 137 C944 121 1005 126 1054 158"
      fill="none" stroke="url(#road)" stroke-width="62" stroke-linecap="round"/>
    <path d="M-20 122 C170 94 332 98 474 126 C621 156 736 166 870 137 C944 121 1005 126 1054 158"
      fill="none" stroke="#b8c3c7" stroke-width="4" stroke-dasharray="22 26" opacity=".75"/>

    <!-- BEACH, RIGHT SIDE -->
    <path d="
      M943 510
      C1041 487 1123 516 1177 570
      C1246 639 1255 713 1207 770
      C1150 838 1050 872 944 849
      C903 840 855 807 801 767
      C845 727 891 703 916 664
      C941 625 920 564 943 510 Z"
      fill="url(#sand)" stroke="#dbbd7d" stroke-width="6"/>

    <!-- RIGHT-LOWER CAPE -->
    <path d="
      M1006 777
      C1092 786 1148 826 1206 875
      C1260 920 1322 924 1382 889
      C1435 858 1474 798 1470 741
      C1465 678 1412 636 1350 632
      C1273 626 1222 669 1162 705
      C1109 737 1068 750 1006 777 Z"
      fill="#91bf84" stroke="#6f9b72" stroke-width="7"/>

    <!-- CLIFF EDGES -->
    <path d="M0 688 C150 671 250 694 336 742 C407 782 473 800 542 808"
      fill="none" stroke="#9d8c78" stroke-width="30" stroke-linecap="round" opacity=".88"/>
    <path d="M1006 777 C1100 791 1172 848 1228 884 C1285 921 1351 909 1401 873"
      fill="none" stroke="#9b8975" stroke-width="24" stroke-linecap="round" opacity=".9"/>

    <!-- WALKING SPINE -->
    <path d="M222 182 C252 246 300 283 355 324 C420 371 465 414 515 459 C585 522 667 553 736 572"
      fill="none" stroke="#ead9b7" stroke-width="34" stroke-linecap="round"/>
    <path d="M222 182 C252 246 300 283 355 324 C420 371 465 414 515 459 C585 522 667 553 736 572"
      fill="none" stroke="#cdbb99" stroke-width="3" stroke-dasharray="10 16" opacity=".8"/>

    <!-- STATION -->
    <g transform="translate(135 132)" filter="url(#smallShadow)">
      <rect x="-66" y="-32" width="132" height="64" rx="18" fill="#7ea6b5" stroke="#597883" stroke-width="5"/>
      <path d="M-78 -35 H78 L58 -70 H-58 Z" fill="#5d7e8c"/>
      <rect x="-42" y="2" width="84" height="22" rx="8" fill="#d7eff0"/>
      <circle cx="-92" cy="12" r="16" fill="#f6d77a" stroke="#a98b46" stroke-width="4"/>
    </g>
    <text x="135" y="232" text-anchor="middle" class="map-label">海岸站</text>

    <!-- SPARSE HOMES -->
    <g transform="translate(352 205)" filter="url(#smallShadow)">
      <rect x="-45" y="-34" width="90" height="68" rx="14" fill="#d2c9b3"/>
      <path d="M-58 -33 L0 -76 L58 -33 Z" fill="#a87263"/>
      <rect x="-9" y="4" width="20" height="30" rx="5" fill="#846f5d"/>
    </g>
    <g transform="translate(470 220)" filter="url(#smallShadow)">
      <rect x="-42" y="-30" width="84" height="60" rx="13" fill="#cbd5b6"/>
      <path d="M-54 -29 L0 -68 L54 -29 Z" fill="#8c7660"/>
      <rect x="-9" y="2" width="19" height="28" rx="5" fill="#756451"/>
    </g>

    <!-- RESORT BUILDING CLUSTERS -->
    <!-- Inn -->
    <g transform="translate(290 346)" filter="url(#softShadow)">
      <rect x="-66" y="-46" width="132" height="92" rx="18" fill="#b9d4e1" stroke="#7da5b7" stroke-width="5"/>
      <path d="M-79 -44 L0 -103 L79 -44 Z" fill="#6d8ea4"/>
      <rect x="-16" y="3" width="32" height="43" rx="7" fill="#74879a"/>
      <circle cx="-39" cy="-2" r="10" fill="#eaf6f8"/><circle cx="39" cy="-2" r="10" fill="#eaf6f8"/>
    </g>
    <text x="290" y="425" text-anchor="middle" class="map-label">小旅店</text>

    <!-- Sweet shop -->
    <g transform="translate(420 363)" filter="url(#smallShadow)">
      <rect x="-50" y="-36" width="100" height="72" rx="17" fill="#f1cf84" stroke="#cba95d" stroke-width="5"/>
      <path d="M-60 -34 L0 -76 L60 -34 Z" fill="#e1a86f"/>
      <rect x="-14" y="5" width="28" height="31" rx="6" fill="#98785f"/>
      <path d="M-42 -5 H42" stroke="#fff0c7" stroke-width="12" stroke-linecap="round"/>
    </g>
    <text x="420" y="431" text-anchor="middle" class="map-label">甜品店</text>

    <!-- General shop -->
    <g transform="translate(536 384)" filter="url(#smallShadow)">
      <rect x="-54" y="-38" width="108" height="76" rx="16" fill="#b9d0a8" stroke="#829a73" stroke-width="5"/>
      <path d="M-65 -36 L0 -82 L65 -36 Z" fill="#799267"/>
      <rect x="-13" y="6" width="26" height="32" rx="6" fill="#7b6755"/>
      <rect x="-44" y="-8" width="28" height="21" rx="7" fill="#eaf2dd"/>
      <rect x="16" y="-8" width="28" height="21" rx="7" fill="#eaf2dd"/>
    </g>
    <text x="536" y="455" text-anchor="middle" class="map-label">杂货店</text>

    <!-- Cafe -->
    <g transform="translate(392 500)" filter="url(#softShadow)">
      <rect x="-70" y="-44" width="140" height="88" rx="20" fill="#edb3a8" stroke="#c68178" stroke-width="5"/>
      <path d="M-83 -43 L0 -96 L83 -43 Z" fill="#b77671"/>
      <rect x="-16" y="4" width="32" height="40" rx="7" fill="#80665d"/>
      <path d="M-58 -8 H58" stroke="#f7e9df" stroke-width="14" stroke-linecap="round"/>
      <circle cx="-84" cy="50" r="17" fill="#f4d77e"/><circle cx="-54" cy="55" r="13" fill="#e9c76d"/>
    </g>
    <text x="392" y="583" text-anchor="middle" class="map-label">海景咖啡馆</text>

    <!-- Seafood restaurant -->
    <g transform="translate(570 525)" filter="url(#softShadow)">
      <rect x="-64" y="-42" width="128" height="84" rx="19" fill="#d8b8d1" stroke="#aa88a6" stroke-width="5"/>
      <path d="M-76 -41 L0 -90 L76 -41 Z" fill="#8d6d86"/>
      <rect x="-15" y="4" width="30" height="38" rx="7" fill="#725e69"/>
      <path d="M-49 -7 H49" stroke="#f2e2ee" stroke-width="13" stroke-linecap="round"/>
    </g>
    <text x="570" y="605" text-anchor="middle" class="map-label">海鲜餐馆</text>

    <!-- Rental hut -->
    <g transform="translate(734 565)" filter="url(#smallShadow)">
      <rect x="-47" y="-34" width="94" height="68" rx="16" fill="#cab89a" stroke="#9a856a" stroke-width="5"/>
      <path d="M-56 -33 L0 -72 L56 -33 Z" fill="#8f7860"/>
      <rect x="-12" y="3" width="24" height="31" rx="6" fill="#715f4d"/>
      <circle cx="33" cy="8" r="10" fill="#78c6d5"/>
    </g>
    <text x="734" y="633" text-anchor="middle" class="map-label">活动小屋</text>

    <!-- SEA BREEZE PLAZA -->
    <g filter="url(#smallShadow)">
      <ellipse cx="565" cy="655" rx="126" ry="83" fill="#e7d7bc" stroke="#cbb998" stroke-width="6"/>
      <circle cx="565" cy="644" r="28" fill="#b9dce3" stroke="#95b8bd" stroke-width="7"/>
      <circle cx="565" cy="644" r="10" fill="#eef9fa"/>
      <rect x="475" y="686" width="54" height="14" rx="7" fill="#9b7a5e"/>
      <rect x="600" y="687" width="54" height="14" rx="7" fill="#9b7a5e"/>
    </g>
    <text x="565" y="760" text-anchor="middle" class="map-label">海风广场</text>

    <!-- COAST BOARDWALK -->
    <path d="M650 745 C728 704 793 682 860 688 C928 695 968 733 1001 780"
      fill="none" stroke="#a87755" stroke-width="42" stroke-linecap="round"/>
    <path d="M650 745 C728 704 793 682 860 688 C928 695 968 733 1001 780"
      fill="none" stroke="#d2a37c" stroke-width="5" stroke-dasharray="18 18" opacity=".75"/>

    <!-- TIDE POOLS -->
    <g opacity=".9">
      <ellipse cx="1010" cy="660" rx="52" ry="27" fill="#71ccda" stroke="#c7edf0" stroke-width="5"/>
      <ellipse cx="1085" cy="706" rx="36" ry="22" fill="#74c9d7" stroke="#c7edf0" stroke-width="4"/>
      <ellipse cx="1131" cy="646" rx="25" ry="15" fill="#74c9d7" stroke="#c7edf0" stroke-width="4"/>
    </g>

    <!-- PIER -->
    <path d="M1043 738 C1102 758 1155 770 1223 768"
      fill="none" stroke="#916947" stroke-width="34" stroke-linecap="round"/>
    <rect x="1204" y="744" width="92" height="48" rx="10" fill="#9d7350" transform="rotate(-2 1250 768)"/>
    <text x="1218" y="830" text-anchor="middle" class="map-label">小码头</text>

    <!-- LIGHTHOUSE PATH -->
    <path d="M1038 820 C1125 828 1198 856 1260 872 C1320 887 1364 867 1396 824"
      fill="none" stroke="#ead9b7" stroke-width="25" stroke-linecap="round"/>

    <!-- LIGHTHOUSE -->
    <g transform="translate(1370 742)" filter="url(#softShadow)">
      <path d="M-24 54 L-15 -54 H15 L24 54 Z" fill="#f2eee4" stroke="#d2c8b6" stroke-width="5"/>
      <rect x="-22" y="-66" width="44" height="18" rx="5" fill="#9ed0db" stroke="#6aa4b0" stroke-width="4"/>
      <path d="M-34 -67 L0 -92 L34 -67 Z" fill="#c95f5a"/>
      <rect x="-7" y="15" width="14" height="39" rx="5" fill="#876e5b"/>
      <path d="M-15 -12 H15" stroke="#c95f5a" stroke-width="11"/>
    </g>
    <text x="1370" y="835" text-anchor="middle" class="map-label">灯塔</text>

    <!-- TREES AND FLOWER SLOPES -->
    <g class="foliage">
      <g transform="translate(130 330)"><circle r="40" fill="#71ad72"/><circle cx="-26" cy="8" r="28" fill="#86bf7d"/><circle cx="25" cy="10" r="30" fill="#91c786"/></g>
      <g transform="translate(110 480)"><circle r="42" fill="#6da86e"/><circle cx="-25" cy="10" r="30" fill="#87bd7d"/><circle cx="29" cy="11" r="31" fill="#8fc584"/></g>
      <g transform="translate(180 610)"><circle r="44" fill="#71aa70"/><circle cx="-28" cy="9" r="31" fill="#8bc182"/><circle cx="28" cy="12" r="32" fill="#91c987"/></g>
      <g transform="translate(670 285)"><circle r="40" fill="#70aa6f"/><circle cx="-25" cy="8" r="29" fill="#89c17f"/><circle cx="25" cy="9" r="29" fill="#91c987"/></g>
      <g transform="translate(780 350)"><circle r="40" fill="#6ca36a"/><circle cx="-25" cy="8" r="29" fill="#84ba78"/><circle cx="25" cy="10" r="29" fill="#8fc480"/></g>
      <g transform="translate(875 430)"><circle r="38" fill="#6ca36a"/><circle cx="-23" cy="8" r="27" fill="#84ba78"/><circle cx="23" cy="10" r="28" fill="#8fc480"/></g>
    </g>

    <g class="flowers" opacity=".95">
      <circle cx="208" cy="545" r="8" fill="#f4a0ae"/><circle cx="236" cy="564" r="7" fill="#f7d179"/><circle cx="264" cy="548" r="8" fill="#d6a2dc"/>
      <circle cx="693" cy="442" r="8" fill="#f4a0ae"/><circle cx="718" cy="459" r="7" fill="#f7d179"/><circle cx="741" cy="442" r="8" fill="#d6a2dc"/>
      <circle cx="807" cy="520" r="7" fill="#f4a0ae"/><circle cx="832" cy="538" r="7" fill="#f7d179"/>
    </g>

    <!-- COAST FOAM -->
    <g class="foam" fill="none" stroke="#f1ffff" stroke-width="8" stroke-linecap="round" opacity=".7">
      <path d="M755 772 C821 803 889 809 944 844"/>
      <path d="M935 518 C1007 499 1102 529 1164 580"/>
      <path d="M1183 701 C1254 652 1355 642 1410 678"/>
    </g>
  </svg>\`;

  viewport.appendChild(stage);
  app.appendChild(viewport);

  const MAP_W = 1600;
  const MAP_H = 1000;
  let scale = 1;
  let minScale = 0.25;
  let maxScale = 2.4;
  let x = 0;
  let y = 0;
  let dragging = false;
  let dragId = null;
  let lastX = 0;
  let lastY = 0;
  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function clampPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = MAP_W * scale;
    const sh = MAP_H * scale;
    const margin = Math.min(vw, vh) * 0.16;

    if (sw <= vw) x = (vw - sw) / 2;
    else x = Math.min(margin, Math.max(vw - sw - margin, x));

    if (sh <= vh) y = (vh - sh) / 2;
    else y = Math.min(margin, Math.max(vh - sh - margin, y));
  }

  function renderTransform() {
    clampPan();
    stage.style.transform = \`translate(\${x}px, \${y}px) scale(\${scale})\`;
  }

  function fitMap() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const fit = Math.min(vw / MAP_W, vh / MAP_H) * 0.94;
    minScale = Math.max(0.18, fit * 0.78);
    scale = Math.max(minScale, fit);
    x = (vw - MAP_W * scale) / 2;
    y = (vh - MAP_H * scale) / 2;
    renderTransform();
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
    renderTransform();
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
      const centerX = (pts[0].x + pts[1].x) / 2;
      const centerY = (pts[0].y + pts[1].y) / 2;
      const target = Math.min(maxScale, Math.max(minScale, pinchStartScale * (distance / pinchStartDistance)));
      zoomAt(centerX, centerY, target / scale);
      return;
    }

    if (dragging && e.pointerId === dragId) {
      x += e.clientX - lastX;
      y += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      renderTransform();
    }
  });

  function releasePointer(e) {
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

  viewport.addEventListener('pointerup', releasePointer);
  viewport.addEventListener('pointercancel', releasePointer);

  window.addEventListener('resize', fitMap);
  requestAnimationFrame(fitMap);

  return { fitMap };
}
