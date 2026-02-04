import { useCallback } from 'react';
import type { Message } from '../Chat';
import type { TwinWebSocketEvent } from '../types/TwinTypes';
import { updateMessageById } from '../utils/messageUtils';
import toast from 'react-hot-toast';
import { CHATS } from '../../../constants/text';

interface UseMessageHandlerOptions {
  onSessionCreated?: (sessionId: string) => void;
  onStreamingStart?: () => void;
  onStreamingEnd?: () => void;
}

/**
 * Custom hook for handling WebSocket events and updating message state
 * Processes different event types (SESSION_CREATED, START, DELTA, DONE, ERROR)
 */
export const useMessageHandler = (options: UseMessageHandlerOptions) => {
  const handleWsEvent = useCallback(
    (
      event: TwinWebSocketEvent,
      messages: Message[],
      setMessages: (updater: (prev: Message[]) => Message[]) => void
    ) => {
      switch (event.type) {
        case 'SESSION_CREATED':
          if (!event.sessionId) return;
          options.onSessionCreated?.(event.sessionId);
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = prev.slice();
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              sessionId: event.sessionId,
            };
            return updated;
          });
          break;

        case 'START':
          options.onStreamingStart?.();
          break;

        case 'DELTA':
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const lastIdx = prev.length - 1;
            const delta = event.delta ?? '';

            // Fast path: check last message first (most common case)
            if (prev[lastIdx].clientMessageId === event.clientMessageId) {
              const updated = prev.slice();
              updated[lastIdx] = {
                ...updated[lastIdx],
                aiResponse: (updated[lastIdx].aiResponse ?? '') + delta,
              };
              return updated;
            }

            // Fallback: search by ID (rare)
            return updateMessageById(prev, event.clientMessageId, (msg) => ({
              ...msg,
              aiResponse: (msg.aiResponse ?? '') + delta,
            }));
          });
          break;

        case 'DONE':
          setMessages((prev) =>
            updateMessageById(prev, event.clientMessageId, (msg) => ({
              ...msg,
              aiResponse: event.fullText ?? msg.aiResponse,
            }))
          );
          options.onStreamingEnd?.();
          break;

        case 'ERROR':
          const errorMessage = event.error || CHATS.RESPONSE_FAILURE;
          toast.error(errorMessage);
          setMessages((prev) =>
            updateMessageById(prev, event.clientMessageId, (msg) => ({
              ...msg,
              aiResponse: errorMessage,
            }))
          );
          options.onStreamingEnd?.();
          break;

        default:
          break;
      }
    },
    [options]
  );

  return { handleWsEvent };
};
