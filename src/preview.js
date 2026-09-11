import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { createTownScene } from './townScene.js';

createTownScene(THREE, OrbitControls, document.querySelector('#app'));
