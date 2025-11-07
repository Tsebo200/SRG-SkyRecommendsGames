import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  return (
    <GradientColorContext.Provider value={{ currentGradientColor, setGradientColor: setCurrentGradientColor }}>
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

