import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PoseLandmarks } from '../types/pose';
import { CameraView } from '../components/CameraView';
import { FormGlow } from '../components/FormGlow';
import { useExerciseTracker } from '../hooks/useExerciseTracker';
import { useExerciseStore } from '../store/exerciseStore';
import { useFocusStore } from '../store/focusStore';
import { useAuthStore } from '../store/authStore';
import { useXPStore } from '../store/xpStore';
import { D, R, SH, SP } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'PunishExercise'>;

export function PunishExerciseScreen({ navigation, route }: Props) {
  const { targetReps, exerciseType, setsToPayOff } = route.params;
  const { payDebt } = useFocusStore();
  const { processLandmarks } = useExerciseTracker(exerciseType);
  const user = useAuthStore((s) => s.user);
  const { addXP } = useXPStore();

  const [hasBody, setHasBody] = useState(false);
  const [repFlash, setRepFlash] = useState(false);
  const completionFired = useRef(false);
  const prevRepCount = useRef(0);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { validRepCount, currentPhase, currentFeedback, lastRepScore } = useExerciseStore();

  useEffect(() => {
    if (validRepCount >= targetReps && validRepCount > 0 && !completionFired.current) {
      completionFired.current = true;
      const t = setTimeout(() => {
        payDebt(setsToPayOff);
        if (user) addXP(user.uid, setsToPayOff * 10);
        navigation.replace('Home');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [validRepCount, targetReps, setsToPayOff, payDebt, user, addXP, navigation]);

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

  const EXERCISE_LABELS: Record<string, string> = { pushup: 'PUSH-UPS', situp: 'SIT-UPS', squat: 'SQUATS' };
  const pct = Math.min((validRepCount / targetReps) * 100, 100);

  return (
    <View style={s.container}>
      <CameraView onPoseDetected={handlePose} isActive={true} />
      <FormGlow phase={currentPhase} feedback={currentFeedback} hasBody={hasBody} repCounted={repFlash} lastScore={lastRepScore?.total ?? null} />

      {/* Debt banner */}
      <View style={s.banner}>
        <View style={s.debtBadge}>
          <Text style={s.debtBadgeText}>DEBT</Text>
        </View>
        <Text style={s.bannerTitle}>{setsToPayOff} set{setsToPayOff !== 1 ? 's' : ''} to clear</Text>
      </View>

      {/* Rep counter */}
      <View style={[s.repCard, repFlash && s.repCardFlash]}>
        <Text style={s.repCount}>
          {validRepCount}<Text style={s.repSlash}> / {targetReps}</Text>
        </Text>
        <Text style={s.repLabel}>{EXERCISE_LABELS[exerciseType] ?? exerciseType}</Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* Phase */}
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  banner: {
    position: 'absolute', top: 50, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: R.pill, paddingHorizontal: SP.xl, paddingVertical: SP.md,
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    ...SH.card,
  },
  debtBadge:    { backgroundColor: D.danger, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  debtBadgeText:{ color: D.onDanger, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle:  { color: D.text, fontSize: 14, fontWeight: '700' },

  repCard: {
    position: 'absolute', top: '38%', alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: R.cardLg, paddingHorizontal: 40, paddingVertical: SP.xl,
    alignItems: 'center', ...SH.card,
  },
  repCardFlash: { backgroundColor: D.primaryLight },
  repCount: { color: D.text, fontSize: 56, fontWeight: '900' },
  repSlash: { color: D.textMuted, fontSize: 30, fontWeight: '600' },
  repLabel: { color: D.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  progressTrack:{ width: 180, height: 6, backgroundColor: D.border, borderRadius: 3, marginTop: SP.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: D.primary, borderRadius: 3 },

  phasePill: {
    position: 'absolute', top: 56, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: R.pill,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  phaseDot:  { width: 8, height: 8, borderRadius: 4 },
  phaseText: { color: D.text, fontSize: 12, fontWeight: '700' },

  feedbackCard: {
    position: 'absolute', bottom: 60, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: R.md, padding: SP.base, alignItems: 'center',
  },
  feedbackText: { color: D.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
