import {
  PoseLandmarks,
  ExerciseType,
  ViewAngle,
  RepResult,
  RepScore,
  SetSummary,
  ExerciseConfig,
} from '../types/pose';
import { RepStateMachine } from './stateMachine';
import { AngleFilter } from './smoothing';
import { scoreRep, getRepQuality, shouldCountRep } from './scoring';
import {
  getPushupAngles,
  getPushupConfig,
  getPushupFeedback,
} from './exercises/pushup';
import {
  getSitupAngles,
  getSitupConfig,
  getSitupFeedback,
} from './exercises/situp';
import {
  getSquatAngles,
  getSquatConfig,
  getSquatFeedback,
} from './exercises/squat';
import { detectViewAngle } from './exercises/angleDetector';

// ─── Frame-level result returned to the UI ──────────────────────────────────

export interface FrameResult {
  repCount: number;
  validRepCount: number;
  currentPhase: string;
  currentAngle: number | null;
  viewAngle: ViewAngle;
  feedback: string[];
  lastRepScore: RepScore | null;
  lastRepCounted: boolean;
  repJustCompleted: boolean;
}

// ─── RepCounter — the brain of the exercise tracker ─────────────────────────

/**
 * Orchestrates the full pipeline for one exercise set:
 *
 *   landmarks → angle extraction → smoothing → state machine
 *              → rep detection → scoring → feedback
 *
 * Create one instance per set.  Call `processFrame()` for every camera frame.
 */
export class RepCounter {
  private exerciseType: ExerciseType;
  private config: ExerciseConfig;
  private stateMachine: RepStateMachine;
  private primaryFilter: AngleFilter;
  private formFilter: AngleFilter;
  private viewAngleBuffer: ViewAngle[] = [];

  // ── rep-in-progress state ──
  private repStartTime: number | null = null;
  private minAngleInRep = Infinity;
  private maxAngleInRep = -Infinity;
  private angleReadingsInRep: number[] = [];
  private bodyLineAnglesInRep: number[] = [];

  // ── accumulated results ──
  private repCount = 0;
  private validRepCount = 0;
  private reps: RepResult[] = [];
  private lastRepScore: RepScore | null = null;
  private lastRepCounted = false;
  private setStartTime: number;

