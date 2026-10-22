import * as THREE from 'three';
import { makeStarfield, makeGlowTexture, makeCanvasTexture, type Scene } from '../utils';
import { buildNova } from '../models/builders';

export class HomeScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private earth: THREE.Mesh;
  private clouds: THREE.Mesh;
  private stars: THREE.Points;
  private nova = buildNova();
  private mouse = { x: 0, y: 0 };
  private disposables: { dispose(): void }[] = [];

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 2000);
    this.camera.position.set(0, 1.2, 9);

    this.scene.background = new THREE.Color(0x030308);

    this.stars = makeStarfield(5000, 700);
    this.scene.add(this.stars);

    // distant sun glow
    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('rgba(255,214,150,1)', 'rgba(255,140,60,0)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sunGlow.position.set(-28, 10, -40);
    sunGlow.scale.set(30, 30, 1);
    this.scene.add(sunGlow);

    // Earth with procedural texture
    const earthTex = makeCanvasTexture(1024, (ctx, s) => {
      const grd = ctx.createLinearGradient(0, 0, 0, s);
      grd.addColorStop(0, '#dfe9f2');
      grd.addColorStop(0.12, '#1c4d7a');
      grd.addColorStop(0.5, '#16436f');
      grd.addColorStop(0.88, '#1c4d7a');
      grd.addColorStop(1, '#e6edf4');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, s, s);
      // continents
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * s;
        const y = s * 0.12 + Math.random() * s * 0.76;
        const r = 20 + Math.random() * 90;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const green = Math.random() > 0.45;
        g.addColorStop(0, green ? 'rgba(74,110,62,0.95)' : 'rgba(140,120,80,0.9)');
        g.addColorStop(1, 'rgba(30,70,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 64, 48),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.85, metalness: 0.05 })
    );
    this.earth.position.set(0, -0.6, 0);
    this.scene.add(this.earth);

    // clouds layer
    const cloudTex = makeCanvasTexture(1024, (ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 10 + Math.random() * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.28)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(3.26, 64, 48),
      new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        depthWrite: false,
        roughness: 1,
      })
    );
    this.clouds.position.copy(this.earth.position);
    this.scene.add(this.clouds);

    // atmosphere rim
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(3.45, 64, 48),
      new THREE.MeshBasicMaterial({
        color: 0x6fb2ff,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    atmo.position.copy(this.earth.position);
    this.scene.add(atmo);

    // lighting: sun key from left
    const key = new THREE.DirectionalLight(0xffe2b8, 3.2);
    key.position.set(-20, 8, -6);
    this.scene.add(key);
    this.scene.add(new THREE.AmbientLight(0x223044, 0.8));

    // Nova drone hovering near Earth
    this.nova.group.position.set(2.6, 0.8, 3.5);
    this.nova.setMood('waving');
    this.scene.add(this.nova.group);

    // a few soft nebula sprites
    const nebTex = makeGlowTexture('rgba(120,90,180,0.35)', 'rgba(60,30,90,0)');
    for (let i = 0; i < 6; i++) {
      const neb = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: nebTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 })
      );
      neb.position.set((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 160, -250 - Math.random() * 200);
      const sc = 90 + Math.random() * 140;
      neb.scale.set(sc, sc, 1);
      this.scene.add(neb);
    }

    this.disposables.push(earthTex, cloudTex, this.earth.geometry, this.clouds.geometry);
  }

  onPointerMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    this.earth.rotation.y += dt * 0.03;
    this.clouds.rotation.y += dt * 0.041;
    this.stars.rotation.y += dt * 0.004;

    // camera drift + mouse parallax
    const tx = this.mouse.x * 1.4;
    const ty = 1.2 + this.mouse.y * 0.8;
    this.camera.position.x += (tx - this.camera.position.x) * dt * 1.6;
    this.camera.position.y += (ty - this.camera.position.y) * dt * 1.6;
    this.camera.lookAt(0, -0.4, 0);

    // Nova bobbing & animation
    this.nova.update(dt, t);
    this.nova.group.position.y = 0.8 + Math.sin(t * 1.4) * 0.15;
    this.nova.group.rotation.y = Math.sin(t * 0.6) * 0.4;
    this.nova.group.rotation.z = Math.sin(t * 0.9) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
