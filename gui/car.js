import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();

export function setupCar(scene, radarGroup){
  loader.load('resources/models/Ambulance-Car.glb', function (gltf) {
    let ambulance = gltf.scene;
    scene.add(gltf.scene);
    ambulance.position.y = 1
    const bbox = new THREE.Box3().setFromObject(ambulance);
    const carHeight = bbox.max.y - bbox.min.y;
    radarGroup.position.set(0, carHeight, 0); // move to car's roof
    ambulance.add(radarGroup);
  }, undefined, function (error) {
    console.error(error);
  });
}
