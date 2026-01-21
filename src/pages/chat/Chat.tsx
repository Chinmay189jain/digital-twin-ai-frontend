import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getChatHistory, getChatResponse, clearChatSessionsCache } from '../../api/chatApi';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { UseSpeechRecognition } from './UseSpeechRecognition';
import toast from 'react-hot-toast';
import { CHATS } from '../../constants/text';

export interface Message {
  sessionId: string | undefined;
  question: string;
  aiResponse: string;
  timestamp?: string;
}

const Chat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [usertext, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const textareaRef = useRef<HTMLTextAreaElement>(null!);

  const { user } = useAuth();

  const { isListening, supportsSTT, interimText, toggleMic, setOnFinalTranscript } = UseSpeechRecognition('en-IN');

  const resizeTextarea = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    if (text.trim().length <= 135) return;
    el.style.height = '24px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  useEffect(() => {
    setOnFinalTranscript((finalText) => {
      setUserText((prev) => {
        const next = prev ? `${prev} ${finalText}` : finalText;
        resizeTextarea(next);
        return next;
      });
    });
  }, [resizeTextarea, setOnFinalTranscript]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setPage(0);
        setHasMore(false);

        if (sessionId && sessionId.trim()) {
          const data = await getChatHistory(sessionId, 0, 30);
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          setHasMore(!!data.hasMore);
        } else {
          setMessages([]);
          setHasMore(false);
        }

        prevCountRef.current = 0;
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chats');
        setMessages([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [sessionId]);

  const prevCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length === 0) return;

    if (prevCountRef.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    } else if (messages.length > prevCountRef.current && !isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    prevCountRef.current = messages.length;
  }, [messages, isLoadingMore]);

  const handleLoadOlder = useCallback(async () => {
    if (!sessionId || !sessionId.trim() || !hasMore || isLoadingMore) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    try {
      setIsLoadingMore(true);

      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      const nextPage = page + 1;
      const data = await getChatHistory(sessionId, nextPage, 30);

      setMessages(prev => {
        if (!Array.isArray(data.messages) || data.messages.length === 0) return prev;
        return [...data.messages, ...prev];
      });

      setPage(nextPage);
      setHasMore(!!data.hasMore);

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

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    const THRESHOLD = 120;
    if (container.scrollTop <= THRESHOLD) {
      handleLoadOlder();
    }
  }, [isLoadingMore, hasMore, handleLoadOlder]);

  const handleStreamDone = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTyping) return;

    const currentMessage = usertext.trim();
    if (!currentMessage) return;

    // stop any previous typewriter
    setIsStreaming(false);

    setUserText('');
    setIsTyping(true);
    resizeTextarea('');

    const tempMessage: Message = {
      sessionId: sessionId,
      question: currentMessage,
      aiResponse: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const data = await getChatResponse(sessionId, currentMessage);

      if (!sessionId || !sessionId.trim()) {
        clearChatSessionsCache();
        navigate(`/chat/${data.sessionId}`, { replace: true });
      }

      const answer = data?.aiResponse || 'No response received';

      // Put FULL answer in state, but ChatBubble will animate it without flashing
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = prev.slice();
        const last = next.length - 1;
        next[last] = {
          ...next[last],
          sessionId: data?.sessionId ?? next[last].sessionId,
          aiResponse: answer,
        };
        return next;
      });

      setIsStreaming(true);
    } catch (error) {
      console.error('Chat API failed:', error);
      toast.error('Chat failed. Please try again.');

      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = prev.slice();
        const last = next.length - 1;
        next[last] = {
          ...next[last],
          aiResponse: CHATS.RESPONSE_FAILURE,
          timestamp: new Date().toISOString(),
        };
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent?.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
          <MessageList
            messages={messages}
            isTyping={isTyping}
            isStreaming={isStreaming}
            userEmail={user?.email ?? null}
            onSuggest={handleSuggestedQuestion}
            endRef={messagesEndRef}
            onStreamDone={handleStreamDone} 
          />
        )}
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <ChatInput
          textareaRef={textareaRef}
          value={usertext}
          interim={interimText}
          disabled={isTyping}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          stt={{
            isListening,
            supportsSTT,
            toggleMic,
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
