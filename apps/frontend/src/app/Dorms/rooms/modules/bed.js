// Blackwell Hall — Twin-XL captain's platform bed + 2-drawer nightstand.
// buildBed(ctx, {variant:'A'|'B'}), buildNightstand(ctx).
// Bed local origin: head-end wall-side corner (variant A head at x=0);
// bed extends +x (length) and +z (width into room), drawers face +z.
// Variant B is a mirror along x (head at local x=BED.L) so main.js places
// both unrotated. Both mattress states are built stacked in place:
//   bare blue vinyl mattress -> userData.moveinOnly
//   made bed (duvet/fold/blanket/pillows) -> userData.furnishedOnly
// No imports — everything comes from ctx = { THREE, mats, spec, H }.

export function buildBed(ctx, { variant = 'A' } = {}) {
  const { THREE, mats, spec, H } = ctx;
  const { BED, COLORS } = spec;
  const L = BED.L, W = BED.W, BH = BED.baseH, toe = BED.toe, PT = BED.postT;

  const g = new THREE.Group();
  g.name = 'bed' + variant;
  // build everything head-at-x=0 in `inner`; mirror the whole thing for B
  const inner = new THREE.Group();
  g.add(inner);

  // slightly shinier one-off vinyl for the dorm mattress
  const vinyl = new THREE.MeshStandardMaterial({ color: COLORS.mattress, roughness: 0.33 });

  // ---- storage platform ---------------------------------------------------
  const kickH = 0.06;              // recessed toe kick (dark, inset by BED.toe)
  const slabY = kickH + 0.015;     // bottom slab lip above kick
  const deckT = 0.025;             // top platform deck
  const bodyY0 = kickH + 0.03, bodyY1 = BH - deckT;      // carcass mid band
  const bodyH = bodyY1 - bodyY0, bodyCY = (bodyY0 + bodyY1) / 2;
  const cubW = 0.52;               // open cubby section width at foot end
  const bankEnd = L - cubW;        // drawer bank spans x 0..bankEnd

  // toe kick (flush at wall side, recessed at front + ends)
  inner.add(H.box(THREE, mats.laminateDark, L - 2 * toe, kickH, W - toe,
    { x: L / 2, y: kickH / 2, z: (W - toe) / 2 }));
  // bottom slab
  inner.add(H.box(THREE, mats.laminate, L, 0.03, W, { x: L / 2, y: slabY, z: W / 2 }));
  // full-length back panel (wall side)
  inner.add(H.box(THREE, mats.laminate, L, bodyH, 0.03, { x: L / 2, y: bodyCY, z: 0.015 }));
  // drawer bank carcass (front face recessed so drawer gaps read dark)
  inner.add(H.box(THREE, mats.laminate, bankEnd, bodyH, W - 0.045,
    { x: bankEnd / 2, y: bodyCY, z: 0.03 + (W - 0.045) / 2 }));

  // cubby section: fill block behind, dark back, two side cheeks, mid shelf
  inner.add(H.box(THREE, mats.laminate, cubW, bodyH, W - 0.475,
    { x: bankEnd + cubW / 2, y: bodyCY, z: 0.03 + (W - 0.475) / 2 }));
  inner.add(H.box(THREE, mats.laminateDark, cubW - 0.04, bodyH, 0.02,
    { x: bankEnd + cubW / 2, y: bodyCY, z: W - 0.45 }));
  inner.add(H.box(THREE, mats.laminate, 0.02, bodyH, 0.43,
    { x: bankEnd + 0.01, y: bodyCY, z: W - 0.225 }));
  inner.add(H.box(THREE, mats.laminate, 0.02, bodyH, 0.43,
    { x: L - 0.01, y: bodyCY, z: W - 0.225 }));
  inner.add(H.box(THREE, mats.laminate, cubW - 0.04, 0.018, 0.43,
    { x: bankEnd + cubW / 2, y: bodyCY, z: W - 0.225, r: 0.004 }));

  // platform deck (rounded lip, slight front overhang)
  inner.add(H.box(THREE, mats.laminate, L, deckT, W + 0.01,
    { x: L / 2, y: BH - deckT / 2, z: W / 2 + 0.005, r: 0.004 }));

  // dark steel corner posts: head pair carries the headboard, foot pair stops
  // just above the deck (caps that retain the mattress corner)
  for (const px of [PT / 2, L - PT / 2]) {
    const isHead = px < L / 2;
    const h = isHead ? BED.headH : BH + 0.06;
    for (const pz of [PT / 2, W - PT / 2]) {
      inner.add(H.box(THREE, mats.metalDark, PT, h, PT, { x: px, y: h / 2, z: pz, r: 0.003 }));
    }
  }

  // thin dark steel mattress-retainer angles on the deck (front + foot end)
  inner.add(H.box(THREE, mats.metalDark, L - 0.14, 0.028, 0.014,
    { x: L / 2, y: BH + 0.014, z: W - 0.005 }));
  inner.add(H.box(THREE, mats.metalDark, 0.014, 0.028, W - 0.14,
    { x: L - 0.016, y: BH + 0.014, z: W / 2 }));

  // ---- headboard: laminate panel between the head posts + steel top rail --
  // ref06: tall driftwood panel fills the post gap, flat steel rail above it,
  // posts rise a few cm past the rail. Keep the infill just inside the post
  // face instead of intersecting it; overlapping coplanar wood/steel faces
  // caused the texture flicker seen on both head posts.
  const headboardT = 0.028, headboardX = PT + headboardT / 2 + 0.001;
  const headboardW = W - 2 * PT - 0.008;
  inner.add(H.box(THREE, mats.laminate, headboardT, 0.44, headboardW,
    { x: headboardX, y: 0.89, z: W / 2, r: 0.004 }));
  inner.add(H.box(THREE, mats.metalDark, headboardT, 0.04, headboardW,
    { x: headboardX, y: 1.13, z: W / 2, r: 0.003 }));

  // ---- drawer fronts: 2 cols x 2 rows with routed finger slots (ref08/ref10)
  const fx0 = 0.06, fx1 = bankEnd - 0.01, gap = 0.010;
  const fw = (fx1 - fx0 - gap) / 2;
  const fy0 = 0.10, fy1 = bodyY1 - 0.02;
  const fh = (fy1 - fy0 - gap) / 2;
  const faceZ = W - 0.015;                    // recessed carcass face plane
  for (let i = 0; i < 2; i++) {
    const cx = fx0 + fw / 2 + i * (fw + gap);
    for (let r = 0; r < 2; r++) {
      const cy = fy0 + fh / 2 + r * (fh + gap);
      inner.add(H.box(THREE, mats.laminate, fw, fh, 0.022,
        { x: cx, y: cy, z: faceZ + 0.011, r: 0.004 }));
      // routed finger slot: dark recess bar near the top edge of each front
      inner.add(H.box(THREE, mats.laminateDark, 0.14, 0.02, 0.008,
        { x: cx, y: cy + fh / 2 - 0.028, z: faceZ + 0.022 + 0.002, r: 0.003 }));
    }
  }

  // ---- move-in state: bare royal-blue vinyl mattress with piped seams -----
  const mi = new THREE.Group();
  mi.userData.moveinOnly = true;
  mi.add(H.box(THREE, vinyl, BED.mattL, BED.mattH, BED.mattW,
    { x: L / 2, y: BH + BED.mattH / 2, z: W / 2, r: 0.05 }));
  const e = 0.012, rP = 0.0085;
  const hl = BED.mattL / 2 - e, hw = BED.mattW / 2 - e;
  const sphereGeo = new THREE.SphereGeometry(rP, 8, 6);
  for (const y of [BH + BED.mattH - 0.016, BH + 0.016]) {
    for (const sz of [-1, 1]) {
      mi.add(H.cyl(THREE, vinyl, rP, rP, 2 * hl,
        { x: L / 2, y, z: W / 2 + sz * hw, rz: Math.PI / 2, seg: 10 }));
      mi.add(H.cyl(THREE, vinyl, rP, rP, 2 * hw,
        { x: L / 2 + sz * hl, y, z: W / 2, rx: Math.PI / 2, seg: 10 }));
      for (const sx of [-1, 1]) {   // corner beads close the piping ring
        const s = new THREE.Mesh(sphereGeo, vinyl);
        s.position.set(L / 2 + sx * hl, y, W / 2 + sz * hw);
        s.castShadow = s.receiveShadow = true;
        mi.add(s);
      }
    }
  }
  // pillow-top seam ring on the side faces, a few cm below the top (ref10);
  // pipes stop short of the rounded vertical corners
  const yPT = BH + BED.mattH - 0.058, rPT = 0.006;
  for (const sz of [-1, 1]) {
    mi.add(H.cyl(THREE, vinyl, rPT, rPT, BED.mattL - 0.10,
      { x: L / 2, y: yPT, z: W / 2 + sz * (BED.mattW / 2 - 0.001), rz: Math.PI / 2, seg: 8 }));
    mi.add(H.cyl(THREE, vinyl, rPT, rPT, BED.mattW - 0.10,
      { x: L / 2 + sz * (BED.mattL / 2 - 0.001), y: yPT, z: W / 2, rx: Math.PI / 2, seg: 8 }));
  }
  inner.add(mi);

  // ---- furnished state: made bed ------------------------------------------
  const fu = new THREE.Group();
  fu.userData.furnishedOnly = true;
  // sheeted mattress
  fu.add(H.box(THREE, mats.pillow, BED.mattL, 0.18, BED.mattW,
    { x: L / 2, y: BH + 0.09, z: W / 2, r: 0.045 }));
  // duvet slab draped over (hangs past the front edge)
  const dx0 = 0.52, dx1 = L + 0.005;
  fu.add(H.box(THREE, mats.duvet, dx1 - dx0, 0.16, 1.02,
    { x: (dx0 + dx1) / 2, y: 0.84, z: W / 2 + 0.015, r: 0.03 }));
  // drape flap: duvet falls ~12 cm down the room-side (+z) face of the base
  fu.add(H.box(THREE, mats.duvet, dx1 - dx0, 0.13, 0.02,
    { x: (dx0 + dx1) / 2, y: 0.705, z: W + 0.012, r: 0.008 }));
  // turned-back fold at the duvet head edge (sheet color)
  fu.add(H.box(THREE, mats.pillow, 0.15, 0.04, 1.00,
    { x: dx0 + 0.08, y: 0.925, z: W / 2 + 0.015, r: 0.015 }));
  // folded gray blanket across the foot: thicker band + drape flap that
  // hangs over the room-side edge (reads as a real folded blanket, not a mat)
  const bw = 0.60, bx = L - 0.35;
  fu.add(H.box(THREE, mats.blanket, bw, 0.045, 1.00,
    { x: bx, y: 0.9425, z: W / 2 + 0.025, r: 0.018 }));
  fu.add(H.box(THREE, mats.blanket, bw, 0.07, 0.022,
    { x: bx, y: 0.905, z: W + 0.031, r: 0.010 }));
  // two pillows lying flat at the head, propped slightly on the headboard —
  // low profile keeps the driftwood panel visible between the posts (ref06)
  fu.add(H.box(THREE, mats.pillow, 0.44, 0.13, 0.48,
    { x: 0.26, y: 0.90, z: 0.27, r: 0.05, rz: -0.18, ry: 0.05 }));
  fu.add(H.box(THREE, mats.pillow, 0.44, 0.13, 0.48,
    { x: 0.27, y: 0.895, z: 0.72, r: 0.05, rz: -0.14, ry: -0.04 }));
  inner.add(fu);

  // soft AO under the platform
  const shadow = H.contactShadow(THREE, L + 0.08, W + 0.10, { opacity: 0.3 });
  shadow.position.set(L / 2, 0, W / 2);
  inner.add(shadow);

  if (variant === 'B') {          // mirror along x: head ends up at x = L
    inner.scale.x = -1;
    inner.position.x = L;
  }
  return g;
}

