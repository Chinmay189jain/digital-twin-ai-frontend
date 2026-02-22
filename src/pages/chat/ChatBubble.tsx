import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  isUser: boolean;
  content: string;
  userEmail?: string | null;
  showCursor?: boolean;
};

function ChatBubble({ isUser, content, showCursor }: Props) {
  // Markdown components with readable white text
  const mdComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-8 mb-4 text-white">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-8 mb-3 text-white">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl md:text-2xl font-semibold mt-6 mb-2 text-white">
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="text-[15px] md:text-[16px] leading-7 md:leading-8 my-3 text-gray-100">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 my-4 space-y-2 text-gray-100">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-100">{children}</ol>
    ),
    li: ({ children }: any) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-white/15 pl-4 my-5 italic text-gray-100">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="px-1.5 py-0.5 rounded-md text-sm border border-white/15 text-gray-100">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="p-4 rounded-xl overflow-auto border border-white/15 my-5 text-gray-100">
        {children}
      </pre>
    ),
    a: ({ href, children }: any) => (
      <a href={href} className="text-indigo-300 underline underline-offset-4">
        {children}
      </a>
    ),
  };

  // USER: text aligned right
  if (isUser) {
    return (
      <div className="w-full flex justify-end">
        <div className="max-w-[760px] w-full flex justify-end">
          <div className="px-6 py-4 rounded-2xl bg-white/10 border border-white/10 text-white">
            <p className="whitespace-pre-wrap text-[15px] md:text-[16px] leading-7">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AI: centered text
  return (
    <div className="w-full">
      <div className="max-w-[760px] mx-auto w-full">
        <article className="min-w-0 text-gray-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
            {content}
          </ReactMarkdown>

          {showCursor && (
            <span className="inline-block ml-1 w-2 h-5 animate-pulse bg-white/60 rounded-sm align-middle" />
          )}
        </article>
      </div>
    </div>
  );
}

export default React.memo(ChatBubble);
