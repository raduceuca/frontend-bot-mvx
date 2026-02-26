import {
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faExternalLink,
  faSpinner,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { TRANSACTIONS_ENDPOINT } from 'lib';
import { TrackedTransaction } from '../createJob.types';

interface TransactionActivityBarProps {
  transactions: TrackedTransaction[];
  explorerAddress: string;
}

const statusIcon = (status: TrackedTransaction['status']) => {
  if (status === 'confirmed') {
    return (
      <FontAwesomeIcon
        icon={faCheckCircle}
        className='text-success text-sm shrink-0'
      />
    );
  }
  if (status === 'failed') {
    return (
      <FontAwesomeIcon
        icon={faTimesCircle}
        className='text-error text-sm shrink-0'
      />
    );
  }
  return (
    <FontAwesomeIcon
      icon={faSpinner}
      spin
      className='text-teal text-sm shrink-0'
    />
  );
};

const timeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const truncateHash = (hash: string) =>
  hash.length <= 16 ? hash : `${hash.slice(0, 8)}...${hash.slice(-6)}`;

export const TransactionActivityBar = ({
  transactions,
  explorerAddress
}: TransactionActivityBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Refresh relative timestamps every 15s when expanded
  useEffect(() => {
    if (!expanded) return;
    const interval = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(interval);
  }, [expanded]);

  if (transactions.length === 0) return null;

  const pendingCount = transactions.filter(
    (tx) => tx.status === 'pending'
  ).length;

  return (
    <div className='border-b border-zinc-800/50'>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className='w-full px-5 py-2 flex items-center justify-between text-sm cursor-pointer hover:bg-zinc-800/30 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 focus-visible:ring-inset'
        aria-expanded={expanded}
        aria-controls='tx-activity-list'
      >
        <div className='flex items-center gap-2'>
          {pendingCount > 0 && (
            <span className='w-1.5 h-1.5 rounded-full bg-teal animate-pulse' />
          )}
          <span className='text-zinc-400'>
            {transactions.length} transaction
            {transactions.length !== 1 ? 's' : ''}
          </span>
          {pendingCount > 0 && (
            <span className='text-teal font-mono text-sm bg-teal/10 px-1.5 py-0.5 rounded'>
              {pendingCount} pending
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={expanded ? faChevronUp : faChevronDown}
          className='text-zinc-600 text-sm'
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id='tx-activity-list'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden'
          >
            <div className='px-5 pb-3 flex flex-col gap-1.5'>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className='flex items-center gap-3 py-1.5 px-3 rounded-lg bg-zinc-800/30 text-sm'
                >
                  {statusIcon(tx.status)}

                  <div className='flex flex-col min-w-0 flex-1'>
                    <span className='text-zinc-300 truncate'>{tx.label}</span>
                    <span className='text-sm text-zinc-600 font-mono'>
                      {truncateHash(tx.txHash)}
                      <span className='mx-1.5 text-zinc-700'>&middot;</span>
                      {timeAgo(tx.timestamp)}
                    </span>
                  </div>

                  <span className='text-sm font-mono text-zinc-500 whitespace-nowrap'>
                    {tx.amount} {tx.token}
                  </span>

                  <a
                    href={`${explorerAddress}/${TRANSACTIONS_ENDPOINT}/${tx.txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-zinc-600 hover:text-teal transition-colors duration-150 shrink-0'
                    aria-label={`View transaction ${truncateHash(
                      tx.txHash
                    )} on explorer`}
                  >
                    <FontAwesomeIcon
                      icon={faExternalLink}
                      className='text-sm'
                    />
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
