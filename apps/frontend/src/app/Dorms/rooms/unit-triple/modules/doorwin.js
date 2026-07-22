// ============================================================================
// doorwin.js (unit triple) — entry door (white hollow-metal frame + casings,
// wood-veneer leaf, lever + key cylinder + peephole, 3 hinges, overhead door
// closer with articulated arms) and the window wall: dark anodized aluminum
// frame with 2 mullions + transom (slider sashes in the lower row), white
// stool + apron, wheat drape panels on a white track, plus the exterior
// backdrop — sky, tree line, neighboring precast tower and THE white steel
// seismic brace crossing the view (refs 9.30.46 / 9.31.10 / marketing photo).
// Contract: buildDoor(ctx), buildWindow(ctx); ctx = { THREE, mats, spec, H }.
// api: door.setOpen(t) — window.setShade(t), window.setNight(t).
// No imports — everything comes through ctx. Deterministic (seeded LCG only).
// ============================================================================

const hasDOM = typeof document !== 'undefined';

// deterministic PRNG (matches materials.js style) so renders are reproducible
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTex(THREE, w, h, draw) {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const clamp01 = (t) => Math.min(1, Math.max(0, t));

// ============================================================================
// DOOR — opening at the entry wall (inner face x=0), z DOOR.z0..hingeZ.
// White frame/casings; honey wood-veneer leaf on a hinge group pivoted at
// (0, 0, DOOR.hingeZ) swinging INTO the room (+x, toward the closet wall).
// Institutional overhead door closer on the room side: body on the leaf,
// shoe on the head casing, two-bar linkage solved per open fraction.
// ============================================================================
export function buildDoor(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { DOOR, ROOM } = spec;
  const g = new THREE.Group(); g.name = 'door';

  const trim = mats.trim, br = mats.brushed;
  const T = ROOM.wallT;                       // 0.15 wall depth
  const z0 = DOOR.z0, zh = DOOR.hingeZ, h = DOOR.h;
  const cw = DOOR.casingW, ct = DOOR.casingT;
  const zc = (z0 + zh) / 2;

  // ---- hollow-metal frame: jamb/head liners inside the opening -----------
  const lin = 0.014; // liner protrusion into the opening on each side
  g.add(H.box(THREE, trim, T, h, lin, { x: -T / 2, y: h / 2, z: z0 + lin / 2 }));
  g.add(H.box(THREE, trim, T, h, lin, { x: -T / 2, y: h / 2, z: zh - lin / 2 }));
  g.add(H.box(THREE, trim, T, lin, (zh - z0) - 2 * lin, { x: -T / 2, y: h - lin / 2, z: zc }));

  // ---- door stops (leaf closes against these from the room side) ---------
  const stopW = 0.016, stopP = 0.012, stopX = -0.058;
  g.add(H.box(THREE, trim, stopW, h - lin, stopP, { x: stopX, y: (h - lin) / 2, z: z0 + lin + stopP / 2 }));
  g.add(H.box(THREE, trim, stopW, h - lin, stopP, { x: stopX, y: (h - lin) / 2, z: zh - lin - stopP / 2 }));
  g.add(H.box(THREE, trim, stopW, stopP, (zh - z0) - 2 * (lin + stopP), { x: stopX, y: h - lin - stopP / 2, z: zc }));

  // ---- flat casings, room face and hallway face ---------------------------
  const casing = (xc) => {
    g.add(H.box(THREE, trim, ct, h, cw, { x: xc, y: h / 2, z: z0 - cw / 2 }));
    g.add(H.box(THREE, trim, ct, h, cw, { x: xc, y: h / 2, z: zh + cw / 2 }));
    g.add(H.box(THREE, trim, ct, cw, (zh - z0) + 2 * cw, { x: xc, y: h + cw / 2, z: zc }));
  };
  casing(ct / 2);        // room face (x 0..0.018)
  casing(-T - ct / 2);   // hallway face

  // ---- brushed threshold strip under the leaf -----------------------------
  g.add(H.box(THREE, br, T - 0.01, 0.005, (zh - z0) - 0.004, { x: -T / 2, y: 0.0025, z: zc, cast: false }));

  // ---- 3 hinge knuckles on the frame (leaf pivots on this axis) ----------
  for (const y of [0.25, 1.015, 1.78]) {
    g.add(H.cyl(THREE, br, 0.008, 0.008, 0.095, { x: -0.002, y, z: zh - 0.008, seg: 12 }));
  }

  // ---- leaf + hardware, all inside the hinge group -------------------------
  const hinge = new THREE.Group();
  hinge.position.set(0, 0, zh);            // pivot at (x=0, z=hingeZ) per spec
  g.add(hinge);

  const gap = 0.004;
  const leafW = (zh - z0) - 2 * (lin + gap);   // 0.874 — 4mm reveal each side
  const leafH = h - lin - 0.014;               // 8mm floor gap, ~6mm head gap
  const leafT = DOOR.leafT;
  const roomFace = -0.005, hallFace = -0.005 - leafT;
  const leafZc = -(lin + gap) - leafW / 2;     // leaf spans local z -0.018..-0.892
  hinge.add(H.box(THREE, mats.doorLeaf, leafT, leafH, leafW, {
    x: roomFace - leafT / 2, y: 0.008 + leafH / 2, z: leafZc, r: 0.003,
  }));

  // lever handles (both faces) near the latch (z0) edge, 70mm backset
  const zl = -(lin + gap) - leafW + 0.07;
  const lever = (face, dir) => {
    hinge.add(H.cyl(THREE, br, 0.027, 0.027, 0.010, { x: face + dir * 0.005, y: DOOR.leverY, z: zl, rz: Math.PI / 2, seg: 20 }));
    hinge.add(H.cyl(THREE, br, 0.010, 0.010, 0.030, { x: face + dir * 0.025, y: DOOR.leverY, z: zl, rz: Math.PI / 2, seg: 14 }));
    hinge.add(H.box(THREE, br, 0.016, 0.017, 0.125, { x: face + dir * 0.043, y: DOOR.leverY, z: zl + 0.052, r: 0.006 }));
  };
  lever(roomFace, +1);
  lever(hallFace, -1);

  // key cylinder below the lever: keyed rose on the hallway face (keyway
  // slot in a dark plug), rose + privacy thumbturn bar on the room face
  const yKey = DOOR.leverY - 0.078;
  hinge.add(H.cyl(THREE, br, 0.016, 0.016, 0.009, { x: hallFace - 0.0045, y: yKey, z: zl, rz: Math.PI / 2, seg: 16 }));
  hinge.add(H.cyl(THREE, mats.metalDark, 0.0065, 0.0065, 0.004, { x: hallFace - 0.010, y: yKey, z: zl, rz: Math.PI / 2, seg: 12 }));
  hinge.add(H.box(THREE, mats.metalDark, 0.004, 0.013, 0.0035, { x: hallFace - 0.0115, y: yKey, z: zl }));
  hinge.add(H.cyl(THREE, br, 0.014, 0.014, 0.008, { x: roomFace + 0.004, y: yKey, z: zl, rz: Math.PI / 2, seg: 16 }));
  hinge.add(H.box(THREE, br, 0.010, 0.030, 0.008, { x: roomFace + 0.009, y: yKey, z: zl, r: 0.003 }));

  // peephole (ring both faces + dark lens on the hallway side), leaf center
  hinge.add(H.cyl(THREE, br, 0.009, 0.009, 0.006, { x: roomFace + 0.002, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 14 }));
  hinge.add(H.cyl(THREE, br, 0.0075, 0.0075, 0.006, { x: hallFace - 0.002, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 14 }));
  hinge.add(H.cyl(THREE, mats.blackGloss, 0.005, 0.005, 0.002, { x: hallFace - 0.006, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 10 }));

  // hinge leaf plates (visible in the reveal when the door stands open)
  for (const y of [0.25, 1.015, 1.78]) {
    hinge.add(H.box(THREE, br, 0.002, 0.10, 0.032, { x: roomFace + 0.001, y, z: -0.034 }));
  }

  // ---- overhead door closer (room side) -----------------------------------
  // Dark body on the leaf near the hinge edge + shoe bracket on the head
  // casing; main arm and forearm form the institutional V above the leaf and
  // are re-solved as a rigid two-bar linkage every setOpen call.
  const cm = mats.metalDark;
  const SPX = 0.045, SPZ = -0.22;            // spindle, hinge-local plan coords
  const FX = 0.075, FZ = zh - 0.39;          // fixed shoe pivot, room coords
  const ARM_A = 0.22, ARM_B = 0.34;          // main arm / forearm lengths
  // body (on the leaf, rides the hinge group) + end cap + spindle
  hinge.add(H.box(THREE, cm, 0.058, 0.062, 0.270, { x: roomFace + 0.034, y: 1.925, z: SPZ - 0.015, r: 0.004 }));
  hinge.add(H.box(THREE, mats.blackGloss, 0.046, 0.050, 0.014, { x: roomFace + 0.034, y: 1.925, z: SPZ - 0.155 }));
  hinge.add(H.cyl(THREE, cm, 0.009, 0.009, 0.130, { x: SPX, y: 2.015, z: SPZ, seg: 12 }));
  // shoe: plate on the head casing face + drop pivot stub
  g.add(H.box(THREE, cm, 0.016, 0.075, 0.095, { x: 0.026, y: 2.062, z: FZ, r: 0.003 }));
  g.add(H.cyl(THREE, cm, 0.008, 0.008, 0.050, { x: FX, y: 2.052, z: FZ, seg: 10 }));
  // arms + elbow pin (positions set by setOpen)
  const armA = H.box(THREE, cm, ARM_A, 0.016, 0.020, { r: 0.004 });
  const armB = H.box(THREE, cm, ARM_B, 0.014, 0.018, { r: 0.004 });
  const elbow = H.cyl(THREE, cm, 0.0075, 0.0075, 0.032, { seg: 10 });
  const Y_A = 2.078, Y_B = 2.058;
  g.add(armA, armB, elbow);

  const placeArm = (m, y, x0, za, x1, zb) => {
    m.position.set((x0 + x1) / 2, y, (za + zb) / 2);
    m.rotation.y = Math.atan2(-(zb - za), x1 - x0);
  };

  // ---- api -----------------------------------------------------------------
  const maxRad = THREE.MathUtils.degToRad(DOOR.maxOpenDeg);
  const setOpen = (t) => {
    const th = -maxRad * clamp01(t);
    hinge.rotation.y = th;
    // spindle in door-group coords (rotate hinge-local point, add pivot)
    const c = Math.cos(th), s = Math.sin(th);
    const sx = SPX * c + SPZ * s, sz = -SPX * s + SPZ * c + zh;
    // two-circle intersection: elbow so |E-S|=ARM_A and |E-F|=ARM_B
    const dx = FX - sx, dz = FZ - sz;
    const d = Math.hypot(dx, dz) || 1e-6;
    const ux = dx / d, uz = dz / d;
    const h1 = Math.min(ARM_A - 1e-4, (ARM_A * ARM_A - ARM_B * ARM_B + d * d) / (2 * d));
    const perp = Math.sqrt(Math.max(1e-8, ARM_A * ARM_A - h1 * h1));
    const ex = sx + ux * h1 - uz * perp;       // V folds out into the room (+x)
    const ez = sz + uz * h1 + ux * perp;
    placeArm(armA, Y_A, sx, sz, ex, ez);
    placeArm(armB, Y_B, ex, ez, FX, FZ);
    elbow.position.set(ex, (Y_A + Y_B) / 2, ez);
  };
  g.userData.api = { setOpen };
  setOpen(0);
  return g;
}

// ============================================================================
// WINDOW — opening on the window wall (inner face x=ROOM.L), z 0.20..3.81,
// y 0.78..2.42. Dark anodized alu frame, 2 mullions + transom; the lower row
// reads as horizontal sliders (interior sash frames on two track depths +
// latch on the middle pane). White stool + apron, cream head trim, curtain
// panels per CURTAIN, and the exterior backdrop with THE seismic brace.
// api: setShade(t) 0=bunched at both ends -> 1=drawn to center; setNight(t).
// ============================================================================
export function buildWindow(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { WINDOW, CURTAIN, BRACE, ROOM } = spec;
  const g = new THREE.Group(); g.name = 'window';

  const xin = ROOM.L;
  const xout = ROOM.L + ROOM.wallT;
  const zc = WINDOW.z0 + WINDOW.w / 2; // 2.02
  const yc = WINDOW.y0 + WINDOW.h / 2; // 1.60
  const yTop = WINDOW.y0 + WINDOW.h;   // 2.42 (meets header beam soffit)

  // ---- dark anodized outer frame -------------------------------------------
  const fr = H.frame(THREE, mats.alu, WINDOW.w, WINDOW.h, WINDOW.frameT, WINDOW.frameD);
  fr.rotation.y = -Math.PI / 2;
  fr.position.set(xout - WINDOW.frameD / 2, yc, zc);   // frame x 5.09..5.20
  g.add(fr);

  // ---- 2 vertical mullions + transom bar (3 segments between mullions) -----
  const mulD = 0.09, mulW = 0.06, trnH = 0.07;
  const xm = xout - WINDOW.frameD / 2;                 // member centerline x
  const zi0 = WINDOW.z0 + WINDOW.frameT, zi1 = WINDOW.z0 + WINDOW.w - WINDOW.frameT;
  const mz = WINDOW.mullions.map(m => WINDOW.z0 + m);  // z 1.52 / 2.52
  const innerH = WINDOW.h - 2 * WINDOW.frameT;
  for (const z of mz) g.add(H.box(THREE, mats.alu, mulD, innerH, mulW, { x: xm, y: yc, z }));
  const yTr = WINDOW.y0 + WINDOW.transomY;             // 1.98
  const cells = [
    [zi0, mz[0] - mulW / 2],
    [mz[0] + mulW / 2, mz[1] - mulW / 2],
    [mz[1] + mulW / 2, zi1],
  ];
  for (const [za, zb] of cells) {
    g.add(H.box(THREE, mats.alu, mulD, trnH, zb - za, { x: xm, y: yTr, z: (za + zb) / 2 }));
  }

  // ---- lower row: slider sashes on two track depths ------------------------
  const yl0 = WINDOW.y0 + WINDOW.frameT;               // 0.83
  const yl1 = yTr - trnH / 2;                          // 1.945
  const rowH = yl1 - yl0;
  const sashH = rowH - 0.020, sashY = yl0 + 0.014 + sashH / 2;
  const xOutSash = xin + 0.068, xInSash = xin + 0.044; // outer / interior track
  const sashBar = 0.030, sashD = 0.020;
  // slim slider tracks top + bottom across the full opening width
  g.add(H.box(THREE, mats.alu, 0.018, 0.013, zi1 - zi0, { x: xin + 0.046, y: yl0 + 0.007, z: zc, cast: false }));
  g.add(H.box(THREE, mats.alu, 0.018, 0.011, zi1 - zi0, { x: xin + 0.046, y: yl1 - 0.006, z: zc, cast: false }));
  const paneMat = mats.glass;
  const addPane = (x, y, z, w, hh) => {
    const p = H.box(THREE, paneMat, 0.005, hh, w, { x, y, z });
    H.noShadow(p);
    g.add(p);
  };
  for (let i = 0; i < cells.length; i++) {
    const [za, zb] = cells[i];
    const cw = zb - za, half = cw / 2 + 0.012;         // 12mm meeting overlap
    // fixed half on the outer track, sliding half on the interior track
    const mkSash = (x, zCtr) => {
      const sf = H.frame(THREE, mats.alu, half, sashH, sashBar, sashD);
      sf.rotation.y = -Math.PI / 2;
      sf.position.set(x, sashY, zCtr);
      g.add(sf);
      addPane(x, sashY, zCtr, half - 0.036, sashH - 0.05);
    };
    mkSash(xOutSash, za + half / 2);
    mkSash(xInSash, zb - half / 2);
  }
  // sweep latch on the middle lower pane's meeting stile + pull bars on the
  // outer cells' interior sashes (what a hand reaches for from 0.5 m)
  const zMid = (mz[0] + mz[1]) / 2;                    // 2.02
  g.add(H.box(THREE, mats.brushed, 0.012, 0.055, 0.022, { x: xInSash - 0.014, y: sashY - 0.05, z: zMid, r: 0.003 }));
  g.add(H.box(THREE, mats.brushed, 0.010, 0.020, 0.046, { x: xInSash - 0.017, y: sashY - 0.032, z: zMid + 0.012, r: 0.003 }));
  for (const [za, zb] of [cells[0], cells[2]]) {
    g.add(H.box(THREE, mats.brushed, 0.010, 0.105, 0.014, { x: xInSash - 0.013, y: sashY, z: zb - (zb - za) / 2 - 0.024, r: 0.003 }));
  }

  // ---- upper fixed transom row: one continuous pane ------------------------
  const yu0 = yTr + trnH / 2, yu1 = WINDOW.y0 + WINDOW.h - WINDOW.frameT;
  addPane(xm + 0.012, (yu0 + yu1) / 2, zc, zi1 - zi0, yu1 - yu0);

  // ---- white reveal liners between room face and frame ---------------------
  const lin = 0.012, revD = 0.045;
  g.add(H.box(THREE, mats.trim, revD, WINDOW.h, lin, { x: xin + revD / 2, y: yc, z: WINDOW.z0 + lin / 2 }));
  g.add(H.box(THREE, mats.trim, revD, WINDOW.h, lin, { x: xin + revD / 2, y: yc, z: WINDOW.z0 + WINDOW.w - lin / 2 }));
  g.add(H.box(THREE, mats.trim, revD, lin, WINDOW.w, { x: xin + revD / 2, y: yTop - lin / 2, z: zc }));

  // ---- stool sill (rounded nose + horns), apron, side casings --------------
  g.add(H.box(THREE, mats.trim, WINDOW.sillD, WINDOW.sillT, WINDOW.w + 0.19, {
    x: xin + WINDOW.sillD / 2 - 0.05, y: WINDOW.y0 - WINDOW.sillT / 2, z: zc, r: 0.005,
  }));
  g.add(H.box(THREE, mats.trim, 0.018, 0.095, WINDOW.w + 0.09, { x: xin - 0.009, y: WINDOW.y0 - WINDOW.sillT - 0.0475, z: zc }));
  const casW = 0.075;
  g.add(H.box(THREE, mats.trim, 0.018, WINDOW.h, casW, { x: xin - 0.009, y: yc, z: WINDOW.z0 - casW / 2 }));
  g.add(H.box(THREE, mats.trim, 0.018, WINDOW.h, casW, { x: xin - 0.009, y: yc, z: WINDOW.z0 + WINDOW.w + casW / 2 }));

  // ---- cream head trim: board on the header-beam face over the opening -----
  // (beam soffit sits exactly at the window head, so the trim reads as the
  // junction cover between glazing head and the painted beam)
  const beamFace = xin - spec.CEIL.beamW;              // 4.77
  g.add(H.box(THREE, mats.trim, 0.020, 0.045, WINDOW.w + 0.19, { x: beamFace - 0.004, y: yTop + 0.0225, z: zc, r: 0.004 }));

  // ---- curtains: recessed track + 2 corrugated panels ----------------------
  // Wheat drapes (refs 9.29.45 / marketing): zigzag cross-section panels that
  // bunch at both ends of the track and meet at center when drawn. Keep the
  // whole assembly inside the window reveal so it cannot overlap either bed.
  const trackD = 0.06, trackH = 0.055;
  const xTrack = xin - trackD / 2 + 0.008;             // recessed into the jamb
  g.add(H.box(THREE, mats.trim, trackD, trackH, CURTAIN.z1 - CURTAIN.z0 + 0.06, {
    x: xTrack, y: CURTAIN.trackY, z: (CURTAIN.z0 + CURTAIN.z1) / 2, r: 0.004,
  }));
  // dark glide slot on the track underside
  g.add(H.box(THREE, mats.metalDark, 0.014, 0.004, CURTAIN.z1 - CURTAIN.z0 + 0.02, {
    x: xTrack, y: CURTAIN.trackY - trackH / 2 - 0.001, z: (CURTAIN.z0 + CURTAIN.z1) / 2, cast: false, receive: false,
  }));

  // corrugated panel geometry: unit width (local z 0..1), zigzag +-panelT in x
  const foldCols = CURTAIN.foldN * 2;
  const cPos = new Float32Array((foldCols + 1) * 2 * 3);
  const cUv = new Float32Array((foldCols + 1) * 2 * 2);
  const cIdx = [];
  for (let i = 0; i <= foldCols; i++) {
    const zz = i / foldCols;
    const xx = (i % 2 ? 1 : -1) * CURTAIN.panelT;      // fold depth 2*panelT total
    const o = i * 6, u = i * 4;
    cPos[o] = xx; cPos[o + 1] = 0; cPos[o + 2] = zz;
    cPos[o + 3] = xx; cPos[o + 4] = -CURTAIN.drop; cPos[o + 5] = zz;
    cUv[u] = i / foldCols; cUv[u + 1] = 1; cUv[u + 2] = i / foldCols; cUv[u + 3] = 0;
  }
  for (let i = 0; i < foldCols; i++) {
    const t0 = i * 2;
    cIdx.push(t0, t0 + 1, t0 + 2, t0 + 1, t0 + 3, t0 + 2);
  }
  const panelGeo = new THREE.BufferGeometry();
  panelGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  panelGeo.setAttribute('uv', new THREE.BufferAttribute(cUv, 2));
  panelGeo.setIndex(cIdx);
  panelGeo.computeVertexNormals();
  const xCurtain = xin - 0.022;                        // inside the window reveal
  const yHang = CURTAIN.trackY - 0.030;                // top tucked behind the track
  const panelA = new THREE.Mesh(panelGeo, mats.curtain);
  panelA.position.set(xCurtain, yHang, CURTAIN.z0);    // grows toward +z
  const panelB = new THREE.Mesh(panelGeo, mats.curtain);
  panelB.position.set(xCurtain, yHang, CURTAIN.z1);    // mirrored, grows toward -z
  H.noShadow(panelA); H.noShadow(panelB);
  g.add(panelA, panelB);

  const zMidTrack = (CURTAIN.z0 + CURTAIN.z1) / 2;
  const wBunch = 0.26;                                 // stacked-back width per panel
  const wDrawn = (zMidTrack - CURTAIN.z0) + 0.03;      // meet with a 3cm overlap
  const setShade = (t) => {
    const w = wBunch + clamp01(t) * (wDrawn - wBunch);
    panelA.scale.z = w;
    panelB.scale.z = -w;
  };

  // ==== WINDOW-BOUND EXTERIOR VIEW ==========================================
  // The complete scene is baked into a high-resolution view plane sized to
  // the glass opening. It cannot extend beyond the jambs in plan/orbit views.
  // This preserves the recognizable Unit 1 tower, trees, and seismic braces
  // without constructing a second loose architectural scene outside the room.
  const viewMap = canvasTex(THREE, 1024, 512, (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#8ebcdc');
    sky.addColorStop(0.58, '#c9dce7');
    sky.addColorStop(1, '#e9ece8');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);

    // soft cloud strata
    const rand = rng(97);
    for (let i = 0; i < 18; i++) {
      c.fillStyle = `rgba(255,255,255,${0.035 + rand() * 0.08})`;
      c.beginPath();
      c.ellipse(rand() * w, 40 + rand() * 185, 45 + rand() * 100,
        5 + rand() * 17, -0.08, 0, Math.PI * 2);
      c.fill();
    }

    // neighboring precast tower, cropped by the glazing like the real view
    c.fillStyle = '#cbc7bd';
    c.beginPath();
    c.moveTo(0, 72); c.lineTo(w * 0.40, 34);
    c.lineTo(w * 0.46, h); c.lineTo(0, h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(92,88,82,.22)'; c.lineWidth = 3;
    for (let x = -50; x < w * 0.48; x += 118) {
      c.beginPath(); c.moveTo(x, 62); c.lineTo(x + 42, h); c.stroke();
    }
    for (let y = 150; y < h; y += 92) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w * 0.45, y - 20); c.stroke();
    }

    // layered campus trees at the bottom of the view
    const treeColors = ['#657557', '#758568', '#87927a', '#536949'];
    for (let i = 0; i < 34; i++) {
      const x = w * 0.25 + rand() * w * 0.82;
      const y = h * (0.72 + rand() * 0.25);
      const r = 25 + rand() * 66;
      c.fillStyle = treeColors[i % treeColors.length];
      c.beginPath(); c.ellipse(x, y, r, r * (0.55 + rand() * 0.35),
        rand() * 0.4 - 0.2, 0, Math.PI * 2); c.fill();
    }

    // painted seismic steel: broad diagonal hero member + crossing secondary
    const brace = (x0, y0, x1, y1, width, color, edge) => {
      c.lineCap = 'square';
      c.strokeStyle = edge; c.lineWidth = width + 10;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = color; c.lineWidth = width;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    };
    brace(w * 0.12, h * 1.02, w * 0.67, -h * 0.10, 76, '#e5e7e7', '#9da3a5');
    brace(w * 0.54, -h * 0.08, w * 0.98, h * 1.06, 50, '#e7e9e9', '#a4a8aa');

    // bolted gusset where the members cross
    c.save();
    c.translate(w * 0.55, h * 0.36); c.rotate(-0.08);
    c.fillStyle = '#dadddd'; c.strokeStyle = '#92989b'; c.lineWidth = 6;
    c.fillRect(-67, -50, 134, 100); c.strokeRect(-67, -50, 134, 100);
    c.fillStyle = '#666c70';
    for (const [bx, by] of [[-40,-25],[0,-25],[40,-25],[-40,24],[0,24],[40,24]]) {
      c.beginPath(); c.arc(bx, by, 6, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // subtle interior-glass reflection and lower haze
    const haze = c.createLinearGradient(0, h * 0.55, 0, h);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(1, 'rgba(235,241,244,.28)');
    c.fillStyle = haze; c.fillRect(0, 0, w, h);
  });
  const viewMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: viewMap || null,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  if (!viewMap) viewMat.color.setHex(0xaec8d7);
  const windowView = new THREE.Mesh(
    new THREE.PlaneGeometry(WINDOW.w - 2 * WINDOW.frameT,
      WINDOW.h - 2 * WINDOW.frameT),
    viewMat,
  );
  windowView.name = 'window-integrated-view';
  windowView.rotation.y = -Math.PI / 2;
  windowView.position.set(xout + 0.012, yc, zc);
  H.noShadow(windowView);
  g.add(windowView);

  // Legacy free-standing exterior geometry is retained below only as source
  // detail for now; it is deliberately not attached to the window group.
  const back = new THREE.Group(); back.name = 'backdrop';

  // night registry: lerp material color day->night; standard materials also
  // get a self-illumination boost (sunlit look) that fades out at night
  const nightables = [];
  const reg = (mat, night, emis = 0) => {
    nightables.push({ mat, day: mat.color.clone(), night: new THREE.Color(night), emis });
    return mat;
  };

  const buildLegacyExterior = false;
  if (buildLegacyExterior) {
  // sky gradient plane (clouds seeded, deterministic)
  const skyMap = canvasTex(THREE, 256, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7db3de');
    gr.addColorStop(0.40, '#aecfe9');
    gr.addColorStop(0.72, '#d6e6f2');
    gr.addColorStop(1, '#eef4f8');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const rand = rng(97);
    for (let i = 0; i < 13; i++) {
      c.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.10})`;
      c.beginPath();
      c.ellipse(rand() * w, h * (0.12 + rand() * 0.40), 20 + rand() * 44, 4 + rand() * 9, 0, 0, 7);
      c.fill();
    }
  });
  const skyMat = skyMap
    ? new THREE.MeshBasicMaterial({ map: skyMap })
    : new THREE.MeshBasicMaterial({ color: 0x9ec7e8 });
  reg(skyMat, 0x18233b);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), skyMat);
  sky.rotation.y = -Math.PI / 2;                       // faces the room (-x)
  sky.position.set(xout + 6.7, 1.7, 1.8);
  back.add(sky);

  // plaza/ground far below (the triples sit a couple of floors up)
  const groundMat = reg(new THREE.MeshBasicMaterial({ color: 0x8a8d80 }), 0x0f1114);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 22), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(xout + 3.35, -5.0, 1.8);
  back.add(ground);

  // trees: soft desaturated olive canopies pushed well back — a mid row that
  // partially disappears behind the tower's right edge + a hazier far row
  // between the buildings. Deterministic blob tables, no random.
  const treeOlive   = reg(new THREE.MeshBasicMaterial({ color: 0x5e6749 }), 0x0d120d);
  const treeOliveLt = reg(new THREE.MeshBasicMaterial({ color: 0x6f785a }), 0x10160f);
  const treeFar     = reg(new THREE.MeshBasicMaterial({ color: 0x878e78 }), 0x161c15);
  const trunkMat    = reg(new THREE.MeshBasicMaterial({ color: 0x554633 }), 0x120e08);
  const blob = (mat, x, z, y, r, sy) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), mat);
    m.position.set(x, y, z); m.scale.y = sy;
    back.add(m);
  };
  const xTreeMid = xout + 3.75, xTreeFar = xout + 5.6;
  const mid = [ // [z, y, r, squash, lite?] — z 2.95 hides behind the tower edge
    [2.95, 1.45, 0.62, 0.85, 0], [3.75, 1.15, 0.55, 0.80, 1], [4.55, 1.60, 0.70, 0.90, 0],
  ];
  for (const [z, y, r, sy, lite] of mid) {
    blob(lite ? treeOliveLt : treeOlive, xTreeMid, z, y, r, sy);
    if (z > 3.2) back.add(H.cyl(THREE, trunkMat, 0.045, 0.065, y + 5.0, { x: xTreeMid, y: (y - 5.0) / 2, z, seg: 8, cast: false, receive: false }));
  }
  for (const [z, y, r, sy] of [[3.4, 1.9, 0.95, 0.90], [5.0, 1.7, 1.05, 0.88], [6.3, 2.05, 0.90, 0.90]]) {
    blob(treeFar, xTreeFar, z, y, r, sy);
  }

  // neighboring tower: broad beige precast facade filling much of the view
  // beyond the brace — ~1.5 m panel grid scored with slim joint strips,
  // parapet cap at the roofline with sky above
  reg(mats.neighbor, 0x2e2f2a, 0.50);
  const xTower = xout + 3.20;                          // face toward room at xTower-0.30
  const towerTop = 4.70, towerZc = -0.10, towerD = 6.6; // z -3.4..3.2
  back.add(H.box(THREE, mats.neighbor, 0.6, 10.7, towerD, { x: xTower, y: -0.65, z: towerZc }));
  const jointMat = reg(new THREE.MeshBasicMaterial({ color: 0xb4ac9d }), 0x1f201c);
  for (const z of [-2.65, -1.15, 0.35, 1.85]) {
    back.add(H.box(THREE, jointMat, 0.02, 10.7, 0.045, { x: xTower - 0.31, y: -0.65, z, cast: false, receive: false }));
  }
  for (let y = -4.0; y <= 3.6; y += 1.5) {
    back.add(H.box(THREE, jointMat, 0.02, 0.045, towerD, { x: xTower - 0.31, y, z: towerZc, cast: false, receive: false }));
  }
  back.add(H.box(THREE, jointMat, 0.72, 0.14, towerD + 0.12, { x: xTower, y: towerTop + 0.07, z: towerZc }));

  // THE BRACE — the hero of the view (refs 9.30.46 / marketing photo): one
  // MASSIVE clean white-painted flat steel plate rising at BRACE.angleDeg
  // across the whole opening at BRACE.standoff beyond the glass, with a
  // painted edge-shadow line along its underside and a row of bolt heads.
  // A thinner member of the same steel meets it OFF-CENTER HIGH at a bolted
  // gusset plate and drops away to the right — the visible half of the X.
  const heroMat = reg(new THREE.MeshStandardMaterial({ color: 0xe8ebec, roughness: 0.50, metalness: 0.05 }), 0x3a3f45, 0.34);
  const edgeMat = reg(new THREE.MeshStandardMaterial({ color: 0x9aa0a5, roughness: 0.60, metalness: 0.05 }), 0x272b30, 0.15);
  const xGlass = xin + 0.10;                           // ~ pane depth
  const xBrace = xGlass + BRACE.standoff;              // beyond the glass
  const tilt = THREE.MathUtils.degToRad(90 - BRACE.angleDeg); // from vertical
  const slope = Math.tan(THREE.MathUtils.degToRad(BRACE.angleDeg)) / 1; // dy/dz
  const dirY = Math.cos(tilt), dirZ = Math.sin(tilt);  // unit vector up the member
  // main member: passes lower-left -> upper-right through the whole opening
  back.add(H.box(THREE, heroMat, BRACE.t, 5.8, BRACE.w, { x: xBrace, y: 1.55, z: 1.50, rx: tilt, r: 0.004 }));
  // painted edge-shadow strip along the plate's lower long edge (room face)
  back.add(H.box(THREE, edgeMat, 0.012, 5.8, 0.045, {
    x: xBrace - BRACE.t / 2 - 0.004, y: 1.55 - dirZ * 0.205, z: 1.50 + dirY * 0.205, rx: tilt, cast: false, receive: false,
  }));
  // 6 bolt heads down the room face of the plate (visible from 0.5 m)
  for (const s of [-1.10, -0.66, -0.22, 0.22, 0.66, 1.10]) {
    back.add(H.cyl(THREE, mats.metalDark, 0.019, 0.019, 0.018, {
      x: xBrace - BRACE.t / 2 - 0.007, y: 1.55 + dirY * s, z: 1.50 + dirZ * s, rz: Math.PI / 2, seg: 10, cast: false, receive: false,
    }));
  }
  // second member: same white steel, thinner, opposite slope. Its top end
  // meets the main member at the joint (jy, jz) high on the right and it
  // drops toward +z out of the view past the jamb.
  const jy = 2.30, jz = 1.50 + (jy - 1.55) / slope;    // joint ON the main member
  back.add(H.box(THREE, heroMat, 0.07, 2.6, 0.30, {
    x: xBrace + 0.06, y: jy - dirY * 1.05, z: jz + dirZ * 1.05, rx: -tilt, r: 0.004,
  }));
  // bolted gusset plate at the joint: thick enough to wrap from just in
  // front of the main plate back through the thinner member (no floating)
  back.add(H.box(THREE, heroMat, 0.10, 0.56, 0.62, { x: xBrace - 0.020, y: jy, z: jz, r: 0.004 }));
  for (const [dy, dz] of [[0.16, -0.10], [-0.14, -0.16], [-0.02, 0.18]]) {
    back.add(H.cyl(THREE, mats.metalDark, 0.015, 0.015, 0.016, {
      x: xBrace - 0.076, y: jy + dy, z: jz + dz, rz: Math.PI / 2, seg: 10, cast: false, receive: false,
    }));
  }
  // slab-edge band + gusset where the main member meets it (above the head,
  // seen when looking up through the glass)
  const slabMat = reg(new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.9 }), 0x24262a, 0.30);
  back.add(H.box(THREE, slabMat, 0.75, 0.38, 6.8, { x: xBrace + 0.35, y: 3.55, z: 1.90 }));
  const zG1 = 1.50 + (3.36 - 1.55) / slope;            // main member at band underside
  back.add(H.box(THREE, heroMat, 0.06, 0.55, 0.60, { x: xBrace, y: 3.30, z: zG1, r: 0.004 }));

  H.noShadow(back);
  }

  const setNight = (t) => {
    const k = clamp01(t);
    viewMat.color.setRGB(
      THREE.MathUtils.lerp(1.0, 0.20, k),
      THREE.MathUtils.lerp(1.0, 0.27, k),
      THREE.MathUtils.lerp(1.0, 0.40, k),
    );
    for (const e of nightables) {
      e.mat.color.copy(e.day).lerp(e.night, k);
      if (e.emis && e.mat.emissive) e.mat.emissive.copy(e.mat.color).multiplyScalar(e.emis * (1 - 0.85 * k));
    }
  };

  // ---- api -----------------------------------------------------------------
  g.userData.api = { setShade, setNight };
  setShade(0);
  setNight(0);
  return g;
}
