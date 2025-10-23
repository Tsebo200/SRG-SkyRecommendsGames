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
      tabBar: '#dfe8f1',          // Light blue-gray - tab bar
      tabBarActive: '#2c7083',    // Teal blue - active tab
      tabBarInactive: '#87695f',  // Warm brown - inactive tabs
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
      tabBar: '#F2F2F7',
      tabBarActive: '#007AFF',
      tabBarInactive: '#8E8E93',
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
      tabBar: '#FFFFFF',
      tabBarActive: '#000000',
      tabBarInactive: '#666666',
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
      tabBarInactive: '#CCCCCC',
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
    description: 'Optimised for red-green colour vision deficiency',
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
      tabBar: '#F8F9FA',
      tabBarActive: '#0066CC',
      tabBarInactive: '#6C757D',
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
      error: '#DC3545',
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
    description: 'Optimised for green-red colour vision deficiency',
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
      tabBar: '#F8F9FA',
      tabBarActive: '#8B5CF6',
      tabBarInactive: '#6C757D',
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
      error: '#EF4444',
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
    description: 'Optimised for blue-yellow colour vision deficiency',
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
      tabBar: '#F8F9FA',
      tabBarActive: '#DC2626',
      tabBarInactive: '#6C757D',
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
];

// Legacy support - convert to new structure
export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'light',
    name: 'Nature Light',
    description: 'Nature-inspired light interface',
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
    name: 'Nature Dark',
    description: 'Nature-inspired dark interface',
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
  private static currentAccessibilityTheme: AccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Default to custom-nature
  private static currentAccessibilityTheme: AccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Default to standard

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
      this.currentAccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Custom Nature Palette
      this.currentAccessibilityTheme = ACCESSIBILITY_THEMES[0]; // Standard
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
   * Get all available colour themes (legacy)
   */
  static getAvailableThemes(): ColorTheme[] {
    return COLOR_THEMES;
  }

  /**
   * Get theme by ID (legacy)
   */
  static getThemeById(id: string): ColorTheme | undefined {
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
      // Try as accessibility theme
      return await this.setAccessibilityTheme(themeId);
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
