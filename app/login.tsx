import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      setUser(data)
      console.log('Logging in with userId:', data.userid);

      setTimeout(() => {
        router.replace('/mainDash');
      }, 0);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
     <CustomHeader title="Budget Title" showBackButton={false} showSettingsButton={false}/>


      <View style={styles.divider} />

      <Text style={styles.loginHeader}>Login</Text>

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
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
