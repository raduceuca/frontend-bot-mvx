import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TASKCLAW_API_URL } from 'config';

export type SessionStatus = 'New' | 'Pending' | 'Completed' | 'Failed';

export interface PreviousSession {
  jobId: string;
  initTxHash: string;
  createdAt: number;
  employer: string;
  agentNonce: number;
  status: SessionStatus;
  verified: boolean;
  ratingAvg?: number;
  ratingsCount?: number;
}

interface JobsResponse {
  items: PreviousSession[];
  total: number;
  updatedAt?: number;
}

interface UseGetPreviousSessionsReturn {
  sessions: PreviousSession[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const normalizeStatus = (raw: string): SessionStatus => {
  const map: Record<string, SessionStatus> = {
    new: 'New',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed'
  };
  return map[raw.toLowerCase()] ?? 'New';
};

export const useGetPreviousSessions = (
  agentNonce: number,
  employerAddress: string
): UseGetPreviousSessionsReturn => {
  const [sessions, setSessions] = useState<PreviousSession[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!employerAddress) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<JobsResponse>(
        `${TASKCLAW_API_URL}/jobs`,
        {
          params: {
            agentNonce,
            employer: employerAddress,
            from: 0,
            size: 50
          },
          timeout: 6000,
          signal: controller.signal
        }
      );

      const sorted = [...data.items]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((item) => ({
          ...item,
          status: normalizeStatus(item.status)
        }));
      setSessions(sorted);
      setTotal(data.total);
    } catch (err) {
      if (axios.isCancel(err)) return;
      const message =
        err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [agentNonce, employerAddress]);

  useEffect(() => {
    fetchSessions();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchSessions]);

  return { sessions, total, isLoading, error, refetch: fetchSessions };
};
