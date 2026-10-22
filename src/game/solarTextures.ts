import * as THREE from 'three';
import { makeCanvasTexture, fbm } from './utils';

// Helper for generating noise-based planet textures
function createProceduralTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void
): THREE.CanvasTexture {
  return makeCanvasTexture(size, draw);
}

// ----------------- SUN TEXTURE -----------------
export function createSunTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    const imgData = ctx.createImageData(s, s);
    const data = imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        // Turbulent solar convection cells using multiple octaves
        const n1 = fbm(u * 14, v * 14, 4);
        const n2 = fbm((u + 0.3) * 28, (v + 0.3) * 28, 3);
        const n = n1 * 0.7 + n2 * 0.3;

        // Solar color gradient from deep orange-red to blazing yellow-white
        const r = Math.min(255, Math.floor(255 * (0.85 + n * 0.4)));
        const g = Math.min(255, Math.floor(130 + n * 125));
        const b = Math.min(255, Math.floor(10 + Math.max(0, n - 0.4) * 240));

        const idx = (y * s + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Overlay prominent solar flares / granules
    ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * s;
      const py = Math.random() * s;
      const pr = 4 + Math.random() * 16;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      grad.addColorStop(0, 'rgba(255, 255, 220, 0.6)');
      grad.addColorStop(1, 'rgba(255, 140, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ----------------- MERCURY TEXTURE -----------------
export function createMercuryTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    ctx.fillStyle = '#6e6963';
    ctx.fillRect(0, 0, s, s);

    // Surface rough craters and maria
    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const n = fbm(u * 12, v * 12, 4);
        const base = 110 + Math.floor(n * 60);
        const idx = (y * s + x) * 4;
        d[idx] = Math.min(255, base + 8);
        d[idx + 1] = base;
        d[idx + 2] = Math.max(0, base - 8);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw crater rings
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * s;
      const cy = Math.random() * s;
      const r = 2 + Math.random() * 14;
      ctx.strokeStyle = 'rgba(200, 195, 185, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(40, 38, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ----------------- VENUS TEXTURE -----------------
export function createVenusTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    // Warm golden cream base
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#ecd2a4');
    grad.addColorStop(0.5, '#deb87c');
    grad.addColorStop(1, '#e3c690');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    // Swirling sulfuric cloud bands
    for (let y = 0; y < s; y += 4) {
      const offset = Math.sin(y * 0.05) * 20;
      ctx.fillStyle = y % 8 === 0 ? 'rgba(215, 175, 110, 0.35)' : 'rgba(255, 240, 210, 0.3)';
      ctx.fillRect(0, y + offset, s, 6);
    }

    // High velocity chevron cloud swirls
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * s;
      const cy = Math.random() * s;
      const len = 40 + Math.random() * 90;
      ctx.strokeStyle = 'rgba(255, 245, 225, 0.25)';
      ctx.lineWidth = 3 + Math.random() * 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + len * 0.3, cy - 10, cx + len * 0.7, cy + 10, cx + len, cy);
      ctx.stroke();
    }
  });
}

