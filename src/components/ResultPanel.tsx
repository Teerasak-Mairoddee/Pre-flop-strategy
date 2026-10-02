import type { Advice } from '../strategy/engine';

const HEADLINE = {
  raise: 'RAISE',
  '3bet': '3-BET',
  '4bet': '4-BET',
  call: 'CALL',
  fold: 'FOLD',
} as const;

export function ResultPanel({ advice }: { advice: Advice }) {
  if (advice.status !== 'advice') {
    const tone = advice.status === 'walk' ? 'result-walk' : 'result-idle';
    return (
      <section className={`result ${tone}`} aria-live="polite" data-testid="result">
        {advice.status === 'walk' ? <p className="result-move">WALK</p> : null}
        <p className={advice.status === 'walk' ? 'result-reason' : 'result-prompt'}>{advice.reason}</p>
      </section>
    );
  }
  const tone = advice.action === '3bet' || advice.action === '4bet' ? 'raise' : advice.action;
  return (
    <section className={`result result-${tone}`} aria-live="polite" data-testid="result">
      <p className="result-move" data-testid="move">
        {HEADLINE[advice.action]}
      </p>
      <p className="result-hand">{advice.handLabel}</p>
      {advice.sizing ? <p className="result-fallback">{advice.sizing}</p> : null}
      <p className="result-reason">{advice.reason}</p>
    </section>
  );
}
