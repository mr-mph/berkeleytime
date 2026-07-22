// Units 1–3 triple — honey-maple loftable bed system (Berkeley rung frames).
// buildBed(ctx, {variant:'bunk'|'loft'}), buildLadder(ctx, {topY}).
// Bed local origin: HEAD end, wall-side corner; frame extends +x (length) and
// +z (width into the room). bunk: head stays at local x=0 (placed at the
// entry wall). loft: head at the +x end — the whole frame is mirrored along x
// (Blackwell variant-B trick) so main.js places both without rotation.
// End frames read as ladders (refs 9.30.59 / 9.31.10): a post pair joined by
// BED.rungN flat rungs, dowel-pin hardware down each post. Every deck carries
// BOTH mattress states stacked in place:
//   bare navy vinyl w/ piping + seams  -> userData.moveinOnly  (ref 9.31.17)
//   fitted sheet + duvet fold + pillow -> userData.furnishedOnly
// Under-loft volume stays empty — desk 3 + pinboard are separate modules.
// No imports — everything comes from ctx = { THREE, mats, spec, H }.

export function buildBed(ctx, { variant = 'bunk' } = {}) {
  const { THREE, mats, spec, H } = ctx;
  const { BED, COLORS } = spec;
  const L = BED.L, W = BED.W, PW = BED.postW, PD = BED.postD;
  const V = BED[variant];
  const decks = variant === 'bunk' ? [BED.bunk.deckLo, BED.bunk.deckHi]
                                   : [BED.loft.deck];
  const topDeck = decks[decks.length - 1];

  const g = new THREE.Group();
  g.name = 'bed-' + variant;
  const inner = new THREE.Group();          // built head-at-x=0; mirrored for loft
  g.add(inner);

  // one-off glossier vinyl for the bare dorm mattress (photos: shiny navy)
  const vinyl = new THREE.MeshStandardMaterial({ color: COLORS.mattress, roughness: 0.32 });
  const sphereGeo = new THREE.SphereGeometry(0.0085, 8, 6);
  // pin holes read as shadowed wood, not hardware (QA: metalDark discs were
  // huge black dots up close; refs 9.30.59 show small subtle holes)
  const pinHole = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.woodDark).multiplyScalar(0.62), roughness: 0.95 });

  // ---- end frames: post pair + rungN flat rungs (ladder-like) -------------
  // posts are planks PW thin along x, PD wide along z, so the frame reads as
  // a ladder when seen from the bed end (ref 9.31.10 loft foot view)
  const rY0 = 0.36, rStep = (V.postH - 0.25 - rY0) / (BED.rungN - 1);
  for (const fx of [PW / 2, L - PW / 2]) {
    const sx = fx < L / 2 ? -1 : 1;                    // outward x direction
    for (const pz of [PD / 2, W - PD / 2]) {
      inner.add(H.box(THREE, mats.wood, PW, V.postH, PD,
        { x: fx, y: V.postH / 2, z: pz, r: 0.004 }));
      // dowel-pin holes down the post at each rung level (loftable system):
      // small near-flush dark-wood discs, subtle per the reference photos
      for (let i = 0; i < BED.rungN; i++)
        inner.add(H.cyl(THREE, pinHole, 0.005, 0.005, 0.0035,
          { x: fx + sx * (PW / 2 + 0.001), y: rY0 + i * rStep, z: pz,
            rz: Math.PI / 2, seg: 12 }));
    }
    // flat board rungs let into the posts
    for (let i = 0; i < BED.rungN; i++)
      inner.add(H.box(THREE, mats.wood, 0.022, 0.085, W - 2 * PD + 0.01,
        { x: fx, y: rY0 + i * rStep, z: W / 2, r: 0.003 }));
  }

  // ---- decks: pinned side rails + ledger strips + visible slats -----------
  const railT = 0.04;                       // side-rail thickness (z)
  function addMattress(d, guarded) {
    const mcy = d + BED.mattH / 2;
    // -- move-in: bare navy vinyl, piped edges + pillow-top seam ring --------
    const mi = new THREE.Group();
    mi.userData.moveinOnly = true;
    mi.add(H.box(THREE, vinyl, BED.mattL, BED.mattH, BED.mattW,
      { x: L / 2, y: mcy, z: W / 2, r: 0.05 }));
    const e = 0.012, rP = 0.0085;
    const hl = BED.mattL / 2 - e, hw = BED.mattW / 2 - e;
    for (const y of [d + BED.mattH - 0.016, d + 0.016]) {
      for (const s of [-1, 1]) {
        mi.add(H.cyl(THREE, vinyl, rP, rP, 2 * hl,
          { x: L / 2, y, z: W / 2 + s * hw, rz: Math.PI / 2, seg: 10 }));
        mi.add(H.cyl(THREE, vinyl, rP, rP, 2 * hw,
          { x: L / 2 + s * hl, y, z: W / 2, rx: Math.PI / 2, seg: 10 }));
        for (const sx of [-1, 1]) {         // corner beads close the piping ring
          const b = new THREE.Mesh(sphereGeo, vinyl);
          b.position.set(L / 2 + sx * hl, y, W / 2 + s * hw);
          b.castShadow = b.receiveShadow = true;
          mi.add(b);
        }
      }
    }
    // pillow-top seam on the side faces + two panel seams across the top
    const yPT = d + BED.mattH - 0.058;
    for (const s of [-1, 1]) {
      mi.add(H.cyl(THREE, vinyl, 0.006, 0.006, BED.mattL - 0.10,
        { x: L / 2, y: yPT, z: W / 2 + s * (BED.mattW / 2 - 0.001), rz: Math.PI / 2, seg: 8 }));
      mi.add(H.cyl(THREE, vinyl, 0.006, 0.006, BED.mattW - 0.10,
        { x: L / 2 + s * (BED.mattL / 2 - 0.001), y: yPT, z: W / 2, rx: Math.PI / 2, seg: 8 }));
      mi.add(H.cyl(THREE, vinyl, 0.004, 0.004, BED.mattW - 0.08,
        { x: L / 2 + s * 0.34, y: d + BED.mattH - 0.002, z: W / 2, rx: Math.PI / 2, seg: 8 }));
    }
    inner.add(mi);

    // -- furnished: fitted sheet + duvet w/ turned-down fold + pillow --------
    const fu = new THREE.Group();
    fu.userData.furnishedOnly = true;
    fu.add(H.box(THREE, mats.sheet, BED.mattL, BED.mattH, BED.mattW,
      { x: L / 2, y: mcy, z: W / 2, r: 0.045 }));
    const dx0 = 0.52, dx1 = L - 0.03;
    // duvet slab: stays inside the rail on guarded top decks (the guard owns
    // the overhang plane); overhangs the room-side rail on the open lower bunk
    const dvW = guarded ? BED.mattW + 0.04 : BED.mattW + 0.09;
    const dvZ = guarded ? W / 2 + 0.005 : W / 2 + 0.02;
    fu.add(H.box(THREE, mats.duvet, dx1 - dx0, 0.13, dvW,
      { x: (dx0 + dx1) / 2, y: d + 0.24, z: dvZ, r: 0.03 }));
    // drape flap over the room-side rail (ref 9.30.59): tucked between rail
    // and guard on top decks, stopping short of the ladder hooks
    const fx1 = guarded ? L - 0.62 : dx1;
    const fz = guarded ? W - 0.008 : W + 0.006;
    fu.add(H.box(THREE, mats.duvet, fx1 - dx0, 0.26, 0.022,
      { x: (dx0 + fx1) / 2, y: d + 0.15, z: fz, r: 0.010 }));
    // turned-back sheet fold at the duvet head edge
    fu.add(H.box(THREE, mats.sheet, 0.16, 0.035, dvW - 0.03,
      { x: dx0 + 0.06, y: d + 0.315, z: dvZ, r: 0.012 }));
    // pillow propped a touch on the head-end rungs
    fu.add(H.box(THREE, mats.pillow, 0.42, 0.12, 0.58,
      { x: 0.30, y: d + BED.mattH + 0.045, z: W / 2, r: 0.05, rz: -0.16, ry: 0.04 }));
    inner.add(fu);
  }

  for (const d of decks) {
    // side rails (railH deep) pinned between the end-frame posts
    for (const rz of [railT / 2 + 0.02, W - railT / 2 - 0.02])
      inner.add(H.box(THREE, mats.wood, L - 2 * PW, BED.railH, railT,
        { x: L / 2, y: d + 0.04 - BED.railH / 2, z: rz, r: 0.004 }));
    // dark ledger strips inside the rails carry the slat deck
    for (const lz of [0.0725, W - 0.0725])
      inner.add(H.box(THREE, mats.woodDark, L - 2 * PW - 0.02, 0.02, 0.025,
        { x: L / 2, y: d - 0.028, z: lz }));
    // slat boards, undersides/ends visible below the mattress edge (ref 9.32.55)
    const slatN = 8, sx0 = 0.16, sx1 = L - 0.16;
    for (let i = 0; i < slatN; i++)
      inner.add(H.box(THREE, mats.wood, 0.075, 0.018, W - 0.12,
        { x: sx0 + (sx1 - sx0) * i / (slatN - 1), y: d - 0.009, z: W / 2, r: 0.003 }));
    // rail-to-post pin bolts, two per junction on the post end faces
    for (const [fx, sx] of [[0, -1], [L, 1]])
      for (const rz of [railT / 2 + 0.02, W - railT / 2 - 0.02])
        for (const dy of [-0.032, 0.032])
          inner.add(H.cyl(THREE, mats.metalDark, 0.007, 0.007, 0.009,
            { x: fx + sx * 0.002, y: d + 0.04 - BED.railH / 2 + dy, z: rz,
              rz: Math.PI / 2, seg: 10 }));
    addMattress(d, d === topDeck);
  }

  // ---- guard rail on the room side (+z) of the top deck -------------------
  // long plank on two flat uprights bolted to the side rail, biased toward
  // the head so the ladder keeps the foot-end corner (refs 9.30.59 / jpg)
  const grL = 1.42, grCx = L / 2 - 0.20, grTop = topDeck + V.guardH;
  for (const ux of [grCx - grL / 2 + 0.16, grCx + grL / 2 - 0.16]) {
    inner.add(H.box(THREE, mats.wood, 0.07, 0.34, 0.024,
      { x: ux, y: grTop - 0.20, z: W - 0.008, r: 0.003 }));
    for (const dy of [-0.05, 0.05])                    // carriage bolts
      inner.add(H.cyl(THREE, mats.metalDark, 0.007, 0.007, 0.008,
        { x: ux, y: topDeck - 0.02 + dy, z: W + 0.006, rx: Math.PI / 2, seg: 10 }));
  }
  inner.add(H.box(THREE, mats.wood, grL, 0.09, 0.03,
    { x: grCx, y: grTop - 0.045, z: W + 0.019, r: 0.004 }));

  // ---- angled hook ladder at the foot end, room side ----------------------
  const ladder = buildLadder(ctx, { topY: topDeck + 0.04 });
  ladder.position.set(L - 0.32, 0, W - 0.02);   // hook plane = rail outer face
  inner.add(ladder);

  // ---- soft AO under the footprint (loft keeps mid-floor clear for desk 3)
  if (variant === 'bunk') {
    const sh = H.contactShadow(THREE, L + 0.10, W + 0.16, { opacity: 0.30 });
    sh.position.set(L / 2, 0, W / 2);
    inner.add(sh);
  } else {
    for (const fx of [0.30, L - 0.30]) {
      const sh = H.contactShadow(THREE, 0.70, W + 0.14, { opacity: 0.26 });
      sh.position.set(fx, 0, W / 2);
      inner.add(sh);
    }
  }

  if (variant === 'loft') {                 // mirror along x: head ends at x=L
    inner.scale.x = -1;
    inner.position.x = L;
  }
  return g;
}

