import React from "react";
import { Bot } from "lucide-react";
import ChatBubble from "./ChatBubble";
import type { Message } from "./Chat";
import { CHATS } from "../../constants/text";

type Props = {
  messages: Message[];
  isTyping: boolean;
  isStreaming: boolean;
  userEmail: string | null;
  onSuggest: (q: string) => void;
  endRef: React.RefObject<HTMLDivElement>;
};

const MessageList: React.FC<Props> = ({
  messages,
  isTyping,
  isStreaming,
  userEmail,
  onSuggest,
  endRef,
}) => {
  return (
    <>
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {CHATS.HEADING}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{CHATS.SUBHEADING}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[CHATS.QUESTION_1, CHATS.QUESTION_2, CHATS.QUESTION_3, CHATS.QUESTION_4].map((q) => (
              <button
                key={q}
                onClick={() => onSuggest(q)}
                className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-900 dark:text-white">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, index) => {
        const key = msg.timestamp || `row-${index}`;
        const isLast = index === messages.length - 1;

        return (
          <React.Fragment key={key}>
            {msg.question?.trim() && (
              <ChatBubble isUser content={msg.question} userEmail={userEmail} />
            )}

            {(msg.aiResponse !== undefined &&
              (msg.aiResponse.trim() !== "" || (isLast && isStreaming))) && (
              <ChatBubble
                isUser={false}
                content={msg.aiResponse}
                userEmail={userEmail}
                showCursor={isLast && isStreaming}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* show dots only when NOT streaming */}
      {isTyping && !isStreaming && (
        <div className="flex justify-start">
          <div className="flex max-w-3xl space-x-3 items-end">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex space-x-2">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </>
  );
};

export default MessageList;
