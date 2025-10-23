import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HybridAuthService } from '../../lib/hybrid-auth';
import { UserMappingService } from '../../lib/user-mapping';
import { HybridFavouritesService } from '../../lib/favourites-hybrid';
import { ColorThemeService, ColorTheme } from '../../lib/color-themes';
import ColorThemeSelector from '../../components/ColorThemeSelector';
import NetworkStatus from '../../components/NetworkStatus';
import AvatarPicker from '../../components/AvatarPicker';
import { useTheme, useThemeColors, useIsDarkTheme } from '../../lib/theme-context';

export default function ProfileFirebaseScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showAccessibilitySelector, setShowAccessibilitySelector] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [accessibilityOptions, setAccessibilityOptions] = useState<any[]>([]);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [userAvatarSeed, setUserAvatarSeed] = useState<string>('');
  
  // Use theme context
  const { currentTheme, setTheme } = useTheme();
  const themeColors = useThemeColors();
  const isDarkTheme = useIsDarkTheme();

  useEffect(() => {
    loadUserProfile();
    loadUserAvatar();
    // Preload accessibility options
    setAccessibilityOptions(ColorThemeService.getAvailableAccessibilityThemes());
  }, []);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      const savedSeed = await AsyncStorage.getItem('user_avatar_seed');
      if (savedAvatar && savedSeed) {
        setUserAvatar(savedAvatar);
        setUserAvatarSeed(savedSeed);
      }
    } catch (error) {
      console.error('❌ Error loading user avatar:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get Firebase user
      const firebaseUser = HybridAuthService.getCurrentUser();
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get Supabase user profile
        const supabaseProfile = await UserMappingService.getUserProfile();
        console.log('🔍 Supabase profile:', supabaseProfile);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (theme: ColorTheme) => {
    try {
      const success = await setTheme(theme.id);
      if (success) {
        setShowThemeSelector(false);
        console.log('🎨 Theme changed to:', theme.name);
      }
    } catch (error) {
      console.error('❌ Error changing theme:', error);
    }
  };

  const handleAccessibilityChange = async (themeId: string) => {
    try {
      const success = await ColorThemeService.setAccessibilityTheme(themeId);
      if (success) {
        // Nudge theme context by re-applying current mode via legacy setter
        await setTheme(ColorThemeService.isDarkTheme() ? 'dark' : 'light');
        setShowAccessibilitySelector(false);
        console.log('🎨 Accessibility theme changed to:', ColorThemeService.getCurrentAccessibilityTheme().name);
      }
    } catch (error) {
      console.error('❌ Error changing accessibility theme:', error);
    }
  };

  const handleDarkModeToggle = async (isDark: boolean) => {
    try {
      const themeId = isDark ? 'dark' : 'light';
      const success = await setTheme(themeId);
      if (success) {
        console.log('🌙 Dark mode toggled:', isDark ? 'ON' : 'OFF');
      }
    } catch (error) {
      console.error('❌ Error toggling dark mode:', error);
    }
  };

  const handleAvatarSelect = (avatarUrl: string, seed: string) => {
    setUserAvatar(avatarUrl);
    setUserAvatarSeed(seed);
    setShowAvatarPicker(false);
    console.log('🎨 Avatar selected:', seed);
    
    // Save avatar to AsyncStorage
    AsyncStorage.setItem('user_avatar', avatarUrl);
    AsyncStorage.setItem('user_avatar_seed', seed);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access your favourites.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              console.log('🔄 Starting complete logout process...');
              
              // Step 1: Sign out from Firebase and notify Supabase
              console.log('🔄 Step 1: Firebase logout...');
              const signOutResult = await HybridAuthService.signOut();
              
              if (signOutResult.success) {
                // Step 2: Clear user-specific data from local storage
                console.log('🔄 Step 2: Clearing local user data...');
                await HybridFavouritesService.clearUserData();
                await clearLocalData();
                
                console.log('✅ Complete logout successful');
              } else {
                throw new Error(signOutResult.error || 'Sign out failed');
              }
              
              // Show success message
              Alert.alert(
                'Signed Out', 
                'You have been successfully signed out.',
                [{ text: 'OK' }]
              );
              
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const clearLocalData = async () => {
    try {
      // Clear known user-specific keys directly
      const userKeys = [
        'user_favourites',
        'favourites_sync_status',
        'user_favourites_sync_timestamp',
        'user_favourites_last_sync'
      ];
      
      // Remove each key individually (multiRemove not available)
      for (const key of userKeys) {
        await AsyncStorage.removeItem(key);
      }
      console.log('🧹 Cleared local user data:', userKeys);
      
    } catch (error) {
      console.error('❌ Error clearing local data:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Manage your account</Text>

        {user && (
          <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity 
              style={[styles.avatar, { backgroundColor: themeColors.primary }]}
              onPress={() => setShowAvatarPicker(true)}
              activeOpacity={0.8}
            >
              {userAvatar ? (
                <Image 
                  source={{ uri: userAvatar }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarText, { color: themeColors.buttonText }]}>
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                {user.displayName || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
                {user.email}
              </Text>
              <Text style={[styles.userId, { color: themeColors.textSecondary }]}>
                Firebase UID: {user.uid}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Account</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]}> 
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuText, { color: themeColors.text }]}>Edit Profile</Text>
              <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]}> 
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuText, { color: themeColors.text }]}>Privacy Settings</Text>
              <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]}> 
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuText, { color: themeColors.text }]}>Notifications</Text>
              <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Network</Text>
          <NetworkStatus />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text>
          
          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.menuItemContent}>
              <View style={styles.darkModeContent}>
                <Text style={[styles.menuText, { color: themeColors.text }]}>
                  {isDarkTheme ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.darkModeSubtext, { color: themeColors.textSecondary }]}>
                  {isDarkTheme ? 'Easy on the eyes in low light' : 'Clean and bright interface'}
                </Text>
              </View>
              <Switch
                value={isDarkTheme}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={isDarkTheme ? themeColors.buttonText : themeColors.background}
                ios_backgroundColor={themeColors.border}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
            onPress={() => setShowThemeSelector(!showThemeSelector)}
          >
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuText, { color: themeColors.text }]}>Colour Theme</Text>
              <View style={styles.themeInfo}>
                <Text style={[styles.currentThemeText, { color: themeColors.textSecondary }]}>
                  {currentTheme?.name || 'Loading...'}
                </Text>
                <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}>
                  {showThemeSelector ? '▼' : '›'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Colour Palette Preview */}

          {showThemeSelector && (
            <View style={[styles.themeSelectorContainer, { backgroundColor: themeColors.background }]}> 
              <ColorThemeSelector onThemeChange={handleThemeChange} />
            </View>
          )}

          {/* Colour Mode Support */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
            onPress={() => setShowAccessibilitySelector(!showAccessibilitySelector)}
          >
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuText, { color: themeColors.text }]}>Colour Mode </Text>
              <View style={styles.themeInfo}>
                <Text style={[styles.currentThemeText, { color: themeColors.textSecondary }]}> 
                  {ColorThemeService.getCurrentAccessibilityTheme().name}
                </Text>
                <Text style={[styles.menuArrow, { color: themeColors.textSecondary }]}> 
                  {showAccessibilitySelector ? '▼' : '›'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {showAccessibilitySelector && (
            <View style={[
              styles.themeSelectorContainer, 
              { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }
            ]}> 
              {accessibilityOptions.map((opt) => {
                const isSelected = ColorThemeService.getCurrentAccessibilityTheme().id === opt.id;
                const colors = ColorThemeService.isDarkTheme() ? opt.darkColors : opt.lightColors;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.accessibilityCard,
                      { backgroundColor: themeColors.surface, borderColor: isSelected ? themeColors.primary : themeColors.border }
                    ]}
                    onPress={() => handleAccessibilityChange(opt.id)}
                  >
                    <View style={styles.accessibilityHeader}>
                      <Text style={[styles.accessibilityName, { color: themeColors.text }]}>{opt.name}</Text>
                      {isSelected && (
                        <Text style={[styles.selectedIndicator, { color: themeColors.primary }]}>✓</Text>
                      )}
                    </View>
                    <Text style={[styles.accessibilityDescription, { color: themeColors.textSecondary }]}>
                      {opt.description}
                    </Text>
                    <View style={styles.accessibilityPreview}>
                      <View style={[styles.previewSwatch, { backgroundColor: colors.primary }]} />
                      <View style={[styles.previewSwatch, { backgroundColor: colors.secondary }]} />
                      <View style={[styles.previewSwatch, { backgroundColor: colors.accent }]} />
                      <View style={[styles.previewSwatch, { backgroundColor: colors.success }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.signOutButton, 
              { backgroundColor: themeColors.error, marginTop: 30 },
              signingOut && styles.signOutButtonDisabled
            ]}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color={themeColors.buttonText} />
            ) : (
              <Text style={[styles.signOutText, { color: themeColors.buttonText }]}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Help Center</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Contact Us</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity> */}
        </View>

        
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              onPress={() => setShowAvatarPicker(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: themeColors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Choose Avatar
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          <AvatarPicker
            onAvatarSelect={handleAvatarSelect}
            currentAvatar={userAvatar}
            currentSeed={userAvatarSeed}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Add space for tab bar
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentThemeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  darkModeContent: {
    flex: 1,
  },
  darkModeSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  themeSelectorContainer: {
    marginTop: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  inlineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accessibilityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accessibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accessibilityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accessibilityDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  accessibilityPreview: {
    flexDirection: 'row',
  },
  previewSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  selectedIndicator: {
    fontSize: 18,
    fontWeight: '700',
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
  },
  menuArrow: {
    fontSize: 20,
    color: '#8E8E93',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutButtonDisabled: {
    backgroundColor: '#4A4A4A',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
});
