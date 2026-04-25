import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { D, SP, R, SH } from '../../theme/design';

export type ModalVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AppModalButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  title: string;
  message?: string;
  children?: React.ReactNode;
  buttons?: AppModalButton[];
  dismissable?: boolean;
}

const ICON_MAP: Record<ModalVariant, { name: string; color: string; bg: string }> = {
  success: { name: 'check-circle', color: D.accent,   bg: D.accentLight  },
  error:   { name: 'x-circle',     color: D.danger,   bg: D.dangerLight  },
  warning: { name: 'alert-circle', color: D.warning,  bg: D.warningLight },
  info:    { name: 'info',         color: D.primary,  bg: D.primaryLight },
  confirm: { name: 'help-circle',  color: D.primary,  bg: D.primaryLight },
};

export function AppModal({
  visible,
  onClose,
  variant = 'info',
  title,
  message,
  children,
  buttons,
  dismissable = true,
}: Props) {
  const icon = ICON_MAP[variant];

  const defaultButtons: AppModalButton[] = buttons ?? [
    { label: 'OK', onPress: onClose, variant: 'primary' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}>
      <TouchableWithoutFeedback onPress={dismissable ? onClose : undefined}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={s.sheet}>

              {/* Icon */}
              <View style={[s.iconWrap, { backgroundColor: icon.bg }]}>
                <Feather name={icon.name as any} size={28} color={icon.color} />
              </View>

              {/* Title */}
              <Text style={s.title}>{title}</Text>

              {/* Message */}
              {message ? <Text style={s.message}>{message}</Text> : null}

              {/* Custom content */}
              {children}

              {/* Buttons */}
              <View style={[s.btnRow, defaultButtons.length === 1 && s.btnRowSingle]}>
                {defaultButtons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.btn,
                      btn.variant === 'danger' && s.btnDanger,
                      btn.variant === 'ghost'  && s.btnGhost,
                      btn.variant !== 'danger' && btn.variant !== 'ghost' && s.btnPrimary,
                      defaultButtons.length === 1 && s.btnFull,
                    ]}
                    onPress={btn.onPress}
                    activeOpacity={0.8}>
                    <Text style={[
                      s.btnText,
                      btn.variant === 'ghost'  && s.btnTextGhost,
                      btn.variant === 'danger' && s.btnTextDanger,
                    ]}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,27,64,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SP.xl,
  },
  sheet: {
    width: '100%',
    backgroundColor: D.card,
    borderRadius: R.cardLg,
    padding: SP.xl,
    alignItems: 'center',
    ...SH.button,
  },

  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SP.lg,
  },

  title:   { fontSize: 18, fontWeight: '800', color: D.text, textAlign: 'center', marginBottom: SP.sm },
  message: { fontSize: 14, color: D.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: SP.lg },

  btnRow:       { flexDirection: 'row', gap: SP.md, marginTop: SP.lg, width: '100%' },
  btnRowSingle: { justifyContent: 'center' },
  btn:          { flex: 1, borderRadius: R.pill, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnFull:      { flex: 1 },
  btnPrimary:   { backgroundColor: D.primary },
  btnDanger:    { backgroundColor: D.danger },
  btnGhost:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: D.border },
  btnText:      { fontSize: 14, fontWeight: '700', color: D.onPrimary },
  btnTextGhost: { color: D.textMuted },
  btnTextDanger:{ color: D.onPrimary },
});
