import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Text } from 'react-native';
import { ThemeProvider, useThemeColors } from '../lib/theme-context';
import { GradientColorProvider } from '../lib/gradient-color-context';
import { LinkPreviewContextProvider } from '../lib/link-preview-provider';
import { HybridAuthService } from '../lib/hybrid-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomGameNews } from '../lib/game-news-quips';

// Loading screen component
function LoadingScreen() {
  const themeColors = useThemeColors();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
      <ActivityIndicator size="large" color={themeColors.primary} />
    </View>
  );
}

// Navigation guard component that handles auth-based routing
function NavigationGuard({ initialUser }: { initialUser: any }) {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<any>(initialUser);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const hasNavigatedRef = useRef(false); // Track if we've done initial navigation (use ref to avoid infinite loops)

  useEffect(() => {
    let mounted = true;

    // Load onboarding flag
    (async () => {
      try {
        const v = await AsyncStorage.getItem('hasSeenOnboarding');
        if (mounted) {
          setHasSeenOnboarding(v === 'true');
        }
      } catch {
        if (mounted) {
          setHasSeenOnboarding(false);
        }
      }
    })();

    // Listen to auth state changes - Firebase persistence handles session restoration
    const unsubscribe = HybridAuthService.onAuthStateChanged((firebaseUser) => {
      if (!mounted) return;

      console.log('🔍 Auth state changed:', {
        hasUser: !!firebaseUser,
        userId: firebaseUser?.uid,
        email: firebaseUser?.email
      });

      setUser(firebaseUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Don't navigate if:
    // - Onboarding status unknown
    // - Already navigating
    if (hasSeenOnboarding === null || isNavigating) return;
    
    const inAuthGroup = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const onAwards = segments[0] === 'awards';
    const currentRoute = segments.join('/');
    
    // Allow awards screen for logged-in users - don't interfere with it
    if (user && onAwards) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
      }
      return;
    }
    
    // CRITICAL: If user is logged out but on tabs/home screen, immediately redirect
    // This handles the case where app restarts and shows last route before auth check
    if (!user && inTabs) {
      console.log('🚨 User logged out but on home screen - immediate redirect');
      setIsNavigating(true);
      if (hasSeenOnboarding) {
        router.replace('/auth/signin-firebase');
      } else {
        router.replace('/onboarding');
      }
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
    // If user is logged in and in tabs/awards, or logged out and in auth/onboarding, we're in the correct place
    // Mark as navigated to stop repeated checks
    if (hasNavigatedRef.current) {
      const isInCorrectPlace = 
        (user && (inTabs || onAwards)) || // Logged in and in tabs/awards - correct
        (!user && (inAuthGroup || onOnboarding)); // Logged out and in auth/onboarding - correct
      
      if (isInCorrectPlace) {
        return; // Already navigated and in correct place, no need to check again
      } else {
        // In wrong place, reset flag to allow navigation
        hasNavigatedRef.current = false;
      }
    }

    // Determine target route based on auth and onboarding status
    let targetRoute: string | null = null;

    if (!user) {
      // User is not signed in
      if (!hasSeenOnboarding && !onOnboarding) {
        targetRoute = '/onboarding';
      } else if (hasSeenOnboarding) {
        // Only navigate to sign-in if not already in auth group (prevent duplicates)
        if (!inAuthGroup && !onOnboarding) {
          targetRoute = '/auth/signin-firebase';
        }
        // If already in auth group or onboarding, stay there (prevent duplicate navigation)
      }
    } else {
      // User is signed in (Firebase persistence restored session)
      if (!hasSeenOnboarding && !onOnboarding) {
        targetRoute = '/onboarding';
      } else if (hasSeenOnboarding) {
        // Only redirect if in auth screens, otherwise stay where we are
        if (inAuthGroup) {
          targetRoute = '/(tabs)/';
        }
        // If already in tabs or onboarding, don't navigate (prevent loops)
      }
    }

    // Only navigate if we have a target and we're not already there
    const normalizedTarget = targetRoute?.replace(/^\//, '') || '';
    const normalizedCurrent = currentRoute || '';
    
    if (targetRoute && normalizedCurrent !== normalizedTarget) {
      // Additional check: if we're already in auth group and target is also auth, don't navigate
      if (inAuthGroup && targetRoute.startsWith('/auth/')) {
        console.log('🔄 Already in auth group, skipping navigation to prevent duplicates');
        hasNavigatedRef.current = true;
        return;
      }

      console.log('🔄 Navigating to:', targetRoute);
      setIsNavigating(true);
      hasNavigatedRef.current = true; // Mark as navigated to prevent duplicates
      
      router.replace(targetRoute);
      
      // Reset navigation flag after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    } else {
      // No navigation needed - we're already in the correct place
      // Mark as navigated to stop repeated checks
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
      }
    }
  }, [user, segments, hasSeenOnboarding, router, isNavigating]);

  // Don't reset hasNavigated for normal tab navigation within (tabs)
  // Only reset if user navigates to a completely different section (auth, onboarding, etc.)
  useEffect(() => {
    if (!hasNavigatedRef.current || isNavigating) return;
    
    const inAuthGroup = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    
    const onAwards = segments[0] === 'awards';
    
    // Check if user is in the correct place based on auth status
    const isInCorrectPlace = 
      (user && (inTabs || onAwards)) || // Logged in and in tabs/awards - correct
      (!user && (inAuthGroup || onOnboarding)); // Logged out and in auth/onboarding - correct
    
    // Only reset if user navigated to a wrong place (e.g., logged out user on tabs)
    if (!isInCorrectPlace) {
      // User is in wrong place, allow navigation guard to fix it
      const timer = setTimeout(() => {
        hasNavigatedRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // User is in correct place, keep hasNavigated true to prevent repeated checks
  }, [segments, isNavigating, user]);

  return null; // This component only handles navigation logic
}

function PreloaderScreen() {
  const router = useRouter();
  const segments = useSegments();
  const themeColors = useThemeColors();
  const [isReady, setIsReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [gameNews] = useState<string>(getRandomGameNews());

  useEffect(() => {
    let mounted = true;
    let redirectHandled = false;

    const performRedirect = async () => {
      if (redirectHandled || !mounted) return;
      redirectHandled = true;

      try {
        // Check onboarding status first
        const onboardingValue = await AsyncStorage.getItem('hasSeenOnboarding');
        const seenOnboarding = onboardingValue === 'true';
        setHasSeenOnboarding(seenOnboarding);

        // If user hasn't seen onboarding, skip preloader and go directly to onboarding
        if (!seenOnboarding) {
          console.log('📚 Preloader: User hasn\'t seen onboarding, skipping preloader');
          router.replace('/onboarding' as any);
          setIsReady(true); // Hide preloader immediately
          return;
        }

        // Get auth state immediately (Firebase persistence should have restored it)
        const currentUser = HybridAuthService.getCurrentUser();
        
        console.log('🔍 Preloader: Initial auth check', { hasUser: !!currentUser });

        // Wait for onAuthStateChanged to fire (it fires immediately with persisted state)
        // This ensures we have the most up-to-date auth state from Firebase persistence
        const unsubscribe = HybridAuthService.onAuthStateChanged((firebaseUser) => {
          if (!mounted || redirectHandled) {
            unsubscribe();
            return;
          }

          // Determine where to redirect based on auth status
          // (We already know they've seen onboarding)
          (async () => {
            try {
              // Use the user from onAuthStateChanged (most up-to-date from Firebase persistence)
              const user = firebaseUser;

              let route: string;

          if (!user) {
                // User not logged in - go to sign-in
                route = '/auth/signin-firebase';
              } else {
                // User logged in - go to home
                route = '/(tabs)/';
              }

              console.log('🔄 Preloader: Redirecting to', {
                hasUser: !!user,
                route
              });

              if (mounted) {
                setTargetRoute(route);
                
                console.log('🔄 Preloader: About to navigate to', route);
                
                // Small delay to ensure smooth transition
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Use replace to prevent back navigation to preloader
                router.replace(route as any);
                
                console.log('✅ Preloader: Navigation command sent to', route);
              }

              unsubscribe();
            } catch (error) {
              console.error('❌ Error in preloader redirect:', error);
              // Fallback to sign-in on error
              if (mounted) {
                setTargetRoute('/auth/signin-firebase');
                router.replace('/auth/signin-firebase' as any);
              }
              unsubscribe();
            }
          })();
        });
      } catch (error) {
        console.error('❌ Error in preloader:', error);
        // Fallback to sign-in on error
        if (mounted) {
          setTargetRoute('/auth/signin-firebase');
          router.replace('/auth/signin-firebase' as any);
        }
      }
    };

    // Start redirect process
    performRedirect();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Always hide preloader after minimum 1000ms
  useEffect(() => {
    if (isReady) return;

    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, 1000 - elapsed);

    console.log('⏱️ Preloader: Timer check', {
      elapsed,
      remainingTime,
      targetRoute,
      segments: segments.join('/')
    });

    // Always hide after 1000ms minimum, regardless of detection
    const timeout = setTimeout(() => {
      console.log('✅ Preloader: 1000ms minimum reached, fading out preloader');
      
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 500ms fade out
        useNativeDriver: true,
      }).start(() => {
        // After fade completes, mark as ready
        setIsReady(true);
      });
    }, remainingTime);

    return () => clearTimeout(timeout);
  }, [startTime, isReady, targetRoute, segments, fadeAnim]);

  // Also try to detect when target screen is loaded (for faster hiding if already past 1000ms)
  useEffect(() => {
    if (!targetRoute || isReady) return;

    const segmentPath = segments.join('/');
    const elapsed = Date.now() - startTime;
    
    // Check if we're on the target route
    let isOnTargetRoute = false;
    
    if (targetRoute === '/(tabs)/') {
      isOnTargetRoute = segments[0] === '(tabs)';
    } else if (targetRoute === '/auth/signin-firebase') {
      isOnTargetRoute = segmentPath.includes('auth') || segmentPath.includes('signin');
    } else if (targetRoute === '/onboarding') {
      isOnTargetRoute = segments[0] === 'onboarding' || segmentPath.includes('onboarding');
    }

    // If target screen is loaded AND we've shown for at least 1000ms, fade out
    if (isOnTargetRoute && elapsed >= 1000) {
      console.log('✅ Preloader: Target screen loaded and 1000ms elapsed, fading out');
      
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 500ms fade out
        useNativeDriver: true,
      }).start(() => {
        // After fade completes, mark as ready
        setIsReady(true);
      });
    }
  }, [segments, targetRoute, isReady, startTime, fadeAnim]);

  // Show preloader while determining auth state and redirecting
  // Fade out smoothly after minimum 1000ms
  if (!isReady) {
    return (
            <Animated.View
        style={[
          styles.preloaderContainer, 
          { 
            backgroundColor: themeColors.background,
            opacity: fadeAnim
          }
        ]}
      >
        <View style={styles.preloaderContent}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.gameNewsText, { color: themeColors.textSecondary }]}>
            {gameNews}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Preloader hidden - return null so it doesn't block the screen
  return null;
}

function RootLayoutContent() {
  // Show preloader first - it will handle auth check and redirect
  // This ensures NO screen (including home) renders until we know the auth state
  return (
    <>
      <PreloaderScreen />
      <Stack 
        screenOptions={{ headerShown: false }}
      >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/signin-firebase" />
          <Stack.Screen name="auth/signup-firebase" />
          <Stack.Screen name="game/[slug]" />
        <Stack.Screen name="game-details" />
        <Stack.Screen name="scan-results" />
        <Stack.Screen name="steam-profile" />
        <Stack.Screen name="network-test" />
          <Stack.Screen name="onboarding" />
        </Stack>
      <NavigationGuard initialUser={null} />
    </>
  );
}

export default function RootLayout() {
  // Stack MUST be the absolute root - no conditional rendering
  // Providers wrap the Stack to ensure they're available to all screens
  return (
    <LinkPreviewContextProvider>
      <ThemeProvider>
        <GradientColorProvider>
          <StatusBar style="light" />
          <RootLayoutContent />
      </GradientColorProvider>
    </ThemeProvider>
    </LinkPreviewContextProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preloaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preloaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  gameNewsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10, // 10px below the loader
    maxWidth: 300,
  },
});
