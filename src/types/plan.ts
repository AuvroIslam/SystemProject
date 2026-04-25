export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';
export type PlanDuration = '1week' | '1month' | '6months';
export type PlanSource = 'instructor' | 'ai';

export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  durationSeconds?: number;
  restSeconds: number;
  notes?: string;
}

export interface DayWorkout {
  dayIndex: number; // 0=Mon … 6=Sun
  label: string;
  isRestDay: boolean;
  focus: string;
  exercises: PlanExercise[];
  estimatedMinutes: number;
}

export interface WeekPlan {
  weekNumber: number;
  days: DayWorkout[];
  focusNote: string;
}

export interface PlanUserProfile {
  timePerDayMinutes: number;
  currentWeightKg: number;
  goalWeightKg: number;
  heightCm: number;
}

export interface ExercisePlan {
  id: string;
  source: PlanSource;
  title: string;
  level: ExerciseLevel;
  duration: PlanDuration;
  createdAt: number;
  userProfile: PlanUserProfile;
  weeks: WeekPlan[];
  totalWeeks: number;
}

export interface DayCompletion {
  planId: string;
  weekNumber: number;
  dayIndex: number;
  completedAt: number;
  exerciseCount: number;
}
