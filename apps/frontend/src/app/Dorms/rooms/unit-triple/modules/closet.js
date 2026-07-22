// closet.js — Units 1–3 triple: ONE run of two OPEN closet bays on the ENTRY
// wall (x = 0), right of the door. No doors (ref 9.29.56: open fronts, white
// floor-to-ceiling partitions, chrome rod, clothes shelf, top shelf behind a
// white soffit/lip band, open storage above to the ceiling). The movable
// honey-maple dressers are placed separately by main.js so every one can be
// selected and edited; the closet carcass itself remains fixed millwork.
//
// Built in ROOM coordinates — main.js places the group at the origin.
// Run spans z = CLOSET.z0 .. z0 + 2*bayW + 3*partT (1.03 .. 4.01). The
// carcass embeds 15 mm into the x=0 wall so lighting/rounding can never create
// a visible gap; its open front remains exactly x=0.62, facing +x.
// Framed full-length mirror (H.makeMirror) on the door-facing (-z) face of
// the z0 end panel. No api (nothing moves).

export function buildClosetRun(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { CLOSET, ROOM } = spec;

  const bw = CLOSET.bayW, pt = CLOSET.partT, D = CLOSET.depth;
  const wallEmbed = 0.015;
  const xFront = D;                       // 0.62 open front plane
  const xMid = (D - wallEmbed) / 2;       // partitions span -0.015..0.62
  const carcassD = D + wallEmbed;
  const linerT = 0.012;                   // white back liner over the plaster
  const xBack = linerT;                   // 0.012 usable interior back plane
  const rodX = 0.30;                      // rod 0.30 off the wall (hanger swing)

  const g = new THREE.Group();
  g.name = 'closetRun';

  // bay/partition z geometry: [P0][bay][P1][bay][P2]
  const partZ = [];                       // partition centerlines
  const bayCZ = [];                       // bay centerlines
  for (let i = 0; i <= CLOSET.bays; i++) partZ.push(CLOSET.z0 + pt / 2 + i * (bw + pt));
  for (let i = 0; i < CLOSET.bays; i++) bayCZ.push(CLOSET.z0 + pt + bw / 2 + i * (bw + pt));

  // ---- white partitions: floor -> ceiling, full closet depth ---------------
  // plain boxes (painted millwork meets slab + carpet square — no chamfer,
  // a rounded edge would open a hairline at the ceiling)
  for (const pz of partZ) {
    g.add(H.box(THREE, mats.partition, carcassD, ROOM.H, pt,
      { x: xMid, y: ROOM.H / 2, z: pz }));
  }

  // ---- per-bay fit-out ------------------------------------------------------
  for (let i = 0; i < CLOSET.bays; i++) {
    const cz = bayCZ[i];

    // white back liner, floor -> ceiling (bay interior reads white, not plaster)
    g.add(H.box(THREE, mats.partition, linerT, ROOM.H, bw,
      { x: linerT / 2, y: ROOM.H / 2, z: cz, cast: false }));

    // chrome rod at rodY with end flanges against the partitions
    g.add(H.cyl(THREE, mats.chrome, 0.014, 0.014, bw - 0.006,
      { x: rodX, y: CLOSET.rodY, z: cz, rx: Math.PI / 2 }));
    for (const s of [-1, 1]) {
      g.add(H.cyl(THREE, mats.chrome, 0.030, 0.030, 0.006,
        { x: rodX, y: CLOSET.rodY, z: cz + s * (bw / 2 - 0.003), rx: Math.PI / 2 }));
    }

    // clothes shelf at shelfY (top surface): shallow slab over the rod zone,
    // on end cleats + a back cleat (ref: folded clothes slot under top shelf)
    const shATop = CLOSET.shelfY, shAT = 0.02, shAD = 0.38;
    const shAX = xBack + shAD / 2;
    g.add(H.box(THREE, mats.partition, shAD, shAT, bw - 0.006,
      { x: shAX, y: shATop - shAT / 2, z: cz, r: 0.003 }));
    for (const s of [-1, 1]) {
      g.add(H.box(THREE, mats.partition, shAD - 0.04, 0.035, 0.018,
        { x: shAX, y: shATop - shAT - 0.0175, z: cz + s * (bw / 2 - 0.012) }));
    }
    g.add(H.box(THREE, mats.partition, 0.018, 0.035, bw - 0.05,
      { x: xBack + 0.009, y: shATop - shAT - 0.0175, z: cz }));

    // top shelf: top surface at headerY, nearly full depth, on end cleats
    const shBTop = CLOSET.headerY, shBT = 0.025, shBD = 0.55;
    const shBX = xBack + shBD / 2;
    const shBFront = xBack + shBD;        // 0.562 front edge
    g.add(H.box(THREE, mats.partition, shBD, shBT, bw - 0.006,
      { x: shBX, y: shBTop - shBT / 2, z: cz }));
    for (const s of [-1, 1]) {
      g.add(H.box(THREE, mats.partition, shBD - 0.05, 0.035, 0.018,
        { x: shBX, y: shBTop - shBT - 0.0175, z: cz + s * (bw / 2 - 0.012) }));
    }

    // soffit band / usable lip: partition-to-partition fascia covering the
    // top-shelf edge, underside at ~headerY, rising 0.15 above the shelf so
    // stored boxes sit behind it and peek over (ref 9.29.56)
    g.add(H.box(THREE, mats.partition, 0.022, 0.18, bw,
      { x: shBFront + 0.011, y: shBTop - shBT + 0.09 - 0.005, z: cz }));
  }

  // ---- full-length mirror on the door-facing face of the z0 end panel ------
  // white-framed, faces -z toward the door (CLOSET.mirror)
  const mw = CLOSET.mirror.w, mh = CLOSET.mirror.h;
  const mcy = CLOSET.mirror.y0 + mh / 2;
  const faceZ = CLOSET.z0;                // end-panel face seen from the door
  const fr = H.frame(THREE, mats.trim, mw + 0.064, mh + 0.064, 0.032, 0.02);
  fr.position.set(xMid, mcy, faceZ - 0.01);
  g.add(fr);
  const mir = H.makeMirror(THREE, mw, mh, { res: 384 });
  mir.rotation.y = Math.PI;               // reflective face toward -z
  mir.position.set(xMid, mcy, faceZ - 0.006);
  H.noShadow(mir);
  g.add(mir);

  // ---- furnished layer ------------------------------------------------------
  // 4 / 3 wood hangers (wire hook, maple body) per rod + one soft
  // folded-clothes stack (2 fabric boxes) on bay 2's top shelf.
  const fu = new THREE.Group();
  fu.userData.furnishedOnly = true;

  const hangerOff = [                      // deterministic spread + yaw jitter
    { dz: [-0.28, -0.10, 0.05, 0.24], jit: [0.10, -0.08, 0.14, -0.05] },
    { dz: [-0.20, 0.02, 0.19],        jit: [-0.12, 0.06, -0.04] },
  ];
  for (let i = 0; i < CLOSET.bays; i++) {
    const { dz, jit } = hangerOff[i];
    for (let k = 0; k < dz.length; k++) {
      const hg = makeHanger(ctx);
      hg.position.set(rodX, CLOSET.rodY - 0.004, bayCZ[i] + dz[k]);
      hg.rotation.y = jit[k];             // shoulders span the closet depth
      fu.add(hg);
    }
  }

  // soft folded-clothes boxes, stacked, peeking over the soffit lip
  fu.add(H.box(THREE, mats.blanket, 0.42, 0.16, 0.36,
    { x: 0.28, y: CLOSET.headerY + 0.08, z: bayCZ[1] - 0.05, r: 0.02, ry: 0.06 }));
  fu.add(H.box(THREE, mats.sheet, 0.38, 0.14, 0.32,
    { x: 0.29, y: CLOSET.headerY + 0.16 + 0.07, z: bayCZ[1] - 0.04, r: 0.02, ry: -0.09 }));
  g.add(fu);

  return g;                               // fixed open-bay millwork
}

