import api from './axios';

// Get profile question
export const getProfileQuestion = async () => {
  const response = await api.get('ai/profile-questions');
  return response.data;
}; 

// Generate Profile API
export const createProfileSummary = async (profileAnswers: Record<number, string>) => {
  const response = await api.post('ai/generate-profile', profileAnswers);
  return response.data;
};

// Update Profile API
export const updateProfileSummary = async (profileAnswers: Record<number, string>) => {
  const response = await api.post('ai/update-profile', profileAnswers);
  return response.data;
};

// Get profile summary
export const getProfileSummary = async () => {
  const response = await api.get('ai/get-profile');
  return response.data;
};