  constructor(exerciseType: ExerciseType) {
    this.exerciseType = exerciseType;
    this.config =
      exerciseType === 'pushup'
        ? getPushupConfig()
        : exerciseType === 'squat'
          ? getSquatConfig()
          : getSitupConfig();
    this.stateMachine = new RepStateMachine(this.config);
    this.primaryFilter = new AngleFilter();
    this.formFilter = new AngleFilter(35, 0.3);
    this.setStartTime = Date.now();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main entry — called once per camera frame (~30 fps)
  // ─────────────────────────────────────────────────────────────────────────

  processFrame(landmarks: PoseLandmarks): FrameResult {
    // 1. Detect camera angle (smoothed over 15 frames)
    const rawView = detectViewAngle(landmarks);
    const viewAngle = this.smoothViewAngle(rawView);

    // 2. Exercise-specific angle extraction
    const { primaryAngle: rawPrimary, bodyLineAngle: rawBody } =
      this.exerciseType === 'pushup'
        ? getPushupAngles(landmarks, viewAngle)
        : this.exerciseType === 'squat'
          ? getSquatAngles(landmarks, viewAngle)
          : getSitupAngles(landmarks, viewAngle);

    // 3. Missing landmarks — can't track
    if (rawPrimary === null) {
      return this.result(null, viewAngle, [
        'Position yourself so the camera can see you',
      ]);
    }

    // 4. Smooth angles
    const primary = this.primaryFilter.update(rawPrimary);
    const body = rawBody !== null ? this.formFilter.update(rawBody) : null;

    // 5. Accumulate per-rep metrics
    this.minAngleInRep = Math.min(this.minAngleInRep, primary);
    this.maxAngleInRep = Math.max(this.maxAngleInRep, primary);
    this.angleReadingsInRep.push(primary);
    if (body !== null) this.bodyLineAnglesInRep.push(body);

    // 6. State machine
    const transition = this.stateMachine.update(primary);
    let repJustCompleted = false;

    if (transition) {
      if (transition.to === 'DOWN' && transition.from === 'UP') {
        // Starting descent — mark rep start
        this.repStartTime = Date.now();
        this.resetRepMetrics(primary, body);
      }
      if (transition.repCompleted) {
        repJustCompleted = this.completeRep();
      }
    }

    // 7. Feedback
    const feedback =
      this.exerciseType === 'pushup'
        ? getPushupFeedback(primary, body, this.stateMachine.getPhase())
        : this.exerciseType === 'squat'
          ? getSquatFeedback(primary, body, this.stateMachine.getPhase())
          : getSitupFeedback(primary, body, this.stateMachine.getPhase());

    return this.result(primary, viewAngle, feedback, repJustCompleted);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rep completion & scoring
  // ─────────────────────────────────────────────────────────────────────────

  private completeRep(): boolean {
    const now = Date.now();
    const duration = this.repStartTime
      ? now - this.repStartTime
      : this.config.idealRepDurationMs[0];

    // Too fast → likely noise
    if (duration < this.config.minRepDurationMs) return false;

    this.repCount++;

    const score = scoreRep({
      minAngle: this.minAngleInRep,
      maxAngle: this.maxAngleInRep,
      bodyLineAngles: this.bodyLineAnglesInRep,
      angleReadings: this.angleReadingsInRep,
      durationMs: duration,
      config: this.config,
    });

    const quality = getRepQuality(score.total);
    const counted = shouldCountRep(score.total);
    if (counted) this.validRepCount++;

    this.reps.push({
      repNumber: this.repCount,
      score,
      quality,
      counted,
      feedback: this.repSummaryFeedback(score),
      durationMs: duration,
      minAngle: this.minAngleInRep,
      maxAngle: this.maxAngleInRep,
    });

    this.lastRepScore = score;
    this.lastRepCounted = counted;
    this.repStartTime = null;

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Feedback
  // ─────────────────────────────────────────────────────────────────────────

  private repSummaryFeedback(score: RepScore): string[] {
    const fb: string[] = [];

    if (score.total >= 80) fb.push('Great rep!');
    else if (score.total >= 60) fb.push('Good rep');
    else if (score.total >= 40) fb.push('Needs improvement');
    else fb.push('Rep not counted — incomplete');

    // Identify weakest dimension
    const areas: { name: string; val: number }[] = [
      { name: 'depth', val: score.depth },
      { name: 'form', val: score.form },
      { name: 'stability', val: score.stability },
      { name: 'tempo', val: score.tempo },
    ];
    areas.sort((a, b) => a.val - b.val);

    if (areas[0].val < 60) {
      const tips: Record<string, string> = {
        depth: 'Go lower for full range',
        form: 'Keep body aligned',
        stability: 'Move more smoothly',
        tempo: 'Control your speed',
      };
      fb.push(tips[areas[0].name]);
    }

    return fb;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Set summary (call when user stops)
  // ─────────────────────────────────────────────────────────────────────────

  getSetSummary(): SetSummary {
    const valid = this.reps.filter((r) => r.counted);
    const scores = valid.map((r) => r.score);
    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((s, sc) => s + sc.total, 0) / scores.length,
          )
        : 0;

    const avgFields = {
      depth: avg(scores.map((s) => s.depth)),
      form: avg(scores.map((s) => s.form)),
      stability: avg(scores.map((s) => s.stability)),
      tempo: avg(scores.map((s) => s.tempo)),
      total: avgScore,
    };

    const ranked = (
      Object.entries(avgFields) as [keyof RepScore, number][]
    )
      .filter(([k]) => k !== 'total')
      .sort((a, b) => a[1] - b[1]);

    const weakest = ranked[0]?.[0] ?? 'depth';

    return {
      exercise: this.exerciseType,
      totalReps: this.repCount,
      validReps: this.validRepCount,
      averageScore: avgScore,
      scores,
      weakestArea: weakest,
      suggestions: this.setTips(ranked),
      durationMs: Date.now() - this.setStartTime,
    };
  }

  private setTips(
    ranked: [keyof RepScore, number][],
  ): string[] {
    const tips: string[] = [];
    const isPushup = this.exerciseType === 'pushup';

    for (const [area, val] of ranked) {
      if (val >= 80) continue;
      switch (area) {
        case 'depth':
          tips.push(
            isPushup
              ? 'Focus on going chest-to-floor on each rep'
              : 'Come all the way up to your knees',
          );
          break;
        case 'form':
          tips.push(
            isPushup
              ? 'Keep your body in a straight line — avoid sagging hips'
              : 'Keep feet planted and move from your core',
          );
          break;
        case 'stability':
          tips.push('Slow down and focus on smooth, controlled movements');
          break;
        case 'tempo':
          tips.push('Aim for 2–3 seconds per rep for best results');
          break;
      }
    }

    if (tips.length === 0) tips.push('Great set! Keep up the quality.');
    return tips;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private smoothViewAngle(raw: ViewAngle): ViewAngle {
    this.viewAngleBuffer.push(raw);
    if (this.viewAngleBuffer.length > 15) this.viewAngleBuffer.shift();

    const counts: Record<string, number> = {};
    for (const v of this.viewAngleBuffer) counts[v] = (counts[v] || 0) + 1;

    let best: ViewAngle = raw;
    let bestN = 0;
    for (const [k, n] of Object.entries(counts)) {
      if (n > bestN) {
        bestN = n;
        best = k as ViewAngle;
      }
    }
    return best;
  }

  private resetRepMetrics(primary: number, body: number | null): void {
    this.minAngleInRep = primary;
    this.maxAngleInRep = primary;
    this.angleReadingsInRep = [primary];
    this.bodyLineAnglesInRep = body !== null ? [body] : [];
  }

  private result(
    angle: number | null,
    view: ViewAngle,
    feedback: string[],
    repJustCompleted = false,
  ): FrameResult {
    return {
      repCount: this.repCount,
      validRepCount: this.validRepCount,
      currentPhase: this.stateMachine.getPhase(),
      currentAngle: angle,
      viewAngle: view,
      feedback,
      lastRepScore: this.lastRepScore,
      lastRepCounted: this.lastRepCounted,
      repJustCompleted,
    };
  }

  reset(): void {
    this.stateMachine.reset();
    this.primaryFilter.reset();
    this.formFilter.reset();
    this.repCount = 0;
    this.validRepCount = 0;
    this.reps = [];
    this.repStartTime = null;
    this.minAngleInRep = Infinity;
    this.maxAngleInRep = -Infinity;
    this.angleReadingsInRep = [];
    this.bodyLineAnglesInRep = [];
    this.lastRepScore = null;
    this.lastRepCounted = false;
    this.viewAngleBuffer = [];
    this.setStartTime = Date.now();
  }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
