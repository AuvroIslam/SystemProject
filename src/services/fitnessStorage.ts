import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseType } from '../types/pose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutEntry {
  exerciseType: ExerciseType;
  reps: number;
  date: string; // ISO date string
}

export interface DailyStats {
  date: string;      // YYYY-MM-DD
  totalReps: number;
  sessionsCompleted: number;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'fitcounter:workout_history';
const STATS_KEY = 'fitcounter:daily_stats';
const HISTORY_LIMIT = 10;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Workout History ──────────────────────────────────────────────────────────

export async function getWorkoutHistory(): Promise<WorkoutEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as WorkoutEntry[]) : [];
}

export async function saveWorkout(entry: WorkoutEntry): Promise<void> {
  const history = await getWorkoutHistory();
  const updated = [entry, ...history].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

// ─── Daily Stats ──────────────────────────────────────────────────────────────

export async function getDailyStats(): Promise<DailyStats> {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  const stats: DailyStats = raw
    ? (JSON.parse(raw) as DailyStats)
    : { date: todayKey(), totalReps: 0, sessionsCompleted: 0 };

  // Reset if it's a new day
  if (stats.date !== todayKey()) {
    return { date: todayKey(), totalReps: 0, sessionsCompleted: 0 };
  }
  return stats;
}

export async function incrementDailyReps(reps: number): Promise<void> {
  const stats = await getDailyStats();
  stats.totalReps += reps;
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function incrementDailySession(): Promise<void> {
  const stats = await getDailyStats();
  stats.sessionsCompleted += 1;
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
