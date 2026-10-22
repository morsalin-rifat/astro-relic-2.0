import * as THREE from 'three';
import { store } from '../../state/store';
import { audio } from '../audio';
import { makeStarfield, fbm, type Scene } from '../utils';
import { buildSojourner, buildFlag, buildNova } from '../models/builders';
import { SOJOURNER_AFTER_STORY } from '../../data/content';

export class CompleteScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private cloth: THREE.Mesh;
  private flagGroup: THREE.Group;
  private stars = makeStarfield(2500, 500);
  private time = 0;
  private flagY = 0.3;
  private clothBase: Float32Array;
  private overlayShown = false;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1200);
    this.camera.position.set(0, 2.2, 7);
    this.scene.background = new THREE.Color(0x0c0505);
    this.scene.fog = new THREE.Fog(0x140806, 40, 200);
    this.scene.add(this.stars);

    const sun = new THREE.DirectionalLight(0xffc9a0, 2.2);
    sun.position.set(30, 20, -15);
    sun.castShadow = true;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x3c1e12, 0.9));

    const geo = new THREE.CircleGeometry(70, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, fbm(pos.getX(i) * 0.03, pos.getZ(i) * 0.03, 3) * 1.8);
    }
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x8a4426, roughness: 1 })
    );
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    const rover = buildSojourner().group;
    rover.scale.setScalar(2.2);
    rover.position.set(-2.2, 0, 1.2);
    rover.rotation.y = 0.7;
    rover.traverse((o) => (o.castShadow = true));
    this.scene.add(rover);

    const nova = buildNova();
    nova.group.position.set(1.8, 1.6, 2.4);
    this.scene.add(nova.group);

    const flag = buildFlag();
    this.flagGroup = flag.group;
    this.cloth = flag.cloth;
    this.cloth.position.set(0.78, this.flagY, 0);
    this.clothBase = (this.cloth.geometry as THREE.PlaneGeometry).attributes.position.array.slice() as Float32Array;
    this.flagGroup.position.set(1.4, 0, -1);
    this.scene.add(this.flagGroup);

    audio.play('mars');

    // rover farewell lines, then the flag rises
    setTimeout(() => {
      store.say(SOJOURNER_AFTER_STORY);
    }, 1200);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    this.time += dt;

    // flag rises once the dialogue has likely been read (~4s in)
    if (this.time > 4 && this.flagY < 2.6) {
      this.flagY += dt * 0.5;
      this.cloth.position.y = this.flagY;
    }

    // cloth wave
    const posAttr = (this.cloth.geometry as THREE.PlaneGeometry).attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = this.clothBase[i * 3];
      const wave = Math.sin(x * 4 + t * 3.2) * 0.08 * (x + 0.75);
      posAttr.setZ(i, wave);
    }
    posAttr.needsUpdate = true;

    // camera slow pull back and up
    const pull = Math.min(this.time / 10, 1);
    const eased = pull * pull * (3 - 2 * pull);
    this.camera.position.set(Math.sin(t * 0.05) * (7 + eased * 9), 2.2 + eased * 7, 7 + eased * 12);
    this.camera.lookAt(0.3, 1.6 + eased * 1.4, 0);

    // show the completion overlay once the farewell lines have been read
    if (
      !this.overlayShown &&
      this.time > 0.1 &&
      !store.get().current &&
      store.get().queue.length === 0
    ) {
      this.overlayShown = true;
      store.emit('ui:showComplete');
    }

    this.stars.rotation.y += dt * 0.002;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
