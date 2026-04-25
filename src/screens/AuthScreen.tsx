import React, { useMemo, useState } from 'react';
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
import { isGoogleAuthConfigured } from '../config/auth';
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  toAuthErrorMessage,
} from '../services/authService';
import { D, SP, R, SH } from '../theme/design';

type AuthMode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSignup = mode === 'signup';
  const googleReady = useMemo(() => isGoogleAuthConfigured(), []);

  async function handleEmailAuth() {
    setError(null);
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    if (isSignup) {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setIsLoading(true);
    try {
      if (isSignup) await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (e) {
      setError(toAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(toAuthErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Branding ── */}
          <View style={s.brandRow}>
            <Image source={require('../../Elements/Onboarding.png')} style={s.brandImg} resizeMode="contain" />
          </View>
          <Text style={s.appName}>FitCounter</Text>
          <Text style={s.tagline}>Focus. Train. Conquer.</Text>

          {/* ── Mode toggle ── */}
          <View style={s.toggle}>
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.toggleBtn, mode === m && s.toggleBtnOn]}
                onPress={() => { setMode(m); setError(null); }}
                activeOpacity={0.8}>
                <Text style={[s.toggleText, mode === m && s.toggleTextOn]}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Card ── */}
          <View style={s.card}>
            <Text style={s.inputLabel}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={D.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <Text style={s.inputLabel}>PASSWORD</Text>
            <TextInput
              style={s.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor={D.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            {isSignup && (
              <>
                <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={s.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={D.textLight}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                />
              </>
            )}

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠️  {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, isLoading && s.btnOff]}
              onPress={handleEmailAuth}
              disabled={isLoading}
              activeOpacity={0.8}>
              {isLoading
                ? <ActivityIndicator color={D.onPrimary} />
                : <Text style={s.primaryBtnText}>{isSignup ? 'Create Account' : 'Sign In'}</Text>}
            </TouchableOpacity>

            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divText}>or</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, (!googleReady || isLoading) && s.btnOff]}
              onPress={handleGoogleAuth}
              disabled={!googleReady || isLoading}
              activeOpacity={0.8}>
              <Text style={s.googleBtnText}>
                {googleReady ? 'Continue with Google' : 'Google Sign-In Not Configured'}
              </Text>
            </TouchableOpacity>

            {!googleReady && (
              <Text style={s.helperText}>
                Update `src/config/auth.ts` after creating your Firebase project.
              </Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.xxxl, paddingBottom: 72 },

  brandRow: { alignItems: 'center', marginBottom: SP.xl },
  brandImg: { width: 160, height: 140 },
  appName:  { fontSize: 32, fontWeight: '900', color: D.primary, textAlign: 'center', marginBottom: SP.xs },
  tagline:  { fontSize: 14, color: D.textMuted, textAlign: 'center', marginBottom: SP.xxl, fontWeight: '600' },

  toggle:      { flexDirection: 'row', backgroundColor: D.card, borderRadius: R.pill, padding: 4, marginBottom: SP.xl, ...SH.soft },
  toggleBtn:   { flex: 1, borderRadius: R.pill, paddingVertical: 12, alignItems: 'center' },
  toggleBtnOn: { backgroundColor: D.primary, ...SH.button },
  toggleText:  { color: D.textMuted, fontSize: 14, fontWeight: '700' },
  toggleTextOn:{ color: D.onPrimary },

  card: { backgroundColor: D.card, borderRadius: R.cardLg, padding: SP.xl, ...SH.card },

  inputLabel: { color: D.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: SP.sm, marginTop: SP.base },
  input: {
    backgroundColor: D.bg,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: D.border,
    color: D.text,
    fontSize: 15,
    paddingHorizontal: SP.base,
    paddingVertical: SP.md,
  },

  errorBox:  { backgroundColor: D.dangerLight, borderRadius: R.md, padding: SP.base, marginTop: SP.base, borderLeftWidth: 3, borderLeftColor: D.danger },
  errorText: { color: D.danger, fontSize: 13, lineHeight: 19 },

  primaryBtn:     { backgroundColor: D.primary, borderRadius: R.pill, paddingVertical: 17, alignItems: 'center', marginTop: SP.xl, ...SH.button },
  primaryBtnText: { color: D.onPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  divRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginVertical: SP.lg },
  divLine: { flex: 1, height: 1, backgroundColor: D.border },
  divText: { color: D.textMuted, fontSize: 12, fontWeight: '600' },

  googleBtn:     { backgroundColor: D.bg, borderRadius: R.pill, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: D.border },
  googleBtnText: { color: D.text, fontSize: 14, fontWeight: '700' },

  helperText: { color: D.textMuted, fontSize: 12, lineHeight: 18, marginTop: SP.md, textAlign: 'center' },
  btnOff:     { opacity: 0.5 },
});
