// Shared geometry helpers. Import as: import * as H from '../helpers.js'
// All helpers take THREE as first arg so modules never import three directly
// (keeps every module on the single bundled instance).
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

const hasDOM = typeof document !== 'undefined';

// box mesh; r>0 -> rounded edges. shadow: both cast+receive by default.
export function box(THREE, mat, w, h, d, { x = 0, y = 0, z = 0, r = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true } = {}) {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

export function cyl(THREE, mat, rTop, rBot, h, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, seg = 24, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

// real planar mirror (extra render pass per mirror; keep resolution modest)
export function makeMirror(THREE, w, h, { res = 512, color = 0xc8ccd0 } = {}) {
  const mirror = new Reflector(new THREE.PlaneGeometry(w, h), {
    textureWidth: res, textureHeight: res, color, clipBias: 0.003,
  });
  return mirror;
}

// soft radial contact-shadow plane (fake AO under furniture). y slightly above floor.
export function contactShadow(THREE, w, d, { opacity = 0.28 } = {}) {
  const g = new THREE.Group();
  if (!hasDOM) return g;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, `rgba(20,16,12,${opacity})`);
  grad.addColorStop(0.72, `rgba(20,16,12,${opacity * 0.4})`);
  grad.addColorStop(1, 'rgba(20,16,12,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  m.renderOrder = 1;
  g.add(m);
  return g;
}

// small canvas-texture label plane (plaques, thermostat LCD). In node returns plain plane.
export function labelPlane(THREE, w, h, { text = '', bg = '#2c3a6b', fg = '#ffffff', font = 'bold 90px Helvetica, Arial', pad = 0 } = {}) {
  let mat;
  if (hasDOM) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = Math.max(64, Math.round(256 * h / w));
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg; ctx.font = font;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height / 2 + pad);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: 0x2c3a6b });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.castShadow = false; m.receiveShadow = false;
  return m;
}

// rectangular frame made of 4 box bars, lying in XY plane, centered at origin.
// outer w×h, bar thickness t, depth d.
export function frame(THREE, mat, w, h, t, d) {
  const g = new THREE.Group();
  g.add(box(THREE, mat, w, t, d, { y: h / 2 - t / 2 }));
  g.add(box(THREE, mat, w, t, d, { y: -h / 2 + t / 2 }));
  g.add(box(THREE, mat, t, h - 2 * t, d, { x: -w / 2 + t / 2 }));
  g.add(box(THREE, mat, t, h - 2 * t, d, { x: w / 2 - t / 2 }));
  return g;
}

// disable shadows recursively (for glass, mirrors, emissives)
export function noShadow(obj) {
  obj.traverse?.(o => { o.castShadow = false; o.receiveShadow = false; });
  if (!obj.traverse) { obj.castShadow = false; obj.receiveShadow = false; }
  return obj;
}
