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
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { C, SHADOW } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSummary'>;

function getAppLabel(pkg: string): string {
  return AVAILABLE_APPS.find((a) => a.packageName === pkg)?.label ?? pkg;
}

export function FocusSummaryScreen({ navigation }: Props) {
  const { timerMinutes, violations, pendingSets, resetSession } = useFocusStore();

  const totalViolations = violations.length;
  const clean = totalViolations === 0;
  const pct = clean ? 100 : Math.max(0, Math.round(100 - totalViolations * 15));

  const handleDone = () => {
    resetSession();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <Text style={s.label}>SESSION COMPLETE</Text>
        <Text style={s.headline}>
          {clean ? 'Perfect Focus' : 'Session Report'}
        </Text>

        {/* Score ring area */}
        <View style={s.scoreBlock}>
          <View style={s.scoreCircle}>
            <Text style={s.scorePct}>{pct}%</Text>
            <Text style={s.scoreHint}>focus score</Text>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>
              {clean ? 'ELITE' : pct >= 70 ? 'GOOD' : 'NEEDS WORK'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{timerMinutes}m</Text>
            <Text style={s.statLabel}>DURATION</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: clean ? C.secondary : C.error }]}>
              {totalViolations}
            </Text>
            <Text style={s.statLabel}>VIOLATIONS</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: C.secondary }]}>
              {pendingSets}
            </Text>
            <Text style={s.statLabel}>SETS DUE</Text>
          </View>
        </View>

        {/* Violation breakdown */}
        {totalViolations > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>SESSION ANALYTICS</Text>
            {violations.map((v, i) => (
              <View key={i} style={s.logRow}>
                <View style={s.logNum}>
                  <Text style={s.logNumText}>{i + 1}</Text>
                </View>
                <Text style={s.logApp}>{getAppLabel(v.packageName)}</Text>
                <View style={s.logBadge}>
                  <Text style={s.logBadgeText}>+1 set</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Message */}
        <View style={s.msgCard}>
          <Text style={s.msgText}>
            {clean
              ? 'Amazing discipline! Your focus is your superpower.'
              : totalViolations <= 2
                ? `You have ${pendingSets} set${pendingSets !== 1 ? 's' : ''} to pay off from your home screen.`
                : `${totalViolations} violations — ${pendingSets} set${pendingSets !== 1 ? 's' : ''} due. Time to pay your debt.`}
          </Text>
        </View>

        <TouchableOpacity
          style={s.doneBtn}
          onPress={handleDone}
          activeOpacity={0.8}>
          <Text style={s.doneBtnText}>DONE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  scroll: { padding: 24, paddingBottom: 72, alignItems: 'center' },

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
    marginBottom: 28,
  },

  /* Score ring */
  scoreBlock: { alignItems: 'center', marginBottom: 20 },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: C.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceContainerLow,
    marginBottom: 12,
  },
  scorePct: {
    color: C.primaryContainer,
    fontSize: 40,
    fontWeight: '900',
  },
  scoreHint: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: C.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  statusText: {
    color: C.onPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  /* Progress bar */
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.secondary,
    borderRadius: 2,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: C.primaryContainer,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 18,
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  logNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logNumText: { color: C.onPrimary, fontSize: 11, fontWeight: '800' },
  logApp: { color: C.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
  logBadge: {
    backgroundColor: C.errorContainer,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logBadgeText: { color: C.onErrorContainer, fontSize: 11, fontWeight: '700' },

  /* Message */
  msgCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 18,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: C.secondary,
  },
  msgText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },

  /* Done button */
  doneBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 64,
    ...SHADOW.button,
    shadowColor: C.primaryContainer,
  },
  doneBtnText: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
