import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Calendar, MessageCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatSessionSkeletonList } from '../components/LoadingSpinner';
import { getAllChatSessions, deleteChatSession } from '../api/chatApi';
import toast from 'react-hot-toast';
import { HISTORY } from '../constants/text';

export interface ChatSession {
    id: string;
    title: string;
    messageCount: number; 
    updatedAt: string;
}

// Custom hook for debouncing - moved outside component to prevent recreation
export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debounced;
}

// Memoized date formatting functions
const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Memoized session item component
const ChatSessionItem = React.memo<{ session: ChatSession, onDelete: (id: string) => void; }>(({ session, onDelete }) => {
    
    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(session.id);
    }, [session.id, onDelete]);

    const formattedDate = useMemo(() => formatDate(session.updatedAt), [session.updatedAt]);
    const formattedTime = useMemo(() => formatTime(session.updatedAt), [session.updatedAt]);

    return (
        <Link
            to={`/chat/${session.id}`}
            className="block transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-[1.03] hover:shadow-lg rounded-lg"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                {formattedDate}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formattedTime} • {session.messageCount} messages
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                        title="Delete conversation"
                        aria-label={`Delete conversation: ${session.title}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm truncate">
                        {session.title}
                    </p>
                </div>
            </div>
        </Link>
    );
});

ChatSessionItem.displayName = 'ChatSessionItem';

// Memoized empty state component
const EmptyState = React.memo<{ searchQuery: string }>(({ searchQuery }) => (
    <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? HISTORY.SEARCH_SESSION_HEADING : HISTORY.EMPTY_SESSION_HEADING}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? HISTORY.SEARCH_SESSION_TITLE : HISTORY.EMPTY_SESSION_TITLE}
        </p>
    </div>
));

EmptyState.displayName = 'EmptyState';

// Main component
const History: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSession, setFilteredSession] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    
    // Use ref to store previous sessions for rollback
    const prevSessionsRef = useRef<ChatSession[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    const debouncedQuery = useDebounce(searchQuery, 500);

    // Memoized fetch function
    const fetchChatSessions = useCallback(async (query: string, signal?: AbortSignal) => {
        try {
            setIsLoading(true);
            const data = await getAllChatSessions(query, signal);
            if (!signal?.aborted) {
                setFilteredSession(data);
            }
        } catch (error) {
            if (!signal?.aborted) {
                console.error('Failed to load history:', error);
                toast.error('Failed to load history');
                setFilteredSession([]);
            }
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    // Load chat history with abort controller for cleanup
    useEffect(() => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        fetchChatSessions(debouncedQuery, controller.signal);

        return () => {
            controller.abort();
        };
    }, [debouncedQuery, fetchChatSessions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleDeleteClick = useCallback((sessionId: string) => {
        setSessionToDelete(sessionId);
        setShowDeleteDialog(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!sessionToDelete) return;

        // Store snapshot for rollback
        prevSessionsRef.current = filteredSession;
        
        // Optimistically update UI
        const updatedSessions = filteredSession.filter(s => s.id !== sessionToDelete);
        setFilteredSession(updatedSessions);

        try {
            await deleteChatSession(sessionToDelete);
            toast.success('Conversation deleted');

            // Refresh data to ensure consistency
            await fetchChatSessions(searchQuery);
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete conversation');

            // Rollback on failure
            setFilteredSession(prevSessionsRef.current);
        } finally {
            setShowDeleteDialog(false);
            setSessionToDelete(null);
        }
    }, [sessionToDelete, filteredSession, fetchChatSessions, searchQuery]);

    const handleCancelDelete = useCallback(() => {
        setShowDeleteDialog(false);
        setSessionToDelete(null);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    // Memoize the sessions list to prevent unnecessary re-renders
    const sessionsList = useMemo(() => (
        <div className="space-y-3">
            {filteredSession.map((session) => (
                <ChatSessionItem
                    key={session.id}
                    session={session}
                    onDelete={handleDeleteClick}
                />
            ))}
        </div>
    ), [filteredSession, handleDeleteClick]);

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {HISTORY.HEADING}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {HISTORY.TITLE}
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {isLoading && <ChatSessionSkeletonList count={3} />}

                {/* Conversations */}
                {filteredSession.length === 0 ? (
                    !isLoading && <EmptyState searchQuery={searchQuery} />
                ) : (
                    sessionsList
                )}

                {/* Delete Confirmation Dialog */}
                {showDeleteDialog && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        onClick={handleCancelDelete}
                    >
                        <div 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {HISTORY.DIALOG_HEADING}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {HISTORY.DIALOG_TITLE}
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    {HISTORY.DIALOG_BUTTON_NO}
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                   {HISTORY.DIALOG_BUTTON_YES}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;