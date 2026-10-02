import { handLabel, rangePercent, type HandCode } from './hands';
import { after, before, inPosition, POSITION_NAMES, type Position } from './positions';
import { hands, RFI, vs3Bet, vsOpen } from './ranges';

export type Situation = 'unopened' | 'vs-open' | 'vs-3bet';

export type Spot = {
  hero: Position;
  situation: Situation;
  /** The opener (vs-open) or the 3-bettor (vs-3bet). Ignored when unopened. */
  villain: Position | null;
};

export type Action = 'raise' | '3bet' | '4bet' | 'call' | 'fold';

export type Advice =
  | { status: 'invalid' | 'need-villain' | 'need-hand'; reason: string }
  | { status: 'walk'; reason: string }
  | {
      status: 'advice';
      action: Action;
      code: HandCode;
      handLabel: string;
      sizing: string | null;
      reason: string;
    };

/** Villains that make sense for this hero and situation. */
export function villainOptions(hero: Position, situation: Situation): Position[] {
  if (situation === 'vs-open') return before(hero);
  if (situation === 'vs-3bet') return hero === 'BB' ? [] : after(hero);
  return [];
}

/** Checks the spot can happen at the table; returns why not, or null. */
export function spotProblem(spot: Spot): string | null {
  if (spot.situation === 'vs-open' && spot.hero === 'UTG') return 'Nobody acts before UTG, so there is no raise to face.';
  if (spot.situation === 'vs-3bet' && spot.hero === 'BB') return 'The big blind never opens, so it cannot face a 3-bet as the opener.';
  if (spot.villain && spot.situation !== 'unopened' && !villainOptions(spot.hero, spot.situation).includes(spot.villain)) {
    return spot.situation === 'vs-open'
      ? `The opener must act before the ${POSITION_NAMES[spot.hero].toLowerCase()}.`
      : `The 3-bettor must act after the ${POSITION_NAMES[spot.hero].toLowerCase()}.`;
  }
  return null;
}

/**
 * The action for one hand class in a spot, or null when the spot is incomplete or impossible.
 * Pure: used both for the headline advice and to colour the range grid.
 */
export function actionFor(code: HandCode, spot: Spot): Action | null {
  if (spotProblem(spot)) return null;
  if (spot.situation === 'unopened') {
    if (spot.hero === 'BB') return null;
    return hands(RFI[spot.hero]).has(code) ? 'raise' : 'fold';
  }
  if (!spot.villain) return null;
  const r = spot.situation === 'vs-open' ? vsOpen(spot.hero, spot.villain) : vs3Bet(spot.hero as Exclude<Position, 'BB'>);
  if (hands(r.raise).has(code)) return spot.situation === 'vs-open' ? '3bet' : '4bet';
  if (hands(r.call).has(code)) return 'call';
  return 'fold';
}

/** Share of hands that continue (anything but fold) in a spot. */
export function continuePercent(spot: Spot, action?: Action): number | null {
  if (spot.situation === 'unopened') {
    return spot.hero === 'BB' ? null : rangePercent(hands(RFI[spot.hero]));
  }
  if (!spot.villain || spotProblem(spot)) return null;
  const r = spot.situation === 'vs-open' ? vsOpen(spot.hero, spot.villain) : vs3Bet(spot.hero as Exclude<Position, 'BB'>);
  if (action === 'call') return rangePercent(hands(r.call));
  if (action === '3bet' || action === '4bet') return rangePercent(hands(r.raise));
  return rangePercent(new Set([...hands(r.raise), ...hands(r.call)]));
}

function sizing(action: Action, spot: Spot): string | null {
  switch (action) {
    case 'raise':
      return spot.hero === 'SB' ? 'Raise to 3 big blinds' : 'Raise to 2.5 big blinds';
    case '3bet':
      return spot.villain && inPosition(spot.hero, spot.villain)
        ? 'Re-raise to about 3× the open'
        : 'Re-raise to about 4× the open (out of position)';
    case '4bet':
      return spot.villain && inPosition(spot.hero, spot.villain)
        ? 'Re-raise to about 2.2× the 3-bet'
        : 'Re-raise to about 2.5× the 3-bet (out of position)';
    default:
      return null;
  }
}

const pct = (n: number | null) => (n === null ? '' : `${Math.round(n)}%`);

export function recommend(spot: Spot, code: HandCode | null): Advice {
  const problem = spotProblem(spot);
  if (problem) return { status: 'invalid', reason: problem };
  if (spot.situation === 'unopened' && spot.hero === 'BB') {
    return { status: 'walk', reason: 'Everyone folded to you in the big blind: you win the blinds without a decision.' };
  }
  if (spot.situation !== 'unopened' && !spot.villain) {
    return { status: 'need-villain', reason: spot.situation === 'vs-open' ? 'Who opened the pot?' : 'Who 3-bet you?' };
  }
  if (!code) return { status: 'need-hand', reason: 'Tap your two cards, or tap a hand in the chart.' };

  const action = actionFor(code, spot)!;
  const hero = POSITION_NAMES[spot.hero].toLowerCase();
  let reason: string;
  if (spot.situation === 'unopened') {
    reason =
      action === 'raise'
        ? `In the ${pct(continuePercent(spot))} of hands to open from the ${hero}.`
        : `Outside the ${pct(continuePercent(spot))} opening range from the ${hero}.`;
  } else {
    const who = POSITION_NAMES[spot.villain!].toLowerCase();
    const notOpened = spot.situation === 'vs-3bet' && !hands(RFI[spot.hero as Exclude<Position, 'BB'>]).has(code);
    if (notOpened) {
      reason = `This hand is not in the ${hero} opening range, so you would normally have folded before the 3-bet.`;
    } else if (action === 'fold') {
      reason = `Not strong enough to continue against the ${who}; you continue with ${pct(continuePercent(spot))} of hands here.`;
    } else if (action === 'call') {
      reason = `Calls against the ${who}: good enough to play, not strong enough to re-raise for value.`;
    } else {
      const value = ['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(code);
      reason = value
        ? `Re-raise for value against the ${who}.`
        : `Re-raise against the ${who}: a strong hand or a well-blocked bluff (${pct(continuePercent(spot, action))} of hands re-raise here).`;
    }
  }
  return { status: 'advice', action, code, handLabel: handLabel(code), sizing: sizing(action, spot), reason };
}
