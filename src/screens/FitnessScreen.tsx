import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { getDailyStats, getWorkoutHistory, DailyStats, WorkoutEntry } from '../services/fitnessStorage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatItem } from '../components/ui/StatItem';
import { BottomNav } from '../components/ui/BottomNav';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Fitness'>;

const EXERCISE_IMGS: Record<string, any> = {
  pushup: require('../../Elements/pushup.png'),
  situp:  require('../../Elements/situps.png'),
  squat:  require('../../Elements/squats.png'),
};

function exerciseLabel(t: string) {
  return t === 'pushup' ? 'Push-ups' : t === 'situp' ? 'Sit-ups' : 'Squats';
}

function TimerWorkout() {
  const [durationMin, setDurationMin] = useState('2');
  const [running, setRunning]         = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [repsDone, setRepsDone]       = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    const mins = parseInt(durationMin, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid duration', 'Enter a positive number of minutes.');
      return;
    }
    setSecondsLeft(mins * 60);
    setRepsDone(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Card style={t.card}>
      <Text style={t.title}>Timer Workout</Text>
      {!running ? (
        <>
          <Text style={t.label}>Duration (minutes)</Text>
          <TextInput
            style={t.input}
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="numeric"
            placeholder="2"
            placeholderTextColor={D.textLight}
          />
          <Button label="Start Timer" onPress={startTimer} variant="primary" fullWidth style={{ marginTop: SP.sm }} />
          {repsDone > 0 && <Text style={t.result}>Session ended — {repsDone} reps logged</Text>}
        </>
      ) : (
        <>
          <Text style={t.timerDisplay}>{mm}:{ss}</Text>
          <Text style={t.timerReps}>{repsDone} reps</Text>
          <View style={t.btnRow}>
            <Button label="+ Rep" onPress={() => setRepsDone((r) => r + 1)} variant="primary" style={{ flex: 1 }} />
            <Button label="Stop"  onPress={() => { clearInterval(intervalRef.current!); setRunning(false); }} variant="danger" style={{ flex: 1 }} />
          </View>
        </>
      )}
    </Card>
  );
}

export function FitnessScreen({ navigation }: Props) {
  const [stats, setStats]     = useState<DailyStats | null>(null);
  const [history, setHistory] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    getDailyStats().then(setStats);
    getWorkoutHistory().then(setHistory);
  }, []);

  return (
    <AppBackground variant={1}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <Text style={s.title}>Fitness</Text>
          </View>

          <Text style={s.sectionTitle}>Today</Text>
          <View style={s.statsRow}>
            <StatItem value={stats?.totalReps ?? 0} label="Total Reps" accent />
            <StatItem value={stats?.sessionsCompleted ?? 0} label="Sessions" />
          </View>

          <Text style={s.sectionTitle}>Timer Workout</Text>
          <TimerWorkout />

          <Text style={s.sectionTitle}>Recent Workouts</Text>
          <Card>
            {history.length === 0 ? (
              <View style={s.emptyBlock}>
                <Image source={require('../../Elements/EmptyState.png')} style={s.emptyImg} resizeMode="contain" />
                <Text style={s.emptyText}>No workouts yet. Start exercising!</Text>
              </View>
            ) : (
              history.map((entry, i) => (
                <View key={i} style={[s.historyRow, i < history.length - 1 && s.historyBorder]}>
                  <Image source={EXERCISE_IMGS[entry.exerciseType] ?? EXERCISE_IMGS.pushup} style={s.historyImg} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.historyEx}>{exerciseLabel(entry.exerciseType)}</Text>
                    <Text style={s.historyDate}>{entry.date.slice(0, 10)}</Text>
                  </View>
                  <View style={s.repsBadge}>
                    <Text style={s.repsVal}>{entry.reps}</Text>
                    <Text style={s.repsLabel}>reps</Text>
                  </View>
                </View>
              ))
            )}
          </Card>

        </ScrollView>
        <BottomNav current="Fitness" navigation={navigation} />
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 96, paddingTop: SP.base },

  header:       { marginBottom: SP.lg },
  title:        { fontSize: 22, fontWeight: '900', color: D.text },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: D.text, marginBottom: SP.md, marginTop: SP.sm },
  statsRow:     { flexDirection: 'row', gap: SP.md, marginBottom: SP.xl },

  emptyBlock: { alignItems: 'center', paddingVertical: SP.xl },
  emptyImg:   { width: 100, height: 80, marginBottom: SP.md },
  emptyText:  { color: D.textMuted, fontSize: 14 },

  historyRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md, gap: SP.md },
  historyBorder:{ borderBottomWidth: 1, borderColor: D.divider },
  historyImg:   { width: 36, height: 36 },
  historyEx:    { fontSize: 14, fontWeight: '700', color: D.text },
  historyDate:  { fontSize: 12, color: D.textMuted, marginTop: 2 },
  repsBadge:    { backgroundColor: D.primaryLight, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  repsVal:      { fontSize: 16, fontWeight: '800', color: D.primary },
  repsLabel:    { fontSize: 9, fontWeight: '700', color: D.primaryMuted, letterSpacing: 1 },
});

const t = StyleSheet.create({
  card:         { marginBottom: SP.sm },
  title:        { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: SP.lg },
  label:        { fontSize: 13, color: D.textMuted, marginBottom: SP.sm },
  input:        { backgroundColor: D.bg, borderRadius: R.md, borderWidth: 1.5, borderColor: D.border, padding: SP.md, color: D.text, fontSize: 16 },
  timerDisplay: { fontSize: 56, fontWeight: '900', color: D.primary, textAlign: 'center', fontVariant: ['tabular-nums'], marginVertical: SP.md },
  timerReps:    { fontSize: 20, color: D.accent, fontWeight: '700', textAlign: 'center', marginBottom: SP.lg },
  result:       { color: D.textMuted, textAlign: 'center', fontSize: 13, marginTop: SP.sm },
  btnRow:       { flexDirection: 'row', gap: SP.md },
});
