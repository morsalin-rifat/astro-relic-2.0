import * as THREE from 'three';
import { store } from '../../state/store';
import { makeStarfield, fbm, type Scene } from '../utils';
import { buildSojourner, buildNova } from '../models/builders';
import { STORY } from '../../data/story';
import { audio } from '../audio';

type CamMode = 'orbit' | 'low' | 'close' | 'top' | 'drift';

export class StoryScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rover: THREE.Group;
  private stars = makeStarfield(2500, 500);
  private mode: CamMode = 'drift';
  private modeBlend = 0;
  private disposer: () => void;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1200);
    this.scene.background = new THREE.Color(0x0c0505);
    this.scene.fog = new THREE.Fog(0x140806, 30, 180);
    this.scene.add(this.stars);

    const sun = new THREE.DirectionalLight(0xffc9a0, 2.2);
    sun.position.set(30, 24, -15);
    sun.castShadow = true;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x3c1e12, 0.9));

    // terrain disc
    const geo = new THREE.CircleGeometry(60, 96, 0, Math.PI * 2);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(0x8a4426);
    const light = new THREE.Color(0xb86a42);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const edge = Math.hypot(x, z) / 60;
      const y = fbm(x * 0.03, z * 0.03, 4) * 2.4 * (1 - edge * 0.6);
      pos.setY(i, y);
      const c = base.clone().lerp(light, fbm(x * 0.08 + 9, z * 0.08, 3));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    const built = buildSojourner();
    this.rover = built.group;
    this.rover.scale.setScalar(2.2);
    this.rover.traverse((o) => {
      o.castShadow = true;
    });
    this.scene.add(this.rover);

    const nova = buildNova();
    nova.group.position.set(2.5, 1.8, 2);
    this.scene.add(nova.group);

    audio.play('mars');

    this.disposer = store.on('story:chapter', (d) => {
      this.mode = (d as CamMode) ?? 'orbit';
      this.modeBlend = 0;
    });

    store.set({ showStory: true, storyIndex: 0 });
    this.mode = STORY[0].camera;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    this.modeBlend = Math.min(this.modeBlend + dt * 0.5, 1);
    const k = this.modeBlend * this.modeBlend * (3 - 2 * this.modeBlend);
    const roverPos = this.rover.position.clone().add(new THREE.Vector3(0, 1, 0));

    let targetPos: THREE.Vector3;
    let lookAt = roverPos;
    switch (this.mode) {
      case 'drift':
        targetPos = new THREE.Vector3(Math.sin(t * 0.06) * 16, 7, Math.cos(t * 0.06) * 16);
        break;
      case 'low':
        targetPos = new THREE.Vector3(Math.sin(t * 0.05) * 3, 0.7, 5 + Math.cos(t * 0.07));
        lookAt = roverPos.clone().add(new THREE.Vector3(0, 0.4, 0));
        break;
      case 'orbit':
        targetPos = new THREE.Vector3(Math.sin(t * 0.12) * 7, 3.2, Math.cos(t * 0.12) * 7);
        break;
      case 'close':
        targetPos = new THREE.Vector3(1.8 + Math.sin(t * 0.15) * 0.4, 1.6, 2.4);
        lookAt = roverPos.clone().add(new THREE.Vector3(0, 0.7, 0.3));
        break;
      case 'top':
        targetPos = new THREE.Vector3(0, 6 + t * 0.06, 3.5);
        break;
    }
    this.camera.position.lerp(targetPos, Math.min(dt * (0.8 + k), 1));
    this.camera.lookAt(lookAt);

    this.stars.rotation.y += dt * 0.002;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposer();
    store.set({ showStory: false });
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
