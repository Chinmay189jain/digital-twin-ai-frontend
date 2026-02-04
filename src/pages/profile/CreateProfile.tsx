import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PROFILE_SUMMARY } from '../../constants/text';
import { createProfileSummary, getProfileQuestion } from '../../api/profileApi';
import { useNavigate } from 'react-router-dom';
import { useTwin } from '../../context/TwinContext';
import { LoadingSpinner, TwinGeneratingLoader } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Define the question type based on your API structure
interface ProfileQuestion {
  id: number;
  question: string;
  type: 'RADIO' | 'SELECT' | 'TEXT';
  options?: string[];
  placeholder?: string;
  prefix: string;
}

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();

  // Access shared context state
  const { answers, setAnswers, setProfileSummary } = useTwin();

  // State to track current step index in the form
  const [currentStep, setCurrentStep] = useState(0);

  // State for profile questions from API
  const [profileQuestions, setProfileQuestions] = useState<ProfileQuestion[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Fetch questions from API on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const data = await getProfileQuestion();
        setProfileQuestions(data);
      } catch (error) {
        console.error('Error fetching profile questions:', error);
        toast.error('Failed to load profile questions');
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Show loading spinner while fetching questions
  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show error state if no questions loaded
  if (profileQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {PROFILE_SUMMARY.ERROR_HEADING}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {PROFILE_SUMMARY.ERROR_TITLE}
          </p>
        </div>
      </div>
    );
  }

  // Get current question object based on current step
  const currentQuestion = profileQuestions[currentStep];

  // Determine if this is the last step
  const isLastStep = currentStep === profileQuestions.length - 1;

  // Can the user proceed to next step
  const canProceed = answers[currentQuestion.id];

  // Update answer for the current question
  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  // Handle clicking "Next" or "Create Twin"
  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle clicking "Previous"
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Placeholder submit function for final profile creation
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = await createProfileSummary(answers);

      if (data) {
        setProfileSummary(data);
        // Redirect to profile summary page
        navigate('/profile-summary');
      } else {
        toast.error("Api failed: No data received.");
        navigate('/generate-profile');
      }

    } catch (error: any) {
      toast.error("Error in generating twin profile");
      console.error("Error in generating twin profile:", error);
      navigate('/generate-profile');
      setLoading(false);
    } 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <TwinGeneratingLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 flex items-center justify-center select-none">
      <div className="w-full max-w-2xl">

        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {PROFILE_SUMMARY.HEADING}
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {profileQuestions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / profileQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Question Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4 mb-8">

            {/* Radio Options */}
            {currentQuestion.type === 'RADIO' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className='sr-only'
                    />
                    {/* Custom purple circle */}
                    <div
                      className="w-4 h-4 mt-1 mr-3 rounded-full border-2 flex items-center justify-center transition-colors duration-200"
                      style={{
                        borderColor: answers[currentQuestion.id] === option ? '#8b5cf6' : '#d1d5db',
                        backgroundColor: answers[currentQuestion.id] === option ? '#8b5cf6' : 'transparent'
                      }}
                    >
                      {answers[currentQuestion.id] === option && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Dropdown Select */}
            {currentQuestion.type === 'SELECT' && currentQuestion.options && (
              <select
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select an option...</option>
                {currentQuestion.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Text Area */}
            {currentQuestion.type === 'TEXT' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {PROFILE_SUMMARY.PREV_BUTTON}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLastStep ? PROFILE_SUMMARY.GENERATE_BUTTON : PROFILE_SUMMARY.NEXT_BUTTON}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
