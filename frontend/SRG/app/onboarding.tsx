import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../lib/theme-context';

export default function OnboardingScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/auth/signin-firebase');
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top','bottom','left','right']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>Welcome to SRG</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Discover, scan and get AI-powered game recommendations.</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: themeColors.text }]}>AI Recommendations</Text>
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>Personalised picks based on what you like.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: themeColors.text }]}>Scan Games</Text>
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>Add games instantly with QR codes.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: themeColors.text }]}>Flexible Themes</Text>
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>Light/Dark with colour modes for accessibility.</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: themeColors.primary }]} onPress={finishOnboarding}>
          <Text style={[styles.primaryButtonText, { color: themeColors.buttonText }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 16, marginTop: 8 },
  features: { gap: 16, marginTop: 24 },
  featureItem: { },
  featureTitle: { fontSize: 16, fontWeight: '700' },
  featureText: { fontSize: 14, marginTop: 4 },
  primaryButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
});


