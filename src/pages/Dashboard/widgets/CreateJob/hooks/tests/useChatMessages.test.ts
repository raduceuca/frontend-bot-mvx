import { act, renderHook } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';

describe('useChatMessages', () => {
  it('starts with an empty messages array', () => {
    const { result } = renderHook(() => useChatMessages());

    expect(result.current.messages).toEqual([]);
  });

  describe('pushMessage', () => {
    it('adds a message with an auto-generated id', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'user',
          content: 'Hello Max'
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual({
        id: expect.stringMatching(/^msg-\d+$/),
        role: 'user',
        content: 'Hello Max'
      });
    });

    it('appends without mutating the previous messages array', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({ role: 'user', content: 'First' });
      });

      const firstArray = result.current.messages;

      act(() => {
        result.current.pushMessage({ role: 'agent', content: 'Second' });
      });

      const secondArray = result.current.messages;

      expect(firstArray).toHaveLength(1);
      expect(secondArray).toHaveLength(2);
      expect(firstArray).not.toBe(secondArray);
    });

    it('generates unique ids across multiple pushes', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({ role: 'user', content: 'One' });
        result.current.pushMessage({ role: 'agent', content: 'Two' });
        result.current.pushMessage({ role: 'system', content: 'Three' });
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
      ids.forEach((id) => {
        expect(id).toMatch(/^msg-\d+$/);
      });
    });
  });

  describe('replaceLastStatus', () => {
    it('replaces the last status message content', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'system',
          content: 'Loading...',
          isStatus: true
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Loading...');

      act(() => {
        result.current.replaceLastStatus('Processing...');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Processing...');
      expect(result.current.messages[0].isStatus).toBe(true);
      expect(result.current.messages[0].isError).toBe(false);
    });

    it('sets isStatus to false and isError to true when isError=true', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'system',
          content: 'Loading...',
          isStatus: true
        });
      });

      act(() => {
        result.current.replaceLastStatus('Something went wrong', true);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Something went wrong');
      expect(result.current.messages[0].isStatus).toBe(false);
      expect(result.current.messages[0].isError).toBe(true);
    });

    it('appends a new system message when last message is not a status', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'user',
          content: 'Hello'
        });
      });

      act(() => {
        result.current.replaceLastStatus('Processing your request...');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[1]).toEqual({
        id: expect.stringMatching(/^msg-\d+$/),
        role: 'system',
        content: 'Processing your request...',
        isStatus: true,
        isError: false
      });
    });

    it('appends a new system message on empty messages', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.replaceLastStatus('Initializing...');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual({
        id: expect.stringMatching(/^msg-\d+$/),
        role: 'system',
        content: 'Initializing...',
        isStatus: true,
        isError: false
      });
    });
  });

  describe('removeLastStatus', () => {
    it('removes the last message if it is a status', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'user',
          content: 'Hello'
        });
        result.current.pushMessage({
          role: 'system',
          content: 'Thinking...',
          isStatus: true
        });
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.removeLastStatus();
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
    });

    it('does nothing if the last message is not a status', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({
          role: 'agent',
          content: 'Here is my response'
        });
      });

      act(() => {
        result.current.removeLastStatus();
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Here is my response');
    });

    it('does nothing on empty messages', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.removeLastStatus();
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('clearMessages', () => {
    it('resets messages to an empty array', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({ role: 'user', content: 'Hello' });
        result.current.pushMessage({ role: 'agent', content: 'Hi there' });
        result.current.pushMessage({
          role: 'system',
          content: 'Status',
          isStatus: true
        });
      });

      expect(result.current.messages).toHaveLength(3);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('restoreMessages', () => {
    it('replaces all messages with provided saved messages, adding ids', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.pushMessage({ role: 'user', content: 'Old message' });
      });

      const savedMessages = [
        { role: 'user' as const, content: 'Restored message 1' },
        {
          role: 'agent' as const,
          content: 'Restored message 2',
          isStatus: false,
          isError: false
        },
        {
          role: 'system' as const,
          content: 'Restored status',
          isStatus: true,
          isError: false
        }
      ];

      act(() => {
        result.current.restoreMessages(savedMessages);
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0]).toEqual(
        expect.objectContaining({
          role: 'user',
          content: 'Restored message 1'
        })
      );
      expect(result.current.messages[1]).toEqual(
        expect.objectContaining({
          role: 'agent',
          content: 'Restored message 2'
        })
      );
      expect(result.current.messages[2]).toEqual(
        expect.objectContaining({
          role: 'system',
          content: 'Restored status',
          isStatus: true
        })
      );

      result.current.messages.forEach((msg) => {
        expect(msg.id).toMatch(/^msg-\d+$/);
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
