import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { D, SP, R, SH } from '../theme/design';
import { ExerciseLevel, PlanDuration } from '../types/plan';
import { generateInstructorPlan } from '../utils/planGenerator';
import { useExercisePlanStore } from '../store/exercisePlanStore';

type Props = NativeStackScreenProps<RootStackParamList, 'InstructorPlanSetup'>;

const LEVELS: { key: ExerciseLevel; label: string; desc: string; icon: string }[] = [
  { key: 'beginner',     label: 'Beginner',     desc: 'New or returning — builds base fitness with 3 days/week', icon: 'sun' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Regular exerciser — 4 days/week with varied splits',       icon: 'activity' },
  { key: 'advanced',     label: 'Advanced',     desc: 'High intensity — 5 days/week with progressive overload',  icon: 'shield' },
];

const DURATIONS: { key: PlanDuration; label: string; desc: string }[] = [
  { key: '1week',   label: '1 Week',    desc: 'Try it out — quick start' },
  { key: '1month',  label: '1 Month',   desc: 'Build solid habits — 4 weeks' },
  { key: '6months', label: '6 Months',  desc: 'Full transformation — 26 weeks' },
];

export function InstructorPlanSetupScreen({ navigation }: Props) {
  const [step,          setStep]          = useState<1 | 2 | 3>(1);
  const [level,         setLevel]         = useState<ExerciseLevel | null>(null);
  const [duration,      setDuration]      = useState<PlanDuration | null>(null);
  const [timePerDay,    setTimePerDay]    = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight,    setGoalWeight]    = useState('');
  const [height,        setHeight]        = useState('');
  const [generating,    setGenerating]    = useState(false);
  const [fieldErrors,   setFieldErrors]   = useState<Record<string, string>>({});

  const setActivePlan = useExercisePlanStore((s) => s.setActivePlan);

  const goBack = () => {
    setFieldErrors({});
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
    else navigation.goBack();
  };

  const handleGenerate = () => {
    const errs: Record<string, string> = {};

    const t  = Number(timePerDay.trim());
    const cw = Number(currentWeight.trim());
    const gw = Number(goalWeight.trim());
    const h  = Number(height.trim());

    if (!timePerDay.trim() || Number.isNaN(t) || t < 10 || t > 180)
      errs.time = 'Enter a value between 10 and 180 minutes.';
    if (!currentWeight.trim() || Number.isNaN(cw) || cw < 30 || cw > 300)
      errs.cw = 'Enter your weight in kg (30–300).';
    if (!goalWeight.trim() || Number.isNaN(gw) || gw < 30 || gw > 300)
      errs.gw = 'Enter a goal weight in kg (30–300).';
    if (!height.trim() || Number.isNaN(h) || h < 100 || h > 250)
      errs.h = 'Enter your height in cm (100–250).';

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!level || !duration) {
      setFieldErrors({ general: 'Missing level or duration. Please go back and select them.' });
      return;
    }

    setGenerating(true);
    try {
      const plan = generateInstructorPlan(level, duration, {
        timePerDayMinutes: t,
        currentWeightKg:   cw,
        goalWeightKg:      gw,
        heightCm:          h,
      });
      setActivePlan(plan);
      navigation.replace('ExercisePlan');
    } catch {
      setFieldErrors({ general: 'Could not generate plan. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.tag}>INSTRUCTOR PLAN  ·  STEP {step} / 3</Text>
            <Text style={s.title}>
              {step === 1 ? 'Choose Your Level' : step === 2 ? 'Choose Duration' : 'Your Stats'}
            </Text>
          </View>
        </View>

        {/* Step dots */}
        <View style={s.stepRow}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]} />
          ))}
        </View>

        {/* ── Step 1: Level ── */}
        {step === 1 && (
          <>
            <Text style={s.stepSub}>Select the level that matches your current fitness.</Text>
            {fieldErrors.general && <View style={s.generalError}><Feather name="alert-circle" size={14} color={D.danger} /><Text style={s.generalErrorText}>{fieldErrors.general}</Text></View>}
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l.key}
                style={[s.optCard, level === l.key && s.optCardActive]}
                onPress={() => setLevel(l.key)}
                activeOpacity={0.8}>
                <View style={s.optIconWrap}>
                  <Feather name={l.icon as any} size={22} color={D.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optLabel, level === l.key && s.optLabelActive]}>{l.label}</Text>
                  <Text style={s.optDesc}>{l.desc}</Text>
                </View>
                {level === l.key && <Feather name="check-circle" size={22} color={D.primary} />}
              </TouchableOpacity>
            ))}
            <Button
              label="Continue"
              onPress={() => {
                if (!level) { setFieldErrors({ general: 'Please select a fitness level to continue.' }); return; }
                setStep(2);
              }}
              variant="primary"
              fullWidth
              style={{ marginTop: SP.lg }}
            />
          </>
        )}

        {/* ── Step 2: Duration ── */}
        {step === 2 && (
          <>
            <Text style={s.stepSub}>How long do you want to follow this plan?</Text>
            {fieldErrors.general && <View style={s.generalError}><Feather name="alert-circle" size={14} color={D.danger} /><Text style={s.generalErrorText}>{fieldErrors.general}</Text></View>}
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[s.optCard, duration === d.key && s.optCardActive]}
                onPress={() => setDuration(d.key)}
                activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optLabel, duration === d.key && s.optLabelActive]}>{d.label}</Text>
                  <Text style={s.optDesc}>{d.desc}</Text>
                </View>
                {duration === d.key && <Feather name="check-circle" size={22} color={D.primary} />}
              </TouchableOpacity>
            ))}
            <Button
              label="Continue"
              onPress={() => {
                if (!duration) { setFieldErrors({ general: 'Please select a duration to continue.' }); return; }
                setStep(3);
              }}
              variant="primary"
              fullWidth
              style={{ marginTop: SP.lg }}
            />
          </>
        )}

        {/* ── Step 3: Stats ── */}
        {step === 3 && (
          <>
            <Text style={s.stepSub}>Help us tailor the volume to your schedule and goals.</Text>
            <Card style={{ marginBottom: SP.lg }} padding={SP.xl}>
              {([
                { label: 'Time available per day (min)', value: timePerDay,    set: setTimePerDay,    hint: 'e.g. 30',  type: 'numeric',     errKey: 'time' },
                { label: 'Current weight (kg)',          value: currentWeight, set: setCurrentWeight, hint: 'e.g. 75',  type: 'decimal-pad', errKey: 'cw'   },
                { label: 'Goal weight (kg)',             value: goalWeight,    set: setGoalWeight,    hint: 'e.g. 70',  type: 'decimal-pad', errKey: 'gw'   },
                { label: 'Height (cm)',                  value: height,        set: setHeight,        hint: 'e.g. 175', type: 'numeric',     errKey: 'h'    },
              ] as const).map(({ label, value, set, hint, type, errKey }) => {
                const err = fieldErrors[errKey];
                return (
                  <View key={label} style={s.field}>
                    <Text style={s.fieldLabel}>{label}</Text>
                    <TextInput
                      style={[s.fieldInput, err ? s.fieldInputError : null]}
                      value={value}
                      onChangeText={(v) => { set(v); setFieldErrors((e) => { const n = {...e}; delete n[errKey]; return n; }); }}
                      placeholder={hint}
                      placeholderTextColor={D.textLight}
                      keyboardType={type as any}
                      returnKeyType="done"
                    />
                    {err && <Text style={s.fieldError}>{err}</Text>}
                  </View>
                );
              })}
            </Card>
            {fieldErrors.general && (
              <View style={s.generalError}>
                <Feather name="alert-circle" size={14} color={D.danger} />
                <Text style={s.generalErrorText}>{fieldErrors.general}</Text>
              </View>
            )}
            <Button
              label={generating ? 'Generating…' : 'Generate My Plan'}
              onPress={handleGenerate}
              variant="primary"
              fullWidth
              style={generating ? { opacity: 0.7 } : undefined}
            />
          </>
        )}

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.lg, paddingBottom: 48 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.md },
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  tag:     { fontSize: 10, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: 2 },
  title:   { fontSize: 22, fontWeight: '800', color: D.text },

  stepRow:       { flexDirection: 'row', gap: SP.sm, marginBottom: SP.xl },
  stepDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: D.border },
  stepDotActive: { backgroundColor: D.primary },

  stepSub: { fontSize: 14, color: D.textMuted, marginBottom: SP.lg, lineHeight: 20 },

  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
    backgroundColor: D.card,
    borderRadius: R.card,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SH.soft,
  },
  optCardActive:  { borderColor: D.primary, backgroundColor: D.primaryLight },
  optIconWrap:    { width: 42, height: 42, borderRadius: R.card, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  optLabel:       { fontSize: 16, fontWeight: '700', color: D.text, marginBottom: 2 },
  optLabelActive: { color: D.primary },
  optDesc:        { fontSize: 12, color: D.textMuted, lineHeight: 17 },

  field:           { marginBottom: SP.lg },
  fieldLabel:      { fontSize: 13, fontWeight: '600', color: D.text, marginBottom: SP.xs },
  fieldInput: {
    backgroundColor: D.bg,
    borderRadius: R.md,
    paddingHorizontal: SP.base,
    paddingVertical: SP.md,
    fontSize: 15,
    color: D.text,
    borderWidth: 1.5,
    borderColor: D.border,
  },
  fieldInputError: { borderColor: D.danger },
  fieldError:      { fontSize: 12, color: D.danger, marginTop: 4, fontWeight: '500' },

  generalError:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: D.dangerLight, borderRadius: R.md, padding: SP.md, marginBottom: SP.md, borderWidth: 1, borderColor: D.danger + '55' },
  generalErrorText: { fontSize: 13, color: D.danger, fontWeight: '600', flex: 1 },
});
