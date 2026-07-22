// desk.js — Blackwell double: desk + white ribbed office chair (+ recycle bin).
// Contract (SPEC.md): buildDesk(ctx), buildChair(ctx). Desk origin = footprint
// center, top surface at DESK.h, back edge at +DESK.d/2. Chair origin = floor
// under the gas-lift axis; api.setSpin(rad) rotates everything above the base.
// No imports — everything comes from ctx = { THREE, mats, spec, H }.

// ---------------------------------------------------------------------------
// DESK — driftwood laminate top, 4 dark-steel square legs, rear modesty rail,
// side aprons and adjustable feet. Furnished accessories are separate exported
// objects so the planner can move them independently from the desk.
// ---------------------------------------------------------------------------
export function buildDesk(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const D = spec.DESK;
  const g = new THREE.Group();

  // --- top: laminate slab, rounded edges a hand touches ---------------------
  const topY = D.h - D.topT / 2;
  g.add(H.box(THREE, mats.laminate, D.w, D.topT, D.d, { y: topY, r: 0.006 }));
  // thin darker edge-band shadow line under the top perimeter (subtle seam)
  g.add(H.box(THREE, mats.laminateDark, D.w - 0.006, 0.004, D.d - 0.006,
    { y: D.h - D.topT - 0.002 }));

  // --- legs: square steel, inset from the top edges -------------------------
  const lx = D.w / 2 - D.legT / 2 - 0.025;   // leg center x
  const lz = D.d / 2 - D.legT / 2 - 0.020;   // leg center z
  const footH = 0.02;
  const legH = D.h - D.topT - footH;
  const legY = footH + legH / 2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(H.box(THREE, mats.metalDark, D.legT, legH, D.legT,
        { x: sx * lx, y: legY, z: sz * lz, r: 0.004 }));
      // adjustable leveling foot: small black tapered puck
      g.add(H.cyl(THREE, mats.blackGloss, 0.011, 0.014, footH,
        { x: sx * lx, y: footH / 2, z: sz * lz, seg: 14 }));
    }
  }

  // --- rear modesty rail (steel panel between the back legs) ----------------
  const railW = 2 * lx - D.legT;
  g.add(H.box(THREE, mats.metalDark, railW, 0.28, 0.012,
    { y: 0.56, z: lz, r: 0.003 }));

  // --- side aprons under the top (front-to-back stiffeners) -----------------
  const apronL = 2 * lz - D.legT;
  for (const sx of [-1, 1]) {
    g.add(H.box(THREE, mats.metalDark, 0.018, 0.05, apronL,
      { x: sx * lx, y: D.h - D.topT - 0.027, r: 0.002 }));
  }

  g.add(H.contactShadow(THREE, D.w + 0.14, D.d + 0.16, { opacity: 0.26 }));
  return g;
}

// Closed furnished laptop, modeled as its own planner object. The layered lid,
// hinge, edge bevel, logo, ports, and rubber feet keep it readable at desk scale.
export function buildDeskLaptop(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const g = new THREE.Group();
  g.userData.furnishedOnly = true;
  const shell = new THREE.MeshPhysicalMaterial({ color: spec.COLORS.doorLeaf, roughness: .28, metalness: .68, clearcoat: .18 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: .42, metalness: .38 });
  const lw = .32, ld = .22;
  g.add(H.box(THREE, shell, lw, .012, ld, { y: .006, r: .005 }));
  g.add(H.box(THREE, shell, lw - .004, .010, ld - .005, { y: .017, r: .004 }));
  g.add(H.box(THREE, edge, lw - .018, .0025, ld - .018, { y: .0125, r: .002 }));
  g.add(H.cyl(THREE, mats.blackGloss, .0055, .0055, lw * .66, { y: .014, z: -ld / 2 + .005, rz: Math.PI / 2, seg: 18 }));
  const logo = H.cyl(THREE, new THREE.MeshPhysicalMaterial({ color: 0xcdd3d8, roughness: .25, metalness: .7 }), .018, .018, .0015, { y: .023, seg: 24 });
  g.add(logo);
  for (const x of [-.125, .125]) for (const z of [-.08, .08]) g.add(H.box(THREE, mats.blackGloss, .020, .0018, .010, { x, y: .0008, z, r: .002 }));
  for (const z of [-.045, .012, .055]) g.add(H.box(THREE, edge, .002, .003, .026, { x: -lw / 2 - .001, y: .009, z, r: .001 }));
  g.add(H.contactShadow(THREE, .35, .25, { opacity: .16 }));
  return g;
}

