import type { Rank } from '../strategy/hands';

type Props = {
  label: string;
  onPick: (rank: Rank) => void;
  disabled?: boolean;
};

// Three columns from ace down, with the deuce as a full-width key underneath.
const LAYOUT: readonly Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

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
            className={`key${r === '2' ? ' key-wide' : ''}`}
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
