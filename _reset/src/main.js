import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createVoxelIslandV2 } from './scene.js';

createVoxelIslandV2(THREE, OrbitControls, document.querySelector('#app'));
