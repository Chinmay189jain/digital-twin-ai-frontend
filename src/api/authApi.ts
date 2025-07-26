import api from './axios';

interface AuthFormData {
  username: string;
  email: string;
  password: string;
}

// Login API
export const login = async ({ email, password }: AuthFormData) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Register API
export const register = async ({ username, email, password }: AuthFormData) => {
  const response = await api.post('/auth/register', {
    name: username,
    email,
    password,
  });
  return response.data;
};
