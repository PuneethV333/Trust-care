import { StarIcon } from '../ui/icons';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange(star)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
          >
            <StarIcon
              className={`h-7 w-7 ${
                star <= value ? 'text-accent-500' : 'text-neutral-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}