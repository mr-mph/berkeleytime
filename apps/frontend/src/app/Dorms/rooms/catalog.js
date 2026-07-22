// Measured, parametric dorm-item catalog for the Blackwell layout planner.
// Dimensions are stored in meters; display/source measurements are inches.
import { catalogModelParts } from './catalog-models.js';

const IN = 0.0254;
const inch = (n) => +(n * IN).toFixed(5);
const dims = (w, h, d) => ({ w: inch(w), h: inch(h), d: inch(d) });
const size = (label, w, h, d) => ({ label, dims: dims(w, h, d) });

const P = (type, position, partSize, color, extra = {}) => ({
  type, position, size: partSize, color, ...extra,
});

function applianceParts(color = '#20242a') {
  return [
    P('roundedBox', [0, .50, 0], [.94, .96, .92], color, { radius: .035 }),
    P('box', [0, .31, -.472], [.87, .008, .015], '#090b0e'),
    P('box', [0, .675, -.472], [.87, .008, .015], '#090b0e'),
    P('box', [.40, .50, -.49], [.025, .30, .025], '#aeb5bc', { metalness: .75 }),
    P('cylinder', [-.33, .025, -.31], [.08, .05, .08], '#111418'),
    P('cylinder', [.33, .025, -.31], [.08, .05, .08], '#111418'),
  ];
}

function screenParts({ dual = false, tv = false } = {}) {
  const xs = dual ? [-.255, .255] : [0];
  const panelW = dual ? .47 : .82;
  const parts = [];
  for (const x of xs) {
    parts.push(P('roundedBox', [x, tv ? .63 : .64, 0], [panelW, tv ? .56 : .48, .075], '#15191e', { radius: .025 }));
    parts.push(P('box', [x, tv ? .63 : .64, -.041], [panelW * .92, (tv ? .56 : .48) * .88, .012], '#263c4e', { roughness: .28, emissive: '#07111b' }));
  }
  if (tv) {
    parts.push(P('box', [0, .27, .04], [.06, .20, .08], '#22272d', { metalness: .35 }));
    parts.push(P('box', [0, .15, .03], [.48, .045, .32], '#22272d', { metalness: .35 }));
  } else {
    parts.push(P('cylinder', [0, .30, .03], [.08, .42, .08], '#aab0b7', { metalness: .75 }));
    parts.push(P('box', [0, .09, .02], [.43, .035, .36], '#30363d', { radius: .025 }));
  }
  return parts;
}

function seatingParts(kind = 'futon') {
  if (kind === 'beanbag') return [P('sphere', [0, .43, 0], [.92, .82, .92], '#315d78', { roughness: .92 })];
  if (kind === 'ottoman') return [
    P('roundedBox', [0, .55, 0], [.96, .78, .92], '#a37045', { radius: .11 }),
    P('cylinder', [-.36, .08, -.34], [.08, .16, .08], '#3b2b21'),
    P('cylinder', [.36, .08, -.34], [.08, .16, .08], '#3b2b21'),
    P('cylinder', [-.36, .08, .34], [.08, .16, .08], '#3b2b21'),
    P('cylinder', [.36, .08, .34], [.08, .16, .08], '#3b2b21'),
  ];
  return [
    P('roundedBox', [0, .37, .04], [.82, .24, .84], '#5e7180', { radius: .08 }),
    P('roundedBox', [0, .68, .35], [.82, .48, .22], '#687e8e', { radius: .07, rotation: [-12, 0, 0] }),
    P('roundedBox', [-.46, .49, .02], [.08, .52, .88], '#43525d', { radius: .04 }),
    P('roundedBox', [.46, .49, .02], [.08, .52, .88], '#43525d', { radius: .04 }),
    P('cylinder', [-.38, .10, -.29], [.055, .20, .055], '#22272c', { metalness: .4 }),
    P('cylinder', [.38, .10, -.29], [.055, .20, .055], '#22272c', { metalness: .4 }),
    P('cylinder', [-.38, .10, .29], [.055, .20, .055], '#22272c', { metalness: .4 }),
    P('cylinder', [.38, .10, .29], [.055, .20, .055], '#22272c', { metalness: .4 }),
  ];
}

function storageParts(kind = 'bin') {
  if (kind === 'shelf') {
    const parts = [
      P('box', [-.46, .5, 0], [.08, 1, .92], '#8a7359'),
      P('box', [.46, .5, 0], [.08, 1, .92], '#8a7359'),
    ];
    for (const y of [.04, .28, .52, .76, .96]) parts.push(P('box', [0, y, 0], [.92, .055, .92], '#a78d6b'));
    return parts;
  }
  if (kind === 'drawers') return [
    P('roundedBox', [0, .5, 0], [.94, .96, .92], '#e7ecee', { radius: .025, opacity: .86 }),
    ...[.18, .49, .80].flatMap(y => [
      P('box', [0, y, -.472], [.84, .26, .018], '#d5dde1', { opacity: .88 }),
      P('box', [0, y, -.486], [.24, .035, .025], '#89959c'),
    ]),
    P('cylinder', [-.34, .035, -.34], [.08, .07, .08], '#3c4247'),
    P('cylinder', [.34, .035, -.34], [.08, .07, .08], '#3c4247'),
    P('cylinder', [-.34, .035, .34], [.08, .07, .08], '#3c4247'),
    P('cylinder', [.34, .035, .34], [.08, .07, .08], '#3c4247'),
  ];
  return [
    P('roundedBox', [0, .47, 0], [.96, .86, .92], '#cbd8dc', { radius: .04, opacity: .72 }),
    P('roundedBox', [0, .92, 0], [1, .10, .96], '#7393a0', { radius: .025 }),
    P('box', [0, .62, -.47], [.36, .08, .025], '#6b858e'),
  ];
}