export function buildNightstand(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { w, d, h } = spec.NIGHTSTAND;

  const g = new THREE.Group();
  g.name = 'nightstand';

  // recessed kick (flush at wall side)
  g.add(H.box(THREE, mats.laminateDark, w - 0.06, 0.05, d - 0.03,
    { x: w / 2, y: 0.025, z: (d - 0.03) / 2 }));
  // carcass (front face recessed behind the drawer fronts)
  const bodyH = h - 0.05 - 0.025;
  g.add(H.box(THREE, mats.laminate, w, bodyH, d - 0.012,
    { x: w / 2, y: 0.05 + bodyH / 2, z: (d - 0.012) / 2 }));
  // rounded top with a small front/side overhang, back edge flush at z=0
  g.add(H.box(THREE, mats.laminate, w + 0.012, 0.025, d + 0.008,
    { x: w / 2, y: h - 0.0125, z: (d + 0.008) / 2, r: 0.004 }));

  // two drawer fronts + brushed edge pulls
  const fy0 = 0.06, fy1 = 0.05 + bodyH - 0.007, gap = 0.007;
  const fh = (fy1 - fy0 - gap) / 2;
  for (let i = 0; i < 2; i++) {
    const cy = fy0 + fh / 2 + i * (fh + gap);
    g.add(H.box(THREE, mats.laminate, w - 0.05, fh, 0.02,
      { x: w / 2, y: cy, z: d - 0.012 + 0.010, r: 0.004 }));
    g.add(H.box(THREE, mats.brushed, 0.11, 0.024, 0.013,
      { x: w / 2, y: cy + fh / 2 - 0.032, z: d + 0.008 + 0.0065, r: 0.003 }));
  }

  const shadow = H.contactShadow(THREE, w + 0.10, d + 0.08, { opacity: 0.28 });
  shadow.position.set(w / 2, 0, d / 2);
  g.add(shadow);

  return g;
}
