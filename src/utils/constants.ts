import { ExerciseConfig } from '../types/pose';

// ─── Push-up Configuration ──────────────────────────────────────────────────
// Primary angle: elbow (shoulder-elbow-wrist)
// UP ≈ 170° (arms straight), DOWN ≈ 90° (arms bent)

export const PUSHUP_CONFIG: ExerciseConfig = {
  type: 'pushup',
  downAngleThreshold: 100,        // below this → DOWN phase
  upAngleThreshold: 155,          // above this → UP phase
  idealMinAngle: 90,              // ideal bottom of push-up
  idealMaxAngle: 170,             // ideal top of push-up
  idealRepDurationMs: [1000, 3000],
  minFramesInPhase: 3,            // ~100ms at 30fps
  minRepDurationMs: 500,          // reject anything faster
};

// ─── Sit-up Configuration ───────────────────────────────────────────────────
// Primary angle: hip (shoulder-hip-knee)
// UP ≈ 160° (lying flat), DOWN ≈ 60° (sitting up)

export const SITUP_CONFIG: ExerciseConfig = {
  type: 'situp',
  downAngleThreshold: 80,         // below this → DOWN (sitting up)
  upAngleThreshold: 140,          // above this → UP (lying flat)
  idealMinAngle: 55,              // ideal top of sit-up
  idealMaxAngle: 165,             // ideal lying flat
  idealRepDurationMs: [1500, 4000],
  minFramesInPhase: 3,
  minRepDurationMs: 800,
};

// ─── Squat Configuration ────────────────────────────────────────────────────
// Primary angle: knee (hip-knee-ankle)
// UP ≈ 170° (standing), DOWN ≈ 90° (deep squat)

export const SQUAT_CONFIG: ExerciseConfig = {
  type: 'squat',
  downAngleThreshold: 105,
  upAngleThreshold: 155,
  idealMinAngle: 85,
  idealMaxAngle: 170,
  idealRepDurationMs: [1500, 4000],
  minFramesInPhase: 3,
  minRepDurationMs: 800,
};

// ─── Scoring ────────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  depth: 0.4,
  form: 0.3,
  stability: 0.2,
  tempo: 0.1,
};

export const SCORE_THRESHOLDS = {
  invalid: 40,     // below → not counted
  poor: 60,        // 40–60 → poor
  good: 80,        // 60–80 → good
  excellent: 100,  // 80–100 → excellent
};

// ─── Pose Detection ─────────────────────────────────────────────────────────

/** Minimum landmark visibility to be considered valid */
export const MIN_LANDMARK_VISIBILITY = 0.5;

/** Normalized shoulder width above which we consider it front view */
export const FRONT_VIEW_SHOULDER_WIDTH = 0.12;

// ─── Smoothing ──────────────────────────────────────────────────────────────

/** Maximum angle change per frame before spike rejection (degrees) */
export const ANGLE_SPIKE_THRESHOLD = 35;

/** EMA smoothing factor (lower = more smoothing, more lag) */
export const ANGLE_EMA_ALPHA = 0.4;

// ─── UI ─────────────────────────────────────────────────────────────────────

/** Phase display labels per exercise (maps internal phase to user-facing text) */
export const PHASE_LABELS: Record<string, Record<string, string>> = {
  pushup: { IDLE: 'READY', UP: 'UP', DOWN: 'DOWN' },
  situp:  { IDLE: 'READY', UP: 'READY', DOWN: 'CRUNCH' },
  squat:  { IDLE: 'READY', UP: 'STANDING', DOWN: 'SQUAT' },
};
