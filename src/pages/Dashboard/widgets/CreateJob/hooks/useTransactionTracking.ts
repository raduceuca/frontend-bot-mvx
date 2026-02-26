import { useRef, useState } from 'react';
import {
  ToastData,
  TrackedTransaction,
  TrackTransactionParams
} from '../createJob.types';

export const useTransactionTracking = () => {
  const [trackedTransactions, setTrackedTransactions] = useState<
    TrackedTransaction[]
  >([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const txCounter = useRef(0);
  const toastCounter = useRef(0);

  const txUid = () => `tx-${++txCounter.current}`;

  const fireToast = (
    tx: { txHash: string; label: string; amount: string; token: string },
    status: 'confirmed' | 'failed'
  ) => {
    setToasts((prev) => [
      ...prev,
      { id: `toast-${++toastCounter.current}`, ...tx, status }
    ]);
  };

  const trackTransaction = (params: TrackTransactionParams): string => {
    const id = txUid();
    const status = params.status ?? 'pending';
    const newTx: TrackedTransaction = {
      id,
      txHash: params.txHash,
      label: params.label,
      amount: params.amount,
      token: params.token,
      status,
      timestamp: Date.now()
    };
    setTrackedTransactions((prev) => [newTx, ...prev]);

    if (status === 'confirmed' || status === 'failed') {
      fireToast(
        {
          txHash: params.txHash,
          label: params.label,
          amount: params.amount,
          token: params.token
        },
        status
      );
    }

    return id;
  };

  const dismissToast = (toastId: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== toastId));

  const clearTransactions = () => {
    setTrackedTransactions([]);
    setToasts([]);
  };

  return {
    trackedTransactions,
    toasts,
    trackTransaction,
    dismissToast,
    clearTransactions
  };
};
