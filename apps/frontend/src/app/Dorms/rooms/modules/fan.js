// fan.js — brushed-nickel 3-blade ceiling fan with frosted dome light kit.
// Local origin = ceiling mount point; everything extends DOWN in -y.
// api: setOn(bool), setLight(bool), update(dt). Blade group spins about y.

export function buildFan(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const F = spec.FAN;                       // { drop:0.32, motorR:0.10, blades:3, bladeR:0.60 }
  const g = new THREE.Group();

  const drop = F.drop;                      // downrod reaches y = -drop
  const TAU = Math.PI * 2;

  // ---- canopy (against ceiling) ------------------------------------------
  // thin flange ring + tapered dome cover, brushed nickel
  g.add(H.cyl(THREE, mats.brushed, 0.080, 0.080, 0.004, { y: -0.002, seg: 32 }));
  g.add(H.cyl(THREE, mats.brushed, 0.036, 0.074, 0.034, { y: -0.021, seg: 32 }));
  // hanger ball peeking out of canopy throat
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.021, 16, 12), mats.brushed);
  ball.position.set(0, -0.040, 0);
  ball.castShadow = ball.receiveShadow = true;
  g.add(ball);

  // ---- downrod -------------------------------------------------------------
  // from just below canopy to -drop, slim brushed tube + coupler collars
  g.add(H.cyl(THREE, mats.brushed, 0.0125, 0.0125, drop - 0.045, { y: -(0.045 + (drop - 0.045) / 2), seg: 16 }));
  g.add(H.cyl(THREE, mats.brushed, 0.017, 0.017, 0.020, { y: -0.058, seg: 16 }));  // top coupler
  g.add(H.cyl(THREE, mats.brushed, 0.021, 0.021, 0.026, { y: -(drop - 0.006), seg: 16 })); // bottom coupler
  // tiny cross-pin heads on the couplers (hardware detail)
  g.add(H.cyl(THREE, mats.metalDark, 0.0035, 0.0035, 0.037, { y: -(drop - 0.006), rz: Math.PI / 2, seg: 8 }));

  // ---- motor housing --------------------------------------------------------
  const motorTop = -drop;                   // housing hangs from downrod bottom
  // shoulder (tapers out from downrod to full motor radius)
  g.add(H.cyl(THREE, mats.brushed, 0.050, F.motorR - 0.004, 0.040, { y: motorTop - 0.020, seg: 40 }));
  // main drum
  g.add(H.cyl(THREE, mats.brushed, F.motorR, F.motorR, 0.075, { y: motorTop - 0.0775, seg: 40 }));
  // dark accent seam ring between shoulder and drum
  g.add(H.cyl(THREE, mats.metalDark, F.motorR + 0.0015, F.motorR + 0.0015, 0.006, { y: motorTop - 0.043, seg: 40 }));
  // lower taper closing the drum
  g.add(H.cyl(THREE, mats.brushed, F.motorR, 0.078, 0.020, { y: motorTop - 0.125, seg: 40 }));

  // ---- blade assembly (spins) ----------------------------------------------
  const spinner = new THREE.Group();
  const bladeY = motorTop - 0.132;          // just below the drum
  const bladeLen = F.bladeR - 0.13;         // root 0.13 -> tip bladeR
  for (let i = 0; i < F.blades; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i / F.blades) * TAU;
    // blade iron: short bracket from under the motor out to the blade root
    arm.add(H.box(THREE, mats.brushed, 0.085, 0.007, 0.030, { x: 0.110, y: bladeY + 0.007, r: 0.002 }));
    // flat blade, brushed nickel, ~10 deg pitch about its long axis
    const blade = H.box(THREE, mats.brushed, bladeLen, 0.009, 0.112,
      { x: 0.13 + bladeLen / 2, y: bladeY, r: 0.003 });
    blade.rotation.x = THREE.MathUtils.degToRad(10);
    arm.add(blade);
    // two mount screws through iron into blade
    for (const dz of [-0.018, 0.018]) {
      arm.add(H.cyl(THREE, mats.metalDark, 0.004, 0.004, 0.004, { x: 0.135, y: bladeY + 0.012, z: dz, seg: 10 }));
    }
    spinner.add(arm);
  }
  g.add(spinner);

  // ---- light kit -------------------------------------------------------------
  const fitterTop = motorTop - 0.135;
  // fitter cup + decorative ring
  g.add(H.cyl(THREE, mats.brushed, 0.072, 0.056, 0.028, { y: fitterTop - 0.014, seg: 32 }));
  g.add(H.cyl(THREE, mats.brushed, 0.058, 0.058, 0.006, { y: fitterTop - 0.030, seg: 32 }));
  // frosted glass dome (lower hemisphere, slightly squashed), emissive when on
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.35, metalness: 0.0,
    emissive: 0xfff3e0, emissiveIntensity: 0.0,
    transparent: true, opacity: 0.96,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 28, 14, 0, TAU, Math.PI / 2, Math.PI / 2), domeMat);
  dome.scale.y = 0.82;
  dome.position.y = fitterTop - 0.030;
  H.noShadow(dome);
  g.add(dome);
  // small brushed finial button at the bottom of the dome
  g.add(H.cyl(THREE, mats.brushed, 0.009, 0.011, 0.010, { y: fitterTop - 0.030 - 0.075 * 0.82 - 0.003, seg: 16 }));

  // ---- pull chains (fan speed + light) ---------------------------------------
  function pullChain(px, pz, len) {
    const c = new THREE.Group();
    const y0 = fitterTop - 0.006;           // starts up inside the fitter
    // hairline link cord
    c.add(H.cyl(THREE, mats.chrome, 0.0011, 0.0011, len, { x: px, y: y0 - len / 2, z: pz, seg: 6, cast: false }));
    // beads
    const beadGeo = new THREE.SphereGeometry(0.0033, 8, 6);
    for (let y = 0.010; y < len - 0.004; y += 0.0088) {
      const b = new THREE.Mesh(beadGeo, mats.chrome);
      b.position.set(px, y0 - y, pz);
      b.castShadow = false; b.receiveShadow = true;
      c.add(b);
    }
    // pull fob
    c.add(H.cyl(THREE, mats.brushed, 0.0048, 0.0066, 0.017, { x: px, y: y0 - len - 0.0085, z: pz, seg: 12 }));
    return c;
  }
  g.add(pullChain(0.050, 0.026, 0.168));    // fan chain (longer)
  g.add(pullChain(-0.050, 0.026, 0.126));   // light chain (shorter)

  // ---- animation api -----------------------------------------------------------
  let speed = 0, target = 0;
  g.userData.api = {
    setOn(on) { target = on ? 6.0 : 0.0; },
    setLight(on) { domeMat.emissiveIntensity = on ? 2.2 : 0.0; },
    update(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      // exponential ease toward target angular speed (~0.35 s time constant)
      speed += (target - speed) * Math.min(1, dt * 3.0);
      if (Math.abs(target - speed) < 0.002 ) speed = target;
      if (speed !== 0) spinner.rotation.y = (spinner.rotation.y + speed * dt) % TAU;
    },
  };

  return g;
}
