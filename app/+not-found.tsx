import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CustomHeader from '@/components/Header';

export default function NotFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CustomHeader title="Page Not Found" showBackButton={true} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🚫</Text>
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.message}>
          The page you’re looking for doesn’t exist.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/dash')}
        >
          <Text style={styles.buttonText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#002B36',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff4081',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
