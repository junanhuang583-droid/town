import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';
import { createTownScene } from './townScene.js';

createTownScene(THREE, OrbitControls, document.querySelector('#app'));
