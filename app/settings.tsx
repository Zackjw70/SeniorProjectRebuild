import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CustomHeader from '@/components/Header';
import { useAuth } from '@/context/authcontext';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();  
    router.replace('/login'); 
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Settings" showSettingsButton={false} />

      <View style={styles.content}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B36',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B7F',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '80%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