function tableParts(kind = 'cart') {
  if (kind === 'lamp') return [
    P('cylinder', [0, .04, 0], [.60, .08, .60], '#2f353b', { metalness: .4 }),
    P('cylinder', [0, .50, 0], [.10, .92, .10], '#b4bac0', { metalness: .75 }),
    P('cone', [0, .88, 0], [.68, .24, .68], '#e1c48d', { rotation: [180, 0, 0], emissive: '#2c1d08' }),
  ];
  const parts = [
    P('roundedBox', [0, .92, 0], [.96, .10, .92], '#8c7358', { radius: .025 }),
    P('box', [-.42, .48, -.38], [.07, .86, .07], '#383b3f', { metalness: .5 }),
    P('box', [.42, .48, -.38], [.07, .86, .07], '#383b3f', { metalness: .5 }),
    P('box', [-.42, .48, .38], [.07, .86, .07], '#383b3f', { metalness: .5 }),
    P('box', [.42, .48, .38], [.07, .86, .07], '#383b3f', { metalness: .5 }),
    P('box', [0, .40, 0], [.86, .06, .82], '#70767a', { metalness: .25 }),
  ];
  return parts;
}

function utilityParts(kind) {
  if (kind === 'hamper') return [
    P('cylinder', [0, .48, 0], [.92, .92, .92], '#88949a', { roughness: .85 }),
    P('torus', [0, .93, 0], [.92, .08, .92], '#363d42', { rotation: [90, 0, 0] }),
  ];
  if (kind === 'fan') return [
    P('roundedBox', [0, .50, 0], [.62, .96, .62], '#d9dee1', { radius: .15 }),
    P('box', [0, .55, -.32], [.28, .58, .015], '#7b858c'),
    P('box', [0, .92, -.32], [.18, .035, .02], '#70a8c5', { emissive: '#082436' }),
  ];
  if (kind === 'chair') return [
    P('roundedBox', [0, .48, -.04], [.74, .15, .72], '#232a31', { radius: .06 }),
    P('roundedBox', [0, .76, .27], [.70, .45, .16], '#29323b', { radius: .06, rotation: [-8, 0, 0] }),
    P('cylinder', [0, .29, 0], [.09, .32, .09], '#8c949b', { metalness: .75 }),
    P('cylinder', [0, .14, 0], [.78, .06, .78], '#3d454c', { metalness: .5 }),
    ...[-.32, .32].flatMap(x => [-.32, .32].map(z => P('sphere', [x, .06, z], [.10, .10, .10], '#171a1e'))),
  ];
  if (kind === 'shoe') return [
    P('box', [-.45, .5, 0], [.07, 1, .88], '#30363a', { metalness: .5 }),
    P('box', [.45, .5, 0], [.07, 1, .88], '#30363a', { metalness: .5 }),
    ...[.10, .40, .70, .96].map(y => P('box', [0, y, 0], [.90, .035, .88], '#616a70', { metalness: .35 })),
  ];
  return [P('roundedBox', [0, .5, 0], [.9, .96, .9], '#e2e6e8', { radius: .12 })];
}

