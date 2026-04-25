# FitCounter: Current App Behavior and Features

## Overview

FitCounter is an Android-first fitness discipline app that combines:

- Real-time exercise rep tracking using camera-based pose detection
- Focus sessions with soft-control restricted app monitoring
- Penalty-based accountability when focus rules are broken
- Debt payoff workflow requiring physical exercise to clear accumulated sets
- Firebase authentication (email/password + Google Sign-In)
- Gamification via XP, levels, and a global Firestore leaderboard

---

## Core User Flow

1. User signs in via Firebase Auth.
2. User navigates to Home and can either start a free exercise session or enter Focus Mode.
3. **Focus Mode path:**
   - User configures session duration, restricted apps, and penalty exercise.
   - During session, the native AccessibilityService (or UsageStats fallback) detects restricted app opens.
   - On detection, an Alert prompts "Stay Focused" or "Proceed":
     - Stay Focused → no penalty.
     - Proceed → 1 penalty set added, app is launched via `AppMonitor.proceedToRestrictedApp`.
   - On session end, FocusSummary screen shows violations, focus score, and debt owed.
   - From Home, user can open DebtPay → select sets to clear → PunishExercise verifies reps with camera.
4. **Free exercise path:**
   - User selects exercise type → ExerciseScreen opens camera → rep tracking runs → Summary saved.

---

## Screens

| Screen | Purpose |
|---|---|
| AuthScreen | Firebase email/password and Google sign-in |
| HomeScreen | Dashboard: daily stats, debt badge, navigation hub |
| ExerciseScreen | Free exercise session with camera rep tracking |
| SummaryScreen | Post-session rep summary; saves to AsyncStorage |
| FocusSetupScreen | Configure session duration, blocked apps, penalty |
| FocusActiveScreen | Live countdown timer, violation log, stats during session |
| ViolationWarningScreen | Shown when `sessionState === 'warning'` (currently unused path) |
| PunishExerciseScreen | Debt payoff via camera-verified reps |
| DebtPayScreen | Select how many sets to clear; disabled when pendingSets === 0 |
| FocusSummaryScreen | Session report: focus score, violations, XP award |
| LeaderboardScreen | Top 50 users by XP from Firestore |
| FitnessScreen | Workout history (last 10), daily stats, manual countdown timer |
| AskAIScreen | Chat interface forwarding questions to local backend at `http://10.0.2.2:3000/ask` |

---

## 1) Authentication

- Firebase Auth: email/password sign-up/sign-in and Google Sign-In
- Auth state observed via `onAuthStateChanged` in `authService.ts`
- `useAuthStore` exposes `user`, `isInitializing`
- Navigation is auth-gated: unauthenticated → AuthScreen; authenticated → full app stack
- Bootstrap screen shown during initial auth resolution

---

## 2) Exercise Tracking Pipeline

### Pose Detection
- Google ML Kit Accurate Pose Detection in `STREAM_MODE` (33 landmarks per frame)
- Delivered via VisionCamera v4 frame processor plugin (Kotlin `PoseDetectorPlugin`)
- Landmarks include visibility confidence scores; low-visibility landmarks are filtered

### Signal Processing
- **EMA filter** (α = 0.4) smooths raw angle values each frame
- **Spike rejection filter** (Δmax = 35°/frame) discards implausible jumps
- Filters compose as an `AngleFilter` chain in `smoothing.ts`

### Rep State Machine
- Three phases: `IDLE → DOWN → UP → IDLE` (completes one rep)
- Phase transitions require `minFramesInPhase` consecutive frames to debounce noise
- Rep is only counted if `minRepDurationMs` is met

### Rep Scoring (0–100)
| Dimension | Weight | Measures |
|---|---|---|
| Depth | 40% | Range of motion vs. ideal angle thresholds |
| Form | 30% | Body alignment throughout rep |
| Stability | 20% | Smoothness of motion |
| Tempo | 10% | Speed vs. ideal rep duration range |

- Rep quality: `invalid` (<40), `poor` (40–59), `good` (60–79), `excellent` (≥80)
- Reps scoring below 40 are not counted toward `validRepCount`

### View-Angle Detection
- Camera angle inferred from shoulder-width ratio (normalized landmark distance)
- 15-frame majority-vote buffer stabilises angle classification
- Supports `front`, `left_side`, `right_side`; defaults to `unknown`

### Supported Exercises
- **Push-up** — elbow angle; side view preferred
- **Sit-up** — hip angle; side view preferred
- **Squat** — knee angle; front or side view

### Session State
- Managed by `useExerciseStore` (Zustand)
- Stores: `repCount`, `validRepCount`, `currentPhase`, `currentFeedback`, `lastRepScore`, `lastRepCounted`, `setSummary`, `isActive`
- Session ends via `finishSet()`, which computes `SetSummary` and transitions to SummaryScreen
- SummaryScreen persists the workout to AsyncStorage via `saveWorkout`, `incrementDailyReps`, `incrementDailySession`

---

## 3) Focus Mode

