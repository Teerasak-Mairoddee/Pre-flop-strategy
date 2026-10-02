import { describe, expect, it } from 'vitest';
import { ALL_HANDS, GRID, combos, handCode, parseRange, rangePercent } from '../src/strategy/hands';

describe('hand classes', () => {
  it('has 169 classes covering 1326 combinations', () => {
    expect(new Set(ALL_HANDS).size).toBe(169);
    expect(ALL_HANDS.reduce((n, c) => n + combos(c), 0)).toBe(1326);
  });

  it('puts suited hands above the diagonal', () => {
    expect(GRID[0][0]).toBe('AA');
    expect(GRID[0][1]).toBe('AKs');
    expect(GRID[1][0]).toBe('AKo');
    expect(GRID[12][12]).toBe('22');
  });

  it('orders ranks high first and ignores suit for pairs', () => {
    expect(handCode('7', 'A', true)).toBe('A7s');
    expect(handCode('T', 'J', false)).toBe('JTo');
    expect(handCode('9', '9', true)).toBe('99');
  });
});

describe('range notation', () => {
  const list = (s: string) => [...parseRange(s)].sort();

  it('expands pairs', () => {
    expect(parseRange('22+').size).toBe(13);
    expect(list('TT-77')).toEqual(['77', '88', '99', 'TT']);
    expect(list('QQ+')).toEqual(['AA', 'KK', 'QQ']);
  });

  it('expands kicker runs', () => {
    expect(parseRange('A2s+').size).toBe(12);
    expect(list('K9s+')).toEqual(['K9s', 'KJs', 'KQs', 'KTs']);
    expect(list('ATs-A8s')).toEqual(['A8s', 'A9s', 'ATs']);
    expect(list('AK')).toEqual(['AKo', 'AKs']);
  });

  it('computes percentages', () => {
    expect(rangePercent(parseRange('AA'))).toBeCloseTo((6 / 1326) * 100);
  });

  it('rejects malformed tokens', () => {
    expect(() => parseRange('KAs')).toThrow();
    expect(() => parseRange('AAs')).toThrow();
    expect(() => parseRange('ATs-K8s')).toThrow();
    expect(() => parseRange('xyz')).toThrow();
  });
});
