import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Landing() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the App</Text>
      <Button title="Go to Login" onPress={() => router.push('/login')} />
      <Button title="Go to Main Dashboard" onPress={() => router.push('/mainDash')} />
    </View>
  );
}