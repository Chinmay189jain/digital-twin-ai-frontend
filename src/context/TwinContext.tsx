import React, { createContext, useContext, useState } from 'react';

interface TwinContextType {
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  profileSummary: string;
  setProfileSummary: React.Dispatch<React.SetStateAction<string>>;
}

const TwinContext = createContext<TwinContextType | undefined>(undefined);

// Creating a provider component that wraps all children and supplies them the context
export const TwinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [profileSummary, setProfileSummary] = useState<string>("");

  // Wrapping children with the context provider and supplying the values
  return (
    <TwinContext.Provider value={{ answers, setAnswers, profileSummary, setProfileSummary }}>
      {children}
    </TwinContext.Provider>
  );
};

export const useTwin = (): TwinContextType => {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error('useTwin must be used within a TwinProvider');
  }
  return context;
};
