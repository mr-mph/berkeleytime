// Blackwell Hall Double — interactive 3D reconstruction. App shell.
// Exports createBlackwellRoom({ container, onNavigateRooms }) -> { dispose }.
// All DOM lives inside `container`; dispose() tears down listeners, the render
// loop, and GPU resources so the room can mount/unmount inside the SPA.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterials } from './materials.js';
import * as H from './helpers.js';
import * as spec from './spec.js';
import { buildShell } from './modules/shell.js';
import { buildDoor, buildWindow } from './modules/doorwin.js';
import { buildBed } from './modules/bed.js';
import { buildCloset } from './modules/closet.js';
import { buildDesk, buildChair, buildDeskLaptop, buildDeskMug, buildDeskBin } from './modules/desk.js';
import { buildMicroChill } from './modules/microchill.js';
import { buildFan } from './modules/fan.js';
import { buildFixtures } from './modules/fixtures.js';
import { createPlanner } from './planner.js';
import { constrainToRoom, createJumpState, queueJump, resetJump, stepJump } from './walk-physics.js';

const { ROOM, LAYOUT, BED, CLOSET, DESK, CHAIR, FRIDGE, MICROWAVE, EYE } = spec;

// Settings cog (feather "settings" glyph); inherits currentColor.
const COG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// ---------------------------------------------------------------- css
// Scoped under .dorm-room-host — the app supplies the theme tokens
// (--foreground-color, --heading-color, …) globally via body[data-theme].
const CSS = `
.dorm-room-host { --sans:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  position:absolute; inset:0; overflow:hidden; background:#14161a; font-family:var(--sans); }
.dorm-room-host * { margin:0; padding:0; box-sizing:border-box; }
.dorm-room-host canvas.gl { display:block; }
.dorm-room-host .hud{position:absolute;user-select:none;-webkit-user-select:none}
.dorm-room-host #settingsToggle{z-index:9;top:12px;right:12px;width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--paragraph-color);border-radius:4px;cursor:pointer;box-shadow:0 2px 8px rgb(0 0 0 / 10%)}.dorm-room-host #settingsToggle:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host #settingsToggle.on{background:var(--blue-500);border-color:var(--blue-500);color:#fff}.dorm-room-host #settingsToggle svg{width:18px;height:18px}
.dorm-room-host #panel{display:none;z-index:8;top:56px;right:12px;width:276px;background:var(--foreground-color);color:var(--heading-color);border:1px solid var(--border-color);border-radius:6px;padding:12px;box-shadow:0 8px 28px rgb(0 0 0 / 15%);font-size:12px;max-height:calc(100% - 68px);overflow:auto}.dorm-room-host #panel.open{display:block}
.dorm-room-host .panel-head{margin-bottom:2px}.dorm-room-host .panel-title{font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--heading-color)}.dorm-room-host .panel-meta{font-size:12px;color:var(--label-color);margin-top:2px}
.dorm-room-host #panel h3{font-size:12px;font-weight:600;color:var(--heading-color);margin:12px 0 7px}.dorm-room-host .row{display:flex;gap:4px;flex-wrap:wrap}.dorm-room-host .btn{flex:1 1 auto;min-width:56px;height:30px;border:1px solid var(--border-color);background:transparent;color:var(--paragraph-color);border-radius:4px;padding:0 7px;font-size:11px;cursor:pointer;text-align:center;display:grid;place-items:center}.dorm-room-host .btn:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host .btn.on{background:var(--blue-500);border-color:var(--blue-500);color:white;font-weight:500}.dorm-room-host .btn.small{flex:0 0 calc(25% - 3px);min-width:0;padding:0 2px;font-size:10px}.dorm-room-host .slider{width:100%;accent-color:var(--blue-500);margin:2px 0 4px}.dorm-room-host label.sl{display:block;font-size:11px;color:var(--paragraph-color);margin:9px 0 5px}
.dorm-room-host #err{z-index:7;top:56px;left:12px;max-width:420px;font:11px/1.5 var(--mono);color:#ef4444;white-space:pre-wrap}
.dorm-room-host #splash{inset:0;background:#14161a;color:white;display:flex;align-items:center;justify-content:center;z-index:10;transition:opacity .35s;font-size:18px;font-weight:600}
@media (prefers-reduced-motion: reduce){ .dorm-room-host *{ transition:none !important; } }
`;

