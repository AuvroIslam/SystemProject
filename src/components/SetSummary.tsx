import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SetSummary, RepScore } from '../types/pose';
import { C, SHADOW } from '../theme/atelier';

interface Props {
  summary: SetSummary;
  onRepeat: () => void;
  onDone: () => void;
}

export function SetSummaryCard({ summary, onRepeat, onDone }: Props) {
  const name = summary.exercise === 'pushup' ? 'Push-ups' : summary.exercise === 'situp' ? 'Sit-ups' : 'Squats';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.label}>SET COMPLETE</Text>
      <Text style={s.headline}>{name}</Text>

      {/* ── Score ring ── */}
      <View style={s.scoreBlock}>
        <View style={s.scoreCircle}>
          <Text style={s.scoreValue}>{summary.averageScore}</Text>
          <Text style={s.scoreHint}>avg score</Text>
        </View>
      </View>

      {/* ── Main stats ── */}
      <View style={s.statsRow}>
        <Stat value={summary.validReps} label="VALID REPS" />
        <Stat
          value={summary.averageScore}
          label="AVG SCORE"
          color={scoreColor(summary.averageScore)}
        />
        <Stat value={summary.totalReps} label="TOTAL" />
      </View>

      {/* ── Score breakdown bars ── */}
      {summary.scores.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>BREAKDOWN</Text>
          <Bar label="Depth" value={fieldAvg(summary.scores, 'depth')} />
          <Bar label="Form" value={fieldAvg(summary.scores, 'form')} />
          <Bar label="Stability" value={fieldAvg(summary.scores, 'stability')} />
          <Bar label="Tempo" value={fieldAvg(summary.scores, 'tempo')} />
        </View>
      )}

      {/* ── Weakest area ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>FOCUS AREA</Text>
        <View style={s.weakBadge}>
          <Text style={s.weakText}>{summary.weakestArea.toUpperCase()}</Text>
        </View>
      </View>

      {/* ── Tips ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>KEY FEEDBACK</Text>
        {summary.suggestions.map((t, i) => (
          <View key={i} style={s.tipRow}>
            <View style={s.tipDot} />
            <Text style={s.tipText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={s.duration}>Duration: {fmt(summary.durationMs)}</Text>

      {/* ── Actions ── */}
      <TouchableOpacity style={s.btnPrimary} onPress={onRepeat} activeOpacity={0.8}>
        <Text style={s.btnPrimaryText}>DO ANOTHER SET</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary} onPress={onDone} activeOpacity={0.8}>
        <Text style={s.btnSecondaryText}>FINISH</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── small components ──

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statVal, color ? { color } : undefined]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel}>{label}</Text>
      <View style={s.barTrack}>
        <View
          style={[
            s.barFill,
            { width: `${value}%`, backgroundColor: scoreColor(value) },
          ]}
        />
      </View>
      <Text style={s.barVal}>{Math.round(value)}</Text>
    </View>
  );
}

// ── helpers ──

function fieldAvg(scores: RepScore[], key: keyof RepScore): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, sc) => sum + sc[key], 0) / scores.length;
}

function scoreColor(v: number): string {
  if (v >= 80) return '#22c55e';
  if (v >= 60) return C.secondary;
  if (v >= 40) return '#f97316';
  return C.error;
}

function fmt(ms: number): string {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}

// ── styles ──

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  content: { padding: 24, paddingTop: 60, paddingBottom: 72 },

  label: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  headline: {
    color: C.primaryContainer,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },

  /* Score ring */
  scoreBlock: { alignItems: 'center', marginBottom: 24 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: C.surfaceContainerHigh,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: C.primaryContainer,
    fontSize: 36,
    fontWeight: '900',
  },
  scoreHint: { color: C.onSurfaceVariant, fontSize: 11, fontWeight: '600' },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statVal: { color: C.primaryContainer, fontSize: 28, fontWeight: '800' },
  statLabel: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  /* Card */
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
    marginBottom: 12,
  },

  /* Bars */
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { color: C.onSurfaceVariant, width: 70, fontSize: 13 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barVal: {
    color: C.onSurface,
    width: 30,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Weak area */
  weakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  weakText: {
    color: C.onSecondaryContainer,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* Tips */
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.secondary,
    marginTop: 6,
  },
  tipText: { color: C.onSurfaceVariant, fontSize: 14, lineHeight: 20, flex: 1 },

  duration: {
    color: C.outline,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },

  /* Buttons */
  btnPrimary: {
    backgroundColor: C.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.button,
  },
  btnPrimaryText: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  btnSecondary: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  btnSecondaryText: {
    color: C.onSurface,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
