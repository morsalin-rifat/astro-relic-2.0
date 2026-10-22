import * as THREE from 'three';

export interface NovaCharacter {
  group: THREE.Group;
  glow: THREE.Sprite;
  eye: THREE.Mesh;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  hologram: THREE.Group;
  update: (dt: number, t: number) => void;
  setMood: (mood: 'happy' | 'curious' | 'waving' | 'excited') => void;
}

/**
 * Clean placeholder for Nova AI Guide in 3D scene.
 * The 3D model/animation is disabled per user request so the focal point
 * remains entirely on Mars and the surface environment, with Nova guiding
 * the player cleanly via audio/dialogue overlays.
 */
export function buildCartoonNova(): NovaCharacter {
  const root = new THREE.Group();
  root.name = 'NovaPlaceholder';
  root.visible = false; // Hidden from 3D viewport

  const dummySprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ visible: false, transparent: true, opacity: 0 })
  );
  root.add(dummySprite);

  const dummyMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  root.add(dummyMesh);

  const dummyGroup = new THREE.Group();
  dummyGroup.visible = false;
  root.add(dummyGroup);

  return {
    group: root,
    glow: dummySprite,
    eye: dummyMesh,
    head: dummyGroup,
    armL: dummyGroup,
    armR: dummyGroup,
    hologram: dummyGroup,
    update: () => {},
    setMood: () => {},
  };
}
