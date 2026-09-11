import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createSeasideBlockout } from './scene.js';

createSeasideBlockout(THREE, OrbitControls, document.querySelector('#app'));
