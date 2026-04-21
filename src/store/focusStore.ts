import { create } from 'zustand';
import { ExerciseType } from '../types/pose';

export interface BlockedApp {
  packageName: string;
  label: string;
  icon: string; // emoji fallback
}

/** Pre-defined apps the user can choose to block */
export const AVAILABLE_APPS: BlockedApp[] = [
  { packageName: 'com.google.android.youtube', label: 'YouTube', icon: '▶️' },
  { packageName: 'com.instagram.android', label: 'Instagram', icon: '📷' },
  { packageName: 'com.facebook.katana', label: 'Facebook', icon: '👤' },
  { packageName: 'com.twitter.android', label: 'X (Twitter)', icon: '🐦' },
  { packageName: 'com.zhiliaoapp.musically', label: 'TikTok', icon: '🎵' },
  { packageName: 'com.snapchat.android', label: 'Snapchat', icon: '👻' },
  { packageName: 'com.reddit.frontpage', label: 'Reddit', icon: '🔴' },
  { packageName: 'com.whatsapp', label: 'WhatsApp', icon: '💬' },
  { packageName: 'org.telegram.messenger', label: 'Telegram', icon: '✈️' },
  { packageName: 'com.discord', label: 'Discord', icon: '🎮' },
  { packageName: 'com.netflix.mediaclient', label: 'Netflix', icon: '🎬' },
  { packageName: 'com.spotify.music', label: 'Spotify', icon: '🎧' },
];

export type FocusSessionState = 'idle' | 'active' | 'warning' | 'completed';

interface FocusStore {
  // Setup
  timerMinutes: number;
  blockedApps: string[];             // package names
  penaltyReps: number;               // reps required per violation
  penaltyExercise: ExerciseType;

  // Session
  sessionState: FocusSessionState;
  sessionStartedAt: number | null;   // timestamp
  sessionEndTime: number | null;     // timestamp when timer expires
  violations: Violation[];
  currentViolation: Violation | null;

  // Debt – accumulated sets owed across sessions
  pendingSets: number;

  // Actions
  setTimerMinutes: (m: number) => void;
  setPenaltyReps: (r: number) => void;
  setPenaltyExercise: (e: ExerciseType) => void;
  toggleBlockedApp: (pkg: string) => void;
  startSession: () => void;
  recordViolation: (packageName: string) => void;
  acknowledgeWarning: () => void;
  endSession: () => void;
  resetSession: () => void;
  payDebt: (sets: number) => void;
}

export interface Violation {
  packageName: string;
  timestamp: number;
}

export const useFocusStore = create<FocusStore>((set, get) => ({
  timerMinutes: 30,
  blockedApps: [],
  penaltyReps: 10,
  penaltyExercise: 'pushup',

  sessionState: 'idle',
  sessionStartedAt: null,
  sessionEndTime: null,
  violations: [],
  currentViolation: null,

  pendingSets: 0,

  setTimerMinutes: (m) => set({ timerMinutes: m }),
  setPenaltyReps: (r) => set({ penaltyReps: r }),
  setPenaltyExercise: (e) => set({ penaltyExercise: e }),

  toggleBlockedApp: (pkg) => {
    const current = get().blockedApps;
    if (current.includes(pkg)) {
      set({ blockedApps: current.filter((p) => p !== pkg) });
    } else {
      set({ blockedApps: [...current, pkg] });
    }
  },

  startSession: () => {
    const now = Date.now();
    set({
      sessionState: 'active',
      sessionStartedAt: now,
      sessionEndTime: now + get().timerMinutes * 60 * 1000,
      violations: [],
      currentViolation: null,
    });
  },

  recordViolation: (packageName) => {
    const violation: Violation = {
      packageName,
      timestamp: Date.now(),
    };
    set((s) => ({
      violations: [...s.violations, violation],
      currentViolation: violation,
      pendingSets: s.pendingSets + 1,
      sessionState: 'warning',
    }));
  },

  acknowledgeWarning: () => {
    set({ sessionState: 'active', currentViolation: null });
  },

  endSession: () => set({ sessionState: 'completed' }),

  resetSession: () =>
    set({
      sessionState: 'idle',
      sessionStartedAt: null,
      sessionEndTime: null,
      violations: [],
      currentViolation: null,
    }),

  payDebt: (sets) =>
    set((s) => ({
      pendingSets: Math.max(0, s.pendingSets - sets),
    })),
}));
