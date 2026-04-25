import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DimensionValue, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PoseLandmarks } from '../types/pose';
import { CameraView } from '../components/CameraView';
import { FormGlow } from '../components/FormGlow';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useExerciseTracker } from '../hooks/useExerciseTracker';
import { useExerciseStore } from '../store/exerciseStore';
import { D, R, SP } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercise'>;

const GOAL_REPS = 15;

const EXERCISE_LABELS: Record<string, string> = {
  pushup: 'Push-ups',
  situp:  'Sit-ups',
  squat:  'Squats',
};

const MOTIVATIONS = [
  'Great form! Keep it up!',
  "You're crushing it!",
  'Stay strong, keep going!',
  'Perfect rhythm, nice work!',
];

export function ExerciseScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const { processLandmarks, finishSet } = useExerciseTracker(exerciseType);

  const [hasBody, setHasBody]     = useState(false);
  const [repFlash, setRepFlash]   = useState(false);
  const [facing, setFacing]       = useState<'front' | 'back'>('front');
  const [elapsed, setElapsed]     = useState(0);
  const prevRepCount  = useRef(0);
  const flashTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { repCount, validRepCount, currentPhase, currentFeedback, lastRepScore, lastRepCounted, isActive } =
    useExerciseStore();

  // Elapsed timer
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // Rep flash effect
  useEffect(() => {
    if (validRepCount > prevRepCount.current) {
      prevRepCount.current = validRepCount;
      setRepFlash(true);
      flashTimeout.current = setTimeout(() => setRepFlash(false), 650);
    }
    return () => { if (flashTimeout.current) clearTimeout(flashTimeout.current); };
  }, [validRepCount]);

  const handlePose = useCallback(
    (lm: PoseLandmarks) => { processLandmarks(lm); setHasBody(true); },
    [processLandmarks],
  );

  const handleStop = useCallback(() => {
    finishSet();
    navigation.replace('Summary');
  }, [finishSet, navigation]);

  const flipCamera = useCallback(() => {
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
  }, []);

  const mm       = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss       = String(elapsed % 60).padStart(2, '0');
  const calories = Math.round(validRepCount * 0.6);
  const progress = `${Math.min((validRepCount / GOAL_REPS) * 100, 100)}%` as DimensionValue;
  const label    = EXERCISE_LABELS[exerciseType] ?? exerciseType;

  const phaseColor =
    currentPhase === 'DOWN' ? D.danger :
    currentPhase === 'UP'   ? D.accent : '#9B9BF5';

  const motivation = currentFeedback.length > 0
    ? currentFeedback[0]
    : MOTIVATIONS[validRepCount % MOTIVATIONS.length];

  const qualityColor =
    lastRepScore?.total == null ? D.textLight :
    lastRepScore.total >= 80    ? D.accent    :
    lastRepScore.total >= 60    ? D.warning   : D.danger;

  return (
    <View style={s.root}>

      {/* ── Full-screen camera ── */}
      <CameraView onPoseDetected={handlePose} isActive={isActive} facing={facing} />
      <FormGlow
        phase={currentPhase}
        feedback={currentFeedback}
        hasBody={hasBody}
        repCounted={repFlash}
        lastScore={lastRepScore?.total ?? null}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Feather name="chevron-left" size={22} color={D.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{label}</Text>
        <View style={s.phasePill}>
          <View style={[s.phaseDot, { backgroundColor: phaseColor }]} />
          <Text style={s.phaseText}>{currentPhase}</Text>
        </View>
      </View>

      {/* ── Stats bar ── */}
      <View style={s.statsBar}>
        <View style={s.statCol}>
          <MaterialCommunityIcons name="dumbbell" size={14} color={D.primary} />
          <Text style={s.statValue}>{label}</Text>
        </View>
        <View style={s.statSep} />
        <View style={s.statCol}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={D.primary} />
          <Text style={s.statValue}>{mm}:{ss}</Text>
        </View>
        <View style={s.statSep} />
        <View style={s.statCol}>
          <MaterialCommunityIcons name="fire" size={14} color={D.primary} />
          <Text style={s.statValue}>{calories} kcal</Text>
        </View>
      </View>

      {/* ── Rep counter circle ── */}
      <View style={[s.repRing, repFlash && s.repRingFlash]}>
        <View style={s.repInner}>
          <Text style={s.repNum}>{validRepCount}</Text>
          <Text style={s.repLabel}>REPS</Text>
          {lastRepScore != null && (
            <View style={[s.scorePill, { borderColor: qualityColor }]}>
              <Text style={[s.scoreText, { color: qualityColor }]}>{lastRepScore.total}/100</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Feedback card ── */}
      <View style={s.feedbackCard}>
        <View style={s.feedbackRow}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={D.primary} />
          <Text style={s.feedbackTitle}>{motivation}</Text>
        </View>
        {!hasBody && (
          <Text style={s.feedbackSub}>Position yourself so the camera can see you</Text>
        )}
      </View>

      {/* ── Controls ── */}
      <View style={s.controls}>
        <TouchableOpacity style={s.ctrlBtn} onPress={flipCamera} activeOpacity={0.8}>
          <MaterialCommunityIcons name="camera-flip-outline" size={24} color={D.text} />
          <Text style={s.ctrlLabel}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.finishBtn} onPress={handleStop} activeOpacity={0.8}>
          <Text style={s.finishText}>FINISH SET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.ctrlBtn}
          onPress={() => { prevRepCount.current = 0; }}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={24} color={D.text} />
          <Text style={s.ctrlLabel}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── Goal progress bar ── */}
      <View style={s.goalBar}>
        <View style={s.goalRow}>
          <View style={s.goalLabelRow}>
            <MaterialCommunityIcons name="flag-checkered" size={14} color={D.text} />
            <Text style={s.goalLabel}>  Goal: {GOAL_REPS} Reps</Text>
          </View>
          <Text style={s.goalCount}>{Math.min(validRepCount, GOAL_REPS)} / {GOAL_REPS}</Text>
        </View>
        <View style={s.goalTrack}>
          <View style={[s.goalFill, { width: progress }]} />
        </View>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // ── Header ──
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, paddingBottom: SP.sm, paddingHorizontal: SP.lg,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  // ── Phase pill (inline in header) ──
  phasePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 8,
    height: 40,
  },
  phaseDot:  { width: 8, height: 8, borderRadius: 4 },
  phaseText: { color: D.text, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // ── Stats bar ──
  statsBar: {
    position: 'absolute', top: 62, left: SP.lg, right: SP.lg,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: R.pill, paddingVertical: 9, paddingHorizontal: SP.lg,
  },
  statCol:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statSep:   { width: 1, height: 14, backgroundColor: D.border },
  statValue: { fontSize: 12, fontWeight: '700', color: D.text },

  // ── Rep counter ──
  repRing: {
    position: 'absolute', bottom: 230, right: SP.xl,
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: D.primary,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  repRingFlash: { borderColor: D.accent, backgroundColor: D.primaryLight },
  repInner:  { alignItems: 'center' },
  repNum:    { fontSize: 40, fontWeight: '900', color: D.primary, lineHeight: 44 },
  repLabel:  { fontSize: 11, fontWeight: '800', color: D.textMuted, letterSpacing: 2 },
  scorePill: { borderRadius: R.pill, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 2, marginTop: 4 },
  scoreText: { fontSize: 11, fontWeight: '700' },

  // ── Feedback card ──
  feedbackCard: {
    position: 'absolute', bottom: 148, left: SP.xl, right: SP.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: R.card, paddingVertical: SP.md, paddingHorizontal: SP.base,
    alignItems: 'center',
  },
  feedbackRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackTitle: { fontSize: 14, fontWeight: '700', color: D.text, textAlign: 'center', flexShrink: 1 },
  feedbackSub:   { fontSize: 12, color: D.textMuted, marginTop: 4, textAlign: 'center' },

  // ── Controls ──
  controls: {
    position: 'absolute', bottom: 76, left: SP.xl, right: SP.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ctrlBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  ctrlLabel: { fontSize: 9, fontWeight: '700', color: D.textMuted, letterSpacing: 0.5 },
  finishBtn: {
    flex: 1, marginHorizontal: SP.md, height: 56,
    backgroundColor: D.primary, borderRadius: R.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  finishText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  // ── Goal bar ──
  goalBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: SP.xl, paddingTop: SP.sm, paddingBottom: SP.base,
  },
  goalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  goalLabel:    { fontSize: 12, fontWeight: '700', color: D.text },
  goalCount: { fontSize: 12, fontWeight: '800', color: D.primary },
  goalTrack: { height: 6, backgroundColor: D.border, borderRadius: 3, overflow: 'hidden' },
  goalFill:  { height: 6, backgroundColor: D.primary, borderRadius: 3 },
});
