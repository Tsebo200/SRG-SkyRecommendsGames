import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../lib/theme-context';
import { useGradientColor } from '../../lib/gradient-color-context';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '../../components/BottomSheet';
import { HybridAuthService } from '../../lib/hybrid-auth';
import { UserMappingService } from '../../lib/user-mapping';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const { setGradientColor } = useGradientColor();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const router = useRouter();
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);

  // Animated gradient colors - blue, purple, pink, green
  const gradientOpacity1 = useRef(new Animated.Value(1)).current;
  const gradientOpacity2 = useRef(new Animated.Value(0)).current;
  const gradientOpacity3 = useRef(new Animated.Value(0)).current;
  const gradientOpacity4 = useRef(new Animated.Value(0)).current;
  
  // Animated value for color transitions with easing
  const colorProgress = useRef(new Animated.Value(0)).current;
  const colorAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Load motion setting
  useEffect(() => {
    loadMotionSetting();
  }, []);

  const loadMotionSetting = async () => {
    try {
      const motion = await AsyncStorage.getItem('motion_enabled');
      if (motion !== null) {
        setMotionEnabled(motion === 'true');
      }
    } catch (e) {
    }
  };

  // Listen for motion setting changes
  useEffect(() => {
    const listener = async () => {
      try {
        const motion = await AsyncStorage.getItem('motion_enabled');
        if (motion !== null) {
          setMotionEnabled(motion === 'true');
        }
      } catch (e) {
      }
    };

    // Check immediately
    listener();

    // Set up interval to check for changes
    const interval = setInterval(listener, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load username
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const user = await HybridAuthService.getCurrentUser();
        if (user) {
          setUsername(user.displayName || user.email || 'User');
        }
      } catch (error) {
        console.error('Error loading username:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsername();
  }, []);


  // Gradient animation when motion is enabled
  useEffect(() => {
    if (!motionEnabled) {
      // Stop all animations
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
      }
      // Reset to first gradient
      gradientOpacity1.setValue(1);
      gradientOpacity2.setValue(0);
      gradientOpacity3.setValue(0);
      gradientOpacity4.setValue(0);
      return;
    }

    // Start gradient animation
    const animateGradients = () => {
      // Sequence: 1 -> 2 -> 3 -> 4 -> 1 (loop)
      const sequence = Animated.sequence([
        // Fade out 1, fade in 2
        Animated.parallel([
          Animated.timing(gradientOpacity1, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(gradientOpacity2, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Fade out 2, fade in 3
        Animated.parallel([
          Animated.timing(gradientOpacity2, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(gradientOpacity3, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Fade out 3, fade in 4
        Animated.parallel([
          Animated.timing(gradientOpacity3, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(gradientOpacity4, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Fade out 4, fade in 1
        Animated.parallel([
          Animated.timing(gradientOpacity4, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(gradientOpacity1, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]);

      animationRef.current = Animated.loop(sequence);
      animationRef.current.start();
    };

    animateGradients();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [motionEnabled]);

  // Update gradient color for other components when motion is enabled
  useEffect(() => {
    if (motionEnabled) {
      // Update gradient color based on current visible gradient
      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']; // blue, purple, pink, green
      
      // Simple approach: cycle through colors
      let currentIndex = 0;
      const interval = setInterval(() => {
        setGradientColor(colors[currentIndex]);
        currentIndex = (currentIndex + 1) % colors.length;
      }, 2000); // Change every 2 seconds to match animation

      return () => clearInterval(interval);
    } else {
      setGradientColor(null as any);
    }
  }, [motionEnabled, setGradientColor]);

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleRecommendationsPress = () => {
    router.push('/(tabs)/recommendations');
  };

  const handleScannerPress = () => {
    router.push('/(tabs)/scanner');
  };

  const handleViewGuide = async () => {
    // Navigate to onboarding guide (don't reset flag, just show it)
    router.push('/onboarding');
  };

  const handleAwardsPress = () => {
    router.push('/awards');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Animated gradient backgrounds */}
      {motionEnabled && (
        <>
          <Animated.View style={[styles.gradientContainer, { opacity: gradientOpacity1 }]}>
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View style={[styles.gradientContainer, { opacity: gradientOpacity2 }]}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View style={[styles.gradientContainer, { opacity: gradientOpacity3 }]}>
            <LinearGradient
              colors={['#EC4899', '#BE185D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View style={[styles.gradientContainer, { opacity: gradientOpacity4 }]}>
            <LinearGradient
              colors={['#10B981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </>
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>Sky Recommends Games</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          AI-Powered Game Recommendations
        </Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          Discover your next favourite game with personalised recommendations based on your gaming profile.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSearchPress}
          >
            <Ionicons name="search" size={20} color={themeColors.buttonText} style={styles.buttonIcon} />
            <Text style={[styles.primaryButtonText, { color: themeColors.buttonText }]}>Search Games</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={handleRecommendationsPress}
          >
            <Ionicons name="sparkles" size={20} color={themeColors.primary} style={styles.buttonIcon} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>AI Recommendations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={handleScannerPress}
          >
            <Ionicons name="qr-code" size={20} color={themeColors.primary} style={styles.buttonIcon} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Awards Button */}
        <TouchableOpacity
          style={[styles.awardsButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          onPress={handleAwardsPress}
        >
          <Ionicons name="trophy" size={20} color={themeColors.primary} style={styles.buttonIcon} />
          <Text style={[styles.awardsButtonText, { color: themeColors.text }]}>
            View Award-Winning Games
          </Text>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* View Guide Button */}
        <TouchableOpacity
          style={[styles.guideButton, { borderColor: themeColors.border }]}
          onPress={handleViewGuide}
        >
          <Ionicons name="book-outline" size={18} color={themeColors.textSecondary} />
          <Text style={[styles.guideButtonText, { color: themeColors.textSecondary }]}>
            View How to Use Guide
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 124,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: -12,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 40,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  guideButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  awardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  awardsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
});
