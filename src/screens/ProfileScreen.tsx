import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useAuthStore } from '../store/authStore';
import { useXPStore } from '../store/xpStore';
import { useFocusStore } from '../store/focusStore';
import { signOutUser } from '../services/authService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { BottomNav } from '../components/ui/BottomNav';
import { AvatarSelector, AVATARS } from '../components/ui/AvatarSelector';
import { MiniCalendar } from '../components/ui/MiniCalendar';
import { useAvatarStore } from '../store/avatarStore';
import { useExercisePlanStore } from '../store/exercisePlanStore';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ACHIEVEMENTS = [
  { icon: 'trophy',         label: 'First Session',   color: D.primary },
  { icon: 'fire',           label: '7-Day Streak',    color: D.primary },
  { icon: 'dumbbell',       label: '100 Reps',        color: D.primary },
  { icon: 'shield-star',    label: 'Zero Violations', color: D.primary },
  { icon: 'lightning-bolt', label: 'Fast Finisher',   color: D.primary },
  { icon: 'meditation',     label: 'Focused Mind',    color: D.primary },
];

export function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { xp, level } = useXPStore();
  const { pendingSets } = useFocusStore();
  const { selectedIndex: rawIndex, selectAvatar } = useAvatarStore();
  const selectedIndex = Math.min(Math.max(rawIndex ?? 0, 0), AVATARS.length - 1);
  const xpProgress = (xp % 100) / 100;
  const xpToNext = 100 - (xp % 100);

  const activePlan        = useExercisePlanStore((s) => s.activePlan);
  const completions       = useExercisePlanStore((s) => s.completions);
  const isTodayComplete   = useExercisePlanStore((s) => s.isTodayComplete);
  const getTodayWorkout   = useExercisePlanStore((s) => s.getTodayWorkout);
  const getCurrentWeek    = useExercisePlanStore((s) => s.getCurrentWeekNumber);
  const getOverallProgress = useExercisePlanStore((s) => s.getOverallProgress);

  const todayWorkout  = activePlan ? getTodayWorkout() : null;
  const todayDone     = activePlan ? isTodayComplete() : false;
  const currentWeek   = activePlan ? getCurrentWeek() : 1;
  const progress      = getOverallProgress();
  const hasWorkoutToday = todayWorkout && !todayWorkout.isRestDay && !todayDone;

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Athlete';
  const email = user?.email ?? '';

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero section ── */}
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <Image source={AVATARS[selectedIndex]} style={s.avatar} resizeMode="cover" />
          </View>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.email}>{email}</Text>
          <View style={s.levelBadge}>
            <Text style={s.levelText}>Level {level} Athlete</Text>
          </View>
        </View>

        {/* ── XP card ── */}
        <Card style={s.xpCard} padding={SP.xl}>
          <View style={s.xpHeader}>
            <Text style={s.xpTitle}>Experience Points</Text>
            <Text style={s.xpVal}>{xp} XP</Text>
          </View>
          <ProgressBar progress={xpProgress} color={D.primary} height={10} style={{ marginVertical: SP.md }} />
          <Text style={s.xpSub}>{xpToNext} XP to Level {level + 1}</Text>
        </Card>

        {/* ── Stats ── */}
        <Text style={s.sectionTitle}>Stats</Text>
        <View style={s.statsGrid}>
          {[
            { label: 'Level',      value: level, color: D.primary },
            { label: 'Total XP',   value: xp,    color: D.primary },
            { label: 'Debt Sets',  value: pendingSets, color: pendingSets > 0 ? D.danger : D.accent },
            { label: 'Next Level', value: `${xpToNext} XP`, color: D.textMuted },
          ].map(({ label, value, color }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statValue, { color }]}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── My Plan ── */}
        <Text style={s.sectionTitle}>My Plan</Text>
        {activePlan ? (
          <Card style={s.planCard} padding={SP.xl}>
            <View style={s.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.planTitle} numberOfLines={1}>{activePlan.title}</Text>
                <View style={s.planMeta}>
                  <View style={s.planBadge}>
                    <Text style={s.planBadgeText}>{activePlan.level.toUpperCase()}</Text>
                  </View>
                  <Text style={s.planWeek}>Week {currentWeek} of {activePlan.totalWeeks}</Text>
                </View>
              </View>
              <View style={s.planProgressCircle}>
                <Text style={s.planProgressNum}>{progress.completedDays}</Text>
                <Text style={s.planProgressOf}>/{progress.totalWorkoutDays}</Text>
              </View>
            </View>

            <MiniCalendar plan={activePlan} completions={completions} />

            <View style={s.planActions}>
              {hasWorkoutToday && (
                <TouchableOpacity
                  style={s.planStartBtn}
                  onPress={() => navigation.navigate('DailyWorkout')}
                  activeOpacity={0.8}>
                  <Text style={s.planStartText}>Start Today's Workout</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={s.planViewBtn}
                onPress={() => navigation.navigate('ExercisePlan')}
                activeOpacity={0.8}>
                <Text style={s.planViewText}>View Full Plan</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={s.planCard} padding={SP.xl}>
            <Text style={s.noPlanText}>No active plan yet.</Text>
            <TouchableOpacity
              style={s.planStartBtn}
              onPress={() => navigation.navigate('PlanSelection')}
              activeOpacity={0.8}>
              <Text style={s.planStartText}>Create a Plan</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* ── Achievements ── */}
        <Text style={s.sectionTitle}>Achievements</Text>
        <View style={s.achieveGrid}>
          {ACHIEVEMENTS.map(({ icon, label, color }) => (
            <View key={label} style={s.achieveItem}>
              <View style={[s.achieveBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                <MaterialCommunityIcons name={icon} size={26} color={color} />
              </View>
              <Text style={s.achieveLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Avatar Selection ── */}
        <Text style={s.sectionTitle}>Choose Avatar</Text>
        <Card style={{ marginBottom: SP.xl }} padding={SP.lg}>
          <AvatarSelector selectedAvatar={selectedIndex} onSelectAvatar={selectAvatar} />
        </Card>

        {/* ── Illustration ── */}
        <View style={s.rewardRow}>
          <Image source={require('../../Elements/SuccessReward.png')} style={s.rewardImg} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.rewardTitle}>Keep it up!</Text>
            <Text style={s.rewardSub}>Discipline builds champions. Every rep counts.</Text>
          </View>
        </View>

        {/* ── Sign out ── */}
        <Button
          label="Sign Out"
          onPress={signOutUser}
          variant="outline"
          fullWidth
          style={{ marginTop: SP.sm }}
        />

      </ScrollView>
      <BottomNav current="Profile" navigation={navigation} />
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 96, paddingTop: SP.base },

  hero:       { alignItems: 'center', marginBottom: SP.xl },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 3, borderColor: D.primary, marginBottom: SP.md, ...SH.card },
  avatar:     { width: '100%', height: '100%' },
  name:       { fontSize: 22, fontWeight: '800', color: D.text, marginBottom: SP.xs },
  email:      { fontSize: 13, color: D.textMuted, marginBottom: SP.md },
  levelBadge: { backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 8 },
  levelText:  { color: D.onPrimary, fontSize: 13, fontWeight: '800' },

  xpCard:   { marginBottom: SP.xl },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpTitle:  { fontSize: 15, fontWeight: '700', color: D.text },
  xpVal:    { fontSize: 20, fontWeight: '900', color: D.primary },
  xpSub:    { fontSize: 12, color: D.textMuted, textAlign: 'right' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: D.text, marginBottom: SP.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, marginBottom: SP.xl },
  statCard:  { flex: 1, minWidth: '44%', backgroundColor: D.card, borderRadius: R.md, padding: SP.lg, alignItems: 'center', ...SH.soft },
  statValue: { fontSize: 26, fontWeight: '900', marginBottom: SP.xs },
  statLabel: { fontSize: 11, fontWeight: '700', color: D.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, marginBottom: SP.xl },
  achieveItem: { width: '30%', alignItems: 'center', gap: SP.sm },
  achieveBadge:{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  achieveLabel:{ fontSize: 11, fontWeight: '600', color: D.textMuted, textAlign: 'center' },

  // Plan section
  planCard:          { marginBottom: SP.xl },
  planHeader:        { flexDirection: 'row', alignItems: 'flex-start', gap: SP.md, marginBottom: SP.md },
  planTitle:         { fontSize: 16, fontWeight: '800', color: D.text, marginBottom: SP.xs },
  planMeta:          { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  planBadge:         { backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeText:     { color: D.onPrimary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  planWeek:          { fontSize: 12, color: D.textMuted, fontWeight: '600' },
  planProgressCircle:{ width: 52, height: 52, borderRadius: 26, backgroundColor: D.primaryLight, borderWidth: 2, borderColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  planProgressNum:   { fontSize: 16, fontWeight: '900', color: D.primary, lineHeight: 18 },
  planProgressOf:    { fontSize: 9, color: D.textMuted, fontWeight: '600' },
  planActions:       { flexDirection: 'row', gap: SP.md, marginTop: SP.lg, flexWrap: 'wrap' },
  planStartBtn:      { flex: 1, backgroundColor: D.primary, borderRadius: R.pill, paddingVertical: SP.md, alignItems: 'center', justifyContent: 'center' },
  planStartText:     { color: D.onPrimary, fontSize: 13, fontWeight: '700' },
  planViewBtn:       { flex: 1, backgroundColor: D.primaryLight, borderRadius: R.pill, paddingVertical: SP.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: D.primary + '55' },
  planViewText:      { color: D.primary, fontSize: 13, fontWeight: '700' },
  noPlanText:        { fontSize: 14, color: D.textMuted, marginBottom: SP.lg },

  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: SP.lg, backgroundColor: D.primaryLight, borderRadius: R.card, padding: SP.lg, marginBottom: SP.xl },
  rewardImg: { width: 80, height: 80 },
  rewardTitle:{ fontSize: 16, fontWeight: '800', color: D.primary, marginBottom: SP.xs },
  rewardSub:  { fontSize: 13, color: D.textMuted, lineHeight: 18 },
});
