import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  onSettingsPress?: () => void;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
}

export default function CustomHeader({
  title,
  onSettingsPress,
  showBackButton = true,
  showSettingsButton = true,
}: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => router.replace('/mainDash')}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title}>{title}</Text>

        {showSettingsButton ? (
          <TouchableOpacity
            style={styles.settings}
            onPress={onSettingsPress || (() => router.push('/settings'))}
          >
            <Ionicons name="settings-sharp" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Divider below header content */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#002B36',
  },
  container: {
    height: 100,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    top: 25,
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  arrow: {
    top: 25,
  },
  settings: {
    top: 25,
  },
  placeholder: {
    width: 24,
    height: 24,
    top: 25,
  },
  divider: {
    width: '90%',
    alignSelf: 'center', 
    borderBottomColor: '#fff',
    borderBottomWidth: 2,
    marginTop: 0, 
  },
});
