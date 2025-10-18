import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [hasMFA, setHasMFA] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setHasMFA(factors?.totp?.length > 0);
    }
  };

  const enrollMFA = async () => {
    try {
      setEnrolling(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      setQrCode(data.qr_code);
      setSecret(data.secret);
      Alert.alert(
        'Scan QR Code',
        'Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code, then enter the 6-digit code to verify.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setEnrolling(false);
    }
  };

  const verifyMFA = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setVerifying(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId: secret,
        code: code
      });
      
      if (error) throw error;
      
      Alert.alert('Success', '2FA has been enabled for your account!');
      setQrCode('');
      setSecret('');
      setCode('');
      checkMFAStatus();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          <Text style={styles.sectionSubtitle}>
            {hasMFA ? '✅ 2FA is enabled' : '🔒 Add an extra layer of security'}
          </Text>
          
          {!hasMFA && !qrCode && (
            <TouchableOpacity 
              style={styles.mfaBtn} 
              onPress={enrollMFA}
              disabled={enrolling}
            >
              <Text style={styles.mfaBtnText}>
                {enrolling ? 'Setting up...' : 'Enable 2FA'}
              </Text>
            </TouchableOpacity>
          )}

          {qrCode && (
            <View style={styles.verificationSection}>
              <Text style={styles.instructionText}>
                Scan this QR code with your authenticator app:
              </Text>
              <Text style={styles.qrCode}>{qrCode}</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <TouchableOpacity 
                style={styles.verifyBtn} 
                onPress={verifyMFA}
                disabled={verifying || code.length !== 6}
              >
                <Text style={styles.verifyBtnText}>
                  {verifying ? 'Verifying...' : 'Verify & Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out">
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a0a0a0', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sectionSubtitle: { color: '#a0a0a0', fontSize: 14, marginBottom: 12 },
  mfaBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  mfaBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  verificationSection: { marginTop: 12 },
  instructionText: { color: '#fff', fontSize: 14, marginBottom: 8 },
  qrCode: { color: '#a0a0a0', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, textAlign: 'center' },
  codeInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  verifyBtn: { backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#ff6b6b', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});