// World state: the fixed-step simulation. It owns the turkey, the farmer,
// the hazards and the pickups, and turns controls into distance, score,
// lives, stages and events. The renderer only reads this state; the
// autopilot only reads it too, so a screenshot replays the real rules.

import {
  BOOST_TIME, ESCAPE_AT, FIELD, INVULN_TIME, LIVES, PX_PER_METRE,
  SCORE, STAGES, TURKEY,
} from './config.js';
import { createTurkey, turkeyBox, updateTurkey } from './turkey.js';
import { createFarmer, updateFarmer } from './farmer.js';
import { createHazards, hazardBoxes, spawnHazards, updateHazards } from './hazards.js';
import { createPickups, pickupBoxes, spawnPickups, updatePickups } from './pickups.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_SPOTTED = 4;
export const EVENT_PICKUP = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_STAGE = 32;
export const EVENT_GAVEUP = 64;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(rng) {
  const state = {
    rng,
    turkey: createTurkey(),
    farmer: createFarmer(),
    hazards: createHazards(),
    pickups: createPickups(),
    cameraX: 0,
    distance: 0,
    score: 0,
    pickupScore: 0,
    lives: LIVES,
    stageIndex: 0,
    time: 0,
    banner: '',
    bannerTimer: 0,
    over: false,
    overReason: '',
    scrollSpeed: 0,
  };

  function reset() {
    state.turkey = createTurkey();
    state.farmer = createFarmer();
    state.hazards = createHazards();
    state.pickups = createPickups();
    state.cameraX = 0;
    state.distance = 0;
    state.score = 0;
    state.pickupScore = 0;
    state.lives = LIVES;
    state.stageIndex = 0;
    state.time = 0;
    state.banner = '';
    state.bannerTimer = 0;
    state.over = false;
    state.overReason = '';
    state.scrollSpeed = 0;
  }

  function setBanner(text, seconds = 1.5) {
    state.banner = text;
    state.bannerTimer = seconds;
  }

  function applyHit() {
    state.lives -= 1;
    state.turkey.invuln = INVULN_TIME;
    state.farmer.gap = Math.min(240, state.farmer.gap + 95);
    state.turkey.vy = 520;
    state.turkey.onGround = false;
    setBanner('HIT!', 1.2);
    if (state.lives <= 0) {
      state.over = true;
      state.overReason = 'caught';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function step(dt, controls) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;

    const t = state.turkey;
    updateTurkey(t, dt, controls, state.scrollSpeed);

    // Hiding: ducking while overlapping a haystack. The scroll stops and
    // the farmer walks up to search.
    const boxes = hazardBoxes(state.hazards, state.cameraX, state.time);
    const tBox = turkeyBox(t);
    t.hidden = false;
    for (const box of boxes) {
      if (box.kind === 'haystack' && t.duck && overlaps(tBox, box)) {
        t.hidden = true;
        break;
      }
    }

    let scroll = 0;
    if (!t.hidden) {
      scroll = controls.sprint ? TURKEY.sprintSpeed
        : controls.slow ? TURKEY.slowSpeed : TURKEY.runSpeed;
      if (t.boost > 0) scroll += TURKEY.boostBonus;
    }
    state.scrollSpeed = scroll;
    state.cameraX += scroll * dt;
    state.distance = state.cameraX / PX_PER_METRE;

    // Stage changes.
    const stageIndex = state.distance < STAGES[0].to ? 0
      : state.distance < STAGES[1].to ? 1 : 2;
    if (stageIndex !== state.stageIndex) {
      state.stageIndex = stageIndex;
      setBanner(`${STAGES[stageIndex].name}!`, 1.8);
      events |= EVENT_STAGE;
    }

    // The farmer acts on what the turkey is doing.
    const farmerEvent = updateFarmer(state.farmer, {
      dt,
      turkeyHidden: t.hidden,
      turkeyInHaystack: t.hidden,
      turkeyDucking: t.duck,
      stageIndex,
      farmerSpeed: STAGES[stageIndex].farmerSpeed,
      scrollSpeed: scroll,
      turkeyOnGround: t.onGround,
    });
    if (farmerEvent === 'spotted') {
      setBanner('SPOTTED!', 1.4);
      events |= EVENT_SPOTTED;
    } else if (farmerEvent === 'gaveUp') {
      setBanner('HE GAVE UP!', 1.4);
      events |= EVENT_GAVEUP;
    } else if (farmerEvent === 'caught') {
      if (t.boost > 0 || t.invuln > 0) {
        state.farmer.gap = 190;
      } else {
        events |= applyHit();
      }
    }

    spawnHazards(state.hazards, dt, stageIndex, state.rng, state.cameraX);
    updateHazards(state.hazards, dt, state.cameraX, state.time);
    spawnPickups(state.pickups, dt, state.rng, state.cameraX);
    updatePickups(state.pickups, dt, state.cameraX);

    // Hazard collisions (haystacks are shelter, not danger).
    const freshBoxes = hazardBoxes(state.hazards, state.cameraX, state.time);
    const freshTBox = turkeyBox(t);
    if (t.invuln <= 0 && t.boost <= 0) {
      for (const box of freshBoxes) {
        if (box.kind === 'haystack') continue;
        if (overlaps(freshTBox, box)) {
          events |= applyHit();
          break;
        }
      }
    }

    // Pickup collection.
    if (!state.over) {
      for (const box of pickupBoxes(state.pickups, state.cameraX)) {
        if (overlaps(freshTBox, box)) {
          box.ref.taken = true;
          if (box.kind === 'corn') state.pickupScore += SCORE.corn;
          else if (box.kind === 'pie') state.pickupScore += SCORE.pie;
          else if (box.kind === 'feather') {
            state.pickupScore += SCORE.corn;
            t.boost = BOOST_TIME;
            t.invuln = Math.max(t.invuln, BOOST_TIME);
          }
          events |= EVENT_PICKUP;
        }
      }
      state.pickups.list = state.pickups.list.filter((item) => !item.taken);
    }

    state.score = Math.floor(state.distance) * SCORE.perMetre + state.pickupScore;

    if (state.distance >= ESCAPE_AT && !state.over) {
      state.over = true;
      state.overReason = 'escaped';
      state.score += SCORE.escapeBonus;
      setBanner('ESCAPED!', 2);
      events |= EVENT_ESCAPED | EVENT_OVER;
    }
    return events;
  }

  /** Stage the escaped ending directly (used by the end screenshot). */
  function forceEscape() {
    reset();
    state.cameraX = ESCAPE_AT * PX_PER_METRE;
    state.distance = ESCAPE_AT;
    state.pickupScore = 2450;
    state.score = Math.floor(state.distance) * SCORE.perMetre + state.pickupScore + SCORE.escapeBonus;
    state.lives = 2;
    state.stageIndex = 2;
    state.over = true;
    state.overReason = 'escaped';
  }

  return {
    state,
    reset,
    step,
    forceEscape,
    stageName() {
      return STAGES[state.stageIndex].name;
    },
    groundY() {
      return FIELD.groundY;
    },
  };
}
