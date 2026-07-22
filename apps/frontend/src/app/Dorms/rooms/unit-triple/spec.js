// ============================================================================
// Units 1–3 (UC Berkeley) — Triple Room. Authoritative dimension spec. v7
// Layout per the OFFICIAL housing.berkeley.edu triple description + official
// top-down render:
//   door in the upper end of the LEFT interior wall; TWO closet bays continue
//   immediately from its hinge jamb with no dead strip; the LOFT + two desks
//   occupy the upper wall and the BUNK is opposite; beds finish 12 cm from the
//   window; two dressers live inside the closets and one at the bunk foot.
// Bedroom footprint from the published UC Berkeley college-information sheet:
// 13'9" × 13'2" (4.19 × 4.01 m), ≈181 sq ft.  This agrees with the nearly
// square proportions in Berkeley Housing's official top-down triple render.
//
// ALL UNITS METERS. Room coordinate system:
//   origin  = upper-left interior corner at floor.
//   +x      = from ENTRY/CLOSET wall toward WINDOW wall. L = 4.19.
//   +z      = from LOFT wall toward BUNK wall.             W = 4.01.
//   +y      = up.
// main.js re-centers the root group; modules build in these room coordinates
// unless their contract says they build at a local origin.
//
//   ENTRY wall  (x=0):  door opening z 0.12..1.03, hinge at z=1.03; leaf
//                       opens into +x. TWO open closet bays fill z=1.03..4.01,
//                       with no fake third-bay gap, and face +x.
//   LOFT wall   (z=0):  MicroChill at x 1.44..1.92, then LOFT bed
//                       x 1.94..4.07 with TWO desks + chairs beneath it.
//   BUNK wall   (z=W):  bunk-foot dresser x 1.16..1.92, then BUNK bed
//                       x 1.94..4.07. Both beds have their heads at the window.
//   WINDOW wall (x=L):  window opening z 0.20..3.81, sill 0.78, glass to 2.42
//                       under the header beam; desk 3 + chair facing the
//                       glass; radiator below; exterior view is clipped to
//                       the glazing itself (nothing exists outside the room).
//   Ceiling: cream-painted slab + one-way ribs along +x, header beam over the
//   window wall.
// ============================================================================

export const ROOM = {
  L: 4.19,     // 13'9": closet wall -> window wall
  W: 4.01,     // 13'2": upper loft wall -> opposite bunk wall
  H: 2.72,     // floor -> slab underside (between ribs)
  wallT: 0.15, // visual wall thickness (walls are boxes, seen from inside)
  baseH: 0.10, // dark vinyl cove base
  baseT: 0.010,
};

export const COLORS = {
  wall: 0xefe9dd,          // warm off-white painted plaster
  trim: 0xf6f4ee,          // white door casings / sills
  ceiling: 0xf1ede4,       // cream-painted concrete slab + ribs
  carpet: 0x6e7a70,        // gray-green loop carpet
  carpetDark: 0x5d685f,
  lino: 0xcdc6b4,          // beige entry linoleum patch
  cove: 0x4c4f52,          // dark vinyl cove base
  wood: 0xc0925a,          // honey maple (beds, desks, dressers, ladder)
  woodDark: 0x9e7443,      // end grain / drawer sides
  doorLeaf: 0x8a5f38,      // wood-veneer room door
  metalDark: 0x3a3a3d,
  chrome: 0xd9dbde,
  brushed: 0xb7babd,
  alu: 0x35312c,           // dark anodized window frame
  glass: 0xcfe0ea,
  mattress: 0x2b4570,      // navy vinyl dorm mattress
  duvet: 0xf0ede6, blanket: 0x9aa1aa, pillow: 0xfaf8f2,
  sheet: 0xe9e6df,
  chairBlack: 0x232527,    // task-chair mesh/fabric
  chairBase: 0x1b1c1e,
  fridge: 0x18181a,        // MicroChill black (shared w/ Blackwell module)
  curtain: 0xc7b08c,       // wheat/tan drapes
  curtainDim: 0xab9573,
  partition: 0xf4f2ec,     // closet-bay white
  cork: 0xc09a63,          // pinboard under the loft
  radiator: 0xe9e6de,      // fin-tube convector cover
  brace: 0xd7d9da,         // exterior seismic brace, painted steel
  neighbor: 0xcfc8bb,      // neighboring tower precast panels
  lightLens: 0xf5f2e8,     // ceiling fixture acrylic
};

