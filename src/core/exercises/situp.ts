import { PoseLandmarks, ViewAngle, ExerciseConfig } from '../../types/pose';
import { getHipAngle, getKneeAngle } from '../angles';
import { SITUP_CONFIG } from '../../utils/constants';

export interface SitupFrameData {
  primaryAngle: number | null;   // hip angle (shoulder-hip-knee)
  bodyLineAngle: number | null;  // knee angle for form checking
}

/**
 * Extract sit-up angles from landmarks.
 *
 * Side view is strongly preferred — the hip angle (shoulder-hip-knee)
 * is much more reliable from the side.
 * Front view uses averaged left + right hip angles as a fallback.
 */
export function getSitupAngles(
  landmarks: PoseLandmarks,
  viewAngle: ViewAngle,
): SitupFrameData {
  let primaryAngle: number | null = null;
  let bodyLineAngle: number | null = null;

  switch (viewAngle) {
    case 'left_side': {
      primaryAngle = getHipAngle(landmarks, 'left');
      bodyLineAngle = getKneeAngle(landmarks, 'left');
      break;
    }
    case 'right_side': {
      primaryAngle = getHipAngle(landmarks, 'right');
      bodyLineAngle = getKneeAngle(landmarks, 'right');
      break;
    }
    case 'front': {
      const lh = getHipAngle(landmarks, 'left');
      const rh = getHipAngle(landmarks, 'right');
      primaryAngle =
        lh !== null && rh !== null ? (lh + rh) / 2 : (lh ?? rh);

      const lk = getKneeAngle(landmarks, 'left');
      const rk = getKneeAngle(landmarks, 'right');
      bodyLineAngle =
        lk !== null && rk !== null ? (lk + rk) / 2 : (lk ?? rk);
      break;
    }
    default: {
      primaryAngle =
        getHipAngle(landmarks, 'left') ??
        getHipAngle(landmarks, 'right');
      bodyLineAngle =
        getKneeAngle(landmarks, 'left') ??
        getKneeAngle(landmarks, 'right');
    }
  }

  return { primaryAngle, bodyLineAngle };
}

export function getSitupConfig(): ExerciseConfig {
  return { ...SITUP_CONFIG };
}

/**
 * Real-time coaching cues for sit-ups.
 */
export function getSitupFeedback(
  primaryAngle: number | null,
  bodyLineAngle: number | null,
  phase: string,
): string[] {
  const feedback: string[] = [];

  if (phase === 'DOWN' && primaryAngle !== null && primaryAngle > 90) {
    feedback.push('Come up higher — engage your core');
  }

  if (bodyLineAngle !== null && bodyLineAngle > 160) {
    feedback.push('Bend your knees more for proper form');
  }

  return feedback;
}
