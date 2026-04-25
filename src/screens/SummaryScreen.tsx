import React, { useCallback, useEffect, useRef } from 'react';
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
import { useExerciseStore } from '../store/exerciseStore';
import { saveWorkout, incrementDailyReps, incrementDailySession } from '../services/fitnessStorage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

const SCORE_LABELS: Record<string, string> = {
  depth: 'Depth', form: 'Form', stability: 'Stability', tempo: 'Tempo',
};
const SCORE_COLORS = [D.primary, D.accent, D.warning, D.danger];

export function SummaryScreen({ navigation }: Props) {
  const { setSummary, exerciseType, reset } = useExerciseStore();
  const saved = useRef(false);
  const guardFired = useRef(false);

  const handleRepeat = useCallback(() => {
    if (exerciseType) navigation.replace('Exercise', { exerciseType });
  }, [exerciseType, navigation]);

  const handleDone = useCallback(() => {
    reset();
    navigation.popToTop();
  }, [reset, navigation]);

  // Persist workout once
  useEffect(() => {
    if (!setSummary || !exerciseType || saved.current) return;
    saved.current = true;
    saveWorkout({ exerciseType, reps: setSummary.validReps, date: new Date().toISOString() });
    incrementDailyReps(setSummary.validReps);
    incrementDailySession();
  }, [setSummary, exerciseType]);

  // Guard: if summary missing, navigate away safely
  useEffect(() => {
    if (!setSummary && !guardFired.current) {
      guardFired.current = true;
      handleDone();
    }
  }, [setSummary, handleDone]);

  if (!setSummary) return null;

  const { validReps, totalReps, averageScore, scores, exercise, weakestArea, suggestions } = setSummary;
  const quality =
    averageScore >= 80 ? 'Excellent' :
    averageScore >= 60 ? 'Good'      :
    averageScore >= 40 ? 'Fair'      : 'Needs Work';
  const qualityColor =
    averageScore >= 80 ? D.accent :
    averageScore >= 60 ? D.primary :
    averageScore >= 40 ? D.warning : D.danger;

  const EXERCISE_IMGS: Record<string, any> = {
    pushup: require('../../Elements/pushup.png'),
    situp:  require('../../Elements/situps.png'),
    squat:  require('../../Elements/squats.png'),
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <Image source={EXERCISE_IMGS[exercise] ?? EXERCISE_IMGS.pushup} style={s.heroImg} resizeMode="contain" />
          <Text style={s.tag}>SET COMPLETE</Text>
          <Text style={s.headline}>{validReps} Reps Done!</Text>
          <View style={[s.qualityBadge, { backgroundColor: qualityColor + '22', borderColor: qualityColor }]}>
            <Text style={[s.qualityText, { color: qualityColor }]}>{quality}</Text>
          </View>
        </View>

        {/* Score card */}
        <Card style={s.scoreCard} padding={SP.xl}>
          <View style={s.scoreRow}>
            <View style={s.scoreCircle}>
              <Text style={s.scoreBig}>{Math.round(averageScore)}</Text>
              <Text style={s.scoreLabel}>avg score</Text>
            </View>
            <View style={s.scoreBars}>
              {(['depth', 'form', 'stability', 'tempo'] as const).map((k, i) => {
                const avg = scores.length > 0
                  ? scores.reduce((acc, sc) => acc + sc[k], 0) / scores.length
                  : 0;
                return (
                  <View key={k} style={s.scoreBarRow}>
                    <Text style={s.scoreBarLabel}>{SCORE_LABELS[k]}</Text>
                    <ProgressBar progress={avg / 100} color={SCORE_COLORS[i]} height={5} style={{ flex: 1 }} />
                    <Text style={[s.scoreBarVal, { color: SCORE_COLORS[i] }]}>{Math.round(avg)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { val: totalReps,  label: 'TOTAL REPS' },
            { val: validReps,  label: 'VALID REPS', accent: true },
            { val: totalReps - validReps, label: 'SKIPPED' },
          ].map(({ val, label, accent }) => (
            <View key={label} style={[s.statCard, accent && s.statCardAccent]}>
              <Text style={[s.statVal, accent && { color: D.primary }]}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card style={s.card}>
            <Text style={s.cardTitle}>TIPS FOR NEXT TIME</Text>
            {suggestions.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <Text style={s.tipBullet}>→</Text>
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        <View style={s.btnRow}>
          <Button label="Do Again" onPress={handleRepeat} variant="outline" style={{ flex: 1 }} />
          <Button label="Done" onPress={handleDone} variant="primary" style={{ flex: 1 }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 72 },

  hero:         { alignItems: 'center', paddingVertical: SP.xl },
  heroImg:      { width: 120, height: 120, marginBottom: SP.md },
  tag:          { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: SP.xs },
  headline:     { fontSize: 30, fontWeight: '900', color: D.text, marginBottom: SP.md },
  qualityBadge: { borderRadius: R.pill, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 7 },
  qualityText:  { fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  scoreCard: { marginBottom: SP.lg },
  scoreRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.xl },
  scoreCircle:{
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: D.primaryLight, borderWidth: 4, borderColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBig:   { fontSize: 28, fontWeight: '900', color: D.primary },
  scoreLabel: { fontSize: 10, color: D.textMuted, fontWeight: '600' },
  scoreBars:  { flex: 1, gap: SP.sm },
  scoreBarRow:{ flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  scoreBarLabel:{ width: 58, fontSize: 11, color: D.textMuted, fontWeight: '600' },
  scoreBarVal:{ width: 26, fontSize: 11, fontWeight: '700', textAlign: 'right' },

  statsRow:     { flexDirection: 'row', gap: SP.md, marginBottom: SP.lg },
  statCard:     { flex: 1, backgroundColor: D.card, borderRadius: R.md, padding: SP.base, alignItems: 'center', ...SH.soft },
  statCardAccent:{ backgroundColor: D.primaryLight },
  statVal:      { fontSize: 24, fontWeight: '900', color: D.text },
  statLabel:    { fontSize: 9, fontWeight: '800', color: D.textMuted, letterSpacing: 1.5, marginTop: 4 },

  card:      { marginBottom: SP.xl },
  cardTitle: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 2, marginBottom: SP.md },
  tipRow:    { flexDirection: 'row', gap: SP.sm, marginBottom: SP.sm, alignItems: 'flex-start' },
  tipBullet: { color: D.primary, fontWeight: '700', fontSize: 14 },
  tipText:   { flex: 1, color: D.textMuted, fontSize: 13, lineHeight: 19 },

  btnRow: { flexDirection: 'row', gap: SP.md },
});
