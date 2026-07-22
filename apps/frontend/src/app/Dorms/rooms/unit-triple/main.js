// Units 1–3 Triple — interactive 3D reconstruction. App shell.
// Adapted from the Blackwell shell (src/main.js); room-specific throughout.
// Exports createUnitTripleRoom({ container, onNavigateRooms }) -> { dispose }.
// All DOM lives inside `container`; dispose() tears down listeners, the render
// loop, and GPU resources so the room can mount/unmount inside the SPA.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterials } from './materials.js';
import * as H from '../helpers.js';
import * as spec from './spec.js';
import { buildShell } from './modules/shell.js';
import { buildDoor, buildWindow } from './modules/doorwin.js';
import { buildBed } from './modules/bed.js';
import { buildClosetRun, buildDresser } from './modules/closet.js';
import { buildDesk, buildChair } from './modules/desk.js';
import { buildFixtures } from './modules/fixtures.js';
import { buildMicroChill } from '../modules/microchill.js';
import { createPlanner } from '../planner.js';
import { constrainToRoom, createJumpState, queueJump, resetJump, stepJump } from '../walk-physics.js';

const { ROOM, LAYOUT, BED, CLOSET, DRESSER, DESK, CHAIR, FRIDGE, MICROWAVE, EYE } = spec;

// Settings cog (feather "settings" glyph); inherits currentColor.
const COG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// ---------------------------------------------------------------- css
// Scoped under .dorm-room-host — the app supplies the theme tokens
// (--foreground-color, --heading-color, …) globally via body[data-theme].
const CSS = `
.dorm-room-host { --sans:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  position:absolute; inset:0; overflow:hidden; background:#14161a; font-family:var(--sans); }
.dorm-room-host *{margin:0;padding:0;box-sizing:border-box}.dorm-room-host canvas.gl{display:block}.dorm-room-host .hud{position:absolute;user-select:none;-webkit-user-select:none}
.dorm-room-host #settingsToggle{z-index:9;top:12px;right:12px;width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--paragraph-color);border-radius:4px;cursor:pointer;box-shadow:0 2px 8px rgb(0 0 0 / 10%)}.dorm-room-host #settingsToggle:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host #settingsToggle.on{background:var(--blue-500);border-color:var(--blue-500);color:#fff}.dorm-room-host #settingsToggle svg{width:18px;height:18px}
.dorm-room-host #panel{display:none;z-index:8;top:56px;right:12px;width:276px;background:var(--foreground-color);color:var(--heading-color);border:1px solid var(--border-color);border-radius:6px;padding:12px;box-shadow:0 8px 28px rgb(0 0 0 / 15%);font-size:12px;max-height:calc(100% - 68px);overflow:auto}.dorm-room-host #panel.open{display:block}.dorm-room-host .panel-head{margin-bottom:2px}.dorm-room-host .panel-title{font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--heading-color)}.dorm-room-host .panel-meta{font-size:12px;color:var(--label-color);margin-top:2px}.dorm-room-host #panel h3{font-size:12px;font-weight:600;color:var(--heading-color);margin:12px 0 7px}.dorm-room-host .row{display:flex;gap:4px;flex-wrap:wrap}.dorm-room-host .btn{flex:1 1 auto;min-width:56px;height:30px;border:1px solid var(--border-color);background:transparent;color:var(--paragraph-color);border-radius:4px;padding:0 7px;font-size:11px;cursor:pointer;text-align:center;display:grid;place-items:center}.dorm-room-host .btn:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host .btn.on{background:var(--blue-500);border-color:var(--blue-500);color:white;font-weight:500}.dorm-room-host .slider{width:100%;accent-color:var(--blue-500);margin:2px 0 4px}.dorm-room-host label.sl{display:block;font-size:11px;color:var(--paragraph-color);margin:9px 0 5px}
.dorm-room-host #err{z-index:7;top:56px;left:12px;max-width:420px;font:11px/1.5 var(--mono);color:#ef4444;white-space:pre-wrap}.dorm-room-host #splash{inset:0;background:#14161a;color:white;display:flex;align-items:center;justify-content:center;z-index:10;transition:opacity .35s;font-size:18px;font-weight:600}
@media (prefers-reduced-motion: reduce){ .dorm-room-host *{ transition:none !important; } }
`;

