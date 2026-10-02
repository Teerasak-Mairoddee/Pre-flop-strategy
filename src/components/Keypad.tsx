import type { Rank } from '../strategy/hands';

type Props = {
  label: string;
  onPick: (rank: Rank) => void;
  disabled?: boolean;
};

// Three columns from the deuce up, with the ace as a full-width key underneath.
const LAYOUT: readonly Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function Keypad({ label, onPick, disabled }: Props) {
  return (
    <section className="keypad" aria-label={label}>
      <p className="keypad-label" aria-live="polite">
        {label}
      </p>
      <div className="keypad-grid">
        {LAYOUT.map((r) => (
          <button
            key={r}
            type="button"
            className={`key${r === 'A' ? ' key-wide' : ''}`}
            onClick={() => onPick(r)}
            disabled={disabled}
            aria-label={r === 'A' ? 'Ace' : r === 'K' ? 'King' : r === 'Q' ? 'Queen' : r === 'J' ? 'Jack' : undefined}
            data-rank={r}
          >
            {r === 'T' ? '10' : r}
          </button>
        ))}
      </div>
    </section>
  );
}
