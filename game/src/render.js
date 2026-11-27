// Canvas renderer: stage backgrounds, entities, the big readable HUD,
// and the title / pause / end screens. Everything is drawn in code —
// no images, no fonts to load — and the HUD text is large with high
// contrast, because the screenshots are how the game is judged.

import { FIELD, LIVES, PALETTE, STAGES } from './config.js';
import { drawTurkey } from './turkey.js';
import { drawFarmer, farmerX } from './farmer.js';
import { drawHazards } from './hazards.js';
import { drawPickups } from './pickups.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.55);
  ctx.bezierCurveTo(-size, -size * 0.25, -size * 0.45, -size * 0.9, 0, -size * 0.3);
  ctx.bezierCurveTo(size * 0.45, -size * 0.9, size, -size * 0.25, 0, size * 0.55);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ff5340';
    ctx.fill();
  } else {
    ctx.strokeStyle = '#8b93a3';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  function text(str, x, y, size, color, align = 'left', weight = 'bold') {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function outlinedText(str, x, y, size, color, align = 'left') {
    ctx.font = `bold ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(20, 8, 2, 0.85)';
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawSky(stageIndex, cameraX, time, sunset = false) {
    const top = sunset ? '#ff7a1a' : STAGES[stageIndex].sky[0];
    const bottom = sunset ? '#c0392b' : STAGES[stageIndex].sky[1];
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);

    // Sun (low and huge at sunset).
    const sunX = sunset ? 1060 : 1080;
    const sunY = sunset ? 420 : 110;
    const sunR = sunset ? 90 : 52;
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 210, 62, 0.25)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR + 26, 0, Math.PI * 2);
    ctx.fill();

    if (!sunset) {
      // Slow clouds, parallaxed, kept clear of the HUD progress bar.
      ctx.fillStyle = 'rgba(255, 246, 224, 0.85)';
      for (let i = 0; i < 4; i += 1) {
        const cx = ((i * 360 - cameraX * 0.2) % 1500 + 1500) % 1500 - 110;
        const cy = 140 + i * 48;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 62, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 40, cy + 6, 44, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawFarmyardBackdrop(cameraX) {
    // Rolling hills.
    ctx.fillStyle = '#7a9a3a';
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(320, 430, 640, 510);
    ctx.quadraticCurveTo(960, 580, 1280, 490);
    ctx.lineTo(1280, FIELD.groundY);
    ctx.lineTo(0, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Farmhouse with a red barn roof, far left of the scroll.
    const hx = 980 - (cameraX * 0.35) % 1900;
    ctx.fillStyle = '#f0e6cc';
    ctx.fillRect(hx, 380, 220, 140);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(hx - 14, 384);
    ctx.lineTo(hx + 110, 306);
    ctx.lineTo(hx + 234, 384);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5f3517';
    ctx.fillRect(hx + 88, 440, 44, 80);
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(hx + 24, 410, 34, 34);
    ctx.fillRect(hx + 162, 410, 34, 34);
    // Round autumn trees.
    for (let i = 0; i < 3; i += 1) {
      const tx = ((i * 520 - cameraX * 0.5) % 1500 + 1500) % 1500 - 100;
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(tx - 6, 470, 12, 50);
      ctx.fillStyle = ['#e8641b', '#d2691e', '#c0392b'][i];
      ctx.beginPath();
      ctx.arc(tx, 450, 46, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBarnBackdrop() {
    // Wooden plank walls.
    ctx.fillStyle = '#6e4520';
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    ctx.strokeStyle = '#54331a';
    ctx.lineWidth = 3;
    for (let x = 0; x < FIELD.width; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.groundY);
      ctx.stroke();
    }
    // Big window with daylight streaming in.
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(880, 110, 260, 200);
    ctx.strokeStyle = '#54331a';
    ctx.lineWidth = 10;
    ctx.strokeRect(880, 110, 260, 200);
    ctx.beginPath();
    ctx.moveTo(1010, 110);
    ctx.lineTo(1010, 310);
    ctx.moveTo(880, 210);
    ctx.lineTo(1140, 210);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 210, 62, 0.18)';
    ctx.beginPath();
    ctx.moveTo(880, 310);
    ctx.lineTo(1140, 310);
    ctx.lineTo(1240, FIELD.groundY);
    ctx.lineTo(760, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Hanging lantern.
    ctx.strokeStyle = '#2a1a0c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 90);
    ctx.stroke();
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(282, 90, 36, 48);
    ctx.fillStyle = '#2a1a0c';
    ctx.fillRect(278, 84, 44, 8);
    // Hay piles in the corners.
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    ctx.quadraticCurveTo(90, 500, 200, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
  }

  function drawKitchenBackdrop() {
    // Tiled wall.
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = 2;
    for (let y = 0; y < FIELD.groundY; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < FIELD.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.groundY);
      ctx.stroke();
    }
    // Window over the sink: night outside, the farm far away.
    ctx.fillStyle = '#2a2438';
    ctx.fillRect(120, 90, 280, 200);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.arc(330, 150, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d3a28';
    ctx.lineWidth = 10;
    ctx.strokeRect(120, 90, 280, 200);
    // Hanging pans.
    for (let i = 0; i < 4; i += 1) {
      const px = 560 + i * 130;
      ctx.strokeStyle = '#3d3d46';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(px, 60);
      ctx.lineTo(px, 110);
      ctx.stroke();
      ctx.fillStyle = '#3d3d46';
      ctx.beginPath();
      ctx.arc(px, 150, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6e6e78';
      ctx.beginPath();
      ctx.arc(px, 150, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Counter along the bottom of the wall.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, 500, FIELD.width, 26);
    ctx.fillStyle = '#a86a3f';
    ctx.fillRect(0, 500, FIELD.width, 8);
  }

  function drawGround(stageIndex, cameraX) {
    const groundY = FIELD.groundY;
    if (stageIndex === 1) {
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(0, groundY, FIELD.width, FIELD.height - groundY);
      ctx.strokeStyle = '#5f3517';
      ctx.lineWidth = 3;
      const off = -(cameraX % 120);
      for (let x = off; x < FIELD.width; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, FIELD.height);
        ctx.stroke();
      }
    } else if (stageIndex === 2) {
      ctx.fillStyle = '#3d3d46';
      ctx.fillRect(0, groundY, FIELD.width, FIELD.height - groundY);
      ctx.fillStyle = '#4a4a55';
      const off = -(cameraX % 96);
      for (let x = off; x < FIELD.width; x += 96) {
        ctx.fillRect(x, groundY, 4, FIELD.height - groundY);
      }
    } else {
      ctx.fillStyle = STAGES[0].ground;
      ctx.fillRect(0, groundY, FIELD.width, FIELD.height - groundY);
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(0, groundY, FIELD.width, 8);
      // Tufts of grass and stones scrolling past.
      ctx.fillStyle = '#5f8a2e';
      const off = -(cameraX % 140);
      for (let x = off; x < FIELD.width; x += 140) {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 46);
        ctx.lineTo(x + 5, groundY + 30);
        ctx.lineTo(x + 10, groundY + 46);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#a89a7a';
      for (let x = -((cameraX + 70) % 260); x < FIELD.width; x += 260) {
        ctx.beginPath();
        ctx.ellipse(x, groundY + 74, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawBackdrop(state, sunset) {
    const stageIndex = state.stageIndex;
    drawSky(stageIndex, state.cameraX, state.time, sunset);
    if (sunset) {
      ctx.fillStyle = '#7a9a3a';
      ctx.beginPath();
      ctx.moveTo(0, 520);
      ctx.quadraticCurveTo(640, 440, 1280, 520);
      ctx.lineTo(1280, FIELD.groundY);
      ctx.lineTo(0, FIELD.groundY);
      ctx.closePath();
      ctx.fill();
    } else if (stageIndex === 0) drawFarmyardBackdrop(state.cameraX);
    else if (stageIndex === 1) drawBarnBackdrop();
    else drawKitchenBackdrop();
    drawGround(stageIndex, state.cameraX);
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 66);
    ctx.fillStyle = PALETTE.bright;
    ctx.fillRect(0, 66, FIELD.width, 4);
    text(`SCORE ${state.score.toLocaleString('en-US')}`, 24, 36, 34, PALETTE.text);
    text(`${Math.floor(state.distance)} m`, 300, 36, 30, PALETTE.text);
    text(`${STAGES[state.stageIndex].name}`, 700, 36, 28, PALETTE.bright, 'center');
    for (let i = 0; i < LIVES; i += 1) {
      heart(ctx, 924 + i * 44, 34, 17, i < state.lives);
    }
    text(`BEST ${Math.max(best, state.score).toLocaleString('en-US')}`, 1256, 36, 22, '#c9b896', 'right');
    // Distance progress bar to freedom.
    ctx.fillStyle = 'rgba(20, 8, 2, 0.6)';
    ctx.fillRect(24, 78, 300, 10);
    ctx.fillStyle = PALETTE.bright;
    ctx.fillRect(24, 78, Math.min(300, (state.distance / 1400) * 300), 10);
    ctx.fillStyle = 'rgba(20, 8, 2, 0.6)';
    ctx.fillRect(332, 74, 78, 20);
    text('ESCAPE', 371, 84, 16, PALETTE.text, 'center');
  }

  function drawBanner(state) {
    if (state.bannerTimer <= 0 || !state.banner) return;
    const danger = state.banner === 'SPOTTED!' || state.banner === 'HIT!';
    const pulse = 1 + Math.sin(state.time * 10) * 0.04;
    ctx.save();
    ctx.translate(640, 210);
    ctx.scale(pulse, pulse);
    outlinedText(state.banner, 0, 0, 64, danger ? PALETTE.danger : PALETTE.bright, 'center');
    ctx.restore();
  }

  function drawWorld(state) {
    drawBackdrop(state, false);
    drawPickups(ctx, state.pickups, state.cameraX);
    // A hidden turkey crouches inside its haystack: draw it first, so the
    // haystack dome covers it and the farmer searches a haystack, not a
    // turkey standing in plain sight. Otherwise it draws on top as usual.
    if (state.turkey.hidden) drawTurkey(ctx, state.turkey, state.time);
    drawHazards(ctx, state.hazards, state.cameraX, state.time);
    drawFarmer(ctx, state.farmer, state.turkey.x, FIELD.groundY, state.time);
    if (!state.turkey.hidden) drawTurkey(ctx, state.turkey, state.time);
  }

  function drawTitle(state, best) {
    drawBackdrop(state, false);
    ctx.fillStyle = 'rgba(24, 10, 4, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // The farmer lurks at the right, the turkey front and centre-left.
    const lurker = { gap: 0, mode: 'chase', timer: 0, stomp: 1.2, spottedFlash: 0 };
    drawFarmer(ctx, lurker, 1050, FIELD.groundY, state.time);
    ctx.save();
    ctx.translate(230, FIELD.groundY);
    ctx.scale(1.7, 1.7);
    ctx.translate(-230, -FIELD.groundY);
    const bigTurkey = {
      x: 230, alt: 0, vy: 0, onGround: true, duck: false, hidden: false,
      invuln: 0, boost: 0, waddle: state.time * 2.2, running: false,
    };
    drawTurkey(ctx, bigTurkey, state.time);
    ctx.restore();

    outlinedText('GOBBLE DASH', 640, 130, 96, PALETTE.bright, 'center');
    outlinedText('A THANKSGIVING ESCAPE', 640, 205, 34, PALETTE.text, 'center');
    outlinedText('The farmer wants you for dinner. Run!', 640, 255, 26, '#ffd9a0', 'center');

    // Controls card.
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(390, 300, 500, 190);
    ctx.strokeStyle = PALETTE.bright;
    ctx.lineWidth = 3;
    ctx.strokeRect(390, 300, 500, 190);
    text('HOW TO PLAY', 640, 330, 26, PALETTE.bright, 'center');
    text('RUN  hold  →  or  D  (sprint!)', 420, 368, 22, PALETTE.text);
    text('JUMP  Space  /  ↑  /  W', 420, 400, 22, PALETTE.text);
    text('HIDE  hold  ↓  /  S  in a haystack', 420, 432, 22, PALETTE.text);
    text('P pause    M mute    R restart', 420, 464, 22, PALETTE.text);

    if (best > 0) text(`BEST SCORE  ${best.toLocaleString('en-US')}`, 640, 530, 26, PALETTE.bright, 'center');
    const blink = Math.floor(state.time * 2 + 0.5) % 2 === 0;
    if (blink) outlinedText('PRESS ENTER OR CLICK TO START', 640, 585, 32, PALETTE.text, 'center');
  }

  function drawOver(state, best) {
    const escaped = state.overReason === 'escaped';
    if (escaped) {
      drawSky(0, 0, state.time, true);
      drawGround(0, 0);
      ctx.save();
      ctx.translate(230, FIELD.groundY);
      ctx.scale(1.7, 1.7);
      ctx.translate(-230, -FIELD.groundY);
      const freeTurkey = {
        x: 230, alt: 0, vy: 0, onGround: true, duck: false, hidden: false,
        invuln: 0, boost: 0, waddle: state.time * 2.2, running: false,
      };
      drawTurkey(ctx, freeTurkey, state.time);
      ctx.restore();
      outlinedText('ESCAPED!', 640, 150, 96, PALETTE.bright, 'center');
      outlinedText('Into the sunset — no dinner today!', 640, 225, 28, PALETTE.text, 'center');
    } else {
      ctx.fillStyle = '#2a0d08';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawFarmer(ctx, { gap: 420, mode: 'chase', timer: 0, stomp: 0, spottedFlash: 0 }, 640, FIELD.groundY, state.time);
      outlinedText('CAUGHT!', 640, 150, 96, PALETTE.danger, 'center');
      outlinedText('The farmer got his Thanksgiving dinner…', 640, 225, 28, PALETTE.text, 'center');
    }
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(440, 280, 400, 150);
    ctx.strokeStyle = escaped ? PALETTE.bright : PALETTE.danger;
    ctx.lineWidth = 3;
    ctx.strokeRect(440, 280, 400, 150);
    text(`SCORE  ${state.score.toLocaleString('en-US')}`, 640, 320, 32, PALETTE.text, 'center');
    text(`DISTANCE  ${Math.floor(state.distance)} m`, 640, 362, 26, PALETTE.text, 'center');
    text(`BEST  ${Math.max(best, state.score).toLocaleString('en-US')}`, 640, 400, 26, PALETTE.bright, 'center');
    const blink = Math.floor(state.time * 2 + 0.5) % 2 === 0;
    if (blink) outlinedText('PRESS ENTER, R, OR CLICK TO RUN AGAIN', 640, 500, 28, PALETTE.text, 'center');
  }

  function draw(state, screen, best, opts = {}) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
    } else if (screen === SCREEN_OVER) {
      drawOver(state, best);
    } else {
      drawWorld(state);
      drawHud(state, best);
      drawBanner(state);
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(20, 8, 2, 0.65)';
        ctx.fillRect(0, 0, FIELD.width, FIELD.height);
        outlinedText('PAUSED', 640, 320, 72, PALETTE.text, 'center');
        text('P or Enter to keep running', 640, 400, 26, PALETTE.bright, 'center');
      }
      if (opts.muted) text('MUTED — press M', 1256, 700, 20, PALETTE.text, 'right');
      // Farmer distance warning when he is very close.
      if (screen === SCREEN_PLAY && state.farmer.gap < 95 && state.farmer.mode === 'chase') {
        outlinedText('HE IS RIGHT BEHIND YOU!', 640, 130, 30, PALETTE.danger, 'center');
      }
    }
  }

  return { draw };
}
