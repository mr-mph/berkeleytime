import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ITEM_CATALOG, CATALOG_BY_ID, ITEM_SPEC_SCHEMA, catalogItemSpec, validateItemSpec } from './catalog.js';

const IN = 0.0254;
const inch = m => m / IN;
const snapInch = (m, step = 1) => Math.round(inch(m) / step) * step * IN;
const fmtIn = m => {
  const n = inch(m);
  return `${Number.isInteger(Math.round(n * 10) / 10) ? Math.round(n) : n.toFixed(1)}″`;
};
export const rotationSliderDegrees = radians => {
  const raw = radians * 180 / Math.PI;
  const normalized = ((raw % 360) + 360) % 360;
  return Math.abs(raw) > 1e-8 && Math.abs(normalized) < 1e-8 ? 360 : normalized;
};
export const rotateByKeyboardStep = radians => (radians + 3 * Math.PI / 180) % (Math.PI * 2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const PLANNER_CSS = `
#plannerToggle{position:absolute;left:12px;top:12px;z-index:8;height:36px;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--heading-color);border-radius:4px;padding:0 12px;font:500 13px/1 var(--sans);cursor:pointer;box-shadow:0 2px 8px rgb(0 0 0 / 10%);opacity:1;transform:translateX(0);visibility:visible;transition:opacity 180ms ease 190ms,transform 360ms cubic-bezier(.22,1,.36,1),visibility 0s linear 190ms}
.dorm-room-host.planner-open #plannerToggle{opacity:0;transform:translateX(-12px);visibility:hidden;pointer-events:none;transition:opacity 120ms ease,transform 220ms cubic-bezier(.4,0,1,1),visibility 0s linear 120ms}
#planner{position:absolute;z-index:7;left:0;top:0;bottom:0;width:384px;background:var(--foreground-color);border-right:1px solid var(--border-color);color:var(--heading-color);font-family:var(--sans);display:flex;flex-direction:column;transform:translate3d(-101%,0,0);pointer-events:none;visibility:hidden;will-change:transform;transition:transform 360ms cubic-bezier(.4,0,.2,1),visibility 0s linear 360ms}
.dorm-room-host.planner-open #planner{transform:translate3d(0,0,0);pointer-events:auto;visibility:visible;transition:transform 420ms cubic-bezier(.22,1,.36,1),visibility 0s}.dorm-room-host.planner-open #minimap{left:396px}
#minimap{will-change:left;transition:left 420ms cubic-bezier(.22,1,.36,1)}
.pl-head{height:52px;padding:0 12px 0 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:8px}.pl-head h2{font-size:16px;font-weight:600;line-height:1;margin:0}.pl-count{font-size:12px;color:var(--label-color)}.pl-spacer{flex:1}
.pl-iconbtn,.pl-action,.pl-tool{height:32px;border:1px solid var(--border-color);background:transparent;color:var(--paragraph-color);border-radius:4px;padding:0 10px;font:500 12px/1 var(--sans);cursor:pointer}.pl-iconbtn{width:32px;padding:0;font-size:18px}.pl-iconbtn:hover,.pl-action:hover,.pl-tool:hover{background:var(--button-hover-color);color:var(--heading-color)}.pl-action.primary{background:var(--blue-500);border-color:var(--blue-500);color:white}.pl-action.primary:hover{background:var(--blue-hover)}
.pl-tabs{position:relative;display:flex;height:41px;padding:4px 12px;border-bottom:1px solid var(--border-color);gap:4px}.pl-tabs::after{content:'';position:absolute;z-index:0;left:12px;top:4px;width:calc((100% - 28px)/2);height:32px;border-radius:4px;background:var(--button-hover-color);transform:translateX(0);transition:transform 220ms cubic-bezier(.22,1,.36,1)}#planner[data-active-tab="ai"] .pl-tabs::after{transform:translateX(calc(100% + 4px))}.pl-tab{position:relative;z-index:1;flex:1;border:0;border-radius:4px;background:transparent;color:var(--paragraph-color);font:500 13px/1 var(--sans);cursor:pointer;transition:color 150ms ease}.pl-tab.on{color:var(--heading-color)}
.pl-scroll{overflow:auto;min-height:0;flex:1;padding:12px 12px 246px;scroll-padding-top:86px;will-change:opacity,transform}.pl-scroll.pl-switch-out{animation:pl-switch-out 90ms ease-in both;pointer-events:none}.pl-scroll.pl-switch-in{animation:pl-switch-in 180ms cubic-bezier(.22,1,.36,1) both;pointer-events:none}@keyframes pl-switch-out{to{opacity:0;transform:translateX(var(--pl-swap-out-x,-10px))}}@keyframes pl-switch-in{from{opacity:0;transform:translateX(var(--pl-swap-in-x,14px))}to{opacity:1;transform:translateX(0)}}.pl-view[hidden]{display:none}.pl-catalog-tools{position:sticky;z-index:4;top:-12px;margin:-12px -12px 0;padding:12px 12px 7px;background:var(--foreground-color);border-bottom:1px solid var(--border-color);box-shadow:0 8px 14px rgb(0 0 0 / 5%)}.pl-search{width:100%;height:32px;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--heading-color);border-radius:4px;padding:0 12px;outline:none;font:400 13px/1 var(--sans)}.pl-search:focus{border-color:var(--blue-500)}
.pl-catrow{display:grid;grid-template-columns:28px minmax(0,1fr) 28px;align-items:center;gap:2px;margin:6px 0}.pl-cats{display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;padding:3px 0;scrollbar-width:thin;scrollbar-color:var(--label-color) transparent;overscroll-behavior-inline:contain}.pl-cats::-webkit-scrollbar{height:4px}.pl-cats::-webkit-scrollbar-thumb{background:var(--label-color);border-radius:9px}.pl-catnav{height:28px;border:0;background:transparent;color:var(--paragraph-color);border-radius:4px;font:600 18px/1 var(--sans);cursor:pointer}.pl-catnav:hover{background:var(--button-hover-color);color:var(--heading-color)}.pl-cat{flex:0 0 auto;white-space:nowrap;height:28px;border:0;background:transparent;color:var(--paragraph-color);border-radius:4px;padding:0 9px;font:500 12px/1 var(--sans);cursor:pointer}.pl-cat:hover{background:var(--button-hover-color)}.pl-cat.on{background:var(--blue-500);color:white}
.pl-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--border-color);border-left:1px solid var(--border-color)}.pl-card{display:grid;grid-template-columns:30px 1fr;align-items:center;gap:8px;text-align:left;border:0;border-right:1px solid var(--border-color);border-bottom:1px solid var(--border-color);background:transparent;color:var(--heading-color);padding:8px;cursor:pointer;min-height:50px}.pl-card:hover{background:var(--button-hover-color)}.pl-mark{width:30px;height:30px;display:grid;place-items:center;border-radius:4px;background:var(--backdrop-color);font:600 10px/1 var(--sans);color:var(--paragraph-color)}.pl-name{display:block;font-size:12px;font-weight:500;line-height:1.15}.pl-size{display:block;font-size:10px;line-height:1.2;color:var(--label-color);margin-top:3px}
.pl-inspector{position:absolute;bottom:0;left:0;right:0;background:var(--foreground-color);border-top:1px solid var(--border-color);padding:12px 14px 14px;box-shadow:0 -8px 20px rgb(0 0 0 / 6%)}.pl-inspector[hidden]{display:none}.pl-selrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.pl-selname{font-size:13px;font-weight:600;line-height:1.25}.pl-fit{font:600 10px/1 var(--sans);padding:4px 6px;border-radius:4px;background:#dcfce7;color:#15803d}.pl-fit.bad{background:#fee2e2;color:#b91c1c}.pl-control{display:grid;grid-template-columns:68px minmax(0,1fr) 52px;align-items:center;gap:8px;min-height:32px;margin:5px 0}.pl-control label,.pl-dim-title{font:600 11px/1 var(--sans);color:var(--paragraph-color)}.pl-range{appearance:none;-webkit-appearance:none;width:100%;height:28px;margin:0;background:transparent;cursor:pointer}.pl-range::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:var(--border-color)}.pl-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5px;border:2px solid var(--foreground-color);border-radius:50%;background:var(--blue-500);box-shadow:0 0 0 1px var(--blue-500)}.pl-range::-moz-range-track{height:4px;border:0;border-radius:99px;background:var(--border-color)}.pl-range::-moz-range-progress{height:4px;border-radius:99px;background:var(--blue-500)}.pl-range::-moz-range-thumb{width:12px;height:12px;border:2px solid var(--foreground-color);border-radius:50%;background:var(--blue-500);box-shadow:0 0 0 1px var(--blue-500)}.pl-output{display:flex;align-items:center;justify-content:flex-end;height:28px;border:1px solid var(--border-color);border-radius:4px;background:var(--backdrop-color);padding:0 8px;font:500 12px/1 var(--sans);font-variant-numeric:tabular-nums;text-align:right;color:var(--heading-color)}.pl-dim-title{margin:10px 0 7px}.pl-dims{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0}.pl-dim{min-width:0}.pl-dim>span,.pl-dim>label{display:block}.pl-dim{font:500 11px/1 var(--sans);color:var(--paragraph-color)}.pl-dimbox{display:flex;align-items:center;margin-top:6px;border:1px solid var(--border-color);border-radius:4px;height:32px;overflow:hidden;background:var(--foreground-color)}.pl-dimbox:focus-within{border-color:var(--blue-500);box-shadow:0 0 0 1px var(--blue-500)}.pl-dimbox input{min-width:0;width:100%;height:100%;border:0;outline:0;background:transparent;color:var(--heading-color);padding:0 3px 0 9px;font:500 12px/1 var(--sans);font-variant-numeric:tabular-nums}.pl-dimbox span{display:grid;place-items:center;align-self:stretch;min-width:24px;padding:0 7px 0 5px;border-left:1px solid var(--border-color);background:var(--backdrop-color);font:500 10px/1 var(--sans);color:var(--label-color)}.pl-tools{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.pl-tool{flex:1 1 28%;padding:0 6px;font-size:11px}.pl-tool.danger{color:var(--red-500)}.pl-size-select,.pl-input,.pl-textarea,.pl-select{width:100%;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--heading-color);border-radius:4px;font:400 12px/1 var(--sans);outline:none}.pl-size-select,.pl-input,.pl-select{height:32px;padding:0 10px}.pl-size-select{margin-bottom:7px}.pl-textarea{padding:9px 10px;resize:vertical;min-height:92px;line-height:1.4}#plKey{-webkit-text-security:disc;text-security:disc}
.pl-ai{padding:2px}.pl-ai h3{font-size:16px;margin:0 0 5px}.pl-ai p{font-size:12px;line-height:1.45;color:var(--paragraph-color);margin-bottom:12px}.pl-label{display:block;font-size:11px;font-weight:500;color:var(--paragraph-color);margin:10px 0 5px}.pl-modelrow{display:grid;grid-template-columns:minmax(0,1fr) 32px;gap:5px}.pl-refresh{height:32px;border:1px solid var(--border-color);background:var(--foreground-color);color:var(--paragraph-color);border-radius:4px;font:600 15px/1 var(--sans);cursor:pointer}.pl-refresh:hover{background:var(--button-hover-color);color:var(--heading-color)}.pl-refresh:disabled{opacity:.5}.pl-gen{width:100%;height:32px;border:0;background:var(--blue-500);color:white;border-radius:4px;margin-top:10px;font:500 13px/1 var(--sans);cursor:pointer}.pl-gen.secondary{background:transparent;border:1px solid var(--blue-500);color:var(--blue-500)}.pl-gen.secondary:hover{background:var(--button-hover-color)}.pl-gen:disabled{opacity:.55}.pl-divider{display:flex;align-items:center;gap:8px;margin:17px 0 4px;color:var(--label-color);font:600 10px/1 var(--sans);text-transform:uppercase;letter-spacing:.05em}.pl-divider::before,.pl-divider::after{content:'';height:1px;background:var(--border-color);flex:1}.pl-uploadrow{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.pl-note{font-size:11px!important;color:var(--label-color)!important;margin-top:9px!important}.pl-status{font-size:11px;line-height:1.4;margin-top:9px;min-height:28px;color:#15803d}.pl-status.err{color:var(--red-500)}
#measureTag{position:absolute;z-index:6;pointer-events:none;transform:translate(-50%,-100%);background:var(--foreground-color);border:1px solid var(--blue-500);color:var(--heading-color);border-radius:4px;padding:5px 7px;font:500 11px/1 var(--sans);white-space:nowrap;display:none;box-shadow:0 2px 8px rgb(0 0 0 / 12%)}
#plannerToast{position:absolute;z-index:12;left:50%;bottom:20px;transform:translate(-50%,12px);opacity:0;background:var(--zinc-900);color:white;border-radius:4px;padding:8px 12px;font:500 12px/1 var(--sans);pointer-events:none;transition:180ms}#plannerToast.show{opacity:1;transform:translate(-50%,0)}
@media(prefers-reduced-motion:reduce){.pl-tabs::after{transition:none}.pl-scroll.pl-switch-out,.pl-scroll.pl-switch-in{animation:none}}@media(max-width:760px){#planner{width:min(92vw,384px)}.dorm-room-host.planner-open #minimap{display:none}.pl-grid{grid-template-columns:1fr}}
`;

// Permanent architecture only. Beds, desks, chairs, nightstand and MicroChill
// are registered as movable room items instead of hard-coded blockers.
const FIXED_COLLIDERS = [
  [2.40,0.00,2.50,.80],[3.10,0.00,3.20,.80],
  [.95,2.29,2.10,2.95],[3.15,2.29,4.30,2.95],[5.32,2.63,5.60,2.95],
];

function extrudedRadialGeometry(THREE,{points=5,inner=.48,outer=1,depth=.18}={}){
  const shape=new THREE.Shape();
  for(let i=0;i<points*2;i++){
    const a=Math.PI/2+i*Math.PI/points,r=i%2?inner:outer,x=Math.cos(a)*.5*r,y=Math.sin(a)*.5*r;
    if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
  }
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025});
  geometry.translate(0,0,-depth/2);return geometry;
}

