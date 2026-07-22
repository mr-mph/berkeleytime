export function buildClosets(ctx) {
  const {THREE,mats,spec,H}=ctx, {CLOSET,ROOM}=spec, g=new THREE.Group();
  const lightM=mats.lightLens.clone(); lightM.emissive.setHex(0xffe5b0); lightM.emissiveIntensity=.65;
  for(const [side,c] of Object.entries({left:CLOSET.left,right:CLOSET.right})){
    const w=c.x1-c.x0, cx=(c.x0+c.x1)/2, t=.055;
    g.add(H.box(THREE,mats.partition,w,.07,CLOSET.depth,{x:cx,y:.035,z:CLOSET.depth/2}));
    g.add(H.box(THREE,mats.partition,w,.08,CLOSET.depth,{x:cx,y:CLOSET.h-.04,z:CLOSET.depth/2}));
    for(const x of [c.x0+t/2,c.x1-t/2]) g.add(H.box(THREE,mats.partition,t,CLOSET.h,CLOSET.depth,{x,y:CLOSET.h/2,z:CLOSET.depth/2}));
    g.add(H.box(THREE,mats.partition,w,.025,.54,{x:cx,y:CLOSET.shelfY,z:.28,r:.003}));
    g.add(H.cyl(THREE,mats.chrome,.014,.014,w-.12,{x:cx,y:CLOSET.rodY,z:.37,rz:Math.PI/2,seg:20}));
    // Each resident gets a mirror and its own light beside the door.
    const mw=CLOSET.mirror.w, mh=CLOSET.mirror.h, mx=side==='left'?c.x1-mw/2-.10:c.x0+mw/2+.10;
    const frame=H.frame(THREE,mats.trim,mw+.05,mh+.05,.025,.018); frame.position.set(mx,CLOSET.mirror.y0+mh/2,CLOSET.depth+.012); g.add(frame);
    const mirror=H.makeMirror(THREE,mw,mh,{res:256}); mirror.position.set(mx,CLOSET.mirror.y0+mh/2,CLOSET.depth+.024); H.noShadow(mirror); g.add(mirror);
    g.add(H.box(THREE,lightM,.28,.06,.035,{x:mx,y:CLOSET.lightY,z:CLOSET.depth+.025,r:.012}));
  }
  return g;
}
