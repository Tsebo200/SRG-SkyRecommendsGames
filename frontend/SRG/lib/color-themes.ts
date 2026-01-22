import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    card: string;
    button: string;
    buttonText: string;
    tabBar: string;
    tabBarActive: string;
    tabBarInactive: string;
  };
  isDark: boolean;
  isHighContrast: boolean;
  accessibility: {
    protanomaly: boolean;
    deuteranomaly: boolean;
    tritanomaly: boolean;
  };
}

export interface ThemeMode {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
}

export interface AccessibilityTheme {
  id: string;
  name: string;
  description: string;
  lightColors: ColorTheme['colors'];
  darkColors: ColorTheme['colors'];
  accessibility: {
    protanomaly: boolean;
    deuteranomaly: boolean;
    tritanomaly: boolean;
  };
}

// Theme modes (Light/Dark)
export const THEME_MODES: ThemeMode[] = [
  {
    id: 'light',
    name: 'Light Mode',
    description: 'Clean and bright interface',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes in low light',
    isDark: true,
  },
];

// Accessibility themes with both light and dark variants
export const ACCESSIBILITY_THEMES: AccessibilityTheme[] = [
  {
    id: 'black-yellow',
    name: 'Black & Yellow',
    description: 'High-impact black and yellow gaming theme',
    lightColors: {
      primary: '#FACC15',        // Yellow - primary
      secondary: '#EAB308',      // Darker yellow - secondary
      background: '#020617',     // Nearly black - background
      surface: '#111827',        // Dark surface
      text: '#F9FAFB',           // Very light text
      textSecondary: '#E5E7EB',  // Light gray text
      accent: '#FACC15',         // Yellow accents
      success: '#22C55E',        // Green success
      warning: '#F97316',        // Orange warning
      error: '#EF4444',          // Red error
      border: '#27272A',         // Dark border
      card: '#111827',           // Card background
      button: '#FACC15',         // Yellow button
      buttonText: '#020617',     // Dark button text
      tabBar: '#020617',         // Tab bar background
      tabBarActive: '#FACC15',   // Active tab yellow
      tabBarInactive: '#6B7280', // Inactive gray
    },
    darkColors: {
      primary: '#FACC15',        // Yellow - primary
      secondary: '#EAB308',      // Darker yellow
      background: '#000000',     // True black background
      surface: '#020617',        // Almost black surface
      text: '#F9FAFB',           // Very light text
      textSecondary: '#D1D5DB',  // Light gray
      accent: '#FACC15',         // Yellow accents
      success: '#22C55E',        // Green success
      warning: '#F97316',        // Orange warning
      error: '#EF4444',          // Red error
      border: '#27272A',         // Dark border
      card: '#020617',           // Card background
      button: '#FACC15',         // Yellow button
      buttonText: '#000000',     // Black button text
      tabBar: '#000000',         // Tab bar background
      tabBarActive: '#FACC15',   // Active tab yellow
      tabBarInactive: '#6B7280', // Inactive gray
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'gradient-motion',
    name: 'Gradient Motion',
    description: 'Dynamic gradient colour scheme with motion effects',
    lightColors: {
      primary: '#6366F1',        // Indigo - main brand color (vibrant)
      secondary: '#8B5CF6',       // Purple - secondary actions
      background: '#F0F4FF',     // Light blue-purple gradient base
      surface: '#E8EDFF',         // Soft purple-blue - cards/surfaces
      text: '#1E293B',            // Dark slate - primary text
      textSecondary: '#64748B',  // Slate gray - secondary text
      accent: '#EC4899',          // Pink - accents/highlights
      success: '#10B981',         // Emerald green - success states
      warning: '#F59E0B',         // Amber - warnings
      error: '#EF4444',           // Red - errors
      border: '#C7D2FE',          // Light indigo - borders
      card: '#E8EDFF',            // Soft purple-blue - card backgrounds
      button: '#6366F1',          // Indigo - primary buttons
      buttonText: '#FFFFFF',      // White - button text
      tabBar: '#F0F4FF',          // Light blue-purple gradient - tab bar background
      tabBarActive: '#6366F1',    // Indigo - active tab
      tabBarInactive: '#A5B4FC', // Light indigo-purple - inactive tabs
    },
    darkColors: {
      primary: '#818CF8',         // Light indigo - main brand (lighter for dark mode)
      secondary: '#A78BFA',       // Light purple - secondary actions
      background: '#0F172A',      // Dark slate - main background
      surface: '#1E293B',         // Slate - cards/surfaces
      text: '#F1F5F9',            // Light slate - primary text
      textSecondary: '#CBD5E1',  // Slate - secondary text
      accent: '#F472B6',          // Light pink - accents/highlights
      success: '#34D399',         // Light emerald - success states
      warning: '#FBBF24',         // Light amber - warnings
      error: '#F87171',           // Light red - errors
      border: '#334155',          // Dark slate - borders
      card: '#1E293B',            // Slate - card backgrounds
      button: '#818CF8',          // Light indigo - primary buttons
      buttonText: '#0F172A',      // Dark slate - button text
      tabBar: '#1E293B',          // Slate - tab bar
      tabBarActive: '#818CF8',    // Light indigo - active tab
      tabBarInactive: '#475569',  // Dark slate - inactive tabs
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'blue-gradient',
    name: 'Blue Gradient',
    description: 'Beautiful cyan-blue gradient colour scheme',
    lightColors: {
      primary: '#06B6D4',        // Cyan - main brand color (vibrant)
      secondary: '#3B82F6',       // Blue - secondary actions
      background: '#F0F9FF',     // Light cyan-blue gradient base
      surface: '#E0F2FE',         // Soft cyan-blue - cards/surfaces
      text: '#0C4A6E',            // Dark cyan-blue - primary text
      textSecondary: '#075985',  // Medium cyan-blue - secondary text
      accent: '#06B6D4',          // Cyan - accents/highlights
      success: '#10B981',         // Emerald green - success states
      warning: '#F59E0B',         // Amber - warnings
      error: '#EF4444',           // Red - errors
      border: '#7DD3FC',          // Light cyan - borders
      card: '#E0F2FE',            // Soft cyan-blue - card backgrounds
      button: '#06B6D4',          // Cyan - primary buttons
      buttonText: '#FFFFFF',      // White - button text
      tabBar: '#F0F9FF',          // Light cyan-blue gradient - tab bar background
      tabBarActive: '#06B6D4',    // Cyan - active tab
      tabBarInactive: '#7DD3FC', // Light cyan - inactive tabs
    },
    darkColors: {
      primary: '#22D3EE',         // Light cyan - main brand (lighter for dark mode)
      secondary: '#60A5FA',       // Light blue - secondary actions
      background: '#0C1222',      // Dark cyan-blue - main background
      surface: '#1E3A5F',         // Dark cyan-blue - cards/surfaces
      text: '#E0F2FE',            // Light cyan-blue - primary text
      textSecondary: '#BAE6FD',  // Light cyan - secondary text
      accent: '#22D3EE',          // Light cyan - accents/highlights
      success: '#34D399',         // Light emerald - success states
      warning: '#FBBF24',         // Light amber - warnings
      error: '#F87171',           // Light red - errors
      border: '#1E40AF',          // Dark blue - borders
      card: '#1E3A5F',            // Dark cyan-blue - card backgrounds
      button: '#22D3EE',          // Light cyan - primary buttons
      buttonText: '#0C1222',      // Dark cyan-blue - button text
      tabBar: '#1E3A5F',          // Dark cyan-blue - tab bar
      tabBarActive: '#22D3EE',    // Light cyan - active tab
      tabBarInactive: '#3B82F6',  // Medium blue - inactive tabs
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'custom-nature',
    name: 'Nature Palette',
    description: 'Custom nature-inspired colour scheme',
    lightColors: {
      primary: '#2c7083',        // Teal blue - main brand color
      secondary: '#7bb4bd',       // Light blue - secondary actions
      background: '#f1d9bd',      // Cream - main background
      surface: '#dfe8f1',         // Light blue-gray - cards/surfaces
      text: '#413d3e',            // Dark gray - primary text
      textSecondary: '#87695f',   // Warm brown - secondary text
      accent: '#dba879',          // Golden brown - accents/highlights
      success: '#01a161',         // Green - success states
      warning: '#dba879',         // Golden brown - warnings
      error: '#87695f',           // Warm brown - errors (softer than red)
      border: '#7bb4bd',          // Light blue - borders
      card: '#dfe8f1',            // Light blue-gray - card backgrounds
      button: '#2c7083',          // Teal blue - primary buttons
      buttonText: '#f1d9bd',       // Cream - button text
      tabBar: '#f8f9fa',          // Light gray - tab bar (higher contrast)
      tabBarActive: '#413d3e',     // Dark gray - active tab (dark gray)
      tabBarInactive: '#dba879',   // Light brown - inactive tabs (light brown)
    },
    darkColors: {
      primary: '#7bb4bd',         // Light blue - main brand (lighter for dark mode)
      secondary: '#2c7083',       // Teal blue - secondary actions
      background: '#413d3e',       // Dark gray - main background
      surface: '#87695f',          // Warm brown - cards/surfaces
      text: '#f1d9bd',             // Cream - primary text
      textSecondary: '#dfe8f1',    // Light blue-gray - secondary text
      accent: '#dba879',           // Golden brown - accents/highlights
      success: '#01a161',         // Green - success states
      warning: '#dba879',         // Golden brown - warnings
      error: '#dba879',           // Golden brown - errors (softer)
      border: '#87695f',           // Warm brown - borders
      card: '#87695f',             // Warm brown - card backgrounds
      button: '#7bb4bd',          // Light blue - primary buttons
      buttonText: '#413d3e',       // Dark gray - button text
      tabBar: '#413d3e',          // Dark gray - tab bar
      tabBarActive: '#7bb4bd',    // Light blue - active tab
      tabBarInactive: '#87695f',  // Warm brown - inactive tabs
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Default colour scheme',
    lightColors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      textSecondary: '#6D6D70',
      accent: '#FF9500',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      border: '#C6C6C8',
      card: '#FFFFFF',
      button: '#007AFF',
      buttonText: '#FFFFFF',
      tabBar: '#B0B0B0',          // Light gray - tab bar background
      tabBarActive: '#007AFF',     // Blue - active tab (primary color)
      tabBarInactive: '#F8F9FA',   // Very light gray - inactive tabs
    },
    darkColors: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#000000',
      surface: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      accent: '#FF9F0A',
      success: '#30D158',
      warning: '#FF9F0A',
      error: '#FF453A',
      border: '#2C2C2E',
      card: '#1C1C1E',
      button: '#0A84FF',
      buttonText: '#FFFFFF',
      tabBar: '#1C1C1E',
      tabBarActive: '#0A84FF',
      tabBarInactive: '#8E8E93',
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for better visibility',
    lightColors: {
      primary: '#000000',
      secondary: '#000000',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#000000',
      accent: '#000000',
      success: '#000000',
      warning: '#000000',
      error: '#000000',
      border: '#000000',
      card: '#FFFFFF',
      button: '#000000',
      buttonText: '#FFFFFF',
      tabBar: '#DDDDDD', // Light gray background for better contrast
      tabBarActive: '#000000',     // Black - active tab for maximum visibility on light bg
      tabBarInactive: '#666666',   // Dark gray - dimmer inactive for reduced prominence
    },
    darkColors: {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      background: '#000000',
      surface: '#000000',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      accent: '#FFFFFF',
      success: '#FFFFFF',
      warning: '#FFFFFF',
      error: '#FFFFFF',
      border: '#FFFFFF',
      card: '#000000',
      button: '#FFFFFF',
      buttonText: '#000000',
      tabBar: '#000000',
      tabBarActive: '#FFFFFF',
      tabBarInactive: '#555555',   // Darker gray - dimmer inactive on dark bg
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'protanomaly',
    name: 'Protanomaly ',
    description: 'Optimised for red-green colour mode',
    lightColors: {
      primary: '#0066CC',
      secondary: '#4A90E2',
      background: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#1A1A1A',
      textSecondary: '#4A4A4A',
      accent: '#FF6B35',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      border: '#DEE2E6',
      card: '#FFFFFF',
      button: '#0066CC',
      buttonText: '#FFFFFF',
      tabBar: '#B0B0B0',          // Light gray - tab bar background
      tabBarActive: '#0066CC',     // Blue - active tab (primary color)
      tabBarInactive: '#F8F9FA',   // Very light gray - inactive tabs
    },
    darkColors: {
      primary: '#4A90E2',
      secondary: '#0066CC',
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      accent: '#FF6B35',
      success: '#28A745',
      warning: '#FFC107',
      error: '#4A90E2', // Blue to match theme
      border: '#333333',
      card: '#1A1A1A',
      button: '#4A90E2',
      buttonText: '#FFFFFF',
      tabBar: '#1A1A1A',
      tabBarActive: '#4A90E2',
      tabBarInactive: '#666666',
    },
    accessibility: {
      protanomaly: true,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'deuteranomaly',
    name: 'Deuteranomaly',
    description: 'Optimised for green-red colour mode',
    lightColors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      background: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#1A1A1A',
      textSecondary: '#4A4A4A',
      accent: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#DEE2E6',
      card: '#FFFFFF',
      button: '#8B5CF6',
      buttonText: '#FFFFFF',
      tabBar: '#B0B0B0',          // Light gray - tab bar background
      tabBarActive: '#8B5CF6',     // Purple - active tab (primary color)
      tabBarInactive: '#F8F9FA',   // Very light gray - inactive tabs
    },
    darkColors: {
      primary: '#A78BFA',
      secondary: '#8B5CF6',
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      accent: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#A78BFA', // Purple to match theme
      border: '#333333',
      card: '#1A1A1A',
      button: '#A78BFA',
      buttonText: '#FFFFFF',
      tabBar: '#1A1A1A',
      tabBarActive: '#A78BFA',
      tabBarInactive: '#666666',
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: true,
      tritanomaly: false,
    },
  },
  {
    id: 'tritanomaly',
    name: 'Tritanomaly',
    description: 'Optimised for blue-yellow colour mode',
    lightColors: {
      primary: '#DC2626',
      secondary: '#EF4444',
      background: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#1A1A1A',
      textSecondary: '#4A4A4A',
      accent: '#059669',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#DEE2E6',
      card: '#FFFFFF',
      button: '#DC2626',
      buttonText: '#FFFFFF',
      tabBar: '#B0B0B0',          // Light gray - tab bar background
      tabBarActive: '#DC2626',     // Red - active tab (primary color)
      tabBarInactive: '#F8F9FA',   // Very light gray - inactive tabs
    },
    darkColors: {
      primary: '#EF4444',
      secondary: '#DC2626',
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      accent: '#059669',
      success: '#059669',
      warning: '#D97706',
      error: '#EF4444',
      border: '#333333',
      card: '#1A1A1A',
      button: '#EF4444',
      buttonText: '#FFFFFF',
      tabBar: '#1A1A1A',
      tabBarActive: '#EF4444',
      tabBarInactive: '#666666',
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: true,
    },
  },
  {
    id: 'steam-theme',
    name: 'Steam Gaming',
    description: 'Steam-inspired gaming interface with blue accents',
    lightColors: {
      primary: '#007AFF',           // Steam blue - main brand color
      secondary: '#5E5CE6',         // Purple - secondary actions
      background: '#f5f5f5',        // Light gray - main background (Steam style)
      surface: '#ffffff',           // White - cards/surfaces
      text: '#333333',              // Dark gray - primary text
      textSecondary: '#666666',     // Medium gray - secondary text
      accent: '#007AFF',            // Steam blue - accents/highlights
      success: '#01a161',           // Green - success states
      warning: '#dba879',           // Golden brown - warnings
      error: '#ff6b6b',             // Red - errors
      border: '#e0e0e0',            // Light gray - borders
      card: '#ffffff',              // White - card backgrounds
      button: '#007AFF',             // Steam blue - primary buttons
      buttonText: '#ffffff',        // White - button text
      tabBar: '#f8f9fa',            // Light gray - tab bar background
      tabBarActive: '#007AFF',       // Steam blue - active tab
      tabBarInactive: '#999999',     // Gray - inactive tabs
    },
    darkColors: {
      primary: '#007AFF',           // Steam blue - main brand
      secondary: '#5E5CE6',         // Purple - secondary actions
      background: '#1a1a1a',        // Dark gray - main background
      surface: '#2a2a2a',           // Darker gray - cards/surfaces
      text: '#ffffff',               // White - primary text
      textSecondary: '#cccccc',      // Light gray - secondary text
      accent: '#007AFF',             // Steam blue - accents/highlights
      success: '#01a161',            // Green - success states
      warning: '#dba879',            // Golden brown - warnings
      error: '#ff6b6b',              // Red - errors
      border: '#404040',             // Dark gray - borders
      card: '#2a2a2a',               // Dark gray - card backgrounds
      button: '#007AFF',             // Steam blue - primary buttons
      buttonText: '#ffffff',        // White - button text
      tabBar: '#1a1a1a',             // Dark gray - tab bar
      tabBarActive: '#007AFF',       // Steam blue - active tab
      tabBarInactive: '#666666',     // Medium gray - inactive tabs
    },
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
];

// Legacy support - convert to new structure
export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'light',
    name: 'Light Theme',
    description: 'Clean and bright interface',
    colors: ACCESSIBILITY_THEMES[0].lightColors,
    isDark: false,
    isHighContrast: false,
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Easy on the eyes in low light',
    colors: ACCESSIBILITY_THEMES[0].darkColors,
    isDark: true,
    isHighContrast: false,
    accessibility: {
      protanomaly: false,
      deuteranomaly: false,
      tritanomaly: false,
    },
  },
];

export class ColorThemeService {
  private static readonly THEME_MODE_KEY = 'selected_theme_mode';
  private static readonly ACCESSIBILITY_THEME_KEY = 'selected_accessibility_theme';
  private static currentThemeMode: ThemeMode = THEME_MODES[1]; // Default to dark
  private static currentAccessibilityTheme: AccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Default to black & yellow

  /**
   * Get all available theme modes (Light/Dark)
   */
  static getAvailableThemeModes(): ThemeMode[] {
    return THEME_MODES;
  }

  /**
   * Get all available accessibility themes
   */
  static getAvailableAccessibilityThemes(): AccessibilityTheme[] {
    return ACCESSIBILITY_THEMES;
  }

  /**
   * Get theme mode by ID
   */
  static getThemeModeById(id: string): ThemeMode | undefined {
    return THEME_MODES.find(mode => mode.id === id);
  }

  /**
   * Get accessibility theme by ID
   */
  static getAccessibilityThemeById(id: string): AccessibilityTheme | undefined {
    return ACCESSIBILITY_THEMES.find(theme => theme.id === id);
  }

  /**
   * Get current theme mode
   */
  static getCurrentThemeMode(): ThemeMode {
    return this.currentThemeMode;
  }

  /**
   * Get current accessibility theme
   */
  static getCurrentAccessibilityTheme(): AccessibilityTheme {
    return this.currentAccessibilityTheme;
  }

  /**
   * Set theme mode (Light/Dark)
   */
  static async setThemeMode(modeId: string): Promise<boolean> {
    try {
      const mode = this.getThemeModeById(modeId);
      if (!mode) {
        console.error('❌ Theme mode not found:', modeId);
        return false;
      }

      this.currentThemeMode = mode;
      await AsyncStorage.setItem(this.THEME_MODE_KEY, modeId);
      console.log('✅ Theme mode set successfully:', mode.name);
      return true;
    } catch (error) {
      console.error('❌ Error setting theme mode:', error);
      return false;
    }
  }

  /**
   * Set accessibility theme
   */
  static async setAccessibilityTheme(themeId: string): Promise<boolean> {
    try {
      const theme = this.getAccessibilityThemeById(themeId);
      if (!theme) {
        console.error('❌ Accessibility theme not found:', themeId);
        return false;
      }

      this.currentAccessibilityTheme = theme;
      await AsyncStorage.setItem(this.ACCESSIBILITY_THEME_KEY, themeId);
      console.log('✅ Accessibility theme set successfully:', theme.name);
      return true;
    } catch (error) {
      console.error('❌ Error setting accessibility theme:', error);
      return false;
    }
  }

  /**
   * Load saved theme settings from storage
   */
  static async loadSavedThemeSettings(): Promise<{ mode: ThemeMode; accessibility: AccessibilityTheme }> {
    try {
      const savedModeId = await AsyncStorage.getItem(this.THEME_MODE_KEY);
      const savedAccessibilityId = await AsyncStorage.getItem(this.ACCESSIBILITY_THEME_KEY);

      if (savedModeId) {
        const mode = this.getThemeModeById(savedModeId);
        if (mode) {
          this.currentThemeMode = mode;
        }
      }

      if (savedAccessibilityId) {
        const theme = this.getAccessibilityThemeById(savedAccessibilityId);
        if (theme) {
          this.currentAccessibilityTheme = theme;
        }
      }

      console.log('✅ Loaded saved theme settings:', {
        mode: this.currentThemeMode.name,
        accessibility: this.currentAccessibilityTheme.name
      });

      return {
        mode: this.currentThemeMode,
        accessibility: this.currentAccessibilityTheme
      };
    } catch (error) {
      console.error('❌ Error loading saved theme settings:', error);
      return {
        mode: this.currentThemeMode,
        accessibility: this.currentAccessibilityTheme
      };
    }
  }

  /**
   * Reset to default theme settings
   */
  static async resetToDefault(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.THEME_MODE_KEY);
      await AsyncStorage.removeItem(this.ACCESSIBILITY_THEME_KEY);
      this.currentThemeMode = THEME_MODES[1]; // Dark mode
      this.currentAccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Black & Yellow
      console.log('✅ Reset to default theme settings');
      return true;
    } catch (error) {
      console.error('❌ Error resetting theme settings:', error);
      return false;
    }
  }

  /**
   * Get current theme colours for styling
   */
  static getThemeColors(): ColorTheme['colors'] {
    const isDark = this.currentThemeMode.isDark;
    return isDark ? this.currentAccessibilityTheme.darkColors : this.currentAccessibilityTheme.lightColors;
  }

  /**
   * Check if current theme is dark
   */
  static isDarkTheme(): boolean {
    return this.currentThemeMode.isDark;
  }

  /**
   * Check if current theme is high contrast
   */
  static isHighContrast(): boolean {
    return this.currentAccessibilityTheme.id === 'high-contrast';
  }

  /**
   * Get accessibility features of current theme
   */
  static getAccessibilityFeatures(): ColorTheme['accessibility'] {
    return this.currentAccessibilityTheme.accessibility;
  }

  // Legacy support methods
  /**
   * Get all available colour themes (includes accessibility themes in both light and dark modes)
   */
  static getAvailableThemes(): ColorTheme[] {
    // Convert all accessibility themes to ColorTheme format for both light and dark modes
    const themes: ColorTheme[] = [];
    
    ACCESSIBILITY_THEMES.forEach(accessibilityTheme => {
      // Add light mode version
      themes.push({
        id: `${accessibilityTheme.id}-light`,
        name: `${accessibilityTheme.name} (Light Mode)`,
        description: accessibilityTheme.description,
        colors: accessibilityTheme.lightColors,
        isDark: false,
        isHighContrast: accessibilityTheme.id === 'high-contrast',
        accessibility: accessibilityTheme.accessibility,
      });
      
      // Add dark mode version
      themes.push({
        id: `${accessibilityTheme.id}-dark`,
        name: `${accessibilityTheme.name} (Dark Mode)`,
        description: accessibilityTheme.description,
        colors: accessibilityTheme.darkColors,
        isDark: true,
        isHighContrast: accessibilityTheme.id === 'high-contrast',
        accessibility: accessibilityTheme.accessibility,
      });
    });
    
    return themes;
  }

  /**
   * Get theme by ID (legacy)
   */
  static getThemeById(id: string): ColorTheme | undefined {
    // First try the new format (accessibility themes)
    const allThemes = this.getAvailableThemes();
    const found = allThemes.find(theme => theme.id === id);
    if (found) return found;
    
    // Fallback to legacy themes
    return COLOR_THEMES.find(theme => theme.id === id);
  }

  /**
   * Get current theme (legacy)
   */
  static getCurrentTheme(): ColorTheme {
    const colors = this.getThemeColors();
    const isDark = this.isDarkTheme();
    const isHighContrast = this.isHighContrast();
    const accessibility = this.getAccessibilityFeatures();

    return {
      id: `${this.currentAccessibilityTheme.id}-${this.currentThemeMode.id}`,
      name: `${this.currentAccessibilityTheme.name} (${this.currentThemeMode.name})`,
      description: `${this.currentAccessibilityTheme.description} in ${this.currentThemeMode.name.toLowerCase()} mode`,
      colors,
      isDark,
      isHighContrast,
      accessibility,
    };
  }

  /**
   * Set current theme (legacy)
   */
  static async setCurrentTheme(themeId: string): Promise<boolean> {
    // Try to parse legacy theme IDs
    if (themeId === 'light') {
      return await this.setThemeMode('light');
    } else if (themeId === 'dark') {
      return await this.setThemeMode('dark');
    } else {
      // Parse new format: "theme-id-light" or "theme-id-dark"
      const parts = themeId.split('-');
      const lastPart = parts[parts.length - 1];
      
      if (lastPart === 'light' || lastPart === 'dark') {
        // Extract theme ID (everything except the last part)
        const accessibilityThemeId = parts.slice(0, -1).join('-');
        const modeId = lastPart;
        
        // Set both the accessibility theme and mode
        const themeSuccess = await this.setAccessibilityTheme(accessibilityThemeId);
        const modeSuccess = await this.setThemeMode(modeId);
        return themeSuccess && modeSuccess;
      } else {
        // Try as accessibility theme (old format)
      return await this.setAccessibilityTheme(themeId);
      }
    }
  }

  /**
   * Load saved theme from storage (legacy)
   */
  static async loadSavedTheme(): Promise<ColorTheme> {
    await this.loadSavedThemeSettings();
    return this.getCurrentTheme();
  }
}
