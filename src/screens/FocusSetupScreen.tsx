import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ExerciseType } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { useAppMonitorPermission } from '../hooks/useAppMonitorPermission';
import { NativeModules } from 'react-native';
import { AppBackground } from '../components/ui/AppBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { D, SP, R, SH } from '../theme/design';

const { AppMonitor } = NativeModules;

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSetup'>;

const TIMER_OPTIONS = [15, 25, 30, 45, 60, 90, 120];
const REP_OPTIONS   = [5, 10, 15, 20, 30];

const EXERCISE_OPTIONS: { type: ExerciseType; label: string; icon: string }[] = [
  { type: 'pushup', label: 'Push-ups', icon: 'arm-flex'         },
  { type: 'situp',  label: 'Sit-ups',  icon: 'human-handsdown'  },
  { type: 'squat',  label: 'Squats',   icon: 'human-child'      },
];

const APP_ICON_MAP: Record<string, string> = {
  'com.google.android.youtube':  'youtube',
  'com.instagram.android':       'instagram',
  'com.facebook.katana':         'facebook',
  'com.twitter.android':         'twitter',
  'com.zhiliaoapp.musically':    'music-note',
  'com.snapchat.android':        'snapchat',
  'com.reddit.frontpage':        'reddit',
  'com.whatsapp':                'whatsapp',
  'org.telegram.messenger':      'telegram',
  'com.discord':                 'discord',
  'com.netflix.mediaclient':     'netflix',
  'com.spotify.music':           'spotify',
};

