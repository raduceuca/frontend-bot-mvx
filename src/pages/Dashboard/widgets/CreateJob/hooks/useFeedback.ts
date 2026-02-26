import { useState } from 'react';
import { TrackTransactionParams } from '../createJob.types';
import { isUserCancellation } from '../createJob.utils';

interface PendingFeedback {
  jobId: string;
  agentNonce: number;
}

interface UseFeedbackParams {
  giveFeedback: (
    jobId: string,
    agentNonce: number,
    rating: number
  ) => Promise<{ sessionId: string | null; txHash: string }>;
  trackTransaction: (params: TrackTransactionParams) => string;
  onClose: () => void;
}

export const useFeedback = ({
  giveFeedback,
  trackTransaction,
  onClose
}: UseFeedbackParams) => {
  const [pendingFeedback, setPendingFeedback] =
    useState<PendingFeedback | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const openFeedback = (jobId: string, agentNonce: number) => {
    setPendingFeedback({ jobId, agentNonce });
    setFeedbackRating(0);
    setFeedbackError(null);
  };

  const closeFeedback = () => {
    onClose();
    setPendingFeedback(null);
    setFeedbackRating(0);
    setFeedbackError(null);
  };

  const submitFeedback = async () => {
    if (!pendingFeedback || feedbackRating <= 0) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const { txHash } = await giveFeedback(
        pendingFeedback.jobId,
        pendingFeedback.agentNonce,
        feedbackRating
      );
      if (txHash) {
        trackTransaction({
          txHash,
          label: `Rating: ${feedbackRating}/100`,
          amount: '0',
          token: 'xEGLD',
          status: 'confirmed'
        });
      }
      closeFeedback();
    } catch (err: unknown) {
      if (isUserCancellation(err)) {
        setFeedbackError('Signing cancelled. Your rating was not submitted.');
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Couldn\u2019t submit your rating. Try again?';
        setFeedbackError(message);
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return {
    pendingFeedback,
    feedbackRating,
    isSubmittingFeedback,
    feedbackError,
    setFeedbackRating,
    openFeedback,
    closeFeedback,
    submitFeedback
  };
};
