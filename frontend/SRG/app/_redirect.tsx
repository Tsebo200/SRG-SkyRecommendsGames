import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HybridAuthService } from '../lib/hybrid-auth';
import { useThemeColors } from '../lib/theme-context';

/**
 * Redirect screen that immediately checks Firebase auth state and redirects
 * This prevents any screen from flashing before we know the auth state
 */
export default function RedirectScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  useEffect(() => {
    let mounted = true;
    let redirectHandled = false;

    const performRedirect = async () => {
      if (redirectHandled || !mounted) return;
      redirectHandled = true;

      try {
        // Get auth state immediately (Firebase persistence should have restored it)
        const currentUser = HybridAuthService.getCurrentUser();
        
        // Also wait for onAuthStateChanged to fire (it fires immediately with persisted state)
        // This ensures we have the most up-to-date auth state
        const unsubscribe = HybridAuthService.onAuthStateChanged((firebaseUser) => {
          if (!mounted) return;

          // Determine where to redirect based on auth and onboarding status
          (async () => {
            try {
              const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
              const seenOnboarding = hasSeenOnboarding === 'true';

              // Use the user from onAuthStateChanged (most up-to-date)
              const user = firebaseUser;

              let targetRoute: string;
              
              if (!user) {
                // User not logged in
                targetRoute = seenOnboarding ? '/auth/signin-firebase' : '/onboarding';
              } else {
                // User logged in
                targetRoute = seenOnboarding ? '/(tabs)/' : '/onboarding';
              }

              console.log('🔄 Redirecting from _redirect screen:', {
                hasUser: !!user,
                seenOnboarding,
                targetRoute
              });

              if (mounted) {
                // Use replace to prevent back navigation to this redirect screen
                router.replace(targetRoute as any);
              }

              unsubscribe();
            } catch (error) {
              console.error('❌ Error in redirect:', error);
              // Fallback to sign-in on error
              if (mounted) {
                router.replace('/auth/signin-firebase' as any);
              }
              unsubscribe();
            }
          })();
        });
      } catch (error) {
        console.error('❌ Error in performRedirect:', error);
        // Fallback to sign-in on error
        if (mounted) {
          router.replace('/auth/signin-firebase' as any);
        }
      }
    };

    // Small delay to ensure Firebase auth is initialized
    const timer = setTimeout(() => {
      performRedirect();
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [router]);

  // Show loading screen while redirecting
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ActivityIndicator size="large" color={themeColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