export function FocusSetupScreen({ navigation }: Props) {
  const {
    timerMinutes, blockedApps, penaltyReps, penaltyExercise,
    setTimerMinutes, setPenaltyReps, setPenaltyExercise,
    toggleBlockedApp, startSession,
  } = useFocusStore();

  const {
    hasPermission, hasAccessibilityPermission, hasUsagePermission,
    requestPermission, requestNotificationPermission,
  } = useAppMonitorPermission();

  const canStart = blockedApps.length > 0 && hasAccessibilityPermission;

  const handleStart = async () => {
    await requestNotificationPermission();
    startSession();
    navigation.replace('FocusActive');
  };

  const startLabel = blockedApps.length === 0
    ? 'Select at least one app to block'
    : !hasPermission
      ? 'Grant Usage Access to Continue'
      : !hasAccessibilityPermission
        ? 'Enable Accessibility Service to Start'
        : `Start ${timerMinutes} Min Focus`;

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.iconWrap}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={D.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tag}>FOCUS MODE</Text>
            <Text style={s.title}>Configure Session</Text>
          </View>
        </View>
        <Text style={s.sub}>Discipline through accountability. Procrastinate = exercise debt.</Text>

        {/* Focus Duration */}
        <Card style={s.card} padding={SP.xl}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={D.primary} />
            <Text style={s.sectionTitle}>Focus Duration</Text>
          </View>
          <View style={s.chipRow}>
            {TIMER_OPTIONS.map((m) => {
              const active = timerMinutes === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setTimerMinutes(m)}
                  activeOpacity={0.75}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Restricted Apps */}
        <Card style={s.card} padding={SP.xl}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={D.primary} />
            <Text style={s.sectionTitle}>Restricted Apps</Text>
          </View>
          <View style={s.chipRow}>
            {AVAILABLE_APPS.map((app) => {
              const selected = blockedApps.includes(app.packageName);
              const iconName = APP_ICON_MAP[app.packageName] ?? 'application-outline';
              return (
                <TouchableOpacity
                  key={app.packageName}
                  style={[s.appChip, selected && s.appChipActive]}
                  onPress={() => toggleBlockedApp(app.packageName)}
                  activeOpacity={0.75}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={16}
                    color={selected ? D.onPrimary : D.primary}
                  />
                  <Text style={[s.appLabel, selected && s.appLabelActive]}>{app.label}</Text>
                  {selected && <Feather name="check" size={11} color={D.onPrimary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Punishment Exercise */}
        <Card style={s.card} padding={SP.xl}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="dumbbell" size={16} color={D.primary} />
            <Text style={s.sectionTitle}>Punishment Exercise</Text>
          </View>
          <View style={s.chipRow}>
            {EXERCISE_OPTIONS.map((ex) => {
              const active = penaltyExercise === ex.type;
              return (
                <TouchableOpacity
                  key={ex.type}
                  style={[s.exChip, active && s.chipActive]}
                  onPress={() => setPenaltyExercise(ex.type)}
                  activeOpacity={0.75}>
                  <MaterialCommunityIcons
                    name={ex.icon}
                    size={18}
                    color={active ? D.onPrimary : D.primary}
                  />
                  <Text style={[s.chipText, active && s.chipTextActive]}>{ex.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Reps Per Violation */}
        <Card style={s.card} padding={SP.xl}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="repeat" size={16} color={D.primary} />
            <Text style={s.sectionTitle}>Reps Per Violation</Text>
          </View>
          <View style={s.chipRow}>
            {REP_OPTIONS.map((r) => {
              const active = penaltyReps === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setPenaltyReps(r)}
                  activeOpacity={0.75}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Permission Notice */}
        {/* No permission at all */}
        {!hasPermission && (
          <View style={s.permBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={D.warning} style={{ marginTop: 1 }} />
            <View style={{ flex: 1, gap: SP.sm }}>
              <Text style={s.permText}>
                Usage Access is required to detect restricted apps. Grant it first, then enable Accessibility Service to start.
              </Text>
              <TouchableOpacity style={s.grantBtn} onPress={requestPermission} activeOpacity={0.8}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color={D.onPrimary} />
                <Text style={s.grantBtnText}>Grant Usage Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Has usage access but not accessibility — block start, show accessibility grant */}
        {hasUsagePermission && !hasAccessibilityPermission && (
          <View style={s.permBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={D.warning} style={{ marginTop: 1 }} />
            <View style={{ flex: 1, gap: SP.sm }}>
              <Text style={s.permText}>
                Accessibility Service is required to detect apps in real-time. Enable it to start your session.
              </Text>
              <TouchableOpacity
                style={s.grantBtn}
                onPress={() => AppMonitor?.requestAccessibilityPermission?.()}
                activeOpacity={0.8}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color={D.onPrimary} />
                <Text style={s.grantBtnText}>Enable Accessibility Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Button
          label={startLabel}
          onPress={handleStart}
          variant="primary"
          fullWidth
          style={[s.startBtn, !canStart && s.startBtnDisabled]}
          disabled={!canStart}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.lg, paddingBottom: 40 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.sm },
  iconWrap: { width: 44, height: 44, borderRadius: R.md, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tag:      { fontSize: 10, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: 2 },
  title:    { fontSize: 22, fontWeight: '800', color: D.text },
  sub:      { fontSize: 13, color: D.textMuted, lineHeight: 19, marginBottom: SP.xl },

  card: { marginBottom: SP.md },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.md },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: D.text },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },

  chip: {
    backgroundColor: D.primaryLight,
    borderRadius: R.pill,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  exChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xs,
    backgroundColor: D.primaryLight,
    borderRadius: R.pill,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive:    { backgroundColor: D.primary, borderColor: D.primary, ...SH.soft },
  chipText:      { fontSize: 14, fontWeight: '600', color: D.primary },
  chipTextActive:{ color: D.onPrimary, fontWeight: '700' },

  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xs,
    backgroundColor: D.primaryLight,
    borderRadius: R.pill,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  appChipActive: { backgroundColor: D.primary, borderColor: D.primary, ...SH.soft },
  appLabel:      { fontSize: 13, fontWeight: '600', color: D.primary },
  appLabelActive:{ color: D.onPrimary },

  permBox: {
    flexDirection: 'row',
    gap: SP.sm,
    backgroundColor: D.warningLight,
    borderRadius: R.md,
    padding: SP.md,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: D.warning + '66',
  },
  permBoxInfo: { backgroundColor: D.primaryLight, borderColor: D.primary + '44' },
  permText:    { flex: 1, fontSize: 13, color: D.text, lineHeight: 19 },

  grantBtn:     { flexDirection: 'row', alignItems: 'center', gap: SP.xs, alignSelf: 'flex-start', backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: SP.md, paddingVertical: SP.xs, ...SH.soft },
  grantBtnText: { fontSize: 13, fontWeight: '700', color: D.onPrimary },

  startBtn:         { marginTop: SP.sm, ...SH.button },
  startBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
});
