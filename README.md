[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-d81b60)](https://github.com/sponsors/jeanmachuca)

# Modern Face Gestures Detection App — Real-Time Gesture Recognition Tutorial

A working gesture recognition web app using **WebRTC** + **MediaPipe** + **face-api.js**. Detects facial expressions, hand gestures, eye tracking, and head gestures in real time — all in the browser with zero backend.

## Live Demo

**[https://jeanmachuca.github.io/modern-face-gestures-detection-app-example/](https://jeanmachuca.github.io/modern-face-gestures-detection-app-example/)**

## Features

- Real-time facial expression detection (happy, sad, angry, surprised, etc.)
- Real-time hand gesture recognition with skeleton overlay
- Eye tracking with gaze direction and blink detection
- Head gesture detection: nod, shake, and tilt
- Toggle each detector independently
- FPS counter and per-panel confidence display
- No backend required — all processing in the browser
- ES Modules architecture, no bundler needed

## Quick Start

```bash
npx serve .
```

Then open the URL in a browser. HTTPS or localhost required for camera access.

## How It Works

### Facial Expressions

Uses **@vladmandic/face-api** (TensorFlow.js) with SSD MobileNetV1 for face detection and a dedicated expression classification network. Detects 7 core emotions: happy, sad, angry, fearful, disgusted, surprised, and neutral. Each frame produces a probability distribution across all expressions.

### Hand Gestures

Uses **MediaPipe Gesture Recognizer** to detect hand landmarks (21 points per hand) and classify gestures such as open palm, fist, pointing, thumbs up, victory sign, and more. Draws a skeleton overlay on a dedicated canvas showing the detected hand structure.

### Eye Tracking

Uses **MediaPipe Face Landmarker** with iris detection. Locates the iris center relative to the eye center to derive gaze direction (left, right, up, down, center). Computes eye aspect ratio (EAR) from six landmarks per eye to detect blinks, maintaining a running blink counter.

### Head Gestures

Uses **MediaPipe Face Landmarker** facial transformation matrices to compute head pose as pitch (nod up/down), yaw (turn left/right), and roll (tilt). Analyzes pitch history for nod patterns (oscillation with sufficient range) and yaw history for shake patterns.

## Architecture

```
src/
  app.js                    — Main app: detection loop, UI wiring, state management
  camera.js                 — WebRTC camera controller (start/stop)
  ui.js                     — UI helper utilities (log, status, panel updates)
  gestures/
    expressions.js          — Facial expression detection (face-api.js)
    hand.js                 — Hand gesture recognition (MediaPipe)
    eye.js                  — Eye tracking with iris detection (MediaPipe)
    head.js                 — Head pose estimation & gesture detection (MediaPipe)
index.html                  — Single page with video, gesture panels, controls
styles.css                  — Dark theme UI
```

### Detection Flow

```
Camera Frame (requestAnimationFrame loop)
  ├→ Expression Detector (face-api.js)
  │    → detectSingleFace → withFaceExpressions → { happy, sad, ... }
  ├→ Hand Gesture Detector (MediaPipe)
  │    → recognizeForVideo → { gesture, score, landmarks } → draw skeleton
  ├→ Eye Tracker (MediaPipe Face Landmarker)
  │    → detectForVideo → iris position → gaze direction + blink score
  └→ Head Gesture Detector (MediaPipe Face Landmarker)
       → detectForVideo → transformation matrix → pitch/yaw/roll → nod/shake/tilt
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Expression Classification** | Neural network that maps face landmarks to emotion probabilities. |
| **Hand Landmarks** | 21-point skeleton representing hand joint positions. |
| **Gaze Direction** | Derived from iris center position relative to eye center. |
| **Eye Aspect Ratio (EAR)** | Ratio of vertical to horizontal eye distances used to detect blinks. |
| **Head Pose (Pitch/Yaw/Roll)** | Euler angles representing head rotation in 3D space. |
| **Nod Detection** | Oscillation pattern in pitch history exceeding a threshold. |
| **Shake Detection** | Oscillation pattern in yaw history exceeding a threshold. |

## Technology Stack

- **WebRTC** — Browser camera access
- **@vladmandic/face-api** — Facial expression detection (TensorFlow.js)
- **MediaPipe Tasks Vision** — Hand gesture recognition, eye tracking, head pose
- **Canvas API** — Overlay rendering and hand skeleton drawing
- **ES Modules** — Modern JavaScript architecture (no bundler required)

## Browser Support

- Chrome 90+
- Firefox 90+
- Edge 90+
- Safari 15+ (partial)
- Requires HTTPS or localhost

## Related

- **[face-gestures-detection-tutorial](https://github.com/jeanmachuca/face-gestures-detection-tutorial)** — Comprehensive tutorial
- **[modern-face-detection-app-example](https://github.com/jeanmachuca/modern-face-detection-app-example)** — Face detection & recognition app ([live](https://jeanmachuca.github.io/modern-face-detection-app-example/))

## License

MIT
