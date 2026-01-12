import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { ColorThemeService, ColorTheme } from './color-themes';
import { useGradientColor } from './gradient-color-context';

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => Promise<boolean>;
  resetTheme: () => Promise<boolean>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(ColorThemeService.getCurrentTheme());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialTheme();
  }, []);

  const loadInitialTheme = async () => {
    try {
      setIsLoading(true);
      const theme = await ColorThemeService.loadSavedTheme();
      setCurrentTheme(theme);
      console.log('🎨 Loaded initial theme:', theme.name);
    } catch (error) {
      console.error('❌ Error loading initial theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeId: string): Promise<boolean> => {
    try {
      const success = await ColorThemeService.setCurrentTheme(themeId);
      if (success) {
        const newTheme = ColorThemeService.getCurrentTheme();
        setCurrentTheme(newTheme);
        console.log('🎨 Theme changed to:', newTheme.name);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error setting theme:', error);
      return false;
    }
  };

  const resetTheme = async (): Promise<boolean> => {
    try {
      const success = await ColorThemeService.resetToDefault();
      if (success) {
        const defaultTheme = ColorThemeService.getCurrentTheme();
        setCurrentTheme(defaultTheme);
        console.log('🎨 Theme reset to default:', defaultTheme.name);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error resetting theme:', error);
      return false;
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    resetTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get theme colours for styling
export function useThemeColors() {
  const { currentTheme } = useTheme();
  let gradientColor: string | null = null;
  
  try {
    const { currentGradientColor } = useGradientColor();
    gradientColor = currentGradientColor;
  } catch (e) {
    // GradientColorProvider not available, use theme colors only
  }

  // Memoize helper functions to prevent recreation on every render
  const hexToRgb = useCallback((hex: string) => {
    const cleaned = hex.replace('#', '');
    const bigint = parseInt(cleaned.length === 3
      ? cleaned.split('').map(c => c + c).join('')
      : cleaned, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }, []);

  const relativeLuminance = useCallback((hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r, g, b].map(v => v / 255).map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }, [hexToRgb]);

  const contrastRatio = useCallback((hex1: string, hex2: string) => {
    const L1 = relativeLuminance(hex1);
    const L2 = relativeLuminance(hex2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }, [relativeLuminance]);

  const pickAAContrast = useCallback((bg: string, preferredText: string) => {
    const AA = 4.5;
    // Try preferred color first
    if (contrastRatio(bg, preferredText) >= AA) return preferredText;
    // Try black or white fallbacks
    const black = '#000000';
    const white = '#FFFFFF';
    const blackRatio = contrastRatio(bg, black);
    const whiteRatio = contrastRatio(bg, white);
    return blackRatio >= whiteRatio ? (blackRatio >= AA ? black : blackRatio >= AA ? black : black) : (whiteRatio >= AA ? white : white);
  }, [contrastRatio]);

  // Memoize the returned colors object to prevent infinite loops
  // Use individual color values as dependencies instead of the whole colors object
  const colors = currentTheme.colors;
  
  // Create a stable dependency string from primitive values only
  const colorDeps = useMemo(() => {
    return `${colors.background}-${colors.text}-${colors.textSecondary}-${colors.primary}-${colors.button}-${colors.tabBarActive}-${colors.buttonText}-${colors.card}-${gradientColor || ''}`;
  }, [
    colors.background,
    colors.text,
    colors.textSecondary,
    colors.primary,
    colors.button,
    colors.tabBarActive,
    colors.buttonText,
    colors.card,
    gradientColor
  ]);
  
  return useMemo(() => {
    const adjustedText = pickAAContrast(colors.background, colors.text);
    const adjustedTextSecondary = pickAAContrast(colors.background, colors.textSecondary);
    
    // Use gradient color for primary/button colors if available, otherwise use theme colors
    const primaryColor = gradientColor || colors.primary;
    const buttonColor = gradientColor || colors.button;
    const tabBarActiveColor = gradientColor || colors.tabBarActive;
    
    const adjustedButtonText = pickAAContrast(buttonColor, colors.buttonText);
    const adjustedCardText = pickAAContrast(colors.card, adjustedText);

    return {
      ...colors,
      primary: primaryColor,
      button: buttonColor,
      tabBarActive: tabBarActiveColor,
      text: adjustedText,
      textSecondary: adjustedTextSecondary,
      buttonText: adjustedButtonText,
      // Provide a safe text color for cards when used directly on card backgrounds
      cardText: adjustedCardText,
    } as typeof currentTheme.colors & { cardText: string };
  }, [colorDeps, pickAAContrast]);
}

// Hook to check if current theme is dark
export function useIsDarkTheme(): boolean {
  const { currentTheme } = useTheme();
  return currentTheme.isDark;
}

// Hook to check if current theme is high contrast
export function useIsHighContrast(): boolean {
  const { currentTheme } = useTheme();
  return currentTheme.isHighContrast;
}
