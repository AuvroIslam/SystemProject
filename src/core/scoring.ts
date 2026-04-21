import { RepScore, RepQuality, ExerciseConfig } from '../types/pose';
import { SCORE_WEIGHTS, SCORE_THRESHOLDS } from '../utils/constants';

// ─── Public API ─────────────────────────────────────────────────────────────

export interface RepMetrics {
  minAngle: number;          // deepest primary angle reached
  maxAngle: number;          // highest primary angle reached
  bodyLineAngles: number[];  // body-line angle per frame during the rep
  angleReadings: number[];   // primary angle per frame during the rep
  durationMs: number;
  config: ExerciseConfig;
}

/**
 * Score a single rep on four dimensions and return the weighted total.
 *
 * total = depth×0.4 + form×0.3 + stability×0.2 + tempo×0.1
 */
export function scoreRep(m: RepMetrics): RepScore {
  const depth = scoreDepth(m);
  const form = scoreForm(m);
  const stability = scoreStability(m);
  const tempo = scoreTempo(m);

  const total = Math.round(
    depth * SCORE_WEIGHTS.depth +
      form * SCORE_WEIGHTS.form +
      stability * SCORE_WEIGHTS.stability +
      tempo * SCORE_WEIGHTS.tempo,
  );

  return {
    total: clamp(total, 0, 100),
    depth: Math.round(depth),
    form: Math.round(form),
    stability: Math.round(stability),
    tempo: Math.round(tempo),
  };
}

export function getRepQuality(totalScore: number): RepQuality {
  if (totalScore < SCORE_THRESHOLDS.invalid) return 'invalid';
  if (totalScore < SCORE_THRESHOLDS.poor) return 'poor';
  if (totalScore < SCORE_THRESHOLDS.good) return 'good';
  return 'excellent';
}

export function shouldCountRep(totalScore: number): boolean {
  return totalScore >= SCORE_THRESHOLDS.invalid;
}

// ─── Depth (40 %) ───────────────────────────────────────────────────────────
// How close to full range of motion.
// Best case: minAngle reaches idealMinAngle → 100
// Crossing the downThreshold but not reaching ideal → 50–100
// Not crossing the downThreshold → < 50

function scoreDepth(m: RepMetrics): number {
  const { minAngle, config } = m;
  const idealOvershoot = config.downAngleThreshold - config.idealMinAngle;
  if (idealOvershoot <= 0) {
    return minAngle <= config.downAngleThreshold ? 100 : 50;
  }
  const overshoot = config.downAngleThreshold - minAngle;
  const ratio = overshoot / idealOvershoot;
  return clamp(50 + ratio * 50, 0, 100);
}

// ─── Form (30 %) ────────────────────────────────────────────────────────────
// Body-line angle deviation from 180° (straight body).
// 0° deviation → 100,   30°+ deviation → 0

function scoreForm(m: RepMetrics): number {
  if (m.bodyLineAngles.length === 0) return 70; // no data = reasonable default
  const deviations = m.bodyLineAngles.map((a) => Math.abs(180 - a));
  const avg = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  return clamp(100 - (avg / 30) * 100, 0, 100);
}

// ─── Stability (20 %) ──────────────────────────────────────────────────────
// Smoothness of movement — variance of consecutive angle differences.
// Jerky motion = high variance = low score.

function scoreStability(m: RepMetrics): number {
  const { angleReadings } = m;
  if (angleReadings.length < 3) return 70;

  const diffs: number[] = [];
  for (let i = 1; i < angleReadings.length; i++) {
    diffs.push(Math.abs(angleReadings[i] - angleReadings[i - 1]));
  }
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance =
    diffs.reduce((sum, d) => sum + (d - mean) ** 2, 0) / diffs.length;

  return clamp(100 - variance * 2, 0, 100);
}

// ─── Tempo (10 %) ───────────────────────────────────────────────────────────
// In-range duration → 100.  Too fast / too slow → ↓

function scoreTempo(m: RepMetrics): number {
  const { durationMs, config } = m;
  const [idealMin, idealMax] = config.idealRepDurationMs;

  if (durationMs >= idealMin && durationMs <= idealMax) return 100;
  if (durationMs < idealMin) return clamp((durationMs / idealMin) * 100, 0, 100);
  return clamp((idealMax / durationMs) * 100, 0, 100);
}

// ─── Utility ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
