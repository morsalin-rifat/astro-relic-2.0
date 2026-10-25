// @ts-nocheck — strict index-access checks are noisy for this array-heavy particle scene.
import * as THREE from 'three';
import { makeGlowTexture, makeCanvasTexture, fbm, type Scene } from '../utils';
import { buildNova } from '../models/builders';

const MOUSE_RADIUS = 0.42; // NDC units
const NEAR_COUNT = 130;
const DUST_COUNT = 160;
const FAR_COUNT = 2600;

interface Dust {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number; // 0..1, 1 = dead
  maxLife: number;
}

/**
 * Magical interactive starfield home scene.
 * Far stars twinkle on the GPU; near stars react to the pointer
 * (brighten, drift toward it, shed stardust). A shooting star flies
 * by every few seconds. Glowing Mars hints at the universe screen.
 */
export class HomeScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private nova = buildNova();
  private mouse = { x: 0, y: 0, active: false };
  private disposables: { dispose(): void }[] = [];
  private v = new THREE.Vector3();

  // far twinkling stars (GPU shader)
  private farGeo = new THREE.BufferGeometry();
  private farMat: THREE.ShaderMaterial;

  // near interactive stars (CPU-updated)
  private nearGeo = new THREE.BufferGeometry();
  private nearMat: THREE.ShaderMaterial;
  private nearHome: Float32Array;
  private nearPhase: Float32Array;
  private nearSpeed: Float32Array;
  private nearBase: Float32Array; // base color per star
  private nearPos: Float32Array;
  private nearCol: Float32Array;

  // stardust particles shed by the cursor
  private dustGeo = new THREE.BufferGeometry();
  private dustMat: THREE.ShaderMaterial;
  private dust: Dust[] = [];
  private dustPos: Float32Array;
  private dustLife: Float32Array;
  private dustSize: Float32Array;

  // shooting star
  private shoot: THREE.Mesh;
  private shootMat: THREE.MeshBasicMaterial;
  private shootLife = -1;
  private shootNext = 2.5;
  private shootVel = new THREE.Vector3();

  // mars
  private mars: THREE.Mesh;
  private marsGlow: THREE.Sprite;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 3000);
    this.camera.position.set(0, 0.3, 9);
    this.scene.background = new THREE.Color(0x060714);

    // ---------- far twinkling stars ----------
    const farPos = new Float32Array(FAR_COUNT * 3);
    const farSize = new Float32Array(FAR_COUNT);
    const farPhase = new Float32Array(FAR_COUNT);
    const farCol = new Float32Array(FAR_COUNT * 3);
    for (let i = 0; i < FAR_COUNT; i++) {
      const r = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      farPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      farPos[i * 3 + 1] = r * Math.cos(phi);
      farPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      farSize[i] = 0.8 + Math.random() * 2.4;
      farPhase[i] = Math.random();
      const warm = Math.random();
      const c = new THREE.Color().setHSL(
        warm < 0.7 ? 0.6 : warm < 0.9 ? 0.09 : 0.5,
        0.3,
        0.7 + Math.random() * 0.3
      );
      farCol[i * 3] = c.r;
      farCol[i * 3 + 1] = c.g;
      farCol[i * 3 + 2] = c.b;
    }
    this.farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
    this.farGeo.setAttribute('aSize', new THREE.BufferAttribute(farSize, 1));
    this.farGeo.setAttribute('aPhase', new THREE.BufferAttribute(farPhase, 1));
    this.farGeo.setAttribute('aColor', new THREE.BufferAttribute(farCol, 3));
    this.farMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 aColor;
        uniform float uTime;
        varying vec3 vColor;
        varying float vTw;
        void main() {
          vTw = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase * 2.4) + aPhase * 6.2831));
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (900.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTw;
        void main() {
          float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor * (0.8 + 0.6 * vTw), a * vTw);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.farGeo, this.farMat));
    this.disposables.push(this.farGeo, this.farMat);

    // ---------- near interactive stars ----------
    this.nearHome = new Float32Array(NEAR_COUNT * 3);
    this.nearPhase = new Float32Array(NEAR_COUNT);
    this.nearSpeed = new Float32Array(NEAR_COUNT);
    this.nearBase = new Float32Array(NEAR_COUNT * 3);
    this.nearPos = new Float32Array(NEAR_COUNT * 3);
    this.nearCol = new Float32Array(NEAR_COUNT * 3);
    const nearSize = new Float32Array(NEAR_COUNT);
    for (let i = 0; i < NEAR_COUNT; i++) {
      const i3 = i * 3;
      this.nearHome[i3] = (Math.random() - 0.5) * 20;
      this.nearHome[i3 + 1] = (Math.random() - 0.5) * 11;
      this.nearHome[i3 + 2] = 1 + Math.random() * 6.5;
      this.nearPos[i3] = this.nearHome[i3];
      this.nearPos[i3 + 1] = this.nearHome[i3 + 1];
      this.nearPos[i3 + 2] = this.nearHome[i3 + 2];
      this.nearPhase[i] = Math.random();
      this.nearSpeed[i] = 1.2 + Math.random() * 2.5;
      nearSize[i] = 0.02 + Math.random() * 0.045;
      const kind = Math.random();
      const c = new THREE.Color().setHSL(
        kind < 0.55 ? 0.12 : kind < 0.8 ? 0.55 : 0.6,
        kind < 0.55 ? 0.75 : 0.55,
        0.82
      );
      this.nearBase[i3] = c.r;
      this.nearBase[i3 + 1] = c.g;
      this.nearBase[i3 + 2] = c.b;
    }
    this.nearGeo.setAttribute('position', new THREE.BufferAttribute(this.nearPos, 3));
    this.nearGeo.setAttribute('aColor', new THREE.BufferAttribute(this.nearCol, 3));
    this.nearGeo.setAttribute('aSize', new THREE.BufferAttribute(nearSize, 1));
    this.nearMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (600.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float a = smoothstep(0.5, 0.08, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.nearGeo, this.nearMat));
    this.disposables.push(this.nearGeo, this.nearMat);

    // ---------- stardust ----------
    this.dustPos = new Float32Array(DUST_COUNT * 3);
    this.dustLife = new Float32Array(DUST_COUNT);
    this.dustSize = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      this.dustPos[i * 3] = 9999;
      this.dustPos[i * 3 + 1] = 9999;
      this.dustPos[i * 3 + 2] = 9999;
      this.dustLife[i] = 1;
      this.dustSize[i] = 0.008 + Math.random() * 0.022;
      this.dust.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 1,
        maxLife: 0.7 + Math.random() * 0.6,
      });
    }
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3));
    this.dustGeo.setAttribute('aLife', new THREE.BufferAttribute(this.dustLife, 1));
    this.dustGeo.setAttribute('aSize', new THREE.BufferAttribute(this.dustSize, 1));
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aLife;
        attribute float aSize;
        varying float vLife;
        void main() {
          vLife = aLife;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (600.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vLife;
        void main() {
          float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
          float fade = pow(max(0.0, 1.0 - vLife), 1.5);
          gl_FragColor = vec4(1.0, 0.93, 0.75, a * fade * 0.9);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.dustGeo, this.dustMat));
    this.disposables.push(this.dustGeo, this.dustMat);

    // ---------- shooting star ----------
    const shootTex = makeCanvasTexture(256, (ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      const g = ctx.createLinearGradient(0, s / 2, s, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.65, 'rgba(190,220,255,0.45)');
      g.addColorStop(0.9, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(s / 2, s / 2, s / 2, s * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    this.shootMat = new THREE.MeshBasicMaterial({
      map: shootTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shoot = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.1), this.shootMat);
    this.shoot.visible = false;
    this.scene.add(this.shoot);
    this.disposables.push(shootTex, this.shoot.geometry, this.shootMat);

    // ---------- Mars (promise of the universe screen) ----------
    const marsTex = makeCanvasTexture(256, (ctx, s) => {
      const img = ctx.createImageData(s, s);
      const d = img.data;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const n = fbm(x * 0.05, y * 0.05, 4);
          const i = (y * s + x) * 4;
          d[i] = 120 + n * 110;
          d[i + 1] = 48 + n * 70;
          d[i + 2] = 30 + n * 45;
          d[i + 3] = 255;
          // polar cap
          const cap = Math.max(0, 1 - y / (s * 0.09));
          if (cap > 0) {
            d[i] = d[i] * (1 - cap) + 245 * cap;
            d[i + 1] = d[i + 1] * (1 - cap) + 240 * cap;
            d[i + 2] = d[i + 2] * (1 - cap) + 235 * cap;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    });
    this.mars = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 48, 32),
      new THREE.MeshStandardMaterial({ map: marsTex, roughness: 0.9, metalness: 0.05 })
    );
    this.mars.position.set(4.6, 2.1, -16);
    this.scene.add(this.mars);
    this.disposables.push(marsTex, this.mars.geometry, this.mars.material as THREE.Material);

    const glowTex = makeGlowTexture('rgba(255,130,80,1)', 'rgba(255,70,25,0)');
    this.marsGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.marsGlow.position.copy(this.mars.position);
    this.marsGlow.scale.set(5.2, 5.2, 1);
    this.scene.add(this.marsGlow);
    this.disposables.push(glowTex, this.marsGlow.material);

    // ---------- nebulas ----------
    const nebTints: [string, string][] = [
      ['rgba(150,110,255,0.5)', 'rgba(70,40,140,0)'],
      ['rgba(90,200,255,0.45)', 'rgba(30,90,160,0)'],
      ['rgba(255,120,190,0.4)', 'rgba(140,40,110,0)'],
    ];
    const nebTexes = nebTints.map(([a, b]) => makeGlowTexture(a, b));
    for (let i = 0; i < 6; i++) {
      const neb = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: nebTexes[i % nebTexes.length],
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.32,
        })
      );
      neb.position.set(
        (Math.random() - 0.5) * 260,
        (Math.random() - 0.5) * 140,
        -180 - Math.random() * 160
      );
      const sc = 80 + Math.random() * 130;
      neb.scale.set(sc, sc, 1);
      this.scene.add(neb);
      this.disposables.push(neb.material);
    }
    nebTexes.forEach((t) => this.disposables.push(t));

    // ---------- lights + Nova ----------
    const key = new THREE.DirectionalLight(0x9fb8ff, 2.2);
    key.position.set(-6, 6, 8);
    this.scene.add(key);
    this.scene.add(new THREE.AmbientLight(0x2a2a55, 1.4));

    this.nova.group.position.set(2.6, -2.2, 4.5);
    this.nova.setMood('waving');
    this.scene.add(this.nova.group);
  }

  onPointerMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = true;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private spawnDust(count: number) {
    this.v.set(this.mouse.x, this.mouse.y, 0).unproject(this.camera);
    for (let n = 0; n < count; n++) {
      const d = this.dust.find((x) => x.life >= 1);
      if (!d) return;
      d.pos.copy(this.v);
      d.pos.x += (Math.random() - 0.5) * 0.6;
      d.pos.y += (Math.random() - 0.5) * 0.6;
      d.vel.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.3);
      d.life = 0;
    }
  }

  private updateNearStars(dt: number, t: number) {
    const pos = this.nearPos;
    const col = this.nearCol;
    const home = this.nearHome;
    for (let i = 0; i < NEAR_COUNT; i++) {
      const i3 = i * 3;
      this.v.set(home[i3], home[i3 + 1], home[i3 + 2]).project(this.camera);
      const nx = this.v.x;
      const ny = this.v.y;
      const nz = this.v.z;
      const dx = this.mouse.x - nx;
      const dy = this.mouse.y - ny;
      const inf = this.mouse.active
        ? Math.exp(-(dx * dx + dy * dy) / (MOUSE_RADIUS * MOUSE_RADIUS))
        : 0;
      const tw = 0.6 + 0.4 * Math.sin(t * this.nearSpeed[i] + this.nearPhase[i] * 6.2831);
      const b = Math.min(1.7, 0.28 + tw * 0.75 + inf * 1.5);
      col[i3] = this.nearBase[i3] * b;
      col[i3 + 1] = this.nearBase[i3 + 1] * b;
      col[i3 + 2] = this.nearBase[i3 + 2] * b;
      // gentle pull toward the cursor
      const pull = 0.2 * inf;
      this.v.set(nx + dx * pull, ny + dy * pull, nz).unproject(this.camera);
      const k = Math.min(1, dt * 5);
      pos[i3] += (this.v.x - pos[i3]) * k;
      pos[i3 + 1] += (this.v.y - pos[i3 + 1]) * k;
      pos[i3 + 2] += (this.v.z - pos[i3 + 2]) * k;
    }
    (this.nearGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.nearGeo.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateDust(dt: number) {
    const pos = this.dustPos;
    for (let i = 0; i < DUST_COUNT; i++) {
      const d = this.dust[i];
      const i3 = i * 3;
      if (d.life >= 1) continue;
      d.life = Math.min(1, d.life + dt / d.maxLife);
      const damp = Math.exp(-1.8 * dt);
      d.vel.multiplyScalar(damp);
      d.pos.addScaledVector(d.vel, dt);
      pos[i3] = d.pos.x;
      pos[i3 + 1] = d.pos.y;
      pos[i3 + 2] = d.pos.z;
      this.dustLife[i] = d.life;
    }
    (this.dustGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.dustGeo.getAttribute('aLife') as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateShooting(dt: number) {
    if (this.shootLife < 0) {
      this.shootNext -= dt;
      if (this.shootNext <= 0) {
        this.shootLife = 0;
        this.shoot.position.set(-6 + Math.random() * 10, 2.5 + Math.random() * 2.5, -30);
        this.shootVel.set(-(4 + Math.random() * 4), -(1.2 + Math.random() * 1.6), 0);
        this.shootVel.normalize().multiplyScalar(17);
        this.shoot.rotation.z = Math.atan2(this.shootVel.y, this.shootVel.x);
        this.shoot.visible = true;
        this.shootNext = 4 + Math.random() * 5;
      }
      return;
    }
    this.shootLife += dt;
    this.shoot.position.addScaledVector(this.shootVel, dt);
    const k = this.shootLife / 1.3;
    this.shootMat.opacity = Math.sin(Math.PI * Math.min(1, k)) * 0.9;
    if (k >= 1) {
      this.shootLife = -1;
      this.shoot.visible = false;
    }
  }

  private updateMars(dt: number) {
    this.mars.rotation.y += dt * 0.06;
    this.v.copy(this.mars.position).project(this.camera);
    const d = Math.hypot(this.mouse.x - this.v.x, this.mouse.y - this.v.y);
    const target = d < 0.17 ? 0.85 : 0.45;
    const mat = this.marsGlow.material as THREE.SpriteMaterial;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 3);
  }

  update(dt: number, t: number) {
    this.farMat.uniforms.uTime.value = t;

    // slow cosmic drift of the far field
    this.camera.position.x += (this.mouse.x * 1.1 - this.camera.position.x) * Math.min(1, dt * 2.2);
    this.camera.position.y += (0.3 + this.mouse.y * 0.6 - this.camera.position.y) * Math.min(1, dt * 2.2);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    this.updateNearStars(dt, t);
    this.updateDust(dt);

    // shed stardust while the cursor sweeps across bright stars
    if (this.mouse.active && Math.random() < dt * 26) this.spawnDust(1);

    this.updateShooting(dt);
    this.updateMars(dt);

    // Nova bobbing & waving
    this.nova.update(dt, t);
    this.nova.group.position.y = -2.2 + Math.sin(t * 1.3) * 0.12;
    this.nova.group.rotation.y = Math.sin(t * 0.5) * 0.35;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.scene.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
