import { useCallback, useState } from 'react';
import { PreviousSession } from 'hooks/useGetPreviousSessions';
import { TrackTransactionParams } from '../createJob.types';
import { isUserCancellation } from '../createJob.utils';

interface SessionRatingState {
  jobId: string;
  agentNonce: number;
  rating: number;
}

interface UseSessionRatingParams {
  giveFeedback: (
    jobId: string,
    agentNonce: number,
    rating: number
  ) => Promise<{ sessionId: string | null; txHash: string }>;
  submitProof: (jobId: string) => Promise<{ success: boolean }>;
  previousSessions: PreviousSession[];
  trackTransaction: (params: TrackTransactionParams) => string;
  refetchSessions: () => void;
}

export interface UseSessionRatingReturn {
  sessionRating: SessionRatingState | null;
  isSubmittingSessionRating: boolean;
  sessionRatingError: string | null;
  finishingJobId: string | null;
  handleFinishSession: (sessionJobId: string) => Promise<void>;
  handleRateSession: (
    sessionJobId: string,
    sessionAgentNonce: number,
    rating: number
  ) => void;
  handleConfirmSessionRating: () => Promise<void>;
  handleCancelSessionRating: () => void;
}

export const useSessionRating = ({
  giveFeedback,
  submitProof,
  previousSessions,
  trackTransaction,
  refetchSessions
}: UseSessionRatingParams): UseSessionRatingReturn => {
  const [sessionRating, setSessionRating] = useState<SessionRatingState | null>(
    null
  );
  const [isSubmittingSessionRating, setIsSubmittingSessionRating] =
    useState(false);
  const [sessionRatingError, setSessionRatingError] = useState<string | null>(
    null
  );
  const [finishingJobId, setFinishingJobId] = useState<string | null>(null);

  const handleFinishSession = async (sessionJobId: string) => {
    setFinishingJobId(sessionJobId);
    try {
      await submitProof(sessionJobId);
    } catch {
      // Job may already be finished server-side — refetch will show real status
    } finally {
      setFinishingJobId(null);
      refetchSessions();
    }
  };

  const handleRateSession = (
    sessionJobId: string,
    sessionAgentNonce: number,
    rating: number
  ) => {
    setSessionRating({
      jobId: sessionJobId,
      agentNonce: sessionAgentNonce,
      rating
    });
    setSessionRatingError(null);
  };

  const handleConfirmSessionRating = async () => {
    if (!sessionRating) return;
    setIsSubmittingSessionRating(true);
    setSessionRatingError(null);
    try {
      // Finish the job first if it's still New/Pending
      const session = previousSessions.find(
        (s) => s.jobId === sessionRating.jobId
      );
      if (
        session &&
        (session.status === 'New' || session.status === 'Pending')
      ) {
        try {
          await submitProof(sessionRating.jobId);
        } catch {
          // Continue to rating even if finish fails — job may already be done
        }
      }

      const { txHash } = await giveFeedback(
        sessionRating.jobId,
        sessionRating.agentNonce,
        sessionRating.rating
      );
      if (txHash) {
        trackTransaction({
          txHash,
          label: `Rating: ${sessionRating.rating}/100`,
          amount: '0',
          token: 'xEGLD',
          status: 'confirmed'
        });
      }
      setSessionRating(null);
      refetchSessions();
    } catch (err: unknown) {
      if (isUserCancellation(err)) {
        setSessionRatingError(
          'Signing cancelled. Your rating was not submitted.'
        );
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Couldn\u2019t submit your rating. Try again?';
        setSessionRatingError(message);
      }
    } finally {
      setIsSubmittingSessionRating(false);
    }
  };

  const handleCancelSessionRating = useCallback(() => {
    if (isSubmittingSessionRating) return;
    setSessionRating(null);
    setSessionRatingError(null);
  }, [isSubmittingSessionRating]);

  return {
    sessionRating,
    isSubmittingSessionRating,
    sessionRatingError,
    finishingJobId,
    handleFinishSession,
    handleRateSession,
    handleConfirmSessionRating,
    handleCancelSessionRating
  };
};
