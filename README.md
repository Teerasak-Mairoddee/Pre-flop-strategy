# Pre-flop Strategy

A fast, mobile-first web app that tells you what to do before the flop in no-limit hold'em. Pick your seat, the action before you and your two cards, and it says **raise, call or fold**, with a sizing and a short reason. A 13×13 range chart shows the whole strategy for the spot, and tapping a cell picks that hand. Everything runs in the browser: no account, server or network request after the page loads.

The design and project setup follow [blackjack-strategy](https://github.com/Teerasak-Mairoddee/blackjack-strategy).

**Live URL (once GitHub Pages is enabled):** https://teerasak-mairoddee.github.io/Pre-flop-strategy/

## Local development

```bash
npm ci
npm run dev          # http://localhost:5173/Pre-flop-strategy/
npm run typecheck
npm test             # Vitest: range parser, range data, engine
npm run test:e2e     # Playwright: main mobile flow (first run: npx playwright install chromium)
npm run build        # outputs dist/
```

## How it works

- `src/strategy/hands.ts` – ranks, the 169 hand classes (`AA`, `AKs`, `72o`), the 13×13 grid, and a parser for range notation (`22+`, `A2s+`, `ATs-A6s`, `AK`).
- `src/strategy/positions.ts` – 6-max seats (UTG, HJ, CO, BTN, SB, BB), acting order and who has position after the flop.
- `src/strategy/ranges.ts` – the range data: opening ranges per seat, responses to an open (3-bet or call), and responses to a 3-bet after you opened (4-bet or call).
- `src/strategy/engine.ts` – pure `recommend(spot, hand): Advice` and `actionFor(hand, spot)`. Impossible spots (UTG facing a raise, BB facing a 3-bet as opener) are rejected with a reason.
- `src/components/` – React UI. Only the table size is saved on the device.

## Spots covered

| Situation | Choices | Actions |
| --- | --- | --- |
| Folded to me | any seat (BB gets a walk) | Raise / Fold |
| Facing a raise | any opener before you | 3-bet / Call / Fold |
| Facing a 3-bet | you opened, anyone behind re-raised | 4-bet / Call / Fold |

The settings button (top right) sets the number of players, 3 to 6. Shorter tables drop the earliest seats (UTG first, then HJ, then CO), and every remaining seat keeps its 6-max strategy because it has the same number of players behind it. The choice is saved on the device.

Responses are grouped by opener: early (UTG, HJ) and late (CO, BTN), plus a separate big blind vs small blind range. The small blind plays 3-bet or fold. Sizings: open 2.5 BB (3 BB from the SB), 3-bet about 3× in position and 4× out of position, 4-bet about 2.2× in position and 2.5× out of position.

## Range data

Ranges assume a 6-max cash game, 100 big blinds, no ante. Each hand has one action, a simplification of real strategies that mix some hands between actions. The data was written for this app as a baseline and is not copied from any solver output or published chart. Opening frequencies: UTG 17%, HJ 22%, CO 28%, BTN 45%, SB 38%.

Checks in `tests/strategy.test.ts`: opening ranges widen from UTG to BTN, raise and call ranges never overlap, premium hands always re-raise, every hand has an answer in every valid spot, plus spot-by-spot examples.

## Deploying

`.github/workflows/deploy.yml` builds, tests and deploys to GitHub Pages on every push to `main`. Turn it on once in the repo under **Settings → Pages → Source: GitHub Actions**.
