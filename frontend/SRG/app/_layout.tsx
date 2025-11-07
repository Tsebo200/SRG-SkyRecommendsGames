import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { FirebaseAuthService, AuthUser } from '../lib/firebase-auth';
import { UserMappingService } from '../lib/user-mapping';
import { ThemeProvider } from '../lib/theme-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  
  // Animation values for logo
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  // Multiple outline layers for cascading effect
  const outline1ScaleAnim = useRef(new Animated.Value(1.1)).current;
  const outline1OpacityAnim = useRef(new Animated.Value(0.3)).current;
  const outline2ScaleAnim = useRef(new Animated.Value(1.2)).current;
  const outline2OpacityAnim = useRef(new Animated.Value(0.2)).current;
  const outline3ScaleAnim = useRef(new Animated.Value(1.3)).current;
  const outline3OpacityAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    let mounted = true;

    console.log('🔍 Initializing Firebase authentication...');

    // Start logo animation - fade in and scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After initial animation, start pulsing with fade effect
      Animated.loop(
        Animated.parallel([
          // Pulse scale animation (more pronounced: 1.0 to 1.4)
          // Expand slower, reduce much faster with ease in-out
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.4,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Opacity animation (inverse of scale - smaller = more transparent)
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 1.0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Outline 1 scale animation (keeps growing even when logo reduces)
          Animated.sequence([
            Animated.timing(outline1ScaleAnim, {
              toValue: 1.5,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline1ScaleAnim, {
              toValue: 1.8,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            // Reset to starting value for smooth loop
            Animated.timing(outline1ScaleAnim, {
              toValue: 1.1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          // Outline 1 opacity animation
          Animated.sequence([
            Animated.timing(outline1OpacityAnim, {
              toValue: 0.2,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline1OpacityAnim, {
              toValue: 0.5,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Outline 2 scale animation (keeps growing even when logo reduces)
          Animated.sequence([
            Animated.timing(outline2ScaleAnim, {
              toValue: 1.6,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline2ScaleAnim, {
              toValue: 1.9,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            // Reset to starting value for smooth loop
            Animated.timing(outline2ScaleAnim, {
              toValue: 1.2,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          // Outline 2 opacity animation
          Animated.sequence([
            Animated.timing(outline2OpacityAnim, {
              toValue: 0.1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline2OpacityAnim, {
              toValue: 0.4,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Outline 3 scale animation (keeps growing even when logo reduces)
          Animated.sequence([
            Animated.timing(outline3ScaleAnim, {
              toValue: 1.7,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline3ScaleAnim, {
              toValue: 2.0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            // Reset to starting value for smooth loop
            Animated.timing(outline3ScaleAnim, {
              toValue: 1.3,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          // Outline 3 opacity animation
          Animated.sequence([
            Animated.timing(outline3OpacityAnim, {
              toValue: 0.05,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(outline3OpacityAnim, {
              toValue: 0.3,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });

    // Start minimum loading time timer
    const loadingTimer = setTimeout(() => {
      if (mounted) {
        setShowLoading(false);
      }
    }, 1100); // 1.1 seconds minimum loading time

    // Listen to auth state changes (ShieldMe-inspired approach)
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔍 Firebase auth state change:', {
        hasUser: !!firebaseUser,
        userId: firebaseUser?.uid,
        email: firebaseUser?.email
      });

      if (mounted) {
        if (firebaseUser) {
          // Ensure user mapping exists in Supabase (for data persistence)
          console.log('🔄 Ensuring user mapping...');
          const mappingSuccess = await UserMappingService.ensureUserMapping();
          
          if (mappingSuccess) {
            console.log('✅ User mapping ensured');
            const authUser = FirebaseAuthService.convertUser(firebaseUser);
            setUser(authUser);
          } else {
            console.log('⚠️ User mapping failed');
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    // Load onboarding flag
    (async () => {
      try {
        const v = await AsyncStorage.getItem('hasSeenOnboarding');
        if (mounted) setHasSeenOnboarding(v === 'true');
      } catch {
        if (mounted) setHasSeenOnboarding(false);
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;
    
    console.log('🔍 Navigation check:', {
      hasUser: !!user,
      segments: segments.join('/'),
      currentPath: segments[0]
    });

    const inAuthGroup = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';
    
    // Add a small delay to ensure smooth transitions
    const navigationTimer = setTimeout(() => {
      (async () => {
        // Always get the latest flag to avoid stale state loops
        try {
          const v = await AsyncStorage.getItem('hasSeenOnboarding');
          const latestSeen = v === 'true';
          if (hasSeenOnboarding !== latestSeen) setHasSeenOnboarding(latestSeen);

          // Onboarding takes precedence if not completed
          if (!latestSeen && !onOnboarding) {
            console.log('🔄 Redirecting to onboarding');
            router.replace('/onboarding');
            return;
          }

          if (!user) {
            if (!inAuthGroup && !onOnboarding) {
              console.log('🔄 Redirecting to sign in');
              router.replace('/auth/signin-firebase');
            }
          } else if (inAuthGroup) {
            console.log('🔄 Redirecting to main app');
            router.replace('/(tabs)/');
          }
        } catch {
          // If storage fails, default to showing onboarding once
          if (!onOnboarding) router.replace('/onboarding');
        }
      })();
    }, 100); // Small delay to prevent flashing

    return () => clearTimeout(navigationTimer);
  }, [segments, initializing, user, router, hasSeenOnboarding]);

  // Show loading screen while checking initial auth state OR during navigation transitions
  const shouldShowLoading = showLoading || initializing || hasSeenOnboarding === null ||
    (user === null && !segments.includes('auth') && segments[0] !== 'onboarding') ||
    (user && segments.includes('auth'));

  if (shouldShowLoading) {
    return (
      <>
        <StatusBar style="light" />
        <View style={{ 
          flex: 1, 
          backgroundColor: '#000', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <View style={{ position: 'relative', width: 200, height: 200 }}>
            {/* Outline 3 layer (furthest behind, most transparent) */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: Animated.multiply(fadeAnim, outline3OpacityAnim),
                transform: [
                  { scale: Animated.multiply(scaleAnim, outline3ScaleAnim) },
                ],
              }}
            >
              <Image
                source={require('../assets/Sky Logo.png')}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
            
            {/* Outline 2 layer (middle, more transparent) */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: Animated.multiply(fadeAnim, outline2OpacityAnim),
                transform: [
                  { scale: Animated.multiply(scaleAnim, outline2ScaleAnim) },
                ],
              }}
            >
              <Image
                source={require('../assets/Sky Logo.png')}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
            
            {/* Outline 1 layer (closest, less transparent) */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: Animated.multiply(fadeAnim, outline1OpacityAnim),
                transform: [
                  { scale: Animated.multiply(scaleAnim, outline1ScaleAnim) },
                ],
              }}
            >
              <Image
                source={require('../assets/Sky Logo.png')}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
            
            {/* Main logo layer */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: Animated.multiply(fadeAnim, opacityAnim),
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                ],
              }}
            >
              <Image
                source={require('../assets/Sky Logo.png')}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
          </View>
        </View>
      </>
    );
  }

  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/signin-firebase" />
        <Stack.Screen name="auth/signup-firebase" />
        <Stack.Screen name="game/[slug]" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </ThemeProvider>
  );
}