// --- architecture ---------------------------------------------------------
// Door module and room now use the same axes: the door is built in x=0,
// spanning z=0.12..1.03, and is placed at the room origin with no rotation.
// The hinge is at z=1.03; the leaf opens into +x, exactly as the official plan.
export const DOOR = {
  z0: 0.12, w: 0.91, h: 2.03, leafT: 0.045,
  hingeZ: 1.03,
  maxOpenDeg: 96,
  casingW: 0.075, casingT: 0.018,
  leverY: 1.00,
  peepY: 1.50,
};

export const WINDOW = {
  z0: 0.20, w: 3.61, y0: 0.78, h: 1.64,    // opening on window wall (x=ROOM.L)
  frameT: 0.05, frameD: 0.11,              // dark anodized aluminum
  mullions: [1.20, 2.41],                  // z offsets from z0 of the 2 verticals
  transomY: 1.20,                          // horizontal bar y offset from y0 (slider row below)
  sillD: 0.14, sillT: 0.03,                // white interior stool
};

export const CURTAIN = {
  trackY: 2.48, drop: 1.65,                // hem clears the sill instead of clipping it
  z0: WINDOW.z0, z1: WINDOW.z0 + WINDOW.w, // contained by the window jambs
  panelT: 0.018, foldN: 14,                // shallow folds stay inside the reveal
};

export const BRACE = {                     // exterior seismic X-brace, painted steel
  w: 0.46, t: 0.09,                        // flat plate member
  angleDeg: 38,                            // rising left->right seen from inside
  standoff: 0.85,                          // distance beyond the glass
};

export const CEIL = {
  ribW: 0.14, ribD: 0.20,                  // one-way ribs, run along +x
  ribZ: [0.48, 1.24, 2.00, 2.76, 3.52],    // rib centerlines across W
  beamD: 0.30, beamW: 0.28,                // header beam along window wall
};

export const ENTRY = { x1: 1.16, z1: 1.08 }; // lino patch inside the left-wall entry

// --- furniture ------------------------------------------------------------
// Wood loft/bunk system (solid maple, ladder-rung end frames, pinned rails).
export const BED = {
  L: 2.13, W: 1.01,          // frame footprint incl posts
  mattL: 2.03, mattW: 0.91, mattH: 0.18,   // Twin XL
  postW: 0.078, postD: 0.078,              // substantial square maple posts in refs
  railH: 0.14,                             // side rail depth
  rungN: 4,                                // horizontal rungs per end frame
  bunk:  { deckLo: 0.40, deckHi: 1.50, postH: 2.02, guardH: 0.30 },
  loft:  { deck: 1.58, postH: 2.02, guardH: 0.30 },
};

export const LADDER = {
  w: 0.40, railT: 0.035, rungT: 0.032, lean: 0.30, // horizontal run at floor
};

export const CLOSET = {                     // one run of TWO open bays on the
  z0: 1.03, bayW: 1.37, partT: 0.08, bays: 2, // fills hinge jamb -> far wall
  depth: 0.62,                              // protrudes +x from the closet wall
  headerY: 2.06,                            // soffit underside / top-shelf top
  shelfY: 1.88, rodY: 1.66,
  dresserBays: [0, 1],                      // one university dresser per bay
  mirror: { w: 0.34, h: 1.42, y0: 0.42 },   // on the door-facing (-z) end panel
};
// run spans z: z0 .. z0 + bays*bayW + (bays+1)*partT = 1.03 .. 4.01
// open fronts face +x at x = CLOSET.depth. Dresser 1 sits inside bay 1;
// both closet bays contain dressers; dresser 3 is freestanding at the bunk foot.

// Compact university drawer chest. Two units fit side-by-side in one 1.37 m
// closet bay, matching the supplied Unit 1 closet reference.
export const DRESSER = { w: 0.62, d: 0.52, h: 0.72, drawers: 4 };

