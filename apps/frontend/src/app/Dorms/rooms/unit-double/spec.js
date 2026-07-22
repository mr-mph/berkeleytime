// Units 1-3 standard double. Dimensions are meters.
// Coordinates: +x left-to-right from the entry, +z entry-to-window, +y up.
// The 13'9" x 13'2" envelope is the published typical high-rise room size;
// Berkeley notes that individual rooms and furniture configurations vary.
export const ROOM = { L: 4.19, W: 4.01, H: 2.72, wallT: 0.15, baseH: 0.10, baseT: 0.01 };

export const COLORS = {
  wall:0xefe9dd, trim:0xf6f4ee, ceiling:0xf1ede4, carpet:0x6e7a70,
  carpetDark:0x5d685f, lino:0xcdc6b4, cove:0x4c4f52, wood:0xc0925a,
  woodDark:0x9e7443, doorLeaf:0x8a5f38, metalDark:0x3a3a3d,
  chrome:0xd9dbde, brushed:0xb7babd, alu:0x35312c, glass:0xcfe0ea,
  mattress:0x2b4570, duvet:0xf0ede6, blanket:0x9aa1aa, pillow:0xfaf8f2,
  sheet:0xe9e6df, chairBlack:0x232527, chairBase:0x1b1c1e,
  fridge:0x18181a, curtain:0xc7b08c, curtainDim:0xab9573,
  partition:0xf4f2ec, cork:0xc09a63, radiator:0xe9e6de,
  brace:0xd7d9da, neighbor:0xcfc8bb, lightLens:0xf5f2e8,
};

// The detailed shared door builder uses a local x=0 plane and a z-span.
export const DOOR = {
  x0:1.64, z0:0, w:0.91, h:2.03, leafT:0.045, hingeZ:0.91,
  maxOpenDeg:96, casingW:0.075, casingT:0.018, leverY:1.00, peepY:1.50,
};

// These constants feed the shared Unit window builder before its output is
// rotated from x=ROOM.L onto this room's z=ROOM.W wall.
export const WINDOW = {
  z0:0.29, w:3.61, y0:0.78, h:1.64, frameT:0.05, frameD:0.11,
  mullions:[1.20,2.41], transomY:1.20, sillD:0.14, sillT:0.03,
};
export const CURTAIN = {
  trackY:2.48, drop:1.64,
  z0:WINDOW.z0+WINDOW.frameT,
  z1:WINDOW.z0+WINDOW.w-WINDOW.frameT,
  panelT:0.03, foldN:14,
};
export const BRACE = { w:0.46, t:0.09, angleDeg:38, standoff:0.85 };
export const CEIL = { ribW:0.14, ribD:0.18, ribX:[0.48,1.24,2.00,2.76,3.52], beamW:0.28, beamD:0.30 };
export const ENTRY = { x0:1.46, x1:2.73, z1:1.02 };

export const BED = {
  L:2.13, W:1.01, mattL:2.03, mattW:0.91, mattH:0.18,
  postW:0.078, postD:0.078, deck:0.48, postH:1.05, railH:0.14,
};
export const CLOSET = {
  depth:0.64, h:2.12, shelfY:1.87, rodY:1.66, lightY:2.24,
  left:{x0:0,x1:1.36}, right:{x0:2.83,x1:ROOM.L},
  mirror:{w:0.33,h:1.35,y0:0.42},
};
// Full-height built-in between the entry door and right closet. Its narrow
// side fills the wall bay while its shelves open sideways toward the door.
export const BOOKCASE = { w:CLOSET.depth, d:CLOSET.right.x0-(DOOR.x0+DOOR.w), h:CLOSET.h, shelves:4 };
export const DESK = { w:1.0414, d:0.61, topT:0.035, h:0.75, pedW:0.40, kneeH:0.62, modestyT:0.018 }; // 41 in wide
export const CHAIR = { seatH:0.46, seatW:0.47, seatD:0.45, backH:0.52, baseR:0.30 };
export const FRIDGE = { w:0.48, d:0.50, h:0.87 };
export const MICROWAVE = { w:0.48, d:0.38, h:0.28 };
export const RADIATOR = { w:2.55, d:0.12, h:0.24, y0:0.10 };
export const LIGHTBOX = { w:1.22, d:0.30, h:0.09 };

export const LAYOUT = {
  bedLeft:{x:BED.W+0.04,z:1.50,rotY:-Math.PI/2,drawerSide:'near'},
  bedRight:{x:ROOM.L-0.04,z:1.50,rotY:-Math.PI/2,drawerSide:'far'},
  // Rotate the shelf so its opening faces the door. With a -90-degree yaw its
  // footprint occupies x=(entryShelf.x-BOOKCASE.d)..entryShelf.x.
  entryShelf:{x:CLOSET.right.x0,z:0,rotY:-Math.PI/2},
  // Keep the joined desk run just in front of the heater/AC instead of letting
  // the rear desk overlap the unit on the window wall.
  deskLeft:{x:ROOM.L/2,z:ROOM.W-RADIATOR.d-.04-DESK.w/2,rotY:Math.PI/2},
  deskRight:{x:ROOM.L/2,z:ROOM.W-RADIATOR.d-.04-DESK.w*1.5,rotY:-Math.PI/2},
  chairLeft:{x:1.36,z:ROOM.W-RADIATOR.d-.04-DESK.w/2,rotY:Math.PI/2},
  chairRight:{x:2.83,z:ROOM.W-RADIATOR.d-.04-DESK.w*1.5,rotY:-Math.PI/2},
  // Floor-standing at the right side of the window desk, opposite its chair.
  // x/z describe the local back-left placement before main applies its yaw.
  microchill:{x:ROOM.L/2+DESK.d/2+.08,y:0,z:ROOM.W-RADIATOR.d-.04},
  radiator:{x:ROOM.L/2,z:ROOM.W-RADIATOR.d/2},
  lightbox:{x:ROOM.L/2,z:2.10},
};

export const EYE = 1.60;
