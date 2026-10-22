import * as THREE from 'three';
import { buildCartoonNova, type NovaCharacter } from './novaCharacter';

// ---------- Sojourner rover (procedural, ~1:1 proportions) ----------
export function buildSojourner(): { group: THREE.Group; parts: Record<string, THREE.Object3D> } {
  const g = new THREE.Group();
  const parts: Record<string, THREE.Object3D> = {};

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.6, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.8, metalness: 0.2 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1c3a6e, roughness: 0.35, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.85, metalness: 0.4 });

  // chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.48), bodyMat);
  body.position.y = 0.42;
  body.castShadow = true;
  g.add(body);
  parts.body = body;

  // solar panel top
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.44), panelMat);
  panel.position.y = 0.52;
  panel.castShadow = true;
  g.add(panel);
  parts.power = panel;
  // panel grid lines
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x2a4f92 });
  for (let i = -2; i <= 2; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.022, 0.44), gridMat);
    line.position.set(i * 0.1, 0.52, 0);
    g.add(line);
  }

  // wheels + rocker arms
  const wheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 20);
  wheelGeo.rotateX(Math.PI / 2);
  const wheelGroup = new THREE.Group();
  const wheelPositions: [number, number][] = [
    [0.26, 0.2],
    [0.0, 0.24],
    [-0.26, 0.2],
    [0.26, -0.2],
    [0.0, -0.24],
    [-0.26, -0.2],
  ];
  wheelPositions.forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.065, z);
    w.castShadow = true;
    wheelGroup.add(w);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.1), darkMat);
    arm.position.set(x, 0.2, z * 0.8);
    arm.rotation.x = z > 0 ? 0.5 : -0.5;
    wheelGroup.add(arm);
  });
  g.add(wheelGroup);
  parts.wheels = wheelGroup;

  // mast + camera head (front)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 8), darkMat);
  mast.position.set(0, 0.72, 0.18);
  mast.castShadow = true;
  g.add(mast);
  const head = new THREE.Group();
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.07), bodyMat);
  headBox.castShadow = true;
  head.add(headBox);
  const lensGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12);
  lensGeo.rotateX(Math.PI / 2);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.2, metalness: 0.8 });
  [-0.035, 0.035].forEach((x) => {
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(x, 0, 0.045);
    head.add(lens);
  });
  head.position.set(0, 0.94, 0.18);
  g.add(head);
  parts.cameras = head;

  // rear color camera
  const rearCam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), darkMat);
  rearCam.position.set(0.12, 0.52, -0.22);
  g.add(rearCam);

  // comms antenna (UHF whip) + low-gain antenna
  const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.34, 6), darkMat);
  whip.position.set(-0.24, 0.7, -0.16);
  whip.rotation.z = 0.15;
  g.add(whip);
  const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.08, 12), bodyMat);
  lg.position.set(-0.24, 0.55, 0.16);
  g.add(lg);
  parts.comms = whip;

  // APXS deployment arm (small cylinder front-right)
  const apxs = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), darkMat);
  apxs.position.set(0.24, 0.3, 0.2);
  apxs.rotation.x = 0.6;
  g.add(apxs);

  return { group: g, parts };
}

// ---------- stylized child explorer character ----------
export function buildExplorer(): THREE.Group {
  const g = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.7 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xffb347, roughness: 0.5 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x223244,
    roughness: 0.15,
    metalness: 0.9,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 6, 12), suitMat);
  body.position.y = 0.72;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), suitMat);
  head.position.y = 1.22;
  head.castShadow = true;
  g.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16, -Math.PI / 2.6, Math.PI / 1.3, Math.PI / 4, Math.PI / 2), visorMat);
  visor.position.set(0, 1.22, 0.06);
  g.add(visor);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.14), accentMat);
  backpack.position.set(0, 0.85, -0.26);
  backpack.castShadow = true;
  g.add(backpack);

  const legGeo = new THREE.CapsuleGeometry(0.07, 0.22, 4, 8);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.1, 0.28, 0);
  legL.castShadow = true;
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.1;
  g.add(legR);

  const armGeo = new THREE.CapsuleGeometry(0.055, 0.26, 4, 8);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.3, 0.78, 0);
  armL.rotation.z = 0.25;
  g.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.3;
  armR.rotation.z = -0.25;
  g.add(armR);

  // little antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), accentMat);
  ant.position.set(0.1, 1.44, 0);
  g.add(ant);
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd97d })
  );
  tip.position.set(0.1, 1.53, 0);
  g.add(tip);

  g.userData.limbs = { legL, legR, armL, armR };
  return g;
}

// ---------- Nova cartoon AI guide companion ----------
export function buildNova(): NovaCharacter {
  return buildCartoonNova();
}

// ---------- journey flag ----------
export function buildFlag(): { group: THREE.Group; cloth: THREE.Mesh } {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 3.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x9a958a, roughness: 0.5, metalness: 0.6 })
  );
  pole.position.y = 1.7;
  pole.castShadow = true;
  g.add(pole);

  const clothGeo = new THREE.PlaneGeometry(1.5, 0.9, 16, 8);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 154;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c1543a';
  ctx.fillRect(0, 0, 256, 154);
  ctx.fillStyle = '#f3e9d7';
  ctx.font = '700 34px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1997', 128, 70);
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.fillText('PATHFINDER · SOJOURNER', 128, 108);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.Mesh(
    clothGeo,
    new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.9,
    })
  );
  cloth.castShadow = true;
  g.add(cloth);
  return { group: g, cloth };
}
