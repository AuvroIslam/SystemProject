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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isGoogleAuthConfigured } from '../config/auth';
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  toAuthErrorMessage,
} from '../services/authService';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type AuthMode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode]                     = useState<AuthMode>('signin');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(false);

  const isSignup    = mode === 'signup';
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
      else          await signInWithEmail(email, password);
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
    <AppBackground variant={0}>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* ── Hero ── */}
            <View style={s.hero}>
              <View style={s.heroText}>
                <Text style={s.appName}>
                  <Text style={{ color: D.primary }}>Fit</Text>Counter
                </Text>
                <Text style={s.tagline}>Focus. Train. Conquer.</Text>
                <Text style={s.desc}>Build discipline, track progress,{'\n'}and become your best self.</Text>
              </View>
              <View style={s.heroImgWrap}>
                <Image
                  source={require('../../Elements/Onboarding.png')}
                  style={s.heroImg}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* ── Mode toggle ── */}
            <View style={s.toggle}>
              {(['signin', 'signup'] as AuthMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.toggleBtn, mode === m && s.toggleBtnActive]}
                  onPress={() => { setMode(m); setError(null); }}
                  activeOpacity={0.85}>
                  <MaterialCommunityIcons
                    name={m === 'signin' ? 'account-circle-outline' : 'account-plus-outline'}
                    size={18}
                    color={mode === m ? D.onPrimary : D.textMuted}
                  />
                  <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
                    {m === 'signin' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Form card ── */}
            <View style={s.card}>

              {/* Email */}
              <Text style={s.fieldLabel}>EMAIL</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color={D.primary} style={s.inputIcon} />
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
              </View>

              {/* Password */}
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={D.primary} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={D.textLight}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={D.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm password (signup only) */}
              {isSignup && (
                <>
                  <Text style={s.fieldLabel}>CONFIRM PASSWORD</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="lock-check-outline" size={18} color={D.primary} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Re-enter password"
                      placeholderTextColor={D.textLight}
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={s.eyeBtn}>
                      <MaterialCommunityIcons
                        name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color={D.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Error */}
              {error && (
                <View style={s.errorBox}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={D.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Primary action */}
              <TouchableOpacity
                style={[s.primaryBtn, isLoading && s.btnOff]}
                onPress={handleEmailAuth}
                disabled={isLoading}
                activeOpacity={0.85}>
                {isLoading
                  ? <ActivityIndicator color={D.onPrimary} />
                  : (
                    <Text style={s.primaryBtnText}>{isSignup ? 'Create Account' : 'Sign In'}</Text>
                  )}
              </TouchableOpacity>

              {/* Divider + Social (sign in only) */}
              {!isSignup && (
                <>
                  <View style={s.divRow}>
                    <View style={s.divLine} />
                    <Text style={s.divText}>or continue with</Text>
                    <View style={s.divLine} />
                  </View>

                  <TouchableOpacity
                    style={[s.googleBtn, (!googleReady || isLoading) && s.btnOff]}
                    onPress={handleGoogleAuth}
                    disabled={!googleReady || isLoading}
                    activeOpacity={0.8}>
                    <View style={s.googleIconCircle}>
                      <Text style={s.googleLetter}>G</Text>
                    </View>
                    <Text style={s.googleBtnText}>Continue with Google</Text>
                  </TouchableOpacity>

                  {!googleReady && (
                    <Text style={s.helperText}>
                      Add your Web Client ID in src/config/auth.ts to enable Google sign-in.
                    </Text>
                  )}
                </>
              )}

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SP.xl, paddingBottom: 48 },

  // ── Hero ──
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: SP.xl,
    marginBottom: SP.lg,
  },
  heroText: { flex: 1, paddingBottom: SP.md },
  appName:  { fontSize: 34, fontWeight: '900', color: D.text, marginBottom: SP.xs },
  tagline:  { fontSize: 15, fontWeight: '700', color: D.text, marginBottom: SP.sm },
  desc:     { fontSize: 13, color: D.textMuted, lineHeight: 20 },
  heroImgWrap: { width: 110, height: 130, borderRadius: R.cardLg, overflow: 'hidden' },
  heroImg:     { width: '100%', height: '100%' },

  // ── Toggle ──
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: R.pill,
    padding: 4,
    marginBottom: SP.lg,
    ...SH.soft,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SP.sm, borderRadius: R.pill, paddingVertical: 12,
  },
  toggleBtnActive: { backgroundColor: D.primary, ...SH.button },
  toggleText:      { color: D.textMuted, fontSize: 14, fontWeight: '700' },
  toggleTextActive:{ color: D.onPrimary },

  // ── Card ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: R.cardLg,
    padding: SP.xl,
    ...SH.card,
  },

  // ── Fields ──
  fieldLabel: {
    color: D.textMuted, fontSize: 11, fontWeight: '800',
    letterSpacing: 1.8, marginBottom: SP.sm, marginTop: SP.base,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: D.bg, borderRadius: R.md,
    borderWidth: 1.5, borderColor: D.border,
    paddingHorizontal: SP.md,
  },
  inputIcon: { marginRight: SP.sm },
  input: {
    flex: 1, fontSize: 14, color: D.text,
    paddingVertical: SP.md,
  },
  eyeBtn: { padding: SP.sm },

  // ── Remember row ──
  rememberRow:  { flexDirection: 'row', alignItems: 'center', marginTop: SP.md },
  checkboxDummy:{ width: 18, height: 18, borderRadius: 4, backgroundColor: D.primary, marginRight: SP.sm },
  rememberText: { fontSize: 13, color: D.text, fontWeight: '500', flex: 1 },
  forgotBtn:    { padding: 4 },
  forgotText:   { fontSize: 13, color: D.primary, fontWeight: '700' },

  // ── Error ──
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: D.dangerLight, borderRadius: R.md,
    padding: SP.base, marginTop: SP.base,
    borderLeftWidth: 3, borderLeftColor: D.danger,
  },
  errorText: { flex: 1, color: D.danger, fontSize: 13, lineHeight: 18 },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: D.primary,
    borderRadius: R.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: SP.xl,
    ...SH.button,
  },
  primaryBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  primaryBtnText:  { color: D.onPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // ── Divider ──
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginVertical: SP.lg },
  divLine: { flex: 1, height: 1, backgroundColor: D.border },
  divText: { color: D.textMuted, fontSize: 12, fontWeight: '600' },

  // ── Social ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.md,
    backgroundColor: '#ffffff',
    borderRadius: R.pill,
    paddingVertical: 14,
    paddingHorizontal: SP.xl,
    borderWidth: 1.5,
    borderColor: D.primary,
    ...SH.soft,
  },
  googleIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  googleLetter:  { fontSize: 16, fontWeight: '900', color: '#ffffff', fontStyle: 'italic' },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: D.primary, letterSpacing: 0.3 },

  helperText: { color: D.textMuted, fontSize: 11, textAlign: 'center', marginTop: SP.md, lineHeight: 16 },
  btnOff:     { opacity: 0.5 },
});
