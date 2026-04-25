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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'AskAI'>;

// Physical phone uses machine's LAN IP; change if your IP changes
const BACKEND_URL = 'http://192.168.0.103:3000';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

async function askQuestion(question: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const data = await res.json();
  return data.answer ?? '';
}

const WELCOME: Message = {
  id: 0,
  role: 'bot',
  text: "Hi! I'm your AI fitness coach 💪 Ask me anything about your workouts, form tips, or how to stay focused!",
};

export function AskAIScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(1);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: idRef.current++, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const answer = await askQuestion(q);
      setMessages((prev) => [...prev, { id: idRef.current++, role: 'bot', text: answer }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: 'bot', text: `⚠️ ${e?.message ?? 'Something went wrong. Is the backend running?'}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Image source={require('../../Elements/AiChatBot.png')} style={s.botIcon} />
            <View>
              <Text style={s.headerTitle}>AI Coach</Text>
              <Text style={s.headerSub}>Always here to help</Text>
            </View>
          </View>
          <View style={{ width: 50 }} />
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
                <Image source={require('../../Elements/AiChatBot.png')} style={s.botAvatar} />
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
              <Image source={require('../../Elements/AiChatBot.png')} style={s.botAvatar} />
              <View style={s.bubbleBot}>
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
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.75}>
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.xl, paddingVertical: SP.base, borderBottomWidth: 1, borderColor: D.border },
  back:         { color: D.primary, fontSize: 15, fontWeight: '600', minWidth: 50 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  botIcon:      { width: 40, height: 40, borderRadius: 20 },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: D.text },
  headerSub:    { fontSize: 11, color: D.textMuted },

  msgList:    { flex: 1 },
  msgContent: { paddingHorizontal: SP.xl, paddingVertical: SP.lg, gap: SP.md },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: SP.sm, maxWidth: '85%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowBot:  { alignSelf: 'flex-start' },
  botAvatar:  { width: 30, height: 30, borderRadius: 15 },

  bubble:        { borderRadius: R.card, paddingHorizontal: SP.base, paddingVertical: SP.md, maxWidth: '100%' },
  bubbleUser:    { backgroundColor: D.primary, borderBottomRightRadius: 4, ...SH.soft },
  bubbleBot:     { backgroundColor: D.card, borderBottomLeftRadius: 4, ...SH.soft },
  bubbleText:    { fontSize: 14, lineHeight: 21 },
  bubbleTextUser:{ color: D.onPrimary },
  bubbleTextBot: { color: D.text },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  sendIcon:   { color: D.onPrimary, fontSize: 18, fontWeight: '800' },
});