function objectParts(kind, color = '#64748b') {
  switch (kind) {
    case 'mouse': return [
      P('roundedBox',[0,.42,0],[.92,.78,.94],color,{radius:.22}),
      P('box',[0,.78,-.14],[.025,.12,.45],'#1f2937'),
      P('cylinder',[0,.88,-.12],[.11,.12,.11],'#d1d5db',{rotation:[90,0,0]}),
    ];
    case 'keyboard': {
      const parts=[P('roundedBox',[0,.28,0],[.98,.52,.96],color,{radius:.04})];
      for(let row=0;row<4;row++)for(let col=0;col<12;col++)parts.push(P('roundedBox',[-.43+col*.078,.58,-.34+row*.21],[.06,.16,.14],'#e5e7eb',{radius:.02}));
      return parts;
    }
    case 'laptop': return [
      P('roundedBox',[0,.08,0],[.98,.12,.92],color,{radius:.025}),
      P('roundedBox',[0,.55,.42],[.96,.86,.06],'#202a35',{radius:.025,rotation:[-8,0,0]}),
      P('box',[0,.56,.385],[.86,.72,.015],'#31536d',{emissive:'#07131d'}),
      P('box',[0,.145,-.04],[.48,.018,.42],'#9ca3af'),
    ];
    case 'mug': return [
      P('cylinder',[0,.46,0],[.68,.88,.68],color),
      P('torus',[.39,.50,0],[.46,.42,.18],color),
      P('cylinder',[0,.92,0],[.62,.04,.62],'#1f2937'),
    ];
    case 'bowl': return [P('sphere',[0,.36,0],[.94,.70,.94],color),P('cylinder',[0,.65,0],[.76,.08,.76],'#dbeafe')];
    case 'fishbowl': return [
      P('sphere',[0,.48,0],[.94,.90,.94],'#bde6f5',{opacity:.35,roughness:.15}),
      P('sphere',[0,.34,0],[.84,.42,.84],'#4bb3d3',{opacity:.55}),
      P('torus',[0,.88,0],[.60,.08,.60],'#d7eef7',{rotation:[90,0,0]}),
      P('cone',[0,.16,0],[.30,.20,.30],'#6b7280'),
    ];
    case 'frame': return [
      P('roundedBox',[0,.5,0],[1,1,.34],color,{radius:.025}),
      P('box',[0,.5,-.19],[.84,.82,.04],'#f8fafc'),
      P('box',[0,.5,-.22],[.67,.64,.025],'#7dd3fc'),
    ];
    case 'poster': return [P('roundedBox',[0,.5,0],[1,1,.18],color,{radius:.018}),P('box',[0,.5,-.10],[.94,.94,.03],'#f8fafc')];
    case 'string-lights': {
      const parts=[P('box',[0,.72,0],[1,.025,.25],'#334155')];
      for(let i=0;i<12;i++){const x=-.46+i*.084;const y=.68-.24*Math.abs(Math.sin(i*.85));parts.push(P('cylinder',[x,y,0],[.018,.32,.018],'#334155'));parts.push(P('sphere',[x,y-.17,0],[.075,.075,.075],'#fbbf24',{emissive:'#f59e0b'}));}
      return parts;
    }
    case 'plant': return [
      P('cone',[0,.22,0],[.68,.44,.68],color,{rotation:[180,0,0]}),
      P('sphere',[0,.63,0],[.66,.64,.66],'#4f8a58'),
      P('sphere',[-.22,.76,.02],[.34,.38,.28],'#66a46c'),
      P('sphere',[.24,.72,-.04],[.38,.34,.32],'#3d7d4a'),
    ];
    case 'books': return [
      P('roundedBox',[0,.16,0],[.96,.28,.94],color,{radius:.02}),
      P('roundedBox',[.04,.45,-.02],[.88,.25,.92],'#d97706',{radius:.02}),
      P('roundedBox',[-.03,.72,.03],[.92,.24,.88],'#2563eb',{radius:.02}),
    ];
    case 'speaker': return [
      P('roundedBox',[0,.5,0],[.92,.96,.90],color,{radius:.05}),
      P('cylinder',[0,.68,-.47],[.50,.09,.50],'#111827',{rotation:[90,0,0]}),
      P('cylinder',[0,.26,-.47],[.30,.08,.30],'#1f2937',{rotation:[90,0,0]}),
    ];
    case 'bottle': return [
      P('cylinder',[0,.42,0],[.62,.76,.62],color),P('cylinder',[0,.84,0],[.34,.20,.34],color),P('cylinder',[0,.96,0],[.40,.08,.40],'#334155'),
    ];
    case 'clock': return [P('cylinder',[0,.5,0],[.94,.22,.94],color,{rotation:[90,0,0]}),P('cylinder',[0,.5,-.13],[.78,.03,.78],'#f8fafc',{rotation:[90,0,0]}),P('box',[.08,.58,-.16],[.03,.28,.025],'#111827',{rotation:[0,0,-35]})];
    case 'basket': return [P('roundedBox',[0,.45,0],[.94,.86,.92],color,{radius:.06,opacity:.82}),P('torus',[0,.84,0],[.78,.10,.70],color,{rotation:[90,0,0]})];
    case 'pillow': return [P('roundedBox',[0,.5,0],[.96,.90,.92],color,{radius:.18})];
    case 'mirror': return [P('roundedBox',[0,.5,0],[1,1,.24],color,{radius:.03}),P('box',[0,.5,-.14],[.86,.88,.03],'#b9d6df',{metalness:.75,roughness:.15})];
    case 'instrument': return [P('roundedBox',[0,.48,0],[.34,.88,.18],color,{radius:.12}),P('sphere',[0,.72,0],[.80,.45,.30],color),P('box',[0,.22,0],[.12,.42,.12],'#8b5e3c')];
    case 'appliance': return applianceParts(color);
    case 'storage': return storageParts('bin');
    case 'shelf': return storageParts('shelf');
    case 'chair': return utilityParts('chair');
    case 'lamp': return tableParts('lamp');
    default: return [P('roundedBox',[0,.5,0],[.94,.94,.92],color,{radius:.06})];
  }
}

