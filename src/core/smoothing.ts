/**
 * Signal-smoothing filters for noisy pose-estimation angles.
 *
 * Pipeline per angle:  raw → SpikeFilter → EMA → output
 * This removes transient spikes and smooths jitter while keeping
 * latency low enough for real-time rep detection (~30 fps).
 */

// ─── Exponential Moving Average ─────────────────────────────────────────────

export class EMAFilter {
  private value: number | null = null;
  private readonly alpha: number;

  /** @param alpha  0.01–1.0;  lower = smoother / more lag.  Recommended: 0.3–0.5 */
  constructor(alpha = 0.4) {
    this.alpha = Math.max(0.01, Math.min(1, alpha));
  }

  update(raw: number): number {
    if (this.value === null) {
      this.value = raw;
    } else {
      this.value = this.alpha * raw + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  get current(): number {
    return this.value ?? 0;
  }

  reset(): void {
    this.value = null;
  }
}

// ─── Moving Average ─────────────────────────────────────────────────────────

export class MovingAverageFilter {
  private buffer: number[] = [];
  private readonly windowSize: number;

  constructor(windowSize = 5) {
    this.windowSize = Math.max(1, windowSize);
  }

  update(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
  }

  get current(): number {
    if (this.buffer.length === 0) return 0;
    return this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
  }

  get variance(): number {
    if (this.buffer.length < 2) return 0;
    const mean = this.current;
    return (
      this.buffer.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      this.buffer.length
    );
  }

  reset(): void {
    this.buffer = [];
  }
}

// ─── Spike Rejection ────────────────────────────────────────────────────────

/**
 * Rejects single-frame spikes larger than maxDelta.
 * If the new value jumps too far from the previous, the previous value is kept.
 */
export class SpikeFilter {
  private lastValue: number | null = null;
  private readonly maxDelta: number;

  /** @param maxDelta  Maximum allowed per-frame change in degrees */
  constructor(maxDelta = 30) {
    this.maxDelta = maxDelta;
  }

  update(value: number): number {
    if (
      this.lastValue !== null &&
      Math.abs(value - this.lastValue) > this.maxDelta
    ) {
      return this.lastValue; // spike — hold previous
    }
    this.lastValue = value;
    return value;
  }

  reset(): void {
    this.lastValue = null;
  }
}

// ─── Combined Pipeline ──────────────────────────────────────────────────────

/**
 * Full filter chain:  spike rejection → EMA smoothing.
 * One instance per tracked angle.
 */
export class AngleFilter {
  private spike: SpikeFilter;
  private ema: EMAFilter;

  constructor(spikeThreshold = 35, emaAlpha = 0.4) {
    this.spike = new SpikeFilter(spikeThreshold);
    this.ema = new EMAFilter(emaAlpha);
  }

  update(raw: number): number {
    const despiked = this.spike.update(raw);
    return this.ema.update(despiked);
  }

  get current(): number {
    return this.ema.current;
  }

  reset(): void {
    this.spike.reset();
    this.ema.reset();
  }
}
