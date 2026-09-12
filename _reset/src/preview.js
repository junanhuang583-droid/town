import * as THREE from 'https://esm.sh/three@0.180.0';
import { OrbitControls } from 'https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { createVoxelIslandV2 } from './scene.js';

createVoxelIslandV2(THREE, OrbitControls, document.querySelector('#app'));
