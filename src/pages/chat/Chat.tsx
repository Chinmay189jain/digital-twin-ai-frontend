import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getChatHistory, clearChatSessionsCache } from '../../api/chatApi';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { UseSpeechRecognition } from './hooks/UseSpeechRecognition';
import toast from 'react-hot-toast';
import { CHATS } from '../../constants/text';
import type { TwinWsQuestionRequest, TwinWebSocketEvent } from './types/TwinTypes';
import { useWebSocket } from './hooks/useWebSocket';
import { useMessageHandler } from './hooks/useMessageHandler';
import {
  createOptimisticMessage,
  generateClientMessageId,
} from './utils/messageUtils';

// Constants
const CONSTANTS = {
  HISTORY_PAGE_SIZE: 30,
  SCROLL_THRESHOLD: 120,
  TEXTAREA_LINE_HEIGHT: 24,
  TEXTAREA_MAX_HEIGHT: 120,
  TEXTAREA_CHAR_THRESHOLD: 135,
  ERROR_MESSAGE_NOT_CONNECTED: 'Not connected to server. Please try again.',
} as const;

export interface Message {
  sessionId: string | undefined;
  clientMessageId?: string;
  question: string;
  aiResponse: string;
  timestamp?: string;
}

const Chat: React.FC = () => {
  // Hooks & Context
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isListening, supportsSTT, interimText, toggleMic, setOnFinalTranscript } =
    UseSpeechRecognition('en-IN');

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const messageCountRef = useRef<number>(0);
  const skipNextHistoryLoadRef = useRef(false);

  // State - UI & Content
  const [userText, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // State - Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(sessionId);

  // WebSocket & Message Handling Hooks
  const { handleWsEvent } = useMessageHandler({
    onSessionCreated: (newSessionId) => {
      setActiveSessionId(newSessionId);
      if (!sessionId || !sessionId.trim()) {
        skipNextHistoryLoadRef.current = true;
        clearChatSessionsCache();
        navigate(`/chat/${newSessionId}`, { replace: true });
      }
    },
    onStreamingStart: () => setIsStreaming(true),
    onStreamingEnd: () => {
      setIsStreaming(false);
      setIsTyping(false);
    },
  });

  const handleWsEventWrapper = useCallback(
    (event: TwinWebSocketEvent) => handleWsEvent(event, messages, setMessages),
    [handleWsEvent, messages]
  );

  const { sendChat, isConnected } = useWebSocket({
    onEvent: handleWsEventWrapper,
  });


  // Effects - Update active session when URL param changes
  useEffect(() => {
    setActiveSessionId(sessionId);
    setIsStreaming(false);
    setIsTyping(false);
  }, [sessionId]);


  // Effects - Resize textarea based on content
  const resizeTextarea = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (text.trim().length <= CONSTANTS.TEXTAREA_CHAR_THRESHOLD) return;

    textarea.style.height = `${CONSTANTS.TEXTAREA_LINE_HEIGHT}px`;
    textarea.style.height = `${Math.min(textarea.scrollHeight, CONSTANTS.TEXTAREA_MAX_HEIGHT)}px`;
  }, []);


  // Effects - Load initial chat history
  useEffect(() => {
    if (skipNextHistoryLoadRef.current) {
      skipNextHistoryLoadRef.current = false;
      return;
    }

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setPage(0);
        setHasMore(false);

        if (sessionId?.trim()) {
          const data = await getChatHistory(sessionId, 0, CONSTANTS.HISTORY_PAGE_SIZE);
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          setHasMore(!!data.hasMore);
        } else {
          setMessages([]);
        }

        messageCountRef.current = 0;
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chats');
        setMessages([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionId]);


  // Effects - Auto-scroll to latest messages
  useEffect(() => {
    if (messages.length === 0) return;

    if (messageCountRef.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    } else if (messages.length > messageCountRef.current && !isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    messageCountRef.current = messages.length;
  }, [messages, isLoadingMore]);


  // Callback - Load older messages when scrolled to top
  const handleLoadOlder = useCallback(async () => {
    if (!sessionId?.trim() || !hasMore || isLoadingMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    try {
      setIsLoadingMore(true);

      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;
      const nextPage = page + 1;

      const data = await getChatHistory(sessionId, nextPage, CONSTANTS.HISTORY_PAGE_SIZE);

      setMessages((prev) => {
        if (!Array.isArray(data.messages) || data.messages.length === 0) return prev;
        return [...data.messages, ...prev];
      });

      setPage(nextPage);
      setHasMore(!!data.hasMore);

      // Maintain scroll position after loading older messages
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const heightDiff = newScrollHeight - prevScrollHeight;
        container.scrollTop = prevScrollTop + heightDiff;
      });
    } catch (error) {
      console.error('Failed to load older messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionId, hasMore, isLoadingMore, page]);


  // Callback - Handle scroll event for infinite scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    if (container.scrollTop <= CONSTANTS.SCROLL_THRESHOLD) {
      handleLoadOlder();
    }
  }, [isLoadingMore, hasMore, handleLoadOlder]);

  // Callback - Handle message submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isTyping) return;

      const currentMessage = userText.trim();
      if (!currentMessage) return;

      setIsStreaming(false);
      const clientMessageId = generateClientMessageId();

      // Clear input and disable further submissions
      setUserText('');
      setIsTyping(true);
      resizeTextarea('');

      // Optimistically add message to UI
      setMessages((prev) => [
        ...prev,
        createOptimisticMessage(currentMessage, clientMessageId, activeSessionId),
      ]);

      const payload: TwinWsQuestionRequest = {
        sessionId: activeSessionId?.trim() ? activeSessionId : undefined,
        userQuestion: currentMessage,
        clientMessageId,
      };

      try {
        // Try WebSocket streaming first
        if (isConnected()) {
          setIsStreaming(true);
          sendChat(payload);
          return; // isTyping will be set to false on DONE/ERROR events
        }

        // Fallback: WebSocket not ready
        toast.error('Connection not ready. Please refresh and try again.');
        setIsStreaming(false);
        setIsTyping(false);

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = prev.slice();
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].clientMessageId === clientMessageId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              aiResponse: CONSTANTS.ERROR_MESSAGE_NOT_CONNECTED,
            };
          }
          return updated;
        });
      } catch (error) {
        console.error('Chat failed:', error);
        toast.error('Chat failed. Please try again.');

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = prev.slice();
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            aiResponse: CHATS.RESPONSE_FAILURE,
            timestamp: new Date().toISOString(),
          };
          return updated;
        });

        setIsStreaming(false);
        setIsTyping(false);
      }
    },
    [activeSessionId, isTyping, resizeTextarea, userText, isConnected, sendChat]
  );

  // Callbacks - Input handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.nativeEvent?.isComposing) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTextareaChange = useCallback(
    (value: string) => {
      setUserText(value);
      resizeTextarea(value);
    },
    [resizeTextarea]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      setUserText(question);
      if (textareaRef.current) {
        textareaRef.current.focus();
        resizeTextarea(question);
      }
    },
    [resizeTextarea]
  );

  // Effects - Handle speech-to-text final transcript
  useEffect(() => {
    setOnFinalTranscript((finalText) => {
      setUserText((prev) => {
        const updated = prev ? `${prev} ${finalText}` : finalText;
        resizeTextarea(updated);
        return updated;
      });
    });
  }, [resizeTextarea, setOnFinalTranscript]);

  // Memoized props for child components
  const messageListProps = useMemo(
    () => ({
      messages,
      isTyping,
      isStreaming,
      userEmail: user?.email ?? null,
      onSuggest: handleSuggestedQuestion,
      endRef: messagesEndRef,
    }),
    [messages, isTyping, isStreaming, user?.email, handleSuggestedQuestion]
  );

  const chatInputProps = useMemo(
    () => ({
      textareaRef,
      value: userText,
      interim: interimText,
      disabled: isTyping,
      onChange: handleTextareaChange,
      onKeyDown: handleKeyDown,
      onSubmit: handleSubmit,
      stt: {
        isListening,
        supportsSTT,
        toggleMic,
      },
    }),
    [userText, interimText, isTyping, handleTextareaChange, handleKeyDown, handleSubmit, isListening, supportsSTT, toggleMic]
  );

  // Render
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {CHATS.NAVBAR_HEADING}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {CHATS.NAVBAR_TITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="custom-scrollbar flex-1 px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <MessageList {...messageListProps} />
        )}
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <ChatInput {...chatInputProps} />
      </div>
    </div>
  );
};

export default Chat;
