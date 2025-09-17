import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BudgetProvider, useBudget } from '@/context/budgetcontext';
import * as Clipboard from 'expo-clipboard';

export default function TabLayoutWrapper() {
  return (
    <BudgetProvider>
      <TabLayoutContent />
    </BudgetProvider>
  );
}

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const { roomcode } = useBudget();
  console.log('Roomcode from context:', roomcode);

  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      {roomcode ? (
        <View style={styles.roomcodeContainer}>
          <TouchableOpacity onPress={() => {Clipboard.setStringAsync(roomcode);
            Alert.alert('Copied!', 'Room code has been copied to clipboard.');
                }}
                activeOpacity={0.6}
          >
            <Text style={styles.roomcodeText}>Room Code: {roomcode}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#002B36',
              borderTopWidth: 0,
              height: 100,
            },
            tabBarBackground: () => (
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.divider} />
              </View>
            ),
            tabBarActiveTintColor: '#FF2D55',
            tabBarInactiveTintColor: '#FFFFFF',
          }}
        >
          <Tabs.Screen
            name="dash"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: 'Transactions',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="pie-chart-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: 'white',
    alignSelf: 'center',
    position: 'absolute',
    top: -10,
  },
  roomcodeContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    paddingVertical: 6,
    backgroundColor: '#003847',
    alignItems: 'center',
    zIndex: 10,
  },
  roomcodeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});