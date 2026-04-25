import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useXPStore, LeaderboardEntry } from '../store/xpStore';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { BottomNav } from '../components/ui/BottomNav';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

const AVATARS = [
  require('../../Elements/Avatar1.png'),
  require('../../Elements/Avatar2.png'),
  require('../../Elements/Avatar3.png'),
  require('../../Elements/Avatar4.png'),
  require('../../Elements/Avatar5.png'),
  require('../../Elements/Avatar6.png'),
];

function getMedalColor(rank: number): string | null {
  if (rank === 0) return D.gold;
  if (rank === 1) return D.silver;
  if (rank === 2) return D.bronze;
  return null;
}

function TopThree({ entries, myUid }: { entries: LeaderboardEntry[]; myUid?: string }) {
  const order = [1, 0, 2]; // display: 2nd, 1st, 3rd
  const heights = [80, 110, 60];

  return (
    <View style={t.podiumRow}>
      {order.map((pos) => {
        const entry = entries[pos];
        if (!entry) return <View key={pos} style={{ flex: 1 }} />;
        const color = getMedalColor(pos)!;
        const isMe = entry.uid === myUid;
        return (
          <View key={pos} style={t.podiumItem}>
            <View style={[t.avatarWrap, isMe && { borderColor: D.primary, borderWidth: 2.5 }]}>
              <Image source={AVATARS[pos % AVATARS.length]} style={t.avatar} />
            </View>
            <Text style={t.podiumName} numberOfLines={1}>
              {entry.displayName.split(' ')[0]}{isMe ? ' 👤' : ''}
            </Text>
            <Text style={t.podiumXP}>{entry.xp} XP</Text>
            <View style={[t.podiumBar, { height: heights[order.indexOf(pos)], backgroundColor: color }]}>
              <Text style={t.podiumRank}>{pos + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LeaderboardRow({ item, rank, isMe }: { item: LeaderboardEntry; rank: number; isMe: boolean }) {
  const medal = getMedalColor(rank);
  return (
    <View style={[r.row, isMe && r.rowMe]}>
      {medal ? (
        <View style={[r.medal, { backgroundColor: medal }]}>
          <Text style={r.medalText}>{rank + 1}</Text>
        </View>
      ) : (
        <Text style={r.rankNum}>#{rank + 1}</Text>
      )}
      <Image source={AVATARS[rank % AVATARS.length]} style={r.avatar} />
      <View style={r.info}>
        <Text style={[r.name, isMe && { color: D.primary }]} numberOfLines={1}>
          {item.displayName}{isMe ? ' (you)' : ''}
        </Text>
        <Text style={r.level}>Level {item.level}</Text>
      </View>
      <View style={r.xpBadge}>
        <Text style={r.xpText}>{item.xp}</Text>
        <Text style={r.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

export function LeaderboardScreen({ navigation }: Props) {
  const { leaderboard, isLoadingLeaderboard, leaderboardError, fetchLeaderboard } = useXPStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { fetchLeaderboard(); }, []);

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ width: 50 }} />
        <Text style={s.title}>Leaderboard</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoadingLeaderboard ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={D.primary} size="large" />
      ) : leaderboardError ? (
        <View style={s.errorBlock}>
          <Image source={require('../../Elements/SomeThingWrong.png')} style={s.errorImg} resizeMode="contain" />
          <Text style={s.errorText}>Could not load leaderboard.</Text>
          <TouchableOpacity onPress={fetchLeaderboard} activeOpacity={0.7} style={s.retryBtn}>
            <Text style={s.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.uid}
          ListHeaderComponent={
            <>
              <View style={s.podiumSection}>
                <View style={s.podiumHeroWrap}>
                  <Image source={require('../../Elements/VictoryPodiumNew.png')} style={s.podiumHero} resizeMode="cover" />
                </View>
                {leaderboard.length >= 3 && (
                  <TopThree entries={leaderboard} myUid={user?.uid} />
                )}
              </View>
              <Text style={s.listTitle}>ALL RANKINGS</Text>
            </>
          }
          renderItem={({ item, index }) => (
            <LeaderboardRow item={item} rank={index} isMe={item.uid === user?.uid} />
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyBlock}>
              <Text style={s.emptyText}>No data yet. Complete sessions to earn XP!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <BottomNav current="Leaderboard" navigation={navigation} />
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: 'transparent' },
  header:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.xl, paddingVertical: SP.base },
  back:  { color: D.primary, fontSize: 15, fontWeight: '600', minWidth: 50 },
  title: { fontSize: 20, fontWeight: '800', color: D.text },

  podiumSection: { alignItems: 'center', paddingHorizontal: SP.xl, paddingTop: SP.base, marginBottom: SP.xl },
  podiumHeroWrap: { width: '100%', height: 240, borderRadius: 20, overflow: 'hidden', marginBottom: SP.md },
  podiumHero:    { width: '100%', height: '100%' },

  listTitle:{ fontSize: 11, fontWeight: '800', color: D.textMuted, letterSpacing: 2, paddingHorizontal: SP.xl, marginBottom: SP.md },
  list:     { paddingHorizontal: SP.xl, paddingBottom: 96, gap: SP.sm },

  emptyBlock:{ paddingTop: 40, alignItems: 'center' },
  emptyText: { color: D.textMuted, fontSize: 14, textAlign: 'center' },

  errorBlock:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  errorImg:  { width: 140, height: 120, marginBottom: SP.lg },
  errorText: { color: D.textMuted, fontSize: 15, marginBottom: SP.md },
  retryBtn:  { backgroundColor: D.primaryLight, borderRadius: 999, paddingHorizontal: SP.xl, paddingVertical: SP.md },
  retryText: { color: D.primary, fontWeight: '700', fontSize: 14 },
});

const t = StyleSheet.create({
  podiumRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: SP.base, width: '100%' },
  podiumItem: { flex: 1, alignItems: 'center', gap: SP.xs },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 2, borderColor: D.border },
  avatar:     { width: '100%', height: '100%' },
  podiumName: { fontSize: 11, fontWeight: '700', color: D.text, textAlign: 'center' },
  podiumXP:   { fontSize: 11, color: D.textMuted, fontWeight: '600' },
  podiumBar:  { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  podiumRank: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

const r = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: D.card, borderRadius: R.md, padding: SP.md, gap: SP.md, ...SH.soft },
  rowMe:   { borderWidth: 2, borderColor: D.primary, backgroundColor: D.primaryLight },
  medal:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  medalText:{ color: '#fff', fontWeight: '800', fontSize: 13 },
  rankNum: { width: 30, textAlign: 'center', color: D.textMuted, fontSize: 13, fontWeight: '600' },
  avatar:  { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  info:    { flex: 1 },
  name:    { fontSize: 14, fontWeight: '700', color: D.text },
  level:   { fontSize: 11, color: D.textMuted, marginTop: 2 },
  xpBadge: { backgroundColor: D.primaryLight, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  xpText:  { fontSize: 15, fontWeight: '800', color: D.primary },
  xpLabel: { fontSize: 9, fontWeight: '700', color: D.primaryMuted, letterSpacing: 1 },
});
