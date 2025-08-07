import api from './axios';

// Generate Profile API
export const createProfileSummary = async (combinedAnswers: string[]) => {
  const response = await api.post('ai/generate-profile', {
    answers: combinedAnswers,
  });
  return response.data;
};

// Get profile summary
export const getProfileSummary = async () => {
  const response = await api.get('ai/get-profile');
  return response.data;
};

// Get ai response
export const getAiResponse = async (userQuestion: string) => {
  const response = await api.post('ai/ask', {
    userQuestion: userQuestion,
  });
  return response.data;
};

// Get Chat History
export const getChatHistory = async () => {
  const response = await api.get('ai/chat-history')
  return response.data;
};

