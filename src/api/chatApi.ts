import { sign } from 'crypto';
import api from './axios';

// Get ai response
export const getAiResponse = async (userQuestion: string) => {
  const response = await api.post('twin/chat', {
    userQuestion: userQuestion,
  });
  return response.data;
};

// Get Chat History
export const getChatHistory = async () => {
  const response = await api.get('twin/')
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

