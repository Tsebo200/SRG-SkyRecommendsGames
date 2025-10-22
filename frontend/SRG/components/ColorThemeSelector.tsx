import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ColorThemeService, ColorTheme } from '../lib/color-themes';
import { useThemeColors } from '../lib/theme-context';

interface ColorThemeSelectorProps {
  onThemeChange?: (theme: ColorTheme) => void;
}

export default function ColorThemeSelector({ onThemeChange }: ColorThemeSelectorProps) {
  const [themes, setThemes] = useState<ColorTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const themeColors = useThemeColors();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const availableThemes = ColorThemeService.getAvailableThemes();
      const currentTheme = await ColorThemeService.loadSavedTheme();
      
      setThemes(availableThemes);
      setSelectedTheme(currentTheme);
    } catch (error) {
      console.error('❌ Error loading themes:', error);
      Alert.alert('Error', 'Failed to load colour themes');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = async (theme: ColorTheme) => {
    try {
      const success = await ColorThemeService.setCurrentTheme(theme.id);
      if (success) {
        setSelectedTheme(theme);
        onThemeChange?.(theme);
        console.log('✅ Theme changed to:', theme.name);
      } else {
        Alert.alert('Error', 'Failed to change theme');
      }
    } catch (error) {
      console.error('❌ Error changing theme:', error);
      Alert.alert('Error', 'Failed to change theme');
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset to the default theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await ColorThemeService.resetToDefault();
              if (success) {
                const defaultTheme = ColorThemeService.getCurrentTheme();
                setSelectedTheme(defaultTheme);
                onThemeChange?.(defaultTheme);
                console.log('✅ Theme reset to default');
              }
            } catch (error) {
              console.error('❌ Error resetting theme:', error);
              Alert.alert('Error', 'Failed to reset theme');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Colour Themes</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Choose your preferred colour scheme</Text>

      <ScrollView style={styles.themesList} showsVerticalScrollIndicator={false}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeCard,
              { backgroundColor: themeColors.surface },
              selectedTheme?.id === theme.id && [styles.selectedThemeCard, { borderColor: themeColors.primary }],
            ]}
            onPress={() => handleThemeSelect(theme)}
          >
            <View style={styles.themeHeader}>
              <Text style={[styles.themeName, { color: themeColors.text }]}>{theme.name}</Text>
              {selectedTheme?.id === theme.id && (
                <Text style={[styles.selectedIndicator, { color: themeColors.primary }]}>✓</Text>
              )}
            </View>
            
            <Text style={[styles.themeDescription, { color: themeColors.textSecondary }]}>{theme.description}</Text>
            
            <View style={styles.themePreview}>
              <View style={[styles.previewColor, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.previewColor, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.previewColor, { backgroundColor: theme.colors.accent }]} />
              <View style={[styles.previewColor, { backgroundColor: theme.colors.success }]} />
            </View>

            <View style={styles.themeFeatures}>
              {theme.isDark && (
                <Text style={[styles.featureTag, { color: themeColors.primary, backgroundColor: `${themeColors.primary}20` }]}>Dark Mode</Text>
              )}
              {theme.isHighContrast && (
                <Text style={[styles.featureTag, { color: themeColors.primary, backgroundColor: `${themeColors.primary}20` }]}>High Contrast</Text>
              )}
              {theme.accessibility.protanomaly && (
                <Text style={[styles.featureTag, { color: themeColors.primary, backgroundColor: `${themeColors.primary}20` }]}>Protanomaly Support</Text>
              )}
              {theme.accessibility.deuteranomaly && (
                <Text style={[styles.featureTag, { color: themeColors.primary, backgroundColor: `${themeColors.primary}20` }]}>Deuteranomaly Support</Text>
              )}
              {theme.accessibility.tritanomaly && (
                <Text style={[styles.featureTag, { color: themeColors.primary, backgroundColor: `${themeColors.primary}20` }]}>Tritanomaly Support</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={[styles.resetButton, { backgroundColor: themeColors.error }]} onPress={handleReset}>
        <Text style={[styles.resetButtonText, { color: themeColors.buttonText }]}>Reset to Default</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  themesList: {
    flex: 1,
  },
  themeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThemeCard: {
    borderColor: '#007AFF',
    backgroundColor: '#1C1C1E',
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  selectedIndicator: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  themeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  themePreview: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  themeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