### Session Setup
- Duration: 1–120 minutes (configurable)
- Blocked apps selected from a predefined list of 12 (YouTube, Instagram, Facebook, X/Twitter, TikTok, Snapchat, Reddit, WhatsApp, Telegram, Discord, Netflix, Spotify)
- Penalty exercise (push-up / sit-up / squat) and reps per set (default 10) configurable

### Session States
- `idle` — no active session
- `active` — session running, monitoring live
- `warning` — type exists in store but is **never set** by any current action (dead state); ViolationWarningScreen is effectively unreachable via normal flow
- `completed` — timer reached zero; triggers navigation to FocusSummary

### Monitoring Channels
- **Primary:** `AccessibilityService` (`AppMonitorService.kt`) — event-driven, fires on `TYPE_WINDOW_STATE_CHANGED`
- **Fallback:** `UsageStatsManager` polling via a foreground `ForegroundMonitorService` (used when Accessibility permission not granted)
- `AppMonitor` native module exposed to React Native via `NativeModules.AppMonitor`
- `NativeEventEmitter(AppMonitor)` emits `onRestrictedAppAttempt` events with `{ packageName }` payload

### Soft-Control Intercept Flow
1. Native module emits `onRestrictedAppAttempt`
2. `FocusActiveScreen` listener shows `Alert.alert` with "Stay Focused" / "Proceed"
3. **Stay Focused** → `sub.remove()` only; no state change
4. **Proceed** → `addProceedPenalty(packageName)` increments `pendingSets` and `softPenaltyPushups`; then `AppMonitor.proceedToRestrictedApp(packageName)` launches the app
5. A cooldown and temporary-allow window in the native layer prevent immediate re-interception

### Violation Tracking
- Each confirmed proceed is stored as a `Violation` object `{ packageName, timestamp }` in `focusStore`
- Violations are shown in FocusActive log (last 5) and FocusSummary breakdown

### Session End
- Timer reaches zero → `endSession()` sets state to `'completed'`
- FocusSummaryScreen shows focus score (`max(0, 100 - violations × 15)`), duration, violation count, pending sets
- XP awarded: 50 base + 30 bonus if zero violations; persisted to Firestore with optimistic local update and rollback on write failure

---

## 4) Debt and Punishment System

- `pendingSets` persists across sessions in `focusStore` (in-memory Zustand, reset on app restart)
- DebtPayScreen: user selects 1–`pendingSets` sets to pay off; Start button disabled when `pendingSets === 0`
- PunishExerciseScreen runs the full camera tracking pipeline (same as ExerciseScreen)
- On completion: `payDebt(setsToPayOff)` decrements `pendingSets`; +10 XP per set cleared
- Navigates to Home after 800 ms delay

---

## 5) Gamification

### XP and Levels
- XP events: +50 focus session complete, +30 zero-violation bonus, +10 per debt set cleared
- Level = `floor(xp / 100)`
- Managed by `useXPStore`; persisted in Firestore `users/{uid}.xp`
- Optimistic local update with automatic rollback if Firestore write fails

### Leaderboard
- Fetches top 50 users from Firestore ordered by `xp` descending
- Displayed in `LeaderboardScreen`

---

## 6) Fitness Screen

- Loads today's `DailyStats` (reps, sessions) and last 10 `WorkoutEntry` records from AsyncStorage
- Daily stats reset automatically when the calendar date changes
- Includes a built-in countdown timer workout (configurable duration in minutes)

---

## 7) Ask AI Screen

- Simple question-and-answer chat UI
- Sends POST to `http://10.0.2.2:3000/ask` (Android emulator loopback → local Node backend)
- Expects `{ answer: string }` JSON response
- Requires the backend server to be running separately

---

## 8) State Management

| Store | Persisted | Manages |
|---|---|---|
| `authStore` | No (Firebase handles it) | `user`, `isInitializing` |
| `exerciseStore` | No | Active session: reps, phase, feedback, scores, setSummary |
| `focusStore` | No | Session config, state, violations, pendingSets, debt |
| `xpStore` | Firestore | XP, level, leaderboard cache |

Workout history and daily stats are persisted separately via AsyncStorage (`fitnessStorage.ts`).

---

## 9) Permissions Required (Android)

- `CAMERA` — pose detection
- `BIND_ACCESSIBILITY_SERVICE` — primary app monitoring
- `PACKAGE_USAGE_STATS` — fallback monitoring via UsageStatsManager
- `POST_NOTIFICATIONS` — foreground service notification (Android 13+)
- `FOREGROUND_SERVICE` — background monitoring service
- `INTERNET` — Firebase + AskAI backend

---

## 10) Tech Stack

- React Native 0.74 + TypeScript (Android-first)
- VisionCamera v4 with custom Kotlin frame processor plugin
- Google ML Kit Pose Detection (Accurate mode)
- Zustand state management
- Firebase Authentication + Cloud Firestore
- AsyncStorage for local workout/stats persistence
- React Navigation v6 (native stack)
- Native Android Kotlin modules: `AppMonitorModule`, `AppMonitorService` (Accessibility), `ForegroundMonitorService` (UsageStats)
