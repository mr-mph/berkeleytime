# Units 1–3 Triple (UC Berkeley) — 3D Reconstruction Spec (v7)

Second room in this repo (first: Blackwell double, see `SPEC.md`). Interactive
Three.js reconstruction of a **Unit 1/2/3 residence hall standard triple**.
Deliverable: a single self-contained HTML page. **All people and personal
belongings in the reference photos are OMITTED**. Only university-standard
furnishings + a tasteful "furnished" prop layer.

v7 layout — official prose + supplied walk views, fully reconciled:
the **door and two closets share the left interior wall with no gap**; the
**loft and two desks are on the upper wall, with the bunk opposite**; both
closet bays contain storage dressers; the remaining dresser is at the bunk
foot; the MicroChill clears the entry; and the **third desk faces the window**. Bedroom footprint from the
published Berkeley room-information sheet: **4.19 × 4.01 × 2.72 m**
(**13′9″ × 13′2″**, ≈181 sq ft), matching the official render's near-square
proportions. Berkeley notes that individual rooms can vary.

## Coordinates

origin = upper-left interior corner at floor. +x entry/closet wall → window
wall (L=4.19). +z loft wall → bunk wall (W=4.01). +y up.

- **Entry/closet wall (x=0):** DOOR at z 0.12–1.03 (hinge z=1.03, leaf opens
  INTO the room toward +x, maxOpen 96°). The **TWO open closet bays begin at
  z=1.03, exactly at the hinge jamb with no wall strip or gap** (1.37 m bays,
  0.08 white floor-to-ceiling partitions, depth 0.62 protruding +x, open
  fronts facing +x): chrome rod 1.66, white shelf 1.88, soffit/top shelf 2.06,
  maple 3-drawer **dresser inside bay 1** (nearest the door); full-length
  **mirror on the door-facing (-z) end panel**. The run ends flush at the far
  wall, z=4.01, eliminating the false third-bay gap. Each bay contains a
  centered maple 3-drawer dresser.
- **Loft wall (z=0):** the black **MicroChill** occupies x 1.44–1.92, outside
  the door ingress path, followed by the **LOFT** at x 1.94–4.07 with only
  0.12 m clearance to the window/curtains. **TWO desks side by side are
  beneath it** (x 1.94–3.01 and 3.01–4.08), backs to z=0 and fronts +z. Their
  task chairs face -z toward the desks. The corkboard faces +z under the deck.
  Lino patch at the door corner: ENTRY = x 0–1.16, z 0–1.08.
- **Bunk wall (z=4.01):** the bunk-foot **dresser** occupies x 1.16–1.92 and
  the **BUNK** occupies x 1.94–4.07, with its head at the window end. Nothing
  is placed between the bunk and the window.
- **Window wall (x=4.19):** window opening z 0.20–3.81, sill 0.78, glass to
  2.42 under the header beam; dark anodized alu frame, 2 mullions, transom
  (sliders below), white stool + apron. **Desk 3 backed to the glass at
  z 1.545–2.615**, chair facing the window. White fin-tube **radiator**
  (2.55 m, centered z=2.005) below the window behind it. Tan curtains full
  width (CURTAIN z 0.10–3.91). The diagonal seismic **brace**, neighboring
  tower, trees, and sky are rendered on a plane bounded by the glazing; no
  exterior backdrop geometry extends beyond the window.
- **Ceiling:** cream-painted slab at 2.72, 5 ribs (0.14×0.20) along +x at
  z = 0.48/1.24/2.00/2.76/3.52, header beam over the window wall, flush
  **light fixture** (1.22×0.30, long axis +x) at (2.10, 2.38) between the
  2.00/2.76 ribs, 2 sprinklers, smoke detector near the entry corner.

All exact numbers live in `src/unit-triple/spec.js`. **Never invent a
competing constant — import from ctx.spec at runtime.** Counts: 3 beds
(bunk×2 + loft), 3 desks, 3 chairs, 3 dressers, 2 closet bays, 1 mirror,
1 MicroChill.

## Reference images (`refs-unit-triple/`)

| file | shows |
|---|---|
| triple_top-big.png | official top-down render — v7: continuous two-bay closet run, loft/desks top, bunk opposite, beds tight to window, window desk right |
| triple_side_01/03-big.png | official iso renders: bunk, loft over two desks, open bays, curtains |
| unit1triple-750x500-1-700x500.jpg | marketing photo: window + BRACE, rib ceiling, carpet, task chairs |
| images.jpeg | loft running toward the window, header beam (moving bags = omit) |
| Screenshot ...9.09.54 PM.png | wide room: bunk + ladder, loft, flush ceiling fixture (decor = omit) |
| Screenshot ...9.29.56 PM.png | THE CLOSET BAYS: partitions, rod, shelf, soffit storage, dressers |
| Screenshot ...9.30.46/9.30.59/9.31.10/9.31.17 PM.png | bunk anatomy, brace through glass, navy vinyl mattresses (move-in) |
| Screenshot ...9.29.45/9.32.55 PM.png | under-loft desks + pinboard, curtains |

