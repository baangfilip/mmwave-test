
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

const MAX_POINTS_FOR_TRAIL = 400;
const loader = new GLTFLoader();
let drones = [];

export function loadDrones(scene) {
  loader.load('resources/models/Drone.glb', function (gltf) {
    let droneModel = gltf.scene;
    drones.push(addDrone(2, 3, 5, true, "initial drone", droneModel, scene))
  }, undefined, function (error) {
    console.error(error);
  });

  loader.load('resources/models/Drone-black.glb', function (gltf) {
    let droneBlack = null;
    droneBlack = gltf.scene;
    drones.push(addDrone(5, 3, 2, true, "another drone", droneBlack, scene));
  }, undefined, function (error) {
    console.error(error);
  });
}

function addDrone(x, y, z, box, id, model, scene) {
  const drone = model.clone(true);
  scene.add(drone);
  drone.position.x = x;
  drone.position.y = y;
  drone.position.z = z;

  const positions = new Float32Array(MAX_POINTS_FOR_TRAIL * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const trail = new THREE.Line(geometry, material);
  if (trail) {
    scene.add(trail);
  }

  let boxHelper;
  if (box)
    boxHelper = new THREE.BoxHelper(drone, 0xff0000); // red
  scene.add(boxHelper);
  return { model: drone, id: id, box: boxHelper, trail, positions, currentLength: 0, currentTarget: getRandomTarget(), nextTarget: null };
}

function getRandomTarget() {
  const BOUNDS = 25;
  return new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(BOUNDS), 
    THREE.MathUtils.randFloat(2, BOUNDS), 
    THREE.MathUtils.randFloatSpread(BOUNDS)
  );
}

export function animateDrones() {
  drones.forEach(model => {
    let current = model.currentTarget;
    let next = model.nextTarget;
    const pos = model.model.position;

    // Ensure current target exists
    if (!current) {
      model.currentTarget = getRandomTarget();
      current = model.currentTarget;
    }

    const distance = pos.distanceTo(current);

    // Plan ahead if close to current target
    if (distance < 3 && !next) {
      model.nextTarget = getRandomTarget();
      next = model.nextTarget;
    }

    // Calculate desired direction
    let desiredDirection;
    if (next) {
      // Turn earlier and smoother using a larger blend radius and easing
      let blendFactor = THREE.MathUtils.clamp((5 - distance) / 5, 0, 1);
      blendFactor = Math.pow(blendFactor, 2); // ease-in curve

      const blendedTarget = current.clone().lerp(next, blendFactor);
      desiredDirection = blendedTarget.sub(pos).normalize();
    } else {
      desiredDirection = current.clone().sub(pos).normalize();
    }

    // Smooth the direction vector itself
    if (!model.direction) {
      model.direction = new THREE.Vector3(0, 0, 1); // initial forward
    }
    model.direction.lerp(desiredDirection, 0.05); // smaller factor = smoother turns
    model.direction.normalize();

    // Move forward using smoothed direction
    const speed = 0.08;
    pos.add(model.direction.clone().multiplyScalar(speed));

    // Smoothly rotate the drone to match direction
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      model.direction
    );
    model.model.quaternion.slerp(targetQuat, 0.02);

    // Improved target switching (with distance trend check)
    const prevDist = model.prevDistance ?? distance;
    model.prevDistance = distance;

    if (distance < 2 || (distance > prevDist && distance < 5)) {
      if (next) {
        model.currentTarget = next;
        model.nextTarget = null;
      } else {
        model.currentTarget = getRandomTarget();
      }
    }

    // Trail logic
    if (model.currentLength < MAX_POINTS_FOR_TRAIL) {
      model.positions.set([pos.x, pos.y, pos.z], model.currentLength * 3);
      model.currentLength++;
    } else {
      model.positions.copyWithin(0, 3);
      model.positions.set([pos.x, pos.y, pos.z], (MAX_POINTS_FOR_TRAIL - 1) * 3);
    }

    model.box.update();
    model.trail.geometry.setDrawRange(0, model.currentLength);
    model.trail.geometry.attributes.position.needsUpdate = true;
  });
}