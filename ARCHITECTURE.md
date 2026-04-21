# FitCounter — Architecture & Design Document

## 1. Tech Decision: React Native CLI

**Choice: React Native CLI** (not Expo)

**Reasoning:**

| Factor | Expo | RN CLI |
|---|---|---|
| Frame-by-frame camera processing | Expo Camera has no frame processor API | `react-native-vision-camera` v4 with native frame processors |
| ML model integration | Limited — need custom dev-client and native modules anyway | Direct access to ML Kit / MediaPipe via native plugins |
| Thread control | Managed; can't easily run ML on a dedicated thread | Worklets / frame processors run on a separate native thread |
| Production performance | Good for standard apps; overhead for real-time ML | Full control over native pipeline — 25-30 fps achievable |

For an app that processes **every camera frame** through a pose-estimation model, native thread access via VisionCamera's frame processor architecture is essential. Expo would eventually require ejecting to a bare workflow anyway, losing its benefits.

**Key packages:**

| Package | Purpose |
|---|---|
| `react-native-vision-camera` v4 | Camera + frame processor infrastructure |
| `react-native-worklets-core` | Run native code per frame without blocking JS |
| ML Kit Pose Detection (native) | 33-landmark pose estimation at ~30 fps |
| `zustand` | Lightweight state management |
| `@react-navigation/native-stack` | Screen navigation |

---

## 2. System Architecture

```
Camera Frame (native)
    │
    ▼
┌─────────────────────────────┐
│  Frame Processor (native)   │  ML Kit Pose Detection
│  → 33 landmarks + visibility│  runs on dedicated thread
└──────────────┬──────────────┘
               │ runOnJS()
               ▼
┌─────────────────────────────┐
│  Angle Detector             │  Detects front / left_side / right_side
│  (shoulder width heuristic) │  majority-vote smoothed over 15 frames
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Exercise Processor         │  Extracts primary angle + form angle
│  pushup.ts / situp.ts       │  adapts joints to current view angle
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Signal Smoothing           │  Spike rejection → EMA filter
│  (AngleFilter)              │  removes single-frame noise
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  State Machine              │  IDLE → UP → DOWN → UP (rep++)
│  (RepStateMachine)          │  debounced: 3 frames minimum per phase
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Scoring Engine             │  depth×0.4 + form×0.3 +
│  (scoreRep)                 │  stability×0.2 + tempo×0.1
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Feedback System            │  Per-rep cues + post-set summary
│  (RepCounter + store)       │  drives UI overlay
└──────────────┬──────────────┘
               ▼
           React Native UI
```

Each module is a **pure function or class** with no side effects (except the store). This makes unit testing trivial.

---

## 3. Movement Logic

### 3.1 Push-ups

**Landmarks used:**
- Primary: Shoulder → Elbow → Wrist (elbow angle)
- Form: Shoulder → Hip → Ankle (body-line straightness)

**Angle formula:**

Given points A, B, C the angle at B is:

```
angle = acos( (BA · BC) / (|BA| × |BC|) ) × 180/π

where BA = A - B,  BC = C - B
```

**Phase thresholds:**
- UP: elbow angle ≥ 155° (arms extended)
- DOWN: elbow angle ≤ 100° (arms bent)
- Ideal minimum: 90°

**Movement cycle:**
```
UP (155°+) ──→ DOWN (≤100°) ──→ UP (155°+)  = 1 rep
```

### 3.2 Sit-ups

**Landmarks used:**
- Primary: Shoulder → Hip → Knee (hip angle)
- Form: Hip → Knee → Ankle (knee bend consistency)

**Phase thresholds:**
- UP: hip angle ≥ 140° (lying flat)
- DOWN: hip angle ≤ 80° (sitting up)
- Ideal minimum: 55°

**Movement cycle:**
```
UP (140°+) ──→ DOWN (≤80°) ──→ UP (140°+)  = 1 rep
```

### 3.3 Rep Detection — Preventing False Positives

| Technique | Implementation |
|---|---|
| **Frame debounce** | Must stay in new phase for ≥3 consecutive frames before transition |
| **Minimum rep duration** | Push-ups: 500ms, Sit-ups: 800ms — rejects spasm/noise |
| **Spike filtering** | Angle jumps >35°/frame are rejected (previous value held) |
| **EMA smoothing** | α=0.4 exponential moving average after spike rejection |
| **Landmark visibility** | Landmarks with visibility <0.5 are ignored |

---

## 4. Multi-Angle Handling

### Detection Strategy

The system detects the camera angle automatically every frame by measuring the **normalized horizontal distance between left and right shoulders**:

