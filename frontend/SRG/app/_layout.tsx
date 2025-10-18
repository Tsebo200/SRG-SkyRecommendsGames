import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FirebaseAuthService, AuthUser } from '../lib/firebase-auth';
import { UserMappingService } from '../lib/user-mapping';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('🔍 Initializing Firebase authentication...');

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
    
    // Add a small delay to ensure smooth transitions
    const navigationTimer = setTimeout(() => {
      if (!user) {
        // User is not signed in, redirect to auth
        if (!inAuthGroup) {
          console.log('🔄 Redirecting to sign in');
          router.replace('/auth/signin-firebase');
        }
      } else {
        // User is signed in, redirect to main app
        if (inAuthGroup) {
          console.log('🔄 Redirecting to main app');
          router.replace('/(tabs)');
        }
      }
    }, 100); // Small delay to prevent flashing

    return () => clearTimeout(navigationTimer);
  }, [segments, initializing, user, router]);

  // Show loading screen while checking initial auth state OR during navigation transitions
  const shouldShowLoading = showLoading || initializing || 
    (user === null && !segments.includes('auth')) ||
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
          <Text style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 32
          }}>
            SRG
          </Text>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ 
            color: '#8E8E93', 
            marginTop: 16, 
            fontSize: 16,
            fontWeight: '400'
          }}>
            {/* {initializing ? 'Loading...' : 'Checking authentication...'} */}
          </Text>
        </View>
      </>
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