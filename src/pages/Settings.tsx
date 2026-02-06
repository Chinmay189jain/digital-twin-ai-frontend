import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Trash2, Moon, Sun, Shield } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';
import { deleteAccount } from '../api/authApi';
import { SETTINGS } from '../constants/text';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmDialog(false);
  }, []);

  const handleDeleteAccount = async () => {
    // This would normally make an API call to delete the account
    try {
      await deleteAccount();
      logout();
      toast.success('Account deleted');
      navigate("/");
    } catch(err){
      console.error(err);
      toast.error('Failed to delete account');
    } finally {
      setShowDeleteConfirmDialog(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 custom-scrollbar">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {SETTINGS.HEADING}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {SETTINGS.TITLE}
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              {SETTINGS.ACCOUNT_HEADING}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {SETTINGS.ACCOUNT_TITLE}
                </label>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              {SETTINGS.SECURITY_HEADING}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {SETTINGS.SECURITY_PASSWORD_TITLE}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {SETTINGS.SECURITY_PASSWORD_MESSAGE}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/change/password', { state: { mode: "AUTHENTICATED" } })}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {SETTINGS.BUTTON_CHANGE_PASSWORD}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              {SETTINGS.DELETE_ACCOUNT_HEADING}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-red-800 dark:text-red-200 mb-2">
                  {SETTINGS.DELETE_ACCOUNT_TITLE}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                  {SETTINGS.DELETE_ACCOUNT_TEXT}
                </p>

                <button
                    onClick={() => setShowDeleteConfirmDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {SETTINGS.DELETE_ACCOUNT_BUTTON}
                </button>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirmDialog && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleCancelDelete}
                  >
                    <div
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {SETTINGS.DIALOG_HEADING}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {SETTINGS.DIALOG_TITLE}
                      </p>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={handleCancelDelete}
                          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {SETTINGS.DIALOG_CANCEL}
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          {SETTINGS.DIALOG_CONFIRM}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