const CORE_CATALOG = [
  { id:'mini-fridge', name:'Mini fridge', category:'Appliances', mark:'FR', sizes:[size('3.1 cu ft',18.7,33.5,19.4),size('4.4 cu ft',20.3,32.9,22.2)], parts:catalogModelParts('mini-fridge','appliance','#20242a','Appliances') },
  { id:'micro-fridge', name:'Fridge + microwave', category:'Appliances', mark:'MF', sizes:[size('Compact',18.7,44.6,19.4)], parts:catalogModelParts('micro-fridge','appliance','#20242a','Appliances') },
  { id:'microwave', name:'Countertop microwave', category:'Appliances', mark:'MW', sizes:[size('0.7 cu ft',17.3,10.2,13),size('0.9 cu ft',19.1,11.5,14.8)], parts:catalogModelParts('microwave','appliance','#252a30','Appliances') },
  { id:'tv', name:'TV + stand', category:'Screens', mark:'TV', sizes:[size('32 in',28.5,18.8,7.1),size('43 in',37.9,24.7,8.3),size('50 in',44.0,28.0,9.8),size('55 in',48.5,30.5,10.4)], parts:catalogModelParts('tv','screen','#15191e','Screens') },
  { id:'monitor', name:'Monitor setup', category:'Screens', mark:'1×', sizes:[size('24 in',21.2,16.0,7.5),size('27 in',24.1,18.1,8.0),size('32 in',28.1,21.1,9.4)], parts:catalogModelParts('monitor','screen','#15191e','Screens') },
  { id:'dual-monitors', name:'Dual monitors', category:'Screens', mark:'2×', sizes:[size('Dual 24 in',43.5,16.0,9.0),size('Dual 27 in',49.5,18.1,10.0),size('Dual 32 in',57.5,21.1,11.0)], parts:catalogModelParts('dual-monitors','screen','#15191e','Screens') },
  { id:'futon', name:'Futon sofa', category:'Seating', mark:'FU', sizes:[size('Twin',70.5,31.5,33.5),size('Full',78.0,32.5,35.5)], parts:catalogModelParts('futon','seating','#5e7180','Seating') },
  { id:'loveseat', name:'Compact loveseat', category:'Seating', mark:'LS', sizes:[size('Small',52,31,30),size('Wide',62,32,31)], parts:catalogModelParts('loveseat','seating','#607889','Seating') },
  { id:'beanbag', name:'Bean bag', category:'Seating', mark:'BB', sizes:[size('3 ft',36,26,36),size('4 ft',48,30,48)], parts:catalogModelParts('beanbag','seating','#315d78','Seating') },
  { id:'ottoman', name:'Storage ottoman', category:'Seating', mark:'OT', sizes:[size('Cube',18,18,18),size('Bench',30,18,16)], parts:catalogModelParts('ottoman','seating','#a37045','Seating') },
  { id:'rug', name:'Area rug', category:'Floor', mark:'RG', sizes:[size('3 × 5 ft',36,.35,60),size('4 × 6 ft',48,.35,72),size('5 × 7 ft',60,.35,84)], parts:catalogModelParts('rug','rug','#a66b51','Floor') },
  { id:'runner', name:'Runner rug', category:'Floor', mark:'RN', sizes:[size('2 × 6 ft',24,.35,72),size('2.5 × 8 ft',30,.35,96)], parts:catalogModelParts('runner','rug','#55727a','Floor') },
  { id:'underbed-bin', name:'Under-bed bin', category:'Storage', mark:'UB', sizes:[size('41 qt',34.5,6.5,16.5),size('60 qt',39.0,7.0,19.5)], parts:catalogModelParts('underbed-bin','storage','#78909c','Storage') },
  { id:'stacking-bin', name:'Stacking bin', category:'Storage', mark:'BN', sizes:[size('18 gal',23.5,16.3,18.6),size('27 gal',30.5,16.5,20.1)], parts:catalogModelParts('stacking-bin','storage','#78909c','Storage') },
  { id:'drawer-cart', name:'3-drawer cart', category:'Storage', mark:'3D', sizes:[size('Narrow',12.6,25.4,14.5),size('Wide',21.9,25.9,15.3)], parts:catalogModelParts('drawer-cart','storage','#dce4e8','Storage') },
  { id:'cube-shelf', name:'Cube shelf', category:'Storage', mark:'4C', sizes:[size('2 × 2',30.1,30.1,14.6),size('2 × 3',30.1,44.2,14.6)], parts:catalogModelParts('cube-shelf','shelf','#9a704d','Storage') },
  { id:'bookcase', name:'Bookcase', category:'Storage', mark:'BK', sizes:[size('Narrow',24,48,11.6),size('Tall',31.5,70.9,11.6)], parts:catalogModelParts('bookcase','shelf','#9a704d','Storage') },
  { id:'rolling-cart', name:'Rolling cart', category:'Storage', mark:'RC', sizes:[size('3 tier',17.7,30.3,13.8)], parts:catalogModelParts('rolling-cart','shelf','#66727a','Storage') },
  { id:'nightstand', name:'Nightstand', category:'Furniture', mark:'NS', sizes:[size('Compact',15.8,23.6,13.8),size('Standard',19.7,24,15.8)], parts:catalogModelParts('nightstand','storage','#9a704d','Furniture') },
  { id:'floor-lamp', name:'Floor lamp', category:'Furniture', mark:'FL', sizes:[size('Standard',11,62,11)], parts:catalogModelParts('floor-lamp','lamp','#30363d','Furniture') },
  { id:'desk-hutch', name:'Desk hutch', category:'Furniture', mark:'DH', sizes:[size('40 in',39.4,37.8,9.8),size('48 in',47.2,37.8,9.8)], parts:catalogModelParts('desk-hutch','shelf','#9a704d','Furniture') },
  { id:'laundry-hamper', name:'Laundry hamper', category:'Everyday', mark:'LH', sizes:[size('Slim',15,24,8),size('Tall',17.5,24,17.5)], parts:catalogModelParts('laundry-hamper','basket','#88949a','Everyday') },
  { id:'shoe-rack', name:'Shoe rack', category:'Everyday', mark:'SR', sizes:[size('3 tier',27,19,11),size('4 tier',35,28,11)], parts:catalogModelParts('shoe-rack','shelf','#4b5560','Everyday') },
  { id:'tower-fan', name:'Tower fan', category:'Everyday', mark:'TF', sizes:[size('36 in',11,36,11),size('42 in',13,42,13)], parts:catalogModelParts('tower-fan','default','#d9dee1','Everyday') },
  { id:'air-purifier', name:'Air purifier', category:'Everyday', mark:'AP', sizes:[size('Small',8.1,12.6,8.1),size('Large',10.8,20.5,10.8)], parts:catalogModelParts('air-purifier','default','#e2e6e8','Everyday') },
  { id:'gaming-chair', name:'Desk chair', category:'Everyday', mark:'CH', sizes:[size('Task',25,38,25),size('Gaming',27,50,27)], parts:catalogModelParts('gaming-chair','chair','#232a31','Everyday') },
];

