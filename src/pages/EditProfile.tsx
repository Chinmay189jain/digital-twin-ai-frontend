import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useTwin } from '../context/TwinContext';
import { updateProfileSummary, getProfileQuestion, getProfileSummary } from '../api/profileApi';
import toast from 'react-hot-toast';

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

    // Simulate API loading state
    const [loading, setLoading] = useState(true);
    const [regenerate, setRegenerate] = useState(false);

    // State for profile questions from API
    const [profileQuestions, setProfileQuestions] = useState<ProfileQuestion[]>([]);

    const handleAnswer = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        if (originalAnswers[questionId] === value) {
            setRegenerate(false);
        } else {
            setRegenerate(true);
        }
    };

    // Fetch questions from API on component mount
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const questionData = await getProfileQuestion();
                const profileData = await getProfileSummary();
                setProfileQuestions(questionData);
                setAnswers(profileData.profileAnswers);
                setOriginalAnswers(profileData.profileAnswers);
                setProfileSummary(profileData.profileSummary);
            } catch (error) {
                console.error('Error fetching profile questions:', error);
                toast.error('Failed to load profile questions');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const data = await updateProfileSummary(answers);

            if (data) {
                console.log(data);
                setProfileSummary(data?.profileSummary);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Edit Your Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Update your responses to regenerate your Digital Twin with new insights.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <div className="space-y-8">
                        {profileQuestions.map((question, index) => (
                            <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {index + 1}. {question.question}
                                </h3>

                                {/* Radio Options */}
                                {question.type === 'RADIO' && question.options && (
                                    <div className="space-y-3">
                                        {question.options.map((option) => (
                                            <label
                                                key={option}
                                                className="flex items-start p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                            >
                                                <input
                                                    type="radio"
                                                    value={option}
                                                    checked={answers[question.id] === option}
                                                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                                                    className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500 hidden"
                                                />
                                                {/* Custom purple circle */}
                                                <div
                                                    className="w-4 h-4 mt-1 mr-3 rounded-full border-2 flex items-center justify-center transition-colors duration-200"
                                                    style={{
                                                        borderColor: answers[question.id] === option ? '#8b5cf6' : '#d1d5db',
                                                        backgroundColor: answers[question.id] === option ? '#8b5cf6' : 'transparent'
                                                    }}
                                                >
                                                    {answers[question.id] === option && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className="text-gray-900 dark:text-white">
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Dropdown Select */}
                                {question.type === 'SELECT' && question.options && (
                                    <select
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select an option...</option>
                                        {question.options.map((option) => (
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
                                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                                        placeholder={question.placeholder}
                                        rows={3}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 disable">
                        <button
                            onClick={handleSave}
                            disabled={!regenerate || loading /* or saving */}
                            className={`flex items-center px-6 py-2 rounded-lg text-white transition-colors duration-200
                                ${(!regenerate || loading) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save & Regenerate Twin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditProfile;