// MicroChill stack: black minifridge + black microwave on top (fridge niche).
// Local origin: back-left corner at the wall (min x, min z); front faces +z.
// bbox ~ x 0..0.48, y 0..1.16, z 0..0.55 (microwave front + handle overhang).
// No animatable parts -> no userData.api.

export function buildMicroChill(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const F = spec.FRIDGE;      // w 0.48, d 0.50, h 0.87
  const MW = spec.MICROWAVE;  // w 0.48, d 0.38, h 0.28
  const g = new THREE.Group();

  const darkMatte = new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.COLORS.fridge).multiplyScalar(0.5), roughness: 0.75 });
  const cordMat   = new THREE.MeshStandardMaterial({ color: spec.COLORS.fridge, roughness: 0.6 });

  // ==== FRIDGE ==============================================================
  const doorT = 0.03;               // door slab thickness
  const backGap = 0.01;             // carcass stands off wall so the cord fits
  const bodyD = F.d - doorT - backGap;              // 0.46
  const doorFaceZ = backGap + bodyD + doorT;        // 0.50

  // carcass
  g.add(H.box(THREE, mats.fridge, F.w, F.h, bodyD,
    { x: F.w / 2, y: F.h / 2, z: backGap + bodyD / 2, r: 0.004 }));

  // ---- two doors: freezer top ~30%, fridge below, 4mm gaps ----------------
  const reveal = 0.003;             // side reveal each side
  const doorW = F.w - 2 * reveal;
  const gap = 0.004;
  const doorsY0 = 0.08, doorsY1 = F.h - 0.006;      // vent zone below, 6mm top reveal
  const dh = doorsY1 - doorsY0;                     // 0.784
  const fridgeDoorH = dh * 0.70 - gap / 2;          // ~0.547
  const freezerDoorH = dh * 0.30 - gap / 2;         // ~0.233
  const fridgeDoorCy = doorsY0 + fridgeDoorH / 2;
  const freezerY0 = doorsY0 + fridgeDoorH + gap;
  const freezerDoorCy = freezerY0 + freezerDoorH / 2;
  const doorCz = backGap + bodyD + doorT / 2;

  g.add(H.box(THREE, mats.fridge, doorW, fridgeDoorH, doorT,
    { x: F.w / 2, y: fridgeDoorCy, z: doorCz, r: 0.004 }));
  g.add(H.box(THREE, mats.fridge, doorW, freezerDoorH, doorT,
    { x: F.w / 2, y: freezerDoorCy, z: doorCz, r: 0.004 }));

  // ---- vertical bar handles near -x edge, ~25mm proud ---------------------
  const addHandle = (cy, len) => {
    const barCz = doorFaceZ + 0.025 - 0.008;        // outer face at doorFace+25mm
    g.add(H.box(THREE, mats.blackGloss, 0.018, len, 0.016,
      { x: 0.036, y: cy, z: barCz, r: 0.004 }));
    for (const s of [-1, 1]) {                      // standoffs door -> bar
      g.add(H.box(THREE, mats.blackGloss, 0.014, 0.02, 0.014,
        { x: 0.036, y: cy + s * (len / 2 - 0.028), z: doorFaceZ + 0.006, r: 0.003 }));
    }
  };
  addHandle(fridgeDoorCy, fridgeDoorH - 0.09);
  addHandle(freezerDoorCy, freezerDoorH - 0.065);

  // ---- hinge caps on the +x side (near-black: refs show no bright hardware)
  g.add(H.box(THREE, darkMatte, 0.045, 0.006, 0.050,
    { x: 0.452, y: F.h + 0.003, z: doorFaceZ - 0.018, r: 0.002 }));            // top
  g.add(H.box(THREE, darkMatte, 0.042, 0.009, 0.036,
    { x: 0.455, y: freezerY0 - gap / 2, z: doorFaceZ - 0.008, r: 0.002 }));    // middle
  g.add(H.box(THREE, darkMatte, 0.042, 0.008, 0.036,
    { x: 0.455, y: doorsY0 - 0.005, z: doorFaceZ - 0.010, r: 0.002 }));        // bottom

  // ---- louvered vent at base front ----------------------------------------
  const carcassFaceZ = backGap + bodyD;             // 0.47
  g.add(H.box(THREE, darkMatte, 0.44, 0.060, 0.004,
    { x: F.w / 2, y: 0.043, z: carcassFaceZ + 0.0005 }));      // dark recess field
  for (let i = 0; i < 6; i++) {
    g.add(H.box(THREE, mats.fridge, 0.42, 0.0065, 0.006,
      { x: F.w / 2, y: 0.020 + i * 0.010, z: carcassFaceZ + 0.0035 }));
  }

  // ---- small oval badge, top-left of the lower fridge door (per ref04) ----
  const badgeY = doorsY0 + fridgeDoorH - 0.042;     // just below the door split
  const oval = H.cyl(THREE, mats.chrome, 0.013, 0.013, 0.003,
    { x: 0.13, y: badgeY, z: doorFaceZ + 0.0015, rx: Math.PI / 2, seg: 28 });
  oval.scale.x = 2.0;
  g.add(oval);
  const badge = H.labelPlane(THREE, 0.038, 0.0145,
    { text: 'MC', bg: '#d8dadc', fg: '#222226', font: 'bold 60px Helvetica, Arial' });
  badge.position.set(0.13, badgeY, doorFaceZ + 0.0032);
  g.add(badge);

  // ==== MICROWAVE (on top, front proud of fridge face ~12mm, per ref02) =====
  const mwFrontZ = doorFaceZ + 0.012;               // 0.512
  const mwBackZ = mwFrontZ - MW.d;                  // 0.132
  const footH = 0.004;                              // low feet: no visible gap
  const mwY0 = F.h + footH;                         // body bottom 0.874

  const footFrontZ = carcassFaceZ - 0.02;           // keep feet on the carcass top
  for (const fx of [0.045, F.w - 0.045]) {
    for (const fz of [mwBackZ + 0.04, footFrontZ]) {
      g.add(H.cyl(THREE, darkMatte, 0.009, 0.009, footH,
        { x: fx, y: F.h + footH / 2, z: fz, seg: 16 }));
    }
  }
  g.add(H.box(THREE, mats.fridge, MW.w, MW.h, MW.d,
    { x: F.w / 2, y: mwY0 + MW.h / 2, z: mwBackZ + MW.d / 2, r: 0.005 }));
  const mwCy = mwY0 + MW.h / 2;                     // 1.02

  // ---- door: left ~2/3, dark glass window with thin frame ------------------
  const panelCx = 0.167, panelW = 0.31, panelH = 0.245;
  g.add(H.box(THREE, mats.fridge, panelW, panelH, 0.008,
    { x: panelCx, y: mwCy, z: mwFrontZ + 0.004, r: 0.003 }));   // door slab, proud 8mm
  const winCy = mwCy + 0.028;                       // window sits high on the door
  const winFrame = H.frame(THREE, mats.blackGloss, 0.288, 0.174, 0.008, 0.004);
  winFrame.position.set(panelCx, winCy, mwFrontZ + 0.0095);
  g.add(winFrame);
  g.add(H.box(THREE, mats.blackGloss, 0.276, 0.162, 0.004,
    { x: panelCx, y: winCy, z: mwFrontZ + 0.0065 }));           // glass, slightly recessed

  // ---- horizontal handle bar, right end at the window's right edge --------
  const winRight = panelCx + 0.144;                 // 0.311
  const barLen = 0.285, barCx = winRight - barLen / 2, barCy = mwCy - 0.092;
  g.add(H.box(THREE, mats.blackGloss, barLen, 0.017, 0.017,
    { x: barCx, y: barCy, z: mwFrontZ + 0.023, r: 0.005 }));
  for (const sx of [winRight - 0.014, winRight - barLen + 0.014]) {
    g.add(H.box(THREE, mats.blackGloss, 0.016, 0.014, 0.016,
      { x: sx, y: barCy, z: mwFrontZ + 0.012, r: 0.003 }));
  }

  // ---- control panel: display strip + 3x4 raised button grid --------------
  const cpCx = 0.398;
  g.add(H.box(THREE, mats.fridge, 0.128, panelH, 0.005,
    { x: cpCx, y: mwCy, z: mwFrontZ + 0.0025, r: 0.002 }));
  g.add(H.box(THREE, mats.blackGloss, 0.103, 0.036, 0.003,
    { x: cpCx, y: mwCy + 0.092, z: mwFrontZ + 0.0055 }));       // display bezel
  const lcd = H.labelPlane(THREE, 0.095, 0.026,
    { text: '12:00', bg: '#0d120d', fg: '#8fe0a0', font: 'bold 52px Helvetica, Arial' });
  lcd.position.set(cpCx, mwCy + 0.092, mwFrontZ + 0.0072);
  g.add(lcd);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      g.add(H.box(THREE, mats.blackGloss, 0.028, 0.020, 0.004,
        { x: 0.362 + c * 0.036, y: mwCy + 0.038 - r * 0.032, z: mwFrontZ + 0.0065 }));
    }
  }

  // ==== POWER CORD: back of fridge, droop, up wall to niche outlet ~y1.06 ===
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const curve = new THREE.CatmullRomCurve3([
    v(0.40, 0.32, 0.03),    // emerges from carcass back
    v(0.435, 0.10, 0.007),
    v(0.44, 0.055, 0.007),  // droop near floor
    v(0.38, 0.35, 0.006),
    v(0.30, 0.72, 0.006),   // running up the wall plane toward niche center
    v(0.255, 0.99, 0.008),
    v(0.24, 1.043, 0.020),  // into plug body (outlet centered between stubs)
  ]);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0042, 8), cordMat);
  cord.castShadow = true; cord.receiveShadow = true;
  g.add(cord);
  g.add(H.box(THREE, cordMat, 0.024, 0.034, 0.018,
    { x: 0.24, y: 1.045, z: 0.013, r: 0.003 }));    // plug at the outlet height

  // ==== contact shadow ======================================================
  const shadow = H.contactShadow(THREE, 0.62, 0.64);
  shadow.position.set(F.w / 2, 0, 0.26);
  g.add(shadow);

  return g;
}
