/** Seats at a 6-max table, in preflop acting order. */
export const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_NAMES: Record<Position, string> = {
  UTG: 'Under the gun',
  HJ: 'Hijack',
  CO: 'Cutoff',
  BTN: 'Button',
  SB: 'Small blind',
  BB: 'Big blind',
};

export const seat = (p: Position): number => POSITIONS.indexOf(p);

/** Positions that act before `p` preflop. */
export const before = (p: Position): Position[] => POSITIONS.slice(0, seat(p));

/** Positions that act after `p` preflop. */
export const after = (p: Position): Position[] => POSITIONS.slice(seat(p) + 1);

export const isBlind = (p: Position): boolean => p === 'SB' || p === 'BB';

/**
 * Whether `hero` has position on `villain` after the flop.
 * The blinds act first postflop; otherwise the later seat is in position.
 */
export function inPosition(hero: Position, villain: Position): boolean {
  if (isBlind(hero) !== isBlind(villain)) return !isBlind(hero);
  return seat(hero) > seat(villain);
}
