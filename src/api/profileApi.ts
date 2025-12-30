import api from './axios';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // cache valid for 5 minutes

const getCache = (key: string) => {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  return cached.data;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Get Profile Questions
export const getProfileQuestion = async () => {
  const cacheKey = 'profile_questions';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await api.get('ai/profile-questions');
  setCache(cacheKey, response.data);
  return response.data;
};

// Create Profile Summary (No caching because data changes)
export const createProfileSummary = async (profileAnswers: Record<number, string>) => {
  const response = await api.post('ai/generate-profile', profileAnswers);
  return response.data;
};

// Update Profile Summary
export const updateProfileSummary = async (profileAnswers: Record<number, string>) => {
  const response = await api.post('ai/update-profile', profileAnswers);
  // Update cache with latest summary
  setCache('profile_summary', response.data);
  return response.data;
};

// Get Profile Summary
export const getProfileSummary = async () => {
  const cacheKey = 'profile_summary';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await api.get('ai/get-profile');
  setCache(cacheKey, response.data);
  return response.data;
};
