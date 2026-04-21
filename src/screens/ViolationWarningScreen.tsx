import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { C, SHADOW } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'ViolationWarning'>;

export function ViolationWarningScreen({ navigation }: Props) {
  const { currentViolation, pendingSets, acknowledgeWarning } = useFocusStore();

  const violatedApp = currentViolation
    ? AVAILABLE_APPS.find((a) => a.packageName === currentViolation.packageName)
        ?.label ?? 'a blocked app'
    : 'a blocked app';

  const handleGoBack = () => {
    acknowledgeWarning();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Icon block */}
        <View style={s.iconBlock}>
          <Text style={s.iconText}>!</Text>
        </View>

        <Text style={s.label}>VIOLATION DETECTED</Text>
        <Text style={s.headline}>Focus Breach</Text>

        <Text style={s.message}>
          You opened <Text style={s.appName}>{violatedApp}</Text>
        </Text>

        {/* Severity card */}
        <View style={s.severityCard}>
          <View style={s.severityRow}>
            <View style={s.severityItem}>
              <Text style={s.severityValue}>+1</Text>
              <Text style={s.severityLabel}>SET ADDED</Text>
            </View>
            <View style={s.severityDivider} />
            <View style={s.severityItem}>
              <Text style={s.severityValue}>{pendingSets}</Text>
              <Text style={s.severityLabel}>TOTAL DUE</Text>
            </View>
          </View>
        </View>

        <Text style={s.note}>
          Every time you open a restricted app,{'\n'}one more set is added to your debt.
        </Text>

        <TouchableOpacity
          style={s.goBackBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}>
          <Text style={s.goBackText}>GO BACK & STAY FOCUSED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  /* Icon block */
  iconBlock: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    color: C.onPrimary,
    fontSize: 36,
    fontWeight: '900',
  },

  label: {
    color: C.error,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headline: {
    color: C.primaryContainer,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  message: {
    color: C.onSurface,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  appName: {
    color: C.secondary,
    fontWeight: '800',
  },

  /* Severity card */
  severityCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: C.secondary,
    ...SHADOW.card,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityItem: { flex: 1, alignItems: 'center' },
  severityDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.outlineVariant,
  },
  severityValue: {
    color: C.primaryContainer,
    fontSize: 36,
    fontWeight: '900',
  },
  severityLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  note: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  goBackBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.button,
    shadowColor: C.primaryContainer,
  },
  goBackText: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