// Hollow ceramic mug with a glazed rim, coffee surface, handle, and foot ring.
export function buildDeskMug(ctx) {
  const { THREE, spec, H } = ctx;
  const g = new THREE.Group();
  g.userData.furnishedOnly = true;
  const ceramic = new THREE.MeshPhysicalMaterial({ color: spec.COLORS.chairWhite, roughness: .22, clearcoat: .42 });
  const coffee = new THREE.MeshPhysicalMaterial({ color: 0x39271e, roughness: .32, clearcoat: .22 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.037, .041, .088, 36, 1, true), ceramic);
  body.position.y = .047; body.castShadow = true; body.receiveShadow = true; g.add(body);
  g.add(H.cyl(THREE, ceramic, .041, .041, .006, { y: .005, seg: 32 }));
  g.add(H.cyl(THREE, coffee, .0345, .0345, .002, { y: .089, seg: 32, cast: false }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.038, .0034, 12, 36), ceramic);
  rim.rotation.x = Math.PI / 2; rim.position.y = .091; rim.castShadow = true; g.add(rim);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.026, .0055, 12, 30, Math.PI * 1.55), ceramic);
  handle.position.set(.039, .052, 0); handle.rotation.z = .22; handle.castShadow = true; handle.receiveShadow = true; g.add(handle);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(.026, .003, 10, 28), ceramic);
  foot.rotation.x = Math.PI / 2; foot.position.y = .003; g.add(foot);
  g.add(H.contactShadow(THREE, .13, .10, { opacity: .15 }));
  return g;
}

// ---------------------------------------------------------------------------
// CHAIR — white ribbed mid-back office chair (ref07/ref08): white seat pad,
// ribbed back (8 rounded slats around a thin core panel, chrome frame), chrome loop
// armrests, chrome gas lift, chrome 5-star base, 5 black twin-wheel casters.
// api.setSpin(rad) rotates everything above the base about the lift axis.
// ---------------------------------------------------------------------------
export function buildChair(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const C = spec.CHAIR;
  const g = new THREE.Group();

  // ===== static base: 5-star legs + casters + hub + lower lift ==============
  const base = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = i * (Math.PI * 2 / 5);
    // chrome spoke, sloping down toward the caster tip
    leg.add(H.box(THREE, mats.chrome, 0.26, 0.026, 0.048,
      { x: 0.17, y: 0.083, rz: -0.09, r: 0.009 }));
    // caster: stem + swivel cap + twin black wheels
    leg.add(H.cyl(THREE, mats.chrome, 0.007, 0.007, 0.036, { x: 0.28, y: 0.048, seg: 10 }));
    leg.add(H.box(THREE, mats.blackGloss, 0.05, 0.034, 0.026,
      { x: 0.292, y: 0.037, r: 0.008 }));
    for (const sw of [-1, 1]) {
      leg.add(H.cyl(THREE, mats.blackGloss, 0.024, 0.024, 0.009,
        { x: 0.294, y: 0.024, z: sw * 0.0085, rx: Math.PI / 2, seg: 16 }));
    }
    base.add(leg);
  }
  base.add(H.cyl(THREE, mats.chrome, 0.028, 0.037, 0.11, { y: 0.125, seg: 20 })); // hub
  base.add(H.cyl(THREE, mats.chrome, 0.022, 0.026, 0.18, { y: 0.25, seg: 18 }));  // lift outer
  g.add(base);

  // ===== spin assembly: everything above the base ============================
  const spin = new THREE.Group();

  spin.add(H.cyl(THREE, mats.chrome, 0.015, 0.015, 0.12, { y: 0.355, seg: 14 })); // piston
  spin.add(H.cyl(THREE, mats.blackGloss, 0.021, 0.024, 0.02, { y: 0.40, seg: 14 })); // collar
  spin.add(H.box(THREE, mats.metalDark, 0.15, 0.04, 0.19, { y: 0.392, r: 0.006 })); // tilt mech
  spin.add(H.box(THREE, mats.metalDark, 0.30, 0.012, 0.30, { y: 0.402, r: 0.004 })); // seat plate

  // seat pad (front of chair = +z)
  spin.add(H.box(THREE, mats.chairPad, C.seatW, 0.065, C.seatD,
    { y: C.seatH - 0.0325, z: 0.01, r: 0.022 }));

  // ---- ribbed back, subtle recline -----------------------------------------
  const back = new THREE.Group();
  back.position.set(0, 0.44, -0.205);
  back.rotation.x = -0.10; // lean top backward
  // chrome perimeter frame (in local XY plane)
  const bf = H.frame(THREE, mats.chrome, 0.46, C.backH - 0.01, 0.016, 0.02);
  bf.position.y = 0.31;
  back.add(bf);
  // thin core panel centered in the ribs (fills the slat gaps)
  back.add(H.box(THREE, mats.chairPad, 0.42, 0.508, 0.012, { y: 0.31, z: 0 }));
  // 8 tight horizontal rib slats, proud on BOTH faces (ref07: pad reads ribbed
  // from the back too, not as a flat white board)
  for (let i = 0; i < 8; i++) {
    back.add(H.box(THREE, mats.chairPad, 0.42, 0.058, 0.036,
      { y: 0.085 + i * 0.0635, z: 0, r: 0.016 }));
  }
  // chrome uprights dropping to the under-seat crossbar
  for (const sx of [-1, 1]) {
    back.add(H.box(THREE, mats.chrome, 0.016, 0.16, 0.014,
      { x: sx * 0.155, y: 0.035, z: -0.016, r: 0.004 }));
  }
  spin.add(back);
  spin.add(H.box(THREE, mats.chrome, 0.33, 0.014, 0.014,
    { y: 0.398, z: -0.195, r: 0.004 })); // crossbar tying uprights to seat plate

  // ---- chrome loop armrests (smooth tube, ends tucked under the seat) ------
  for (const s of [-1, 1]) {
    const pts = [
      [s * 0.19, 0.415, 0.15],
      [s * 0.245, 0.46, 0.20],
      [s * 0.26, 0.60, 0.205],
      [s * 0.26, 0.665, 0.12],
      [s * 0.265, 0.675, 0.0],
      [s * 0.26, 0.665, -0.12],
      [s * 0.26, 0.58, -0.19],
      [s * 0.245, 0.46, -0.19],
      [s * 0.19, 0.415, -0.14],
    ].map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.010, 10, false), mats.chrome);
    arm.castShadow = true; arm.receiveShadow = true;
    spin.add(arm);
  }

  g.add(spin);
  g.add(H.contactShadow(THREE, 0.74, 0.74, { opacity: 0.26 }));

  g.userData.api = {
    setSpin(rad) { spin.rotation.y = rad; },
  };
  return g;
}

