import { PoseLandmarks, ViewAngle, ExerciseConfig } from '../../types/pose';
import { getElbowAngle, getBodyLineAngle } from '../angles';
import { PUSHUP_CONFIG } from '../../utils/constants';

export interface PushupFrameData {
  primaryAngle: number | null;   // elbow angle
  bodyLineAngle: number | null;  // shoulder-hip-ankle straightness
}

/**
 * Extract push-up angles from landmarks, adapting to the detected camera angle.
 *
 * Front view  → average left + right elbow
 * Side view   → use the visible side only
 */
export function getPushupAngles(
  landmarks: PoseLandmarks,
  viewAngle: ViewAngle,
): PushupFrameData {
  let primaryAngle: number | null = null;
  let bodyLineAngle: number | null = null;

  switch (viewAngle) {
    case 'front': {
      const le = getElbowAngle(landmarks, 'left');
      const re = getElbowAngle(landmarks, 'right');
      primaryAngle =
        le !== null && re !== null ? (le + re) / 2 : (le ?? re);

      const ll = getBodyLineAngle(landmarks, 'left');
      const rl = getBodyLineAngle(landmarks, 'right');
      bodyLineAngle =
        ll !== null && rl !== null ? (ll + rl) / 2 : (ll ?? rl);
      break;
    }
    case 'left_side': {
      primaryAngle = getElbowAngle(landmarks, 'left');
      bodyLineAngle = getBodyLineAngle(landmarks, 'left');
      break;
    }
    case 'right_side': {
      primaryAngle = getElbowAngle(landmarks, 'right');
      bodyLineAngle = getBodyLineAngle(landmarks, 'right');
      break;
    }
    default: {
      primaryAngle =
        getElbowAngle(landmarks, 'left') ??
        getElbowAngle(landmarks, 'right');
      bodyLineAngle =
        getBodyLineAngle(landmarks, 'left') ??
        getBodyLineAngle(landmarks, 'right');
    }
  }

  return { primaryAngle, bodyLineAngle };
}

export function getPushupConfig(): ExerciseConfig {
  return { ...PUSHUP_CONFIG };
}

/**
 * Real-time coaching cues for push-ups.
 */
export function getPushupFeedback(
  primaryAngle: number | null,
  bodyLineAngle: number | null,
  phase: string,
): string[] {
  const feedback: string[] = [];

  if (bodyLineAngle !== null) {
    const deviation = Math.abs(180 - bodyLineAngle);
    if (deviation > 20) {
      feedback.push(
        bodyLineAngle < 160
          ? 'Keep your hips up — body should be straight'
          : "Lower your hips — don't pike up",
      );
    }
  }

  if (phase === 'DOWN' && primaryAngle !== null && primaryAngle > 110) {
    feedback.push('Go lower for full range of motion');
  }

  return feedback;
}
