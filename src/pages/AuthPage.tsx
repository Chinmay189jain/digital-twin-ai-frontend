import React, { useState, ChangeEvent, FormEvent } from "react";
import { BrainCog, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { LOGIN_TEXT, REGISTER_TEXT, FORM_ERROR } from "../constants/text";
import { login, register } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from "../components/LoadingSpinner";
import toast from 'react-hot-toast';

// Define the shape of form data
interface AuthFormData {
  username: string;
  email: string;
  password: string;
}

// Define error messages structure
interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
}

const AuthPage: React.FC = () => {

  const navigate = useNavigate();

  // State for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);

  // Toggle between login and register forms
  const [isLogin, setIsLogin] = useState(true);

  // Form data
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: '',
    password: '',
  });

  // Track validation errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Simulate API loading state
  const [loading, setLoading] = useState(false);

  // Update form values on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Basic validation to ensure required fields are filled
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isLogin && !formData.username.trim()) {
      newErrors.username = FORM_ERROR.USERNAME;
    }

    if (!formData.email.trim()) {
      newErrors.email = FORM_ERROR.EMAIL;
    }

    if (!formData.password.trim()) {
      newErrors.password = FORM_ERROR.PASSWORD;
    } else if (formData.password.length < 6) {
      newErrors.password = FORM_ERROR.PASSWORD_LENGTH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles toggling between login and register forms
  const handleFormToggle = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
    });
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    if (isLogin) {
      handleLogin(formData);
    } else {
      handleRegister(formData);
    }
    setLoading(false);
  };

  // Placeholder login API
  const handleLogin = async (credentials: AuthFormData) => {
    try {
      const data = await login(credentials);
      if (data?.token) {
        localStorage.setItem("token", data.token);

        // Redirect to chat after login
        navigate('/chat');
      } else {
        toast.error("Login failed: No token received.");
      }
    } catch (error: any) {
      toast.error("Login failed. Please try again.");
      console.error("Login error:", error);
    }
  };

  // Placeholder register API
  const handleRegister = async (credentials: AuthFormData) => {
    try {
      const data = await register(credentials);
      if (data?.token) {
        localStorage.setItem("token", data.token);
        toast.success("Account created!");

        //navigate to CreateProfile for generating profile summary
        navigate('/generate-profile');
      } else {
        toast.error("Registration failed: No token received.");
      }

    } catch (error: any) {
      toast.error("Registration failed. Please try again.");
      console.error("Registration error:", error);
    }
  };

  if (loading) {
      return (
        <LoadingSpinner size="sm" className="mr-2" />
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        {/* Heading section */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-600 rounded-full">
              <BrainCog className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? LOGIN_TEXT.TITLE : REGISTER_TEXT.TITLE}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? LOGIN_TEXT.TOP_MESSAGE : REGISTER_TEXT.TOP_MESSAGE}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
          <form className={`space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`} onSubmit={handleSubmit}>

            {/* Username field - only for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200
                    ${errors.username ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 
                  ${errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password field with toggle visibility*/}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 
                  ${errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Forgot password (only for login) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                  >
                    Forgot your password?
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:focus:ring-offset-gray-800"
              >
                {isLogin ? LOGIN_TEXT.BUTTON : REGISTER_TEXT.BUTTON}
              </button>
            </div>

            {/* Toggle form mode */}
            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? LOGIN_TEXT.BOTTOM_MESSAGE : REGISTER_TEXT.BOTTOM_MESSAGE}{' '}
                <button
                  type="button"
                  onClick={handleFormToggle}
                  className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>

  );
};

export default AuthPage;
