import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { D, R, SH } from '../../theme/design';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const bg =
    disabled        ? D.border      :
    variant === 'accent'  ? D.accent      :
    variant === 'danger'  ? D.danger      :
    variant === 'ghost'   ? 'transparent' :
    variant === 'outline' ? 'transparent' :
    D.primary;

  const textColor =
    disabled               ? D.textMuted :
    variant === 'ghost'    ? D.primary   :
    variant === 'outline'  ? D.primary   :
    D.onPrimary;

  const borderColor =
    variant === 'outline' ? D.primary : 'transparent';

  const py = size === 'sm' ? 10 : size === 'md' ? 14 : 17;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 14 : 15;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        s.btn,
        { backgroundColor: bg, paddingVertical: py, borderColor },
        variant === 'outline' && s.outlined,
        fullWidth && s.full,
        !disabled && (variant === 'primary' || variant === 'accent' || variant === 'danger') && SH.button,
        disabled && s.disabled,
        style,
      ]}>
      <Text style={[s.label, { fontSize, color: textColor }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: R.pill,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 2,
  },
  full: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
