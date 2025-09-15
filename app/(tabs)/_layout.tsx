import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BudgetProvider } from '@/context/budgetcontext';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <BudgetProvider>
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
            title: 'Insights',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="pulse" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="visuals"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </BudgetProvider>
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
}

});
