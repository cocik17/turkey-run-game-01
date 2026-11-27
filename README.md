# Gobble Dash — A Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/cocik17/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/cocik17/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

An original 2D canvas turkey escape game that runs offline in a desktop
browser from static files. You are a turkey on Thanksgiving morning, and the
farmer has the carving knife out. Run from the farmyard, through the barn,
into the kitchen — dodge the oven, jump the fences, hide in the haystacks —
and burst out into the sunset a free bird.

## The escape

1. **Farmyard** (0–400 m) — the farmer walks after you. Jump the fences,
   grab the corn.
2. **Barn** (400–900 m) — he runs now. Hay bales, rolling pumpkins and
   knives dropping from the loft.
3. **Kitchen** (900–1400 m) — the glowing oven and a swinging carving knife
   stand between you and the window. The farmer corners you here.
4. **Freedom** (1400 m) — out the window and into the sunset. Escaped!

Hide in a haystack (hold ↓) and the farmer stops to search — "?" — then
spots you — "!" — and comes running. A hit costs one of your 3 lives; three
hits and you are Thanksgiving dinner. Corn is +50, pumpkin pie is +100, a
golden feather gives a speed boost and brief invulnerability.

## Controls (keyboard + mouse)

| Input | Does |
| --- | --- |
| ← / → or A / D | Run left / right (hold → to sprint) |
| Space / ↑ / W | Jump |
| ↓ / S (hold) | Duck / hide in a haystack |
| Enter / click | Start, restart |
| P | Pause · R — restart · M — mute |

## Run it

No build step, no network. Serve `game/` with any static server and open
`game/index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

All art is drawn in canvas code and all sound is synthesized with WebAudio
— no assets are loaded from anywhere. The source is split into one-job
files under `game/src/`: config, seeded RNG, input, audio, turkey, farmer,
hazards, pickups, world, renderer, autopilot, screenshot staging.

Screenshots in `screenshots/` are real renders of the game in a browser
(`?shot=title|play|kitchen|end` stages each scene deterministically).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with
`buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ydyxtegc&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
