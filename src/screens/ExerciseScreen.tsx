import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PoseLandmarks } from '../types/pose';
import { CameraView } from '../components/CameraView';
import { ExerciseOverlay } from '../components/ExerciseOverlay';
import { FormGlow } from '../components/FormGlow';
import { useExerciseTracker } from '../hooks/useExerciseTracker';
import { useExerciseStore } from '../store/exerciseStore';
import { D, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercise'>;

const EXERCISE_LABELS: Record<string, string> = {
  pushup: 'Push-ups',
  situp:  'Sit-ups',
  squat:  'Squats',
};

export function ExerciseScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const { processLandmarks, finishSet } = useExerciseTracker(exerciseType);

  const [hasBody, setHasBody] = useState(false);
  const [repFlash, setRepFlash] = useState(false);
  const prevRepCount = useRef(0);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { repCount, validRepCount, currentPhase, currentFeedback, lastRepScore, lastRepCounted, isActive } =
    useExerciseStore();

  useEffect(() => {
    if (validRepCount > prevRepCount.current) {
      prevRepCount.current = validRepCount;
      setRepFlash(true);
      flashTimeout.current = setTimeout(() => setRepFlash(false), 650);
    }
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, [validRepCount]);

  const handlePose = useCallback(
    (lm: PoseLandmarks) => { processLandmarks(lm); setHasBody(true); },
    [processLandmarks],
  );

  const handleStop = useCallback(() => {
    finishSet();
    navigation.replace('Summary');
  }, [finishSet, navigation]);

  const qualityColor =
    lastRepScore?.total == null ? D.textLight :
    lastRepScore.total >= 80    ? D.accent    :
    lastRepScore.total >= 60    ? D.warning   : D.danger;

  return (
    <View style={s.container}>
      <CameraView onPoseDetected={handlePose} isActive={isActive} />
      <FormGlow phase={currentPhase} feedback={currentFeedback} hasBody={hasBody} repCounted={repFlash} lastScore={lastRepScore?.total ?? null} />
      <ExerciseOverlay
        exerciseType={exerciseType}
        repCount={repCount}
        validRepCount={validRepCount}
        currentPhase={currentPhase}
        feedback={currentFeedback}
        lastRepScore={lastRepScore}
        lastRepCounted={lastRepCounted}
      />

      {/* Top pill: exercise label */}
      <View style={s.topPill}>
        <Text style={s.topPillText}>{EXERCISE_LABELS[exerciseType] ?? exerciseType}</Text>
      </View>

      {/* Rep counter card */}
      <View style={[s.repCard, repFlash && s.repCardFlash]}>
        <Text style={s.repNum}>{validRepCount}</Text>
        <Text style={s.repLabel}>VALID REPS</Text>
        {lastRepScore != null && (
          <View style={[s.scorePill, { backgroundColor: qualityColor + '30', borderColor: qualityColor }]}>
            <Text style={[s.scoreText, { color: qualityColor }]}>
              {lastRepScore.total}/100
            </Text>
          </View>
        )}
      </View>

      {/* Phase indicator */}
      <View style={s.phasePill}>
        <View style={[s.phaseDot, { backgroundColor: currentPhase === 'DOWN' ? D.danger : currentPhase === 'UP' ? D.accent : D.primaryMuted }]} />
        <Text style={s.phaseText}>{currentPhase}</Text>
      </View>

      {/* Feedback */}
      {currentFeedback.length > 0 && (
        <View style={s.feedbackCard}>
          <Text style={s.feedbackText}>{currentFeedback[0]}</Text>
        </View>
      )}

      {/* Stop button */}
      <TouchableOpacity style={s.stopBtn} onPress={handleStop} activeOpacity={0.75}>
        <Text style={s.stopText}>FINISH SET</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topPill: {
    position: 'absolute', top: 56, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  topPillText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  repCard: {
    position: 'absolute', bottom: 130, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: R.cardLg, paddingHorizontal: 40, paddingVertical: 20,
    alignItems: 'center',
    ...SH.card,
  },
  repCardFlash: { backgroundColor: D.primaryLight },
  repNum:   { fontSize: 64, fontWeight: '900', color: D.primary },
  repLabel: { fontSize: 11, fontWeight: '800', color: D.textMuted, letterSpacing: 2, marginTop: 2 },
  scorePill:{ borderRadius: R.pill, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  scoreText:{ fontSize: 13, fontWeight: '700' },

  phasePill: {
    position: 'absolute', top: 56, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 7,
  },
  phaseDot:  { width: 8, height: 8, borderRadius: 4 },
  phaseText: { color: D.text, fontSize: 12, fontWeight: '700' },

  feedbackCard: {
    position: 'absolute', bottom: 240, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: R.md, padding: 14, alignItems: 'center',
  },
  feedbackText: { color: D.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },

  stopBtn: {
    position: 'absolute', bottom: 50, alignSelf: 'center',
    backgroundColor: D.primary,
    borderRadius: R.pill, paddingHorizontal: 44, paddingVertical: 16,
    ...SH.button,
  },
  stopText: { color: D.onPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
