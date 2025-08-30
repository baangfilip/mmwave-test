import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupCameraAndControls(renderer){

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  // Set distance from origin
  const radius = 10;            // Distance from origin
  const angleDeg = 45;          // Downward angle in degrees
  const angleRad = THREE.MathUtils.degToRad(angleDeg);

  // Position the camera using spherical coordinates
  camera.position.x = 5;
  camera.position.y = radius * Math.sin(angleRad); // height
  camera.position.z = radius * Math.cos(angleRad); // distance forward

  // Look at the origin
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  return camera;
}