export function createUnitTripleRoom({ container, initialLayout = null, onLayoutChange = () => {} }) {
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

  place('shell', buildShell);
  // Door module already builds in the correct x=0 plane. The official plan's
  // opening is in the LEFT wall, so it mounts at the room origin with no spin.
  place('door', buildDoor);
  place('window', buildWindow);
  // Official plan: loft + two desks on the upper wall; bunk opposite. Both
  // bed heads are at the window end, leaving their dressers at the left feet.
  const loftG = place('loft', buildBed, { variant: 'loft' }, LAYOUT.loft.x, 0, LAYOUT.loft.z);
  const bunkG = place('bunk', buildBed, { variant: 'bunk' }, LAYOUT.bunk.x + spec.BED.L,
    0, LAYOUT.bunk.z, Math.PI);
  place('closets', buildClosetRun);
  const closetDresserGs = CLOSET.dresserBays.map((bayIndex) => {
    const bayCenter = CLOSET.z0 + CLOSET.partT + CLOSET.bayW / 2
      + bayIndex * (CLOSET.bayW + CLOSET.partT);
    return place(`dresserCloset${bayIndex + 1}`, buildDresser, undefined,
      0.012, 0, bayCenter + DRESSER.w / 2, Math.PI / 2);
  });
  const dresserBunkG = place('dresserBunk', buildDresser, undefined,
    LAYOUT.dresserBunk.x + spec.DRESSER.w, 0, LAYOUT.dresserBunk.z, Math.PI);
  const deskAG = place('deskA', buildDesk, undefined,
    LAYOUT.deskA.cx, 0, LAYOUT.deskA.z, Math.PI);
  const deskBG = place('deskB', buildDesk, undefined,
    LAYOUT.deskB.cx, 0, LAYOUT.deskB.z, Math.PI);
  const desk3G = place('desk3', buildDesk, undefined, ROOM.L - 0.02 - DESK.d / 2, 0, LAYOUT.desk3.cz, Math.PI / 2);
  const chairAG = place('chairA', buildChair, undefined, LAYOUT.chairA.x, 0, LAYOUT.chairA.z, LAYOUT.chairA.rotY);
  const chairBG = place('chairB', buildChair, undefined, LAYOUT.chairB.x, 0, LAYOUT.chairB.z, LAYOUT.chairB.rotY);
  const chair3G = place('chair3', buildChair, undefined, LAYOUT.chair3.x, 0, LAYOUT.chair3.z, LAYOUT.chair3.rotY);
  const microchillG = place('microchill', buildMicroChill, undefined,
    LAYOUT.fridge.x, 0, LAYOUT.fridge.z, LAYOUT.fridge.rotY);
  place('fixtures', buildFixtures);

  // furnished / move-in registries
  const furnishedObjs = [], moveinObjs = [];
  root.traverse(o => {
    if (o.userData.furnishedOnly) furnishedObjs.push(o);
    if (o.userData.moveinOnly) moveinObjs.push(o);
  });

  // ceiling meshes for plan view (shell tags slab/ribs/beam; fixtures may tag
  // ceiling-mounted bits) — collect across the whole room
  const ceilingMeshes = [];
  root.traverse(o => { if (o.userData.isCeiling) ceilingMeshes.push(o); });
  let lightboxG = null;
  root.traverse(o => { if (o.userData.isLightbox) lightboxG = o; });

  // ---------------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0xcfe0f2, 0x7d8177, 0.38);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffedd2, 2.6);
  sun.position.set(ROOM.L / 2 + 3.4, 2.6, -ROOM.W / 2 + 1.2);
  sun.target.position.set(-1.2, 0.3, 0.45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.015;
  const sc = sun.shadow.camera;
  sc.left = -4.6; sc.right = 4.6; sc.top = 4.6; sc.bottom = -4.6; sc.near = 0.5; sc.far = 15;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.25);
  fill.position.set(-ROOM.L, 2.2, ROOM.W);
  scene.add(fill);
  // ceiling fixture light
  const ceilPt = new THREE.PointLight(0xffe9c4, 0, 8, 2);
  ceilPt.position.set(LAYOUT.lightbox.x - ROOM.L / 2, ROOM.H - spec.LIGHTBOX.h - 0.10, LAYOUT.lightbox.z - ROOM.W / 2);
  ceilPt.castShadow = true;
  ceilPt.shadow.mapSize.set(1024, 1024);
  ceilPt.shadow.bias = -0.002;
  scene.add(ceilPt);

  // ---------------------------------------------------------------- state + tweens
  // Guard 0..1 params from shared links against NaN (see main.js parse01).
  const parse01 = (v, dflt) => {
    const n = parseFloat(v ?? '');
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : dflt;
  };
  const state = {
    mode: 'walk',                   // orbit | walk
    night: Q.get('tod') === 'night',
    furnished: Q.get('furnished') !== '0',
    door: parse01(Q.get('door'), 0),
    shade: parse01(Q.get('shade'), 0.15),   // curtain draw
    light: Q.get('light') === '1',
  };
  const tw = { door: state.door, shade: state.shade, night: state.night ? 1 : 0 };
  const twTarget = { ...tw };

  function applyFurnished() {
    furnishedObjs.forEach(o => o.visible = state.furnished);
    moveinObjs.forEach(o => o.visible = !state.furnished);
  }
  function applyNight(t) {
    sun.intensity = THREE.MathUtils.lerp(2.6, 0.15, t);
    sun.color.set(t > 0.5 ? 0x93a9c9 : 0xffedd2);
    hemi.intensity = THREE.MathUtils.lerp(0.38, 0.06, t);
    fill.intensity = THREE.MathUtils.lerp(0.25, 0.05, t);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.4, 0.1, t);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 0.86, t);
    const lightOn = state.light || t > 0.5;
    ceilPt.intensity = lightOn ? THREE.MathUtils.lerp(0.5, 15, Math.max(t, state.light ? 1 : 0)) : 0;
    apis.fixtures?.setLight?.(lightOn);
    apis.window?.setNight?.(t);
  }
  applyFurnished();

  // ---------------------------------------------------------------- cameras
  const CAMS = {
    door:    { p: [0.42, 1.58, 0.64], t: [4.00, 0.95, 2.35] },
    window:  { p: [1.00, 1.45, 2.01], t: [4.19, 1.35, 2.01] },
    beds:    { p: [3.78, 1.60, 2.72], t: [1.05, 0.85, 0.15] },
    desks:   { p: [2.38, 1.50, 1.48], t: [2.48, 0.95, 0.10] },
    closets: { p: [3.45, 1.48, 2.52], t: [0.05, 1.22, 2.52] },
    fridge:  { p: [0.86, 1.38, 1.56], t: [1.68, 0.76, 0.28] },
    corner:  { p: [3.78, 1.65, 2.72], t: [0.35, 1.00, 0.58] },
    plan:    { p: [2.095, 7.40, 2.005], t: [2.095, 0.00, 2.005] },
  };
  const toWorld = (a) => new THREE.Vector3(a[0] - ROOM.L / 2, a[1], a[2] - ROOM.W / 2);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.maxDistance = 8.5;
  orbit.minDistance = 0.15;

  function setCam(name) {
    const c = Object.hasOwn(CAMS, name) ? CAMS[name] : CAMS.door;
    camera.position.copy(toWorld(c.p));
    orbit.target.copy(toWorld(c.t));
    orbit.update();
    const showCeil = name !== 'plan';
    ceilingMeshes.forEach(m => m.visible = showCeil);
    if (lightboxG) lightboxG.visible = showCeil;
  }
  setCam(Q.get('cam') || 'door');

  // walk mode ---------------------------------------------------------------
  const walk = { yaw: -Math.PI / 5, pitch: -0.04, pos: new THREE.Vector3(0.85, EYE, 1.60), keys: {}, dragging: false, lx: 0, ly: 0, jump: createJumpState() };
  const CLOSET_Z1 = spec.CLOSET.z0 + spec.CLOSET.bays * spec.CLOSET.bayW + (spec.CLOSET.bays + 1) * spec.CLOSET.partT;
  const COLLIDERS = [
    [0.00, spec.CLOSET.z0 - 0.02, spec.CLOSET.depth + 0.02, CLOSET_Z1 + 0.02, ROOM.H], // closet run
    [ROOM.L - 0.16, LAYOUT.radiator.cz - spec.RADIATOR.w / 2,
      ROOM.L, LAYOUT.radiator.cz + spec.RADIATOR.w / 2, spec.RADIATOR.y0 + spec.RADIATOR.h], // radiator sliver
  ];
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
  const CAM_ORDER = ['door', 'window', 'beds', 'desks', 'closets', 'fridge', 'corner', 'plan'];
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
    <div class="panel-head"><div class="panel-title">Units 1–3 Triple</div><div class="panel-meta">13′9″ × 13′2″</div></div>
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
      <div class="btn" id="bLamp">Light</div>
    </div>
    <label class="sl">Curtains</label>
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
    $('bLamp').classList.toggle('on', state.light);
    $('sShade').value = twTarget.shade;
  }
  $('bDay').onclick = () => { state.night = false; twTarget.night = 0; syncUI(); };
  $('bNight').onclick = () => { state.night = true; twTarget.night = 1; syncUI(); };
  $('bFurn').onclick = () => { state.furnished = true; applyFurnished(); syncUI(); };
  $('bMove').onclick = () => { state.furnished = false; applyFurnished(); syncUI(); };
  $('bDoor').onclick = () => { twTarget.door = twTarget.door > 0.5 ? 0 : 1; syncUI(); };
  $('bLamp').onclick = () => { state.light = !state.light; applyNight(tw.night); syncUI(); };
  $('sShade').oninput = e => { twTarget.shade = parseFloat(e.target.value); };
  syncUI();

  const planner=createPlanner({
    THREE,root,camera,renderer,orbit,room:ROOM,fixedColliders:COLLIDERS,container,
    setPlanView:()=>{setMode('orbit');setCam('plan')},
    builtins:[
      {id:'bunk',name:'Bunk bed',object:bunkG,y:0,dimensions:{w:BED.L,h:BED.bunk.postH,d:BED.W}},
      {id:'loft',name:'Loft bed',object:loftG,y:0,dimensions:{w:BED.L,h:BED.loft.postH,d:BED.W}},
      {id:'dresser-bunk',name:'Dresser A',object:dresserBunkG,y:0,dimensions:{w:DRESSER.w,h:DRESSER.h,d:DRESSER.d}},
      ...closetDresserGs.map((object, index) => ({
        id:`dresser-closet-${index + 1}`,
        name:`Closet dresser ${index + 1}`,
        object,
        y:0,
        dimensions:{w:DRESSER.d,h:DRESSER.h,d:DRESSER.w},
      })),
      {id:'desk-a',name:'Desk A',object:deskAG,y:0,dimensions:{w:DESK.w,h:DESK.h,d:DESK.d}},
      {id:'desk-b',name:'Desk B',object:deskBG,y:0,dimensions:{w:DESK.w,h:DESK.h,d:DESK.d}},
      {id:'desk-c',name:'Desk C',object:desk3G,y:0,dimensions:{w:DESK.d,h:DESK.h,d:DESK.w}},
      {id:'chair-a',name:'Chair A',object:chairAG,y:0,dimensions:{w:CHAIR.baseR*2,h:CHAIR.seatH+CHAIR.backH,d:CHAIR.baseR*2}},
      {id:'chair-b',name:'Chair B',object:chairBG,y:0,dimensions:{w:CHAIR.baseR*2,h:CHAIR.seatH+CHAIR.backH,d:CHAIR.baseR*2}},
      {id:'chair-c',name:'Chair C',object:chair3G,y:0,dimensions:{w:CHAIR.baseR*2,h:CHAIR.seatH+CHAIR.backH,d:CHAIR.baseR*2}},
      {id:'microchill',name:'MicroChill',object:microchillG,y:0,dimensions:{w:FRIDGE.w,h:FRIDGE.h+MICROWAVE.h,d:FRIDGE.d}},
    ],
    onInteractionStart:()=>{walk.dragging=false;orbit.enabled=false},
    onInteractionEnd:()=>{walk.dragging=false;orbit.enabled=state.mode==='orbit'},
    initialLayout,
    onLayoutChange,
  });
  $('bResetLayout').onclick=()=>planner.clearLayout();
  panel.querySelectorAll('[data-mode]').forEach(button=>{button.onclick=()=>setMode(button.dataset.mode)});$('settingsToggle').onclick=()=>{const open=panel.classList.toggle('open');$('settingsToggle').classList.toggle('on',open)};
  setMode(state.mode);

  // ---------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  applyNight(tw.night);
  apis.door?.setOpen?.(tw.door);
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
        if (k === 'shade') apis.window?.setShade?.(tw.shade);
        if (k === 'night') nightChanged = true;
      }
    }
    if (nightChanged) applyNight(tw.night);

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
    planner?.update();
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
