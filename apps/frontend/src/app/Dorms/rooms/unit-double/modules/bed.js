export function buildBed(ctx,{drawerSide='near'}={}) {
  const { THREE,mats,spec,H }=ctx;
  const B=spec.BED, g=new THREE.Group(); g.name='single-bed';
  const vinyl=new THREE.MeshStandardMaterial({color:spec.COLORS.mattress,roughness:.32});
  const railY=B.deck-.05;

  for(const x of [B.postW/2,B.L-B.postW/2]) for(const z of [B.postD/2,B.W-B.postD/2])
    g.add(H.box(THREE,mats.wood,B.postW,B.postH,B.postD,{x,y:B.postH/2,z,r:.004}));
  for(const z of [.04,B.W-.04]) g.add(H.box(THREE,mats.wood,B.L-2*B.postW,B.railH,.04,{x:B.L/2,y:railY,z,r:.004}));
  for(const x of [.04,B.L-.04]) {
    g.add(H.box(THREE,mats.wood,.04,.15,B.W-2*B.postD,{x,y:B.deck-.04,z:B.W/2,r:.004}));
    g.add(H.box(THREE,mats.wood,.04,.10,B.W-2*B.postD,{x,y:.78,z:B.W/2,r:.004}));
  }
  for(let i=0;i<9;i++) g.add(H.box(THREE,mats.wood,.075,.018,B.W-.12,{x:.15+i*(B.L-.30)/8,y:B.deck-.09,z:B.W/2,r:.002}));

  const movein=new THREE.Group(); movein.userData.moveinOnly=true;
  movein.add(H.box(THREE,vinyl,B.mattL,B.mattH,B.mattW,{x:B.L/2,y:B.deck+B.mattH/2,z:B.W/2,r:.05}));
  g.add(movein);
  const furnished=new THREE.Group(); furnished.userData.furnishedOnly=true;
  furnished.add(H.box(THREE,mats.sheet,B.mattL,B.mattH,B.mattW,{x:B.L/2,y:B.deck+B.mattH/2,z:B.W/2,r:.05}));
  furnished.add(H.box(THREE,mats.duvet,1.55,.13,B.mattW+.05,{x:1.31,y:B.deck+.25,z:B.W/2,r:.035}));
  furnished.add(H.box(THREE,mats.pillow,.45,.13,.61,{x:.30,y:B.deck+.25,z:B.W/2,r:.05,rz:-.10}));
  g.add(furnished);

  // Three maple drawers under each bed, facing the student's aisle.
  const faceZ=drawerSide==='far'?B.W-.015:.015;
  const bodyZ=drawerSide==='far'?B.W-.23:.23;
  g.add(H.box(THREE,mats.wood,B.L-.24,.34,.46,{x:B.L/2,y:.20,z:bodyZ,r:.008}));
  for(let i=0;i<3;i++){
    const cx=.27+i*(B.L-.54)/2;
    g.add(H.box(THREE,mats.wood,(B.L-.34)/3,.26,.025,{x:cx,y:.22,z:faceZ,r:.006}));
    g.add(H.box(THREE,mats.woodDark,.13,.018,.01,{x:cx,y:.30,z:drawerSide==='far'?B.W+.002:-.002,r:.003}));
  }
  const shadow=H.contactShadow(THREE,B.L+.10,B.W+.10,{opacity:.28}); shadow.position.set(B.L/2,0,B.W/2); g.add(shadow);
  return g;
}

// Tall entry-side shelf shown in the supplied video still.
// Local back is z=0 and the unit extends +x along the side wall.
export function buildBookcase(ctx) {
  const {THREE,mats,spec,H}=ctx, S=spec.BOOKCASE, g=new THREE.Group();
  const t=.045;
  g.add(H.box(THREE,mats.partition,t,S.h,S.d,{x:t/2,y:S.h/2,z:S.d/2,r:.003}));
  g.add(H.box(THREE,mats.partition,t,S.h,S.d,{x:S.w-t/2,y:S.h/2,z:S.d/2,r:.003}));
  g.add(H.box(THREE,mats.partition,S.w,S.h,.025,{x:S.w/2,y:S.h/2,z:.013}));
  for(let i=0;i<=S.shelves;i++) g.add(H.box(THREE,mats.partition,S.w,.035,S.d,{x:S.w/2,y:.035/2+i*(S.h-.035)/S.shelves,z:S.d/2,r:.003}));
  return g;
}
