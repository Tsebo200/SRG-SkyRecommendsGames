import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link, useRouter } from 'expo-router';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert('Check your email', 'We sent you a confirmation link.');
      router.replace('/auth/signin');
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

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

        <TouchableOpacity onPress={onSignUp} style={[styles.button, loading && { opacity: 0.7 }]} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <Text style={styles.helper}>Already have an account? <Link href="/auth/signin" style={styles.link}>Sign in</Link></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16, justifyContent: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 14, padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { color: '#fff', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  button: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  helper: { color: '#a0a0a0', textAlign: 'center', marginTop: 12 },
  link: { color: '#60a5fa', fontWeight: '600' },
});



