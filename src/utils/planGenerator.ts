import { ExerciseLevel, PlanDuration, PlanUserProfile, ExercisePlan, WeekPlan, DayWorkout, PlanExercise } from '../types/plan';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Which weekday indices are workout days per level (0=Mon)
const WORKOUT_DAYS: Record<ExerciseLevel, number[]> = {
  beginner:     [0, 2, 4],        // Mon, Wed, Fri
  intermediate: [0, 1, 3, 5],    // Mon, Tue, Thu, Sat
  advanced:     [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
};

const DAY_FOCUS: Record<ExerciseLevel, string[]> = {
  beginner:     ['Full Body'],
  intermediate: ['Upper Body', 'Lower Body', 'Core', 'Full Body'],
  advanced:     ['Push', 'Lower Body', 'Core & Cardio', 'Upper Body', 'Full Body HIIT'],
};

interface ExTemplate {
  name: string;
  setsBase: number;
  repsBase: number;
  durationBase?: number;
  restSeconds: number;
  repsStep?: number;
  durationStep?: number;
}

// One entry per logical day type; beginner has 1 template reused for all 3 days
const EXERCISE_POOL: Record<ExerciseLevel, ExTemplate[][]> = {
  beginner: [
    [
      { name: 'Push-ups', setsBase: 3, repsBase: 8,  restSeconds: 60, repsStep: 1 },
      { name: 'Sit-ups',  setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Squats',   setsBase: 3, repsBase: 12, restSeconds: 60, repsStep: 2 },
      { name: 'Plank',    setsBase: 3, repsBase: 0,  durationBase: 20, restSeconds: 45, durationStep: 5 },
    ],
  ],
  intermediate: [
    [ // Upper Body
      { name: 'Push-ups',       setsBase: 3, repsBase: 12, restSeconds: 60, repsStep: 1 },
      { name: 'Wide Push-ups',  setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Sit-ups',        setsBase: 3, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Plank',          setsBase: 3, repsBase: 0,  durationBase: 30, restSeconds: 45, durationStep: 5 },
    ],
    [ // Lower Body
      { name: 'Squats',      setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 2 },
      { name: 'Lunges',      setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Calf Raises', setsBase: 3, repsBase: 20, restSeconds: 45, repsStep: 2 },
      { name: 'Wall Sit',    setsBase: 2, repsBase: 0,  durationBase: 40, restSeconds: 45, durationStep: 5 },
    ],
    [ // Core
      { name: 'Sit-ups',            setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Mountain Climbers',  setsBase: 3, repsBase: 20, restSeconds: 45, repsStep: 2 },
      { name: 'Leg Raises',         setsBase: 3, repsBase: 12, restSeconds: 60, repsStep: 1 },
      { name: 'Plank',              setsBase: 3, repsBase: 0,  durationBase: 30, restSeconds: 45, durationStep: 5 },
    ],
    [ // Full Body
      { name: 'Push-ups',  setsBase: 3, repsBase: 12, restSeconds: 60, repsStep: 1 },
      { name: 'Squats',    setsBase: 3, repsBase: 15, restSeconds: 60, repsStep: 2 },
      { name: 'Sit-ups',   setsBase: 3, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Lunges',    setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Plank',     setsBase: 3, repsBase: 0,  durationBase: 30, restSeconds: 45, durationStep: 5 },
    ],
  ],
  advanced: [
    [ // Push (Mon)
      { name: 'Push-ups',         setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Decline Push-ups', setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Diamond Push-ups', setsBase: 3, repsBase: 8,  restSeconds: 60, repsStep: 1 },
      { name: 'Plank',            setsBase: 3, repsBase: 0,  durationBase: 45, restSeconds: 45, durationStep: 5 },
    ],
    [ // Lower Body (Tue)
      { name: 'Squats',      setsBase: 4, repsBase: 20, restSeconds: 60, repsStep: 2 },
      { name: 'Lunges',      setsBase: 4, repsBase: 12, restSeconds: 60, repsStep: 1 },
      { name: 'Jump Squats', setsBase: 3, repsBase: 12, restSeconds: 60, repsStep: 1 },
      { name: 'Wall Sit',    setsBase: 3, repsBase: 0,  durationBase: 45, restSeconds: 45, durationStep: 5 },
    ],
    [ // Core & Cardio (Wed)
      { name: 'Sit-ups',           setsBase: 4, repsBase: 20, restSeconds: 60, repsStep: 2 },
      { name: 'Mountain Climbers', setsBase: 4, repsBase: 25, restSeconds: 45, repsStep: 2 },
      { name: 'Burpees',           setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Plank',             setsBase: 4, repsBase: 0,  durationBase: 45, restSeconds: 45, durationStep: 5 },
    ],
    [ // Upper Body (Fri)
      { name: 'Wide Push-ups', setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Pike Push-ups', setsBase: 3, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Push-ups',      setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Side Plank',    setsBase: 3, repsBase: 0,  durationBase: 30, restSeconds: 45, durationStep: 5 },
    ],
    [ // Full Body HIIT (Sat)
      { name: 'Burpees',           setsBase: 4, repsBase: 10, restSeconds: 60, repsStep: 1 },
      { name: 'Jump Squats',       setsBase: 4, repsBase: 15, restSeconds: 60, repsStep: 1 },
      { name: 'Mountain Climbers', setsBase: 3, repsBase: 30, restSeconds: 45, repsStep: 2 },
      { name: 'Sit-ups',           setsBase: 3, repsBase: 20, restSeconds: 60, repsStep: 2 },
    ],
  ],
};

const PHASE_NOTES = [
  'Foundation — build the habit',
  'Building — increase intensity',
  'Strength — push your limits',
  'Peak Performance — maintain & advance',
];

function estimateMinutes(exercises: PlanExercise[]): number {
  const sec = exercises.reduce((acc, ex) => {
    const setTime = ex.durationSeconds
      ? ex.sets * (ex.durationSeconds + ex.restSeconds)
      : ex.sets * (ex.reps * 2 + ex.restSeconds);
    return acc + setTime;
  }, 0);
  return Math.max(Math.ceil(sec / 60) + 3, 5);
}

function fitToTime(exercises: PlanExercise[], maxMinutes: number): PlanExercise[] {
  let result = [...exercises];
  while (result.length > 1 && estimateMinutes(result) > maxMinutes) {
    const last = result[result.length - 1];
    if (last.sets > 2) {
      result = result.map((ex, i) =>
        i === result.length - 1 ? { ...ex, sets: ex.sets - 1 } : ex,
      );
    } else {
      result = result.slice(0, -1);
    }
  }
  return result;
}

export function generateInstructorPlan(
  level: ExerciseLevel,
  duration: PlanDuration,
  profile: PlanUserProfile,
): ExercisePlan {
  const totalWeeks = duration === '1week' ? 1 : duration === '1month' ? 4 : 26;
  const workoutDays = WORKOUT_DAYS[level];
  const pool = EXERCISE_POOL[level];
  const focuses = DAY_FOCUS[level];

  const weeks: WeekPlan[] = Array.from({ length: totalWeeks }, (_, wIdx) => {
    const weekNumber = wIdx + 1;
    const phaseIndex = Math.min(Math.floor((wIdx / totalWeeks) * 4), 3);
    // progression step every 2 weeks
    const step = Math.floor(wIdx / 2);

    const days: DayWorkout[] = Array.from({ length: 7 }, (_, dayIdx) => {
      const dayTypeIdx = workoutDays.indexOf(dayIdx);
      if (dayTypeIdx === -1) {
        return {
          dayIndex: dayIdx,
          label: DAY_LABELS[dayIdx],
          isRestDay: true,
          focus: 'Rest & Recovery',
          exercises: [],
          estimatedMinutes: 0,
        };
      }

      const poolIdx = dayTypeIdx % pool.length;
      const templates = pool[poolIdx];

      const exercises: PlanExercise[] = templates.map((t, i) => ({
        id: `w${weekNumber}_d${dayIdx}_e${i}`,
        name: t.name,
        sets: t.setsBase,
        reps: t.repsBase + step * (t.repsStep ?? 0),
        durationSeconds: t.durationBase !== undefined
          ? t.durationBase + step * (t.durationStep ?? 0)
          : undefined,
        restSeconds: t.restSeconds,
      }));

      const fitted = fitToTime(exercises, profile.timePerDayMinutes);
      return {
        dayIndex: dayIdx,
        label: DAY_LABELS[dayIdx],
        isRestDay: false,
        focus: focuses[dayTypeIdx % focuses.length],
        exercises: fitted,
        estimatedMinutes: estimateMinutes(fitted),
      };
    });

    return { weekNumber, days, focusNote: PHASE_NOTES[phaseIndex] };
  });

  const levelLabel = level[0].toUpperCase() + level.slice(1);
  const durationLabel = duration === '1week' ? '1 Week' : duration === '1month' ? '1 Month' : '6 Month';

  return {
    id: `plan_${Date.now()}`,
    source: 'instructor',
    title: `${levelLabel} ${durationLabel} Plan`,
    level,
    duration,
    createdAt: Date.now(),
    userProfile: profile,
    weeks,
    totalWeeks,
  };
}

// Build an ExercisePlan from Groq AI JSON output (repeats the week for 4 weeks)
export function buildAIPlan(
  planJson: any,
  profile: PlanUserProfile,
): ExercisePlan {
  const schedule: any[] = planJson.weeklySchedule ?? [];
  const baseWeek: DayWorkout[] = schedule.map((d: any, dayIdx: number) => {
    if (d.isRest) {
      return { dayIndex: dayIdx, label: d.day, isRestDay: true, focus: 'Rest & Recovery', exercises: [], estimatedMinutes: 0 };
    }
    const exercises: PlanExercise[] = (d.exercises ?? []).map((e: any, i: number) => ({
      id: `ai_d${dayIdx}_e${i}`,
      name: e.name ?? 'Exercise',
      sets: e.sets ?? 3,
      reps: e.reps ?? 0,
      durationSeconds: e.duration ?? undefined,
      restSeconds: e.rest ?? 60,
    }));
    return {
      dayIndex: dayIdx,
      label: d.day,
      isRestDay: false,
      focus: d.focus ?? 'Full Body',
      exercises,
      estimatedMinutes: estimateMinutes(exercises),
    };
  });

  // Pad to 7 days if Groq returned fewer
  while (baseWeek.length < 7) {
    const i = baseWeek.length;
    baseWeek.push({ dayIndex: i, label: DAY_LABELS[i], isRestDay: true, focus: 'Rest & Recovery', exercises: [], estimatedMinutes: 0 });
  }

  const weeks: WeekPlan[] = Array.from({ length: 4 }, (_, wIdx) => ({
    weekNumber: wIdx + 1,
    days: baseWeek.map((d, dayIdx) => ({
      ...d,
      exercises: d.exercises.map((ex) => ({
        ...ex,
        id: `ai_w${wIdx + 1}_d${dayIdx}_e${ex.id.split('_e')[1]}`,
        reps: ex.reps + wIdx * 1,
        durationSeconds: ex.durationSeconds !== undefined ? ex.durationSeconds + wIdx * 5 : undefined,
      })),
    })),
    focusNote: PHASE_NOTES[Math.min(wIdx, 3)],
  }));

  return {
    id: `plan_ai_${Date.now()}`,
    source: 'ai',
    title: planJson.title ?? 'AI Custom Plan',
    level: planJson.level ?? 'beginner',
    duration: '1month',
    createdAt: Date.now(),
    userProfile: profile,
    weeks,
    totalWeeks: 4,
  };
}
