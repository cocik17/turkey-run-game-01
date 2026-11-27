// Autopilot: plays the real rules — run, jump the ground hazards, duck
// under a low swinging knife, time the falling knives, sprint when the
// farmer closes in, and hide in a haystack when he is nearly on top of the
// turkey. Screenshots stage scenes by running this forward, so every frame
// is a moment of genuine play.
//
// The jump decision is a little simulation, not a distance guess: the
// turkey must still be above a hazard from the moment its front reaches
// the turkey's beak until its rear has passed the turkey's tail, so the
// pilot checks the whole jump arc before taking off.

import { FIELD, GRAVITY, JUMP_VELOCITY, TURKEY } from './config.js';
import { turkeyBox } from './turkey.js';
import { hazardBoxes, swingBlade } from './hazards.js';

const GROUND_KINDS = ['fence', 'bale', 'pumpkin', 'oven', 'knife'];
const HAZARD_HEIGHT = { fence: 66, bale: 80, pumpkin: 54, oven: 110, knife: 96 };
const HAZARD_WIDTH = { fence: 48, bale: 74, pumpkin: 54, oven: 84, knife: 36 };
/** Airtime of one jump, in seconds. */
const AIR_TIME = (2 * JUMP_VELOCITY) / GRAVITY;

function jumpAlt(t) {
  return JUMP_VELOCITY * t - (GRAVITY / 2) * t * t;
}

/**
 * Would a jump taken right now clear this hazard? The hazard's front
 * reaches the turkey at t1 and its rear passes the turkey's tail at t2;
 * the turkey must be above the hazard (with a margin) for that whole span,
 * and the span must end before the jump does. `activeFrom` is when the
 * hazard becomes solid — a falling knife only counts once it has landed.
 */
function clearsJump(box, scroll, activeFrom = 0) {
  const rel = box.kind === 'pumpkin' ? scroll + 50 : scroll;
  const dx = box.x - TURKEY.x - TURKEY.width / 2;
  const t1 = Math.max(dx / rel, activeFrom);
  const t2 = (dx + HAZARD_WIDTH[box.kind] + TURKEY.width) / rel;
  if (t1 > AIR_TIME || t2 < 0) return true;
  const need = HAZARD_HEIGHT[box.kind] + 10;
  const a1 = jumpAlt(Math.max(0, Math.min(AIR_TIME, t1)));
  const a2 = jumpAlt(Math.max(0, Math.min(AIR_TIME, t2)));
  return Math.min(a1, a2) > need && t2 <= AIR_TIME + 0.03;
}

/**
 * Would a falling knife come down through the turkey's jump arc? The
 * knife is dangerous while it falls, not only after it sticks: sample
 * both boxes through the jump and block the takeoff if they ever meet.
 * Screen frame: the turkey stays put and the knife slides left with the
 * world as it falls.
 */
function fallingKnifeBlocksJump(box, state, scroll) {
  const hz = box.ref;
  for (let t = 0; t <= AIR_TIME; t += 0.02) {
    const knifeY = Math.min(hz.y + hz.vy * t, FIELD.groundY - 96);
    const knifeX = box.x - scroll * t;
    const alt = jumpAlt(t);
    const top = FIELD.groundY - TURKEY.height - alt;
    const overlapsX = knifeX + 36 > TURKEY.x - TURKEY.width / 2
      && knifeX < TURKEY.x + TURKEY.width / 2;
    const overlapsY = knifeY + 96 > top && knifeY < top + TURKEY.height;
    if (overlapsX && overlapsY) return true;
  }
  return false;
}

/**
 * Would the swinging blade cross the turkey's jump arc? Sample the blade's
 * position through the jump: if it ever overlaps the turkey's box while
 * the turkey is up there, the jump waits on the ground instead.
 */
function swingBlocksJump(box, state, scroll) {
  const hz = box.ref;
  for (let t = 0.15; t <= AIR_TIME; t += 0.1) {
    const blade = swingBlade(hz, state.cameraX + scroll * t, state.time + t);
    const alt = jumpAlt(t);
    const top = FIELD.groundY - TURKEY.height - alt;
    const overlapsX = blade.x + 30 > TURKEY.x - TURKEY.width / 2
      && blade.x - 30 < TURKEY.x + TURKEY.width / 2;
    const overlapsY = blade.y + 48 > top && blade.y - 44 < top + TURKEY.height;
    if (overlapsX && overlapsY) return true;
  }
  return false;
}

