import {
  faArrowUpRightFromSquare,
  faCheckCircle,
  faClock,
  faRotateRight,
  faSpinner,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import { motion } from 'motion/react';
import { useState } from 'react';
import { PreviousSession } from 'hooks/useGetPreviousSessions';
import { truncateJobId } from '../../createJob.utils';
import { StarRating } from '../StarRating';

const DISPLAY_LIMIT = 5;

interface PreviousSessionsProps {
  sessions: PreviousSession[];
  total: number;
  isLoading: boolean;
  error: string | null;
  explorerAddress: string;
  onRetry?: () => void;
  onRateSession?: (jobId: string, agentNonce: number, rating: number) => void;
  onFinishSession?: (jobId: string) => void;
  finishingJobId?: string | null;
}

const statusStyles: Record<string, string> = {
  New: 'bg-zinc-800 text-zinc-400',
  Pending: 'bg-warning/10 text-warning border border-warning/20',
  Completed: 'bg-success/10 text-success border border-success/20',
  Failed: 'bg-error/10 text-error border border-error/20'
};

const formatDate = (timestamp: number): string => {
  const dt = DateTime.fromMillis(timestamp);
  if (!dt.isValid) return '\u2014';

  const now = DateTime.now();
  const diffDays = now.diff(dt, 'days').days;

  if (diffDays < 1) return dt.toRelative() ?? 'Today';
  if (diffDays < 7) return dt.toRelative() ?? dt.toFormat('MMM d');
  return dt.toFormat('MMM d');
};

const isUnrated = (session: PreviousSession): boolean =>
  !session.ratingsCount || session.ratingsCount === 0;

const needsFinish = (session: PreviousSession): boolean =>
  (session.status === 'New' || session.status === 'Pending') &&
  isUnrated(session);

const canRate = (session: PreviousSession): boolean =>
  (session.status === 'Completed' || session.status === 'Failed') &&
  isUnrated(session);

export const PreviousSessions = ({
  sessions,
  total,
  isLoading,
  error,
  explorerAddress,
  onRetry,
  onRateSession,
  onFinishSession,
  finishingJobId
}: PreviousSessionsProps) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center gap-2 py-4 text-sm text-zinc-500'>
        <FontAwesomeIcon icon={faSpinner} spin />
        Loading sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center gap-2 py-3 text-sm text-zinc-600'>
        <span>Could not load previous sessions</span>
        {onRetry && (
          <button
            type='button'
            onClick={onRetry}
            className='text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer'
            aria-label='Retry loading sessions'
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
        )}
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className='w-full flex flex-col gap-2'
    >
      <div className='flex items-center justify-between px-1'>
        <div className='flex items-center gap-2'>
          <FontAwesomeIcon icon={faClock} className='text-sm text-zinc-600' />
          <span className='text-sm font-medium text-zinc-500'>
            Previous sessions
            {total > 0 && <span className='text-zinc-600 ml-1'>({total})</span>}
          </span>
        </div>
        {sessions.length > DISPLAY_LIMIT && (
          <button
            type='button'
            onClick={() => setShowAll((prev) => !prev)}
            className='text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer'
          >
            {showAll ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>

      <div className='flex flex-col gap-1'>
        {(showAll ? sessions : sessions.slice(0, DISPLAY_LIMIT)).map(
          (session, index) => {
            const isFinishing = finishingJobId === session.jobId;

            return (
              <motion.div
                key={session.jobId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                className='group flex items-center justify-between gap-2 xs:gap-3 px-2.5 xs:px-3 py-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <span className='text-sm text-zinc-400 whitespace-nowrap'>
                    {formatDate(session.createdAt)}
                  </span>
                  <span
                    className={`text-sm px-1.5 py-0.5 rounded-md font-mono ${
                      statusStyles[session.status] ?? statusStyles.New
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className='flex items-center gap-2.5 shrink-0'>
                  {/* Already rated */}
                  {session.ratingAvg != null &&
                    session.ratingsCount != null &&
                    session.ratingsCount > 0 && (
                      <span className='flex items-center gap-1 text-sm text-warning'>
                        <FontAwesomeIcon icon={faStar} className='text-sm' />
                        {session.ratingAvg.toFixed(0)}
                      </span>
                    )}

                  {/* Finish & Rate button (New/Pending unrated) */}
                  {needsFinish(session) &&
                    expandedJobId !== session.jobId &&
                    !isFinishing && (
                      <div
                        className='flex items-center gap-1.5'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type='button'
                          onClick={() => onFinishSession?.(session.jobId)}
                          className='text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-zinc-800'
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className='mr-1'
                          />
                          Finish
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setExpandedJobId(session.jobId);
                            setHoverRating(0);
                          }}
                          className='text-sm text-zinc-500 hover:text-warning transition-colors duration-150 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-zinc-800'
                        >
                          Finish & Rate
                        </button>
                      </div>
                    )}

                  {/* Finishing spinner */}
                  {isFinishing && (
                    <span className='flex items-center gap-1.5 text-sm text-zinc-500'>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Finishing&hellip;
                    </span>
                  )}

                  {/* Rate button (Completed/Failed unrated) */}
                  {canRate(session) && expandedJobId !== session.jobId && (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedJobId(session.jobId);
                        setHoverRating(0);
                      }}
                      className='text-sm text-zinc-500 hover:text-warning transition-colors duration-150 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-zinc-800'
                    >
                      Rate
                    </button>
                  )}

                  {/* Inline star picker (expanded for both finish&rate and rate) */}
                  {(canRate(session) || needsFinish(session)) &&
                    expandedJobId === session.jobId &&
                    !isFinishing && (
                      <div
                        className='flex items-center gap-0.5'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <StarRating
                          rating={hoverRating}
                          onChange={(value) => {
                            onRateSession?.(
                              session.jobId,
                              session.agentNonce,
                              value
                            );
                            setExpandedJobId(null);
                            setHoverRating(0);
                          }}
                          onHoverChange={setHoverRating}
                          size='sm'
                        />
                        <button
                          type='button'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedJobId(null);
                            setHoverRating(0);
                          }}
                          className='text-sm text-zinc-600 hover:text-zinc-400 ml-1 cursor-pointer'
                          aria-label='Cancel rating'
                        >
                          &times;
                        </button>
                      </div>
                    )}

                  <span className='text-sm text-zinc-600 font-mono group-hover:text-zinc-400 transition-colors duration-150 hidden xs:inline'>
                    {truncateJobId(session.jobId)}
                  </span>
                  <a
                    href={`${explorerAddress}/transactions/${session.initTxHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-zinc-700 group-hover:text-zinc-500 transition-colors duration-150 cursor-pointer'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                  </a>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </motion.div>
  );
};
