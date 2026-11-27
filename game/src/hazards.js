// Hazards: fences, hay bales, rolling pumpkins, falling carving knives,
// the glowing oven and the swinging carving knife. Everything lives in
// world x; the screen position is world x minus the camera. Haystacks are
// not hazards — they are the turkey's hiding places.

import { FIELD } from './config.js';

export function createHazards() {
  return {
    list: [],
    nextX: 950,
    knifeTimer: 3,
    hayTimer: 5,
  };
}

const SIZES = {
  fence: { w: 48, h: 66 },
  bale: { w: 74, h: 80 },
  haystack: { w: 118, h: 98 },
  pumpkin: { w: 54, h: 54 },
  knife: { w: 36, h: 96 },
  oven: { w: 84, h: 110 },
  swing: { w: 64, h: 96 },
};

function add(list, kind, x, extra = {}) {
  list.push({ kind, x, y: 0, vy: 0, landed: false, timer: 0, phase: 0, ...extra });
}

export function spawnHazards(h, dt, stageIndex, rng, cameraX) {
  // Ground obstacles marching in from the right. Pumpkins roll toward the
  // turkey, so they start well behind the hazard ahead of them — otherwise
  // they roll into the turkey's landing strip.
  while (h.nextX < cameraX + 1500) {
    const x = h.nextX;
    const roll = rng.next();
    let kind;
    if (stageIndex === 0) {
      if (roll < 0.42) kind = 'fence';
      else if (roll < 0.75) kind = 'bale';
      else if (roll < 0.9) kind = 'pumpkin';
      else kind = 'haystack';
    } else if (stageIndex === 1) {
      if (roll < 0.3) kind = 'fence';
      else if (roll < 0.55) kind = 'bale';
      else if (roll < 0.85) kind = 'pumpkin';
      else kind = 'haystack';
    } else {
      if (roll < 0.3) kind = 'oven';
      else if (roll < 0.52) kind = 'swing';
      else if (roll < 0.76) kind = 'pumpkin';
      else kind = 'fence';
    }
    // The turkey needs a clear landing strip between jumps, so hazards
    // stay apart; knives shatter on impact and need no room of their own.
    const placedX = kind === 'pumpkin' ? x + 220 : x;
    if (kind === 'swing') add(h.list, 'swing', placedX, { phase: rng.range(0, 6) });
    else add(h.list, kind, placedX);
    // Leave a landing strip between jumps: a jump carries ~285 px, so
    // hazards stay at least 400 px apart. The kitchen's ovens and swings
    // need more room than that — a swing hangs at the next hazard's spot —
    // so stage 3 breathes wider. A swing's blade hangs at the next
    // hazard's spot, so leave extra room after one — the turkey ducks the
    // blade, then needs a clear run at the next jump.
    const gap = stageIndex === 2
      ? rng.range(480, 640)
      : rng.range(400, 580) - stageIndex * 20;
    h.nextX += gap + (kind === 'swing' ? 100 : 0);
  }

  // Falling carving knives from stage 2 on: they drop ahead of the turkey,
  // but never on top of another hazard — there must always be a patch of
  // clear ground to land on between dangers.
  h.knifeTimer -= dt;
  if (stageIndex >= 1 && h.knifeTimer <= 0) {
    let kx = -1;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = cameraX + rng.range(700, 1300);
      // The knife shatters on impact, so it only needs a clear patch of
      // ground to fall onto — no dead zone around a stuck blade.
      const clear = h.list.every((hz) => Math.abs(hz.x - candidate) > 100);
      if (clear) {
        kx = candidate;
        break;
      }
    }
    if (kx >= 0) {
      add(h.list, 'knife', kx, {
        y: -140,
        vy: rng.range(340, 420),
      });
      h.knifeTimer = stageIndex === 2 ? rng.range(6.0, 9.0) : rng.range(4.0, 6.0);
    } else {
      // No clear landing spot this round: try again shortly.
      h.knifeTimer = 0.8;
    }
  }

  // A fresh haystack to hide in, farmyard and barn only.
  h.hayTimer -= dt;
  if (stageIndex < 2 && h.hayTimer <= 0) {
    add(h.list, 'haystack', cameraX + 1350);
    h.hayTimer = rng.range(7, 10);
  }
}

export function updateHazards(h, dt, cameraX, time) {
  for (const hz of h.list) {
    if (hz.kind === 'pumpkin') hz.x -= 50 * dt;
    if (hz.kind === 'knife' && !hz.landed) {
      hz.y += hz.vy * dt;
      if (hz.y >= FIELD.groundY - SIZES.knife.h) {
        hz.y = FIELD.groundY - SIZES.knife.h;
        hz.landed = true;
        // The blade sticks for a blink, then shatters — it never becomes
        // a fence the turkey has to jump over a hazard next to.
        hz.timer = 0.25;
      }
    }
    if (hz.kind === 'knife' && hz.landed) hz.timer -= dt;
    if (hz.kind === 'swing') hz.phase = time;
  }
  h.list = h.list.filter((hz) => {
    if (hz.kind === 'knife' && hz.landed && hz.timer <= 0) return false;
    return hz.x > cameraX - 320;
  });
}

/** Swinging knife blade centre in screen coordinates. */
export function swingBlade(hz, cameraX, time) {
  const pivotX = hz.x - cameraX;
  const pivotY = 70;
  // Long arm, so the blade hangs at the turkey's head height: a turkey on
  // the ground must duck under it, while a jumping turkey arcs over it.
  const arm = 430;
  const angle = Math.sin(time * 1.5 + hz.phase) * 0.28;
  return {
    x: pivotX + Math.sin(angle) * arm,
    y: pivotY + Math.cos(angle) * arm,
    angle,
  };
}

