import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { AppModal } from '../components/ui/AppModal';
import { CalendarViewModal } from '../components/ui/CalendarViewModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { D, SP, R, SH } from '../theme/design';
import { useExercisePlanStore } from '../store/exercisePlanStore';
import { syncPlanToCalendar } from '../services/calendarService';
import { DayWorkout } from '../types/plan';

type Props = NativeStackScreenProps<RootStackParamList, 'ExercisePlan'>;

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEVEL_COLORS: Record<string, string> = {
  beginner:     D.accent,
  intermediate: D.primary,
  advanced:     D.danger,
};

const CALENDAR_SETUP_STEPS =
  '1. Go to console.cloud.google.com\n' +
  '2. APIs & Services → Library → enable "Google Calendar API"\n' +
  '3. Data Access → add scope: .../auth/calendar\n' +
  '4. Audience → add your Gmail as a test user\n' +
  '5. Sign out of FitCounter and sign back in with Google';

function todayDayIdx() {
  return (new Date().getDay() + 6) % 7;
}

export function ExercisePlanScreen({ navigation }: Props) {
  const {
    activePlan,
    clearPlan,
    getTodayWorkout,
    isTodayComplete,
    getWeeklyCompletions,
    getOverallProgress,
    getCurrentWeekNumber,
  } = useExercisePlanStore();

  const [syncing,      setSyncing]      = useState(false);
  const [previewDay,   setPreviewDay]   = useState<DayWorkout | null>(null);
  const [calVisible,   setCalVisible]   = useState(false);
  const [syncedCount,  setSyncedCount]  = useState(0);

  type ModalState = { visible: boolean; variant: 'success'|'error'|'warning'|'info'|'confirm'; title: string; message?: string; buttons?: { label: string; onPress: () => void; variant?: 'primary'|'danger'|'ghost' }[] };
  const MODAL_HIDDEN: ModalState = { visible: false, variant: 'info', title: '' };
  const [modal, setModal] = useState<ModalState>(MODAL_HIDDEN);
  const closeModal = () => setModal(MODAL_HIDDEN);

  if (!activePlan) {
    return (
      <AppBackground variant={1}>
      <SafeAreaView style={s.safe}>
        <View style={s.emptyWrap}>
          <MaterialCommunityIcons name="calendar-blank" size={56} color={D.textMuted} />
          <Text style={s.emptyTitle}>No Active Plan</Text>
          <Text style={s.emptySub}>Create a plan from the home screen.</Text>
          <Button label="Go Home" onPress={() => navigation.replace('Home')} variant="primary" />
        </View>
      </SafeAreaView>
      </AppBackground>
    );
  }

  const levelColor   = LEVEL_COLORS[activePlan.level] ?? D.primary;
  const currentWeek  = getCurrentWeekNumber();
  const weekIndex    = Math.min(currentWeek - 1, activePlan.weeks.length - 1);
  const currentWeekPlan = activePlan.weeks[weekIndex] ?? null;
  const todayDayI    = todayDayIdx();
  const todayWorkout = getTodayWorkout();
  const todayDone    = isTodayComplete();
  const weeklyDone   = getWeeklyCompletions();
  const { completedDays, totalWorkoutDays } = getOverallProgress();
  const overallProgress = totalWorkoutDays > 0 ? completedDays / totalWorkoutDays : 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPlanToCalendar(activePlan);
      setSyncing(false);
      if (result.needsAuth) {
        // Not connected — show setup modal
        setModal({
          visible: true,
          variant: 'warning',
          title: 'Google Calendar Not Connected',
          message: 'Sign in with Google and follow these steps:\n\n' + CALENDAR_SETUP_STEPS,
          buttons: [{ label: 'Got it', onPress: closeModal, variant: 'primary' }],
        });
      } else {
        // Connected — open in-app calendar view showing this month with synced events
        setSyncedCount(result.created);
        setCalVisible(true);
      }
    } catch {
      setSyncing(false);
      setModal({ visible: true, variant: 'error', title: 'Sync Failed', message: 'Could not reach Google Calendar. Check your internet connection.' });
    }
  };

  const handleEndPlan = () => {
    setModal({
      visible: true,
      variant: 'confirm',
      title: 'End Plan?',
      message: 'This will remove your current plan and all progress. This cannot be undone.',
      buttons: [
        { label: 'Cancel',   onPress: closeModal, variant: 'ghost' },
        { label: 'End Plan', onPress: () => { closeModal(); clearPlan(); navigation.replace('Home'); }, variant: 'danger' },
      ],
    });
  };

  const handleCalendarInfo = () => {
    setModal({
      visible: true,
      variant: 'info',
      title: 'Google Calendar Setup',
      message: CALENDAR_SETUP_STEPS,
      buttons: [{ label: 'Got it', onPress: closeModal, variant: 'primary' }],
    });
  };

  const workoutDays = currentWeekPlan?.days.filter((d) => !d.isRestDay) ?? [];

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={[s.levelBadge, { backgroundColor: levelColor + '22' }]}>
              <Text style={[s.levelText, { color: levelColor }]}>{activePlan.level.toUpperCase()}</Text>
            </View>
            <Text style={s.planTitle} numberOfLines={2}>{activePlan.title}</Text>
          </View>
          <TouchableOpacity onPress={handleSync} style={s.iconBtn} activeOpacity={0.8} disabled={syncing}>
            {syncing
              ? <ActivityIndicator color={D.primary} size="small" />
              : <MaterialCommunityIcons name="calendar-sync" size={22} color={D.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCalendarInfo}
            style={s.iconBtn}
            activeOpacity={0.8}>
            <Feather name="info" size={18} color={D.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Progress ── */}
        <Card style={s.progressCard} padding={SP.xl}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Week {currentWeek} of {activePlan.totalWeeks}</Text>
            <Text style={s.progressVal}>{completedDays} / {totalWorkoutDays} days done</Text>
          </View>
          <ProgressBar progress={overallProgress} color={levelColor} height={8} style={{ marginVertical: SP.md }} />
          <Text style={s.phaseNote}>{currentWeekPlan?.focusNote ?? ''}</Text>
        </Card>

        {/* ── This Week mini-strip ── */}
        <Text style={s.sectionTitle}>This Week</Text>
        <View style={s.weekStrip}>
          {(currentWeekPlan?.days ?? []).map((day, idx) => {
            const isToday   = idx === todayDayI;
            const isDone    = weeklyDone[idx] ?? false;
            const isWorkout = !day.isRestDay;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={isWorkout ? 0.75 : 1}
                onPress={() => isWorkout ? setPreviewDay(day) : undefined}
                style={[
                  s.dayChip,
                  isWorkout && !isToday && !isDone && s.dayChipWorkout,
                  isToday   && s.dayChipToday,
                  isDone    && s.dayChipDone,
                  !isWorkout && s.dayChipRest,
                ]}>
                <Text style={[
                  s.dayChipLabel,
                  (isWorkout && !isToday && !isDone) && s.dayChipLabelWorkout,
                  isToday && s.dayChipLabelToday,
                  isDone  && s.dayChipLabelDone,
                ]}>
                  {DAY_SHORT[idx]}
                </Text>
                {isDone    ? <Feather name="check" size={11} color="#fff" />
                 : isWorkout ? <MaterialCommunityIcons name="dumbbell" size={11} color={isToday ? '#fff' : D.primary} />
                 : <Text style={s.dashLabel}>–</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Today's workout CTA ── */}
        {todayWorkout && !todayWorkout.isRestDay ? (
          <Card style={s.todayCard} padding={SP.xl}>
            <View style={s.todayRow}>
              <View style={{ flex: 1 }}>
                <View style={s.todayTagWrap}>
                  <Text style={s.todayTag}>TODAY</Text>
                </View>
                <Text style={s.todayFocus}>{todayWorkout.focus}</Text>
                <Text style={s.todayMeta}>
                  {todayWorkout.exercises.length} exercises · ~{todayWorkout.estimatedMinutes} min
                </Text>
              </View>
              {todayDone && <Feather name="check-circle" size={34} color={D.accent} />}
            </View>
            {todayDone ? (
              <Text style={s.doneText}>Great work! Completed today.</Text>
            ) : (
              <Button
                label="Start Today's Workout"
                onPress={() => navigation.navigate('DailyWorkout')}
                variant="primary"
                fullWidth
                style={{ marginTop: SP.md }}
              />
            )}
          </Card>
        ) : (
          <Card style={s.restCard} padding={SP.lg}>
            <Image source={require('../../Elements/EmptyState.png')} style={s.restImg} resizeMode="contain" />
            <Text style={s.restTitle}>Rest Day</Text>
            <Text style={s.restSub}>Recovery is part of the plan. See you tomorrow!</Text>
          </Card>
        )}

        {/* ── Week schedule list ── */}
        <Text style={s.sectionTitle}>Week {currentWeek} Schedule</Text>
        {workoutDays.length === 0 ? (
          <Text style={s.emptySub}>No workouts this week.</Text>
        ) : workoutDays.map((day) => (
          <TouchableOpacity key={day.dayIndex} onPress={() => setPreviewDay(day)} activeOpacity={0.8}>
            <Card style={s.schedRow} padding={SP.lg}>
              <View style={[s.schedDayBadge, { backgroundColor: levelColor + '22' }]}>
                <Text style={[s.schedDayText, { color: levelColor }]}>{DAY_SHORT[day.dayIndex]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.schedFocus}>{day.focus}</Text>
                <Text style={s.schedMeta}>{day.exercises.length} exercises · ~{day.estimatedMinutes} min</Text>
              </View>
              <Feather name="chevron-right" size={18} color={D.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}

        {/* ── End plan ── */}
        <TouchableOpacity style={s.endBtn} onPress={handleEndPlan} activeOpacity={0.75}>
          <Text style={s.endBtnText}>End Plan</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>

    {/* ── Preview Modal ── */}
    <Modal
      visible={previewDay !== null}
      transparent
      animationType="slide"
      onRequestClose={() => setPreviewDay(null)}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalDay}>{previewDay ? DAY_SHORT[previewDay.dayIndex] : ''}</Text>
              <Text style={s.modalFocus}>{previewDay?.focus ?? ''}</Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewDay(null)} style={s.modalClose} activeOpacity={0.7}>
              <Feather name="x" size={22} color={D.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
            {(previewDay?.exercises ?? []).map((ex, i) => (
              <View key={i} style={s.exRow}>
                <View style={s.exBullet}><Text style={s.exBulletText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMeta}>
                    {ex.sets} sets ×{' '}
                    {ex.durationSeconds ? `${ex.durationSeconds}s` : `${ex.reps} reps`}
                    {'  ·  '}rest {ex.restSeconds}s
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={s.modalEst}>~{previewDay?.estimatedMinutes ?? 0} min total</Text>
          {previewDay && !previewDay.isRestDay && previewDay.dayIndex === todayDayI && !todayDone && (
            <Button
              label="Start Workout"
              onPress={() => { setPreviewDay(null); navigation.navigate('DailyWorkout'); }}
              variant="primary"
              fullWidth
              style={{ marginTop: SP.md }}
            />
          )}
        </View>
      </View>
    </Modal>

    <AppModal
      visible={modal.visible}
      onClose={closeModal}
      variant={modal.variant}
      title={modal.title}
      message={modal.message}
      buttons={modal.buttons}
    />

    <CalendarViewModal
      visible={calVisible}
      onClose={() => setCalVisible(false)}
      syncedCount={syncedCount}
      onSetup={() => setModal({
        visible: true,
        variant: 'warning',
        title: 'Google Calendar Not Connected',
        message: 'Sign in with Google and follow these steps:\n\n' + CALENDAR_SETUP_STEPS,
        buttons: [{ label: 'Got it', onPress: closeModal, variant: 'primary' }],
      })}
    />

    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.lg, paddingBottom: 60 },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.xxl, gap: SP.lg },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: D.text },
  emptySub:   { fontSize: 14, color: D.textMuted, textAlign: 'center', lineHeight: 20 },

  header:    { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.lg },
  backBtn:   { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  levelBadge:{ alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3, marginBottom: SP.xs },
  levelText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planTitle: { fontSize: 18, fontWeight: '800', color: D.text },
  iconBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: D.card, alignItems: 'center', justifyContent: 'center', ...SH.soft },

  progressCard: { marginBottom: SP.lg },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:{ fontSize: 14, fontWeight: '700', color: D.text },
  progressVal:  { fontSize: 12, color: D.textMuted, fontWeight: '600' },
  phaseNote:    { fontSize: 12, color: D.textMuted, marginTop: SP.xs },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: SP.md, marginTop: SP.sm },

  weekStrip: { flexDirection: 'row', gap: SP.xs, marginBottom: SP.lg, justifyContent: 'space-between' },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SP.sm,
    borderRadius: R.md,
    backgroundColor: D.card,
    gap: 4,
    ...SH.soft,
  },
  dayChipWorkout: { backgroundColor: D.primaryLight },
  dayChipToday:   { backgroundColor: D.primary },
  dayChipDone:    { backgroundColor: D.primary },
  dayChipRest:    { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  dayChipLabel:         { fontSize: 10, fontWeight: '700', color: D.textMuted },
  dayChipLabelWorkout:  { color: D.primary },
  dayChipLabelToday:    { color: '#fff' },
  dayChipLabelDone:     { color: '#fff' },
  dashLabel:            { fontSize: 10, color: D.border },

  todayCard: { marginBottom: SP.lg },
  todayRow:  { flexDirection: 'row', alignItems: 'center' },
  todayTagWrap: { alignSelf: 'flex-start', backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3, marginBottom: SP.xs },
  todayTag:  { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  todayFocus:{ fontSize: 18, fontWeight: '800', color: D.text, marginBottom: 2 },
  todayMeta: { fontSize: 13, color: D.textMuted },
  doneText:  { fontSize: 13, color: D.accent, fontWeight: '600', marginTop: SP.sm, textAlign: 'center' },

  restCard:  { marginBottom: SP.lg, alignItems: 'center', paddingVertical: SP.xl },
  restImg:   { width: 120, height: 120, marginBottom: SP.md },
  restTitle: { fontSize: 18, fontWeight: '800', color: D.textMuted, marginBottom: SP.xs },
  restSub:   { fontSize: 13, color: D.textMuted, textAlign: 'center' },

  schedRow:      { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.sm },
  schedDayBadge: { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  schedDayText:  { fontSize: 12, fontWeight: '800' },
  schedFocus:    { fontSize: 14, fontWeight: '700', color: D.text, marginBottom: 2 },
  schedMeta:     { fontSize: 12, color: D.textMuted },

  endBtn:     { borderWidth: 2, borderColor: D.border, borderRadius: R.pill, paddingVertical: 14, alignItems: 'center', marginTop: SP.xl },
  endBtnText: { color: D.danger, fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: D.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SP.xl, paddingBottom: 36 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: 'center', marginBottom: SP.lg },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.lg },
  modalDay:     { fontSize: 12, fontWeight: '800', color: D.primary, letterSpacing: 1, marginBottom: 2 },
  modalFocus:   { fontSize: 20, fontWeight: '800', color: D.text },
  modalClose:   { width: 36, height: 36, borderRadius: 18, backgroundColor: D.bg, alignItems: 'center', justifyContent: 'center' },
  exRow:        { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingVertical: SP.sm, borderBottomWidth: 1, borderColor: D.border },
  exBullet:     { width: 26, height: 26, borderRadius: 13, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center' },
  exBulletText: { fontSize: 11, fontWeight: '800', color: D.primary },
  exName:       { fontSize: 14, fontWeight: '700', color: D.text, marginBottom: 2 },
  exMeta:       { fontSize: 12, color: D.textMuted },
  modalEst:     { fontSize: 12, color: D.textMuted, textAlign: 'right', marginTop: SP.md },
});
