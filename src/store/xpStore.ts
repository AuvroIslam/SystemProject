import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
}

interface XPStore {
  xp: number;
  level: number;
  leaderboard: LeaderboardEntry[];
  isLoadingLeaderboard: boolean;
  leaderboardError: string | null;

  loadXP: (uid: string) => Promise<void>;
  addXP: (uid: string, amount: number) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
}

export function calcLevel(xp: number): number {
  return Math.floor(xp / 100);
}

export const useXPStore = create<XPStore>((set, get) => ({
  xp: 0,
  level: 0,
  leaderboard: [],
  isLoadingLeaderboard: false,
  leaderboardError: null,

  loadXP: async (uid) => {
    const doc = await firestore().collection('users').doc(uid).get();
    const xp = (doc.data()?.xp as number) ?? 0;
    set({ xp, level: calcLevel(xp) });
  },

  addXP: async (uid, amount) => {
    const current = get().xp;
    const next = current + amount;
    set({ xp: next, level: calcLevel(next) });
    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .set({ xp: next }, { merge: true });
    } catch {
      set({ xp: current, level: calcLevel(current) });
    }
  },

  fetchLeaderboard: async () => {
    set({ isLoadingLeaderboard: true, leaderboardError: null });
    try {
      const snap = await firestore().collection('users').get();
      const entries: LeaderboardEntry[] = snap.docs
        .map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) ?? 'Anonymous',
          xp: (d.data().xp as number) ?? 0,
          level: calcLevel((d.data().xp as number) ?? 0),
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50);
      set({ leaderboard: entries, leaderboardError: null });
    } catch (e: any) {
      set({ leaderboardError: e?.message ?? 'Failed to load leaderboard.' });
    } finally {
      set({ isLoadingLeaderboard: false });
    }
  },
}));
