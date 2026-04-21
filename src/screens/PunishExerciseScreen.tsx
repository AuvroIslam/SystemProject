import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PoseLandmarks } from '../types/pose';
import { CameraView } from '../components/CameraView';
import { FormGlow } from '../components/FormGlow';
import { useExerciseTracker } from '../hooks/useExerciseTracker';
import { useExerciseStore } from '../store/exerciseStore';
import { useFocusStore } from '../store/focusStore';
import { C } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'PunishExercise'>;

export function PunishExerciseScreen({ navigation, route }: Props) {
  const { targetReps, exerciseType, setsToPayOff } = route.params;
  const { payDebt } = useFocusStore();
  const { processLandmarks } = useExerciseTracker(exerciseType);

  const [hasBody, setHasBody] = useState(false);
  const [repFlash, setRepFlash] = useState(false);
  const prevRepCount = useRef(0);

  const {
    validRepCount,
    currentPhase,
    currentFeedback,
    lastRepScore,
  } = useExerciseStore();

  // Check if all reps are complete
  if (validRepCount >= targetReps && validRepCount > 0) {
    if (prevRepCount.current < targetReps) {
      prevRepCount.current = validRepCount;
      setTimeout(() => {
        payDebt(setsToPayOff);
        navigation.replace('Home');
      }, 800);
    }
  }

  // Flash on rep
  if (validRepCount > prevRepCount.current) {
    prevRepCount.current = validRepCount;
    if (!repFlash) setRepFlash(true);
    setTimeout(() => setRepFlash(false), 650);
  }

  const handlePose = useCallback(
    (lm: PoseLandmarks) => {
      processLandmarks(lm);
      setHasBody(true);
    },
    [processLandmarks],
  );

  const exerciseLabel =
    exerciseType === 'pushup'
      ? 'PUSH-UPS'
      : exerciseType === 'situp'
        ? 'SIT-UPS'
        : 'SQUATS';

  const pct = Math.min((validRepCount / targetReps) * 100, 100);

  return (
    <View style={s.container}>
      <CameraView onPoseDetected={handlePose} isActive={true} />

      <FormGlow
        phase={currentPhase}
        feedback={currentFeedback}
        hasBody={hasBody}
        repCounted={repFlash}
        lastScore={lastRepScore?.total ?? null}
      />

      {/* Top banner */}
      <View style={s.banner}>
        <View style={s.bannerBadge}>
          <Text style={s.bannerBadgeText}>DEBT</Text>
        </View>
        <Text style={s.bannerTitle}>
          {setsToPayOff} set{setsToPayOff !== 1 ? 's' : ''} to clear
        </Text>
      </View>

      {/* Rep counter (centre) */}
      <View style={s.repCard}>
        <Text style={s.repCount}>
          {validRepCount}<Text style={s.repSlash}> / {targetReps}</Text>
        </Text>
        <Text style={s.repLabel}>{exerciseLabel}</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* Phase pill */}
      <View style={s.phasePill}>
        <Text style={s.phaseText}>{currentPhase}</Text>
      </View>

      {/* Feedback */}
      {currentFeedback.length > 0 && (
        <View style={s.feedbackBar}>
          <Text style={s.feedbackText}>{currentFeedback[0]}</Text>
        </View>
      )}
    </View>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  /* Banner */
  banner: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: C.primaryContainer,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  bannerBadge: {
    backgroundColor: C.secondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannerBadgeText: {
    color: C.onPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Rep counter */
  repCard: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(21,23,61,0.85)',
    borderRadius: 20,
    paddingHorizontal: 36,
    paddingVertical: 22,
  },
  repCount: {
    color: C.onPrimary,
    fontSize: 48,
    fontWeight: '900',
  },
  repSlash: {
    color: C.onPrimaryContainer,
    fontSize: 28,
    fontWeight: '600',
  },
  repLabel: {
    color: C.secondaryContainer,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  progressBar: {
    width: 180,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.secondaryContainer,
    borderRadius: 2,
  },

  /* Phase pill */
  phasePill: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(21,23,61,0.7)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  phaseText: { color: C.onPrimary, fontSize: 13, fontWeight: '700' },

  /* Feedback */
  feedbackBar: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: C.secondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  feedbackText: { color: C.onPrimary, fontSize: 14, fontWeight: '600' },
});
