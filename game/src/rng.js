// Seeded random numbers (mulberry32). A fixed seed gives a fixed run:
// every spawn, wobble and shuffle in the game comes from here, never from
// the platform clock, so replays and screenshots are reproducible.

export function createRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    /** Next float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Next float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** Next integer in [min, max] inclusive. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** True with probability p. */
    chance(p) {
      return this.next() < p;
    },
    /** A random element of a non-empty array. */
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
  };
}
