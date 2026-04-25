import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { D, SP, SH } from '../../theme/design';

export type BottomNavTab = 'Home' | 'Fitness' | 'Leaderboard' | 'Profile';

type NavAny = { navigate: (screen: string, params?: any) => void };

const TABS: { name: BottomNavTab; icon: any }[] = [
  { name: 'Home',        icon: require('../../../Elements/Icon(home).png') },
  { name: 'Fitness',     icon: require('../../../Elements/Icon(dumbel).png') },
  { name: 'Leaderboard', icon: require('../../../Elements/Icon(trophy).png') },
  { name: 'Profile',     icon: require('../../../Elements/Icon(profile).png') },
];

export function BottomNav({ current, navigation }: { current: BottomNavTab; navigation: NavAny }) {
  return (
    <View style={s.bar}>
      {TABS.map(({ name, icon }) => {
        const active = name === current;
        return (
          <TouchableOpacity
            key={name}
            style={s.tab}
            onPress={() => { if (!active) navigation.navigate(name); }}
            activeOpacity={0.7}>
            <View style={[s.pill, active && s.pillActive]}>
              <Image
                source={icon}
                style={[s.icon, { tintColor: active ? D.primary : D.textMuted }]}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: D.card,
    borderTopWidth: 1,
    borderTopColor: D.border,
    paddingTop: SP.sm,
    paddingBottom: SP.lg,
    paddingHorizontal: SP.xl,
    ...SH.card,
  },
  tab:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill:      { borderRadius: 20, padding: SP.sm },
  pillActive:{ backgroundColor: D.primaryLight },
  icon:      { width: 28, height: 28 },
});
