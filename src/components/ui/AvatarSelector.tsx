import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { D, SP, SH } from '../../theme/design';

export const AVATARS = [
  require('../../../Elements/Avatar1.png'),
  require('../../../Elements/Avatar2.png'),
  require('../../../Elements/Avatar3.png'),
  require('../../../Elements/Avatar4.png'),
  require('../../../Elements/Avatar5.png'),
  require('../../../Elements/Avatar6.png'),
] as const;

interface Props {
  selectedAvatar: number;
  onSelectAvatar: (index: number) => void;
}

export function AvatarSelector({ selectedAvatar, onSelectAvatar }: Props) {
  return (
    <View style={s.grid}>
      {AVATARS.map((src, i) => {
        const active = i === selectedAvatar;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectAvatar(i)}
            activeOpacity={0.8}
            style={[s.cell, active && s.cellActive]}>
            <Image source={src} style={s.avatar} resizeMode="cover" />
            {active && <View style={s.checkBadge} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const CELL_SIZE = 88;

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP.md,
    justifyContent: 'space-between',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: D.border,
    ...SH.soft,
  },
  cellActive: {
    borderColor: D.primary,
    ...SH.button,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: D.primary,
    borderWidth: 2,
    borderColor: D.card,
  },
});