const EXTRA_GROUPS = {
  'Tech': [
    ['wireless-mouse','Wireless mouse','mouse',4.2,1.5,2.5],['gaming-mouse','Gaming mouse','mouse',5.1,1.7,2.8],['trackball-mouse','Trackball mouse','mouse',5.3,2.1,4.0],['vertical-mouse','Vertical mouse','mouse',4.5,3.0,3.1],
    ['compact-keyboard','Compact keyboard','keyboard',11.5,1.2,4.1],['mechanical-keyboard','Mechanical keyboard','keyboard',17.5,1.6,5.4],['full-keyboard','Full-size keyboard','keyboard',17.9,1.1,6.2],['split-keyboard','Split keyboard','keyboard',15.8,1.4,7.8],
    ['laptop-13','13-inch laptop','laptop',12.0,8.1,8.5],['laptop-14','14-inch laptop','laptop',12.7,8.6,8.9],['laptop-15','15-inch laptop','laptop',14.1,9.3,9.8],['laptop-16','16-inch laptop','laptop',14.0,9.4,9.8],
    ['tablet-small','Small tablet','laptop',7.7,.28,5.3],['tablet-large','Large tablet','laptop',11.0,.25,8.5],['e-reader','E-reader','laptop',6.3,.32,4.5],['drawing-tablet','Drawing tablet','laptop',14.1,.35,8.7],
    ['desktop-speakers','Desktop speakers','speaker',6.2,9.5,7.0],['bluetooth-speaker','Bluetooth speaker','speaker',7.1,2.8,2.6],['smart-speaker','Smart speaker','speaker',5.6,6.8,5.6],['soundbar','Soundbar','speaker',28,2.4,3.5],
    ['pc-tower','PC tower','default',8.3,18.7,17.7],['mini-pc','Mini PC','default',5.0,2.0,5.0],['printer','Compact printer','appliance',15.4,8.0,13.5],['scanner','Flatbed scanner','appliance',17.8,3.9,14.5],
    ['game-console','Game console','default',5.9,11.9,5.9],['console-dock','Console dock','default',6.8,4.1,2.0],['vr-headset','VR headset','default',8.1,4.8,7.5],['controller','Game controller','mouse',6.3,2.6,4.1],
    ['webcam','Webcam','default',3.8,2.3,2.4],['usb-hub','USB hub','default',4.3,.7,1.8],['router','Wi-Fi router','default',9.1,1.8,6.2],['charging-station','Charging station','default',7.2,3.1,4.5],
  ],
  'Desk': [
    ['coffee-mug','Coffee mug','mug',4.5,4.1,3.4],['travel-mug','Travel mug','bottle',3.5,8.0,3.5],['pencil-cup','Pencil cup','mug',3.3,4.2,3.3],['water-bottle','Water bottle','bottle',3.1,10.2,3.1],
    ['notebook','Notebook','books',8.3,.7,5.8],['textbook-stack','Textbook stack','books',11,5.2,8.5],['binder-stack','Binder stack','books',12,6,10],['magazine-file','Magazine holder','storage',4,12,10],
    ['desk-organizer','Desk organizer','storage',9.5,4.5,6.0],['letter-tray','Letter tray','storage',13,3.0,9.5],['pen-case','Pen case','default',8.2,1.5,3.2],['sticky-note-cube','Sticky-note cube','default',3.0,3.0,3.0],
    ['desk-clock','Desk clock','clock',6.5,3.2,2.3],['analog-clock','Analog clock','clock',5.5,5.5,2.0],['calculator','Calculator','default',6.4,.8,3.1],['stapler','Stapler','default',6.8,2.5,1.8],
    ['tape-dispenser','Tape dispenser','default',6.0,3.0,2.5],['document-stand','Document stand','frame',11.5,13,8.0],['book-stand','Book stand','frame',12,10,9],['headphone-stand','Headphone stand','default',6.0,11,6.0],
    ['desk-mat','Desk mat','poster',31.5,.12,15.7],['mouse-pad','Mouse pad','poster',10.2,.12,8.3],['wrist-rest','Keyboard wrist rest','pillow',14.0,1.0,3.2],['phone-stand','Phone stand','frame',3.5,5.2,4.2],
  ],
  'Kitchen': [
    ['electric-kettle','Electric kettle','appliance',8.0,9.8,6.2],['coffee-maker','Coffee maker','appliance',8.3,12.6,10.5],['single-serve-coffee','Single-serve brewer','appliance',5.0,12.1,12.0],['toaster','Two-slice toaster','appliance',11.3,7.4,6.6],
    ['rice-cooker','Rice cooker','appliance',10.5,9.2,10.5],['air-fryer','Compact air fryer','appliance',10.8,12.8,13.0],['blender','Personal blender','appliance',5.0,13.0,5.0],['mini-griddle','Mini griddle','appliance',8.0,3.0,8.0],
    ['cereal-bowl','Cereal bowl','bowl',6.2,3.0,6.2],['mixing-bowl','Mixing bowl','bowl',10,5.1,10],['plate-stack','Plate stack','bowl',10.5,3.0,10.5],['utensil-caddy','Utensil caddy','storage',8.5,7.0,5.5],
    ['snack-bin','Snack bin','storage',12,7,10],['tea-box','Tea box','storage',10,4,8],['fruit-basket','Fruit basket','basket',12,6.5,12],['dish-rack','Dish rack','storage',16,6,12],
    ['pitcher','Water pitcher','bottle',7,10,5],['thermos','Thermos','bottle',3.7,12,3.7],['lunch-box','Lunch box','storage',9.5,7.5,6],['food-container','Food container set','storage',11,6,8],
    ['mini-freezer','Compact freezer','appliance',18.5,19.5,17.7],['beverage-cooler','Beverage cooler','appliance',17.5,25.5,18.7],['ice-maker','Countertop ice maker','appliance',9.5,12.8,14.1],['water-filter','Water filter pitcher','bottle',10.4,10.1,5.5],
  ],
  'Storage': [
    ['fabric-cube','Fabric cube bin','storage',13,13,13],['milk-crate','Milk crate','storage',13,11,13],['file-box','File box','storage',15,10.5,12],['photo-box','Photo storage box','storage',11.2,4.5,7.8],
    ['small-basket','Small basket','basket',12,7,9],['large-basket','Large basket','basket',18,12,14],['wire-basket','Wire basket','basket',15,8,11],['woven-basket','Woven basket','basket',16,12,13],
    ['bedside-caddy','Bedside caddy','storage',12,10,3],['hanging-organizer','Hanging organizer','storage',13,36,3],['overdoor-rack','Over-door rack','shelf',18,30,5],['coat-rack','Coat rack','shelf',18,68,18],
    ['drawer-unit-small','Small drawer unit','storage',12,15,14],['drawer-unit-tall','Tall drawer unit','storage',15,38,17],['rolling-drawers','Rolling drawer unit','storage',16,27,19],['desktop-drawers','Desktop drawers','storage',13,9,10],
    ['trunk','Storage trunk','storage',30,16,16],['footlocker','Footlocker','storage',32,16,18],['blanket-bag','Blanket storage bag','storage',24,12,18],['vacuum-bag','Vacuum storage bag','storage',28,8,20],
    ['corner-shelf','Corner shelf','shelf',18,48,18],['ladder-shelf','Ladder shelf','shelf',25,60,14],['desktop-shelf','Desktop shelf','shelf',36,16,10],['monitor-riser','Monitor riser','shelf',23,4.5,9.5],
  ],
  'Decor': [
    ['photo-frame-small','Small photo frame','frame',7,9,.8,{mount:'wall'}],['photo-frame-large','Large photo frame','frame',18,24,1,{mount:'wall'}],['gallery-frame','Gallery frame','frame',24,18,1,{mount:'wall'}],['poster-frame','Poster frame','frame',24,36,1,{mount:'wall'}],
    ['art-print','Art print','poster',18,24,.2,{mount:'wall'}],['movie-poster','Movie poster','poster',24,36,.2,{mount:'wall'}],['campus-poster','Campus poster','poster',18,24,.2,{mount:'wall'}],['fabric-banner','Fabric banner','poster',30,42,.3,{mount:'wall'}],
    ['string-lights','String lights','string-lights',96,18,1,{mount:'wall'}],['leaf-garland','Leaf garland','string-lights',84,14,2,{mount:'wall',color:'#4f8a58'}],['photo-string','Photo string','string-lights',72,16,1,{mount:'wall'}],['fairy-light-curtain','Fairy light curtain','string-lights',79,59,1,{mount:'wall'}],
    ['wall-mirror-small','Small wall mirror','mirror',14,18,1,{mount:'wall'}],['wall-mirror-full','Full-length mirror','mirror',16,48,1.2,{mount:'wall'}],['round-mirror','Round mirror','mirror',24,24,1.2,{mount:'wall'}],['cork-board','Cork board','frame',23,17,.8,{mount:'wall',color:'#a16207'}],
    ['whiteboard','Whiteboard','frame',24,18,.8,{mount:'wall'}],['calendar','Wall calendar','poster',12,17,.2,{mount:'wall'}],['tapestry','Wall tapestry','poster',60,51,.3,{mount:'wall'}],['pennant','Pennant flag','poster',18,12,.2,{mount:'wall'}],
    ['neon-sign','LED wall sign','string-lights',24,12,1.5,{mount:'wall'}],['wall-clock','Wall clock','clock',12,12,2,{mount:'wall'}],['pegboard','Pegboard','frame',30,22,1,{mount:'wall'}],['acoustic-panel','Acoustic panel','poster',12,12,2,{mount:'wall'}],
    ['ceramic-vase','Ceramic vase','bottle',5,10,5],['candle','Candle','mug',3.5,4,3.5],['snow-globe','Snow globe','fishbowl',4.5,6,4.5],['desk-sculpture','Desk sculpture','default',6,9,5],
    ['letter-board','Letter board','frame',10,10,1],['picture-ledge','Picture ledge','shelf',24,3.5,4],['memory-box','Memory box','storage',10,4,8],['decorative-tray','Decorative tray','basket',14,2,8],
  ],
  'Plants & Pets': [
    ['succulent','Succulent','plant',4,6,4],['pothos','Pothos plant','plant',7,12,7],['snake-plant','Snake plant','plant',8,24,8],['monstera','Monstera plant','plant',12,30,12],
    ['mini-cactus','Mini cactus','plant',3.5,6,3.5],['herb-pot','Herb pot','plant',6,9,6],['bonsai','Bonsai tree','plant',10,14,8],['hanging-plant','Hanging plant','plant',10,18,10],
    ['fishbowl','Fishbowl','fishbowl',10,10,10],['nano-aquarium','Nano aquarium','fishbowl',12,12,12],['five-gallon-tank','5-gallon aquarium','fishbowl',16,10,8],['ten-gallon-tank','10-gallon aquarium','fishbowl',20,12,10],
    ['pet-carrier','Pet carrier','storage',19,12,12],['small-pet-bed','Small pet bed','pillow',20,6,16],['feeding-mat','Feeding mat','poster',18,.2,12],['terrarium','Terrarium','fishbowl',12,14,12],
  ],
  'Bedding': [
    ['standard-pillow','Standard pillow','pillow',26,6,20],['body-pillow','Body pillow','pillow',54,7,20],['throw-pillow','Throw pillow','pillow',18,6,18],['wedge-pillow','Wedge pillow','pillow',24,10,24],
    ['twin-comforter','Twin XL comforter','pillow',68,4,92],['weighted-blanket','Weighted blanket','pillow',48,3,72],['throw-blanket','Throw blanket','pillow',50,3,60],['mattress-topper','Mattress topper','pillow',39,3,80],
    ['bed-tray','Bed tray','shelf',24,10,14],['lap-desk','Lap desk','shelf',21,3,14],['bed-rest','Bed rest pillow','pillow',25,20,12],['folding-screen','Privacy screen','frame',60,70,1],
    ['bed-canopy','Bed canopy','string-lights',40,84,80],['mosquito-net','Bed net','string-lights',40,84,80],['sheet-set-box','Sheet set box','storage',12,4,10],['blanket-basket','Blanket basket','basket',18,20,18],
  ],
  'Lighting': [
    ['desk-lamp','Desk lamp','lamp',7,18,7],['clip-lamp','Clip lamp','lamp',5,15,5],['architect-lamp','Architect lamp','lamp',8,28,8],['sunset-lamp','Sunset lamp','lamp',5,10,5],
    ['table-lamp','Table lamp','lamp',10,20,10],['tripod-lamp','Tripod floor lamp','lamp',20,62,20],['torchiere','Torchiere lamp','lamp',11,71,11],['reading-lamp','Reading floor lamp','lamp',10,58,10],
    ['ring-light-small','Small ring light','clock',10,14,6],['ring-light-large','Large ring light','clock',18,26,10],['light-bar','Monitor light bar','default',18,1.5,1.5],['led-strip-roll','LED strip controller','default',4,1,3],
    ['night-light','Night light','lamp',3,5,2],['lantern','Rechargeable lantern','lamp',5,9,5],['salt-lamp','Salt lamp','lamp',6,10,6],['projector-light','Galaxy projector','lamp',6,6,6],
  ],
  'Fitness': [
    ['yoga-mat','Yoga mat','poster',24,.3,68],['foam-roller','Foam roller','bottle',6,6,18],['dumbbell-pair','Dumbbell pair','default',14,6,8],['kettlebell','Kettlebell','default',8,10,8],
    ['resistance-bands','Resistance bands','default',8,3,5],['jump-rope','Jump rope','default',7,2,5],['pullup-bar','Doorway pull-up bar','shelf',36,8,4],['balance-board','Balance board','poster',28,4,12],
    ['exercise-ball','Exercise ball','fishbowl',26,26,26],['massage-gun','Massage gun','default',9,7,3],['ankle-weights','Ankle weights','default',12,4,5],['yoga-blocks','Yoga blocks','default',12,6,9],
    ['folding-bike','Folding exercise bike','chair',19,45,31],['step-platform','Step platform','default',27,6,11],['ab-roller','Ab roller','default',12,8,8],['gym-bag','Gym bag','basket',20,11,10],
  ],
  'Music': [
    ['acoustic-guitar','Acoustic guitar','instrument',15,41,5],['electric-guitar','Electric guitar','instrument',13,39,3],['ukulele','Ukulele','instrument',8,21,3],['violin-case','Violin case','storage',10,31,5],
    ['keyboard-49','49-key music keyboard','keyboard',32,4,10],['keyboard-61','61-key music keyboard','keyboard',39,5,12],['midi-controller','MIDI controller','keyboard',20,3,8],['drum-pad','Drum pad','keyboard',13,2,10],
    ['guitar-amp','Guitar amplifier','speaker',15,15,9],['studio-monitors','Studio monitor pair','speaker',14,12,10],['subwoofer','Compact subwoofer','speaker',12,14,13],['record-player','Record player','appliance',16,6,14],
    ['vinyl-crate','Vinyl record crate','storage',14,14,14],['mic-stand','Microphone stand','default',24,60,24],['music-stand','Music stand','frame',20,48,20],['headphones','Headphones','default',8,8,4],
  ],
  'Cleaning': [
    ['stick-vacuum','Stick vacuum','default',10,44,8],['hand-vacuum','Hand vacuum','default',15,6,5],['robot-vacuum','Robot vacuum','default',13.5,3.2,13.5],['mop-bucket','Mop bucket','basket',14,12,11],
    ['laundry-basket','Laundry basket','basket',24,14,17],['folding-hamper','Folding hamper','basket',15,24,15],['ironing-board','Tabletop ironing board','shelf',32,7,12],['drying-rack','Drying rack','shelf',30,41,20],
    ['trash-can-small','Small trash can','basket',9,12,9],['trash-can-tall','Tall trash can','basket',12,24,12],['recycling-bin','Recycling bin','storage',15,20,11],['cleaning-caddy','Cleaning caddy','basket',16,8,10],
    ['paper-towel-holder','Paper towel holder','default',7,14,7],['tissue-box','Tissue box','storage',9,4,5],['lint-roller','Lint roller','default',9,2,2],['shoe-mat','Shoe mat','poster',30,.4,15],
  ],
};

