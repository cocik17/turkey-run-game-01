// Keyboard + mouse input. The game polls once per frame: poll() returns the
// held controls plus any one-shot actions queued since the last poll, so a
// quick Space tap is never lost between fixed steps.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

/** Keys that scroll the page if we do not swallow them. */
const SWALLOW = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let jumpQueued = false;
  let clickX = -1;
  let clickY = -1;
  let clicked = false;

  function press(code) {
    if (code === 'Space' || code === 'Enter') queued |= ACTION_CONFIRM;
    if (code === 'KeyP' || code === 'Escape') queued |= ACTION_PAUSE;
    if (code === 'KeyR') queued |= ACTION_RESTART;
    if (code === 'KeyM') queued |= ACTION_MUTE;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') jumpQueued = true;
  }

  window.addEventListener('keydown', (event) => {
    if (SWALLOW.has(event.code)) event.preventDefault();
    if (!event.repeat) {
      held.add(event.code);
      press(event.code);
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clickX = ((event.clientX - rect.left) / rect.width) * 1280;
    clickY = ((event.clientY - rect.top) / rect.height) * 720;
    clicked = true;
    queued |= ACTION_CONFIRM;
  });

  /** Read and clear everything queued since the last poll. */
  function poll() {
    const controls = {
      jump: jumpQueued,
      duck: held.has('ArrowDown') || held.has('KeyS'),
      sprint: held.has('ArrowRight') || held.has('KeyD'),
      slow: held.has('ArrowLeft') || held.has('KeyA'),
      actions: queued,
    };
    queued = 0;
    jumpQueued = false;
    return controls;
  }

  /** The last click in logical 1280x720 coordinates, or null. */
  function takeClick() {
    if (!clicked) return null;
    clicked = false;
    return { x: clickX, y: clickY };
  }

  return { poll, takeClick };
}
