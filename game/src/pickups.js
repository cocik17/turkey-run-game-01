// Pickups: corn cobs (+50), pumpkin pie slices (+100) and the golden
// feather (brief speed boost + invulnerability). They drift in from the
// right in little arcs; low ones are grabbed by running, high ones by
// jumping.

import { FIELD } from './config.js';

export function createPickups() {
  return { list: [], cornTimer: 1.2, pieTimer: 8, featherTimer: 14 };
}

function add(list, kind, x, alt) {
  list.push({ kind, x, alt, phase: 0 });
}

export function spawnPickups(p, dt, rng, cameraX) {
  p.cornTimer -= dt;
  if (p.cornTimer <= 0) {
    const baseX = cameraX + rng.range(1150, 1350);
    const high = rng.chance(0.45);
    const alt = high ? 170 : 46;
    add(p.list, 'corn', baseX, alt);
    add(p.list, 'corn', baseX + 62, alt + 26);
    add(p.list, 'corn', baseX + 124, alt);
    p.cornTimer = rng.range(1.6, 2.6);
  }
  p.pieTimer -= dt;
  if (p.pieTimer <= 0) {
    add(p.list, 'pie', cameraX + rng.range(1150, 1350), rng.chance(0.5) ? 170 : 46);
    p.pieTimer = rng.range(8, 12);
  }
  p.featherTimer -= dt;
  if (p.featherTimer <= 0) {
    add(p.list, 'feather', cameraX + rng.range(1150, 1350), 170);
    p.featherTimer = rng.range(15, 20);
  }
}

export function updatePickups(p, dt, cameraX) {
  for (const item of p.list) item.phase += dt * 3;
  p.list = p.list.filter((item) => item.x > cameraX - 120);
}

/** Screen-space boxes for collection checks and drawing. */
export function pickupBoxes(p, cameraX) {
  return p.list
    .map((item) => {
      const sx = item.x - cameraX;
      if (sx < -80 || sx > 1400) return null;
      const bob = Math.sin(item.phase) * 5;
      return {
        kind: item.kind, ref: item,
        x: sx - 24, y: FIELD.groundY - item.alt - 24 + bob,
        width: 48, height: 48,
      };
    })
    .filter(Boolean);
}

export function drawPickups(ctx, p, cameraX) {
  for (const box of pickupBoxes(p, cameraX)) {
    const cx = box.x + 24;
    const cy = box.y + 24;
    if (box.kind === 'corn') {
      ctx.fillStyle = '#3f7a2e';
      ctx.beginPath();
      ctx.ellipse(cx - 14, cy + 8, 8, 16, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 14, cy + 8, 8, 16, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 13, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8a91f';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 7, cy - 18);
        ctx.lineTo(cx + i * 7, cy + 14);
        ctx.stroke();
      }
    } else if (box.kind === 'pie') {
      ctx.fillStyle = '#c96a2e';
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 14);
      ctx.lineTo(cx + 22, cy + 14);
      ctx.lineTo(cx, cy - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e88a4a';
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 14);
      ctx.lineTo(cx + 22, cy + 14);
      ctx.lineTo(cx + 14, cy + 2);
      ctx.lineTo(cx - 14, cy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden feather: glowing, worth a sprint.
      ctx.fillStyle = 'rgba(255, 210, 62, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8, 22, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff6e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 18);
      ctx.lineTo(cx + 8, cy - 18);
      ctx.stroke();
    }
  }
}
