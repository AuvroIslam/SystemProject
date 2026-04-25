import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// 0 = BgVariation1 (auth/onboarding)
// 1 = BgVariation2 (all main screens)
// 2 = BgVariation3 (AI chat)
const IMAGES = [
  require('../../../Elements/BgVariation1.png'),
  require('../../../Elements/BgVariation2.png'),
  require('../../../Elements/BgVariation3.png'),
] as const;

interface Props {
  variant?: 0 | 1 | 2;
  children: React.ReactNode;
}

export function AppBackground({ variant = 1, children }: Props) {
  return (
    <View style={s.root}>
      <Image source={IMAGES[variant]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
