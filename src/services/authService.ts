import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { AUTH_CONFIG, isGoogleAuthConfigured } from '../config/auth';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import { useExerciseStore } from '../store/exerciseStore';
import { useFocusStore } from '../store/focusStore';

let authUnsubscribe: (() => void) | null = null;

export function initializeAuth() {
  GoogleSignin.configure(
    isGoogleAuthConfigured()
      ? {
          webClientId: AUTH_CONFIG.googleWebClientId,
          scopes: [...AUTH_CONFIG.calendarScopes],
        }
      : {},
  );

  if (authUnsubscribe) {
    return authUnsubscribe;
  }

  authUnsubscribe = auth().onAuthStateChanged((user) => {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setInitializing(false);
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .set(
          {
            uid: user.uid,
            displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Anonymous',
            email: user.email ?? '',
          },
          { merge: true },
        )
        .catch((e) => console.warn('[authService] Firestore profile write failed:', e));
    }
  });

  return () => {
    authUnsubscribe?.();
    authUnsubscribe = null;
  };
}

export async function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string) {
  return auth().createUserWithEmailAndPassword(email.trim(), password);
}

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    throw new Error(
      'Add your Firebase Web Client ID in src/config/auth.ts before using Google sign-in.',
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in was cancelled.');
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error(
      'Google did not return an ID token. Check your Web Client ID configuration.',
    );
  }

  const googleCredential = GoogleAuthProvider.credential(idToken);
  const result = await auth().signInWithCredential(googleCredential);

  // Store access token for Google Calendar sync (non-critical if it fails)
  try {
    const tokens = await GoogleSignin.getTokens();
    const accessToken = (tokens as any).accessToken as string | undefined;
    if (accessToken) {
      useCalendarStore.getState().setAccessToken(accessToken);
    }
  } catch {
    // Calendar sync will simply require re-sign-in
  }

  return result;
}

export async function signOutUser() {
  await GoogleSignin.signOut().catch(() => null);
  await auth().signOut();
  useCalendarStore.getState().clearToken();
  useExerciseStore.getState().reset();
  useFocusStore.getState().resetAll();
}

export function toAuthErrorMessage(error: unknown) {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return 'Google sign-in was cancelled.';
      case statusCodes.IN_PROGRESS:
        return 'A sign-in request is already in progress.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is unavailable on this device.';
    }
  }

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : null;

  switch (code) {
    case 'auth/invalid-email':         return 'Enter a valid email address.';
    case 'auth/missing-password':      return 'Enter your password.';
    case 'auth/weak-password':         return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':    return 'Invalid credentials. Check your email and password.';
    case 'auth/email-already-in-use':  return 'This email is already registered. Try signing in instead.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':        return 'Incorrect email or password.';
    case 'auth/network-request-failed':return 'Network error. Check your internet connection and try again.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Authentication failed. Please try again.';
}
