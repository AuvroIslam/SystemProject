import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  NativeModules,
  NativeEventEmitter,
  AppState,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { C, SHADOW } from '../theme/atelier';

const { AppMonitor } = NativeModules;
const monitorEmitter = new NativeEventEmitter(AppMonitor);

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
    blockedApps,
    violations,
    penaltyReps,
    pendingSets,
    sessionState,
    recordViolation,
    endSession,
  } = useFocusStore();

  const [remaining, setRemaining] = useState(
    Math.max(0, (sessionEndTime ?? 0) - Date.now()),
  );

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, (sessionEndTime ?? 0) - Date.now());
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        endSession();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEndTime, endSession]);

  // Start native monitoring
  useEffect(() => {
    AppMonitor.startMonitoring(blockedApps);
    return () => {
      AppMonitor.stopMonitoring();
    };
  }, [blockedApps]);

  // Listen for violations from native side
  useEffect(() => {
    const sub = monitorEmitter.addListener('onAppViolation', (event: { packageName: string }) => {
      recordViolation(event.packageName);
    });
    return () => sub.remove();
  }, [recordViolation]);

  // When state becomes "warning", navigate to warning screen
  useEffect(() => {
    if (sessionState === 'warning') {
      navigation.navigate('ViolationWarning');
    }
  }, [sessionState, navigation]);

  // When state becomes "completed", navigate to focus summary
  useEffect(() => {
    if (sessionState === 'completed') {
      navigation.replace('FocusSummary');
    }
  }, [sessionState, navigation]);

  const handleGiveUp = useCallback(() => {
    AppMonitor.stopMonitoring();
    endSession();
  }, [endSession]);

  const progress = sessionEndTime
    ? 1 - remaining / (useFocusStore.getState().timerMinutes * 60 * 1000)
    : 0;

  // Circular progress ring constants
  const RING_SIZE = 200;
  const RING_STROKE = 6;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* ── Header ── */}
        <Text style={s.label}>SESSION IN PROGRESS</Text>

        {/* ── Timer Ring ── */}
        <View style={s.ringContainer}>
          <View style={s.ringOuter}>
            {/* Simple progress bar inside a circle aesthetic */}
            <View style={s.ringInner}>
              <Text style={s.timer}>{formatTime(remaining)}</Text>
              <Text style={s.timerHint}>remaining</Text>
            </View>
          </View>
          {/* Linear progress underneath */}
          <View style={s.progressBar}>
            <View
              style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
            />
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{violations.length}</Text>
            <Text style={s.statLabel}>VIOLATIONS</Text>
          </View>
          <View style={[s.statCard, s.statCardAccent]}>
            <Text style={[s.statValue, { color: C.error }]}>{pendingSets}</Text>
            <Text style={s.statLabel}>SETS DUE</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{penaltyReps}</Text>
            <Text style={s.statLabel}>REPS / SET</Text>
          </View>
        </View>

        {/* ── Restricted Apps ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>RESTRICTED APPS</Text>
          <Text style={s.cardBody}>
            {blockedApps.map(getAppLabel).join('  ·  ')}
          </Text>
        </View>

        {/* ── Violation Log ── */}
        {violations.length > 0 && (
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: C.error }]}>VIOLATION LOG</Text>
            {violations.slice(-5).map((v, i) => (
              <View key={i} style={s.logRow}>
                <Text style={s.logApp}>{getAppLabel(v.packageName)}</Text>
                <View style={s.logBadge}>
                  <Text style={s.logBadgeText}>+1 set</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── End Session ── */}
        <TouchableOpacity
          style={s.endBtn}
          onPress={handleGiveUp}
          activeOpacity={0.8}>
          <Text style={s.endBtnText}>END SESSION</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  scroll: { padding: 24, paddingBottom: 72 },

  label: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },

  /* Timer ring */
  ringContainer: { alignItems: 'center', marginBottom: 32 },
  ringOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: C.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceContainerLow,
    marginBottom: 16,
  },
  ringInner: { alignItems: 'center' },
  timer: {
    color: C.primaryContainer,
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.secondary,
    borderRadius: 2,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: C.error,
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

  /* Cards */
  card: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  cardBody: {
    color: C.onSurface,
    fontSize: 13,
    lineHeight: 20,
  },

  /* Log */
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logApp: { color: C.onSurface, fontSize: 14, fontWeight: '600' },
  logBadge: {
    backgroundColor: C.errorContainer,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logBadgeText: {
    color: C.onErrorContainer,
    fontSize: 11,
    fontWeight: '700',
  },

  /* End button */
  endBtn: {
    borderWidth: 2,
    borderColor: C.outlineVariant,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  endBtnText: {
    color: C.error,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
