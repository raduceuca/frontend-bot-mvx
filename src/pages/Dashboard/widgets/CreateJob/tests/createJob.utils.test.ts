import {
  isUserCancellation,
  truncateAddress,
  truncateJobId
} from '../createJob.utils';

describe('createJob.utils', () => {
  describe('truncateJobId', () => {
    it('returns full string if length is <= 12 characters', () => {
      expect(truncateJobId('')).toBe('');
      expect(truncateJobId('abc')).toBe('abc');
      expect(truncateJobId('123456789012')).toBe('123456789012');
    });

    it('truncates long strings to first 6 + ... + last 4', () => {
      const longId = 'abcdefghijklmnop';

      const result = truncateJobId(longId);

      expect(result).toBe('abcdef...mnop');
    });

    it('correctly handles a 13-character string (just over threshold)', () => {
      const id = '1234567890123';

      const result = truncateJobId(id);

      expect(result).toBe('123456...0123');
    });
  });

  describe('truncateAddress', () => {
    it('returns full string if length is <= 16 characters', () => {
      expect(truncateAddress('')).toBe('');
      expect(truncateAddress('short')).toBe('short');
      expect(truncateAddress('1234567890123456')).toBe('1234567890123456');
    });

    it('truncates long strings to first 8 + ... + last 6', () => {
      const address =
        'erd1uyn7ss9syxz2ek97ejuwf2rpxuvk7dkmq2l7t070fm2js3mzj5mstqtg66';

      const result = truncateAddress(address);

      expect(result).toBe('erd1uyn7...tqtg66');
    });

    it('correctly handles a 17-character string (just over threshold)', () => {
      const address = '12345678901234567';

      const result = truncateAddress(address);

      expect(result).toBe('12345678...234567');
    });
  });

  describe('isUserCancellation', () => {
    it('returns true for Error with "Transaction canceled"', () => {
      const error = new Error('Transaction canceled');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for Error with "Signing canceled"', () => {
      const error = new Error('Signing canceled by the user');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for Error with "Transaction signing cancelled by user"', () => {
      const error = new Error('Transaction signing cancelled by user');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for Error with "cancelled by user"', () => {
      const error = new Error('Operation cancelled by user');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for Error with "denied by the user"', () => {
      const error = new Error('Request denied by the user');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for Error with "extensionResponse"', () => {
      const error = new Error('extensionResponse: user rejected');

      expect(isUserCancellation(error)).toBe(true);
    });

    it('returns true for string (non-Error) containing cancellation text', () => {
      expect(isUserCancellation('Transaction canceled')).toBe(true);
      expect(isUserCancellation('Something cancelled by user happened')).toBe(
        true
      );
    });

    it('returns false for unrelated error', () => {
      const error = new Error('Network timeout');

      expect(isUserCancellation(error)).toBe(false);
    });

    it('returns false for an unrelated string', () => {
      expect(isUserCancellation('Something went wrong')).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isUserCancellation(null)).toBe(false);
      expect(isUserCancellation(undefined)).toBe(false);
    });
  });
});
