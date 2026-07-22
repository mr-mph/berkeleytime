import { describe, it, expect } from 'vitest';
import {
  BOOKCASE, CLOSET, CURTAIN, DESK, EYE, FRIDGE, LAYOUT, RADIATOR, ROOM, WINDOW,
} from '../unit-double/spec.js';
import { HOP_MARGIN, constrainToRoom, createJumpState, queueJump, stepJump } from '../walk-physics.js';

describe('unit double entry shelf and closets', () => {
  it('has the single referenced entry shelf', () => {
    expect(LAYOUT.entryShelf).toBeTruthy();
  });

  it('does not invent a left-side shelf', () => {
    expect(LAYOUT.shelfLeft).toBeUndefined();
  });

  it('does not overlap a shelf with the right closet', () => {
    expect(LAYOUT.shelfRight).toBeUndefined();
  });

  it('keeps the left closet flush to the outer wall', () => {
    expect(CLOSET.left.x0).toBe(0);
  });

  it('keeps the right closet flush to the outer wall', () => {
    expect(CLOSET.right.x1).toBe(ROOM.L);
  });

  it('makes the entry shelf as tall as the closets', () => {
    expect(BOOKCASE.h).toBe(CLOSET.h);
  });

  it('attaches the shelf to the side of the right closet', () => {
    expect(LAYOUT.entryShelf.x).toBe(CLOSET.right.x0);
  });

  it('keeps the shelf on the closet wall plane', () => {
    expect(LAYOUT.entryShelf.z).toBe(0);
  });

  it('faces the shelf opening toward the door, perpendicular to the closet fronts', () => {
    expect(LAYOUT.entryShelf.rotY).toBe(-Math.PI / 2);
  });

  it('fills the bay with the shelf without blocking the door', () => {
    expect(Math.abs((LAYOUT.entryShelf.x - BOOKCASE.d) - (1.64 + 0.91))).toBeLessThan(1e-9);
  });
});

describe('unit double desks and chairs', () => {
  it('uses the measured 41-inch standalone desk width', () => {
    expect(DESK.w).toBeCloseTo(41 * 0.0254, 10);
  });

  it('shares the center line between the desks', () => {
    expect(LAYOUT.deskLeft.x).toBe(LAYOUT.deskRight.x);
  });

  it('meets the desks end-to-end along their long axis', () => {
    expect(Math.abs((LAYOUT.deskLeft.z - LAYOUT.deskRight.z) - DESK.w)).toBeLessThan(1e-9);
  });

  it('clears the heater/AC footprint with the window desk', () => {
    expect(LAYOUT.deskLeft.z + DESK.w / 2).toBeLessThan(ROOM.W - 0.12);
  });

  it('runs both desk long axes entry-to-window', () => {
    expect(Math.abs(Math.sin(LAYOUT.deskLeft.rotY))).toBeGreaterThan(0.999);
    expect(Math.abs(Math.sin(LAYOUT.deskRight.rotY))).toBeGreaterThan(0.999);
  });

  const chairFacesDesk = (chair, desk) => Math.sign(Math.sin(chair.rotY)) === Math.sign(desk.x - chair.x);

  it('faces the left chair toward its desk', () => {
    expect(chairFacesDesk(LAYOUT.chairLeft, LAYOUT.deskLeft)).toBe(true);
  });

  it('faces the right chair toward its desk', () => {
    expect(chairFacesDesk(LAYOUT.chairRight, LAYOUT.deskRight)).toBe(true);
  });

  it('keeps the window desk chair on the left side', () => {
    expect(LAYOUT.chairLeft.x).toBeLessThan(LAYOUT.deskLeft.x);
  });
});

describe('unit double MicroChill placement', () => {
  it('stands the MicroChill to the right of the window desk', () => {
    expect(LAYOUT.microchill.x).toBeGreaterThan(LAYOUT.deskLeft.x + DESK.d / 2);
  });

  it('stands the MicroChill on the floor', () => {
    expect(LAYOUT.microchill.y).toBe(0);
  });

  it('sits the MicroChill back four centimeters in front of the heater', () => {
    expect(Math.abs((ROOM.W - RADIATOR.d) - LAYOUT.microchill.z - 0.04)).toBeLessThan(1e-9);
  });

  it('keeps the MicroChill beside the window desk instead of drifting past it', () => {
    expect(LAYOUT.microchill.z - FRIDGE.d).toBeGreaterThan(LAYOUT.deskLeft.z - DESK.w / 2);
  });
});

describe('unit double curtains', () => {
  it('stops the curtain bottoms above the windowsill', () => {
    expect(CURTAIN.trackY - 0.03 - CURTAIN.drop).toBeGreaterThan(WINDOW.y0);
  });

  it('keeps the left curtain edge inside the left window post', () => {
    expect(CURTAIN.z0).toBeGreaterThanOrEqual(WINDOW.z0 + WINDOW.frameT);
  });

  it('keeps the right curtain edge inside the right window post', () => {
    expect(CURTAIN.z1).toBeLessThanOrEqual(WINDOW.z0 + WINDOW.w - WINDOW.frameT);
  });
});

describe('shared walk physics', () => {
  it('collides only with the room perimeter in walk mode', () => {
    const walkPosition = { x: -5, z: ROOM.W + 5 };
    constrainToRoom(walkPosition, ROOM, 0.22);
    expect(walkPosition).toEqual({ x: 0.22, z: ROOM.W - 0.22 });
  });

  it('jumps clear of a standard dorm desk, stays below the ceiling, and lands grounded', () => {
    const jump = createJumpState();
    queueJump(jump);
    let maxHeight = 0;
    for (let i = 0; i < 180; i++) maxHeight = Math.max(maxHeight, stepJump(jump, 1 / 60));
    expect(maxHeight).toBeGreaterThan(DESK.h + HOP_MARGIN);
    expect(EYE + maxHeight).toBeLessThan(ROOM.H);
    expect(jump.height).toBe(0);
    expect(jump.grounded).toBe(true);
  });
});
