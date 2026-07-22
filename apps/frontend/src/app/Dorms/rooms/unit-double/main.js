// Units 1-3 standard double — interactive measured reconstruction.
// Exports createUnitDoubleRoom({ container, onNavigateRooms }) -> { dispose }.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterials } from './materials.js';
import * as H from '../helpers.js';
import * as spec from './spec.js';
import { buildShell } from './modules/shell.js';
import { buildDoor, buildWindow } from './modules/doorwin.js';
import { buildBed, buildBookcase } from './modules/bed.js';
import { buildClosets } from './modules/closet.js';
import { buildDesk, buildChair } from './modules/desk.js';
import { buildFixtures } from './modules/fixtures.js';
import { buildMicroChill } from '../modules/microchill.js';
import { createPlanner } from '../planner.js';
import { constrainToRoom, createJumpState, queueJump, resetJump, stepJump } from '../walk-physics.js';

const {ROOM,LAYOUT,BED,BOOKCASE,CLOSET,DESK,CHAIR,FRIDGE,MICROWAVE,EYE}=spec;

// Settings cog (feather "settings" glyph); inherits currentColor.
const COG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// Scoped under .dorm-room-host — the app supplies the theme tokens
// (--foreground-color, --heading-color, …) globally via body[data-theme].
const CSS=`
.dorm-room-host { --sans:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; --mono:ui-monospace,SFMono-Regular,Menlo,monospace; position:absolute; inset:0; overflow:hidden; background:#14161a; font-family:var(--sans); }
.dorm-room-host *{margin:0;padding:0;box-sizing:border-box}.dorm-room-host canvas.gl{display:block}.dorm-room-host .hud{position:absolute;user-select:none;-webkit-user-select:none}
.dorm-room-host #settingsToggle{z-index:9;top:12px;right:12px;width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--paragraph-color);border-radius:4px;cursor:pointer;box-shadow:0 2px 8px rgb(0 0 0 / 10%)}.dorm-room-host #settingsToggle:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host #settingsToggle.on{background:var(--blue-500);border-color:var(--blue-500);color:#fff}.dorm-room-host #settingsToggle svg{width:18px;height:18px}
.dorm-room-host #panel{display:none;z-index:8;top:56px;right:12px;width:276px;background:var(--foreground-color);color:var(--heading-color);border:1px solid var(--border-color);border-radius:6px;padding:12px;box-shadow:0 8px 28px rgb(0 0 0 / 15%);font-size:12px;max-height:calc(100% - 68px);overflow:auto}.dorm-room-host #panel.open{display:block}.dorm-room-host .panel-head{margin-bottom:2px}.dorm-room-host .panel-title{font-size:15px;font-weight:600;letter-spacing:-.01em;color:var(--heading-color)}.dorm-room-host .panel-meta{font-size:12px;color:var(--label-color);margin-top:2px}.dorm-room-host #panel h3{font-size:12px;font-weight:600;margin:12px 0 7px}.dorm-room-host .row{display:flex;gap:4px;flex-wrap:wrap}.dorm-room-host .btn{flex:1 1 auto;min-width:56px;height:30px;border:1px solid var(--border-color);background:transparent;color:var(--paragraph-color);border-radius:4px;padding:0 7px;font-size:11px;cursor:pointer;text-align:center;display:grid;place-items:center}.dorm-room-host .btn:hover{background:var(--button-hover-color);color:var(--heading-color)}.dorm-room-host .btn.on{background:var(--blue-500);border-color:var(--blue-500);color:white}.dorm-room-host .slider{width:100%;accent-color:var(--blue-500);margin:2px 0 4px}.dorm-room-host label.sl{display:block;font-size:11px;color:var(--paragraph-color);margin:9px 0 5px}
.dorm-room-host #err{z-index:7;top:56px;left:12px;max-width:420px;font:11px/1.5 var(--mono);color:#ef4444;white-space:pre-wrap}.dorm-room-host #splash{inset:0;background:#14161a;color:white;display:flex;align-items:center;justify-content:center;z-index:10;transition:opacity .35s;font-size:18px;font-weight:600}
@media(prefers-reduced-motion:reduce){.dorm-room-host *{transition:none!important}}
`;

