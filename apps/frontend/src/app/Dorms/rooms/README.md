# Dorm room 3D reconstructions

Interactive Three.js reconstructions of measured dorm rooms, built from
reference photos + official floor plans. People and personal belongings in the
photos are intentionally omitted.

This directory is the vendored engine behind the app's `/dorms` routes. Each
room's app shell exports a factory (`createBlackwellRoom`, `createUnitTripleRoom`,
`createUnitDoubleRoom` — see `main.d.ts` files) that mounts into a container
element and returns `{ dispose }`; the React wrapper lives in
`src/app/Dorms/RoomViewer/`. Everything else (specs, modules, planner, catalog)
is unchanged prototype code.

Rooms:
- **Blackwell Hall double** — `/dorms/blackwell`, spec in `SPEC.md`, `spec.js`, modules in `modules/`
- **Units 1–3 triple** — `/dorms/unit-triple`, spec in `SPEC-UNIT-TRIPLE.md`, `unit-triple/spec.js`, modules in `unit-triple/modules/`
- **Units 1–3 double** — `/dorms/unit-double`, spec in `SPEC-UNIT-DOUBLE.md`, `unit-double/spec.js`, modules in `unit-double/modules/`

## Run

Rooms are served by the app: `/dorms` (picker), `/dorms/blackwell`,
`/dorms/unit-triple`, `/dorms/unit-double`. Tests live in `__tests__/` and run
with the frontend suite:

```
npm run test -w frontend             # vitest, includes the ported room tests
```

## URL params (QA / deep links)

Blackwell: `?cam=door|window|desks|beds|fridge|corner|plan` · `tod=night` ·
`furnished=0` · `door=1` · `closets=1` · `shade=0..1` · `fan=1` · `light=1` ·
`still=1` (render a few frames then stop) · `mirrors=0`

### Blackwell measured layout planner

The Blackwell room includes a static, backend-free item planner with 258 measured
dorm products. Open **Catalog**, click an item to place it, drag it across the
floor, or use the blue lift handle to move it vertically. Beds, desks, chairs,
the nightstand, and the MicroChill use the same movement system. Other colored
handles resize catalog items; products with variants snap to real sizes (for
example 24/27/32-inch monitors), while generated items snap to one-inch
increments. Green/red outlines report whether an item fits the measured room.

Wall decor includes frames, posters, mirrors, string lights, a leaf garland,
tapestries, and boards. Wall items can be dragged across and up the wall, then
moved between all four walls with **Next wall**.

Catalog visuals use launch-quality parametric model families rather than
placeholder blocks: curved cables and frames, manufactured seams and controls,
individual key arrays, hollow vessels, hardware, foliage, upholstery piping,
and physical glass/ceramic/metal/fabric/wood/plastic finishes. Every catalog
model now has at least 18 composed parts and can draw from 24 validated geometry
types, with bespoke high-detail models for instruments and small accessories.
The furnished
laptops, mugs, and recycle bins on both desks are independent measured planner
objects and serialize with the rest of the layout. The exterior architectural
view is composited inside the window aperture instead of existing as geometry
outside the room.

The catalog search and category rail remain pinned while the item list scrolls.
Selected items also expose **Send back** and **Bring front** click-priority
controls, so a loft bed or desk can remain visible without blocking selection of
a chair or accessory behind it. That interaction order is included in shared
layout links.

Catalog layouts are compactly serialized in the `layout` URL parameter. The
**Generate** is an optional advanced BYOK tool for Gemini, Claude, or OpenAI.
It accepts only a validated, non-executable JSON primitive spec (up to 120
parts), places the result locally, and can export the spec as JSON. API
keys are not persisted or serialized into links.

Unit triple: `?cam=door|window|beds|desks|closets|fridge|corner|plan` ·
`tod=night` · `furnished=0` · `door=1` · `shade=0..1` (curtains) · `light=1` ·
`still=1`

Unit double: `?cam=door|window|beds|desks|closets|shelf|corner|plan` ·
`tod=night` · `furnished=0` · `door=1` · `shade=0..1` (curtains) · `light=1` ·
`still=1`

Params attach to the room routes, e.g. `/dorms/blackwell?cam=corner&tod=night`.

## Layout

- `SPEC.md` / `SPEC-UNIT-TRIPLE.md` / `SPEC-UNIT-DOUBLE.md` — room specs + module contracts
- `spec.js`, `unit-triple/spec.js`, `unit-double/spec.js` — dimensions, colors, and placement constants
- `materials.js`, `unit-triple/materials.js` — procedural canvas textures per room
- `helpers.js` — shared geometry helpers, planar mirrors (Reflector), contact shadows
- `main.js`, `unit-triple/main.js`, `unit-double/main.js` — per-room app shells (renderer, lights, controls, HUD)
- `modules/*.js`, `unit-triple/modules/*.js`, `unit-double/modules/*.js` — one builder per furniture/architecture domain
  (the MicroChill builder in `modules/microchill.js` is shared by all rooms)
