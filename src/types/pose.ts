// ─── Pose Landmark Types ─────────────────────────────────────────────────────

export interface Landmark {
  x: number;          // 0–1 normalized horizontal position
  y: number;          // 0–1 normalized vertical position
  z: number;          // relative depth
  visibility: number; // 0–1 confidence score
}

export type PoseLandmarks = Landmark[];

/** Google ML Kit / MediaPipe 33-point pose landmark indices */
export enum LandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  LEFT_MOUTH = 9,
  RIGHT_MOUTH = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
}

// ─── Exercise Types ──────────────────────────────────────────────────────────

export type ExerciseType = 'pushup' | 'situp' | 'squat';
export type ViewAngle = 'front' | 'left_side' | 'right_side' | 'unknown';
export type RepPhase = 'IDLE' | 'UP' | 'DOWN';

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface RepScore {
  total: number;       // 0–100  weighted composite
  depth: number;       // 0–100  range of motion
  form: number;        // 0–100  body alignment
  stability: number;   // 0–100  smoothness
  tempo: number;       // 0–100  speed appropriateness
}

export type RepQuality = 'invalid' | 'poor' | 'good' | 'excellent';

// ─── Rep Result ──────────────────────────────────────────────────────────────

export interface RepResult {
  repNumber: number;
  score: RepScore;
  quality: RepQuality;
  counted: boolean;      // false if score.total < 40
  feedback: string[];
  durationMs: number;
  minAngle: number;      // deepest primary angle in rep
  maxAngle: number;
}

// ─── Set Summary ─────────────────────────────────────────────────────────────

export interface SetSummary {
  exercise: ExerciseType;
  totalReps: number;
  validReps: number;
  averageScore: number;
  scores: RepScore[];
  weakestArea: keyof RepScore;
  suggestions: string[];
  durationMs: number;
}

// ─── Exercise Configuration ──────────────────────────────────────────────────

export interface ExerciseConfig {
  type: ExerciseType;
  // Angle thresholds — primary angle below downAngleThreshold = DOWN phase
  downAngleThreshold: number;
  upAngleThreshold: number;
  // Ideal angles for scoring
  idealMinAngle: number;         // ideal bottom position
  idealMaxAngle: number;         // ideal top position
  idealRepDurationMs: [number, number]; // [min, max] ideal duration
  // Debounce
  minFramesInPhase: number;      // frames required before phase transition
  minRepDurationMs: number;      // minimum duration for valid rep
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Exercise: { exerciseType: ExerciseType };
  Summary: undefined;
  FocusSetup: undefined;
  FocusActive: undefined;
  ViolationWarning: undefined;
  PunishExercise: { targetReps: number; exerciseType: ExerciseType; setsToPayOff: number };
  DebtPay: undefined;
  FocusSummary: undefined;
};
