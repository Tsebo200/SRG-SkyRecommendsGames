import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface GradientColorContextType {
  currentGradientColor: string;
  setGradientColor: (color: string) => void;
}

const GradientColorContext = createContext<GradientColorContextType | undefined>(undefined);

interface GradientColorProviderProps {
  children: ReactNode;
}

export function GradientColorProvider({ children }: GradientColorProviderProps) {
  const [currentGradientColor, setCurrentGradientColor] = useState<string>('#3B82F6'); // Default to blue

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentGradientColor,
    setGradientColor: setCurrentGradientColor,
  }), [currentGradientColor]);

  return (
    <GradientColorContext.Provider value={contextValue}>
      {children}
    </GradientColorContext.Provider>
  );
}

export function useGradientColor(): GradientColorContextType {
  const context = useContext(GradientColorContext);
  if (context === undefined) {
    throw new Error('useGradientColor must be used within a GradientColorProvider');
  }
  return context;
}