export function createBlackwellRoom({ container, initialLayout = null, onLayoutChange = () => {} }) {
  const Q = new URLSearchParams(location.search);
  const STILL = Q.get('still') === '1';

  // ---------------------------------------------------------------- dom
  container.classList.add('dorm-room-host');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  container.innerHTML = `
    <button class="hud" id="settingsToggle" aria-label="Settings" title="Settings">${COG}</button>
    <div class="hud" id="panel"></div>
    <div class="hud" id="err"></div>
    <div class="hud" id="splash">Roomplan</div>
  `;

  const cleanupDom = () => {
    style.remove();
    container.classList.remove('dorm-room-host');
    container.innerHTML = '';
  };

  const $ = id => container.querySelector('#' + id);
  const errBox = $('err');
  function reportErr(where, e) {
    console.error(where, e);
    errBox.textContent += `[${where}] ${e.message || e}\n`;
  }

  // ---------------------------------------------------------------- renderer
  const width = () => container.clientWidth || 1;
  const height = () => container.clientHeight || 1;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    cleanupDom();
    throw e;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(width(), height());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'gl';
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '3D room view');
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161a);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;

  const camera = new THREE.PerspectiveCamera(60, width() / height(), 0.02, 60);

  // ---------------------------------------------------------------- build room
  const mats = createMaterials(THREE, { procedural: true });
  const ctx = { THREE, mats, spec, H };
  const root = new THREE.Group();
  root.position.set(-ROOM.L / 2, 0, -ROOM.W / 2); // center the room on origin
  scene.add(root);

  const apis = {};                    // name -> userData.api
  function place(name, builder, args, x = 0, y = 0, z = 0, rotY = 0) {
    try {
      const g = args !== undefined ? builder(ctx, args) : builder(ctx);
      g.position.set(x, y, z);
      if (rotY) g.rotation.y = rotY;
      root.add(g);
      if (g.userData?.api) apis[name] = g.userData.api;
      return g;
    } catch (e) { reportErr(name, e); return null; }
  }

  const shellG   = place('shell', buildShell);
  place('door', buildDoor);
  place('window', buildWindow);
  const bedAG = place('bedA', buildBed, { variant: 'A' }, LAYOUT.bedA.x, 0, LAYOUT.bedA.z);
  const bedBG = place('bedB', buildBed, { variant: 'B' }, LAYOUT.bedB.x, 0, LAYOUT.bedB.z);
  place('closetA', buildCloset, { letter: 'A' }, LAYOUT.closet1.x0, 0, ROOM.W - CLOSET.depth);
  place('closetB', buildCloset, { letter: 'B' }, LAYOUT.closet2.x0, 0, ROOM.W - CLOSET.depth);
  const deskZ = ROOM.W - 0.02 - DESK.d / 2;
  const desk1G = place('desk1', buildDesk, undefined, LAYOUT.desk1.cx, 0, deskZ);
  const desk2G = place('desk2', buildDesk, undefined, LAYOUT.desk2.cx, 0, deskZ);
  const laptop1G = place('laptop1', buildDeskLaptop, undefined, LAYOUT.desk1.cx - .14, DESK.h, deskZ + .035, .28);
  const laptop2G = place('laptop2', buildDeskLaptop, undefined, LAYOUT.desk2.cx - .14, DESK.h, deskZ + .035, .28);
  const mug1G = place('mug1', buildDeskMug, undefined, LAYOUT.desk1.cx + .30, DESK.h, deskZ - .11, -.9);
  const mug2G = place('mug2', buildDeskMug, undefined, LAYOUT.desk2.cx + .30, DESK.h, deskZ - .11, -.9);
  const bin1G = place('bin1', buildDeskBin, undefined, LAYOUT.desk1.cx - .33, 0, deskZ - .10);
  const bin2G = place('bin2', buildDeskBin, undefined, LAYOUT.desk2.cx - .33, 0, deskZ - .10);
  const chair1G = place('chair1', buildChair, undefined, LAYOUT.chair1.x, 0, LAYOUT.chair1.z, LAYOUT.chair1.rotY);
  const chair2G = place('chair2', buildChair, undefined, LAYOUT.chair2.x, 0, LAYOUT.chair2.z, LAYOUT.chair2.rotY);
  const microchillG = place('microchill', buildMicroChill, undefined, LAYOUT.fridge.x, 0, LAYOUT.fridge.z);
  const fanG = place('fan', buildFan, undefined, LAYOUT.fan.x, ROOM.H, LAYOUT.fan.z);
  place('fixtures', buildFixtures);

  // furnished / move-in registries
  const furnishedObjs = [], moveinObjs = [];
  root.traverse(o => {
    if (o.userData.furnishedOnly) furnishedObjs.push(o);
    if (o.userData.moveinOnly) moveinObjs.push(o);
  });

  // ceiling reference for plan view (shell tags it if possible)
  let ceilingMesh = null;
  shellG?.traverse(o => { if (o.userData.isCeiling) ceilingMesh = o; });

  // ---------------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0xcfe0f2, 0x8b8478, 0.38);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffedd2, 2.8);
  sun.position.set(ROOM.L / 2 + 3.2, 2.75, -ROOM.W / 2 + 1.35);
  sun.target.position.set(-1.0, 0.3, 0.35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.015;
  const sc = sun.shadow.camera;
  sc.left = -4.2; sc.right = 4.2; sc.top = 4.2; sc.bottom = -4.2; sc.near = 0.5; sc.far = 14;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.25);
  fill.position.set(-ROOM.L, 2.2, ROOM.W);
  scene.add(fill);
  const fanLight = new THREE.PointLight(0xffd9a6, 0, 7, 2);
  fanLight.position.set(LAYOUT.fan.x - ROOM.L / 2, ROOM.H - spec.FAN.drop - 0.12, LAYOUT.fan.z - ROOM.W / 2);
  fanLight.castShadow = true;
  fanLight.shadow.mapSize.set(1024, 1024);
  fanLight.shadow.bias = -0.002;
  scene.add(fanLight);

  // ---------------------------------------------------------------- state + tweens
  // Guard 0..1 params from shared links: a non-numeric value must not seed NaN
  // into the tween state (which would permanently wedge the door/closet/shade UI).
  const parse01 = (v, dflt) => {
    const n = parseFloat(v ?? '');
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : dflt;
  };
  const state = {
    mode: 'walk',                   // orbit | walk
    night: Q.get('tod') === 'night',
    furnished: Q.get('furnished') !== '0',
    door: parse01(Q.get('door'), 0),
    closetA: parse01(Q.get('closets'), 0),
    closetB: parse01(Q.get('closets'), 0),
    shade: parse01(Q.get('shade'), 0.25),
    fanOn: Q.get('fan') === '1' && !STILL,
    fanLight: Q.get('light') === '1',
    mirrors: Q.get('mirrors') !== '0',
  };
  const tw = { door: state.door, closetA: state.closetA, closetB: state.closetB, shade: state.shade, night: state.night ? 1 : 0 };
  const twTarget = { ...tw };

  function applyFurnished() {
    furnishedObjs.forEach(o => o.visible = state.furnished);
    moveinObjs.forEach(o => o.visible = !state.furnished);
  }
  function applyNight(t) {
    sun.intensity = THREE.MathUtils.lerp(2.8, 0.16, t);
    sun.color.set(t > 0.5 ? 0x93a9c9 : 0xffedd2);
    hemi.intensity = THREE.MathUtils.lerp(0.38, 0.06, t);
    fill.intensity = THREE.MathUtils.lerp(0.25, 0.05, t);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.4, 0.1, t);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 0.86, t);
    fanLight.intensity = (state.fanLight || t > 0.5) ? THREE.MathUtils.lerp(0.4, 18, Math.max(t, state.fanLight ? 1 : 0)) : 0;
    apis.fan?.setLight?.(state.fanLight || t > 0.5);
    apis.window?.setNight?.(t);
  }
  applyFurnished();

  // ---------------------------------------------------------------- cameras
  const CAMS = {
    door:   { p: [0.50, 1.55, 2.30], t: [4.60, 1.02, 0.95] },
    window: { p: [3.35, 1.42, 1.90], t: [5.55, 1.05, 1.20] },
    desks:  { p: [4.55, 1.52, 0.42], t: [1.35, 1.05, 2.92] },
    beds:   { p: [3.85, 1.58, 2.15], t: [0.55, 0.70, 0.30] },
    fridge: { p: [2.80, 1.35, 1.95], t: [2.80, 0.85, 0.03] },
    corner: { p: [0.34, 1.66, 0.36], t: [4.90, 0.95, 2.35] },
    plan:   { p: [2.80, 7.40, 1.60], t: [2.80, 0.00, 1.45] },
  };
  const toWorld = (a) => new THREE.Vector3(a[0] - ROOM.L / 2, a[1], a[2] - ROOM.W / 2);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.maxDistance = 7.5;
  orbit.minDistance = 0.15;

  function setCam(name) {
    const c = Object.hasOwn(CAMS, name) ? CAMS[name] : CAMS.door;
    camera.position.copy(toWorld(c.p));
    orbit.target.copy(toWorld(c.t));
    orbit.update();
    if (ceilingMesh) ceilingMesh.visible = name !== 'plan';
    if (fanG) fanG.visible = name !== 'plan';
  }
  setCam(Q.get('cam') || 'door');

  // walk mode ---------------------------------------------------------------
  const walk = { yaw: -Math.PI / 2.4, pitch: -0.05, pos: new THREE.Vector3(0.7, EYE, 2.2), keys: {}, dragging: false, lx: 0, ly: 0, jump: createJumpState() };
  const RADIUS = 0.22;
  function collide(p) { constrainToRoom(p, ROOM, RADIUS); }
  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', e => { if (state.mode === 'walk') { walk.dragging = true; walk.lx = e.clientX; walk.ly = e.clientY; dom.setPointerCapture(e.pointerId); } });
  dom.addEventListener('pointermove', e => {
    if (state.mode === 'walk' && walk.dragging) {
      walk.yaw -= (e.clientX - walk.lx) * 0.0042;
      walk.pitch = THREE.MathUtils.clamp(walk.pitch - (e.clientY - walk.ly) * 0.0032, -1.2, 1.2);
      walk.lx = e.clientX; walk.ly = e.clientY;
    }
  });
  dom.addEventListener('pointerup', () => walk.dragging = false);
  const CAM_ORDER = ['door', 'window', 'desks', 'beds', 'fridge', 'corner', 'plan'];
  const WALK_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  const onKeyDown = e => {
    const target = e.target;
    const editing = target?.matches?.('input, textarea, select, [contenteditable="true"]');
    if (editing) { walk.keys[e.code] = false; return; }
    walk.keys[e.code] = true;
    if (state.mode === 'walk' && WALK_KEYS.has(e.code)) {
      e.preventDefault();
      if (e.code === 'Space' && !e.repeat) queueJump(walk.jump);
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= CAM_ORDER.length) { setMode('orbit'); setCam(CAM_ORDER[n - 1]); }
  };
  const onKeyUp = e => walk.keys[e.code] = false;
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);

  function setMode(m) {
    state.mode = m;
    orbit.enabled = m === 'orbit';
    resetJump(walk.jump);
    if (m === 'walk') {
      const wp = camera.position.clone();
      walk.pos.set(THREE.MathUtils.clamp(wp.x + ROOM.L / 2, 0.3, ROOM.L - 0.3), EYE, THREE.MathUtils.clamp(wp.z + ROOM.W / 2, 0.3, ROOM.W - 0.3));
      collide(walk.pos);
    }
    syncUI();
  }

  // ---------------------------------------------------------------- UI panel
  const panel = $('panel');
  panel.innerHTML = `
    <div class="panel-head"><div class="panel-title">Blackwell Hall Double</div><div class="panel-meta">18′4″ × 9′8″</div></div>
    <h3>Navigation</h3>
    <div class="row">
      <button class="btn" type="button" data-mode="orbit">Orbit</button>
      <button class="btn" type="button" data-mode="walk">Walk</button>
    </div>
    <h3>Scene</h3>
    <div class="row">
      <div class="btn" id="bDay">Day</div>
      <div class="btn" id="bNight">Night</div>
    </div>
    <div class="row" style="margin-top:6px">
      <div class="btn" id="bFurn">Furnished</div>
      <div class="btn" id="bMove">Move-in</div>
    </div>
    <h3>Room</h3>
    <div class="row">
      <div class="btn" id="bDoor">Door</div>
      <div class="btn" id="bFan">Fan</div>
      <div class="btn" id="bLamp">Light</div>
    </div>
    <div class="row" style="margin-top:6px">
      <div class="btn" id="bClA">Closet A</div>
      <div class="btn" id="bClB">Closet B</div>
    </div>
    <label class="sl">Window shade</label>
    <input type="range" class="slider" id="sShade" min="0" max="1" step="0.01">
    <h3>Layout</h3>
    <div class="row"><div class="btn" id="bResetLayout">Reset items</div></div>
  `;
  function syncUI() {
    panel.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
    $('bDay').classList.toggle('on', !state.night);
    $('bNight').classList.toggle('on', state.night);
    $('bFurn').classList.toggle('on', state.furnished);
    $('bMove').classList.toggle('on', !state.furnished);
    $('bDoor').classList.toggle('on', twTarget.door > 0.5);
    $('bFan').classList.toggle('on', state.fanOn);
    $('bLamp').classList.toggle('on', state.fanLight);
    $('bClA').classList.toggle('on', twTarget.closetA > 0.5);
    $('bClB').classList.toggle('on', twTarget.closetB > 0.5);
    $('sShade').value = twTarget.shade;
  }
  $('bDay').onclick = () => { state.night = false; twTarget.night = 0; syncUI(); };
  $('bNight').onclick = () => { state.night = true; twTarget.night = 1; syncUI(); };
  $('bFurn').onclick = () => { state.furnished = true; applyFurnished(); syncUI(); };
  $('bMove').onclick = () => { state.furnished = false; applyFurnished(); syncUI(); };
  $('bDoor').onclick = () => { twTarget.door = twTarget.door > 0.5 ? 0 : 1; syncUI(); };
  $('bClA').onclick = () => { twTarget.closetA = twTarget.closetA > 0.5 ? 0 : 1; syncUI(); };
  $('bClB').onclick = () => { twTarget.closetB = twTarget.closetB > 0.5 ? 0 : 1; syncUI(); };
  $('bFan').onclick = () => { state.fanOn = !state.fanOn; apis.fan?.setOn?.(state.fanOn); syncUI(); };
  $('bLamp').onclick = () => { state.fanLight = !state.fanLight; applyNight(tw.night); syncUI(); };
  $('sShade').oninput = e => { twTarget.shade = parseFloat(e.target.value); };
  syncUI();
  apis.fan?.setOn?.(state.fanOn);

  // Shared measured-item planner; the room shell supplies its own built-ins.
  const planner = createPlanner({
    THREE, root, camera, renderer, orbit, room: ROOM, container,
    setPlanView: () => { setMode('orbit'); setCam('plan'); },
    builtins: [
      { id: 'bed-a', name: 'Bed A', object: bedAG, y: 0, dimensions: { w: BED.L, h: BED.headH, d: BED.W } },
      { id: 'bed-b', name: 'Bed B', object: bedBG, y: 0, dimensions: { w: BED.L, h: BED.headH, d: BED.W } },
      { id: 'desk-a', name: 'Desk A', object: desk1G, y: 0, dimensions: { w: DESK.w, h: DESK.h, d: DESK.d } },
      { id: 'desk-b', name: 'Desk B', object: desk2G, y: 0, dimensions: { w: DESK.w, h: DESK.h, d: DESK.d } },
      { id: 'laptop-a', name: 'Laptop A', object: laptop1G, y: DESK.h, dimensions: { w: .32, h: .026, d: .22 } },
      { id: 'laptop-b', name: 'Laptop B', object: laptop2G, y: DESK.h, dimensions: { w: .32, h: .026, d: .22 } },
      { id: 'mug-a', name: 'Mug A', object: mug1G, y: DESK.h, dimensions: { w: .13, h: .095, d: .085 } },
      { id: 'mug-b', name: 'Mug B', object: mug2G, y: DESK.h, dimensions: { w: .13, h: .095, d: .085 } },
      { id: 'bin-a', name: 'Recycle bin A', object: bin1G, y: 0, dimensions: { w: .31, h: .30, d: .23 } },
      { id: 'bin-b', name: 'Recycle bin B', object: bin2G, y: 0, dimensions: { w: .31, h: .30, d: .23 } },
      { id: 'chair-a', name: 'Chair A', object: chair1G, y: 0, dimensions: { w: CHAIR.baseR * 2, h: CHAIR.seatH + CHAIR.backH, d: CHAIR.baseR * 2 } },
      { id: 'chair-b', name: 'Chair B', object: chair2G, y: 0, dimensions: { w: CHAIR.baseR * 2, h: CHAIR.seatH + CHAIR.backH, d: CHAIR.baseR * 2 } },
      { id: 'microchill', name: 'MicroChill', object: microchillG, y: 0, dimensions: { w: FRIDGE.w, h: FRIDGE.h + MICROWAVE.h, d: FRIDGE.d } },
    ],
    onInteractionStart: () => { walk.dragging = false; orbit.enabled = false; },
    onInteractionEnd: () => { walk.dragging = false; orbit.enabled = state.mode === 'orbit'; },
    initialLayout,
    onLayoutChange,
  });
  $('bResetLayout').onclick = () => planner.clearLayout();
  panel.querySelectorAll('[data-mode]').forEach(button => {
    button.onclick = () => setMode(button.dataset.mode);
  });
  $('settingsToggle').onclick = () => {
    const open = panel.classList.toggle('open');
    $('settingsToggle').classList.toggle('on', open);
  };
  setMode(state.mode);

  // ---------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  applyNight(tw.night);
  apis.door?.setOpen?.(tw.door);
  apis.closetA?.setOpen?.(tw.closetA);
  apis.closetB?.setOpen?.(tw.closetB);
  apis.window?.setShade?.(tw.shade);

  let disposed = false;
  let rafId = 0;
  let splashDone = false;
  let splashTimer = 0;
  function frame() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!splashDone) {
      splashDone = true;
      const sp = $('splash');
      requestAnimationFrame(() => { if (!sp || disposed) return; sp.style.opacity = '0'; splashTimer = setTimeout(() => sp.remove(), 550); });
    }
    // tweens
    let nightChanged = false;
    for (const k of Object.keys(tw)) {
      const d = twTarget[k] - tw[k];
      if (Math.abs(d) > 1e-4) {
        tw[k] += d * Math.min(1, dt * 5.5);
        if (k === 'door') apis.door?.setOpen?.(tw.door);
        if (k === 'closetA') apis.closetA?.setOpen?.(tw.closetA);
        if (k === 'closetB') apis.closetB?.setOpen?.(tw.closetB);
        if (k === 'shade') apis.window?.setShade?.(tw.shade);
        if (k === 'night') nightChanged = true;
      }
    }
    if (nightChanged) applyNight(tw.night);
    apis.fan?.update?.(dt);

    if (state.mode === 'walk') {
      const sp = (walk.keys.ShiftLeft ? 2.6 : 1.5) * dt;
      const jumpHeight = stepJump(walk.jump, dt);
      const f = new THREE.Vector3(Math.cos(walk.yaw), 0, -Math.sin(walk.yaw));
      const r = new THREE.Vector3(-f.z, 0, f.x);
      if (walk.keys.KeyW || walk.keys.ArrowUp) walk.pos.addScaledVector(f, sp);
      if (walk.keys.KeyS || walk.keys.ArrowDown) walk.pos.addScaledVector(f, -sp);
      if (walk.keys.KeyA || walk.keys.ArrowLeft) walk.pos.addScaledVector(r, -sp);
      if (walk.keys.KeyD || walk.keys.ArrowRight) walk.pos.addScaledVector(r, sp);
      collide(walk.pos);
      camera.position.set(walk.pos.x - ROOM.L / 2, EYE + jumpHeight, walk.pos.z - ROOM.W / 2);
      const look = new THREE.Vector3(
        camera.position.x + Math.cos(walk.yaw) * Math.cos(walk.pitch),
        camera.position.y + Math.sin(walk.pitch),
        camera.position.z - Math.sin(walk.yaw) * Math.cos(walk.pitch)
      );
      camera.lookAt(look);
    } else {
      orbit.update();
    }

    renderer.render(scene, camera);
    planner.update();
    if (!STILL || clock.elapsedTime < 1.5) rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  const onResize = () => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  // ---------------------------------------------------------------- teardown
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    clearTimeout(splashTimer);
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    ro.disconnect();
    planner.dispose();
    orbit.dispose();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of materials) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    style.remove();
    container.classList.remove('dorm-room-host');
    container.innerHTML = '';
  }

  return { dispose };
}
