import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRadarFov } from './radarFOV.js';
const loader = new GLTFLoader();

export function setupRadar(scene, radarGroup, radarPointsGroup, sensorOrigin, world_scale){
  
  loader.load('resources/models/Flat-Screen-TV.glb', function (gltf) {
    let radar = gltf.scene;
    radar.scale.set(0.2, 0.2, 0.2); 
    radar.position.set(0, 1.9, 0);
    radar.rotation.x = THREE.MathUtils.degToRad(-30);
    const radarVisualGroup = new THREE.Group();
    radarVisualGroup.add(radar);
    scene.add(radarVisualGroup);
    scene.add(radarGroup);
    radarGroup.add(sensorOrigin);
    const radarFoV = createRadarFov(9, 120, 30, world_scale); 
    sensorOrigin.add(radarFoV);
    radarFoV.material.opacity = 0.1;
    sensorOrigin.rotation.x = THREE.MathUtils.degToRad(-30);
    radarGroup.add(radarPointsGroup);
    radarPointsGroup.rotation.x = THREE.MathUtils.degToRad(30);

  }, undefined, function (error) {
    console.error(error);
  });
}
