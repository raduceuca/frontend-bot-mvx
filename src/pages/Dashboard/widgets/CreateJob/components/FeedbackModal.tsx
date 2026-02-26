import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { StarRating } from './StarRating';

interface FeedbackModalProps {
  feedbackRating: number;
  isSubmitting: boolean;
  error: string | null;
  onRatingChange: (value: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const FeedbackModal = ({
  feedbackRating,
  isSubmitting,
  error,
  onRatingChange,
  onSubmit,
  onClose
}: FeedbackModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='feedback-title'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className='bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6 flex flex-col gap-4'
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id='feedback-title'
          className='text-lg font-semibold text-zinc-50 tracking-tight'
        >
          How did Max do?
        </h3>
        <p className='text-base text-zinc-500 leading-relaxed'>
          Your rating goes on-chain and helps improve the agent.
        </p>

        <fieldset aria-label='Rate Max'>
          <legend className='sr-only'>Rate Max from 10 to 100 points</legend>
          <StarRating rating={feedbackRating} onChange={onRatingChange} />
        </fieldset>

        <p className='text-base text-zinc-500 font-mono' aria-live='polite'>
          {feedbackRating > 0
            ? `${feedbackRating} / 100 points`
            : 'Tap to rate'}
        </p>

        {error && (
          <p role='alert' className='text-error text-base'>
            {error}
          </p>
        )}

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors duration-150 text-base font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            Skip
          </button>
          <button
            type='button'
            disabled={feedbackRating <= 0 || isSubmitting}
            onClick={onSubmit}
            className='flex-1 px-4 py-2.5 bg-teal hover:bg-teal/80 text-zinc-950 rounded-lg font-medium text-base transition-colors duration-150 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Submitting&hellip;
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
