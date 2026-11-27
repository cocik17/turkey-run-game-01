// The farmer: a little state machine with three moods.
//   chase  — runs behind the turkey, always a touch slower than the turkey's
//            top speed, so a good runner stays ahead; he corners (speeds up)
//            when he gets close, and faster still in the kitchen.
//   search — when the turkey hides in a haystack nearby, he stops, shows "?",
//            and looks around. Stay hidden and he gives up and drops back;
//            step out and he spots the turkey.
//   lunge  — he spotted the turkey ("!"): a short furious sprint. If he
//            reaches the turkey, that costs a life.

import { FARMER } from './config.js';

export function createFarmer() {
  return {
    gap: 150,
    mode: 'chase',
    timer: 0,
    stomp: 0,
    spottedFlash: 0,
  };
}

/**
 * Advance the farmer one step.
 * info: { dt, turkeyHidden, turkeyInHaystack, turkeyDucking, stageIndex,
 *         farmerSpeed, scrollSpeed, turkeyOnGround }
 * Returns 'spotted' | 'caught' | 'gaveUp' | null.
 */
export function updateFarmer(f, info) {
  const { dt } = info;
  if (f.spottedFlash > 0) f.spottedFlash -= dt;
  f.stomp += dt * (info.scrollSpeed / 24 + 4);

  if (f.mode === 'search') {
    f.timer -= dt;
    if (f.timer <= 0) {
      if (info.turkeyHidden && info.turkeyInHaystack) {
        f.mode = 'chase';
        f.gap = 235;
        return 'gaveUp';
      }
      f.mode = 'lunge';
      f.timer = FARMER.lungeSeconds;
      f.spottedFlash = 0.9;
      return 'spotted';
    }
    return null;
  }

  if (f.mode === 'lunge') {
    f.timer -= dt;
    f.gap -= FARMER.lungeSpeed * dt;
    if (f.gap <= FARMER.grabGap) {
      f.mode = 'chase';
      f.gap = 190;
      return 'caught';
    }
    if (f.timer <= 0) {
      f.mode = 'chase';
      f.gap = Math.max(f.gap, 120);
    }
    return null;
  }

  // Chase: gap closes when the farmer is faster than the scroll, opens when
  // the turkey outruns him. Hiding stops the scroll, so he walks right up.
  let speed = info.farmerSpeed;
  if (info.stageIndex === 2) speed += 6;
  if (f.gap < FARMER.cornerGap) speed += FARMER.cornerBonus;
  const scroll = info.turkeyHidden ? 0 : info.scrollSpeed;
  f.gap += (scroll - speed) * dt;
  // Never let him fall so far behind that he leaves the frame: the chase
  // has to stay visible.
  if (f.gap > 240) f.gap = 240;

  if (info.turkeyHidden && info.turkeyInHaystack && f.gap < FARMER.noticeGap) {
    f.mode = 'search';
    f.timer = FARMER.searchSeconds;
    return null;
  }
  if (!info.turkeyHidden && info.turkeyDucking && f.gap < 100) {
    // Ducking in the open fools nobody: he sees the turkey at once.
    f.mode = 'lunge';
    f.timer = FARMER.lungeSeconds;
    f.spottedFlash = 0.9;
    return 'spotted';
  }
  if (f.gap <= FARMER.grabGap && !info.turkeyHidden) {
    f.mode = 'chase';
    f.gap = 190;
    return 'caught';
  }
  return null;
}

export function farmerX(turkeyX, f) {
  return turkeyX - f.gap;
}

/** Draw the farmer: big, red-shirted, straw-hatted, pitchfork in hand. */
export function drawFarmer(ctx, f, turkeyX, groundY, time) {
  const x = farmerX(turkeyX, f);
  const stomp = Math.abs(Math.sin(f.stomp)) * 6;
  const searching = f.mode === 'search';
  const lunging = f.mode === 'lunge';

  ctx.save();
  ctx.translate(x, groundY - stomp * 0.3);

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, stomp * 0.3 + 4, 46, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs: angry stomps.
  const legSwing = searching ? 0 : Math.sin(f.stomp) * 14;
  ctx.strokeStyle = '#2e5fa3';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, -58);
  ctx.lineTo(-10 + legSwing, 0);
  ctx.moveTo(10, -58);
  ctx.lineTo(10 - legSwing, 0);
  ctx.stroke();

  // Overalls + red shirt.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-26, -118, 52, 62);
  ctx.fillStyle = '#2e5fa3';
  ctx.fillRect(-24, -78, 48, 22);
  ctx.fillRect(-24, -62, 18, 58);
  ctx.fillRect(6, -62, 18, 58);
  // Overall straps.
  ctx.fillRect(-18, -118, 8, 30);
  ctx.fillRect(10, -118, 8, 30);

  // Arms pumping; one hand grips the pitchfork.
  const armSwing = searching ? -6 : Math.sin(f.stomp) * 12;
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-24, -108);
  ctx.lineTo(-40, -72 + armSwing);
  ctx.moveTo(24, -108);
  ctx.lineTo(40, -76 - armSwing);
  ctx.stroke();

  // Pitchfork, held high.
  ctx.save();
  ctx.translate(46, -70);
  ctx.rotate(lunging ? -0.5 : -0.25);
  ctx.strokeStyle = '#7a4a26';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(0, -58);
  ctx.stroke();
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 4;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 9, -58);
    ctx.lineTo(i * 9, -80);
    ctx.stroke();
  }
  ctx.restore();

  // Head: angry eyes, big moustache.
  ctx.fillStyle = '#f0c08a';
  ctx.beginPath();
  ctx.arc(0, -132, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.beginPath();
  ctx.arc(-7, -136, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -136, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1210';
  ctx.beginPath();
  ctx.arc(-6, -136, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -136, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Angry brows.
  ctx.strokeStyle = '#5f3517';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -144);
  ctx.lineTo(-2, -141);
  ctx.moveTo(12, -144);
  ctx.lineTo(2, -141);
  ctx.stroke();
  // Moustache + open shouting mouth.
  ctx.fillStyle = '#5f3517';
  ctx.beginPath();
  ctx.ellipse(0, -124, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a2a1a';
  ctx.beginPath();
  ctx.ellipse(0, -116, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Straw hat.
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(0, -148, 32, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -150, 15, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-15, -150);
  ctx.lineTo(15, -150);
  ctx.stroke();

  ctx.restore();

  // Search "?" / spotted "!" bubble above his head.
  if (searching || f.spottedFlash > 0) {
    const mark = searching ? '?' : '!';
    const pulse = searching ? 1 + Math.sin(time * 6) * 0.08 : 1.15;
    ctx.save();
    ctx.translate(x + 8, groundY - 196);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = searching ? '#fff6e0' : '#ff5340';
    ctx.strokeStyle = '#1c1210';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = searching ? '#1c1210' : '#fff6e0';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark, 0, 2);
    ctx.restore();
  }
}
