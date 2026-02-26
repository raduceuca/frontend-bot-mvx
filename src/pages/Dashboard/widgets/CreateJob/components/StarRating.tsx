import { faStar, faStarHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface StarRatingProps {
  rating: number;
  onChange?: (value: number) => void;
  onHoverChange?: (value: number) => void;
  size?: 'sm' | 'md';
  readOnly?: boolean;
}

const sizeClasses = {
  sm: { font: 'text-base', width: 'w-6' },
  md: { font: 'text-2xl', width: 'w-10' }
} satisfies Record<string, { font: string; width: string }>;

const STAR_INDICES = [0, 1, 2, 3, 4] as const;

const getStarState = (rating: number, starIndex: number) => {
  const halfValue = starIndex * 20 + 10;
  const fullValue = (starIndex + 1) * 20;
  const showFull = rating >= fullValue;
  const showHalf = rating >= halfValue && !showFull;
  const filled = showFull || showHalf;

  return { halfValue, fullValue, showFull, showHalf, filled };
};

export const StarRating = ({
  rating,
  onChange,
  onHoverChange,
  size = 'md',
  readOnly = false
}: StarRatingProps) => {
  const { font, width } = sizeClasses[size];

  if (readOnly) {
    return (
      <div className='flex items-center gap-1'>
        {STAR_INDICES.map((starIndex) => {
          const { showHalf, filled } = getStarState(rating, starIndex);

          return (
            <span
              key={starIndex}
              className={`${font} ${filled ? 'text-warning' : 'text-zinc-700'}`}
            >
              <FontAwesomeIcon icon={showHalf ? faStarHalfStroke : faStar} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className='flex items-center gap-0.5'
      onMouseLeave={onHoverChange ? () => onHoverChange(0) : undefined}
    >
      {STAR_INDICES.map((starIndex) => {
        const { halfValue, fullValue, showHalf, filled } = getStarState(
          rating,
          starIndex
        );

        return (
          <div key={starIndex} className={`relative flex ${width}`}>
            <span
              className={`pointer-events-none ${font} transition-colors ${
                filled ? 'text-warning' : 'text-zinc-700'
              }`}
            >
              <FontAwesomeIcon icon={showHalf ? faStarHalfStroke : faStar} />
            </span>
            <button
              type='button'
              onMouseEnter={
                onHoverChange ? () => onHoverChange(halfValue) : undefined
              }
              onClick={() => onChange?.(halfValue)}
              className='absolute left-0 top-0 w-1/2 h-full cursor-pointer'
              aria-label={`${halfValue} points`}
            />
            <button
              type='button'
              onMouseEnter={
                onHoverChange ? () => onHoverChange(fullValue) : undefined
              }
              onClick={() => onChange?.(fullValue)}
              className='absolute left-1/2 top-0 w-1/2 h-full cursor-pointer'
              aria-label={`${fullValue} points`}
            />
          </div>
        );
      })}
    </div>
  );
};
