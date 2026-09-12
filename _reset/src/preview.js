import * as THREE from 'https://esm.sh/three@0.180.0';
import { OrbitControls } from 'https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { createIsland3D } from './scene.js';

createIsland3D(THREE, OrbitControls, document.querySelector('#app'));
