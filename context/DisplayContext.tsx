'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DisplayMode = 'card' | 'list';

interface DisplayContextType {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('displayMode') as DisplayMode;
    if (saved && (saved === 'card' || saved === 'list')) {
      setDisplayMode(saved);
    }
  }, []);

  const handleSetDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem('displayMode', mode);
  };

  return (
    <DisplayContext.Provider value={{ displayMode, setDisplayMode: handleSetDisplayMode }}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (context === undefined) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
}

