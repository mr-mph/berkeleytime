// closet.js — Blackwell Hall built-out closet volume (letter A or B).
// White drywall volume protruding CLOSET.depth into the room, mirrored bypass
// sliding doors under a white soffit band, blue letter plaque, interior with
// chrome rod + white shelf + hangers (furnishedOnly).
//
// Local origin: room-facing bottom-left corner. Width along +x (LAYOUT.closetN.w),
// depth along +z toward the room wall. Room-facing face at local z=0; mirror
// surfaces face -z. main.js places the group at (x0, 0, ROOM.W - CLOSET.depth).

export function buildCloset(ctx, { letter = 'A' } = {}) {
  const { THREE, mats, spec, H } = ctx;
  const { CLOSET, ROOM, LAYOUT, COLORS } = spec;

  const w = letter === 'B' ? LAYOUT.closet2.w : LAYOUT.closet1.w; // 1.15
  const D = CLOSET.depth;          // 0.65
  const doorH = CLOSET.doorH;      // 2.30 top of door opening / bottom of soffit
  const sideT = 0.045;             // side-wall (jamb) thickness, front returns at z=0
  const j0 = sideT, j1 = w - sideT, openW = j1 - j0;
  const pw = CLOSET.panelW;        // 0.585 each bypass panel
  const PD = 0.025;                // panel frame depth
  const panelH = 2.255;            // bottom 0.015 (over floor track) .. top 2.27 (into track)
  const zFront = 0.0075 + PD / 2;  // front (outer) track lane center
  const zRear = 0.0395 + PD / 2;   // rear  (inner) track lane center

  const g = new THREE.Group();

  // ---- built-out drywall shell -------------------------------------------
  // side walls: front edges return to the room at z=0
  g.add(H.box(THREE, mats.wall, sideT, doorH, D, { x: sideT / 2, y: doorH / 2, z: D / 2 }));
  g.add(H.box(THREE, mats.wall, sideT, doorH, D, { x: w - sideT / 2, y: doorH / 2, z: D / 2 }));
  // soffit band: solid from door top to ceiling, full width + depth
  g.add(H.box(THREE, mats.wall, w, ROOM.H - doorH, D, { x: w / 2, y: (doorH + ROOM.H) / 2, z: D / 2 }));
  // interior back wall (sits against the room wall)
  g.add(H.box(THREE, mats.wall, openW, doorH, 0.02, { x: w / 2, y: doorH / 2, z: D - 0.01 }));

  // baseboards on the exposed exterior faces of the volume (shell skips these)
  const bT = ROOM.baseT, bH = ROOM.baseH;
  g.add(H.box(THREE, mats.trim, bT, bH, D, { x: -bT / 2, y: bH / 2, z: D / 2 }));
  g.add(H.box(THREE, mats.trim, bT, bH, D, { x: w + bT / 2, y: bH / 2, z: D / 2 }));
  // short returns across the jamb fronts
  g.add(H.box(THREE, mats.trim, sideT + bT, bH, bT, { x: (sideT - bT) / 2, y: bH / 2, z: -bT / 2 }));
  g.add(H.box(THREE, mats.trim, sideT + bT, bH, bT, { x: w - (sideT - bT) / 2, y: bH / 2, z: -bT / 2 }));

  // ---- tracks --------------------------------------------------------------
  // top track: white channel under the soffit + fascia lip covering panel tops
  g.add(H.box(THREE, mats.trim, openW, 0.04, 0.08, { x: w / 2, y: doorH - 0.02, z: 0.04 }));
  g.add(H.box(THREE, mats.trim, openW, 0.055, 0.006, { x: w / 2, y: doorH - 0.0275, z: 0.003 }));
  // bottom track: low satin-aluminum channel on the floor
  g.add(H.box(THREE, mats.brushed, openW, 0.015, 0.08, { x: w / 2, y: 0.0075, z: 0.04 }));

  // ---- mirrored bypass panels ----------------------------------------------
  const fT = CLOSET.frameT / 2; // 15mm bars — ref09: mirrors read nearly frameless
  function makePanel() {
    const p = new THREE.Group();
    p.add(H.frame(THREE, mats.brushed, pw, panelH, fT, PD)); // slim satin-silver frame
    const mir = H.makeMirror(THREE, pw - fT, panelH - fT, { res: 384 });
    mir.rotation.y = Math.PI;               // reflective face toward the room (-z)
    mir.position.z = -PD / 2 + 0.002;
    H.noShadow(mir);
    p.add(mir);
    // white hardboard backing seen from inside the closet
    p.add(H.box(THREE, mats.whitePlastic, pw - 0.012, panelH - 0.012, 0.008, { z: PD / 2 - 0.005 }));
    return p;
  }
  const cy = 0.015 + panelH / 2;
  const cxOuter = j0 + pw / 2;              // closed: outer covers left half
  const cxInner = j1 - pw / 2;              // inner parked on right half
  const outer = makePanel(); outer.position.set(cxOuter, cy, zFront);
  const inner = makePanel(); inner.position.set(cxInner, cy, zRear);
  g.add(outer, inner);

  // ---- interior fit-out -----------------------------------------------------
  // white shelf at 1.75 against the back wall, on trim cleats
  g.add(H.box(THREE, mats.trim, openW - 0.004, 0.018, 0.34, { x: w / 2, y: 1.75, z: 0.46, r: 0.003 }));
  g.add(H.box(THREE, mats.trim, 0.02, 0.04, 0.30, { x: j0 + 0.01, y: 1.721, z: 0.46 }));
  g.add(H.box(THREE, mats.trim, 0.02, 0.04, 0.30, { x: j1 - 0.01, y: 1.721, z: 0.46 }));
  g.add(H.box(THREE, mats.trim, openW - 0.01, 0.04, 0.02, { x: w / 2, y: 1.721, z: 0.618 }));

  // chrome hanging rod near the top, below the shelf, with end flanges
  const rodY = 1.66, rodZ = 0.40;
  g.add(H.cyl(THREE, mats.chrome, 0.016, 0.016, openW, { x: w / 2, y: rodY, z: rodZ, rz: Math.PI / 2 }));
  g.add(H.cyl(THREE, mats.chrome, 0.032, 0.032, 0.006, { x: j0 + 0.003, y: rodY, z: rodZ, rz: Math.PI / 2 }));
  g.add(H.cyl(THREE, mats.chrome, 0.032, 0.032, 0.006, { x: j1 - 0.003, y: rodY, z: rodZ, rz: Math.PI / 2 }));

  // 3 simple wire hangers on the rod (furnished state only)
  function makeHanger() {
    const hg = new THREE.Group();
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0032, 8, 16, Math.PI * 1.25), mats.chrome);
    hook.rotation.z = -Math.PI / 2;         // arc end meets the neck; wraps over the rod
    hook.castShadow = hook.receiveShadow = true;
    hg.add(hook);
    hg.add(H.cyl(THREE, mats.chrome, 0.0032, 0.0032, 0.065, { y: -0.0525, seg: 10 }));
    const phi = Math.PI / 2 + Math.atan2(0.075, 0.20);
    hg.add(H.cyl(THREE, mats.chrome, 0.0032, 0.0032, 0.214, { x: 0.10, y: -0.1225, rz: -phi, seg: 10 }));
    hg.add(H.cyl(THREE, mats.chrome, 0.0032, 0.0032, 0.214, { x: -0.10, y: -0.1225, rz: phi, seg: 10 }));
    hg.add(H.cyl(THREE, mats.chrome, 0.0032, 0.0032, 0.40, { y: -0.16, rz: Math.PI / 2, seg: 10 }));
    hg.userData.furnishedOnly = true;
    return hg;
  }
  const hangerX = [w / 2 - 0.18, w / 2, w / 2 + 0.15];
  const hangerJit = [-0.14, 0.09, 0.04];
  for (let i = 0; i < 3; i++) {
    const hg = makeHanger();
    hg.position.set(hangerX[i], rodY - 0.005, rodZ);
    hg.rotation.y = Math.PI / 2 + hangerJit[i]; // shoulders span closet depth
    g.add(hg);
  }

  // ---- blue letter plaque on the soffit -------------------------------------
  const plaqueHex = '#' + COLORS.plaque.toString(16).padStart(6, '0');
  g.add(H.box(THREE, mats.plaque, 0.085, 0.085, 0.005, { x: w / 2, y: 2.42, z: -0.0025, r: 0.002 }));
  const label = H.labelPlane(THREE, 0.072, 0.072, {
    text: letter, bg: plaqueHex, fg: '#eef1f8', font: 'bold 170px Helvetica, Arial',
  });
  label.rotation.y = Math.PI;               // face the room (-z)
  label.position.set(w / 2, 2.42, -0.0055);
  g.add(label);

  // grounding shadow under the volume
  const cs = H.contactShadow(THREE, w * 0.94, D * 0.94, { opacity: 0.2 });
  cs.position.set(w / 2, 0, D / 2);
  g.add(cs);

  // ---- api -------------------------------------------------------------------
  g.userData.api = {
    // t=0 closed; t=1 outer panel slid fully across the inner one (interior revealed)
    setOpen(t) {
      const k = Math.max(0, Math.min(1, t));
      outer.position.x = cxOuter + (cxInner - cxOuter) * k;
    },
  };

  return g;
}