// Standalone compact honey-maple dresser (DRESSER 0.62 x 0.52 x 0.72).
// Local origin at the back-left corner at the wall: footprint x 0..w,
// z 0..d, back face at z=0, drawers open toward +z. main.js places one at
// the bunk foot; main.js stands the other two inside the bays facing +x.
// Carries its own contact shadow (back edge kept at z=0 so nothing bleeds
// into the wall behind).
export function buildDresser(ctx) {
  const { THREE, spec, H } = ctx;
  const { w, d } = spec.DRESSER;

  const g = new THREE.Group();
  g.name = 'dresser';

  const body = makeDresser(ctx);          // center origin, front faces -z
  body.rotation.y = Math.PI;              // front now faces +z
  body.position.set(w / 2, 0, d / 2);
  g.add(body);

  const cs = H.contactShadow(THREE, w + 0.10, d + 0.02, { opacity: 0.28 });
  cs.position.set(w / 2, 0, d / 2 + 0.01);
  g.add(cs);
  return g;
}

// Honey-maple university dresser: two full-width upper drawers and a divided
// lower row, as seen in the supplied Unit 1 closet photo. Dark recessed
// reveals, routed finger slots, recessed toe kick, rounded overhanging top.
// Local origin: floor center of the footprint; front faces -z.
function makeDresser(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { w, d, h } = spec.DRESSER;

  const g = new THREE.Group();

  // recessed dark toe kick
  g.add(H.box(THREE, mats.woodDark, w - 0.07, 0.055, d - 0.05,
    { y: 0.0275, z: 0.01 }));
  // carcass: front face recessed behind the drawer fronts
  const bodyY0 = 0.05, bodyY1 = h - 0.022, bodyH = bodyY1 - bodyY0;
  g.add(H.box(THREE, mats.wood, w, bodyH, d - 0.022,
    { y: (bodyY0 + bodyY1) / 2, z: 0.011 }));
  // dark face skin on the recessed carcass front so drawer reveals read deep
  g.add(H.box(THREE, mats.woodDark, w - 0.02, bodyH - 0.01, 0.004,
    { y: (bodyY0 + bodyY1) / 2, z: -(d / 2) + 0.020 }));
  // rounded top, slight overhang front + sides
  g.add(H.box(THREE, mats.wood, w + 0.014, 0.022, d + 0.010,
    { y: h - 0.011, z: -0.005, r: 0.004 }));

  // Reference face: two full-width upper drawers + two half-width lower
  // drawers. The compact proportions let two whole units share one closet bay.
  const fw = w - 0.05, gap = 0.008;
  const fy0 = 0.075, fy1 = bodyY1 - 0.012;
  const faceZ = -(d / 2) + 0.011;         // front slab centers
  const lowerH = (fy1 - fy0) * 0.40;
  const upperH = (fy1 - fy0 - lowerH - 2 * gap) / 2;
  const addPull = (x, y, pullW = 0.12) => g.add(H.box(THREE, mats.woodDark,
    pullW, 0.014, 0.008, { x, y, z: -(d / 2) - 0.003, r: 0.003 }));

  const lowerW = (fw - gap) / 2;
  for (const sx of [-1, 1]) {
    const cx = sx * (lowerW + gap) / 2;
    g.add(H.box(THREE, mats.wood, lowerW, lowerH, 0.022,
      { x: cx, y: fy0 + lowerH / 2, z: faceZ, r: 0.003 }));
    addPull(cx, fy0 + lowerH - 0.026, 0.085);
  }
  for (let r = 0; r < 2; r++) {
    const y0 = fy0 + lowerH + gap + r * (upperH + gap);
    g.add(H.box(THREE, mats.wood, fw, upperH, 0.022,
      { y: y0 + upperH / 2, z: faceZ, r: 0.004 }));
    addPull(0, y0 + upperH - 0.026, 0.13);
  }
  return g;
}

