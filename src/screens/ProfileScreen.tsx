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
import { RootStackParamList } from '../types/pose';
import { useAuthStore } from '../store/authStore';
import { useXPStore, calcLevel } from '../store/xpStore';
import { useFocusStore } from '../store/focusStore';
import { signOutUser } from '../services/authService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { BottomNav } from '../components/ui/BottomNav';
import { AvatarSelector, AVATARS } from '../components/ui/AvatarSelector';
import { useAvatarStore } from '../store/avatarStore';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ACHIEVEMENTS = [
  { icon: '🏆', label: 'First Session',  color: D.gold },
  { icon: '🔥', label: '7-Day Streak',   color: '#FF6B6B' },
  { icon: '💪', label: '100 Reps',       color: D.primary },
  { icon: '🎯', label: 'Zero Violations', color: D.accent },
  { icon: '⚡', label: 'Fast Finisher',  color: D.warning },
  { icon: '🧘', label: 'Focused Mind',   color: '#9B59B6' },
];

export function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { xp, level } = useXPStore();
  const { pendingSets } = useFocusStore();
  const { selectedIndex, selectAvatar } = useAvatarStore();
  const xpProgress = (xp % 100) / 100;
  const xpToNext = 100 - (xp % 100);

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Athlete';
  const email = user?.email ?? '';

  return (
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

        {/* ── Achievements ── */}
        <Text style={s.sectionTitle}>Achievements</Text>
        <View style={s.achieveGrid}>
          {ACHIEVEMENTS.map(({ icon, label, color }) => (
            <View key={label} style={s.achieveItem}>
              <View style={[s.achieveBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                <Text style={s.achieveIcon}>{icon}</Text>
              </View>
              <Text style={s.achieveLabel}>{label}</Text>
            </View>
          ))}
        </View>

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
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 96, paddingTop: SP.base },

  backBtn:  { alignSelf: 'flex-start', marginBottom: SP.base },
  backText: { color: D.primary, fontSize: 15, fontWeight: '600' },

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
  achieveIcon: { fontSize: 24 },
  achieveLabel:{ fontSize: 11, fontWeight: '600', color: D.textMuted, textAlign: 'center' },

  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: SP.lg, backgroundColor: D.primaryLight, borderRadius: R.card, padding: SP.lg, marginBottom: SP.xl },
  rewardImg: { width: 80, height: 80 },
  rewardTitle:{ fontSize: 16, fontWeight: '800', color: D.primary, marginBottom: SP.xs },
  rewardSub:  { fontSize: 13, color: D.textMuted, lineHeight: 18 },
});
