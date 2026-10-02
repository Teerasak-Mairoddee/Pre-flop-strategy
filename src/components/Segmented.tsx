type Option<T> = { value: T; label: string; title?: string };

type Props<T> = {
  label: string;
  value: T | null;
  options: Option<T>[];
  onChange: (v: T) => void;
  hint?: string;
  testId?: string;
};

export function Segmented<T extends string>({ label, value, options, onChange, hint, testId }: Props<T>) {
  return (
    <fieldset className="setting">
      <legend>{label}</legend>
      <div className="segmented" role="radiogroup" aria-label={label} data-testid={testId}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            title={o.title}
            className={o.value === value ? 'seg seg-on' : 'seg'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <p className="setting-hint">{hint}</p> : null}
    </fieldset>
  );
}
