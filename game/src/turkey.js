// The turkey: physics (run, jump, duck, hide), and the drawing of it.
// Screen x is fixed — the world scrolls past — so the turkey only moves
// vertically (jump height) and squashes down to duck or hide.

import { FIELD, GRAVITY, INVULN_TIME, JUMP_VELOCITY, TURKEY } from './config.js';

export function createTurkey() {
  return {
    x: TURKEY.x,
    alt: 0,
    vy: 0,
    onGround: true,
    duck: false,
    hidden: false,
    invuln: 0,
    boost: 0,
    waddle: 0,
    running: true,
  };
}

export function turkeyHeight(t) {
  return t.duck ? TURKEY.duckHeight : TURKEY.height;
}

/** Screen-space box, for collisions and drawing. */
export function turkeyBox(t) {
  const h = turkeyHeight(t);
  return {
    x: t.x - TURKEY.width / 2,
    y: FIELD.groundY - h - t.alt,
    width: TURKEY.width,
    height: h,
  };
}

export function updateTurkey(t, dt, controls, scrollSpeed) {
  if (t.invuln > 0) t.invuln -= dt;
  if (t.boost > 0) t.boost -= dt;
  t.duck = controls.duck && t.onGround;
  if (controls.jump && t.onGround && !t.duck) {
    t.vy = JUMP_VELOCITY;
    t.onGround = false;
  }
  if (!t.onGround) {
    t.alt += t.vy * dt;
    t.vy -= GRAVITY * dt;
    if (t.alt <= 0) {
      t.alt = 0;
      t.vy = 0;
      t.onGround = true;
    }
  }
  t.running = scrollSpeed > 1;
  if (t.running) t.waddle += dt * (scrollSpeed / 26);
}

/** Draw the turkey at its screen box. Panicked waddle, fanned tail, red wattle. */
export function drawTurkey(ctx, t, time) {
  const box = turkeyBox(t);
  const cx = box.x + box.width / 2;
  const feetY = box.y + box.height;
  const bob = t.running && t.onGround ? Math.sin(t.waddle * 2) * 3 : 0;
  const blink = Math.abs(Math.sin(t.waddle * 2)) < 0.08;

  ctx.save();
  // Brief invulnerability flicker.
  if (t.invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.translate(cx, feetY + bob * 0.4);

  // Golden-feather boost glow.
  if (t.boost > 0) {
    ctx.fillStyle = 'rgba(255, 210, 62, 0.15)';
    ctx.beginPath();
    ctx.arc(0, -box.height / 2, 52, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fanned tail behind the body.
  const tailColors = ['#a0522d', '#d2691e', '#e8a33c', '#c0392b', '#7a3b1e'];
  ctx.save();
  ctx.translate(-26, -box.height + 18);
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45 + Math.sin(t.waddle) * 0.03;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(0, -48, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs: frantic alternating steps while running.
  const stepA = t.running ? Math.sin(t.waddle * 2) * 10 : 0;
  ctx.strokeStyle = '#e8a33c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-8 + stepA, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - stepA, 0);
  ctx.stroke();

  // Body: plump brown oval.
  ctx.fillStyle = '#8a5230';
  ctx.beginPath();
  ctx.ellipse(0, -box.height / 2, 34, box.height / 2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly feathers.
  ctx.fillStyle = '#a86a3f';
  ctx.beginPath();
  ctx.ellipse(6, -box.height / 2 + 12, 22, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#5f3517';
  ctx.beginPath();
  ctx.ellipse(-6, -box.height / 2 + 2, 16, 22, -0.4, 0, Math.PI * 2);
  ctx.fill();

  if (t.duck) {
    // Ducked low: head tucked, body squashed.
    ctx.fillStyle = '#c9a06a';
    ctx.beginPath();
    ctx.arc(24, -26, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(28, -14, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Head up front, wide panicked eye, beak, dangling red wattle.
    ctx.fillStyle = '#c9a06a';
    ctx.beginPath();
    ctx.arc(26, -box.height + 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(31, -box.height + 4, 6, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#1c1210';
      ctx.beginPath();
      ctx.arc(33, -box.height + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2a93b';
    ctx.beginPath();
    ctx.moveTo(40, -box.height + 8);
    ctx.lineTo(56, -box.height + 12);
    ctx.lineTo(40, -box.height + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.ellipse(38, -box.height + 22, 5, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