export const DESK = {
  w: 1.07, d: 0.61, topT: 0.035, h: 0.75,   // maple, right 3-drawer pedestal
  pedW: 0.40, kneeH: 0.62, modestyT: 0.018,
};

export const CHAIR = {                      // black armless task chair
  seatH: 0.46, seatW: 0.47, seatD: 0.45,
  backH: 0.52, baseR: 0.30,
};

export const FRIDGE = { w: 0.48, d: 0.50, h: 0.87 };     // MicroChill black
export const MICROWAVE = { w: 0.48, d: 0.38, h: 0.28 };  // sits on fridge

export const RADIATOR = {                   // fin-tube convector under window
  w: 2.55, d: 0.12, h: 0.24, y0: 0.10,      // slotted top, front louvers
};

export const LIGHTBOX = {                   // flush rectangular ceiling fixture
  w: 1.22, d: 0.30, h: 0.09,                // long axis along +x, between ribs
};

// --- placement ------------------------------------------------------------
// Beds: local origin at the local x=0 end, wall-side corner; wall side at
// local z=0; bed extends +x/+z. bunk head is local x=0; loft head is local
// x=BED.L. The official render puts BOTH heads at the window end:
//   loft: unrotated at z=0, x 1.94..4.07, opens into +z.
//   bunk: rotY=PI at z=W, x 1.94..4.07, opens into -z.
const BED_X = ROOM.L - BED.L - 0.12;        // 12 cm curtain/window clearance

export const LAYOUT = {
  loft: { x: BED_X, z: 0.03 },              // upper wall; head at window end
  bunk: { x: BED_X, z: ROOM.W - 0.02 },     // opposite wall; placed rotY=PI
  dresserBunk: { x: BED_X - DRESSER.w - 0.02, z: ROOM.W - 0.02 },
  fridge: { x: BED_X - FRIDGE.w - 0.02, z: 0.02, rotY: 0 },
                                             // beside loft foot, clear of door

  // two desks UNDER the loft: backs against z=0, fronts +z into the room
  deskA: { cx: BED_X + DESK.w / 2, z: 0.02 + DESK.d / 2 },
  deskB: { cx: BED_X + DESK.w * 1.5, z: 0.02 + DESK.d / 2 },
  chairA: { x: BED_X + DESK.w / 2, z: 1.18, rotY: Math.PI },
  chairB: { x: BED_X + DESK.w * 1.5, z: 1.18, rotY: Math.PI },

  // desk 3 against the window wall, facing the glass
  desk3: { cz: 2.08 },                     // centered on the broad exterior window
  chair3: { x: 3.51, z: 2.08, rotY: Math.PI / 2 },

  radiator: { cz: 2.005 },                 // under window, behind desk 3

  lightbox: { x: 2.10, z: 2.38 },          // between ribs at 2.00 / 2.76
  switch: { wall: 'loft', along: 0.18, y: 1.15 }, // just around the entry corner
  outlets: [
    { wall: 'loft',   x: 1.75, y: 0.35 },  // under the loft
    { wall: 'loft',   x: 4.02, y: 0.35 },  // beyond the loft head
    { wall: 'loft',   x: 0.34, y: 1.04 },  // behind MicroChill
    { wall: 'loft',   x: 2.47, y: 1.10 },  // above the under-loft desks
    { wall: 'window', z: 0.42, y: 0.35 },  // beyond radiator ends
    { wall: 'window', z: 3.60, y: 0.35 },
  ],
  doorstop: { x: 0.95, z: 1.03 },          // free edge of the fully-open leaf
  sprinklers: [{ x: 1.45, z: 2.42 }, { x: 3.08, z: 1.05 }],
  smoke: { x: 0.75, z: 0.85 },              // in the rib gap (0.57..1.13)
  corkboard: { x0: BED_X + 0.08, x1: BED_X + BED.L - 0.08,
    y0: 0.98, y1: 1.42 },                   // z=0 loft wall, under deck
};

export const EYE = 1.60; // walk-mode eye height