export function createUnitDoubleRoom({ container }) {
const Q=new URLSearchParams(location.search), STILL=Q.get('still')==='1';

container.classList.add('dorm-room-host');
const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
container.innerHTML=`
  <button class="hud" id="settingsToggle" aria-label="Settings" title="Settings">${COG}</button>
  <div class="hud" id="panel"></div>
  <div class="hud" id="err"></div><div class="hud" id="splash">Roomplan</div>`;

const cleanupDom=()=>{style.remove();container.classList.remove('dorm-room-host');container.innerHTML=''};
const $=id=>container.querySelector('#'+id);
const errBox=$('err');
function reportErr(where,e){console.error(where,e);errBox.textContent+=`[${where}] ${e.message||e}\n`}
const width = () => container.clientWidth || 1; const height = () => container.clientHeight || 1;
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){cleanupDom();throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(width(),height());renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.domElement.className='gl';renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D room view');container.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x14161a);const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.4;
const camera=new THREE.PerspectiveCamera(60,width()/height(),.02,60), mats=createMaterials(THREE,{procedural:true}), ctx={THREE,mats,spec,H};
const root=new THREE.Group();root.position.set(-ROOM.L/2,0,-ROOM.W/2);scene.add(root);
const apis={};
function place(name,builder,args,x=0,y=0,z=0,rotY=0){try{const g=args!==undefined?builder(ctx,args):builder(ctx);g.position.set(x,y,z);g.rotation.y=rotY;root.add(g);if(g.userData?.api)apis[name]=g.userData.api;return g}catch(e){reportErr(name,e);return null}}
place('shell',buildShell);
place('door',buildDoor,undefined,spec.DOOR.x0+spec.DOOR.w,0,0,-Math.PI/2);
place('window',buildWindow);
place('closets',buildClosets);
const bedLeftG=place('bedLeft',buildBed,{drawerSide:LAYOUT.bedLeft.drawerSide},LAYOUT.bedLeft.x,0,LAYOUT.bedLeft.z,LAYOUT.bedLeft.rotY);
const bedRightG=place('bedRight',buildBed,{drawerSide:LAYOUT.bedRight.drawerSide},LAYOUT.bedRight.x,0,LAYOUT.bedRight.z,LAYOUT.bedRight.rotY);
place('entryShelf',buildBookcase,undefined,LAYOUT.entryShelf.x,0,LAYOUT.entryShelf.z,LAYOUT.entryShelf.rotY);
const deskLeftG=place('deskLeft',buildDesk,undefined,LAYOUT.deskLeft.x,0,LAYOUT.deskLeft.z,LAYOUT.deskLeft.rotY);
const deskRightG=place('deskRight',buildDesk,undefined,LAYOUT.deskRight.x,0,LAYOUT.deskRight.z,LAYOUT.deskRight.rotY);
const chairLeftG=place('chairLeft',buildChair,undefined,LAYOUT.chairLeft.x,0,LAYOUT.chairLeft.z,LAYOUT.chairLeft.rotY);
const chairRightG=place('chairRight',buildChair,undefined,LAYOUT.chairRight.x,0,LAYOUT.chairRight.z,LAYOUT.chairRight.rotY);
const microchillG=place('microchill',buildMicroChill,undefined,LAYOUT.microchill.x+FRIDGE.w,LAYOUT.microchill.y,LAYOUT.microchill.z,Math.PI);
place('fixtures',buildFixtures);

const furnishedObjs=[],moveinObjs=[],ceilingMeshes=[];let lightboxG=null;
root.traverse(o=>{if(o.userData.furnishedOnly)furnishedObjs.push(o);if(o.userData.moveinOnly)moveinObjs.push(o);if(o.userData.isCeiling)ceilingMeshes.push(o);if(o.userData.isLightbox)lightboxG=o});
const hemi=new THREE.HemisphereLight(0xcfe0f2,0x7d8177,.38);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffedd2,2.6);sun.position.set(-3.2,3.0,-3.8);sun.target.position.set(0,.6,.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.015;Object.assign(sun.shadow.camera,{left:-4.6,right:4.6,top:4.6,bottom:-4.6,near:.5,far:15});scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0xdfe8f2,.25);fill.position.set(ROOM.L,2.2,-ROOM.W);scene.add(fill);
const ceilPt=new THREE.PointLight(0xffe9c4,0,8,2);ceilPt.position.set(0,ROOM.H-.18,0);ceilPt.castShadow=true;scene.add(ceilPt);

