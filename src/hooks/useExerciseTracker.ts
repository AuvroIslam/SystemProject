import { useRef, useCallback, useEffect } from 'react';
import { ExerciseType, PoseLandmarks } from '../types/pose';
import { RepCounter, FrameResult } from '../core/repCounter';
import { useExerciseStore } from '../store/exerciseStore';

/**
 * Main hook — wires pose detection output into the RepCounter and
 * pushes updates to the Zustand store so the UI re-renders.
 *
 * Usage:
 *   const { processLandmarks, finishSet } = useExerciseTracker('pushup');
 *   // call processLandmarks(landmarks) on every frame
 *   // call finishSet() when the user taps Stop
 */
export function useExerciseTracker(exerciseType: ExerciseType) {
  const counterRef = useRef<RepCounter>(new RepCounter(exerciseType));
  const store = useExerciseStore();

  useEffect(() => {
    counterRef.current = new RepCounter(exerciseType);
    store.startExercise(exerciseType);
    return () => {
      counterRef.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseType]);

  /** Feed one frame of landmarks into the pipeline. */
  const processLandmarks = useCallback(
    (landmarks: PoseLandmarks): FrameResult => {
      const result = counterRef.current.processFrame(landmarks);

      store.updateFrame({
        repCount: result.repCount,
        validRepCount: result.validRepCount,
        currentPhase: result.currentPhase,
        feedback: result.feedback,
        lastRepScore: result.lastRepScore,
        lastRepCounted: result.lastRepCounted,
      });

      return result;
    },
    [store],
  );

  /** End the set and return the summary. */
  const finishSet = useCallback(() => {
    const summary = counterRef.current.getSetSummary();
    store.finishSet(summary);
    return summary;
  }, [store]);

  /** Reset everything for a new set. */
  const resetTracker = useCallback(() => {
    counterRef.current.reset();
    store.reset();
  }, [store]);

  return { processLandmarks, finishSet, resetTracker };
}
