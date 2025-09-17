import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/database/lib/supabase';
import CustomHeader from '@/components/Header';
import { useAuth } from '@/context/authcontext';

export default function Login() {
  const { setUser } = useAuth();
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const { data, error } = await supabase
      .from('usertable')
      .select('*')
      .ilike('username', cleanUsername)
      .eq('password', cleanPassword)
      .maybeSingle();

    if (error || !data) {
      setError('Invalid username or password');
    } else {
      setUser(data);
      router.replace('/mainDash');
    }

    setLoading(false);
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="Budget Buddy" showBackButton={false} showSettingsButton={false} />

      <View style={styles.container}>
        <Text style={styles.loginHeader}>Login</Text>

        <Text style={styles.label}>Username:</Text>
        <TextInput
          placeholder="Username..."
          placeholderTextColor="#ccc"
          value={username}
          onChangeText={setUserName}
          style={styles.input}
        />

        <Text style={styles.label}>Password:</Text>
        <TextInput
          placeholder="Password..."
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {loading ? (
          <ActivityIndicator color="white" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Pressable style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/createAccount')}>
              <Text style={styles.createAccountText}>Create Account</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#002b36', // dark teal background
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginHeader: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 15,
    color: '#fff',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    color: 'white',
  },
  loginButton: {
    marginTop: 15,
    backgroundColor: '#ff3b80', 
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createAccountText: {
    marginTop: 20,
    color: '#ff3b80',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
});
