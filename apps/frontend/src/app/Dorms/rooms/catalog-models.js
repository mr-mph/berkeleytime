// Launch-quality parametric catalog models. Every model remains a declarative,
// non-executable item spec, but the shared families include product-scale
// construction details instead of placeholder blocks.

const P = (type, position, size, color, extra = {}) => ({ type, position, size, color, ...extra });
const box = (p, s, c, extra = {}) => P('roundedBox', p, s, c, { radius: .025, ...extra });
const cyl = (p, s, c, extra = {}) => P('cylinder', p, s, c, extra);
const sphere = (p, s, c, extra = {}) => P('sphere', p, s, c, extra);
const torus = (p, s, c, extra = {}) => P('torus', p, s, c, extra);
const tube = (path, radius, color, extra = {}) => P('tube', [0, 0, 0], [1, 1, 1], color, { path, radius, ...extra });
const disc = (p, s, c, extra = {}) => P('disc', p, s, c, extra);
const ring = (p, s, c, extra = {}) => P('ring', p, s, c, extra);
const wedge = (p, s, c, extra = {}) => P('wedge', p, s, c, extra);
const extrude = (p, s, c, outline, extra = {}) => P('extrude', p, s, c, { outline, ...extra });
const loft = (p, s, c, rings, extra = {}) => P('loft', p, s, c, { rings, ...extra });

function mouseRing(y, rx, front, rear, xOffset = 0) {
  const centerZ=(rear-front)/2,radiusZ=(rear+front)/2;
  return Array.from({length:18},(_,i)=>{const a=i*Math.PI*2/18;return[xOffset+Math.cos(a)*rx,y,centerZ+Math.sin(a)*radiusZ]});
}

function fishRing(x, ry, rz) {
  return Array.from({length:18},(_,i)=>{const a=i*Math.PI*2/18;return[x,Math.cos(a)*ry,Math.sin(a)*rz]});
}

const PALETTE = {
  ink: '#171a1f', black: '#090b0e', dark: '#2a3037', graphite: '#404852',
  silver: '#aeb6bf', aluminum: '#d4d9de', white: '#f4f3ef', warm: '#ded6ca',
  glass: '#d8f2fb', water: '#48a9ca', blue: '#3d6f9e', green: '#3e7c4a',
  leaf: '#4f965a', leafDark: '#285f35', wood: '#9a704d', woodDark: '#60442f',
  red: '#b84a43', amber: '#efb64f', fabric: '#657a8b', paper: '#f5f1e8',
};

function feet(parts, x = .38, z = .36, y = .035, color = PALETTE.black) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    parts.push(cyl([sx * x, y, sz * z], [.075, .07, .075], color, { finish: 'rubber' }));
  }
}

function ventRows(parts, { y0 = .18, rows = 5, x0 = -.34, cols = 8, z = -.49, color = '#11151a' } = {}) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    parts.push(box([x0 + c * .095, y0 + r * .045, z], [.055, .012, .012], color, { radius: .005, finish: 'rubber' }));
  }
}

function productShell(color, { panel = true, feetOn = true } = {}) {
  const parts = [
    box([0, .5, 0], [.94, .94, .90], color, { radius: .045, finish: 'plastic' }),
    box([0, .52, -.462], [.84, .82, .018], '#222831', { radius: .018, finish: 'plastic' }),
  ];
  if (panel) {
    parts.push(box([.25, .72, -.478], [.25, .13, .018], PALETTE.black, { radius: .015, finish: 'screen', emissive: '#07131d' }));
    parts.push(cyl([.36, .53, -.482], [.10, .035, .10], PALETTE.silver, { rotation: [90, 0, 0], finish: 'brushed' }));
  }
  if (feetOn) feet(parts);
  return parts;
}

