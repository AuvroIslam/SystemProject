import { PoseLandmarks, ViewAngle, ExerciseConfig } from '../../types/pose';
import { getKneeAngle, getHipAngle } from '../angles';
import { SQUAT_CONFIG } from '../../utils/constants';

export interface SquatFrameData {
  primaryAngle: number | null;   // knee angle (hip-knee-ankle)
  bodyLineAngle: number | null;  // hip angle for form (torso upright check)
}

/**
 * Extract squat angles from landmarks.
 *
 * Primary angle is the knee angle (hip→knee→ankle).
 * Form angle is the hip angle (shoulder→hip→knee) — an upright torso
 * keeps this high (~160°+), excessive lean drops it.
 */
export function getSquatAngles(
  landmarks: PoseLandmarks,
  viewAngle: ViewAngle,
): SquatFrameData {
  let primaryAngle: number | null = null;
  let bodyLineAngle: number | null = null;

  switch (viewAngle) {
    case 'left_side': {
      primaryAngle = getKneeAngle(landmarks, 'left');
      bodyLineAngle = getHipAngle(landmarks, 'left');
      break;
    }
    case 'right_side': {
      primaryAngle = getKneeAngle(landmarks, 'right');
      bodyLineAngle = getHipAngle(landmarks, 'right');
      break;
    }
    case 'front': {
      const lk = getKneeAngle(landmarks, 'left');
      const rk = getKneeAngle(landmarks, 'right');
      primaryAngle =
        lk !== null && rk !== null ? (lk + rk) / 2 : (lk ?? rk);

      const lh = getHipAngle(landmarks, 'left');
      const rh = getHipAngle(landmarks, 'right');
      bodyLineAngle =
        lh !== null && rh !== null ? (lh + rh) / 2 : (lh ?? rh);
      break;
    }
    default: {
      primaryAngle =
        getKneeAngle(landmarks, 'left') ??
        getKneeAngle(landmarks, 'right');
      bodyLineAngle =
        getHipAngle(landmarks, 'left') ??
        getHipAngle(landmarks, 'right');
    }
  }

  return { primaryAngle, bodyLineAngle };
}

export function getSquatConfig(): ExerciseConfig {
  return { ...SQUAT_CONFIG };
}

/**
 * Real-time coaching cues for squats.
 */
export function getSquatFeedback(
  primaryAngle: number | null,
  bodyLineAngle: number | null,
  phase: string,
): string[] {
  const feedback: string[] = [];

  if (phase === 'DOWN' && primaryAngle !== null && primaryAngle > 120) {
    feedback.push('Go deeper — aim for parallel or below');
  }

  if (bodyLineAngle !== null && bodyLineAngle < 100) {
    feedback.push('Keep your chest up — avoid leaning too far forward');
  }

  if (phase === 'UP' && primaryAngle !== null && primaryAngle < 160) {
    feedback.push('Stand up fully — lock out at the top');
  }

  return feedback;
}
