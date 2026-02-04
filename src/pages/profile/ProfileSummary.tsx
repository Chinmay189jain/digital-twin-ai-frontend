import React, { useState, useEffect } from 'react';
import { useTwin } from '../../context/TwinContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getProfileSummary } from '../../api/profileApi';
import { PROFILE_SUMMARY } from '../../constants/text';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const ProfileSummary: React.FC = () => {
  const navigate = useNavigate();
  const { profileSummary, setProfileSummary } = useTwin();
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect to /generate-profile if summary is missing
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getProfileSummary();
        if(data && data.profileSummary){
          setProfileSummary(data.profileSummary);
        } else {
          toast.error('No profile summary found. Please generate it first.');
          navigate('/generate-profile');
        }
      } catch(error: any){
        console.error("Failed to fetch profile summary:", error);
        toast.error('Failed to fetch profile summary.');
        navigate('/generate-profile');   
      } finally {
        window.dispatchEvent(new Event("UnlockUI"));
        setProfileLoading(false);
      }
    }
    fetchSummary();
  }, [navigate, setProfileSummary]);

  if (profileLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full">
            <LoadingSpinner />
          </div>
        </div>
      );
    }

  const handleSubmit = () => {
    navigate('/chat');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 select-none">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🎉</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {PROFILE_SUMMARY.SUMMARY_HEADING}
          </h1>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {PROFILE_SUMMARY.SUMMARY_TITLE}
              </h2>
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                {profileSummary}
            </div>
            </div>

          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {PROFILE_SUMMARY.SUMMARY_BUTTON}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