function autoMark(name) {
  return name.split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
}

const EXTRA_CATALOG = Object.entries(EXTRA_GROUPS).flatMap(([category, rows]) => rows.map(row => {
  const [id,name,kind,w,h,d,options={}] = row;
  const color = options.color || ({Tech:'#475569',Desk:'#64748b',Kitchen:'#6b7280',Storage:'#78909c',Decor:'#8b5cf6','Plants & Pets':'#4f8a58',Bedding:'#7c8db5',Lighting:'#eab308',Fitness:'#0d9488',Music:'#a16207',Cleaning:'#64748b'}[category] || '#64748b');
  return { id, name, category, mark:autoMark(name), mount:options.mount || 'floor', sizes:[size('Standard',w,h,d)], parts:catalogModelParts(id,kind,color,category) };
}));

const CATALOG = [...CORE_CATALOG, ...EXTRA_CATALOG];

export const ITEM_CATALOG = Object.freeze(CATALOG.map(item => Object.freeze({ ...item, dims: item.sizes[0].dims })));
export const CATALOG_BY_ID = new Map(ITEM_CATALOG.map(item => [item.id, item]));

export function catalogItemSpec(id, sizeIndex = 0) {
  const item = CATALOG_BY_ID.get(id);
  if (!item) return null;
  const chosen = item.sizes[Math.max(0, Math.min(item.sizes.length - 1, sizeIndex))];
  return {
    schemaVersion: 1,
    id: item.id,
    name: item.name,
    category: item.category,
    mount: item.mount || 'floor',
    dimensions: { ...chosen.dims },
    parts: item.parts.map(part => ({ ...part, position: [...part.position], size: [...part.size], ...(part.path ? { path: part.path.map(point => [...point]) } : {}), ...(part.profile ? { profile: part.profile.map(point => [...point]) } : {}), ...(part.outline ? { outline: part.outline.map(point => [...point]) } : {}), ...(part.rings ? { rings: part.rings.map(ring => ring.map(point => [...point])) } : {}) })),
  };
}

