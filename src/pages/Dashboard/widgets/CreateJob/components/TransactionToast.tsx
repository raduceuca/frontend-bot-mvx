import {
  faCheckCircle,
  faExternalLink,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { TRANSACTIONS_ENDPOINT } from 'lib';

interface ToastEntry {
  id: string;
  txHash: string;
  label: string;
  amount: string;
  token: string;
  status: 'confirmed' | 'failed';
}

interface TransactionToastProps {
  toasts: ToastEntry[];
  explorerAddress: string;
  onDismiss: (id: string) => void;
}

const DISMISS_DELAY = 5000;

const ToastItem = ({
  toast,
  explorerAddress,
  onDismiss
}: {
  toast: ToastEntry;
  explorerAddress: string;
  onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DISMISS_DELAY);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.status === 'confirmed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2.5 rounded-lg border text-sm ${
        isSuccess
          ? 'bg-success/5 border-success/20'
          : 'bg-error/5 border-error/20'
      }`}
    >
      <FontAwesomeIcon
        icon={isSuccess ? faCheckCircle : faTimesCircle}
        className={isSuccess ? 'text-success text-sm' : 'text-error text-sm'}
      />

      <div className='flex-1 min-w-0 truncate'>
        <span className={isSuccess ? 'text-success' : 'text-error'}>
          {isSuccess ? 'Confirmed' : 'Failed'}
        </span>
        <span className='text-zinc-500 mx-1 xs:mx-1.5'>&middot;</span>
        <span className='text-zinc-400'>{toast.label}</span>
        <span className='text-zinc-600 mx-1 xs:mx-1.5 hidden xs:inline'>
          &middot;
        </span>
        <span className='text-zinc-500 font-mono hidden xs:inline'>
          {toast.amount} {toast.token}
        </span>
      </div>

      <a
        href={`${explorerAddress}/${TRANSACTIONS_ENDPOINT}/${toast.txHash}`}
        target='_blank'
        rel='noopener noreferrer'
        className={`flex items-center gap-1 text-sm whitespace-nowrap transition-colors duration-150 ${
          isSuccess
            ? 'text-success/70 hover:text-success'
            : 'text-error/70 hover:text-error'
        }`}
        aria-label='View on explorer'
      >
        View
        <FontAwesomeIcon icon={faExternalLink} className='text-sm' />
      </a>
    </motion.div>
  );
};

export const TransactionToast = ({
  toasts,
  explorerAddress,
  onDismiss
}: TransactionToastProps) => (
  <div className='flex flex-col gap-1.5'>
    <AnimatePresence mode='popLayout'>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          explorerAddress={explorerAddress}
          onDismiss={onDismiss}
        />
      ))}
    </AnimatePresence>
  </div>
);
