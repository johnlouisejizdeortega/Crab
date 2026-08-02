import { Star } from './icons';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  count?: number;
}

export default function Stars({ value, onChange, size = 16, count }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star`}
        >
          <Star
            size={size}
            filled={n <= Math.round(value)}
            className={n <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
      {count != null && <span className="ml-1 text-xs text-slate-400">({count})</span>}
    </span>
  );
}
