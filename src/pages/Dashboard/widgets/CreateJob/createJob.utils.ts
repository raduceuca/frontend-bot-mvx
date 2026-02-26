export const truncateJobId = (jobId: string): string => {
  if (jobId.length <= 12) return jobId;
  return `${jobId.slice(0, 6)}...${jobId.slice(-4)}`;
};
