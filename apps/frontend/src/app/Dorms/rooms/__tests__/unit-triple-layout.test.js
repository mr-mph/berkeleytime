import { describe, it, expect } from 'vitest';
import {
  BED, CLOSET, CURTAIN, DESK, DOOR, DRESSER, FRIDGE, LAYOUT, ROOM, WINDOW,
} from '../unit-triple/spec.js';

const near = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

describe('unit triple entry wall and closet run', () => {
  // Entry wall: the first closet partition continues directly from the hinge
  // jamb. A later layout edit must not reintroduce the visible dead strip.
  it('begins the closet at the door hinge jamb', () => {
    expect(CLOSET.z0).toBe(DOOR.hingeZ);
  });

  it('finishes the closet run flush at the far wall', () => {
    const closetEnd = CLOSET.z0 + CLOSET.bays * CLOSET.bayW
      + (CLOSET.bays + 1) * CLOSET.partT;
    expect(near(closetEnd, ROOM.W)).toBe(true);
  });

  it('puts storage dressers in both closet bays', () => {
    expect(CLOSET.dresserBays).toEqual([0, 1]);
  });

  it('does not mount outlets in the entry door opening', () => {
    expect(LAYOUT.outlets.some((o) => o.wall === 'entry'
      && o.z > DOOR.z0 && o.z < DOOR.z0 + DOOR.w)).toBe(false);
  });

  it('fits two compact dressers side-by-side in one closet bay', () => {
    expect(DRESSER.w * 2 + 0.05).toBeLessThanOrEqual(CLOSET.bayW);
  });
});

describe('unit triple curtains', () => {
  it('begins the curtains inside the window jamb', () => {
    expect(CURTAIN.z0).toBe(WINDOW.z0);
  });

  it('ends the curtains inside the window jamb', () => {
    expect(CURTAIN.z1).toBe(WINDOW.z0 + WINDOW.w);
  });

  it('keeps the curtain hem clear of the top of the window sill', () => {
    expect(CURTAIN.trackY - CURTAIN.drop).toBeGreaterThan(WINDOW.y0);
  });
});

describe('unit triple bed walls', () => {
  // Official top-down render: loft/under-loft desks on z=0, bunk opposite.
  it('places the loft on the upper wall', () => {
    expect(LAYOUT.loft.z).toBeLessThan(0.05);
  });

  it('places the bunk on the opposite wall', () => {
    expect(LAYOUT.bunk.z).toBeGreaterThan(ROOM.W - 0.05);
  });

  it('aligns the opposing bed runs', () => {
    expect(LAYOUT.loft.x).toBe(LAYOUT.bunk.x);
  });

  it('keeps the beds close to the window/curtains', () => {
    expect(near(ROOM.L - (LAYOUT.loft.x + BED.L), 0.12)).toBe(true);
  });
});

describe('unit triple freestanding dresser and MicroChill', () => {
  // The remaining freestanding dresser sits at the bunk foot. The loft-side
  // storage dresser moved into the second closet bay, freeing the entry wall.
  it('keeps the bunk dresser left of the bunk', () => {
    expect(LAYOUT.dresserBunk.x + DRESSER.w).toBeLessThanOrEqual(LAYOUT.bunk.x);
  });

  it('keeps the MicroChill clear of the doorway and open-door ingress path', () => {
    expect(LAYOUT.fridge.x).toBeGreaterThan(DOOR.w + 0.2);
  });

  it('tucks the MicroChill beside the loft foot', () => {
    expect(LAYOUT.fridge.x + FRIDGE.w).toBeLessThanOrEqual(LAYOUT.loft.x);
  });
});

// Desk backs touch z=0 after their PI rotation; chair fronts point -z toward
// those desks and both chairs sit on their corresponding centerlines.
it('uses the measured 41-inch standalone desk width', () => {
  expect(DESK.w).toBeCloseTo(41 * 0.0254, 10);
});

describe.each([
  ['A', LAYOUT.deskA, LAYOUT.chairA],
  ['B', LAYOUT.deskB, LAYOUT.chairB],
])('unit triple under-loft desk %s', (label, desk, chair) => {
  it('backs the under-loft desk to z=0', () => {
    expect(near(desk.z, 0.02 + DESK.d / 2)).toBe(true);
  });

  it('faces the under-loft chair toward its desk', () => {
    expect(near(chair.rotY, Math.PI)).toBe(true);
  });

  it('sits the under-loft chair in front of its desk', () => {
    expect(chair.z).toBeGreaterThan(desk.z);
  });

  it('aligns the chair with its desk center', () => {
    expect(near(chair.x, desk.cx, 0.01)).toBe(true);
  });
});
