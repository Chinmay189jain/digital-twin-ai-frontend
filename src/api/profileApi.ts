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