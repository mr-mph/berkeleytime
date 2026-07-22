// ============================================================================
// Blackwell Hall (UC Berkeley) — Double Room. Authoritative dimension spec.
// ALL UNITS METERS. Room coordinate system:
//   origin  = inner corner where the ENTRY wall meets the BED wall, at floor.
//   +x      = along the BED wall, from entry wall toward WINDOW wall (length).
//   +z      = along the ENTRY wall, from bed wall toward CLOSET wall (width).
//   +y      = up.
// main.js re-centers the root group; modules build in these room coordinates
// unless their contract says they build at a local origin.
// ============================================================================

export const ROOM = {
  L: 5.60,     // interior length, entry wall -> window wall
  W: 2.95,     // interior width, bed wall -> closet wall
  H: 2.90,     // floor -> exposed concrete ceiling
  wallT: 0.15, // visual wall thickness (walls are boxes, seen from inside)
  baseH: 0.09, // painted baseboard height
  baseT: 0.013,
};

export const COLORS = {
  wall: 0xf1eee7,          // warm white latex, eggshell
  trim: 0xf7f5f0,          // baseboards / casings, semigloss white
  concrete: 0xaeadab,      // exposed ceiling + column, board-formed gray
  floorLight: 0xcaa87d,    // wood-look LVP, light oak
  floorDark: 0xa8865a,
  doorLeaf: 0x606266,      // graphite gray commercial door
  metalDark: 0x3a3a3d,     // furniture steel frames (dark bronze/graphite)
  chrome: 0xd9dbde,
  brushed: 0xb7babd,       // brushed-nickel hardware
  bronze: 0x453c33,        // window frame, dark anodized
  glass: 0xcfe0ea,
  laminate: 0x8b8175,      // "driftwood" gray-brown laminate (desks, bed base)
  laminateDark: 0x6d6459,
  mattress: 0x2f4d92,      // royal-blue vinyl dorm mattress
  duvet: 0xf0ede6,         // furnished bedding
  blanket: 0x99a0a9,
  pillow: 0xfaf8f2,
  chairWhite: 0xebeef0,    // ribbed office chair
  fridge: 0x18181a,
  shade: 0xf4f2ec,         // roller shade fabric
  plaque: 0x2c3a6b,        // blue A/B closet plaques
  towelA: 0x8d9aa8, towelB: 0xcfd6dd,
};

// --- architecture --------------------------------------------------------
export const DOOR = {
  z0: 1.80, w: 0.91, h: 2.03, leafT: 0.045,
  hingeZ: 2.71,          // hinge on the closet-wall side; leaf opens INTO room
  maxOpenDeg: 86,
  casingW: 0.075, casingT: 0.018,
  leverY: 1.00,          // brushed lever handle height
  readerY: 1.32,         // electronic card-lock puck (on leaf, above lever)
  peepY: 1.50,
};

export const WINDOW = {
  z0: 0.975, w: 1.00, y0: 0.90, h: 1.55,   // opening on window wall (x = ROOM.L)
  frameT: 0.055, frameD: 0.11,             // dark bronze aluminum
  sillD: 0.16, sillT: 0.03,                // white interior sill/stool
  shadeBoxH: 0.13, shadeBoxD: 0.10,        // white roller-shade housing above
};

export const STUBS = { // two full-height drywall stubs framing the fridge niche
  s1x: 2.40, s2x: 3.10, t: 0.10, depth: 0.78,
};

export const COLUMN = { x0: 5.32, z0: 2.63 }; // concrete, to corner (L, W), full height

// --- furniture dimensions -------------------------------------------------
export const BED = {
  L: 2.03, W: 0.99,          // Twin XL platform footprint
  baseH: 0.66,               // storage base (3 drawers + open cubbies)
  toe: 0.035,                // toe-kick recess at floor
  mattL: 1.98, mattW: 0.965, mattH: 0.20,
  headH: 1.18, postT: 0.05,  // dark-steel posts, laminate headboard panel
  drawerRows: 1, drawerCols: 3,
};

export const NIGHTSTAND = { w: 0.48, d: 0.46, h: 0.61, drawers: 2 };

export const CLOSET = {
  depth: 0.65, doorH: 2.30,   // mirrored bypass doors below a white soffit band
  panelW: 0.585,              // each of two sliding mirror panels
  frameT: 0.03,               // satin-silver panel frames
};

export const DESK = {
  w: 1.02, d: 0.60, topT: 0.032, h: 0.755,  // driftwood laminate top
  legT: 0.035,                              // dark steel legs + rear rail
};

export const CHAIR = {
  seatH: 0.47, seatW: 0.48, seatD: 0.46,
  backH: 0.55, baseR: 0.30,                 // white ribbed pads, chrome frame
};

export const FRIDGE = { w: 0.48, d: 0.50, h: 0.87 };          // MicroChill black
export const MICROWAVE = { w: 0.48, d: 0.38, h: 0.28 };       // sits on fridge

export const FAN = {
  drop: 0.32, motorR: 0.10, blades: 3, bladeR: 0.60, // brushed nickel + light kit
};

// --- placement ------------------------------------------------------------
export const LAYOUT = {
  // beds: local origin at HEAD end, wall-side corner; drawers face +z (room)
  bedA: { x: 0.03, z: 0.02, headAt: 'entry' },   // head against entry wall; occupies x 0.03..2.06
  bedB: { x: 3.54, z: 0.02, headAt: 'window' },  // head against window wall; occupies x 3.54..5.57
  fridge: { x: 2.56, z: 0.03 },                  // centered inside niche between stubs

  closet1: { x0: 0.95, w: 1.15, letter: 'A' },   // volume protrudes from closet wall
  closet2: { x0: 3.15, w: 1.15, letter: 'B' },
  desk1: { cx: 2.625 },                          // centered in alcove between closets
  desk2: { cx: 4.80 },                           // alcove between closet2 and column
  chair1: { x: 2.55, z: 2.00, rotY: -0.30 },
  chair2: { x: 4.98, z: 1.96, rotY: 0.55 },

  fan: { x: 2.80, z: 1.475 },
  towelBar: { x0: 0.14, x1: 0.78, y: 1.58 },     // closet wall, entry-side flat section
  hooks: [{ x: 0.30, y: 1.78 }, { x: 0.58, y: 1.78 }],
  vent: { z: 0.50, y: 2.42, w: 0.34, h: 0.24 },  // white grille, window wall
  thermostat: { z: 2.30, y: 1.45 },              // window wall near desk corner
  switch: { z: 1.66, y: 1.15 },                  // entry wall, bed side of door
  outlets: [                                     // duplex outlets, y = center height
    { wall: 'entry',  z: 0.70, y: 0.35 },
    { wall: 'bed',    x: 0.95, y: 0.62 },        // by bedA (usb style)
    { wall: 'bed',    x: 4.25, y: 0.62 },        // by bedB
    { wall: 'niche',  y: 1.06 },                 // behind microwave
    { wall: 'closet', x: 2.60, y: 0.35 },        // in desk1 alcove
    { wall: 'closet', x: 4.78, y: 0.35 },        // in desk2 alcove
    { wall: 'window', z: 2.45, y: 0.35 },
  ],
  sprinklers: [{ x: 1.40, z: 1.475 }, { x: 4.20, z: 1.475 }],
  smoke: { x: 0.85, z: 1.60 },
};

export const EYE = 1.60; // walk-mode eye height