function appliance(id, color) {
  if (id === 'micro-fridge') {
    const parts = [
      box([0, .37, 0], [.96, .70, .94], color || '#24282e', { radius: .035, finish: 'painted-metal' }),
      box([0, .38, -.478], [.88, .60, .018], '#2d3239', { radius: .018, finish: 'painted-metal' }),
      box([.39, .40, -.493], [.025, .27, .025], PALETTE.silver, { radius: .008, finish: 'brushed' }),
      box([0, .84, 0], [.96, .25, .88], '#292e34', { radius: .035, finish: 'painted-metal' }),
      box([-.12, .84, -.455], [.60, .17, .018], '#11171c', { radius: .018, finish: 'glass' }),
      box([.34, .84, -.458], [.18, .17, .018], '#596169', { radius: .012, finish: 'plastic' }),
      box([.34, .88, -.472], [.11, .045, .012], '#0d2634', { finish: 'screen', emissive: '#0b3a4f' }),
    ];
    for (let i = 0; i < 4; i++) parts.push(cyl([.30 + (i % 2) * .08, .82 - Math.floor(i / 2) * .07, -.475], [.028, .012, .028], '#d2d7db', { rotation: [90, 0, 0], finish: 'plastic' }));
    ventRows(parts, { y0: .08, rows: 2, x0: -.26, cols: 6, z: -.487 });
    feet(parts, .38, .37, .022);
    return parts;
  }
  if (/fridge|freezer|cooler/.test(id)) {
    const glassDoor = id.includes('cooler');
    const parts = [
      box([0, .5, 0], [.96, .97, .94], color || '#24282e', { radius: .035, finish: 'painted-metal' }),
      box([0, .53, -.478], [.88, .86, .018], glassDoor ? '#172b35' : '#2d3239', { radius: .018, finish: glassDoor ? 'glass' : 'painted-metal', opacity: glassDoor ? .72 : 1 }),
      box([.39, .53, -.493], [.025, .34, .025], PALETTE.silver, { radius: .008, finish: 'brushed' }),
      box([0, .73, -.492], [.84, .008, .012], '#111418', { radius: .003, finish: 'rubber' }),
      box([-.32, .93, -.493], [.18, .035, .015], '#9099a2', { finish: 'brushed' }),
    ];
    ventRows(parts, { y0: .09, rows: 2, x0: -.28, cols: 7, z: -.487 });
    feet(parts, .38, .37, .025);
    if (glassDoor) {
      for (const y of [.25, .46, .67]) parts.push(box([0, y, -.49], [.72, .018, .018], PALETTE.silver, { finish: 'metal' }));
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) parts.push(cyl([-.26 + c * .13, .20 + r * .21, -.48], [.055, .07, .055], ['#b45309', '#2563eb', '#16a34a'][r], { rotation: [90, 0, 0], finish: 'glass' }));
    }
    return parts;
  }
  if (/microwave/.test(id)) {
    const parts = [box([0, .5, 0], [.98, .94, .94], '#2b3036', { radius: .045, finish: 'painted-metal' })];
    parts.push(box([-.13, .53, -.485], [.61, .67, .018], '#11171c', { radius: .025, finish: 'glass' }));
    parts.push(box([.33, .55, -.486], [.20, .61, .018], '#555e66', { radius: .018, finish: 'plastic' }));
    parts.push(box([.33, .73, -.498], [.13, .10, .012], '#0d1b23', { finish: 'screen', emissive: '#0b3a4f' }));
    for (let i = 0; i < 6; i++) parts.push(cyl([.29 + (i % 2) * .08, .60 - Math.floor(i / 2) * .09, -.501], [.035, .015, .035], '#cbd1d6', { rotation: [90, 0, 0], finish: 'plastic' }));
    parts.push(box([.33, .23, -.5], [.13, .055, .018], '#cbd1d6', { finish: 'plastic' }));
    feet(parts, .40, .36, .025);
    return parts;
  }
  if (/kettle/.test(id)) {
    const parts = [
      cyl([0, .44, 0], [.72, .72, .72], PALETTE.aluminum, { finish: 'brushed' }),
      P('cone', [0, .73, 0], [.54, .25, .54], PALETTE.aluminum, { rotation: [180, 0, 0], finish: 'brushed' }),
      cyl([0, .88, 0], [.40, .055, .40], PALETTE.black, { finish: 'plastic' }),
      cyl([0, .93, 0], [.18, .08, .18], PALETTE.black, { finish: 'plastic' }),
      P('cone', [-.42, .60, 0], [.42, .28, .34], PALETTE.aluminum, { rotation: [0, 0, 75], finish: 'brushed' }),
      torus([.31, .57, 0], [.62, .54, .24], PALETTE.black, { rotation: [0, 90, 0], finish: 'plastic' }),
      cyl([0, .05, 0], [.86, .10, .86], PALETTE.black, { finish: 'plastic' }),
      box([-.38,.48,-.30],[.035,.42,.035],'#b7dcea',{radius:.012,finish:'glass',opacity:.55}),
      box([-.38,.31,-.325],[.06,.025,.018],'#2b6f8b',{radius:.004,finish:'ink'}),
      box([-.38,.45,-.325],[.06,.025,.018],'#2b6f8b',{radius:.004,finish:'ink'}),
      box([-.38,.59,-.325],[.06,.025,.018],'#2b6f8b',{radius:.004,finish:'ink'}),
      box([.43,.30,-.08],[.045,.14,.14],PALETTE.black,{radius:.025,rotation:[0,0,-8],finish:'plastic'}),
      box([.445,.30,-.09],[.025,.065,.08],'#ef4444',{radius:.012,rotation:[0,0,-8],finish:'glass',emissive:'#991b1b'}),
      torus([0,.08,0],[.78,.035,.78],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
    ];
    for(let i=0;i<5;i++)parts.push(box([-.22+i*.11,.755,-.25],[.06,.010,.012],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    return parts;
  }
  if (/coffee|brewer/.test(id)) {
    if(id==='coffee-maker'){
      const parts=[
        box([0,.10,.10],[.92,.16,.88],PALETTE.graphite,{radius:.050,finish:'plastic'}),
        box([0,.18,-.22],[.72,.09,.46],PALETTE.black,{radius:.035,finish:'painted-metal'}),
        box([0,.66,.31],[.76,.68,.34],color||'#343a40',{radius:.065,finish:'plastic'}),
        box([0,.91,.20],[.78,.12,.50],PALETTE.graphite,{radius:.030,finish:'plastic'}),
        box([0,.79,-.05],[.56,.13,.42],PALETTE.black,{radius:.030,finish:'plastic'}),
        cyl([0,.72,-.23],[.33,.055,.33],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
        cyl([0,.64,-.23],[.27,.050,.27],PALETTE.black,{rotation:[90,0,0],finish:'plastic'}),
        P('lathe',[0,.37,-.23],[.50,.54,.42],PALETTE.glass,{profile:[[.23,-.46],[.37,-.38],[.43,-.12],[.37,.10],[.27,.27],[.20,.41]],smoothProfile:true,finish:'glass',opacity:.34}),
        cyl([0,.15,-.23],[.29,.055,.29],PALETTE.black,{finish:'plastic'}),
        cyl([0,.61,-.23],[.21,.06,.21],PALETTE.black,{finish:'plastic'}),
        tube([[.25,.27,-.23],[.42,.32,-.23],[.44,.46,-.23],[.32,.54,-.23]],.035,PALETTE.black,{finish:'plastic'}),
        box([0,.48,-.48],[.12,.24,.025],PALETTE.graphite,{radius:.010,finish:'plastic'}),
        box([0,.87,-.05],[.38,.09,.025],'#173445',{radius:.014,finish:'screen',emissive:'#0a3042'}),
      ];
      for(let i=0;i<5;i++)parts.push(cyl([-.19+i*.095,.82,-.070],[.030,.020,.030],i===4?'#4ade80':'#cbd3d9',{rotation:[90,0,0],finish:'plastic',emissive:i===4?'#166534':undefined}));
      for(let i=0;i<4;i++)parts.push(box([-.29+i*.19,.58,.47],[.11,.13,.016],'#6da5b7',{radius:.006,finish:'water',opacity:.42}));
      for(const x of [-.32,.32])for(const z of [-.29,.34])parts.push(cyl([x,.025,z],[.055,.05,.055],PALETTE.black,{finish:'rubber'}));
      return parts;
    }
    const parts = productShell(color || '#343a40', { feetOn: true });
    parts.push(box([0, .48, -.49], [.54, .43, .025], '#171c21', { radius: .025, finish: 'plastic' }));
    parts.push(cyl([0, .55, -.52], [.18, .10, .18], PALETTE.silver, { rotation: [90, 0, 0], finish: 'metal' }));
    parts.push(cyl([0, .20, -.42], [.46, .06, .42], PALETTE.black, { finish: 'plastic' }));
    return parts;
  }
  if (/toaster/.test(id)) {
    const parts = [box([0, .49, 0], [.96, .82, .92], PALETTE.aluminum, { radius: .09, finish: 'brushed' })];
    for (const x of [-.22, .22]) parts.push(box([x, .91, 0], [.28, .025, .64], PALETTE.black, { radius: .009, finish: 'rubber' }));
    parts.push(box([.49, .52, 0], [.018, .12, .43], PALETTE.black, { finish: 'plastic' }));
    parts.push(cyl([.49, .31, 0], [.08, .025, .08], PALETTE.black, { rotation: [0, 0, 90], finish: 'plastic' }));
    feet(parts, .38, .32, .035);
    return parts;
  }
  if (/blender/.test(id)) {
    const parts = [
      box([0, .18, 0], [.70, .30, .72], '#30363d', { radius: .07, finish: 'plastic' }),
      cyl([0, .60, 0], [.58, .58, .58], PALETTE.glass, { finish: 'glass', opacity: .42 }),
      P('cone', [0, .63, 0], [.62, .66, .62], PALETTE.glass, { finish: 'glass', opacity: .38 }),
      box([0, .93, 0], [.62, .08, .62], PALETTE.black, { radius: .025, finish: 'rubber' }),
      torus([.36, .65, 0], [.46, .42, .22], '#334155', { rotation: [0, 90, 0], finish: 'plastic' }),
    ];
    for (let i = 0; i < 3; i++) parts.push(cyl([-.18 + i * .18, .18, -.37], [.06, .025, .06], '#dce2e7', { rotation: [90, 0, 0], finish: 'plastic' }));
    return parts;
  }
  if (/rice-cooker|air-fryer|ice-maker|griddle|record-player|printer|scanner/.test(id)) {
    const parts = productShell(color || '#3b4148');
    if (id.includes('record-player')) {
      parts.splice(0, parts.length,
        box([0, .32, 0], [.96, .54, .92], PALETTE.woodDark, { radius: .04, finish: 'wood' }),
        cyl([-.10, .62, 0], [.63, .055, .63], PALETTE.black, { finish: 'vinyl' }),
        cyl([-.10, .66, 0], [.08, .035, .08], PALETTE.silver, { finish: 'metal' }),
        tube([[.22,.68,.24],[.32,.70,.15],[.18,.68,-.13]], .014, PALETTE.silver, { finish: 'metal' }),
        box([0, .73, .12], [.94, .025, .66], PALETTE.glass, { finish: 'glass', opacity: .2, rotation: [-18,0,0] }));
    }
    return parts;
  }
  return productShell(color || '#40464d');
}

function screenModel(id) {
  const dual = id === 'dual-monitors';
  const tv = id === 'tv';
  const parts = [];
  const xs = dual ? [-.25, .25] : [0];
  const pw = dual ? .47 : .90;
  for (const x of xs) {
    parts.push(box([x, tv ? .61 : .64, .03], [pw, tv ? .60 : .52, .075], '#14181d', { radius: .018, finish: 'plastic' }));
    parts.push(box([x, tv ? .62 : .65, -.012], [pw * .94, (tv ? .60 : .52) * .89, .018], '#183047', { radius: .008, finish: 'screen', emissive: '#071827' }));
    parts.push(cyl([x, tv ? .90 : .89, -.025], [.018, .012, .018], '#252b31', { rotation: [90, 0, 0], finish: 'glass' }));
  }
  if (tv) {
    parts.push(box([0, .25, .08], [.055, .21, .08], PALETTE.graphite, { finish: 'metal' }));
    parts.push(box([0, .13, .09], [.54, .045, .38], PALETTE.graphite, { radius: .025, finish: 'metal' }));
  } else {
    for (const x of xs) {
      parts.push(cyl([x, .33, .06], [.075, .36, .075], PALETTE.silver, { finish: 'brushed' }));
      parts.push(box([x, .11, .09], [dual ? .32 : .46, .035, .38], PALETTE.graphite, { radius: .022, finish: 'metal' }));
    }
  }
  return parts;
}

function mouseModel(id, color) {
  const vertical = id.includes('vertical');
  const trackball = id.includes('trackball');
  const controller = id.includes('controller');
  if (controller) {
    const parts = [box([0, .48, 0], [.76, .56, .72], color, { radius: .18, finish: 'plastic' })];
    parts.push(box([-.34, .34, .22], [.36, .35, .42], color, { radius: .15, rotation: [0, 0, 18], finish: 'plastic' }));
    parts.push(box([.34, .34, .22], [.36, .35, .42], color, { radius: .15, rotation: [0, 0, -18], finish: 'plastic' }));
    for (const [x,z] of [[-.18,-.12],[.18,.06]]) parts.push(cyl([x,.73,z],[.14,.10,.14],PALETTE.black,{finish:'rubber'}));
    for (const [x,z,c] of [[.27,-.16,'#ef4444'],[.35,-.05,'#eab308'],[.19,-.05,'#3b82f6'],[.27,.06,'#22c55e']]) parts.push(cyl([x,.76,z],[.075,.04,.075],c,{finish:'plastic'}));
    for (const [x,z] of [[-.28,-.07],[-.20,-.07],[-.24,-.15],[-.24,.01]]) parts.push(box([x,.76,z],[.08,.035,.08],PALETTE.black,{radius:.008,finish:'rubber'}));
    for(const x of [-.28,.28]){parts.push(box([x,.56,.34],[.22,.12,.12],PALETTE.graphite,{radius:.035,finish:'rubber'}),box([x,.49,.38],[.18,.08,.08],PALETTE.silver,{radius:.022,finish:'metal'}));}
    parts.push(box([0,.62,.34],[.22,.06,.06],PALETTE.graphite,{radius:.015,finish:'plastic'}),box([0,.39,-.38],[.18,.035,.016],PALETTE.silver,{radius:.006,finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(cyl([-.12+i*.08,.50,-.39],[.014,.010,.014],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  const gaming = id.includes('gaming');
  const shell = gaming ? '#252c35' : color || '#66717c';
  const parts = [
    box([0,.105,.08],[.87,.15,.82],PALETTE.black,{radius:.18,finish:'rubber'}),
    box([0,.185,.10],[.91,.12,.86],gaming?'#11161c':'#303841',{radius:.19,finish:'soft-plastic'}),
  ];
  if (vertical) {
    parts.push(
      loft([0,0,0],[1,1,1],shell,[mouseRing(.15,.39,.38,.40),mouseRing(.30,.37,.36,.39,-.02),mouseRing(.52,.31,.31,.34,-.07),mouseRing(.73,.22,.25,.29,-.13),mouseRing(.86,.10,.18,.20,-.18),mouseRing(.90,.025,.04,.05,-.20)],{rotation:[0,0,-5],finish:'soft-plastic'}),
      sphere([-.16,.37,.21],[.46,.46,.58],'#303944',{rotation:[0,0,-10],finish:'soft-plastic'}),
      box([.13,.53,-.12],[.34,.38,.43],shell,{radius:.13,rotation:[0,0,-28],finish:'soft-plastic'}),
      box([.07,.67,-.22],[.19,.075,.34],'#3a4551',{radius:.045,rotation:[0,0,-30],finish:'soft-plastic'}),
      box([.25,.53,-.17],[.14,.07,.34],'#46515d',{radius:.040,rotation:[0,0,-30],finish:'soft-plastic'}),
      cyl([.15,.64,-.31],[.080,.12,.080],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}),
      box([-.33,.38,-.02],[.13,.12,.34],PALETTE.black,{radius:.045,rotation:[0,0,-9],finish:'rubber'}),
      box([-.31,.48,-.10],[.12,.08,.18],'#6f7c88',{radius:.035,rotation:[0,0,-12],finish:'plastic'}),
      box([-.32,.58,-.12],[.11,.07,.16],'#6f7c88',{radius:.035,rotation:[0,0,-12],finish:'plastic'}),
      torus([-.20,.25,.18],[.53,.10,.50],'#20262d',{rotation:[90,0,0],finish:'rubber'}),
      tube([[-.27,.22,.33],[-.35,.43,.11],[-.16,.78,-.22],[.21,.85,-.17]],.009,'#8a99a6',{finish:'plastic'})
    );
    for(let i=0;i<6;i++)parts.push(box([.135,.63+i*.018,-.335],[.11,.008,.018],i%2?'#2c333b':'#6f7a84',{radius:.002,rotation:[0,0,-30],finish:'rubber'}));
  } else {
    parts.push(
      loft([0,0,0],[1,1,1],shell,[mouseRing(.15,.43,.40,.42),mouseRing(.27,.43,.40,.42),mouseRing(.42,.39,.35,.40),mouseRing(.55,.31,.29,.34),mouseRing(.61,.18,.20,.22),mouseRing(.65,.025,.04,.05)],{finish:'soft-plastic'}),
      extrude([-.195,.465,-.27],[.34,.34,.050],gaming?'#303a45':shell,[[-.50,-.50],[.36,-.50],[.50,.25],[.24,.50],[-.50,.38]],{radius:.075,rotation:[90,0,-2],finish:'soft-plastic',bevel:.045}),
      extrude([.195,.465,-.27],[.34,.34,.050],gaming?'#37424e':shell,[[-.36,-.50],[.50,-.50],[.50,.38],[-.24,.50],[-.50,.25]],{radius:.075,rotation:[90,0,2],finish:'soft-plastic',bevel:.045}),
      box([0,.47,-.11],[.045,.040,.44],PALETTE.black,{radius:.012,finish:'rubber'}),
      cyl([0,.545,-.29],[.080,.115,.080],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}),
      box([0,.475,-.005],[.075,.045,.10],PALETTE.black,{radius:.024,finish:'rubber'})
    );
    for(let i=0;i<6;i++)parts.push(box([0,.535,-.34+i*.020],[.085,.008,.010],i%2?'#272c32':'#737d86',{radius:.002,finish:'rubber'}));
    if(trackball)parts.push(sphere([.22,.59,.02],[.31,.31,.31],'#c43f3f',{finish:'gloss-plastic'}));
    if(gaming){
      parts.push(
        tube([[-.38,.20,.30],[-.45,.28,.02],[-.38,.42,-.28]],.011,'#38bdf8',{finish:'emissive',emissive:'#0ea5e9'}),
        tube([[.38,.20,.30],[.45,.28,.02],[.38,.42,-.28]],.011,'#a855f7',{finish:'emissive',emissive:'#7e22ce'}),
        box([-.42,.39,.01],[.055,.09,.18],PALETTE.black,{radius:.018,finish:'rubber'}),
        box([-.42,.50,-.05],[.055,.075,.15],PALETTE.black,{radius:.018,finish:'rubber'}),
        box([0,.535,.13],[.08,.055,.09],'#596673',{radius:.018,finish:'plastic'}),
        box([0,.525,.23],[.07,.045,.07],'#596673',{radius:.018,finish:'plastic'}),
        P('star',[0,.50,.33],[.15,.025,.13],'#80ddff',{rotation:[90,0,0],finish:'emissive',emissive:'#0ea5e9'})
      );
    }
  }
  for(const x of [-.31,.31])for(const z of [-.25,.31])parts.push(box([x,.025,z],[.16,.025,.12],'#0a0d10',{radius:.04,finish:'rubber'}));
  for(let i=0;i<7;i++)parts.push(cyl([-.36+i*.12,.105,.43],[.020,.012,.020],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
  while(parts.length<36){const i=parts.length;parts.push(box([-.34+(i%8)*.095,.20,.455],[.052,.022,.018],i%2?'#1b2229':'#59636c',{radius:.006,finish:'rubber'}));}
  return parts;
}

function keyboardModel(id, color) {
  const music = /keyboard-49|keyboard-61|midi-controller/.test(id);
  if (music) {
    const parts = [box([0,.34,0],[.98,.55,.94],color,{radius:.035,finish:'plastic'})];
    const whites = id.includes('61') ? 35 : id.includes('49') ? 28 : 18;
    const keyW = .88 / whites;
    for (let i=0;i<whites;i++) parts.push(box([-.44+keyW*(i+.5),.60,.16],[keyW*.92,.15,.57],PALETTE.white,{radius:.006,finish:'plastic'}));
    const blackPattern=[0,1,3,4,5];
    for(let i=0;i<whites-1;i++)if(blackPattern.includes(i%7))parts.push(box([-.44+keyW*(i+1),.69,-.01],[keyW*.55,.18,.34],PALETTE.black,{radius:.006,finish:'plastic'}));
    for(let i=0;i<8;i++)parts.push(cyl([-.36+i*.055,.61,-.35],[.035,.035,.035],i<4?'#334155':'#64748b',{finish:'rubber'}));
    parts.push(box([.24,.60,-.34],[.24,.08,.08],'#10202c',{finish:'screen',emissive:'#0d3b55'}));
    return parts;
  }
  if (id === 'drum-pad') {
    const parts=[box([0,.34,0],[.96,.55,.92],color,{radius:.045,finish:'plastic'})];
    for(let r=0;r<4;r++)for(let c=0;c<4;c++)parts.push(box([-.30+c*.20,.62,-.30+r*.20],[.15,.18,.15],['#475569','#64748b','#334155','#1e293b'][(r+c)%4],{radius:.025,finish:'rubber'}));
    return parts;
  }
  if (id === 'mechanical-keyboard') {
    const parts=[
      box([0,.18,0],[.98,.28,.94],color||'#343b44',{radius:.055,finish:'anodized'}),
      box([0,.315,.01],[.94,.055,.86],'#151a20',{radius:.025,finish:'painted-metal'}),
      box([0,.08,.45],[.88,.055,.025],'#38bdf8',{radius:.008,finish:'emissive',emissive:'#0ea5e9'}),
      box([0,.08,-.45],[.88,.055,.025],'#a855f7',{radius:.008,finish:'emissive',emissive:'#7e22ce'}),
      tube([[.08,.16,.45],[.10,.12,.56],[.16,.10,.64]],.012,PALETTE.black,{finish:'rubber'}),
    ];
    const addKey=(x,z,w=.038,c='#d7dce1',h=.16)=>parts.push(box([x,.40,z],[w,h,.090],c,{radius:.016,rotation:[-4,0,0],finish:'keycap'}));
    const mainXs=Array.from({length:14},(_,i)=>-.43+i*.045);
    mainXs.forEach((x,i)=>addKey(x,.24,.037,i===0?'#6b7280':'#cfd5da'));
    mainXs.forEach((x,i)=>addKey(x,.12,.037,i===13?'#8b5cf6':'#e1e5e8'));
    Array.from({length:13},(_,i)=>-.42+i*.048).forEach((x,i)=>addKey(x,0,.040,i===0?'#6b7280':'#e1e5e8'));
    Array.from({length:12},(_,i)=>-.40+i*.051).forEach((x,i)=>addKey(x,-.12,.043,i===0||i===11?'#6b7280':'#e1e5e8'));
    for(const [x,w,c] of [[-.40,.065,'#6b7280'],[-.32,.055,'#6b7280'],[-.24,.055,'#6b7280'],[-.03,.30,'#e1e5e8'],[.16,.055,'#6b7280']])addKey(x,-.24,w,c);
    for(let i=0;i<12;i++)addKey(-.41+i*.052,.36,.041,i===0?'#ef4444':'#68737e',.13);
    for(let r=0;r<2;r++)for(let c=0;c<3;c++)addKey(.22+c*.052,.12-r*.12,.041,'#9ba5ae');
    for(let r=0;r<4;r++)for(let c=0;c<4;c++)addKey(.31+c*.048,.24-r*.12,.038,(r===3&&c===3)?'#8b5cf6':'#d5dadd');
    addKey(.455,-.18,.038,'#8b5cf6');
    for(const x of [-.35,.35])for(const z of [-.34,.34])parts.push(box([x,.025,z],[.15,.04,.10],PALETTE.black,{radius:.025,finish:'rubber'}));
    for(let i=0;i<4;i++)parts.push(cyl([.22+i*.045,.36,-.39],[.018,.020,.018],['#22c55e','#eab308','#3b82f6','#ef4444'][i],{finish:'glass',emissive:['#166534','#854d0e','#1e40af','#991b1b'][i]}));
    return parts.slice(0,120);
  }
  const split=id.includes('split'),full=id.includes('full'),parts=[];
  const addKey=(x,z,w=.048,c='#e2e6e9',rotation=0)=>parts.push(box([x,.43,z],[w,.16,.095],c,{radius:.016,rotation:[-4,rotation,0],finish:'keycap'}));
  if(split){
    parts.push(box([-.255,.20,.01],[.46,.28,.90],color,{radius:.055,rotation:[0,-8,0],finish:'anodized'}),box([.255,.20,.01],[.46,.28,.90],color,{radius:.055,rotation:[0,8,0],finish:'anodized'}));
    for(const side of [-1,1]){
      const center=side*.255,angle=side*8*Math.PI/180;
      for(let r=0;r<5;r++)for(let c=0;c<6;c++){
        const dx=side*(-.175+c*.070),z=-.25+r*.125,x=center+dx*Math.cos(angle)+z*Math.sin(angle),zr=z*Math.cos(angle)-dx*Math.sin(angle);
        addKey(x,zr,.057,r===4&&c>3?'#8b5cf6':'#e2e6e9',side*8);
      }
      for(let i=0;i<3;i++){const x=center+side*(-.10+i*.08),z=-.37+i*.025;addKey(x,z,i===1?.105:.062,i===1?'#d1d6da':'#6b7280',side*13);}
      parts.push(box([center,.055,.36],[.28,.05,.11],PALETTE.black,{radius:.03,rotation:[0,side*8,0],finish:'rubber'}));
    }
    return parts;
  }
  parts.push(box([0,.20,0],[.98,.30,.94],color,{radius:.045,finish:'anodized'}),box([0,.335,0],[.94,.040,.86],'#171c22',{radius:.018,finish:'painted-metal'}));
  if(full){
    const mainXs=Array.from({length:14},(_,i)=>-.44+i*.044);
    mainXs.forEach((x,i)=>addKey(x,.25,.037,i===0?'#6b7280':'#e2e6e9'));
    mainXs.forEach((x,i)=>addKey(x,.13,.037,i===13?'#8b5cf6':'#e2e6e9'));
    Array.from({length:13},(_,i)=>-.43+i*.047).forEach((x,i)=>addKey(x,.01,.039,i===0?'#6b7280':'#e2e6e9'));
    Array.from({length:12},(_,i)=>-.41+i*.050).forEach((x,i)=>addKey(x,-.11,.042,i===0||i===11?'#6b7280':'#e2e6e9'));
    for(const [x,w,c] of [[-.40,.062,'#6b7280'],[-.32,.052,'#6b7280'],[-.24,.052,'#6b7280'],[-.04,.30,'#e2e6e9'],[.15,.052,'#6b7280']])addKey(x,-.23,w,c);
    for(let r=0;r<4;r++)for(let c=0;c<4;c++)addKey(.31+c*.048,.23-r*.12,.038,r===3&&c===3?'#8b5cf6':'#d5dadd');
    for(let r=0;r<2;r++)for(let c=0;c<3;c++)addKey(.20+c*.047,.12-r*.12,.037,'#929ca5');
  }else{
    const rows=[14,14,13,12];
    rows.forEach((count,r)=>Array.from({length:count},(_,i)=>-.43+i*(.86/(count-1))).forEach((x,i)=>addKey(x,.25-r*.13,r===3&&(i===0||i===count-1)?.062:.052,r===0&&i===0?'#ef4444':'#e2e6e9')));
    for(const [x,w,c] of [[-.40,.060,'#6b7280'],[-.32,.050,'#6b7280'],[-.24,.050,'#6b7280'],[-.02,.31,'#e2e6e9'],[.18,.050,'#6b7280'],[.27,.050,'#6b7280'],[.37,.050,'#8b5cf6']])addKey(x,-.27,w,c);
  }
  parts.push(box([0,.08,.45],[.84,.045,.025],PALETTE.black,{radius:.012,finish:'rubber'}));
  for(const x of [-.36,.36])parts.push(box([x,.025,.32],[.14,.035,.10],PALETTE.black,{radius:.02,finish:'rubber'}));
  return parts.slice(0,120);
}

function laptopModel(id, color) {
  const flat=/tablet|e-reader|drawing/.test(id);
  if(flat){
    const parts=[
      box([0,.48,0],[.98,.82,.94],color,{radius:.045,finish:'anodized'}),
      // Flat devices use the X/Z plane as their face.  Their actual height is
      // only a few millimetres after catalog scaling, so front-plane details
      // turn into hairline strips; keep the screen and controls on top instead.
      box([0,.908,0],[.88,.030,.70],'#173247',{radius:.02,finish:'screen',emissive:'#09243a'}),
      box([0,.926,0],[.91,.010,.735],PALETTE.black,{radius:.025,finish:'glass',opacity:.42}),
      cyl([0,.936,.350],[.025,.014,.025],PALETTE.black,{finish:'glass'}),
      cyl([0,.938,-.350],[.022,.012,.022],PALETTE.black,{finish:'glass'}),
      box([-.455,.50,0],[.018,.18,.06],PALETTE.graphite,{radius:.006,finish:'metal'}),
      box([.455,.58,0],[.018,.10,.06],PALETTE.graphite,{radius:.006,finish:'metal'}),
    ];
    for(let i=0;i<8;i++)parts.push(box([-.31+i*.09,.934,-.420],[.055,.010,.010],PALETTE.graphite,{radius:.003,finish:'metal'}));
    if(id.includes('tablet')){
      parts.push(cyl([-.34,.940,.260],[.065,.012,.065],PALETTE.black,{finish:'glass'}),cyl([-.34,.948,.260],[.032,.008,.032],PALETTE.silver,{finish:'metal'}));
      for(const z of [-.22,0,.22])parts.push(box([0,.943,z],[.64,.010,.006],z===0?'#4d85aa':'#24415a',{radius:.002,finish:'screen'}));
    }
    if(id.includes('e-reader')){for(let i=0;i<8;i++)parts.push(box([0,.943,.25-i*.065],[.62,.010,.008],i===0?'#d9e2e8':'#8394a0',{radius:.002,finish:'ink'}));parts.push(box([0,.944,-.31],[.18,.020,.075],PALETTE.graphite,{radius:.030,finish:'rubber'}));}
    if(id.includes('drawing')){
      parts.push(cyl([.32,.945,.04],[.025,.40,.025],PALETTE.silver,{rotation:[90,0,-18],finish:'plastic'}));
      parts.push(P('cone',[.255,.945,.16],[.035,.08,.035],PALETTE.graphite,{rotation:[90,0,-18],finish:'plastic'}));
      for(let i=0;i<8;i++)parts.push(box([-.35+i*.10,.944,-.32],[.075,.018,.035],i===2?'#60a5fa':PALETTE.graphite,{radius:.008,finish:'keycap'}));
    }
    while(parts.length<18)parts.push(cyl([0,.10+parts.length*.006,-.050],[.010,.008,.010],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  const parts=[
    box([0,.10,.05],[.98,.11,.90],color,{radius:.028,finish:'anodized'}),
    box([0,.57,.42],[.97,.84,.055],color,{radius:.025,rotation:[-7,0,0],finish:'anodized'}),
    box([0,.58,.39],[.88,.72,.018],'#16344a',{radius:.012,rotation:[-7,0,0],finish:'screen',emissive:'#08283e'}),
    cyl([0,.17,.40],[.025,.88,.025],PALETTE.graphite,{rotation:[0,0,90],finish:'metal'}),
    box([0,.17,.10],[.36,.025,.28],'#aeb5bc',{radius:.012,finish:'anodized'}),
  ];
  for(let r=0;r<5;r++)for(let c=0;c<13;c++)parts.push(box([-.40+c*.067,.18,-.31+r*.105],[.052,.028,.070],PALETTE.black,{radius:.008,finish:'keycap'}));
  parts.push(cyl([0,.91,.374],[.018,.012,.018],PALETTE.black,{rotation:[90,0,0],finish:'glass'}));
  return parts;
}

function mugModel(id, color) {
  const candle=id==='candle';
  const pencil=id.includes('pencil');
  if(!pencil&&!candle){
    const parts=[
      P('lathe',[0,.45,0],[.68,.80,.68],color,{profile:[[.28,-.50],[.42,-.46],[.46,-.34],[.46,.20],[.43,.38],[.37,.47]],smoothProfile:true,finish:'ceramic'}),
      cyl([0,.810,0],[.40,.012,.40],PALETTE.black,{finish:'liquid'}),
      cyl([0,.18,0],[.43,.015,.43],color,{finish:'ceramic'}),
      cyl([0,.70,0],[.43,.015,.43],color,{finish:'ceramic'}),
      cyl([0,.12,0],[.34,.018,.34],PALETTE.silver,{finish:'metal'}),
      cyl([0,.08,0],[.31,.055,.31],color,{finish:'ceramic'}),
      tube([[.31,.68,0],[.48,.70,0],[.54,.56,0],[.51,.34,0],[.31,.31,0]],.052,color,{finish:'ceramic'}),
      cyl([.31,.68,0],[.075,.055,.075],color,{finish:'ceramic'}),
      cyl([.31,.31,0],[.075,.055,.075],color,{finish:'ceramic'}),
    ];
    for(let i=0;i<9;i++)parts.push(cyl([0,.16+i*.065,0],[.445,.012,.445],color,{finish:'ceramic'}));
    return parts;
  }
  const parts=[
    cyl([0,.46,0],[.64,.86,.64],color,{finish:candle?'glass':'ceramic'}),
    cyl([0,.90,0],[.58,.035,.58],candle?'#f2dfbe':PALETTE.black,{finish:candle?'wax':'liquid'}),
    torus([0,.91,0],[.66,.075,.66],color,{rotation:[90,0,0],finish:candle?'glass':'ceramic'}),
  ];
  if(candle)parts.push(cyl([0,.96,0],[.02,.10,.02],'#5b4636',{finish:'fabric',emissive:'#f59e0b'}));
  if(pencil)for(let i=0;i<7;i++)parts.push(cyl([-.22+i*.07,.78,(i%2-.5)*.20],[.025,.64,.025],['#eab308','#ef4444','#2563eb'][i%3],{rotation:[0,0,(i-3)*2],finish:'wood'}));
  return parts;
}

function bowlModel(id, color) {
  const plate=id.includes('plate'), mixing=id.includes('mixing'), parts=[];
  if(plate){
    for(let i=0;i<5;i++){
      const y=.12+i*.115;
      parts.push(cyl([0,y,0],[.90,.07,.90],i===4?color:'#eef1f3',{finish:'ceramic'}));
      parts.push(cyl([0,y+.039,0],[.82,.012,.82],PALETTE.white,{finish:'ceramic'}));
      parts.push(cyl([0,y+.050,0],[.65,.008,.65],i===4?color:'#d6dadd',{finish:'ceramic'}));
    }
    for(let i=0;i<4;i++)parts.push(box([0,.09+i*.115,-.455],[.52,.010,.010],i%2?PALETTE.silver:color,{radius:.003,finish:'ceramic'}));
    return parts;
  }
  const outer=mixing?.94:.76, profile=mixing?[[.28,-.50],[.44,-.45],[.50,-.20],[.49,.10],[.43,.32],[.35,.44]]:[[.25,-.50],[.38,-.46],[.43,-.23],[.42,.10],[.36,.30],[.29,.40]];
  parts.push(P('lathe',[0,.40,0],[outer,.78,outer],color,{profile,smoothProfile:true,finish:'ceramic'}),cyl([0,.08,0],[outer*.42,.045,outer*.42],color,{finish:'ceramic'}),cyl([0,.64,0],[outer*.66,.026,outer*.66],mixing?'#eef2f4':'#e8d4aa',{finish:mixing?'ceramic':'food'}));
  if(mixing){
    parts.push(tube([[.32,.61,0],[.52,.63,0],[.60,.51,0],[.56,.34,0],[.32,.30,0]],.040,PALETTE.silver,{finish:'metal'}),cyl([.32,.61,0],[.060,.040,.060],PALETTE.silver,{finish:'metal'}),cyl([.32,.30,0],[.060,.040,.060],PALETTE.silver,{finish:'metal'}));
    for(let i=0;i<12;i++)parts.push(cyl([0,.16+i*.035,0],[outer*.46,.008,outer*.46],i%2?color:'#dfe7eb',{finish:'ceramic'}));
  }else{
    for(let i=0;i<15;i++){const a=i*2.399,r=.03+(i%4)*.040;parts.push(sphere([Math.cos(a)*r,.65+((i%3)-1)*.018,Math.sin(a)*r],[.060,.038,.060],['#d9aa57','#d49342','#f1cf7f'][i%3],{finish:'food'}));}
  }
  return parts;
}

function fishModel(id) {
  const tank=/aquarium|tank|terrarium/.test(id);
  const parts=[];
  if(tank){
    parts.push(
      box([0,.41,0],[.91,.66,.82],PALETTE.water,{radius:.008,finish:'water',opacity:.30}),
      box([0,.50,-.47],[.94,.88,.018],PALETTE.glass,{radius:.006,finish:'glass',opacity:.20}),
      box([0,.50,.47],[.94,.88,.018],PALETTE.glass,{radius:.006,finish:'glass',opacity:.20}),
      box([-.48,.50,0],[.018,.88,.92],PALETTE.glass,{radius:.006,finish:'glass',opacity:.20}),
      box([.48,.50,0],[.018,.88,.92],PALETTE.glass,{radius:.006,finish:'glass',opacity:.20}),
      box([0,.05,0],[.98,.09,.96],PALETTE.black,{radius:.015,finish:'plastic'}),
      box([0,.94,0],[.98,.08,.96],PALETTE.black,{radius:.015,finish:'plastic'}),
      box([0,.985,0],[.76,.035,.62],'#303842',{radius:.012,finish:'plastic'}),
      box([0,.955,-.18],[.56,.035,.08],'#e8f7ff',{radius:.012,finish:'glass',emissive:'#5bb8db'}),
      box([.34,.62,.40],[.18,.44,.10],PALETTE.black,{radius:.025,finish:'plastic'}),
      box([.34,.57,.33],[.12,.34,.05],'#5a6670',{radius:.016,finish:'plastic'}),
      tube([[.34,.42,.34],[.36,.24,.30],[.31,.10,.24]],.012,PALETTE.black,{finish:'rubber'})
    );
    for(const x of [-.47,.47])for(const z of [-.45,.45])parts.push(box([x,.50,z],[.035,.88,.035],PALETTE.black,{radius:.006,finish:'plastic'}));
  }else{
    parts.push(
      P('lathe',[0,.48,0],[.94,.86,.94],PALETTE.glass,{profile:[[.11,-.50],[.20,-.47],[.31,-.41],[.40,-.33],[.47,-.22],[.50,-.08],[.50,.06],[.47,.20],[.42,.31],[.35,.41],[.28,.50]],smoothProfile:true,finish:'glass',opacity:.19}),
      sphere([0,.36,0],[.82,.48,.82],PALETTE.water,{finish:'water',opacity:.30}),
      disc([0,.53,0],[.76,.76,.01],PALETTE.water,{rotation:[90,0,0],finish:'water',opacity:.38}),
      torus([0,.91,0],[.62,.075,.62],PALETTE.glass,{rotation:[90,0,0],finish:'glass'}),
      torus([0,.10,0],[.50,.045,.50],PALETTE.glass,{rotation:[90,0,0],finish:'glass'})
    );
  }
  for(let i=0;i<22;i++){const a=i*2.399,r=.08+(i%6)*.055;parts.push(sphere([Math.cos(a)*r,.10+(i%3)*.012,Math.sin(a)*r],[.055+(i%3)*.008,.035,.050],['#725b43','#a48359','#59616a','#dbc08d'][i%4],{finish:'stone'}));}
  for(const x of [-.28,-.18,.23])parts.push(tube([[x,.12,.08],[x+(x<0?-.02:.04),.30,.02],[x+(x<0?.04:-.02),.52,-.05]],.014,PALETTE.leafDark,{finish:'plant'}));
  for(const [x,y,z,r] of [[-.31,.25,.03,-26],[-.21,.34,.01,24],[-.30,.45,-.04,-20],[-.13,.43,-.03,28],[.23,.27,.02,-25],[.29,.38,-.02,22],[.21,.49,-.05,-20]])parts.push(sphere([x,y,z],[.16,.065,.09],y>.4?PALETTE.leaf:PALETTE.leafDark,{rotation:[0,0,r],finish:'plant'}));
  if(!id.includes('terrarium')){
    parts.push(
      loft([.15,.43,-.36],[.31,.15,.15],'#ef7f45',[fishRing(-.50,.06,.06),fishRing(-.40,.28,.26),fishRing(-.12,.48,.43),fishRing(.20,.42,.38),fishRing(.43,.23,.22),fishRing(.50,.05,.05)],{finish:'organic'}),
      extrude([.36,.43,-.36],[.18,.20,.12],'#e96a35',[[-.50,0],[.50,.50],[.36,0],[.50,-.50]],{finish:'organic',bevel:.025}),
      extrude([.13,.49,-.445],[.13,.11,.025],'#f6a05e',[[-.5,-.4],[.5,0],[-.4,.5]],{finish:'organic',bevel:.018}),
      extrude([.13,.37,-.445],[.13,.10,.025],'#d85d31',[[-.5,.4],[.5,0],[-.4,-.5]],{finish:'organic',bevel:.018}),
      sphere([.045,.46,-.445],[.032,.032,.025],PALETTE.white,{finish:'glass'}),
      sphere([.040,.46,-.460],[.016,.016,.012],PALETTE.black,{finish:'glass'}),
      box([.17,.43,-.445],[.018,.13,.010],'#d95f33',{radius:.003,finish:'organic'}),
      box([.23,.43,-.445],[.018,.12,.010],'#d95f33',{radius:.003,finish:'organic'})
    );
    for(let i=0;i<8;i++)parts.push(sphere([.05+(i%3)*.12,.30+i*.055,-.20+(i%2)*.06],[.024+(i%2)*.009,.024+(i%2)*.009,.024+(i%2)*.009],PALETTE.glass,{finish:'glass',opacity:.68}));
  }
  return parts;
}

function frameModel(id, color) {
  if(/poster|print|banner|calendar|tapestry|pennant|acoustic|feeding-mat|mat|board/.test(id)&&!id.includes('frame')){
    const fabric=/tapestry|banner|pennant|mat|acoustic/.test(id);
    const parts=[box([0,.5,0],[.98,.98,.18],fabric?color:PALETTE.paper,{radius:.012,finish:fabric?'fabric':'paper'})];
    parts.push(box([0,.52,-.10],[.88,.84,.025],id.includes('whiteboard')?'#f8fafc':id.includes('cork')?'#b9834f':'#466d8c',{radius:.008,finish:id.includes('whiteboard')?'enamel':fabric?'fabric':'paper'}));
    for(let i=0;i<4;i++)parts.push(box([-.28+i*.19,.52,-.12],[.12,.50,.012],['#e8b04a','#c95e52','#4d7e9f','#679b6e'][i],{radius:.005,finish:'ink'}));
    if(id.includes('pegboard'))for(let r=0;r<8;r++)for(let c=0;c<10;c++)parts.push(cyl([-.38+c*.085,.20+r*.085,-.13],[.012,.009,.012],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));
    return parts;
  }
  const parts=[];
  parts.push(box([0,.5,0],[1,1,.28],color,{radius:.02,finish:'wood'}));
  parts.push(box([0,.5,-.16],[.84,.84,.035],PALETTE.white,{radius:.006,finish:'paper'}));
  parts.push(box([0,.5,-.19],[.69,.68,.025],id.includes('mirror')?PALETTE.glass:'#5d8fb2',{radius:.004,finish:id.includes('mirror')?'mirror':'photo'}));
  for(const [x,y,s] of [[-.20,.62,.20],[.20,.62,.20],[0,.36,.24]])parts.push(sphere([x,y,-.21],[s,s*.65,.018],['#d9a441','#7fa36f','#d56e60'][parts.length%3],{finish:'ink'}));
  return parts;
}

function lightStringModel(id, color) {
  const leaf=id.includes('leaf');
  const curtain=id.includes('curtain');
  const parts=[];
  const runs=curtain?4:1;
  for(let r=0;r<runs;r++){
    const path=[];
    for(let i=0;i<18;i++)path.push([-.48+i*(.96/17),.78-r*.12-.14*Math.abs(Math.sin(i*.62)),0]);
    parts.push(tube(path,.008,leaf?PALETTE.leafDark:'#26313b',{finish:'rubber'}));
    for(let i=0;i<14;i++){
      const x=-.44+i*(.88/13),y=.76-r*.12-.14*Math.abs(Math.sin(i*.78));
      if(leaf){parts.push(sphere([x,y-.04,0],[.10,.055,.045],i%2?PALETTE.leaf:PALETTE.leafDark,{rotation:[0,0,i%2?28:-28],finish:'plant'}));}
      else{parts.push(cyl([x,y-.045,0],[.025,.075,.025],'#343a40',{finish:'rubber'}));parts.push(sphere([x,y-.10,0],[.055,.055,.055],'#ffd17a',{finish:'glass',emissive:'#f59e0b'}));}
    }
  }
  if(id.includes('photo-string'))for(let i=0;i<7;i++)parts.push(box([-.38+i*.125,.48+(i%2)*.07,-.03],[.085,.18,.025],PALETTE.paper,{rotation:[0,0,(i%3-1)*4],finish:'paper'}));
  return parts;
}

function plantModel(id, color) {
  const cactus=id.includes('cactus'), bonsai=id.includes('bonsai'), hanging=id.includes('hanging'), snake=id.includes('snake'), monstera=id.includes('monstera'), herb=id.includes('herb'), succulent=id.includes('succulent');
  const pot=color||'#a76f48', parts=[
    P('cone',[0,.16,0],[.60,.34,.60],pot,{rotation:[180,0,0],finish:'ceramic'}),
    cyl([0,.06,0],[.47,.055,.47],pot,{finish:'ceramic'}),
    torus([0,.30,0],[.56,.045,.56],'#e4d9cc',{rotation:[90,0,0],finish:'ceramic'}),
    cyl([0,.31,0],[.47,.07,.47],'#4b3327',{finish:'soil'}),
  ];
  const leaf=(x,y,z,scale,rotation=0,tint=PALETTE.leaf)=>parts.push(extrude([x,y,z],[scale,scale*.62,.022],tint,[[-.50,0],[-.25,.34],[.03,.50],[.28,.25],[.50,0],[.18,-.21],[0,-.50],[-.18,-.21]],{smoothOutline:true,rotation:[0,rotation,0],finish:'plant',bevel:.012}));
  if(cactus){
    parts.push(P('capsule',[0,.61,0],[.28,.64,.28],PALETTE.green,{finish:'plant'}));
    for(const [x,y,r] of [[-.20,.54,-35],[.20,.68,38]])parts.push(P('capsule',[x,y,0],[.16,.32,.16],PALETTE.green,{rotation:[0,0,r],finish:'plant'}));
    for(let y=.40;y<.90;y+=.10)for(let i=0;i<6;i++){const a=i*Math.PI/3;parts.push(tube([[Math.cos(a)*.15,y,Math.sin(a)*.15],[Math.cos(a)*.18,y+.025,Math.sin(a)*.18]],.003,'#e8dcc0',{finish:'thorn'}));}
  }else if(snake){
    for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=Math.cos(a)*(.12+(i%3)*.07),z=Math.sin(a)*(.12+(i%3)*.07),h=.48+(i%4)*.09;parts.push(extrude([x,.32+h*.52,z],[.15,h,.025],i%2?PALETTE.leaf:PALETTE.leafDark,[[0,-.50],[-.34,-.16],[-.22,.22],[0,.50],[.22,.22],[.34,-.16]],{smoothOutline:true,rotation:[0,-a*180/Math.PI,0],finish:'plant',bevel:.008}));}
  }else if(succulent){
    for(let layer=0;layer<3;layer++)for(let i=0;i<8;i++){const a=i*Math.PI/4+layer*.22,r=.14+layer*.075;leaf(Math.cos(a)*r,.38+layer*.09,Math.sin(a)*r,.27-layer*.045,-a*180/Math.PI,layer===2?'#7ebd77':PALETTE.leaf);}
  }else if(bonsai){
    parts.push(tube([[0,.30,0],[-.05,.54,.03],[.10,.78,-.03],[.00,.91,.03]],.045,PALETTE.woodDark,{finish:'wood'}));
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9,x=Math.cos(a)*(.16+(i%3)*.06),z=Math.sin(a)*(.16+(i%3)*.06),y=.66+(i%4)*.09;parts.push(tube([[0,.53,0],[x*.45,y-.12,z*.45],[x,y,z]],.018,PALETTE.woodDark,{finish:'wood'}));parts.push(sphere([x,y,z],[.18,.11,.14],i%2?PALETTE.leaf:PALETTE.leafDark,{rotation:[0,i*31,0],finish:'plant'}));}
  }else if(monstera){
    for(let i=0;i<10;i++){const a=i*Math.PI*2/10,x=Math.cos(a)*(.15+(i%3)*.08),z=Math.sin(a)*(.15+(i%3)*.08),y=.54+(i%4)*.075;parts.push(tube([[0,.31,0],[x*.45,y-.12,z*.45],[x,y,z]],.016,PALETTE.leafDark,{finish:'plant'}));leaf(x,y,z,.30,-a*180/Math.PI,i%2?PALETTE.leaf:'#2f7b46');}
  }else if(hanging){
    for(const x of [-.38,.38])parts.push(tube([[x,.98,0],[x*.45,.72,0],[0,.31,0]],.010,'#8b7355',{finish:'fiber'}));
    for(let i=0;i<14;i++){const a=i*Math.PI*2/14,x=Math.cos(a)*(.16+(i%3)*.07),z=Math.sin(a)*(.16+(i%3)*.07),y=.48+(i%5)*.075;parts.push(tube([[0,.31,0],[x*.65,y-.10,z*.65],[x,y,z]],.010,PALETTE.leafDark,{finish:'plant'}));leaf(x,y,z,.20,-a*180/Math.PI,i%2?PALETTE.leaf:'#3d8650');}
  }else {
    const count=herb?15:14;
    for(let i=0;i<count;i++){const a=i*Math.PI*2/count,x=Math.cos(a)*(.10+(i%3)*.075),z=Math.sin(a)*(.10+(i%3)*.075),y=.45+(i%5)*.07;parts.push(tube([[0,.31,0],[x*.42,y-.12,z*.42],[x,y,z]],.012,PALETTE.leafDark,{finish:'plant'}));leaf(x,y,z,herb ? .17 : .22,-a*180/Math.PI,i%2?PALETTE.leaf:'#327d48');}
  }
  for(let i=0;parts.length<18;i++){const a=i*Math.PI;leaf(Math.cos(a)*.10,.42,Math.sin(a)*.10,.14,-a*180/Math.PI,PALETTE.leaf);}
  return parts;
}

function booksModel(id, color) {
  const count=id.includes('notebook')?1:4,parts=[];
  for(let i=0;i<count;i++){
    const y=.10+i*(.76/count),rot=(i%3-1)*2;
    parts.push(box([(i%2-.5)*.035,y,0],[.94,.72/count,.90],[color,'#c86946','#3d6f9e','#70875d'][i%4],{radius:.018,rotation:[0,rot,0],finish:'paper-cover'}));
    parts.push(box([(i%2-.5)*.035,y,-.46],[.84,.52/count,.012],PALETTE.paper,{rotation:[0,rot,0],finish:'paper'}));
  }
  return parts;
}

function speakerModel(id, color) {
  const horizontal=/soundbar/.test(id), pair=/pair|monitors|desktop-speakers/.test(id);
  if(id==='smart-speaker'){
    const parts=[
      P('lathe',[0,.43,0],[.76,.84,.76],color,{profile:[[.28,-.50],[.43,-.44],[.47,-.24],[.46,.20],[.38,.40],[.27,.50]],smoothProfile:true,finish:'fabric'}),
      cyl([0,.86,0],[.36,.07,.36],PALETTE.graphite,{finish:'plastic'}),
      disc([0,.905,0],[.26,.26,.012],'#173445',{rotation:[90,0,0],finish:'screen',emissive:'#0a3042'}),
      cyl([0,.06,0],[.32,.045,.32],PALETTE.graphite,{finish:'rubber'}),
      cyl([0,.90,-.17],[.032,.014,.032],PALETTE.white,{rotation:[90,0,0],finish:'plastic'}),
      cyl([-.12,.90,.06],[.028,.014,.028],PALETTE.white,{rotation:[90,0,0],finish:'plastic'}),
      cyl([.12,.90,.06],[.028,.014,.028],PALETTE.white,{rotation:[90,0,0],finish:'plastic'}),
    ];
    for(let i=0;i<12;i++)parts.push(torus([0,.17+i*.050,0],[.44,.008,.44],i%3?'#33465a':'#54728b',{rotation:[90,0,0],finish:'fabric'}));
    for(let i=0;i<4;i++)parts.push(cyl([Math.cos(i*Math.PI/2)*.22,.045,Math.sin(i*Math.PI/2)*.22],[.028,.018,.028],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  const xs=pair?[-.28,.28]:[0],parts=[];
  if(horizontal){
    parts.push(box([0,.48,0],[.98,.72,.88],color,{radius:.18,finish:'fabric'}));
    for(let i=0;i<8;i++)parts.push(cyl([-.38+i*.11,.50,-.45],[.09,.06,.09],PALETTE.black,{rotation:[90,0,0],finish:'fabric'}));
    return parts;
  }
  for(const x of xs){
    const w=pair?.40:.88;
    parts.push(box([x,.50,0],[w,.96,.88],color,{radius:.045,finish:'wood'}));
    parts.push(cyl([x,.67,-.46],[w*.48,.08,w*.48],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));
    parts.push(cyl([x,.67,-.49],[w*.28,.035,w*.28],'#273847',{rotation:[90,0,0],finish:'paper'}));
    parts.push(cyl([x,.28,-.46],[w*.28,.07,w*.28],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));
    parts.push(cyl([x,.91,-.47],[.035,.025,.035],'#6ee7b7',{rotation:[90,0,0],finish:'glass',emissive:'#10b981'}));
    if(pair){
      parts.push(torus([x,.67,-.495],[w*.40,.026,w*.40],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
      parts.push(box([x,.10,-.36],[w*.56,.035,.08],PALETTE.graphite,{radius:.010,finish:'plastic'}));
      parts.push(cyl([x,.05,.24],[.05,.035,.05],PALETTE.black,{finish:'rubber'}));
    }
  }
  if(pair){
    parts.push(tube([[-.26,.10,.30],[-.38,.04,.42],[.38,.04,.42],[.26,.10,.30]],.015,PALETTE.graphite,{finish:'rubber'}));
    parts.push(box([0,.07,.42],[.16,.035,.05],PALETTE.graphite,{radius:.010,finish:'plastic'}));
  }
  return parts;
}

function bottleModel(id, color) {
  const roller=/roller|lint/.test(id);
  if(id==='water-filter'){
    const parts=[
      box([0,.42,0],[.72,.76,.54],PALETTE.glass,{radius:.080,finish:'glass',opacity:.34}),
      box([0,.30,0],[.63,.46,.45],'#8dd0e2',{radius:.055,finish:'water',opacity:.34}),
      box([0,.78,0],[.74,.08,.56],color,{radius:.040,finish:'plastic'}),
      box([0,.72,0],[.40,.18,.32],'#e8f2f5',{radius:.028,finish:'filter'}),
      box([0,.60,0],[.34,.06,.28],'#cdd9df',{radius:.018,finish:'filter'}),
      box([0,.84,-.12],[.34,.04,.28],PALETTE.white,{radius:.015,finish:'plastic'}),
      tube([[.34,.67,0],[.54,.68,0],[.61,.54,0],[.59,.30,0],[.34,.24,0]],.050,PALETTE.graphite,{finish:'plastic'}),
      cyl([.34,.67,0],[.070,.050,.070],PALETTE.graphite,{finish:'plastic'}),
      cyl([.34,.24,0],[.070,.050,.070],PALETTE.graphite,{finish:'plastic'}),
      box([-.34,.52,-.22],[.06,.35,.025],PALETTE.white,{radius:.010,finish:'plastic'}),
      box([-.34,.41,-.235],[.075,.020,.010],'#4f8aa3',{radius:.003,finish:'ink'}),
      box([-.34,.54,-.235],[.075,.020,.010],'#4f8aa3',{radius:.003,finish:'ink'}),
    ];
    for(let i=0;i<6;i++)parts.push(box([-.22+i*.09,.80,-.29],[.055,.015,.016],i%2?color:PALETTE.silver,{radius:.004,finish:'plastic'}));
    for(const x of [-.28,.28])for(const z of [-.20,.20])parts.push(cyl([x,.04,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(roller){
    const parts=[tube([[0,.48,-.42],[0,.48,.42]],.285,color,{finish:'foam'}),disc([0,.48,-.43],[.62,.62,.018],color,{finish:'foam'}),disc([0,.48,.43],[.62,.62,.018],color,{finish:'foam'}),disc([0,.48,-.445],[.27,.27,.012],PALETTE.black,{finish:'rubber'}),disc([0,.48,.445],[.27,.27,.012],PALETTE.black,{finish:'rubber'}),tube([[0,.48,-.455],[0,.48,.455]],.075,PALETTE.black,{finish:'plastic'})];
    for(let i=0;i<9;i++)parts.push(torus([0,.48,-.34+i*.085],[.45,.45,.018],i%2?color:'#dbe4e8',{finish:'foam'}));
    for(const z of [-.45,.45])for(let i=0;i<3;i++){const a=i*Math.PI*2/3;parts.push(cyl([Math.cos(a)*.20,.48+Math.sin(a)*.20,z],[.022,.012,.022],PALETTE.silver,{finish:'metal'}));}
    return parts;
  }
  const pitcher=id.includes('pitcher')||id.includes('filter');
  const parts=[
    P('lathe',[0,.42,0],[pitcher?.76:.66,.78,pitcher?.76:.66],color,{profile:pitcher?[[.25,-.50],[.43,-.46],[.47,-.27],[.46,.14],[.40,.36],[.30,.48]]:[[.20,-.50],[.34,-.46],[.38,-.29],[.36,.12],[.29,.30],[.25,.47]],smoothProfile:true,finish:id.includes('water-filter')?'glass':'painted-metal'}),
    P('cone',[0,.77,0],[pitcher?.64:.42,.22,pitcher?.64:.42],color,{rotation:[180,0,0],finish:id.includes('water-filter')?'glass':'painted-metal'}),
    cyl([0,.91,0],[.30,.12,.30],PALETTE.black,{finish:'plastic'}),
    torus([0,.93,0],[.36,.06,.36],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
  ];
  if(pitcher){
    parts.push(tube([[.33,.69,0],[.52,.72,0],[.61,.56,0],[.58,.31,0],[.33,.28,0]],.050,PALETTE.graphite,{finish:'plastic'}),cyl([.33,.69,0],[.070,.055,.070],PALETTE.graphite,{finish:'plastic'}),cyl([.33,.28,0],[.070,.055,.070],PALETTE.graphite,{finish:'plastic'}),P('cone',[-.40,.78,0],[.30,.24,.40],color,{rotation:[0,0,72],finish:'plastic'}),cyl([0,.47,0],[.54,.48,.54],'#8dd0e2',{finish:'water',opacity:.28}));
    if(id.includes('filter')){parts.push(box([0,.58,0],[.56,.24,.50],PALETTE.glass,{radius:.02,finish:'glass',opacity:.24}),box([0,.32,0],[.54,.06,.48],'#d7e0e5',{radius:.012,finish:'filter'}));for(let i=0;i<6;i++)parts.push(box([-.22+i*.09,.59,-.30],[.055,.14,.018],PALETTE.silver,{radius:.004,finish:'metal'}));}
  }
  if(id.includes('travel-mug')){
    parts.push(tube([[.27,.69,0],[.42,.70,0],[.46,.57,0],[.43,.39,0],[.27,.37,0]],.040,PALETTE.graphite,{finish:'plastic'}),cyl([.27,.69,0],[.060,.045,.060],PALETTE.graphite,{finish:'plastic'}),cyl([.27,.37,0],[.060,.045,.060],PALETTE.graphite,{finish:'plastic'}),cyl([0,.87,0],[.52,.06,.52],PALETTE.graphite,{finish:'plastic'}));
  }
  if(id==='water-bottle'){
    parts.push(torus([0,.56,0],[.62,.022,.62],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([.32,.78,0],[.10,.16,.12],PALETTE.graphite,{radius:.025,finish:'plastic'}));
  }
  for(let i=0;parts.length<18;i++)parts.push(torus([0,.17+i*.038,0],[pitcher?.62:.55,.012,pitcher?.62:.55],i%3?color:PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
  return parts;
}

function clockModel(id, color) {
  const wall=id==='wall-clock', ringLight=/ring-light/.test(id);
  if(ringLight){
    const parts=[box([0,.06,.08],[.72,.10,.48],PALETTE.graphite,{radius:.035,finish:'metal'}),cyl([0,.39,.08],[.055,.60,.055],PALETTE.graphite,{finish:'metal'}),torus([0,.77,.06],[.64,.64,.085],PALETTE.white,{finish:'glass',emissive:'#ffe1a3'}),torus([0,.77,-.015],[.48,.48,.025],PALETTE.graphite,{finish:'metal'}),box([0,.52,-.02],[.11,.16,.09],PALETTE.graphite,{radius:.02,finish:'metal'})];
    for(const x of [-.28,.28])parts.push(box([x,.04,.08],[.08,.06,.32],PALETTE.graphite,{radius:.02,finish:'rubber'}));
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(cyl([Math.cos(a)*.56,.77+Math.sin(a)*.56,.06],[.018,.018,.012],i%3?'#fff2d0':'#ffd36c',{rotation:[90,0,0],finish:'glass',emissive:'#d79328'}));}
    return parts;
  }
  if(id==='desk-clock'){
    const parts=[box([0,.50,0],[.96,.64,.24],color,{radius:.12,finish:'painted-metal'}),box([0,.51,-.135],[.76,.44,.018],PALETTE.white,{radius:.045,finish:'paper'}),box([0,.51,-.153],[.82,.50,.014],PALETTE.silver,{radius:.055,finish:'metal'})];
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(box([Math.sin(a)*.30,.51+Math.cos(a)*.16,-.165],[.020,.038,.010],PALETTE.ink,{rotation:[0,0,-i*30],finish:'ink'}));}
    parts.push(box([.05,.57,-.174],[.018,.17,.010],PALETTE.ink,{rotation:[0,0,-32],finish:'metal'}),box([-.04,.54,-.178],[.014,.13,.010],PALETTE.red,{rotation:[0,0,55],finish:'metal'}),cyl([0,.51,-.185],[.035,.012,.035],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([-.30,.16,.04],[.16,.14,.26],PALETTE.graphite,{radius:.035,rotation:[0,0,-12],finish:'plastic'}),box([.30,.16,.04],[.16,.14,.26],PALETTE.graphite,{radius:.035,rotation:[0,0,12],finish:'plastic'}));
    return parts;
  }
  const parts=[sphere([0,.50,0],[.96,.96,.24],color,{finish:'painted-metal'}),disc([0,.50,-.135],[.80,.80,.012],PALETTE.white,{finish:'paper'}),torus([0,.50,-.150],[.86,.86,.024],PALETTE.silver,{rotation:[0,0,0],finish:'metal'})];
  for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(box([Math.sin(a)*.32,.50+Math.cos(a)*.32,-.164],[.022,.055,.010],PALETTE.ink,{rotation:[0,0,-i*30],finish:'ink'}));}
  parts.push(box([.07,.58,-.174],[.020,.25,.010],PALETTE.ink,{rotation:[0,0,-30],finish:'metal'}),box([-.05,.54,-.178],[.015,.19,.010],PALETTE.red,{rotation:[0,0,55],finish:'metal'}),cyl([0,.50,-.185],[.045,.012,.045],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
  if(!wall){parts.push(box([-.30,.12,.05],[.16,.16,.26],PALETTE.graphite,{radius:.035,rotation:[0,0,-12],finish:'plastic'}),box([.30,.12,.05],[.16,.16,.26],PALETTE.graphite,{radius:.035,rotation:[0,0,12],finish:'plastic'}));}
  return parts;
}

function basketModel(id, color) {
  const wire=id.includes('wire'),tall=id.includes('blanket'),metal=wire?PALETTE.graphite:'#9a704d',accent=wire?PALETTE.silver:'#c29261';
  const h=tall?.86:.64,top=tall?.90:.72,parts=[
    box([0,.07,0],[.86,.10,.76],wire?PALETTE.graphite:'#775238',{radius:.035,finish:wire?'metal':'woven'}),
    box([0,.12,0],[.74,.035,.64],wire?PALETTE.black:'#aa7b52',{radius:.020,finish:wire?'rubber':'woven'}),
    box([0,top,-.405],[.90,.055,.040],metal,{radius:.014,finish:wire?'metal':'woven'}),
    box([0,top,.405],[.90,.055,.040],metal,{radius:.014,finish:wire?'metal':'woven'}),
    box([-.455,top,0],[.040,.055,.78],metal,{radius:.014,finish:wire?'metal':'woven'}),
    box([.455,top,0],[.040,.055,.78],metal,{radius:.014,finish:wire?'metal':'woven'}),
  ];
  for(let r=0;r<5;r++){
    const y=.18+r*((top-.20)/4),strand=r%2?accent:metal;
    parts.push(box([0,y,-.405],[.84,.022,.022],strand,{radius:.005,finish:wire?'metal':'woven'}),box([0,y,.405],[.84,.022,.022],strand,{radius:.005,finish:wire?'metal':'woven'}),box([-.455,y,0],[.022,.022,.78],strand,{radius:.005,finish:wire?'metal':'woven'}),box([.455,y,0],[.022,.022,.78],strand,{radius:.005,finish:wire?'metal':'woven'}));
  }
  for(let i=0;i<8;i++){
    const x=-.35+i*.10;
    parts.push(box([x,.42,-.405],[.020,h,.020],i%2?metal:accent,{radius:.005,finish:wire?'metal':'woven'}),box([x,.42,.405],[.020,h,.020],i%2?metal:accent,{radius:.005,finish:wire?'metal':'woven'}));
  }
  for(let i=0;i<5;i++){
    const z=-.28+i*.14;
    parts.push(box([-.455,.42,z],[.020,h,.020],i%2?metal:accent,{radius:.005,finish:wire?'metal':'woven'}),box([.455,.42,z],[.020,h,.020],i%2?metal:accent,{radius:.005,finish:wire?'metal':'woven'}));
  }
  for(const x of [-.44,.44])parts.push(tube([[x,top-.08,-.24],[x+(x<0?-.10:.10),top+.12,0],[x,top-.08,.24]],.026,metal,{finish:wire?'metal':'woven'}));
  return parts;
}

function pillowModel(id, color) {
  const blanket=/blanket|comforter|topper/.test(id);
  const wedgePillow=id.includes('wedge'),body=id.includes('body'),rest=id.includes('bed-rest');
  if(wedgePillow){
    const seam=color==='#ffffff'?'#c9d3d9':'#c7d5dd', shade=color==='#ffffff'?'#e2e8ec':color;
    const parts=[wedge([0,.36,0],[.94,.68,.88],shade,{rotation:[0,0,0],finish:'fabric'}),wedge([0,.34,-.006],[.88,.60,.80],color,{rotation:[0,0,0],finish:'fabric'}),box([0,.07,0],[.90,.07,.84],shade,{radius:.05,finish:'fabric'}),box([0,.12,-.442],[.76,.018,.014],seam,{radius:.003,finish:'thread'}),box([0,.12,.442],[.76,.018,.014],seam,{radius:.003,finish:'thread'}),box([-.455,.13,0],[.014,.020,.68],seam,{radius:.003,finish:'thread'}),box([.455,.13,0],[.014,.020,.68],seam,{radius:.003,finish:'thread'})];
    for(let i=0;i<6;i++)parts.push(box([-.30+i*.12,.15,-.452],[.060,.010,.010],seam,{radius:.003,finish:'thread'}));
    for(const x of [-.36,.36])for(const z of [-.30,.30])parts.push(cyl([x,.035,z],[.028,.018,.028],PALETTE.white,{finish:'fabric'}));
    parts.push(box([0,.22,-.455],[.16,.080,.012],seam,{radius:.012,finish:'fabric'}));
    return parts;
  }
  const parts=[box([0,.48,0],[body ? .98 : .92,rest ? .94 : .76,.90],color,{radius:blanket ? .08 : .20,finish:'fabric'})];
  if(rest){parts.push(box([0,.65,.10],[.90,.68,.35],color,{radius:.16,rotation:[-18,0,0],finish:'fabric'}));}
  if(!blanket){
    parts.push(torus([0,.50,0],[.84,.038,.80],'#d9e0e5',{rotation:[90,0,0],finish:'thread'}),cyl([0,.50,-.46],[.07,.025,.07],color,{rotation:[90,0,0],finish:'fabric'}));
    for(const x of [-.32,.32])parts.push(box([x,.50,-.47],[.012,.62,.016],'#d8e0e5',{radius:.004,finish:'thread'}));
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(tube([[Math.cos(a)*.42,.28,Math.sin(a)*.39],[Math.cos(a)*.46,.52,Math.sin(a)*.42]],.004,'#d8e0e5',{finish:'thread'}));}
  }else{
    for(let i=1;i<8;i++)parts.push(box([-.48+i*.12,.50,-.47],[.010,.66,.016],'#93a4b1',{radius:.004,finish:'thread'}));
    for(let i=0;i<8;i++)parts.push(box([-.42+i*.12,.50,-.43],[.060,.010,.012],i%2?'#d2dce1':'#8ea4b2',{radius:.004,finish:'fabric'}));
  }
  for(let i=0;parts.length<18;i++)parts.push(cyl([-.34+i*.05,.12,-.36],[.016,.010,.016],PALETTE.white,{rotation:[90,0,0],finish:'thread'}));
  return parts;
}

function storageModel(id, color) {
  if(id==='recycling-bin'){
    const parts=[
      box([0,.43,0],[.84,.78,.68],color||'#4c7a93',{radius:.065,finish:'plastic'}),
      box([0,.86,.03],[.90,.12,.74],color||'#4c7a93',{radius:.045,finish:'plastic'}),
      box([0,.90,.22],[.70,.025,.34],'#6f9cb2',{radius:.010,finish:'plastic'}),
      box([0,.47,-.355],[.38,.28,.020],PALETTE.white,{radius:.020,finish:'paper'}),
      box([0,.47,-.368],[.16,.16,.010],'#3f82a4',{radius:.012,finish:'ink'}),
      box([0,.26,-.372],[.25,.022,.010],'#3f82a4',{radius:.003,finish:'ink'}),
      tube([[-.33,.84,.27],[-.49,.86,.27],[-.49,.68,.27]],.030,PALETTE.graphite,{finish:'plastic'}),
      tube([[.33,.84,.27],[.49,.86,.27],[.49,.68,.27]],.030,PALETTE.graphite,{finish:'plastic'}),
      box([0,.78,.37],[.68,.055,.035],PALETTE.graphite,{radius:.010,finish:'plastic'}),
      box([0,.87,.39],[.44,.065,.035],PALETTE.graphite,{radius:.012,finish:'rubber'}),
      box([0,.12,.28],[.78,.10,.12],PALETTE.graphite,{radius:.020,finish:'plastic'}),
    ];
    for(const x of [-.43,.43]){parts.push(cyl([x,.11,.29],[.14,.075,.14],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}),cyl([x,.11,.29],[.060,.085,.060],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));}
    for(let i=0;i<7;i++)parts.push(box([-.30+i*.10,.61,-.375],[.014,.34,.010],i%2?'#638da3':'#3d6780',{radius:.003,finish:'plastic'}));
    for(const x of [-.33,.33])parts.push(cyl([x,.04,-.25],[.040,.035,.040],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='food-container'){
    const parts=[];
    for(let i=0;i<3;i++){const x=(i-1)*.16,y=.15+i*.23,z=(i%2-.5)*.06;parts.push(box([x,y,z],[.70-.06*i,.20,.60-.05*i],'#d9edf2',{radius:.07,finish:'translucent-plastic',opacity:.70}),box([x,y+.12,z],[.68-.06*i,.045,.58-.05*i],['#50a9b6','#e79c48','#d96a5b'][i],{radius:.025,finish:'plastic'}));for(const sx of [-.22,.22])parts.push(box([x+sx,y+.06,z-.31+i*.025],[.08,.08,.025],PALETTE.white,{radius:.012,finish:'plastic'}));}
    for(let i=0;i<6;i++)parts.push(cyl([-.22+i*.09,.84,-.30],[.014,.010,.014],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if(id==='snack-bin'){
    const parts=[box([0,.34,0],[.92,.58,.82],color,{radius:.06,finish:'translucent-plastic',opacity:.76}),torus([0,.66,0],[.84,.040,.74],color,{rotation:[90,0,0],finish:'plastic'}),box([0,.18,-.42],[.60,.08,.025],PALETTE.graphite,{radius:.012,finish:'plastic'})];
    for(let i=0;i<12;i++){const x=-.30+(i%6)*.12,y=.25+Math.floor(i/6)*.20;parts.push(box([x,y,-.43],[.09,.16,.018],['#e6a63f','#c95c52','#5591ad'][i%3],{radius:.010,finish:'paper'}));}for(const x of [-.34,.34])for(const z of [-.28,.28])parts.push(cyl([x,.05,z],[.035,.030,.035],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if(id==='fabric-cube'){
    const parts=[box([0,.08,0],[.88,.12,.82],color,{radius:.06,finish:'fabric'}),box([0,.40,-.42],[.86,.58,.045],color,{radius:.045,finish:'fabric'}),box([-.43,.40,0],[.045,.58,.78],color,{radius:.045,finish:'fabric'}),box([.43,.40,0],[.045,.58,.78],color,{radius:.045,finish:'fabric'}),box([0,.40,.42],[.86,.58,.045],color,{radius:.045,finish:'fabric'}),box([0,.70,-.40],[.90,.050,.05],'#cad8df',{radius:.012,finish:'thread'}),box([0,.70,.40],[.90,.050,.05],'#cad8df',{radius:.012,finish:'thread'}),box([-.42,.70,0],[.05,.050,.72],'#cad8df',{radius:.012,finish:'thread'}),box([.42,.70,0],[.05,.050,.72],'#cad8df',{radius:.012,finish:'thread'}),box([0,.16,0],[.72,.025,.66],'#526a78',{radius:.012,finish:'fabric'})];
    for(const x of [-.30,.30])parts.push(tube([[x,.58,-.43],[x,.76,-.48],[x,.86,-.22]],.028,PALETTE.graphite,{finish:'fabric'}));
    for(let i=0;i<7;i++){const x=-.30+i*.10;parts.push(box([x,.41,-.45],[.012,.46,.010],'#d5e0e5',{radius:.003,finish:'thread'}),box([x,.08,-.37],[.012,.010,.07],'#d5e0e5',{radius:.003,finish:'thread'}));}
    for(const x of [-.34,.34])for(const z of [-.30,.30])parts.push(cyl([x,.025,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(/fabric-cube|file-box|photo-box|memory-box|sheet-set-box|tea-box|snack-bin|food-container|lunch-box/.test(id)){
    const lunch=id==='lunch-box', food=/food-container|snack-bin/.test(id), fabric=id==='fabric-cube', tea=id==='tea-box',parts=[box([0,.42,0],[.94,.76,.88],color,{radius:fabric?.08:.045,finish:fabric?'fabric':'plastic'}),box([0,.84,0],[.98,.10,.92],tea?PALETTE.woodDark:color,{radius:.030,finish:tea?'wood':'plastic'}),torus([0,.83,0],[.84,.018,.78],fabric?'#cad6dc':PALETTE.silver,{rotation:[90,0,0],finish:fabric?'thread':'metal'})];
    if(fabric){for(const x of [-.32,.32])parts.push(torus([x,.78,0],[.25,.11,.10],PALETTE.graphite,{rotation:[0,90,0],finish:'fabric'}));for(let i=0;i<10;i++)parts.push(box([-.36+i*.08,.42,-.45],[.012,.58,.012],'#cad6dc',{radius:.003,finish:'thread'}));}
    else if(lunch){parts.push(torus([0,.96,0],[.36,.20,.16],PALETTE.graphite,{rotation:[90,0,0],finish:'plastic'}),box([0,.40,-.46],[.26,.06,.025],PALETTE.silver,{radius:.012,finish:'metal'}));for(const x of [-.32,.32])parts.push(box([x,.52,-.46],[.08,.11,.03],PALETTE.graphite,{radius:.012,finish:'plastic'}));}
    else if(food){for(let i=0;i<3;i++)parts.push(box([-.20+i*.20,.50,-.46],[.16,.24,.018],['#d4a64d','#d95e52','#5c91b0'][i],{radius:.018,finish:'plastic'}));for(let i=0;i<6;i++)parts.push(torus([0,.25+i*.08,0],[.82,.010,.76],i%2?color:'#dce5e9',{rotation:[90,0,0],finish:'plastic'}));}
    else if(tea){for(let i=0;i<8;i++)parts.push(box([-.30+i*.085,.46,-.47],[.06,.40,.016],['#bc8b45','#6d9863','#bd5e4f','#7c7599'][i%4],{radius:.006,finish:'paper'}));}
    else{parts.push(box([0,.44,-.46],[.42,.11,.018],PALETTE.paper,{radius:.006,finish:'paper'}));for(let i=0;i<8;i++)parts.push(box([-.29+i*.083,.16,-.47],[.045,.012,.012],PALETTE.silver,{radius:.003,finish:'metal'}));}
    for(let i=0;parts.length<18;i++)parts.push(cyl([Math.cos(i*Math.PI/2)*.36,.08,Math.sin(i*Math.PI/2)*.32],[.024,.018,.024],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if(id==='bookcase'){
    const parts=[box([-.45,.50,0],[.07,1,.84],PALETTE.woodDark,{radius:.012,finish:'wood'}),box([.45,.50,0],[.07,1,.84],PALETTE.woodDark,{radius:.012,finish:'wood'}),box([0,.50,.39],[.86,.94,.035],PALETTE.wood,{radius:.008,finish:'wood'})];
    for(let i=0;i<5;i++){const y=.07+i*.22;parts.push(box([0,y,0],[.90,.055,.84],PALETTE.wood,{radius:.012,finish:'wood'}));for(let j=0;j<4;j++)parts.push(box([-.29+j*.19,y+.075,-.18+(j%2)*.18],[.13,.14,.23],['#b8624b','#4e7596','#80945d','#d1a046'][(i+j)%4],{radius:.012,rotation:[0,0,(j%3-1)*3],finish:'book'}));}
    for(const x of [-.42,.42])parts.push(cyl([x,.035,-.34],[.05,.05,.05],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if(id==='nightstand'){
    const parts=[box([0,.48,0],[.90,.76,.84],PALETTE.wood,{radius:.035,finish:'wood'}),box([0,.91,0],[.96,.08,.90],PALETTE.woodDark,{radius:.022,finish:'wood'}),box([0,.63,-.43],[.76,.25,.018],'#d5c09b',{radius:.012,finish:'wood'}),box([0,.31,-.43],[.76,.28,.018],'#d5c09b',{radius:.012,finish:'wood'})];
    for(const y of [.31,.63]){parts.push(box([0,y,-.46],[.20,.028,.020],PALETTE.graphite,{radius:.005,finish:'metal'}));for(const x of [-.32,.32])parts.push(cyl([x,y,-.455],[.025,.012,.025],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));}
    for(const x of [-.38,.38])for(const z of [-.34,.34])parts.push(cyl([x,.10,z],[.055,.20,.055],PALETTE.woodDark,{finish:'wood'}));
    parts.push(box([0,.78,-.45],[.50,.07,.015],'#243746',{radius:.008,finish:'screen',emissive:'#0b3247'}));for(let i=0;i<6;i++)parts.push(cyl([-.22+i*.09,.78,-.465],[.015,.010,.015],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if(id==='magazine-file'){
    const parts=[box([0,.15,0],[.86,.22,.82],color,{radius:.025,finish:'plastic'}),box([-.42,.52,0],[.06,.74,.80],color,{radius:.018,finish:'plastic'}),box([.42,.52,0],[.06,.74,.80],color,{radius:.018,finish:'plastic'}),box([0,.50,.38],[.82,.70,.055],color,{radius:.015,finish:'plastic'})];
    for(let i=0;i<10;i++)parts.push(box([-.28+i*.06,.50,-.22+(i%3)*.08],[.045,.64,.035],['#dbb758','#b65b4a','#4f7593','#769158'][i%4],{radius:.006,rotation:[0,0,(i%3-1)*2],finish:'paper'}));for(let i=0;i<5;i++)parts.push(box([-.32+i*.16,.12,-.42],[.08,.035,.035],PALETTE.black,{radius:.01,finish:'rubber'}));return parts;
  }
  if(id==='desk-organizer'||id==='letter-tray'){
    const tray=id==='letter-tray',parts=[box([0,.07,0],[.96,.12,.86],PALETTE.woodDark,{radius:.025,finish:'wood'})];
    const levels=tray?3:1;
    for(let level=0;level<levels;level++){const y=.13+level*.27;parts.push(box([0,y,0],[.90,.06,.80],color,{radius:.018,finish:'painted-metal'}),box([0,y+.04,.36],[.88,.12,.045],color,{radius:.012,finish:'painted-metal'}));for(const x of [-.40,.40])parts.push(box([x,y+.16,0],[.05,.28,.70],PALETTE.silver,{radius:.010,finish:'metal'}));}
    if(!tray){for(const x of [-.28,0,.28])parts.push(box([x,.26,-.06],[.22,.30,.56],['#4c6d7e','#657d67','#987754'][Math.round(x/.28)+1],{radius:.025,finish:'wood'}));for(let i=0;i<8;i++)parts.push(cyl([-.28+i*.08,.58,(i%2-.5)*.16],[.018,.48,.018],['#eab308','#ef4444','#2563eb'][i%3],{rotation:[0,0,(i-4)*2],finish:'wood'}));}
    while(parts.length<18)parts.push(cyl([0,.10+parts.length*.005,0],[.016,.018,.016],PALETTE.silver,{finish:'metal'}));return parts;
  }
  if(/trunk|footlocker/.test(id)){
    const parts=[box([0,.38,0],[.96,.66,.88],color,{radius:.045,finish:'painted-metal'}),box([0,.78,0],[1,.16,.92],PALETTE.woodDark,{radius:.035,finish:'wood'}),torus([0,.80,0],[.86,.035,.78],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([0,.39,-.46],[.16,.14,.035],PALETTE.silver,{radius:.02,finish:'metal'})];
    for(const x of [-.40,.40]){parts.push(torus([x,.52,-.47],[.18,.13,.035],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));for(const z of [-.34,.34])parts.push(cyl([x,.06,z],[.065,.06,.065],PALETTE.black,{finish:'rubber'}));}
    for(let i=0;i<10;i++)parts.push(box([-.36+i*.08,.34,-.47],[.035,.42,.012],i%2?PALETTE.silver:PALETTE.graphite,{radius:.004,finish:'metal'}));return parts;
  }
  if(id==='blanket-bag'){
    // A soft, shallow under-bed bag, rather than a hard-sided suitcase.
    const fabric=color||'#728da0',parts=[
      box([0,.24,0],[.98,.40,.78],fabric,{radius:.15,finish:'fabric'}),
      box([0,.43,0],[.90,.075,.69],'#8fa8b8',{radius:.055,finish:'fabric'}),
      box([0,.40,-.395],[.68,.026,.025],PALETTE.graphite,{radius:.008,finish:'rubber'}),
      box([0,.405,-.412],[.070,.036,.028],PALETTE.silver,{radius:.008,finish:'metal'}),
      box([0,.24,-.405],[.34,.15,.016],'#b7c9d4',{radius:.012,finish:'fabric'}),
      box([0,.245,-.417],[.20,.040,.012],PALETTE.graphite,{radius:.004,finish:'thread'}),
    ];
    for(const z of [-.31,.31])parts.push(tube([[-.26,.44,z],[-.26,.58,z],[-.10,.58,z],[.02,.46,z]],.022,PALETTE.graphite,{finish:'fabric'}));
    for(const z of [-.33,.33])for(const x of [-.35,.35])parts.push(cyl([x,.055,z],[.050,.040,.050],PALETTE.black,{finish:'rubber'}));
    for(const x of [-.38,.38])parts.push(box([x,.245,-.408],[.024,.22,.014],'#a9c1cc',{radius:.006,finish:'thread'}));
    for(let i=0;i<8;i++)parts.push(box([-.31+i*.09,.425,-.400],[.016,.020,.018],PALETTE.silver,{radius:.004,finish:'metal'}));
    return parts;
  }
  if(id==='vacuum-bag'){
    // Vacuum bags are transparent, very flat packages with a visible valve and
    // compressed textile contents; do not reuse the fabric luggage construction.
    const parts=[
      box([0,.115,0],[.98,.19,.78],'#c7e5ec',{radius:.070,finish:'translucent-plastic',opacity:.48}),
      box([0,.135,0],[.85,.12,.65],'#8fa5c6',{radius:.070,finish:'fabric'}),
      box([0,.225,0],[.91,.020,.71],'#def4f5',{radius:.030,finish:'translucent-plastic',opacity:.56}),
      box([0,.13,-.402],[.91,.026,.022],'#e2f2f4',{radius:.006,finish:'plastic'}),
      box([0,.13,.402],[.91,.026,.022],'#e2f2f4',{radius:.006,finish:'plastic'}),
      box([-.505,.13,0],[.022,.026,.71],'#e2f2f4',{radius:.006,finish:'plastic'}),
      box([.505,.13,0],[.022,.026,.71],'#e2f2f4',{radius:.006,finish:'plastic'}),
      cyl([0,.245,0],[.15,.030,.15],PALETTE.graphite,{finish:'plastic'}),
      cyl([0,.267,0],[.090,.018,.090],PALETTE.silver,{finish:'brushed'}),
      cyl([0,.282,0],[.040,.016,.040],PALETTE.black,{finish:'rubber'}),
      box([.32,.238,-.26],[.16,.050,.12],PALETTE.white,{radius:.010,finish:'paper'}),
      box([.32,.242,-.324],[.10,.016,.010],'#4d7397',{radius:.003,finish:'ink'}),
    ];
    for(let i=0;i<7;i++)parts.push(tube([[-.31+i*.10,.205,-.28],[-.27+i*.09,.22,-.05],[-.30+i*.10,.205,.25]],.008,'#d7eef0',{finish:'plastic'}));
    for(const x of [-.42,.42])for(const z of [-.31,.31])parts.push(cyl([x,.035,z],[.038,.030,.038],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='corner-shelf'){
    // Three quarter-triangle shelves with two wall-side rails make the intended
    // corner placement legible from above as well as the room-facing camera.
    const parts=[];
    const tri=[[-.50,-.50],[.50,-.50],[-.50,.50]];
    for(const y of [.12,.40,.68,.94])parts.push(extrude([-.05,y,-.05],[.90,.90,.050],PALETTE.wood,tri,{rotation:[90,0,0],finish:'wood',bevel:.012}));
    parts.push(box([-.47,.50,.00],[.055,.98,.92],PALETTE.woodDark,{radius:.010,finish:'wood'}));
    parts.push(box([.00,.50,.47],[.92,.98,.055],PALETTE.woodDark,{radius:.010,finish:'wood'}));
    parts.push(box([-.46,.51,-.43],[.045,.94,.045],PALETTE.woodDark,{radius:.010,finish:'wood'}));
    for(const y of [.25,.53,.81]){
      parts.push(box([-.22,y,-.43],[.34,.13,.19],'#637d5e',{radius:.012,finish:'book'}));
      parts.push(box([-.40,y,.02],[.12,.15,.30],'#a84f43',{radius:.012,rotation:[0,0,-4],finish:'book'}));
      parts.push(box([.01,y,.29],[.22,.12,.12],'#d3a84c',{radius:.012,finish:'book'}));
    }
    for(const x of [-.40,.18])for(const z of [-.40,.18])parts.push(cyl([x,.035,z],[.040,.035,.040],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='ladder-shelf'){
    const parts=[];
    for(const x of [-.42,.42])parts.push(box([x,.51,.13],[.062,1.00,.10],PALETTE.woodDark,{radius:.011,rotation:[0,0,x<0?-9:9],finish:'wood'}));
    for(let i=0;i<5;i++){
      const y=.10+i*.21,z=.22-i*.09;
      parts.push(box([0,y,z],[.88,.050,.56-i*.055],PALETTE.wood,{radius:.012,finish:'wood'}));
      parts.push(box([0,y+.025,z-.29+i*.028],[.80,.055,.032],PALETTE.woodDark,{radius:.008,finish:'wood'}));
    }
    for(const x of [-.42,.42])parts.push(tube([[x,.06,.39],[x,.95,-.10]],.018,PALETTE.graphite,{finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(box([-.28+i*.18,.28+(i%3)*.21,.10-(i%2)*.12],[.13,.14,.19],['#b75b46','#587d9b','#7b9560','#c39b4a'][i],{radius:.012,finish:'book'}));
    for(const x of [-.38,.38])parts.push(cyl([x,.035,.34],[.046,.035,.046],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='desktop-shelf'){
    const parts=[
      box([0,.08,0],[.98,.13,.80],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([0,.55,.25],[.94,.055,.31],PALETTE.wood,{radius:.014,finish:'wood'}),
      box([0,.88,.25],[.94,.055,.31],PALETTE.wood,{radius:.014,finish:'wood'}),
      box([-.43,.48,.25],[.060,.82,.31],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([.43,.48,.25],[.060,.82,.31],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([0,.31,-.20],[.86,.36,.38],'#d6b783',{radius:.016,finish:'wood'}),
      box([0,.31,-.405],[.72,.23,.018],'#c49b6d',{radius:.010,finish:'wood'}),
      box([0,.31,-.42],[.18,.030,.016],PALETTE.graphite,{radius:.004,finish:'metal'}),
    ];
    for(const x of [-.29,-.10,.10,.29])parts.push(box([x,.70,.08],[.12,.20,.18],['#607f9a','#a65748','#7c9561','#c59c49'][Math.round((x+.29)/.19)],{radius:.010,finish:'book'}));
    for(let i=0;i<6;i++)parts.push(cyl([-.28+i*.11,.305,-.43],[.016,.012,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(const x of [-.39,.39])for(const z of [-.31,.31])parts.push(cyl([x,.025,z],[.035,.030,.035],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='monitor-riser'){
    const parts=[
      box([0,.25,0],[.98,.16,.80],PALETTE.wood,{radius:.025,finish:'wood'}),
      box([0,.36,0],[.94,.060,.76],PALETTE.woodDark,{radius:.016,finish:'wood'}),
      box([-.40,.12,0],[.14,.20,.68],PALETTE.woodDark,{radius:.020,finish:'wood'}),
      box([.40,.12,0],[.14,.20,.68],PALETTE.woodDark,{radius:.020,finish:'wood'}),
      box([0,.20,-.42],[.54,.12,.025],PALETTE.graphite,{radius:.010,finish:'metal'}),
      box([0,.23,-.442],[.28,.032,.012],PALETTE.silver,{radius:.004,finish:'metal'}),
    ];
    for(let i=0;i<10;i++)parts.push(box([-.33+i*.073,.395,.27],[.040,.012,.15],i%2?PALETTE.graphite:PALETTE.silver,{radius:.003,finish:'metal'}));
    for(const x of [-.39,.39])for(const z of [-.29,.29])parts.push(cyl([x,.025,z],[.042,.030,.042],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='rolling-cart'){
    const parts=[
      box([0,.08,0],[.92,.10,.78],PALETTE.graphite,{radius:.025,finish:'painted-metal'}),
      box([0,.89,0],[.92,.10,.78],PALETTE.graphite,{radius:.025,finish:'painted-metal'}),
      box([-.42,.49,0],[.07,.86,.07],PALETTE.silver,{radius:.018,finish:'metal'}),
      box([.42,.49,0],[.07,.86,.07],PALETTE.silver,{radius:.018,finish:'metal'}),
    ];
    for(const y of [.30,.57,.84]){
      parts.push(box([0,y,0],[.82,.075,.68],color||'#55738b',{radius:.025,finish:'painted-metal'}));
      for(const x of [-.35,.35])parts.push(box([x,y-.055,-.29],[.065,.12,.04],PALETTE.graphite,{radius:.012,finish:'metal'}));
      for(let i=0;i<5;i++)parts.push(box([-.26+i*.13,y+.048,-.35],[.075,.015,.022],'#94b0be',{radius:.004,finish:'metal'}));
    }
    for(const x of [-.36,.36])for(const z of [-.29,.29]){
      parts.push(cyl([x,.035,z],[.10,.06,.10],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));
      parts.push(cyl([x,.07,z],[.045,.075,.045],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    }
    parts.push(tube([[-.42,.91,-.22],[-.42,1.02,-.22],[-.20,1.02,-.22]],.025,PALETTE.graphite,{finish:'rubber'}));
    return parts;
  }
  if(id==='shoe-rack'){
    const parts=[
      box([0,.08,0],[.98,.10,.80],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([0,.44,0],[.92,.055,.76],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([0,.78,0],[.92,.055,.76],PALETTE.wood,{radius:.012,finish:'wood'}),
    ];
    for(const x of [-.43,.43]){
      parts.push(box([x,.44,0],[.055,.74,.74],PALETTE.woodDark,{radius:.010,finish:'wood'}));
      parts.push(tube([[x,.10,-.33],[x,.84,-.33]],.014,PALETTE.silver,{finish:'metal'}));
    }
    const shoes=[[-.25,.19,-.16,'#324b68'],[.25,.19,.13,'#7f423b'],[-.24,.55,.12,'#d4d7d9'],[.25,.55,-.16,'#4f6b43']];
    for(const [x,y,z,c] of shoes){
      parts.push(extrude([x,y,z],[.27,.12,.42],c,[[-.50,-.28],[-.26,.24],[.22,.40],[.50,.10],[.42,-.28],[-.18,-.40]],{smoothOutline:true,rotation:[0,z<0?-8:8,0],finish:'fabric',bevel:.020}));
      parts.push(box([x,y-.055,z+.01],[.26,.020,.36],PALETTE.white,{radius:.007,rotation:[0,z<0?-8:8,0],finish:'rubber'}));
      parts.push(box([x-.02,y+.055,z-.19],[.13,.018,.014],PALETTE.white,{radius:.003,rotation:[0,z<0?-8:8,0],finish:'thread'}));
    }
    for(const x of [-.39,.39])for(const z of [-.30,.30])parts.push(cyl([x,.035,z],[.038,.035,.038],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if(id==='desk-hutch'){
    const parts=[
      box([0,.08,0],[.98,.12,.80],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([0,.54,.25],[.92,.052,.30],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([0,.87,.25],[.92,.052,.30],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([-.43,.49,.25],[.060,.88,.30],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([.43,.49,.25],[.060,.88,.30],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([0,.31,-.18],[.86,.34,.40],PALETTE.wood,{radius:.018,finish:'wood'}),
      box([0,.31,-.395],[.72,.19,.018],'#c89d6e',{radius:.010,finish:'wood'}),
      box([-.20,.72,.06],[.22,.20,.19],'#596f80',{radius:.012,finish:'book'}),
      box([.04,.72,.06],[.16,.20,.19],'#a55345',{radius:.012,finish:'book'}),
      box([.22,.72,.06],[.15,.20,.19],'#c7a244',{radius:.012,finish:'book'}),
    ];
    for(let i=0;i<6;i++)parts.push(cyl([-.27+i*.11,.305,-.414],[.016,.012,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(const x of [-.39,.39])for(const z of [-.31,.31])parts.push(cyl([x,.025,z],[.035,.030,.035],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  const shelf=/shelf|rack|riser|hutch|ledge|stand|drying/.test(id);
  const drawers=/drawer/.test(id);
  const crate=id.includes('crate');
  if(shelf){
    const parts=[];
    const levels=/desktop|riser|ledge/.test(id)?2:id.includes('ladder')?5:4;
    for(const x of [-.45,.45])parts.push(box([x,.50,0],[.065,.96,.88],id.includes('rack')?PALETTE.graphite:PALETTE.woodDark,{radius:.012,rotation:id.includes('ladder')?[0,0,x<0?-5:5]:[0,0,0],finish:id.includes('rack')?'metal':'wood'}));
    for(let i=0;i<levels;i++)parts.push(box([0,.08+i*(.84/Math.max(1,levels-1)),0],[.92,.045,.88],id.includes('rack')?PALETTE.silver:PALETTE.wood,{radius:.012,finish:id.includes('rack')?'metal':'wood'}));
    return parts;
  }
  if(drawers){
    const parts=[box([0,.50,0],[.95,.96,.92],color,{radius:.035,finish:'plastic'})];
    const count=id.includes('small')||id.includes('desktop')?3:5;
    for(let i=0;i<count;i++){
      const y=.13+i*(.77/(count-1));
      parts.push(box([0,y,-.47],[.84,.13,.025],'#d9e2e6',{radius:.015,finish:'translucent-plastic',opacity:.82}));
      parts.push(box([0,y,-.49],[.22,.028,.018],PALETTE.graphite,{radius:.007,finish:'plastic'}));
    }
    feet(parts,.38,.36,.03);
    return parts;
  }
  const parts=[box([0,.45,0],[.94,.82,.90],color,{radius:crate?.018:.05,finish:crate?'plastic':'translucent-plastic',opacity:crate?1:.75})];
  parts.push(box([0,.88,0],[.98,.10,.94],id.includes('trunk')?PALETTE.woodDark:'#6f8995',{radius:.025,finish:id.includes('trunk')?'wood':'plastic'}));
  parts.push(box([0,.52,-.46],[.32,.07,.025],PALETTE.graphite,{radius:.008,finish:'plastic'}));
  if(crate){for(let i=0;i<6;i++)parts.push(box([-.36+i*.145,.46,-.47],[.045,.65,.018],PALETTE.black,{radius:.005,finish:'plastic'}));}
  feet(parts,.38,.34,.025);
  return parts;
}

function chairModel(id, color) {
  if(id.includes('bike')){
    const parts=[cyl([0,.16,.08],[.55,.12,.55],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}),cyl([0,.16,.08],[.40,.14,.40],PALETTE.silver,{rotation:[90,0,0],finish:'metal'})];
    parts.push(tube([[0,.18,.08],[-.16,.54,.02],[.08,.76,-.06],[.22,.48,.08],[0,.18,.08]],.028,PALETTE.graphite,{finish:'metal'}));
    parts.push(box([-.13,.77,-.05],[.34,.07,.22],PALETTE.black,{radius:.07,finish:'rubber'}));
    parts.push(tube([[.12,.62,-.04],[.35,.78,-.06],[.40,.88,-.06]],.022,PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  const parts=[
    box([0,.43,-.03],[.72,.16,.68],color||'#303740',{radius:.07,finish:'fabric'}),
    box([0,.73,.25],[.62,.50,.16],color||'#303740',{radius:.07,rotation:[-8,0,0],finish:'fabric'}),
    box([0,.94,.28],[.40,.13,.16],'#3b4651',{radius:.055,rotation:[-8,0,0],finish:'fabric'}),
    box([-.31,.73,.23],[.13,.48,.20],'#222931',{radius:.055,rotation:[-8,0,-5],finish:'fabric'}),
    box([.31,.73,.23],[.13,.48,.20],'#222931',{radius:.055,rotation:[-8,0,5],finish:'fabric'}),
    box([0,.61,.15],[.42,.13,.11],'#52606d',{radius:.055,rotation:[-8,0,0],finish:'fabric'}),
    cyl([0,.30,0],[.075,.30,.075],PALETTE.silver,{finish:'brushed'}),
    cyl([0,.15,0],[.72,.055,.72],PALETTE.graphite,{finish:'metal'}),
  ];
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;parts.push(box([Math.cos(a)*.25,.12,Math.sin(a)*.25],[.44,.035,.055],PALETTE.graphite,{rotation:[0,-i*72,0],finish:'metal'}));parts.push(cyl([Math.cos(a)*.42,.05,Math.sin(a)*.42],[.08,.055,.08],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));}
  for(const x of [-.39,.39]){parts.push(tube([[x*.72,.40,.18],[x,.58,.18],[x,.66,-.10],[x*.72,.42,-.20]],.018,PALETTE.silver,{finish:'metal'}));parts.push(box([x,.66,-.08],[.18,.075,.34],PALETTE.graphite,{radius:.035,finish:'soft-plastic'}));}
  return parts;
}

function lampModel(id, color) {
  const floor=/floor|tripod|torchiere|reading/.test(id), architect=/architect|clip/.test(id), sunset=id.includes('sunset'), salt=id.includes('salt'), projector=id.includes('projector'), lantern=id.includes('lantern'), night=id.includes('night');
  if(id==='desk-lamp'){
    const parts=[
      cyl([0,.055,0],[.48,.11,.48],PALETTE.graphite,{finish:'metal'}),
      cyl([0,.115,0],[.38,.025,.38],PALETTE.silver,{finish:'brushed'}),
      tube([[0,.11,0],[.04,.37,.03],[-.10,.60,.03],[-.25,.70,.02]],.030,PALETTE.silver,{finish:'metal'}),
      cyl([-.25,.70,.02],[.070,.055,.070],PALETTE.graphite,{rotation:[0,0,90],finish:'metal'}),
      P('cone',[-.34,.70,.02],[.36,.22,.36],color||'#35566d',{rotation:[0,0,-66],finish:'painted-metal'}),
      cyl([-.43,.68,.02],[.13,.040,.13],'#ffe5a3',{rotation:[0,0,90],finish:'glass',emissive:'#d9902b'}),
      box([.13,.085,-.16],[.13,.035,.10],PALETTE.red,{radius:.015,finish:'plastic'}),
      tube([[.20,.09,.10],[.34,.06,.16],[.42,.045,.23]],.011,PALETTE.graphite,{finish:'rubber'}),
    ];
    for(const x of [-.22,.22])for(const z of [-.20,.20])parts.push(cyl([x,.025,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    for(let i=0;parts.length<18;i++){const a=i*Math.PI*2/6;parts.push(cyl([Math.cos(a)*.24,.13,Math.sin(a)*.24],[.015,.010,.015],PALETTE.silver,{finish:'metal'}));}
    return parts;
  }
  if(id==='clip-lamp'){
    const parts=[
      box([0,.16,0],[.36,.26,.42],PALETTE.graphite,{radius:.035,finish:'metal'}),
      box([0,.28,.14],[.42,.045,.10],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([0,.09,-.13],[.42,.060,.09],PALETTE.silver,{radius:.010,finish:'metal'}),
      tube([[0,.30,0],[.03,.54,.02],[-.12,.70,.03],[-.28,.76,.02]],.028,PALETTE.graphite,{finish:'metal'}),
      cyl([-.28,.76,.02],[.065,.050,.065],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),
      P('cone',[-.37,.76,.02],[.30,.20,.30],color||'#d39c2d',{rotation:[0,0,-68],finish:'painted-metal'}),
      cyl([-.45,.74,.02],[.11,.036,.11],'#ffe5a3',{rotation:[0,0,90],finish:'glass',emissive:'#d9902b'}),
      tube([[-.15,.27,-.18],[-.15,.12,-.18],[.15,.12,-.18],[.15,.27,-.18]],.014,PALETTE.silver,{finish:'metal'}),
    ];
    for(let i=0;parts.length<18;i++)parts.push(cyl([-.12+i*.035,.18,-.22],[.012,.012,.012],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if(id==='architect-lamp'){
    const parts=[
      cyl([0,.055,0],[.44,.11,.44],PALETTE.graphite,{finish:'metal'}),
      cyl([0,.15,0],[.070,.18,.070],PALETTE.silver,{finish:'metal'}),
      tube([[0,.22,0],[-.26,.46,.02],[.03,.69,.02],[.31,.72,.02]],.028,PALETTE.graphite,{finish:'metal'}),
      tube([[0,.22,-.04],[-.26,.46,-.04],[.03,.69,-.04],[.31,.72,-.04]],.014,PALETTE.silver,{finish:'metal'}),
      tube([[0,.22,.04],[-.26,.46,.04],[.03,.69,.04],[.31,.72,.04]],.014,PALETTE.silver,{finish:'metal'}),
      cyl([-.26,.46,.02],[.070,.045,.070],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),
      cyl([.03,.69,.02],[.070,.045,.070],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),
      P('cone',[.40,.72,.02],[.34,.22,.34],color||'#30363d',{rotation:[0,0,68],finish:'painted-metal'}),
      cyl([.49,.70,.02],[.13,.040,.13],'#ffe5a3',{rotation:[0,0,90],finish:'glass',emissive:'#d9902b'}),
    ];
    for(const x of [-.20,.20])for(const z of [-.18,.18])parts.push(cyl([x,.025,z],[.028,.025,.028],PALETTE.black,{finish:'rubber'}));
    for(let i=0;parts.length<18;i++)parts.push(cyl([-.15+i*.05,.12,.18],[.014,.010,.014],PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  if(id==='table-lamp'){
    const parts=[
      cyl([0,.060,0],[.48,.12,.48],PALETTE.woodDark,{finish:'wood'}),
      P('lathe',[0,.30,0],[.42,.44,.42],color||'#d8e1e2',{profile:[[.24,-.50],[.34,-.38],[.38,-.08],[.28,.25],[.18,.46]],smoothProfile:true,finish:'ceramic'}),
      cyl([0,.53,0],[.12,.12,.12],PALETTE.silver,{finish:'metal'}),
      P('cone',[0,.72,0],[.62,.34,.62],'#e8d7b5',{rotation:[180,0,0],finish:'fabric'}),
      cyl([0,.67,0],[.22,.26,.22],'#ffd27b',{finish:'glass',emissive:'#b56a18'}),
      torus([0,.57,0],[.46,.020,.46],PALETTE.woodDark,{rotation:[90,0,0],finish:'fabric'}),
      tube([[.20,.52,.08],[.25,.38,.14],[.34,.34,.18]],.010,PALETTE.graphite,{finish:'rubber'}),
    ];
    for(const x of [-.22,.22])for(const z of [-.22,.22])parts.push(cyl([x,.025,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    for(let i=0;parts.length<18;i++)parts.push(cyl([Math.cos(i)*.20,.13,Math.sin(i)*.20],[.012,.010,.012],PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  if(id==='torchiere'){
    const parts=[
      cyl([0,.05,0],[.62,.10,.62],PALETTE.graphite,{finish:'metal'}),
      torus([0,.09,0],[.58,.020,.58],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
      cyl([0,.49,0],[.050,.88,.050],PALETTE.silver,{finish:'brushed'}),
      P('cone',[0,.88,0],[.56,.24,.56],'#e8d7b5',{rotation:[180,0,0],finish:'fabric'}),
      cyl([0,.79,0],[.19,.22,.19],'#ffd27b',{finish:'glass',emissive:'#b56a18'}),
      box([.08,.44,-.045],[.10,.055,.080],PALETTE.graphite,{radius:.015,finish:'plastic'}),
      tube([[.04,.70,.02],[.20,.58,.05],[.26,.54,.05]],.010,PALETTE.graphite,{finish:'rubber'}),
    ];
    for(const x of [-.28,.28])for(const z of [-.28,.28])parts.push(cyl([x,.025,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    for(let i=0;parts.length<18;i++)parts.push(cyl([Math.cos(i)*.18,.12,Math.sin(i)*.18],[.012,.010,.012],PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  if(id==='reading-lamp'){
    const parts=[
      cyl([0,.05,0],[.56,.10,.56],PALETTE.graphite,{finish:'metal'}),
      cyl([0,.37,0],[.050,.64,.050],PALETTE.silver,{finish:'brushed'}),
      tube([[0,.66,0],[.08,.76,.02],[.22,.80,.05],[.34,.74,.06]],.026,PALETTE.graphite,{finish:'metal'}),
      cyl([.34,.74,.06],[.060,.040,.060],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),
      P('cone',[.42,.72,.06],[.32,.21,.32],color||'#35566d',{rotation:[0,0,68],finish:'painted-metal'}),
      cyl([.50,.70,.06],[.12,.036,.12],'#ffe5a3',{rotation:[0,0,90],finish:'glass',emissive:'#d9902b'}),
      box([.10,.38,-.055],[.10,.055,.080],PALETTE.graphite,{radius:.015,finish:'plastic'}),
    ];
    for(const x of [-.25,.25])for(const z of [-.25,.25])parts.push(cyl([x,.025,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    for(let i=0;parts.length<18;i++)parts.push(cyl([Math.cos(i)*.18,.12,Math.sin(i)*.18],[.012,.010,.012],PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  if(projector){
    const parts=[sphere([0,.46,0],[.54,.48,.54],PALETTE.white,{finish:'plastic'}),cyl([0,.46,-.44],[.22,.06,.22],'#132635',{rotation:[90,0,0],finish:'glass',emissive:'#0b4b69'}),torus([0,.46,-.48],[.25,.025,.25],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([0,.12,0],[.70,.12,.58],PALETTE.graphite,{radius:.06,finish:'rubber'}),tube([[-.24,.20,0],[-.38,.06,0]],.025,PALETTE.silver,{finish:'metal'}),tube([[.24,.20,0],[.38,.06,0]],.025,PALETTE.silver,{finish:'metal'})];
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(cyl([Math.cos(a)*.45,.70,Math.sin(a)*.45],[.018,.016,.018],['#60a5fa','#a78bfa','#f472b6'][i%3],{finish:'glass',emissive:['#1d4ed8','#6d28d9','#be185d'][i%3]}));}return parts;
  }
  if(lantern){
    const parts=[cyl([0,.12,0],[.58,.16,.58],PALETTE.graphite,{finish:'metal'}),cyl([0,.46,0],[.48,.56,.48],'#ffe5a7',{finish:'glass',emissive:'#b56a18'}),cyl([0,.80,0],[.58,.12,.58],PALETTE.graphite,{finish:'metal'}),torus([0,.84,0],[.60,.34,.26],PALETTE.graphite,{rotation:[90,0,0],finish:'metal'}),box([0,.72,-.48],[.20,.10,.025],'#1d2d38',{radius:.01,finish:'screen',emissive:'#0b4b69'})];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(tube([[Math.cos(a)*.46,.18,Math.sin(a)*.46],[Math.cos(a)*.46,.74,Math.sin(a)*.46]],.014,PALETTE.silver,{finish:'metal'}));}
    for(let i=0;parts.length<18;i++){const a=i*Math.PI*2/6;parts.push(cyl([Math.cos(a)*.38,.18,Math.sin(a)*.38],[.018,.018,.018],PALETTE.silver,{finish:'metal'}));}return parts;
  }
  const parts=[cyl([0,.045,0],[floor?.62:.48,.09,floor?.62:.48],PALETTE.graphite,{finish:'metal'}),torus([0,.09,0],[floor?.58:.44,.020,floor?.58:.44],PALETTE.silver,{rotation:[90,0,0],finish:'metal'})];
  if(id.includes('tripod')){for(let i=0;i<3;i++){const a=i*Math.PI*2/3;parts.push(tube([[0,.52,0],[Math.cos(a)*.48,.04,Math.sin(a)*.48]],.025,PALETTE.woodDark,{finish:'wood'}));}}
  else parts.push(cyl([0,.45,0],[.050,.78,.050],PALETTE.silver,{finish:'brushed'}));
  if(architect){
    parts.push(tube([[0,.25,0],[-.20,.52,0],[.13,.76,0]],.026,PALETTE.graphite,{finish:'metal'}),tube([[-.15,.45,0],[-.21,.60,0]],.012,PALETTE.silver,{finish:'metal'}),tube([[-.20,.52,0],[.11,.73,0]],.012,PALETTE.silver,{finish:'metal'}),P('cone',[.25,.78,0],[.34,.22,.34],color||'#30363d',{rotation:[0,0,-66],finish:'painted-metal'}),cyl([.34,.76,0],[.12,.035,.12],'#ffe3a3',{rotation:[0,0,90],finish:'glass',emissive:'#d9902b'}),box([-.06,.18,0],[.12,.045,.12],PALETTE.red,{radius:.02,finish:'plastic'}));
  }else if(sunset){
    parts.push(cyl([0,.34,0],[.075,.52,.075],PALETTE.graphite,{finish:'metal'}),disc([0,.72,-.04],[.66,.66,.03],'#f7a97b',{rotation:[90,0,0],finish:'glass',emissive:'#b54e24'}),disc([0,.72,-.065],[.46,.46,.02],'#e8695c',{rotation:[90,0,0],finish:'glass',emissive:'#8c2a28'}));
  }else if(salt){
    parts.push(P('lathe',[0,.45,0],[.60,.74,.60],'#e89a70',{profile:[[.18,-.48],[.45,-.38],[.58,-.08],[.50,.22],[.28,.46]],smoothProfile:true,finish:'stone',emissive:'#733719'}),cyl([0,.31,0],[.18,.26,.18],'#ffd17a',{finish:'glass',emissive:'#b65d20'}));
  }else if(night){
    parts.push(box([0,.42,0],[.46,.72,.22],PALETTE.white,{radius:.12,finish:'plastic'}),disc([0,.47,-.13],[.22,.22,.025],'#ffe7a5',{rotation:[90,0,0],finish:'glass',emissive:'#c98328'}),box([0,.10,.02],[.30,.04,.12],PALETTE.graphite,{radius:.02,finish:'rubber'}));
  }else{
    parts.push(P('cone',[0,.78,0],[floor?.56:.62,.28,floor?.56:.62],'#e8d7b5',{rotation:[180,0,0],finish:'fabric'}),torus([0,.77,0],[floor?.50:.56,.025,floor?.50:.56],PALETTE.woodDark,{rotation:[90,0,0],finish:'fabric'}),cyl([0,.66,0],[.18,.18,.18],'#ffd27b',{finish:'glass',emissive:'#b56a18'}));
  }
  for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(cyl([Math.cos(a)*.20,.10,Math.sin(a)*.20],[.025,.020,.025],PALETTE.black,{finish:'rubber'}));}
  // Additional visible fasteners stay on the plinth rather than floating in
  // front of the fixture; this also gives compact lamps real close-up detail.
  for(let i=0;parts.length<18;i++){const a=i*Math.PI*2/6;parts.push(cyl([Math.cos(a)*.15,.115,Math.sin(a)*.15],[.018,.014,.018],PALETTE.silver,{finish:'metal'}));}
  return parts;
}

function instrumentModel(id, color) {
  const electric=id.includes('electric'),uke=id.includes('ukulele');
  const bodyFinish=electric?'painted-wood':'wood';
  const bodyColor=color||(electric?'#315d78':'#9a704d');
  const parts=[];
  if(electric){
    parts.push(
      extrude([0,.275,0],[.86,.47,.82],bodyColor,[[.02,.50],[-.17,.48],[-.33,.39],[-.40,.23],[-.34,.06],[-.48,-.14],[-.43,-.31],[-.25,-.46],[-.02,-.50],[.22,-.45],[.40,-.30],[.46,-.09],[.34,.08],[.27,.22],[.45,.39],[.35,.49],[.15,.36]],{smoothOutline:true,finish:bodyFinish,bevel:.055}),
      extrude([-.08,.30,-.425],[.52,.37,.025],PALETTE.white,[[.00,.50],[-.38,.35],[-.48,.05],[-.30,-.42],[.12,-.50],[.44,-.18],[.34,.20]],{finish:'plastic',bevel:.025}),
      box([0,.29,-.425],[.33,.035,.045],PALETTE.silver,{radius:.006,finish:'metal'}),
      box([0,.19,-.425],[.28,.035,.050],PALETTE.silver,{radius:.006,finish:'metal'})
    );
    for(let i=0;i<3;i++)parts.push(box([0,.245+i*.070,-.435],[.28,.030,.050],i===1?'#2e3338':'#ece9df',{radius:.006,finish:i===1?'plastic':'enamel'}));
    for(const [x,y] of [[.24,.16],[.29,.23],[-.24,.17]])parts.push(cyl([x,y,-.44],[.065,.030,.065],iSafeColor(x),{rotation:[90,0,0],finish:'metal'}));
    parts.push(box([-.29,.29,-.44],[.028,.16,.035],PALETTE.silver,{rotation:[0,0,12],finish:'metal'}),ring([.19,.12,-.445],[.09,.09,.015],PALETTE.silver,{radius:.28,finish:'metal'}));
  }else{
    parts.push(
      extrude([0,.275,0],[.88,.48,.78],bodyColor,[[0,.50],[-.25,.46],[-.36,.33],[-.30,.15],[-.19,.03],[-.43,-.08],[-.50,-.28],[-.38,-.45],[0,-.50],[.38,-.45],[.50,-.28],[.43,-.08],[.19,.03],[.30,.15],[.36,.33],[.25,.46]],{smoothOutline:true,finish:bodyFinish,bevel:.055}),
      torus([0,.34,-.405],[.26,.055,.26],PALETTE.woodDark,{rotation:[90,0,0],finish:'wood'}),
      disc([0,.34,-.437],[.13,.13,.015],PALETTE.black,{finish:'wood'}),
      wedge([.18,.27,-.43],[.25,.23,.018],'#3b2b24',{rotation:[0,0,-18],finish:'plastic'}),
      box([0,.18,-.43],[.29,.038,.048],PALETTE.woodDark,{radius:.006,finish:'wood'})
    );
  }
  parts.push(
    box([0,.665,-.015],[uke?.12:.14,uke?.50:.51,.15],electric?'#6d4d34':PALETTE.woodDark,{radius:.018,finish:'wood'}),
    box([0,.688,-.098],[uke?.105:.12,uke?.48:.49,.025],'#30251d',{radius:.008,finish:'wood'}),
    wedge([electric?-.025:0,.94,-.01],[.25,.16,.16],electric?'#6d4d34':PALETTE.wood,{rotation:[0,0,electric?-8:4],finish:'wood'}),
    box([0,.47,-.235],[.22,.035,.055],'#e7dfcf',{radius:.006,finish:'plastic'})
  );
  if(!electric){
    parts.push(ring([0,.355,-.265],[.27,.27,.03],PALETTE.woodDark,{radius:.31,finish:'wood'}));
    parts.push(disc([0,.355,-.273],[.145,.145,.02],PALETTE.black,{finish:'wood'}));
    parts.push(wedge([.18,.28,-.29],[.27,.25,.022],'#3b2b24',{rotation:[0,0,-18],finish:'plastic'}));
  }else{
    parts.push(wedge([-.22,.34,-.325],[.34,.45,.025],PALETTE.white,{rotation:[0,0,14],finish:'plastic'}));
    for(let i=0;i<3;i++)parts.push(box([0,.27+i*.085,-.335],[.30,.035,.055],i===1?'#d6d9dc':'#ece9df',{radius:.006,finish:'plastic'}));
    for(const [x,y] of [[.23,.19],[.28,.25],[-.25,.18]])parts.push(cyl([x,y,-.34],[.07,.035,.07],PALETTE.graphite,{rotation:[90,0,0],finish:'metal'}));
    parts.push(box([-.29,.31,-.34],[.035,.16,.04],PALETTE.silver,{rotation:[0,0,12],finish:'metal'}));
  }
  const fretCount=uke?12:18;
  for(let i=0;i<fretCount;i++){
    const y=.49+i*(.39/(fretCount-1));
    parts.push(box([0,y,-.116],[.13,.009,.018],PALETTE.silver,{radius:.002,finish:'metal'}));
  }
  const stringCount=uke?4:6;
  for(let i=0;i<stringCount;i++){
    const x=(i-(stringCount-1)/2)*(.073/(stringCount-1));
    parts.push(tube([[x,.19,-.326],[x,.47,-.255],[x*.72,.91,-.13]],.0022,i<3?'#dadde0':'#b8bec4',{finish:'metal'}));
    const half=stringCount/2,side=i<half?-1:1,pegY=.90+(i%half)*.040;
    parts.push(cyl([side*.13,pegY,-.08],[.035,.09,.035],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}));
    parts.push(box([side*.18,pegY,-.08],[.07,.035,.065],electric?PALETTE.graphite:'#e9e3d5',{radius:.012,finish:electric?'metal':'plastic'}));
  }
  for(const y of [.57,.68,.79])parts.push(disc([0,y,-.135],[.022,.022,.010],PALETTE.white,{finish:'plastic'}));
  parts.push(cyl([0,.965,-.02],[.018,.018,.018],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
  return parts;
}

function iSafeColor(x){return x<0?'#d4d9de':'#30363d'}

function seatingModel(id, color) {
  if(id.includes('beanbag')){
    const fabric=color||PALETTE.blue,parts=[
      loft([0,0,0],[1,1,1],fabric,[mouseRing(.08,.30,.32,.34),mouseRing(.18,.47,.48,.48),mouseRing(.36,.49,.47,.50),mouseRing(.54,.43,.40,.44),mouseRing(.69,.30,.28,.31),mouseRing(.77,.12,.11,.13),mouseRing(.79,.025,.025,.025)],{finish:'fabric'}),
      box([0,.775,0],[.14,.022,.12],'#53758f',{radius:.010,finish:'fabric'}),
      box([0,.12,-.39],[.20,.020,.012],'#53758f',{radius:.004,finish:'thread'}),
    ];
    for(const x of [-.28,.28])for(const z of [-.25,.25])parts.push(cyl([x,.035,z],[.045,.035,.045],PALETTE.black,{finish:'rubber'}));
    for(let i=0;i<11;i++){const a=i*Math.PI*2/11;parts.push(box([Math.cos(a)*.35,.095,Math.sin(a)*.32],[.045,.008,.014],'#53758f',{radius:.003,rotation:[0,-a*180/Math.PI,0],finish:'thread'}));}
    return parts;
  }
  if(id.includes('ottoman')){
    const parts=[box([0,.42,0],[.94,.66,.88],color||'#8a6547',{radius:.12,finish:'fabric'}),box([0,.78,0],[.98,.20,.92],'#9b7657',{radius:.11,finish:'fabric'}),box([0,.14,-.45],[.28,.08,.030],PALETTE.graphite,{radius:.012,finish:'metal'}),box([0,.78,.45],[.22,.05,.035],PALETTE.woodDark,{radius:.006,finish:'metal'}),tube([[-.48,.35,-.20],[-.55,.42,0],[-.48,.35,.20]],.022,PALETTE.woodDark,{finish:'fabric'}),tube([[.48,.35,-.20],[.55,.42,0],[.48,.35,.20]],.022,PALETTE.woodDark,{finish:'fabric'})];
    for(const x of [-.38,.38])for(const z of [-.34,.34])parts.push(cyl([x,.07,z],[.065,.14,.065],PALETTE.woodDark,{finish:'wood'}));
    for(const x of [-.24,.24])for(const z of [-.22,.22])parts.push(cyl([x,.90,z],[.045,.020,.045],color||'#8a6547',{finish:'fabric'}));
    for(let i=0;i<4;i++)parts.push(box([-.30+i*.20,.50,-.455],[.012,.36,.012],'#b9966e',{radius:.003,finish:'thread'}));
    return parts;
  }
  const parts=[
    box([0,.24,.04],[.82,.20,.80],'#455562',{radius:.06,finish:'fabric'}),
    box([-.45,.48,.02],[.10,.48,.83],'#485966',{radius:.05,finish:'fabric'}),box([.45,.48,.02],[.10,.48,.83],'#485966',{radius:.05,finish:'fabric'}),
  ];
  for(let i=0;i<3;i++){const x=-.25+i*.25;parts.push(box([x,.39,-.05],[.23,.17,.62],'#718695',{radius:.055,finish:'fabric'}));parts.push(tube([[x-.10,.47,-.34],[x-.10,.47,.23],[x+.10,.47,.23],[x+.10,.47,-.34]],.008,'#91a1ab',{finish:'thread'}));}
  for(let i=0;i<2;i++){const x=-.20+i*.40;parts.push(box([x,.67,.33],[.37,.46,.17],color||PALETTE.fabric,{radius:.075,rotation:[-11,0,0],finish:'fabric'}));parts.push(tube([[x-.17,.48,.31],[x-.17,.83,.37],[x+.17,.83,.37],[x+.17,.48,.31]],.008,'#8296a3',{finish:'thread'}));}
  for(const x of [-.45,.45])parts.push(tube([[x-.035,.28,-.35],[x-.035,.69,-.35],[x-.035,.69,.36],[x-.035,.28,.36]],.008,'#71808a',{finish:'thread'}));
  for(const x of [-.37,.37])for(const z of [-.28,.28])parts.push(cyl([x,.08,z],[.055,.16,.055],PALETTE.woodDark,{finish:'wood'}));
  return parts;
}

function rugModel(id, color) {
  const parts=[box([0,.5,0],[.99,.84,.99],color||'#7c6657',{radius:.04,finish:'fabric'})];
  for(let i=0;i<9;i++)parts.push(box([-.40+i*.10,.54,0],[.035,.05,.92],i%2?'#d4b48c':'#4b6b7f',{radius:.008,finish:'fabric'}));
  for(let i=0;i<14;i++){const x=-.46+i*.071;parts.push(tube([[x,.47,-.50],[x,.47,-.57]],.006,'#d9c8ae',{finish:'thread'}));parts.push(tube([[x,.47,.50],[x,.47,.57]],.006,'#d9c8ae',{finish:'thread'}));}
  return parts;
}

function specialModel(id, color) {
  if (id === 'monitor') {
    const shell='#202a33', parts=[
      box([0,.70,.055],[.95,.57,.095],shell,{radius:.025,finish:'painted-metal'}),
      box([0,.70,-.002],[.88,.50,.022],PALETTE.black,{radius:.010,finish:'glass'}),
      box([0,.70,-.016],[.82,.44,.012],'#12304a',{radius:.006,finish:'screen',emissive:'#071827'}),
      box([0,.958,-.028],[.91,.040,.018],PALETTE.graphite,{radius:.006,finish:'metal'}),
      box([0,.442,-.028],[.91,.055,.020],PALETTE.graphite,{radius:.007,finish:'metal'}),
      box([-.455,.70,-.028],[.040,.48,.020],PALETTE.graphite,{radius:.006,finish:'metal'}),
      box([.455,.70,-.028],[.040,.48,.020],PALETTE.graphite,{radius:.006,finish:'metal'}),
      box([0,.945,-.037],[.095,.035,.018],PALETTE.black,{radius:.010,finish:'rubber'}),
      cyl([0,.947,-.050],[.020,.012,.020],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
      box([0,.53,.105],[.20,.13,.055],PALETTE.graphite,{radius:.020,finish:'metal'}),
      box([0,.30,.105],[.070,.40,.095],PALETTE.silver,{radius:.018,finish:'brushed'}),
      box([0,.15,.105],[.19,.07,.20],PALETTE.graphite,{radius:.018,finish:'metal'}),
      box([0,.075,.105],[.54,.055,.36],PALETTE.graphite,{radius:.030,finish:'metal'}),
      box([0,.108,.005],[.41,.018,.18],'#59636d',{radius:.010,finish:'brushed'}),
    ];
    for(const x of [-.20,.20])for(const z of [-.11,.11])parts.push(cyl([x,.038,.105+z],[.035,.040,.035],PALETTE.black,{finish:'rubber'}));
    for(const [x,w] of [[-.22,.12],[-.05,.10],[.11,.10]])parts.push(box([x,.44,.112],[w,.045,.018],PALETTE.black,{radius:.006,finish:'rubber'}));
    parts.push(tube([[0,.32,.15],[.10,.23,.21],[.16,.12,.24]],.012,PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'controller') {
    const body=color||'#506c86';
    const controllerRing=(y,s)=>[
      [-.46*s,y,-.16*s],[-.48*s,y,.10*s],[-.40*s,y,.26*s],[-.27*s,y,.34*s],[-.12*s,y,.25*s],
      [.12*s,y,.25*s],[.27*s,y,.34*s],[.40*s,y,.26*s],[.48*s,y,.10*s],[.46*s,y,-.16*s],
      [.32*s,y,-.28*s],[.21*s,y,-.22*s],[.17*s,y,-.05*s],[-.17*s,y,-.05*s],[-.21*s,y,-.22*s],[-.32*s,y,-.28*s],
    ];
    const parts=[
      loft([0,0,0],[1,1,1],body,[controllerRing(.10,.92),controllerRing(.23,1),controllerRing(.45,.91),controllerRing(.57,.70)],{finish:'gloss-plastic'}),
      loft([0,0,0],[1,1,1],'#273440',[controllerRing(.08,.82),controllerRing(.16,.93),controllerRing(.24,.94)],{finish:'rubber'}),
      box([-.27,.61,-.08],[.13,.045,.13],PALETTE.black,{radius:.020,finish:'rubber'}),
      box([-.27,.66,-.08],[.045,.13,.045],PALETTE.black,{radius:.010,finish:'rubber'}),
      cyl([.18,.625,-.07],[.16,.055,.16],PALETTE.graphite,{finish:'rubber'}),
      cyl([.18,.675,-.07],[.115,.070,.115],PALETTE.black,{finish:'rubber'}),
      box([-.10,.62,-.16],[.065,.035,.065],PALETTE.black,{radius:.012,finish:'rubber'}),
      box([.02,.62,-.16],[.065,.035,.065],PALETTE.black,{radius:.012,finish:'rubber'}),
    ];
    for(const [x,z] of [[-.34,-.08],[-.20,-.08],[-.27,-.15],[-.27,-.01]])parts.push(box([x,.625,z],[.075,.035,.075],PALETTE.black,{radius:.010,finish:'rubber'}));
    for(const [x,z,c] of [[.31,-.15,'#ef4444'],[.38,-.05,'#eab308'],[.24,-.04,'#3b82f6'],[.31,.06,'#22c55e']])parts.push(cyl([x,.64,z],[.070,.045,.070],c,{finish:'gloss-plastic'}));
    for(const x of [-.28,.28]){
      parts.push(box([x,.48,.275],[.24,.10,.105],PALETTE.graphite,{radius:.032,finish:'rubber'}));
      parts.push(box([x,.39,.305],[.18,.10,.080],PALETTE.black,{radius:.025,finish:'rubber'}));
    }
    parts.push(box([0,.54,.28],[.20,.055,.055],PALETTE.graphite,{radius:.014,finish:'plastic'}),box([0,.30,-.31],[.16,.040,.030],PALETTE.silver,{radius:.006,finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(cyl([-.12+i*.08,.29,-.325],[.013,.010,.013],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if (id === 'book-stand') {
    const wood=color||PALETTE.wood, parts=[
      box([0,.08,.08],[.90,.14,.78],PALETTE.woodDark,{radius:.025,finish:'wood'}),
      box([0,.53,.09],[.84,.67,.085],wood,{radius:.022,rotation:[14,0,0],finish:'wood'}),
      box([0,.53,.045],[.70,.51,.020],PALETTE.paper,{radius:.008,rotation:[14,0,0],finish:'paper'}),
      box([0,.53,.030],[.60,.44,.012],'#466d8c',{radius:.006,rotation:[14,0,0],finish:'paper-cover'}),
      box([0,.53,.015],[.018,.43,.010],PALETTE.paper,{radius:.003,rotation:[14,0,0],finish:'paper'}),
      box([0,.28,-.07],[.74,.085,.15],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([-.33,.39,-.055],[.06,.25,.10],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([.33,.39,-.055],[.06,.25,.10],PALETTE.wood,{radius:.012,finish:'wood'}),
      tube([[-.36,.12,.20],[-.36,.34,.15],[-.32,.54,.10]],.020,PALETTE.silver,{finish:'metal'}),
      tube([[.36,.12,.20],[.36,.34,.15],[.32,.54,.10]],.020,PALETTE.silver,{finish:'metal'}),
      tube([[-.30,.20,.25],[0,.12,.32],[.30,.20,.25]],.016,PALETTE.silver,{finish:'metal'}),
      box([-.28,.77,.120],[.08,.12,.055],PALETTE.silver,{radius:.010,rotation:[14,0,0],finish:'metal'}),
      box([.28,.77,.120],[.08,.12,.055],PALETTE.silver,{radius:.010,rotation:[14,0,0],finish:'metal'}),
    ];
    for(let i=0;i<8;i++)parts.push(box([-.27+i*.078,.15,.36],[.040,.018,.060],i%2?PALETTE.silver:PALETTE.graphite,{radius:.004,finish:'metal'}));
    for(const x of [-.36,.36])for(const z of [-.27,.27])parts.push(cyl([x,.027,z],[.040,.030,.040],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'fruit-basket') {
    const basketRing=(y,r)=>Array.from({length:20},(_,i)=>{const a=i*Math.PI*2/19;return[Math.cos(a)*r,y,Math.sin(a)*r]});
    const parts=[
      cyl([0,.055,0],[.30,.08,.30],PALETTE.woodDark,{finish:'wood'}),
      cyl([0,.105,0],[.78,.055,.78],'#d4b17a',{finish:'woven'}),
      tube(basketRing(.12,.31),.018,PALETTE.graphite,{finish:'metal'}),
      tube(basketRing(.25,.43),.016,PALETTE.graphite,{finish:'metal'}),
      tube(basketRing(.39,.53),.020,PALETTE.graphite,{finish:'metal'}),
    ];
    for(let i=0;i<16;i++){const a=i*Math.PI*2/16,lower=[Math.cos(a)*.30,.12,Math.sin(a)*.30],mid=[Math.cos(a)*.43,.25,Math.sin(a)*.43],upper=[Math.cos(a)*.53,.39,Math.sin(a)*.53];parts.push(tube([lower,mid,upper],.012,i%2?PALETTE.graphite:PALETTE.silver,{finish:'metal'}));}
    const apples=[[-.22,.38,-.04,'#d9574d'],[.15,.40,-.15,'#d9574d'],[.26,.37,.12,'#79a85d'],[-.12,.43,.18,'#89b965'],[.03,.51,.02,'#d9574d']];
    for(const [x,y,z,c] of apples){parts.push(sphere([x,y,z],[.17,.15,.17],c,{finish:'organic'}),cyl([x,y+.13,z],[.025,.070,.025],PALETTE.woodDark,{finish:'wood'}),sphere([x+.035,y+.17,z],[.07,.025,.10],PALETTE.leaf,{rotation:[0,20,20],finish:'plant'}));}
    for(const [x,y,z] of [[-.02,.37,-.26],[.23,.45,.25],[-.31,.42,.16]])parts.push(sphere([x,y,z],[.15,.14,.15],'#f0a73d',{finish:'organic'}),cyl([x,y+.12,z],[.018,.045,.018],PALETTE.leafDark,{finish:'plant'}));
    for(const x of [-.18,.14]){parts.push(tube([[x,.58,.02],[x+.12,.66,-.08],[x+.24,.59,-.02]],.035,'#efcf58',{finish:'organic'}),sphere([x,.58,.02],[.045,.045,.045],PALETTE.woodDark,{finish:'organic'}),sphere([x+.24,.59,-.02],[.045,.045,.045],PALETTE.woodDark,{finish:'organic'}));}
    return parts;
  }
  if (id === 'round-mirror') {
    const frame=color||'#5f7480', circle=Array.from({length:28},(_,i)=>{const a=i*Math.PI*2/28;return[Math.cos(a)*.5,Math.sin(a)*.5]}), parts=[
      extrude([0,.50,.01],[1,1,.94],PALETTE.graphite,circle,{smoothOutline:true,finish:'rubber',bevel:.025}),
      extrude([0,.50,-.035],[.94,.94,.36],frame,circle,{smoothOutline:true,finish:'painted-metal',bevel:.028}),
      extrude([0,.50,-.215],[.79,.79,.075],'#b9d6df',circle,{smoothOutline:true,finish:'mirror',bevel:.012}),
      extrude([0,.50,-.260],[.70,.70,.018],'#c9e4ea',circle,{smoothOutline:true,finish:'mirror',bevel:.004}),
      box([0,.985,.015],[.22,.085,.10],frame,{radius:.022,finish:'painted-metal'}),
      box([0,.985,-.050],[.10,.034,.018],PALETTE.silver,{radius:.006,finish:'metal'}),
    ];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,x=Math.cos(a)*.425,y=.50+Math.sin(a)*.425;
      parts.push(box([x,y,-.265],[.035,.035,.030],i%3?PALETTE.silver:PALETTE.graphite,{radius:.006,finish:'metal'}));
    }
    for(const x of [-.25,.25])parts.push(box([x,.94,.09],[.10,.050,.055],PALETTE.black,{radius:.010,finish:'rubber'}));
    return parts;
  }
  if (/^wall-mirror-(small|full)$/.test(id)) {
    const frame=color||'#536a77', parts=[
      box([0,.50,.030],[.98,.98,.10],PALETTE.graphite,{radius:.025,finish:'rubber'}),
      box([0,.50,-.032],[.82,.82,.022],'#b9d6df',{radius:.010,finish:'mirror'}),
      box([0,.94,-.053],[.98,.115,.044],frame,{radius:.015,finish:'painted-metal'}),
      box([0,.06,-.053],[.98,.115,.044],frame,{radius:.015,finish:'painted-metal'}),
      box([-.44,.50,-.053],[.115,.82,.044],frame,{radius:.015,finish:'painted-metal'}),
      box([.44,.50,-.053],[.115,.82,.044],frame,{radius:.015,finish:'painted-metal'}),
      box([0,.90,-.065],[.78,.020,.012],PALETTE.silver,{radius:.004,finish:'brushed-metal'}),
      box([0,.10,-.065],[.78,.020,.012],PALETTE.silver,{radius:.004,finish:'brushed-metal'}),
      box([-.40,.50,-.065],[.020,.68,.012],PALETTE.silver,{radius:.004,finish:'brushed-metal'}),
      box([.40,.50,-.065],[.020,.68,.012],PALETTE.silver,{radius:.004,finish:'brushed-metal'}),
      box([0,.975,.085],[.32,.050,.055],PALETTE.graphite,{radius:.012,finish:'rubber'}),
    ];
    for(const x of [-.36,.36])for(const y of [.16,.84])parts.push(cyl([x,y,-.081],[.030,.012,.030],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(const x of [-.32,.32])parts.push(cyl([x,.030,.025],[.035,.035,.035],PALETTE.black,{finish:'rubber'}));
    for(const x of [-.25,.25])parts.push(box([x,.94,.090],[.12,.055,.050],PALETTE.black,{radius:.010,finish:'rubber'}));
    return parts;
  }
  if (id === 'whiteboard') {
    const parts=[
      box([0,.50,.025],[.98,.98,.78],PALETTE.graphite,{radius:.022,finish:'rubber'}),
      box([0,.50,-.285],[.88,.84,.14],'#f8fafc',{radius:.010,finish:'enamel'}),
      box([0,.94,-.360],[.98,.10,.080],PALETTE.silver,{radius:.012,finish:'brushed'}),
      box([0,.06,-.360],[.98,.10,.080],PALETTE.silver,{radius:.012,finish:'brushed'}),
      box([-.44,.50,-.360],[.10,.84,.080],PALETTE.silver,{radius:.012,finish:'brushed'}),
      box([.44,.50,-.360],[.10,.84,.080],PALETTE.silver,{radius:.012,finish:'brushed'}),
      box([0,.105,-.425],[.66,.055,.13],PALETTE.graphite,{radius:.018,finish:'plastic'}),
      box([-.19,.14,-.492],[.055,.15,.030],'#df5b50',{radius:.009,finish:'plastic'}),
      box([-.08,.14,-.492],[.055,.15,.030],'#2c81b5',{radius:.009,finish:'plastic'}),
      box([.03,.14,-.492],[.055,.15,.030],'#3f9660',{radius:.009,finish:'plastic'}),
      box([.20,.14,-.490],[.16,.08,.050],PALETTE.ink,{radius:.012,finish:'felt'}),
    ];
    for(let r=0;r<4;r++)parts.push(box([-.10,.72-r*.14,-.375],[.52,.010,.018],r%2?'#d4dce2':'#bfcbd4',{radius:.003,finish:'ink'}));
    for(const [x,y,c] of [[-.27,.77,'#e15a50'],[.25,.66,'#4d90c5'],[-.20,.38,'#efb64f'],[.30,.33,'#55a36e']])parts.push(box([x,y,-.382],[.065,.065,.028],c,{radius:.010,finish:'plastic'}));
    return parts;
  }
  if (id === 'calendar') {
    const parts=[
      box([0,.50,.035],[.94,.98,.78],PALETTE.graphite,{radius:.018,finish:'rubber'}),
      box([0,.50,-.280],[.86,.90,.12],PALETTE.paper,{radius:.008,finish:'paper'}),
      box([0,.89,-.355],[.86,.16,.026],'#294a61',{radius:.007,finish:'paper-cover'}),
      box([0,.78,-.358],[.78,.016,.018],'#b6c3cb',{radius:.004,finish:'ink'}),
    ];
    for(let r=0;r<5;r++)for(let c=0;c<7;c++){
      const weekend=c===0||c===6, x=-.315+c*.105,y=.65-r*.115;
      parts.push(box([x,y,-.355],[.087,.092,.016],weekend?'#f4e6df':'#edf2f4',{radius:.004,finish:'paper'}));
      if((r*7+c)%5===0)parts.push(box([x-.022,y+.018,-.367],[.022,.026,.006],'#466d8c',{radius:.002,finish:'ink'}));
    }
    for(const x of [-.25,0,.25]){parts.push(box([x,.965,-.365],[.055,.075,.036],PALETTE.silver,{radius:.010,finish:'metal'}));parts.push(box([x,.925,-.380],[.032,.050,.012],PALETTE.graphite,{radius:.005,finish:'rubber'}));}
    return parts;
  }
  if (id === 'tapestry') {
    const fabric=color||'#536f92',parts=[
      box([0,.50,.015],[.96,.94,.66],fabric,{radius:.008,finish:'fabric'}),
      box([0,.965,-.015],[1.02,.055,.090],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([0,.035,-.015],[1.02,.040,.065],PALETTE.woodDark,{radius:.014,finish:'wood'}),
      box([-.50,.965,-.015],[.065,.10,.10],PALETTE.silver,{radius:.015,finish:'metal'}),
      box([.50,.965,-.015],[.065,.10,.10],PALETTE.silver,{radius:.015,finish:'metal'}),
      tube([[-.38,1.01,.02],[0,1.18,.02],[.38,1.01,.02]],.014,PALETTE.silver,{finish:'metal'}),
    ];
    for(let i=0;i<9;i++){
      const x=-.34+i*.085, h=.34+(i%3)*.12;
      parts.push(box([x,.52,-.337],[.052,h,.018],i%3===0?'#e0b34c':i%3===1?'#d36b58':'#4a8a75',{radius:.010,finish:'fabric'}));
    }
    for(let i=0;i<12;i++){const x=-.43+i*.078;parts.push(tube([[x,.065,-.01],[x,.005,-.01]],.006,i%2?PALETTE.warm:PALETTE.wood,{finish:'fiber'}));}
    return parts;
  }
  if (id === 'pennant') {
    const triangle=[[-.50,.50],[-.50,-.50],[.50,0]],inner=[[-.45,.41],[-.45,-.41],[.39,0]],parts=[
      extrude([0,.50,.02],[.98,.94,.74],PALETTE.graphite,triangle,{smoothOutline:true,finish:'rubber',bevel:.016}),
      extrude([0,.50,-.285],[.89,.84,.16],color||'#4b6f9b',inner,{smoothOutline:true,finish:'fabric',bevel:.010}),
      box([-.01,.955,-.350],[.98,.065,.052],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([-.47,.955,-.350],[.070,.10,.065],PALETTE.silver,{radius:.015,finish:'metal'}),
      box([.45,.955,-.350],[.070,.10,.065],PALETTE.silver,{radius:.015,finish:'metal'}),
      P('star',[.00,.50,-.380],[.30,.30,.035],PALETTE.white,{finish:'fabric'}),
      box([-.22,.50,-.375],[.045,.54,.020],PALETTE.white,{radius:.006,finish:'fabric'}),
    ];
    for(let i=0;i<11;i++){const y=.87-i*.075;parts.push(tube([[-.44,y,-.30],[-.49,y-.045,-.30]],.006,i%2?PALETTE.white:PALETTE.amber,{finish:'fiber'}));}
    return parts;
  }
  if (id === 'pegboard') {
    const parts=[
      box([0,.50,.04],[.98,.98,.86],PALETTE.woodDark,{radius:.018,finish:'wood'}),
      box([0,.50,-.315],[.86,.84,.16],'#b9834f',{radius:.008,finish:'wood'}),
      box([0,.94,-.410],[.98,.10,.055],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([0,.06,-.410],[.98,.10,.055],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([-.44,.50,-.410],[.10,.84,.055],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([.44,.50,-.410],[.10,.84,.055],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([0,.13,-.455],[.52,.055,.12],PALETTE.graphite,{radius:.016,finish:'painted-metal'}),
    ];
    for(let r=0;r<8;r++)for(let c=0;c<10;c++)parts.push(box([-.33+c*.073,.22+r*.078,-.410],[.025,.025,.045],PALETTE.ink,{radius:.010,finish:'rubber'}));
    parts.push(tube([[-.18,.15,-.50],[-.18,.29,-.50],[-.06,.29,-.50]],.014,PALETTE.silver,{finish:'metal'}),tube([[.18,.15,-.50],[.18,.34,-.50],[.06,.34,-.50]],.014,PALETTE.silver,{finish:'metal'}));
    return parts;
  }
  if (id === 'acoustic-panel') {
    const parts=[
      box([0,.50,.025],[.98,.98,.90],PALETTE.graphite,{radius:.025,finish:'rubber'}),
      box([0,.50,-.330],[.88,.88,.20],color||'#536f92',{radius:.018,finish:'foam'}),
      box([0,.95,-.430],[.90,.060,.055],PALETTE.ink,{radius:.012,finish:'rubber'}),
      box([0,.05,-.430],[.90,.060,.055],PALETTE.ink,{radius:.012,finish:'rubber'}),
    ];
    for(let i=0;i<10;i++)parts.push(box([-.35+i*.078,.50,-.445],[.050,.78,i%2?.11:.065],i%2?'#405b74':'#587b93',{radius:.010,finish:'foam'}));
    for(const x of [-.36,.36])for(const y of [.16,.84])parts.push(box([x,y,-.505],[.040,.040,.035],PALETTE.silver,{radius:.008,finish:'metal'}));
    return parts;
  }
  if (id === 'letter-board') {
    const felt='#20272f',parts=[
      box([0,.50,.025],[.98,.98,.80],PALETTE.woodDark,{radius:.025,finish:'wood'}),
      box([0,.50,-.305],[.84,.82,.14],felt,{radius:.010,finish:'fabric'}),
      box([0,.94,-.375],[.98,.10,.075],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([0,.06,-.375],[.98,.10,.075],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([-.44,.50,-.375],[.10,.84,.075],PALETTE.wood,{radius:.012,finish:'wood'}),
      box([.44,.50,-.375],[.10,.84,.075],PALETTE.wood,{radius:.012,finish:'wood'}),
    ];
    for(let r=0;r<7;r++)parts.push(box([0,.20+r*.10,-.390],[.76,.014,.016],'#46515d',{radius:.003,finish:'rubber'}));
    const glyphs=[[-.26,.73,'#f6f1e6'],[-.14,.73,'#f6f1e6'],[-.02,.73,'#f6f1e6'],[.14,.73,'#f0c657'],[.27,.73,'#f6f1e6'],[-.22,.52,'#f6f1e6'],[-.08,.52,'#f0c657'],[.08,.52,'#f6f1e6'],[.23,.52,'#f6f1e6']];
    for(const [x,y,c] of glyphs)parts.push(box([x,y,-.405],[.060,.050,.020],c,{radius:.004,finish:'plastic'}));
    for(const x of [-.32,.32])parts.push(box([x,.03,.070],[.075,.035,.055],PALETTE.black,{radius:.010,finish:'rubber'}));
    return parts;
  }
  if (id === 'picture-ledge') {
    const wood=color||PALETTE.wood,parts=[
      box([0,.15,0],[.98,.16,.88],wood,{radius:.018,finish:'wood'}),
      box([0,.40,.34],[.98,.58,.10],PALETTE.woodDark,{radius:.016,finish:'wood'}),
      box([0,.24,-.36],[.98,.18,.11],wood,{radius:.018,finish:'wood'}),
      box([0,.08,.24],[.88,.050,.28],PALETTE.woodDark,{radius:.010,finish:'wood'}),
    ];
    for(const [x,h,c] of [[-.28,.42,'#526f91'],[0,.58,'#ddc275'],[.29,.47,'#6a9675']]){
      parts.push(box([x,.35+h*.50,.04],[.22,h,.070],PALETTE.graphite,{radius:.010,finish:'wood'}));
      parts.push(box([x,.35+h*.50,-.002],[.17,h-.08,.014],PALETTE.paper,{radius:.005,finish:'paper'}));
      parts.push(box([x,.35+h*.50,-.014],[.12,h-.17,.010],c,{radius:.004,finish:'photo'}));
      parts.push(box([x,.18,.12],[.18,.050,.12],PALETTE.graphite,{radius:.009,finish:'rubber'}));
    }
    for(const x of [-.38,.38])parts.push(box([x,.35,.405],[.080,.12,.045],PALETTE.silver,{radius:.008,finish:'metal'}));
    return parts;
  }
  if (id === 'memory-box') {
    const wood=color||'#6f5b4d',parts=[
      box([0,.34,0],[.94,.60,.82],wood,{radius:.055,finish:'wood'}),
      box([0,.70,.02],[.98,.16,.88],PALETTE.woodDark,{radius:.032,finish:'wood'}),
      box([0,.735,-.425],[.52,.10,.020],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([0,.71,-.435],[.34,.055,.012],PALETTE.paper,{radius:.004,finish:'paper'}),
      box([0,.71,-.446],[.25,.035,.008],'#557da0',{radius:.003,finish:'photo'}),
      box([0,.34,-.425],[.16,.12,.045],PALETTE.silver,{radius:.012,finish:'metal'}),
      box([0,.34,-.454],[.070,.045,.016],PALETTE.graphite,{radius:.006,finish:'rubber'}),
      box([-.34,.72,.36],[.10,.065,.075],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([.34,.72,.36],[.10,.065,.075],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([0,.10,-.41],[.72,.025,.040],PALETTE.woodDark,{radius:.006,finish:'wood'}),
    ];
    for(let i=0;i<8;i++)parts.push(box([-.30+i*.085,.49,-.425],[.050,.14,.014],i%2?'#d9b86d':'#7694ab',{radius:.004,finish:'paper'}));
    for(const x of [-.34,.34])for(const z of [-.28,.28])parts.push(cyl([x,.045,z],[.038,.045,.038],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'sticky-note-cube') {
    const parts=[];for(let layer=0;layer<4;layer++){const y=.12+layer*.17,c=['#f6dd64','#f5b7b1','#98d8c4','#9ec5ec'][layer];parts.push(box([0,y,0],[.74,.15,.72],c,{radius:.025,finish:'paper'}),box([0,y+.08,-.37],[.64,.010,.012],PALETTE.paper,{radius:.003,finish:'paper'}));}
    for(let i=0;i<10;i++)parts.push(box([-.30+i*.065,.79,-.32],[.04,.014,.10],PALETTE.paper,{radius:.003,rotation:[0,(i%3-1)*4,0],finish:'paper'}));for(let i=0;i<18;i++){const y=.08+(i%9)*.08,z=i<9?-.37:.37;parts.push(box([0,y,z],[.62,.006,.008],i%4===0?'#f6dd64':PALETTE.paper,{radius:.002,finish:'paper'}));}return parts;
  }
  if (id === 'pullup-bar') {
    const parts=[
      tube([[-.46,.56,0],[.46,.56,0]],.052,PALETTE.graphite,{finish:'metal'}),
      tube([[-.26,.56,0],[-.10,.56,0]],.073,PALETTE.black,{finish:'rubber'}),
      tube([[.10,.56,0],[.26,.56,0]],.073,PALETTE.black,{finish:'rubber'}),
      tube([[-.43,.56,0],[-.43,.72,.20],[-.32,.72,.30]],.036,PALETTE.silver,{finish:'metal'}),
      tube([[.43,.56,0],[.43,.72,.20],[.32,.72,.30]],.036,PALETTE.silver,{finish:'metal'}),
      box([-.32,.72,.34],[.24,.20,.06],PALETTE.graphite,{radius:.025,finish:'metal'}),
      box([.32,.72,.34],[.24,.20,.06],PALETTE.graphite,{radius:.025,finish:'metal'}),
      box([-.32,.72,.375],[.14,.10,.014],PALETTE.black,{radius:.008,finish:'rubber'}),
      box([.32,.72,.375],[.14,.10,.014],PALETTE.black,{radius:.008,finish:'rubber'}),
    ];
    for(const x of [-.42,-.29,.29,.42])parts.push(cyl([x,.56,0],[.022,.065,.022],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}));
    for(const x of [-.39,.39])for(const y of [.66,.78])parts.push(cyl([x,y,.385],[.020,.010,.020],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(box([-.42+i*.28,.56,-.060],[.10,.010,.020],i%2?PALETTE.silver:PALETTE.graphite,{radius:.003,finish:'metal'}));
    return parts;
  }
  if (/stick-vacuum|hand-vacuum|robot-vacuum/.test(id)) {
    if(id==='stick-vacuum'){
      const parts=[box([0,.08,.04],[.72,.11,.34],PALETTE.graphite,{radius:.06,finish:'plastic'}),box([0,.11,-.14],[.62,.06,.10],PALETTE.black,{radius:.025,finish:'rubber'}),tube([[0,.14,.03],[.03,.54,.01],[.06,.80,.02]],.032,PALETTE.silver,{finish:'metal'}),box([.06,.60,.02],[.24,.20,.22],color,{radius:.08,finish:'plastic'}),cyl([.06,.60,-.105],[.070,.025,.070],'#2c6c88',{rotation:[90,0,0],finish:'glass',opacity:.55}),box([.06,.84,.02],[.25,.08,.18],PALETTE.graphite,{radius:.035,finish:'rubber'}),box([.05,.91,.02],[.18,.06,.12],PALETTE.graphite,{radius:.025,finish:'rubber'}),tube([[.04,.84,.02],[.12,.94,.02]],.018,PALETTE.silver,{finish:'metal'})];
      for(const x of [-.24,.24])parts.push(cyl([x,.06,.08],[.10,.06,.10],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));
      for(let i=0;i<6;i++)parts.push(box([-.22+i*.09,.13,-.18],[.045,.012,.012],PALETTE.silver,{radius:.003,finish:'metal'}));
      for(let i=0;i<4;i++)parts.push(cyl([-.03+i*.055,.72,-.105],[.016,.010,.016],i===3?'#4ade80':PALETTE.silver,{rotation:[90,0,0],finish:'glass',emissive:i===3?'#166534':undefined}));
      return parts;
    }
    if(id==='hand-vacuum'){
      const parts=[box([0,.35,0],[.84,.34,.44],color,{radius:.12,finish:'plastic'}),box([-.43,.33,0],[.22,.20,.24],PALETTE.graphite,{radius:.035,finish:'rubber'}),P('cone',[-.48,.33,0],[.28,.20,.28],PALETTE.graphite,{rotation:[0,0,-90],finish:'rubber'}),box([.20,.51,.02],[.34,.20,.26],PALETTE.graphite,{radius:.07,rotation:[0,0,-20],finish:'rubber'}),tube([[.12,.43,.02],[.27,.62,.02],[.38,.54,.02]],.035,PALETTE.graphite,{finish:'rubber'}),box([.04,.42,-.235],[.36,.16,.018],'#285c75',{radius:.020,finish:'glass',opacity:.50}),box([.24,.30,-.238],[.12,.07,.018],'#173647',{radius:.008,finish:'screen',emissive:'#075985'})];
      for(let i=0;i<7;i++)parts.push(box([-.18+i*.060,.18,-.235],[.034,.012,.012],PALETTE.silver,{radius:.003,finish:'metal'}));
      for(const x of [-.25,.25])for(const z of [-.14,.14])parts.push(cyl([x,.16,z],[.042,.045,.042],PALETTE.black,{finish:'rubber'}));
      return parts;
    }
    const parts=[cyl([0,.18,0],[.92,.24,.92],color,{finish:'plastic'}),cyl([0,.31,0],[.72,.06,.72],PALETTE.graphite,{finish:'rubber'}),cyl([0,.38,0],[.22,.12,.22],PALETTE.graphite,{finish:'plastic'}),cyl([0,.46,0],[.13,.045,.13],'#2b6e8c',{finish:'glass',emissive:'#075985'}),box([0,.25,-.46],[.54,.11,.020],PALETTE.graphite,{radius:.025,finish:'rubber'}),box([.22,.30,-.47],[.14,.05,.016],'#4ade80',{radius:.008,finish:'glass',emissive:'#166534'}),box([-.25,.20,-.44],[.18,.05,.08],PALETTE.black,{radius:.02,finish:'rubber'}),box([.25,.20,-.44],[.18,.05,.08],PALETTE.black,{radius:.02,finish:'rubber'})];
    for(let i=0;i<10;i++){const a=i*Math.PI/5;parts.push(box([Math.cos(a)*.64,.19,Math.sin(a)*.64],[.06,.04,.06],i%2?PALETTE.graphite:PALETTE.black,{radius:.010,finish:'rubber'}));}
    return parts;
  }
  if (id === 'drying-rack') {
    const parts=[
      tube([[-.43,.05,-.30],[-.43,.85,-.30],[-.43,.85,.30],[-.43,.05,.30]],.024,PALETTE.silver,{finish:'metal'}),
      tube([[.43,.05,-.30],[.43,.85,-.30],[.43,.85,.30],[.43,.05,.30]],.024,PALETTE.silver,{finish:'metal'}),
      tube([[-.43,.05,-.30],[.43,.05,.30]],.020,PALETTE.graphite,{finish:'metal'}),
      tube([[-.43,.05,.30],[.43,.05,-.30]],.020,PALETTE.graphite,{finish:'metal'}),
    ];
    for(const y of [.25,.43,.61,.79])for(const z of [-.28,.28])parts.push(tube([[-.42,y,z],[.42,y,z]],.018,PALETTE.silver,{finish:'metal'}));
    for(const x of [-.43,.43])for(const z of [-.30,.30])parts.push(cyl([x,.04,z],[.045,.05,.045],PALETTE.black,{finish:'rubber'}));
    for(const x of [-.43,.43])parts.push(cyl([x,.80,-.30],[.032,.055,.032],PALETTE.graphite,{finish:'metal'}));
    return parts;
  }
  if (/trash-can/.test(id)) {
    const tall=id.includes('tall'),r=tall?.66:.72,h=tall?.76:.62,parts=[
      P('lathe',[0,.40,0],[r,h,r],color,{profile:[[.34,-.50],[.47,-.46],[.50,-.22],[.49,.28],[.44,.45]],smoothProfile:true,finish:'plastic'}),
      cyl([0,.78,0],[r+.04,.10,r+.04],PALETTE.graphite,{finish:'plastic'}),
      cyl([0,.85,0],[r*.78,.05,r*.78],color,{finish:'plastic'}),
      torus([0,.79,0],[r,.024,r],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
      box([0,.06,-.38],[.30,.07,.16],PALETTE.graphite,{radius:.025,finish:'rubber'}),
      box([0,.91,-.20],[.20,.05,.13],PALETTE.graphite,{radius:.018,finish:'rubber'}),
      tube([[-.26,.72,.22],[-.34,.82,.22],[-.26,.91,.22]],.020,PALETTE.silver,{finish:'metal'}),
      tube([[.26,.72,.22],[.34,.82,.22],[.26,.91,.22]],.020,PALETTE.silver,{finish:'metal'}),
    ];
    for(const y of [.18,.35,.52,.69])parts.push(torus([0,y,0],[r*.88,.010,r*.88],y===.52?PALETTE.silver:color,{rotation:[90,0,0],finish:'plastic'}));
    for(const x of [-.27,.27])for(const z of [-.25,.25])parts.push(cyl([x,.05,z],[.040,.04,.040],PALETTE.black,{finish:'rubber'}));
    for(let i=0;i<4;i++)parts.push(cyl([-.15+i*.10,.88,-.30],[.016,.010,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if (id === 'ankle-weights') {
    const parts=[];
    for(const x of [-.25,.25]){
      parts.push(box([x,.35,0],[.38,.32,.70],x<0?color:'#334155',{radius:.10,finish:'fabric'}),box([x,.37,-.37],[.28,.18,.025],PALETTE.black,{radius:.025,finish:'fabric'}),box([x,.49,.36],[.30,.05,.028],PALETTE.silver,{radius:.006,finish:'metal'}));
      for(let i=0;i<4;i++)parts.push(box([x-.12+i*.08,.30,-.40],[.045,.16,.025],PALETTE.silver,{radius:.004,finish:'metal'}));
      for(let i=0;i<3;i++)parts.push(cyl([x-.10+i*.10,.18,.24],[.032,.04,.032],PALETTE.graphite,{finish:'metal'}));
    }
    return parts;
  }
  if (id === 'yoga-blocks') {
    const parts=[box([-.24,.28,0],[.43,.50,.82],color,{radius:.07,rotation:[0,-5,0],finish:'foam'}),box([.24,.40,0],[.43,.50,.82],'#0f766e',{radius:.07,rotation:[0,6,0],finish:'foam'}),box([-.24,.57,-.42],[.24,.06,.025],'#d3e5e3',{finish:'ink'}),box([.24,.69,-.42],[.24,.06,.025],'#d3e5e3',{finish:'ink'})];
    for(const [x,y] of [[-.24,.55],[.24,.68]])for(let i=0;i<7;i++)parts.push(box([x-.14+i*.047,y,.02],[.020,.012,.62],i%2?PALETTE.white:'#78aaa7',{radius:.003,finish:'foam'}));
    return parts;
  }
  if (id === 'ab-roller') {
    const parts=[cyl([0,.48,0],[.66,.22,.66],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}),cyl([0,.48,0],[.36,.25,.36],color,{rotation:[90,0,0],finish:'plastic'}),cyl([0,.48,0],[.12,.92,.12],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),box([-.40,.48,0],[.30,.16,.20],PALETTE.graphite,{radius:.07,finish:'foam'}),box([.40,.48,0],[.30,.16,.20],PALETTE.graphite,{radius:.07,finish:'foam'})];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(box([Math.cos(a)*.34,.48+Math.sin(a)*.34,-.12],[.055,.055,.025],i%2?PALETTE.graphite:PALETTE.silver,{radius:.006,finish:'rubber'}));}
    for(const x of [-.28,.28])parts.push(cyl([x,.48,0],[.15,.06,.15],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}));
    for(const x of [-.44,.44])parts.push(box([x,.48,-.12],[.18,.08,.025],PALETTE.black,{radius:.018,finish:'rubber'}));
    for(let i=0;i<3;i++)parts.push(cyl([-.05+i*.05,.48,-.19],[.016,.010,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if (id === 'gym-bag') {
    const parts=[box([0,.33,0],[.94,.50,.64],color,{radius:.22,finish:'fabric'}),box([-.42,.33,0],[.12,.38,.50],PALETTE.graphite,{radius:.08,finish:'fabric'}),box([.42,.33,0],[.12,.38,.50],PALETTE.graphite,{radius:.08,finish:'fabric'}),box([0,.46,-.33],[.68,.045,.018],PALETTE.graphite,{radius:.008,finish:'zipper'}),tube([[-.24,.56,0],[-.24,.78,0],[.02,.80,0],[.24,.56,0]],.035,PALETTE.graphite,{finish:'fabric'}),box([-.47,.31,-.08],[.09,.20,.30],PALETTE.graphite,{radius:.04,finish:'fabric'}),box([.47,.31,-.08],[.09,.20,.30],PALETTE.graphite,{radius:.04,finish:'fabric'})];
    for(let i=0;i<12;i++)parts.push(cyl([-.28+i*.05,.46,-.36],[.012,.012,.012],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(const x of [-.34,.34])for(const z of [-.24,.24])parts.push(cyl([x,.07,z],[.035,.030,.035],PALETTE.black,{finish:'rubber'}));
    for(let i=0;i<4;i++)parts.push(box([-.25+i*.17,.24,.33],[.10,.040,.014],i%2?PALETTE.silver:PALETTE.graphite,{radius:.004,finish:'fabric'}));
    return parts;
  }
  if (id === 'webcam') {
    const parts=[box([0,.55,0],[.76,.46,.50],color,{radius:.16,finish:'soft-plastic'}),cyl([0,.56,-.29],[.26,.06,.26],PALETTE.black,{rotation:[90,0,0],finish:'glass'}),cyl([0,.56,-.33],[.13,.022,.13],'#27536a',{rotation:[90,0,0],finish:'glass',emissive:'#0b4b69'}),torus([0,.56,-.35],[.15,.010,.15],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),tube([[0,.34,0],[0,.14,.12]],.035,PALETTE.graphite,{finish:'plastic'}),box([0,.07,.18],[.64,.07,.34],PALETTE.graphite,{radius:.03,finish:'rubber'})];
    for(let i=0;i<8;i++)parts.push(box([-.26+i*.075,.30,-.25],[.04,.012,.008],PALETTE.graphite,{radius:.002,finish:'rubber'}));for(const x of [-.26,.26])parts.push(cyl([x,.32,-.28],[.018,.010,.018],x<0?'#4ade80':'#ef6a55',{rotation:[90,0,0],finish:'glass',emissive:x<0?'#166534':'#991b1b'}));for(let i=0;parts.length<18;i++)parts.push(cyl([0,.08,-.02],[.012,.008,.012],PALETTE.silver,{finish:'metal'}));return parts;
  }
  if (id === 'single-serve-coffee') {
    const parts=[box([0,.50,.12],[.66,.90,.52],PALETTE.graphite,{radius:.10,finish:'plastic'}),box([0,.80,.18],[.58,.25,.48],PALETTE.glass,{radius:.05,finish:'glass',opacity:.30}),box([0,.50,-.30],[.46,.24,.10],PALETTE.black,{radius:.05,finish:'plastic'}),cyl([0,.47,-.38],[.10,.10,.10],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([0,.15,-.06],[.60,.10,.58],PALETTE.graphite,{radius:.04,finish:'metal'}),box([0,.18,-.22],[.36,.06,.30],PALETTE.black,{radius:.04,finish:'plastic'})];
    for(let i=0;i<5;i++)parts.push(cyl([-.18+i*.09,.62,-.32],[.030,.012,.030],i===4?'#e76c52':PALETTE.silver,{rotation:[90,0,0],finish:'plastic'}));for(let i=0;i<8;i++)parts.push(box([-.22+i*.062,.86,-.14],[.035,.010,.010],PALETTE.graphite,{radius:.002,finish:'rubber'}));return parts;
  }
  if (id === 'mini-griddle') {
    const parts=[box([0,.20,0],[.94,.24,.90],PALETTE.graphite,{radius:.06,finish:'metal'}),box([0,.34,0],[.86,.06,.82],PALETTE.black,{radius:.04,finish:'nonstick'}),box([.32,.26,-.42],[.20,.12,.03],PALETTE.graphite,{radius:.02,finish:'plastic'})];
    for(let i=0;i<10;i++)parts.push(box([-.30+i*.067,.35,-.34],[.042,.010,.014],PALETTE.graphite,{radius:.003,finish:'metal'}));for(const x of [-.37,.37])for(const z of [-.32,.32])parts.push(cyl([x,.05,z],[.045,.05,.045],PALETTE.black,{finish:'rubber'}));for(let i=0;i<3;i++)parts.push(cyl([.23+i*.07,.34,-.42],[.025,.012,.025],['#ef6a55','#e6a43c','#50a96c'][i],{rotation:[90,0,0],finish:'glass'}));return parts;
  }
  if (id === 'dish-rack') {
    const parts=[box([0,.08,0],[.94,.10,.82],PALETTE.graphite,{radius:.025,finish:'metal'}),box([0,.12,.08],[.86,.04,.64],PALETTE.black,{radius:.016,finish:'plastic'})];
    for(let i=0;i<10;i++){const x=-.34+i*.075;parts.push(tube([[x,.14,-.26],[x,.62,-.14],[x,.14,.24]],.018,PALETTE.silver,{finish:'metal'}));}
    for(let i=0;i<5;i++)parts.push(box([-.32+i*.16,.22,.28],[.10,.20,.12],['#e5e9eb','#d7e5ee'][i%2],{radius:.025,finish:'ceramic'}));for(const x of [-.36,.36])for(const z of [-.28,.28])parts.push(cyl([x,.03,z],[.035,.035,.035],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'gym-bag') {
    const parts=[P('capsule',[0,.40,0],[.94,.58,.62],color,{rotation:[0,0,90],finish:'fabric'}),box([0,.44,-.34],[.64,.06,.025],PALETTE.graphite,{radius:.012,finish:'zipper'}),torus([-.25,.78,0],[.34,.22,.14],PALETTE.graphite,{rotation:[0,90,0],finish:'fabric'}),torus([.25,.78,0],[.34,.22,.14],PALETTE.graphite,{rotation:[0,90,0],finish:'fabric'}),box([-.47,.38,0],[.12,.28,.36],PALETTE.graphite,{radius:.05,finish:'fabric'}),box([.47,.38,0],[.12,.28,.36],PALETTE.graphite,{radius:.05,finish:'fabric'})];
    for(let i=0;i<12;i++)parts.push(cyl([-.27+i*.05,.44,-.37],[.012,.012,.012],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));for(const x of [-.34,.34])for(const z of [-.23,.23])parts.push(cyl([x,.10,z],[.035,.030,.035],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'coat-rack') {
    const parts=[cyl([0,.04,0],[.50,.08,.50],PALETTE.graphite,{finish:'metal'}),cyl([0,.53,0],[.055,.96,.055],PALETTE.woodDark,{finish:'wood'}),cyl([0,.90,0],[.14,.12,.14],PALETTE.woodDark,{finish:'wood'})];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(tube([[0,.78,0],[Math.cos(a)*.30,.88,Math.sin(a)*.30],[Math.cos(a)*.38,.80,Math.sin(a)*.38]],.028,PALETTE.woodDark,{finish:'wood'}),cyl([Math.cos(a)*.39,.78,Math.sin(a)*.39],[.06,.10,.06],PALETTE.wood,{finish:'wood'}));}return parts;
  }
  if (id === 'overdoor-rack') {
    const parts=[box([0,.54,.06],[.82,.90,.08],PALETTE.graphite,{radius:.02,finish:'metal'}),box([0,.96,.12],[.68,.08,.20],PALETTE.silver,{radius:.02,finish:'metal'}),box([0,.10,.12],[.68,.08,.20],PALETTE.silver,{radius:.02,finish:'metal'})];
    for(let i=0;i<6;i++){const x=-.32+i*.128;parts.push(tube([[x,.64,-.10],[x,.45,-.28],[x,.26,-.20]],.020,PALETTE.silver,{finish:'metal'}),cyl([x,.24,-.20],[.045,.08,.045],PALETTE.graphite,{finish:'rubber'}));}for(const y of [.22,.78])parts.push(box([0,y,-.01],[.72,.04,.06],PALETTE.silver,{radius:.008,finish:'metal'}));parts.push(cyl([0,.96,-.13],[.035,.035,.035],PALETTE.silver,{finish:'metal'}));return parts;
  }
  if (id === 'tissue-box') {
    const parts=[box([0,.28,0],[.94,.46,.82],color,{radius:.10,finish:'paper'}),box([0,.52,0],[.72,.035,.48],PALETTE.white,{radius:.035,finish:'paper'}),torus([0,.54,0],[.24,.035,.16],PALETTE.white,{rotation:[90,0,0],finish:'paper'})];
    for(let i=0;i<10;i++){const x=(i%5-.5)*.11,z=(Math.floor(i/5)-.5)*.14;parts.push(box([x,.58+i*.012,z],[.12,.11,.10],PALETTE.white,{radius:.025,rotation:[0,(i%3-1)*8,0],finish:'paper'}));}for(const x of [-.35,.35])for(const z of [-.28,.28])parts.push(cyl([x,.05,z],[.035,.025,.035],PALETTE.black,{finish:'rubber'}));parts.push(box([0,.08,-.42],[.26,.018,.012],PALETTE.silver,{radius:.003,finish:'paper'}));return parts;
  }
  if (id === 'paper-towel-holder') {
    const parts=[cyl([0,.04,0],[.68,.08,.68],PALETTE.graphite,{finish:'metal'}),cyl([0,.50,0],[.08,.90,.08],PALETTE.silver,{finish:'metal'}),cyl([0,.50,0],[.58,.72,.58],PALETTE.paper,{finish:'paper'}),torus([0,.86,0],[.58,.035,.58],PALETTE.paper,{rotation:[90,0,0],finish:'paper'}),box([.38,.14,0],[.20,.08,.16],PALETTE.graphite,{radius:.03,finish:'metal'})];
    for(let i=0;i<12;i++)parts.push(torus([0,.20+i*.052,0],[.59,.006,.59],i%2?PALETTE.paper:'#e5e0d6',{rotation:[90,0,0],finish:'paper'}));for(let i=0;i<3;i++)parts.push(cyl([Math.cos(i*2.09)*.36,.08,Math.sin(i*2.09)*.36],[.025,.018,.025],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'rice-cooker' || id === 'air-fryer' || id === 'ice-maker') {
    const fryer=id==='air-fryer', ice=id==='ice-maker',parts=[box([0,.47,0],[.92,.86,.88],color,{radius:.16,finish:'plastic'}),box([0,.54,-.46],[fryer?.70:.76,fryer?.46:.58,.025],PALETTE.graphite,{radius:.06,finish:'plastic'}),box([0,.72,-.48],[.34,.10,.012],'#173647',{radius:.012,finish:'screen',emissive:'#0b4b69'})];
    if(fryer){parts.push(box([0,.27,-.48],[.68,.24,.14],PALETTE.graphite,{radius:.06,finish:'metal'}),box([0,.16,-.50],[.32,.05,.06],PALETTE.silver,{radius:.02,finish:'metal'}));}
    else if(ice){parts.push(box([0,.37,-.48],[.54,.25,.035],PALETTE.graphite,{radius:.08,finish:'plastic'}),box([0,.64,-.48],[.48,.12,.018],PALETTE.glass,{radius:.018,finish:'glass',opacity:.34}));}
    else{parts.push(torus([0,.90,0],[.70,.08,.70],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),cyl([0,.91,0],[.50,.07,.50],PALETTE.graphite,{finish:'plastic'}),cyl([0,.98,0],[.10,.06,.10],PALETTE.silver,{finish:'metal'}));}
    for(let i=0;i<10;i++)parts.push(cyl([-.24+i*.054,.58,-.49],[.022,.012,.022],i===9?'#ef6e53':PALETTE.silver,{rotation:[90,0,0],finish:'plastic'}));for(const x of [-.34,.34])for(const z of [-.30,.30])parts.push(cyl([x,.05,z],[.04,.04,.04],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'ceramic-vase') {
    // A deliberately stepped ceramic profile reads as a hollow vessel rather
    // than a stack of unrelated primitive shapes.
    const parts=[P('lathe',[0,.43,0],[.78,.82,.78],color,{profile:[[.22,-.50],[.45,-.46],[.58,-.28],[.47,-.08],[.40,.18],[.25,.42],[.28,.50]],smoothProfile:true,finish:'ceramic'})];
    parts.push(torus([0,.86,0],[.28,.045,.28],'#e8edf0',{rotation:[90,0,0],finish:'ceramic'}),cyl([0,.07,0],[.38,.05,.38],color,{finish:'ceramic'}));
    for(let i=0;i<16;i++)parts.push(torus([0,.18+i*.038,0],[.48-(i%4)*.035,.010,.48-(i%4)*.035],i%3?color:'#dce5e8',{rotation:[90,0,0],finish:'ceramic'}));return parts;
  }
  if (id === 'candle') {
    const parts=[
      cyl([0,.39,0],[.80,.72,.80],'#f4f0e8',{finish:'ceramic'}),
      cyl([0,.055,0],[.70,.07,.70],PALETTE.graphite,{finish:'rubber'}),
      cyl([0,.75,0],[.70,.075,.70],'#f3dfbd',{finish:'wax'}),
      cyl([0,.79,0],[.84,.060,.84],'#e6dfd3',{finish:'ceramic'}),
      cyl([0,.86,0],[.025,.15,.025],'#5b4636',{finish:'fiber'}),
      sphere([0,.975,0],[.085,.15,.085],'#ffbf66',{finish:'glass',emissive:'#d4711e'}),
      box([0,.43,-.405],[.50,.33,.026],'#d7b56d',{radius:.018,finish:'paper'}),
      box([0,.51,-.421],[.28,.022,.010],'#8f5d35',{radius:.003,finish:'ink'}),
      box([0,.43,-.421],[.23,.022,.010],'#8f5d35',{radius:.003,finish:'ink'}),
      box([0,.35,-.421],[.18,.022,.010],'#8f5d35',{radius:.003,finish:'ink'}),
    ];
    for(const x of [-.21,.21])for(const y of [.33,.53])parts.push(box([x,y,-.423],[.030,.030,.014],PALETTE.woodDark,{radius:.004,finish:'ink'}));
    for(const x of [-.24,.24])for(const z of [-.24,.24])parts.push(cyl([x,.028,z],[.025,.030,.025],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'desk-sculpture') {
    const parts=[box([0,.08,0],[.72,.12,.66],PALETTE.graphite,{radius:.03,finish:'stone'}),torus([0,.48,0],[.68,.10,.68],color,{rotation:[22,32,0],finish:'painted-metal'}),torus([0,.55,0],[.48,.09,.48],PALETTE.amber,{rotation:[-26,0,24],finish:'painted-metal'}),sphere([0,.58,0],[.18,.18,.18],PALETTE.silver,{finish:'mirror'}),cyl([0,.24,0],[.05,.30,.05],PALETTE.silver,{finish:'metal'})];
    for(let i=0;i<13;i++){const a=i*Math.PI*2/13;parts.push(cyl([Math.cos(a)*.29,.15,Math.sin(a)*.25],[.018,.035,.018],i%2?PALETTE.silver:PALETTE.amber,{finish:'metal'}));}for(const x of [-.24,.24])for(const z of [-.20,.20])parts.push(cyl([x,.025,z],[.03,.025,.03],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'neon-sign') {
    const parts=[
      box([0,.50,.05],[.96,.74,.58],PALETTE.graphite,{radius:.05,finish:'painted-metal'}),
      box([0,.50,-.27],[.86,.58,.045],'#102537',{radius:.025,finish:'glass'}),
      box([0,.50,-.305],[.74,.47,.020],'#182e44',{radius:.018,finish:'glass'}),
      box([-.30,.62,-.325],[.18,.065,.035],'#f472b6',{radius:.024,finish:'glass',emissive:'#be185d'}),
      box([-.21,.54,-.325],[.065,.20,.035],'#f472b6',{radius:.024,finish:'glass',emissive:'#be185d'}),
      box([-.12,.62,-.325],[.18,.065,.035],'#f472b6',{radius:.024,finish:'glass',emissive:'#be185d'}),
      box([.09,.62,-.325],[.065,.20,.035],'#60a5fa',{radius:.024,finish:'glass',emissive:'#1d4ed8'}),
      box([.20,.69,-.325],[.16,.060,.035],'#60a5fa',{radius:.024,finish:'glass',emissive:'#1d4ed8'}),
      box([.20,.55,-.325],[.16,.060,.035],'#60a5fa',{radius:.024,finish:'glass',emissive:'#1d4ed8'}),
      box([.20,.41,-.325],[.16,.060,.035],'#60a5fa',{radius:.024,finish:'glass',emissive:'#1d4ed8'}),
      box([.09,.48,-.325],[.065,.20,.035],'#60a5fa',{radius:.024,finish:'glass',emissive:'#1d4ed8'}),
      box([-.30,.35,-.325],[.40,.030,.020],'#f9d86b',{radius:.010,finish:'glass',emissive:'#c78b21'}),
    ];
    for(const x of [-.42,.42])for(const y of [.22,.78])parts.push(cyl([x,y,.30],[.028,.040,.028],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(box([-.33+i*.22,.18,-.326],[.08,.018,.018],i%2?'#60a5fa':'#f472b6',{radius:.004,finish:'glass',emissive:i%2?'#1d4ed8':'#be185d'}));
    return parts;
  }
  if (/trash-can/.test(id)) {
    const tall=id.includes('tall'),parts=[cyl([0,.42,0],[tall?.66:.74,tall?.82:.74,tall?.66:.74],color,{finish:'plastic'}),cyl([0,.86,0],[tall?.70:.78,.10,tall?.70:.78],PALETTE.graphite,{finish:'plastic'}),torus([0,.83,0],[tall?.66:.74,.025,tall?.66:.74],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),box([0,.95,-.28],[.24,.06,.10],PALETTE.graphite,{radius:.02,finish:'rubber'})];
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(box([Math.cos(a)*.68,.38,Math.sin(a)*.68],[.018,.60,.018],i%2?color:'#8ba0ac',{radius:.004,rotation:[0,-i*30,0],finish:'plastic'}));}for(const x of [-.34,.34])for(const z of [-.28,.28])parts.push(cyl([x,.05,z],[.045,.045,.045],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'fruit-basket') {
    const parts=[P('lathe',[0,.30,0],[.92,.58,.92],PALETTE.graphite,{profile:[[.18,-.50],[.32,-.46],[.47,-.20],[.54,.08],[.50,.25]],smoothProfile:true,finish:'metal'}),cyl([0,.06,0],[.34,.04,.34],PALETTE.graphite,{finish:'metal'}),cyl([0,.27,0],[.46,.020,.46],PALETTE.graphite,{finish:'metal'})];
    for(let i=0;i<16;i++){const a=i*2.399,r=.08+(i%4)*.105,y=.27+(i%4)*.025;const c=['#db5c4d','#e3a63d','#74a45a'][i%3];parts.push(sphere([Math.cos(a)*r,y,Math.sin(a)*r],[.12,.105,.12],c,{finish:'fruit'}));if(i%3===0)parts.push(tube([[Math.cos(a)*r,y+.10,Math.sin(a)*r],[Math.cos(a)*r*.88,y+.17,Math.sin(a)*r*.88]],.010,PALETTE.leafDark,{finish:'plant'}));}
    return parts;
  }
  if (id === 'mop-bucket') {
    const parts=[
      box([0,.31,0],[.94,.52,.76],color,{radius:.095,finish:'plastic'}),
      box([-.18,.58,0],[.52,.12,.54],PALETTE.black,{radius:.028,finish:'plastic'}),
      box([-.18,.65,0],[.46,.025,.48],'#315d76',{radius:.014,finish:'water',opacity:.48}),
      box([.28,.48,0],[.32,.36,.56],PALETTE.graphite,{radius:.026,finish:'plastic'}),
      box([.28,.68,0],[.28,.035,.48],PALETTE.black,{radius:.016,finish:'rubber'}),
      box([0,.60,-.40],[.86,.055,.040],color,{radius:.012,finish:'plastic'}),
      box([0,.60,.40],[.86,.055,.040],color,{radius:.012,finish:'plastic'}),
      tube([[-.38,.54,-.26],[-.52,.74,0],[-.38,.54,.26]],.030,PALETTE.graphite,{finish:'metal'}),
      box([-.47,.32,0],[.06,.20,.26],PALETTE.graphite,{radius:.018,finish:'plastic'}),
      cyl([-.47,.32,-.16],[.035,.012,.035],'#ef6a55',{rotation:[90,0,0],finish:'glass',emissive:'#991b1b'}),
    ];
    for(let i=0;i<9;i++)parts.push(box([.16+i*.030,.70,-.20],[.014,.22,.30],PALETTE.silver,{radius:.003,finish:'metal'}));
    for(let i=0;i<5;i++)parts.push(box([.28,.71,-.18+i*.09],[.22,.015,.032],PALETTE.silver,{radius:.003,finish:'metal'}));
    for(const x of [-.35,.35])for(const z of [-.26,.26])parts.push(cyl([x,.06,z],[.07,.06,.07],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));return parts;
  }
  if (id === 'cleaning-caddy') {
    const parts=[box([0,.18,0],[.96,.30,.76],color,{radius:.05,finish:'plastic'}),box([-.25,.43,0],[.34,.28,.68],color,{radius:.04,finish:'plastic'}),box([.25,.43,0],[.34,.28,.68],color,{radius:.04,finish:'plastic'}),torus([0,.63,0],[.44,.34,.18],PALETTE.graphite,{rotation:[90,0,0],finish:'plastic'})];
    for(const [x,z,c] of [[-.24,-.08,'#3c88b0'],[-.20,.18,'#e6a53d'],[.23,-.08,'#4c9e5c'],[.20,.19,'#d45d50']])parts.push(cyl([x,.62,z],[.11,.46,.11],c,{finish:'plastic'}));for(let i=0;i<8;i++)parts.push(box([-.34+i*.10,.12,-.39],[.045,.028,.018],PALETTE.graphite,{radius:.004,finish:'rubber'}));return parts;
  }
  if (/laundry-basket|folding-hamper|laundry-hamper/.test(id)) {
    const tall=/folding|hamper/.test(id),fabric=color||'#b9cbd4',parts=[box([0,.42,0],[.90,tall?.92:.70,.84],fabric,{radius:.12,finish:'fabric'}),torus([0,tall?.86:.72,0],[.82,.045,.76],'#d8e2e7',{rotation:[90,0,0],finish:'plastic'})];
    // Repeated woven straps read as a laundry hamper; the prior dark grille
    // resembled an appliance intake from every front-facing camera.
    for(let row=0;row<4;row++)for(let col=0;col<7;col++)parts.push(box([-.30+col*.10,.22+row*(tall?.16:.12),-.43],[.058,.045,.015],(row+col)%2?'#d9e4e8':'#93adb9',{radius:.010,finish:'woven'}));
    for(const x of [-.34,.34])parts.push(tube([[x,tall?.73:.58,-.31],[x,tall?.92:.78,0],[x,tall?.73:.58,.31]],.023,PALETTE.graphite,{finish:'fabric'}));
    if(id==='laundry-hamper'){
      parts.push(box([0,.89,0],[.66,.10,.56],'#d7e0e4',{radius:.055,finish:'fabric'}));
      for(const [x,z,c] of [[-.18,-.12,'#a85c52'],[.04,-.12,'#557b9d'],[.20,.13,'#7b9563']])parts.push(box([x,.91,z],[.24,.10,.22],c,{radius:.055,rotation:[0,0,x*12],finish:'fabric'}));
      parts.push(box([0,.46,-.455],[.38,.20,.014],'#b5c9d3',{radius:.015,finish:'fabric'}));
      parts.push(box([0,.47,-.468],[.22,.030,.010],PALETTE.graphite,{radius:.004,finish:'thread'}));
    }
    for(const x of [-.34,.34])for(const z of [-.30,.30])parts.push(cyl([x,.035,z],[.040,.035,.040],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'headphone-stand') {
    const parts=[
      box([0,.055,0],[.66,.10,.58],PALETTE.graphite,{radius:.04,finish:'metal'}),
      cyl([0,.40,.13],[.045,.68,.045],PALETTE.silver,{finish:'metal'}),
      box([0,.74,.12],[.20,.10,.18],PALETTE.graphite,{radius:.045,finish:'rubber'}),
      tube([[-.28,.70,0],[-.30,.88,0],[-.18,.99,0],[0,1.02,0],[.18,.99,0],[.30,.88,0],[.28,.70,0]],.042,PALETTE.graphite,{finish:'soft-plastic'}),
      box([-.30,.64,0],[.18,.27,.18],PALETTE.black,{radius:.075,finish:'soft-plastic'}),
      box([.30,.64,0],[.18,.27,.18],PALETTE.black,{radius:.075,finish:'soft-plastic'}),
      box([-.30,.64,-.10],[.12,.16,.025],'#516674',{radius:.030,finish:'fabric'}),
      box([.30,.64,-.10],[.12,.16,.025],'#516674',{radius:.030,finish:'fabric'}),
      tube([[-.22,.78,0],[-.28,.72,0]],.020,PALETTE.silver,{finish:'metal'}),
      tube([[.22,.78,0],[.28,.72,0]],.020,PALETTE.silver,{finish:'metal'}),
      tube([[0,.12,.13],[0,.57,.13],[0,.76,.10]],.025,PALETTE.graphite,{finish:'metal'}),
    ];
    for(const x of [-.24,.24])parts.push(box([x,.04,0],[.10,.05,.38],PALETTE.black,{radius:.018,finish:'rubber'}));
    for(let i=0;i<6;i++){const a=i*Math.PI/3;parts.push(cyl([Math.cos(a)*.25,.105,Math.sin(a)*.20],[.014,.014,.014],PALETTE.silver,{finish:'metal'}));}
    return parts;
  }
  if (id === 'phone-stand') {
    const parts=[
      box([0,.055,0],[.70,.10,.62],PALETTE.graphite,{radius:.040,finish:'metal'}),
      box([0,.16,-.14],[.48,.08,.22],PALETTE.graphite,{radius:.028,finish:'rubber'}),
      tube([[-.24,.11,.16],[-.24,.48,.10],[-.17,.72,.02]],.025,PALETTE.silver,{finish:'metal'}),
      tube([[.24,.11,.16],[.24,.48,.10],[.17,.72,.02]],.025,PALETTE.silver,{finish:'metal'}),
      box([0,.54,0],[.54,.78,.075],PALETTE.black,{radius:.060,rotation:[-14,0,0],finish:'glass'}),
      box([0,.56,-.055],[.46,.64,.012],'#183d55',{radius:.035,rotation:[-14,0,0],finish:'screen',emissive:'#0b4260'}),
      box([0,.79,-.070],[.16,.018,.010],PALETTE.black,{radius:.005,rotation:[-14,0,0],finish:'plastic'}),
      cyl([0,.33,-.071],[.030,.010,.030],PALETTE.white,{rotation:[90,-14,0],finish:'plastic'}),
      box([0,.20,-.20],[.42,.035,.065],PALETTE.silver,{radius:.012,finish:'metal'}),
    ];
    for(const x of [-.28,.28])for(const z of [-.22,.22])parts.push(cyl([x,.035,z],[.030,.025,.030],PALETTE.black,{finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(box([-.18+i*.072,.39,-.071],[.040,.010,.008],i%2?'#5ca8c8':'#85d1ea',{radius:.003,rotation:[-14,0,0],finish:'screen',emissive:'#0b4260'}));
    return parts;
  }
  if (id === 'headphones') {
    const parts=[torus([0,.58,0],[.74,.18,.70],PALETTE.graphite,{rotation:[90,0,0],finish:'soft-plastic'}),box([-.38,.34,0],[.24,.36,.34],PALETTE.black,{radius:.11,finish:'fabric'}),box([.38,.34,0],[.24,.36,.34],PALETTE.black,{radius:.11,finish:'fabric'}),box([-.38,.34,-.19],[.16,.22,.025],PALETTE.silver,{radius:.04,finish:'metal'}),box([.38,.34,-.19],[.16,.22,.025],PALETTE.silver,{radius:.04,finish:'metal'})];
    for(const x of [-.38,.38]){parts.push(torus([x,.34,-.21],[.15,.035,.15],'#516674',{rotation:[90,0,0],finish:'fabric'}));for(let i=0;i<4;i++)parts.push(box([x-.07+i*.045,.56,-.03],[.02,.12,.02],PALETTE.silver,{radius:.003,finish:'metal'}));}
    for(const x of [-.38,.38])parts.push(cyl([x,.52,-.22],[.018,.012,.018],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));for(let i=0;parts.length<18;i++)parts.push(cyl([0,.72,-.12],[.014,.010,.014],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if (id === 'mic-stand') {
    const parts=[cyl([0,.04,0],[.60,.08,.60],PALETTE.graphite,{finish:'metal'}),tube([[0,.08,0],[0,.72,0],[.20,.88,0]],.026,PALETTE.silver,{finish:'metal'}),P('capsule',[.25,.91,0],[.16,.24,.16],PALETTE.black,{rotation:[0,0,-42],finish:'metal'}),box([.24,.83,0],[.22,.045,.18],PALETTE.graphite,{radius:.015,finish:'metal'})];
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;parts.push(tube([[0,.08,0],[Math.cos(a)*.45,.02,Math.sin(a)*.45]],.018,PALETTE.graphite,{finish:'metal'}));}
    for(let i=0;i<10;i++)parts.push(box([.16+i*.018,.92,-.09],[.012,.13,.012],PALETTE.silver,{radius:.002,rotation:[0,0,-42],finish:'metal'}));parts.push(cyl([.19,.84,-.10],[.022,.012,.022],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if (id === 'music-stand') {
    const parts=[cyl([0,.04,0],[.64,.08,.64],PALETTE.graphite,{finish:'metal'}),tube([[0,.06,0],[0,.58,0]],.026,PALETTE.silver,{finish:'metal'}),box([0,.76,0],[.74,.38,.07],PALETTE.graphite,{radius:.024,rotation:[-12,0,0],finish:'metal'}),box([0,.56,-.10],[.80,.07,.14],PALETTE.graphite,{radius:.018,finish:'metal'})];
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;parts.push(tube([[0,.06,0],[Math.cos(a)*.47,.02,Math.sin(a)*.47]],.018,PALETTE.graphite,{finish:'metal'}));}
    for(let r=0;r<5;r++)for(let c=0;c<2;c++)parts.push(box([-.24+c*.48,.62+r*.07,-.055],[.16,.012,.010],PALETTE.silver,{radius:.002,rotation:[-12,0,0],finish:'metal'}));parts.push(cyl([0,.54,-.08],[.022,.012,.022],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if (/resistance-bands|jump-rope/.test(id)) {
    const rope=id.includes('jump'),parts=[];
    const paths=rope?[[[-.38,.20,0],[-.15,.75,.18],[.15,.75,-.18],[.38,.20,0]]]:[[[-.40,.24,0],[-.22,.70,.16],[.18,.66,-.16],[.40,.24,0]],[[-.34,.22,.08],[-.12,.56,.24],[.12,.54,-.24],[.34,.22,-.08]]];
    for(const path of paths)parts.push(tube(path,.030,rope?'#4db8b0':'#37b9a8',{finish:'rubber'}));
    for(const x of [-.42,.42]){parts.push(box([x,.18,0],[.14,.28,.14],PALETTE.graphite,{radius:.04,finish:'rubber'}));for(let i=0;i<5;i++)parts.push(box([x-.05+i*.025,.18,-.08],[.012,.18,.008],PALETTE.silver,{radius:.002,finish:'metal'}));}
    while(parts.length<18)parts.push(cyl([parts.length%2?-.42:.42,.16,0],[.012,.010,.012],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if (id === 'massage-gun') {
    const parts=[box([0,.60,0],[.55,.34,.72],color,{radius:.10,finish:'soft-plastic'}),box([0,.27,.12],[.20,.50,.25],PALETTE.graphite,{radius:.08,finish:'rubber'}),cyl([0,.61,-.46],[.12,.28,.12],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),sphere([0,.61,-.66],[.24,.24,.24],PALETTE.black,{finish:'foam'}),box([0,.68,-.37],[.26,.10,.018],'#17384a',{radius:.01,finish:'screen',emissive:'#0b4b69'})];
    for(let i=0;i<4;i++)parts.push(cyl([-.16+i*.105,.52,-.37],[.032,.014,.032],i===3?'#ef6e53':PALETTE.silver,{rotation:[90,0,0],finish:'plastic'}));for(let i=0;i<10;i++)parts.push(box([-.20+i*.045,.76,-.37],[.025,.010,.010],PALETTE.graphite,{radius:.002,finish:'rubber'}));return parts;
  }
  if (id === 'folding-bike') {
    const parts=[];for(const x of [-.34,.34]){parts.push(cyl([x,.20,0],[.34,.07,.34],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}),cyl([x,.20,0],[.22,.08,.22],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));}
    parts.push(tube([[-.34,.22,0],[-.08,.56,0],[.28,.27,0],[-.34,.22,0]],.028,'#3b8990',{finish:'painted-metal'}),tube([[-.08,.56,0],[.10,.75,0],[.20,.75,0]],.024,PALETTE.silver,{finish:'metal'}),box([.22,.78,0],[.28,.07,.18],PALETTE.black,{radius:.05,finish:'rubber'}),tube([[-.08,.56,0],[-.20,.78,0],[-.32,.82,0]],.022,PALETTE.silver,{finish:'metal'}),box([-.35,.83,0],[.16,.05,.36],PALETTE.graphite,{radius:.022,finish:'rubber'}),cyl([-.08,.42,-.06],[.08,.58,.08],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}));
    for(const x of [-.08,.08])parts.push(box([x,.42,-.06],[.22,.035,.08],PALETTE.graphite,{radius:.018,finish:'rubber'}));for(let i=0;i<7;i++)parts.push(cyl([-.34+i*.11,.20,-.04],[.012,.020,.012],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));return parts;
  }
  if (id === 'exercise-ball') {
    const parts=[sphere([0,.49,0],[.96,.96,.96],color,{finish:'rubber'})];
    for(let i=-3;i<=3;i++)parts.push(torus([0,.49+i*.09,0],[.93-i*i*.018,.018,.93-i*i*.018],i%2?'#0f766e':'#115e59',{rotation:[90,0,0],finish:'rubber'}));
    parts.push(cyl([0,.93,0],[.025,.025,.025],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if (id === 'snow-globe') {
    const parts=[cyl([0,.12,0],[.72,.24,.72],PALETTE.woodDark,{finish:'wood'}),torus([0,.23,0],[.72,.08,.72],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),sphere([0,.58,0],[.78,.70,.78],PALETTE.glass,{finish:'glass',opacity:.23})];
    parts.push(P('cone',[0,.48,0],[.38,.46,.38],PALETTE.green,{finish:'plant'}),cyl([0,.30,0],[.09,.20,.09],PALETTE.woodDark,{finish:'wood'}));
    for(let i=0;i<14;i++)parts.push(sphere([-.30+(i%7)*.10,.35+Math.floor(i/7)*.24,(i%3-.5)*.16],[.025,.025,.025],PALETTE.white,{finish:'glass'}));return parts;
  }
  if (id === 'terrarium') {
    const parts=[box([0,.50,0],[.96,.92,.92],PALETTE.glass,{radius:.018,finish:'glass',opacity:.24}),box([0,.13,0],[.90,.20,.84],'#5b4635',{radius:.01,finish:'soil'})];
    for(const y of [.04,.96])parts.push(box([0,y,0],[1,.06,.98],PALETTE.black,{radius:.012,finish:'metal'}));
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*.24,z=Math.sin(a)*.22;parts.push(tube([[x*.35,.20,z*.35],[x,.48+(i%3)*.12,z]],.014,PALETTE.leafDark,{finish:'plant'}));parts.push(sphere([x,.50+(i%3)*.12,z],[.20,.09,.13],i%2?PALETTE.leaf:PALETTE.leafDark,{rotation:[0,i*35,(i%3-1)*25],finish:'plant'}));}return parts;
  }
  if (id === 'ceramic-vase') return [cyl([0,.28,0],[.70,.48,.70],color,{finish:'ceramic'}),P('cone',[0,.59,0],[.66,.40,.66],color,{rotation:[180,0,0],finish:'ceramic'}),cyl([0,.82,0],[.30,.28,.30],color,{finish:'ceramic'}),torus([0,.96,0],[.34,.08,.34],'#dbe2e6',{rotation:[90,0,0],finish:'ceramic'}),cyl([0,.08,0],[.48,.08,.48],'#dbe2e6',{finish:'ceramic'})];
  if (id === 'desk-sculpture') return [box([0,.08,0],[.70,.12,.66],PALETTE.graphite,{radius:.03,finish:'stone'}),torus([0,.50,0],[.72,.18,.72],color,{rotation:[18,30,0],finish:'painted-metal'}),torus([0,.61,0],[.50,.15,.50],PALETTE.amber,{rotation:[-25,0,22],finish:'painted-metal'}),sphere([0,.62,0],[.20,.20,.20],PALETTE.silver,{finish:'mirror'}),cyl([0,.22,0],[.05,.25,.05],PALETTE.silver,{finish:'metal'})];
  if (/bed-canopy|mosquito-net/.test(id)) {
    const parts=[torus([0,.92,0],[.82,.035,.82],'#e6e2d8',{rotation:[90,0,0],finish:'metal'})];
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*.40,z=Math.sin(a)*.40;parts.push(tube([[0,1,0],[x,.90,z],[x*.96,.04,z*.96]],.006,'#e8e5dc',{finish:'thread'}));}
    for(const [x,z,r] of [[-.43,0,0],[.43,0,0],[0,-.43,90],[0,.43,90]])parts.push(box([x,.48,z],[.025,.86,.84],'#eef3f3',{radius:.005,rotation:[0,r,0],finish:'fabric',opacity:.24}));return parts;
  }
  if (id === 'folding-screen') {
    const parts=[];for(let i=0;i<3;i++){const x=-.32+i*.32,rot=(i-1)*7;parts.push(box([x,.53,0],[.30,.88,.10],i%2?'#d8c7ad':'#c9b79d',{radius:.018,rotation:[0,rot,0],finish:'fabric'}));parts.push(box([x,.53,-.06],[.26,.80,.025],i%2?'#6b8492':'#708b78',{radius:.008,rotation:[0,rot,0],finish:'fabric'}));if(i<2)for(const y of [.28,.74])parts.push(cyl([x+.16,.50+y-.50,0],[.035,.08,.035],PALETTE.silver,{finish:'metal'}));}return parts;
  }
  if (/^ring-light/.test(id)) return clockModel(id,color);
  if (id === 'tower-fan') {
    const parts=[cyl([0,.47,0],[.62,.88,.62],PALETTE.white,{finish:'plastic'}),cyl([0,.05,0],[.90,.10,.90],PALETTE.graphite,{finish:'plastic'}),box([0,.55,-.32],[.34,.60,.025],PALETTE.graphite,{radius:.12,finish:'plastic'}),box([0,.91,-.28],[.22,.08,.025],'#18394d',{radius:.018,finish:'screen',emissive:'#0e4b68'})];
    for(let i=0;i<16;i++)parts.push(box([0,.28+i*.033,-.34],[.26,.012,.018],'#89949c',{radius:.004,finish:'plastic'}));
    for(let i=0;i<4;i++)parts.push(cyl([-.09+i*.06,.94,-.18],[.025,.018,.025],PALETTE.graphite,{finish:'rubber'}));return parts;
  }
  if (id === 'air-purifier') {
    const parts=[box([0,.48,0],[.90,.92,.88],PALETTE.white,{radius:.18,finish:'plastic'}),torus([0,.89,0],[.65,.08,.65],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}),cyl([0,.90,0],[.42,.035,.42],PALETTE.black,{finish:'plastic'}),cyl([0,.91,-.18],[.07,.02,.07],'#57c7e8',{rotation:[90,0,0],finish:'glass',emissive:'#0ea5e9'})];
    for(let i=0;i<13;i++)parts.push(box([0,.16+i*.045,-.46],[.60,.015,.020],'#9aa3aa',{radius:.004,finish:'plastic'}));feet(parts,.30,.30,.025);return parts;
  }
  if (id === 'light-bar') return [cyl([0,.58,0],[.08,.90,.08],PALETTE.graphite,{rotation:[0,0,90],finish:'metal'}),box([0,.48,-.12],[.90,.12,.18],PALETTE.black,{radius:.04,finish:'plastic'}),box([0,.44,-.22],[.82,.035,.08],'#ffe1a3',{radius:.012,finish:'glass',emissive:'#f59e0b'}),...[-.35,.35].map(x=>box([x,.22,.10],[.08,.35,.20],PALETTE.graphite,{radius:.025,finish:'rubber'}))];
  if (id === 'led-strip-roll') return [cyl([0,.50,0],[.86,.20,.86],PALETTE.white,{finish:'plastic'}),torus([0,.50,-.12],[.84,.20,.84],'#e8f2f5',{rotation:[90,0,0],finish:'plastic'}),cyl([0,.50,-.23],[.25,.04,.25],PALETTE.graphite,{rotation:[90,0,0],finish:'plastic'}),tube([[.40,.48,-.10],[.50,.25,.05],[.42,.06,.28]],.025,PALETTE.white,{finish:'plastic'}),box([.34,.06,.30],[.30,.15,.34],PALETTE.white,{radius:.03,finish:'plastic'}),...['#ef4444','#22c55e','#3b82f6'].map((c,i)=>cyl([.25+i*.09,.07,.12],[.035,.025,.035],c,{rotation:[90,0,0],finish:'glass',emissive:c}))];
  if (id === 'yoga-blocks') return [box([-.24,.28,0],[.43,.50,.82],color,{radius:.07,rotation:[0,-5,0],finish:'foam'}),box([.24,.40,0],[.43,.50,.82],'#0f766e',{radius:.07,rotation:[0,6,0],finish:'foam'}),box([-.24,.57,-.42],[.24,.06,.025],'#d3e5e3',{finish:'ink'}),box([.24,.69,-.42],[.24,.06,.025],'#d3e5e3',{finish:'ink'})];
  if (id === 'step-platform') return [box([0,.66,0],[.96,.30,.88],PALETTE.graphite,{radius:.06,finish:'plastic'}),box([0,.84,0],[.90,.12,.82],color,{radius:.04,finish:'rubber'}),...[-.34,.34].flatMap(x=>[-.30,.30].map(z=>box([x,.25,z],[.20,.50,.20],PALETTE.black,{radius:.04,finish:'plastic'}))),...Array.from({length:7},(_,i)=>box([-.36+i*.12,.91,0],[.035,.025,.70],'#67737d',{radius:.006,finish:'rubber'}))];
  if (id === 'ab-roller') return [cyl([0,.48,0],[.66,.22,.66],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}),cyl([0,.48,0],[.36,.25,.36],color,{rotation:[90,0,0],finish:'plastic'}),cyl([0,.48,0],[.12,.92,.12],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),box([-.40,.48,0],[.30,.16,.20],PALETTE.graphite,{radius:.07,finish:'foam'}),box([.40,.48,0],[.30,.16,.20],PALETTE.graphite,{radius:.07,finish:'foam'})];
  if (id === 'ankle-weights') return [torus([-.24,.50,0],[.46,.34,.42],color,{rotation:[90,0,0],finish:'fabric'}),torus([.24,.50,0],[.46,.34,.42],'#334155',{rotation:[90,0,0],finish:'fabric'}),box([-.24,.50,-.25],[.35,.24,.10],PALETTE.black,{radius:.04,finish:'fabric'}),box([.24,.50,-.25],[.35,.24,.10],PALETTE.black,{radius:.04,finish:'fabric'}),...[-.34,-.14,.14,.34].map(x=>box([x,.50,-.31],[.06,.16,.04],PALETTE.silver,{radius:.01,finish:'metal'}))];
  if (id === 'balance-board') {
    const parts=[
      box([0,.48,0],[.98,.14,.78],color||PALETTE.wood,{radius:.065,finish:'wood'}),
      box([0,.565,0],[.84,.026,.64],PALETTE.graphite,{radius:.035,finish:'rubber'}),
      cyl([0,.31,0],[.50,.22,.50],PALETTE.graphite,{rotation:[0,0,90],finish:'rubber'}),
      cyl([0,.31,0],[.38,.235,.38],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}),
      box([-.43,.49,0],[.055,.13,.68],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([.43,.49,0],[.055,.13,.68],PALETTE.woodDark,{radius:.012,finish:'wood'}),
      box([0,.43,-.41],[.56,.055,.030],PALETTE.woodDark,{radius:.010,finish:'wood'}),
    ];
    for(let i=0;i<7;i++)parts.push(box([-.30+i*.10,.584,0],[.036,.010,.52],i%2?'#64737b':'#9aa6a8',{radius:.004,finish:'rubber'}));
    for(const x of [-.34,.34])for(const z of [-.24,.24])parts.push(cyl([x,.405,z],[.026,.020,.026],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'music-stand') return [cyl([0,.04,0],[.62,.08,.62],PALETTE.graphite,{finish:'metal'}),tube([[0,.06,0],[0,.56,0]],.028,PALETTE.silver,{finish:'metal'}),box([0,.76,0],[.76,.36,.08],color,{radius:.025,rotation:[-12,0,0],finish:'metal'}),box([0,.55,-.08],[.82,.06,.16],PALETTE.graphite,{radius:.018,finish:'metal'}),...[-.25,0,.25].map(x=>tube([[0,.05,0],[x,.02,.34]],.018,PALETTE.graphite,{finish:'metal'}))];
  if (id === 'violin-case') {
    const caseRing=(y,s)=>[[-.20*s,y,-.50*s],[.20*s,y,-.50*s],[.35*s,y,-.38*s],[.42*s,y,-.18*s],[.28*s,y,.02*s],[.20*s,y,.20*s],[.25*s,y,.38*s],[.18*s,y,.50*s],[-.18*s,y,.50*s],[-.25*s,y,.38*s],[-.20*s,y,.20*s],[-.28*s,y,.02*s],[-.42*s,y,-.18*s],[-.35*s,y,-.38*s]];
    const parts=[
      loft([0,0,0],[1,1,1],'#26313a',[caseRing(.04,.90),caseRing(.10,1),caseRing(.22,.98),caseRing(.27,.88)],{finish:'fabric'}),
      tube([[-.25,.26,-.30],[-.16,.30,-.38],[.16,.30,-.38],[.25,.26,-.30]],.022,'#b8c8d2',{finish:'rubber'}),
      tube([...caseRing(.275,.87),caseRing(.275,.87)[0]],.008,'#617984',{finish:'thread'}),
      box([-.26,.23,-.34],[.08,.045,.035],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([.26,.23,-.34],[.08,.045,.035],PALETTE.silver,{radius:.010,finish:'metal'}),
      box([-.34,.12,-.12],[.05,.055,.14],PALETTE.graphite,{radius:.012,finish:'rubber'}),
      box([.34,.12,-.12],[.05,.055,.14],PALETTE.graphite,{radius:.012,finish:'rubber'}),
    ];
    for(let i=0;i<7;i++)parts.push(box([-.25+i*.083,.275,-.42],[.040,.010,.012],'#a3bac6',{radius:.003,finish:'thread'}));
    for(const x of [-.28,.28])for(const z of [-.30,.34])parts.push(cyl([x,.025,z],[.034,.025,.034],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (id === 'pet-carrier') {
    const shell=color||'#74ad82',parts=[
      box([0,.45,0],[.94,.82,.90],shell,{radius:.11,finish:'plastic'}),
      box([0,.50,-.468],[.70,.60,.030],PALETTE.graphite,{radius:.035,finish:'metal'}),
      box([0,.50,-.488],[.60,.50,.012],PALETTE.black,{radius:.022,finish:'rubber'}),
      box([0,.17,-.505],[.18,.070,.022],PALETTE.silver,{radius:.012,finish:'metal'}),
      tube([[-.26,.84,0],[-.29,.99,0],[-.17,1.05,0],[.17,1.05,0],[.29,.99,0],[.26,.84,0]],.040,PALETTE.graphite,{finish:'soft-plastic'}),
      box([0,.86,-.01],[.46,.035,.28],'#5c915f',{radius:.015,finish:'plastic'}),
    ];
    for(let i=0;i<7;i++)parts.push(box([-.30+i*.10,.50,-.510],[.024,.48,.016],PALETTE.silver,{radius:.004,finish:'metal'}));
    for(const x of [-.38,.38])for(let i=0;i<4;i++)parts.push(box([x,.25+i*.15,.28],[.020,.060,.32],PALETTE.graphite,{radius:.004,finish:'rubber'}));
    for(let i=0;i<5;i++)parts.push(box([-.25+i*.125,.885,-.13],[.065,.012,.060],PALETTE.graphite,{radius:.004,finish:'rubber'}));
    for(const x of [-.34,.34])for(const z of [-.30,.30])parts.push(cyl([x,.035,z],[.040,.035,.040],PALETTE.black,{finish:'rubber'}));
    return parts;
  }
  if (/document-stand|book-stand|phone-stand|headphone-stand/.test(id)) {
    const phone=id.includes('phone'),head=id.includes('headphone');const parts=[box([0,.06,0],[.72,.10,.68],PALETTE.graphite,{radius:.035,finish:'rubber'}),tube([[0,.10,.16],[0,.55,.05],[0,.82,-.08]],head?.035:.025,PALETTE.silver,{finish:'metal'})];
    if(head)parts.push(torus([0,.84,-.08],[.54,.22,.32],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}));else{parts.push(box([0,.66,-.04],[phone?.50:.78,phone?.50:.54,.08],color,{radius:.025,rotation:[-12,0,0],finish:'metal'}));parts.push(box([0,.40,-.12],[phone?.46:.72,.07,.16],PALETTE.graphite,{radius:.018,finish:'rubber'}));}return parts;
  }
  if (id === 'pen-case') return [box([0,.46,0],[.96,.72,.84],color,{radius:.22,finish:'fabric'}),tube([[-.42,.74,-.38],[0,.82,-.42],[.42,.74,-.38]],.018,PALETTE.silver,{finish:'metal'}),box([.43,.73,-.38],[.08,.08,.12],PALETTE.silver,{radius:.02,finish:'metal'}),...[-.28,-.14,0,.14,.28].map(x=>box([x,.46,-.43],[.018,.42,.025],'#7e8f9d',{radius:.004,finish:'thread'}))];
  if (id === 'notebook') return [box([0,.42,0],[.96,.74,.90],color,{radius:.025,finish:'paper-cover'}),box([0,.39,-.47],[.84,.63,.025],PALETTE.paper,{radius:.008,finish:'paper'}),...Array.from({length:8},(_,i)=>cyl([-.45,.18+i*.075,-.48],[.035,.025,.035],PALETTE.silver,{rotation:[90,0,0],finish:'metal'})),box([.32,.42,-.49],[.05,.62,.018],'#d14f4a',{finish:'fabric'})];
  if (id === 'foam-roller') return bottleModel(id,color);
  if (id === 'vr-headset') {
    const parts=[
      loft([0,0,0],[1,1,1],color||'#d9e3e8',[mouseRing(.38,.42,.30,.34),mouseRing(.53,.46,.36,.40),mouseRing(.68,.44,.34,.39),mouseRing(.82,.32,.25,.30),mouseRing(.92,.16,.13,.18),mouseRing(.96,.025,.03,.04)],{finish:'soft-plastic'}),
      extrude([0,.58,-.355],[.72,.31,.06],PALETTE.black,[[-.50,-.28],[-.34,.24],[0,.34],[.34,.24],[.50,-.28],[.25,-.42],[-.25,-.42]],{smoothOutline:true,finish:'glass',bevel:.035}),
      box([0,.40,-.41],[.42,.055,.025],'#234e67',{radius:.010,finish:'glass',emissive:'#0b4b69'}),
      box([0,.74,-.41],[.28,.025,.025],'#d6e2e8',{radius:.006,finish:'plastic'}),
      torus([0,.61,.18],[.98,.085,.72],PALETTE.graphite,{rotation:[90,0,0],finish:'fabric'}),
      tube([[-.45,.57,.12],[-.67,.69,.15],[-.50,.90,.17],[0,.99,.18],[.50,.90,.17],[.67,.69,.15],[.45,.57,.12]],.045,PALETTE.graphite,{finish:'fabric'}),
      box([0,.28,.20],[.60,.12,.26],PALETTE.black,{radius:.08,finish:'foam'}),
      ...[-.25,.25].flatMap(x=>[cyl([x,.58,-.43],[.12,.035,.12],'#315b76',{rotation:[90,0,0],finish:'glass'}),torus([x,.58,-.45],[.13,.016,.13],PALETTE.silver,{rotation:[90,0,0],finish:'metal'})]),
    ];
    for(const x of [-.34,-.17,0,.17,.34])parts.push(box([x,.31,-.395],[.06,.018,.016],PALETTE.silver,{radius:.003,finish:'metal'}));
    parts.push(box([-.43,.53,-.28],[.06,.14,.06],PALETTE.graphite,{radius:.02,finish:'plastic'}),box([.43,.53,-.28],[.06,.14,.06],PALETTE.graphite,{radius:.02,finish:'plastic'}));
    return parts;
  }
  if (id === 'ironing-board') return [box([0,.78,0],[.96,.18,.70],color,{radius:.22,finish:'fabric'}),tube([[-.35,.68,-.20],[.32,.05,.20]],.025,PALETTE.silver,{finish:'metal'}),tube([[.35,.68,-.20],[-.32,.05,.20]],.025,PALETTE.silver,{finish:'metal'}),box([.37,.80,0],[.22,.08,.62],PALETTE.silver,{radius:.025,finish:'metal'}),...[-.31,.31].flatMap(x=>[-.18,.18].map(z=>cyl([x,.03,z],[.06,.06,.06],PALETTE.black,{finish:'rubber'})))];
  if (id === 'hanging-organizer') {
    const parts=[box([0,.52,.18],[.84,.92,.12],color,{radius:.02,finish:'fabric'}),tube([[-.34,.96,.18],[-.22,1,.18]],.016,PALETTE.silver,{finish:'metal'}),tube([[.34,.96,.18],[.22,1,.18]],.016,PALETTE.silver,{finish:'metal'})];
    for(let r=0;r<4;r++)for(let c=0;c<2;c++)parts.push(box([-.20+c*.40,.20+r*.20,-.02],[.34,.17,.30],'#8da0a9',{radius:.035,finish:'fabric'}));return parts;
  }
  return null;
}

function detailedDefault(id, color, category) {
  if(id==='pc-tower'){
    const parts=[
      box([0,.50,0],[.90,.96,.88],PALETTE.ink,{radius:.055,finish:'painted-metal'}),
      box([0,.51,-.458],[.66,.84,.024],'#111820',{radius:.028,finish:'glass',emissive:'#06131c'}),
      box([.462,.52,0],[.022,.80,.74],PALETTE.glass,{radius:.010,finish:'glass',opacity:.27}),
      box([-.39,.50,-.475],[.06,.86,.022],PALETTE.graphite,{radius:.008,finish:'metal'}),
      box([.39,.50,-.475],[.06,.86,.022],PALETTE.graphite,{radius:.008,finish:'metal'}),
      box([0,.93,-.475],[.60,.030,.018],PALETTE.silver,{radius:.006,finish:'brushed'}),
      cyl([.23,.88,-.486],[.055,.018,.055],PALETTE.silver,{rotation:[90,0,0],finish:'brushed'}),
      cyl([.34,.88,-.486],[.020,.012,.020],'#4ade80',{rotation:[90,0,0],finish:'glass',emissive:'#166534'}),
    ];
    for(const y of [.24,.49,.74]){parts.push(torus([0,y,-.480],[.25,.045,.25],'#38bdf8',{rotation:[90,0,0],finish:'emissive',emissive:'#0ea5e9'}),cyl([0,y,-.492],[.12,.022,.12],PALETTE.graphite,{rotation:[90,0,0],finish:'metal'}));}
    for(let i=0;i<9;i++)parts.push(box([-.25+i*.063,.09,-.475],[.038,.012,.014],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    for(const y of [.24,.49,.74])for(const [x,dy] of [[-.19,-.13],[.19,-.13],[-.19,.13],[.19,.13]])parts.push(cyl([x,y+dy,-.494],[.022,.012,.022],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(let i=0;i<12;i++)parts.push(box([-.30+i*.055,.982,0],[.026,.010,.58],i%2?PALETTE.graphite:'#222b34',{radius:.003,finish:'rubber'}));
    feet(parts,.35,.32,.025);return parts;
  }
  if(id==='mini-pc'){
    const parts=[box([0,.47,0],[.94,.78,.90],PALETTE.graphite,{radius:.12,finish:'anodized'}),box([0,.45,-.47],[.80,.42,.022],PALETTE.black,{radius:.03,finish:'plastic'}),cyl([0,.88,0],[.38,.035,.38],PALETTE.black,{finish:'rubber'}),torus([0,.90,0],[.39,.025,.39],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),cyl([-.30,.56,-.487],[.05,.018,.05],PALETTE.silver,{rotation:[90,0,0],finish:'brushed'}),box([-.08,.55,-.487],[.16,.08,.018],PALETTE.black,{radius:.010,finish:'rubber'}),box([.16,.55,-.487],[.16,.08,.018],PALETTE.black,{radius:.010,finish:'rubber'}),box([.31,.58,-.487],[.07,.13,.018],'#38bdf8',{radius:.008,finish:'screen',emissive:'#075985'})];
    for(let i=0;i<8;i++)parts.push(box([-.24+i*.07,.90,0],[.035,.012,.22],i%2?PALETTE.graphite:'#222b34',{radius:.003,finish:'rubber'}));
    for(let i=0;i<12;i++)parts.push(box([-.28+i*.051,.934,0],[.022,.008,.54],i%2?PALETTE.silver:PALETTE.graphite,{radius:.002,finish:'metal'}));
    for(let i=0;i<8;i++)parts.push(box([.478,.22+i*.07,0],[.012,.030,.56],PALETTE.black,{radius:.003,finish:'rubber'}));
    for(const [x,z] of [[-.28,-.28],[.28,-.28],[-.28,.28],[.28,.28]])parts.push(cyl([x,.945,z],[.018,.010,.018],PALETTE.silver,{finish:'metal'}));
    for(const x of [-.30,.30])for(const z of [-.28,.28])parts.push(cyl([x,.045,z],[.045,.060,.045],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if(id==='game-console'){
    const parts=[box([0,.49,0],[.62,.96,.55],PALETTE.ink,{radius:.065,finish:'painted-metal'}),box([0,.50,-.292],[.48,.84,.022],PALETTE.black,{radius:.025,finish:'glass',emissive:'#06111a'}),box([-.23,.50,-.305],[.05,.86,.018],color,{radius:.006,finish:'anodized'}),box([.23,.50,-.305],[.05,.86,.018],color,{radius:.006,finish:'anodized'}),cyl([-.11,.76,-.314],[.055,.018,.055],PALETTE.silver,{rotation:[90,0,0],finish:'brushed'}),cyl([.12,.76,-.314],[.025,.012,.025],'#4ade80',{rotation:[90,0,0],finish:'glass',emissive:'#166534'}),box([0,.93,0],[.44,.020,.36],PALETTE.graphite,{radius:.008,finish:'rubber'})];
    for(let i=0;i<10;i++)parts.push(box([-.17+i*.038,.22,-.314],[.022,.012,.014],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(box([-.15+i*.060,.94,.02],[.022,.010,.30],PALETTE.black,{radius:.003,finish:'rubber'}));
    for(const x of [-.322,.322])for(let i=0;i<6;i++)parts.push(box([x,.20+i*.095,0],[.014,.045,.38],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    for(const [x,y] of [[-.16,.14],[.16,.14],[-.16,.86],[.16,.86]])parts.push(cyl([x,y,-.318],[.018,.010,.018],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(box([-.20+i*.13,.945,-.10],[.045,.010,.22],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    feet(parts,.20,.18,.022);return parts;
  }
  if(id==='console-dock'){
    const parts=[box([0,.43,.04],[.80,.78,.46],PALETTE.ink,{radius:.075,finish:'painted-metal'}),box([0,.55,-.205],[.62,.52,.020],PALETTE.black,{radius:.025,finish:'glass'}),box([0,.82,.02],[.54,.025,.13],PALETTE.black,{radius:.010,finish:'rubber'}),box([0,.25,-.230],[.66,.07,.055],PALETTE.graphite,{radius:.014,finish:'metal'}),box([-.32,.61,-.225],[.035,.28,.028],PALETTE.silver,{radius:.006,finish:'brushed'}),box([.32,.61,-.225],[.035,.28,.028],PALETTE.silver,{radius:.006,finish:'brushed'}),cyl([.25,.30,-.235],[.025,.012,.025],'#4ade80',{rotation:[90,0,0],finish:'glass',emissive:'#166534'}),box([-.10,.30,-.235],[.12,.050,.020],PALETTE.black,{radius:.008,finish:'rubber'}),box([.09,.30,-.235],[.08,.050,.020],PALETTE.black,{radius:.008,finish:'rubber'})];
    for(let i=0;i<7;i++)parts.push(box([-.22+i*.074,.12,.22],[.040,.012,.022],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(box([-.25+i*.10,.50,.285],[.060,.07,.018],PALETTE.black,{radius:.010,finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(box([-.25+i*.10,.93,.04],[.045,.010,.20],PALETTE.graphite,{radius:.003,finish:'rubber'}));
    for(const [x,y] of [[-.27,.20],[.27,.20],[-.27,.72],[.27,.72]])parts.push(cyl([x,y,-.238],[.016,.010,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    for(const x of [-.34,.34])parts.push(box([x,.46,.04],[.012,.54,.36],PALETTE.graphite,{radius:.003,finish:'metal'}));
    for(let i=0;i<3;i++)parts.push(cyl([-.08+i*.08,.875,.02],[.020,.010,.020],i===1?'#4ade80':PALETTE.silver,{finish:'glass',emissive:i===1?'#166534':undefined}));
    for(const x of [-.29,.29])for(const z of [-.14,.18])parts.push(cyl([x,.045,z],[.040,.050,.040],PALETTE.black,{finish:'rubber'}));return parts;
  }
  if(id==='usb-hub'){
    const parts=[box([0,.23,0],[.96,.30,.56],PALETTE.graphite,{radius:.08,finish:'anodized'}),box([0,.24,-.294],[.84,.17,.020],PALETTE.black,{radius:.022,finish:'plastic'}),box([-.36,.27,-.310],[.10,.07,.016],'#38bdf8',{radius:.007,finish:'screen',emissive:'#075985'}),box([.36,.27,-.310],[.07,.07,.016],PALETTE.black,{radius:.007,finish:'rubber'})];
    for(let i=0;i<4;i++){const x=-.18+i*.12;parts.push(box([x,.25,-.313],[.085,.065,.018],PALETTE.ink,{radius:.008,finish:'rubber'}),box([x,.25,-.325],[.048,.032,.008],i===0?'#38bdf8':PALETTE.silver,{radius:.003,finish:'metal'}));}
    for(let i=0;i<5;i++)parts.push(cyl([-.22+i*.11,.39,-.12],[.014,.010,.014],i===0?'#4ade80':PALETTE.silver,{finish:'glass',emissive:i===0?'#166534':undefined}));
    for(let i=0;i<4;i++)parts.push(box([-.24+i*.16,.21,.295],[.12,.070,.018],PALETTE.black,{radius:.010,finish:'rubber'}));
    for(let i=0;i<3;i++)parts.push(box([-.48,.20+i*.09,-.08],[.016,.035,.12],PALETTE.black,{radius:.004,finish:'rubber'}));
    for(let i=0;i<3;i++)parts.push(box([.48,.20+i*.09,-.08],[.016,.035,.12],PALETTE.black,{radius:.004,finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(box([-.26+i*.104,.39,.18],[.040,.010,.035],PALETTE.silver,{radius:.003,finish:'ink'}));
    for(let i=0;i<4;i++)parts.push(torus([.47,.18+i*.07,.08],[.05,.008,.05],PALETTE.graphite,{rotation:[90,0,0],finish:'rubber'}));
    parts.push(tube([[.46,.22,.08],[.64,.20,.18],[.82,.13,.28]],.028,PALETTE.black,{finish:'rubber'}));feet(parts,.36,.18,.025);return parts;
  }
  if(id==='router'){
    const parts=[box([0,.22,0],[.94,.30,.76],PALETTE.ink,{radius:.08,finish:'plastic'}),box([0,.25,-.390],[.80,.14,.018],PALETTE.black,{radius:.018,finish:'glass'}),box([0,.39,0],[.82,.012,.60],PALETTE.graphite,{radius:.005,finish:'rubber'})];
    for(let i=0;i<8;i++)parts.push(box([-.30+i*.086,.40,0],[.036,.010,.52],i%2?PALETTE.graphite:'#242d35',{radius:.003,finish:'rubber'}));
    for(let i=0;i<6;i++)parts.push(cyl([-.24+i*.096,.28,-.405],[.018,.010,.018],['#22c55e','#38bdf8','#eab308','#22c55e','#38bdf8','#ef4444'][i],{rotation:[90,0,0],finish:'glass',emissive:i<5?'#166534':'#991b1b'}));
    for(const [x,z,d] of [[-.35,.24,-.12],[-.12,.29,-.04],[.12,.29,.04],[.35,.24,.12]])parts.push(tube([[x,.34,z],[x+d,.94,z+.16]],.018,PALETTE.graphite,{finish:'plastic'}));
    for(const [x,z,d] of [[-.35,.24,-.12],[-.12,.29,-.04],[.12,.29,.04],[.35,.24,.12]])parts.push(cyl([x+d,.94,z+.16],[.050,.035,.050],PALETTE.silver,{finish:'metal'}));
    for(let i=0;i<4;i++)parts.push(box([-.27+i*.18,.20,.395],[.13,.10,.018],['#eab308','#38bdf8','#38bdf8','#38bdf8'][i],{radius:.012,finish:'rubber'}));
    for(let i=0;i<12;i++)parts.push(box([-.28+i*.051,.42,.15],[.025,.010,.42],PALETTE.graphite,{radius:.002,finish:'rubber'}));
    feet(parts,.34,.27,.025);return parts;
  }
  if(id==='charging-station'){
    const parts=[box([0,.12,0],[.96,.18,.82],PALETTE.graphite,{radius:.055,finish:'anodized'}),box([-.29,.43,.10],[.22,.62,.10],PALETTE.black,{radius:.028,rotation:[-10,0,0],finish:'glass'}),box([0,.47,.10],[.22,.70,.10],PALETTE.black,{radius:.028,rotation:[-10,0,0],finish:'glass'}),box([.29,.43,.10],[.22,.62,.10],PALETTE.black,{radius:.028,rotation:[-10,0,0],finish:'glass'}),box([-.29,.15,-.16],[.28,.07,.20],PALETTE.black,{radius:.018,finish:'rubber'}),box([0,.15,-.16],[.28,.07,.20],PALETTE.black,{radius:.018,finish:'rubber'}),box([.29,.15,-.16],[.28,.07,.20],PALETTE.black,{radius:.018,finish:'rubber'}),cyl([.29,.65,-.02],[.16,.018,.16],PALETTE.silver,{finish:'brushed'}),torus([.29,.67,-.02],[.17,.015,.17],PALETTE.black,{rotation:[90,0,0],finish:'rubber'})];
    for(const x of [-.29,0,.29]){parts.push(box([x,.39,.035],[.13,.018,.010],'#173c52',{radius:.003,finish:'screen',emissive:'#075985'}),cyl([x+.07,.18,-.31],[.018,.010,.018],'#4ade80',{finish:'glass',emissive:'#166534'}));}
    for(const x of [-.29,0,.29]){parts.push(cyl([x-.06,.65,.035],[.025,.012,.025],PALETTE.graphite,{finish:'glass'}),box([x,.19,.035],[.14,.018,.075],PALETTE.graphite,{radius:.006,finish:'metal'}),box([x,.30,.043],[.17,.012,.012],PALETTE.silver,{radius:.003,finish:'brushed'}));}
    for(let i=0;i<8;i++)parts.push(box([-.33+i*.095,.235,.32],[.048,.010,.10],i%2?PALETTE.silver:PALETTE.graphite,{radius:.003,finish:'metal'}));
    for(let i=0;i<8;i++)parts.push(cyl([-.32+i*.09,.23,-.36],[.014,.010,.014],i<3?'#4ade80':PALETTE.silver,{finish:'glass',emissive:i<3?'#166534':undefined}));
    for(const x of [-.36,.36])parts.push(box([x,.10,0],[.025,.10,.60],PALETTE.black,{radius:.005,finish:'rubber'}));
    parts.push(tube([[.40,.10,.20],[.62,.08,.28],[.78,.04,.38]],.022,PALETTE.black,{finish:'rubber'}));feet(parts,.35,.30,.020);return parts;
  }
  if(/pc-tower|game-console|mini-pc|router|hub|station|projector/.test(id)){
    const parts=productShell(color,{feetOn:true});ventRows(parts,{y0:.16,rows:6,cols:7,z:-.48});
    parts.push(cyl([-.30,.80,-.50],[.035,.025,.035],'#4ade80',{rotation:[90,0,0],finish:'glass',emissive:'#22c55e'}));
    if(id==='pc-tower'){parts.push(box([.46,.52,0],[.018,.78,.80],PALETTE.glass,{finish:'glass',opacity:.24}));for(let i=0;i<3;i++)parts.push(torus([0,.26+i*.24,-.48],[.28,.06,.28],'#38bdf8',{rotation:[90,0,0],finish:'emissive',emissive:'#0ea5e9'}));}
    if(id==='router')for(const x of [-.35,0,.35])parts.push(tube([[x,.60,.25],[x,.95,.32]],.014,PALETTE.graphite,{finish:'plastic'}));
    return parts;
  }
  if(/webcam/.test(id))return [box([0,.58,0],[.88,.58,.70],color,{radius:.18,finish:'plastic'}),cyl([0,.60,-.38],[.36,.06,.36],PALETTE.black,{rotation:[90,0,0],finish:'glass'}),cyl([0,.60,-.42],[.18,.025,.18],'#244b65',{rotation:[90,0,0],finish:'glass'}),tube([[0,.35,0],[0,.16,.10]],.035,PALETTE.graphite,{finish:'plastic'}),box([0,.07,.18],[.72,.07,.36],PALETTE.graphite,{radius:.03,finish:'rubber'})];
  if(/calculator/.test(id)){
    const parts=[box([0,.45,0],[.94,.78,.90],color,{radius:.04,finish:'plastic'}),box([0,.855,.28],[.76,.035,.20],'#18303d',{radius:.012,finish:'screen',emissive:'#0a2634'}),box([0,.86,.40],[.35,.025,.055],'#27343c',{radius:.005,finish:'screen'})];
    for(let r=0;r<5;r++)for(let c=0;c<4;c++)parts.push(box([-.28+c*.19,.86,.10-r*.14],[.13,.055,.105],c===3?'#e58c4b':r===0?'#89949d':'#d9dee2',{radius:.015,finish:'keycap'}));
    for(const x of [-.34,.34])for(const z of [-.34,.34])parts.push(box([x,.035,z],[.10,.035,.08],PALETTE.black,{radius:.018,finish:'rubber'}));
    for(let i=0;i<8;i++)parts.push(cyl([-.30+i*.085,.87,.345],[.012,.008,.012],i%2?PALETTE.silver:PALETTE.graphite,{finish:'metal'}));return parts;
  }
  if(/stapler/.test(id)){
    const parts=[box([0,.16,0],[.90,.18,.56],PALETTE.graphite,{radius:.075,finish:'rubber'}),box([-.02,.54,-.02],[.88,.20,.50],color,{radius:.075,rotation:[0,0,-7],finish:'painted-metal'}),box([-.08,.41,-.02],[.72,.08,.28],PALETTE.silver,{radius:.025,rotation:[0,0,-7],finish:'metal'}),box([-.34,.43,-.02],[.11,.32,.22],PALETTE.silver,{finish:'metal'}),box([.31,.23,-.02],[.12,.035,.22],PALETTE.silver,{radius:.008,finish:'metal'}),cyl([-.35,.48,0],[.09,.50,.09],PALETTE.graphite,{rotation:[90,0,0],finish:'metal'}),box([.37,.47,0],[.035,.20,.32],PALETTE.graphite,{radius:.008,rotation:[0,0,-7],finish:'metal'}),box([.08,.20,0],[.26,.025,.28],'#505860',{radius:.008,finish:'metal'})];
    for(let i=0;i<6;i++)parts.push(box([-.25+i*.085,.40,-.17],[.055,.018,.018],PALETTE.silver,{radius:.003,rotation:[0,0,-7],finish:'metal'}));
    for(const x of [-.31,.31])for(const z of [-.18,.18])parts.push(box([x,.045,z],[.12,.035,.08],PALETTE.black,{radius:.018,finish:'rubber'}));return parts;
  }
  if(/tape-dispenser/.test(id)){
    const parts=[
      extrude([0,.30,.31],[.96,.58,.18],color,[[-.50,-.48],[.46,-.48],[.50,-.20],[.38,-.03],[.16,.05],[-.06,.45],[-.33,.48],[-.43,.22]],{smoothOutline:true,finish:'gloss-plastic',bevel:.045}),
      box([0,.11,0],[.94,.16,.88],PALETTE.graphite,{radius:.065,finish:'rubber'}),
      box([-.20,.39,.27],[.12,.42,.18],color,{radius:.045,finish:'gloss-plastic'}),
      disc([-.20,.57,-.405],[.58,.58,.025],'#e5d7ba',{finish:'translucent-plastic',opacity:.82}),
      disc([-.20,.57,-.423],[.22,.22,.018],PALETTE.graphite,{finish:'plastic'}),
      cyl([-.20,.63,0],[.18,.82,.18],PALETTE.graphite,{rotation:[90,0,0],finish:'plastic'}),
      cyl([.15,.43,0],[.08,.70,.08],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),
      box([.11,.55,-.33],[.48,.025,.18],'#e5d6b8',{rotation:[0,0,-10],finish:'translucent-plastic',opacity:.72}),
      wedge([.445,.42,0],[.11,.16,.72],PALETTE.silver,{rotation:[0,0,-8],finish:'metal'}),
      box([-.12,.07,0],[.38,.055,.64],PALETTE.black,{radius:.018,finish:'rubber'}),
    ];
    for(let i=0;i<11;i++)parts.push(wedge([.462,.49,-.30+i*.06],[.052,.045,.023],i%2?PALETTE.silver:'#8b949b',{rotation:[0,90,0],finish:'metal'}));
    for(let i=0;i<8;i++)parts.push(box([-.32+i*.085,.055,.38],[.052,.022,.035],PALETTE.black,{radius:.008,finish:'rubber'}));
    for(const z of [-.32,.32])parts.push(cyl([-.20,.57,z],[.055,.055,.055],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if(/headphone/.test(id))return [torus([0,.57,0],[.82,.18,.82],color,{rotation:[90,0,0],finish:'soft-plastic'}),box([-.38,.36,0],[.22,.34,.36],PALETTE.black,{radius:.10,finish:'fabric'}),box([.38,.36,0],[.22,.34,.36],PALETTE.black,{radius:.10,finish:'fabric'}),tube([[.38,.20,0],[.45,.05,.10],[.42,0,.32]],.014,PALETTE.black,{finish:'rubber'})];
  if(/vacuum/.test(id)){
    const parts=[box([0,.22,0],[.72,.36,.76],color,{radius:.12,finish:'plastic'}),tube([[0,.30,0],[.10,.65,.03],[.02,.94,.04]],.035,PALETTE.silver,{finish:'metal'}),box([0,.96,.04],[.46,.08,.28],PALETTE.graphite,{radius:.04,finish:'rubber'})];
    parts.push(cyl([-.28,.10,.22],[.14,.12,.14],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}),cyl([.28,.10,.22],[.14,.12,.14],PALETTE.black,{rotation:[90,0,0],finish:'rubber'}));return parts;
  }
  if(/robot-vacuum/.test(id))return [cyl([0,.45,0],[.94,.32,.94],color,{finish:'plastic'}),cyl([0,.64,-.10],[.20,.08,.20],PALETTE.graphite,{finish:'plastic'}),box([.16,.64,-.30],[.16,.025,.06],'#58c6f2',{finish:'screen',emissive:'#0ea5e9'})];
  if(/dumbbell/.test(id)){
    const parts=[];
    for(const z of [-.24,.24]){
      parts.push(tube([[-.36,.48,z],[.36,.48,z]],.052,PALETTE.silver,{finish:'metal'}));
      for(const x of [-.35,-.23,.23,.35])parts.push(cyl([x,.48,z],[.28,.13,.28],PALETTE.graphite,{rotation:[0,0,90],finish:'rubber'}));
      for(const x of [-.35,.35])parts.push(cyl([x,.48,z],[.13,.155,.13],PALETTE.silver,{rotation:[0,0,90],finish:'metal'}));
      parts.push(box([0,.48,z-.045],[.28,.07,.020],PALETTE.graphite,{radius:.006,finish:'rubber'}),box([0,.48,z+.045],[.28,.07,.020],PALETTE.graphite,{radius:.006,finish:'rubber'}));
    }
    return parts;
  }
  if(/kettlebell/.test(id)){
    const parts=[sphere([0,.36,0],[.76,.64,.76],color,{finish:'painted-metal'}),cyl([0,.07,0],[.48,.10,.48],PALETTE.graphite,{finish:'rubber'}),tube([[-.27,.55,0],[-.27,.82,0],[0,.92,0],[.27,.82,0],[.27,.55,0]],.085,PALETTE.graphite,{finish:'rubber'}),box([0,.40,-.39],[.22,.10,.020],PALETTE.white,{radius:.012,finish:'ink'}),cyl([0,.94,0],[.10,.035,.10],PALETTE.silver,{finish:'metal'})];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;parts.push(box([Math.cos(a)*.39,.36,Math.sin(a)*.39],[.012,.28,.012],i%2?color:'#5d8793',{radius:.003,rotation:[0,-i*45,0],finish:'painted-metal'}));}
    for(let i=0;i<5;i++)parts.push(cyl([-.18+i*.09,.39,-.405],[.016,.010,.016],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    return parts;
  }
  if(/jump-rope|resistance-band/.test(id))return [tube([[-.40,.25,0],[-.15,.80,.22],[.22,.75,-.18],[.40,.28,0]],.035,color,{finish:'rubber'}),box([-.43,.18,0],[.12,.32,.12],PALETTE.graphite,{radius:.04,finish:'rubber'}),box([.43,.18,0],[.12,.32,.12],PALETTE.graphite,{radius:.04,finish:'rubber'})];
  if(/massage-gun/.test(id))return [box([0,.52,0],[.54,.34,.74],color,{radius:.09,finish:'plastic'}),box([0,.22,.14],[.22,.48,.26],PALETTE.graphite,{radius:.07,finish:'rubber'}),cyl([0,.58,-.47],[.12,.28,.12],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}),sphere([0,.58,-.67],[.28,.28,.28],PALETTE.black,{finish:'foam'})];
  if(/mic-stand/.test(id))return [cyl([0,.03,0],[.72,.06,.72],PALETTE.graphite,{finish:'metal'}),tube([[0,.06,0],[0,.75,0],[.24,.93,0]],.025,PALETTE.silver,{finish:'metal'}),P('capsule',[.28,.94,0],[.16,.20,.16],PALETTE.black,{rotation:[0,0,-55],finish:'metal'})];
  if(/paper-towel/.test(id))return [cyl([0,.04,0],[.72,.08,.72],PALETTE.graphite,{finish:'metal'}),cyl([0,.47,0],[.12,.80,.12],PALETTE.silver,{finish:'metal'}),cyl([0,.51,0],[.68,.72,.68],PALETTE.paper,{finish:'paper'}),torus([0,.86,0],[.68,.04,.68],PALETTE.paper,{rotation:[90,0,0],finish:'paper'})];
  const parts=productShell(color,{panel:category==='Tech',feetOn:true});
  parts.push(box([0,.24,-.49],[.62,.08,.018],'#b8c0c7',{radius:.01,finish:'brushed'}));
  ventRows(parts,{y0:.10,rows:2,cols:6,x0:-.24,z:-.49});
  return parts;
}

// A shared final construction pass gives every product enough secondary form
// to read at close camera distances: seams, fasteners, vents, stitching,
// rolled edges, and material breaks. Bespoke models above keep their silhouette;
// this pass supplies the small-scale construction language that was previously
// missing from the simpler families.
function productionDetails(id, kind, color, category, source) {
  const parts=source.slice(0,120);
  // These families now carry their own construction detail. Adding generic
  // front-plane "detail" to them made the render look like loose debris.
  if(/tape-dispenser|stapler|calculator|electric-kettle|coffee-maker|tower-fan|gaming-chair|beanbag/.test(id)||['bowl','plant','clock','lamp'].includes(kind))return parts;
  // A model with eighteen intentional, object-attached components has already
  // met the catalog detail floor. Do not inflate it with unrelated geometry.
  if(parts.length>=18)return parts;
  const target=Math.min(36,Math.max(18,Math.ceil(parts.length*3)));
  const soft=/pillow|basket|rug|seating/.test(kind)||/hamper|bag|blanket|comforter|mat$|beanbag|ottoman/.test(id);
  const vessel=/mug|bowl|bottle|fishbowl|plant/.test(kind)||/vase|candle|pitcher|thermos|bottle|bowl/.test(id);
  const planar=/frame|poster|mirror|string-lights/.test(kind)||category==='Decor';
  const organic=/plant|fishbowl/.test(kind)||/terrarium|aquarium|cactus|bonsai/.test(id);
  let i=0;
  while(parts.length<target){
    const lane=i%12,row=Math.floor(i/12),x=-.405+lane*.074,y=.16+row*.10;
    if(soft){
      if(i%3===0)parts.push(tube([[-.44,y,-.45],[0,y+.012,-.475],[.44,y,-.45]],.0045,'#d7dee2',{finish:'thread'}));
      else if(i%3===1)parts.push(box([x,.50,-.48],[.010,.54,.012],i%2?'#8395a1':'#c8d2d8',{radius:.002,finish:'thread'}));
      else parts.push(cyl([x,.50,-.492],[.025,.014,.025],color||PALETTE.fabric,{rotation:[90,0,0],finish:'fabric'}));
    }else if(vessel){
      if(i%2===0)parts.push(torus([0,.16+(i%8)*.095,0],[.72-(i%3)*.055,.025,.72-(i%3)*.055],i%4?color:PALETTE.silver,{rotation:[90,0,0],finish:i%4?'ceramic':'metal'}));
      else {const a=(i%10)*Math.PI/5;parts.push(box([Math.cos(a)*.31,.44,Math.sin(a)*.31],[.018,.38,.018],i%3?color:'#dce4e8',{radius:.004,rotation:[0,-a*180/Math.PI,0],finish:organic?'plant':'ceramic'}));}
    }else if(planar){
      if(i<4){const sx=i%2?-1:1,sy=i<2?-1:1;parts.push(box([sx*.43,.50+sy*.42,-.18],[.10,.055,.035],i%2?PALETTE.silver:color,{radius:.008,rotation:[0,0,sx*sy*45],finish:'metal'}));}
      else if(i%2===0)parts.push(box([x,.18+(i%7)*.10,-.22],[.045,.045,.012],['#d6a74f','#6b91ad','#bd655c','#6f9a73'][i%4],{radius:.006,finish:'ink'}));
      else parts.push(cyl([x,.92,-.205],[.022,.018,.022],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
    }else if(organic){
      const a=(i%12)*Math.PI/6,r=.16+(i%3)*.075;
      parts.push(P('star',[Math.cos(a)*r,.38+(i%5)*.105,Math.sin(a)*r],[.10,.055,.035],i%2?PALETTE.leaf:PALETTE.leafDark,{rotation:[0,i*31,(i%3-1)*22],finish:'plant'}));
    }else{
      if(i%4===0)parts.push(cyl([x,.10+row*.08,-.48],[.022,.014,.022],PALETTE.silver,{rotation:[90,0,0],finish:'metal'}));
      else if(i%4===1)parts.push(box([x,.20+row*.07,-.487],[.045,.010,.014],PALETTE.black,{radius:.003,finish:'rubber'}));
      else if(i%4===2)parts.push(box([x,.84-row*.06,-.486],[.050,.018,.014],i%8===2?'#60a5fa':PALETTE.graphite,{radius:.005,finish:i%8===2?'glass':'plastic',emissive:i%8===2?'#0b4b69':undefined}));
      else parts.push(box([0,.32+row*.12,-.475],[.74,.010,.012],i%8===3?PALETTE.silver:PALETTE.graphite,{radius:.003,finish:i%8===3?'metal':'rubber'}));
    }
    i++;
  }
  return parts.slice(0,120);
}

export function catalogModelParts(id, kind = 'default', color = '#64748b', category = '') {
  let parts=specialModel(id,color);
  if(!parts&&(id === 'tv' || id === 'monitor' || id === 'dual-monitors'))parts=screenModel(id);
  else if(!parts&&/futon|loveseat|beanbag|ottoman/.test(id))parts=seatingModel(id,color);
  else if(!parts&&(id === 'rug' || id === 'runner' || /mat$/.test(id)))parts=rugModel(id,color);
  else if(!parts&&(/fridge|freezer|cooler|microwave/.test(id) || kind === 'appliance'))parts=appliance(id,color);
  else if(!parts&&kind === 'mouse')parts=mouseModel(id,color);
  else if(!parts&&kind === 'keyboard')parts=keyboardModel(id,color);
  else if(!parts&&kind === 'laptop')parts=laptopModel(id,color);
  else if(!parts&&kind === 'mug')parts=mugModel(id,color);
  else if(!parts&&kind === 'bowl')parts=bowlModel(id,color);
  else if(!parts&&kind === 'fishbowl')parts=fishModel(id);
  else if(!parts&&(kind === 'frame' || kind === 'poster' || kind === 'mirror'))parts=frameModel(id,color);
  else if(!parts&&kind === 'string-lights')parts=lightStringModel(id,color);
  else if(!parts&&kind === 'plant')parts=plantModel(id,color);
  else if(!parts&&kind === 'books')parts=booksModel(id,color);
  else if(!parts&&kind === 'speaker')parts=speakerModel(id,color);
  else if(!parts&&kind === 'bottle')parts=bottleModel(id,color);
  else if(!parts&&kind === 'clock')parts=clockModel(id,color);
  else if(!parts&&kind === 'basket')parts=basketModel(id,color);
  else if(!parts&&kind === 'pillow')parts=pillowModel(id,color);
  else if(!parts&&kind === 'instrument')parts=instrumentModel(id,color);
  else if(!parts&&(kind === 'storage' || kind === 'shelf'))parts=storageModel(id,color);
  else if(!parts&&kind === 'chair')parts=chairModel(id,color);
  else if(!parts&&kind === 'lamp')parts=lampModel(id,color);
  else if(!parts&&/hamper|shoe-rack|desk-hutch|nightstand|drawer|shelf|cart|bookcase|bin/.test(id))parts=storageModel(id,color);
  else if(!parts&&/chair/.test(id))parts=chairModel(id,color);
  else if(!parts&&/lamp|light/.test(id))parts=lampModel(id,color);
  return productionDetails(id,kind,color,category,parts||detailedDefault(id,color,category));
}
