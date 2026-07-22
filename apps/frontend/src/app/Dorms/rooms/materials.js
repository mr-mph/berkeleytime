// Shared materials. createMaterials(THREE, {procedural}) -> dict of materials.
// procedural=false (node smoke tests) skips all canvas texture work.
import { COLORS } from './spec.js';

const hasDOM = typeof document !== 'undefined';

function canvasTex(THREE, size, draw, { repeat = [1, 1], aniso = 8 } = {}) {
  const c = document.createElement('canvas');
  c.width = size[0]; c.height = size[1];
  draw(c.getContext('2d'), size[0], size[1]);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hex(n) { return '#' + n.toString(16).padStart(6, '0'); }

// deterministic PRNG so renders are reproducible
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function noiseOverlay(ctx, w, h, n, alpha, rand) {
  for (let i = 0; i < n; i++) {
    const g = Math.floor(rand() * 255);
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

export function createMaterials(THREE, { procedural = true } = {}) {
  const P = procedural && hasDOM;
  const M = {};
  const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, ...opts });

  // ---- floor: light-oak LVP planks --------------------------------------
  let floorMap = null;
  if (P) {
    floorMap = canvasTex(THREE, [1024, 1024], (ctx, w, h) => {
      const rand = rng(7);
      const plankH = h / 8; // 8 plank rows per tile
      for (let r = 0; r < 8; r++) {
        let x = -rand() * 300;
        while (x < w) {
          const len = 240 + rand() * 300;
          const base = 196 + rand() * 34;          // light oak value
          const warm = 12 + rand() * 16;
          ctx.fillStyle = `rgb(${base},${base - warm}, ${base - warm * 2.6})`;
          ctx.fillRect(x, r * plankH, len, plankH);
          // grain streaks
          for (let g = 0; g < 26; g++) {
            const gy = r * plankH + rand() * plankH;
            ctx.strokeStyle = `rgba(120,90,55,${0.05 + rand() * 0.09})`;
            ctx.lineWidth = 0.6 + rand() * 1.2;
            ctx.beginPath();
            ctx.moveTo(x + rand() * 30, gy);
            ctx.bezierCurveTo(x + len * 0.3, gy + rand() * 4 - 2, x + len * 0.6, gy + rand() * 4 - 2, x + len, gy + rand() * 3 - 1.5);
            ctx.stroke();
          }
          // end seam
          ctx.fillStyle = 'rgba(70,50,30,0.5)';
          ctx.fillRect(x + len - 1, r * plankH, 1.6, plankH);
          x += len;
        }
        // long seam
        ctx.fillStyle = 'rgba(70,50,30,0.45)';
        ctx.fillRect(0, r * plankH, w, 1.4);
      }
      noiseOverlay(ctx, w, h, 2600, 0.03, rng(11));
    }, { repeat: [2.4, 1.28] }); // ~0.18m plank width over 5.6x2.95 floor
  }
  M.floor = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.floorLight, map: floorMap, roughness: 0.55, metalness: 0.0,
  });

  // ---- painted wall (subtle eggshell variation) --------------------------
  let wallMap = null;
  if (P) {
    wallMap = canvasTex(THREE, [512, 512], (ctx, w, h) => {
      ctx.fillStyle = hex(COLORS.wall); ctx.fillRect(0, 0, w, h);
      noiseOverlay(ctx, w, h, 1400, 0.02, rng(23));
    }, { repeat: [3, 3] });
  }
  M.wall = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.wall, map: wallMap, roughness: 0.93,
  });

  // ---- board-formed concrete (ceiling / column) ---------------------------
  let concMap = null;
  if (P) {
    concMap = canvasTex(THREE, [1024, 1024], (ctx, w, h) => {
      const rand = rng(41);
      ctx.fillStyle = hex(COLORS.concrete); ctx.fillRect(0, 0, w, h);
      // mottling (cool neutral grays)
      for (let i = 0; i < 220; i++) {
        const g = 158 + rand() * 42;
        ctx.fillStyle = `rgba(${g - 2},${g - 1},${g + 2},${0.03 + rand() * 0.05})`;
        const rx = rand() * w, ry = rand() * h, rr = 16 + rand() * 80;
        ctx.beginPath(); ctx.ellipse(rx, ry, rr, rr * (0.4 + rand() * 0.6), rand() * 3, 0, 7); ctx.fill();
      }
      // faint form-board seams
      for (let i = 1; i < 5; i++) {
        ctx.strokeStyle = 'rgba(96,96,98,0.14)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, i * h / 5 + rand() * 8); ctx.lineTo(w, i * h / 5 + rand() * 8); ctx.stroke();
      }
      // form-tie circles
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(104,104,106,0.3)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(80 + rand() * (w - 160), 80 + rand() * (h - 160), 8, 0, 7); ctx.stroke();
      }
      noiseOverlay(ctx, w, h, 3200, 0.035, rng(43));
    }, { repeat: [2, 1] });
  }
  M.concrete = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.concrete, map: concMap, roughness: 0.96,
  });

  // ---- driftwood laminate (desks, bed bases, headboards) ------------------
  let lamMap = null;
  if (P) {
    lamMap = canvasTex(THREE, [512, 512], (ctx, w, h) => {
      const rand = rng(67);
      ctx.fillStyle = hex(COLORS.laminate); ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const y = rand() * h;
        const light = rand() > 0.5;
        ctx.strokeStyle = light ? `rgba(172,164,152,${0.10 + rand() * 0.16})`
                                : `rgba(70,63,55,${0.08 + rand() * 0.15})`;
        ctx.lineWidth = 1 + rand() * 3.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + rand() * 8 - 4, w * 0.7, y + rand() * 8 - 4, w, y + rand() * 6 - 3);
        ctx.stroke();
      }
      // cathedral grain hints
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(80,66,54,0.18)'; ctx.lineWidth = 1.4;
        const cy = rand() * h, cx = rand() * w;
        for (let k = 1; k < 5; k++) {
          ctx.beginPath(); ctx.ellipse(cx, cy, 30 * k, 7 * k, 0, 0, 7); ctx.stroke();
        }
      }
      noiseOverlay(ctx, w, h, 900, 0.025, rng(69));
    }, { repeat: [1.6, 1.6] });
  }
  M.laminate = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.laminate, map: lamMap, roughness: 0.62,
  });
  M.laminateDark = new THREE.MeshStandardMaterial({
    color: COLORS.laminateDark, map: lamMap, roughness: 0.62,
  });

  // ---- solids -------------------------------------------------------------
  M.trim       = std(COLORS.trim,      { roughness: 0.45 });
  M.stub       = M.wall;
  M.doorLeaf   = std(COLORS.doorLeaf,  { roughness: 0.5, metalness: 0.08 });
  M.metalDark  = std(COLORS.metalDark, { roughness: 0.45, metalness: 0.75 });
  M.chrome     = std(COLORS.chrome,    { roughness: 0.16, metalness: 1.0 });
  M.brushed    = std(COLORS.brushed,   { roughness: 0.38, metalness: 0.9 });
  M.bronze     = std(COLORS.bronze,    { roughness: 0.5, metalness: 0.6 });
  M.mattress   = std(COLORS.mattress,  { roughness: 0.42, metalness: 0.0 });
  M.duvet      = std(COLORS.duvet,     { roughness: 0.95 });
  M.blanket    = std(COLORS.blanket,   { roughness: 0.95 });
  M.pillow     = std(COLORS.pillow,    { roughness: 0.95 });
  M.chairPad   = std(COLORS.chairWhite,{ roughness: 0.55 });
  M.fridge     = std(COLORS.fridge,    { roughness: 0.35, metalness: 0.25 });
  M.blackGloss = std(0x111113,         { roughness: 0.18, metalness: 0.3 });
  M.shade      = std(COLORS.shade,     { roughness: 0.9, side: THREE.DoubleSide });
  M.plaque     = std(COLORS.plaque,    { roughness: 0.5 });
  M.towelA     = std(COLORS.towelA,    { roughness: 1.0, side: THREE.DoubleSide });
  M.towelB     = std(COLORS.towelB,    { roughness: 1.0, side: THREE.DoubleSide });
  M.whitePlastic = std(0xf4f4f1,       { roughness: 0.6 });
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.92, transparent: true, opacity: 1.0,
    roughness: 0.04, metalness: 0, ior: 1.5, thickness: 0.01, depthWrite: false,
  });

  return M;
}
