import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

export const TwinGeneratingLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="mt-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Creating Your Digital Twin</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Our AI is analyzing your responses and building your unique personality profile...
        </p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export const ChatSessionSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
        <div>
          <div className="h-4 w-16 rounded bg-gray-300 dark:bg-gray-600 mb-1" />
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-600" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

export const ChatSessionSkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ChatSessionSkeleton key={i} />
    ))}
  </div>
);