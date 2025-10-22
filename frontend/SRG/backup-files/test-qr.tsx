import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TestQRScreen() {
  const [qrData, setQrData] = useState('');

  const testQRData = [
    {
      name: 'SkyScansGames (Full Data)',
      data: JSON.stringify({
        gameId: 'SKY-2024-001',
        gameName: 'Spider-Man 2',
        coverArt: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6w2y.jpg',
        platform: 'PlayStation 5',
        scanDate: new Date().toISOString(),
        source: 'SkyScansGames'
      })
    },
    {
      name: 'SkyScansGames (Minimal)',
      data: JSON.stringify({
        gameId: 'SKY-2024-002',
        gameName: 'God of War Ragnarök',
        scanDate: new Date().toISOString(),
        source: 'SkyScansGames'
      })
    },
    {
      name: 'SkyScansGames (With Cover)',
      data: JSON.stringify({
        gameId: 'SKY-2024-003',
        gameName: 'Horizon Zero Dawn',
        coverArt: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3w2y.jpg',
        platform: 'PlayStation 4',
        scanDate: new Date().toISOString(),
        source: 'SkyScansGames'
      })
    },
    {
      name: 'SSG Game (Full Data)',
      data: JSON.stringify({
        ssg_id: '12345678',
        product_id: 'GAME-2024-001',
        name: 'The Witcher 3',
        slug: 'the-witcher-3',
        store: 'SSG',
        price: 89.99,
        currency: 'USD',
        platform: 'PlayStation 5',
        developer: 'CD Projekt Red',
        publisher: 'CD Projekt',
        release_date: '2024-10-20',
        description: 'An epic fantasy RPG with stunning graphics and immersive gameplay.',
        rating: 9.2,
        age_rating: 'PEGI 18',
        category: 'RPG'
      })
    },
    {
      name: 'SkyScansGames API URL',
      data: 'http://10.0.0.14:8000/api/games/17'
    },
    {
      name: 'SkyScansGames API URL (Alt)',
      data: 'http://10.0.0.14:3000/api/games/42'
    },
    {
      name: 'SkyScansGames API URL (Localhost)',
      data: 'http://localhost:8000/api/games/17'
    },
    {
      name: 'Simple Game Name',
      data: 'Batman: Arkham Knight'
    }
  ];

  const generateTestQR = (data: string) => {
    setQrData(data);
    Alert.alert(
      'Test QR Code Generated',
      `Data: ${data}`,
      [
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test QR Codes</Text>
        <Text style={styles.headerSubtitle}>Generate test QR codes for development</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Predefined Test Data:</Text>
        
        {testQRData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testButton}
            onPress={() => generateTestQR(item.data)}
          >
            <Ionicons name="qr-code" size={20} color="#007AFF" />
            <Text style={styles.testButtonText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Custom QR Data:</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter custom QR code data..."
            value={qrData}
            onChangeText={setQrData}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.generateButton, !qrData.trim() && styles.generateButtonDisabled]}
            onPress={() => generateTestQR(qrData)}
            disabled={!qrData.trim()}
          >
            <Text style={styles.generateButtonText}>Generate QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Use these test QR codes to verify the scanner functionality. 
            The scanner will parse different formats and handle them appropriately.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  inputContainer: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#666',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    color: '#ccc',
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});
