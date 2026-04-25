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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ExerciseType } from '../types/pose';
import { signOutUser } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useFocusStore } from '../store/focusStore';
import { useXPStore } from '../store/xpStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { BottomNav } from '../components/ui/BottomNav';
import { AVATARS } from '../components/ui/AvatarSelector';
import { useAvatarStore } from '../store/avatarStore';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const EXERCISES: { type: ExerciseType; label: string; img: any }[] = [
  { type: 'pushup', label: 'Push-ups', img: require('../../Elements/pushup.png') },
  { type: 'situp',  label: 'Sit-ups',  img: require('../../Elements/situps.png') },
  { type: 'squat',  label: 'Squats',   img: require('../../Elements/squats.png') },
];

export function HomeScreen({ navigation }: Props) {
  const pendingSets = useFocusStore((s) => s.pendingSets);
  const user = useAuthStore((s) => s.user);
  const { xp, level } = useXPStore();
  const { selectedIndex } = useAvatarStore();
  const xpProgress = (xp % 100) / 100;
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Athlete';

  const go = (type: ExerciseType) => navigation.navigate('Exercise', { exerciseType: type });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>


        {/* ── Top Bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8} style={s.avatarBtn}>
            <View style={s.avatarWrap}>
              <Image source={AVATARS[selectedIndex]} style={s.avatar} resizeMode="cover" />
            </View>
          </TouchableOpacity>

          <View style={s.topMid}>
            <Text style={s.greeting}>Hello, {displayName.split(' ')[0]} 👋</Text>
            <View style={s.levelRow}>
              <View style={s.levelBadge}>
                <Text style={s.levelText}>Lv {level}</Text>
              </View>
              <Text style={s.xpText}>{xp} XP</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.notifBtn}
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.8}>
            <Image source={require('../../Elements/Icon(trophy).png')} style={s.notifIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* ── XP Progress ── */}
        <Card style={s.xpCard} padding={16}>
          <View style={s.xpRow}>
            <Text style={s.xpLabel}>Progress to Level {level + 1}</Text>
            <Text style={s.xpRight}>{xp % 100} / 100 XP</Text>
          </View>
          <ProgressBar progress={xpProgress} color={D.primary} height={8} style={{ marginTop: 8 }} />
        </Card>

        {/* ── Debt Alert ── */}
        {pendingSets > 0 && (
          <Card style={s.debtCard} padding={20} shadow>
            <View style={s.debtRow}>
              <View style={{ flex: 1 }}>
                <View style={s.debtBadge}>
                  <Text style={s.debtBadgeText}>DEBT DUE</Text>
                </View>
                <Text style={s.debtNum}>{pendingSets}</Text>
                <Text style={s.debtUnit}>set{pendingSets !== 1 ? 's' : ''} pending</Text>
              </View>
              <Image source={require('../../Elements/pushup.png')} style={s.debtImg} />
            </View>
            <Button
              label="Pay Off Debt →"
              onPress={() => navigation.navigate('DebtPay')}
              variant="danger"
              fullWidth
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* ── Focus Card ── */}
        <TouchableOpacity
          style={s.focusCard}
          onPress={() => navigation.navigate('FocusSetup')}
          activeOpacity={0.85}>
          <View style={s.focusContent}>
            <Text style={s.focusTag}>FOCUS MODE</Text>
            <Text style={s.focusTitle}>Start a Focus{'\n'}Session</Text>
            <Text style={s.focusDesc}>Block distractions. Build discipline.</Text>
            <View style={s.focusBtn}>
              <Text style={s.focusBtnText}>Let's Go →</Text>
            </View>
          </View>
          <Image source={require('../../Elements/FocusMode.png')} style={s.focusImg} />
        </TouchableOpacity>

        {/* ── Quick Start ── */}
        <Text style={s.sectionTitle}>Quick Start</Text>
        <View style={s.exerciseRow}>
          {EXERCISES.map(({ type, label, img }) => (
            <TouchableOpacity
              key={type}
              style={s.exCard}
              onPress={() => go(type)}
              activeOpacity={0.8}>
              <Image source={img} style={s.exImg} resizeMode="contain" />
              <Text style={s.exLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Explore ── */}
        <Text style={s.sectionTitle}>Explore</Text>
        <View style={s.exploreRow}>
          {[
            { icon: require('../../Elements/Icon(trophy).png'),  label: 'Leaderboard', screen: 'Leaderboard' as const },
            { icon: require('../../Elements/Icon(Timer).png'),   label: 'Fitness',     screen: 'Fitness'     as const },
            { icon: require('../../Elements/AiChatBot.png'),     label: 'Ask AI',      screen: 'AskAI'       as const },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={label}
              style={s.exploreCard}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.8}>
              <Image source={icon} style={s.exploreIcon} resizeMode="contain" />
              <Text style={s.exploreLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
      <BottomNav current="Home" navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 96, paddingTop: SP.lg },

  // Top bar
  topBar:    { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg, gap: SP.md },
  avatarBtn: { alignItems: 'center', justifyContent: 'center' },
  avatarWrap:{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2.5, borderColor: D.primary },
  avatar:    { width: 48, height: 48 },
  topMid:    { flex: 1, justifyContent: 'center' },
  greeting:  { fontSize: 16, fontWeight: '700', color: D.text },
  levelRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginTop: 4 },
  levelBadge:{ backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  levelText: { color: D.onPrimary, fontSize: 11, fontWeight: '800' },
  xpText:    { fontSize: 12, color: D.textMuted, fontWeight: '600' },
  notifBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: D.card, alignItems: 'center', justifyContent: 'center', ...SH.soft },
  notifIcon: { width: 24, height: 24, tintColor: D.primary },

  // XP card
  xpCard:  { marginBottom: SP.lg },
  xpRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: 13, fontWeight: '600', color: D.text },
  xpRight: { fontSize: 12, color: D.primary, fontWeight: '700' },

  // Debt
  debtCard:   { backgroundColor: D.dangerLight, marginBottom: SP.lg, borderWidth: 1.5, borderColor: D.danger, borderRadius: R.card },
  debtRow:    { flexDirection: 'row', alignItems: 'center' },
  debtBadge:  { alignSelf: 'flex-start', backgroundColor: D.danger, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: SP.sm },
  debtBadgeText:{ color: D.onDanger, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  debtNum:    { fontSize: 52, fontWeight: '900', color: D.danger, lineHeight: 56 },
  debtUnit:   { fontSize: 14, fontWeight: '600', color: D.danger, marginTop: 2 },
  debtImg:    { width: 90, height: 90, resizeMode: 'contain', marginLeft: 8 },

  // Focus card
  focusCard:   {
    backgroundColor: D.primary,
    borderRadius: R.cardLg,
    padding: SP.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SP.xl,
    overflow: 'hidden',
    ...SH.button,
  },
  focusContent:{ flex: 1 },
  focusTag:    { fontSize: 10, fontWeight: '800', color: D.primaryMuted, letterSpacing: 2, marginBottom: SP.sm },
  focusTitle:  { fontSize: 22, fontWeight: '800', color: D.onPrimary, lineHeight: 28, marginBottom: SP.sm },
  focusDesc:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: SP.lg },
  focusBtn:    { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 8 },
  focusBtnText:{ color: D.onPrimary, fontWeight: '700', fontSize: 14 },
  focusImg:    { width: 100, height: 100, resizeMode: 'contain', marginLeft: -8 },

  // Section
  sectionTitle:{ fontSize: 16, fontWeight: '800', color: D.text, marginBottom: SP.md, marginTop: SP.sm },

  // Exercise cards
  exerciseRow: { flexDirection: 'row', gap: SP.md, marginBottom: SP.xl },
  exCard:      { flex: 1, backgroundColor: D.card, borderRadius: R.card, paddingVertical: SP.lg, alignItems: 'center', ...SH.card },
  exImg:       { width: 56, height: 56, marginBottom: SP.sm },
  exLabel:     { fontSize: 12, fontWeight: '700', color: D.text, textAlign: 'center' },

  // Explore
  exploreRow:  { flexDirection: 'row', gap: SP.md, marginBottom: SP.xl },
  exploreCard: { flex: 1, backgroundColor: D.card, borderRadius: R.card, paddingVertical: SP.lg, paddingHorizontal: SP.sm, alignItems: 'center', gap: SP.sm, ...SH.soft },
  exploreIcon: { width: 40, height: 40 },
  exploreLabel:{ fontSize: 11, fontWeight: '700', color: D.text, textAlign: 'center' },
});
