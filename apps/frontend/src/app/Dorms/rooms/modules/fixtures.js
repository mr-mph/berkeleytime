// fixtures.js — all small wall/ceiling-mounted items, built in ROOM coordinates.
// Towel bar + towels, robe hooks, 7 duplex outlets, light switch, thermostat,
// HVAC grille, sprinkler pendents, smoke detector, door floor stop.
// No imports: everything comes from ctx = { THREE, mats, spec, H }.

export function buildFixtures(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { ROOM, LAYOUT, STUBS } = spec;
  const root = new THREE.Group();
  root.name = 'fixtures';

  // one-off materials -------------------------------------------------------
  const rubber = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.95 });
  const ductDark = new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.9 });
  const socketWhite = new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.5 });
  const slotDark = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.8 });
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x1c3a24, emissive: 0x2bff66, emissiveIntensity: 1.4, roughness: 0.4,
  });
  const bulbRed = new THREE.MeshStandardMaterial({
    color: 0xb02222, emissive: 0x6e1010, emissiveIntensity: 0.5, roughness: 0.25,
  });

  // wall orientation helper: children built facing +z get rotated so the
  // face normal points into the room, then translated onto the wall face.
  //   entry  -> inner face x=0,      normal +x
  //   window -> inner face x=ROOM.L, normal -x
  //   bed    -> inner face z=0,      normal +z
  //   closet -> inner face z=ROOM.W, normal -z
  function onWall(g, wall, along, y) {
    if (wall === 'entry') { g.rotation.y = Math.PI / 2; g.position.set(0, y, along); }
    else if (wall === 'window') { g.rotation.y = -Math.PI / 2; g.position.set(ROOM.L, y, along); }
    else if (wall === 'closet') { g.rotation.y = Math.PI; g.position.set(along, y, ROOM.W); }
    else { g.position.set(along, y, 0); } // 'bed' / 'niche'
    return g;
  }

  // ==========================================================================
  // Towel bar — brushed, two end posts + rod, closet wall flat section
  // ==========================================================================
  {
    const tb = LAYOUT.towelBar;
    const rodR = 0.0095, standoff = 0.062;
    const rodZ = ROOM.W - standoff;
    const bar = new THREE.Group();
    // rod along x
    bar.add(H.cyl(THREE, mats.brushed, rodR, rodR, tb.x1 - tb.x0, {
      x: (tb.x0 + tb.x1) / 2, y: tb.y, z: rodZ, rz: Math.PI / 2, seg: 18,
    }));
    for (const px of [tb.x0 + 0.014, tb.x1 - 0.014]) {
      // wall flange
      bar.add(H.cyl(THREE, mats.brushed, 0.017, 0.019, 0.008, {
        x: px, y: tb.y, z: ROOM.W - 0.004, rx: Math.PI / 2, seg: 20,
      }));
      // post arm from wall to rod
      bar.add(H.cyl(THREE, mats.brushed, 0.0075, 0.0075, standoff - 0.006, {
        x: px, y: tb.y, z: ROOM.W - 0.006 - (standoff - 0.006) / 2, rx: Math.PI / 2, seg: 14,
      }));
    }
    // rod end finials
    for (const px of [tb.x0 - 0.004, tb.x1 + 0.004]) {
      bar.add(H.cyl(THREE, mats.brushed, 0.0115, 0.0115, 0.009, {
        x: px, y: tb.y, z: rodZ, rz: Math.PI / 2, seg: 16,
      }));
    }
    root.add(bar);

    // draped towels (furnishedOnly): thin folded slabs hanging both sides
    const towels = [
      { mat: mats.towelA, cx: 0.305, w: 0.27, dropF: 0.46, dropB: 0.32 },
      { mat: mats.towelB, cx: 0.615, w: 0.22, dropF: 0.40, dropB: 0.27 },
    ];
    for (const t of towels) {
      const tw = new THREE.Group();
      tw.userData.furnishedOnly = true;
      const th = 0.008; // fabric thickness
      const zF = rodZ - rodR - th / 2 - 0.002; // room-side face of rod
      const zB = rodZ + rodR + th / 2 + 0.002; // wall-side face of rod
      const topY = tb.y + rodR + th / 2 + 0.003;
      // front hanging panel
      tw.add(H.box(THREE, t.mat, t.w, t.dropF, th, {
        x: t.cx, y: topY - 0.004 - t.dropF / 2, z: zF, r: 0.003,
      }));
      // back hanging panel (between rod and wall)
      tw.add(H.box(THREE, t.mat, t.w, t.dropB, th, {
        x: t.cx, y: topY - 0.004 - t.dropB / 2, z: zB, r: 0.003,
      }));
      // fold cap bridging over the rod
      tw.add(H.box(THREE, t.mat, t.w, th, zB - zF + th, {
        x: t.cx, y: topY, z: rodZ, r: 0.003,
      }));
      root.add(tw);
    }
  }

  // ==========================================================================
  // Robe hooks — brushed backplate + curled arm with ball tip
  // ==========================================================================
  for (const hk of LAYOUT.hooks) {
    const g = new THREE.Group();
    // backplate
    g.add(H.box(THREE, mats.brushed, 0.022, 0.062, 0.008, { z: 0.004, r: 0.003 }));
    // arm out from wall
    g.add(H.cyl(THREE, mats.brushed, 0.0062, 0.0062, 0.042, {
      y: -0.012, z: 0.008 + 0.021, rx: Math.PI / 2, seg: 12,
    }));
    // upward curl
    g.add(H.cyl(THREE, mats.brushed, 0.0062, 0.0062, 0.034, {
      y: -0.012 + 0.014, z: 0.049, rx: 0.35, seg: 12,
    }));
    // ball tip
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 10), mats.brushed);
    ball.position.set(0, 0.019, 0.055);
    ball.castShadow = true; ball.receiveShadow = true;
    g.add(ball);
    root.add(onWall(g, 'closet', hk.x, hk.y));
  }

  // ==========================================================================
  // Duplex outlets — white cover plate + 2 socket faces, per LAYOUT.outlets
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
  const nicheX = (STUBS.s1x + STUBS.t + STUBS.s2x) / 2;
  for (const o of LAYOUT.outlets) {
    const g = makeOutlet();
    if (o.wall === 'entry' || o.wall === 'window') onWall(g, o.wall, o.z, o.y);
    else if (o.wall === 'niche') onWall(g, 'bed', nicheX, o.y);
    else onWall(g, o.wall, o.x, o.y);
    root.add(g);
  }

  // ==========================================================================
  // Light switch — plate + Decora rocker, entry wall bed-side of door
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
    root.add(onWall(g, 'entry', LAYOUT.switch.z, LAYOUT.switch.y));
  }

  // ==========================================================================
  // Thermostat — white rounded box + LCD reading 71, window wall
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.box(THREE, mats.whitePlastic, 0.088, 0.088, 0.024, { z: 0.0125, r: 0.006 }));
    const lcd = H.labelPlane(THREE, 0.046, 0.026, {
      text: '71', bg: '#cdd6c6', fg: '#222c22', font: 'bold 100px Helvetica, Arial',
    });
    lcd.position.set(0, 0.014, 0.0252);
    g.add(lcd);
    // two small buttons below the LCD
    for (const bx of [-0.012, 0.012]) {
      g.add(H.box(THREE, socketWhite, 0.016, 0.008, 0.003, {
        x: bx, y: -0.018, z: 0.0255, r: 0.001, cast: false,
      }));
    }
    root.add(onWall(g, 'window', LAYOUT.thermostat.z, LAYOUT.thermostat.y));
  }

  // ==========================================================================
  // HVAC grille — white louvered, window wall high on bed side
  // ==========================================================================
  {
    const v = LAYOUT.vent;
    const g = new THREE.Group();
    // soft light-gray recess: reads as shadow lines between white louvers
    // (refs ref01/ref08 show the grille as near-flat white, not dark-striped)
    const grilleShadow = new THREE.MeshStandardMaterial({
      color: 0xb5b2aa, roughness: 0.95,
    });
    g.add(H.box(THREE, grilleShadow, v.w - 0.03, v.h - 0.03, 0.004, {
      z: 0.0021, cast: false,
    }));
    // face frame
    const fr = H.frame(THREE, mats.whitePlastic, v.w, v.h, 0.022, 0.014);
    fr.position.z = 0.008;
    g.add(fr);
    // 9 nearly-closed white louver slats, hairline gaps only
    const innerW = v.w - 0.040, innerH = v.h - 0.044;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const ly = -innerH / 2 + (i + 0.5) * (innerH / n);
      g.add(H.box(THREE, mats.whitePlastic, innerW, 0.005, 0.024, {
        y: ly, z: 0.007, rx: 0.55, cast: false,
      }));
    }
    root.add(onWall(g, 'window', v.z, v.y));
  }

  // ==========================================================================
  // Sprinkler pendents — chrome escutcheon + body + deflector, at ceiling
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
    root.add(g);
  }

  // ==========================================================================
  // Smoke detector — white disc + green LED, at ceiling
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.cyl(THREE, mats.whitePlastic, 0.068, 0.070, 0.014, { y: -0.007, seg: 28 }));
    g.add(H.cyl(THREE, mats.whitePlastic, 0.058, 0.049, 0.022, { y: -0.025, seg: 28 }));
    // vent slot ring hint
    g.add(H.cyl(THREE, ductDark, 0.0505, 0.0505, 0.006, { y: -0.017, seg: 28, cast: false }));
    // tiny green LED near the rim of the bottom face
    g.add(H.noShadow(H.cyl(THREE, ledGreen, 0.0035, 0.0035, 0.0035, { y: -0.0365, x: 0.028, seg: 10 })));
    g.position.set(LAYOUT.smoke.x, ROOM.H, LAYOUT.smoke.z);
    root.add(g);
  }

  // ==========================================================================
  // Door floor stop — brushed base + dark rubber dome, in the door sweep
  // ==========================================================================
  {
    const g = new THREE.Group();
    g.add(H.cyl(THREE, mats.brushed, 0.021, 0.024, 0.008, { y: 0.004, seg: 20 }));
    g.add(H.cyl(THREE, rubber, 0.011, 0.019, 0.024, { y: 0.020, seg: 20 }));
    g.add(H.cyl(THREE, rubber, 0.0105, 0.011, 0.004, { y: 0.034, seg: 20, cast: false }));
    g.add(H.contactShadow(THREE, 0.10, 0.10, { opacity: 0.22 }));
    // on the hinge line (z = DOOR.hingeZ): leaf face meets the dome right at
    // maxOpenDeg 86° (0.80*cos86° ≈ leaf thickness + dome radius)
    g.position.set(0.80, 0, 2.71);
    root.add(g);
  }

  return root;
}
