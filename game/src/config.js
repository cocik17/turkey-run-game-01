// Gobble Dash — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Pixels of scroll per metre of escape distance. */
export const PX_PER_METRE = 20;

/** How far the turkey must run to burst out into the sunset. */
export const ESCAPE_AT = 1400;

export const GRAVITY = 2100;
export const JUMP_VELOCITY = 1150;

export const TURKEY = {
  x: 320,
  width: 74,
  height: 96,
  duckHeight: 56,
  runSpeed: 260,
  sprintSpeed: 335,
  slowSpeed: 175,
  boostBonus: 70,
};

export const LIVES = 3;
export const INVULN_TIME = 2.0;
export const BOOST_TIME = 4.0;

export const FARMER = {
  height: 138,
  width: 84,
  /** Gap (px) at which the farmer grabs the turkey. */
  grabGap: 34,
  /** Gap (px) inside which the farmer notices a hiding turkey. */
  noticeGap: 120,
  /** Gap (px) inside which the farmer corners: he lunges faster. */
  cornerGap: 95,
  cornerBonus: 32,
  searchSeconds: 1.6,
  lungeSeconds: 0.6,
  lungeSpeed: 430,
  searchWalkSpeed: 200,
};

/** One stage per stretch of the escape; the farmer gets faster each time. */
export const STAGES = [
  {
    name: 'STAGE 1 — FARMYARD',
    from: 0,
    to: 400,
    farmerSpeed: 218,
    sky: ['#f7b733', '#e8641b'],
    ground: '#8a5a2b',
  },
  {
    name: 'STAGE 2 — THE BARN',
    from: 400,
    to: 900,
    farmerSpeed: 240,
    sky: ['#c96a2e', '#7a3b1e'],
    ground: '#6e4520',
  },
  {
    name: 'STAGE 3 — THE KITCHEN',
    from: 900,
    to: 1400,
    farmerSpeed: 248,
    sky: ['#8a4a3a', '#4a2430'],
    ground: '#5d3a28',
  },
];

export const SCORE = {
  perMetre: 10,
  corn: 50,
  pie: 100,
  escapeBonus: 500,
};

export const PALETTE = {
  page: '#241407',
  panel: 'rgba(24, 10, 4, 0.78)',
  text: '#fff6e0',
  bright: '#ffd23e',
  danger: '#ff5340',
  turkeyBody: '#8a5230',
  turkeyDark: '#5f3517',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#c0392b', '#7a3b1e'],
  wattle: '#e5534b',
  beak: '#f2a93b',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2e5fa3',
  farmerHat: '#e8c96a',
  farmerSkin: '#f0c08a',
  hay: '#e8c96a',
  hayDark: '#c9a13b',
  oven: '#3d3d46',
  ovenGlow: '#ff7a1a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#4a2c14',
  corn: '#f2c94c',
  pie: '#e88a4a',
  feather: '#ffd23e',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
