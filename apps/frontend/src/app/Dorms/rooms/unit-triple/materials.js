// Unit triple materials. createMaterials(THREE, {procedural}) -> dict.
// procedural=false (node smoke tests) skips all canvas texture work.
// Key superset includes everything the reused Blackwell microchill.js expects
// (fridge, blackGloss, chrome, brushed, whitePlastic, glass).
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

  // ---- gray-green loop carpet --------------------------------------------
  let carpetMap = null;
  if (P) {
    carpetMap = canvasTex(THREE, [512, 512], (ctx, w, h) => {
      const rand = rng(101);
      ctx.fillStyle = hex(COLORS.carpet); ctx.fillRect(0, 0, w, h);
      // loop-pile stipple
      for (let i = 0; i < 26000; i++) {
        const v = rand();
        const base = v < 0.5 ? COLORS.carpetDark : COLORS.carpet;
        const r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
        const j = Math.floor((rand() - 0.5) * 26);
        ctx.fillStyle = `rgba(${r + j},${g + j},${b + j},${0.5 + rand() * 0.5})`;
        ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
      }
      // faint tile seams every 128px (~0.5 m)
      ctx.strokeStyle = 'rgba(30,34,30,0.10)'; ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        ctx.beginPath(); ctx.moveTo(k * 128, 0); ctx.lineTo(k * 128, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k * 128); ctx.lineTo(w, k * 128); ctx.stroke();
      }
    }, { repeat: [4.19, 4.01] }); // 1 tile-tex ≈ 1 m
  }
  M.carpet = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.carpet, map: carpetMap, roughness: 0.98,
  });

  // ---- beige linoleum entry patch ----------------------------------------
  let linoMap = null;
  if (P) {
    linoMap = canvasTex(THREE, [256, 256], (ctx, w, h) => {
      ctx.fillStyle = hex(COLORS.lino); ctx.fillRect(0, 0, w, h);
      noiseOverlay(ctx, w, h, 2400, 0.05, rng(131));
      const rand = rng(137);
      for (let i = 0; i < 260; i++) { // vinyl chip flecks
        ctx.fillStyle = `rgba(${150 + rand() * 60},${140 + rand() * 50},${115 + rand() * 40},0.5)`;
        ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
      }
    }, { repeat: [1.4, 1.4] });
  }
  M.lino = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.lino, map: linoMap, roughness: 0.55,
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

  // ---- cream-painted concrete (slab, ribs, header beam) ------------------
  let ceilMap = null;
  if (P) {
    ceilMap = canvasTex(THREE, [512, 512], (ctx, w, h) => {
      const rand = rng(211);
      ctx.fillStyle = hex(COLORS.ceiling); ctx.fillRect(0, 0, w, h);
      // soft mottling + roller texture
      for (let i = 0; i < 160; i++) {
        const g = 226 + rand() * 22;
        ctx.fillStyle = `rgba(${g},${g - 3},${g - 10},${0.04 + rand() * 0.05})`;
        const rx = rand() * w, ry = rand() * h, rr = 12 + rand() * 60;
        ctx.beginPath(); ctx.ellipse(rx, ry, rr, rr * (0.35 + rand() * 0.6), rand() * 3, 0, 7); ctx.fill();
      }
      // hairline cracks (photos show a few)
      ctx.strokeStyle = 'rgba(140,132,118,0.22)'; ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        let x = rand() * w, y = rand() * h;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) { x += (rand() - 0.4) * 60; y += (rand() - 0.5) * 26; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      noiseOverlay(ctx, w, h, 1800, 0.03, rng(43));
    }, { repeat: [2, 2] });
  }
  M.ceiling = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.ceiling, map: ceilMap, roughness: 0.95,
  });

  // ---- honey maple (beds, desks, dressers, ladder, door) -----------------
  let woodMap = null;
  if (P) {
    woodMap = canvasTex(THREE, [512, 512], (ctx, w, h) => {
      const rand = rng(307);
      ctx.fillStyle = hex(COLORS.wood); ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 110; i++) {
        const y = rand() * h;
        const light = rand() > 0.45;
        ctx.strokeStyle = light ? `rgba(226,190,140,${0.10 + rand() * 0.14})`
                                : `rgba(122,84,44,${0.08 + rand() * 0.14})`;
        ctx.lineWidth = 0.8 + rand() * 2.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + rand() * 7 - 3.5, w * 0.7, y + rand() * 7 - 3.5, w, y + rand() * 5 - 2.5);
        ctx.stroke();
      }
      // cathedral grain
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = 'rgba(130,92,48,0.16)'; ctx.lineWidth = 1.2;
        const cy = rand() * h, cx = rand() * w;
        for (let k = 1; k < 5; k++) {
          ctx.beginPath(); ctx.ellipse(cx, cy, 34 * k, 8 * k, 0, 0, 7); ctx.stroke();
        }
      }
      noiseOverlay(ctx, w, h, 700, 0.02, rng(311));
    }, { repeat: [1.4, 1.4] });
  }
  M.wood = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.wood, map: woodMap, roughness: 0.55,
  });
  M.woodDark = new THREE.MeshStandardMaterial({
    color: COLORS.woodDark, map: woodMap, roughness: 0.6,
  });
  M.doorLeaf = new THREE.MeshStandardMaterial({
    color: P ? 0xb98e5f : COLORS.doorLeaf, map: woodMap, roughness: 0.5,
  });

  // ---- curtains (woven, slightly translucent) ----------------------------
  let curtainMap = null;
  if (P) {
    curtainMap = canvasTex(THREE, [256, 256], (ctx, w, h) => {
      ctx.fillStyle = hex(COLORS.curtain); ctx.fillRect(0, 0, w, h);
      const rand = rng(401);
      for (let x = 0; x < w; x += 3) {          // vertical weave
        ctx.fillStyle = `rgba(90,72,45,${0.04 + rand() * 0.05})`;
        ctx.fillRect(x, 0, 1, h);
      }
      for (let y = 0; y < h; y += 3) {          // horizontal weave
        ctx.fillStyle = `rgba(255,244,220,${0.03 + rand() * 0.04})`;
        ctx.fillRect(0, y, w, 1);
      }
    }, { repeat: [3, 1.6] });
  }
  M.curtain = new THREE.MeshStandardMaterial({
    color: P ? 0xffffff : COLORS.curtain, map: curtainMap,
    roughness: 0.95, side: THREE.DoubleSide,
  });

  // ---- solids -------------------------------------------------------------
  M.trim       = std(COLORS.trim,       { roughness: 0.45 });
  M.cove       = std(COLORS.cove,       { roughness: 0.7 });
  M.partition  = std(COLORS.partition,  { roughness: 0.55 });
  M.metalDark  = std(COLORS.metalDark,  { roughness: 0.45, metalness: 0.75 });
  M.chrome     = std(COLORS.chrome,     { roughness: 0.16, metalness: 1.0 });
  M.brushed    = std(COLORS.brushed,    { roughness: 0.38, metalness: 0.9 });
  M.alu        = std(COLORS.alu,        { roughness: 0.45, metalness: 0.7 });
  M.mattress   = std(COLORS.mattress,   { roughness: 0.42, metalness: 0.0 });
  M.sheet      = std(COLORS.sheet,      { roughness: 0.95 });
  M.duvet      = std(COLORS.duvet,      { roughness: 0.95 });
  M.blanket    = std(COLORS.blanket,    { roughness: 0.95 });
  M.pillow     = std(COLORS.pillow,     { roughness: 0.95 });
  M.chairBlack = std(COLORS.chairBlack, { roughness: 0.7 });
  M.chairBase  = std(COLORS.chairBase,  { roughness: 0.5, metalness: 0.4 });
  M.fridge     = std(COLORS.fridge,     { roughness: 0.35, metalness: 0.25 });
  M.blackGloss = std(0x111113,          { roughness: 0.18, metalness: 0.3 });
  M.cork       = std(COLORS.cork,       { roughness: 0.95 });
  M.radiator   = std(COLORS.radiator,   { roughness: 0.6 });
  M.brace      = std(COLORS.brace,      { roughness: 0.55, metalness: 0.35 });
  M.neighbor   = std(COLORS.neighbor,   { roughness: 0.95 });
  M.whitePlastic = std(0xf4f4f1,        { roughness: 0.6 });
  M.lightLens  = new THREE.MeshStandardMaterial({
    color: COLORS.lightLens, roughness: 0.4, emissive: 0x000000,
  });
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.92, transparent: true, opacity: 1.0,
    roughness: 0.04, metalness: 0, ior: 1.5, thickness: 0.01, depthWrite: false,
  });

  return M;
}
