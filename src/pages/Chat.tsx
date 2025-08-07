import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Bot, User } from 'lucide-react';
import { useTwin } from '../context/TwinContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getChatHistory, getAiResponse } from '../api/chatApi';
import toast from 'react-hot-toast';

// Define the message type based on your API response
interface Message {
  id?: string;
  question: string;
  aiResponse: string;
  timestamp?: string;
}

const Chat: React.FC = () => {
  const [usertext, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, setMessages } = useTwin();
  const { user } = useAuth();

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getChatHistory();
        if (data && Array.isArray(data)) {
          setMessages(data);
        } else {
          console.log("No previous chat history found");
          setMessages([]);
        }
      } catch (error: any) {
        toast.error("Failed to load chat history");
        console.error("Failed to load chat history:", error);
        setMessages([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [setMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!usertext.trim() || isTyping) return;

      const currentMessage = usertext.trim();
      setUserText('');
      setIsTyping(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '24px';
      }

      // Create a temporary message object to show user's message immediately
      const tempMessage: Message = {
        question: currentMessage,
        aiResponse: '', // Will be filled when AI responds
        timestamp: new Date().toISOString(),
      };

      // Add user message to the chat immediately (optimistic update)
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Call AI API to get response
      const data = await getAiResponse(currentMessage);

      if (data) {
        // Update the last message with AI response
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastIndex = updatedMessages.length - 1;
          if (lastIndex >= 0) {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              aiResponse: data.answer || 'No response received',
              timestamp: data.timestamp || new Date().toISOString(),
            };
          }
          return updatedMessages;
        });
      } else {
        // If API fails, remove the temporary message or update with error
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastIndex = updatedMessages.length - 1;
          if (lastIndex >= 0) {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              aiResponse: 'Sorry, I encountered an error. Please try again.',
              timestamp: new Date().toISOString()
            };
          }
          return updatedMessages;
        });
        toast.error("Failed to get AI response");
      }

    } catch (error: any) {
      toast.error("Chat failed. Please try again.");
      console.error("Chat API failed:", error);

      // Update the last message with error message
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastIndex = updatedMessages.length - 1;
        if (lastIndex >= 0) {
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            aiResponse: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toISOString()
          };
        }
        return updatedMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const userInput = e.target.value;
    setUserText(userInput);

    // Auto-resize textarea
    const textarea = e.target;
    if (userInput.length > 135) {
      textarea.style.height = '24px';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  const handleSuggestedQuestion = useCallback((question: string) => {
    setUserText(question);
    // Auto-focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Show loading spinner while loading chat history
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

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
              Your Digital Twin
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI assistant based on your personality profile
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900 [scrollbar-width:thin]">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation with your Digital Twin
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Ask anything - your twin knows your personality and can provide personalized advice.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => handleSuggestedQuestion("What should I focus on for personal growth?")}
                className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  What should I focus on for personal growth?
                </span>
              </button>
              <button
                onClick={() => handleSuggestedQuestion("How can I improve my work-life balance?")}
                className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  How can I improve my work-life balance?
                </span>
              </button>
              <button
                onClick={() => handleSuggestedQuestion("What career advice would you give me?")}
                className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  What career advice would you give me?
                </span>
              </button>
              <button
                onClick={() => handleSuggestedQuestion("Help me make a difficult decision")}
                className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  Help me make a difficult decision
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => {
          const ts = msg.timestamp ?? msg.timestamp;
          const keyBase = ts ?? `row-${index}`;

          return (
            <React.Fragment key={keyBase}>
              {/* User Message - only render if question exists and is not empty */}
              {msg.question?.trim() && (
                <ChatBubble
                  isUser
                  content={msg.question}
                  userEmail={user?.email ?? null}
                />
              )}
              {/* AI Response - only render if response exists and is not empty */}
              {msg.aiResponse?.trim() && (
                <ChatBubble
                  isUser={false}
                  content={msg.aiResponse}
                  userEmail={user?.email ?? null}
                />
              )}
            </React.Fragment>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex max-w-3xl space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={usertext}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask your Digital Twin anything..."
              rows={1}
              disabled={isTyping}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Mic Button */}
          <button
            type="button"
            disabled={isTyping}
            className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            style={{ width: '48px', height: '48px' }}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!usertext.trim() || isTyping}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0"
            style={{ width: '48px', height: '48px' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
}

interface ChatType {
  isUser: boolean;
  content: string;
  userEmail?: string | null;
}

// Chat helper for user and ai response styling
function ChatBubble({ isUser, content, userEmail }: ChatType) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-3xl ${isUser ? "flex-row-reverse" : "flex-row"
          } space-x-3`}
      >
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser
              ? "bg-indigo-600 dark:bg-indigo-500"
              : "bg-gradient-to-r from-indigo-500 to-purple-600"
              }`}
          >
            {isUser ? (
              <span className="text-white font-medium text-sm">
                {userEmail?.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-2 rounded-2xl ${isUser
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
              }`}
          >
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;