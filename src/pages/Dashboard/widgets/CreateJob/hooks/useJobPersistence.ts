import { useEffect } from 'react';
import { MessageRole } from '../createJob.types';

const PERSISTED_JOB_KEY = 'mx_create_job_persisted';

export interface PersistedJob {
  jobId: string;
  agentNonce: number;
  messages: Array<{
    role: MessageRole;
    content: string;
    isStatus?: boolean;
    isError?: boolean;
  }>;
  hasSentTokens?: boolean;
}

export const loadPersistedJob = (): PersistedJob | null => {
  try {
    const raw = sessionStorage.getItem(PERSISTED_JOB_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedJob;
    if (typeof data?.jobId !== 'string' || typeof data?.agentNonce !== 'number')
      return null;
    return {
      jobId: data.jobId,
      agentNonce: data.agentNonce,
      messages: Array.isArray(data.messages) ? data.messages.slice(-10) : [],
      hasSentTokens: Boolean(data.hasSentTokens)
    };
  } catch {
    return null;
  }
};

export const savePersistedJob = (job: PersistedJob) => {
  try {
    sessionStorage.setItem(
      PERSISTED_JOB_KEY,
      JSON.stringify({
        ...job,
        messages: job.messages.slice(-10)
      })
    );
  } catch {
    /* ignore */
  }
};

export const clearPersistedJob = () => {
  try {
    sessionStorage.removeItem(PERSISTED_JOB_KEY);
  } catch {
    /* ignore */
  }
};

export const useJobPersistence = (params: {
  jobId: string | null;
  agentNonce: number;
  messages: Array<{
    role: MessageRole;
    content: string;
    isStatus?: boolean;
    isError?: boolean;
  }>;
  hasSentTokens: boolean;
}) => {
  const { jobId, agentNonce, messages, hasSentTokens } = params;

  useEffect(() => {
    if (jobId) {
      savePersistedJob({
        jobId,
        agentNonce,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          isStatus: m.isStatus,
          isError: m.isError
        })),
        hasSentTokens
      });
    }
  }, [jobId, agentNonce, messages, hasSentTokens]);
};
