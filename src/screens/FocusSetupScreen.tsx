import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ExerciseType } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { useAppMonitorPermission } from '../hooks/useAppMonitorPermission';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSetup'>;

const TIMER_OPTIONS = [15, 25, 30, 45, 60, 90, 120];
const REP_OPTIONS = [5, 10, 15, 20, 30];
const EXERCISE_OPTIONS: { type: ExerciseType; label: string; icon: string }[] = [
  { type: 'pushup', label: 'Push-ups', icon: '💪' },
  { type: 'situp',  label: 'Sit-ups',  icon: '🏋️' },
  { type: 'squat',  label: 'Squats',   icon: '🦵' },
];

export function FocusSetupScreen({ navigation }: Props) {
  const {
    timerMinutes, blockedApps, penaltyReps, penaltyExercise,
    setTimerMinutes, setPenaltyReps, setPenaltyExercise, toggleBlockedApp, startSession,
  } = useFocusStore();

  const { hasPermission, hasAccessibilityPermission, hasUsagePermission, requestPermission, requestNotificationPermission } =
    useAppMonitorPermission();

  const canStart = blockedApps.length > 0;

  const handleStart = async () => {
    if (!hasPermission) { requestPermission(); return; }
    await requestNotificationPermission();
    startSession();
    navigation.replace('FocusActive');
  };

  const startLabel = !canStart
    ? 'Select at least one app'
    : !hasPermission
      ? 'Grant Permission & Start'
      : !hasAccessibilityPermission && hasUsagePermission
        ? `Start ${timerMinutes}m (Fallback Mode)`
        : `Start ${timerMinutes} min Focus`;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.tag}>FOCUS MODE</Text>
            <Text style={s.headline}>Configure{'\n'}Your Session</Text>
          </View>
          <Image source={require('../../Elements/FocusMode.png')} style={s.headerImg} />
        </View>

        {/* ── Timer ── */}
        <Text style={s.sectionLabel}>FOCUS DURATION</Text>
        <Card style={s.section} padding={SP.lg}>
          <View style={s.chips}>
            {TIMER_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.chip, timerMinutes === m && s.chipOn]}
                onPress={() => setTimerMinutes(m)}>
                <Text style={[s.chipText, timerMinutes === m && s.chipTextOn]}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Blocked Apps ── */}
        <Text style={s.sectionLabel}>RESTRICTED APPS</Text>
        <Card style={s.section} padding={SP.lg}>
          <View style={s.appGrid}>
            {AVAILABLE_APPS.map((app) => {
              const sel = blockedApps.includes(app.packageName);
              return (
                <TouchableOpacity
                  key={app.packageName}
                  style={[s.appChip, sel && s.appChipOn]}
                  onPress={() => toggleBlockedApp(app.packageName)}>
                  <Text style={s.appIcon}>{app.icon}</Text>
                  <Text style={[s.appLabel, sel && s.appLabelOn]}>{app.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── Penalty Exercise ── */}
        <Text style={s.sectionLabel}>PUNISHMENT EXERCISE</Text>
        <Card style={s.section} padding={SP.lg}>
          <View style={s.chips}>
            {EXERCISE_OPTIONS.map((ex) => (
              <TouchableOpacity
                key={ex.type}
                style={[s.chip, s.chipWide, penaltyExercise === ex.type && s.chipOn]}
                onPress={() => setPenaltyExercise(ex.type)}>
                <Text style={[s.chipText, penaltyExercise === ex.type && s.chipTextOn]}>
                  {ex.icon}  {ex.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Reps ── */}
        <Text style={s.sectionLabel}>REPS PER VIOLATION</Text>
        <Card style={s.section} padding={SP.lg}>
          <View style={s.chips}>
            {REP_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.chip, penaltyReps === r && s.chipOn]}
                onPress={() => setPenaltyReps(r)}>
                <Text style={[s.chipText, penaltyReps === r && s.chipTextOn]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Permission notice ── */}
        {!hasPermission && (
          <View style={s.permBox}>
            <Text style={s.permText}>
              Enable Accessibility Service or Usage Access so restricted apps are detected. Tap Start to open settings.
            </Text>
          </View>
        )}

        {/* ── Start ── */}
        <Button
          label={startLabel}
          onPress={handleStart}
          variant={canStart ? 'primary' : 'ghost'}
          disabled={!canStart}
          fullWidth
          style={{ marginTop: SP.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 72, paddingTop: SP.base },

  backBtn:  { alignSelf: 'flex-start', marginBottom: SP.base },
  backText: { color: D.primary, fontSize: 15, fontWeight: '600' },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.xl },
  tag:       { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: SP.sm },
  headline:  { fontSize: 28, fontWeight: '800', color: D.text, lineHeight: 34 },
  headerImg: { width: 90, height: 90, resizeMode: 'contain' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: D.textMuted, letterSpacing: 1.8, marginBottom: SP.sm, marginTop: SP.base },
  section:      { marginBottom: SP.md },

  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  chip:   { backgroundColor: D.bg, borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1.5, borderColor: D.border },
  chipWide: { paddingHorizontal: 16 },
  chipOn:   { backgroundColor: D.primary, borderColor: D.primary },
  chipText: { color: D.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: D.onPrimary },

  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  appChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.bg, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: D.border, gap: 6 },
  appChipOn: { backgroundColor: D.dangerLight, borderColor: D.danger },
  appIcon:  { fontSize: 16 },
  appLabel: { fontSize: 13, fontWeight: '600', color: D.textMuted },
  appLabelOn: { color: D.danger },

  permBox:  { backgroundColor: D.dangerLight, borderRadius: R.md, padding: SP.base, marginBottom: SP.md, borderLeftWidth: 3, borderLeftColor: D.danger },
  permText: { color: D.danger, fontSize: 13, lineHeight: 20 },
});