function wedgeGeometry(THREE){
  const p=[-.5,-.5,-.5, .5,-.5,-.5, -.5,.5,-.5, -.5,-.5,.5, .5,-.5,.5, -.5,.5,.5];
  const i=[0,1,2, 3,5,4, 0,3,4, 0,4,1, 0,2,5, 0,5,3, 1,4,5, 1,5,2];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setIndex(i);geometry.computeVertexNormals();return geometry;
}

function crossGeometry(THREE){
  const shape=new THREE.Shape();
  const points=[[-.16,.5],[.16,.5],[.16,.16],[.5,.16],[.5,-.16],[.16,-.16],[.16,-.5],[-.16,-.5],[-.16,-.16],[-.5,-.16],[-.5,.16],[-.16,.16]];
  points.forEach(([x,y],index)=>index?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:true,bevelSegments:2,bevelSize:.02,bevelThickness:.02});geometry.translate(0,0,-.09);return geometry;
}

function outlineGeometry(THREE,part){
  const shape=new THREE.Shape();
  const outline=part.smoothOutline
    ? new THREE.CatmullRomCurve3(part.outline.map(([x,y])=>new THREE.Vector3(x,y,0)),true,'centripetal').getSpacedPoints(72).map(p=>[p.x,p.y])
    : part.outline;
  outline.forEach(([x,y],index)=>index?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const bevel=Math.max(0,Math.min(.08,part.bevel??.025));
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:1,steps:1,curveSegments:10,bevelEnabled:bevel>0,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel});
  geometry.translate(0,0,-.5);return geometry;
}

