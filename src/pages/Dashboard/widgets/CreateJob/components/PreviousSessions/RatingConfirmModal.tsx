import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { truncateJobId } from '../../createJob.utils';
import { StarRating } from '../StarRating';

interface RatingConfirmModalProps {
  jobId: string;
  rating: number;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RatingConfirmModal = ({
  jobId,
  rating,
  isSubmitting,
  error,
  onConfirm,
  onCancel
}: RatingConfirmModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onCancel]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-end xs:items-center justify-center p-0 xs:p-4 bg-zinc-950/60 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='rate-session-title'
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className='bg-zinc-900 border border-zinc-800 rounded-t-xl xs:rounded-xl max-w-sm w-full p-5 xs:p-6 flex flex-col gap-4'
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id='rate-session-title'
          className='text-lg font-semibold text-zinc-50 tracking-tight'
        >
          Rate this session?
        </h3>
        <p className='text-base text-zinc-500 leading-relaxed'>
          Job {truncateJobId(jobId)} &mdash; your rating goes on-chain and helps
          improve the agent.
        </p>

        {/* Star display (read-only) */}
        <div className='flex items-center gap-2'>
          <StarRating rating={rating} readOnly />
          <span className='text-base text-zinc-500 font-mono'>
            {rating} / 100
          </span>
        </div>

        {error && (
          <p role='alert' className='text-error text-base'>
            {error}
          </p>
        )}

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className='flex-1 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors duration-150 text-base font-medium cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isSubmitting}
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
