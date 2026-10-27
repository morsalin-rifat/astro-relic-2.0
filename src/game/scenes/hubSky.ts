import * as THREE from "three";
import { makeGlowTexture } from "../utils";

/**
 * Living sky + surface ambience for the hub: twinkling near-star layer,
 * shooting stars, distant horizon meteor strikes (flash + dust ring),
 * a blinking rover beacon, floating dust and a pale (blue-haloed on Mars) sun.
 * Everything stays far in the background so the menu is never covered.
 */
export class HubSky {
  group = new THREE.Group();
  private twinkle: THREE.Points;
  private twMat: THREE.ShaderMaterial;
  private comet: THREE.Line;
  private cometT = -1;
  private cometNext = 4;
  private cometFrom = new THREE.Vector3();
  private cometDir = new THREE.Vector3();
  private meteor: THREE.Sprite;
  private flash: THREE.Sprite;
  private ring: THREE.Mesh;
  private meteorT = -1;
  private meteorNext = 9;
  private meteorTarget = new THREE.Vector3();
  private beacon: THREE.Sprite;
  private dust: THREE.Points;
  private sun: THREE.Sprite;
  private sunHalo: THREE.Sprite;
  private glow = makeGlowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  private mars = true;

  constructor() {
    // near twinkling stars (shader driven, cheap)
    const n = 900;
    const pos = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const y = 0.05 + Math.random() * 0.95;
      const r = 300;
      pos[i * 3] = Math.cos(th) * r * Math.sqrt(1 - y * y);
      pos[i * 3 + 1] = y * r * 0.7;
      pos[i * 3 + 2] = -Math.abs(Math.sin(th) * r * Math.sqrt(1 - y * y)) - 40;
      ph[i] = Math.random() * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    this.twMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: `
        attribute float phase; uniform float uTime; uniform vec2 uMouse; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mv;
          vec2 ndc = gl_Position.xy / gl_Position.w;
          float near = 1.0 - smoothstep(0.0, 0.35, distance(ndc, uMouse));
          vA = 0.35 + 0.35*sin(uTime*1.7+phase) + near*0.9;
          gl_PointSize = 1.6 + near*2.6 + 0.6*sin(uTime*2.3+phase*2.0);
        }`,
      fragmentShader: `
        varying float vA;
        void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard;
          gl_FragColor = vec4(0.85,0.92,1.0, vA*(1.0-d*2.0)); }`,
    });
    this.twinkle = new THREE.Points(g, this.twMat);
    this.group.add(this.twinkle);

    // shooting star
    const cg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    cg.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0.1, 0.4, 0.8]), 3),
    );
    this.comet = new THREE.Line(
      cg,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending }),
    );
    this.comet.visible = false;
    this.group.add(this.comet);

    // meteor + impact
    const sm = (c: number) =>
      new THREE.SpriteMaterial({ map: this.glow, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.meteor = new THREE.Sprite(sm(0xffb070));
    this.meteor.scale.setScalar(2.2);
    this.meteor.visible = false;
    this.flash = new THREE.Sprite(sm(0xffc890));
    this.flash.visible = false;
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0xd9a27a, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    this.group.add(this.meteor, this.flash, this.ring);

    // rover beacon
    this.beacon = new THREE.Sprite(sm(0xff3b30));
    this.beacon.position.set(-22, -1.6, -58);
    this.beacon.scale.setScalar(1.4);
    this.group.add(this.beacon);

    // floating dust
    const dn = 260;
    const dp = new Float32Array(dn * 3);
    for (let i = 0; i < dn; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 60;
      dp[i * 3 + 1] = -3 + Math.random() * 7;
      dp[i * 3 + 2] = -2 - Math.random() * 40;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(
      dg,
      new THREE.PointsMaterial({ size: 0.09, color: 0xffb98a, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.group.add(this.dust);

    // pale sun + halo (blue on Mars — real Martian sunset)
    this.sunHalo = new THREE.Sprite(sm(0x6fa8ff));
    this.sunHalo.scale.setScalar(26);
    this.sun = new THREE.Sprite(sm(0xfff4e0));
    this.sun.scale.setScalar(4);
    this.sun.position.set(-34, 3, -120);
    this.sunHalo.position.copy(this.sun.position);
    this.group.add(this.sunHalo, this.sun);
  }

  setUniverse(mars: boolean) {
    this.mars = mars;
    (this.dust.material as THREE.PointsMaterial).color.set(mars ? 0xffb98a : 0xcfe0ff);
    (this.dust.material as THREE.PointsMaterial).opacity = mars ? 0.55 : 0.35;
    (this.sunHalo.material as THREE.SpriteMaterial).color.set(mars ? 0x6fa8ff : 0xffffff);
    (this.sunHalo.material as THREE.SpriteMaterial).opacity = mars ? 0.7 : 0.25;
    (this.beacon.material as THREE.SpriteMaterial).color.set(mars ? 0xff3b30 : 0x38e1ff);
    (this.meteor.material as THREE.SpriteMaterial).color.set(mars ? 0xffb070 : 0xcfe6ff);
    (this.ring.material as THREE.MeshBasicMaterial).color.set(mars ? 0xd9a27a : 0xc9ced8);
  }

  update(dt: number, t: number, mouse: { x: number; y: number }, groundY: number) {
    this.twMat.uniforms["uTime"]!.value = t;
    (this.twMat.uniforms["uMouse"]!.value as THREE.Vector2).set(mouse.x, mouse.y);
    this.twinkle.position.set(-mouse.x * 6, -mouse.y * 3, 0);

    // shooting star
    this.cometNext -= dt;
    if (this.cometT < 0 && this.cometNext <= 0) {
      this.cometT = 0;
      this.cometFrom.set((Math.random() - 0.2) * 160, 60 + Math.random() * 40, -200);
      this.cometDir.set(-(60 + Math.random() * 60), -(25 + Math.random() * 25), 0);
      this.comet.visible = true;
    }
    if (this.cometT >= 0) {
      this.cometT += dt / 0.9;
      const p = this.comet.geometry.attributes["position"] as THREE.BufferAttribute;
      const head = this.cometFrom.clone().addScaledVector(this.cometDir, this.cometT);
      const tail = head.clone().addScaledVector(this.cometDir, -0.18);
      p.setXYZ(0, head.x, head.y, head.z);
      p.setXYZ(1, tail.x, tail.y, tail.z);
      p.needsUpdate = true;
      (this.comet.material as THREE.LineBasicMaterial).opacity = Math.sin(Math.min(1, this.cometT) * Math.PI);
      if (this.cometT >= 1) {
        this.cometT = -1;
        this.comet.visible = false;
        this.cometNext = 8 + Math.random() * 6;
      }
    }

    // distant meteor strike
    this.meteorNext -= dt;
    if (this.meteorT < 0 && this.meteorNext <= 0) {
      this.meteorT = 0;
      this.meteorTarget.set((Math.random() - 0.5) * 70, groundY + 0.5, -60 - Math.random() * 20);
      this.meteor.visible = true;
    }
    if (this.meteorT >= 0) {
      this.meteorT += dt;
      const fall = Math.min(1, this.meteorT / 1.1);
      this.meteor.position.set(
        this.meteorTarget.x + 30 * (1 - fall),
        this.meteorTarget.y + 45 * (1 - fall),
        this.meteorTarget.z,
      );
      if (fall >= 1) {
        this.meteor.visible = false;
        const k = (this.meteorT - 1.1) / 2.2;
        this.flash.visible = this.ring.visible = k < 1;
        this.flash.position.copy(this.meteorTarget).setY(this.meteorTarget.y + 1);
        this.flash.scale.setScalar(6 + k * 10);
        (this.flash.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - k * 2.5);
        this.ring.position.copy(this.meteorTarget);
        this.ring.scale.setScalar(1 + k * 9);
        (this.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 * (1 - k));
        if (k >= 1) {
          this.meteorT = -1;
          this.meteorNext = 14 + Math.random() * 12;
        }
      }
    }

    // beacon blink
    (this.beacon.material as THREE.SpriteMaterial).opacity = Math.sin(t * 3) > 0.6 ? 1 : 0.15;

    // dust drift (wind on Mars, slow float on Moon)
    const p = this.dust.geometry.attributes["position"] as THREE.BufferAttribute;
    const wind = this.mars ? 1.4 : 0.15;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) + dt * wind;
      if (x > 30) x = -30;
      p.setX(i, x);
      p.setY(i, p.getY(i) + Math.sin(t + i) * dt * 0.08);
    }
    p.needsUpdate = true;

    // sun shimmer when mouse near (upper-left)
    const near = Math.max(0, 1 - Math.hypot(mouse.x + 0.6, mouse.y - 0.1) * 1.6);
    this.sunHalo.scale.setScalar(26 + near * 14);
  }

  dispose() {
    this.glow.dispose();
  }
}
