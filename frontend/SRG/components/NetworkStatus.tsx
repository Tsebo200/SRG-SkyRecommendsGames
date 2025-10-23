import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBackendUrls, findWorkingBackendUrl, testBackendUrl } from '../lib/network-config';

interface NetworkStatusProps {
  onUrlChange?: (url: string) => void;
}

export default function NetworkStatus({ onUrlChange }: NetworkStatusProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Array<{ url: string; status: 'success' | 'error'; message: string }>>([]);
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);

  const testAllUrls = async () => {
    setTesting(true);
    setResults([]);
    
    const urls = getBackendUrls();
    const newResults: Array<{ url: string; status: 'success' | 'error'; message: string }> = [];
    
    for (const url of urls) {
      try {
        console.log(`🔍 Testing: ${url}`);
        const isWorking = await testBackendUrl(url);
        newResults.push({
          url,
          status: isWorking ? 'success' : 'error',
          message: isWorking ? 'Connected' : 'Connection failed'
        });
        
        if (isWorking && !workingUrl) {
          setWorkingUrl(url);
          onUrlChange?.(url);
        }
      } catch (error) {
        newResults.push({
          url,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setResults(newResults);
    setTesting(false);
  };

  const findWorkingUrl = async () => {
    setTesting(true);
    try {
      const url = await findWorkingBackendUrl();
      if (url) {
        setWorkingUrl(url);
        onUrlChange?.(url);
        Alert.alert('Success', `Found working backend: ${url}`);
      } else {
        Alert.alert('Error', 'No working backend URLs found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to find working backend');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Auto-test on mount
    testAllUrls();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Status</Text>
      
      {workingUrl && (
        <View style={styles.workingUrlContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.workingUrlText}>Working: {workingUrl}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testAllUrls}
          disabled={testing}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Test All URLs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.findButton]} 
          onPress={findWorkingUrl}
          disabled={testing}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.buttonText}>Find Working</Text>
        </TouchableOpacity>
      </View>
      
      {testing && (
        <Text style={styles.testingText}>Testing connections...</Text>
      )}
      
      <View style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Ionicons 
              name={result.status === 'success' ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={result.status === 'success' ? '#4CAF50' : '#F44336'} 
            />
            <Text style={styles.resultUrl}>{result.url}</Text>
            <Text style={[styles.resultMessage, { color: result.status === 'success' ? '#4CAF50' : '#F44336' }]}>
              {result.message}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  workingUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  workingUrlText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  findButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  testingText: {
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsContainer: {
    gap: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
  },
  resultUrl: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
  },
  resultMessage: {
    fontSize: 12,
    fontWeight: '600',
  },
});

