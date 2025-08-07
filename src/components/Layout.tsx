import React, { useEffect, useState, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  BrainCog,
  MessageCircle,
  History as HistoryIcon,
  Edit3,
  Settings as SettingsIcon,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NAVBAR_LAYOUT } from "../constants/text";

type LinkState = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning?: boolean;
};

type LayoutProps = { children: React.ReactNode };

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "History", href: "/history", icon: HistoryIcon },
    { name: "Edit Profile", href: "/profile/edit", icon: Edit3 },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gray-900 dark:bg-gray-800 flex flex-col border-r border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
            <BrainCog className="w-8 h-8 text-indigo-400" />
            <span className="text-xl font-bold text-white">{NAVBAR_LAYOUT.HEADING}</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Link
            to="/chat"
            className="flex items-center justify-start w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5" />
            <span className="ml-3">{NAVBAR_LAYOUT.NEW_CHAT}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                title={item.name}
                className={({ isActive }: LinkState) =>
                  `flex items-center justify-start w-full p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          {/* User Section */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center justify-start w-full p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="ml-3 text-left overflow-hidden">
                <div className="text-sm font-medium text-white truncate">
                  {user?.email ?? "Unknown User"}
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 bottom-16 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600"
              >
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600 truncate">
                  {user?.email}
                </div>
                <button
                  // onClick={handleLogout}
                  role="menuitem"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>

      {/* Backdrop for dropdown */}
      {dropdownOpen && (
        <button
          aria-label="Close menu backdrop"
          className="fixed inset-0 z-10"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
