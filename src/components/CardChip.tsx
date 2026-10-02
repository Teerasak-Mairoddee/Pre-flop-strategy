import type { Rank } from '../strategy/hands';

type Props = {
  rank: Rank | null;
  suited: boolean;
  label: string;
};

export function CardChip({ rank, suited, label }: Props) {
  return (
    <span className={`card${rank ? '' : ' card-empty'}${rank && suited ? ' card-suited' : ''}`} role="img" aria-label={label}>
      {rank === 'T' ? '10' : (rank ?? '?')}
    </span>
  );
}
