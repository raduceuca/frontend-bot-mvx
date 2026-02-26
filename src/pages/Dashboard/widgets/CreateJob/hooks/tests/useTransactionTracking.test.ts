import { act, renderHook } from '@testing-library/react';
import { TrackTransactionParams } from '../../createJob.types';
import { useTransactionTracking } from '../useTransactionTracking';

const makeParams = (
  overrides: Partial<TrackTransactionParams> = {}
): TrackTransactionParams => ({
  txHash: '0xabc123',
  label: 'Swap EGLD',
  amount: '1.5',
  token: 'EGLD',
  ...overrides
});

describe('useTransactionTracking', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with empty trackedTransactions and toasts', () => {
    const { result } = renderHook(() => useTransactionTracking());

    expect(result.current.trackedTransactions).toEqual([]);
    expect(result.current.toasts).toEqual([]);
  });

  it('trackTransaction with status confirmed adds to trackedTransactions AND fires a toast', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(makeParams({ status: 'confirmed' }));
    });

    expect(result.current.trackedTransactions).toHaveLength(1);
    expect(result.current.trackedTransactions[0]).toMatchObject({
      txHash: '0xabc123',
      label: 'Swap EGLD',
      amount: '1.5',
      token: 'EGLD',
      status: 'confirmed'
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      txHash: '0xabc123',
      label: 'Swap EGLD',
      amount: '1.5',
      token: 'EGLD',
      status: 'confirmed'
    });
  });

  it('trackTransaction with status failed adds to trackedTransactions AND fires a toast', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(makeParams({ status: 'failed' }));
    });

    expect(result.current.trackedTransactions).toHaveLength(1);
    expect(result.current.trackedTransactions[0].status).toBe('failed');

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].status).toBe('failed');
  });

  it('trackTransaction with status pending adds to trackedTransactions but does NOT fire a toast', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(makeParams({ status: 'pending' }));
    });

    expect(result.current.trackedTransactions).toHaveLength(1);
    expect(result.current.trackedTransactions[0].status).toBe('pending');

    expect(result.current.toasts).toHaveLength(0);
  });

  it('trackTransaction with no status defaults to pending (no toast)', () => {
    const { result } = renderHook(() => useTransactionTracking());
    const params = makeParams();
    delete params.status;

    act(() => {
      result.current.trackTransaction(params);
    });

    expect(result.current.trackedTransactions).toHaveLength(1);
    expect(result.current.trackedTransactions[0].status).toBe('pending');

    expect(result.current.toasts).toHaveLength(0);
  });

  it('trackTransaction returns a unique id string', () => {
    const { result } = renderHook(() => useTransactionTracking());

    let id1: string = '';
    let id2: string = '';
    let id3: string = '';

    act(() => {
      id1 = result.current.trackTransaction(makeParams());
    });
    act(() => {
      id2 = result.current.trackTransaction(makeParams());
    });
    act(() => {
      id3 = result.current.trackTransaction(makeParams());
    });

    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(typeof id3).toBe('string');

    const ids = new Set([id1, id2, id3]);
    expect(ids.size).toBe(3);
  });

  it('multiple trackTransaction calls prepend (newest first)', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(
        makeParams({ txHash: 'hash-1', label: 'First' })
      );
    });
    act(() => {
      result.current.trackTransaction(
        makeParams({ txHash: 'hash-2', label: 'Second' })
      );
    });
    act(() => {
      result.current.trackTransaction(
        makeParams({ txHash: 'hash-3', label: 'Third' })
      );
    });

    const txs = result.current.trackedTransactions;
    expect(txs).toHaveLength(3);
    expect(txs[0].txHash).toBe('hash-3');
    expect(txs[1].txHash).toBe('hash-2');
    expect(txs[2].txHash).toBe('hash-1');
  });

  it('dismissToast removes only the targeted toast', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(
        makeParams({ txHash: 'h1', status: 'confirmed' })
      );
    });
    act(() => {
      result.current.trackTransaction(
        makeParams({ txHash: 'h2', status: 'failed' })
      );
    });

    expect(result.current.toasts).toHaveLength(2);

    const toastToRemove = result.current.toasts[0].id;
    const toastToKeep = result.current.toasts[1];

    act(() => {
      result.current.dismissToast(toastToRemove);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(toastToKeep.id);
  });

  it('clearTransactions resets both trackedTransactions and toasts to empty', () => {
    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(makeParams({ status: 'confirmed' }));
    });
    act(() => {
      result.current.trackTransaction(makeParams({ status: 'failed' }));
    });

    expect(result.current.trackedTransactions.length).toBeGreaterThan(0);
    expect(result.current.toasts.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearTransactions();
    });

    expect(result.current.trackedTransactions).toEqual([]);
    expect(result.current.toasts).toEqual([]);
  });

  it('each tracked transaction has a timestamp (number > 0)', () => {
    (Date.now as jest.Mock).mockReturnValue(1700000000000);

    const { result } = renderHook(() => useTransactionTracking());

    act(() => {
      result.current.trackTransaction(makeParams());
    });

    const tx = result.current.trackedTransactions[0];
    expect(typeof tx.timestamp).toBe('number');
    expect(tx.timestamp).toBeGreaterThan(0);
    expect(tx.timestamp).toBe(1700000000000);
  });
});