// wood clothes hanger: chrome wire hook + maple shoulders and trouser bar
// (furnished layer). Origin at the rod centerline; hangs down -y. Hook arc
// lies in the XY plane, wrapping a rod that runs along z.
function makeHanger(ctx) {
  const { THREE, mats, H } = ctx;
  const hg = new THREE.Group();
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.0032, 8, 16, Math.PI * 1.25), mats.chrome);
  hook.rotation.z = -Math.PI / 2;         // arc wraps over the rod, ends at neck
  hook.castShadow = hook.receiveShadow = true;
  hg.add(hook);
  hg.add(H.cyl(THREE, mats.chrome, 0.0032, 0.0032, 0.055, { y: -0.048, seg: 10 }));
  const phi = Math.PI / 2 + Math.atan2(0.07, 0.20); // shoulder slope
  hg.add(H.cyl(THREE, mats.wood, 0.0065, 0.0065, 0.215,
    { x: 0.10, y: -0.110, rz: -phi, seg: 10 }));
  hg.add(H.cyl(THREE, mats.wood, 0.0065, 0.0065, 0.215,
    { x: -0.10, y: -0.110, rz: phi, seg: 10 }));
  hg.add(H.cyl(THREE, mats.wood, 0.005, 0.005, 0.38,
    { y: -0.148, rz: Math.PI / 2, seg: 10 }));
  return hg;
}
