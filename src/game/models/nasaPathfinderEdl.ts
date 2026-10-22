import * as THREE from 'three';

// -------------------------------------------------------------
// NASA Mars Pathfinder Authentic EDL (Entry, Descent, Landing) Models
// Based on NASA JPL Mars Pathfinder Technical Specifications (1997)
// -------------------------------------------------------------

/**
 * 1. NASA Mars Pathfinder Cruise Stage & Aeroshell Assembly
 */
export function buildPathfinderCruiseStage(): {
  group: THREE.Group;
  root: THREE.Group;
  cruiseStage: THREE.Group;
  aeroshell: THREE.Group;
  heatShield: THREE.Mesh;
  backshell: THREE.Group;
} {
  const root = new THREE.Group();

  // ---------- AEROSHELL (Heat Shield + Backshell) ----------
  const aeroshell = new THREE.Group();

  // Heat Shield: 70-degree sphere-cone blunt shield (NASA Pathfinder 2.65m dia)
  const hsGeo = new THREE.ConeGeometry(1.35, 0.65, 36, 1, true);
  hsGeo.rotateX(Math.PI);

  // Heat Shield Ablative Material (Burnt Carbon-Phenolic & Gold Sheen)
  const hsMat = new THREE.MeshStandardMaterial({
    color: 0x241a14,
    roughness: 0.75,
    metalness: 0.35,
  });
  const heatShield = new THREE.Mesh(hsGeo, hsMat);
  heatShield.position.y = -0.32;
  heatShield.castShadow = true;
  aeroshell.add(heatShield);

  // Heat Shield ablative tile ring detail
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x3d2b20, roughness: 0.8 });
  const tileRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.04, 8, 36), ringMat);
  tileRing.rotation.x = Math.PI / 2;
  tileRing.position.y = -0.48;
  aeroshell.add(tileRing);

  // Backshell: Conical housing covered in gold/amber Kapton thermal blankets
  const backshell = new THREE.Group();
  const bsGeo = new THREE.ConeGeometry(1.3, 0.9, 24);
  const bsMat = new THREE.MeshStandardMaterial({
    color: 0xc89632,
    roughness: 0.3,
    metalness: 0.75,
  });
  const bsMesh = new THREE.Mesh(bsGeo, bsMat);
  bsMesh.position.y = 0.25;
  bsMesh.castShadow = true;
  backshell.add(bsMesh);

  // Parachute Mortar Canister at Apex
  const canisterGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 16);
  const canMat = new THREE.MeshStandardMaterial({ color: 0x909095, roughness: 0.4, metalness: 0.6 });
  const canister = new THREE.Mesh(canisterGeo, canMat);
  canister.position.y = 0.8;
  backshell.add(canister);

  // RAD (Rocket-Assisted Deceleration) Retro-Rocket Nozzles (3 motors inside backshell)
  const radMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.6, metalness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 12), radMat);
    nozzle.position.set(Math.cos(angle) * 0.75, 0.05, Math.sin(angle) * 0.75);
    nozzle.rotation.x = Math.PI;
    backshell.add(nozzle);
  }

  aeroshell.add(backshell);
  root.add(aeroshell);

  // ---------- CRUISE STAGE (Detaches prior to entry) ----------
  const cruiseStage = new THREE.Group();
  const csRingGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.22, 32);
  const csMat = new THREE.MeshStandardMaterial({ color: 0x1b3562, roughness: 0.4, metalness: 0.5 });
  const csRing = new THREE.Mesh(csRingGeo, csMat);
  csRing.position.y = 0.65;
  cruiseStage.add(csRing);

  // Solar cells on cruise stage
  const cellMat = new THREE.MeshStandardMaterial({ color: 0x152345, roughness: 0.2, metalness: 0.8 });
  for (let c = 0; c < 8; c++) {
    const a = (c * Math.PI * 2) / 8;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.8), cellMat);
    panel.position.set(Math.cos(a) * 1.1, 0.76, Math.sin(a) * 1.1);
    panel.rotation.y = -a;
    cruiseStage.add(panel);
  }

  // Medium-gain antenna horn & Sun sensor
  const antMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.7 });
  const antHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 16), antMat);
  antHorn.position.set(0.65, 0.95, -0.65);
  antHorn.rotation.x = 0.4;
  cruiseStage.add(antHorn);

  root.add(cruiseStage);

  return { group: root, root, cruiseStage, aeroshell, heatShield, backshell };
}

