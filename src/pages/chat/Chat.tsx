// src/pages/chat/Chat.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { useTwin } from '../../context/TwinContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getChatHistory, getAiResponse } from '../../api/chatApi';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { UseSpeechRecognition } from './UseSpeechRecognition';
import toast from 'react-hot-toast';

// Message type used across chat files
export interface Message {
  id?: string;
  question: string;
  aiResponse: string;
  timestamp?: string;
}

const Chat: React.FC = () => {
  // UI + data state
  const [usertext, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

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

  // parse timestamp safely for sorting
  const ts = (m: Message) => (m.timestamp ? Date.parse(m.timestamp) || 0 : 0);

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

  // Load chat history once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await getChatHistory();
        if (!mounted) return;

        // Ensure oldest → newest so latest renders at the bottom
        const sorted = Array.isArray(data)
          ? data.slice().sort((a: Message, b: Message) => ts(a) - ts(b))
          : [];

        setMessages(sorted);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chats');
        setMessages([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setMessages]);

  // Scroll to latest only when a new message is added 
  const prevCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

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
      question: currentMessage,
      aiResponse: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const data = await getAiResponse(currentMessage);

      // Update the last message with AI response
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.slice();
        const last = next.length - 1;
        next[last] = {
          ...next[last],
          aiResponse: data?.answer || 'No response received',
          timestamp: data?.timestamp || new Date().toISOString(),
        };
        return next; // order already oldest → newest
      });
    } catch (error) {
      console.error('Chat API failed:', error);
      toast.error('Chat failed. Please try again.');
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.slice();
        const last = next.length - 1;
        next[last] = {
          ...next[last],
          aiResponse: 'Sorry, I encountered an error. Please try again.',
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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Your Digital Twin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI assistant based on your personality profile</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900 [scrollbar-width:thin]">
        {isLoading && (
          <div className="flex items-center justify-center mt-100">
            <LoadingSpinner />
          </div>
        )}
        <MessageList
          messages={messages}
          isTyping={isTyping}
          userEmail={user?.email ?? null}
          onSuggest={handleSuggestedQuestion}
          endRef={messagesEndRef}
        />
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