// ---------------------------------------------------------------------------
// BIN — small blue office recycle bin (furnished prop; internal — added as a
// child of each desk in buildDesk, not exported: SPEC exports are exactly
// buildDesk/buildChair and main.js never imports a bin builder).
// ---------------------------------------------------------------------------
export function buildDeskBin(ctx) {
  const { THREE, spec, H } = ctx;
  const g = new THREE.Group();
  g.userData.furnishedOnly = true;

  const binMat = new THREE.MeshStandardMaterial({
    color: spec.COLORS.plaque, roughness: 0.65, side: THREE.DoubleSide,
  });
  // tapered rectangular shell: 4-segment open cylinder, squared up (rotation
  // baked into the geometry so the mesh z-scale squashes the aligned square)
  const shellGeo = new THREE.CylinderGeometry(0.155, 0.125, 0.30, 4, 1, true);
  shellGeo.rotateY(Math.PI / 4);
  const shell = new THREE.Mesh(shellGeo, binMat);
  shell.scale.z = 0.72;
  shell.position.y = 0.15;
  shell.castShadow = true; shell.receiveShadow = true;
  g.add(shell);
  // rim band
  const rimGeo = new THREE.CylinderGeometry(0.159, 0.155, 0.022, 4, 1, true);
  rimGeo.rotateY(Math.PI / 4);
  const rim = new THREE.Mesh(rimGeo, binMat);
  rim.scale.z = 0.72;
  rim.position.y = 0.289;
  rim.castShadow = true; rim.receiveShadow = true;
  g.add(rim);
  // bottom
  g.add(H.box(THREE, binMat, 0.165, 0.008, 0.12, { y: 0.006 }));

  g.add(H.contactShadow(THREE, 0.34, 0.28, { opacity: 0.22 }));
  return g;
}
