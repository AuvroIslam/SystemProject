import React, { useEffect, useRef } from 'react';
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
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { useAuthStore } from '../store/authStore';
import { useXPStore } from '../store/xpStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSummary'>;

function getAppLabel(pkg: string): string {
  return AVAILABLE_APPS.find((a) => a.packageName === pkg)?.label ?? pkg;
}

export function FocusSummaryScreen({ navigation }: Props) {
  const { timerMinutes, violations, pendingSets, resetSession } = useFocusStore();
  const user = useAuthStore((s) => s.user);
  const { addXP } = useXPStore();
  const xpAwarded = useRef(false);

  const totalViolations = violations.length;
  const clean = totalViolations === 0;
  const pct = clean ? 100 : Math.max(0, Math.round(100 - totalViolations * 15));

  useEffect(() => {
    if (!user || xpAwarded.current) return;
    xpAwarded.current = true;
    let xp = 50;
    if (clean) xp += 30;
    addXP(user.uid, xp);
  }, [user, addXP, clean]);

  const handleDone = () => {
    resetSession();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Illustration */}
        <Image
          source={clean
            ? require('../../Elements/SuccessReward.png')
            : require('../../Elements/SomeThingWrong.png')}
          style={s.illustration}
          resizeMode="contain"
        />

        {/* Tag + title */}
        <Text style={s.tag}>SESSION COMPLETE</Text>
        <Text style={s.headline}>{clean ? 'Perfect Focus! 🎉' : 'Session Report'}</Text>

        {/* Score card */}
        <Card style={s.scoreCard} padding={SP.xl}>
          <View style={s.scoreRow}>
            <View style={s.scoreCircle}>
              <Text style={s.scorePct}>{pct}%</Text>
              <Text style={s.scoreHint}>focus</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: SP.lg }}>
              <View style={[s.gradeBadge, { backgroundColor: clean ? D.accentLight : pct >= 70 ? D.primaryLight : D.dangerLight }]}>
                <Text style={[s.gradeText, { color: clean ? D.accentDark : pct >= 70 ? D.primary : D.danger }]}>
                  {clean ? 'ELITE' : pct >= 70 ? 'GOOD' : 'NEEDS WORK'}
                </Text>
              </View>
              <ProgressBar progress={pct / 100} color={clean ? D.accent : D.primary} height={8} style={{ marginTop: SP.md }} />
            </View>
          </View>
        </Card>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { val: `${timerMinutes}m`, label: 'DURATION' },
            { val: totalViolations,  label: 'VIOLATIONS', danger: !clean },
            { val: pendingSets,      label: 'SETS DUE',   danger: pendingSets > 0 },
          ].map(({ val, label, danger }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statVal, danger && { color: D.danger }]}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* XP earned */}
        <Card style={s.xpCard} variant="primary" padding={SP.lg}>
          <View style={s.xpRow}>
            <Text style={s.xpIcon}>⚡</Text>
            <View>
              <Text style={s.xpTitle}>XP Earned</Text>
              <Text style={s.xpAmount}>+{clean ? 80 : 50} XP</Text>
            </View>
          </View>
        </Card>

        {/* Violations breakdown */}
        {totalViolations > 0 && (
          <Card style={s.card}>
            <Text style={s.cardTitle}>VIOLATION BREAKDOWN</Text>
            {violations.map((v, i) => (
              <View key={i} style={s.logRow}>
                <View style={s.logNum}><Text style={s.logNumText}>{i + 1}</Text></View>
                <Text style={s.logApp}>{getAppLabel(v.packageName)}</Text>
                <View style={s.logBadge}><Text style={s.logBadgeText}>+1 set</Text></View>
              </View>
            ))}
          </Card>
        )}

        {/* Message */}
        <Card style={s.msgCard} variant="muted" padding={SP.lg}>
          <Text style={s.msgText}>
            {clean
              ? 'Amazing discipline! Your focus is your superpower. Keep it up! 💪'
              : pendingSets > 0
                ? `You have ${pendingSets} set${pendingSets !== 1 ? 's' : ''} to pay off. Head to the Home screen to clear your debt.`
                : 'Violations noted. Work on holding focus for longer next time.'}
          </Text>
        </Card>

        <Button label="Done" onPress={handleDone} variant="primary" fullWidth />

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 72, alignItems: 'center' },

  illustration: { width: 180, height: 160, marginTop: SP.xl, marginBottom: SP.md },

  tag:      { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: SP.xs },
  headline: { fontSize: 28, fontWeight: '800', color: D.text, marginBottom: SP.xl, textAlign: 'center' },

  scoreCard: { width: '100%', marginBottom: SP.lg },
  scoreRow:  { flexDirection: 'row', alignItems: 'center' },
  scoreCircle:{
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 5, borderColor: D.primary,
    backgroundColor: D.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  scorePct:  { fontSize: 26, fontWeight: '900', color: D.primary },
  scoreHint: { fontSize: 10, color: D.textMuted, fontWeight: '600' },
  gradeBadge:{ alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 6 },
  gradeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  statsRow:  { flexDirection: 'row', gap: SP.md, width: '100%', marginBottom: SP.lg },
  statCard:  { flex: 1, backgroundColor: D.card, borderRadius: R.md, padding: SP.base, alignItems: 'center', ...SH.soft },
  statVal:   { fontSize: 24, fontWeight: '900', color: D.text },
  statLabel: { fontSize: 9, fontWeight: '800', color: D.textMuted, letterSpacing: 1.5, marginTop: 4 },

  xpCard: { width: '100%', marginBottom: SP.lg },
  xpRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.lg },
  xpIcon: { fontSize: 32 },
  xpTitle:{ fontSize: 13, color: D.primary, fontWeight: '600' },
  xpAmount:{ fontSize: 28, fontWeight: '900', color: D.primary },

  card:     { width: '100%', marginBottom: SP.lg },
  cardTitle:{ fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 2, marginBottom: SP.md },
  logRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm, gap: SP.sm },
  logNum:   { width: 22, height: 22, borderRadius: 11, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  logNumText:{ color: D.onPrimary, fontSize: 11, fontWeight: '800' },
  logApp:   { flex: 1, fontSize: 14, fontWeight: '600', color: D.text },
  logBadge: { backgroundColor: D.dangerLight, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3 },
  logBadgeText:{ color: D.danger, fontSize: 11, fontWeight: '700' },

  msgCard: { width: '100%', marginBottom: SP.xl },
  msgText: { color: D.textMuted, fontSize: 14, lineHeight: 21 },
});
