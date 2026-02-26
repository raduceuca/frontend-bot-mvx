import { useRef, useState } from 'react';
import { ChatMessage, MessageRole } from '../createJob.types';

export const useChatMessages = () => {
  const counterRef = useRef(0);
  const uid = () => `msg-${++counterRef.current}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const pushMessage = (msg: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);

  const replaceLastStatus = (content: string, isError = false) =>
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isStatus) {
        return [
          ...prev.slice(0, -1),
          { ...last, content, isError, isStatus: !isError }
        ];
      }
      return [
        ...prev,
        {
          id: uid(),
          role: 'system' as const,
          content,
          isStatus: !isError,
          isError
        }
      ];
    });

  const removeLastStatus = () =>
    setMessages((prev) =>
      prev[prev.length - 1]?.isStatus ? prev.slice(0, -1) : prev
    );

  const clearMessages = () => setMessages([]);

  const restoreMessages = (
    saved: Array<{
      role: MessageRole;
      content: string;
      isStatus?: boolean;
      isError?: boolean;
    }>
  ) => {
    setMessages(
      saved.map((m) => ({
        id: uid(),
        role: m.role,
        content: m.content,
        isStatus: m.isStatus,
        isError: m.isError
      }))
    );
  };

  return {
    messages,
    pushMessage,
    replaceLastStatus,
    removeLastStatus,
    clearMessages,
    restoreMessages
  };
};
