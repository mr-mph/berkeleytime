import { describe, it, expect } from 'vitest';
import { ITEM_CATALOG, CATALOG_BY_ID, ITEM_SPEC_SCHEMA, catalogItemSpec, validateItemSpec } from '../catalog.js';
import { rotateByKeyboardStep, rotationSliderDegrees } from '../planner.js';

describe('catalog integrity', () => {
  it('offers at least 200 measured items', () => {
    expect(ITEM_CATALOG.length).toBeGreaterThanOrEqual(200);
  });

  it('keeps catalog IDs unique', () => {
    expect(CATALOG_BY_ID.size).toBe(ITEM_CATALOG.length);
  });

  it('includes a useful wall-decor selection', () => {
    expect(ITEM_CATALOG.filter(item => item.mount === 'wall').length).toBeGreaterThanOrEqual(10);
  });

  it('exposes a broad production modeling vocabulary', () => {
    expect(ITEM_SPEC_SCHEMA.primitiveTypes.length).toBe(26);
  });

  it('includes production-scale secondary detail in every catalog model', () => {
    expect(ITEM_CATALOG.every(item => item.parts.length >= 18)).toBe(true);
  });

  it('maintains a high average geometry-detail budget without detached filler geometry', () => {
    const average = ITEM_CATALOG.reduce((sum, item) => sum + item.parts.length, 0) / ITEM_CATALOG.length;
    expect(average).toBeGreaterThanOrEqual(27);
  });

  it('retains the bespoke high-detail tape dispenser model', () => {
    expect(CATALOG_BY_ID.get('tape-dispenser').parts.length).toBeGreaterThanOrEqual(30);
  });

  it('retains strings, frets, tuning hardware, and body detail on the stringed instruments', () => {
    for (const id of ['acoustic-guitar', 'electric-guitar', 'ukulele']) {
      expect(CATALOG_BY_ID.get(id).parts.length, `${id} should retain strings, frets, tuning hardware, and body detail`).toBeGreaterThanOrEqual(40);
    }
  });

  it('includes the expected everyday items', () => {
    for (const id of ['wireless-mouse', 'mechanical-keyboard', 'coffee-mug', 'fishbowl', 'leaf-garland', 'photo-frame-small']) {
      expect(CATALOG_BY_ID.has(id), `catalog should include ${id}`).toBe(true);
    }
  });
});

describe('rotationSliderDegrees', () => {
  it('does not wrap its right endpoint back to zero', () => {
    expect(rotationSliderDegrees(Math.PI * 2)).toBe(360);
  });

  it('still displays zero for an untouched rotation', () => {
    expect(rotationSliderDegrees(0)).toBe(0);
  });
});

describe('rotateByKeyboardStep', () => {
  it('rotates three degrees for each R keydown', () => {
    expect(rotationSliderDegrees(rotateByKeyboardStep(0))).toBeCloseTo(3, 10);
  });

  it('supports repeated keydowns without leaving the rotation range', () => {
    let rotation = 0;
    for (let i = 0; i < 121; i++) rotation = rotateByKeyboardStep(rotation);
    expect(rotationSliderDegrees(rotation)).toBeCloseTo(3, 10);
  });
});

describe('per-item specs', () => {
  it('caps and validates every provider spec', () => {
    for (const item of ITEM_CATALOG) {
      expect(item.id).toMatch(/^[a-z0-9-]+$/);
      expect(item.sizes.length).toBeGreaterThanOrEqual(1);
      item.sizes.forEach((option, index) => {
        const spec = catalogItemSpec(item.id, index);
        expect(spec.id).toBe(item.id);
        expect(spec.mount).toBe(item.mount || 'floor');
        expect(spec.parts.length >= 1 && spec.parts.length <= 120).toBe(true);
        validateItemSpec(spec);
        for (const axis of ['w', 'h', 'd']) {
          expect(spec.dimensions[axis] > 0 && spec.dimensions[axis] < 6).toBe(true);
        }
        for (const part of spec.parts) {
          expect(ITEM_SPEC_SCHEMA.primitiveTypes.includes(part.type)).toBe(true);
          expect(part.position.length).toBe(3);
          expect(part.size.length).toBe(3);
          expect(part.finish, `${item.id} part should declare a physical finish`).toBeTruthy();
          if (part.type === 'tube') {
            expect(part.path.length >= 2 && part.path.length <= 64).toBe(true);
          }
        }
      });
    }
  });
});

describe('validateItemSpec', () => {
  it('accepts a generated provider spec and marks it generated', () => {
    const generated = validateItemSpec({
      name: 'Compound lab microscope',
      category: 'Lab',
      dimensions: { w: 0.41, h: 0.53, d: 0.38 },
      parts: Array.from({ length: 36 }, (_, i) => ({
        type: i % 5 === 0 ? 'cylinder' : i % 7 === 0 ? 'sphere' : 'roundedBox',
        position: [((i % 6) - 2.5) / 7, 0.08 + (i % 9) / 11, ((i % 4) - 1.5) / 5],
        size: [0.05 + (i % 3) * 0.03, 0.05 + (i % 4) * 0.04, 0.05 + (i % 2) * 0.04],
        rotation: [0, i * 7, 0],
        color: i % 2 ? '#e6e3dc' : '#273139',
      })),
    });
    expect(generated.parts.length).toBe(36);
    expect(generated.generated).toBe(true);
  });

  it('rejects unsupported primitive types', () => {
    expect(() => validateItemSpec({
      name: 'Bad',
      dimensions: { w: 1, h: 1, d: 1 },
      parts: [{ type: 'javascript', position: [0, 0, 0], size: [1, 1, 1] }],
    })).toThrow(/unsupported type/);
  });

  it('rejects implausible numeric positions', () => {
    expect(() => validateItemSpec({
      name: 'Far away',
      dimensions: { w: 1, h: 1, d: 1 },
      parts: [{ type: 'box', position: [1e200, 0, 0], size: [1, 1, 1] }],
    })).toThrow(/plausible numeric position/);
  });

  it('sanitizes non-numeric rotations to zero', () => {
    const safeRotation = validateItemSpec({
      name: 'Safe rotation',
      dimensions: { w: 1, h: 1, d: 1 },
      parts: [{ type: 'box', position: [0, 0, 0], size: [1, 1, 1], rotation: ['not-a-number', 0, 0] }],
    });
    expect(safeRotation.parts[0].rotation).toEqual([0, 0, 0]);
  });
});
