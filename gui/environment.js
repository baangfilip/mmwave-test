import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import * as THREE from 'three';

export function setupEnvironment(scene, renderer){
  setupGroundTexture(scene, renderer);
  setupHorizon(scene);
  setupLightning(scene);
  scene.background = new THREE.Color(0x0000ff);
}

function setupGroundTexture(scene, renderer){
  const textureLoader = new THREE.TextureLoader();
  const gravel = textureLoader.load('resources/textures/mud/brown_mud_leaves_01_diff_1k.jpg');

  // Optional tiling for larger area
  gravel.wrapS = gravel.wrapT = THREE.RepeatWrapping;

  const repeat = 50; // how many times to tile
  gravel.repeat.set(repeat, repeat);
  scene.fog = new THREE.FogExp2(0xaaaaaa, 0.002);
  renderer.setClearColor(scene.fog.color);
  // Create material
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: gravel,
  });

  // Create ground mesh
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    groundMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function setupHorizon(scene){
  new RGBELoader()
    .load('resources/bambanani_sunset_2k.hdr', function (hdrMap) {
      hdrMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = hdrMap;
      scene.background = hdrMap;
    });
}

function setupLightning(scene){
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  // Also add ambient light for general illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
}
