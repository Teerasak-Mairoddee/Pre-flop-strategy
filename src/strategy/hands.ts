// Ranks from highest to lowest. 'T' is ten.
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = (typeof RANKS)[number];

/** A starting-hand class such as "AA", "AKs" or "72o" (higher rank first). */
export type HandCode = string;

export const rankIndex = (r: Rank): number => RANKS.indexOf(r);

export function isRank(s: string): s is Rank {
  return (RANKS as readonly string[]).includes(s);
}

/** Builds the hand class for two ranks. Pairs ignore `suited`. */
export function handCode(a: Rank, b: Rank, suited: boolean): HandCode {
  if (a === b) return a + b;
  const [hi, lo] = rankIndex(a) < rankIndex(b) ? [a, b] : [b, a];
  return hi + lo + (suited ? 's' : 'o');
}

/** Number of card combinations in a hand class: 6 for pairs, 4 suited, 12 offsuit. */
export function combos(code: HandCode): number {
  if (code.length === 2) return 6;
  return code[2] === 's' ? 4 : 12;
}

/** All 169 hand classes, in 13x13 grid order (row = first rank, suited above the diagonal). */
export const GRID: HandCode[][] = RANKS.map((r1, i) =>
  RANKS.map((r2, j) => (i === j ? r1 + r2 : i < j ? r1 + r2 + 's' : r2 + r1 + 'o')),
);

export const ALL_HANDS: HandCode[] = GRID.flat();

/** Human label: "AKs" -> "A K suited". */
export function handLabel(code: HandCode): string {
  const r = (c: string) => (c === 'T' ? '10' : c);
  if (code.length === 2) return `Pair of ${r(code[0])}s`;
  return `${r(code[0])} ${r(code[1])} ${code[2] === 's' ? 'suited' : 'offsuit'}`;
}

/**
 * Parses standard range notation into hand classes:
 * "22+", "TT-77", "QQ", "A2s+", "ATs-A6s", "KQo", "AK" (both suited and offsuit), "A5s".
 * Tokens are comma separated. Throws on anything it does not understand.
 */
export function parseRange(text: string): Set<HandCode> {
  const out = new Set<HandCode>();
  for (const raw of text.split(',')) {
    const tok = raw.trim();
    if (!tok) continue;
    for (const code of parseToken(tok)) out.add(code);
  }
  return out;
}

function parseToken(tok: string): HandCode[] {
  const m = /^([AKQJT2-9])([AKQJT2-9])([so]?)(\+?)(?:-([AKQJT2-9])([AKQJT2-9])([so]?))?$/.exec(tok);
  if (!m) throw new Error(`Bad range token: ${tok}`);
  const [, a, b, suit, plus, c, d, suit2] = m as unknown as [string, Rank, Rank, string, string, Rank?, Rank?, string?];
  const suits = (s: string) => (s === 's' ? [true] : s === 'o' ? [false] : [true, false]);

  if (a === b) {
    if (suit) throw new Error(`Pairs take no suit: ${tok}`);
    if (c && (c !== d || suit2)) throw new Error(`Bad pair span: ${tok}`);
    const end = plus ? 0 : c ? rankIndex(c) : rankIndex(a);
    const lo = Math.min(rankIndex(a), end);
    const hi = Math.max(rankIndex(a), end);
    return RANKS.slice(lo, hi + 1).map((r) => r + r);
  }

  if (rankIndex(a) > rankIndex(b)) throw new Error(`High card first: ${tok}`);
  let kickers: Rank[];
  if (plus) {
    kickers = RANKS.slice(rankIndex(a) + 1, rankIndex(b) + 1);
  } else if (c) {
    if (c !== a || !d || (suit2 || '') !== suit) throw new Error(`Bad span: ${tok}`);
    const lo = Math.min(rankIndex(b), rankIndex(d));
    const hi = Math.max(rankIndex(b), rankIndex(d));
    kickers = RANKS.slice(lo, hi + 1);
  } else {
    kickers = [b];
  }
  return kickers.flatMap((k) => suits(suit).map((s) => handCode(a, k, s)));
}

/** Share of all 1326 starting combinations covered by a set of hand classes. */
export function rangePercent(range: Iterable<HandCode>): number {
  let n = 0;
  for (const c of range) n += combos(c);
  return (n / 1326) * 100;
}
