import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { D, R, SH } from '../../theme/design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'primary' | 'accent' | 'danger' | 'muted';
  shadow?: boolean;
  padding?: number;
}

export function Card({ children, style, variant = 'default', shadow = true, padding = 20 }: CardProps) {
  const bg =
    variant === 'primary' ? D.primaryLight :
    variant === 'accent'  ? D.accentLight  :
    variant === 'danger'  ? D.dangerLight  :
    variant === 'muted'   ? D.cardMuted    :
    D.card;

  return (
    <View style={[s.card, { backgroundColor: bg, padding }, shadow && SH.card, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.card,
    overflow: 'hidden',
  },
});
