import { parseRange, type HandCode } from './hands';
import type { Position } from './positions';

/**
 * Baseline ranges for 6-max no-limit hold'em cash games, 100 big blinds deep, no ante.
 * They are a simplified, single-action-per-hand approximation of common modern ranges
 * (no mixed frequencies). Written for this app; not copied from any solver output or chart.
 */
export const RANGES_VERSION = 1;

/** Raise first in (everyone before you folded). The BB never opens. */
export const RFI: Record<Exclude<Position, 'BB'>, string> = {
  UTG: '22+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, AJo+, KQo',
  HJ: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, ATo+, KJo+, QJo',
  CO: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 64s+, 54s, A8o+, KTo+, QTo+, JTo',
  BTN: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T8o+, 98o',
  SB: '22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A4o+, K9o+, Q9o+, J9o+, T9o',
};

/** A response range: hands that re-raise, hands that call; everything else folds. */
export type Response = { raise: string; call: string };

const IP_VS_EARLY: Response = {
  raise: 'QQ+, AKs, AKo, AQs, A5s, A4s',
  call: 'JJ-66, AJs, ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo',
};
const IP_VS_LATE: Response = {
  raise: 'TT+, AJs+, KQs, AQo+, A5s-A3s',
  call: '99-22, ATs-A6s, A2s, KJs-K9s, QJs-Q9s, J9s+, T9s, 98s, 87s, 76s, AJo, KQo',
};
const SB_VS_EARLY: Response = {
  raise: 'TT+, AQs+, AKo, A5s, KQs',
  call: '',
};
const SB_VS_LATE: Response = {
  raise: '88+, ATs+, KTs+, QTs+, JTs, AJo+, KQo, A5s-A2s, T9s, 98s',
  call: '',
};
const BB_VS_EARLY: Response = {
  raise: 'QQ+, AKs, AKo, A5s',
  call: 'JJ-22, AQs-A6s, A4s-A2s, K9s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, AQo-ATo, KQo, KJo, QJo',
};
const BB_VS_LATE: Response = {
  raise: 'TT+, AJs+, KQs, AQo+, A5s-A3s',
  call: '99-22, ATs-A6s, A2s, KJs-K2s, Q6s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, AJo-A2o, K9o+, Q9o+, J9o+, T9o, 98o',
};
const BB_VS_SB: Response = {
  raise: 'TT+, ATs+, KJs+, AJo+, A5s-A2s, KQo',
  call: '99-22, A9s-A6s, KTs-K2s, Q2s+, J5s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, ATo-A2o, KJo-K7o, Q8o+, J8o+, T8o+, 97o+, 87o',
};

const early = (p: Position) => p === 'UTG' || p === 'HJ';

/** Facing a single open raise from `opener` (who acted before `hero`). */
export function vsOpen(hero: Position, opener: Position): Response {
  if (hero === 'BB') return opener === 'SB' ? BB_VS_SB : early(opener) ? BB_VS_EARLY : BB_VS_LATE;
  if (hero === 'SB') return early(opener) ? SB_VS_EARLY : SB_VS_LATE;
  return early(opener) ? IP_VS_EARLY : IP_VS_LATE;
}

const VS_3BET_EARLY: Response = {
  raise: 'QQ+, AKs, AKo, A5s',
  call: 'JJ-99, AQs, AJs, KQs, AQo',
};
const VS_3BET_LATE: Response = {
  raise: 'QQ+, AK, A5s-A4s',
  call: 'JJ-55, AQs-ATs, KQs-KTs, QJs, JTs, T9s, 98s, AQo, AJo, KQo',
};

/** You opened from `hero` and someone behind you re-raised. */
export function vs3Bet(hero: Exclude<Position, 'BB'>): Response {
  return early(hero) ? VS_3BET_EARLY : VS_3BET_LATE;
}

const cache = new Map<string, Set<HandCode>>();
/** Parsed, memoised range. */
export function hands(text: string): Set<HandCode> {
  let s = cache.get(text);
  if (!s) {
    s = parseRange(text);
    cache.set(text, s);
  }
  return s;
}
