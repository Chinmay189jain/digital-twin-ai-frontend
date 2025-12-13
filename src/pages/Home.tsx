import React, { useState, useCallback } from "react";
import { Bot, Sparkles, MessageSquare, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HOME_TEXT } from "../constants/text";

// Small memoized dropdown component
interface AvatarDropdownProps {
  email?: string;
  onLogout: () => void;
  onClose: () => void;
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = React.memo(
  ({ email, onLogout, onClose }) => {
    return (
      <>
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600"
        >
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600 truncate">
            {email}
          </div>
          <button
            onClick={onLogout}
            role="menuitem"
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign out
          </button>
        </div>

        {/* Backdrop for click-outside */}
        <button
          aria-label="Close menu backdrop"
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      </>
    );
  }
);

AvatarDropdown.displayName = "AvatarDropdown";

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isLoggedIn = !!user;

  const handleSignIn = useCallback(() => {
    navigate("/auth");
  }, [navigate]);

  const handleAvatarClick = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  }, [logout, navigate]);

  const handleStartChat = useCallback(() => {
    if (isLoggedIn) {
      navigate("/chat");
    } else {
      navigate("/auth");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br select-none from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">{HOME_TEXT.HEADING}</span>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative">
              {/* Avatar */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="text-white font-semibold text-2xl">
                  {user?.email?.charAt(0).toUpperCase() ?? "U"}
                </span>
              </button>

              {dropdownOpen && (
                <AvatarDropdown
                  email={user?.email}
                  onLogout={handleLogout}
                  onClose={closeDropdown}
                />
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {HOME_TEXT.BUTTON}
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 backdrop-blur-sm rounded-full text-indigo-300 text-sm font-medium mb-6 shadow-sm border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
            {HOME_TEXT.TOP_MESSAGE}
          </div>

          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {HOME_TEXT.HEADING}
          </h1>

          <p className="text-1.5xl font-semibold text-gray-200">
            {HOME_TEXT.TITLE}
          </p>
        </div>

        <div className="w-full max-w-md mt-6">
          <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-indigo-500/50 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-600 from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {HOME_TEXT.BOX_HEADING}
              </h3>
            </div>
            <p className="text-gray-300 mb-2 leading-relaxed text-sm">
              {HOME_TEXT.BOX_TITLE_ONE}
            </p>
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              {HOME_TEXT.BOX_TITLE_TWO}
            </p>
            <button
              onClick={handleStartChat}
              className="px-8 py-2.5 bg-indigo-600 from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium w-full group-hover:shadow-xl text-base"
            >
              {HOME_TEXT.CHAT_BUTTON}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
