import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Animated as RNAnimated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../lib/theme-context';
import ScannerScreen from '../app/(tabs)/scanner';
import RecommendationsScreen from '../app/(tabs)/recommendations';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.85;

interface TopSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function TopSheet({ visible, onClose }: TopSheetProps) {
  const themeColors = useThemeColors();
  const translateY = useRef(new RNAnimated.Value(-SHEET_HEIGHT)).current;
  const [activeTab, setActiveTab] = useState<'scan' | 'recommendations'>('scan');
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        (translateY as any).flattenOffset();
        const shouldClose = gestureState.dy < -100 || gestureState.vy < -0.5;
        if (shouldClose) {
          RNAnimated.spring(translateY, {
            toValue: -SHEET_HEIGHT,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start(onClose);
        } else {
          RNAnimated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      console.log('📱 TopSheet: Opening sheet...');
      RNAnimated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      console.log('📱 TopSheet: Closing sheet...');
      RNAnimated.spring(translateY, {
        toValue: -SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFillObject, styles.backdrop]}
        activeOpacity={1}
        onPress={onClose}
      />

      <RNAnimated.View
        style={[
          styles.sheet,
          { backgroundColor: themeColors.background },
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: themeColors.border }]} />

          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Quick Actions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'scan' && {
                  backgroundColor: themeColors.primary,
                  borderBottomColor: themeColors.primary,
                },
              ]}
              onPress={() => setActiveTab('scan')}
            >
              <Ionicons
                name="qr-code"
                size={20}
                color={activeTab === 'scan' ? themeColors.buttonText : themeColors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'scan' ? themeColors.buttonText : themeColors.textSecondary,
                  },
                ]}
              >
                Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'recommendations' && {
                  backgroundColor: themeColors.primary,
                  borderBottomColor: themeColors.primary,
                },
              ]}
              onPress={() => setActiveTab('recommendations')}
            >
              <Ionicons
                name="sparkles"
                size={20}
                color={
                  activeTab === 'recommendations' ? themeColors.buttonText : themeColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'recommendations'
                        ? themeColors.buttonText
                        : themeColors.textSecondary,
                  },
                ]}
              >
                For You
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'scan' ? (
              <View style={styles.screenContainer}>
                <ScannerScreen />
              </View>
            ) : (
              <View style={styles.screenContainer}>
                <RecommendationsScreen />
              </View>
            )}
          </View>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 10,
    zIndex: 1000,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

