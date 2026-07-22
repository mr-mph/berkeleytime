// ============================================================================
// shell.js — room shell for the Blackwell Hall double.
// Floor slab, 4 walls (entry wall with door opening, window wall with window
// opening, built from box segments), fridge-niche stubs, concrete corner
// column, concrete ceiling (userData.isCeiling), white baseboards.
// Door/window casings, frames, leaf, shade etc. belong to doorwin.js.
// No imports — everything comes from ctx = { THREE, mats, spec, H }.
// ============================================================================

export function buildShell(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { ROOM, DOOR, WINDOW, STUBS, COLUMN, LAYOUT } = spec;

  const L = ROOM.L, W = ROOM.W, HT = ROOM.H, T = ROOM.wallT;
  const bH = ROOM.baseH, bT = ROOM.baseT;

  const g = new THREE.Group();
  g.name = 'shell';

  // box by min/max corners (opt passes through to H.box: r, cast, receive...)
  const boxMM = (mat, x0, x1, y0, y1, z0, z1, opt = {}) =>
    H.box(THREE, mat, x1 - x0, y1 - y0, z1 - z0, {
      x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, ...opt,
    });

  // ---- floor slab (receives shadows, never casts) --------------------------
  const floor = boxMM(mats.floor, -T, L + T, -0.10, 0, -T, W + T, { cast: false });
  floor.name = 'floor';
  g.add(floor);

  // ---- ceiling: board-formed concrete slab (single mesh, tagged) -----------
  const ceiling = boxMM(mats.concrete, -T, L + T, HT, HT + 0.12, -T, W + T);
  ceiling.name = 'ceiling';
  ceiling.userData.isCeiling = true;
  g.add(ceiling);

  // ---- entry wall (inner face x = 0) with door opening ---------------------
  // opening: z DOOR.z0 .. DOOR.z0+DOOR.w, height DOOR.h
  const dz0 = DOOR.z0, dz1 = DOOR.z0 + DOOR.w;
  g.add(boxMM(mats.wall, -T, 0, 0, HT, -T, dz0));            // bed side of door
  g.add(boxMM(mats.wall, -T, 0, DOOR.h, HT, dz0, dz1));      // header above door
  g.add(boxMM(mats.wall, -T, 0, 0, HT, dz1, W + T));         // hinge-side strip

  // ---- window wall (inner face x = L) with window opening ------------------
  const wz0 = WINDOW.z0, wz1 = WINDOW.z0 + WINDOW.w;
  const wy0 = WINDOW.y0, wy1 = WINDOW.y0 + WINDOW.h;
  g.add(boxMM(mats.wall, L, L + T, 0, HT, -T, wz0));         // bed side of window
  g.add(boxMM(mats.wall, L, L + T, 0, HT, wz1, W + T));      // closet side
  g.add(boxMM(mats.wall, L, L + T, 0, wy0, wz0, wz1));       // below sill
  g.add(boxMM(mats.wall, L, L + T, wy1, HT, wz0, wz1));      // above window

  // ---- bed wall (inner face z = 0) and closet wall (inner face z = W) ------
  g.add(boxMM(mats.wall, 0, L, 0, HT, -T, 0));
  g.add(boxMM(mats.wall, 0, L, 0, HT, W, W + T));

  // ---- fridge-niche stubs: full-height drywall fins on the bed wall --------
  // Buried 1 cm into wall/floor/ceiling so the rounded (corner-bead) edges
  // only show on the exposed vertical corners and front face.
  const s1x0 = STUBS.s1x, s1x1 = STUBS.s1x + STUBS.t;
  const s2x0 = STUBS.s2x, s2x1 = STUBS.s2x + STUBS.t;
  const sd = STUBS.depth;
  g.add(boxMM(mats.stub, s1x0, s1x1, -0.005, HT + 0.005, -0.01, sd, { r: 0.003 }));
  g.add(boxMM(mats.stub, s2x0, s2x1, -0.005, HT + 0.005, -0.01, sd, { r: 0.003 }));

  // ---- concrete corner column (window/closet corner, full height) ----------
  // mats.concrete's texture repeat is tuned for the big ceiling slab; the
  // narrow column faces map the same 0..1 per-face UVs, which stretches the
  // mottle into fine vertical wood-like streaks. Re-sample the shared canvas
  // texture at ~world scale so the column reads as board-formed concrete.
  let colMat = mats.concrete;
  if (mats.concrete.map) {
    const colTex = mats.concrete.map.clone();
    colTex.repeat.set(0.12, 0.85);   // ~2.5 m/tile across, ~3.4 m/tile up
    colTex.offset.set(0.30, 0.06);
    colTex.needsUpdate = true;
    colMat = new THREE.MeshStandardMaterial({
      color: mats.concrete.color, map: colTex,
      roughness: mats.concrete.roughness,
    });
  }
  const col = boxMM(colMat, COLUMN.x0, L + 0.01, -0.005, HT + 0.005,
    COLUMN.z0, W + 0.01, { r: 0.004 });
  col.name = 'column';
  g.add(col);

  // soft AO grounding under the column and stubs
  const colShadow = H.contactShadow(THREE, 0.45, 0.5, { opacity: 0.16 });
  colShadow.position.set((COLUMN.x0 + L) / 2, 0, (COLUMN.z0 + W) / 2);
  g.add(colShadow);
  for (const sx of [s1x0, s2x0]) {
    const s = H.contactShadow(THREE, 0.26, 1.0, { opacity: 0.14 });
    s.position.set(sx + STUBS.t / 2, 0, sd / 2);
    g.add(s);
  }

  // ---- baseboards (semigloss white, eased edges) ----------------------------
  // Runs butt cleanly at corners: the "primary" board reaches the corner, the
  // perpendicular one stops bT short at its face. No baseboard on concrete
  // column, across the door opening (stops at casing edge), or behind the
  // closet volumes on the closet wall.
  const base = (x0, x1, y0, y1, z0, z1) =>
    boxMM(mats.trim, x0, x1, y0, y1, z0, z1, { r: 0.0025 });
  const cas = DOOR.casingW; // baseboard butts into the door casing

  // entry wall (face x=0, protrudes +x)
  g.add(base(0, bT, 0, bH, 0, dz0 - cas));
  g.add(base(0, bT, 0, bH, dz1 + cas, W));
  // bed wall (face z=0, protrudes +z) — interrupted by the two stubs
  g.add(base(bT, s1x0, 0, bH, 0, bT));
  g.add(base(s1x1, s2x0, 0, bH, 0, bT));           // inside the fridge niche
  g.add(base(s2x1, L - bT, 0, bH, 0, bT));
  // window wall (face x=L, protrudes -x) — stops at the concrete column
  g.add(base(L - bT, L, 0, bH, 0, COLUMN.z0));
  // closet wall (face z=W, protrudes -z) — skip both closet footprints,
  // stop at the column
  const c1 = LAYOUT.closet1, c2 = LAYOUT.closet2;
  g.add(base(bT, c1.x0, 0, bH, W - bT, W));
  g.add(base(c1.x0 + c1.w, c2.x0, 0, bH, W - bT, W));
  g.add(base(c2.x0 + c2.w, COLUMN.x0, 0, bH, W - bT, W));
  // stub faces: two sides + front on each stub (front wraps the corners)
  for (const [sx0, sx1] of [[s1x0, s1x1], [s2x0, s2x1]]) {
    g.add(base(sx0 - bT, sx0, 0, bH, bT, sd));     // -x side face
    g.add(base(sx1, sx1 + bT, 0, bH, bT, sd));     // +x side face
    g.add(base(sx0 - bT, sx1 + bT, 0, bH, sd, sd + bT)); // front face
  }

  return g;
}
