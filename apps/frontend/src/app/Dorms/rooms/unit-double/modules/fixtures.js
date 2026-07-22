export function buildFixtures(ctx) {
  const {THREE,mats,spec,H}=ctx, {ROOM,RADIATOR,LIGHTBOX,LAYOUT}=spec, g=new THREE.Group();
  const r=RADIATOR;
  g.add(H.box(THREE,mats.radiator,r.w,r.h,r.d,{x:LAYOUT.radiator.x,y:r.y0+r.h/2,z:LAYOUT.radiator.z,r:.006}));
  for(let i=0;i<22;i++) g.add(H.box(THREE,mats.metalDark,.012,.012,r.d+.006,{x:LAYOUT.radiator.x-r.w/2+.10+i*(r.w-.20)/21,y:r.y0+r.h+.004,z:LAYOUT.radiator.z,cast:false}));
  const lens=mats.lightLens.clone();
  const light=new THREE.Group(); light.userData.isCeiling=true; light.userData.isLightbox=true;
  light.add(H.box(THREE,mats.trim,LIGHTBOX.w,LIGHTBOX.h,LIGHTBOX.d,{y:-LIGHTBOX.h/2,r:.008}));
  light.add(H.box(THREE,lens,LIGHTBOX.w-.05,.012,LIGHTBOX.d-.05,{y:-LIGHTBOX.h-.006}));
  light.position.set(LAYOUT.lightbox.x,ROOM.H,LAYOUT.lightbox.z); g.add(light);
  g.userData.api={setLight(on){lens.emissive.setHex(on?0xffe1a0:0);lens.emissiveIntensity=on?1.8:0}};
  return g;
}
