// ============================================================================
// doorwin.js — entry door (hollow-metal frame, graphite leaf, hardware) and
// window (bronze aluminum frame, glazing, stool sill, roller shade) plus the
// exterior backdrop (sky gradient, neighboring buildings, ground).
// Contract: buildDoor(ctx), buildWindow(ctx); ctx = { THREE, mats, spec, H }.
// No imports — everything comes through ctx.
// ============================================================================

const hasDOM = typeof document !== 'undefined';

// deterministic PRNG (matches materials.js style) so renders are reproducible
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTex(THREE, w, h, draw) {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// simple curtain-wall facade: base color + dark window grid + floor lines
function facadeTex(THREE, base, win, cols, rows, seed) {
  return canvasTex(THREE, 256, 320, (c, w, h) => {
    const rand = rng(seed);
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 0, w, 8); // parapet shadow
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) {
      c.fillStyle = 'rgba(0,0,0,0.06)';
      c.fillRect(0, r * ch, w, 2); // floor line
      for (let k = 0; k < cols; k++) {
        c.fillStyle = win;
        c.fillRect(k * cw + cw * 0.22, r * ch + ch * 0.24, cw * 0.56, ch * 0.50);
        // sky reflection streak on the upper part of each pane
        c.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.10})`;
        c.fillRect(k * cw + cw * 0.22, r * ch + ch * 0.24, cw * 0.56, ch * 0.18);
      }
    }
  });
}

// transparent overlay of randomly lit windows (shown at night)
function litTex(THREE, cols, rows, seed) {
  return canvasTex(THREE, 256, 320, (c, w, h) => {
    const rand = rng(seed);
    c.clearRect(0, 0, w, h);
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      if (rand() < 0.55) {
        c.fillStyle = `rgba(255,216,150,${0.7 + rand() * 0.3})`;
        c.fillRect(k * cw + cw * 0.24, r * ch + ch * 0.26, cw * 0.52, ch * 0.46);
      }
    }
  });
}

const clamp01 = (t) => Math.min(1, Math.max(0, t));

// ============================================================================
// DOOR — opening at entry wall (x=0 inner face), z DOOR.z0..hingeZ, h 2.03.
// White hollow-metal frame + casings both faces; graphite leaf on a hinge
// group at (0, 0, DOOR.hingeZ) swinging INTO the room (+x, toward closet wall).
// ============================================================================
export function buildDoor(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { DOOR, ROOM } = spec;
  const g = new THREE.Group(); g.name = 'door';

  const trim = mats.trim, br = mats.brushed;
  const T = ROOM.wallT;                       // 0.15 wall depth
  const z0 = DOOR.z0, zh = DOOR.hingeZ, h = DOOR.h;
  const cw = DOOR.casingW, ct = DOOR.casingT;
  const zc = (z0 + zh) / 2;

  // ---- hollow-metal frame: jamb/head liners inside the opening -----------
  const lin = 0.014; // liner protrusion into the opening on each side
  g.add(H.box(THREE, trim, T, h, lin, { x: -T / 2, y: h / 2, z: z0 + lin / 2 }));
  g.add(H.box(THREE, trim, T, h, lin, { x: -T / 2, y: h / 2, z: zh - lin / 2 }));
  g.add(H.box(THREE, trim, T, lin, (zh - z0) - 2 * lin, { x: -T / 2, y: h - lin / 2, z: zc }));

  // ---- door stops (leaf closes against these from the room side) ---------
  const stopW = 0.016, stopP = 0.012, stopX = -0.058;
  g.add(H.box(THREE, trim, stopW, h - lin, stopP, { x: stopX, y: (h - lin) / 2, z: z0 + lin + stopP / 2 }));
  g.add(H.box(THREE, trim, stopW, h - lin, stopP, { x: stopX, y: (h - lin) / 2, z: zh - lin - stopP / 2 }));
  g.add(H.box(THREE, trim, stopW, stopP, (zh - z0) - 2 * (lin + stopP), { x: stopX, y: h - lin - stopP / 2, z: zc }));

  // ---- flat casings, room face and hallway face ---------------------------
  const casing = (xc) => {
    g.add(H.box(THREE, trim, ct, h, cw, { x: xc, y: h / 2, z: z0 - cw / 2 }));
    g.add(H.box(THREE, trim, ct, h, cw, { x: xc, y: h / 2, z: zh + cw / 2 }));
    g.add(H.box(THREE, trim, ct, cw, (zh - z0) + 2 * cw, { x: xc, y: h + cw / 2, z: zc }));
  };
  casing(ct / 2);        // room face (x 0..0.018)
  casing(-T - ct / 2);   // hallway face

  // ---- brushed threshold strip under the leaf -----------------------------
  g.add(H.box(THREE, br, T - 0.01, 0.005, (zh - z0) - 0.004, { x: -T / 2, y: 0.0025, z: zc, cast: false }));

  // ---- 3 hinge knuckles on the frame (leaf pivots on this axis) ----------
  for (const y of [0.25, 1.015, 1.78]) {
    g.add(H.cyl(THREE, br, 0.008, 0.008, 0.095, { x: -0.002, y, z: zh - 0.008, seg: 12 }));
  }

  // ---- leaf + hardware, all inside the hinge group -------------------------
  const hinge = new THREE.Group();
  hinge.position.set(0, 0, zh);            // pivot at (x=0, z=hingeZ) per spec
  g.add(hinge);

  const gap = 0.004;
  const leafW = (zh - z0) - 2 * (lin + gap);   // 0.874 — 4mm reveal each side
  const leafH = 2.010 - 0.008;                 // 8mm floor gap, 6mm head gap
  const leafT = DOOR.leafT;
  const roomFace = -0.005, hallFace = -0.005 - leafT;
  const leafZc = -(lin + gap) - leafW / 2;     // leaf spans local z -0.018..-0.892
  hinge.add(H.box(THREE, mats.doorLeaf, leafT, leafH, leafW, {
    x: roomFace - leafT / 2, y: 0.008 + leafH / 2, z: leafZc, r: 0.003,
  }));

  // lever handles (both faces) near the latch (z0) edge, 70mm backset
  const zl = -(lin + gap) - leafW + 0.07;
  const lever = (face, dir) => {
    hinge.add(H.cyl(THREE, br, 0.027, 0.027, 0.010, { x: face + dir * 0.005, y: DOOR.leverY, z: zl, rz: Math.PI / 2, seg: 20 }));
    hinge.add(H.cyl(THREE, br, 0.010, 0.010, 0.030, { x: face + dir * 0.025, y: DOOR.leverY, z: zl, rz: Math.PI / 2, seg: 14 }));
    hinge.add(H.box(THREE, br, 0.016, 0.017, 0.125, { x: face + dir * 0.043, y: DOOR.leverY, z: zl + 0.052, r: 0.006 }));
  };
  lever(roomFace, +1);
  lever(hallFace, -1);

  // electronic card-lock puck on the room face, LED at its top
  hinge.add(H.box(THREE, mats.blackGloss, 0.020, 0.115, 0.058, { x: roomFace + 0.010, y: DOOR.readerY, z: zl, r: 0.006 }));
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x39d47a, emissive: 0x1f9e54, emissiveIntensity: 0.9, roughness: 0.4 });
  hinge.add(H.noShadow(H.cyl(THREE, ledMat, 0.0035, 0.0035, 0.003, { x: roomFace + 0.0205, y: DOOR.readerY + 0.042, z: zl, rz: Math.PI / 2, seg: 10 })));

  // peephole (ring both faces + dark lens on the hallway side), leaf center
  hinge.add(H.cyl(THREE, br, 0.009, 0.009, 0.006, { x: roomFace + 0.002, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 14 }));
  hinge.add(H.cyl(THREE, br, 0.0075, 0.0075, 0.006, { x: hallFace - 0.002, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 14 }));
  hinge.add(H.cyl(THREE, mats.blackGloss, 0.005, 0.005, 0.002, { x: hallFace - 0.006, y: DOOR.peepY, z: leafZc, rz: Math.PI / 2, seg: 10 }));

  // hinge leaf plates (visible in the reveal when the door stands open)
  for (const y of [0.25, 1.015, 1.78]) {
    hinge.add(H.box(THREE, br, 0.002, 0.10, 0.032, { x: roomFace + 0.001, y, z: -0.034 }));
  }

  // ---- api -----------------------------------------------------------------
  const maxRad = THREE.MathUtils.degToRad(DOOR.maxOpenDeg);
  g.userData.api = {
    setOpen: (t) => { hinge.rotation.y = -maxRad * clamp01(t); },
  };
  g.userData.api.setOpen(0);
  return g;
}

// ============================================================================
// WINDOW — opening on the window wall (inner face x=ROOM.L), plus roller
// shade and the exterior backdrop. api: setShade(t), setNight(t).
// ============================================================================
export function buildWindow(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { WINDOW, ROOM } = spec;
  const g = new THREE.Group(); g.name = 'window';

  const xin = ROOM.L;                  // 5.60 inner wall face
  const xout = ROOM.L + ROOM.wallT;    // 5.75 outer wall face
  const zc = WINDOW.z0 + WINDOW.w / 2; // 1.475
  const yc = WINDOW.y0 + WINDOW.h / 2; // 1.675
  const yTop = WINDOW.y0 + WINDOW.h;   // 2.45

  // ---- bronze aluminum frame (outer) + stepped inner sash ------------------
  const fr = H.frame(THREE, mats.bronze, WINDOW.w, WINDOW.h, WINDOW.frameT, WINDOW.frameD);
  fr.rotation.y = -Math.PI / 2;
  fr.position.set(xout - WINDOW.frameD / 2, yc, zc);   // frame x 5.64..5.75
  g.add(fr);

  const sash = H.frame(THREE, mats.bronze, WINDOW.w - 0.09, WINDOW.h - 0.09, 0.032, 0.045);
  sash.rotation.y = -Math.PI / 2;
  sash.position.set(xin + 0.0625, yc, zc);             // sash x 5.64..5.685
  g.add(sash);

  // ---- glazing (no shadows; one-off glossier pane so reflections read) ------
  const paneMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.92, transparent: true, opacity: 1.0,
    roughness: 0.03, metalness: 0, ior: 1.52, thickness: 0.01,
    depthWrite: false, envMapIntensity: 1.7,
  });
  const glass = H.box(THREE, paneMat, 0.008, WINDOW.h - 0.11, WINDOW.w - 0.11, { x: xin + 0.105, y: yc, z: zc });
  H.noShadow(glass);
  g.add(glass);

  // ---- white reveal liners between room face and frame ----------------------
  const lin = 0.012, revD = 0.045;
  g.add(H.box(THREE, mats.trim, revD, WINDOW.h, lin, { x: xin + revD / 2, y: yc, z: WINDOW.z0 + lin / 2 }));
  g.add(H.box(THREE, mats.trim, revD, WINDOW.h, lin, { x: xin + revD / 2, y: yc, z: WINDOW.z0 + WINDOW.w - lin / 2 }));
  g.add(H.box(THREE, mats.trim, revD, lin, WINDOW.w, { x: xin + revD / 2, y: yTop - lin / 2, z: zc }));

  // ---- stool sill (rounded nose) + apron + side casings ----------------------
  g.add(H.box(THREE, mats.trim, WINDOW.sillD, WINDOW.sillT, WINDOW.w + 0.19, {
    x: xin + WINDOW.sillD / 2 - 0.05, y: WINDOW.y0 - WINDOW.sillT / 2, z: zc, r: 0.005,
  }));
  g.add(H.box(THREE, mats.trim, 0.018, 0.095, WINDOW.w + 0.09, { x: xin - 0.009, y: WINDOW.y0 - WINDOW.sillT - 0.0475, z: zc }));
  const casW = 0.075;
  g.add(H.box(THREE, mats.trim, 0.018, WINDOW.h, casW, { x: xin - 0.009, y: yc, z: WINDOW.z0 - casW / 2 }));
  g.add(H.box(THREE, mats.trim, 0.018, WINDOW.h, casW, { x: xin - 0.009, y: yc, z: WINDOW.z0 + WINDOW.w + casW / 2 }));

  // ---- roller-shade housing + fabric shade + hem bar + pull cord -------------
  g.add(H.box(THREE, mats.trim, WINDOW.shadeBoxD, WINDOW.shadeBoxH, WINDOW.w + 0.19, {
    x: xin - WINDOW.shadeBoxD / 2, y: yTop + WINDOW.shadeBoxH / 2, z: zc, r: 0.004,
  }));
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.8 });
  g.add(H.box(THREE, slotMat, 0.03, 0.006, WINDOW.w + 0.07, { x: xin - 0.047, y: yTop - 0.003, z: zc, cast: false }));

  const shadeW = WINDOW.w + 0.06;
  const topY = yTop - 0.004;
  const shadeG = new THREE.Group();
  shadeG.position.set(xin - 0.047, topY, zc);
  g.add(shadeG);
  const fabGeo = new THREE.PlaneGeometry(shadeW, 1);
  fabGeo.translate(0, -0.5, 0);                     // top edge at local y=0
  // subtle weave + edge/bottom falloff so the white band still reads against
  // the bright sky (in the flat white mats.shade it vanished at low t)
  const fabMap = canvasTex(THREE, 128, 256, (c, w, h) => {
    c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(120,112,98,0.05)';
    for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);          // weave
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(90,84,72,0.10)');                      // roll shadow
    gr.addColorStop(0.18, 'rgba(90,84,72,0.0)');
    gr.addColorStop(0.9, 'rgba(90,84,72,0.0)');
    gr.addColorStop(1, 'rgba(90,84,72,0.12)');                      // hem shadow
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  });
  const fabMat = fabMap
    ? new THREE.MeshStandardMaterial({ map: fabMap, roughness: 0.95, side: THREE.DoubleSide })
    : mats.shade;
  const fab = new THREE.Mesh(fabGeo, fabMat);
  fab.rotation.y = -Math.PI / 2;
  fab.castShadow = true; fab.receiveShadow = false;
  shadeG.add(fab);
  const hem = H.box(THREE, mats.trim, 0.022, 0.024, shadeW + 0.01, { r: 0.007 });
  shadeG.add(hem);
  const dMax = 1.52;                                // fully down: hem just above sill
  const setShade = (t) => {
    const d = 0.025 + clamp01(t) * (dMax - 0.025);
    fab.scale.y = d;
    hem.position.y = -d - 0.010;
  };

  g.add(H.cyl(THREE, mats.whitePlastic, 0.0028, 0.0028, 0.62, { x: xin - 0.028, y: yTop - 0.31, z: WINDOW.z0 + 0.035, seg: 8, cast: false }));
  g.add(H.cyl(THREE, mats.whitePlastic, 0.006, 0.006, 0.025, { x: xin - 0.028, y: yTop - 0.63, z: WINDOW.z0 + 0.035, seg: 10, cast: false }));

  // ==== WINDOW-CONTAINED EXTERIOR VIEW =======================================
  // The former freestanding exterior geometry could be seen while orbiting
  // outside the room. A layered architectural view is now composited directly
  // into the window aperture, so it reads through the glass but never exists as
  // stray buildings in the surrounding 3D scene.
  const drawView = (night) => canvasTex(THREE, 512, 768, (c, w, h) => {
    const rand = rng(night ? 911 : 419);
    const sky = c.createLinearGradient(0, 0, 0, h);
    if (night) {
      sky.addColorStop(0, '#10192e'); sky.addColorStop(.55, '#263653'); sky.addColorStop(1, '#59657a');
    } else {
      sky.addColorStop(0, '#4f8fce'); sky.addColorStop(.48, '#9bc5e6'); sky.addColorStop(1, '#eef4f7');
    }
    c.fillStyle = sky; c.fillRect(0, 0, w, h);

    // restrained atmospheric clouds and haze, already clipped by the canvas
    for (let i = 0; i < 11; i++) {
      c.fillStyle = night ? `rgba(202,216,236,${.015 + rand() * .025})` : `rgba(255,255,255,${.055 + rand() * .08})`;
      c.beginPath(); c.ellipse(rand() * w, h * (.08 + rand() * .42), 28 + rand() * 80, 7 + rand() * 15, 0, 0, Math.PI * 2); c.fill();
    }

    const facade = ({ x, y, width, height, body, side, cols, rows, litSeed }) => {
      // narrow side plane establishes depth without creating external geometry
      c.fillStyle = side; c.beginPath(); c.moveTo(x, y); c.lineTo(x + width * .12, y - height * .05); c.lineTo(x + width * 1.12, y - height * .05); c.lineTo(x + width, y); c.closePath(); c.fill();
      c.fillStyle = body; c.fillRect(x, y, width, height);
      c.fillStyle = night ? 'rgba(5,10,18,.22)' : 'rgba(0,0,0,.065)';
      for (let r = 1; r < rows; r++) c.fillRect(x, y + r * height / rows, width, 2);
      const wr = rng(litSeed), cw = width / cols, rh = height / rows;
      for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
        const lit = night && wr() > .40;
        c.fillStyle = lit ? `rgba(255,214,142,${.68 + wr() * .25})` : night ? '#172232' : '#405563';
        c.fillRect(x + col * cw + cw * .20, y + r * rh + rh * .22, cw * .60, rh * .52);
        c.fillStyle = lit ? 'rgba(255,242,206,.22)' : night ? 'rgba(112,142,176,.08)' : 'rgba(255,255,255,.13)';
        c.fillRect(x + col * cw + cw * .20, y + r * rh + rh * .22, cw * .60, rh * .14);
      }
      c.fillStyle = night ? '#111925' : 'rgba(92,91,84,.42)'; c.fillRect(x, y - 7, width, 7);
    };

    facade({ x: -70, y: 390, width: 270, height: 390, body: night ? '#343b43' : '#c9c1ad', side: night ? '#272e36' : '#aaa38f', cols: 6, rows: 7, litSeed: 131 });
    facade({ x: 342, y: 325, width: 235, height: 455, body: night ? '#2a333f' : '#a8b0b7', side: night ? '#202832' : '#8f989f', cols: 5, rows: 8, litSeed: 57 });

    // Ground and a few soft tree crowns keep the lower window believable.
    c.fillStyle = night ? '#111821' : '#96978f'; c.fillRect(0, h * .87, w, h * .13);
    for (let i = 0; i < 7; i++) {
      const x = 190 + i * 30 + (rand() - .5) * 18, y = h * .86 - rand() * 35;
      c.fillStyle = night ? '#17271f' : ['#496c4d', '#577959', '#3f6548'][i % 3];
      c.beginPath(); c.arc(x, y, 18 + rand() * 15, 0, Math.PI * 2); c.fill();
    }
    const haze = c.createLinearGradient(0, h * .62, 0, h);
    haze.addColorStop(0, 'rgba(255,255,255,0)'); haze.addColorStop(1, night ? 'rgba(36,43,54,.18)' : 'rgba(236,241,242,.24)');
    c.fillStyle = haze; c.fillRect(0, h * .62, w, h * .38);
  });

  const viewGeo = new THREE.PlaneGeometry(WINDOW.w - .12, WINDOW.h - .12);
  const dayMap = drawView(false), nightMap = drawView(true);
  const dayMat = new THREE.MeshBasicMaterial({ map: dayMap, color: dayMap ? 0xffffff : 0x9bc5e6, transparent: true, depthWrite: false });
  const nightMat = new THREE.MeshBasicMaterial({ map: nightMap, color: nightMap ? 0xffffff : 0x263653, transparent: true, opacity: 0, depthWrite: false });
  const dayView = new THREE.Mesh(viewGeo, dayMat); dayView.rotation.y = -Math.PI / 2; dayView.position.set(xout + .016, yc, zc); dayView.renderOrder = -3; g.add(dayView);
  const nightView = new THREE.Mesh(viewGeo.clone(), nightMat); nightView.rotation.y = -Math.PI / 2; nightView.position.set(xout + .012, yc, zc); nightView.renderOrder = -2; g.add(nightView);
  H.noShadow(dayView); H.noShadow(nightView);

  const setNight = (t) => {
    const k = clamp01(t);
    dayMat.opacity = 1 - k * .94;
    nightMat.opacity = k;
  };

  // ---- api -----------------------------------------------------------------
  g.userData.api = { setShade, setNight };
  setShade(0);
  setNight(0);
  return g;
}