function loftGeometry(THREE,part){
  const rings=part.rings,n=rings[0].length,positions=rings.flat(),indices=[];
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){
    const next=(i+1)%n,a=r*n+i,b=r*n+next,c=(r+1)*n+i,d=(r+1)*n+next;
    indices.push(a,c,d,a,d,b);
  }
  const addCenter=ring=>{const center=ring.reduce((sum,p)=>[sum[0]+p[0],sum[1]+p[1],sum[2]+p[2]],[0,0,0]).map(v=>v/ring.length);positions.push(center);return positions.length-1};
  const bottom=addCenter(rings[0]),top=addCenter(rings[rings.length-1]),topOffset=(rings.length-1)*n;
  for(let i=0;i<n;i++){const next=(i+1)%n;indices.push(bottom,next,i,top,topOffset+i,topOffset+next)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions.flat(),3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function geometryFor(THREE, part, dimensions) {
  switch (part.type) {
    case 'roundedBox': return new RoundedBoxGeometry(1,1,1,2,Math.min(.22,part.radius || .035));
    case 'cylinder': return new THREE.CylinderGeometry(.5,.5,1,32);
    case 'cone': return new THREE.CylinderGeometry(0,.5,1,32);
    case 'sphere': return new THREE.SphereGeometry(.5,32,20);
    case 'capsule': return new THREE.CapsuleGeometry(.5,1,10,20);
    case 'torus': return new THREE.TorusGeometry(.36,.14,16,40);
    case 'plane': return new THREE.PlaneGeometry(1,1,4,4);
    case 'disc': return new THREE.CircleGeometry(.5,48);
    case 'ring': return new THREE.RingGeometry(Math.min(.45,part.radius||.27),.5,48);
    case 'hemisphere': return new THREE.SphereGeometry(.5,40,20,0,Math.PI*2,0,Math.PI/2);
    case 'wedge': return wedgeGeometry(THREE);
    case 'prism': return new THREE.CylinderGeometry(.5,.5,1,6);
    case 'pyramid': return new THREE.CylinderGeometry(0,.5,1,4);
    case 'tetrahedron': return new THREE.TetrahedronGeometry(.5,1);
    case 'octahedron': return new THREE.OctahedronGeometry(.5,1);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(.5,0);
    case 'icosahedron': return new THREE.IcosahedronGeometry(.5,1);
    case 'lathe': {
      const points=(part.profile||[[.08,-.5],[.38,-.44],[.50,-.12],[.43,.28],[.22,.5]]).map(([r,y])=>new THREE.Vector2(r,y));
      const profile=part.smoothProfile?new THREE.SplineCurve(points).getPoints(48):points;
      return new THREE.LatheGeometry(profile,64);
    }
    case 'gear': return extrudedRadialGeometry(THREE,{points:12,inner:.78,depth:.18});
    case 'star': return extrudedRadialGeometry(THREE,{points:5,inner:.44,depth:.16});
    case 'torusKnot': return new THREE.TorusKnotGeometry(.32,.10,80,14,2,3);
    case 'cross': return crossGeometry(THREE);
    case 'extrude': return outlineGeometry(THREE,part);
    case 'loft': return loftGeometry(THREE,part);
    case 'tube': {
      const points=(part.path||[[0,0,0],[0,1,0]]).map(point=>new THREE.Vector3(point[0]*dimensions.w,point[1]*dimensions.h,point[2]*dimensions.d));
      const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
      return new THREE.TubeGeometry(curve,Math.max(12,points.length*5),(part.radius||.01)*Math.min(dimensions.w,dimensions.h,dimensions.d),10,false);
    }
    default: return new THREE.BoxGeometry(1,1,1);
  }
}

const FINISHES = {
  glass:{roughness:.06,metalness:0,transmission:.78,transparent:true,opacity:.42,ior:1.48,thickness:.02,clearcoat:.25},
  water:{roughness:.10,metalness:0,transmission:.58,transparent:true,opacity:.48,ior:1.33,thickness:.03},
  mirror:{roughness:.03,metalness:.88,clearcoat:.45},screen:{roughness:.14,metalness:.12,clearcoat:.70},
  ceramic:{roughness:.25,metalness:0,clearcoat:.38},metal:{roughness:.24,metalness:.82},brushed:{roughness:.40,metalness:.78},
  anodized:{roughness:.31,metalness:.66,clearcoat:.12},'painted-metal':{roughness:.36,metalness:.38,clearcoat:.22},
  plastic:{roughness:.48,metalness:0,clearcoat:.18},'soft-plastic':{roughness:.62,metalness:0,clearcoat:.08},'gloss-plastic':{roughness:.18,metalness:0,clearcoat:.65},
  rubber:{roughness:.92,metalness:0},fabric:{roughness:1,metalness:0},foam:{roughness:.98,metalness:0},woven:{roughness:.96,metalness:0},fiber:{roughness:1,metalness:0},thread:{roughness:.96,metalness:0},
  wood:{roughness:.70,metalness:0,clearcoat:.08},'painted-wood':{roughness:.43,metalness:0,clearcoat:.24},stone:{roughness:.86,metalness:0},soil:{roughness:1,metalness:0},plant:{roughness:.74,metalness:0},organic:{roughness:.56,metalness:0},
  paper:{roughness:.95,metalness:0},'paper-cover':{roughness:.76,metalness:0,clearcoat:.05},photo:{roughness:.27,metalness:0,clearcoat:.25},ink:{roughness:.80,metalness:0},keycap:{roughness:.48,metalness:0,clearcoat:.12},
  vinyl:{roughness:.25,metalness:0,clearcoat:.20},liquid:{roughness:.12,metalness:0,clearcoat:.55},wax:{roughness:.64,metalness:0},enamel:{roughness:.20,metalness:0,clearcoat:.58},'translucent-plastic':{roughness:.38,metalness:0,transparent:true,opacity:.76,clearcoat:.18},
  emissive:{roughness:.20,metalness:0,clearcoat:.60},
};

function materialFor(THREE,part){
  const preset=FINISHES[part.finish]||{};
  return new THREE.MeshPhysicalMaterial({
    color:part.color||'#7b8790',roughness:part.roughness??preset.roughness??.66,metalness:part.metalness??preset.metalness??0,
    transparent:(part.opacity??preset.opacity??1)<1||!!preset.transparent,opacity:part.opacity??preset.opacity??1,
    transmission:preset.transmission??0,ior:preset.ior??1.5,thickness:preset.thickness??0,clearcoat:preset.clearcoat??0,
    emissive:part.emissive||'#000000',emissiveIntensity:part.emissive?1.15:0,depthWrite:!(preset.transmission>0),
    side:['plane','disc','ring','hemisphere','extrude','loft'].includes(part.type)?THREE.DoubleSide:THREE.FrontSide,
  });
}

export function makeCatalogVisual(THREE, spec, dimensions, instanceId = 'catalog-preview') {
  const group = new THREE.Group();
  group.userData.plannerInstanceId = instanceId;
  const materials=new Map();
  for (const part of spec.parts) {
    const key=JSON.stringify([part.color,part.finish,part.roughness,part.metalness,part.opacity,part.emissive]);
    if(!materials.has(key))materials.set(key,materialFor(THREE,part));
    const mesh = new THREE.Mesh(geometryFor(THREE,part,dimensions),materials.get(key));
    if(part.type==='tube')mesh.position.set(part.position[0]*dimensions.w,part.position[1]*dimensions.h,part.position[2]*dimensions.d);
    else{mesh.position.set(part.position[0]*dimensions.w,part.position[1]*dimensions.h,part.position[2]*dimensions.d);mesh.scale.set(part.size[0]*dimensions.w,part.size[1]*dimensions.h,part.size[2]*dimensions.d)}
    const r = part.rotation || [0,0,0];
    mesh.rotation.set(r[0]*Math.PI/180,r[1]*Math.PI/180,r[2]*Math.PI/180);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.plannerInstanceId = instanceId;
    group.add(mesh);
  }
  return group;
}

function disposeObject(obj) {
  const geometries=new Set(),materials=new Set();
  obj.traverse(o => {
    if(o.geometry)geometries.add(o.geometry);
    if(Array.isArray(o.material))o.material.forEach(m=>materials.add(m));else if(o.material)materials.add(o.material);
  });
  geometries.forEach(g=>g.dispose?.());materials.forEach(m=>m.dispose?.());
}

function extractJson(text) {
  const cleaned = String(text).replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/i,'').trim();
  try { return JSON.parse(cleaned); } catch {}
  const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}');
  if(start>=0&&end>start)return JSON.parse(cleaned.slice(start,end+1));
  throw new Error('The provider returned text instead of an item spec.');
}

function generationPrompt(request) {
  return `Create a production-quality, dimensionally accurate 3D catalog item for a measured dorm-room planner: ${request}\n\nReturn ONLY one JSON object. Never return code, markdown, URLs, scripts, comments, or external mesh references. Schema:\n{"name":"...","category":"...","dimensions":{"w":METERS,"h":METERS,"d":METERS},"parts":[{"type":"${ITEM_SPEC_SCHEMA.primitiveTypes.join('|')}","position":[X,Y,Z],"size":[W,H,D],"rotation":[DEG_X,DEG_Y,DEG_Z],"color":"#RRGGBB","finish":"glass|ceramic|metal|brushed|plastic|rubber|fabric|wood|screen|paper|plant|organic|keycap","roughness":0.0,"metalness":0.0,"opacity":1.0,"emissive":"#RRGGBB","path":[[X,Y,Z],...],"profile":[[R,Y],...],"outline":[[X,Y],...],"rings":[[[X,Y,Z],...],...],"radius":0.01}]}\nCoordinates and sizes are normalized to the item envelope: x/z center on 0, y runs floor 0 to top 1. Use tube.path for 2–64 centerline points; lathe.profile for a 3–64 point radial silhouette; extrude.outline for a 3–64 point closed handcrafted silhouette; and loft.rings for 2–16 compatible rings with the same 3–64 point count. Prefer a small number of accurate extruded, lathed, or lofted primary forms over blocky approximations, then add real manufacturing seams, hardware, controls, supports, material changes, and secondary construction. Use correct real-world meter dimensions and 25–120 meaningful parts when complexity warrants it. Do not add arbitrary detail merely to increase part count. Avoid toy-like proportions and generic blocks. Maximum ${ITEM_SPEC_SCHEMA.maxParts} parts.`;
}

const MODEL_FALLBACKS={
  gemini:[{id:'gemini-3.5-flash',label:'Gemini 3.5 Flash'},{id:'gemini-3.1-pro-preview',label:'Gemini 3.1 Pro'}],
  claude:[{id:'claude-sonnet-5',label:'Claude Sonnet 5'},{id:'claude-opus-4-8',label:'Claude Opus 4.8'},{id:'claude-sonnet-4-6',label:'Claude Sonnet 4.6'}],
  openai:[{id:'gpt-5.2',label:'GPT-5.2'},{id:'gpt-5.1',label:'GPT-5.1'}],
};

