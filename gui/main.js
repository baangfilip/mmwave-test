import * as THREE from 'three';
import { loadDrones, animateDrones } from './drones.js';
import { setupEnvironment } from './environment.js';
import { setupCameraAndControls } from './camera.js';
import { setupLiveObjectTracking } from './liveObjects.js';
import { setupRadar } from './radar.js';
import { setupCar } from './car.js';


//
// SETUP
//

const SCALE = 1;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();

const radarGroup = new THREE.Group();
const radarPointsGroup = new THREE.Group();
const sensorOrigin = new THREE.Group();

loadDrones(scene);
setupEnvironment(scene, renderer);
setupLiveObjectTracking(scene, SCALE, sensorOrigin, radarPointsGroup);
const camera = setupCameraAndControls(renderer);
setupCar(scene, radarGroup);
setupRadar(scene, radarGroup, radarPointsGroup, sensorOrigin, SCALE)

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate() {
  animateDrones();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);