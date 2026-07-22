// desk.js — Unit 1–3 triple: honey-maple pedestal desk + black armless task
// chair (refs 9.31.10 / 9.32.55: drawer stack under the loft; 9.30.46 +
// unit1triple marketing photo: black slat-back chairs at the window desks).
// Contract (SPEC-UNIT-TRIPLE.md): buildDesk(ctx), buildChair(ctx).
//   Desk origin  = center of footprint, top at DESK.h, BACK edge at +DESK.d/2
//                  (main.js puts the back edge against a wall; user sits at -z).
//   Chair origin = floor under the gas-lift axis; front of chair = +z;
//                  api.setSpin(rad) rotates everything above the 5-star base.
// No imports — everything comes from ctx = { THREE, mats, spec, H }.

// ---------------------------------------------------------------------------
// DESK — solid maple: slab top with a bullnose front edge, RIGHT-hand 3-drawer
// pedestal (pencil drawer up top + 2 deep, routed finger pulls, toe recess),
// chunky left panel leg, shallow modesty rail across the back leaving
// DESK.kneeH clearance, black adjustable feet. Furnished: closed laptop + mug.
// "Right" = the sitting user's right = local -x (verified against the two
// rotY=π under-loft desks and the rotY=π/2 window desk).
// ---------------------------------------------------------------------------
export function buildDesk(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const D = spec.DESK;
  const g = new THREE.Group();

  // --- top: maple slab, front edge bullnosed (a full round a hand rests on) --
  const rr = D.topT / 2;                       // bullnose radius
  const topY = D.h - D.topT / 2;
  // slab holds the back portion; the front strip is the bullnose cylinder
  g.add(H.box(THREE, mats.wood, D.w, D.topT, D.d - rr,
    { y: topY, z: rr / 2, r: 0.004 }));
  g.add(H.cyl(THREE, mats.wood, rr, rr, D.w - 0.006,
    { y: topY, z: -D.d / 2 + rr, rz: Math.PI / 2, seg: 20 }));
  // darker edge-band shadow line under the top perimeter (subtle seam)
  g.add(H.box(THREE, mats.woodDark, D.w - 0.01, 0.004, D.d - 0.02,
    { y: D.h - D.topT - 0.002, z: 0.004 }));

  const underY = D.h - D.topT;                 // underside of the slab

  // --- right pedestal (local -x): carcass + toe recess + 3 drawer faces -----
  const pedCx = -(D.w / 2 - D.pedW / 2);       // pedestal centered on -x side
  const pedFront = -D.d / 2 + 0.035;           // top overhangs the drawers
  const pedBack = D.d / 2 - 0.015;
  const pedD = pedBack - pedFront;
  const pedCz = (pedFront + pedBack) / 2;
  const st = 0.018;                            // panel stock thickness
  const plinthTop = 0.065;                     // toe-recess height

  // side panels (sit on the plinth, run to the slab underside)
  for (const sx of [-1, 1]) {
    g.add(H.box(THREE, mats.wood, st, underY - plinthTop, pedD - 0.019,
      { x: pedCx + sx * (D.pedW / 2 - st / 2), y: (plinthTop + underY) / 2,
        z: pedCz + 0.0095, r: 0.004 }));
  }
  // back panel + top rail tying the sides together
  g.add(H.box(THREE, mats.wood, D.pedW - 2 * st, underY - plinthTop, st,
    { x: pedCx, y: (plinthTop + underY) / 2, z: pedBack - st / 2 }));
  g.add(H.box(THREE, mats.wood, D.pedW, 0.03, pedD - 0.019,
    { x: pedCx, y: underY - 0.015, z: pedCz + 0.0095, r: 0.003 }));
  // dark carcass face plane behind the drawer reveals (shadow line in gaps)
  g.add(H.box(THREE, mats.woodDark, D.pedW - 0.02, underY - plinthTop - 0.02, 0.006,
    { x: pedCx, y: (plinthTop + underY) / 2, z: pedFront + 0.023 }));

  // toe recess: darker plinth set back from the front, riding on 4 black feet
  g.add(H.box(THREE, mats.woodDark, D.pedW - 0.012, plinthTop - 0.012, pedD - 0.045,
    { x: pedCx, y: (0.012 + plinthTop) / 2, z: pedCz + 0.0125, r: 0.003 }));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(H.cyl(THREE, mats.blackGloss, 0.012, 0.014, 0.013,
        { x: pedCx + sx * (D.pedW / 2 - 0.05), y: 0.0065,
          z: pedCz + sz * (pedD / 2 - 0.06), seg: 12 }));
    }
  }

  // drawer faces: 2 deep + pencil drawer at the top, 4 mm reveals, proud of
  // the carcass; each face gets a routed finger pull (dark recess bar) near
  // its top edge — the maple system's pull detail (same as the bunk drawers).
  const faceW = D.pedW - 0.016, faceT = 0.019, gap = 0.004;
  const fy0 = plinthTop + 0.003, fy1 = underY - 0.033;
  const pencilH = 0.115;
  const deepH = (fy1 - fy0 - pencilH - 2 * gap) / 2;
  const rows = [                               // bottom-up: deep, deep, pencil
    { y0: fy0, h: deepH },
    { y0: fy0 + deepH + gap, h: deepH },
    { y0: fy0 + 2 * (deepH + gap), h: pencilH },
  ];
  for (const rw of rows) {
    const cy = rw.y0 + rw.h / 2;
    g.add(H.box(THREE, mats.wood, faceW, rw.h, faceT,
      { x: pedCx, y: cy, z: pedFront + faceT / 2, r: 0.004 }));
    // routed finger pull: recessed dark slot just under the face's top edge
    g.add(H.box(THREE, mats.woodDark, faceW - 0.06, 0.016, 0.012,
      { x: pedCx, y: rw.y0 + rw.h - 0.020, z: pedFront + 0.010, r: 0.003 }));
  }

  // --- left panel leg (local +x): chunky maple slab on adjustable feet ------
  const panT = 0.035;
  const panX = D.w / 2 - panT / 2;
  const panD = D.d - 0.07;                     // inset from front + back edges
  g.add(H.box(THREE, mats.wood, panT, underY - 0.014, panD,
    { x: panX, y: (0.014 + underY) / 2, r: 0.004 }));
  for (const sz of [-1, 1]) {
    g.add(H.cyl(THREE, mats.blackGloss, 0.012, 0.014, 0.013,
      { x: panX, y: 0.0065, z: sz * (panD / 2 - 0.05), seg: 12 }));
  }

  // --- modesty rail across the back: slab underside down to the knee line ---
  const modX0 = pedCx + D.pedW / 2;            // pedestal inner face
  const modX1 = D.w / 2 - panT;                // panel-leg inner face
  g.add(H.box(THREE, mats.wood, modX1 - modX0, underY - D.kneeH, D.modestyT,
    { x: (modX0 + modX1) / 2, y: (D.kneeH + underY) / 2,
      z: D.d / 2 - 0.03, r: 0.003 }));

  // --- furnished props (generic; appears on all three desks — kept subtle) --
  // closed laptop: base + lid slabs + hinge bar, gunmetal gray
  const lapMat = new THREE.MeshStandardMaterial({
    color: 0x494d52, roughness: 0.35, metalness: 0.6,
  });
  const laptop = new THREE.Group();
  laptop.userData.furnishedOnly = true;
  const lw = 0.30, ld = 0.21;
  laptop.add(H.box(THREE, lapMat, lw, 0.014, ld, { y: 0.007, r: 0.005 }));
  laptop.add(H.box(THREE, lapMat, lw - 0.004, 0.009, ld - 0.004,
    { y: 0.014 + 0.0045, r: 0.0035 }));
  laptop.add(H.cyl(THREE, mats.blackGloss, 0.006, 0.006, lw * 0.55,
    { y: 0.014, z: ld / 2 - 0.004, rz: Math.PI / 2, seg: 10 }));
  laptop.position.set(0.10, D.h, -0.02);
  laptop.rotation.y = 0.22;
  g.add(laptop);

  // ceramic mug (white body, coffee disc, torus handle) over the pedestal
  const coffee = new THREE.MeshStandardMaterial({ color: 0x5a4232, roughness: 0.85 });
  const mug = new THREE.Group();
  mug.userData.furnishedOnly = true;
  mug.add(H.cyl(THREE, mats.whitePlastic, 0.040, 0.036, 0.092, { y: 0.046, seg: 22 }));
  mug.add(H.cyl(THREE, coffee, 0.035, 0.035, 0.004, { y: 0.084, seg: 18, cast: false }));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 10, 20), mats.whitePlastic);
  handle.position.set(0.048, 0.048, 0);
  handle.castShadow = true; handle.receiveShadow = true;
  mug.add(handle);
  mug.position.set(-0.36, D.h, -0.12);
  mug.rotation.y = -0.7;
  g.add(mug);

  g.add(H.contactShadow(THREE, D.w + 0.14, D.d + 0.16, { opacity: 0.26 }));
  return g;
}

