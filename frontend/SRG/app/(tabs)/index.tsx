import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../lib/theme-context';
import { useState } from 'react';
import BottomSheet from '../../components/BottomSheet';

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  
  return (
    <>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.welcomeCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.title, { color: themeColors.text }]}>Sky Recommends Games</Text>
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
