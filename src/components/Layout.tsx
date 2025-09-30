import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BrainCog,
  History as HistoryIcon,
  Edit3,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NAVBAR_LAYOUT } from "../constants/text";

type LinkState = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning?: boolean;
};

type LayoutProps = { children: React.ReactNode };

// Memoized navigation item component
const NavigationItem = React.memo<{
  item: { name: string; href: string; icon: React.ComponentType<any> };
  sidebarCollapsed: boolean;
}>(({ item, sidebarCollapsed }) => {
  const Icon = item.icon;

  const getNavLinkClassName = useCallback(({ isActive }: LinkState) =>
    `flex items-center w-full p-3 rounded-lg transition-colors duration-200 focus:outline-none ${sidebarCollapsed ? 'justify-center' : 'justify-start'
    } ${isActive
      ? "bg-gray-700 text-white"
      : "text-gray-300 hover:text-white hover:bg-gray-700"
    }`
    , [sidebarCollapsed]);

  return (
    <NavLink
      to={item.href}
      title={sidebarCollapsed ? item.name : undefined}
      className={getNavLinkClassName}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!sidebarCollapsed && (
        <span className="ml-3">{item.name}</span>
      )}
    </NavLink>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Memoized user avatar component
const UserAvatar = React.memo<{ email?: string }>(({ email }) => (
  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-white font-medium text-sm">
      {email?.charAt(0).toUpperCase() ?? "U"}
    </span>
  </div>
));

UserAvatar.displayName = 'UserAvatar';

// Memoized dropdown menu
const DropdownMenu = React.memo<{
  user: any;
  onLogout?: () => void;
  onClose: () => void
}>(({ user, onLogout, onClose }) => (
  <>
    <div
      role="menu"
      className="absolute right-0 bottom-16 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600"
    >
      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600 truncate">
        {user?.email}
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
    <button
      aria-label="Close menu backdrop"
      className="fixed inset-0 z-10"
      onClick={onClose}
    />
  </>
));

DropdownMenu.displayName = 'DropdownMenu';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Memoize navigation items to prevent recreation on every render
  const navigation = useMemo(() => [
    { name: "History", href: "/history", icon: HistoryIcon },
    { name: "Edit Profile", href: "/profile-edit", icon: Edit3 },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ], []);

  // Memoize callbacks to prevent unnecessary re-renders
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newCollapsed = !prev;
      // Close dropdown when collapsing sidebar
      if (!newCollapsed) {
        setDropdownOpen(false);
      }
      return newCollapsed;
    });
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    // Add your logout logic here
    console.log("Logout clicked");
    setDropdownOpen(false);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  // Memoize computed styles and classes
  const sidebarClasses = useMemo(() =>
    `${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 dark:bg-gray-800 flex flex-col border-r border-gray-700 transition-all duration-300 ease-in-out`,
    [sidebarCollapsed]
  );

  const newChatButtonClasses = useMemo(() =>
    `flex items-center w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 focus:outline-none ${sidebarCollapsed ? 'justify-center' : 'justify-start'
    }`,
    [sidebarCollapsed]
  );

  const userButtonClasses = useMemo(() =>
    `flex items-center w-full p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-0 focus:bg-gray-700 focus:text-white ${sidebarCollapsed ? 'justify-center' : 'justify-start'
    }`,
    [sidebarCollapsed]
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 select-none">
      {/* Left Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-700">
          {sidebarCollapsed ? (
            // Collapsed state: Show only toggle button centered
            <div className="w-full flex justify-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Expand sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // Expanded state: Show logo and toggle button
            <>
              <div className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                <BrainCog className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                <span className="text-xl font-bold text-white">{NAVBAR_LAYOUT.HEADING}</span>
              </div>

              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto"
                aria-label="Collapse sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Link
            to="/chat"
            className={newChatButtonClasses}
            title={sidebarCollapsed ? NAVBAR_LAYOUT.NEW_CHAT : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="ml-3">{NAVBAR_LAYOUT.NEW_CHAT}</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <NavigationItem
              key={item.href} // Use href as key for better stability
              item={item}
              sidebarCollapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className={userButtonClasses}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              title={sidebarCollapsed ? user?.email ?? "User menu" : undefined}
              disabled={sidebarCollapsed}
            >
              <UserAvatar email={user?.email} />
              {!sidebarCollapsed && (
                <div className="ml-3 text-left overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.email ?? "Unknown User"}
                  </div>
                </div>
              )}
            </button>

            {dropdownOpen && !sidebarCollapsed && (
              <DropdownMenu
                user={user}
                onLogout={handleLogout}
                onClose={closeDropdown}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
