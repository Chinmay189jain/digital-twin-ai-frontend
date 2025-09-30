// src/pages/chat/Chat.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getChatHistory, getChatResponse } from '../../api/chatApi';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { UseSpeechRecognition } from './UseSpeechRecognition';
import toast from 'react-hot-toast';
import { CHATS } from '../../constants/text';

// Message type used across chat files
export interface Message {
  sessionId: string | undefined;
  question: string;
  aiResponse: string;
  timestamp?: string;
}

const Chat: React.FC = () => {

  // Extract sessionId from the URL
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // UI + data state
  const [usertext, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  // animating the last AI message
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const textareaRef = useRef<HTMLTextAreaElement>(null!);

  const { user } = useAuth();

  // Speech-to-Text
  const {
    isListening,
    supportsSTT,
    interimText,
    toggleMic,
    setOnFinalTranscript,
  } = UseSpeechRecognition('en-IN');

  // Resize textarea 
  const resizeTextarea = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    if (text.trim().length <= 135) return;
    el.style.height = '24px'; // reset to recalc
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  // When STT produces final text, append it to the input and resize
  useEffect(() => {
    setOnFinalTranscript((finalText) => {
      setUserText((prev) => {
        const next = prev ? `${prev} ${finalText}` : finalText;
        resizeTextarea(next);
        return next;
      });
    });
  }, [resizeTextarea, setOnFinalTranscript]);

  // Load chat history for this session
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        if (sessionId && sessionId.trim()) {
          const data = await getChatHistory(sessionId);
          setMessages(Array.isArray(data) ? data : []);
        } else {
          // New chat: no history yet
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chats');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setMessages, sessionId]);

  // Scroll to latest only when a new message is added 
  const prevCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length === 0) return;

    if (prevCountRef.current === 0) {
      // first mount / navigation / refresh: jump
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    } else if (messages.length > prevCountRef.current) {
      // on new message: smooth
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // Typewriter animation for the last AI message
  // speedMs: delay per tick; step: chars revealed per tick
  const animateAiAnswer = useCallback((fullText: string, speedMs = 16, step = 2) => {
    setIsStreaming(true);
    let i = 0;

    const tick = () => {
      i = Math.min(i + step, fullText.length);

      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = prev.slice();
        const last = next.length - 1;
        next[last] = { ...next[last], aiResponse: fullText.slice(0, i) };
        return next;
      });

      if (i < fullText.length) {
        setTimeout(tick, speedMs);
      } else {
        setIsStreaming(false);
      }
    };

    tick();
  }, []);

  // Handlers
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTyping) return;

    const currentMessage = usertext.trim();
    if (!currentMessage) return;

    // Clear input immediately for snappy UX
    setUserText('');
    setIsTyping(true);
    resizeTextarea('');

    // Optimistic append of the user's message at the end
    const tempMessage: Message = {
      sessionId: sessionId,
      question: currentMessage,
      aiResponse: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const data = await getChatResponse(sessionId, currentMessage);

      // If a new session was created, update URL (no reload)
      if (!sessionId || !sessionId.trim()) {
        navigate(`/chat/${data.sessionId}`, { replace: true });
      }

      // Animate the last message's AI response (client-side typewriter)
      const answer = data?.aiResponse || 'No response received';
      animateAiAnswer(answer, 30, 2);

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

  // Enter to send; Shift+Enter for newline; ignore IME composition
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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{CHATS.NAVBAR_HEADING}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{CHATS.NAVBAR_TITLE}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900 [scrollbar-width:thin]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <MessageList
            messages={messages}
            isTyping={isTyping}
            isStreaming={isStreaming}   // show blinking cursor on last AI bubble
            userEmail={user?.email ?? null}
            onSuggest={handleSuggestedQuestion}
            endRef={messagesEndRef}
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