/**
 * 2. NASA Mars Pathfinder Supersonic Disc-Gap-Band (DGB) Parachute
 */
export function buildSupersonicParachute(): {
  group: THREE.Group;
  canopy: THREE.Mesh;
  lines: THREE.LineSegments;
} {
  const g = new THREE.Group();

  // Parachute Canopy: Hemispherical dome with alternate orange & white gores
  const canopyGeo = new THREE.SphereGeometry(3.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);

  // Procedural alternating orange/white pattern canvas
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ff521a' : '#f5f5f5';
    ctx.fillRect((i * 256) / 24, 0, 256 / 24 + 1, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const canopyMat = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.1,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 8.5;
  g.add(canopy);

  // 24 Suspension lines connecting backshell to parachute hem
  const lineCount = 24;
  const pos = new Float32Array(lineCount * 2 * 3);
  const bridleY = 0.8; // top of backshell
  const hemY = 8.5 - 0.2;
  const hemRadius = 3.5;

  for (let i = 0; i < lineCount; i++) {
    const angle = (i * Math.PI * 2) / lineCount;
    // Start at backshell apex bridle
    pos[i * 6] = 0;
    pos[i * 6 + 1] = bridleY;
    pos[i * 6 + 2] = 0;

    // End at canopy skirt hem
    pos[i * 6 + 3] = Math.cos(angle) * hemRadius;
    pos[i * 6 + 4] = hemY;
    pos[i * 6 + 5] = Math.sin(angle) * hemRadius;
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xddddcc, transparent: true, opacity: 0.75 });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  g.add(lines);

  return { group: g, canopy, lines };
}

/**
 * 3. NASA Mars Pathfinder 24-Lobe Vectran Airbag Cluster
 */
export function buildPathfinderAirbagCluster(): THREE.Group {
  const g = new THREE.Group();

  const bagMat = new THREE.MeshStandardMaterial({
    color: 0xdfd8c8, // Creamy tan-white high-strength Vectran fabric
    roughness: 0.7,
    metalness: 0.1,
  });

  // Construct interconnected spherical lobes arranged in a tetrahedral cluster
  const lobeGeo = new THREE.SphereGeometry(0.85, 18, 16);

  // Center tetrahedral arrangement (4 primary groups of 6 lobes each = 24 lobes)
  const clusterCenters: [number, number, number][] = [
    // Bottom lobe cluster
    [0, -0.6, 0],
    [0.7, -0.4, 0.4],
    [-0.7, -0.4, 0.4],
    [0, -0.4, -0.8],
    [0.8, -0.6, -0.5],
    [-0.8, -0.6, -0.5],

    // Upper petal lobes
    [0.9, 0.5, 0.4],
    [-0.9, 0.5, 0.4],
    [0, 0.5, -1.0],
    [0, 1.0, 0],
    [0.5, 0.8, -0.5],
    [-0.5, 0.8, -0.5],
    [0.8, 0.0, 0.8],
    [-0.8, 0.0, 0.8],
    [1.1, 0.1, -0.4],
    [-1.1, 0.1, -0.4],
  ];

  clusterCenters.forEach(([x, y, z]) => {
    const lobe = new THREE.Mesh(lobeGeo, bagMat);
    lobe.position.set(x, y, z);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    g.add(lobe);
  });

  // Structural Seam & Kevlar Retraction Tendons
  const tendonMat = new THREE.MeshBasicMaterial({ color: 0x7c6d58 });
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI) / 3;
    const strap = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.03, 6, 24), tendonMat);
    strap.rotation.set(Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0);
    g.add(strap);
  }

  return g;
}

/**
 * 4. Atmospheric Entry Plasma Shockwave Fire Cone
 */
export function buildEntryPlasmaShockwave(): {
  group: THREE.Group;
  plasmaCone: THREE.Mesh;
  glowLight: THREE.PointLight;
} {
  const g = new THREE.Group();

  // Supersonic Plasma Sheath Cone
  const coneGeo = new THREE.ConeGeometry(2.2, 3.6, 32, 1, true);
  coneGeo.rotateX(Math.PI);

  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0xff6622,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const plasmaCone = new THREE.Mesh(coneGeo, plasmaMat);
  plasmaCone.position.y = -1.2;
  g.add(plasmaCone);

  // Intense incandescent white-hot plasma light
  const glowLight = new THREE.PointLight(0xff7722, 0, 45);
  glowLight.position.set(0, -1.5, 0);
  g.add(glowLight);

  return { group: g, plasmaCone, glowLight };
}
