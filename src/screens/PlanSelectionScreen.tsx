import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanSelection'>;

const OPTIONS = [
  {
    key: 'instructor' as const,
    icon: require('../../Elements/pushup.png'),
    title: 'Instructor Plan',
    sub: 'Structured beginner, intermediate & advanced programs tailored to your schedule and goals.',
    badge: 'Recommended',
    badgeColor: D.primary,
    screen: 'InstructorPlanSetup' as const,
  },
  {
    key: 'ai' as const,
    icon: require('../../Elements/AiChatBot.png'),
    title: 'AI-Powered Plan',
    sub: 'Describe your situation to the AI coach and get a fully custom plan generated just for you.',
    badge: 'Smart',
    badgeColor: D.accent,
    screen: 'AIPlanChat' as const,
  },
];

export function PlanSelectionScreen({ navigation }: Props) {
  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.tag}>EXERCISE PLANS</Text>
            <Text style={s.title}>Choose Your Path</Text>
          </View>
        </View>

        <Text style={s.sub}>Pick how you want to receive your workout plan.</Text>

        {/* Option cards */}
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={s.card}
            activeOpacity={0.82}
            onPress={() => navigation.navigate(opt.screen as any)}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}>
                <Image source={opt.icon} style={s.icon} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.titleRow}>
                  <Text style={s.cardTitle}>{opt.title}</Text>
                  <View style={[s.badge, { backgroundColor: opt.badgeColor + '22', borderColor: opt.badgeColor + '55' }]}>
                    <Text style={[s.badgeText, { color: opt.badgeColor }]}>{opt.badge}</Text>
                  </View>
                </View>
                <Text style={s.cardSub}>{opt.sub}</Text>
              </View>
            </View>
            <View style={s.cardArrow}>
              <Text style={s.cardArrowLabel}>Get Started</Text>
            </View>
          </TouchableOpacity>
        ))}

      </View>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, paddingHorizontal: SP.xl, paddingTop: SP.lg },

  header:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.lg },
  backBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  tag:     { fontSize: 10, fontWeight: '800', color: D.primary, letterSpacing: 2, marginBottom: 2 },
  title:   { fontSize: 24, fontWeight: '800', color: D.text },
  sub:     { fontSize: 14, color: D.textMuted, marginBottom: SP.xl, lineHeight: 20 },

  card: {
    backgroundColor: D.card,
    borderRadius: R.cardLg,
    padding: SP.xl,
    marginBottom: SP.lg,
    ...SH.card,
  },
  cardTop:   { flexDirection: 'row', gap: SP.lg, marginBottom: SP.lg },
  iconWrap:  { width: 64, height: 64, borderRadius: R.card, backgroundColor: D.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  icon:      { width: 56, height: 56 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.xs, flexWrap: 'wrap' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: D.text },
  cardSub:   { fontSize: 13, color: D.textMuted, lineHeight: 19 },
  badge:     { borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  cardArrow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SP.sm, borderTopWidth: 1, borderColor: D.border, paddingTop: SP.md },
  cardArrowLabel: { fontSize: 13, fontWeight: '700', color: D.primary },
});
