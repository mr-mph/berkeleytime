// fixtures.js — unit triple: all small fixed items, built in ROOM coordinates.
// 6 duplex outlets, light switch, fin-tube RADIATOR under the window, cork
// pinboard under the loft, flush ceiling LIGHT BOX (api.setLight), 2 sprinkler
// pendents, smoke detector, rubber door floor stop.
// No imports: everything comes from ctx = { THREE, mats, spec, H }.

export function buildFixtures(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { ROOM, LAYOUT, RADIATOR, LIGHTBOX } = spec;
  const root = new THREE.Group();
  root.name = 'fixtures';

  // one-off materials -------------------------------------------------------
  const rubber = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.95 });
  const socketWhite = new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.5 });
  const slotDark = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.8 });
  const recessDark = new THREE.MeshStandardMaterial({ color: 0x2c2b28, roughness: 0.95 });
  const whiteSteel = new THREE.MeshStandardMaterial({ color: 0xf3f2ed, roughness: 0.35, metalness: 0.2 });
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x1c3a24, emissive: 0x2bff66, emissiveIntensity: 1.4, roughness: 0.4,
  });
  const bulbRed = new THREE.MeshStandardMaterial({
    color: 0xb02222, emissive: 0x6e1010, emissiveIntensity: 0.5, roughness: 0.25,
  });
  // dedicated lens instance so toggling emissive never touches shared mats
  const lensMat = mats.lightLens.clone();

  // wall orientation helper: children built facing +z get rotated so the
  // face normal points into the room, then translated onto the wall face.
  //   entry  -> inner face x=0,      normal +x
  //   closet -> inner face x=0,      normal +x (legacy alias)
  //   loft   -> inner face z=0,      normal +z
  //   bunk   -> inner face z=ROOM.W, normal -z
  //   window -> inner face x=ROOM.L, normal -x
  function onWall(g, wall, along, y) {
    if (wall === 'entry' || wall === 'closet') { g.rotation.y = Math.PI / 2; g.position.set(0, y, along); }
    else if (wall === 'window') { g.rotation.y = -Math.PI / 2; g.position.set(ROOM.L, y, along); }
    else if (wall === 'bunk') { g.rotation.y = Math.PI; g.position.set(along, y, ROOM.W); }
    else { g.position.set(along, y, 0); } // 'loft'
    return g;
  }

  // ==========================================================================
  // Duplex outlets — white cover plate + 2 socket faces, per LAYOUT.outlets.
  // (The closet-wall z=3.34 y=1.04 one hides behind the MicroChill — its cord
  // plugs there; the loft-wall x=2.05 y=1.10 one sits behind the cork
  // pinboard; both still modeled so peeking behind reads right.)
  // ==========================================================================
  function makeOutlet() {
    const g = new THREE.Group();
    // cover plate
    g.add(H.box(THREE, mats.whitePlastic, 0.070, 0.115, 0.008, { z: 0.0045, r: 0.002 }));
    // center screw
    g.add(H.cyl(THREE, socketWhite, 0.0032, 0.0032, 0.0025, {
      z: 0.0092, rx: Math.PI / 2, seg: 10, cast: false,
    }));
    for (const sy of [0.0235, -0.0235]) {
      // socket face
      g.add(H.box(THREE, socketWhite, 0.034, 0.037, 0.006, { y: sy, z: 0.0095, r: 0.002 }));
      // two vertical slots
      for (const sx of [-0.0075, 0.0075]) {
        g.add(H.box(THREE, slotDark, 0.0032, 0.0095, 0.002, {
          x: sx, y: sy + 0.0045, z: 0.0128, cast: false,
        }));
      }
      // ground hole
      g.add(H.cyl(THREE, slotDark, 0.0042, 0.0042, 0.002, {
        y: sy - 0.0105, z: 0.0128, rx: Math.PI / 2, seg: 10, cast: false,
      }));
    }
    return g;
  }
  for (const o of LAYOUT.outlets) {
    const g = makeOutlet();
    if (o.wall === 'entry' || o.wall === 'closet' || o.wall === 'window') onWall(g, o.wall, o.z, o.y);
    else onWall(g, o.wall, o.x, o.y);
    root.add(g);
  }

  // ==========================================================================
  // Light switch — just around the upper-left entry corner on the loft wall
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.box(THREE, mats.whitePlastic, 0.075, 0.121, 0.008, { z: 0.0045, r: 0.002 }));
    // rocker, top face proud + slight tilt
    g.add(H.box(THREE, socketWhite, 0.031, 0.064, 0.007, {
      z: 0.0105, rx: -0.05, r: 0.002,
    }));
    // 2 plate screws
    for (const sy of [0.052, -0.052]) {
      g.add(H.cyl(THREE, socketWhite, 0.0032, 0.0032, 0.0025, {
        y: sy, z: 0.0092, rx: Math.PI / 2, seg: 10, cast: false,
      }));
    }
    root.add(onWall(g, LAYOUT.switch.wall, LAYOUT.switch.along, LAYOUT.switch.y));
  }

  // ==========================================================================
  // Radiator — white fin-tube convector cover under the window, behind desk 3
  // (refs triple_top / 9.30.46): sheet-steel cover w 2.55, louvered front
  // band, slotted top grille, proud end caps, wall-mounted 0.10 above floor,
  // supply pipe stub rising from the floor at the +z end.
  // ==========================================================================
  {
    const { w, d, h, y0 } = RADIATOR;               // 2.55 x 0.12 x 0.24, y0 0.10
    const cz = LAYOUT.radiator.cz;
    const z0 = cz - w / 2, z1 = cz + w / 2;         // spans z 0.625..3.175
    const xc = ROOM.L - d / 2;                      // cover center off the wall
    const yc = y0 + h / 2;
    const g = new THREE.Group();

    // front skirt band (below the louver opening)
    g.add(H.box(THREE, mats.radiator, 0.012, 0.06, w - 0.04, {
      x: ROOM.L - d + 0.006, y: y0 + 0.03, z: cz, r: 0.004,
    }));
    // front top rail band (above the louver opening)
    g.add(H.box(THREE, mats.radiator, 0.012, 0.06, w - 0.04, {
      x: ROOM.L - d + 0.006, y: y0 + h - 0.03, z: cz, r: 0.004,
    }));
    // dark recess behind the louver band (reads as interior shadow)
    g.add(H.box(THREE, recessDark, 0.006, 0.12, w - 0.06, {
      x: ROOM.L - d + 0.015, y: yc, z: cz, cast: false,
    }));
    // 5 angled louver slats across the opening (venetian tilt, seen from -x)
    for (let i = 0; i < 5; i++) {
      g.add(H.box(THREE, mats.radiator, 0.026, 0.011, w - 0.06, {
        x: ROOM.L - d + 0.005, y: y0 + 0.072 + i * 0.024, z: cz, rz: 0.6, cast: false,
      }));
    }
    // top panel
    g.add(H.box(THREE, mats.radiator, d - 0.01, 0.012, w - 0.04, {
      x: xc - 0.002, y: y0 + h - 0.006, z: cz, r: 0.004,
    }));
    // slotted top grille: dark channel near the wall side + white cross bars
    g.add(H.box(THREE, recessDark, 0.055, 0.004, w - 0.14, {
      x: ROOM.L - 0.048, y: y0 + h + 0.001, z: cz, cast: false,
    }));
    {
      const n = 26, zg0 = z0 + 0.09, zg1 = z1 - 0.09;
      for (let i = 0; i < n; i++) {
        g.add(H.box(THREE, mats.radiator, 0.055, 0.005, 0.016, {
          x: ROOM.L - 0.048, y: y0 + h + 0.004, z: zg0 + i * ((zg1 - zg0) / (n - 1)),
          cast: false,
        }));
      }
    }
    // proud end caps, both ends
    for (const ez of [z0 + 0.012, z1 - 0.012]) {
      g.add(H.box(THREE, mats.radiator, d + 0.006, h + 0.006, 0.024, {
        x: xc, y: yc, z: ez, r: 0.004,
      }));
    }
    // interior fill so louvers/top slots never show the wall through
    g.add(H.box(THREE, recessDark, 0.10, 0.15, w - 0.05, {
      x: ROOM.L - 0.055, y: y0 + 0.15, z: cz, cast: false,
    }));
    // fin-tube element, glimpsed through the open bottom
    g.add(H.cyl(THREE, mats.brushed, 0.017, 0.017, w - 0.12, {
      x: ROOM.L - 0.055, y: y0 + 0.05, z: cz, rx: Math.PI / 2, seg: 12, cast: false,
    }));
    // supply pipe stub at the +z end: floor escutcheon, riser, elbow into cap
    const px = ROOM.L - 0.06, pz = z1 + 0.045;
    g.add(H.cyl(THREE, mats.brushed, 0.024, 0.026, 0.008, { x: px, y: 0.004, z: pz, seg: 16 }));
    g.add(H.cyl(THREE, mats.brushed, 0.015, 0.015, 0.16, { x: px, y: 0.08, z: pz, seg: 14 }));
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mats.brushed);
    elbow.position.set(px, 0.16, pz);
    elbow.castShadow = true; elbow.receiveShadow = true;
    g.add(elbow);
    g.add(H.cyl(THREE, mats.brushed, 0.015, 0.015, 0.055, {
      x: px, y: 0.16, z: pz - 0.028, rx: Math.PI / 2, seg: 14,
    }));
    // soft floor shadow under the wall-hung cover
    const cs = H.contactShadow(THREE, 0.20, w * 0.97, { opacity: 0.16 });
    cs.position.set(ROOM.L - 0.07, 0, cz);
    g.add(cs);
    root.add(g);
  }

  // ==========================================================================
  // Cork pinboard — LOFT wall (z=0) under the loft deck, above desks A/B
  // (ref 9.32.55): hardboard back + cork face recessed in a thin maple frame,
  // face toward +z. Furred 14 mm off the wall so the loft-wall outlet behind
  // it stays fully behind the back panel. Kept bare (props omitted).
  // ==========================================================================
  {
    const cb = LAYOUT.corkboard;
    const w = cb.x1 - cb.x0, hh = cb.y1 - cb.y0;    // 1.64 x 0.44
    const g = new THREE.Group();
    // hardboard back panel
    g.add(H.box(THREE, mats.woodDark, w, hh, 0.006, { z: 0.005, cast: false }));
    // cork face, recessed behind the frame front
    g.add(H.box(THREE, mats.cork, w - 0.036, hh - 0.036, 0.010, { z: 0.011, r: 0.003 }));
    // thin maple frame
    const fr = H.frame(THREE, mats.wood, w, hh, 0.026, 0.020);
    fr.position.z = 0.012;
    g.add(fr);
    g.position.set((cb.x0 + cb.x1) / 2, (cb.y0 + cb.y1) / 2, 0.014);
    root.add(g);
  }

  // ==========================================================================
  // Ceiling light box — flush rectangular fixture (ref 9.09.54): white steel
  // housing + bottom flange, acrylic lens on a dedicated material instance.
  // userData.isLightbox lets plan view hide it with the ceiling.
  // ==========================================================================
  {
    const { w, d, h } = LIGHTBOX;                   // 1.22 x 0.30 x 0.09
    const t = 0.022;
    const lb = new THREE.Group();
    lb.name = 'lightbox';
    lb.userData.isLightbox = true;
    // housing side walls (long sides along x, short ends)
    for (const sz of [-1, 1]) {
      lb.add(H.box(THREE, whiteSteel, w, h, t, { y: -h / 2, z: sz * (d / 2 - t / 2), r: 0.004 }));
    }
    for (const sx of [-1, 1]) {
      lb.add(H.box(THREE, whiteSteel, t, h, d - 2 * t, { x: sx * (w / 2 - t / 2), y: -h / 2, r: 0.004 }));
    }
    // dark hairline reveal ring just above the lens
    const rev = H.frame(THREE, slotDark, w - 2 * t, d - 2 * t, 0.005, 0.004);
    rev.rotation.x = Math.PI / 2;
    rev.position.y = -h + 0.036;
    H.noShadow(rev);
    lb.add(rev);
    // acrylic lens (emissive toggled by api.setLight)
    lb.add(H.noShadow(H.box(THREE, lensMat, w - 2 * t - 0.006, 0.010, d - 2 * t - 0.006, {
      y: -h + 0.028,
    })));
    // bottom trim flange, slightly proud of the housing
    const fl = H.frame(THREE, whiteSteel, w + 0.024, d + 0.024, 0.020, 0.008);
    fl.rotation.x = Math.PI / 2;
    fl.position.y = -h + 0.004;
    lb.add(fl);
    // 4 corner screws on the flange
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      lb.add(H.cyl(THREE, mats.chrome, 0.003, 0.003, 0.002, {
        x: sx * (w / 2 + 0.002), y: -h - 0.001, z: sz * (d / 2 + 0.002), seg: 8, cast: false,
      }));
    }
    lb.position.set(LAYOUT.lightbox.x, ROOM.H, LAYOUT.lightbox.z);
    root.add(lb);
  }

  // ==========================================================================
  // Sprinkler pendents — chrome escutcheon + body + deflector, on the slab
  // ==========================================================================
  for (const s of LAYOUT.sprinklers) {
    const g = new THREE.Group();
    // escutcheon plate against ceiling
    g.add(H.cyl(THREE, mats.chrome, 0.030, 0.039, 0.014, { y: -0.007, seg: 24 }));
    // drop nipple
    g.add(H.cyl(THREE, mats.chrome, 0.0105, 0.0105, 0.026, { y: -0.026, seg: 16 }));
    // sprinkler frame body
    g.add(H.cyl(THREE, mats.chrome, 0.008, 0.0125, 0.018, { y: -0.047, seg: 16 }));
    // glass bulb
    g.add(H.noShadow(H.cyl(THREE, bulbRed, 0.0032, 0.0042, 0.013, { y: -0.060, seg: 10 })));
    // deflector disc
    g.add(H.cyl(THREE, mats.chrome, 0.0165, 0.0165, 0.0022, { y: -0.068, seg: 20 }));
    // deflector tines hint: two thin cross bars
    g.add(H.box(THREE, mats.chrome, 0.031, 0.0018, 0.004, { y: -0.0665, cast: false }));
    g.add(H.box(THREE, mats.chrome, 0.004, 0.0018, 0.031, { y: -0.0665, cast: false }));
    g.position.set(s.x, ROOM.H, s.z);
    // plan view hides these with the ceiling (main.js checks per-object)
    g.traverse(o => { o.userData.isCeiling = true; });
    root.add(g);
  }

  // ==========================================================================
  // Smoke detector — white disc + green LED, on the slab near the entry
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.cyl(THREE, mats.whitePlastic, 0.068, 0.070, 0.014, { y: -0.007, seg: 28 }));
    g.add(H.cyl(THREE, mats.whitePlastic, 0.058, 0.049, 0.022, { y: -0.025, seg: 28 }));
    // vent slot ring hint
    g.add(H.cyl(THREE, recessDark, 0.0505, 0.0505, 0.006, { y: -0.017, seg: 28, cast: false }));
    // tiny green LED near the rim of the bottom face
    g.add(H.noShadow(H.cyl(THREE, ledGreen, 0.0035, 0.0035, 0.0035, { y: -0.0365, x: 0.028, seg: 10 })));
    g.position.set(LAYOUT.smoke.x, ROOM.H, LAYOUT.smoke.z);
    // plan view hides this with the ceiling (main.js checks per-object)
    g.traverse(o => { o.userData.isCeiling = true; });
    root.add(g);
  }

  // ==========================================================================
  // Door floor stop — brushed base + dark rubber dome, at LAYOUT.doorstop:
  // near the free edge of the 96°-open leaf (hinge on the left entry wall,
  // swinging into +x).
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.cyl(THREE, mats.brushed, 0.021, 0.024, 0.008, { y: 0.004, seg: 20 }));
    g.add(H.cyl(THREE, rubber, 0.011, 0.019, 0.024, { y: 0.020, seg: 20 }));
    g.add(H.cyl(THREE, rubber, 0.0105, 0.011, 0.004, { y: 0.034, seg: 20, cast: false }));
    g.add(H.contactShadow(THREE, 0.10, 0.10, { opacity: 0.22 }));
    g.position.set(LAYOUT.doorstop.x, 0, LAYOUT.doorstop.z);
    root.add(g);
  }

  // --- api ------------------------------------------------------------------
  // idempotent: sets absolute emissive state on the dedicated lens material
  function setLight(on) {
    lensMat.emissive.setHex(on ? 0xfff2d8 : 0x000000);
    lensMat.emissiveIntensity = on ? 2.2 : 0;
  }
  setLight(false);
  root.userData.api = { setLight };

  return root;
}