async function listProviderModels({provider,key}){
  let res;
  if(provider==='gemini')res=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',{headers:{'x-goog-api-key':key}});
  else if(provider==='claude')res=await fetch('https://api.anthropic.com/v1/models?limit=1000',{headers:{'x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}});
  else res=await fetch('https://api.openai.com/v1/models',{headers:{'Authorization':`Bearer ${key}`}});
  const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`Could not load models (${res.status}).`);
  if(provider==='gemini')return(data.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>({id:m.baseModelId||String(m.name||'').replace(/^models\//,''),label:m.displayName||m.baseModelId||m.name,thinking:m.thinking!==false}));
  if(provider==='claude')return(data.data||[]).map(m=>({id:m.id,label:m.display_name||m.id,capabilities:m.capabilities||{}}));
  const excluded=/(embedding|moderation|realtime|audio|image|transcri|whisper|tts|dall-e|sora)/i;
  return(data.data||[]).filter(m=>/^(gpt-|o\d)/i.test(m.id)&&!excluded.test(m.id)).sort((a,b)=>(b.created||0)-(a.created||0)).map(m=>({id:m.id,label:m.id}));
}

async function callProvider({provider,key,model,prompt,reasoning='default'}) {
  if(provider==='gemini'){
    const generationConfig={responseMimeType:'application/json'};if(reasoning!=='default')generationConfig.thinkingConfig={thinkingLevel:reasoning};
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig})});
    const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`Gemini request failed (${res.status}).`);return data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
  }
  if(provider==='claude'){
    const body={model,max_tokens:12000,messages:[{role:'user',content:prompt}]};if(reasoning!=='default')body.output_config={effort:reasoning};
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
    const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`Claude request failed (${res.status}).`);return data?.content?.filter(c=>c.type==='text').map(c=>c.text).join('')||'';
  }
  const body={model,input:prompt,max_output_tokens:12000,text:{format:{type:'json_object'}}};if(reasoning!=='default')body.reasoning={effort:reasoning};
  const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)});
  const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`OpenAI request failed (${res.status}).`);return data?.output_text||data?.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('')||'';
}