// ----------------- EARTH TEXTURE -----------------
export function createEarthTexture(): THREE.CanvasTexture {
  return createProceduralTexture(1024, (ctx, s) => {
    // Deep Ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, s);
    oceanGrad.addColorStop(0, '#0f2b54');
    oceanGrad.addColorStop(0.5, '#174785');
    oceanGrad.addColorStop(1, '#0e2447');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, s, s);

    // Continents using procedural noise shapes
    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        // Continent landmass threshold
        const landNoise = fbm(u * 5.5, v * 5.5, 5);
        const detail = fbm(u * 18, v * 18, 3);
        const isLand = landNoise + detail * 0.2 > 0.52;

        const idx = (y * s + x) * 4;

        if (isLand) {
          // Polar ice / desert / temperate vegetation
          const lat = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles
          if (lat > 0.8) {
            // Polar ice caps
            d[idx] = 230;
            d[idx + 1] = 240;
            d[idx + 2] = 250;
          } else if (lat < 0.35 && detail > 0.55) {
            // Arid / desert regions (Sahara/Arabia-like)
            d[idx] = 195;
            d[idx + 1] = 165;
            d[idx + 2] = 110;
          } else {
            // Lush greenery / forests
            d[idx] = 45 + Math.floor(detail * 35);
            d[idx + 1] = 115 + Math.floor(detail * 45);
            d[idx + 2] = 45;
          }
        } else {
          // Shallow waters along coasts
          const shallow = landNoise + detail * 0.2;
          if (shallow > 0.47) {
            d[idx] = 25;
            d[idx + 1] = 115;
            d[idx + 2] = 175;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// ----------------- EARTH CLOUDS TEXTURE -----------------
export function createEarthCloudsTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const imgData = ctx.createImageData(s, s);
    const d = imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const cloud = fbm(u * 7, v * 7, 4) + fbm(u * 16, v * 16, 2) * 0.3;
        const idx = (y * s + x) * 4;

        if (cloud > 0.55) {
          const alpha = Math.min(240, Math.floor((cloud - 0.55) * 480));
          d[idx] = 255;
          d[idx + 1] = 255;
          d[idx + 2] = 255;
          d[idx + 3] = alpha;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// ----------------- MOON TEXTURE -----------------
export function createMoonTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    ctx.fillStyle = '#8e8e93';
    ctx.fillRect(0, 0, s, s);

    // Dark lunar maria basalt basins
    for (let i = 0; i < 7; i++) {
      const mx = Math.random() * s;
      const my = 0.2 * s + Math.random() * 0.6 * s;
      const mr = 40 + Math.random() * 90;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
      grad.addColorStop(0, 'rgba(65, 65, 70, 0.7)');
      grad.addColorStop(0.7, 'rgba(80, 80, 85, 0.4)');
      grad.addColorStop(1, 'rgba(120, 120, 125, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact craters with white ejecta rays
    for (let i = 0; i < 110; i++) {
      const cx = Math.random() * s;
      const cy = Math.random() * s;
      const r = 2 + Math.random() * 12;
      ctx.strokeStyle = 'rgba(235, 235, 240, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      if (r > 7) {
        // Ejecta rays
        ctx.strokeStyle = 'rgba(220, 220, 230, 0.2)';
        ctx.beginPath();
        ctx.moveTo(cx - r * 2.5, cy);
        ctx.lineTo(cx + r * 2.5, cy);
        ctx.moveTo(cx, cy - r * 2.5);
        ctx.lineTo(cx, cy + r * 2.5);
        ctx.stroke();
      }
    }
  });
}

// ----------------- MARS TEXTURE -----------------
export function createMarsTexture(): THREE.CanvasTexture {
  return createProceduralTexture(1024, (ctx, s) => {
    // Rich red-orange iron oxide soil
    const baseGrad = ctx.createLinearGradient(0, 0, 0, s);
    baseGrad.addColorStop(0, '#ba4828');
    baseGrad.addColorStop(0.5, '#cc5634');
    baseGrad.addColorStop(1, '#a83c1e');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, s, s);

    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const n = fbm(u * 8, v * 8, 4);
        const idx = (y * s + x) * 4;

        // Dark volcanic basalt regions (Syrtis Major, Acidalia Planitia)
        if (n < 0.42) {
          const darkFactor = 0.65 + n * 0.8;
          d[idx] = Math.floor(d[idx] * darkFactor * 0.85);
          d[idx + 1] = Math.floor(d[idx + 1] * darkFactor * 0.7);
          d[idx + 2] = Math.floor(d[idx + 2] * darkFactor * 0.7);
        } else if (n > 0.6) {
          // Bright highlands / Olympus Mons plateaus
          d[idx] = Math.min(255, d[idx] + 25);
          d[idx + 1] = Math.min(255, d[idx + 1] + 15);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Valles Marineris massive canyon rift
    ctx.strokeStyle = 'rgba(70, 20, 10, 0.75)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(s * 0.25, s * 0.52);
    ctx.bezierCurveTo(s * 0.4, s * 0.48, s * 0.55, s * 0.55, s * 0.72, s * 0.51);
    ctx.stroke();

    // Polar ice caps (North & South)
    ctx.fillStyle = 'rgba(255, 250, 245, 0.95)';
    ctx.beginPath();
    ctx.ellipse(s / 2, 24, s * 0.35, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(s / 2, s - 20, s * 0.28, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----------------- JUPITER TEXTURE -----------------
export function createJupiterTexture(): THREE.CanvasTexture {
  return createProceduralTexture(1024, (ctx, s) => {
    // Jupiter's iconic alternating ammonia/sulfur cloud belts
    const colors = [
      '#e4d0b2', '#c28d5d', '#dfcaa4', '#9e623b',
      '#e9d8be', '#7e4726', '#e0cfb8', '#9e623b',
      '#dfcca6', '#b0794e', '#ebdcc5', '#985934',
    ];

    const bandHeight = s / colors.length;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, i * bandHeight, s, bandHeight + 2);
    }

    // Add turbulence and wave distortions across belts
    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;

    for (let y = 0; y < s; y++) {
      const wave = Math.sin(y * 0.08) * 12 + Math.cos(y * 0.03) * 18;
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const turb = fbm((u + wave / s) * 18, v * 14, 3);
        const idx = (y * s + x) * 4;
        const tint = (turb - 0.5) * 35;
        d[idx] = Math.max(0, Math.min(255, d[idx] + tint));
        d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + tint * 0.7));
        d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + tint * 0.4));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // THE GREAT RED SPOT (giant anticyclone in southern hemisphere)
    const grsX = s * 0.62;
    const grsY = s * 0.64;
    const grsRadiusX = s * 0.09;
    const grsRadiusY = s * 0.055;

    // Spot outer turbulence ring
    ctx.fillStyle = '#b3472b';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsRadiusX, grsRadiusY, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Spot core
    const grsCore = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, grsRadiusX);
    grsCore.addColorStop(0, 'rgba(230, 85, 45, 0.95)');
    grsCore.addColorStop(0.7, 'rgba(175, 55, 30, 0.85)');
    grsCore.addColorStop(1, 'rgba(140, 45, 25, 0)');
    ctx.fillStyle = grsCore;
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsRadiusX, grsRadiusY, -0.05, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----------------- SATURN TEXTURE -----------------
export function createSaturnTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    // Subtle golden beige pastel bands
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#e5d1a8');
    grad.addColorStop(0.25, '#d6be90');
    grad.addColorStop(0.5, '#e8d8b4');
    grad.addColorStop(0.75, '#c9ae7d');
    grad.addColorStop(1, '#e2cea2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    for (let y = 0; y < s; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgba(180, 150, 100, 0.15)' : 'rgba(255, 245, 220, 0.12)';
      ctx.fillRect(0, y, s, 3);
    }
  });
}

// ----------------- SATURN RINGS TEXTURE -----------------
export function createSaturnRingTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    // 1D radial ring pattern across height (inner to outer)
    ctx.clearRect(0, 0, s, s);

    for (let x = 0; x < s; x++) {
      const t = x / s; // 0 = inner radius, 1 = outer radius
      let alpha = 0;
      let r = 215, g = 195, b = 150;

      if (t < 0.12) {
        // Transparent inside
        alpha = 0;
      } else if (t < 0.32) {
        // C Ring (faint, translucent)
        alpha = 0.25 + (t - 0.12) * 0.4;
        r = 175; g = 155; b = 125;
      } else if (t < 0.68) {
        // B Ring (brightest, densest ring)
        alpha = 0.85 + Math.sin(t * 120) * 0.1;
        r = 230; g = 210; b = 170;
      } else if (t < 0.74) {
        // CASSINI DIVISION (gap between B and A rings)
        alpha = 0.05; // near transparent gap
      } else if (t < 0.94) {
        // A Ring (wide bright outer ring)
        alpha = 0.65 + Math.sin(t * 80) * 0.12;
        r = 210; g = 190; b = 155;
      } else {
        // Outer feather edge
        alpha = Math.max(0, (1 - t) / 0.06 * 0.4);
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fillRect(x, 0, 1, s);
    }
  });
}

