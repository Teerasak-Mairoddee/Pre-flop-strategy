import { RANGES_VERSION } from '../strategy/ranges';

export function About() {
  return (
    <details className="about">
      <summary>About this advice</summary>
      <p>
        Ranges are a <strong>baseline preflop strategy</strong> for 6-max no-limit hold'em cash games with 100 big blinds, no ante and
        standard open sizes. Each hand gets one action; real solver strategies mix some hands between actions, so treat borderline hands as
        close decisions.
      </p>
      <p>
        Adjust for the table: tighten against strong players or when someone behind is very aggressive, and widen against players who fold
        too often. Preflop strategy improves your decisions; it cannot guarantee a winning hand.
      </p>
      <p>Range data v{RANGES_VERSION} was written for this app and is not copied from any third-party chart or solver.</p>
      <p className="muted">Runs entirely in your browser. Nothing you enter is stored or sent anywhere.</p>
    </details>
  );
}
