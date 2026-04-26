import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';
import { GROQ_API_KEY } from '../config/keys';
import { buildAIPlan } from '../utils/planGenerator';
import { useExercisePlanStore } from '../store/exercisePlanStore';
import { ExercisePlan } from '../types/plan';

type Props = NativeStackScreenProps<RootStackParamList, 'AIPlanChat'>;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.1-8b-instant';

const WELCOME_TEXT =
  "Hi! I'll build a personalized workout plan just for you.\n\nFirst — what's your current fitness level? Tell me what exercises you can do and roughly how many reps you manage.";

const SYSTEM_PROMPT =
  'You are a fitness plan generator for FitCounter. Your first message already asked about fitness level.\n' +
  'Collect these remaining pieces ONE AT A TIME (do NOT re-ask what was already answered):\n' +
  '2. Available workout time per day in minutes.\n' +
  '3. Main fitness goal (lose weight / build muscle / improve endurance / general fitness).\n' +
  '4. Busy days — which days of the week should be rest days.\n\n' +
  'Ask only ONE question per reply. Be friendly and concise. Do NOT ask for fitness level again — it was already asked.\n\n' +
  'Once you have ALL answers (fitness level + time + goal + busy days), respond with EXACTLY this JSON and NOTHING ELSE:\n' +
  '{"plan":{"title":"Custom Fitness Plan","level":"beginner","weeklySchedule":[' +
  '{"day":"Monday","isRest":false,"focus":"Full Body","exercises":[' +
  '{"name":"Push-ups","sets":3,"reps":10,"rest":60},' +
  '{"name":"Squats","sets":3,"reps":15,"rest":60},' +
  '{"name":"Plank","sets":3,"duration":30,"rest":45}]},' +
  '{"day":"Tuesday","isRest":true,"focus":"Rest"},' +
  '{"day":"Wednesday","isRest":false,"focus":"Strength","exercises":[...]},' +
  '{"day":"Thursday","isRest":true,"focus":"Rest"},' +
  '{"day":"Friday","isRest":false,"focus":"Core","exercises":[...]},' +
  '{"day":"Saturday","isRest":true,"focus":"Rest"},' +
  '{"day":"Sunday","isRest":true,"focus":"Rest"}],' +
  '"progressionNote":"Add 1-2 reps each week."}}\n\n' +
  'RULES: Replace ALL example data with a real plan for the user. Include ALL 7 days. ' +
  'Make busy days isRest:true. Each workout day needs 3-5 exercises with sets (2-4), reps (8-20) or duration for planks, and rest seconds (30-90). ' +
  'Set level to beginner/intermediate/advanced. Output ONLY valid JSON when all info is collected — no other text, no markdown.';

interface GroqMsg { role: 'system' | 'user' | 'assistant'; content: string }
interface ChatMsg { id: number; role: 'user' | 'bot'; text: string; plan?: ExercisePlan }

function stripMarkdown(t: string): string {
  return t
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractPlanJson(text: string): Record<string, any> | null {
  const start = text.indexOf('{"plan"');
  if (start === -1) return null;
  let depth = 0, end = start;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed?.plan?.weeklySchedule?.length > 0) return parsed.plan;
    return null;
  } catch { return null; }
}

