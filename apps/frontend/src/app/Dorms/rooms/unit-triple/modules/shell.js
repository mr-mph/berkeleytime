// ============================================================================
// shell.js — room shell for the Units 1–3 triple.
// Carpet floor slab + beige lino patch at the door corner (brushed transition
// strips where carpet meets lino), 4 walls (left entry/closet wall with door,
// window wall with window opening, built from box segments), dark vinyl cove
// base with a small toe flare (skipped across the door opening on the entry
// wall and the closet-run footprint on the closet wall),
// painted-concrete ceiling: slab + five one-way ribs along +x + the deep
// header beam over the window wall. EVERY ceiling mesh gets
// userData.isCeiling = true so main.js's plan view can hide them.
// Door/window casings belong to doorwin.js; closet bays to closet.js.
// No column in this room. Floor receives shadows.
// No imports — everything comes from ctx = { THREE, mats, spec, H }.
// ============================================================================

export function buildShell(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { ROOM, DOOR, WINDOW, CEIL, ENTRY, CLOSET } = spec;

  const L = ROOM.L, W = ROOM.W, HT = ROOM.H, T = ROOM.wallT;
  const bH = ROOM.baseH, bT = ROOM.baseT;

  const g = new THREE.Group();
  g.name = 'shell';

  // box by min/max corners (opt passes through to H.box: r, cast, receive...)
  const boxMM = (mat, x0, x1, y0, y1, z0, z1, opt = {}) =>
    H.box(THREE, mat, x1 - x0, y1 - y0, z1 - z0, {
      x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, ...opt,
    });

  // ---- floor: gray-green loop carpet slab (receives shadows, never casts) --
  const floor = boxMM(mats.carpet, -T, L + T, -0.10, 0, -T, W + T, { cast: false });
  floor.name = 'floor';
  g.add(floor);

  // ---- beige lino patch at the door corner (ENTRY: x 0..x1, z 0..z1) -------
  // 4 mm sheet laid over the carpet, edges eased into the entry + bunk walls;
  // brushed transition strips cover the carpet->lino step on both exposed
  // edges, meeting in a clean L at the outer corner (x1, z1).
  const linoT = 0.004;
  const lino = boxMM(mats.lino, -0.005, ENTRY.x1, 0, linoT,
    -0.005, ENTRY.z1, { cast: false });
  lino.name = 'lino';
  g.add(lino);

  const sw = 0.015, sh = 0.007;   // transition strip half-width / height
  // edge along x = ENTRY.x1 (z 0..z1): butts the entry-wall cove flare, runs
  // through the outer corner (strip B stops sw short and butts it there)
  g.add(boxMM(mats.brushed, ENTRY.x1 - sw, ENTRY.x1 + sw, 0, sh,
    bT + 0.008, ENTRY.z1 + sw, { r: 0.002 }));
  // edge along z = ENTRY.z1 (x 0..x1): starts flush at the closet wall (its
  // first 0.62 m passes under closet partition 1), butts strip A at the corner
  g.add(boxMM(mats.brushed, 0, ENTRY.x1 - sw, 0, sh,
    ENTRY.z1 - sw, ENTRY.z1 + sw, { r: 0.002 }));

  // ---- left entry/closet wall (inner face x = 0) with door opening ---------
  // The official plan puts the door in THIS wall. The closet run starts at
  // its hinge jamb and stands proud of the remaining solid wall.
  const dz0 = DOOR.z0, dz1 = DOOR.z0 + DOOR.w;
  g.add(boxMM(mats.wall, -T, 0, 0, HT, -T, dz0));
  g.add(boxMM(mats.wall, -T, 0, DOOR.h, HT, dz0, dz1));
  g.add(boxMM(mats.wall, -T, 0, 0, HT, dz1, W + T));

  // ---- window wall (inner face x = L) with window opening ------------------
  const wz0 = WINDOW.z0, wz1 = WINDOW.z0 + WINDOW.w;
  const wy0 = WINDOW.y0, wy1 = WINDOW.y0 + WINDOW.h;
  g.add(boxMM(mats.wall, L, L + T, 0, HT, -T, wz0));         // entry side of window
  g.add(boxMM(mats.wall, L, L + T, 0, HT, wz1, W + T));      // loft side
  g.add(boxMM(mats.wall, L, L + T, 0, wy0, wz0, wz1));       // below the sill
  g.add(boxMM(mats.wall, L, L + T, wy1, HT, wz0, wz1));      // above (behind beam)

  // ---- loft wall (inner face z = 0): SOLID ---------------------------------
  g.add(boxMM(mats.wall, 0, L, 0, HT, -T, 0));

  // ---- bunk wall (inner face z = W) ----------------------------------------
  g.add(boxMM(mats.wall, 0, L, 0, HT, W, W + T));

  // ---- ceiling: cream-painted concrete slab + one-way ribs + header beam ---
  // EVERY mesh here is tagged isCeiling so plan view can hide it by traversal.
  const tagCeil = (m) => { m.userData.isCeiling = true; return m; };

  const slab = tagCeil(boxMM(mats.ceiling, -T, L + T, HT, HT + 0.12, -T, W + T));
  slab.name = 'ceiling';
  g.add(slab);

  // five ribs run closet->window (+x), dying into the closet wall and the
  // header beam; ends + tops buried 1 cm so only the chamfered underside
  // arrises show
  const ribX1 = L - CEIL.beamW + 0.02;
  for (const rz of CEIL.ribZ) {
    g.add(tagCeil(boxMM(mats.ceiling, -0.01, ribX1, HT - CEIL.ribD, HT + 0.01,
      rz - CEIL.ribW / 2, rz + CEIL.ribW / 2, { r: 0.004 })));
  }

  // deep header beam along the window wall; its soffit lands exactly on the
  // window head (HT - beamD = WINDOW.y0 + WINDOW.h), ends buried in side walls
  g.add(tagCeil(boxMM(mats.ceiling, L - CEIL.beamW, L + 0.01,
    HT - CEIL.beamD, HT + 0.01, -0.01, W + 0.01, { r: 0.004 })));

  // ---- dark vinyl cove base (baseH) ----------------------------------------
  // Board + a small toe flare easing onto the carpet (cove profile). Skipped
  // across the door opening on the ENTRY wall (stops at the casing edges) and
  // across the closet-run footprint (z cz0..cz1) on the CLOSET wall. Corner
  // rule as Blackwell: closet + window boards reach the corners, entry/loft
  // boards stop bT short. dir = which way the run protrudes off its wall.
  const coveRun = (x0, x1, z0, z1, dir) => {
    g.add(boxMM(mats.cove, x0, x1, 0, bH, z0, z1, { r: 0.0025 }));
    const f = { x0, x1, z0, z1 };                 // toe flare, +8 mm out, 18 mm high
    if (dir === '+x') f.x1 += 0.008; else if (dir === '-x') f.x0 -= 0.008;
    else if (dir === '+z') f.z1 += 0.008; else f.z0 -= 0.008;
    g.add(boxMM(mats.cove, f.x0, f.x1, 0, 0.018, f.z0, f.z1, { r: 0.004 }));
  };
  const cas = DOOR.casingW;                       // cove butts into the door casing
  const cz0 = CLOSET.z0;                          // closet run lives on the closet wall
  const cz1 = CLOSET.z0 + CLOSET.bays * CLOSET.bayW + (CLOSET.bays + 1) * CLOSET.partT;

  // left entry/closet wall — door and closet are contiguous, so there is no
  // stray baseboard or visible strip between them.
  coveRun(0, bT, 0, Math.max(0, dz0 - cas), '+x');
  if (cz1 < W - 1e-6) coveRun(0, bT, cz1, W, '+x');
  // loft wall (face z=0, protrudes +z) — full run behind MicroChill/bed
  coveRun(bT, L - bT, 0, bT, '+z');
  // window wall (face x=L, protrudes -x)
  coveRun(L - bT, L, 0, W, '-x');
  // bunk wall (face z=W, protrudes -z) — dresser is freestanding, full run
  coveRun(bT, L - bT, W - bT, W, '-z');

  return g;
}
