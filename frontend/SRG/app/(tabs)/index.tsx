import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../lib/theme-context';
import { useGradientColor } from '../../lib/gradient-color-context';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '../../components/BottomSheet';
import { HybridAuthService } from '../../lib/hybrid-auth';
import { UserMappingService } from '../../lib/user-mapping';

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const { setGradientColor } = useGradientColor();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);
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
      // non-fatal
    }
  };

  // Listen for motion setting changes
  useEffect(() => {
    const checkMotionSetting = async () => {
      try {
        const motion = await AsyncStorage.getItem('motion_enabled');
        if (motion !== null) {
          const enabled = motion === 'true';
          setMotionEnabled(enabled);
        }
      } catch (e) {
        // non-fatal
      }
    };

    // Check every second for changes
    const interval = setInterval(checkMotionSetting, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (motionEnabled) {
      // Animate gradient through colors continuously using opacity with reverse
      const createGradientSequence = () => {
        return Animated.sequence([
          // Forward: Blue → Purple → Pink → Green
          // Blue gradient
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          // Purple gradient
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          // Pink gradient
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          // Green gradient
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 1, duration: 2000, useNativeDriver: true }),
          ]),
          // Reverse: Green → Pink → Purple → Blue
          // Pink gradient (reverse)
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          // Purple gradient (reverse)
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          // Blue gradient (reverse)
          Animated.parallel([
            Animated.timing(gradientOpacity1, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity3, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(gradientOpacity4, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]);
      };

      // Track gradient color with easing - sync with gradient animation
      const gradientColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']; // Blue, Purple, Pink, Green
      
      // Set initial color
      setGradientColor(gradientColors[0]);
      
      // Create color animation sequence with easing to match gradient animation
      const createColorSequence = () => {
        return Animated.sequence([
          // Forward: Blue → Purple → Pink → Green
          // Blue (0-2s)
          Animated.timing(colorProgress, { 
            toValue: 0, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Purple (2-4s)
          Animated.timing(colorProgress, { 
            toValue: 1, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Pink (4-6s)
          Animated.timing(colorProgress, { 
            toValue: 2, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Green (6-8s)
          Animated.timing(colorProgress, { 
            toValue: 3, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Reverse: Green → Pink → Purple → Blue
          // Pink reverse (8-10s)
          Animated.timing(colorProgress, { 
            toValue: 2, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Purple reverse (10-12s)
          Animated.timing(colorProgress, { 
            toValue: 1, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
          // Blue reverse (12-14s)
          Animated.timing(colorProgress, { 
            toValue: 0, 
            duration: 2000, 
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false 
          }),
        ]);
      };
      
      // Start the gradient animation
      animationRef.current = Animated.loop(createGradientSequence());
      animationRef.current.start();
      
      // Start the color animation with easing
      colorAnimationRef.current = Animated.loop(createColorSequence());
      colorAnimationRef.current.start();
      
      // Listen to color progress changes and update color context with easing
      // The value goes: 0 (Blue) → 1 (Purple) → 2 (Pink) → 3 (Green) → 2 (Pink) → 1 (Purple) → 0 (Blue)
      let lastColorIndex = 0;
      const colorListener = colorProgress.addListener(({ value }) => {
        // Map the animated value to the correct color
        // 0 = Blue, 1 = Purple, 2 = Pink, 3 = Green
        // For reverse: 3 → 2 → 1 → 0
        const rounded = Math.round(value);
        let colorIndex: number;
        
        if (rounded >= 0 && rounded <= 3) {
          // Use the rounded value directly to get the color
          // This handles both forward and reverse transitions
          colorIndex = rounded;
        } else {
          // Fallback to blue
          colorIndex = 0;
        }
        
        // Only update if the color actually changed to avoid unnecessary re-renders
        if (colorIndex !== lastColorIndex) {
          lastColorIndex = colorIndex;
          const newColor = gradientColors[colorIndex];
          setGradientColor(newColor);
        }
      });
      
      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
        if (colorAnimationRef.current) {
          colorAnimationRef.current.stop();
          colorAnimationRef.current = null;
        }
        colorProgress.removeListener(colorListener);
      };
    } else {
      // Pause animation at current state - don't change opacity values
      // The animation is already stopped above, so the current values remain
      // Keep the last color
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
        colorAnimationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
        colorAnimationRef.current = null;
      }
    };
  }, [motionEnabled, setGradientColor]);

  const Bubbles = () => {
    const configs = [
      { size: 220, top: -40, left: -60, baseOpacity: 0.40, duration: 7000, delay: 0 },
      { size: 160, top: 120, right: -40, baseOpacity: 0.38, duration: 6000, delay: 400 },
      { size: 120, top: 320, left: -30, baseOpacity: 0.35, duration: 6500, delay: 800 },
      { size: 260, bottom: -80, right: -100, baseOpacity: 0.32, duration: 8000, delay: 1200 },
      { size: 140, bottom: 120, left: 40, baseOpacity: 0.36, duration: 7500, delay: 1600 },
    ] as Array<{ size: number; top?: number; left?: number; right?: number; bottom?: number; baseOpacity: number; duration: number; delay: number }>;

    const translateVals = useRef(configs.map(() => new Animated.Value(0))).current;
    const scaleVals = useRef(configs.map(() => new Animated.Value(1))).current;
    const opacityVals = useRef(configs.map(() => new Animated.Value(0))).current;
    const bubbleAnimationsRef = useRef<Array<{ float: Animated.CompositeAnimation; pulse: Animated.CompositeAnimation; fade: Animated.CompositeAnimation }>>([]);

    useEffect(() => {
      // Stop all existing animations
      bubbleAnimationsRef.current.forEach(a => {
        a.float.stop();
        a.pulse.stop();
        a.fade.stop();
      });
      bubbleAnimationsRef.current = [];

      if (motionEnabled) {
        const animations = configs.map((cfg, i) => {
          const float = Animated.loop(
            Animated.sequence([
              Animated.timing(translateVals[i], { toValue: 10, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
              Animated.timing(translateVals[i], { toValue: 0, duration: cfg.duration, useNativeDriver: true }),
            ])
          );
          const pulse = Animated.loop(
            Animated.sequence([
              Animated.timing(scaleVals[i], { toValue: 1.06, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
              Animated.timing(scaleVals[i], { toValue: 1.0, duration: cfg.duration, useNativeDriver: true }),
            ])
          );
          const fade = Animated.loop(
            Animated.sequence([
              Animated.timing(opacityVals[i], { toValue: 1, duration: cfg.duration, delay: cfg.delay, useNativeDriver: true }),
              Animated.timing(opacityVals[i], { toValue: 0, duration: cfg.duration, useNativeDriver: true }),
            ])
          );
          float.start();
          pulse.start();
          fade.start();
          return { float, pulse, fade };
        });
        bubbleAnimationsRef.current = animations;
      } else {
        // Pause bubbles at current state - don't change values
        // The animations are already stopped above, so the current values remain
      }

      return () => {
        bubbleAnimationsRef.current.forEach(a => {
          a.float.stop();
          a.pulse.stop();
          a.fade.stop();
        });
        bubbleAnimationsRef.current = [];
      };
    }, [motionEnabled]);

    // White bubbles with shine
    const bubbleColor = '#FFFFFF'; // White

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {configs.map((b, idx) => {
          const animatedOpacity = opacityVals[idx].interpolate({ 
            inputRange: [0, 1], 
            outputRange: [b.baseOpacity, Math.min(b.baseOpacity + 0.15, 0.65)] 
          });

          return (
            <Animated.View
              key={`bubble-${idx}`}
              style={[
                styles.bubble,
                {
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  backgroundColor: bubbleColor,
                  top: b.top,
                  left: b.left,
                  right: b.right,
                  bottom: b.bottom,
                  opacity: animatedOpacity,
                  transform: [
                    { translateY: translateVals[idx] },
                    { scale: scaleVals[idx] },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      setLoading(true);
      
      // First try to get username from Firebase displayName
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (firebaseUser?.displayName) {
        setUsername(firebaseUser.displayName);
        setLoading(false);
        return;
      }

      // If no Firebase displayName, try Supabase
      const supabaseProfile = await UserMappingService.getUserProfile();
      if (supabaseProfile?.display_name) {
        setUsername(supabaseProfile.display_name);
      }
    } catch (error) {
      console.error('❌ Error loading username:', error);
    } finally {
      setLoading(false);
    }
  };

  const welcomeText = username ? `Welcome ${username}` : 'Welcome';
  
  return (
    <>
      <View style={styles.container}>
        {/* Animated gradient background - Blue, Purple, Pink, Green */}
        <View style={StyleSheet.absoluteFill}>
          {/* Blue gradient */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity1 }]}>
            <LinearGradient
              colors={['#06B6D4', '#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Purple gradient */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity2 }]}>
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Pink gradient */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity3 }]}>
            <LinearGradient
              colors={['#EC4899', '#F472B6', '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Green gradient */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity4 }]}>
            <LinearGradient
              colors={['#10B981', '#34D399', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Bubbles />
        <View style={[styles.welcomeCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>{welcomeText}</Text>
          <Text style={[styles.subtitle, { color: '#FFFFFF', opacity: 0.9 }]}>AI-Powered Game Recommendations</Text>
          <Text style={[styles.description, { color: '#FFFFFF', opacity: 0.8 }]}>
            Discover your next favourite game with personalised recommendations based on your gaming profile.
          </Text>

          <TouchableOpacity
            style={[styles.quickActionsButton, { backgroundColor: themeColors.primary }]}
            onPress={() => {
              console.log('🎯 Opening BottomSheet...');
              setBottomSheetVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionsContent}>
              <Ionicons name="options" size={24} color="#FFFFFF" />
              <View style={styles.quickActionsTextContainer}>
                <Text style={[styles.quickActionsText, { color: '#FFFFFF' }]}>Quick Actions</Text>
                <Text style={[styles.quickActionsSubtext, { color: '#FFFFFF', opacity: 0.8 }]}>
                  Scan QR codes & Get Recommendations
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.navigationHint, { color: themeColors.textSecondary }]}>
            Use the tabs below to navigate between sections
          </Text>
        </View>
      </View>

      <BottomSheet visible={bottomSheetVisible} onClose={() => setBottomSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  navigationHint: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  quickActionsButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  quickActionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quickActionsTextContainer: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsSubtext: {
    fontSize: 12,
    opacity: 0.8,
  },
});
