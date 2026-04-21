import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, PoseLandmarks } from '../types/pose';
import { CameraView } from '../components/CameraView';
import { ExerciseOverlay } from '../components/ExerciseOverlay';
import { FormGlow } from '../components/FormGlow';
import { useExerciseTracker } from '../hooks/useExerciseTracker';
import { useExerciseStore } from '../store/exerciseStore';
import { C } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercise'>;

export function ExerciseScreen({ route, navigation }: Props) {
  const { exerciseType } = route.params;
  const { processLandmarks, finishSet } = useExerciseTracker(exerciseType);

  const [hasBody, setHasBody] = useState(false);
  const [repFlash, setRepFlash] = useState(false);
  const prevRepCount = useRef(0);

  const {
    repCount,
    validRepCount,
    currentPhase,
    currentFeedback,
    lastRepScore,
    lastRepCounted,
    isActive,
  } = useExerciseStore();

  // Detect new rep for the flash effect
  if (validRepCount > prevRepCount.current) {
    prevRepCount.current = validRepCount;
    // Trigger flash — will be reset after animation
    if (!repFlash) setRepFlash(true);
    setTimeout(() => setRepFlash(false), 650);
  }

  const handlePose = useCallback(
    (lm: PoseLandmarks) => {
      processLandmarks(lm);
      setHasBody(true);
    },
    [processLandmarks],
  );

  const handleStop = useCallback(() => {
    finishSet();
    navigation.replace('Summary');
  }, [finishSet, navigation]);

  return (
    <View style={styles.container}>
      <CameraView onPoseDetected={handlePose} isActive={isActive} />

      <FormGlow
        phase={currentPhase}
        feedback={currentFeedback}
        hasBody={hasBody}
        repCounted={repFlash}
        lastScore={lastRepScore?.total ?? null}
      />

      <ExerciseOverlay
        exerciseType={exerciseType}
        repCount={repCount}
        validRepCount={validRepCount}
        currentPhase={currentPhase}
        feedback={currentFeedback}
        lastRepScore={lastRepScore}
        lastRepCounted={lastRepCounted}
      />

      <View style={styles.stopContainer}>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          activeOpacity={0.7}>
          <Text style={styles.stopText}>STOP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  stopContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  stopButton: {
    backgroundColor: C.error,
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stopText: { color: C.onPrimary, fontSize: 14, fontWeight: '800' },
});
