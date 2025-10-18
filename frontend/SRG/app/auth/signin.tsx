import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link, useRouter } from 'expo-router';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const onSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('MFA')) {
          setNeedsMFA(true);
          return;
        }
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Sign in successful:', {
          userId: data.user?.id,
          email: data.user?.email
        });
        // Navigation will be handled by _layout.tsx auth state change
        // No need to manually navigate here
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setMfaVerifying(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId: 'totp', // This should be the actual factor ID from the sign-in response
        code: mfaCode
      });
      
      if (error) throw error;
      
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message || 'Please try again');
    } finally {
      setMfaVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>

        {!needsMFA ? (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#7a7a7a"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#7a7a7a"
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity onPress={onSignIn} style={[styles.button, loading && { opacity: 0.7 }]} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.mfaTitle}>Two-Factor Authentication</Text>
            <Text style={styles.mfaSubtitle}>Enter the 6-digit code from your authenticator app</Text>
            
            <TextInput
              value={mfaCode}
              onChangeText={setMfaCode}
              placeholder="123456"
              placeholderTextColor="#7a7a7a"
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
              autoComplete="one-time-code"
            />

            <TouchableOpacity onPress={verifyMFA} style={[styles.button, mfaVerifying && { opacity: 0.7 }]} disabled={mfaVerifying}>
              <Text style={styles.buttonText}>{mfaVerifying ? 'Verifying...' : 'Verify Code'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setNeedsMFA(false)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}

        {!needsMFA && (
          <Text style={styles.helper}>No account? <Link href="/auth/signup" style={styles.link}>Create one</Link></Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16, justifyContent: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 14, padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { color: '#fff', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  button: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 8},
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  helper: { color: '#a0a0a0', textAlign: 'center', marginTop: 12 },
  link: { color: '#60a5fa', fontWeight: '600' },
  mfaTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  mfaSubtitle: { color: '#a0a0a0', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  backButton: { marginTop: 12, alignItems: 'center' },
  backButtonText: { color: '#60a5fa', fontSize: 14 },
});



