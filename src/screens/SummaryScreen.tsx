import React, { useCallback, useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { View } from 'react-native';
import { SetSummaryCard } from '../components/SetSummary';
import { AppBackground } from '../components/ui/AppBackground';
import { useExerciseStore } from '../store/exerciseStore';
import { saveWorkout, incrementDailyReps, incrementDailySession } from '../services/fitnessStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ navigation }: Props) {
  const { setSummary, exerciseType, reset } = useExerciseStore();
  const saved = useRef(false);

  const handleRepeat = useCallback(() => {
    if (exerciseType) {
      navigation.replace('Exercise', { exerciseType });
    }
  }, [exerciseType, navigation]);

  const handleDone = useCallback(() => {
    reset();
    navigation.popToTop();
  }, [reset, navigation]);

  // Save workout and update daily stats once
  useEffect(() => {
    if (!setSummary || !exerciseType || saved.current) return;
    saved.current = true;
    saveWorkout({
      exerciseType,
      reps: setSummary.validReps,
      date: new Date().toISOString(),
    });
    incrementDailyReps(setSummary.validReps);
    incrementDailySession();
  }, [setSummary, exerciseType]);

  if (!setSummary) {
    // Shouldn't happen, but guard against it
    handleDone();
    return null;
  }

  return (
    <AppBackground variant={1}>
      <View style={{ flex: 1 }}>
        <SetSummaryCard
          summary={setSummary}
          onRepeat={handleRepeat}
          onDone={handleDone}
        />
      </View>
    </AppBackground>
  );
}