// Guard 0..1 params from shared links against NaN (see main.js parse01).
const parse01=(v,dflt)=>{const n=parseFloat(v??'');return Number.isFinite(n)?Math.min(1,Math.max(0,n)):dflt};
const state={mode:'walk',night:Q.get('tod')==='night',furnished:Q.get('furnished')!=='0',door:parse01(Q.get('door'),0),shade:parse01(Q.get('shade'),.15),light:Q.get('light')==='1'};
const tw={door:state.door,shade:state.shade,night:state.night?1:0}, twTarget={...tw};
function applyFurnished(){furnishedObjs.forEach(o=>o.visible=state.furnished);moveinObjs.forEach(o=>o.visible=!state.furnished)}
function applyNight(t){sun.intensity=THREE.MathUtils.lerp(2.6,.15,t);sun.color.set(t>.5?0x93a9c9:0xffedd2);hemi.intensity=THREE.MathUtils.lerp(.38,.06,t);fill.intensity=THREE.MathUtils.lerp(.25,.05,t);scene.environmentIntensity=THREE.MathUtils.lerp(.4,.1,t);renderer.toneMappingExposure=THREE.MathUtils.lerp(1,.86,t);const on=state.light||t>.5;ceilPt.intensity=on?THREE.MathUtils.lerp(.5,15,Math.max(t,state.light?1:0)):0;apis.fixtures?.setLight?.(on);apis.window?.setNight?.(t)}
applyFurnished();

const CAMS={
  door:{p:[2.10,1.58,.42],t:[2.10,.95,3.12]}, window:{p:[2.10,1.48,3.46],t:[2.10,1.12,.56]},
  beds:{p:[2.10,1.58,1.10],t:[2.10,.74,2.65]}, desks:{p:[.72,1.45,2.08],t:[2.18,.72,2.18]},
  closets:{p:[2.10,1.42,1.54],t:[2.10,1.10,.18]}, shelf:{p:[1.64,1.42,.72],t:[2.68,1.06,.31]},
  corner:{p:[3.56,1.62,1.02],t:[1.55,.88,2.65]}, plan:{p:[2.095,7.35,2.005],t:[2.095,0,2.005]},
};
const toWorld=a=>new THREE.Vector3(a[0]-ROOM.L/2,a[1],a[2]-ROOM.W/2), orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.maxDistance=8.5;orbit.minDistance=.15;
function setCam(name){const c=Object.hasOwn(CAMS,name)?CAMS[name]:CAMS.door;camera.position.copy(toWorld(c.p));orbit.target.copy(toWorld(c.t));orbit.update();const show=name!=='plan';ceilingMeshes.forEach(m=>m.visible=show);if(lightboxG)lightboxG.visible=show}
setCam(Q.get('cam')||'door');

