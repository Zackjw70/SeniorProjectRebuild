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
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanPassword || !cleanEmail) {
      Alert.alert('Missing Fields', 'All fields are required');
      return;
    }

    setLoading(true);

    // 🔹 Check if email already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('usertable')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking email:', fetchError);
      Alert.alert('Error', 'Something went wrong while checking email');
      setLoading(false);
      return;
    }

    if (existingUser) {
      Alert.alert('Email In Use', 'An account with this email already exists');
      setLoading(false);
      return;
    }

    // 🔹 Insert new user directly
    const { error } = await supabase.from('usertable').insert([
      {
        username: cleanUsername,
        password: cleanPassword,
        email: cleanEmail,
        isVerified: true, // Always true since we’re skipping verification
      },
    ]);

    if (error) {
      console.error('Insert error:', error);
      Alert.alert('Error', 'Failed to create account');
    } else {
      Alert.alert('Success', 'Account created! You can now log in.');
      setUserName('');
      setPassword('');
      setEmail('');
      router.push('/login');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Budget Buddy" />
      <View style={styles.form}>
        <Text style={styles.headerText}>Create Account</Text>

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
          <Pressable style={styles.button} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>Create Account</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Back to Login</Text>
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
  form: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  headerText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    color: 'white',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF3D7A',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 30,
    color: '#FF3D7A',
    textAlign: 'center',
  },
});
