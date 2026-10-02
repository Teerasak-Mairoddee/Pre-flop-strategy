import { useCallback, useEffect, useState } from 'react';
import { About } from './components/About';
import { CardChip } from './components/CardChip';
import { Keypad } from './components/Keypad';
import { RangeGrid } from './components/RangeGrid';
import { ResultPanel } from './components/ResultPanel';
import { Segmented } from './components/Segmented';
import { recommend, villainOptions, type Situation, type Spot } from './strategy/engine';
import { handCode, isRank, type HandCode, type Rank } from './strategy/hands';
import { POSITIONS, POSITION_ABOUT, POSITION_NAMES, type Position } from './strategy/positions';

const SITUATIONS: { value: Situation; label: string }[] = [
  { value: 'unopened', label: 'Folded to me' },
  { value: 'vs-open', label: 'Facing a raise' },
  { value: 'vs-3bet', label: 'Facing a 3-bet' },
];

const KEY_TO_RANK: Record<string, Rank> = { '1': 'A', '0': 'T' };

/** Keeps the villain valid for the hero and situation; picks the only option automatically. */
function fixVillain(hero: Position, situation: Situation, villain: Position | null): Position | null {
  const opts = villainOptions(hero, situation);
  if (villain && opts.includes(villain)) return villain;
  return opts.length === 1 ? opts[0] : null;
}

export default function App() {
  const [hero, setHero] = useState<Position>('BTN');
  const [situation, setSituation] = useState<Situation>('unopened');
  const [villain, setVillain] = useState<Position | null>(null);
  const [cards, setCards] = useState<Rank[]>([]);
  const [suited, setSuited] = useState(false);

  const spot: Spot = { hero, situation, villain };
  const code: HandCode | null = cards.length === 2 ? handCode(cards[0], cards[1], suited) : null;
  const advice = recommend(spot, code);
  const isPair = cards.length === 2 && cards[0] === cards[1];

  const changeHero = (p: Position) => {
    setHero(p);
    let s = situation;
    // Situations that cannot happen from this seat fall back to the first one that can.
    if ((s === 'vs-open' && p === 'UTG') || (s === 'vs-3bet' && p === 'BB')) s = 'unopened';
    setSituation(s);
    setVillain(fixVillain(p, s, villain));
  };
  const changeSituation = (s: Situation) => {
    setSituation(s);
    setVillain(fixVillain(hero, s, villain));
  };

  const pick = useCallback((r: Rank) => setCards((c) => (c.length >= 2 ? [r] : [...c, r])), []);
  const undo = useCallback(() => setCards((c) => c.slice(0, -1)), []);
  const newHand = useCallback(() => {
    setCards([]);
    setSuited(false);
  }, []);
  const pickCode = (c: HandCode) => {
    setCards([c[0] as Rank, c[1] as Rank]);
    setSuited(c[2] === 's');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const rank = KEY_TO_RANK[k] ?? (isRank(k) ? k : null);
      if (rank) {
        pick(rank);
        e.preventDefault();
      } else if (k === 'S') {
        setSuited((s) => !s);
      } else if (e.key === 'Backspace') {
        undo();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        newHand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pick, undo, newHand]);

  const vOpts = villainOptions(hero, situation);
  const situationOptions = SITUATIONS.filter(
    (s) => !((s.value === 'vs-open' && hero === 'UTG') || (s.value === 'vs-3bet' && hero === 'BB')),
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1>Pre-flop Strategy</h1>
        <span className="settings-summary muted" data-testid="game-summary">
          6-max cash · 100 BB
        </span>
      </header>

      <main className="table">
        <div className="settings">
          <Segmented
            label="My seat"
            value={hero}
            options={POSITIONS.map((p) => ({ value: p, label: p, title: POSITION_NAMES[p] }))}
            onChange={changeHero}
            testId="seat"
          />
          <details className="seat-about" data-testid="seat-about">
            <summary>
              About this seat: <strong>{POSITION_NAMES[hero]}</strong>
            </summary>
            <p>{POSITION_ABOUT[hero]}</p>
          </details>
          <Segmented label="Action before me" value={situation} options={situationOptions} onChange={changeSituation} testId="situation" />
          {vOpts.length ? (
            <Segmented
              label={situation === 'vs-open' ? 'Who raised?' : 'Who 3-bet me?'}
              value={villain}
              options={vOpts.map((p) => ({ value: p, label: p, title: POSITION_NAMES[p] }))}
              onChange={setVillain}
              testId="villain"
            />
          ) : null}
        </div>

        <div className="row">
          <span className="row-label">Hand</span>
          <div className="cards" data-testid="hand">
            <CardChip rank={cards[0] ?? null} suited={suited && !isPair} label={cards[0] ? `First card ${cards[0]}` : 'First card, not selected'} />
            <CardChip rank={cards[1] ?? null} suited={suited && !isPair} label={cards[1] ? `Second card ${cards[1]}` : 'Second card, not selected'} />
            <div className="segmented suit-toggle" role="radiogroup" aria-label="Suits">
              <button
                type="button"
                role="radio"
                aria-checked={!suited || isPair}
                className={!suited || isPair ? 'seg seg-on' : 'seg'}
                onClick={() => setSuited(false)}
              >
                Offsuit
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={suited && !isPair}
                className={suited && !isPair ? 'seg seg-on' : 'seg'}
                onClick={() => setSuited(true)}
                disabled={isPair}
              >
                Suited
              </button>
            </div>
          </div>
        </div>

        <ResultPanel advice={advice} />

        <Keypad label={cards.length >= 2 ? 'Tap a card to start a new hand' : cards.length ? 'Second card' : 'First card'} onPick={pick} />

        <RangeGrid spot={spot} selected={code} onPick={pickCode} />

        <About />
      </main>

      <nav className="bottombar" aria-label="Hand controls">
        <button type="button" className="btn btn-bar" onClick={undo} disabled={cards.length === 0}>
          Undo
        </button>
        <button type="button" className="btn btn-bar btn-primary" onClick={newHand}>
          New hand
        </button>
      </nav>
    </div>
  );
}
