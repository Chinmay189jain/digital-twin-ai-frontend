import api from './axios';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

const getCache = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Get Chat History
export const getChatHistory = async (sessionId: string, page = 0, size = 30) => {
  const response = await api.get(`twin/chat/${sessionId}`, {
    params: {page, size}
  });
  // { messages: Message[], hasMore: boolean }
  return response.data;
};

// Get Chat Session History
export const getAllChatSessions = async (searchQuery: string, signal?: AbortSignal) => {
  const cacheKey = `chat_sessions_${searchQuery || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await api.get('twin/chat/sessions', {
    params: searchQuery ? { searchQuery } : {},
    signal
  });
  setCache(cacheKey, response.data);
  return response.data;
}

// Clearing old chat session for layout update
export const clearChatSessionsCache = () => {
  cache.clear();
};

// Delete a Chat Session
export const deleteChatSession = async (sessionId: string) => {
  const response = await api.delete(`twin/chat/session/${sessionId}`);
  cache.clear(); // clear sessions cache since list changed
  return response.data;
};

