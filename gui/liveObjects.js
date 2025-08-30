import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as THREE from 'three';


let nextId = 0;
const trackedObjects = {};
export function setupLiveObjectTracking(scene, world_scale, sensorOrigin, radarPointsGroup){
  const ws = new WebSocket("ws://localhost:8765");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateObjects(data, scene, world_scale, sensorOrigin, radarPointsGroup);
  };
}

function updateObjects(data, scene, world_scale, sensorOrigin, radarPointsGroup){
  let objects = [...data.tracked, ...data.points]
  // Mark all existing objects as "unseen"
  for (const id in trackedObjects) {
    trackedObjects[id].unseenFrames++;
  }

  // Update or create detecttion
  objects.forEach(obj => {
    let matchId = null;

    let LR = obj.x;   // left/right
    let UD = obj.z;   // up/down
    let FB = obj.y;   // forward/back

    //without elevation for better demo
    LR = -obj.x;
    UD = 0;
    FB = obj.y;

    // filter unresonably points
    if ((obj.range < 0.5 || obj.snr < 20)) {
      return;
    }
    const localPos = new THREE.Vector3(
      LR * world_scale,   // left/right
      UD * world_scale,   // up
      FB * world_scale    // forward
    );


    sensorOrigin.localToWorld(localPos);
    const range = localPos.length();
    for (const id in trackedObjects) {
      const obj = trackedObjects[id];
      const dist = obj.mesh.position.distanceTo(localPos);
      if (dist < 0.2) {
        matchId = id;
        break;
      }
    }

    if (matchId !== null) {
      // Update existing object
      const obj = trackedObjects[matchId];
      obj.mesh.position.copy(localPos);
      // obj.mesh.children.forEach(child => {
      //   if (child instanceof CSS2DObject) {
      //     child.element.innerHTML = 
      //       `left(x):${localPos.x.toFixed(2)} up(y):${localPos.y.toFixed(2)} forward(z):${localPos.z.toFixed(2)}`;
      //   }
      // });
      if (obj.boxHelper)
        obj.boxHelper.update();
      obj.seen = true;
      obj.unseenFrames = 0;
    } else {
      // Create a new bee
      const color = getSnrColor(obj.snr);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 6),
        new THREE.MeshStandardMaterial({ color: color })
      );
      mesh.position.copy(localPos);

      // Create label element
      const div = document.createElement('div');
      div.className = 'label';
      div.style.color = 'white';
      div.style.fontSize = '12px';
      div.style.backgroundColor = 'rgba(0,0,0,0.5)';
      div.style.padding = '2px 4px';
      div.style.borderRadius = '4px';
      div.innerHTML = `x:${obj.x.toFixed(2)} y:${obj.y.toFixed(2)} range:${range.toFixed(2)}`;

      // Create label object
      const label = new CSS2DObject(div);
      label.position.set(0, 0.1, 0); // Offset above the ball
      //mesh.add(label);

      radarPointsGroup.add(mesh);
      let boxHelper;
      if (obj.snr > 25) {
        boxHelper = new THREE.BoxHelper(mesh, 0xff0000); // red
        scene.add(boxHelper);
      }
      trackedObjects[nextId++] = { mesh, seen: true, boxHelper, unseenFrames: 0, label };
    }
  });

  // Remove objects that weren't seen this frame
  for (const id in trackedObjects) {
    if (trackedObjects[id].unseenFrames > 10) {
      trackedObjects[id].mesh.parent.remove(trackedObjects[id].mesh);
      scene.remove(trackedObjects[id].boxHelper);

      // Remove the label, if it exists
      if (trackedObjects[id].label) {
        trackedObjects[id].mesh.remove(trackedObjects[id].label);
      }
      delete trackedObjects[id];
    }
  }
}


function getSnrColor(snr, minSnr = 0, maxSnr = 30) {
  snr = Math.max(minSnr, Math.min(snr, maxSnr));
  const t = (snr - minSnr) / (maxSnr - minSnr);
  let r, g;

  if (t < 0.5) {
    // red to yellow, add more green
    r = 255;
    g = Math.round(255 * (t * 2));
  } else {
    // yellow to green, remove redness
    r = Math.round(255 * (1 - (t - 0.5) * 2));
    g = 255;
  }
  return `rgb(${r},${g},0)`;
}