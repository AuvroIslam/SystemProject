import React from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import { D, R } from '../../theme/design';

interface ProgressBarProps {
  progress: number;     // 0–1
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
  rounded?: boolean;
}

export function ProgressBar({
  progress,
  color = D.primary,
  trackColor = D.border,
  height = 6,
  style,
  rounded = true,
}: ProgressBarProps) {
  const pct = `${Math.min(Math.max(progress, 0), 1) * 100}%` as DimensionValue;
  const radius = rounded ? height / 2 : 0;
  return (
    <View style={[s.track, { backgroundColor: trackColor, height, borderRadius: radius }, style]}>
      <View
        style={{
          width: pct,
          height,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
