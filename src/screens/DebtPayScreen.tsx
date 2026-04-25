import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore } from '../store/focusStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'DebtPay'>;

const EXERCISE_IMAGES: Record<string, any> = {
  pushup: require('../../Elements/pushup.png'),
  situp:  require('../../Elements/situps.png'),
  squat:  require('../../Elements/squats.png'),
};

export function DebtPayScreen({ navigation }: Props) {
  const { pendingSets, penaltyReps, penaltyExercise } = useFocusStore();
  const [selectedSets, setSelectedSets] = useState(1);

  const maxSets = Math.max(pendingSets, 1);
  const totalReps = selectedSets * penaltyReps;

  const exerciseLabel =
    penaltyExercise === 'pushup' ? 'Push-ups' :
    penaltyExercise === 'situp'  ? 'Sit-ups'  : 'Squats';

  const handleStart = () => {
    if (pendingSets === 0) return;
    navigation.replace('PunishExercise', {
      targetReps: totalReps,
      exerciseType: penaltyExercise,
      setsToPayOff: selectedSets,
    });
  };

  const pct = selectedSets / maxSets;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* ── Header ── */}
        <Text style={s.tag}>DEBT PAYMENT</Text>
        <Text style={s.headline}>Pay Off Your Debt</Text>

        {/* ── Debt overview card ── */}
        <Card style={s.overviewCard} padding={SP.xl}>
          <View style={s.overviewRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.owesLabel}>You owe</Text>
              <Text style={s.owesNum}>{pendingSets}</Text>
              <Text style={s.owesUnit}>set{pendingSets !== 1 ? 's' : ''}</Text>
            </View>
            <Image
              source={EXERCISE_IMAGES[penaltyExercise] ?? EXERCISE_IMAGES.pushup}
              style={s.overviewImg}
              resizeMode="contain"
            />
          </View>
          <ProgressBar progress={pct} color={D.primary} height={6} style={{ marginTop: SP.md }} />
          <Text style={s.progressHint}>{selectedSets} of {maxSets} sets selected</Text>
        </Card>

        {/* ── Set selector ── */}
        <Text style={s.questionText}>How many sets to complete now?</Text>
        <View style={s.selector}>
          <TouchableOpacity
            style={[s.arrowBtn, selectedSets <= 1 && s.arrowDisabled]}
            onPress={() => setSelectedSets((v) => Math.max(1, v - 1))}
            disabled={selectedSets <= 1}>
            <Text style={[s.arrowText, selectedSets <= 1 && { color: D.border }]}>−</Text>
          </TouchableOpacity>

          <View style={s.numBox}>
            <Text style={s.numText}>{selectedSets}</Text>
          </View>

          <TouchableOpacity
            style={[s.arrowBtn, selectedSets >= maxSets && s.arrowDisabled]}
            onPress={() => setSelectedSets((v) => Math.min(maxSets, v + 1))}
            disabled={selectedSets >= maxSets}>
            <Text style={[s.arrowText, selectedSets >= maxSets && { color: D.border }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info card ── */}
        <Card style={s.infoCard} padding={SP.lg}>
          {[
            { label: 'Exercise',     val: exerciseLabel },
            { label: 'Reps per set', val: String(penaltyReps) },
          ].map(({ label, val }) => (
            <View key={label} style={s.infoRow}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoVal}>{val}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total reps</Text>
            <Text style={[s.infoVal, s.totalVal]}>{totalReps}</Text>
          </View>
        </Card>

        <Button
          label={`Start — ${selectedSets} Set${selectedSets !== 1 ? 's' : ''}`}
          onPress={handleStart}
          variant="primary"
          disabled={pendingSets === 0}
          fullWidth
        />

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, paddingHorizontal: SP.xl, paddingTop: SP.base, paddingBottom: SP.xxl },

  backBtn:  { alignSelf: 'flex-start', marginBottom: SP.base },
  backText: { color: D.primary, fontSize: 15, fontWeight: '600' },

  tag:      { fontSize: 11, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: SP.xs },
  headline: { fontSize: 28, fontWeight: '800', color: D.text, marginBottom: SP.xl },

  overviewCard:  { marginBottom: SP.xl },
  overviewRow:   { flexDirection: 'row', alignItems: 'center' },
  owesLabel:     { fontSize: 13, color: D.textMuted, marginBottom: SP.xs },
  owesNum:       { fontSize: 56, fontWeight: '900', color: D.primary, lineHeight: 60 },
  owesUnit:      { fontSize: 15, fontWeight: '700', color: D.textMuted },
  overviewImg:   { width: 100, height: 100 },
  progressHint:  { fontSize: 12, color: D.textMuted, marginTop: SP.sm, textAlign: 'right' },

  questionText:  { fontSize: 15, fontWeight: '700', color: D.text, marginBottom: SP.lg, textAlign: 'center' },

  selector:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xl, marginBottom: SP.xl },
  arrowBtn:  { width: 52, height: 52, borderRadius: 26, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.4 },
  arrowText: { color: D.primary, fontSize: 28, fontWeight: '700' },
  numBox:    { width: 80, height: 80, borderRadius: 40, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', ...SH.button },
  numText:   { color: D.onPrimary, fontSize: 36, fontWeight: '900' },

  infoCard:  { marginBottom: SP.xl },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SP.sm },
  infoLabel: { color: D.textMuted, fontSize: 14 },
  infoVal:   { color: D.text, fontSize: 14, fontWeight: '600' },
  divider:   { height: 1, backgroundColor: D.border, marginVertical: SP.xs },
  totalVal:  { color: D.primary, fontSize: 18, fontWeight: '800' },
});
