import { sign } from 'crypto';
import api from './axios';

// Get chat response
export const getChatResponse = async (sessionId: string | undefined, userQuestion: string) => {

  const payload: { sessionId?: string; userQuestion: string } = { userQuestion };
  if (sessionId && sessionId.trim()) payload.sessionId = sessionId;

  const response = await api.post('twin/chat', payload);
  return response.data;
};

// Get Chat History
export const getChatHistory = async (sessionId: string) => {
  const response = await api.get(`twin/chat/${sessionId}`);
  return response.data;
};

// Get Chat Session History
export const getAllChatSessions = async (searchQuery: string, signal?: AbortSignal) => {
  const response = await api.get('twin/chat/sessions', {
    params: searchQuery ? { searchQuery } : {},
    signal: signal
  });
  return response.data;
};

// Delete a Chat Session
export const deleteChatSession = async (sessionId: string) => {
  const response = await api.delete(`twin/chat/session/${sessionId}`);
  return response.data; // (will be empty since backend returns 204 No Content)
};

