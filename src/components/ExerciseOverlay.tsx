import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ExerciseType, RepScore } from '../types/pose';
import { FeedbackBanner } from './FeedbackBanner';
import { PHASE_LABELS } from '../utils/constants';
import { C } from '../theme/atelier';

interface Props {
  exerciseType: ExerciseType;
  repCount: number;
  validRepCount: number;
  currentPhase: string;
  feedback: string[];
  lastRepScore: RepScore | null;
  lastRepCounted: boolean;
}

export function ExerciseOverlay({
  exerciseType,
  repCount,
  validRepCount,
  currentPhase,
  feedback,
  lastRepScore,
  lastRepCounted,
}: Props) {
  const phaseLabel =
    PHASE_LABELS[exerciseType]?.[currentPhase] ?? currentPhase;
  const phaseColor = phaseColorMap[currentPhase] ?? '#FFF';

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* ── Rep counter (top centre) ── */}
      <View style={styles.topCenter}>
        <View style={styles.repBox}>
          <Text style={styles.repLabel}>REPS</Text>
          <Text style={styles.repValue}>{validRepCount}</Text>
          {repCount !== validRepCount && (
            <Text style={styles.repTotal}>({repCount} total)</Text>
          )}
        </View>
      </View>

      {/* ── Phase indicator (top right) ── */}
      <View style={styles.phaseBox}>
        <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
        <Text style={[styles.phaseText, { color: phaseColor }]}>
          {phaseLabel}
        </Text>
      </View>

      {/* ── Last rep score (middle right) ── */}
      {lastRepScore && (
        <View style={styles.scoreBox}>
          <Text
            style={[
              styles.scoreValue,
              { color: scoreColor(lastRepScore.total) },
            ]}>
            {lastRepScore.total}
          </Text>
          <Text style={styles.scoreLabel}>
            {lastRepCounted ? 'SCORE' : 'NOT COUNTED'}
          </Text>
        </View>
      )}

      {/* ── Coaching feedback (bottom) ── */}
      <View style={styles.bottom}>
        <FeedbackBanner messages={feedback} />
      </View>
    </View>
  );
}

// ── helpers ──

const phaseColorMap: Record<string, string> = {
  UP: '#22c55e',
  DOWN: C.secondary,
  IDLE: C.outline,
};

function scoreColor(s: number): string {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return C.secondary;
  if (s >= 40) return '#f97316';
  return C.error;
}

// ── styles ──

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    paddingTop: 60,
  },
  topCenter: { alignItems: 'center' },
  repBox: {
    backgroundColor: 'rgba(21,23,61,0.82)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  repLabel: {
    color: C.outlineVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  repValue: { color: C.onPrimary, fontSize: 48, fontWeight: '800' },
  repTotal: { color: C.outline, fontSize: 12 },

  phaseBox: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21,23,61,0.82)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  phaseDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  phaseText: { fontSize: 14, fontWeight: '700' },

  scoreBox: {
    position: 'absolute',
    right: 20,
    top: '40%',
    alignItems: 'center',
    backgroundColor: 'rgba(21,23,61,0.82)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scoreValue: { fontSize: 36, fontWeight: '800' },
  scoreLabel: {
    color: C.outlineVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  bottom: { position: 'absolute', bottom: 100, left: 20, right: 20 },
});
