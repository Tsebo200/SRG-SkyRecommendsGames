import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkTestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const testEndpoints = [
    { name: 'SkyScansGames API', url: 'http://10.0.0.14:8000/api/games/17' },
    { name: 'SkyScansGames Frontend', url: 'http://10.0.0.14:3000/' },
    { name: 'Backend API', url: 'http://10.0.0.14:8080/health' },
  ];

  const testNetworkConnectivity = async () => {
    setTesting(true);
    setResults([]);
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 Testing ${endpoint.name}: ${endpoint.url}`);
        
        // Create a timeout using AbortController (React Native compatible)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        // Clear the timeout if request completes successfully
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = `✅ ${endpoint.name}: Connected successfully`;
          setResults(prev => [...prev, result]);
          console.log(result);
        } else {
          const result = `❌ ${endpoint.name}: HTTP ${response.status}`;
          setResults(prev => [...prev, result]);
          console.log(result);
        }
      } catch (error) {
        const result = `❌ ${endpoint.name}: ${error.message}`;
        setResults(prev => [...prev, result]);
        console.log(result);
      }
    }
    
    setTesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Network Test</Text>
        <Text style={styles.headerSubtitle}>Test connectivity to SkyScansGames API</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            This will test if your phone can connect to the SkyScansGames API running on your computer.
            Make sure both devices are on the same WiFi network.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.testButton, testing && styles.testButtonDisabled]} 
          onPress={testNetworkConnectivity}
          disabled={testing}
        >
          <Ionicons name="wifi" size={24} color="#fff" />
          <Text style={styles.testButtonText}>
            {testing ? 'Testing...' : 'Test Network Connectivity'}
          </Text>
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            {results.map((result, index) => (
              <Text key={index} style={styles.resultText}>{result}</Text>
            ))}
          </View>
        )}

        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
          <Text style={styles.troubleshootingText}>
            1. Make sure SkyScansGames API is running on your computer{'\n'}
            2. Ensure both devices are on the same WiFi network{'\n'}
            3. Check that your computer's IP is 10.0.0.14{'\n'}
            4. Verify firewall settings allow connections
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: '#ccc',
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#666',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  resultText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  troubleshootingContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  troubleshootingText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});
