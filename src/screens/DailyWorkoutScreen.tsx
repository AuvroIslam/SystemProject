import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { AppModal } from '../components/ui/AppModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';
import { useExercisePlanStore } from '../store/exercisePlanStore';
import { PlanExercise } from '../types/plan';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyWorkout'>;

function todayDayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function DailyWorkoutScreen({ navigation }: Props) {
  const {
    getTodayWorkout,
    isTodayComplete,
    markDayComplete,
    getCurrentWeekNumber,
    activePlan,
  } = useExercisePlanStore();

  const todayWorkout  = getTodayWorkout();
  const alreadyDone   = isTodayComplete();
  const currentWeek   = getCurrentWeekNumber();
  const dayIndex      = todayDayIndex();

  // setsCompleted[exerciseId] = number of sets the user has tapped "Done" on
  const [setsCompleted, setSetsCompleted] = useState<Record<string, number>>({});
  const [doneModal, setDoneModal] = useState(false);

  const handleSetDone = useCallback((exId: string, totalSets: number) => {
    setSetsCompleted((prev) => {
      const current = prev[exId] ?? 0;
      if (current >= totalSets) return prev;
      return { ...prev, [exId]: current + 1 };
    });
  }, []);

  const isExDone = (ex: PlanExercise) =>
    (setsCompleted[ex.id] ?? 0) >= ex.sets;

  const exercises  = todayWorkout?.exercises ?? [];
  const doneCnt    = exercises.filter((ex) => isExDone(ex)).length;
  const allDone    = exercises.length > 0 && doneCnt === exercises.length;
  const progressPct = exercises.length > 0 ? doneCnt / exercises.length : 0;

  const handleComplete = () => {
    if (!todayWorkout || !activePlan) return;
    markDayComplete(currentWeek, dayIndex, exercises.length);
    setDoneModal(true);
  };

  // ── No active plan ──
  if (!activePlan) {
    return (
      <AppBackground variant={1}>
      <SafeAreaView style={s.safe}>
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>No Active Plan</Text>
          <Text style={s.emptySub}>Create a plan first from the home screen.</Text>
          <Button label="Go Home" onPress={() => navigation.replace('Home')} variant="primary" />
        </View>
      </SafeAreaView>
      </AppBackground>
    );
  }

  // ── Rest day ──
  if (!todayWorkout || todayWorkout.isRestDay) {
    return (
      <AppBackground variant={1}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.restEmoji}>😴</Text>
          <Text style={s.emptyTitle}>Rest Day</Text>
          <Text style={s.emptySub}>Today is scheduled as a rest day. Recovery is part of progress!</Text>
          <Button label="View Plan" onPress={() => navigation.navigate('ExercisePlan')} variant="outline" />
        </View>
      </SafeAreaView>
      </AppBackground>
    );
  }

  // ── Already completed ──
  if (alreadyDone) {
    return (
      <AppBackground variant={1}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
        </View>
        <View style={s.emptyWrap}>
          <Feather name="check-circle" size={64} color={D.accent} />
          <Text style={s.emptyTitle}>Already Done!</Text>
          <Text style={s.emptySub}>You completed today's workout. See you tomorrow!</Text>
          <Button label="View Plan" onPress={() => navigation.navigate('ExercisePlan')} variant="primary" />
        </View>
      </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.tag}>TODAY'S WORKOUT</Text>
            <Text style={s.title}>{todayWorkout.focus}</Text>
          </View>
        </View>

        {/* Progress */}
        <Card style={s.progressCard} padding={SP.lg}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{doneCnt} of {exercises.length} exercises done</Text>
            <Text style={s.progressPct}>{Math.round(progressPct * 100)}%</Text>
          </View>
          <ProgressBar progress={progressPct} color={D.primary} height={8} style={{ marginTop: SP.sm }} />
        </Card>

        {/* Exercise list */}
        {exercises.map((ex, idx) => {
          const done        = isExDone(ex);
          const setsNow     = setsCompleted[ex.id] ?? 0;
          const remaining   = ex.sets - setsNow;
          return (
            <Card
              key={ex.id}
              style={done ? [s.exCard, s.exCardDone] : s.exCard}
              padding={SP.lg}>
              <View style={s.exHeader}>
                <View style={[s.exNum, done && s.exNumDone]}>
                  {done
                    ? <Feather name="check" size={14} color="#fff" />
                    : <Text style={s.exNumText}>{idx + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.exName, done && s.exNameDone]}>{ex.name}</Text>
                  <Text style={s.exSpec}>
                    {ex.sets} sets ×{' '}
                    {ex.durationSeconds ? `${ex.durationSeconds}s` : `${ex.reps} reps`}
                    {'  ·  '}rest {ex.restSeconds}s
                  </Text>
                </View>
                {done && <Feather name="check-circle" size={22} color={D.accent} />}
              </View>

              {/* Set tracker */}
              {!done && (
                <View style={s.setSection}>
                  <View style={s.setDots}>
                    {Array.from({ length: ex.sets }, (_, si) => (
                      <View
                        key={si}
                        style={[s.setDot, si < setsNow && s.setDotDone]}
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={s.doneSetBtn}
                    onPress={() => handleSetDone(ex.id, ex.sets)}
                    activeOpacity={0.75}>
                    <Feather name="check" size={14} color={D.onPrimary} />
                    <Text style={s.doneSetText}>
                      {remaining === 1 ? 'Last set' : `Set ${setsNow + 1}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          );
        })}

        {/* Tip */}
        <Text style={s.tip}>Tap "Set {'{N}'}" after finishing each set.</Text>

        {/* Complete button */}
        {allDone && (
          <Button
            label="Complete Workout 🎉"
            onPress={handleComplete}
            variant="primary"
            fullWidth
            style={{ marginTop: SP.xl }}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AppModal
        visible={doneModal}
        onClose={() => { setDoneModal(false); navigation.goBack(); }}
        variant="success"
        title="Workout Complete! 🎉"
        message={`Great job finishing ${todayWorkout?.focus ?? 'today\'s workout'}! Keep it up.`}
        buttons={[{ label: 'Nice!', onPress: () => { setDoneModal(false); navigation.goBack(); }, variant: 'primary' }]}
      />

    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.lg },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.xxl, gap: SP.lg },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: D.text, textAlign: 'center' },
  emptySub:   { fontSize: 14, color: D.textMuted, textAlign: 'center', lineHeight: 20 },
  restEmoji:  { fontSize: 52 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.lg },
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  tag:     { fontSize: 10, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: 2 },
  title:   { fontSize: 24, fontWeight: '800', color: D.text },

  progressCard: { marginBottom: SP.lg },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:{ fontSize: 13, fontWeight: '600', color: D.text },
  progressPct:  { fontSize: 14, fontWeight: '800', color: D.primary },

  exCard:     { marginBottom: SP.md, ...SH.card },
  exCardDone: { backgroundColor: D.accent + '18', borderWidth: 1.5, borderColor: D.accent + '55' },

  exHeader:  { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  exNum:     { width: 32, height: 32, borderRadius: 16, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  exNumDone: { backgroundColor: D.accent },
  exNumText: { fontSize: 13, fontWeight: '800', color: D.primary },
  exName:    { fontSize: 15, fontWeight: '700', color: D.text, marginBottom: 2 },
  exNameDone:{ color: D.accent },
  exSpec:    { fontSize: 12, color: D.textMuted },

  setSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.md, paddingTop: SP.md, borderTopWidth: 1, borderColor: D.border },
  setDots:    { flexDirection: 'row', gap: SP.sm },
  setDot:     { width: 14, height: 14, borderRadius: 7, backgroundColor: D.border },
  setDotDone: { backgroundColor: D.primary },

  doneSetBtn:  { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm, ...SH.soft },
  doneSetText: { color: D.onPrimary, fontSize: 13, fontWeight: '700' },

  tip: { fontSize: 11, color: D.textLight, textAlign: 'center', marginTop: SP.xs, marginBottom: SP.md },
});
