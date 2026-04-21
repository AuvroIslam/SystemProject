import { Landmark, PoseLandmarks, LandmarkIndex } from '../types/pose';
import { MIN_LANDMARK_VISIBILITY } from '../utils/constants';

/**
 * Calculate the angle (in degrees) at point B, formed by rays BA and BC.
 * Uses 2D (x, y) for reliability — depth (z) is noisy on mobile.
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const BAx = a.x - b.x;
  const BAy = a.y - b.y;
  const BCx = c.x - b.x;
  const BCy = c.y - b.y;

  const dot = BAx * BCx + BAy * BCy;
  const magBA = Math.sqrt(BAx * BAx + BAy * BAy);
  const magBC = Math.sqrt(BCx * BCx + BCy * BCy);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Safely get a landmark, returning null if missing or below visibility threshold.
 */
export function getLandmark(
  landmarks: PoseLandmarks,
  index: LandmarkIndex,
): Landmark | null {
  const lm = landmarks[index];
  if (!lm || lm.visibility < MIN_LANDMARK_VISIBILITY) return null;
  return lm;
}

/**
 * Midpoint of two landmarks.
 */
export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

// ─── Joint-Angle Helpers ────────────────────────────────────────────────────

/** Elbow angle: shoulder → elbow → wrist */
export function getElbowAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right',
): number | null {
  const ids =
    side === 'left'
      ? [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST]
      : [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST];

  const [a, b, c] = ids.map((i) => getLandmark(landmarks, i));
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}

/** Hip angle: shoulder → hip → knee */
export function getHipAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right',
): number | null {
  const ids =
    side === 'left'
      ? [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE]
      : [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE];

  const [a, b, c] = ids.map((i) => getLandmark(landmarks, i));
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}

/** Body-line angle: shoulder → hip → ankle  (180° = perfectly straight) */
export function getBodyLineAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right',
): number | null {
  const ids =
    side === 'left'
      ? [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_ANKLE]
      : [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_ANKLE];

  const [a, b, c] = ids.map((i) => getLandmark(landmarks, i));
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}

/** Knee angle: hip → knee → ankle */
export function getKneeAngle(
  landmarks: PoseLandmarks,
  side: 'left' | 'right',
): number | null {
  const ids =
    side === 'left'
      ? [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE]
      : [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE];

  const [a, b, c] = ids.map((i) => getLandmark(landmarks, i));
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}
