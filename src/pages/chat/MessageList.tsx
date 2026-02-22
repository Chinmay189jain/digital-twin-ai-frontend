import React from "react";
import { Bot } from "lucide-react";
import ChatBubble from "./ChatBubble";
import type { Message } from "./Chat";
import { CHATS } from "../../constants/text";

type Props = {
  messages: Message[];
  isTyping: boolean;
  isStreaming: boolean;
  onSuggest: (q: string) => void;
  endRef: React.RefObject<HTMLDivElement>;
};

const MessageList: React.FC<Props> = ({
  messages,
  isTyping,
  isStreaming,
  onSuggest,
  endRef,
}) => {
  return (
    <div className="space-y-10">
      {/* Empty state (NO robot icon now) */}
      {messages.length === 0 && (
        <div className="text-center py-5">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {CHATS.HEADING}
          </h3>
          <p className="text-gray-300 mb-6">{CHATS.SUBHEADING}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[CHATS.QUESTION_1, CHATS.QUESTION_2, CHATS.QUESTION_3, CHATS.QUESTION_4].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => onSuggest(q)}
                  className="p-3 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-gray-100">{q}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, index) => {
        const key = msg.timestamp || `row-${index}`;
        const isLast = index === messages.length - 1;

        return (
          <div key={key} className="space-y-6">
            {msg.question?.trim() && (
              <ChatBubble isUser content={msg.question} />
            )}

            {msg.aiResponse !== undefined &&
              (msg.aiResponse.trim() !== "" || (isLast && isStreaming)) && (
                <ChatBubble
                  isUser={false}
                  content={msg.aiResponse}
                  showCursor={isLast && isStreaming}
                />
              )}
          </div>
        );
      })}

      {/* Typing dots (NO robot icon now) */}
      {isTyping && !isStreaming && (
        <div className="w-full">
          <div className="max-w-[760px] mx-auto w-full">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
              <span
                className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

export default MessageList;