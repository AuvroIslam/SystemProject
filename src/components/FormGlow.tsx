import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type GlowState = 'idle' | 'good' | 'adjust' | 'noBody';

interface Props {
  /** Current rep-counting phase: IDLE, UP, DOWN */
  phase: string;
  /** Coaching feedback — non-empty means form needs work */
  feedback: string[];
  /** Whether a body is being detected at all */
  hasBody: boolean;
  /** Flash green briefly when a rep is counted */
  repCounted: boolean;
  /** The score of the last rep (0-100) */
  lastScore: number | null;
}

function resolveState(phase: string, feedback: string[], hasBody: boolean): GlowState {
  if (!hasBody) return 'noBody';
  if (phase === 'IDLE') return 'idle';
  if (feedback.length > 0) return 'adjust';
  return 'good';
}

const GLOW_COLORS: Record<GlowState, string> = {
  idle: 'rgba(158,158,158,0.0)',       // invisible when idle
  good: 'rgba(76,175,80,0.45)',        // green
  adjust: 'rgba(255,152,0,0.50)',      // orange
  noBody: 'rgba(244,67,54,0.50)',      // red
};

const BORDER_WIDTHS: Record<GlowState, number> = {
  idle: 0,
  good: 6,
  adjust: 8,
  noBody: 10,
};

function FormGlowInner({ phase, feedback, hasBody, repCounted, lastScore }: Props) {
  const state = resolveState(phase, feedback, hasBody);

  // ── Animated border colour + width ──
  const colorAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevState = useRef<GlowState>(state);

  // Smooth transition when glow state changes
  useEffect(() => {
    if (state !== prevState.current) {
      prevState.current = state;
      Animated.timing(colorAnim, {
        toValue: state === 'good' ? 1 : state === 'adjust' ? 2 : state === 'noBody' ? 3 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [state, colorAnim]);

  // Flash on rep completion
  useEffect(() => {
    if (repCounted) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [repCounted, flashAnim]);

  const borderColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      GLOW_COLORS.idle,
      GLOW_COLORS.good,
      GLOW_COLORS.adjust,
      GLOW_COLORS.noBody,
    ],
  });

  const borderWidth = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      BORDER_WIDTHS.idle,
      BORDER_WIDTHS.good,
      BORDER_WIDTHS.adjust,
      BORDER_WIDTHS.noBody,
    ],
  });

  // Flash overlay colour — bright green that fades out
  const flashColor = lastScore !== null && lastScore >= 60
    ? 'rgba(76,175,80,0.35)'
    : 'rgba(255,152,0,0.30)';

  const flashOpacity = flashAnim;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Persistent glow border */}
      <Animated.View
        style={[
          styles.glowBorder,
          { borderColor, borderWidth },
        ]}
      />
      {/* Rep-complete flash */}
      <Animated.View
        style={[
          styles.flash,
          { backgroundColor: flashColor, opacity: flashOpacity },
        ]}
      />
    </View>
  );
}

export const FormGlow = React.memo(FormGlowInner);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
});
