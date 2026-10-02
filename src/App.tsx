import { useCallback, useEffect, useState } from 'react';
import { About } from './components/About';
import { CardChip } from './components/CardChip';
import { Keypad } from './components/Keypad';
import { RangeGrid } from './components/RangeGrid';
import { ResultPanel } from './components/ResultPanel';
import { Segmented } from './components/Segmented';
import { recommend, situationsFor, villainOptions, type Situation, type Spot } from './strategy/engine';
import { handCode, isRank, type HandCode, type Rank } from './strategy/hands';
import { PLAYER_OPTIONS, POSITION_ABOUT, POSITION_NAMES, seatsFor, type Players, type Position } from './strategy/positions';

const SITUATIONS: { value: Situation; label: string }[] = [
  { value: 'unopened', label: 'Folded to me' },
  { value: 'vs-open', label: 'Facing a raise' },
  { value: 'vs-3bet', label: 'Facing a 3-bet' },
];

const KEY_TO_RANK: Record<string, Rank> = { '1': 'A', '0': 'T' };

const STORAGE_KEY = 'preflop.players.v1';

function loadPlayers(): Players {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY));
    return (PLAYER_OPTIONS as readonly number[]).includes(n) ? (n as Players) : 6;
  } catch {
    return 6;
  }
}

/** Keeps the villain valid for the hero and situation; picks the only option automatically. */
function fixVillain(hero: Position, situation: Situation, villain: Position | null, players: Players): Position | null {
  const opts = villainOptions(hero, situation, players);
  if (villain && opts.includes(villain)) return villain;
  return opts.length === 1 ? opts[0] : null;
}

export default function App() {
  const [players, setPlayers] = useState<Players>(loadPlayers);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hero, setHero] = useState<Position>('BTN');
  const [situation, setSituation] = useState<Situation>('unopened');
  const [villain, setVillain] = useState<Position | null>(null);
  const [cards, setCards] = useState<Rank[]>([]);
  const [suited, setSuited] = useState(false);

  const spot: Spot = { hero, situation, villain, players };
  const code: HandCode | null = cards.length === 2 ? handCode(cards[0], cards[1], suited) : null;
  const advice = recommend(spot, code);
  const isPair = cards.length === 2 && cards[0] === cards[1];

  // Moves to a valid seat, situation and villain for the table size; impossible choices fall back to the first valid one.
  const applySpot = (n: Players, p: Position, s: Situation) => {
    const h = seatsFor(n).includes(p) ? p : 'BTN';
    const sit = situationsFor(h, n).includes(s) ? s : 'unopened';
    setHero(h);
    setSituation(sit);
    setVillain(fixVillain(h, sit, villain, n));
  };
  const changeHero = (p: Position) => applySpot(players, p, situation);
  const changeSituation = (s: Situation) => applySpot(players, hero, s);
  const changePlayers = (n: Players) => {
    setPlayers(n);
    applySpot(n, hero, situation);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(players));
    } catch {
      /* storage unavailable: the table size just won't persist */
    }
  }, [players]);

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

  const vOpts = villainOptions(hero, situation, players);
  const situationOptions = SITUATIONS.filter((s) => situationsFor(hero, players).includes(s.value));
  const tableLabel = `${players} players · 100 BB`;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Pre-flop Strategy</h1>
        <div className="topbar-right">
          <span className="settings-summary muted" data-testid="game-summary">
            {tableLabel}
          </span>
          <button
            type="button"
            className={`icon-btn${settingsOpen ? ' icon-btn-on' : ''}`}
            aria-label={settingsOpen ? 'Close table settings' : 'Table settings'}
            aria-expanded={settingsOpen}
            aria-controls="settings-panel"
            onClick={() => setSettingsOpen((o) => !o)}
            data-testid="settings-toggle"
          >
            {settingsOpen ? <CloseIcon /> : <SlidersIcon />}
          </button>
        </div>
      </header>

      {settingsOpen ? (
        <div className="settings" id="settings-panel">
          <Segmented
            label="Players at the table"
            value={String(players)}
            options={PLAYER_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => changePlayers(Number(v) as Players)}
            hint={`Seats in play: ${seatsFor(players).join(', ')}. With fewer players the earliest seats go first, and every other seat keeps the same strategy.`}
            testId="players"
          />
        </div>
      ) : null}

      <main className="table">
        <div className="settings">
          <Segmented
            label="My seat"
            value={hero}
            options={seatsFor(players).map((p) => ({ value: p, label: p, title: POSITION_NAMES[p] }))}
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

function SlidersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