// ----------------- URANUS TEXTURE -----------------
export function createUranusTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#b6e9ec');
    grad.addColorStop(0.5, '#92d6dc');
    grad.addColorStop(1, '#a6e1e6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    // Subtle hazy methane bands
    for (let y = 0; y < s; y += 8) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, y, s, 4);
    }
  });
}

// ----------------- NEPTUNE TEXTURE -----------------
export function createNeptuneTexture(): THREE.CanvasTexture {
  return createProceduralTexture(512, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#2e63cc');
    grad.addColorStop(0.5, '#3b78e7');
    grad.addColorStop(1, '#244fa3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    // Delicate white cirrus storm streaks
    for (let i = 0; i < 28; i++) {
      const sx = Math.random() * s;
      const sy = Math.random() * s;
      const sw = 50 + Math.random() * 120;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sw, sy + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }

    // Small dark storm spot
    ctx.fillStyle = 'rgba(15, 35, 95, 0.6)';
    ctx.beginPath();
    ctx.ellipse(s * 0.45, s * 0.58, 22, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----------------- ASTEROID TEXTURE -----------------
export function createAsteroidTexture(): THREE.CanvasTexture {
  return createProceduralTexture(128, (ctx, s) => {
    ctx.fillStyle = '#686560';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30,30,30,0.3)' : 'rgba(180,180,180,0.2)';
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
