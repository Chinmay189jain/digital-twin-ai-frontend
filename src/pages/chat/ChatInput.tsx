import React, { useMemo } from "react";
import { Send, Mic, MicOff } from "lucide-react";

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
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
  const displayValue = useMemo(() => value || interim, [value, interim]);

  return (
    <form onSubmit={onSubmit} className="w-full">
      {/* Only the pill — no outer strip */}
      <div
        className="
          w-full rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-md
          shadow-[0_10px_40px_rgba(0,0,0,0.35)]
          px-5 pt-4 pb-3
        "
      >
        {/* Text area (taller like your screenshot) */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your Digital Twin anything..."
          rows={1}
          disabled={disabled}
          className="
            w-full bg-transparent outline-none resize-none
            text-white text-[15px] md:text-[16px]
            leading-7
            placeholder:text-white/45
            disabled:opacity-50
            custom-scrollbar
          "
          style={{
            minHeight: "24px",
            maxHeight: "180px",
          }}
          aria-label="Message input"
        />

        {/* Bottom-right controls (mic + send) */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={stt.toggleMic}
            disabled={disabled || !stt.supportsSTT}
            className="
              h-10 w-10 rounded-full
              flex items-center justify-center
              text-white/60 hover:text-white/90
              hover:bg-white/5
              disabled:opacity-50
              transition
            "
            aria-pressed={stt.isListening}
            title={
              stt.supportsSTT
                ? stt.isListening
                  ? "Stop listening"
                  : "Start speaking"
                : "Speech recognition not supported"
            }
            aria-label={stt.isListening ? "Stop listening" : "Start speaking"}
          >
            {stt.isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <button
            type="submit"
            disabled={!displayValue.trim() || disabled}
            className="
              h-10 w-10 rounded-full
              bg-indigo-600 hover:bg-indigo-700
              text-white
              flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
              shadow-[0_8px_24px_rgba(79,70,229,0.35)]
            "
            aria-label="Send message"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional note line */}
      <div className="mt-3 text-center text-xs text-white/30">
        AI-generated responses
      </div>
    </form>
  );
};

export default ChatInput;