const walk={yaw:-Math.PI/2,pitch:-.04,pos:new THREE.Vector3(2.10,EYE,.92),keys:{},dragging:false,lx:0,ly:0,jump:createJumpState()};
const FIXED=[[0,0,CLOSET.left.x1,CLOSET.depth,CLOSET.h],[LAYOUT.entryShelf.x-BOOKCASE.d,LAYOUT.entryShelf.z,LAYOUT.entryShelf.x,LAYOUT.entryShelf.z+BOOKCASE.w,BOOKCASE.h],[CLOSET.right.x0,0,ROOM.L,CLOSET.depth,CLOSET.h],[LAYOUT.radiator.x-spec.RADIATOR.w/2,ROOM.W-spec.RADIATOR.d,LAYOUT.radiator.x+spec.RADIATOR.w/2,ROOM.W,spec.RADIATOR.y0+spec.RADIATOR.h]];
let planner=null;const RADIUS=.22;
function collide(p){constrainToRoom(p,ROOM,RADIUS)}
const dom=renderer.domElement;dom.addEventListener('pointerdown',e=>{if(state.mode==='walk'){walk.dragging=true;walk.lx=e.clientX;walk.ly=e.clientY;dom.setPointerCapture(e.pointerId)}});dom.addEventListener('pointermove',e=>{if(state.mode==='walk'&&walk.dragging){walk.yaw-=(e.clientX-walk.lx)*.0042;walk.pitch=THREE.MathUtils.clamp(walk.pitch-(e.clientY-walk.ly)*.0032,-1.2,1.2);walk.lx=e.clientX;walk.ly=e.clientY}});dom.addEventListener('pointerup',()=>walk.dragging=false);
const CAM_ORDER=['door','window','beds','desks','closets','shelf','corner','plan'],WALK_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);const onKeyDown=e=>{const editing=e.target?.matches?.('input,textarea,select,[contenteditable="true"]');if(editing){walk.keys[e.code]=false;return}walk.keys[e.code]=true;if(state.mode==='walk'&&WALK_KEYS.has(e.code)){e.preventDefault();if(e.code==='Space'&&!e.repeat)queueJump(walk.jump)}const n=parseInt(e.key,10);if(n>=1&&n<=CAM_ORDER.length){setMode('orbit');setCam(CAM_ORDER[n-1])}};const onKeyUp=e=>walk.keys[e.code]=false;addEventListener('keydown',onKeyDown);addEventListener('keyup',onKeyUp);
function setMode(m){state.mode=m;orbit.enabled=m==='orbit';resetJump(walk.jump);if(m==='walk'){const wp=camera.position;walk.pos.set(THREE.MathUtils.clamp(wp.x+ROOM.L/2,.3,ROOM.L-.3),EYE,THREE.MathUtils.clamp(wp.z+ROOM.W/2,.3,ROOM.W-.3));collide(walk.pos)}syncUI()}

const panel=$('panel');panel.innerHTML=`<div class="panel-head"><div class="panel-title">Units 1–3 Double</div><div class="panel-meta">13′9″ × 13′2″</div></div><h3>Navigation</h3><div class="row"><button class="btn" type="button" data-mode="orbit">Orbit</button><button class="btn" type="button" data-mode="walk">Walk</button></div><h3>Scene</h3><div class="row"><div class="btn" id="bDay">Day</div><div class="btn" id="bNight">Night</div></div><div class="row" style="margin-top:6px"><div class="btn" id="bFurn">Furnished</div><div class="btn" id="bMove">Move-in</div></div><h3>Room</h3><div class="row"><div class="btn" id="bDoor">Door</div><div class="btn" id="bLamp">Light</div></div><label class="sl">Curtains</label><input type="range" class="slider" id="sShade" min="0" max="1" step=".01"><h3>Layout</h3><div class="row"><div class="btn" id="bResetLayout">Reset items</div></div>`;
function syncUI(){panel.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===state.mode));$('bDay')?.classList.toggle('on',!state.night);$('bNight')?.classList.toggle('on',state.night);$('bFurn')?.classList.toggle('on',state.furnished);$('bMove')?.classList.toggle('on',!state.furnished);$('bDoor')?.classList.toggle('on',twTarget.door>.5);$('bLamp')?.classList.toggle('on',state.light);if($('sShade'))$('sShade').value=twTarget.shade}
$('bDay').onclick=()=>{state.night=false;twTarget.night=0;syncUI()};$('bNight').onclick=()=>{state.night=true;twTarget.night=1;syncUI()};$('bFurn').onclick=()=>{state.furnished=true;applyFurnished();syncUI()};$('bMove').onclick=()=>{state.furnished=false;applyFurnished();syncUI()};$('bDoor').onclick=()=>{twTarget.door=twTarget.door>.5?0:1;syncUI()};$('bLamp').onclick=()=>{state.light=!state.light;applyNight(tw.night);syncUI()};$('sShade').oninput=e=>twTarget.shade=parseFloat(e.target.value);syncUI();

