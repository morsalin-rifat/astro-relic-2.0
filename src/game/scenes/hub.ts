import * as THREE from "three";
import { makeGlowTexture, makeCanvasTexture, fbm, makeStarfield, type Scene } from "../utils";
import { store } from "../../state/store";

type Universe = "mars" | "moon";

/* ---------- textures ---------- */

function terrainTexture(kind: Universe): THREE.CanvasTexture {
  return makeCanvasTexture(256, (ctx, s) => {
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n = fbm(x * 0.045, y * 0.045, 5);
        const n2 = fbm(x * 0.18 + 40, y * 0.18 + 40, 3);
        const k = Math.min(1.25, 0.35 + n * 1.05 + (n2 - 0.5) * 0.25);
        const i = (y * s + x) * 4;
        if (kind === "mars") {
          img.data[i] = 158 * k;
          img.data[i + 1] = 84 * k;
          img.data[i + 2] = 50 * k;
        } else {
          const g = 152 * k;
          img.data[i] = g;
          img.data[i + 1] = g;
          img.data[i + 2] = Math.min(255, g * 1.06);
        }
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (kind === "moon") {
      // craters: dark bowl + bright rim
      for (let c = 0; c < 46; c++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 3 + Math.random() * 14;
        const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,0.22)");
        g.addColorStop(0.75, "rgba(0,0,0,0.05)");
        g.addColorStop(0.92, "rgba(255,255,255,0.14)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // dark rocks scattered in the dust
      for (let c = 0; c < 26; c++) {
        ctx.fillStyle = `rgba(40,16,8,${0.12 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function earthTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#0f3f77";
    ctx.fillRect(0, 0, s, s);
    // continents
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillStyle = `rgba(58,125,72,${0.55 + Math.random() * 0.35})`;
      ctx.beginPath();
      for (let b = 0; b < 5; b++) {
        ctx.arc(
          x + (Math.random() - 0.5) * 34,
          y + (Math.random() - 0.5) * 22,
          6 + Math.random() * 14,
          0,
          Math.PI * 2,
        );
      }
      ctx.fill();
    }
    // cloud swirls
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        8 + Math.random() * 22,
        3 + Math.random() * 6,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // polar caps
    ctx.fillStyle = "rgba(240,248,255,0.75)";
    ctx.fillRect(0, 0, s, 8);
    ctx.fillRect(0, s - 8, s, 8);
  });
}

/* ---------- terrain height ---------- */

function terrainHeight(kind: Universe, x: number, z: number): number {
  if (kind === "mars") {
    return fbm(x * 0.03, z * 0.03, 4) * 3.4 + fbm(x * 0.1, z * 0.1, 3) * 0.8 - 2.2;
  }
  return fbm(x * 0.05 + 7, z * 0.05 + 7, 4) * 2.2 + fbm(x * 0.14, z * 0.14, 2) * 0.6 - 1.6;
}

function displaceTerrain(geo: THREE.PlaneGeometry, kind: Universe) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const craters: { x: number; z: number; r: number; d: number }[] = [];
  if (kind === "moon") {
    for (let i = 0; i < 16; i++) {
      craters.push({
        x: (Math.random() - 0.5) * 220,
        z: -Math.random() * 90,
        r: 4 + Math.random() * 14,
        d: 0.6 + Math.random() * 1.6,
      });
    }
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = terrainHeight(kind, x, z);
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z);
      if (d < c.r * 1.3) {
        const t = d / c.r;
        if (t < 1) h -= c.d * (0.5 + 0.5 * Math.cos(t * Math.PI));
        h += c.d * 0.3 * Math.exp(-(t - 0.95) * (t - 0.95) * 60);
      }
    }
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
}

/**
 * Mission Command hub — the screen after the home starfield.
 * Pragmata-style cinematic horizon: the selected universe's terrain in the
 * foreground, a glowing Earth in the sky, twinkling stars, and gentle mouse
 * parallax. The universe toggle swaps terrain, light and mood live.
 */
export class HubScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mouse = { x: 0, y: 0 };
  private universe: Universe = "mars";
  private disposables: { dispose(): void }[] = [];

  private stars: THREE.Points;
  private earthGroup = new THREE.Group();
  private earth: THREE.Mesh;
  private haze: THREE.Sprite;
  private marsTerrain: THREE.Mesh;
  private moonTerrain: THREE.Mesh;
  private marsRocks = new THREE.Group();
  private moonRocks = new THREE.Group();
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private hazeBase = 0.5;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
    this.camera.position.set(0, 2.4, 12);
    this.camera.lookAt(0, 2.8, -40);
    this.scene.background = new THREE.Color(0x0a0508);
    this.scene.fog = new THREE.Fog(0x140a08, 55, 190);

    // ---------- stars ----------
    this.stars = makeStarfield(2400, 700);
    this.scene.add(this.stars);

    // ---------- glowing Earth in the sky ----------
    const earthGeo = new THREE.SphereGeometry(5.2, 48, 48);
    const earthTex = earthTexture();
    this.earth = new THREE.Mesh(
      earthGeo,
      new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.6,
        metalness: 0.05,
        emissive: new THREE.Color(0x0c2c55),
        emissiveIntensity: 0.5,
      }),
    );
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(5.55, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0x55a0ff) } },
        vertexShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
            gl_FragColor = vec4(uColor, f * 0.9);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const glowTex = makeGlowTexture("rgba(255,255,255,0.6)", "rgba(255,255,255,0)");
    const earthGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x6fb4ff,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    earthGlow.scale.set(24, 24, 1);
    this.earthGroup.add(this.earth, atmo, earthGlow);
    this.scene.add(this.earthGroup);
    this.disposables.push(earthGeo, earthTex, glowTex);

    // ---------- horizon haze ----------
    const hazeTex = makeGlowTexture("rgba(255,255,255,0.55)", "rgba(255,255,255,0)");
    this.haze = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: hazeTex,
        color: 0xff8844,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    this.haze.scale.set(95, 36, 1);
    this.haze.position.set(0, 1.2, -70);
    this.scene.add(this.haze);
    this.disposables.push(hazeTex);

    // ---------- terrains ----------
    const marsGeo = new THREE.PlaneGeometry(240, 100, 150, 60);
    marsGeo.rotateX(-Math.PI / 2);
    displaceTerrain(marsGeo, "mars");
    const marsTex = terrainTexture("mars");
    this.marsTerrain = new THREE.Mesh(
      marsGeo,
      new THREE.MeshStandardMaterial({ map: marsTex, roughness: 1 }),
    );
    this.marsTerrain.position.set(0, -3.6, -40);
    this.scene.add(this.marsTerrain);

    const moonGeo = new THREE.PlaneGeometry(240, 100, 150, 60);
    moonGeo.rotateX(-Math.PI / 2);
    displaceTerrain(moonGeo, "moon");
    const moonTex = terrainTexture("moon");
    this.moonTerrain = new THREE.Mesh(
      moonGeo,
      new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1 }),
    );
    this.moonTerrain.position.set(0, -3.4, -40);
    this.scene.add(this.moonTerrain);
    this.disposables.push(marsGeo, marsTex, moonGeo, moonTex);

    // ---------- rocks / boulders ----------
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x4a2013, roughness: 0.95 });
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(rockGeo, rustMat);
      const x = (Math.random() - 0.5) * 120;
      const z = -8 - Math.random() * 55;
      m.position.set(x, -3.6 + terrainHeight("mars", x, z), z);
      m.scale.setScalar(0.15 + Math.random() * 0.6);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.marsRocks.add(m);
    }
    const greyMat = new THREE.MeshStandardMaterial({ color: 0x4a4c55, roughness: 0.95 });
    for (let i = 0; i < 20; i++) {
      const m = new THREE.Mesh(rockGeo, greyMat);
      const x = (Math.random() - 0.5) * 120;
      const z = -8 - Math.random() * 55;
      m.position.set(x, -3.4 + terrainHeight("moon", x, z), z);
      m.scale.setScalar(0.15 + Math.random() * 0.7);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.moonRocks.add(m);
    }
    this.scene.add(this.marsRocks, this.moonRocks);
    this.disposables.push(rockGeo, rustMat, greyMat);

    // ---------- lights ----------
    this.hemi = new THREE.HemisphereLight(0xff9a66, 0x351408, 0.55);
    this.dir = new THREE.DirectionalLight(0xffd0a8, 1.15);
    this.dir.position.set(-18, 22, -8);
    this.scene.add(this.hemi, this.dir);

    this.applyUniverse(store.get().universe);
  }

  private applyUniverse(u: Universe) {
    this.universe = u;
    const mars = u === "mars";
    this.marsTerrain.visible = mars;
    this.marsRocks.visible = mars;
    this.moonTerrain.visible = !mars;
    this.moonRocks.visible = !mars;

    const bg = this.scene.background as THREE.Color;
    const fog = this.scene.fog as THREE.Fog;
    if (mars) {
      bg.set(0x0a0508);
      fog.color.set(0x140a08);
      this.hemi.color.set(0xff9a66);
      this.hemi.groundColor.set(0x351408);
      this.dir.color.set(0xffd0a8);
      (this.haze.material as THREE.SpriteMaterial).color.set(0xff8844);
      this.hazeBase = 0.5;
      this.earthGroup.position.set(15, 8.5, -70);
      this.earthGroup.scale.setScalar(0.55);
    } else {
      bg.set(0x04050c);
      fog.color.set(0x0a0d18);
      this.hemi.color.set(0x8fa8c8);
      this.hemi.groundColor.set(0x14161e);
      this.dir.color.set(0xcfe0ff);
      (this.haze.material as THREE.SpriteMaterial).color.set(0x6f93b8);
      this.hazeBase = 0.32;
      this.earthGroup.position.set(-17, 10.5, -46);
      this.earthGroup.scale.setScalar(1);
    }
  }

  update(dt: number, elapsed: number) {
    const u = store.get().universe;
    if (u !== this.universe) this.applyUniverse(u);

    this.stars.rotation.y += dt * 0.004;
    this.earth.rotation.y += dt * 0.05;

    // mouse parallax
    const k = 1 - Math.exp(-3.5 * dt);
    this.camera.position.x += (this.mouse.x * 2.6 - this.camera.position.x) * k;
    this.camera.position.y += (2.4 + this.mouse.y * 1.2 - this.camera.position.y) * k;
    this.camera.lookAt(0, 2.8, -40);

    // haze breathing
    (this.haze.material as THREE.SpriteMaterial).opacity =
      this.hazeBase + Math.sin(elapsed * 0.6) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  onPointerMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
    this.scene.clear();
  }
}
