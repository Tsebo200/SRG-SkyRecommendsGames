import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        console.log('🔍 Initializing authentication...');
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error.message);
          if (mounted) {
            setIsSignedIn(false);
            setInitializing(false);
          }
          return;
        }

        console.log('🔍 Initial session check:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at
        });

        if (mounted) {
          setIsSignedIn(!!session);
          setInitializing(false);
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
        if (mounted) {
          setIsSignedIn(false);
          setInitializing(false);
        }
      }
    };

    init();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state change:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });

      if (mounted) {
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in');
          setIsSignedIn(true);
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out');
          setIsSignedIn(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          setIsSignedIn(!!session);
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('🔐 Password recovery');
        }
      }
    });

    // Set up periodic session refresh to keep user logged in
    const refreshInterval = setInterval(async () => {
      if (mounted && isSignedIn) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('⚠️ Session expired, signing out');
            setIsSignedIn(false);
          }
        } catch (error) {
          console.error('❌ Session refresh error:', error);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (initializing || isSignedIn === null) return;
    
    console.log('🔍 Navigation check:', {
      isSignedIn,
      segments: segments.join('/'),
      currentPath: segments[0]
    });

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!isSignedIn) {
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
  }, [segments, initializing, isSignedIn, router]);

  // Show loading screen while checking initial session
  if (initializing || isSignedIn === null) {
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