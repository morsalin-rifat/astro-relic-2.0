import * as THREE from 'three';
import { store } from '../../state/store';
import { audio } from '../audio';
import { makeStarfield, makeCanvasTexture, type Scene } from '../utils';
import { CINEMATIC_BEATS } from '../../data/content';
import {
  buildPathfinderCruiseStage,
  buildSupersonicParachute,
  buildPathfinderAirbagCluster,
  buildEntryPlasmaShockwave,
} from '../models/nasaPathfinderEdl';
import { createHighFidelityMarsTexture, createMarsBumpTexture } from './marsFocus';

const DURATION = 17.5; // Total authentic NASA EDL sequence duration

export class MarsCinematicScene implements Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;

  // Space & Mars Globe
  private marsGlobe: THREE.Mesh;
  private marsAtmosphere: THREE.Mesh;
  private stars = makeStarfield(6000, 1000);
  private starsNear = makeStarfield(1500, 400);

  // Surface Terrain (Approached in final descent & bounce)
  private groundSurface: THREE.Mesh;
  private surfaceRocks: THREE.InstancedMesh;

  // NASA Mars Pathfinder Spacecraft Components
  private spacecraftRoot: THREE.Group;
  private cruiseStageMesh: THREE.Group;
  private aeroshellGroup: THREE.Group;
  private heatShieldMesh: THREE.Mesh;
  private parachuteObj: { group: THREE.Group; canopy: THREE.Mesh; lines: THREE.LineSegments };
  private airbagCluster: THREE.Group;
  private plasmaFx: { group: THREE.Group; plasmaCone: THREE.Mesh; glowLight: THREE.PointLight };

  // Particle Effects
  private plasmaStreamParticles: THREE.Points;
  private impactDustParticles: THREE.Points;

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private entryPointLight: THREE.PointLight;

  private time = 0;
  private beatIdx = 0;
  private done = false;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 4000);
    this.scene.background = new THREE.Color(0x020206);

    this.scene.add(this.stars);
    this.scene.add(this.starsNear);

    // 1. High-Fidelity 3D Mars Globe (approached during early descent)
    const marsGeo = new THREE.SphereGeometry(32, 64, 48);
    const marsMat = new THREE.MeshStandardMaterial({
      map: createHighFidelityMarsTexture(1024),
      bumpMap: createMarsBumpTexture(512),
      bumpScale: 0.25,
      roughness: 0.9,
    });
    this.marsGlobe = new THREE.Mesh(marsGeo, marsMat);
    this.marsGlobe.position.set(0, -6, -260);
    this.marsGlobe.rotation.z = 0.44;
    this.scene.add(this.marsGlobe);

    // Mars Atmospheric Haze
    const atmoGeo = new THREE.SphereGeometry(32.8, 48, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xe0603f,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    this.marsAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.marsGlobe.add(this.marsAtmosphere);

    // 2. High-Fidelity Martian Ground Terrain (revealed during final touchdown & bounce)
    const groundGeo = new THREE.PlaneGeometry(350, 350, 48, 48);
    const groundTex = makeCanvasTexture(512, (ctx, s) => {
      ctx.fillStyle = '#b34728';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70,20,10,0.35)' : 'rgba(230,130,80,0.25)';
        ctx.beginPath();
        ctx.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.95,
      metalness: 0.05,
    });
    this.groundSurface = new THREE.Mesh(groundGeo, groundMat);
    this.groundSurface.rotation.x = -Math.PI / 2;
    this.groundSurface.position.set(0, -50, -180);
    this.groundSurface.visible = false;
    this.scene.add(this.groundSurface);

    // Martian Ares Vallis Boulders
    const rockGeo = new THREE.DodecahedronGeometry(0.6, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6e2c1a, roughness: 0.9 });
    const rockCount = 60;
    this.surfaceRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new THREE.Object3D();
    for (let r = 0; r < rockCount; r++) {
      dummy.position.set(
        (Math.random() - 0.5) * 80,
        -49.6,
        -180 + (Math.random() - 0.5) * 80
      );
      dummy.scale.set(0.4 + Math.random() * 0.8, 0.3 + Math.random() * 0.6, 0.4 + Math.random() * 0.8);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      this.surfaceRocks.setMatrixAt(r, dummy.matrix);
    }
    this.surfaceRocks.instanceMatrix.needsUpdate = true;
    this.surfaceRocks.visible = false;
    this.scene.add(this.surfaceRocks);

    // 3. Assemble NASA Mars Pathfinder EDL Hardware
    const csData = buildPathfinderCruiseStage();
    this.spacecraftRoot = csData.root;
    this.cruiseStageMesh = csData.cruiseStage;
    this.aeroshellGroup = csData.aeroshell;
    this.heatShieldMesh = csData.heatShield;
    this.spacecraftRoot.position.set(2.8, -0.5, -12);
    this.spacecraftRoot.rotation.x = 0.2;
    this.scene.add(this.spacecraftRoot);

    // Parachute Assembly
    this.parachuteObj = buildSupersonicParachute();
    this.parachuteObj.group.position.copy(this.spacecraftRoot.position);
    this.parachuteObj.group.visible = false;
    this.scene.add(this.parachuteObj.group);

    // Airbag Cluster
    this.airbagCluster = buildPathfinderAirbagCluster();
    this.airbagCluster.position.copy(this.spacecraftRoot.position);
    this.airbagCluster.visible = false;
    this.scene.add(this.airbagCluster);

    // Atmospheric Entry Shockwave Plasma
    this.plasmaFx = buildEntryPlasmaShockwave();
    this.aeroshellGroup.add(this.plasmaFx.group);
    this.plasmaFx.group.visible = false;

    // 4. Plasma Particle Streams
    const plasmaPCount = 450;
    const plasmaGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(plasmaPCount * 3);
    for (let i = 0; i < plasmaPCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    plasmaGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.plasmaStreamParticles = new THREE.Points(
      plasmaGeo,
      new THREE.PointsMaterial({
        color: 0xff6622,
        size: 0.14,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.plasmaStreamParticles);

    // Impact Dust Plume Particles
    const dustCount = 400;
    const dustGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 20;
      dPos[i * 3 + 1] = Math.random() * 8;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    this.impactDustParticles = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xd66838,
        size: 0.25,
        transparent: true,
        opacity: 0,
      })
    );
    this.impactDustParticles.position.set(0, -49, -180);
    this.scene.add(this.impactDustParticles);

    // 5. Lighting
    this.sunLight = new THREE.DirectionalLight(0xfff2dc, 3.5);
    this.sunLight.position.set(-50, 30, 40);
    this.scene.add(this.sunLight);

    this.entryPointLight = new THREE.PointLight(0xff7722, 0, 50);
    this.scene.add(this.entryPointLight);

    const ambient = new THREE.AmbientLight(0x221a18, 0.9);
    this.scene.add(ambient);

    audio.play('space');
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, _t: number) {
    this.time += dt;
    const T = this.time;

    // Mission Milestone Captions
    if (this.beatIdx < CINEMATIC_BEATS.length && T >= CINEMATIC_BEATS[this.beatIdx].at) {
      store.set({ caption: CINEMATIC_BEATS[this.beatIdx] });
      this.beatIdx++;
      setTimeout(() => store.set({ caption: null }), 2600);
    }

    // -----------------------------------------------------------------
    // PHASE 1: Mars Approach (T: 0.0s - 3.2s)
    // -----------------------------------------------------------------
    if (T < 3.2) {
      const prog = T / 3.2;
      // Spacecraft cruises toward Mars
      this.spacecraftRoot.position.set(2.8 - prog * 0.8, -0.5, -12 - prog * 20);
      this.spacecraftRoot.rotation.z = Math.sin(T * 0.8) * 0.03;
      this.spacecraftRoot.rotation.y += dt * 0.15;

      // Camera smoothly sweeps across spacecraft flank
      this.camera.position.set(
        Math.cos(T * 0.4) * 8,
        1.5 + Math.sin(T * 0.3) * 0.8,
        this.spacecraftRoot.position.z + 7.5
      );
      this.camera.lookAt(this.spacecraftRoot.position);
    }

    // -----------------------------------------------------------------
    // PHASE 2: Cruise Stage Separation (T: 3.2s - 6.2s)
    // -----------------------------------------------------------------
    else if (T >= 3.2 && T < 6.2) {
      const prog = (T - 3.2) / 3.0;

      // Cruise Stage detaches and drifts off into the blackness of space
      this.cruiseStageMesh.position.y += dt * 1.8;
      this.cruiseStageMesh.position.x += dt * 0.8;
      this.cruiseStageMesh.rotation.z += dt * 0.4;

      // Aeroshell pitches into atmospheric entry angle (facing heat shield forward)
      this.aeroshellGroup.rotation.x = THREE.MathUtils.lerp(this.aeroshellGroup.rotation.x, Math.PI * 0.45, dt * 1.8);
      this.spacecraftRoot.position.z -= dt * 12;

      this.camera.position.set(
        -4.5 + prog * 2,
        2.2,
        this.spacecraftRoot.position.z + 8.5
      );
      this.camera.lookAt(this.aeroshellGroup.position.clone().add(this.spacecraftRoot.position));
    }

    // -----------------------------------------------------------------
    // PHASE 3: Atmospheric Entry & Plasma Fire Sheath (T: 6.2s - 9.2s)
    // -----------------------------------------------------------------
    else if (T >= 6.2 && T < 9.2) {
      const prog = (T - 6.2) / 3.0;
      this.plasmaFx.group.visible = true;

      // Incandescent plasma fire intensity peaking at peak heating
      const heatIntensity = Math.sin(prog * Math.PI);
      this.plasmaFx.glowLight.intensity = heatIntensity * 25;
      (this.plasmaFx.plasmaCone.material as THREE.MeshBasicMaterial).opacity = 0.6 + heatIntensity * 0.35;

      // Stream of plasma sparks and ablated embers
      (this.plasmaStreamParticles.material as THREE.PointsMaterial).opacity = heatIntensity * 0.85;
      this.plasmaStreamParticles.position.copy(this.spacecraftRoot.position);
      this.plasmaStreamParticles.rotation.z += dt * 0.8;

      // High-speed plunge toward Mars
      this.spacecraftRoot.position.z -= dt * 24;
      this.spacecraftRoot.position.y -= dt * 4;

      // Intense atmospheric deceleration turbulence camera shake
      const shakeAmt = heatIntensity * 0.22;
      this.camera.position.set(
        this.spacecraftRoot.position.x + 3.5 + (Math.random() - 0.5) * shakeAmt,
        this.spacecraftRoot.position.y + 1.8 + (Math.random() - 0.5) * shakeAmt,
        this.spacecraftRoot.position.z + 7.5
      );
      this.camera.lookAt(this.spacecraftRoot.position);
    }

    // -----------------------------------------------------------------
    // PHASE 4: Parachute Deployment & Heat Shield Separation (T: 9.2s - 12.0s)
    // -----------------------------------------------------------------
    else if (T >= 9.2 && T < 12.0) {
      const prog = (T - 9.2) / 2.8;
      this.plasmaFx.group.visible = false;
      (this.plasmaStreamParticles.material as THREE.PointsMaterial).opacity = 0;

      // Deploy Supersonic Parachute
      this.parachuteObj.group.visible = true;
      this.parachuteObj.group.position.copy(this.spacecraftRoot.position);

      // Deceleration slows forward speed
      this.spacecraftRoot.position.z -= dt * 10;
      this.spacecraftRoot.position.y -= dt * 6;

      // Heat Shield separates and drops away downwards into Mars canyon depth
      if (prog > 0.25) {
        this.heatShieldMesh.position.y -= dt * 8;
        this.heatShieldMesh.rotation.x += dt * 1.5;
        this.heatShieldMesh.rotation.z += dt * 1.2;
      }

      // Parachute canopy billows
      this.parachuteObj.canopy.scale.y = 0.95 + Math.sin(T * 8) * 0.05;

      // Camera swoops up under the orange-white parachute
      this.camera.position.set(
        this.spacecraftRoot.position.x - 2.5,
        this.spacecraftRoot.position.y + 4.5,
        this.spacecraftRoot.position.z + 10.0
      );
      this.camera.lookAt(this.spacecraftRoot.position);
    }

    // -----------------------------------------------------------------
    // PHASE 5: Vectran Airbag Inflation & Retro-Rocket Fire (T: 12.0s - 14.8s)
    // -----------------------------------------------------------------
    else if (T >= 12.0 && T < 14.8) {
      // Parachute cuts away and drifts upward
      this.parachuteObj.group.position.y += dt * 12;

      // Reveal Martian Surface Terrain
      this.groundSurface.visible = true;
      this.surfaceRocks.visible = true;
      this.marsGlobe.visible = false;

      // Hide Aeroshell, deploy 24-lobe Vectran Airbag cocoon
      this.spacecraftRoot.visible = false;
      this.airbagCluster.visible = true;

      // Descending toward surface
      const dropZ = -180;
      const dropY = -48 + (14.8 - T) * 12;
      this.airbagCluster.position.set(0, Math.max(-48.8, dropY), dropZ);

      // Camera tracks airbag descent
      this.camera.position.set(
        5.5,
        -46.0,
        this.airbagCluster.position.z + 12.5
      );
      this.camera.lookAt(this.airbagCluster.position);
    }

    // -----------------------------------------------------------------
    // PHASE 6: Impact & Bouncing across Ares Vallis (T: 14.8s - 17.5s)
    // -----------------------------------------------------------------
    else if (T >= 14.8) {
      const bTime = T - 14.8;
      this.airbagCluster.visible = true;
      this.groundSurface.visible = true;
      this.surfaceRocks.visible = true;

      // Authentic bouncing physics: decays exponentially over time
      const bounceHeight = Math.max(0, Math.sin(bTime * 5.2) * (5.5 * Math.exp(-bTime * 1.1)));
      const rollDist = bTime * 8.5;

      this.airbagCluster.position.set(
        Math.sin(bTime * 2) * 2.5,
        -48.8 + Math.abs(bounceHeight),
        -180 + rollDist
      );
      this.airbagCluster.rotation.x += dt * 3.5;
      this.airbagCluster.rotation.z += dt * 2.2;

      // Trigger impact dust plumes on each bounce
      if (Math.abs(bounceHeight) < 0.3) {
        (this.impactDustParticles.material as THREE.PointsMaterial).opacity = 0.85;
      } else {
        (this.impactDustParticles.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          (this.impactDustParticles.material as THREE.PointsMaterial).opacity - dt * 0.8
        );
      }

      // Camera follows airbag rolling to final resting position
      this.camera.position.set(
        8.0,
        -46.5,
        this.airbagCluster.position.z + 14.0
      );
      this.camera.lookAt(this.airbagCluster.position);
    }

    // Mars globe slow rotation in early phases
    if (this.marsGlobe.visible) {
      this.marsGlobe.rotation.y += dt * 0.02;
    }

    this.renderer.render(this.scene, this.camera);

    // Sequence Completion: Transition into Phase 06 Mars Surface Exploration!
    if (T > DURATION && !this.done) {
      this.done = true;
      store.set({ caption: null });
      store.emit('engine:goto', 'explore');
    }
  }

  dispose() {
    store.set({ caption: null });
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = (m as any).material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}
