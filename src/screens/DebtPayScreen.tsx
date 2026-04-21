import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore } from '../store/focusStore';
import { C, SHADOW } from '../theme/atelier';

type Props = NativeStackScreenProps<RootStackParamList, 'DebtPay'>;

export function DebtPayScreen({ navigation }: Props) {
  const { pendingSets, penaltyReps, penaltyExercise } = useFocusStore();
  const [selectedSets, setSelectedSets] = useState(1);

  const maxSets = Math.max(pendingSets, 1);
  const totalReps = selectedSets * penaltyReps;

  const exerciseLabel =
    penaltyExercise === 'pushup'
      ? 'Push-ups'
      : penaltyExercise === 'situp'
        ? 'Sit-ups'
        : 'Squats';

  const handleStart = () => {
    navigation.replace('PunishExercise', {
      targetReps: totalReps,
      exerciseType: penaltyExercise,
      setsToPayOff: selectedSets,
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={s.label}>DEBT PAYMENT</Text>
        <Text style={s.headline}>Pay Off Your Debt</Text>
        <Text style={s.subhead}>
          You owe <Text style={s.highlight}>{pendingSets}</Text> set
          {pendingSets !== 1 ? 's' : ''}
        </Text>

        <Text style={s.question}>
          How many sets do you want to complete?
        </Text>

        {/* Set selector */}
        <View style={s.selectorRow}>
          <TouchableOpacity
            style={s.arrowBtn}
            onPress={() => setSelectedSets((v) => Math.max(1, v - 1))}
            disabled={selectedSets <= 1}>
            <Text
              style={[
                s.arrowText,
                selectedSets <= 1 && s.arrowDisabled,
              ]}>
              −
            </Text>
          </TouchableOpacity>

          <View style={s.selectedBox}>
            <Text style={s.selectedNumber}>{selectedSets}</Text>
          </View>

          <TouchableOpacity
            style={s.arrowBtn}
            onPress={() => setSelectedSets((v) => Math.min(maxSets, v + 1))}
            disabled={selectedSets >= maxSets}>
            <Text
              style={[
                s.arrowText,
                selectedSets >= maxSets && s.arrowDisabled,
              ]}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Exercise</Text>
            <Text style={s.infoValue}>{exerciseLabel}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Reps per set</Text>
            <Text style={s.infoValue}>{penaltyReps}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total reps</Text>
            <Text style={[s.infoValue, s.totalReps]}>{totalReps}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.startBtn}
          onPress={handleStart}
          activeOpacity={0.8}>
          <Text style={s.startText}>
            START ({selectedSets} set{selectedSets !== 1 ? 's' : ''})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ───────────── Styles ───────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  container: { flex: 1, padding: 24, alignItems: 'center' },

  backBtn: { alignSelf: 'flex-start', marginBottom: 16, marginTop: 12 },
  backText: { color: C.onSurfaceVariant, fontSize: 16, fontWeight: '600' },

  /* Header */
  label: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headline: {
    color: C.primaryContainer,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subhead: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  highlight: {
    color: C.error,
    fontWeight: '800',
  },
  question: {
    color: C.onSurface,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },

  /* Selector */
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 28,
  },
  arrowBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: { color: C.primaryContainer, fontSize: 28, fontWeight: '700' },
  arrowDisabled: { color: C.outlineVariant },
  selectedBox: {
    backgroundColor: C.primaryContainer,
    borderRadius: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.card,
  },
  selectedNumber: {
    color: C.onPrimary,
    fontSize: 36,
    fontWeight: '900',
  },

  /* Info card */
  infoCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 28,
    ...SHADOW.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { color: C.onSurfaceVariant, fontSize: 15 },
  infoValue: { color: C.onSurface, fontSize: 15, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: C.outlineVariant,
    marginVertical: 4,
  },
  totalReps: { color: C.secondary, fontSize: 18, fontWeight: '900' },

  /* Start button */
  startBtn: {
    backgroundColor: C.secondary,
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.button,
  },
  startText: {
    color: C.onPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
