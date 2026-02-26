import {
  clearPersistedJob,
  loadPersistedJob,
  PersistedJob,
  savePersistedJob
} from '../useJobPersistence';

const PERSISTED_JOB_KEY = 'mx_create_job_persisted';

const makeJob = (overrides: Partial<PersistedJob> = {}): PersistedJob => ({
  jobId: 'job-abc-123',
  agentNonce: 110,
  messages: [
    { role: 'user', content: 'Hello Max' },
    { role: 'agent', content: 'Hi there!' }
  ],
  hasSentTokens: false,
  ...overrides
});

describe('useJobPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('loadPersistedJob', () => {
    it('returns null when sessionStorage is empty', () => {
      const result = loadPersistedJob();

      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      sessionStorage.setItem(PERSISTED_JOB_KEY, '{not valid json!!!');

      const result = loadPersistedJob();

      expect(result).toBeNull();
    });

    it('returns null when jobId is missing', () => {
      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify({ agentNonce: 110, messages: [] })
      );

      const result = loadPersistedJob();

      expect(result).toBeNull();
    });

    it('returns null when agentNonce is not a number', () => {
      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify({
          jobId: 'job-123',
          agentNonce: 'not-a-number',
          messages: []
        })
      );

      const result = loadPersistedJob();

      expect(result).toBeNull();
    });

    it('returns valid data with correct fields', () => {
      const job = makeJob();
      sessionStorage.setItem(PERSISTED_JOB_KEY, JSON.stringify(job));

      const result = loadPersistedJob();

      expect(result).not.toBeNull();
      expect(result).toEqual({
        jobId: 'job-abc-123',
        agentNonce: 110,
        messages: [
          { role: 'user', content: 'Hello Max' },
          { role: 'agent', content: 'Hi there!' }
        ],
        hasSentTokens: false
      });
    });

    it('truncates messages to last 10', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`
      }));

      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify(makeJob({ messages }))
      );

      const result = loadPersistedJob();

      expect(result).not.toBeNull();
      expect(result!.messages).toHaveLength(10);
      expect(result!.messages[0].content).toBe('Message 5');
      expect(result!.messages[9].content).toBe('Message 14');
    });

    it('returns empty array when messages is not an array', () => {
      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify({
          jobId: 'job-123',
          agentNonce: 110,
          messages: 'not-an-array'
        })
      );

      const result = loadPersistedJob();

      expect(result).not.toBeNull();
      expect(result!.messages).toEqual([]);
    });

    it('converts hasSentTokens to boolean', () => {
      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify({
          jobId: 'job-123',
          agentNonce: 110,
          messages: [],
          hasSentTokens: undefined
        })
      );

      const result = loadPersistedJob();

      expect(result).not.toBeNull();
      expect(result!.hasSentTokens).toBe(false);
      expect(typeof result!.hasSentTokens).toBe('boolean');

      sessionStorage.setItem(
        PERSISTED_JOB_KEY,
        JSON.stringify({
          jobId: 'job-456',
          agentNonce: 110,
          messages: [],
          hasSentTokens: true
        })
      );

      const result2 = loadPersistedJob();

      expect(result2!.hasSentTokens).toBe(true);
      expect(typeof result2!.hasSentTokens).toBe('boolean');
    });
  });

  describe('savePersistedJob', () => {
    it('writes to sessionStorage under the persisted job key', () => {
      const job = makeJob();

      savePersistedJob(job);

      const raw = sessionStorage.getItem(PERSISTED_JOB_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.jobId).toBe('job-abc-123');
      expect(parsed.agentNonce).toBe(110);
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.hasSentTokens).toBe(false);
    });

    it('truncates messages to last 10', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`
      }));

      savePersistedJob(makeJob({ messages }));

      const raw = sessionStorage.getItem(PERSISTED_JOB_KEY);
      const parsed = JSON.parse(raw!);

      expect(parsed.messages).toHaveLength(10);
      expect(parsed.messages[0].content).toBe('Message 5');
      expect(parsed.messages[9].content).toBe('Message 14');
    });
  });

  describe('clearPersistedJob', () => {
    it('removes the key from sessionStorage', () => {
      sessionStorage.setItem(PERSISTED_JOB_KEY, JSON.stringify(makeJob()));

      expect(sessionStorage.getItem(PERSISTED_JOB_KEY)).not.toBeNull();

      clearPersistedJob();

      expect(sessionStorage.getItem(PERSISTED_JOB_KEY)).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('save then load returns equivalent data', () => {
      const original = makeJob({
        jobId: 'round-trip-id',
        agentNonce: 42,
        messages: [
          { role: 'user', content: 'What is the weather?' },
          { role: 'agent', content: 'Sunny!' },
          { role: 'system', content: 'Processing...', isStatus: true }
        ],
        hasSentTokens: true
      });

      savePersistedJob(original);
      const loaded = loadPersistedJob();

      expect(loaded).not.toBeNull();
      expect(loaded!.jobId).toBe(original.jobId);
      expect(loaded!.agentNonce).toBe(original.agentNonce);
      expect(loaded!.hasSentTokens).toBe(original.hasSentTokens);
      expect(loaded!.messages).toHaveLength(original.messages.length);
      expect(loaded!.messages).toEqual(original.messages);
    });
  });
});
