import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../lib/theme-context';
import { useRouter } from 'expo-router';
import RecommendationsScreen from './recommendations';
import ScannerScreen from './scanner';

type TabType = 'recommendations' | 'scanner';

export default function ForYouScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Tab Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'recommendations' && [styles.activeTab, { backgroundColor: themeColors.primary }]
          ]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Ionicons 
            name="sparkles" 
            size={20} 
            color={activeTab === 'recommendations' ? themeColors.buttonText : themeColors.textSecondary} 
          />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'recommendations' ? themeColors.buttonText : themeColors.textSecondary }
            ]}
          >
            Recommendations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'scanner' && [styles.activeTab, { backgroundColor: themeColors.primary }]
          ]}
          onPress={() => setActiveTab('scanner')}
        >
          <Ionicons 
            name="qr-code" 
            size={20} 
            color={activeTab === 'scanner' ? themeColors.buttonText : themeColors.textSecondary} 
          />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'scanner' ? themeColors.buttonText : themeColors.textSecondary }
            ]}
          >
            Scan QR Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - Components handle their own SafeAreaView */}
      <View style={styles.content}>
        {activeTab === 'recommendations' ? (
          <View style={styles.screenWrapper}>
            <RecommendationsScreen />
          </View>
        ) : (
          <View style={styles.screenWrapper}>
            <ScannerScreen />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    // Active state styling handled by backgroundColor
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
});
