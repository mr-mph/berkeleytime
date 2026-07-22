export const JUMP_SPEED = 5.2;
export const JUMP_GRAVITY = 13;
export const HOP_MARGIN = 0.06;

// Walk mode intentionally ignores furniture so a visitor cannot get trapped
// in a dense layout. The room perimeter remains solid.
export function constrainToRoom(position, room, radius) {
  position.x = Math.max(radius, Math.min(room.L - radius, position.x));
  position.z = Math.max(radius, Math.min(room.W - radius, position.z));
  return position;
}

export function createJumpState() {
  return { height: 0, velocity: 0, grounded: true, queued: false };
}

export function queueJump(jump) {
  if (jump.grounded) jump.queued = true;
}

export function resetJump(jump) {
  jump.height = 0;
  jump.velocity = 0;
  jump.grounded = true;
  jump.queued = false;
}

export function stepJump(jump, dt) {
  if (jump.queued && jump.grounded) {
    jump.velocity = JUMP_SPEED;
    jump.grounded = false;
  }
  jump.queued = false;

  if (!jump.grounded) {
    jump.velocity -= JUMP_GRAVITY * dt;
    jump.height += jump.velocity * dt;
    if (jump.height <= 0) resetJump(jump);
  }
  return jump.height;
}
