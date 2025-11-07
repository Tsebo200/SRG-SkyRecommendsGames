import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../lib/theme-context';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '../../components/BottomSheet';
import { HybridAuthService } from '../../lib/hybrid-auth';
import { UserMappingService } from '../../lib/user-mapping';

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animated gradient colors - blue, purple, pink, green
  const gradientOpacity1 = useRef(new Animated.Value(1)).current;
  const gradientOpacity2 = useRef(new Animated.Value(0)).current;
  const gradientOpacity3 = useRef(new Animated.Value(0)).current;
  const gradientOpacity4 = useRef(new Animated.Value(0)).current;
  
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

      animationRef.current = Animated.loop(createGradientSequence());
      animationRef.current.start();
    } else {
      // Pause animation at current state - don't change opacity values
      // The animation is already stopped above, so the current values remain
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [motionEnabled]);

  const Bubbles = () => {
    const configs = [
      { size: 220, top: -40, left: -60, baseOpacity: 0.25, duration: 7000, delay: 0 },
      { size: 160, top: 120, right: -40, baseOpacity: 0.22, duration: 6000, delay: 400 },
      { size: 120, top: 320, left: -30, baseOpacity: 0.20, duration: 6500, delay: 800 },
      { size: 260, bottom: -80, right: -100, baseOpacity: 0.18, duration: 8000, delay: 1200 },
      { size: 140, bottom: 120, left: 40, baseOpacity: 0.19, duration: 7500, delay: 1600 },
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

    // Bubble colors that match the gradient
    const bubbleColors = {
      blue: '#3B82F6',      // Blue
      purple: '#8B5CF6',    // Purple
      pink: '#EC4899',      // Pink
      green: '#10B981',     // Green
    };

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {configs.map((b, idx) => {
          const animatedOpacity = opacityVals[idx].interpolate({ 
            inputRange: [0, 1], 
            outputRange: [b.baseOpacity, Math.min(b.baseOpacity + 0.1, 0.35)] 
          });
          
          // Combine bubble opacity with gradient opacity to sync colors
          const blueBubbleOpacity = Animated.multiply(
            animatedOpacity,
            gradientOpacity1
          );
          const purpleBubbleOpacity = Animated.multiply(
            animatedOpacity,
            gradientOpacity2
          );
          const pinkBubbleOpacity = Animated.multiply(
            animatedOpacity,
            gradientOpacity3
          );
          const greenBubbleOpacity = Animated.multiply(
            animatedOpacity,
            gradientOpacity4
          );

          return (
            <View key={`bubble-container-${idx}`} style={StyleSheet.absoluteFill}>
              {/* Blue bubbles */}
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    width: b.size,
                    height: b.size,
                    borderRadius: b.size / 2,
                    backgroundColor: bubbleColors.blue,
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    bottom: b.bottom,
                    opacity: blueBubbleOpacity,
                    transform: [
                      { translateY: translateVals[idx] },
                      { scale: scaleVals[idx] },
                    ],
                  },
                ]}
              />
              {/* Purple bubbles */}
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    width: b.size,
                    height: b.size,
                    borderRadius: b.size / 2,
                    backgroundColor: bubbleColors.purple,
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    bottom: b.bottom,
                    opacity: purpleBubbleOpacity,
                    transform: [
                      { translateY: translateVals[idx] },
                      { scale: scaleVals[idx] },
                    ],
                  },
                ]}
              />
              {/* Pink bubbles */}
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    width: b.size,
                    height: b.size,
                    borderRadius: b.size / 2,
                    backgroundColor: bubbleColors.pink,
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    bottom: b.bottom,
                    opacity: pinkBubbleOpacity,
                    transform: [
                      { translateY: translateVals[idx] },
                      { scale: scaleVals[idx] },
                    ],
                  },
                ]}
              />
              {/* Green bubbles */}
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    width: b.size,
                    height: b.size,
                    borderRadius: b.size / 2,
                    backgroundColor: bubbleColors.green,
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    bottom: b.bottom,
                    opacity: greenBubbleOpacity,
                    transform: [
                      { translateY: translateVals[idx] },
                      { scale: scaleVals[idx] },
                    ],
                  },
                ]}
              />
            </View>
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
              <Ionicons name="options" size={24} color={themeColors.buttonText} />
              <View style={styles.quickActionsTextContainer}>
                <Text style={[styles.quickActionsText, { color: themeColors.buttonText }]}>Quick Actions</Text>
                <Text style={[styles.quickActionsSubtext, { color: themeColors.buttonText, opacity: 0.8 }]}>
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
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
