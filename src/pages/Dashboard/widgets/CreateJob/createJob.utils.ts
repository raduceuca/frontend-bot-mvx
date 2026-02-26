export const truncateJobId = (jobId: string): string => {
  if (jobId.length <= 12) return jobId;
  return `${jobId.slice(0, 6)}...${jobId.slice(-4)}`;
};

const CANCELLATION_SUBSTRINGS = [
  'Transaction canceled',
  'Signing canceled',
  'Transaction signing cancelled by user',
  'cancelled by user',
  'denied by the user',
  'extensionResponse'
] as const;

export const isUserCancellation = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return CANCELLATION_SUBSTRINGS.some((s) => message.includes(s));
};
