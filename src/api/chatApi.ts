import api from './axios';

// Generate Profile API
export const createProfileSummary = async (combinedAnswers: string[]) => {
    const response = await api.post('ai/generate-profile',{
        answers: combinedAnswers,
    });
    return response.data;
};