planner=createPlanner({THREE,root,camera,renderer,orbit,room:ROOM,container,fixedColliders:FIXED,setPlanView:()=>{setMode('orbit');setCam('plan')},builtins:[
  {id:'bed-left',name:'Left Twin XL bed',object:bedLeftG,y:0,dimensions:{w:BED.W,h:BED.postH,d:BED.L}},
  {id:'bed-right',name:'Right Twin XL bed',object:bedRightG,y:0,dimensions:{w:BED.W,h:BED.postH,d:BED.L}},
  {id:'desk-left',name:'Left desk',object:deskLeftG,y:0,dimensions:{w:DESK.d,h:DESK.h,d:DESK.w}},
  {id:'desk-right',name:'Right desk',object:deskRightG,y:0,dimensions:{w:DESK.d,h:DESK.h,d:DESK.w}},
  {id:'chair-left',name:'Left chair',object:chairLeftG,y:0,dimensions:{w:CHAIR.baseR*2,h:CHAIR.seatH+CHAIR.backH,d:CHAIR.baseR*2}},
  {id:'chair-right',name:'Right chair',object:chairRightG,y:0,dimensions:{w:CHAIR.baseR*2,h:CHAIR.seatH+CHAIR.backH,d:CHAIR.baseR*2}},
  {id:'microchill',name:'MicroChill',object:microchillG,y:LAYOUT.microchill.y,dimensions:{w:FRIDGE.w,h:FRIDGE.h+MICROWAVE.h,d:FRIDGE.d}},
],onInteractionStart:()=>{walk.dragging=false;orbit.enabled=false},onInteractionEnd:()=>{walk.dragging=false;orbit.enabled=state.mode==='orbit'}});
$('bResetLayout').onclick=()=>planner.clearLayout();panel.querySelectorAll('[data-mode]').forEach(button=>{button.onclick=()=>setMode(button.dataset.mode)});$('settingsToggle').onclick=()=>{const open=panel.classList.toggle('open');$('settingsToggle').classList.toggle('on',open)};setMode(state.mode);

const clock=new THREE.Clock();applyNight(tw.night);apis.door?.setOpen?.(tw.door);apis.window?.setShade?.(tw.shade);let disposed=false,rafId=0,splashDone=false,splashTimer=0;
function frame(){if(disposed)return;const dt=Math.min(clock.getDelta(),.05);if(!splashDone){splashDone=true;const sp=$('splash');requestAnimationFrame(()=>{if(!sp||disposed)return;sp.style.opacity='0';splashTimer=setTimeout(()=>sp.remove(),550)})}let nightChanged=false;for(const k of Object.keys(tw)){const d=twTarget[k]-tw[k];if(Math.abs(d)>1e-4){tw[k]+=d*Math.min(1,dt*5.5);if(k==='door')apis.door?.setOpen?.(tw.door);if(k==='shade')apis.window?.setShade?.(tw.shade);if(k==='night')nightChanged=true}}if(nightChanged)applyNight(tw.night);if(state.mode==='walk'){const speed=(walk.keys.ShiftLeft?2.6:1.5)*dt,f=new THREE.Vector3(Math.cos(walk.yaw),0,-Math.sin(walk.yaw)),r=new THREE.Vector3(-f.z,0,f.x),jumpHeight=stepJump(walk.jump,dt);if(walk.keys.KeyW||walk.keys.ArrowUp)walk.pos.addScaledVector(f,speed);if(walk.keys.KeyS||walk.keys.ArrowDown)walk.pos.addScaledVector(f,-speed);if(walk.keys.KeyA||walk.keys.ArrowLeft)walk.pos.addScaledVector(r,-speed);if(walk.keys.KeyD||walk.keys.ArrowRight)walk.pos.addScaledVector(r,speed);collide(walk.pos);camera.position.set(walk.pos.x-ROOM.L/2,EYE+jumpHeight,walk.pos.z-ROOM.W/2);camera.lookAt(camera.position.x+Math.cos(walk.yaw)*Math.cos(walk.pitch),camera.position.y+Math.sin(walk.pitch),camera.position.z-Math.sin(walk.yaw)*Math.cos(walk.pitch))}else orbit.update();renderer.render(scene,camera);planner?.update();if(!STILL||clock.elapsedTime<1.5)rafId=requestAnimationFrame(frame)}
rafId=requestAnimationFrame(frame);
const onResize=()=>{camera.aspect=width()/height();camera.updateProjectionMatrix();renderer.setSize(width(),height())};
const ro=new ResizeObserver(onResize);ro.observe(container);

function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(rafId);clearTimeout(splashTimer);removeEventListener('keydown',onKeyDown);removeEventListener('keyup',onKeyUp);ro.disconnect();planner.dispose();orbit.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:o.material?[o.material]:[];for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}});scene.environment?.dispose();pmrem.dispose();renderer.dispose();renderer.forceContextLoss?.();style.remove();container.classList.remove('dorm-room-host');container.innerHTML=''}

return { dispose };
}
