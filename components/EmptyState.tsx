import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.textDisabled} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
