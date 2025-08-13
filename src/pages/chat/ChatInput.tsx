import React from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

type STTControls = {
  isListening: boolean;
  supportsSTT: boolean;
  toggleMic: () => void;
};

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  interim: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: (e?: React.FormEvent) => void;
  stt: STTControls;
};

const ChatInput: React.FC<Props> = ({
  textareaRef,
  value,
  interim,
  disabled,
  onChange,
  onKeyDown,
  onSubmit,
  stt,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex items-center space-x-3">
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={value || interim /* show interim while speaking if main is empty */}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your Digital Twin anything..."
          rows={1}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
          style={{ minHeight: '48px', maxHeight: '120px' }}
          aria-label="Message input"
        />
      </div>

      {/* Mic Button */}
      <button
        type="button"
        onClick={stt.toggleMic}
        disabled={disabled || !stt.supportsSTT}
        title={stt.supportsSTT ? (stt.isListening ? 'Stop listening' : 'Start speaking') : 'Speech recognition not supported'}
        className={`p-3 rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0 disabled:opacity-50
          ${stt.isListening
            ? 'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-100 ring-2 ring-red-400'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}
        `}
        style={{ width: '48px', height: '48px' }}
        aria-pressed={stt.isListening}
        aria-label={stt.isListening ? 'Stop listening' : 'Start speaking'}
      >
        {stt.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0"
        style={{ width: '48px', height: '48px' }}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;
