import api from './axios';

interface AuthFormData {
  username: string;
  email: string;
  password: string;
}

// login api call
export const login = async ({ email, password }: AuthFormData) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// register api call
export const register = async ({ username, email, password }: AuthFormData) => {
  const response = await api.post('/auth/register', {
    name: username,
    email,
    password,
  });
  return response.data;
};

// send otp for account verification api call
export const requestAccountVerificationOtp = async () => {
  const response = await api.post('/account/verify/send');
  return response;
};

// confirm otp for account verification api call
export const verifyAccountVerificationOtp = async (otp: string) => {
  const response = await api.post('/account/verify/confirm', otp);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/account/delete');
  return response.data;
};
