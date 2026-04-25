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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';
import { GROQ_API_KEY } from '../config/keys';
import { buildAIPlan } from '../utils/planGenerator';
import { useExercisePlanStore } from '../store/exercisePlanStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AIPlanChat'>;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT =
  'You are a fitness plan generator for FitCounter. Collect these 4 pieces of information ONE AT A TIME:\n' +
  '1. Current fitness level — ask what exercises they can do and how many reps they manage.\n' +
  '2. Available workout time per day in minutes.\n' +
  '3. Main fitness goal (lose weight / build muscle / improve endurance / general fitness).\n' +
  '4. Busy days — which days of the week should be rest days (no workouts).\n\n' +
  'Ask ONE question at a time. Be friendly and concise.\n\n' +
  'Once you have ALL 4 answers, respond with EXACTLY this JSON and NOTHING ELSE:\n' +
  '{"plan":{"title":"Custom Fitness Plan","level":"beginner","weeklySchedule":[' +
  '{"day":"Monday","isRest":false,"focus":"Full Body","exercises":[' +
  '{"name":"Push-ups","sets":3,"reps":10,"rest":60},' +
  '{"name":"Squats","sets":3,"reps":15,"rest":60},' +
  '{"name":"Sit-ups","sets":3,"reps":12,"rest":60},' +
  '{"name":"Plank","sets":3,"duration":30,"rest":45}]},' +
  '{"day":"Tuesday","isRest":true,"focus":"Rest"},' +
  '{"day":"Wednesday","isRest":false,"focus":"Strength","exercises":[...]},' +
  '{"day":"Thursday","isRest":true,"focus":"Rest"},' +
  '{"day":"Friday","isRest":false,"focus":"Core","exercises":[...]},' +
  '{"day":"Saturday","isRest":true,"focus":"Rest"},' +
  '{"day":"Sunday","isRest":true,"focus":"Rest"}],' +
  '"progressionNote":"Add 1-2 reps each week."}}\n\n' +
  'RULES: Replace example data with a plan for the user. Include ALL 7 days. Make busy days isRest:true. ' +
  'Each workout day needs 3-5 exercises with sets (2-4), reps (8-20) or duration for planks, and rest seconds (30-90). ' +
  'Set level to beginner/intermediate/advanced based on their answers. ' +
  'Output ONLY the JSON when you have all 4 answers — no other text.';

interface GroqMsg  { role: 'system' | 'user' | 'assistant'; content: string }
interface ChatMsg  { id: number; role: 'user' | 'bot'; text: string; isPlan?: boolean }

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
  let depth = 0;
  let end   = start;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed?.plan?.weeklySchedule?.length > 0) return parsed.plan;
    return null;
  } catch {
    return null;
  }
}

async function callGroq(history: GroqMsg[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => String(res.status));
    throw new Error(`Groq ${res.status}: ${t}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? 'No response.';
}

const WELCOME: ChatMsg = {
  id: 0,
  role: 'bot',
  text: "Hi! I'll build a personalized workout plan just for you.\n\nFirst — what's your current fitness level? Tell me what exercises you can do and roughly how many reps you manage.",
};

export function AIPlanChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const scrollRef   = useRef<ScrollView>(null);
  const idRef       = useRef(1);
  const historyRef  = useRef<GroqMsg[]>([]);
  const setActivePlan = useExercisePlanStore((s) => s.setActivePlan);

  const send = async () => {
    const q = input.trim();
    if (!q || loading || planSaved) return;

    const userMsg: ChatMsg = { id: idRef.current++, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    historyRef.current = [...historyRef.current, { role: 'user', content: q }];
    if (historyRef.current.length > 20) historyRef.current = historyRef.current.slice(-20);

    let botText = '';
    let planDetected = false;

    try {
      const raw = await callGroq(historyRef.current);
      const planJson = extractPlanJson(raw);

      if (planJson) {
        planDetected = true;
        try {
          const plan = buildAIPlan(planJson, {
            timePerDayMinutes: 30,
            currentWeightKg:   0,
            goalWeightKg:      0,
            heightCm:          0,
          });
          setActivePlan(plan);
          setPlanSaved(true);
          botText = `Your plan "${plan.title ?? 'AI Custom Plan'}" is ready! Tap "View Plan" below to see your weekly schedule.`;
        } catch {
          botText = 'I generated a plan but had trouble saving it. Please try again.';
          planDetected = false;
        }
      } else {
        botText = stripMarkdown(raw);
      }

      historyRef.current = [...historyRef.current, { role: 'assistant', content: raw }];
    } catch (err: unknown) {
      botText = `⚠️ ${err instanceof Error ? err.message : 'Something went wrong. Check your connection.'}`;
    }

    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: 'bot', text: botText, isPlan: planDetected },
    ]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
              <Text style={s.headerSub}>Powered by Groq · mentions busy days → rest days</Text>
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
              <View>
                <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                  <Text style={[s.bubbleText, msg.role === 'user' ? s.bubbleTxtUser : s.bubbleTxtBot]}>
                    {msg.text}
                  </Text>
                </View>
                {msg.isPlan && (
                  <TouchableOpacity
                    style={s.viewPlanBtn}
                    onPress={() => navigation.replace('ExercisePlan')}
                    activeOpacity={0.8}>
                    <Text style={s.viewPlanText}>View Plan →</Text>
                    <Feather name="arrow-right" size={14} color={D.onPrimary} />
                  </TouchableOpacity>
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
            <Text style={s.savedText}>Plan saved!</Text>
            <TouchableOpacity
              style={s.savedBtn}
              onPress={() => navigation.replace('ExercisePlan')}
              activeOpacity={0.8}>
              <Text style={s.savedBtnText}>View Plan</Text>
            </TouchableOpacity>
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

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, maxWidth: '88%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot:  { alignSelf: 'flex-start' },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: D.primaryLight },

  bubble:        { borderRadius: R.card, paddingHorizontal: SP.base, paddingVertical: SP.md, maxWidth: '100%' },
  bubbleUser:    { backgroundColor: D.primary, borderBottomRightRadius: 4, ...SH.soft },
  bubbleBot:     { backgroundColor: D.card, borderBottomLeftRadius: 4, minWidth: 48, alignItems: 'center', ...SH.soft },
  bubbleText:    { fontSize: 14, lineHeight: 21 },
  bubbleTxtUser: { color: D.onPrimary },
  bubbleTxtBot:  { color: D.text },

  viewPlanBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: D.accent, borderRadius: R.pill, paddingHorizontal: SP.base, paddingVertical: SP.sm, marginTop: SP.sm, alignSelf: 'flex-start', ...SH.soft },
  viewPlanText: { color: D.onPrimary, fontSize: 13, fontWeight: '700' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    paddingHorizontal: SP.xl,
    paddingVertical: SP.md,
    borderTopWidth: 1,
    borderColor: D.border,
    backgroundColor: D.card,
  },
  input: {
    flex: 1,
    backgroundColor: D.bg,
    borderRadius: R.md,
    paddingHorizontal: SP.base,
    paddingVertical: SP.md,
    fontSize: 14,
    color: D.text,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: D.border,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', ...SH.button },
  sendBtnOff: { backgroundColor: D.border, shadowOpacity: 0, elevation: 0 },

  savedBar:     { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.base, borderTopWidth: 1, borderColor: D.border, backgroundColor: D.card },
  savedText:    { flex: 1, fontSize: 14, fontWeight: '600', color: D.accent },
  savedBtn:     { backgroundColor: D.primary, borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  savedBtnText: { color: D.onPrimary, fontSize: 13, fontWeight: '700' },
});
