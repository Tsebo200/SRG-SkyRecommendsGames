import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FirebaseAuthService, AuthUser } from '../lib/firebase-auth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    console.log('🔍 Initializing Firebase authentication...');

    // Listen to auth state changes
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      console.log('🔍 Firebase auth state change:', {
        hasUser: !!firebaseUser,
        userId: firebaseUser?.uid,
        email: firebaseUser?.email
      });

      if (mounted) {
        const authUser = FirebaseAuthService.convertUser(firebaseUser);
        setUser(authUser);
        
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
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
    
    if (!user) {
      // User is not signed in, redirect to auth
      if (!inAuthGroup) {
        console.log('🔄 Redirecting to sign in');
        router.replace('/auth/signin');
      }
    } else {
      // User is signed in, redirect to main app
      if (inAuthGroup) {
        console.log('🔄 Redirecting to main app');
        router.replace('/(tabs)');
      }
    }
  }, [segments, initializing, user, router]);

  // Show loading screen while checking initial auth state
  if (initializing) {
    return (
      <>
        <StatusBar style="light" />
        <View style={{ 
          flex: 1, 
          backgroundColor: '#0a0a0a', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ 
            color: '#fff', 
            fontSize: 16, 
            marginTop: 16,
            fontWeight: '500'
          }}>
            Loading...
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
        <Stack.Screen name="auth/signin" />
        <Stack.Screen name="auth/signup" />
      </Stack>
    </>
  );
}
