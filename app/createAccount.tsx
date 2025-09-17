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
  const [step, setStep] = useState<'create' | 'verify'>('create');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
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

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from('usertable').insert([
      {
        username: cleanUsername,
        password: cleanPassword,
        email: cleanEmail,
        isVerified: false,
        verificationCode: code,
        codeExpiresAt: expiresAt,
      },
    ]);

    if (error) {
      console.error('Insert error:', error);
      Alert.alert('Error', 'Failed to create account');
    } else {
      try {
        const response = await fetch(
          'https://fbofhbvgrqqtjzrsyvji.functions.supabase.co/send-verification',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, code }),
          }
        );

        if (!response.ok) {
          console.error('Email send failed:', await response.text());
          Alert.alert('Warning', 'Account created, but email failed to send');
        }
      } catch (err) {
        console.error('Email dispatch error:', err);
        Alert.alert('Warning', 'Account created, but email dispatch failed');
      }
      setGeneratedCode(code);
      setStep('verify');
      Alert.alert('Success', 'Account created! Enter the code sent to your email.');
    }

    setLoading(false);
  };

  const handleVerify = async () => {
    console.log('Verifying email:', email);
    if (!codeInput.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code');
      return;
    }

    const { data, error } = await supabase
      .from('usertable')
      .select('verificationCode, codeExpiresAt')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) {
      console.error('Verification fetch error:', error);
      Alert.alert('Error', 'Could not verify account');
      return;
    }

    const now = new Date();
    const expired = data.codeExpiresAt && new Date(data.codeExpiresAt) < now;

    if (expired) {
      Alert.alert('Expired', 'Verification code has expired');
      return;
    }

    if (codeInput !== data.verificationCode) {
      Alert.alert('Invalid', 'Incorrect verification code');
      return;
    }

    const { error: updateError } = await supabase
      .from('usertable')
      .update({
        isVerified: true,
        verificationCode: null,
        codeExpiresAt: null,
      })
      .eq('email', email.trim().toLowerCase());
      

    if (updateError) {
      console.error('Update error:', updateError);
      Alert.alert('Error', 'Could not update verification status');
    } else {
      Alert.alert('Success', 'Email verified! You can now log in.');
      setStep('create');
      setUserName('');
      setPassword('');
      setEmail('');
      setCodeInput('');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Budget Buddy" />
      <View style={styles.form}>
        {step === 'create' ? (
          <>
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
          </>
        ) : (
          <>
            <Text style={styles.headerText}>Verify Your Email</Text>
            <Text style={styles.label}>Enter 4-digit code</Text>
            <TextInput
              placeholder="1234"
              placeholderTextColor="#ccc"
              value={codeInput}
              onChangeText={setCodeInput}
              keyboardType="numeric"
              maxLength={4}
              style={styles.input}
            />
            <Pressable style={styles.button} onPress={handleVerify}>
              <Text style={styles.buttonText}>Verify</Text>
            </Pressable>
          </>
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
    backgroundColor: '#001F2D',
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
