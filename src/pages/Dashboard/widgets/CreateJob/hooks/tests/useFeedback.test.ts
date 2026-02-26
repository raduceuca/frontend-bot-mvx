import { act, renderHook } from '@testing-library/react';
import { useFeedback } from '../useFeedback';

const createMocks = () => ({
  giveFeedback: jest.fn<
    Promise<{ sessionId: string | null; txHash: string }>,
    [string, number, number]
  >(),
  trackTransaction: jest.fn<string, [any]>().mockReturnValue('tx-id-1'),
  onClose: jest.fn()
});

describe('useFeedback', () => {
  it('starts with null pendingFeedback, rating 0, not submitting, no error', () => {
    const mocks = createMocks();
    const { result } = renderHook(() => useFeedback(mocks));

    expect(result.current.pendingFeedback).toBeNull();
    expect(result.current.feedbackRating).toBe(0);
    expect(result.current.isSubmittingFeedback).toBe(false);
    expect(result.current.feedbackError).toBeNull();
  });

  describe('openFeedback', () => {
    it('sets pendingFeedback with jobId and agentNonce, resets rating to 0', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
      });

      expect(result.current.pendingFeedback).toEqual({
        jobId: 'job-42',
        agentNonce: 110
      });
      expect(result.current.feedbackRating).toBe(0);
      expect(result.current.feedbackError).toBeNull();
    });

    it('resets a previously set rating to 0 when opening new feedback', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.setFeedbackRating(75);
      });

      expect(result.current.feedbackRating).toBe(75);

      act(() => {
        result.current.openFeedback('job-99', 200);
      });

      expect(result.current.feedbackRating).toBe(0);
    });
  });

  describe('closeFeedback', () => {
    it('clears pendingFeedback, resets rating, and calls onClose', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(80);
      });

      expect(result.current.pendingFeedback).not.toBeNull();
      expect(result.current.feedbackRating).toBe(80);

      act(() => {
        result.current.closeFeedback();
      });

      expect(result.current.pendingFeedback).toBeNull();
      expect(result.current.feedbackRating).toBe(0);
      expect(result.current.feedbackError).toBeNull();
      expect(mocks.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('setFeedbackRating', () => {
    it('updates the rating value', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.setFeedbackRating(50);
      });

      expect(result.current.feedbackRating).toBe(50);

      act(() => {
        result.current.setFeedbackRating(100);
      });

      expect(result.current.feedbackRating).toBe(100);
    });
  });

  describe('submitFeedback', () => {
    it('does nothing when no pendingFeedback is set', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.setFeedbackRating(80);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.giveFeedback).not.toHaveBeenCalled();
      expect(mocks.trackTransaction).not.toHaveBeenCalled();
      expect(mocks.onClose).not.toHaveBeenCalled();
      expect(result.current.isSubmittingFeedback).toBe(false);
    });

    it('does nothing when rating is 0', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
      });

      expect(result.current.feedbackRating).toBe(0);

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.giveFeedback).not.toHaveBeenCalled();
      expect(mocks.trackTransaction).not.toHaveBeenCalled();
      expect(mocks.onClose).not.toHaveBeenCalled();
    });

    it('does nothing when rating is negative', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(-5);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.giveFeedback).not.toHaveBeenCalled();
    });

    it('calls giveFeedback with correct args and tracks transaction on success', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockResolvedValue({
        sessionId: 'session-1',
        txHash: '0xabc123'
      });
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(85);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.giveFeedback).toHaveBeenCalledTimes(1);
      expect(mocks.giveFeedback).toHaveBeenCalledWith('job-42', 110, 85);

      expect(mocks.trackTransaction).toHaveBeenCalledTimes(1);
      expect(mocks.trackTransaction).toHaveBeenCalledWith({
        txHash: '0xabc123',
        label: 'Rating: 85/100',
        amount: '0',
        token: 'xEGLD',
        status: 'confirmed'
      });
    });

    it('calls closeFeedback (and thus onClose) on success', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockResolvedValue({
        sessionId: 'session-1',
        txHash: '0xabc123'
      });
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(85);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.onClose).toHaveBeenCalledTimes(1);
      expect(result.current.pendingFeedback).toBeNull();
      expect(result.current.feedbackRating).toBe(0);
      expect(result.current.feedbackError).toBeNull();
    });

    it('does NOT call trackTransaction when txHash is empty string', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockResolvedValue({
        sessionId: null,
        txHash: ''
      });
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(50);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(mocks.giveFeedback).toHaveBeenCalledTimes(1);
      expect(mocks.trackTransaction).not.toHaveBeenCalled();
      expect(mocks.onClose).toHaveBeenCalledTimes(1);
    });

    it('sets specific error message on user cancellation error', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockRejectedValue(new Error('Transaction canceled'));
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(70);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBe(
        'Signing cancelled. Your rating was not submitted.'
      );
      expect(result.current.pendingFeedback).not.toBeNull();
      expect(mocks.onClose).not.toHaveBeenCalled();
    });

    it('recognizes all cancellation substrings', async () => {
      const cancellationMessages = [
        'Transaction canceled',
        'Signing canceled',
        'Transaction signing cancelled by user',
        'cancelled by user',
        'denied by the user',
        'extensionResponse'
      ];

      for (const msg of cancellationMessages) {
        const mocks = createMocks();
        mocks.giveFeedback.mockRejectedValue(new Error(msg));
        const { result } = renderHook(() => useFeedback(mocks));

        act(() => {
          result.current.openFeedback('job-1', 110);
          result.current.setFeedbackRating(50);
        });

        await act(async () => {
          await result.current.submitFeedback();
        });

        expect(result.current.feedbackError).toBe(
          'Signing cancelled. Your rating was not submitted.'
        );
      }
    });

    it('sets error.message on generic Error', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockRejectedValue(new Error('Network timeout'));
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(60);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBe('Network timeout');
      expect(result.current.pendingFeedback).not.toBeNull();
      expect(mocks.onClose).not.toHaveBeenCalled();
    });

    it('sets fallback error message on non-Error thrown value', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockRejectedValue('something unexpected');
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(40);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBe(
        'Couldn\u2019t submit your rating. Try again?'
      );
    });

    it('sets fallback error on null thrown value', async () => {
      const mocks = createMocks();
      mocks.giveFeedback.mockRejectedValue(null);
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(40);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBe(
        'Couldn\u2019t submit your rating. Try again?'
      );
    });

    it('isSubmittingFeedback is true during submission and false after success', async () => {
      const mocks = createMocks();
      let resolveGiveFeedback: (value: {
        sessionId: string | null;
        txHash: string;
      }) => void;
      mocks.giveFeedback.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGiveFeedback = resolve;
          })
      );
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(90);
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submitFeedback();
      });

      expect(result.current.isSubmittingFeedback).toBe(true);

      await act(async () => {
        resolveGiveFeedback!({ sessionId: null, txHash: '0xdef' });
        await submitPromise;
      });

      expect(result.current.isSubmittingFeedback).toBe(false);
    });

    it('isSubmittingFeedback is true during submission and false after failure', async () => {
      const mocks = createMocks();
      let rejectGiveFeedback: (reason: unknown) => void;
      mocks.giveFeedback.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectGiveFeedback = reject;
          })
      );
      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(90);
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submitFeedback();
      });

      expect(result.current.isSubmittingFeedback).toBe(true);

      await act(async () => {
        rejectGiveFeedback!(new Error('Server error'));
        await submitPromise;
      });

      expect(result.current.isSubmittingFeedback).toBe(false);
      expect(result.current.feedbackError).toBe('Server error');
    });

    it('clears previous feedbackError on new submission attempt', async () => {
      const mocks = createMocks();
      mocks.giveFeedback
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ sessionId: null, txHash: '0xabc' });

      const { result } = renderHook(() => useFeedback(mocks));

      act(() => {
        result.current.openFeedback('job-42', 110);
        result.current.setFeedbackRating(50);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBe('First failure');

      act(() => {
        result.current.setFeedbackRating(60);
      });

      await act(async () => {
        await result.current.submitFeedback();
      });

      expect(result.current.feedbackError).toBeNull();
    });
  });
});
