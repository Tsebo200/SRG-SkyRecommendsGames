import React, { useMemo, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../lib/theme-context';
import { useGradientColor } from '../../lib/gradient-color-context';

function TabLayoutContent() {
  const themeColors = useThemeColors();
  const { currentGradientColor } = useGradientColor();
  
  // Extract specific primitive values immediately to break object reference chain
  const tabBarActiveBase = themeColors.tabBarActive;
  const tabBarInactive = themeColors.tabBarInactive;
  const tabBarBg = themeColors.tabBar;
  const isHighContrast = tabBarBg === '#DDDDDD';
  
  // Use a ref to store the stable screenOptions and only update when theme changes
  // This prevents infinite loops from gradient color changes
  const screenOptionsRef = useRef<any>(null);
  const lastThemeKeyRef = useRef<string>('');
  
  // Create a stable key based on theme colors (not gradient color)
  const themeKey = `${tabBarActiveBase}-${tabBarInactive}-${tabBarBg}`;
  
  // Only recreate screenOptions when theme actually changes, not when gradient color changes
  if (screenOptionsRef.current === null || lastThemeKeyRef.current !== themeKey) {
    const tabBarStyle = {
      position: 'absolute' as const,
      borderTopWidth: 0,
      elevation: 0,
      backgroundColor: tabBarBg,
      paddingTop: 10,
    };
    
    const tabBarBackgroundFn = () => {
      // For High Contrast theme, use solid background instead of blur
      if (isHighContrast) {
        return (
          <View 
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: tabBarBg }
            ]} 
          />
        );
      }
      return (
        <BlurView
          tint="dark"
          intensity={Platform.OS === 'ios' ? 80 : 100}
          style={StyleSheet.absoluteFillObject}
        />
      );
    };
    
    screenOptionsRef.current = {
      tabBarActiveTintColor: tabBarActiveBase, // Use base color, not gradient
      tabBarInactiveTintColor: tabBarInactive,
      headerShown: false,
      tabBarStyle,
      tabBarBackground: tabBarBackgroundFn,
    };
    
    lastThemeKeyRef.current = themeKey;
  }
  
  // Update active tab color separately when gradient changes (but don't recreate screenOptions)
  // This is a workaround - we'll update the color via a different mechanism if needed
  const screenOptions = screenOptionsRef.current;
  
  return (
    <Tabs
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="for-you"
        options={{
          title: 'For You',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          href: null, // Hide from tab bar (now accessible via For You tab)
          title: 'Scan QR Code',
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          href: null, // Hide from tab bar (now accessible via For You tab)
          title: 'Recommendations',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Favourites',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

    </Tabs>
  );
}

export default function TabLayout() {
  // Providers are already in root _layout.tsx, so we don't need them here
  return <TabLayoutContent />;
}