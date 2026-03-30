import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = Colors.primary, height = 8 }: Props) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: clamped >= 1 ? Colors.success : color,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    minWidth: 4,
  },
});
