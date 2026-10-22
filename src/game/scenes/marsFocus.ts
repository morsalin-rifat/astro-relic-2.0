import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store } from '../../state/store';
import { audio } from '../audio';
import { makeStarfield, makeGlowTexture, makeTextSprite, makeCanvasTexture, fbm, type Scene } from '../utils';
import { buildNova, buildExplorer } from '../models/builders';
import {
  NOVA_INTRO,
  NOVA_AFTER_MOVE,
  NOVA_AFTER_ROTATE,
  NOVA_POINT_MARS,
  NOVA_TWO_WORLDS,
} from '../../data/content';

// ---------------- High-Fidelity Procedural Mars Texture Generator ----------------
export function createHighFidelityMarsTexture(size = 1024): THREE.CanvasTexture {
  return makeCanvasTexture(size, (ctx, s) => {
    // 1. Base Martian Iron Oxide Gradient
    const baseGrad = ctx.createLinearGradient(0, 0, 0, s);
    baseGrad.addColorStop(0, '#9c381c');   // North subpolar
    baseGrad.addColorStop(0.2, '#bf4c2a'); // Northern lowlands
    baseGrad.addColorStop(0.5, '#c95432'); // Equatorial plains
    baseGrad.addColorStop(0.8, '#a83c1e'); // Southern cratered highlands
    baseGrad.addColorStop(1, '#8f2f16');   // South subpolar
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, s, s);

    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;

    // 2. Multi-octave Topography & Mineral Composition Noise
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const n1 = fbm(u * 6.0, v * 6.0, 5);
        const n2 = fbm(u * 18.0, v * 18.0, 3);
        const n = n1 * 0.75 + n2 * 0.25;

        const idx = (y * s + x) * 4;

        // Dark volcanic basalt regions (Syrtis Major, Acidalia Planitia, Sinus Meridiani)
        if (n < 0.44) {
          const darkFactor = 0.55 + n * 0.9;
          d[idx] = Math.floor(d[idx] * darkFactor * 0.85);
          d[idx + 1] = Math.floor(d[idx + 1] * darkFactor * 0.65);
          d[idx + 2] = Math.floor(d[idx + 2] * darkFactor * 0.65);
        } else if (n > 0.62) {
          // Bright ochre highlands & dust plains
          const bright = (n - 0.62) * 80;
          d[idx] = Math.min(255, d[idx] + bright);
          d[idx + 1] = Math.min(255, d[idx + 1] + bright * 0.7);
          d[idx + 2] = Math.min(255, d[idx + 2] + bright * 0.3);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Iconic Mars Landmark: Olympus Mons (Largest Volcano in the Solar System)
    const oX = s * 0.28;
    const oY = s * 0.42;
    const oR = s * 0.085;

    // Outer volcanic shield aureole
    const oGrad = ctx.createRadialGradient(oX, oY, oR * 0.15, oX, oY, oR);
    oGrad.addColorStop(0, '#e87850');
    oGrad.addColorStop(0.4, '#c95432');
    oGrad.addColorStop(0.8, '#872a14');
    oGrad.addColorStop(1, 'rgba(135, 42, 20, 0)');
    ctx.fillStyle = oGrad;
    ctx.beginPath();
    ctx.arc(oX, oY, oR, 0, Math.PI * 2);
    ctx.fill();

    // Central Caldera Depression
    ctx.fillStyle = '#4a1508';
    ctx.beginPath();
    ctx.ellipse(oX, oY, oR * 0.2, oR * 0.14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Iconic Mars Landmark: Valles Marineris (4,000 km Grand Canyon Chasm)
    ctx.strokeStyle = '#380f06';
    ctx.lineWidth = s * 0.022;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.38, s * 0.52);
    ctx.bezierCurveTo(s * 0.48, s * 0.48, s * 0.62, s * 0.56, s * 0.74, s * 0.53);
    ctx.stroke();

    // Canyon wall highlights
    ctx.strokeStyle = '#d66845';
    ctx.lineWidth = s * 0.006;
    ctx.beginPath();
    ctx.moveTo(s * 0.38, s * 0.51);
    ctx.bezierCurveTo(s * 0.48, s * 0.47, s * 0.62, s * 0.55, s * 0.74, s * 0.52);
    ctx.stroke();

    // 5. Tharsis Montes (Trio of Shield Volcanoes)
    const tharsisVolcanoes = [
      { x: s * 0.34, y: s * 0.34 }, // Ascraeus
      { x: s * 0.37, y: s * 0.46 }, // Pavonis
      { x: s * 0.40, y: s * 0.58 }, // Arsia
    ];
    tharsisVolcanoes.forEach((v) => {
      const vGrad = ctx.createRadialGradient(v.x, v.y, 2, v.x, v.y, s * 0.035);
      vGrad.addColorStop(0, '#e57a55');
      vGrad.addColorStop(0.6, '#aa381e');
      vGrad.addColorStop(1, 'rgba(170, 56, 30, 0)');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.arc(v.x, v.y, s * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#401108';
      ctx.beginPath();
      ctx.arc(v.x, v.y, s * 0.008, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Impact Craters across Southern Highlands
    for (let i = 0; i < 70; i++) {
      const cx = Math.random() * s;
      const cy = s * 0.35 + Math.random() * (s * 0.55);
      const cr = 3 + Math.random() * 16;

      // Dark floor
      ctx.fillStyle = 'rgba(50, 15, 8, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      // Bright sunlit rim
      ctx.strokeStyle = 'rgba(235, 130, 95, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();

      // Shadowed rim
      ctx.strokeStyle = 'rgba(30, 8, 4, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, -Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // 7. North & South Brilliant White Polar Ice Caps
    // North Polar Ice Cap (Planum Boreum)
    ctx.fillStyle = 'rgba(255, 252, 248, 0.98)';
    ctx.beginPath();
    ctx.ellipse(s * 0.5, 26, s * 0.26, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiral chasma rifts in ice
    ctx.strokeStyle = '#8c2f18';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(s * 0.5, 26, 16, 0.4, 2.2);
    ctx.stroke();

    // South Polar Ice Cap (Planum Australe)
    ctx.fillStyle = 'rgba(255, 250, 245, 0.95)';
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s - 22, s * 0.22, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------------- Bump / Heightmap Texture for 3D Surface Relief ----------------
export function createMarsBumpTexture(size = 512): THREE.CanvasTexture {
  return makeCanvasTexture(size, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);

    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const n = fbm(u * 12.0, v * 12.0, 4);
        const val = Math.floor(n * 255);
        const idx = (y * s + x) * 4;
        d[idx] = val;
        d[idx + 1] = val;
        d[idx + 2] = val;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Olympus Mons (Massive bump height)
    const oX = s * 0.28;
    const oY = s * 0.42;
    const oR = s * 0.085;
    const grad = ctx.createRadialGradient(oX, oY, 0, oX, oY, oR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, '#a0a0a0');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(oX, oY, oR, 0, Math.PI * 2);
    ctx.fill();

    // Valles Marineris (Deep canyon depression)
    ctx.strokeStyle = '#101010';
    ctx.lineWidth = s * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.38, s * 0.52);
    ctx.bezierCurveTo(s * 0.48, s * 0.48, s * 0.62, s * 0.56, s * 0.74, s * 0.53);
    ctx.stroke();
  });
}

type TutStep = 'move' | 'rotate' | 'zoom' | 'mars' | 'done';

export class MarsScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();

  // Central 3D Mars Focal Point
  private marsMesh!: THREE.Mesh;
  private marsAtmosphereHaze!: THREE.Mesh;
  private marsAtmosphereGlow!: THREE.Sprite;
  private aresVallisAnchor = new THREE.Group();
  private aresVallisBeacon = new THREE.Group();
  private missionTagSprite!: THREE.Sprite;

  // Moons of Mars
  private phobosMesh!: THREE.Mesh;
  private deimosMesh!: THREE.Mesh;
  private phobosAngle = 0;
  private deimosAngle = 2.4;

  // Cinematic Lighting & Space Environment
  private sunLight!: THREE.DirectionalLight;
  private sunFillLight!: THREE.PointLight;
  private stars = makeStarfield(5500, 1200);
  private starsNear = makeStarfield(1500, 500);
  private distantSunSprite!: THREE.Sprite;

  // Guides & Characters
  private nova = buildNova();
  private explorer = buildExplorer();

  private step: TutStep = store.get().tutorialDone ? 'done' : 'move';
  private moved = false;
  private rotated = false;
  private zoomed = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private disposers: (() => void)[] = [];

  constructor(renderer: THREE.WebGLRenderer, _isMap = false) {
    this.renderer = renderer;

    // Cinematic perspective camera focused on Mars
    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 3000);
    this.camera.position.set(0, 3.5, 16.5);

    this.scene.background = new THREE.Color(0x020205);
    this.scene.add(this.stars);
    this.scene.add(this.starsNear);

    this.setupLighting();
    this.setupMarsFocalPoint();
    this.setupMartianMoons();
    this.setupAresVallisMissionWaypoint();
    this.setupGuides();

    // OrbitControls: Smooth 360° inspection of Mars
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 8.5;
    this.controls.maxDistance = 32;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;

    audio.play('space');

    if (this.step === 'move') {
      this.later(() => {
        if (!this.moved) store.say(NOVA_INTRO);
      }, 700);
    }

    this.disposers.push(
      store.on('skipTutorial', () => {
        if (this.step === 'done') return;
        this.step = 'done';
        store.set({ tutorialDone: true, showChoice: true });
        store.say(NOVA_TWO_WORLDS);
      })
    );

    this.disposers.push(
      store.on('solar:selectPlanet', (id) => {
        if (id === 'Mars' || !id) {
          this.focusOnMars();
        } else if (id === 'Moon') {
          // Subtle look toward Earth/Moon vector
          this.controls.target.set(2, 0, -2);
        }
      })
    );

    this.disposers.push(
      store.on('solar:resetView', () => {
        this.focusOnMars();
      })
    );
  }

  private setupLighting() {
    // Ambient light - deep space fill
    const ambient = new THREE.AmbientLight(0x1d2232, 1.3);
    this.scene.add(ambient);

    // Primary Directional Sunlight from space (dramatic terminator shadows on Mars)
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 3.6);
    this.sunLight.position.set(-35, 15, 25);
    this.scene.add(this.sunLight);

    // Secondary soft warm fill for atmospheric dusk glow
    this.sunFillLight = new THREE.PointLight(0xff8833, 1.2, 80, 0.5);
    this.sunFillLight.position.set(-30, 10, 20);
    this.scene.add(this.sunFillLight);

    // Distant Sun Flare Sprite in the deep background
    this.distantSunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('rgba(255, 245, 210, 0.95)', 'rgba(255, 140, 40, 0)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.distantSunSprite.position.set(-280, 120, -380);
    this.distantSunSprite.scale.set(120, 120, 1);
    this.scene.add(this.distantSunSprite);
  }

  private setupMarsFocalPoint() {
    const marsRadius = 5.0;

    // 1. High-Fidelity 3D Mars Sphere
    const marsGeo = new THREE.SphereGeometry(marsRadius, 64, 64);
    const marsColorMap = createHighFidelityMarsTexture(1024);
    const marsBumpMap = createMarsBumpTexture(512);

    const marsMat = new THREE.MeshStandardMaterial({
      map: marsColorMap,
      bumpMap: marsBumpMap,
      bumpScale: 0.16,
      roughness: 0.88,
      metalness: 0.05,
    });

    this.marsMesh = new THREE.Mesh(marsGeo, marsMat);
    this.marsMesh.name = 'Mars';
    // Authentic Martian axial tilt (25.19 degrees = ~0.44 rad)
    this.marsMesh.rotation.z = 0.44;
    this.scene.add(this.marsMesh);

    // 2. Martian Troposphere Dust Haze Layer
    const atmoGeo = new THREE.SphereGeometry(marsRadius * 1.018, 48, 48);
    const atmoMat = new THREE.MeshStandardMaterial({
      color: 0xe0603f,
      transparent: true,
      opacity: 0.18,
      roughness: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.marsAtmosphereHaze = new THREE.Mesh(atmoGeo, atmoMat);
    this.marsMesh.add(this.marsAtmosphereHaze);

    // 3. Ethereal Atmospheric Fresnel Limb Glow Sprite
    this.marsAtmosphereGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('rgba(255, 110, 50, 0.65)', 'rgba(160, 40, 10, 0)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.marsAtmosphereGlow.scale.set(marsRadius * 2.5, marsRadius * 2.5, 1);
    this.marsMesh.add(this.marsAtmosphereGlow);
  }

  private setupMartianMoons() {
    // 1. Phobos (Irregular Rocky Asteroid Moon)
    const phobosGeo = new THREE.DodecahedronGeometry(0.36, 1);
    // Deform vertices for irregular asteroid shape
    const pPos = phobosGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const vx = pPos.getX(i);
      const vy = pPos.getY(i);
      const vz = pPos.getZ(i);
      const factor = 1 + (Math.sin(vx * 10) * 0.12 + Math.cos(vy * 8) * 0.08);
      pPos.setXYZ(i, vx * factor, vy * factor * 0.85, vz * factor * 1.1);
    }
    phobosGeo.computeVertexNormals();

    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x6e6862,
      roughness: 0.95,
      metalness: 0.1,
    });
    this.phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
    this.phobosMesh.name = 'Phobos';
    this.scene.add(this.phobosMesh);

    // 2. Deimos (Outer Smooth Moon)
    const deimosGeo = new THREE.DodecahedronGeometry(0.22, 1);
    const deimosMat = new THREE.MeshStandardMaterial({
      color: 0x7a746e,
      roughness: 0.9,
    });
    this.deimosMesh = new THREE.Mesh(deimosGeo, deimosMat);
    this.deimosMesh.name = 'Deimos';
    this.scene.add(this.deimosMesh);
  }

  private setupAresVallisMissionWaypoint() {
    const marsRadius = 5.0;

    // Position anchored to Ares Vallis (19.33° N, 33.55° W) on the rotating globe
    const lat = THREE.MathUtils.degToRad(19.33);
    const lon = THREE.MathUtils.degToRad(-33.55);

    const x = marsRadius * Math.cos(lat) * Math.cos(lon);
    const y = marsRadius * Math.sin(lat);
    const z = marsRadius * Math.cos(lat) * Math.sin(lon);

    this.aresVallisAnchor.position.set(x, y, z);
    this.aresVallisAnchor.lookAt(x * 2, y * 2, z * 2);

    // Beacon Rings
    const ringGeo = new THREE.RingGeometry(0.35, 0.48, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd97d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.aresVallisBeacon.add(ring);

    // Laser Waypoint Beam projecting into space
    const beamGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.8, 12);
    beamGeo.translate(0, 1.4, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd97d,
      transparent: true,
      opacity: 0.75,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    this.aresVallisBeacon.add(beam);

    // Floating Mission Waypoint Sprite
    this.missionTagSprite = makeTextSprite('🚩 ARES VALLIS · PATHFINDER 1997', {
      size: 0.65,
      color: '#ffd97d',
    });
    this.missionTagSprite.position.set(0, 0, 2.9);
    this.aresVallisBeacon.add(this.missionTagSprite);

    this.aresVallisAnchor.add(this.aresVallisBeacon);
    this.marsMesh.add(this.aresVallisAnchor);
  }

  private setupGuides() {
    // Nova AI Guide 3D animated character
    this.nova.group.position.set(3.8, 0.4, 10.5);
    this.nova.group.rotation.y = -0.45;
    this.nova.group.scale.set(1.2, 1.2, 1.2);
    this.scene.add(this.nova.group);

    // Explorer astronaut ready for mission briefing
    this.explorer.position.set(4.2, -1.8, 8.5);
    this.explorer.scale.set(1.2, 1.2, 1.2);
    this.explorer.visible = false;
    this.scene.add(this.explorer);
  }

  private later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  focusOnMars() {
    this.controls.target.set(0, 0, 0);
    this.controls.autoRotate = true;
  }

  private progress() {
    if (this.step === 'move' && !this.moved) {
      this.moved = true;
      this.later(() => {
        store.say(NOVA_AFTER_MOVE);
        this.step = 'rotate';
      }, 400);
    } else if (this.step === 'rotate' && !this.rotated) {
      this.rotated = true;
      this.later(() => {
        store.say(NOVA_AFTER_ROTATE);
        this.step = 'zoom';
      }, 500);
    } else if (this.step === 'zoom' && !this.zoomed) {
      this.zoomed = true;
      this.later(() => {
        store.say(NOVA_POINT_MARS);
        this.step = 'mars';
      }, 500);
    }
  }

  onPointerMove(_x: number, _y: number, isDown: boolean) {
    if (isDown) {
      this.controls.autoRotate = false;
      this.progress();
    } else {
      this.progress();
    }
  }

  onPointerDown() {
    this.controls.autoRotate = false;
  }

  onWheel() {
    this.controls.autoRotate = false;
    this.progress();
  }

  onClick(x: number, y: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const hits = this.raycaster.intersectObjects([this.marsMesh, this.aresVallisBeacon], true);

    if (hits.length === 0) {
      if (this.step !== 'mars' && this.step !== 'done') {
        this.progress();
      }
      return;
    }

    // Mars or Ares Vallis was clicked!
    store.set({ selectedPlanet: 'Mars' });

    if (this.step === 'mars') {
      this.step = 'done';
      store.set({ tutorialDone: true });
      store.say(NOVA_TWO_WORLDS);
      this.later(() => store.set({ showChoice: true }), 800);
      return;
    }

    if (this.step === 'done') {
      store.say(NOVA_TWO_WORLDS);
      this.later(() => store.set({ showChoice: true }), 500);
    }
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    // 1. Slow, realistic axial rotation of Mars
    this.marsMesh.rotation.y += dt * 0.05;

    // 2. Animate Ares Vallis mission waypoint beacon
    const pulse = 0.65 + Math.sin(t * 4.5) * 0.35;
    const ring = this.aresVallisBeacon.children[0] as THREE.Mesh;
    if (ring && ring.material) {
      (ring.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // 3. Orbit Moons: Phobos & Deimos
    this.phobosAngle += dt * 0.28;
    this.deimosAngle += dt * 0.12;
    this.phobosMesh.position.set(Math.cos(this.phobosAngle) * 9.8, Math.sin(this.phobosAngle * 0.4) * 1.5, Math.sin(this.phobosAngle) * 9.8);
    this.phobosMesh.rotation.y += dt * 0.4;

    this.deimosMesh.position.set(Math.cos(this.deimosAngle) * 15.5, Math.sin(this.deimosAngle * 0.3) * 2.2, Math.sin(this.deimosAngle) * 15.5);
    this.deimosMesh.rotation.y += dt * 0.2;

    // 4. Nova floating companion
    this.nova.update(dt, t);
    this.nova.group.position.y = 0.4 + Math.sin(t * 1.5) * 0.12;

    // 5. Subtle starfield drift
    this.stars.rotation.y += dt * 0.001;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.timers.forEach(clearTimeout);
    this.disposers.forEach((d) => d());
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