/** Screen-space boxes for everything solid or dangerous. Haystacks included. */
export function hazardBoxes(h, cameraX, time) {
  const boxes = [];
  for (const hz of h.list) {
    const sx = hz.x - cameraX;
    if (sx < -260 || sx > 1560) continue;
    if (hz.kind === 'swing') {
      const blade = swingBlade(hz, cameraX, time);
      boxes.push({
        kind: 'swing', ref: hz,
        x: blade.x - 30, y: blade.y - 44,
        width: 60, height: 92,
      });
      continue;
    }
    const size = SIZES[hz.kind];
    const y = hz.kind === 'knife'
      ? hz.y
      : FIELD.groundY - size.h;
    boxes.push({ kind: hz.kind, ref: hz, x: sx - size.w / 2, y, width: size.w, height: size.h });
  }
  return boxes;
}

export function drawHazards(ctx, h, cameraX, time) {
  for (const hz of h.list) {
    const sx = hz.x - cameraX;
    if (sx < -260 || sx > 1560) continue;
    const groundY = FIELD.groundY;
    if (hz.kind === 'fence') {
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(sx - 24, groundY - 66, 8, 66);
      ctx.fillRect(sx + 16, groundY - 66, 8, 66);
      ctx.fillStyle = '#a86a3f';
      ctx.fillRect(sx - 30, groundY - 62, 60, 9);
      ctx.fillRect(sx - 30, groundY - 36, 60, 9);
    } else if (hz.kind === 'bale') {
      ctx.fillStyle = '#c9a13b';
      ctx.beginPath();
      ctx.arc(sx, groundY - 40, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, groundY - 40, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, groundY - 40, 16, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hz.kind === 'haystack') {
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.moveTo(sx - 59, groundY);
      ctx.quadraticCurveTo(sx - 52, groundY - 96, sx, groundY - 98);
      ctx.quadraticCurveTo(sx + 52, groundY - 96, sx + 59, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c9a13b';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 20, groundY - 20);
        ctx.lineTo(sx + i * 16, groundY - 78);
        ctx.stroke();
      }
    } else if (hz.kind === 'pumpkin') {
      const wobble = Math.sin(time * 9 + hz.x) * 2;
      ctx.fillStyle = '#e8641b';
      ctx.beginPath();
      ctx.ellipse(sx, groundY - 27 + wobble, 28, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b34a12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 12, groundY - 50);
      ctx.quadraticCurveTo(sx, groundY - 20, sx - 12, groundY - 4);
      ctx.moveTo(sx + 12, groundY - 50);
      ctx.quadraticCurveTo(sx, groundY - 20, sx + 12, groundY - 4);
      ctx.stroke();
      ctx.fillStyle = '#7a3b1e';
      ctx.fillRect(sx - 3, groundY - 58, 6, 12);
      // Angry carved face.
      ctx.fillStyle = '#1c1210';
      ctx.beginPath();
      ctx.moveTo(sx - 16, groundY - 36);
      ctx.lineTo(sx - 6, groundY - 36);
      ctx.lineTo(sx - 11, groundY - 28);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + 6, groundY - 36);
      ctx.lineTo(sx + 16, groundY - 36);
      ctx.lineTo(sx + 11, groundY - 28);
      ctx.closePath();
      ctx.fill();
    } else if (hz.kind === 'knife') {
      const tipY = hz.y + SIZES.knife.h;
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.moveTo(sx - 15, hz.y + 34);
      ctx.lineTo(sx + 15, hz.y + 34);
      ctx.lineTo(sx, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(sx - 15, hz.y, 30, 36);
      ctx.fillStyle = '#ffd23e';
      ctx.fillRect(sx - 15, hz.y + 32, 30, 4);
    } else if (hz.kind === 'oven') {
      const glow = 0.6 + Math.sin(time * 5) * 0.25;
      ctx.fillStyle = '#3d3d46';
      ctx.fillRect(sx - 50, groundY - 118, 100, 118);
      ctx.fillStyle = '#2a2a31';
      ctx.fillRect(sx - 50, groundY - 118, 100, 14);
      // Glowing hot window: do not step in.
      ctx.fillStyle = `rgba(255, 122, 26, ${glow})`;
      ctx.fillRect(sx - 36, groundY - 92, 72, 52);
      ctx.strokeStyle = '#ff5340';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx - 36, groundY - 92, 72, 52);
      // A turkey silhouette roasting inside — the fate being escaped.
      ctx.fillStyle = '#7a2a1a';
      ctx.beginPath();
      ctx.ellipse(sx, groundY - 66, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 18, groundY - 76, 7, 0, Math.PI * 2);
      ctx.fill();
      // Dials and a warning sign.
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.arc(sx - 32, groundY - 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx - 16, groundY - 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff6e0';
      ctx.fillText('HOT!', sx + 26, groundY - 10);
    } else if (hz.kind === 'swing') {
      const blade = swingBlade(hz, cameraX, time);
      // Chain from the ceiling.
      ctx.strokeStyle = '#8a8f98';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, 96);
      ctx.lineTo(blade.x, blade.y - 40);
      ctx.stroke();
      // Big carving knife at the end of the chain.
      ctx.save();
      ctx.translate(blade.x, blade.y);
      ctx.rotate(blade.angle + Math.PI / 2);
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(-8, -52, 16, 34);
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.moveTo(-14, -18);
      ctx.lineTo(14, -18);
      ctx.lineTo(0, 52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
