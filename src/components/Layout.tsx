import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
import { getAllChatSessions } from "../api/chatApi";

type LinkState = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning?: boolean;
};

type LayoutProps = { children: React.ReactNode };

type RecentChat = {
  id: string;
  title: string;
};

const NavigationItem = React.memo<{
  item: { name: string; href: string; icon: React.ComponentType<any> };
  sidebarCollapsed: boolean;
}>(({ item, sidebarCollapsed }) => {
  const Icon = item.icon;

  const getNavLinkClassName = useCallback(
    ({ isActive }: LinkState) =>
      `flex items-center w-full p-3 rounded-lg transition-colors duration-200 focus:outline-none ${sidebarCollapsed ? "justify-center" : "justify-start"
      } ${isActive
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:text-white hover:bg-gray-700"
      }`,
    [sidebarCollapsed]
  );

  return (
    <NavLink
      to={item.href}
      title={sidebarCollapsed ? item.name : undefined}
      className={getNavLinkClassName}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
    </NavLink>
  );
});

NavigationItem.displayName = "NavigationItem";

const UserAvatar = React.memo<{ email?: string }>(({ email }) => (
  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-white font-medium text-sm">
      {email?.charAt(0).toUpperCase() ?? "U"}
    </span>
  </div>
));
UserAvatar.displayName = "UserAvatar";

const DropdownMenu = React.memo<{
  user: any;
  onLogout?: () => void;
  onClose: () => void;
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
        {NAVBAR_LAYOUT.SIGN_OUT}
      </button>
    </div>
    <button
      aria-label="Close menu backdrop"
      className="fixed inset-0 z-10"
      onClick={onClose}
    />
  </>
));
DropdownMenu.displayName = "DropdownMenu";

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  // Fetch recent chats once on mount (uses cached API)
  useEffect(() => {
    const controller = new AbortController();

    const loadChats = async () => {
      try {
        const data = await getAllChatSessions("", controller.signal);
        if (controller.signal.aborted) return;

        const mapped: RecentChat[] = (data || [])
          .slice(0, 15)
          .map((s: any) => ({
            id: s.id,
            title: s.title || "New chat",
          }));

        setRecentChats(mapped);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load recent chats:", err);
          setRecentChats([]);
        }
      }
    };

    loadChats();

    return () => {
      controller.abort();
    };
  }, [location.pathname]);

  const activeChatId = useMemo(() => {
    const segments = location.pathname.split("/");
    if (segments[1] === "chat" && segments[2]) {
      return segments[2];
    }
    return null;
  }, [location.pathname]);

  const navigation = useMemo(
    () => [
      { name: "History", href: "/history", icon: HistoryIcon },
      { name: "Edit Profile", href: "/profile-edit", icon: Edit3 },
      { name: "Settings", href: "/settings", icon: SettingsIcon },
    ],
    []
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newCollapsed = !prev;
      if (!newCollapsed) {
        setDropdownOpen(false);
      }
      return newCollapsed;
    });
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    localStorage.removeItem("token");
    navigate("/");
  }, [navigate]);

  const handleOpenChat = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`);
    },
    [navigate]
  );

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const sidebarClasses = useMemo(
    () =>
      `${sidebarCollapsed ? "w-16" : "w-64"
      } bg-gray-900 dark:bg-gray-800 flex flex-col border-r border-gray-700 transition-all duration-300 ease-in-out`,
    [sidebarCollapsed]
  );

  const newChatButtonClasses = useMemo(
    () =>
      `flex items-center w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 focus:outline-none ${sidebarCollapsed ? "justify-center" : "justify-start"
      }`,
    [sidebarCollapsed]
  );

  const userButtonClasses = useMemo(
    () =>
      `flex items-center w-full p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-0 focus:bg-gray-700 focus:text-white ${sidebarCollapsed ? "justify-center" : "justify-start"
      }`,
    [sidebarCollapsed]
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 select-none overflow-hidden">
      {/* Left Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-700">
          {sidebarCollapsed ? (
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
            <>
              <div className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                <BrainCog className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                <span className="text-xl font-bold text-white">
                  {NAVBAR_LAYOUT.HEADING}
                </span>
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

        {/* Navigation + Recent Chats */}
        <nav className="flex-1 px-4 space-y-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                sidebarCollapsed={sidebarCollapsed}
              />
            ))}
          </div>

          {!sidebarCollapsed && recentChats.length > 0 && (
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between text-sm text-gray-500 ml-2">
                <span>{NAVBAR_LAYOUT.RECENT_CHATS}</span>
              </div>

              <div
                className="mt-2 pb-2 max-h-64 overflow-y-auto pr-1 space-y-1
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-500
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
              >
                {recentChats.map((chat) => {
                  const isActive = chat.id === activeChatId;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleOpenChat(chat.id)}
                      className={
                        "flex items-center w-full px-3 py-2 text-sm rounded-lg text-left transition-colors duration-200 " +
                        (isActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white")
                      }
                    >
                      <span className="truncate">{chat.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
};

export default Layout;
