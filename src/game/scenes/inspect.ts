import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store } from '../../state/store';
import { makeStarfield, type Scene } from '../utils';
import { buildSojourner } from '../models/builders';
import { HOTSPOTS } from '../../data/story';
import { UI } from '../../data/content';

export class InspectScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private markers: { id: string; mesh: THREE.Mesh }[] = [];
  private stars = makeStarfield(2000, 400);

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 800);
    this.camera.position.set(2.6, 1.8, 3.2);
    this.scene.background = new THREE.Color(0x060409);
    this.scene.add(this.stars);

    const key = new THREE.DirectionalLight(0xffe0c0, 2.4);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x6f86b8, 0.7);
    fill.position.set(-4, 2, -3);
    this.scene.add(fill);
    this.scene.add(new THREE.AmbientLight(0x2a2030, 1));

    // pedestal ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(6, 48),
      new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const built = buildSojourner();
    const rover = built.group;
    rover.scale.setScalar(2.4);
    rover.traverse((o) => {
      o.castShadow = true;
    });
    this.scene.add(rover);

    // hotspot markers
    HOTSPOTS.forEach((h) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd97d, transparent: true, opacity: 0.9 })
      );
      m.position.set(h.pos[0] * 2.4, h.pos[1] * 2.4, h.pos[2] * 2.4);
      m.name = `hotspot:${h.id}`;
      // halo ring
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.09, 0.12, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd97d, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      halo.name = `halo:${h.id}`;
      m.add(halo);
      // generous invisible hit area (child-friendly clicking)
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.name = `hit:${h.id}`;
      m.add(hit);
      this.scene.add(m);
      this.markers.push({ id: h.id, mesh: m });
    });

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.6;
    this.controls.maxDistance = 7;
    this.controls.target.set(0, 1.1, 0);

    store.set({ hint: UI.hotspotHint, activeHotspot: null });
  }

  onClick(x: number, y: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const hits = this.raycaster.intersectObjects(this.markers.map((m) => m.mesh), true);
    if (hits.length === 0) return;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.name.startsWith('hotspot:')) obj = obj.parent;
    if (!obj) return;
    const id = obj.name.split(':')[1];
    const visited = store.get().visitedHotspots;
    store.set({
      activeHotspot: id,
      visitedHotspots: visited.includes(id) ? visited : [...visited, id],
    });
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    this.markers.forEach(({ id, mesh }) => {
      const s = 1 + Math.sin(t * 3 + id.length) * 0.25;
      mesh.scale.setScalar(s);
      const halo = mesh.children[0];
      if (halo) halo.lookAt(this.camera.position);
      const visited = store.get().visitedHotspots.includes(id);
      (mesh.material as THREE.MeshBasicMaterial).color.set(visited ? 0x9fd8ff : 0xffd97d);
    });
    this.stars.rotation.y += dt * 0.002;
    this.controls.update();
    // debug hook for E2E tests
    (window as any).__hotspots = this.markers.map(({ id, mesh }) => {
      const v = mesh.position.clone().project(this.camera);
      return { id, x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight, behind: v.z > 1 };
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    store.set({ hint: null, activeHotspot: null });
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
