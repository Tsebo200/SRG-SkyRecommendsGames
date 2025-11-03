import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../lib/theme-context';
import { useState, useEffect, useRef } from 'react';
import BottomSheet from '../../components/BottomSheet';
import { HybridAuthService } from '../../lib/hybrid-auth';
import { UserMappingService } from '../../lib/user-mapping';

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const Bubbles = () => {
    const configs = [
      { size: 220, top: -40, left: -60, baseOpacity: 0.12, duration: 7000, delay: 0 },
      { size: 160, top: 120, right: -40, baseOpacity: 0.10, duration: 6000, delay: 400 },
      { size: 120, top: 320, left: -30, baseOpacity: 0.08, duration: 6500, delay: 800 },
      { size: 260, bottom: -80, right: -100, baseOpacity: 0.06, duration: 8000, delay: 1200 },
      { size: 140, bottom: 120, left: 40, baseOpacity: 0.07, duration: 7500, delay: 1600 },
    ] as Array<{ size: number; top?: number; left?: number; right?: number; bottom?: number; baseOpacity: number; duration: number; delay: number }>;

    const translateVals = useRef(configs.map(() => new Animated.Value(0))).current;
    const scaleVals = useRef(configs.map(() => new Animated.Value(1))).current;
    const opacityVals = useRef(configs.map(() => new Animated.Value(0))).current;

    useEffect(() => {
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
      return () => {
        animations.forEach(a => {
          a.float.stop();
          a.pulse.stop();
          a.fade.stop();
        });
      };
    }, []);

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {configs.map((b, idx) => {
          const animatedOpacity = opacityVals[idx].interpolate({ inputRange: [0, 1], outputRange: [b.baseOpacity, Math.min(b.baseOpacity + 0.06, 0.2)] });
          return (
            <Animated.View
              key={`bubble-${idx}`}
              style={[
                styles.bubble,
                {
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  backgroundColor: themeColors.primary,
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
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Bubbles />
        <View style={[styles.welcomeCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.title, { color: themeColors.text }]}>{welcomeText}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>AI-Powered Game Recommendations</Text>
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
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
    backgroundColor: '#0a0a0a',
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
