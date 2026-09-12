import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createIsland3D } from './scene.js';

createIsland3D(THREE, OrbitControls, document.querySelector('#app'));
