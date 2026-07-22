# Blackwell Hall Double (UC Berkeley) — 3D Reconstruction Spec

Interactive Three.js reconstruction of a Blackwell Hall double room. One deliverable:
a single self-contained HTML page. **All people and personal belongings from the
reference photos are OMITTED** (no posters, printers, sneakers, laundry, TVs,
postcards). Only university-standard furniture + a tasteful "furnished" prop layer.

## Room summary (derived from floor plan + photos)

Interior **5.60 m × 2.95 m × 2.90 m high** (≈18'4" × 9'8", ~178 sq ft). Exposed
board-formed **concrete ceiling** and one concrete **corner column**; all other
walls warm-white drywall; light-oak **wood-look LVP floor**; white baseboards.

- **Entry wall (x=0):** gray commercial door (0.91×2.03) near the closet-wall side,
  swings INTO the room, hinge on closet side. Brushed lever + electronic card lock
  puck + peephole. Light switch on the bed side of the door.
- **Window wall (x=5.60):** one tall window (1.00×1.55, sill 0.90) centered at
  z=1.475, dark-bronze aluminum frame, deep white sill, white roller-shade housing
  above, white HVAC grille high on the wall left of the window (bed side).
  Thermostat near the closet side. Concrete column fills the closet-side corner.
- **Bed wall (z=0):** two Twin-XL platform beds with 3-drawer + cubby storage bases
  ("driftwood" gray-brown laminate, dark steel frames), one at each end.
  Bed A's head is against the entry wall and Bed B's head is against the window
  wall. There are no dressers beside the beds. The centered niche leaves an equal
  0.34 m clear gap beside the inner end of each bed and is formed by two
  full-height drywall stubs holding the black **MicroChill** minifridge with a
  black microwave on top.
- **Closet wall (z=2.95):** flat entry section with brushed towel bar + 2 robe
  hooks, then alternating: **closet A** (mirrored bypass doors), **desk 1 + chair**,
  **closet B**, **desk 2 + chair**, concrete column. Closets protrude 0.65 m into
  the room; desks sit in the alcoves between them. Blue letter plaques (A/B) above
  each closet. Desks are driftwood laminate with dark steel legs; chairs are white
  ribbed-pad office chairs with chrome arms, chrome 5-star base, casters.
- **Ceiling:** brushed-nickel 3-blade ceiling fan with frosted light kit near room
  center, 2 chrome sprinkler heads, 1 white smoke detector.

All exact numbers live in `src/spec.js` (ROOM, COLORS, DOOR, WINDOW, STUBS,
COLUMN, BED, NIGHTSTAND, CLOSET, DESK, CHAIR, FRIDGE, MICROWAVE, FAN, LAYOUT).
**Never invent a competing constant — import from spec.js.**

## Reference photos (`refs/`) — study before building

| file | shows |
|---|---|
| ref01-entry-door-view.png | view in through door: bedA side, fridge niche, bedB, window; door leaf + card lock + lever |
| ref02-fridge-niche.png | niche stubs + black fridge/microwave stack (printer on top is personal — omit) |
| ref03-door-from-desk.png | door from inside, bedA head/pillows at entry corner, outlet, desk edge |
| ref04-mirror-reflection.png | mirror doors reflecting fridge niche + towel; closet A/B plaques |
| ref05-desk-alcove.png | desk in alcove between closet volumes (monitor/props personal — omit) |
| ref06-window-bed-head.png | bedB headboard near window + nightstand (sneakers personal — omit) |
| ref07-marketing-desks.png | desks/chairs/closet mirrors/ceiling fan, official furnished shot |
| ref08-empty-window-corner.png | move-in state: bare blue mattress, desk2, concrete column, window |
| ref09-empty-closets.png | mirror bypass doors, towel bar + hooks wall, concrete ceiling + column |
| ref10-door-view-empty.png | from hallway: bedA, center stub wall, bedB, window; blue vinyl mattresses |
| ref11-pink-window-nightstand.png | window wall + nightstand + concrete ceiling + fan (decor personal — omit) |
| ref12-floorplan.png | official floor plan: beds+niche top, door left, closet/desk row bottom |

## Module contract

Each module lives at `src/modules/<name>.js`, exports `build*` function(s) taking
`ctx = { THREE, mats, spec, H }`:

- `THREE` — the three.js namespace. **Never `import 'three'` directly.**
- `mats` — dict from `src/materials.js` (floor, wall, concrete, laminate,
  laminateDark, trim, stub, doorLeaf, metalDark, chrome, brushed, bronze,
  mattress, duvet, blanket, pillow, chairPad, fridge, blackGloss, shade, plaque,
  towelA, towelB, whitePlastic, glass). Extra one-off materials may be created
  with `new ctx.THREE.MeshStandardMaterial(...)` using `spec.COLORS`.
- `spec` — everything in `src/spec.js`.
- `H` — helpers (`box, cyl, makeMirror, contactShadow, labelPlane, frame,
  noShadow`). Use `H.box(..., {r: 0.004})` rounded edges on furniture; use
  `H.contactShadow` under every floor-standing piece.

Rules:
1. Return a `THREE.Group`. Position per your module's placement note below.
2. Meshes cast+receive shadows by default (helpers do this); call `H.noShadow`
   on glass/mirrors/emissive bits.
3. Animatable parts: attach `group.userData.api = { ... }` (see per-module notes).
   APIs must be idempotent setters taking t ∈ [0,1] or booleans — main.js tweens.
4. Furnished vs move-in: tag optional objects `obj.userData.furnishedOnly = true`
   (shown when furnished) or `obj.userData.moveinOnly = true`. Build BOTH states.
5. Keep each module self-contained; no imports besides the ctx you're given.
6. Verify: `node test/smoke.mjs <name>` must print PASS for every export.
   Iterate until it does. Keep polycount sane (< ~60k tris per module).
7. Detail bar is HIGH: chamfers, hardware, seams, kick recesses, realistic
   proportions. Model what a visitor would notice from 0.5 m away.

### Modules & placement contracts

- **shell.js → buildShell(ctx)** — floor slab, 4 walls WITH door & window openings
  (build walls from box segments around openings), fridge-niche stubs, concrete
  column, ceiling, baseboards (skip across door opening + closet footprints),
  door/window casings are NOT yours (doorwin.js owns them). Interior face of the
  entry wall at x=0, window wall inner face at x=L, bed wall inner face z=0,
  closet wall inner face z=2.95. Floor receives shadows. Ceiling: concrete mat.
- **doorwin.js → buildDoor(ctx), buildWindow(ctx)** — door: white frame + casing,
  graphite leaf pivoted on hinge at (0, DOOR.hingeZ) opening into room;
  `api.setOpen(t)` 0=closed, 1=maxOpenDeg. Lever both sides, card-lock puck,
  peephole, 3 hinges, door bottom 8 mm gap, kick-relevant realism. Window: bronze
  frame + glass pane, white stool/sill + apron + side casings, roller-shade
  housing + shade `api.setShade(t)` 0=up..1=down, and an OUTSIDE backdrop
  (sky gradient + neighboring building silhouette + ground plane beyond the
  window, `H.noShadow`, so the view through glass reads as "outside"). Also
  expose `api.setNight(t)` (0=day, 1=night) that darkens the backdrop sky /
  building materials (keep refs to them in the closure).
- **bed.js → buildBed(ctx, {variant:'A'|'B'}), buildNightstand(ctx)** — bed local
  origin: head-end wall-side corner at (0,0,0), bed extends +x (length) and +z
  (width into room). Drawers ALWAYS face +z. Variant B mirrors head/foot along x
  (head at local x=BED.L end) so main.js can place both with no rotation:
  headboard at the +x end for B, at x=0 end for A. Storage base: toe kick, 3
  drawer fronts with brushed pulls + open cubby row at foot end (see ref10),
  laminate; dark steel corner posts; headboard: steel posts + laminate panel.
  Mattress: BOTH states — move-in bare royal-blue vinyl mattress (rounded, seam
  lines, `moveinOnly`) and furnished made bed (white duvet with fold, gray
  blanket at foot, 2 pillows, `furnishedOnly`). Nightstand: local origin at its
  wall-side back-left corner (min x, z=0), 2 drawers + brushed pulls.
- **closet.js → buildCloset(ctx, {letter:'A'|'B'})** — local origin: the room-
  facing bottom-left corner. Main.js places the group at
  (LAYOUT.closetN.x0, 0, ROOM.W - CLOSET.depth); build width along +x
  (= LAYOUT.closetN.w) and depth along +z (toward the wall). The room-facing
  face at local z=0 carries:
  white surround, top+bottom tracks, TWO sliding mirror panels (H.makeMirror,
  framed satin silver) `api.setOpen(t)` slides front panel open. Interior visible
  when open: white walls, chrome rod, white shelf at 1.75, 3 simple hangers
  (furnishedOnly). Blue plaque with letter above doors (H.labelPlane). White
  soffit band from door top (2.30) to ceiling.
- **desk.js → buildDesk(ctx), buildChair(ctx)** — desk local origin: center of
  footprint at (0,0,0), top at DESK.h, back edge at z=+DESK.d/2 (main places
  back edge against wall). Laminate top w/ rounded edge, dark steel legs, rear
  modesty rail, adjustable feet. Furnished props (`furnishedOnly`): closed
  laptop + mug on desk1-style — keep generic, they'll appear on both desks; a
  small recycle bin tagged furnishedOnly too (main places it). Chair: local
  origin at floor under gas-lift axis. White ribbed seat + back pads (model ribs
  as thin horizontal slats or grooves), chrome loop arms, chrome gas lift, 5-star
  chrome base, 5 casters. `api.setSpin(rad)` rotates seat assembly about lift.
- **microchill.js → buildMicroChill(ctx)** — local origin: back-left corner at
  wall (min x, min z; unit front face toward +z). Black minifridge, two doors
  (small freezer top, larger fridge below) with visible door gaps, vertical black
  bar handles near the -x edge of each door front, hinges on the +x side, vent
  slots at base, small oval badge (labelPlane, no readable brand). Microwave on
  top: black body, dark glass door window on the left ~2/3, control panel with
  button grid on the right, horizontal handle bar. Power cord curving up to the
  niche outlet (TubeGeometry).
- **fan.js → buildFan(ctx)** — local origin at the ceiling mount point; children
  extend DOWNWARD in negative y (canopy at y≈-0.02, downrod to y≈-FAN.drop,
  motor housing, 3 blades with slight pitch, frosted glass dome light below the
  motor with emissive material driven by `api.setLight(on)`, 2 pull chains).
  `api.update(dt)` spins the blade group when `api.setOn(true)` was called.
  Expose `api.setOn, api.setLight, api.update`.
- **fixtures.js → buildFixtures(ctx)** — everything wall/ceiling-mounted small:
  towel bar + robe hooks (brushed) with 2 draped towels (`furnishedOnly`,
  rounded boxes or bent planes), all outlets (white duplex w/ cover plates
  per LAYOUT.outlets; the 'niche' outlet sits on the bed wall centered between
  the stubs), light switch plate + rocker, thermostat (white rounded box +
  labelPlane LCD), white louvered HVAC grille at LAYOUT.vent on the window wall,
  sprinkler heads (chrome escutcheon + tiny deflector), smoke detector (white
  cylinder + LED dot), door floor stop.
  Positions all in room coords from LAYOUT — this module returns ONE group
  already in room coordinates.

### Placement done by main.js (FYI, do not re-position)

bedA at (0.03,0,0.02); bedB at (3.54,0,0.02); no bed-side dressers;
fridge (2.56,0,0.03); closets at (x0,0,2.30); desks back edge to z=2.93 at cx;
chairs per LAYOUT; fan at (2.80, H, 1.475); shell/fixtures/door/window at origin.

## App shell (main.js — already owned, do not edit)

Orbit + walk modes, day/night sun rig, furnished/move-in toggle, door/closet/
shade/fan controls, minimap, preset cameras via `?cam=`. Modules only need to
honor the contract above.
