import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Animated,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../lib/theme-context';
import { HybridAuthService } from '../lib/hybrid-auth';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
  details: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: 'heart',
    title: 'Add Games to Favourites',
    description: 'Save games you love to build your personal collection',
    details: [
      'Search for a game using the Search tab',
      'Tap on any game to view its details',
      'Look for the heart icon (❤️) on the game card or details page',
      'Tap the heart icon to add it to your favourites',
      'The heart will turn red when the game is saved',
      'Access all your favourites from the Favourites tab'
    ]
  },
  {
    icon: 'qr-code',
    title: 'Scan Games from SkyScansGames',
    description: 'Discover games instantly by scanning QR codes from skyscansgames.co.za',
    details: [
      'Visit skyscansgames.co.za on your computer or another device',
      'Find a game you want to scan - each game has a QR code', 
      'you need to tap on game analysis below view scoring rubric to find the QR code',
      'Open the "For You" tab in the app',
      'Tap "Scan QR Code" at the top',
      'Point your camera at the QR code on the website',
      'The app will automatically load the game details',
      'You can then add it to favourites or view more information'
    ]
  },
  {
    icon: 'sparkles',
    title: 'Get AI Game Recommendations',
    description: 'Receive personalised game suggestions powered by AI',
    details: [
      'First, add at least 3-5 games to your favourites',
      'Go to the "For You" tab in the app',
      'Tap "Recommendations" at the top',
      'Tap "Get Recommendations" or pull down to refresh',
      'Wait 15-30 seconds while AI analyses your preferences',
      'Browse through personalised game suggestions',
      'Each recommendation shows why it matches your taste',
      'Connect your Steam account for even better recommendations'
    ]
  },
  {
    icon: 'search',
    title: 'Search and Discover Games',
    description: 'Find games from a vast library of titles',
    details: [
      'Use the Search tab at the bottom',
      'Type game names or keywords in the search bar',
      'Browse through search results',
      'Tap any game to see detailed information',
      'View screenshots, genres, platforms, and ratings',
      'Add games to favourites directly from search results'
    ]
  },
  {
    icon: 'color-palette',
    title: 'Customise Your Experience',
    description: 'Personalise the app to match your preferences',
    details: [
      'Go to the Profile tab',
      'Tap "Theme Settings" or "Colour Theme"',
      'Choose from Light or Dark mode',
      'Select from various colour themes including accessibility options',
      'Enable or disable motion effects',
      'All settings are saved automatically'
    ]
  }
];

export default function OnboardingScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const handleNext = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, fadeAnim]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, fadeAnim]);

  const finishOnboarding = useCallback(async () => {
    try {
      // Mark onboarding as seen
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      
      // Check if user is already logged in
      const user = HybridAuthService.getCurrentUser();
      if (user) {
        // User is logged in, go to home
        router.replace('/(tabs)/');
      } else {
        // User not logged in, go to sign in
        router.replace('/auth/signin-firebase');
      }
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      // Still navigate even if storage fails
      const user = HybridAuthService.getCurrentUser();
      if (user) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/auth/signin-firebase');
      }
    }
  }, [router]);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index === currentStep 
                  ? themeColors.primary 
                  : index < currentStep 
                    ? themeColors.primary 
                    : themeColors.surface,
                opacity: index === currentStep ? 1 : index < currentStep ? 0.5 : 0.3,
                width: index === currentStep ? 24 : 8,
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: themeColors.surface }]}>
            <Ionicons 
              name={currentStepData.icon as any} 
              size={64} 
              color={themeColors.primary} 
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {currentStepData.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            {currentStepData.description}
          </Text>

          {/* Details List */}
          <View style={styles.detailsContainer}>
            {currentStepData.details.map((detail, index) => {
              // Special handling for step 2 (index 1) to make skyscansgames.co.za a link
              if (currentStep === 1 && detail.includes('skyscansgames.co.za')) {
                const parts = detail.split('skyscansgames.co.za');
                return (
                  <View key={index} style={styles.detailItem}>
                    <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.detailText, { color: themeColors.text }]}>
                      {parts[0]}
                      <Text
                        style={[styles.linkText, { color: themeColors.primary }]}
                        onPress={() => Linking.openURL('https://skyscansgames.co.za')}
                      >
                        skyscansgames.co.za
                      </Text>
                      {parts[1]}
                    </Text>
                  </View>
                );
              }
              return (
                <View key={index} style={styles.detailItem}>
                  <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                  <Text style={[styles.detailText, { color: themeColors.text }]}>
                    {detail}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
        </ScrollView>
        {/* Scroll hint gradient - shows when content is scrollable */}
        {currentStepData.details.length > 5 && (
          <View 
            style={[
              styles.scrollHint,
              {
                backgroundColor: themeColors.background,
                borderTopColor: themeColors.border,
              }
            ]}
            pointerEvents="none"
          >
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
            <Text style={[styles.scrollHintText, { color: themeColors.textSecondary }]}>
              Scroll to see more
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: themeColors.border }]}
            onPress={handlePrevious}
          >
            <Ionicons name="chevron-back" size={20} color={themeColors.text} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>
              Previous
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton, 
            { 
              backgroundColor: themeColors.primary,
            }
          ]}
          onPress={isLastStep ? finishOnboarding : handleNext}
        >
          <Text style={[styles.primaryButtonText, { color: themeColors.buttonText }]}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Text>
          {!isLastStep && (
            <Ionicons name="chevron-forward" size={20} color={themeColors.buttonText} />
          )}
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      {!isLastStep && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={finishOnboarding}
        >
          <Text style={[styles.skipButtonText, { color: themeColors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  scrollHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    opacity: 0.7,
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginVertical: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginVertical: 5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