export function createPlanner({
  THREE, root, camera, renderer, orbit, room, setPlanView, container,
  builtins = [], fixedColliders = FIXED_COLLIDERS,
  onInteractionStart = () => {}, onInteractionEnd = () => {},
  initialLayout = null, onLayoutChange = () => {},
}) {
  const style=document.createElement('style');style.textContent=PLANNER_CSS;document.head.appendChild(style);
  const shell=document.createElement('div');
  shell.innerHTML=`<button id="plannerToggle" aria-label="Open catalog">Catalog&nbsp; ›</button><aside id="planner" data-active-tab="catalog" aria-label="Room catalog">
    <header class="pl-head"><h2>Catalog</h2><span class="pl-count">${ITEM_CATALOG.length} items</span><span class="pl-spacer"></span><button class="pl-action primary" id="plShare">Share</button><button class="pl-action" id="plPlan">Top</button><button class="pl-iconbtn" id="plClear" aria-label="Reset layout" title="Reset layout">↺</button><button class="pl-iconbtn" id="plClose" aria-label="Collapse catalog" title="Collapse catalog">‹</button></header>
    <div class="pl-tabs"><button class="pl-tab on" data-tab="catalog">Items</button><button class="pl-tab" data-tab="ai">Generate</button></div>
    <div class="pl-scroll" id="plScroll"><section class="pl-view" data-view="catalog"><div class="pl-catalog-tools"><input class="pl-search" id="plSearch" placeholder="Search mouse, futon, lights…" aria-label="Search catalog"><div class="pl-catrow"><button class="pl-catnav" id="plCatPrev" aria-label="Previous categories">‹</button><div class="pl-cats" id="plCats"></div><button class="pl-catnav" id="plCatNext" aria-label="More categories">›</button></div></div><div class="pl-grid" id="plGrid"></div></section>
    <section class="pl-view pl-ai" data-view="ai" hidden><h3>Generate item</h3><p>Validated primitives only. No generated code runs here.</p>
      <label class="pl-label" for="plProvider">Provider</label><select class="pl-select" id="plProvider"><option value="gemini">Gemini</option><option value="claude">Claude</option><option value="openai">OpenAI</option></select>
      <label class="pl-label" for="plKey">API key</label><input class="pl-input" id="plKey" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off" data-1p-ignore data-lpignore="true" data-bwignore placeholder="Not saved">
      <label class="pl-label" for="plModel">Model</label><div class="pl-modelrow"><select class="pl-select" id="plModel" aria-label="Model"></select><button class="pl-refresh" id="plRefreshModels" aria-label="Refresh models" title="Refresh models">↻</button></div>
      <label class="pl-label" for="plReasoning">Reasoning</label><select class="pl-select" id="plReasoning"><option value="default">Provider default</option><option value="low">Low · faster</option><option value="medium">Medium · balanced</option><option value="high">High · best quality</option></select>
      <label class="pl-label" for="plPrompt">Object</label><textarea class="pl-textarea" id="plPrompt" placeholder="Compound lab microscope, 16 × 15 × 21 in, binocular eyepieces, stage, objective turret…"></textarea>
      <button class="pl-gen" id="plGenerate">Generate with API</button><div class="pl-status" id="plStatus"></div><p class="pl-note">Keys stay in this tab and never enter shared links.</p>
      <div class="pl-divider">No API key</div><p>Copy a complete prompt into ChatGPT, Claude, or Gemini. Paste its JSON response here afterward.</p><button class="pl-gen secondary" id="plCopyPrompt">Copy prompt for AI chat</button>
      <label class="pl-label" for="plJson">Import item JSON</label><textarea class="pl-textarea" id="plJson" spellcheck="false" placeholder="Paste the generated JSON here…"></textarea><input id="plJsonFile" type="file" accept="application/json,.json" hidden><div class="pl-uploadrow"><button class="pl-action" id="plChooseJson">Upload .json</button><button class="pl-action primary" id="plImportJson">Add to room</button></div><p class="pl-note">JSON is parsed locally, capped at 256 KB, and validated as geometry data. It is never executed.</p></section></div>
    <section class="pl-inspector" id="plInspector" hidden><div class="pl-selrow"><div class="pl-selname" id="plSelName"></div><div class="pl-fit" id="plFit">FITS</div></div><select class="pl-size-select" id="plSize" aria-label="Product size preset"></select><div class="pl-control" id="plRotationRow"><label for="plRotation">Rotate</label><input class="pl-range" id="plRotation" type="range" min="0" max="360" step="1"><output class="pl-output" id="plRotationOut">0°</output></div><div class="pl-control"><label for="plElevation">Height</label><input class="pl-range" id="plElevation" type="range" min="0" step="1"><output class="pl-output" id="plElevationOut">0″</output></div><div id="plDims"><div class="pl-dim-title">Dimensions</div><div class="pl-dims"><label class="pl-dim">Width<div class="pl-dimbox"><input id="plDimW" inputmode="decimal" aria-label="Width in inches"><span>in</span></div></label><label class="pl-dim">Depth<div class="pl-dimbox"><input id="plDimD" inputmode="decimal" aria-label="Depth in inches"><span>in</span></div></label><label class="pl-dim">Height<div class="pl-dimbox"><input id="plDimH" inputmode="decimal" aria-label="Height in inches"><span>in</span></div></label></div></div><div class="pl-tools"><button class="pl-tool" id="plBack" title="Lower click priority so overlapping items behind it can be selected">Send back</button><button class="pl-tool" id="plFront" title="Give this item first click priority">Bring front</button><button class="pl-tool" id="plWall" hidden>Next wall</button><button class="pl-tool" id="plDuplicate">Duplicate</button><button class="pl-tool danger" id="plDelete">Remove</button><button class="pl-tool" id="plReset" hidden>Reset</button><button class="pl-tool" id="plExport" hidden>Export JSON</button></div></section>
    </aside><div id="measureTag"></div><div id="plannerToast"></div>`;
  container.appendChild(shell);

  const $=id=>container.querySelector('#'+id);
  const items=[];
  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const hit=new THREE.Vector3();
  let selected=null,activeCategory='All',query='',drag=null,placing=null,saveTimer=0,idCounter=0,outline=null;

  const selection=new THREE.Group();selection.visible=false;root.add(selection);
  const lineMat=new THREE.LineBasicMaterial({color:0x22c55e,depthTest:false,transparent:true,opacity:.95});

  function updatePointer(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera)}
  function groundPoint(e){updatePointer(e);if(!raycaster.ray.intersectPlane(ground,hit))return null;return root.worldToLocal(hit.clone())}
  function wallPoint(e,instance){
    updatePointer(e);root.updateWorldMatrix(true,false);const origin=new THREE.Vector3();root.getWorldPosition(origin);
    const alongZ=instance.wall==='bed'||instance.wall==='closet';const coord=alongZ?origin.z+instance.z:origin.x+instance.x;
    const normal=alongZ?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);const plane=new THREE.Plane(normal,-coord);
    if(!raycaster.ray.intersectPlane(plane,hit))return null;return root.worldToLocal(hit.clone());
  }
  function tagVisual(visual,id){visual.traverse(o=>{if(o.isMesh||o.isLine||o.isPoints)o.userData.plannerInstanceId=id})}
  function applyTransform(instance){instance.group.position.set(instance.x,instance.y,instance.z);instance.group.rotation.y=instance.rotation}
  function updatePickProxy(instance){
    if(!instance.pickProxy){const mat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});mat.colorWrite=false;instance.pickProxy=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat);instance.pickProxy.userData.plannerInstanceId=instance.instanceId;instance.group.add(instance.pickProxy)}
    const w=Math.max(instance.dimensions.w,.11),h=Math.max(instance.dimensions.h,.06),d=Math.max(instance.dimensions.d,.11);instance.pickProxy.scale.set(w,h,d);instance.pickProxy.position.set(0,instance.dimensions.h/2,0);
  }

  function rebuild(instance){
    if(instance.builtin)return;
    if(instance.visual){instance.group.remove(instance.visual);disposeObject(instance.visual)}
    instance.visual=makeCatalogVisual(THREE,instance.spec,instance.dimensions,instance.instanceId);instance.group.add(instance.visual);updatePickProxy(instance);refreshSelection();
  }

  function frontLayer(){return items.length?Math.max(...items.map(item=>item.interactionLayer||0))+1:1}
  function createInstance(spec,{x=room.L/2,y=null,z=room.W/2,rotation=0,sizeIndex=0,dimensions=null,wall=null,interactionLayer=null,pendingPlacement=false}={}){
    const group=new THREE.Group();const mount=spec.mount||'floor';const h=(dimensions||spec.dimensions).h;
    const instance={instanceId:`p${(++idCounter).toString(36)}`,spec,catalogId:CATALOG_BY_ID.has(spec.id)?spec.id:null,builtinId:null,builtin:false,sizeIndex,dimensions:{...(dimensions||spec.dimensions)},x,y:y??(mount==='wall'?Math.max(.25,1.45-h/2):0),z,rotation,wall:wall||(mount==='wall'?'bed':null),mount,interactionLayer:interactionLayer??frontLayer(),pendingPlacement,group,visual:null};
    group.userData.plannerInstanceId=instance.instanceId;root.add(group);items.push(instance);rebuild(instance);
    if(instance.mount==='wall')mountToWall(instance,instance.wall);else applyTransform(instance);
    group.visible=!pendingPlacement;
    select(instance);scheduleSave();return instance;
  }

  function registerBuiltin(def){
    const object=def.object;if(!object)return null;root.updateMatrixWorld(true);object.updateWorldMatrix(true,true);
    const worldBox=new THREE.Box3().setFromObject(object);const worldCenter=worldBox.getCenter(new THREE.Vector3());const worldMin=worldBox.min.clone();const worldMax=worldBox.max.clone();
    const center=root.worldToLocal(worldCenter.clone());const min=root.worldToLocal(worldMin);const max=root.worldToLocal(worldMax);const measured={w:Math.abs(max.x-min.x),h:Math.abs(max.y-min.y),d:Math.abs(max.z-min.z)};const dimensions={...(def.dimensions||measured)};const baseY=def.y??min.y;
    const oldPos=object.position.clone();root.remove(object);const group=new THREE.Group();group.position.set(center.x,baseY,center.z);object.position.copy(oldPos).sub(group.position);group.add(object);root.add(group);
    const instance={instanceId:`room-${def.id}`,spec:{id:`@${def.id}`,name:def.name,category:'Room',mount:'floor',dimensions,parts:[]},catalogId:null,builtinId:def.id,builtin:true,sizeIndex:0,dimensions,x:center.x,y:baseY,z:center.z,rotation:0,wall:null,mount:'floor',interactionLayer:0,group,visual:object};
    group.userData.plannerInstanceId=instance.instanceId;tagVisual(object,instance.instanceId);updatePickProxy(instance);instance.initial={x:instance.x,y:instance.y,z:instance.z,rotation:0,interactionLayer:0};items.push(instance);return instance;
  }

  function rotatedSize(instance){const c=Math.abs(Math.cos(instance.rotation)),s=Math.abs(Math.sin(instance.rotation));return{w:c*instance.dimensions.w+s*instance.dimensions.d,d:s*instance.dimensions.w+c*instance.dimensions.d}}
  function bounds(instance){const s=rotatedSize(instance);return{x0:instance.x-s.w/2,z0:instance.z-s.d/2,x1:instance.x+s.w/2,z1:instance.z+s.d/2,y0:instance.y,y1:instance.y+instance.dimensions.h}}
  function intersects(a,b,pad=.0127){return a.x0<b.x1-pad&&a.x1>b.x0+pad&&a.z0<b.z1-pad&&a.z1>b.z0+pad&&a.y0<b.y1-pad&&a.y1>b.y0+pad}
  function fitFor(instance){
    const b=bounds(instance);if(b.y0<0||b.y1>room.H)return{ok:false,label:'OUTSIDE ROOM'};
    if(instance.mount==='wall')return{ok:true,label:'ON WALL'};
    if(b.x0<0||b.z0<0||b.x1>room.L||b.z1>room.W)return{ok:false,label:'OUTSIDE ROOM'};
    const floorLayer=instance.dimensions.h<.04||instance.spec.category==='Floor';
    if(!floorLayer&&fixedColliders.some(c=>intersects(b,{x0:c[0],z0:c[1],x1:c[2],z1:c[3],y0:0,y1:room.H})))return{ok:false,label:'OVERLAPS ROOM'};
    if(!floorLayer&&items.some(other=>other!==instance&&other.mount!=='wall'&&other.dimensions.h>=.04&&other.spec.category!=='Floor'&&intersects(b,bounds(other))))return{ok:false,label:'OVERLAPS ITEM'};
    const clearance=Math.min(b.x0,b.z0,room.L-b.x1,room.W-b.z1);return{ok:true,label:clearance<.025?'TIGHT FIT':'FITS'};
  }

  function clampInstance(instance){
    instance.y=Math.max(0,Math.min(room.H-instance.dimensions.h,instance.y));
    if(instance.mount==='wall'){mountToWall(instance,instance.wall);return}
    const s=rotatedSize(instance);instance.x=Math.max(s.w/2,Math.min(room.L-s.w/2,instance.x));instance.z=Math.max(s.d/2,Math.min(room.W-s.d/2,instance.z));applyTransform(instance);
  }
  function mountToWall(instance,wall){
    const walls=['bed','window','closet','entry'];instance.wall=walls.includes(wall)?wall:'bed';instance.mount='wall';instance.spec.mount='wall';
    if(instance.wall==='bed'){instance.z=.025;instance.rotation=Math.PI;instance.x=Math.max(instance.dimensions.w/2,Math.min(room.L-instance.dimensions.w/2,instance.x))}
    if(instance.wall==='closet'){instance.z=room.W-.025;instance.rotation=0;instance.x=Math.max(instance.dimensions.w/2,Math.min(room.L-instance.dimensions.w/2,instance.x))}
    if(instance.wall==='entry'){instance.x=.025;instance.rotation=-Math.PI/2;instance.z=Math.max(instance.dimensions.w/2,Math.min(room.W-instance.dimensions.w/2,instance.z))}
    if(instance.wall==='window'){instance.x=room.L-.025;instance.rotation=Math.PI/2;instance.z=Math.max(instance.dimensions.w/2,Math.min(room.W-instance.dimensions.w/2,instance.z))}
    instance.y=Math.max(.05,Math.min(room.H-instance.dimensions.h-.05,instance.y));applyTransform(instance);
  }
  function findOpenSpot(instance){
    if(instance.mount==='wall'){instance.x=room.L/2;instance.y=Math.max(.25,1.45-instance.dimensions.h/2);mountToWall(instance,'bed');return}
    const candidates=[[2.8,1.62],[2.65,1.62],[3.7,1.62],[1.35,1.62],[4.65,1.60],[2.7,2.10]];
    for(const [x,z] of candidates){instance.x=x;instance.z=z;clampInstance(instance);if(fitFor(instance).ok)return}instance.x=room.L/2;instance.z=room.W/2;clampInstance(instance);
  }

  function select(instance){
    selected=instance;selection.visible=!!instance&&(!instance.pendingPlacement||instance.group.visible);$('plInspector').hidden=!instance;if(!instance){$('measureTag').style.display='none';return}
    $('plSelName').textContent=instance.spec.name;const cat=instance.catalogId&&CATALOG_BY_ID.get(instance.catalogId);$('plSize').hidden=instance.builtin||!cat?.sizes?.length;
    if(cat)$('plSize').innerHTML=cat.sizes.map((s,i)=>`<option value="${i}"${i===instance.sizeIndex?' selected':''}>Preset: ${esc(s.label)} · ${fmtIn(s.dims.w)} × ${fmtIn(s.dims.d)}</option>`).join('');
    $('plRotationRow').hidden=instance.mount==='wall';$('plDims').hidden=instance.builtin;$('plWall').hidden=instance.mount!=='wall';$('plDuplicate').hidden=instance.builtin;$('plDelete').hidden=instance.builtin;$('plReset').hidden=!instance.builtin;$('plExport').hidden=!instance.spec.generated;refreshSelection();
  }
  function refreshSelection(){
    if(!selected)return;selection.position.copy(selected.group.position);selection.rotation.y=selected.rotation;
    if(outline){selection.remove(outline);outline.geometry.dispose()}
    const geo=new THREE.EdgesGeometry(new THREE.BoxGeometry(selected.dimensions.w,selected.dimensions.h,selected.dimensions.d));outline=new THREE.LineSegments(geo,lineMat);outline.position.y=selected.dimensions.h/2;outline.renderOrder=19;selection.add(outline);
    const fit=fitFor(selected);lineMat.color.set(fit.ok?0x22c55e:0xef4444);$('plFit').textContent=fit.label;$('plFit').classList.toggle('bad',!fit.ok);
    const degrees=rotationSliderDegrees(selected.rotation);$('plRotation').value=degrees;$('plRotationOut').textContent=`${Math.round(degrees)}°`;
    const maxElevation=Math.max(0,Math.floor(inch(room.H-selected.dimensions.h)));$('plElevation').max=maxElevation;$('plElevation').value=Math.min(maxElevation,Math.round(inch(selected.y)));$('plElevationOut').textContent=fmtIn(selected.y);
    if(document.activeElement!==$('plDimW'))$('plDimW').value=inch(selected.dimensions.w).toFixed(2).replace(/\.00$/,'');
    if(document.activeElement!==$('plDimD'))$('plDimD').value=inch(selected.dimensions.d).toFixed(2).replace(/\.00$/,'');
    if(document.activeElement!==$('plDimH'))$('plDimH').value=inch(selected.dimensions.h).toFixed(2).replace(/\.00$/,'');
  }

  function remove(instance){if(instance.builtin)return;if(placing===instance){placing=null;onInteractionEnd()}const i=items.indexOf(instance);if(i>=0)items.splice(i,1);root.remove(instance.group);disposeObject(instance.group);if(selected===instance)select(null);scheduleSave()}
  function resetBuiltin(instance){if(!instance?.builtin)return;Object.assign(instance,instance.initial);applyTransform(instance);refreshSelection();scheduleSave()}
  function changeInteractionLayer(instance,toFront){
    if(!instance)return;const layers=items.filter(item=>item!==instance).map(item=>item.interactionLayer||0);
    instance.interactionLayer=toFront?(layers.length?Math.max(...layers)+1:1):(layers.length?Math.min(...layers)-1:-1);
    refreshSelection();scheduleSave();toast(toFront?`${instance.spec.name} will be picked first`:`${instance.spec.name} sent behind overlapping items`);
  }
  function changeSize(instance,index){const cat=CATALOG_BY_ID.get(instance.catalogId);if(!cat||instance.builtin)return;instance.sizeIndex=index;instance.dimensions={...cat.sizes[index].dims};instance.spec=catalogItemSpec(cat.id,index);rebuild(instance);clampInstance(instance);refreshSelection();scheduleSave()}

  function changeDimension(axis,value){
    if(!selected||selected.builtin)return;const inches=Number(value);if(!Number.isFinite(inches))return;
    const roomMax=axis==='w'?room.L:axis==='d'?room.W:room.H;selected.dimensions[axis]=THREE.MathUtils.clamp(inches*IN,.25*IN,Math.max(.25*IN,roomMax));rebuild(selected);clampInstance(selected);refreshSelection();scheduleSave();
  }

  const wallCodes={bed:1,window:2,closet:3,entry:4};const codeWalls={1:'bed',2:'window',3:'closet',4:'entry'};
  function builtinChanged(i){return i.builtin&&(Math.abs(i.x-i.initial.x)>.001||Math.abs(i.y-i.initial.y)>.001||Math.abs(i.z-i.initial.z)>.001||Math.abs(i.rotation-i.initial.rotation)>.001||i.interactionLayer!==i.initial.interactionLayer)}
  function layoutPayload(){return{v:4,i:items.filter(i=>!i.pendingPlacement&&(i.catalogId||builtinChanged(i))).map(i=>[i.builtin?`@${i.builtinId}`:i.catalogId,Math.round(i.x*1000),Math.round(i.y*1000),Math.round(i.z*1000),Math.round((((THREE.MathUtils.radToDeg(i.rotation)%360)+360)%360)*10),i.sizeIndex,wallCodes[i.wall]||0,Math.round(i.dimensions.w*1000),Math.round(i.dimensions.h*1000),Math.round(i.dimensions.d*1000),i.interactionLayer||0])}}
  function encodeLayout(value){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function decodeLayout(value){const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))))}
  function saveLayout(){const url=new URL(location.href),payload=layoutPayload(),encoded=payload.i.length?encodeLayout(payload):null;if(encoded)url.searchParams.set('layout',encoded);else url.searchParams.delete('layout');history.replaceState(history.state,'',url);try{onLayoutChange(encoded)}catch(e){console.warn('Unable to persist room layout',e)}}
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;saveLayout()},80)}
  function loadLayout(raw){
    if(!raw)return;
    // Shared links are untrusted: finite-guard coordinates (fall back to room center)
    // and clamp dimensions to the room, so a crafted layout can't wedge the scene with
    // NaN/Infinity or blow it up with astronomical values.
    const MAXD=Math.max(room.L,room.W,room.H);
    const cx=v=>{const n=+v/1000;return Number.isFinite(n)?n:room.L/2};
    const cy=v=>{const n=+v/1000;return Number.isFinite(n)?n:0};
    const cz=v=>{const n=+v/1000;return Number.isFinite(n)?n:room.W/2};
    const dim=v=>{const n=+v/1000;return Number.isFinite(n)&&n>0?Math.min(n,MAXD):0};
    const dims=(w,h,d)=>{const dw=dim(w),dh=dim(h),dd=dim(d);return dw&&dh&&dd?{w:dw,h:dh,d:dd}:null};
    try{const data=decodeLayout(raw);if(!Array.isArray(data.i))return;
      if(data.v===1){for(const [id,x,z,r,si] of data.i.slice(0,100)){const spec=catalogItemSpec(id,si||0);if(spec)createInstance(spec,{x:cx(x),z:cz(z),rotation:r*Math.PI/2,sizeIndex:si||0})}}
      if(data.v===2){for(const [id,x,y,z,r,si,wc] of data.i.slice(0,150)){if(String(id).startsWith('@')){const item=items.find(i=>i.builtinId===String(id).slice(1));if(item){item.x=cx(x);item.y=cy(y);item.z=cz(z);item.rotation=r*Math.PI/2;applyTransform(item)}}else{const spec=catalogItemSpec(id,si||0);if(spec)createInstance(spec,{x:cx(x),y:cy(y),z:cz(z),rotation:r*Math.PI/2,sizeIndex:si||0,wall:codeWalls[wc]||null})}}}
      if(data.v===3){for(const [id,x,y,z,r,si,wc,w,h,d] of data.i.slice(0,180)){const rotation=THREE.MathUtils.degToRad((r||0)/10),dimensions=dims(w,h,d);if(String(id).startsWith('@')){const item=items.find(i=>i.builtinId===String(id).slice(1));if(item){item.x=cx(x);item.y=cy(y);item.z=cz(z);item.rotation=rotation;applyTransform(item)}}else{const spec=catalogItemSpec(id,si||0);if(spec)createInstance(spec,{x:cx(x),y:cy(y),z:cz(z),rotation,sizeIndex:si||0,dimensions,wall:codeWalls[wc]||null})}}}
      if(data.v===4){for(const [id,x,y,z,r,si,wc,w,h,d,layer] of data.i.slice(0,180)){const rotation=THREE.MathUtils.degToRad((r||0)/10),dimensions=dims(w,h,d);if(String(id).startsWith('@')){const item=items.find(i=>i.builtinId===String(id).slice(1));if(item){item.x=cx(x);item.y=cy(y);item.z=cz(z);item.rotation=rotation;item.interactionLayer=Number.isFinite(layer)?layer:0;applyTransform(item)}}else{const spec=catalogItemSpec(id,si||0);if(spec)createInstance(spec,{x:cx(x),y:cy(y),z:cz(z),rotation,sizeIndex:si||0,dimensions,wall:codeWalls[wc]||null,interactionLayer:Number.isFinite(layer)?layer:0})}}}
      select(null);
    }catch(e){console.warn('Invalid room layout',e)}
  }

  function toast(text){const t=$('plannerToast');t.textContent=text;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800)}
  function startPlacement(spec){
    if(placing)remove(placing);
    placing=createInstance(spec,{pendingPlacement:true});
    onInteractionStart();orbit.enabled=false;
    toast(`Move ${spec.name} into the room, then click to place`);
  }
  function renderCatalog(){
    const cats=['All',...new Set(ITEM_CATALOG.map(i=>i.category))];$('plCats').innerHTML=cats.map(c=>`<button class="pl-cat${c===activeCategory?' on':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');$('plCats').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCatalog()});
    const q=query.toLowerCase(),visible=ITEM_CATALOG.filter(i=>(activeCategory==='All'||i.category===activeCategory)&&(!q||`${i.name} ${i.category}`.toLowerCase().includes(q)));
    $('plGrid').innerHTML=visible.map(i=>`<button class="pl-card" data-item="${i.id}"><span class="pl-mark">${esc(i.mark)}</span><span><span class="pl-name">${esc(i.name)}</span><span class="pl-size">${i.mount==='wall'?'Wall · ':''}${fmtIn(i.sizes[0].dims.w)} × ${fmtIn(i.sizes[0].dims.d)}</span></span></button>`).join('');
    $('plGrid').querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>startPlacement(catalogItemSpec(b.dataset.item)));
  }
  let activeTab='catalog',tabAnimating=false;
  const tabScroll={catalog:0,ai:0};
  function tab(name){
    if(name===activeTab||tabAnimating)return;
    const plannerEl=$('planner'),scroll=$('plScroll'),previous=activeTab;
    const forward=name==='ai';
    tabAnimating=true;tabScroll[previous]=scroll.scrollTop;
    plannerEl.dataset.activeTab=name;
    plannerEl.querySelectorAll('.pl-tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===name));
    scroll.style.setProperty('--pl-swap-out-x',forward?'-10px':'10px');
    scroll.classList.remove('pl-switch-in');void scroll.offsetWidth;scroll.classList.add('pl-switch-out');
    setTimeout(()=>{
      plannerEl.querySelectorAll('.pl-view').forEach(v=>v.hidden=v.dataset.view!==name);
      activeTab=name;scroll.scrollTop=tabScroll[name]||0;
      scroll.classList.remove('pl-switch-out');
      scroll.style.setProperty('--pl-swap-in-x',forward?'14px':'-14px');
      void scroll.offsetWidth;scroll.classList.add('pl-switch-in');
      setTimeout(()=>{scroll.classList.remove('pl-switch-in');tabAnimating=false},180);
    },90);
  }
  $('planner').querySelectorAll('.pl-tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('plannerToggle').onclick=()=>container.classList.add('planner-open');$('plClose').onclick=()=>container.classList.remove('planner-open');
  $('plSearch').oninput=e=>{query=e.target.value;renderCatalog()};$('plPlan').onclick=()=>setPlanView?.();
  $('plCatPrev').onclick=()=>$('plCats').scrollBy({left:-260,behavior:'smooth'});$('plCatNext').onclick=()=>$('plCats').scrollBy({left:260,behavior:'smooth'});
  $('plClear').onclick=()=>clearLayout();
  $('plShare').onclick=async()=>{saveLayout();const generated=items.some(i=>i.spec.generated);try{await navigator.clipboard.writeText(location.href);toast(generated?'Link copied; export generated items separately':'Link copied')}catch{prompt('Copy layout link',location.href)}};
  $('plRotation').oninput=e=>{if(!selected||selected.mount==='wall')return;selected.rotation=THREE.MathUtils.degToRad(+e.target.value);clampInstance(selected);refreshSelection();scheduleSave()};
  $('plElevation').oninput=e=>{if(!selected)return;selected.y=+e.target.value*IN;clampInstance(selected);refreshSelection();scheduleSave()};
  for(const [axis,id] of [['w','plDimW'],['d','plDimD'],['h','plDimH']]){const input=$(id);input.onchange=()=>changeDimension(axis,input.value);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();changeDimension(axis,input.value);input.blur()}}}
  $('plWall').onclick=()=>{if(!selected)return;const walls=['bed','window','closet','entry'],next=walls[(walls.indexOf(selected.wall)+1)%walls.length];mountToWall(selected,next);refreshSelection();scheduleSave()};
  $('plBack').onclick=()=>changeInteractionLayer(selected,false);$('plFront').onclick=()=>changeInteractionLayer(selected,true);
  $('plDuplicate').onclick=()=>{if(!selected||selected.builtin)return;const copy=createInstance(selected.spec,{x:selected.x+.12,y:selected.y,z:selected.z+.12,rotation:selected.rotation,sizeIndex:selected.sizeIndex,dimensions:selected.dimensions,wall:selected.wall});clampInstance(copy);refreshSelection()};
  $('plDelete').onclick=()=>selected&&remove(selected);$('plReset').onclick=()=>resetBuiltin(selected);$('plSize').onchange=e=>selected&&changeSize(selected,+e.target.value);
  $('plExport').onclick=()=>{if(!selected?.spec.generated)return;const blob=new Blob([JSON.stringify(selected.spec,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${selected.spec.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'item'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
  let plDisposed=false,modelRequestId=0,keyDebounce=0,modelMeta=new Map();
  function renderModels(provider,models,preferred=''){
    const unique=[...new Map(models.filter(m=>m?.id).map(m=>[m.id,m])).values()];modelMeta=new Map(unique.map(m=>[m.id,m]));const select=$('plModel'),prior=preferred||select.value;
    select.innerHTML=unique.map(m=>`<option value="${esc(m.id)}">${esc(m.label||m.id)}</option>`).join('');if(unique.some(m=>m.id===prior))select.value=prior;syncReasoningControl();
  }
  function syncReasoningControl(){
    const provider=$('plProvider').value,model=$('plModel').value,meta=modelMeta.get(model);let supported=true;
    if(provider==='gemini'&&meta?.thinking===false)supported=false;
    if(provider==='claude'&&!/(sonnet-(?:5|4-6)|opus-4-(?:[5-9])|fable-5|mythos)/i.test(model))supported=false;
    if(provider==='openai'&&!/^(gpt-5|o\d)/i.test(model))supported=false;
    $('plReasoning').disabled=!supported;if(!supported)$('plReasoning').value='default';$('plReasoning').title=supported?'':'This model does not advertise reasoning-tier support.';
  }
  function useFallbackModels(provider){renderModels(provider,MODEL_FALLBACKS[provider]||[])}
  async function refreshModels(){
    const provider=$('plProvider').value,key=$('plKey').value.trim(),requestId=++modelRequestId,prior=$('plModel').value;if(!key){useFallbackModels(provider);$('plStatus').textContent='Enter your API key to load the models available to your account.';$('plStatus').classList.remove('err');return}
    $('plRefreshModels').disabled=true;$('plStatus').textContent='Loading models…';$('plStatus').classList.remove('err');
    try{const models=await listProviderModels({provider,key});if(requestId!==modelRequestId)return;if(!models.length)throw new Error('The provider returned no compatible generation models.');renderModels(provider,models,prior);$('plStatus').textContent=`${models.length} models loaded from ${provider==='claude'?'Claude':provider==='openai'?'OpenAI':'Gemini'}.`}
    catch(e){if(requestId!==modelRequestId)return;useFallbackModels(provider);$('plStatus').textContent=e.message||String(e);$('plStatus').classList.add('err')}
    finally{if(requestId===modelRequestId)$('plRefreshModels').disabled=false}
  }
  useFallbackModels('gemini');$('plModel').onchange=syncReasoningControl;$('plRefreshModels').onclick=refreshModels;
  $('plProvider').onchange=e=>{modelRequestId++;clearTimeout(keyDebounce);$('plRefreshModels').disabled=false;$('plKey').value='';useFallbackModels(e.target.value);$('plStatus').textContent='Enter this provider’s API key to refresh its model list.';$('plStatus').classList.remove('err')};
  $('plKey').oninput=()=>{clearTimeout(keyDebounce);keyDebounce=setTimeout(refreshModels,700)};
  function importItemJson(text){const spec=validateItemSpec(extractJson(text)),item=createInstance(spec);findOpenSpot(item);refreshSelection();$('plStatus').textContent=`${spec.name} added · ${spec.parts.length} validated parts`;$('plStatus').classList.remove('err');toast(`${spec.name} added`);return spec}
  $('plCopyPrompt').onclick=async()=>{const request=$('plPrompt').value.trim();if(!request){$('plStatus').textContent='Describe the object first, then copy the prompt.';$('plStatus').classList.add('err');return}const text=generationPrompt(request);try{await navigator.clipboard.writeText(text);$('plStatus').textContent='Prompt copied. Paste the AI’s JSON response below.';$('plStatus').classList.remove('err');toast('AI prompt copied')}catch{prompt('Copy this prompt',text)}};
  $('plChooseJson').onclick=()=>$('plJsonFile').click();
  $('plJsonFile').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>256*1024){$('plStatus').textContent='That file is larger than the 256 KB import limit.';$('plStatus').classList.add('err');return}try{$('plJson').value=await file.text();$('plStatus').textContent=`${file.name} loaded. Review it, then add it to the room.`;$('plStatus').classList.remove('err')}catch(err){$('plStatus').textContent=err.message||String(err);$('plStatus').classList.add('err')}};
  $('plImportJson').onclick=()=>{const text=$('plJson').value.trim();if(!text){$('plStatus').textContent='Paste or upload an item JSON file first.';$('plStatus').classList.add('err');return}if(new Blob([text]).size>256*1024){$('plStatus').textContent='That JSON is larger than the 256 KB import limit.';$('plStatus').classList.add('err');return}try{importItemJson(text)}catch(e){$('plStatus').textContent=e.message||String(e);$('plStatus').classList.add('err')}};
  $('plGenerate').onclick=async()=>{const provider=$('plProvider').value,key=$('plKey').value.trim(),model=$('plModel').value,reasoning=$('plReasoning').value,request=$('plPrompt').value.trim();if(!key||!model||!request){$('plStatus').textContent='Add a key, choose a model, and describe the object.';$('plStatus').classList.add('err');return}const btn=$('plGenerate');btn.disabled=true;btn.textContent='Generating…';$('plStatus').classList.remove('err');try{const text=await callProvider({provider,key,model,reasoning,prompt:generationPrompt(request)});if(plDisposed)return;importItemJson(text)}catch(e){if(plDisposed)return;const blocked=e instanceof TypeError&&/fetch/i.test(e.message||'');$('plStatus').textContent=blocked?`${provider} blocked this browser request.`:(e.message||String(e));$('plStatus').classList.add('err')}finally{if(!plDisposed){btn.disabled=false;btn.textContent='Generate with API'}}};

  function beginInteraction(e,nextDrag){drag=nextDrag;onInteractionStart();orbit.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation()}
  function movePlacement(e){
    if(!placing)return false;
    const p=placing.mount==='wall'?wallPoint(e,placing):groundPoint(e);if(!p)return false;
    if(placing.mount==='wall'){
      if(placing.wall==='bed'||placing.wall==='closet')placing.x=snapInch(p.x);else placing.z=snapInch(p.z);
      placing.y=snapInch(p.y-placing.dimensions.h/2);mountToWall(placing,placing.wall);
    }else{
      placing.x=snapInch(p.x);placing.z=snapInch(p.z);clampInstance(placing);
    }
    placing.group.visible=true;selection.visible=true;refreshSelection();return true;
  }
  function finishPlacement(e){
    if(!placing||!movePlacement(e))return false;
    const item=placing;placing=null;item.pendingPlacement=false;onInteractionEnd();scheduleSave();toast(`${item.spec.name} placed`);return true;
  }
  function pointerDown(e){
    if(e.button!==0)return;updatePointer(e);
    if(placing){if(finishPlacement(e)){e.preventDefault();e.stopImmediatePropagation()}return}
    const meshes=[];for(const item of items){if(item.pickProxy)meshes.push(item.pickProxy);item.visual?.traverse(o=>{if(o.isMesh)meshes.push(o)})}
    const itemById=new Map(items.map(item=>[item.instanceId,item])),nearestByItem=new Map();
    for(const objectHit of raycaster.intersectObjects(meshes,false)){const item=itemById.get(objectHit.object.userData.plannerInstanceId);if(item&&(!nearestByItem.has(item)||objectHit.distance<nearestByItem.get(item).distance))nearestByItem.set(item,objectHit)}
    const candidates=[...nearestByItem].map(([item,objectHit])=>({item,objectHit})).sort((a,b)=>(b.item.interactionLayer||0)-(a.item.interactionLayer||0)||a.objectHit.distance-b.objectHit.distance);
    if(candidates.length){const item=candidates[0].item;if(item!==selected){select(item);return}if(item.mount==='wall'){const p=wallPoint(e,item);beginInteraction(e,{type:'wall-move',offset:p?{x:item.x-p.x,y:item.y-p.y,z:item.z-p.z}:{x:0,y:0,z:0}})}else{const p=groundPoint(e);beginInteraction(e,{type:'move',offset:p?{x:item.x-p.x,z:item.z-p.z}:{x:0,z:0}})}return}
    select(null);
  }
  function pointerMove(e){
    if(placing){if(movePlacement(e)){e.preventDefault();e.stopImmediatePropagation()}return}
    if(!drag||!selected)return;e.preventDefault();e.stopImmediatePropagation();
    if(drag.type==='move'){const p=groundPoint(e);if(!p)return;selected.x=snapInch(p.x+drag.offset.x);selected.z=snapInch(p.z+drag.offset.z);clampInstance(selected)}
    else if(drag.type==='wall-move'){const p=wallPoint(e,selected);if(!p)return;if(selected.wall==='bed'||selected.wall==='closet')selected.x=snapInch(p.x+drag.offset.x);else selected.z=snapInch(p.z+drag.offset.z);selected.y=snapInch(p.y+drag.offset.y);clampInstance(selected)}
    refreshSelection();scheduleSave();
  }
  function pointerUp(e){if(!drag)return;e.preventDefault();e.stopImmediatePropagation();drag=null;onInteractionEnd();try{renderer.domElement.releasePointerCapture(e.pointerId)}catch{}scheduleSave()}
  renderer.domElement.addEventListener('pointerdown',pointerDown,true);renderer.domElement.addEventListener('pointermove',pointerMove,true);renderer.domElement.addEventListener('pointerup',pointerUp,true);renderer.domElement.addEventListener('pointercancel',pointerUp,true);
  const onKeyDown=e=>{if(e.key==='Escape'&&placing){e.preventDefault();remove(placing);toast('Placement canceled');return}if((e.key==='Delete'||e.key==='Backspace')&&selected&&!selected.builtin&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();remove(selected)}if(e.key.toLowerCase()==='r'&&selected&&selected.mount!=='wall'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){selected.rotation=rotateByKeyboardStep(selected.rotation);clampInstance(selected);refreshSelection();scheduleSave()}};
  addEventListener('keydown',onKeyDown);

  function updateOverlay(){if(!selected||(selected.pendingPlacement&&!selected.group.visible)){$('measureTag').style.display='none';return}const p=new THREE.Vector3(selected.x,selected.y+selected.dimensions.h+.16,selected.z);root.localToWorld(p);p.project(camera);const rect=renderer.domElement.getBoundingClientRect(),hostRect=container.getBoundingClientRect(),visible=p.z<1&&p.x>-1.2&&p.x<1.2&&p.y>-1.2&&p.y<1.2;$('measureTag').style.display=visible?'block':'none';$('measureTag').style.left=`${rect.left-hostRect.left+(p.x*.5+.5)*rect.width}px`;$('measureTag').style.top=`${rect.top-hostRect.top+(-p.y*.5+.5)*rect.height}px`;$('measureTag').textContent=`${fmtIn(selected.dimensions.w)} × ${fmtIn(selected.dimensions.d)} × ${fmtIn(selected.dimensions.h)}${selected.y>0?` · ${fmtIn(selected.y)} up`:''}`}
  function drawMinimap(ctx,ox,oy,scale){for(const item of items){if(item.pendingPlacement||item.mount==='wall')continue;const b=bounds(item),fit=fitFor(item);ctx.fillStyle=fit.ok?'rgba(34,197,94,.58)':'rgba(239,68,68,.68)';ctx.fillRect(ox+b.x0*scale,oy+b.z0*scale,(b.x1-b.x0)*scale,(b.z1-b.z0)*scale)}}
  function getColliders(){return items.filter(i=>!i.pendingPlacement&&i.mount!=='wall'&&i.spec.category!=='Floor'&&i.dimensions.h>=.04&&i.y<1.8&&i.y+i.dimensions.h>.08).map(i=>{const b=bounds(i);return[b.x0,b.z0,b.x1,b.z1,i.y+i.dimensions.h]})}
  function clearLayout(){for(const item of [...items])item.builtin?resetBuiltin(item):remove(item);select(null);clearTimeout(saveTimer);saveTimer=0;saveLayout();toast('Layout reset')}

  for(const def of builtins)registerBuiltin(def);renderCatalog();loadLayout(new URLSearchParams(location.search).get('layout')||initialLayout);clearTimeout(saveTimer);saveTimer=0;
  function dispose(){
    plDisposed=true;modelRequestId++;
    removeEventListener('keydown',onKeyDown);
    renderer.domElement.removeEventListener('pointerdown',pointerDown,true);renderer.domElement.removeEventListener('pointermove',pointerMove,true);renderer.domElement.removeEventListener('pointerup',pointerUp,true);renderer.domElement.removeEventListener('pointercancel',pointerUp,true);
    if(saveTimer){clearTimeout(saveTimer);saveTimer=0;saveLayout()}clearTimeout(keyDebounce);clearTimeout(toast.timer);
    container.classList.remove('planner-open');
    shell.remove();style.remove();
  }
  return{update:updateOverlay,drawMinimap,getColliders,clearLayout,dispose,get items(){return items}};
}