async function callGroq(history: GroqMsg[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      max_tokens: 1500,
      temperature: 0.5,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => String(res.status));
    throw new Error(`Groq ${res.status}: ${t}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? 'No response.';
}

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};
const LEVEL_COLOR: Record<string, string> = {
  beginner: D.accent, intermediate: D.primary, advanced: D.danger,
};

function PlanCard({ plan, onFollow }: { plan: ExercisePlan; onFollow: () => void }) {
  const workoutDays = plan.weeks[0]?.days.filter((d) => !d.isRestDay) ?? [];
  const levelColor = LEVEL_COLOR[plan.level] ?? D.primary;
  return (
    <View style={pc.card}>
      <View style={pc.cardHeader}>
        <MaterialCommunityIcons name="dumbbell" size={18} color={D.primary} />
        <Text style={pc.planTitle} numberOfLines={2}>{plan.title}</Text>
      </View>
      <View style={[pc.levelBadge, { backgroundColor: levelColor + '22' }]}>
        <Text style={[pc.levelText, { color: levelColor }]}>{plan.level.toUpperCase()}</Text>
      </View>
      <View style={pc.dayRow}>
        {workoutDays.map((day, i) => (
          <View key={i} style={pc.dayChip}>
            <Text style={pc.dayName}>{DAY_SHORT[['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][day.dayIndex]] ?? day.dayIndex}</Text>
            <Text style={pc.dayFocus} numberOfLines={1}>{day.focus}</Text>
            <Text style={pc.dayMeta}>{day.exercises.length} ex</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={pc.followBtn} onPress={onFollow} activeOpacity={0.8}>
        <MaterialCommunityIcons name="calendar-check" size={16} color={D.onPrimary} />
        <Text style={pc.followText}>Follow This Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const pc = StyleSheet.create({
  card:       { backgroundColor: D.card, borderRadius: R.card, padding: SP.lg, marginTop: SP.sm, borderWidth: 1.5, borderColor: D.primaryMuted, ...SH.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
  planTitle:  { fontSize: 15, fontWeight: '800', color: D.text, flex: 1 },
  levelBadge: { alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: SP.md },
  levelText:  { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dayRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.lg },
  dayChip:    { backgroundColor: D.primaryLight, borderRadius: R.md, paddingHorizontal: SP.sm, paddingVertical: SP.xs, alignItems: 'center', minWidth: 48 },
  dayName:    { fontSize: 11, fontWeight: '800', color: D.primary },
  dayFocus:   { fontSize: 10, color: D.textMuted, maxWidth: 56 },
  dayMeta:    { fontSize: 9, color: D.textLight },
  followBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, backgroundColor: D.primary, borderRadius: R.pill, paddingVertical: SP.md, ...SH.button },
  followText: { fontSize: 14, fontWeight: '800', color: D.onPrimary },
});

export function AIPlanChatScreen({ navigation }: Props) {
  const WELCOME: ChatMsg = { id: 0, role: 'bot', text: WELCOME_TEXT };
  const [messages,  setMessages]  = useState<ChatMsg[]>([WELCOME]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const scrollRef   = useRef<ScrollView>(null);
  const idRef       = useRef(1);
  const setActivePlan = useExercisePlanStore((s) => s.setActivePlan);

  // Seed history with welcome so AI knows Q1 was already asked
  const historyRef = useRef<GroqMsg[]>([
    { role: 'assistant', content: WELCOME_TEXT },
  ]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading || planSaved) return;

    setMessages((prev) => [...prev, { id: idRef.current++, role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    historyRef.current = [...historyRef.current, { role: 'user', content: q }];
    if (historyRef.current.length > 22) historyRef.current = historyRef.current.slice(-22);

    let botMsg: ChatMsg;

    try {
      const raw = await callGroq(historyRef.current);
      const planJson = extractPlanJson(raw);

      if (planJson) {
        try {
          const plan = buildAIPlan(planJson, { timePerDayMinutes: 30, currentWeightKg: 0, goalWeightKg: 0, heightCm: 0 });
          botMsg = {
            id: idRef.current++,
            role: 'bot',
            text: `Your personalised plan "${plan.title}" is ready! Review it below and tap Follow to add it to your schedule.`,
            plan,
          };
          setPlanSaved(true);
        } catch {
          botMsg = { id: idRef.current++, role: 'bot', text: 'I generated a plan but had trouble parsing it. Please try again.' };
        }
      } else {
        botMsg = { id: idRef.current++, role: 'bot', text: stripMarkdown(raw) };
      }

      historyRef.current = [...historyRef.current, { role: 'assistant', content: raw }];
    } catch (err) {
      botMsg = { id: idRef.current++, role: 'bot', text: `Something went wrong: ${err instanceof Error ? err.message : 'Check your connection.'}` };
    }

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleFollow = (plan: ExercisePlan) => {
    setActivePlan(plan);
    navigation.replace('ExercisePlan');
  };

  return (
    <AppBackground variant={2}>
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Image source={require('../../Elements/AiChatBot.png')} style={s.botIcon} resizeMode="cover" />
            <View>
              <Text style={s.headerTitle}>AI Plan Generator</Text>
              <Text style={s.headerSub}>Powered by Groq</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={s.msgContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((msg) => (
            <View key={msg.id} style={[s.msgRow, msg.role === 'user' ? s.msgRowUser : s.msgRowBot]}>
              {msg.role === 'bot' && (
                <Image source={require('../../Elements/AiChatBot.png')} style={s.avatar} resizeMode="cover" />
              )}
              <View style={{ flex: 1 }}>
                <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                  <Text style={[s.bubbleText, msg.role === 'user' ? s.bubbleTxtUser : s.bubbleTxtBot]}>
                    {msg.text}
                  </Text>
                </View>
                {msg.plan && (
                  <PlanCard plan={msg.plan} onFollow={() => handleFollow(msg.plan!)} />
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={[s.msgRow, s.msgRowBot]}>
              <Image source={require('../../Elements/AiChatBot.png')} style={s.avatar} resizeMode="cover" />
              <View style={[s.bubble, s.bubbleBot]}>
                <ActivityIndicator color={D.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        {planSaved ? (
          <View style={s.savedBar}>
            <Feather name="check-circle" size={18} color={D.accent} />
            <Text style={s.savedText}>Plan ready — tap "Follow This Plan" above</Text>
          </View>
        ) : (
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Answer here..."
              placeholderTextColor={D.textLight}
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
              onPress={send}
              disabled={!input.trim() || loading}
              activeOpacity={0.75}>
              <Feather name="send" size={20} color={D.onPrimary} />
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.base, borderBottomWidth: 1, borderColor: D.border, backgroundColor: D.card },
  backBtn:      { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  botIcon:      { width: 40, height: 40, borderRadius: 20, backgroundColor: D.primaryLight },
  headerTitle:  { fontSize: 14, fontWeight: '800', color: D.text },
  headerSub:    { fontSize: 10, color: D.textMuted },

  msgList:    { flex: 1 },
  msgContent: { paddingHorizontal: SP.xl, paddingVertical: SP.lg, gap: SP.md },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, maxWidth: '92%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot:  { alignSelf: 'flex-start' },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: D.primaryLight, marginTop: 2 },

  bubble:        { borderRadius: R.card, paddingHorizontal: SP.base, paddingVertical: SP.md },
  bubbleUser:    { backgroundColor: D.primary, borderBottomRightRadius: 4, ...SH.soft },
  bubbleBot:     { backgroundColor: D.card, borderBottomLeftRadius: 4, minWidth: 48, alignItems: 'center', ...SH.soft },
  bubbleText:    { fontSize: 14, lineHeight: 21 },
  bubbleTxtUser: { color: D.onPrimary },
  bubbleTxtBot:  { color: D.text },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    paddingHorizontal: SP.xl, paddingVertical: SP.md,
    borderTopWidth: 1, borderColor: D.border, backgroundColor: D.card,
  },
  input: {
    flex: 1, backgroundColor: D.bg, borderRadius: R.md,
    paddingHorizontal: SP.base, paddingVertical: SP.md,
    fontSize: 14, color: D.text, maxHeight: 100,
    borderWidth: 1.5, borderColor: D.border,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', ...SH.button },
  sendBtnOff: { backgroundColor: D.border, shadowOpacity: 0, elevation: 0 },

  savedBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.base, borderTopWidth: 1, borderColor: D.border, backgroundColor: D.accentLight },
  savedText: { flex: 1, fontSize: 13, fontWeight: '600', color: D.accentDark },
});
