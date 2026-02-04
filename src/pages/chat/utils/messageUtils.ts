import type { Message } from '../Chat';

/**
 * Creates an optimistic message object for immediate UI feedback
 */
export const createOptimisticMessage = (
  question: string,
  clientMessageId: string,
  sessionId: string | undefined
): Message => ({
  sessionId,
  clientMessageId,
  question,
  aiResponse: '',
  timestamp: new Date().toISOString(),
});

/**
 * Updates a specific message in the array by clientMessageId
 */
export const updateMessageById = (
  messages: Message[],
  clientMessageId: string | undefined,
  updater: (m: Message) => Message
): Message[] => {
  if (!clientMessageId) return messages;
  const messageIndex = messages.findIndex((m) => m.clientMessageId === clientMessageId);
  if (messageIndex === -1) return messages;

  const updatedMessages = messages.slice();
  updatedMessages[messageIndex] = updater(updatedMessages[messageIndex]);
  return updatedMessages;
};

/**
 * Generates a unique client message ID
 */
export const generateClientMessageId = (): string =>
  (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

/**
 * Safely extracts token from localStorage
 */
export const getAuthToken = (): string => localStorage.getItem('token') || '';
