import React, { useEffect, useState, useCallback } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
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
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { AppBackground } from '../components/ui/AppBackground';
import { AppModal } from '../components/ui/AppModal';
import { Card } from '../components/ui/Card';
import { D, SP, R, SH } from '../theme/design';

const { AppMonitor } = NativeModules;
const monitorEmitter = new NativeEventEmitter(AppMonitor);

type Props = NativeStackScreenProps<RootStackParamList, 'FocusActive'>;

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m   = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getAppLabel(pkg: string): string {
  return AVAILABLE_APPS.find((a) => a.packageName === pkg)?.label ?? pkg;
}

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

export function FocusActiveScreen({ navigation }: Props) {
  const {
    sessionEndTime, blockedApps, violations, softPenaltyPushups,
    pendingSets, sessionState, addProceedPenalty, endSession, abandonSession,
  } = useFocusStore();

  const [remaining, setRemaining] = useState(
    Math.max(0, (sessionEndTime ?? 0) - Date.now()),
  );
  const [violationModal, setViolationModal] = useState<{ visible: boolean; pkg: string }>({ visible: false, pkg: '' });
  const [endModal, setEndModal] = useState(false);

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
    return () => AppMonitor.stopMonitoring();
  }, [blockedApps]);

  // Restricted app intercept → in-app modal instead of Alert
  useEffect(() => {
    const sub = monitorEmitter.addListener('onRestrictedAppAttempt', (event: { packageName: string }) => {
      setViolationModal({ visible: true, pkg: event.packageName });
    });
    return () => sub.remove();
  }, []);

  // Navigate on state change
  useEffect(() => {
    if (sessionState === 'warning')   navigation.navigate('ViolationWarning');
  }, [sessionState, navigation]);
  useEffect(() => {
    if (sessionState === 'completed') navigation.replace('FocusSummary');
  }, [sessionState, navigation]);

  const handleGiveUp = useCallback(() => {
    AppMonitor.stopMonitoring();
    abandonSession();
  }, [abandonSession]);

  const progress = sessionEndTime
    ? 1 - remaining / (useFocusStore.getState().timerMinutes * 60 * 1000)
    : 0;

  const progressPct = Math.min(Math.round(progress * 100), 100);

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.iconWrap}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={D.primary} />
          </View>
          <Text style={s.tag}>SESSION IN PROGRESS</Text>
        </View>

        {/* Timer Ring */}
        <Card style={s.timerCard} padding={SP.xl}>
          <View style={s.ringWrap}>
            <View style={s.ring}>
              <Text style={s.timerText}>{formatTime(remaining)}</Text>
              <Text style={s.timerHint}>remaining</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={s.progressPct}>{progressPct}% complete</Text>
        </Card>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <Card style={s.statCard} padding={SP.lg}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={D.textMuted} />
            <Text style={s.statValue}>{violations.length}</Text>
            <Text style={s.statLabel}>Violations</Text>
          </Card>
          <Card style={[s.statCard, pendingSets > 0 && s.statCardDanger]} padding={SP.lg}>
            <MaterialCommunityIcons name="dumbbell" size={20} color={pendingSets > 0 ? D.danger : D.textMuted} />
            <Text style={[s.statValue, pendingSets > 0 && { color: D.danger }]}>{pendingSets}</Text>
            <Text style={s.statLabel}>Sets Due</Text>
          </Card>
          <Card style={s.statCard} padding={SP.lg}>
            <MaterialCommunityIcons name="arm-flex" size={20} color={D.textMuted} />
            <Text style={s.statValue}>{softPenaltyPushups}</Text>
            <Text style={s.statLabel}>Pushups</Text>
          </Card>
        </View>

        {/* Restricted Apps */}
        <Card style={s.card} padding={SP.lg}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={15} color={D.primary} />
            <Text style={s.cardTitle}>Restricted Apps</Text>
          </View>
          <View style={s.appTagRow}>
            {blockedApps.map((pkg) => (
              <View key={pkg} style={s.appTag}>
                <MaterialCommunityIcons
                  name={APP_ICON_MAP[pkg] ?? 'application-outline'}
                  size={13}
                  color={D.primary}
                />
                <Text style={s.appTagText}>{getAppLabel(pkg)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Violation Log */}
        {violations.length > 0 && (
          <Card style={s.card} padding={SP.lg}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="history" size={15} color={D.danger} />
              <Text style={[s.cardTitle, { color: D.danger }]}>Violation Log</Text>
            </View>
            {violations.slice(-5).map((v, i) => (
              <View key={i} style={s.logRow}>
                <MaterialCommunityIcons
                  name={APP_ICON_MAP[v.packageName] ?? 'application-outline'}
                  size={14}
                  color={D.textMuted}
                />
                <Text style={s.logApp}>{getAppLabel(v.packageName)}</Text>
                <View style={s.logBadge}>
                  <Text style={s.logBadgeText}>+1 set</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* End Session */}
        <TouchableOpacity style={s.endBtn} onPress={() => setEndModal(true)} activeOpacity={0.8}>
          <Feather name="x-circle" size={16} color={D.danger} />
          <Text style={s.endBtnText}>End Session</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>

    {/* Violation modal */}
    <AppModal
      visible={violationModal.visible}
      onClose={() => setViolationModal({ visible: false, pkg: '' })}
      variant="warning"
      title="Restricted App"
      message={`You tried to open ${getAppLabel(violationModal.pkg)}.\n\nProceeding will add 1 penalty set.`}
      buttons={[
        {
          label: 'Stay Focused',
          variant: 'primary',
          onPress: () => setViolationModal({ visible: false, pkg: '' }),
        },
        {
          label: 'Proceed Anyway',
          variant: 'danger',
          onPress: async () => {
            addProceedPenalty(violationModal.pkg);
            setViolationModal({ visible: false, pkg: '' });
            try { await AppMonitor.proceedToRestrictedApp(violationModal.pkg); } catch { /* no-op */ }
          },
        },
      ]}
    />

    {/* End session confirm */}
    <AppModal
      visible={endModal}
      onClose={() => setEndModal(false)}
      variant="confirm"
      title="End Session?"
      message="Ending early will count as incomplete. Your violations still apply."
      buttons={[
        { label: 'Keep Going', variant: 'ghost',  onPress: () => setEndModal(false) },
        { label: 'End Session', variant: 'danger', onPress: () => { setEndModal(false); handleGiveUp(); } },
      ]}
    />

    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.lg, paddingBottom: 40 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.lg },
  iconWrap: { width: 36, height: 36, borderRadius: R.md, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tag:      { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2 },

  timerCard: { alignItems: 'center', marginBottom: SP.md },
  ringWrap:  { marginBottom: SP.lg },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 5,
    borderColor: D.primaryMuted,
    backgroundColor: D.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: { fontSize: 46, fontWeight: '900', color: D.text, fontVariant: ['tabular-nums'] },
  timerHint: { fontSize: 12, fontWeight: '600', color: D.textMuted, marginTop: 2 },

  progressTrack: { width: '85%', height: 6, backgroundColor: D.border, borderRadius: 3, overflow: 'hidden', marginBottom: SP.xs },
  progressFill:  { height: '100%', backgroundColor: D.primary, borderRadius: 3 },
  progressPct:   { fontSize: 11, fontWeight: '700', color: D.textMuted },

  statsRow: { flexDirection: 'row', gap: SP.sm, marginBottom: SP.md },
  statCard: { flex: 1, alignItems: 'center', gap: SP.xs },
  statCardDanger: { borderWidth: 1.5, borderColor: D.danger + '55', backgroundColor: D.dangerLight },
  statValue:  { fontSize: 24, fontWeight: '900', color: D.text },
  statLabel:  { fontSize: 10, fontWeight: '700', color: D.textMuted },

  card:       { marginBottom: SP.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.md },
  cardTitle:  { fontSize: 13, fontWeight: '800', color: D.text },

  appTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  appTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: D.primaryLight, borderRadius: R.pill, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  appTagText:{ fontSize: 12, fontWeight: '600', color: D.primary },

  logRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingVertical: SP.xs, borderBottomWidth: 1, borderColor: D.border },
  logApp:       { flex: 1, fontSize: 13, fontWeight: '600', color: D.text },
  logBadge:     { backgroundColor: D.dangerLight, borderRadius: R.sm, paddingHorizontal: SP.sm, paddingVertical: 2 },
  logBadgeText: { fontSize: 11, fontWeight: '700', color: D.danger },

  endBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, borderWidth: 2, borderColor: D.danger + '55', borderRadius: R.pill, paddingVertical: 14, marginTop: SP.sm },
  endBtnText: { color: D.danger, fontSize: 14, fontWeight: '700' },
});
