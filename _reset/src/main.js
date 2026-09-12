import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createVoxelIslandV1 } from './scene.js';

createVoxelIslandV1(THREE, OrbitControls, document.querySelector('#app'));
