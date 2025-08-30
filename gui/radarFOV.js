import * as THREE from 'three';

export function createRadarFov(maxRange = 9, horizontalDeg = 120, verticalDeg = 30, world_scale) {
  maxRange *= world_scale;
  const hFov = THREE.MathUtils.degToRad(horizontalDeg);
  const vFov = THREE.MathUtils.degToRad(verticalDeg);
  const segments = 32;

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = -vFov / 2 + (vFov * i) / segments;
    const y = Math.sin(angle) * maxRange;
    const z = Math.cos(angle) * maxRange;
    points.push(new THREE.Vector2(z, y));
  }

  const geometry = new THREE.LatheGeometry(points, segments, -hFov / 2, hFov);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  const edges = new THREE.EdgesGeometry(geometry);
  const edgeLines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  mesh.add(edgeLines);

  const binLines = new THREE.Group();
  const origin = new THREE.Vector3(0, 0, 0);

  const leftTop = new THREE.Vector3(
    Math.sin(-hFov / 2) * maxRange * Math.cos(vFov / 2),
    maxRange * Math.sin(vFov / 2),
    Math.cos(-hFov / 2) * maxRange * Math.cos(vFov / 2)
  );

  const leftBottom = new THREE.Vector3(
    Math.sin(-hFov / 2) * maxRange * Math.cos(vFov / 2),
    -maxRange * Math.sin(vFov / 2),
    Math.cos(-hFov / 2) * maxRange * Math.cos(vFov / 2)
  );

  binLines.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, leftTop]),
      new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true })
    )
  );
  binLines.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, leftBottom]),
      new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true })
    )
  );

  const rightTop = new THREE.Vector3(
    Math.sin(hFov / 2) * maxRange * Math.cos(vFov / 2),
    maxRange * Math.sin(vFov / 2),
    Math.cos(hFov / 2) * maxRange * Math.cos(vFov / 2)
  );

  const rightBottom = new THREE.Vector3(
    Math.sin(hFov / 2) * maxRange * Math.cos(vFov / 2),
    -maxRange * Math.sin(vFov / 2),
    Math.cos(hFov / 2) * maxRange * Math.cos(vFov / 2)
  );

  binLines.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, rightTop]),
      new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true })
    )
  );
  binLines.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([origin, rightBottom]),
      new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true })
    )
  );

  mesh.add(binLines);

  return mesh;
}
