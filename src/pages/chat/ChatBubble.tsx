import React from 'react';
import { Bot } from 'lucide-react';

type ChatType = {
  isUser: boolean;
  content: string;
  userEmail?: string | null;
  showCursor?: boolean; 
};

function ChatBubble({ isUser, content, userEmail, showCursor }: ChatType) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-indigo-600 dark:bg-indigo-500'
                   : 'bg-gradient-to-r from-indigo-500 to-purple-600'
          }`}>
            {isUser ? (
              <span className="text-white font-medium text-sm">
                {userEmail?.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-2xl ${
            isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
          }`}>
            <p className="whitespace-pre-wrap">
              {content}
              {showCursor && (
                <span
                  className="inline-block align-baseline ml-1 w-2 h-5 animate-pulse bg-gray-400/70 rounded-sm"
                  aria-hidden="true"
                />
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to avoid re-rendering unchanged bubbles
export default React.memo(ChatBubble);
