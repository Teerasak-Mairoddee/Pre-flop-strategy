import { GRID, type HandCode } from '../strategy/hands';
import { actionFor, continuePercent, type Spot } from '../strategy/engine';

type Props = {
  spot: Spot;
  selected: HandCode | null;
  onPick: (code: HandCode) => void;
};

const LEGEND = [
  { tone: 'raise', label: 'Raise' },
  { tone: 'call', label: 'Call' },
  { tone: 'fold', label: 'Fold' },
];

/** 13x13 starting-hand chart for the current spot; tapping a cell selects that hand. */
export function RangeGrid({ spot, selected, onPick }: Props) {
  const playable = actionFor('AA', spot) !== null;
  const pct = continuePercent(spot);
  return (
    <details className="range" open>
      <summary>
        Range chart{playable && pct !== null ? <span className="muted"> · plays {Math.round(pct)}% of hands</span> : null}
      </summary>
      {playable ? (
        <>
          <div className="grid" role="grid" aria-label="Starting hand chart" data-testid="range-grid">
            {GRID.map((row, i) => (
              <div className="grid-row" role="row" key={i}>
                {row.map((code) => {
                  const a = actionFor(code, spot);
                  const tone = a === '3bet' || a === '4bet' ? 'raise' : a;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="gridcell"
                      className={`cell cell-${tone}${code === selected ? ' cell-selected' : ''}`}
                      aria-label={`${code}: ${a}`}
                      aria-selected={code === selected}
                      onClick={() => onPick(code)}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="legend">
            {LEGEND.map((l) => (
              <span key={l.tone} className="legend-item">
                <span className={`swatch cell-${l.tone}`} aria-hidden="true" />
                {l.label}
              </span>
            ))}
            <span className="legend-item muted">Suited above the diagonal, offsuit below</span>
          </div>
        </>
      ) : (
        <p className="muted">Pick a valid spot to see its chart.</p>
      )}
    </details>
  );
}
