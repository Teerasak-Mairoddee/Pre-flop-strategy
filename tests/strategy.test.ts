import { describe, expect, it } from 'vitest';
import { ALL_HANDS } from '../src/strategy/hands';
import { POSITIONS, type Position } from '../src/strategy/positions';
import { hands, RFI, vs3Bet, vsOpen, type Response } from '../src/strategy/ranges';
import { actionFor, recommend, spotProblem, villainOptions, type Spot } from '../src/strategy/engine';

const openers = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const;
const allResponses: [string, Response][] = [
  ...POSITIONS.flatMap((h) => villainOptions(h, 'vs-open').map((v) => [`${h} vs ${v} open`, vsOpen(h, v)] as [string, Response])),
  ...openers.map((h) => [`${h} vs 3-bet`, vs3Bet(h)] as [string, Response]),
];

describe('range data', () => {
  it('opening ranges widen from UTG to the button', () => {
    const order = ['UTG', 'HJ', 'CO', 'BTN'] as const;
    for (let i = 1; i < order.length; i++) {
      const tighter = hands(RFI[order[i - 1]]);
      const wider = hands(RFI[order[i]]);
      for (const h of tighter) expect(wider.has(h), `${h} opens ${order[i - 1]} but not ${order[i]}`).toBe(true);
      expect(wider.size).toBeGreaterThan(tighter.size);
    }
  });

  it.each(allResponses)('%s: raise and call ranges do not overlap', (_, r) => {
    const raise = hands(r.raise);
    for (const h of hands(r.call)) expect(raise.has(h), h).toBe(false);
  });

  it.each(allResponses)('%s: premium pairs and AK always continue by re-raising', (_, r) => {
    for (const h of ['AA', 'KK', 'QQ', 'AKs']) expect(hands(r.raise).has(h), h).toBe(true);
  });

  it('every RFI range includes every pair and suited ace', () => {
    for (const p of openers) for (const h of ['22', 'A2s', 'AKo']) expect(hands(RFI[p]).has(h)).toBe(true);
  });
});

describe('engine', () => {
  const spot = (hero: Position, situation: Spot['situation'], villain: Position | null = null): Spot => ({ hero, situation, villain });

  it('opens and folds from early position', () => {
    expect(actionFor('AA', spot('UTG', 'unopened'))).toBe('raise');
    expect(actionFor('72o', spot('UTG', 'unopened'))).toBe('fold');
    expect(actionFor('K9o', spot('UTG', 'unopened'))).toBe('fold');
    expect(actionFor('K9o', spot('BTN', 'unopened'))).toBe('raise');
  });

  it('gives a walk to the big blind', () => {
    expect(recommend(spot('BB', 'unopened'), 'AA').status).toBe('walk');
  });

  it('rejects impossible spots', () => {
    expect(spotProblem(spot('UTG', 'vs-open', 'HJ'))).not.toBeNull();
    expect(spotProblem(spot('CO', 'vs-open', 'BTN'))).not.toBeNull();
    expect(spotProblem(spot('BB', 'vs-3bet', 'SB'))).not.toBeNull();
    expect(spotProblem(spot('BTN', 'vs-3bet', 'CO'))).not.toBeNull();
    expect(recommend(spot('UTG', 'vs-open'), 'AA').status).toBe('invalid');
  });

  it('asks for the villain then the hand', () => {
    expect(recommend(spot('BTN', 'vs-open'), 'AA').status).toBe('need-villain');
    expect(recommend(spot('BTN', 'vs-open', 'CO'), null).status).toBe('need-hand');
  });

  it('responds to opens', () => {
    expect(actionFor('AA', spot('BTN', 'vs-open', 'UTG'))).toBe('3bet');
    expect(actionFor('88', spot('BTN', 'vs-open', 'UTG'))).toBe('call');
    expect(actionFor('K7o', spot('BB', 'vs-open', 'UTG'))).toBe('fold');
    expect(actionFor('K9o', spot('BB', 'vs-open', 'BTN'))).toBe('call');
    expect(actionFor('88', spot('SB', 'vs-open', 'UTG'))).toBe('fold');
  });

  it('responds to 3-bets', () => {
    const r = recommend(spot('CO', 'vs-3bet', 'BTN'), 'KK');
    expect(r.status === 'advice' && r.action).toBe('4bet');
    expect(actionFor('TT', spot('UTG', 'vs-3bet', 'BB'))).toBe('call');
    expect(actionFor('76s', spot('UTG', 'vs-3bet', 'BB'))).toBe('fold');
  });

  it('has an answer for every hand in every valid spot', () => {
    for (const hero of POSITIONS)
      for (const situation of ['unopened', 'vs-open', 'vs-3bet'] as const) {
        const villains = situation === 'unopened' ? [null] : villainOptions(hero, situation);
        for (const villain of villains) {
          const s = spot(hero, situation, villain);
          if (hero === 'BB' && situation === 'unopened') continue;
          for (const h of ALL_HANDS) expect(recommend(s, h).status, `${hero} ${situation} ${villain} ${h}`).toBe('advice');
        }
      }
  });
});
