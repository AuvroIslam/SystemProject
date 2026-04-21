import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { SetSummaryCard } from '../components/SetSummary';
import { useExerciseStore } from '../store/exerciseStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ navigation }: Props) {
  const { setSummary, exerciseType, reset } = useExerciseStore();

  const handleRepeat = useCallback(() => {
    if (exerciseType) {
      navigation.replace('Exercise', { exerciseType });
    }
  }, [exerciseType, navigation]);

  const handleDone = useCallback(() => {
    reset();
    navigation.popToTop();
  }, [reset, navigation]);

  if (!setSummary) {
    // Shouldn't happen, but guard against it
    handleDone();
    return null;
  }

  return (
    <SetSummaryCard
      summary={setSummary}
      onRepeat={handleRepeat}
      onDone={handleDone}
    />
  );
}
