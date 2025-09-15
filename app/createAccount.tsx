import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../database/lib/supabase';
import CustomHeader from '@/components/Header';

export default function CreateAccount() {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateAccount = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanPassword || !cleanEmail) {
      Alert.alert('Missing Fields', 'All fields are required');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.from('usertable').insert([
      {
        username: cleanUsername,
        password: cleanPassword,
        email: cleanEmail.toLowerCase(),
      },
    ]);

    if (error) {
      console.error('Insert error:', error);
      Alert.alert('Error', 'Failed to create account');
    } else {
      Alert.alert('Success', 'Account created!');
      router.replace('/login');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>

      <View style={styles.headerRow}>

        <Pressable style={styles.backArrow} onPress={() => router.replace('/login')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <CustomHeader title="Budget Title" />

      </View>

      <View style={styles.divider} />

      <Text style={styles.loginHeader}>Create Account</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        placeholder="Username..."
        placeholderTextColor="#ccc"
        value={username}
        onChangeText={setUserName}
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Password..."
        placeholderTextColor="#ccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Email..."
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator color="white" style={{ marginTop: 20 }} />
      ) : (
        <Pressable style={styles.loginButton} onPress={handleCreateAccount}>
          <Text style={styles.loginButtonText}>Create Account</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001F2D',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  gear: {
    position: 'absolute',
    right: 20,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
  },
  divider: {
    position: 'absolute',
    top: 90,
    width: '90%',
    height: 1,
    backgroundColor: '#fff',
  },
  loginHeader: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 60,
  },
  label: {
    alignSelf: 'flex-start',
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    color: 'white',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#FF3D7A',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createAccountText: {
    marginTop: 30,
    color: '#FF3D7A',
    textAlign: 'center',
  },
});
