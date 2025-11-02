import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, Image, Modal, Linking, Clipboard, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { SteamAPIService } from '../../lib/steam-api';

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
  const [userSteamAccount, setUserSteamAccount] = useState<string>('');
  const [showSteamInput, setShowSteamInput] = useState(false);
  const [steamInput, setSteamInput] = useState<string>('');
  
  // Use theme context
  const { currentTheme, setTheme } = useTheme();
  const themeColors = useThemeColors();
  const isDarkTheme = useIsDarkTheme();

  useEffect(() => {
    loadUserProfile();
    loadUserAvatar();
    loadUserSteamAccount();
    // Preload accessibility options
    setAccessibilityOptions(ColorThemeService.getAvailableAccessibilityThemes());
  }, []);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      const savedSeed = await AsyncStorage.getItem('user_avatar_seed');
      if (savedAvatar && savedSeed) {
        // Convert SVG URLs to PNG format for React Native compatibility
        let avatarUrl = savedAvatar;
        if (avatarUrl.includes('/svg?') || avatarUrl.includes('.svg')) {
          avatarUrl = avatarUrl.replace('/svg?', '/png?').replace('.svg', '.png');
          // Update size to 200 for better quality
          avatarUrl = avatarUrl.replace('size=100', 'size=200');
          if (!avatarUrl.includes('size=')) {
            avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 'size=200';
          }
          // Save the updated PNG URL
          await AsyncStorage.setItem('user_avatar', avatarUrl);
        }
        setUserAvatar(avatarUrl);
        setUserAvatarSeed(savedSeed);
      }
    } catch (error) {
      console.error('❌ Error loading user avatar:', error);
    }
  };

  const loadUserSteamAccount = async () => {
    try {
      console.log('🔍 Loading Steam account from AsyncStorage...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', allKeys);
      
      const savedSteamAccount = await AsyncStorage.getItem('user_steam_account');
      console.log('🔍 Raw Steam account from storage:', savedSteamAccount);
      
      if (savedSteamAccount) {
        console.log('✅ Loaded Steam account from storage:', savedSteamAccount);
        console.log('✅ Steam account type:', typeof savedSteamAccount, 'length:', savedSteamAccount.length);
        
        // Check if it's a URL that needs processing
        if (savedSteamAccount.includes('steamcommunity.com') || savedSteamAccount.includes('steam.com')) {
          console.log('🔄 Found Steam URL in storage, processing...');
          try {
            const extractedId = SteamAPIService.extractSteamIdFromUrl(savedSteamAccount);
            if (extractedId) {
              const steamId64 = SteamAPIService.convertToSteamId64(extractedId);
              console.log('🔄 Processed Steam ID64:', steamId64);
              await AsyncStorage.setItem('user_steam_account', steamId64);
              setUserSteamAccount(steamId64);
              console.log('✅ Updated Steam account with processed ID64');
            } else {
              console.log('❌ Failed to extract Steam ID from URL');
              setUserSteamAccount(savedSteamAccount);
            }
          } catch (error) {
            console.error('❌ Error processing Steam URL:', error);
            setUserSteamAccount(savedSteamAccount);
          }
        } else {
          console.log('✅ Using Steam ID directly:', savedSteamAccount);
          setUserSteamAccount(savedSteamAccount);
        }
      } else {
        console.log('❌ No Steam account found in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error loading Steam account:', error);
    }
  };

  const handleSteamAccountSave = async () => {
    if (!steamInput.trim()) {
      Alert.alert('Error', 'Please enter a Steam ID or profile URL');
      return;
    }

    try {
      console.log('🔄 Processing Steam input:', steamInput.trim());
      let processedSteamId = steamInput.trim();
      
      // Check if it's a URL and extract Steam ID
      if (steamInput.includes('steamcommunity.com') || steamInput.includes('steam.com')) {
        console.log('🔄 Detected Steam URL, extracting Steam ID...');
        const extractedId = SteamAPIService.extractSteamIdFromUrl(steamInput);
        console.log('🔄 Extracted Steam ID:', extractedId);
        if (!extractedId) {
          Alert.alert('Error', 'Invalid Steam profile URL');
          return;
        }
        processedSteamId = extractedId;
        console.log('🔄 Using extracted Steam ID:', processedSteamId);
      }
      
      // Validate and convert to Steam ID64
      console.log('🔄 Converting to Steam ID64...');
      let steamId64: string;
      try {
        steamId64 = SteamAPIService.convertToSteamId64(processedSteamId);
        console.log('🔄 Converted Steam ID64:', steamId64);
      } catch (conversionError) {
        console.error('❌ Steam ID conversion failed:', conversionError);
        Alert.alert('Error', `Invalid Steam ID format: ${processedSteamId}. Please enter a valid Steam ID or profile URL.`);
        return;
      }

      // Save the processed Steam ID64
      console.log('🔄 Saving Steam ID64 to storage:', steamId64);
      await AsyncStorage.setItem('user_steam_account', steamId64);
      
      // Verify the save worked
      const verifySave = await AsyncStorage.getItem('user_steam_account');
      console.log('🔍 Verification - Steam account after save:', verifySave);
      
      setUserSteamAccount(steamId64);
      setShowSteamInput(false);
      setSteamInput('');
      console.log('✅ Steam account saved successfully:', steamId64);
      console.log('✅ Steam ID64 type:', typeof steamId64, 'length:', steamId64.length);
      Alert.alert('Success', 'Steam account linked successfully!');
    } catch (error) {
      console.error('❌ Error saving Steam account:', error);
      Alert.alert('Error', 'Failed to save Steam account');
    }
  };

  const handleSteamAccountRemove = async () => {
    try {
      await AsyncStorage.removeItem('user_steam_account');
      setUserSteamAccount('');
      Alert.alert('Success', 'Steam account unlinked successfully!');
    } catch (error) {
      console.error('❌ Error removing Steam account:', error);
      Alert.alert('Error', 'Failed to remove Steam account');
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

  const handleEmailPress = async () => {
    const email = 'tsebo.ramonyalioa.an@gmail.com';
    const url = `mailto:${email}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      await Clipboard.setString(email);
      Alert.alert('Email copied', 'Email address copied to clipboard');
    }
  };

  const handleGithubPress = async () => {
    const url = 'https://github.com/Tsebo200';
    try {
      await Linking.openURL(url);
    } catch (error) {
      await Clipboard.setString(url);
      Alert.alert('Link copied', 'GitHub link copied to clipboard');
    }
  };

  const handleDiscordPress = async () => {
    const username = 'Tsebo200200';
    await Clipboard.setString(username);
    Alert.alert('Discord username copied', `${username} copied to clipboard`);
  };

  const handleLinkedInPress = async () => {
    const url = 'https://www.linkedin.com/in/tsebo-ramonyalioa-2392381b4';
    try {
      await Linking.openURL(url);
    } catch (error) {
      await Clipboard.setString(url);
      Alert.alert('Link copied', 'LinkedIn link copied to clipboard');
    }
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
                  onError={(error) => {
                    console.log('❌ Avatar image failed to load in profile:', userAvatar, error);
                    // If PNG fails, try regenerating with current seed
                    if (userAvatarSeed) {
                      const fallbackUrl = `https://api.dicebear.com/9.x/micah/png?seed=${userAvatarSeed}&size=200&backgroundColor=transparent`;
                      setUserAvatar(fallbackUrl);
                      AsyncStorage.setItem('user_avatar', fallbackUrl);
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Avatar image loaded in profile:', userAvatar);
                  }}
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
                {/* Firebase UID: {user.uid} */}
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
        
{/* Network Status */}


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
          
          {/* <TouchableOpacity 
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
          </TouchableOpacity> */}

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


        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Contact Me (Developer)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactCarousel}>
             <TouchableOpacity style={[styles.contactCard, { backgroundColor: themeColors.surface }]} onPress={handleEmailPress}>
               <Ionicons name="mail" size={20} color={themeColors.primary} />
               <Text style={[styles.contactTitle, { color: themeColors.text }]}>Email</Text>
               <Text style={[styles.contactSubtitle, { color: themeColors.textSecondary }]}>tsebo.ramonyalioa.an@gmail.com</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.contactCard, { backgroundColor: themeColors.surface }]} onPress={handleGithubPress}>
               <Ionicons name="logo-github" size={20} color={themeColors.primary} />
               <Text style={[styles.contactTitle, { color: themeColors.text }]}>GitHub</Text>
               <Text style={[styles.contactSubtitle, { color: themeColors.textSecondary }]}>github.com/Tsebo200</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.contactCard, { backgroundColor: themeColors.surface }]} onPress={handleDiscordPress}>
               <Ionicons name="chatbubbles" size={20} color={themeColors.primary} />
               <Text style={[styles.contactTitle, { color: themeColors.text }]}>Discord</Text>
               <Text style={[styles.contactSubtitle, { color: themeColors.textSecondary }]}>Tsebo200200</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.contactCard, { backgroundColor: themeColors.surface }]} onPress={handleLinkedInPress}>
               <Ionicons name="logo-linkedin" size={20} color={themeColors.primary} />
               <Text style={[styles.contactTitle, { color: themeColors.text }]}>LinkedIn</Text>
               <Text style={[styles.contactSubtitle, { color: themeColors.textSecondary }]}>linkedin.com/in/tsebo-ramonyalioa-2392381b4</Text>
             </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Steam Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Steam Account</Text>
          
          {userSteamAccount ? (
            <View style={[styles.steamAccountCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.steamAccountHeader}>
                <Ionicons name="logo-steam" size={24} color="#007AFF" />
                <View style={styles.steamAccountInfo}>
                  <Text style={[styles.steamAccountTitle, { color: themeColors.text }]}>Linked Steam Account</Text>
                  <Text style={[styles.steamAccountValue, { color: themeColors.textSecondary }]}>{userSteamAccount}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.steamAccountRemoveButton}
                  onPress={handleSteamAccountRemove}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.steamAccountCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.steamAccountHeader}>
                <Ionicons name="logo-steam" size={24} color="#8E8E93" />
                <View style={styles.steamAccountInfo}>
                  <Text style={[styles.steamAccountTitle, { color: themeColors.text }]}>No Steam Account Linked</Text>
                  <Text style={[styles.steamAccountValue, { color: themeColors.textSecondary }]}>Link your Steam account for personalised recommendations</Text>
                </View>
                <TouchableOpacity 
                  style={styles.steamAccountAddButton}
                  onPress={() => setShowSteamInput(true)}
                >
                  <Ionicons name="add" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showSteamInput && (
            <View style={[styles.steamInputCard, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.steamInputTitle, { color: themeColors.text }]}>Link Steam Account</Text>
              <TextInput
                style={[styles.steamInput, { 
                  backgroundColor: themeColors.background, 
                  color: themeColors.text,
                  borderColor: themeColors.border 
                }]}
                placeholder="Steam ID, Steam URL, or Steam username"
                placeholderTextColor={themeColors.textSecondary}
                value={steamInput}
                onChangeText={setSteamInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.steamInputButtons}>
                <TouchableOpacity 
                  style={[styles.steamInputButton, styles.steamInputCancelButton]}
                  onPress={() => {
                    setShowSteamInput(false);
                    setSteamInput('');
                  }}
                >
                  <Text style={styles.steamInputCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.steamInputButton, styles.steamInputSaveButton]}
                  onPress={handleSteamAccountSave}
                >
                  <Text style={styles.steamInputSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
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
  contactCarousel: {
    paddingHorizontal: 16,
    gap: 12,
  },
  contactCard: {
    width: 180,
    height: 105,
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactSubtitle: {
    fontSize: 12,
  },
  steamAccountCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  steamAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  steamAccountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  steamAccountTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  steamAccountValue: {
    fontSize: 14,
  },
  steamAccountAddButton: {
    padding: 8,
  },
  steamAccountRemoveButton: {
    padding: 8,
  },
  steamInputCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  steamInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  steamInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  steamInputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  steamInputButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  steamInputCancelButton: {
    backgroundColor: 'transparent',
  },
  steamInputSaveButton: {
    backgroundColor: '#007AFF',
  },
  steamInputCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  steamInputSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
