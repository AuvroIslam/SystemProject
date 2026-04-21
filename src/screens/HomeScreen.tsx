import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ExerciseType } from '../types/pose';
import { useFocusStore } from '../store/focusStore';
import { C, SHADOW } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const pendingSets = useFocusStore((s) => s.pendingSets);

  const go = (type: ExerciseType) =>
    navigation.navigate('Exercise', { exerciseType: type });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* ── Header ── */}
        <Text style={s.label}>SUBMISSION</Text>
        <Text style={s.headline}>Your Performance{'\n'}Dashboard</Text>
        <Text style={s.subhead}>
          Focus. Train. Conquer procrastination through discipline.
        </Text>

        {/* ── Debt Card ── */}
        {pendingSets > 0 && (
          <View style={s.debtCard}>
            <View style={s.debtTop}>
              <View style={s.debtBadge}>
                <Text style={s.debtBadgeText}>PENDING</Text>
              </View>
              <Text style={s.debtBig}>{pendingSets}</Text>
              <Text style={s.debtUnit}>
                set{pendingSets !== 1 ? 's' : ''} due
              </Text>
              <Text style={s.debtHint}>Violation debt — pay it off now</Text>
            </View>
            <TouchableOpacity
              style={s.debtBtn}
              onPress={() => navigation.navigate('DebtPay')}
              activeOpacity={0.8}>
              <Text style={s.debtBtnText}>COMPLETE SETS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Focus Card (primary CTA) ── */}
        <TouchableOpacity
          style={s.focusCard}
          onPress={() => navigation.navigate('FocusSetup')}
          activeOpacity={0.85}>
          <View style={s.focusInner}>
            <View style={s.focusDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.focusTitle}>Start Focus Session</Text>
              <Text style={s.focusDesc}>
                Set a timer & block apps. Open a blocked app = exercise debt.
              </Text>
            </View>
          </View>
          <View style={s.focusArrow}>
            <Text style={s.focusArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* ── Exercise Section Label ── */}
        <Text style={s.sectionLabel}>PRACTICE DIRECTLY</Text>

        {/* ── Bento Exercise Grid ── */}
        <View style={s.bentoRow}>
          <TouchableOpacity
            style={[s.bentoCard, s.bentoPrimary]}
            onPress={() => go('pushup')}
            activeOpacity={0.85}>
            <Text style={s.bentoEmoji}>💪</Text>
            <Text style={s.bentoTitleLight}>Push-ups</Text>
          </TouchableOpacity>

          <View style={s.bentoCol}>
            <TouchableOpacity
              style={[s.bentoCard, s.bentoSmall]}
              onPress={() => go('situp')}
              activeOpacity={0.85}>
              <Text style={s.bentoEmoji}>🏋️</Text>
              <Text style={s.bentoTitleDark}>Sit-ups</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.bentoCard, s.bentoSmallAlt]}
              onPress={() => go('squat')}
              activeOpacity={0.85}>
              <Text style={s.bentoEmoji}>🦵</Text>
              <Text style={s.bentoTitleDark}>Squats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── How it works ── */}
        <View style={s.howCard}>
          <Text style={s.howTitle}>How it works</Text>
          {[
            'Tap "Start Focus Session" and set your timer.',
            'Select which apps to block (YouTube, Instagram…).',
            'Open a blocked app → exercise debt increases.',
            'Complete sets to reduce your debt.',
          ].map((t, i) => (
            <View key={i} style={s.howRow}>
              <View style={s.howNum}>
                <Text style={s.howNumText}>{i + 1}</Text>
              </View>
              <Text style={s.howText}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  scroll: { padding: 24, paddingBottom: 72 },

  /* Header */
  label: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 20,
    marginBottom: 6,
  },
  headline: {
    color: C.primaryContainer,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 6,
  },
  subhead: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },

  /* Debt */
  debtCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: C.error,
    ...SHADOW.card,
  },
  debtTop: { marginBottom: 16 },
  debtBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.errorContainer,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  debtBadgeText: {
    color: C.onErrorContainer,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  debtBig: {
    color: C.error,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  debtUnit: {
    color: C.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  debtHint: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    marginTop: 4,
  },
  debtBtn: {
    backgroundColor: C.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW.button,
    shadowColor: C.error,
  },
  debtBtnText: {
    color: C.onError,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  /* Focus CTA */
  focusCard: {
    backgroundColor: C.primaryContainer,
    borderRadius: 16,
    padding: 22,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.card,
  },
  focusInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  focusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.secondaryContainer,
  },
  focusTitle: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  focusDesc: {
    color: C.onPrimaryContainer,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  focusArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  focusArrowText: { color: C.onPrimary, fontSize: 18 },

  /* Section label */
  sectionLabel: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 14,
  },

  /* Bento grid */
  bentoRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  bentoCol: { flex: 1, gap: 12 },
  bentoCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    ...SHADOW.card,
  },
  bentoPrimary: {
    flex: 1,
    backgroundColor: C.secondary,
    minHeight: 160,
  },
  bentoSmall: {
    backgroundColor: C.surfaceContainerHigh,
    minHeight: 72,
  },
  bentoSmallAlt: {
    backgroundColor: C.surfaceContainerLow,
    minHeight: 72,
  },
  bentoEmoji: { fontSize: 26, marginBottom: 8 },
  bentoTitleLight: { color: C.onPrimary, fontSize: 15, fontWeight: '800' },
  bentoTitleDark: { color: C.onSurface, fontSize: 15, fontWeight: '800' },

  /* How it works */
  howCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    padding: 22,
  },
  howTitle: {
    color: C.primaryContainer,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  howNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howNumText: { color: C.onPrimary, fontSize: 12, fontWeight: '800' },
  howText: { color: C.onSurfaceVariant, fontSize: 13, lineHeight: 19, flex: 1 },
});
