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
import {
  useFocusStore,
  AVAILABLE_APPS,
} from '../store/focusStore';
import { useAppMonitorPermission } from '../hooks/useAppMonitorPermission';
import { C, SHADOW } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSetup'>;

const TIMER_OPTIONS = [15, 25, 30, 45, 60, 90, 120];
const REP_OPTIONS = [5, 10, 15, 20, 30];
const EXERCISE_OPTIONS: { type: ExerciseType; label: string; icon: string }[] = [
  { type: 'pushup', label: 'Push-ups', icon: '💪' },
  { type: 'situp', label: 'Sit-ups', icon: '🏋️' },
  { type: 'squat', label: 'Squats', icon: '🦵' },
];

export function FocusSetupScreen({ navigation }: Props) {
  const {
    timerMinutes,
    blockedApps,
    penaltyReps,
    penaltyExercise,
    setTimerMinutes,
    setPenaltyReps,
    setPenaltyExercise,
    toggleBlockedApp,
    startSession,
  } = useFocusStore();

  const { hasPermission, requestPermission, requestNotificationPermission } =
    useAppMonitorPermission();

  const canStart = blockedApps.length > 0;

  const handleStart = async () => {
    if (!hasPermission) {
      requestPermission();
      return;
    }
    await requestNotificationPermission();
    startSession();
    navigation.replace('FocusActive');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* ── Header ── */}
        <Text style={s.label}>FOCUS MODE</Text>
        <Text style={s.headline}>Configure Your{'\n'}Session</Text>
        <Text style={s.subhead}>
          Discipline through accountability. Procrastinate = exercise debt.
        </Text>

        {/* ── Timer Duration ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>FOCUS DURATION</Text>
          <View style={s.chips}>
            {TIMER_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.chip, timerMinutes === m && s.chipActive]}
                onPress={() => setTimerMinutes(m)}>
                <Text
                  style={[
                    s.chipText,
                    timerMinutes === m && s.chipTextActive,
                  ]}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Blocked Apps ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>RESTRICTED APPS</Text>
          <View style={s.appGrid}>
            {AVAILABLE_APPS.map((app) => {
              const selected = blockedApps.includes(app.packageName);
              return (
                <TouchableOpacity
                  key={app.packageName}
                  style={[s.appChip, selected && s.appChipActive]}
                  onPress={() => toggleBlockedApp(app.packageName)}>
                  <Text style={s.appIcon}>{app.icon}</Text>
                  <Text
                    style={[
                      s.appLabel,
                      selected && s.appLabelActive,
                    ]}>
                    {app.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Penalty Exercise ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PUNISHMENT EXERCISE</Text>
          <View style={s.chips}>
            {EXERCISE_OPTIONS.map((ex) => (
              <TouchableOpacity
                key={ex.type}
                style={[
                  s.chip,
                  s.chipWide,
                  penaltyExercise === ex.type && s.chipActive,
                ]}
                onPress={() => setPenaltyExercise(ex.type)}>
                <Text
                  style={[
                    s.chipText,
                    penaltyExercise === ex.type && s.chipTextActive,
                  ]}>
                  {ex.icon} {ex.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Penalty Reps ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>REPS PER VIOLATION</Text>
          <View style={s.chips}>
            {REP_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.chip, penaltyReps === r && s.chipActive]}
                onPress={() => setPenaltyReps(r)}>
                <Text
                  style={[
                    s.chipText,
                    penaltyReps === r && s.chipTextActive,
                  ]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Permission Notice ── */}
        {!hasPermission && (
          <View style={s.permBox}>
            <Text style={s.permText}>
              Usage Access permission is required to detect when you open blocked apps.
              Tap START to open settings and grant it.
            </Text>
          </View>
        )}

        {/* ── Start Button ── */}
        <TouchableOpacity
          style={[s.startBtn, !canStart && s.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.8}>
          <Text style={s.startBtnText}>
            {!canStart
              ? 'Select at least one app to block'
              : !hasPermission
                ? 'GRANT PERMISSION & START'
                : `START ${timerMinutes} MIN FOCUS`}
          </Text>
        </TouchableOpacity>
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

  /* Section */
  section: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 14,
  },

  /* Chips */
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipWide: { paddingHorizontal: 16 },
  chipActive: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primaryContainer,
  },
  chipText: { color: C.onSurfaceVariant, fontSize: 15, fontWeight: '600' },
  chipTextActive: { color: C.onPrimary },

  /* App Grid */
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  appChip: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  appChipActive: {
    backgroundColor: C.errorContainer,
    borderColor: C.error,
  },
  appIcon: { fontSize: 18, marginRight: 6 },
  appLabel: { color: C.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  appLabelActive: { color: C.onErrorContainer },

  /* Start Button */
  startBtn: {
    backgroundColor: C.secondary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    ...SHADOW.button,
  },
  startBtnDisabled: {
    backgroundColor: C.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  startBtnText: { color: C.onPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  /* Permission Box */
  permBox: {
    backgroundColor: C.errorContainer,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  permText: { color: C.onErrorContainer, fontSize: 13, lineHeight: 20 },
});