```
shoulderWidth = |leftShoulder.x - rightShoulder.x|

if shoulderWidth > 0.12 → FRONT view
if shoulderWidth ≤ 0.12 → SIDE view
  → compare left vs right body visibility to determine left_side / right_side
```

A **majority-vote buffer** (15 frames) smooths the view-angle detection so brief glitches don't cause the system to flip.

### Joint Priority by Angle

| View | Push-up Joints | Sit-up Joints |
|---|---|---|
| **Front** | Average L+R elbows, average L+R body lines | Average L+R hip angles |
| **Left side** | Left elbow, left body line | Left hip angle, left knee angle |
| **Right side** | Right elbow, right body line | Right hip angle, right knee angle |
| **Unknown** | First available side | First available side |

### When One Side Has Low Visibility

If one side's landmarks fall below the 0.5 visibility threshold, the system automatically falls back to the other side. If neither is visible, feedback tells the user to reposition.

---

## 5. Scoring System

Each rep is scored 0–100 on four dimensions:

```
total = depth × 0.4  +  form × 0.3  +  stability × 0.2  +  tempo × 0.1
```

### 5.1 Depth (40%)

Measures how close to full range-of-motion.

```
overshoot = downThreshold - minAngle
idealOvershoot = downThreshold - idealMinAngle
depthScore = clamp(50 + (overshoot / idealOvershoot) × 50, 0, 100)
```

- Reaching the ideal minimum angle → 100
- Just crossing the down threshold → ~50
- Not reaching down threshold → <50

### 5.2 Form (30%)

Body alignment measured as deviation from 180° (straight body).

```
avgDeviation = mean( |bodyLineAngle - 180°| )  over all frames in rep
formScore = clamp(100 - (avgDeviation / 30) × 100, 0, 100)
```

- 0° average deviation (perfectly straight) → 100
- 30°+ average deviation → 0

### 5.3 Stability (20%)

Smoothness of movement. Computed from variance of consecutive angle differences:

```
diffs[i] = |angle[i] - angle[i-1]|
variance = var(diffs)
stabilityScore = clamp(100 - variance × 2, 0, 100)
```

Jerky, bouncing movements produce high variance → low score.

### 5.4 Tempo (10%)

Appropriate rep speed:

```
if duration in [idealMin, idealMax]:  100
if duration < idealMin:  (duration / idealMin) × 100
if duration > idealMax:  (idealMax / duration) × 100
```

- Push-ups ideal: 1–3 seconds
- Sit-ups ideal: 1.5–4 seconds

### Rep Classification

| Score | Quality | Counted? |
|---|---|---|
| < 40 | `invalid` | NO — not counted |
| 40–59 | `poor` | Yes, marked as bad |
| 60–79 | `good` | Yes |
| 80–100 | `excellent` | Yes |

---

## 6. Feedback System

### 6.1 Per-Rep (Real-time)

During exercise, the overlay shows coaching cues:

**Push-ups:**
- "Keep your hips up — body should be straight" (body line < 160°)
- "Don't pike up" (body line > 200°)
- "Go lower for full range of motion" (in DOWN phase but angle > 110°)

**Sit-ups:**
- "Come up higher — engage your core" (in DOWN phase but angle > 90°)
- "Bend your knees more" (knee angle > 160°)

**Post-rep flash:**
- ≥80: "Great rep!"
- 60–79: "Good rep"
- 40–59: "Needs improvement"
- <40: "Rep not counted — incomplete"
- Plus the weakest dimension tip.

### 6.2 Post-Set Summary

When the user taps STOP, the summary screen shows:
- Total reps attempted vs valid reps counted
- Average score with color coding
- Per-dimension breakdown bars (depth / form / stability / tempo)
- Weakest area highlighted
- Actionable suggestions for improvement
- Set duration

---

## 7. Noise Handling & Edge Cases

### Signal Noise

| Issue | Solution |
|---|---|
| Landmark jitter | EMA filter (α=0.4) smooths per-frame noise |
| Single-frame spikes | Spike filter rejects Δ>35°/frame |
| Oscillating near threshold | 3-frame debounce before phase transition |
| Camera shake | Normalized coordinates (0–1) are inherently shake-resistant |

### Edge Cases

| Scenario | Handling |
|---|---|
| User partially visible | Missing landmarks return null → "Reposition" feedback |
| User leaves frame | All landmarks null → feedback + state preserved (no false rep) |
| Wrong posture | Low form score → rep still tracked but scored poorly |
| Sudden motion spike | Spike filter holds previous angle value |
| Very fast reps (<500ms) | Below minRepDurationMs → discarded entirely |
| Camera angle changes mid-set | View angle buffer absorbs short changes (majority vote) |
| Low light / poor detection | Visibility threshold (0.5) gates landmark usage |

