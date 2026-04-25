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

type Props = NativeStackScreenProps<RootStackParamList, 'AskAI'>;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT =
  'You are FitCoach AI, a friendly and motivating fitness coach inside the FitCounter app. ' +
  'Give practical, concise advice about exercise form, workout plans, and motivation. ' +
  'Be encouraging. Always finish your response completely — never stop mid-sentence. ' +
  'Keep your response within 1024 tokens so it is never cut off. ' +
  'IMPORTANT: Reply in plain text only. Do NOT use markdown, asterisks, bold, italics, bullet dashes, or any formatting symbols.';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')           // ## headings
    .replace(/\*\*(.+?)\*\*/g, '$1')     // **bold**
    .replace(/\*(.+?)\*/g, '$1')         // *italic*
    .replace(/__(.+?)__/g, '$1')         // __bold__
    .replace(/_(.+?)_/g, '$1')           // _italic_
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // `code` / ```blocks```
    .replace(/^\s*[-*+]\s+/gm, '• ')    // - bullet → •
    .replace(/^\s*\d+\.\s+/gm, '')      // 1. numbered list
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // [link](url)
    .replace(/\n{3,}/g, '\n\n')         // collapse excess blank lines
    .trim();
}

async function callGroq(history: GroqMessage[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(`Groq ${res.status}: ${text}`);
  }
  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content as string) ?? 'No response received.';
  return stripMarkdown(raw);
}

const WELCOME: Message = {
  id: 0,
  role: 'bot',
  text: "Hi! I'm your AI fitness coach 💪 Ask me anything about workouts, form tips, or staying focused!",
};

export function AskAIScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(1);
  const historyRef = useRef<GroqMessage[]>([]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: idRef.current++, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    historyRef.current = [...historyRef.current, { role: 'user', content: q }];

    let botText = '';
    try {
      botText = await callGroq(historyRef.current);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: botText }];
      // keep history bounded to last 20 turns
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }
    } catch (err: unknown) {
      botText = `⚠️ ${err instanceof Error ? err.message : 'Something went wrong. Check your connection.'}`;
    }

    const botId = idRef.current++;
    setMessages((prev) => [...prev, { id: botId, role: 'bot', text: botText }]);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <AppBackground variant={2}>
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
            <Feather name="chevron-left" size={26} color={D.primary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Image source={require('../../Elements/AiChatBot.png')} style={s.botIcon} resizeMode="cover" />
            <View style={s.headerTextWrap}>
              <Text style={s.headerTitle}>AI Coach</Text>
              <Text style={s.headerSub}>Powered by Groq</Text>
            </View>
          </View>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={s.msgContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((msg) => (
            <View key={msg.id} style={[s.msgRow, msg.role === 'user' ? s.msgRowUser : s.msgRowBot]}>
              {msg.role === 'bot' && (
                <Image source={require('../../Elements/AiChatBot.png')} style={s.botAvatar} resizeMode="cover" />
              )}
              <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleText, msg.role === 'user' ? s.bubbleTextUser : s.bubbleTextBot]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={[s.msgRow, s.msgRowBot]}>
              <Image source={require('../../Elements/AiChatBot.png')} style={s.botAvatar} resizeMode="cover" />
              <View style={[s.bubble, s.bubbleBot]}>
                <ActivityIndicator color={D.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input ── */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about fitness, form, focus..."
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

      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.base, borderBottomWidth: 1, borderColor: D.border, backgroundColor: D.card },
  backBtn:      { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  headerTextWrap: { alignItems: 'flex-start' },
  botIcon:      { width: 40, height: 40, borderRadius: 20, backgroundColor: D.primaryLight },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: D.text },
  headerSub:    { fontSize: 11, color: D.textMuted },

  msgList:    { flex: 1 },
  msgContent: { paddingHorizontal: SP.xl, paddingVertical: SP.lg, gap: SP.md },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, maxWidth: '85%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot:  { alignSelf: 'flex-start' },
  botAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: D.primaryLight },

  bubble:         { borderRadius: R.card, paddingHorizontal: SP.base, paddingVertical: SP.md, maxWidth: '100%' },
  bubbleUser:     { backgroundColor: D.primary, borderBottomRightRadius: 4, ...SH.soft },
  bubbleBot:      { backgroundColor: D.card, borderBottomLeftRadius: 4, minWidth: 48, alignItems: 'center', ...SH.soft },
  bubbleText:     { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: D.onPrimary },
  bubbleTextBot:  { color: D.text },

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
});
