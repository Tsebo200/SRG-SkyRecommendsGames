import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.welcomeCard}>
        <Text style={styles.title}>Sky Recommends Games</Text>
        <Text style={styles.subtitle}>AI-Powered Game Recommendations</Text>
        <Text style={styles.description}>
          Discover your next favourite game with personalised recommendations based on your gaming profile.
        </Text>

        <Text style={styles.navigationHint}>
          Use the tabs below to navigate between sections
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    justifyContent: 'center',
  },
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  navigationHint: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