## Module contract

Modules at `src/unit-triple/modules/<name>.js`, `build*` functions taking
`ctx = { THREE, mats, spec, H }`. Identical rules to `SPEC.md` §Module
contract (Group return, shadows via helpers, contactShadow under floor
furniture, idempotent `userData.api` setters, furnishedOnly/moveinOnly both
built, no imports beyond ctx, deterministic, < ~60k tris). Verify with
`node test/smoke-unit.mjs <name>` until PASS. House style = `src/modules/`.

`mats` keys: carpet, lino, wall, ceiling, wood, woodDark, doorLeaf, curtain,
trim, cove, partition, metalDark, chrome, brushed, alu, mattress, sheet,
duvet, blanket, pillow, chairBlack, chairBase, fridge, blackGloss, cork,
radiator, brace, neighbor, whitePlastic, lightLens, glass.

### shell.js → buildShell(ctx)
Carpet floor + beveled lino patch per ENTRY (door corner: x 0..1.16,
z 0..1.08, transition strips on its two exposed edges). Walls: **door opening
in the ENTRY/CLOSET wall (x=0) at z = DOOR.z0..DOOR.hingeZ**; the loft wall
(z=0) is solid. The window opening is in the x=L wall per WINDOW (z
0.20..3.81, y 0.78..2.42). Cove base runs all around, skipped across the door
opening and the contiguous closet-run footprint at x=0, z 1.03..4.01.
Ceiling: slab at H, 5 ribs per CEIL.ribZ
along +x, header beam over the window wall. All ceiling meshes
`userData.isCeiling = true`. No column.

### doorwin.js → buildDoor(ctx), buildWindow(ctx)
**Door:** build in the local/world x=0 plane spanning z = DOOR.z0..hingeZ,
hinged at z=DOOR.hingeZ. main.js mounts the group at the room origin with no
rotation. `api.setOpen(t)` swings the leaf into local/world +x. **Window:** per
WINDOW on the x=L wall — spec-driven, with curtains (`api.setShade`) and a
single glazing-bounded exterior view plane (`api.setNight`).

### bed.js → buildBed(ctx, {variant}), buildLadder(ctx)
UNCHANGED contract: local origin at the local x=0 end, wall-side corner, wall
side local z=0. Bunk head at local x=0; loft head at local x=BED.L (mirrored).
main.js: loft unrotated on z=0 and bunk rotY=π on z=W. Both heads land at the
window end; both dressers land at the left bed feet.

### closet.js → buildClosetRun(ctx), buildDresser(ctx)
Same wall (x=0) and construction as the current build: run spans
z 1.03..4.01 from the door hinge jamb to the far wall. Everything is
spec-derived; verify smoke bbox z ≈ 1.01..4.01, x -0.015..0.62. The carcass
embeds 15 mm into the wall while the open front stays at x=0.62. Dresser in bay 1
and bay 2; mirror on
the -z end panel; buildDresser standalone export unchanged (origin back-left,
back at local z=0, drawers open +z).

### desk.js → buildDesk(ctx), buildChair(ctx)
UNCHANGED.

### fixtures.js → buildFixtures(ctx)
From LAYOUT at runtime. Wall names for outlets: **'entry' (x=0, coord z),
'loft' (z=0, coord x), 'bunk' (z=W, coord x), 'window' (x=L, coord z)** —
plates proud, facing into the room. Switch is on the LOFT wall at
LAYOUT.switch (x=0.18, y=1.15, faces +z). Corkboard on the loft wall per LAYOUT.corkboard
(faces +z). Radiator per RADIATOR/LAYOUT.radiator.cz on the window wall
(front faces -x). Lightbox at LAYOUT.lightbox between the 2.00/2.76 ribs
(isLightbox tag + api.setLight, dedicated lens material). Sprinklers/smoke
per LAYOUT (clear of ribs). Door floor stop at LAYOUT.doorstop (where the
96°-open leaf rests). Return `userData.api = { setLight }`.

### microchill — REUSED from `src/modules/microchill.js`
Do not rewrite. main.js mounts it unrotated at
(LAYOUT.fridge.x, 0, LAYOUT.fridge.z) on the loft wall, front facing +z,
tucked beside the loft foot at x=1.44 so the door path remains clear.

### Placement done by main.js (FYI, do not re-position)
door at the room origin with no rotation; loft unrotated at (1.94, 0, 0.03);
bunk rotY=π at (1.94+BED.L, 0, W-0.02); bunk dresser rotY=π at
(1.16+DRESSER.w, 0, W-0.02); the other two dressers are inside the closet
bays; closet run / shell / window / fixtures at origin; desks A/B at
(cx, 0, 0.325)
rotY=π; desk3
rotY=π/2 at (L-0.02-d/2, 0, 2.08); chairs per LAYOUT; fridge unrotated at
(1.44, 0, 0.02).

## App shell (src/unit-triple/main.js — already owned, do not edit)
Orbit + walk, day/night, furnished/move-in, door, ceiling light, curtains,
minimap, `?cam=door|window|beds|desks|closets|fridge|corner|plan`.
