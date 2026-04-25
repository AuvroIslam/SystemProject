import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Alert,
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { Card } from '../components/ui/Card';
import { StatItem } from '../components/ui/StatItem';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';

const { AppMonitor } = NativeModules;
const monitorEmitter = AppMonitor ? new NativeEventEmitter(AppMonitor) : null;

type Props = NativeStackScreenProps<RootStackParamList, 'FocusActive'>;

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getAppLabel(pkg: string): string {
  return AVAILABLE_APPS.find((a) => a.packageName === pkg)?.label ?? pkg;
}

export function FocusActiveScreen({ navigation }: Props) {
  const {
    sessionEndTime,
    timerMinutes,
    blockedApps,
    violations,
    softPenaltyPushups,
    pendingSets,
    sessionState,
    addProceedPenalty,
    endSession,
  } = useFocusStore();

  const [remaining, setRemaining] = useState(
    Math.max(0, (sessionEndTime ?? 0) - Date.now()),
  );

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, (sessionEndTime ?? 0) - Date.now());
      setRemaining(r);
      if (r <= 0) { clearInterval(interval); endSession(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEndTime, endSession]);

  // Native monitoring
  useEffect(() => {
    AppMonitor.startMonitoring(blockedApps);
    return () => { AppMonitor.stopMonitoring(); };
  }, [blockedApps]);

  // Restricted app intercept
  useEffect(() => {
    if (!monitorEmitter) return;
    const sub = monitorEmitter.addListener('onRestrictedAppAttempt', (event: { packageName: string }) => {
      const appLabel = getAppLabel(event.packageName);
      Alert.alert(
        'Restricted App',
        `You tried to open ${appLabel}. Proceeding adds 1 pushup session.`,
        [
          { text: 'Stay Focused', style: 'cancel' },
          {
            text: 'Proceed',
            style: 'destructive',
            onPress: async () => {
              addProceedPenalty(event.packageName);
              try { await AppMonitor.proceedToRestrictedApp(event.packageName); } catch {}
            },
          },
        ],
      );
    });
    return () => sub.remove();
  }, [addProceedPenalty]);

  // State transitions
  useEffect(() => {
    if (sessionState === 'warning') navigation.navigate('ViolationWarning');
  }, [sessionState, navigation]);

  useEffect(() => {
    if (sessionState === 'completed') navigation.replace('FocusSummary');
  }, [sessionState, navigation]);

  const handleGiveUp = useCallback(() => {
    AppMonitor.stopMonitoring();
    endSession();
  }, [endSession]);

  const progress = sessionEndTime
    ? 1 - remaining / (timerMinutes * 60 * 1000)
    : 0;

  const totalMs = timerMinutes * 60 * 1000;
  const elapsed = totalMs - remaining;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Text style={s.tag}>FOCUS SESSION</Text>
        <Text style={s.title}>Stay Focused</Text>

        {/* ── Timer ring ── */}
        <View style={s.timerBlock}>
          <View style={s.timerRing}>
            <View style={s.timerInner}>
              <Text style={s.timerValue}>{formatTime(remaining)}</Text>
              <Text style={s.timerHint}>remaining</Text>
            </View>
          </View>
          <ProgressBar
            progress={progress}
            color={D.primary}
            height={8}
            style={s.timerProgress}
          />
          <Text style={s.timerElapsed}>
            {Math.round(elapsed / 60000)} / {timerMinutes} min elapsed
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <StatItem value={violations.length} label="Violations"  color={violations.length > 0 ? D.danger : D.accent} />
          <StatItem value={pendingSets}        label="Sets Due"   color={pendingSets > 0 ? D.danger : D.text} accent={pendingSets > 0} />
          <StatItem value={softPenaltyPushups} label="Pushups +" />
        </View>

        {/* ── Restricted apps ── */}
        <Card style={s.card}>
          <Text style={s.cardTitle}>RESTRICTED APPS</Text>
          <View style={s.appChips}>
            {blockedApps.map((pkg) => (
              <View key={pkg} style={s.appChip}>
                <Text style={s.appChipText}>{getAppLabel(pkg)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── Violation log ── */}
        {violations.length > 0 && (
          <Card style={s.card}>
            <Text style={[s.cardTitle, { color: D.danger }]}>VIOLATION LOG</Text>
            {violations.slice(-5).map((v, i) => (
              <View key={i} style={s.logRow}>
                <Text style={s.logApp}>{getAppLabel(v.packageName)}</Text>
                <View style={s.logBadge}>
                  <Text style={s.logBadgeText}>+1 set</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── End session ── */}
        <TouchableOpacity style={s.endBtn} onPress={handleGiveUp} activeOpacity={0.75}>
          <Text style={s.endBtnText}>End Session</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 72, paddingTop: SP.lg },

  tag:   { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: SP.xs },
  title: { fontSize: 26, fontWeight: '800', color: D.text, marginBottom: SP.xl },

  // Timer
  timerBlock:    { alignItems: 'center', marginBottom: SP.xl },
  timerRing:     {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: D.primaryLight,
    borderWidth: 6, borderColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.lg,
    ...SH.card,
  },
  timerInner:    { alignItems: 'center' },
  timerValue:    { fontSize: 44, fontWeight: '900', color: D.primary, fontVariant: ['tabular-nums'] },
  timerHint:     { fontSize: 12, color: D.textMuted, fontWeight: '600', marginTop: 2 },
  timerProgress: { width: '80%' },
  timerElapsed:  { fontSize: 12, color: D.textMuted, marginTop: SP.sm },

  // Stats
  statsRow: { flexDirection: 'row', gap: SP.md, marginBottom: SP.lg },

  // Cards
  card:      { marginBottom: SP.md },
  cardTitle: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 2, marginBottom: SP.md },

  appChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  appChip:  { backgroundColor: D.primaryLight, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6 },
  appChipText: { color: D.primary, fontSize: 13, fontWeight: '600' },

  logRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm },
  logApp:      { fontSize: 14, fontWeight: '600', color: D.text },
  logBadge:    { backgroundColor: D.dangerLight, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  logBadgeText:{ color: D.danger, fontSize: 11, fontWeight: '700' },

  // End button
  endBtn:     { borderWidth: 2, borderColor: D.border, borderRadius: R.pill, paddingVertical: 14, alignItems: 'center', marginTop: SP.sm },
  endBtnText: { color: D.danger, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
