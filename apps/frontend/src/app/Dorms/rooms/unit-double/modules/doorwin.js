import { buildDoor as buildSharedDoor, buildWindow as buildSharedWindow } from '../../unit-triple/modules/doorwin.js';

export const buildDoor = buildSharedDoor;

// The shared window is authored on x=ROOM.L. Rotate that complete assembly
// onto z=ROOM.W, preserving its curtains, sliders and exterior view.
export function buildWindow(ctx) {
  const g = new ctx.THREE.Group();
  const window = buildSharedWindow(ctx);
  window.rotation.y = -Math.PI / 2;
  window.position.set(ctx.spec.ROOM.L, 0, ctx.spec.ROOM.W - ctx.spec.ROOM.L);
  g.add(window);
  g.userData.api = window.userData.api;
  return g;
}
