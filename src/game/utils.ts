import * as THREE from 'three';

// ---------- deterministic hash noise ----------
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

export function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

// ---------- canvas texture helpers ----------
export function makeCanvasTexture(
  size: number,
  painter: (ctx: CanvasRenderingContext2D, size: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  painter(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeGlowTexture(inner = 'rgba(255,220,160,1)', outer = 'rgba(255,140,60,0)'): THREE.CanvasTexture {
  return makeCanvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, inner.replace('1)', '0.5)'));
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

export function makeTextSprite(
  text: string,
  opts: { size?: number; color?: string; font?: string } = {}
): THREE.Sprite {
  const { size = 1, color = '#e8e4da', font = '500 42px "IBM Plex Mono", monospace' } = opts;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = w;
  canvas.height = 64;
  const c2 = canvas.getContext('2d')!;
  c2.font = font;
  c2.fillStyle = color;
  c2.textAlign = 'center';
  c2.textBaseline = 'middle';
  c2.shadowColor = color;
  c2.shadowBlur = 12;
  c2.fillText(text, w / 2, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((w / 64) * size, size, 1);
  return sprite;
}

// ---------- starfield ----------
export function makeStarfield(count = 4000, radius = 900): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.5 + Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const warmth = Math.random();
    const c = new THREE.Color().setHSL(warmth < 0.75 ? 0.6 : 0.08, 0.25, 0.65 + Math.random() * 0.35);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// ---------- scene interface ----------
export interface Scene {
  update(dt: number, elapsed: number): void;
  dispose(): void;
  onPointerDown?(x: number, y: number): void;
  onPointerMove?(x: number, y: number, isDown: boolean): void;
  onPointerUp?(): void;
  onWheel?(delta: number): void;
  onKey?(code: string, down: boolean): void;
}
