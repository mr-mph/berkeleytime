export function buildShell(ctx) {
  const { THREE, mats, spec, H } = ctx;
  const { ROOM, DOOR, WINDOW, ENTRY, CEIL } = spec;
  const { L, W, H:HT, wallT:T, baseH, baseT } = ROOM;
  const g = new THREE.Group(); g.name='shell';
  const box=(mat,x0,x1,y0,y1,z0,z1,opt={})=>H.box(THREE,mat,x1-x0,y1-y0,z1-z0,{x:(x0+x1)/2,y:(y0+y1)/2,z:(z0+z1)/2,...opt});

  const floor=box(mats.carpet,-T,L+T,-.10,0,-T,W+T,{cast:false}); floor.name='floor'; g.add(floor);
  g.add(box(mats.lino,ENTRY.x0,ENTRY.x1,0,.004,-.005,ENTRY.z1,{cast:false}));
  g.add(box(mats.brushed,ENTRY.x0-.015,ENTRY.x0+.015,0,.007,0,ENTRY.z1));
  g.add(box(mats.brushed,ENTRY.x1-.015,ENTRY.x1+.015,0,.007,0,ENTRY.z1));
  g.add(box(mats.brushed,ENTRY.x0,ENTRY.x1,0,.007,ENTRY.z1-.015,ENTRY.z1+.015));

  // Side walls.
  g.add(box(mats.wall,-T,0,0,HT,-T,W+T));
  g.add(box(mats.wall,L,L+T,0,HT,-T,W+T));

  // Entry wall, with a centered inward-swinging door.
  const dx0=DOOR.x0, dx1=dx0+DOOR.w;
  g.add(box(mats.wall,-T,dx0,0,HT,-T,0));
  g.add(box(mats.wall,dx0,dx1,DOOR.h,HT,-T,0));
  g.add(box(mats.wall,dx1,L+T,0,HT,-T,0));

  // Opposing window wall. The opening is centered across x.
  const wx0=L-(WINDOW.z0+WINDOW.w), wx1=L-WINDOW.z0;
  const wy1=WINDOW.y0+WINDOW.h;
  g.add(box(mats.wall,-T,wx0,0,HT,W,W+T));
  g.add(box(mats.wall,wx1,L+T,0,HT,W,W+T));
  g.add(box(mats.wall,wx0,wx1,0,WINDOW.y0,W,W+T));
  g.add(box(mats.wall,wx0,wx1,wy1,HT,W,W+T));

  const ceiling=box(mats.ceiling,-T,L+T,HT,HT+.12,-T,W+T); ceiling.userData.isCeiling=true; g.add(ceiling);
  for(const x of CEIL.ribX){const rib=box(mats.ceiling,x-CEIL.ribW/2,x+CEIL.ribW/2,HT-CEIL.ribD,HT+.01,0,W);rib.userData.isCeiling=true;g.add(rib)}

  const cove=(x0,x1,z0,z1)=>g.add(box(mats.cove,x0,x1,0,baseH,z0,z1,{r:.002}));
  cove(0,baseT,0,W); cove(L-baseT,L,0,W);
  cove(0,dx0-DOOR.casingW,0,baseT); cove(dx1+DOOR.casingW,L,0,baseT);
  cove(0,wx0,W-baseT,W); cove(wx1,L,W-baseT,W);
  return g;
}
