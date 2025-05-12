import { Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="title" style={styles.welcomeText}>
          Welcome to the Garden Community App!
        </ThemedText>
        <ThemedText type="subtitle">
          Connect, grow, and share with fellow gardeners 🌱
        </ThemedText>
      </ThemedView>
      <Image
        source={require('@/assets/images/communitygarden.png')}
        style={styles.gardenImage}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBE9',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#F7FBE9', // explicitly match the page background
    padding: 10,
    borderRadius: 8,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: '#F7FBE9', // override if inherited
  },
  gardenImage: {
    width: '100%',
    height: 300,
  },
});
