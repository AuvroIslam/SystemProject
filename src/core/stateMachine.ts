import { RepPhase, ExerciseConfig } from '../types/pose';

export interface PhaseTransition {
  from: RepPhase;
  to: RepPhase;
  repCompleted: boolean;
}

/**
 * Deterministic state machine for rep detection.
 *
 * Tracks the primary angle (e.g. elbow angle for push-ups, hip angle for
 * sit-ups) and transitions between phases with frame-count debouncing
 * to prevent noise-triggered false transitions.
 *
 * Phase flow:
 *   IDLE  →  UP  →  DOWN  →  UP (rep++)  →  DOWN  →  UP (rep++) …
 *
 * "UP" means the primary angle is HIGH (extended position).
 * "DOWN" means the primary angle is LOW (contracted position).
 *
 * For push-ups:  UP = arms straight,  DOWN = arms bent
 * For sit-ups:   UP = lying flat,     DOWN = sitting up
 *
 * A rep is counted each time the angle returns from DOWN → UP.
 */
export class RepStateMachine {
  private phase: RepPhase = 'IDLE';
  private framesInPhase = 0;
  private readonly config: ExerciseConfig;

  constructor(config: ExerciseConfig) {
    this.config = config;
  }

  /**
   * Feed a new smoothed primary-angle reading.
   * @returns Transition info if a phase change occurred, otherwise null.
   */
  update(primaryAngle: number): PhaseTransition | null {
    this.framesInPhase++;

    const isDown = primaryAngle <= this.config.downAngleThreshold;
    const isUp = primaryAngle >= this.config.upAngleThreshold;
    const debounced = this.framesInPhase >= this.config.minFramesInPhase;

    switch (this.phase) {
      case 'IDLE':
        if (isUp && debounced) {
          return this.transitionTo('UP', false);
        }
        if (isDown && debounced) {
          // User starts in the contracted position (e.g. lying sit-up)
          return this.transitionTo('DOWN', false);
        }
        break;

      case 'UP':
        if (isDown && debounced) {
          return this.transitionTo('DOWN', false);
        }
        break;

      case 'DOWN':
        if (isUp && debounced) {
          // DOWN → UP = one rep completed
          return this.transitionTo('UP', true);
        }
        break;
    }

    return null;
  }

  private transitionTo(
    newPhase: RepPhase,
    repCompleted: boolean,
  ): PhaseTransition {
    const transition: PhaseTransition = {
      from: this.phase,
      to: newPhase,
      repCompleted,
    };
    this.phase = newPhase;
    this.framesInPhase = 0;
    return transition;
  }

  getPhase(): RepPhase {
    return this.phase;
  }

  reset(): void {
    this.phase = 'IDLE';
    this.framesInPhase = 0;
  }
}
