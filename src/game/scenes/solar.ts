import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store } from '../../state/store';
import { audio } from '../audio';
import { makeStarfield, makeGlowTexture, makeTextSprite, type Scene } from '../utils';
import { buildNova, buildExplorer } from '../models/builders';
import {
  NOVA_INTRO,
  NOVA_AFTER_MOVE,
  NOVA_AFTER_ROTATE,
  NOVA_POINT_MARS,
  NOVA_TWO_WORLDS,
} from '../../data/content';
import { SOLAR_BODIES } from '../../data/solarData';
import {
  createSunTexture,
  createMercuryTexture,
  createVenusTexture,
  createEarthTexture,
  createEarthCloudsTexture,
  createMoonTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingTexture,
  createUranusTexture,
  createNeptuneTexture,
} from '../solarTextures';

interface PlanetRuntime {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  orbitRadius: number;
  speed: number;
  angle: number;
  label?: THREE.Sprite;
  group: THREE.Group;
  orbitLine: THREE.Line | THREE.Mesh;
  clouds?: THREE.Mesh;
  rings?: THREE.Mesh;
  radius: number;
}

type TutStep = 'move' | 'rotate' | 'zoom' | 'mars' | 'done';

export class SolarScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private planets: PlanetRuntime[] = [];
  private sunMesh!: THREE.Mesh;
  private sunAtmosphere!: THREE.Mesh;
  private sunCoronaSprite!: THREE.Sprite;
  private sunCoronaOuter!: THREE.Sprite;
  private solarFlares: THREE.Mesh[] = [];
  private asteroidBelt!: THREE.Points;

  // Destination Reticles
  private marsTargetRing = new THREE.Group();
  private moonTargetRing = new THREE.Group();
  private marsBeacon = new THREE.Group();

  // Environment & Characters
  private stars = makeStarfield(5500, 1200);
  private starsNear = makeStarfield(1500, 500);
  private nova = buildNova();
  private explorer = buildExplorer();

  private step: TutStep = store.get().tutorialDone ? 'done' : 'move';
  private isMap = false;
  private moved = false;
  private rotated = false;
  private zoomed = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private disposers: (() => void)[] = [];

  // Smooth camera tracking / focus
  private currentTargetPlanet: string | null = null;
  private cameraTargetPos = new THREE.Vector3(0, 0, 0);
  private cameraIdealPos = new THREE.Vector3(0, 32, 60);
  private isFocusing = false;
  private baseOverviewPos = new THREE.Vector3(0, 32, 60);
  private defaultTarget = new THREE.Vector3(0, 0, 0);

  constructor(renderer: THREE.WebGLRenderer, isMap = false) {
    this.renderer = renderer;
    if (isMap) {
      this.step = 'done';
      this.isMap = true;
    }

    this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 4500);
    this.camera.position.copy(this.baseOverviewPos);

    this.scene.background = new THREE.Color(0x010106);
    this.scene.add(this.stars);
    this.scene.add(this.starsNear);

    this.setupCosmicAmbience();
    this.setupSun();
    this.setupPlanets();
    this.setupAsteroidBelt();
    this.setupDestinationWaypoints();
    this.setupGuides();

    // OrbitControls: Game camera controls
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 160;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 1.85;

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

    // Store event listeners for world selection
    this.disposers.push(
      store.on('solar:selectPlanet', (id) => {
        this.focusOnWorld((id as string) || null);
      })
    );

    this.disposers.push(
      store.on('solar:resetView', () => {
        this.focusOnWorld(null);
      })
    );
  }

  private setupCosmicAmbience() {
    // Ambient space fill - realistic deep dark space with soft starlight
    const ambient = new THREE.AmbientLight(0x222838, 1.1);
    this.scene.add(ambient);

    // Deep cosmic nebulae sprites in distant space
    const nebulae = [
      { col: 'rgba(50, 20, 100, 0.3)', pos: [-500, 200, -700], s: 800 },
      { col: 'rgba(20, 60, 120, 0.3)', pos: [600, -150, -600], s: 900 },
      { col: 'rgba(90, 40, 40, 0.22)', pos: [0, 400, 800], s: 750 },
    ];
    nebulae.forEach(({ col, pos, s }) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(col, 'rgba(0,0,0,0)'),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      sprite.position.set(pos[0], pos[1], pos[2]);
      sprite.scale.set(s, s, 1);
      this.scene.add(sprite);
    });
  }

  private setupSun() {
    const sunData = SOLAR_BODIES.find((b) => b.id === 'Sun')!;

    // 1. Core Sphere with High-Detail Convection Texture
    const sunGeo = new THREE.SphereGeometry(sunData.radius3d, 64, 48);
    const sunTex = createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: 0xfffae8,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.name = 'Sun';
    this.scene.add(this.sunMesh);

    // 2. Solar Chromosphere Glow Layer (Atmosphere rim)
    const atmoGeo = new THREE.SphereGeometry(sunData.radius3d * 1.08, 48, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    this.sunAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.scene.add(this.sunAtmosphere);

    // 3. Inner Blazing Coronal Flares
    this.sunCoronaSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('rgba(255, 240, 180, 0.95)', 'rgba(255, 110, 10, 0)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.sunCoronaSprite.scale.set(18, 18, 1);
    this.scene.add(this.sunCoronaSprite);

    // 4. Outer Radiant Solar Halo
    this.sunCoronaOuter = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture('rgba(255, 150, 40, 0.55)', 'rgba(255, 60, 0, 0)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.sunCoronaOuter.scale.set(34, 34, 1);
    this.scene.add(this.sunCoronaOuter);

    // 5. Dynamic Solar Prominences / Flares erupting from the Sun
    for (let i = 0; i < 6; i++) {
      const flareGeo = new THREE.TorusGeometry(sunData.radius3d * 1.02, 0.12, 8, 24, Math.PI * 0.45);
      const flareMat = new THREE.MeshBasicMaterial({
        color: 0xff9922,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const flare = new THREE.Mesh(flareGeo, flareMat);
      flare.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.sunMesh.add(flare);
      this.solarFlares.push(flare);
    }

    // 6. Primary Sunlight (Illuminates planets with cinematic day/night contrast)
    const sunLight = new THREE.PointLight(0xfff7ea, 3.8, 0, 0.08);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // 7. Warm Secondary Ambient Solar Fill
    const sunWarmth = new THREE.PointLight(0xff9e28, 2.0, 140, 0.8);
    sunWarmth.position.set(0, 0, 0);
    this.scene.add(sunWarmth);
  }

  private setupPlanets() {
    SOLAR_BODIES.filter((b) => b.id !== 'Sun' && b.id !== 'Moon').forEach((b, i) => {
      const group = new THREE.Group();

      // Subtle, elegant orbital ring trace
      const orbitGeo = new THREE.RingGeometry(b.orbitRadius3d - 0.04, b.orbitRadius3d + 0.04, 160);
      const isTarget = b.id === 'Mars';
      const orbitMat = new THREE.MeshBasicMaterial({
        color: isTarget ? 0xff5533 : 0x485878,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isTarget ? 0.6 : 0.22,
        depthWrite: false,
      });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.rotation.x = Math.PI / 2;
      group.add(orbitRing);

      // Planet Procedural Textures & Materials
      let planetTex: THREE.CanvasTexture;
      let roughness = 0.85;
      let metalness = 0.05;

      switch (b.id) {
        case 'Mercury':
          planetTex = createMercuryTexture();
          roughness = 0.95;
          break;
        case 'Venus':
          planetTex = createVenusTexture();
          roughness = 0.6;
          metalness = 0.15;
          break;
        case 'Earth':
          planetTex = createEarthTexture();
          roughness = 0.45;
          metalness = 0.1;
          break;
        case 'Mars':
          planetTex = createMarsTexture();
          roughness = 0.85;
          break;
        case 'Jupiter':
          planetTex = createJupiterTexture();
          roughness = 0.75;
          break;
        case 'Saturn':
          planetTex = createSaturnTexture();
          roughness = 0.8;
          break;
        case 'Uranus':
          planetTex = createUranusTexture();
          roughness = 0.65;
          break;
        case 'Neptune':
          planetTex = createNeptuneTexture();
          roughness = 0.65;
          break;
        default:
          planetTex = createMercuryTexture();
      }

      const planetGeo = new THREE.SphereGeometry(b.radius3d, 40, 32);
      const planetMat = new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness,
        metalness,
      });

      const mesh = new THREE.Mesh(planetGeo, planetMat);
      mesh.name = b.id;

      // Initial orbital position
      const angle = (i / 7) * Math.PI * 2 + 0.9;
      mesh.position.set(Math.cos(angle) * b.orbitRadius3d, 0, Math.sin(angle) * b.orbitRadius3d);

      // Axial tilts
      if (b.id === 'Earth') mesh.rotation.z = 0.41;
      if (b.id === 'Mars') mesh.rotation.z = 0.44;
      if (b.id === 'Saturn') mesh.rotation.z = 0.47;
      if (b.id === 'Uranus') mesh.rotation.z = 1.7;

      group.add(mesh);

      // Planet-specific features
      let cloudsMesh: THREE.Mesh | undefined;
      let ringsMesh: THREE.Mesh | undefined;

      // EARTH: Clouds & Moon
      if (b.id === 'Earth') {
        const cloudGeo = new THREE.SphereGeometry(b.radius3d * 1.022, 36, 28);
        const cloudTex = createEarthCloudsTexture();
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.85,
          roughness: 1.0,
          depthWrite: false,
        });
        cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.add(cloudsMesh);

        // Blue atmosphere Fresnel glow
        const atmoSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeGlowTexture('rgba(80, 165, 255, 0.65)', 'rgba(0, 80, 255, 0)'),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        atmoSprite.scale.set(b.radius3d * 2.5, b.radius3d * 2.5, 1);
        mesh.add(atmoSprite);

        // THE MOON (Primary Destination 2)
        const moonTex = createMoonTexture();
        const moonGeo = new THREE.SphereGeometry(0.35, 24, 20);
        const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.name = 'Moon';
        moonMesh.position.set(2.5, 0, 0);
        mesh.add(moonMesh);

        // Subtle Moon tag
        const moonLabel = makeTextSprite('🌙 MOON', { size: 0.5, color: '#e5e2db' });
        moonLabel.position.set(2.5, 0.75, 0);
        mesh.add(moonLabel);
      }

      // MARS (Primary Destination 1)
      if (b.id === 'Mars') {
        // Orange atmospheric limb glow
        const marsGlow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeGlowTexture('rgba(255, 100, 50, 0.55)', 'rgba(180, 40, 10, 0)'),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        marsGlow.scale.set(b.radius3d * 2.35, b.radius3d * 2.35, 1);
        mesh.add(marsGlow);

        // Ares Vallis Mission Waypoint Beacon
        this.marsBeacon = new THREE.Group();
        const beaconRing = new THREE.Mesh(
          new THREE.RingGeometry(b.radius3d * 1.35, b.radius3d * 1.55, 40),
          new THREE.MeshBasicMaterial({
            color: 0xffd97d,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          })
        );
        beaconRing.rotation.x = Math.PI / 2;
        this.marsBeacon.add(beaconRing);

        // Vertical waypoint beam
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 12);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xffd97d,
          transparent: true,
          opacity: 0.8,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 1.6 + b.radius3d;
        this.marsBeacon.add(beam);

        mesh.add(this.marsBeacon);
      }

      // SATURN: Realistic Ring System
      if (b.id === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(b.radius3d * 1.35, b.radius3d * 2.45, 80);
        const ringTex = createSaturnRingTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.6,
        });
        ringsMesh = new THREE.Mesh(ringGeo, ringMat);
        ringsMesh.rotation.x = Math.PI / 2;
        mesh.add(ringsMesh);
      }

      // URANUS: Faint Ice Ring
      if (b.id === 'Uranus') {
        const uRingGeo = new THREE.RingGeometry(b.radius3d * 1.3, b.radius3d * 1.65, 60);
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0xc4eef2,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
        });
        ringsMesh = new THREE.Mesh(uRingGeo, uRingMat);
        ringsMesh.rotation.x = Math.PI / 2;
        mesh.add(ringsMesh);
      }

      // JUPITER: Galilean Moons
      if (b.id === 'Jupiter') {
        const jMoons = [
          { name: 'Io', dist: 3.4, size: 0.2, col: 0xe5bf42 },
          { name: 'Europa', dist: 4.2, size: 0.18, col: 0xc8c3b8 },
          { name: 'Ganymede', dist: 5.2, size: 0.28, col: 0x9e988f },
          { name: 'Callisto', dist: 6.4, size: 0.25, col: 0x767068 },
        ];
        jMoons.forEach((jm, jIdx) => {
          const jmM = new THREE.Mesh(
            new THREE.SphereGeometry(jm.size, 14, 12),
            new THREE.MeshStandardMaterial({ color: jm.col, roughness: 0.85 })
          );
          jmM.name = jm.name;
          const a = jIdx * 1.4;
          jmM.position.set(Math.cos(a) * jm.dist, 0, Math.sin(a) * jm.dist);
          mesh.add(jmM);
        });
      }

      // ONLY add prominent destination tags for Mars and Earth (clean game design, no clutter)
      let label: THREE.Sprite | undefined;
      if (b.id === 'Mars') {
        label = makeTextSprite('🔴 MARS', { size: 0.8, color: '#ff9d6b' });
        label.position.copy(mesh.position).add(new THREE.Vector3(0, b.radius3d + 1.4, 0));
        group.add(label);
      } else if (b.id === 'Earth') {
        label = makeTextSprite('🌍 EARTH', { size: 0.65, color: '#9fd8ff' });
        label.position.copy(mesh.position).add(new THREE.Vector3(0, b.radius3d + 1.2, 0));
        group.add(label);
      }

      this.scene.add(group);
      this.planets.push({
        id: b.id,
        name: b.name.en,
        mesh,
        orbitRadius: b.orbitRadius3d,
        speed: b.orbitSpeed,
        angle,
        label,
        group,
        orbitLine: orbitRing,
        clouds: cloudsMesh,
        rings: ringsMesh,
        radius: b.radius3d,
      });
    });
  }

  private setupAsteroidBelt() {
    // Asteroid belt between Mars and Jupiter
    const count = 750;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 26.5 + (Math.random() - 0.5) * 3.8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 1.2;

      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * r;

      const shade = 0.45 + Math.random() * 0.35;
      col[i * 3] = shade * 1.05;
      col[i * 3 + 1] = shade;
      col[i * 3 + 2] = shade * 0.95;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });

    this.asteroidBelt = new THREE.Points(geo, mat);
    this.scene.add(this.asteroidBelt);
  }

  private setupDestinationWaypoints() {
    // Holographic targeting ring for Mars
    const marsReticleGeo = new THREE.RingGeometry(1.3, 1.5, 48);
    const marsReticleMat = new THREE.MeshBasicMaterial({
      color: 0xffd97d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const marsReticle = new THREE.Mesh(marsReticleGeo, marsReticleMat);
    marsReticle.rotation.x = Math.PI / 2;
    this.marsTargetRing.add(marsReticle);

    // 4 Corner HUD tick marks
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xffd97d });
    for (let i = 0; i < 4; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.35), tickMat);
      const angle = (i * Math.PI) / 2;
      tick.position.set(Math.cos(angle) * 1.7, 0, Math.sin(angle) * 1.7);
      tick.rotation.y = -angle;
      this.marsTargetRing.add(tick);
    }
    this.marsTargetRing.visible = false;
    this.scene.add(this.marsTargetRing);

    // Holographic targeting ring for Moon
    const moonReticleGeo = new THREE.RingGeometry(0.65, 0.8, 36);
    const moonReticleMat = new THREE.MeshBasicMaterial({
      color: 0x9fd8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const moonReticle = new THREE.Mesh(moonReticleGeo, moonReticleMat);
    moonReticle.rotation.x = Math.PI / 2;
    this.moonTargetRing.add(moonReticle);
    this.moonTargetRing.visible = false;
    this.scene.add(this.moonTargetRing);
  }

  private setupGuides() {
    // Nova floating near camera
    this.nova.group.position.set(8, 6, 16);
    this.scene.add(this.nova.group);

    // Explorer astronaut model available for mission briefings
    this.explorer.position.set(22, 2, 8);
    this.explorer.scale.set(1.4, 1.4, 1.4);
    this.explorer.visible = false;
    this.scene.add(this.explorer);
  }

  private later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  // Focus and smoothly frame a world (ONLY Mars or Moon)
  focusOnWorld(worldId: string | null) {
    this.currentTargetPlanet = worldId;
    store.set({ selectedPlanet: worldId });

    if (!worldId || worldId === 'overview') {
      // Return to heliocentric overview
      this.isFocusing = false;
      this.cameraTargetPos.copy(this.defaultTarget);
      this.cameraIdealPos.copy(this.baseOverviewPos);
      this.marsTargetRing.visible = false;
      this.moonTargetRing.visible = false;
      this.explorer.visible = false;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 160;
      return;
    }

    if (worldId === 'Mars') {
      const mars = this.planets.find((p) => p.id === 'Mars');
      if (!mars) return;

      this.isFocusing = true;
      const worldPos = new THREE.Vector3();
      mars.mesh.getWorldPosition(worldPos);

      this.cameraTargetPos.copy(worldPos);
      // Cinematic close-up framing of Mars
      this.cameraIdealPos.set(worldPos.x + 2.8, worldPos.y + 1.6, worldPos.z + 3.8);

      this.marsTargetRing.position.copy(worldPos);
      this.marsTargetRing.visible = true;
      this.moonTargetRing.visible = false;

      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 25;

      // Position astronaut companion beside Mars
      this.explorer.visible = true;
      this.explorer.position.set(worldPos.x + 2.2, worldPos.y - 0.2, worldPos.z + 1.4);
      this.explorer.lookAt(worldPos);
      return;
    }

    if (worldId === 'Moon') {
      const earth = this.planets.find((p) => p.id === 'Earth');
      if (!earth) return;

      const moon = earth.mesh.children.find((c) => c.name === 'Moon');
      if (!moon) return;

      this.isFocusing = true;
      const moonWorldPos = new THREE.Vector3();
      moon.getWorldPosition(moonWorldPos);

      this.cameraTargetPos.copy(moonWorldPos);
      this.cameraIdealPos.set(moonWorldPos.x + 1.8, moonWorldPos.y + 0.9, moonWorldPos.z + 2.2);

      this.moonTargetRing.position.copy(moonWorldPos);
      this.moonTargetRing.visible = true;
      this.marsTargetRing.visible = false;
      this.explorer.visible = false;

      this.controls.minDistance = 0.8;
      this.controls.maxDistance = 16;
    }
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
    if (isDown) this.progress();
    else this.progress();
  }

  onPointerDown() {
    // handled
  }

  onWheel() {
    this.progress();
  }

  onClick(x: number, y: number) {
    if (this.isMap) return;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // In ASTRO RELIC game design: Only MARS and MOON are primary destination click targets!
    const mars = this.planets.find((p) => p.id === 'Mars');
    const earth = this.planets.find((p) => p.id === 'Earth');
    const moon = earth?.mesh.children.find((c) => c.name === 'Moon') as THREE.Mesh | undefined;

    const clickableTargets: THREE.Object3D[] = [];
    if (mars) clickableTargets.push(mars.mesh);
    if (moon) clickableTargets.push(moon);

    const hits = this.raycaster.intersectObjects(clickableTargets, true);

    if (hits.length === 0) {
      if (this.step !== 'mars' && this.step !== 'done') {
        this.progress();
      }
      return;
    }

    let obj: THREE.Object3D | null = hits[0].object;
    let name = '';
    while (obj) {
      if (obj.name === 'Mars' || obj.name === 'Moon') {
        name = obj.name;
        break;
      }
      obj = obj.parent;
    }
    if (!name) return;

    // Focus camera on clicked destination world
    this.focusOnWorld(name);

    if (this.step === 'mars') {
      if (name === 'Mars' || name === 'Moon') {
        this.step = 'done';
        store.set({ tutorialDone: true });
        store.say(NOVA_TWO_WORLDS);
        this.later(() => store.set({ showChoice: true }), 800);
      }
      return;
    }

    if (this.step === 'done') {
      if (name === 'Mars' || name === 'Moon') {
        store.say(NOVA_TWO_WORLDS);
        this.later(() => store.set({ showChoice: true }), 500);
      }
    }
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number) {
    const gameState = store.get();
    const speedMult = gameState.orbitSpeed ?? 1;

    // 1. Rotate Sun and pulse plasma flares
    this.sunMesh.rotation.y += dt * 0.08 * speedMult;
    this.sunAtmosphere.rotation.y -= dt * 0.04 * speedMult;

    const sunPulse = 1 + Math.sin(t * 2.5) * 0.04;
    this.sunCoronaSprite.scale.set(18 * sunPulse, 18 * sunPulse, 1);
    this.sunCoronaOuter.scale.set(34 * (1 + Math.cos(t * 1.8) * 0.05), 34 * (1 + Math.cos(t * 1.8) * 0.05), 1);
    this.sunCoronaOuter.material.rotation = t * 0.015;

    // Rotate solar prominence flare arcs
    this.solarFlares.forEach((f, idx) => {
      f.rotation.z += dt * (0.1 + idx * 0.05) * speedMult;
    });

    // 2. Animate planets in orbit
    this.planets.forEach((p) => {
      p.angle += dt * p.speed * 0.12 * speedMult;
      p.mesh.position.set(Math.cos(p.angle) * p.orbitRadius, 0, Math.sin(p.angle) * p.orbitRadius);
      p.mesh.rotation.y += dt * 0.25;

      // Rotate Earth clouds independently
      if (p.clouds) {
        p.clouds.rotation.y += dt * 0.32;
      }

      // Update destination labels
      if (p.label) {
        p.label.position.copy(p.mesh.position).add(new THREE.Vector3(0, p.radius + 1.4, 0));
      }
    });

    // 3. Moon orbits Earth
    const earth = this.planets.find((p) => p.id === 'Earth');
    if (earth) {
      const moon = earth.mesh.children.find((c) => c.name === 'Moon');
      if (moon) {
        moon.position.set(Math.cos(t * 0.8 * speedMult) * 2.5, 0, Math.sin(t * 0.8 * speedMult) * 2.5);
      }
    }

    // 4. Animate Mars waypoint beacon
    if (this.marsBeacon) {
      this.marsBeacon.rotation.y = t * 1.5;
      const bPulse = 0.6 + Math.sin(t * 4) * 0.35;
      const ring = this.marsBeacon.children[0] as THREE.Mesh;
      if (ring && ring.material) {
        (ring.material as THREE.MeshBasicMaterial).opacity = bPulse;
      }
    }

    // 5. Animate Asteroid belt rotation
    if (this.asteroidBelt) {
      this.asteroidBelt.rotation.y += dt * 0.015 * speedMult;
    }

    // 6. Dynamic tracking for focused destination target
    if (this.currentTargetPlanet === 'Mars') {
      const mars = this.planets.find((p) => p.id === 'Mars');
      if (mars) {
        const worldPos = new THREE.Vector3();
        mars.mesh.getWorldPosition(worldPos);
        this.marsTargetRing.position.copy(worldPos);
        this.marsTargetRing.children[0].rotation.z = t * 0.8;
        this.cameraTargetPos.copy(worldPos);

        if (this.explorer.visible) {
          this.explorer.position.set(worldPos.x + 2.2, worldPos.y - 0.2, worldPos.z + 1.4);
          this.explorer.lookAt(worldPos);
        }
      }
    } else if (this.currentTargetPlanet === 'Moon') {
      const earthObj = this.planets.find((p) => p.id === 'Earth');
      const moonObj = earthObj?.mesh.children.find((c) => c.name === 'Moon');
      if (moonObj) {
        const worldPos = new THREE.Vector3();
        moonObj.getWorldPosition(worldPos);
        this.moonTargetRing.position.copy(worldPos);
        this.moonTargetRing.children[0].rotation.z = t * 0.8;
        this.cameraTargetPos.copy(worldPos);
      }
    }

    // 7. Smooth camera target & position lerping
    if (this.isFocusing) {
      this.controls.target.lerp(this.cameraTargetPos, dt * 3.6);
      this.camera.position.lerp(this.cameraIdealPos, dt * 2.8);
    } else {
      this.controls.target.lerp(this.defaultTarget, dt * 3.0);
    }

    // 8. Nova floating animation & slow starfield drift
    this.nova.group.position.y = 6 + Math.sin(t * 1.4) * 0.4;
    this.stars.rotation.y += dt * 0.002;
    this.starsNear.rotation.y += dt * 0.004;

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
