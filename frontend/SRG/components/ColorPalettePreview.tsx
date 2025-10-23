import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../lib/theme-context';

interface ColorSwatchProps {
  name: string;
  color: string;
  description?: string;
}

function ColorSwatch({ name, color, description }: ColorSwatchProps) {
  const themeColors = useThemeColors();
  
  return (
    <View style={[styles.swatchContainer, { backgroundColor: themeColors.surface }]}>
      <View style={[styles.colorBox, { backgroundColor: color }]} />
      <View style={styles.colorInfo}>
        <Text style={[styles.colorName, { color: themeColors.text }]}>{name}</Text>
        <Text style={[styles.colorValue, { color: themeColors.textSecondary }]}>{color}</Text>
        {description && (
          <Text style={[styles.colorDescription, { color: themeColors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ColorPalettePreview() {
  const themeColors = useThemeColors();
  
  const colorSwatches = [
    { name: 'Primary', color: themeColors.primary, description: 'Main brand color' },
    { name: 'Secondary', color: themeColors.secondary, description: 'Secondary actions' },
    { name: 'Background', color: themeColors.background, description: 'Main background' },
    { name: 'Surface', color: themeColors.surface, description: 'Cards and surfaces' },
    { name: 'Text', color: themeColors.text, description: 'Primary text' },
    { name: 'Text Secondary', color: themeColors.textSecondary, description: 'Secondary text' },
    { name: 'Accent', color: themeColors.accent, description: 'Highlights and accents' },
    { name: 'Success', color: themeColors.success, description: 'Success states' },
    { name: 'Warning', color: themeColors.warning, description: 'Warning states' },
    { name: 'Error', color: themeColors.error, description: 'Error states' },
    { name: 'Border', color: themeColors.border, description: 'Borders and dividers' },
    { name: 'Card', color: themeColors.card, description: 'Card backgrounds' },
    { name: 'Button', color: themeColors.button, description: 'Primary buttons' },
    { name: 'Button Text', color: themeColors.buttonText, description: 'Button text' },
    { name: 'Tab Bar', color: themeColors.tabBar, description: 'Tab bar background' },
    { name: 'Tab Active', color: themeColors.tabBarActive, description: 'Active tab' },
    { name: 'Tab Inactive', color: themeColors.tabBarInactive, description: 'Inactive tabs' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Nature Palette Preview</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Custom colour scheme with nature-inspired colours
      </Text>
      
      <View style={styles.swatchesGrid}>
        {colorSwatches.map((swatch, index) => (
          <ColorSwatch
            key={index}
            name={swatch.name}
            color={swatch.color}
            description={swatch.description}
          />
        ))}
      </View>
      
      <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.infoTitle, { color: themeColors.text }]}>Colour Palette</Text>
        <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
          This theme uses a carefully curated palette of nature-inspired colours:
        </Text>
        <View style={styles.originalColors}>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #2c7083 (Teal Blue) - Primary brand colour
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #87695f (Warm Brown) - Secondary text and accents
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #f1d9bd (Cream) - Main background
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #7bb4bd (Light Blue) - Secondary actions
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #dba879 (Golden Brown) - Accents and highlights
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #413d3e (Dark Gray) - Primary text
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #01a161 (Green) - Success states
          </Text>
          <Text style={[styles.originalColor, { color: themeColors.textSecondary }]}>
            • #dfe8f1 (Light Blue-Gray) - Cards and surfaces
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  swatchesGrid: {
    gap: 12,
  },
  swatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorInfo: {
    flex: 1,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  colorValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  colorDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  originalColors: {
    gap: 4,
  },
  originalColor: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

