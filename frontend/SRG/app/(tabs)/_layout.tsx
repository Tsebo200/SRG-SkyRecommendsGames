import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../lib/theme-context';

export default function TabLayout() {
  const themeColors = useThemeColors();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tabBarActive,
        tabBarInactiveTintColor: themeColors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: themeColors.tabBar,
          paddingTop: 10,
        },
        tabBarBackground: () => {
          // For High Contrast theme, use solid background instead of blur
          if (themeColors.tabBar === '#DDDDDD') {
            return (
              <View 
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: themeColors.tabBar }
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
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          href: null, // Hide from tab bar
          title: 'Scan QR Code',
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          href: null, // Hide from tab bar
          title: 'For You',
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