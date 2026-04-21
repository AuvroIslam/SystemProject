# FitCounter

FitCounter is a React Native CLI mobile app that turns focus discipline into exercise accountability. It combines real-time pose tracking, rep counting, exercise scoring, and focus-session enforcement so users can practice push-ups, sit-ups, and squats while paying off distraction debt created during blocked-app violations.

The project is built for native performance. Camera frames are processed through `react-native-vision-camera`, native pose-detection plugins, and worklets so exercise feedback can happen while the user moves instead of after a recording ends.

## Core Features

- Real-time camera-based exercise tracking.
- Push-up, sit-up, and squat rep counting.
- Per-rep form, depth, stability, and tempo scoring.
- Exercise summaries after each set.
- Focus sessions with app-blocking violation flow.
- Exercise debt system for missed focus discipline.
- Native Android app-monitoring service.
- React Navigation screen flow for training, focus, warnings, and summaries.

## Tech Stack

| Area | Technology |
| --- | --- |
| Mobile framework | React Native CLI `0.74` |
| Language | TypeScript |
| Camera | `react-native-vision-camera` |
| Frame processing | `react-native-worklets-core` |
| Navigation | `@react-navigation/native-stack` |
| State management | `zustand` |
| Native platforms | Android and iOS project folders |
| Testing | Jest |

## App Flow

FitCounter starts at a performance dashboard. Users can either begin a focus session or practice exercises directly.

For direct training, the user chooses an exercise and performs reps in front of the camera. Pose landmarks are converted into joint angles, smoothed, classified into movement phases, counted as reps, and scored.

For focus mode, the user starts a timer and selects apps to avoid. Opening a blocked app creates exercise debt, which must be paid back through completed exercise sets.
