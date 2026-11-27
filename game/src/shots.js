// The screenshot scenes behind ?shot=title|play|kitchen|end. Each one plays
// the real rules forward from a fresh world with a fixed seed, steered by
// the autopilot, so the frame is what a short game really looks like and
// the same seed always gives the same frame. The play and kitchen scenes
// wait for a good moment — the danger in frame and the turkey on the
// ground — instead of stopping at a blind time.

import { STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { autopilot } from './autopilot.js';
import { hazardBoxes } from './hazards.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 4;
const PLAY_LIMIT_SECONDS = 45;
const KITCHEN_METRES = 960;
const KITCHEN_LIMIT_SECONDS = 90;
const LIMIT_SECONDS = 240;

function runFor(world, seconds, until) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (until && until(world.state)) break;
    const events = world.step(STEP, autopilot(world.state));
    if (events & EVENT_OVER) break;
  }
}

/** Screen-space boxes of one kind currently in the frame (and on screen). */
function visibleKind(state, kind) {
  return hazardBoxes(state.hazards, state.cameraX, state.time)
    .some((box) => box.kind === kind && box.x > 200 && box.x < 1150
      && box.y > 60 && box.y < 620);
}

/** Step forward briefly until the turkey is back on the ground. */
function settle(world) {
  for (let i = 0; i < 90; i += 1) {
    if (world.state.turkey.onGround) break;
    world.step(STEP, autopilot(world.state));
  }
}

/**
 * Set `world` to the named scene and return the screen to draw and the
 * best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    // Farmyard run, held until a carving knife is in the frame and the
    // turkey is running on the ground — the cover needs the knife visible —
    // and the stage banner has cleared, so it does not cover the scene.
    runFor(world, PLAY_LIMIT_SECONDS, (s) => s.distance >= 150
      && s.turkey.onGround
      && s.bannerTimer <= 0
      && visibleKind(s, 'knife'));
    if (!world.state.over) settle(world);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    // Into stage 3, held until the oven and the swinging knife are both
    // in the frame with the turkey on the ground.
    runFor(world, KITCHEN_LIMIT_SECONDS, (s) => s.distance >= KITCHEN_METRES
      && s.turkey.onGround
      && visibleKind(s, 'oven')
      && visibleKind(s, 'swing'));
    if (!world.state.over && !visibleKind(world.state, 'oven')) {
      runFor(world, 30, (s) => s.turkey.onGround && visibleKind(s, 'oven'));
    }
    if (!world.state.over) settle(world);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    runFor(world, LIMIT_SECONDS, (s) => s.over);
    if (!world.state.over || world.state.overReason !== 'escaped') {
      world.forceEscape();
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  runFor(world, TITLE_SECONDS);
  return { screen: SCREEN_TITLE, best: 0 };
}
