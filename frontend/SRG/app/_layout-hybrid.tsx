import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { HybridAuthService } from '../lib/hybrid-auth';
import { UserMappingService } from '../lib/user-mapping';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log('🔍 Initializing hybrid authentication...');
        
        // Check Firebase authentication
        const firebaseUser = HybridAuthService.getCurrentUser();
        
        console.log('🔍 Firebase user check:', {
          hasUser: !!firebaseUser,
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          displayName: firebaseUser?.displayName
        });

        if (firebaseUser) {
          // Ensure user mapping exists in Supabase
          console.log('🔄 Ensuring user mapping...');
          const mappingSuccess = await UserMappingService.ensureUserMapping();
          
          if (mappingSuccess) {
            console.log('✅ User mapping ensured');
            if (mounted) {
              setIsSignedIn(true);
              setInitializing(false);
            }
          } else {
            console.log('⚠️ User mapping failed, redirecting to sign in');
            if (mounted) {
              setIsSignedIn(false);
              setInitializing(false);
            }
          }
        } else {
          console.log('⚠️ No Firebase user found');
          if (mounted) {
            setIsSignedIn(false);
            setInitializing(false);
          }
        }
      } catch (error) {
        console.error('❌ Hybrid initialization error:', error);
        if (mounted) {
          setIsSignedIn(false);
          setInitializing(false);
        }
      }
    };

    // Add a small delay to prevent auth flash
    const timer = setTimeout(() => {
      init();
    }, 100);

    return () => {
      clearTimeout(timer);
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initializing || isSignedIn === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('🔍 Navigation check:', {
      isSignedIn,
      inAuthGroup,
      inTabsGroup,
      segments: segments.join('/')
    });

    if (isSignedIn && inAuthGroup) {
      // User is signed in but in auth group, redirect to tabs
      console.log('🔄 Redirecting to tabs (user signed in)');
      router.replace('/(tabs)');
    } else if (!isSignedIn && inTabsGroup) {
      // User is not signed in but in tabs group, redirect to auth
      console.log('🔄 Redirecting to auth (user not signed in)');
      router.replace('/auth/signin-firebase');
    }
  }, [isSignedIn, segments, router]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = HybridAuthService.onAuthStateChanged(async (user) => {
      console.log('🔄 Firebase auth state changed:', {
        hasUser: !!user,
        uid: user?.uid,
        email: user?.email
      });

      if (user) {
        // Ensure user mapping exists
        const mappingSuccess = await UserMappingService.ensureUserMapping();
        if (mappingSuccess) {
          setIsSignedIn(true);
        } else {
          setIsSignedIn(false);
        }
      } else {
        setIsSignedIn(false);
      }
    });

    return unsubscribe;
  }, []);

  // Show loading screen while initializing
  if (initializing || isSignedIn === null) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#000'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ 
          color: '#fff', 
          marginTop: 16, 
          fontSize: 16,
          fontWeight: '500'
        }}>
          Initializing...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/signin-firebase" />
        <Stack.Screen name="auth/signup-firebase" />
        <Stack.Screen name="game/[slug]" />
      </Stack>
    </>
  );
}
