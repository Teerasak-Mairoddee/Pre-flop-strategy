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

/** One-line explanation of each seat, shown under the seat picker. */
export const POSITION_ABOUT: Record<Position, string> = {
  UTG: 'First to act before the flop, with five players still to act behind you. Play your tightest range here.',
  HJ: 'Second to act. Four players are left behind you, so you can open a few more hands than UTG.',
  CO: 'The seat right before the button. Only the button and the blinds are left, so your range widens a lot.',
  BTN: 'The dealer seat. You act last on every street after the flop, which makes it the best seat and the widest opening range.',
  SB: 'You have already posted half a big blind, but you act first on every street after the flop, which makes it the hardest seat to play.',
  BB: 'You have already posted a full big blind and act last before the flop, so you get a good price to defend with many hands.',
};

/** Table sizes the ranges cover. Fewer players removes seats from the front (UTG first). */
export const PLAYER_OPTIONS = [3, 4, 5, 6] as const;
export type Players = (typeof PLAYER_OPTIONS)[number];

/**
 * Seats that exist with `players` at the table. Short-handed tables drop the earliest seats,
 * so each remaining seat has the same players behind it as at 6-max and keeps its 6-max range.
 */
export const seatsFor = (players: Players): Position[] => POSITIONS.slice(POSITIONS.length - players);

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