export const ITEM_SPEC_SCHEMA = {
  schemaVersion: 1,
  dimensions: 'meters: {w,h,d}',
  coordinates: 'normalized to item envelope: x/z -0.5..0.5, y 0..1',
  primitiveTypes: [
    'box','roundedBox','cylinder','cone','sphere','capsule','torus','tube',
    'plane','disc','ring','hemisphere','wedge','prism','pyramid','tetrahedron',
    'octahedron','dodecahedron','icosahedron','lathe','gear','star','torusKnot','cross','extrude','loft',
  ],
  maxParts: 120,
};

export function validateItemSpec(value) {
  if (!value || typeof value !== 'object') throw new Error('The model did not return an item object.');
  const spec = value.item ?? value;
  if (!spec.name || typeof spec.name !== 'string') throw new Error('Item name is required.');
  const d = spec.dimensions;
  if (!d || !['w','h','d'].every(k => Number.isFinite(+d[k]) && +d[k] > .001 && +d[k] < 6)) {
    throw new Error('Dimensions must be plausible positive meter values.');
  }
  if (!Array.isArray(spec.parts) || !spec.parts.length || spec.parts.length > ITEM_SPEC_SCHEMA.maxParts) {
    throw new Error(`Use between 1 and ${ITEM_SPEC_SCHEMA.maxParts} parts.`);
  }
  const allowed = new Set(ITEM_SPEC_SCHEMA.primitiveTypes);
  const parts = spec.parts.map((part, index) => {
    if (!allowed.has(part.type)) throw new Error(`Part ${index + 1} has unsupported type “${part.type}”.`);
    if (!Array.isArray(part.position) || part.position.length !== 3 || part.position.some(n => !Number.isFinite(+n) || Math.abs(+n) > 4)) throw new Error(`Part ${index + 1} needs a plausible numeric position.`);
    if (!Array.isArray(part.size) || part.size.length !== 3 || part.size.some(n => !Number.isFinite(+n) || +n <= 0 || +n > 4)) throw new Error(`Part ${index + 1} needs a plausible size.`);
    if (part.type === 'tube' && (!Array.isArray(part.path) || part.path.length < 2 || part.path.length > 64 || part.path.some(point => !Array.isArray(point) || point.length !== 3 || point.some(n => !Number.isFinite(+n) || Math.abs(+n) > 4)))) throw new Error(`Part ${index + 1} needs a valid tube path.`);
    if (part.type === 'lathe' && part.profile && (!Array.isArray(part.profile) || part.profile.length < 3 || part.profile.length > 64 || part.profile.some(point => !Array.isArray(point) || point.length !== 2 || point.some(n => !Number.isFinite(+n) || Math.abs(+n) > 4)))) throw new Error(`Part ${index + 1} needs a valid lathe profile.`);
    if (part.type === 'extrude' && (!Array.isArray(part.outline) || part.outline.length < 3 || part.outline.length > 64 || part.outline.some(point => !Array.isArray(point) || point.length !== 2 || point.some(n => !Number.isFinite(+n) || Math.abs(+n) > 4)))) throw new Error(`Part ${index + 1} needs a valid extrusion outline.`);
    if (part.type === 'loft' && (!Array.isArray(part.rings) || part.rings.length < 2 || part.rings.length > 16 || !part.rings[0]?.length || part.rings.some(ring => !Array.isArray(ring) || ring.length !== part.rings[0].length || ring.length < 3 || ring.length > 64 || ring.some(point => !Array.isArray(point) || point.length !== 3 || point.some(n => !Number.isFinite(+n) || Math.abs(+n) > 4))))) throw new Error(`Part ${index + 1} needs compatible loft rings.`);
    const color = /^#[0-9a-f]{6}$/i.test(part.color || '') ? part.color : '#7b8790';
    const rotation = Array.isArray(part.rotation) && part.rotation.length === 3 && part.rotation.every(n => Number.isFinite(+n)) ? part.rotation.map(Number) : [0,0,0];
    return {
      type: part.type,
      position: part.position.map(Number),
      size: part.size.map(Number),
      rotation,
      color,
      roughness: Number.isFinite(+part.roughness) ? Math.max(0, Math.min(1, +part.roughness)) : .7,
      metalness: Number.isFinite(+part.metalness) ? Math.max(0, Math.min(1, +part.metalness)) : 0,
      opacity: Number.isFinite(+part.opacity) ? Math.max(.12, Math.min(1, +part.opacity)) : 1,
      emissive: /^#[0-9a-f]{6}$/i.test(part.emissive || '') ? part.emissive : undefined,
      finish: typeof part.finish === 'string' ? part.finish.slice(0, 32) : undefined,
      path: part.type === 'tube' ? part.path.map(point => point.map(Number)) : undefined,
      profile: part.profile ? part.profile.map(point => point.map(Number)) : undefined,
      outline: part.outline ? part.outline.map(point => point.map(Number)) : undefined,
      rings: part.rings ? part.rings.map(ring => ring.map(point => point.map(Number))) : undefined,
      radius: Number.isFinite(+part.radius) ? Math.max(.001, Math.min(.25, +part.radius)) : undefined,
    };
  });
  return {
    schemaVersion: 1,
    id: `generated-${Date.now().toString(36)}`,
    name: spec.name.trim().slice(0, 80),
    category: typeof spec.category === 'string' ? spec.category.trim().slice(0, 40) : 'Generated',
    dimensions: { w:+d.w, h:+d.h, d:+d.d },
    parts,
    generated: true,
  };
}
