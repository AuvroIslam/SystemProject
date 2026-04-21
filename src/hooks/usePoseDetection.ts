import { useRef, useCallback } from 'react';
import { PoseLandmarks } from '../types/pose';

/**
 * Manages pose detection state and bridges native frame processor → JS.
 *
 * Integration with react-native-vision-camera:
 *
 *   1.  A native frame-processor plugin (Android: ML Kit, iOS: ML Kit)
 *       runs pose detection on each camera frame.
 *
 *   2.  The plugin returns an array of 33 landmarks to the JS thread
 *       via Worklets' `runOnJS()`.
 *
 *   3.  This hook stores the latest result and makes it available to
 *       the exercise tracker.
 *
 * See ARCHITECTURE.md § "Native Pose Detection Plugin" for the native
 * setup instructions.
 */
export function usePoseDetection() {
  const lastLandmarks = useRef<PoseLandmarks | null>(null);
  const lastTimestamp = useRef<number>(0);

  /** Called from the frame processor (via runOnJS) every camera frame. */
  const onPoseDetected = useCallback((landmarks: PoseLandmarks | null) => {
    lastLandmarks.current = landmarks;
    lastTimestamp.current = Date.now();
  }, []);

  return {
    lastLandmarks,
    lastTimestamp,
    onPoseDetected,
  };
}
