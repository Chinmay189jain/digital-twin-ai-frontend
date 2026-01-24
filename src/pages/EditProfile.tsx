import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useTwin } from '../context/TwinContext';
import { updateProfileSummary, getProfileQuestion, getProfileSummary } from '../api/profileApi';
import toast from 'react-hot-toast';
import { EDIT_PROFILE } from '../constants/text';

interface ProfileQuestion {
  id: number;
  question: string;
  type: 'RADIO' | 'SELECT' | 'TEXT';
  options?: string[];
  placeholder?: string;
  prefix: string;
}

const EditProfile: React.FC = () => {

  const navigate = useNavigate();

  // Access shared context state
  const { answers, setAnswers, setProfileSummary } = useTwin();

  const [originalAnswers, setOriginalAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [profileQuestions, setProfileQuestions] = useState<ProfileQuestion[]>([]);

  const handleAnswer = (questionId: number, value: string) => {
    // Only update if the value actually changed
    if (answers[questionId] === value) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Compute if any answers have changed compared to originalAnswers
  const hasChanges = useMemo(
    () =>
      profileQuestions.some(q => {
        const current = answers[q.id] ?? '';
        const original = originalAnswers[q.id] ?? '';
        return current !== original;
      }),
    [profileQuestions, answers, originalAnswers]
  );

  // Fetch questions & profile from API on component mount
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [questionData, profileData] = await Promise.all([
          getProfileQuestion(),
          getProfileSummary()
        ]);

        if (isCancelled) return;

        setProfileQuestions(questionData);
        setAnswers(profileData.profileAnswers);
        setOriginalAnswers(profileData.profileAnswers);
        setProfileSummary(profileData.profileSummary);
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching profile questions:', error);
          toast.error('Failed to load profile questions');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [setAnswers, setProfileSummary]);

  const handleSave = async () => {
    try {
      window.dispatchEvent(new Event("LockUI"));
      const data = await updateProfileSummary(answers);

      if (data && data.profileSummary) {
        setProfileSummary(data.profileSummary);
        navigate('/profile-summary');
      } else {
        toast.error('API failed: No data received.');
        navigate('/generate-profile');
      }
    } catch (error: any) {
      toast.error('Error in generating twin profile');
      console.error('Error in generating twin profile:', error);
      navigate('/generate-profile');
      window.dispatchEvent(new Event("UnlockUI"));
    } 
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {EDIT_PROFILE.HEADING}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {EDIT_PROFILE.SUB_HEADING}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="space-y-8">
                {profileQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {index + 1}. {question.question}
                    </h3>

                    {/* Radio Options */}
                    {question.type === 'RADIO' && question.options && (
                      <div className="space-y-3">
                        {question.options.map(option => {
                          const isSelected = answers[question.id] === option;

                          return (
                            <label
                              key={option}
                              className="flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                              <input
                                type="radio"
                                value={option}
                                checked={isSelected}
                                onChange={e => handleAnswer(question.id, e.target.value)}
                                className="hidden"
                              />

                              {/* Custom purple circle via Tailwind classes */}
                              <div
                                className={`w-4 h-4 mt-1 mr-3 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${isSelected
                                  ? 'border-violet-500 bg-violet-500'
                                  : 'border-gray-300 bg-transparent'
                                  }`}
                              >
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>

                              <span className="text-gray-900 dark:text-white">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown Select */}
                    {question.type === 'SELECT' && question.options && (
                      <select
                        value={answers[question.id] || ''}
                        onChange={e => handleAnswer(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select an option...</option>
                        {question.options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Text Area */}
                    {question.type === 'TEXT' && (
                      <textarea
                        value={answers[question.id] || ''}
                        onChange={e => handleAnswer(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || loading}
                  className={`flex items-center px-6 py-2 rounded-lg text-white transition-colors duration-200
                    ${!hasChanges || loading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {EDIT_PROFILE.SAVE_BUTTON}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;