---

## 8. Project Structure

```
src/
├── App.tsx                          # Navigation container
├── types/
│   └── pose.ts                      # All TypeScript types and enums
├── utils/
│   └── constants.ts                 # Config values, thresholds, weights
├── core/                            # Pure logic — no React dependencies
│   ├── angles.ts                    # Angle calculation + joint helpers
│   ├── smoothing.ts                 # EMA, spike, and combined filters
│   ├── stateMachine.ts              # Phase transitions + debouncing
│   ├── scoring.ts                   # 4-dimension scoring engine
│   ├── repCounter.ts                # Orchestrator (main brain)
│   └── exercises/
│       ├── pushup.ts                # Push-up angle extraction + feedback
│       ├── situp.ts                 # Sit-up angle extraction + feedback
│       └── angleDetector.ts         # Front / side view detection
├── store/
│   └── exerciseStore.ts             # Zustand store
├── hooks/
│   ├── usePoseDetection.ts          # Camera → landmarks bridge
│   └── useExerciseTracker.ts        # Landmarks → store pipeline
├── components/
│   ├── CameraView.tsx               # VisionCamera wrapper
│   ├── ExerciseOverlay.tsx          # HUD: rep count, score, phase
│   ├── FeedbackBanner.tsx           # Coaching text overlay
│   └── SetSummary.tsx               # Post-set results card
└── screens/
    ├── HomeScreen.tsx               # Exercise selection
    ├── ExerciseScreen.tsx           # Camera + overlay + stop button
    └── SummaryScreen.tsx            # Post-set summary
```

### Data Flow

```
Camera → usePoseDetection (hook)
           → useExerciseTracker (hook)
               → RepCounter.processFrame()
                   → Zustand store.updateFrame()
                       → UI components re-render
```

State management is via **Zustand** — chosen for its minimal boilerplate and good performance with frequent updates (~30 fps store writes, but React batches renders).

---

## 9. Native Pose Detection Plugin Setup

The camera integration requires a native frame-processor plugin. Here's
the approach for each platform:

### Android (Kotlin)

Add ML Kit dependency to `android/app/build.gradle`:
```groovy
dependencies {
    implementation 'com.google.mlkit:pose-detection-accurate:18.0.0-beta3'
}
```

Create a frame processor plugin:
```kotlin
// android/app/src/main/java/com/fitcounter/PoseDetectionPlugin.kt

class PoseDetectionPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?)
    : FrameProcessorPlugin() {

    private val detector = PoseDetection.getClient(
        PoseDetectorOptions.Builder()
            .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
            .build()
    )

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        val image = InputImage.fromMediaImage(
            frame.image, frame.orientation
        )
        val pose = Tasks.await(detector.process(image))
        return pose.allPoseLandmarks.map { lm ->
            mapOf(
                "x" to lm.position.x / frame.width,
                "y" to lm.position.y / frame.height,
                "z" to lm.position3D.z,
                "visibility" to lm.inFrameLikelihood
            )
        }
    }
}
```

Register it in your `MainApplication`:
```kotlin
FrameProcessorPluginRegistry.add(PoseDetectionPlugin::class.java)
```

### iOS (Swift)

Add to `Podfile`:
```ruby
pod 'GoogleMLKit/PoseDetectionAccurate'
```

Create the plugin similarly and register with VisionCamera.

### Usage in JS

Once the native plugin is registered as `"detectPose"`, uncomment the
frame processor in `CameraView.tsx`:

```typescript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const landmarks = detectPose(frame);
  if (landmarks) {
    runOnJS(onPoseDetected)(landmarks);
  }
}, [onPoseDetected]);
```

---

## 10. Performance Considerations

| Metric | Target | How |
|---|---|---|
| Pose detection | 25–30 fps | ML Kit STREAM_MODE on native thread |
| JS processing | <5ms/frame | Pure math — angles, filters, state machine |
| UI updates | ~15 fps effective | Zustand batching + React reconciliation |
| Memory | <150 MB | No frame buffering; landmarks are tiny arrays |
| Battery | Moderate | Camera + ML = battery-intensive; no mitigation beyond STREAM_MODE |

The frame processor runs on a **separate native thread**, so ML inference doesn't block the JS thread or UI. The JS exercise logic (angle calc → state machine → scoring) is <1ms per frame.