// ---------------------------------------------------------------------------
// CHAIR — black ARMLESS task chair (marketing photo / 9.30.46): dished black
// seat with a waterfall front, curved back read as horizontal slats with gaps
// (the "grooved perforation" of the molded shell — geometry, no textures),
// center seat-back spine, black gas lift, black 5-star base, twin-wheel
// casters. api.setSpin(rad) spins everything above the base about the lift.
// ---------------------------------------------------------------------------
export function buildChair(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const C = spec.CHAIR;
  const g = new THREE.Group();

  // ===== static base: 5 black spokes + twin casters + hub + lower lift ======
  const base = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = i * (Math.PI * 2 / 5);
    // molded spoke sloping down toward the caster tip (reach = CHAIR.baseR)
    leg.add(H.box(THREE, mats.chairBase, 0.27, 0.030, 0.050,
      { x: 0.155, y: 0.078, rz: -0.12, r: 0.010 }));
    // caster: stem + swivel cap + twin black wheels touching the floor
    leg.add(H.cyl(THREE, mats.chairBase, 0.007, 0.007, 0.035, { x: 0.272, y: 0.046, seg: 10 }));
    leg.add(H.box(THREE, mats.blackGloss, 0.05, 0.034, 0.026,
      { x: 0.284, y: 0.036, r: 0.008 }));
    for (const sw of [-1, 1]) {
      leg.add(H.cyl(THREE, mats.blackGloss, 0.025, 0.025, 0.010,
        { x: 0.286, y: 0.025, z: sw * 0.009, rx: Math.PI / 2, seg: 16 }));
    }
    base.add(leg);
  }
  base.add(H.cyl(THREE, mats.chairBase, 0.032, 0.045, 0.11, { y: 0.13, seg: 20 })); // hub cone
  base.add(H.cyl(THREE, mats.chairBase, 0.024, 0.028, 0.16, { y: 0.25, seg: 18 })); // lift outer
  g.add(base);

  // ===== spin assembly: everything above the base ===========================
  const spin = new THREE.Group();

  spin.add(H.cyl(THREE, mats.chairBase, 0.015, 0.015, 0.12, { y: 0.35, seg: 14 }));  // piston
  spin.add(H.cyl(THREE, mats.blackGloss, 0.021, 0.024, 0.02, { y: 0.395, seg: 14 })); // collar
  spin.add(H.box(THREE, mats.chairBase, 0.14, 0.05, 0.18, { y: 0.385, r: 0.008 }));  // tilt mech
  spin.add(H.box(THREE, mats.chairBase, 0.36, 0.014, 0.34, { y: 0.415, r: 0.004 })); // seat pan

  // ---- dished seat pad, waterfall front (front of chair = +z) --------------
  const padH = 0.062, padY = C.seatH - padH / 2;
  const padD = C.seatD - padH / 2;             // front strip = waterfall roll
  spin.add(H.box(THREE, mats.chairBlack, C.seatW, padH, padD,
    { y: padY, z: -(C.seatD - padD) / 2, r: 0.020 }));
  spin.add(H.cyl(THREE, mats.chairBlack, padH / 2, padH / 2, C.seatW - 0.03,
    { y: padY, z: C.seatD / 2 - padH / 2, rz: Math.PI / 2, seg: 18 }));
  // raised side + rear bolsters -> the dished contour reads from 0.5 m
  for (const sx of [-1, 1]) {
    spin.add(H.box(THREE, mats.chairBlack, 0.048, 0.020, 0.34,
      { x: sx * (C.seatW / 2 - 0.032), y: C.seatH - 0.006, z: -0.03, r: 0.009 }));
  }
  spin.add(H.box(THREE, mats.chairBlack, C.seatW - 0.06, 0.020, 0.05,
    { y: C.seatH - 0.006, z: -C.seatD / 2 + 0.035, r: 0.009 }));

  // ---- curved slat back: horizontal arcs with gaps (grooved-shell look) ----
  // Each slat is a torus arc (radius R, concave toward the sitter) squashed
  // into a flat oval; a solid lumbar band closes the bottom, a thicker crest
  // cap closes the top, and short stiles hide the slat ends.
  const back = new THREE.Group();
  back.position.set(0, 0.50, -0.20);
  back.rotation.x = -0.10;                     // top leans backward
  const R = 0.45;
  const halfW = 0.22;                          // back half-width at the chord
  const arc = 2 * Math.asin(halfW / R);
  const slat = (tube, yScale, y) => {
    const geo = new THREE.TorusGeometry(R, tube, 8, 24, arc);
    geo.rotateZ(-Math.PI / 2 - arc / 2);       // center the arc, bow to -z
    geo.rotateX(Math.PI / 2);                  // lay it horizontal
    const m = new THREE.Mesh(geo, mats.chairBlack);
    m.position.set(0, y, R);                   // arc midpoint lands at z=0
    m.scale.y = yScale;                        // circular tube -> flat oval
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  back.add(slat(0.016, 4.5, 0.07));            // solid lumbar band (~0.14 tall)
  for (let i = 0; i < 6; i++) back.add(slat(0.010, 2.3, 0.175 + i * 0.058));
  back.add(slat(0.015, 1.8, 0.50));            // crest cap; back top = backH
  // stiles at the slat ends, yawed to follow the curve tangent
  const endZ = R * (1 - Math.cos(arc / 2));
  for (const sx of [-1, 1]) {
    back.add(H.box(THREE, mats.chairBase, 0.026, C.backH - 0.015, 0.034,
      { x: sx * halfW, y: C.backH / 2, z: endZ, ry: -sx * (arc / 2), r: 0.008 }));
  }
  spin.add(back);

  // ---- center spine: under-seat bracket -> angled riser -> back plate ------
  spin.add(H.box(THREE, mats.chairBase, 0.05, 0.018, 0.14,
    { y: 0.397, z: -0.15, r: 0.004 }));
  spin.add(H.box(THREE, mats.chairBase, 0.045, 0.18, 0.024,
    { y: 0.47, z: -0.215, rx: -0.08, r: 0.004 }));
  spin.add(H.box(THREE, mats.chairBase, 0.05, 0.12, 0.018,
    { y: 0.55, z: -0.222, rx: -0.10, r: 0.004 }));

  g.add(spin);
  g.add(H.contactShadow(THREE, 0.74, 0.74, { opacity: 0.26 }));

  g.userData.api = {
    setSpin(rad) { spin.rotation.y = rad; },
  };
  return g;
}
