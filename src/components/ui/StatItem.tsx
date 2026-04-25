import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { D, R, SH } from '../../theme/design';

interface StatItemProps {
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
  accent?: boolean;
}

export function StatItem({ value, label, color, style, accent = false }: StatItemProps) {
  return (
    <View style={[s.card, accent && s.cardAccent, SH.soft, style]}>
      <Text style={[s.value, { color: color ?? (accent ? D.primary : D.text) }]}>
        {value}
      </Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: D.card,
    borderRadius: R.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardAccent: {
    backgroundColor: D.primaryLight,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: D.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
