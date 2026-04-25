import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExercisePlan, DayCompletion, DayWorkout } from '../types/plan';

function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDayIndex(): number {
  return (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
}

function weekIndexFor(createdAt: number): number {
  return Math.floor((Date.now() - createdAt) / 86_400_000 / 7);
}

interface ExercisePlanStore {
  activePlan: ExercisePlan | null;
  completions: Record<string, DayCompletion>; // YYYY-MM-DD → completion
  setActivePlan: (plan: ExercisePlan) => void;
  clearPlan: () => void;
  markDayComplete: (weekNumber: number, dayIndex: number, exerciseCount: number) => void;
  getTodayWorkout: () => DayWorkout | null;
  isTodayComplete: () => boolean;
  // 7 booleans Mon→Sun for current calendar week
  getWeeklyCompletions: () => boolean[];
  getOverallProgress: () => { completedDays: number; totalWorkoutDays: number };
  getCurrentWeekNumber: () => number;
}

export const useExercisePlanStore = create<ExercisePlanStore>()(
  persist(
    (set, get) => ({
      activePlan: null,
      completions: {},

      setActivePlan: (plan) => set({ activePlan: plan, completions: {} }),

      clearPlan: () => set({ activePlan: null, completions: {} }),

      markDayComplete: (weekNumber, dayIndex, exerciseCount) => {
        const plan = get().activePlan;
        if (!plan) return;
        const key = dateKey();
        set((s) => ({
          completions: {
            ...s.completions,
            [key]: { planId: plan.id, weekNumber, dayIndex, completedAt: Date.now(), exerciseCount },
          },
        }));
      },

      getTodayWorkout: () => {
        const { activePlan } = get();
        if (!activePlan) return null;
        const wIdx = Math.min(weekIndexFor(activePlan.createdAt), activePlan.weeks.length - 1);
        const dIdx = todayDayIndex();
        return activePlan.weeks[wIdx]?.days[dIdx] ?? null;
      },

      isTodayComplete: () => !!get().completions[dateKey()],

      getWeeklyCompletions: () => {
        const { completions } = get();
        const today = new Date();
        const monday = new Date(today);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(today.getDate() - todayDayIndex());
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday.getTime() + i * 86_400_000);
          return !!completions[dateKey(d)];
        });
      },

      getOverallProgress: () => {
        const { activePlan, completions } = get();
        if (!activePlan) return { completedDays: 0, totalWorkoutDays: 0 };
        const totalWorkoutDays = activePlan.weeks.reduce(
          (acc, w) => acc + w.days.filter((d) => !d.isRestDay).length, 0,
        );
        return { completedDays: Object.keys(completions).length, totalWorkoutDays };
      },

      getCurrentWeekNumber: () => {
        const { activePlan } = get();
        if (!activePlan) return 1;
        return Math.min(weekIndexFor(activePlan.createdAt) + 1, activePlan.totalWeeks);
      },
    }),
    {
      name: 'fitcounter-exercise-plan',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