// Angled hook ladder (LADDER dims): two plank rails wide-face to the climber
// + 4 flat rungs (same stock as the bed end frames), brushed steel straps
// that curl over a deck rail, rubber feet on the carpet (refs 9.30.59 / jpg).
// Local origin: floor point directly under the hook plane (z=0 = outer face
// of the bed's side rail); feet land at z = +LADDER.lean. buildBed places it
// at the foot end, room side; standalone default hooks at loft-rail height.
export function buildLadder(ctx, { topY } = {}) {
  const { THREE, mats, spec, H } = ctx;
  const { LADDER, BED } = spec;
  const hookY = topY ?? BED.loft.deck + 0.04;
  const th = Math.atan2(LADDER.lean, hookY);
  const s = Math.sin(th), c = Math.cos(th);
  const slope = Math.hypot(hookY, LADDER.lean);
  const railW = 0.075, len = slope + 0.12;         // rails run past the hooks

  const g = new THREE.Group();
  g.name = 'ladder';

  for (const side of [-1, 1]) {
    const cx = side * (LADDER.w / 2 - railW / 2);
    g.add(H.box(THREE, mats.wood, railW, len, LADDER.railT,
      { x: cx, y: c * len / 2, z: LADDER.lean - s * len / 2, rx: -th, r: 0.004 }));
    // steel hook: strap over the bed rail top + short drop on its inner face
    g.add(H.box(THREE, mats.brushed, 0.05, 0.014, 0.085,
      { x: cx, y: hookY + 0.055, z: -0.028, r: 0.003 }));
    g.add(H.box(THREE, mats.brushed, 0.05, 0.075, 0.012,
      { x: cx, y: hookY + 0.02, z: -0.058, r: 0.003 }));
    // rubber foot pad
    g.add(H.box(THREE, mats.chairBase, railW + 0.006, 0.024, 0.055,
      { x: cx, y: 0.012, z: LADDER.lean, r: 0.003 }));
  }

  // 4 flat rungs evenly spaced up the slope, pinned through the rails
  const nR = 4, innerW = LADDER.w - 2 * railW + 0.02;
  for (let i = 1; i <= nR; i++) {
    const y = hookY * i / (nR + 1);
    const z = LADDER.lean * (1 - y / hookY);
    g.add(H.box(THREE, mats.wood, innerW, 0.075, LADDER.rungT,
      { x: 0, y, z, rx: -th, r: 0.003 }));
    for (const side of [-1, 1])                      // pin heads on the rails
      g.add(H.cyl(THREE, mats.metalDark, 0.006, 0.006, 0.008,
        { x: side * (LADDER.w / 2 - railW / 2), y: y + s * 0.02, z: z + c * 0.02,
          rx: Math.PI / 2 - th, seg: 10 }));
  }

  const sh = H.contactShadow(THREE, 0.55, 0.26, { opacity: 0.22 });
  sh.position.set(0, 0, LADDER.lean);
  g.add(sh);
  return g;
}
