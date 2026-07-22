import { describe, it, expect } from 'vitest';
import { BED, FRIDGE, LAYOUT, ROOM, STUBS } from '../spec.js';

const near = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

describe('Blackwell layout', () => {
  it('keeps Bed A head against the entry end wall', () => {
    expect(LAYOUT.bedA.x).toBeLessThanOrEqual(0.03);
  });

  it('keeps Bed B head against the window end wall', () => {
    expect(near(LAYOUT.bedB.x + BED.L, ROOM.L - 0.03)).toBe(true);
  });

  it('does not include a dresser beside Bed A', () => {
    expect(LAYOUT.dresserA).toBeUndefined();
  });

  it('does not include a dresser beside Bed B', () => {
    expect(LAYOUT.dresserB).toBeUndefined();
  });

  it('begins both beds on the same wall plane for equal aisle clearance', () => {
    expect(LAYOUT.bedA.z).toBe(LAYOUT.bedB.z);
  });

  it('gives both beds exactly equal clear space beside their inner ends', () => {
    const leftGap = STUBS.s1x - (LAYOUT.bedA.x + BED.L);
    const rightGap = LAYOUT.bedB.x - (STUBS.s2x + STUBS.t);
    expect(near(leftGap, rightGap)).toBe(true);
  });

  it('keeps each inner bed gap at 34 centimeters', () => {
    const leftGap = STUBS.s1x - (LAYOUT.bedA.x + BED.L);
    expect(near(leftGap, 0.34)).toBe(true);
  });

  it('centers the MicroChill niche in the room', () => {
    expect(near((STUBS.s1x + STUBS.s2x + STUBS.t) / 2, ROOM.L / 2)).toBe(true);
  });

  it('centers the MicroChill stack inside the centered niche', () => {
    expect(near(LAYOUT.fridge.x + FRIDGE.w / 2, ROOM.L / 2)).toBe(true);
  });
});
