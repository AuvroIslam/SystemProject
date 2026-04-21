import { PoseLandmarks, ViewAngle, LandmarkIndex } from '../../types/pose';
import { getLandmark } from '../angles';
import { FRONT_VIEW_SHOULDER_WIDTH } from '../../utils/constants';

/**
 * Detect whether the camera sees the user from the front or the side.
 *
 * Strategy:
 *   1.  Measure the horizontal distance between left and right shoulders
 *       in the normalised [0–1] frame.
 *   2.  Wide separation  →  front view.
 *   3.  Narrow / overlapping  →  side view.
 *   4.  For side view, compare average visibility of left-side vs
 *       right-side landmarks to decide left_side / right_side.
 *
 * This is called every frame but the RepCounter applies majority-vote
 * smoothing over ~15 frames so short glitches are absorbed.
 */
export function detectViewAngle(landmarks: PoseLandmarks): ViewAngle {
  const ls = getLandmark(landmarks, LandmarkIndex.LEFT_SHOULDER);
  const rs = getLandmark(landmarks, LandmarkIndex.RIGHT_SHOULDER);

  if (!ls && !rs) return 'unknown';

  // Only one shoulder visible → definitely a side view
  if (ls && !rs) return 'left_side';
  if (!ls && rs) return 'right_side';

  // Both visible — check horizontal spread
  const shoulderWidth = Math.abs(ls!.x - rs!.x);

  if (shoulderWidth > FRONT_VIEW_SHOULDER_WIDTH) {
    return 'front';
  }

  // Narrow shoulders → side view.  Which side?
  const lHip = getLandmark(landmarks, LandmarkIndex.LEFT_HIP);
  const rHip = getLandmark(landmarks, LandmarkIndex.RIGHT_HIP);

  const leftVis =
    (ls!.visibility + (lHip?.visibility ?? 0)) / 2;
  const rightVis =
    (rs!.visibility + (rHip?.visibility ?? 0)) / 2;

  return leftVis > rightVis ? 'left_side' : 'right_side';
}