export function autopilot(state) {
  const t = state.turkey;
  const controls = { jump: false, duck: false, sprint: false, slow: false };
  const boxes = hazardBoxes(state.hazards, state.cameraX, state.time);
  const tBox = turkeyBox(t);
  const turkeyFront = tBox.x + tBox.width;
  const gap = state.farmer.gap;
  const scroll = Math.max(1, state.scrollSpeed || TURKEY.runSpeed);

  // Stay hidden while the farmer searches; slip out once he gives up.
  if (t.hidden) {
    controls.duck = state.farmer.mode === 'search' || gap < 200;
    return controls;
  }

  // Ground hazards: jump only when the whole arc clears every hazard in
  // the way; wait (keep running) until the moment is right. A knife that
  // has already stuck in the ground is just another low fence to jump, and
  // a knife still falling blocks the takeoff if it would come down through
  // the arc. The jump is also held while a swinging blade would cross it.
  let groundUrgent = false;
  let urgentKind = null;
  let swingBlocks = false;
  for (const box of boxes) {
    if (box.kind === 'swing' && swingBlocksJump(box, state, scroll)) swingBlocks = true;
  }
  if (t.onGround) {
    let urgent = false;
    let allClear = true;
    for (const box of boxes) {
      if (!GROUND_KINDS.includes(box.kind)) continue;
      if (box.kind === 'knife' && !box.ref.landed) {
        const dx = box.x - turkeyFront;
        // A knife anywhere in the jump's reach can come down through the
        // arc, not only one already close: check the whole arc against its
        // descent. It also blocks the jump if it will land on the spot the
        // turkey lands on — the turkey would come down onto the blade.
        if (dx >= -160 && dx <= 620) {
          if (fallingKnifeBlocksJump(box, state, scroll)) allClear = false;
          const landingIn = Math.max(0, (FIELD.groundY - 96 - box.ref.y) / Math.max(1, box.ref.vy));
          if (landingIn < AIR_TIME) {
            const atLanding = dx - scroll * AIR_TIME;
            if (atLanding > -110 && atLanding < 0) allClear = false;
          }
        }
        continue;
      }
      const dx = box.x - turkeyFront;
      if (dx < -160 || dx > 320) continue;
      if (dx <= 160 && dx > 0) {
        urgent = true;
        urgentKind = box.kind;
      }
      if (dx <= 220 && dx > 0) groundUrgent = true;
      if (!clearsJump(box, scroll)) allClear = false;
    }
    if (urgent && allClear && !swingBlocks) controls.jump = true;
  }

  // Swinging knife: duck under a low blade, sprint under a high one.
  // Never duck while a jump is needed — the jump wins, and the jump
  // check runs first, so a duck never blocks a takeoff.
  if (!controls.jump) {
    for (const box of boxes) {
      if (box.kind !== 'swing') continue;
      const bladeX = box.x + box.width / 2;
      const bladeY = box.y + box.height / 2;
      if (bladeX > TURKEY.x - 90 && bladeX < TURKEY.x + 240 && bladeY > 400) {
        if (gap > 110) controls.duck = true;
      } else if (bladeX > TURKEY.x - 20 && bladeX < TURKEY.x + 320 && bladeY < 380) {
        controls.sprint = true;
      }
    }
    // The swing is holding a jump the turkey needs: slow down and let the
    // blade swing away — and let a stuck knife fade — instead of running
    // into the hazard. Only worth it for a knife, which fades; slowing
    // into a fence, pumpkin, or oven just narrows the jump window.
    if (swingBlocks && groundUrgent && t.onGround && urgentKind === 'knife') {
      controls.slow = true;
      controls.sprint = false;
    }
  }

  // Falling knives: pass before one lands, or slow down and let it stick
  // and fade before walking into it. Never slow when a ground hazard is
  // close — slowing shrinks the jump arc and the turkey runs into it —
  // and never slow mid-jump: the clearance was predicted at run speed.
  for (const box of boxes) {
    if (box.kind !== 'knife' || box.ref.landed) continue;
    const hz = box.ref;
    const kx = box.x + box.width / 2;
    const dx = kx - TURKEY.x;
    if (dx < -40 || dx > 420) continue;
    const arrival = Math.max(0, dx) / scroll;
    const landingIn = Math.max(0, (FIELD.groundY - 96 - hz.y) / Math.max(1, hz.vy));
    if (arrival < landingIn - 0.2) controls.sprint = true;
    else if (arrival < landingIn + 1.3 && !groundUrgent && t.onGround) controls.slow = true;
  }

  // Hide in the next haystack when the farmer is breathing down the turkey.
  // Hiding never overrides a jump that is already needed.
  if (gap < 130 && !controls.jump) {
    for (const box of boxes) {
      if (box.kind !== 'haystack') continue;
      const dx = box.x - turkeyFront;
      if (dx > -60 && dx < 240) {
        if (dx <= 30) controls.duck = true;
        controls.sprint = true;
        break;
      }
    }
  }

  // The farmer corners when he is close: sprint to open the gap again.
  if (gap < 120) controls.sprint = true;
  if (gap < 70) {
    controls.sprint = true;
    controls.slow = false;
  }

  return controls;
}
