// Vitest port of the prototype CLI smoke runners (smoke.mjs, smoke-unit.mjs,
// smoke-unit-double.mjs): for each room, call every exported build* function
// with a real ctx (non-procedural materials) and check the resulting
// Object3D's bounding box is sane (finite, plausible size).
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as H from '../helpers.js';

import { createMaterials as createBlackwellMaterials } from '../materials.js';
import * as blackwellSpec from '../spec.js';
import * as bwBed from '../modules/bed.js';
import * as bwCloset from '../modules/closet.js';
import * as bwDesk from '../modules/desk.js';
import * as bwDoorwin from '../modules/doorwin.js';
import * as bwFan from '../modules/fan.js';
import * as bwFixtures from '../modules/fixtures.js';
import * as bwMicrochill from '../modules/microchill.js';
import * as bwShell from '../modules/shell.js';

import { createMaterials as createTripleMaterials } from '../unit-triple/materials.js';
import * as tripleSpec from '../unit-triple/spec.js';
import * as utBed from '../unit-triple/modules/bed.js';
import * as utCloset from '../unit-triple/modules/closet.js';
import * as utDesk from '../unit-triple/modules/desk.js';
import * as utDoorwin from '../unit-triple/modules/doorwin.js';
import * as utFixtures from '../unit-triple/modules/fixtures.js';
import * as utShell from '../unit-triple/modules/shell.js';

import { createMaterials as createDoubleMaterials } from '../unit-double/materials.js';
import * as doubleSpec from '../unit-double/spec.js';
import * as udBed from '../unit-double/modules/bed.js';
import * as udCloset from '../unit-double/modules/closet.js';
import * as udDesk from '../unit-double/modules/desk.js';
import * as udDoorwin from '../unit-double/modules/doorwin.js';
import * as udFixtures from '../unit-double/modules/fixtures.js';
import * as udShell from '../unit-double/modules/shell.js';

const ROOMS = [
  {
    room: 'blackwell',
    spec: blackwellSpec,
    createMaterials: createBlackwellMaterials,
    modules: {
      bed: bwBed,
      closet: bwCloset,
      desk: bwDesk,
      doorwin: bwDoorwin,
      fan: bwFan,
      fixtures: bwFixtures,
      microchill: bwMicrochill,
      shell: bwShell,
    },
    variantArgs: {
      buildBed: [{ variant: 'A' }, { variant: 'B' }],
      buildCloset: [{ letter: 'A' }, { letter: 'B' }],
    },
  },
  {
    room: 'unit-triple',
    spec: tripleSpec,
    createMaterials: createTripleMaterials,
    // `microchill` is the shared Blackwell module run with the triple ctx.
    modules: {
      bed: utBed,
      closet: utCloset,
      desk: utDesk,
      doorwin: utDoorwin,
      fixtures: utFixtures,
      shell: utShell,
      microchill: bwMicrochill,
    },
    variantArgs: {
      buildBed: [{ variant: 'bunk' }, { variant: 'loft' }],
    },
  },
  {
    room: 'unit-double',
    spec: doubleSpec,
    createMaterials: createDoubleMaterials,
    // `microchill` is the shared Blackwell module run with the double ctx.
    modules: {
      bed: udBed,
      closet: udCloset,
      desk: udDesk,
      doorwin: udDoorwin,
      fixtures: udFixtures,
      shell: udShell,
      microchill: bwMicrochill,
    },
    variantArgs: {
      buildBed: [{ drawerSide: 'near' }, { drawerSide: 'far' }],
    },
  },
];

describe.each(ROOMS)('$room smoke', ({ spec, createMaterials, modules, variantArgs }) => {
  const mats = createMaterials(THREE, { procedural: false });
  const ctx = { THREE, mats, spec, H };

  it.each(Object.keys(modules).map(name => [name]))('%s exports at least one build* function', (moduleName) => {
    const builders = Object.entries(modules[moduleName])
      .filter(([name, fn]) => typeof fn === 'function' && name.startsWith('build'));
    expect(builders.length).toBeGreaterThanOrEqual(1);
  });

  const cases = Object.entries(modules).flatMap(([moduleName, mod]) =>
    Object.entries(mod)
      .filter(([name, fn]) => typeof fn === 'function' && name.startsWith('build'))
      .flatMap(([name, fn]) => (variantArgs[name] ?? [undefined]).map(args => ({
        title: `${moduleName}.${name}${args ? ' ' + JSON.stringify(args) : ''}`,
        fn,
        args,
      }))));

  it.each(cases)('$title builds an Object3D with a sane bounding box', ({ fn, args }) => {
    const g = args === undefined ? fn(ctx) : fn(ctx, args);
    expect(g && g.isObject3D, 'must return an Object3D').toBe(true);
    const bb = new THREE.Box3().setFromObject(g);
    for (const v of [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z]) {
      expect(Number.isFinite(v), 'bounding box must be finite').toBe(true);
    }
    const size = new THREE.Vector3();
    bb.getSize(size);
    expect(size.length(), 'bounding box diagonal must be plausible').toBeLessThanOrEqual(30);
  });
});
