import { FilesetResolver, FaceLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';

const NOSE_TIP = 1;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_EYE = 33;
const RIGHT_EYE = 263;

const HISTORY_SIZE = 20;
const NOD_THRESHOLD = 5;
const SHAKE_THRESHOLD = 5;
const TILT_THRESHOLD = 8;

export class HeadGestureDetector {
    constructor() {
        this.faceLandmarker = null;
        this.loaded = false;
        this.pitchHistory = [];
        this.yawHistory = [];
    }

    async loadModels() {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
        });
        this.loaded = true;
    }

    async detect(input) {
        if (!this.loaded || !this.faceLandmarker) {
            return null;
        }
        const now = performance.now();
        const result = this.faceLandmarker.detectForVideo(input, now);

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            return null;
        }

        const landmarks = result.faceLandmarks[0];
        const pose = this._computePose(landmarks);

        this.pitchHistory.push(pose.pitch);
        this.yawHistory.push(pose.yaw);
        if (this.pitchHistory.length > HISTORY_SIZE) {
            this.pitchHistory.shift();
        }
        if (this.yawHistory.length > HISTORY_SIZE) {
            this.yawHistory.shift();
        }

        return {
            pitch: pose.pitch,
            yaw: pose.yaw,
            roll: pose.roll,
        };
    }

    detectNod(pitchHistory) {
        if (pitchHistory.length < HISTORY_SIZE) {
            return false;
        }
        let crossings = 0;
        const mean = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
        for (let i = 1; i < pitchHistory.length; i++) {
            if (
                (pitchHistory[i - 1] - mean) * (pitchHistory[i] - mean) < 0 &&
                Math.abs(pitchHistory[i] - pitchHistory[i - 1]) > 0.5
            ) {
                crossings++;
            }
        }
        const range = Math.max(...pitchHistory) - Math.min(...pitchHistory);
        return crossings >= 2 && range > NOD_THRESHOLD;
    }

    detectShake(yawHistory) {
        if (yawHistory.length < HISTORY_SIZE) {
            return false;
        }
        let crossings = 0;
        const mean = yawHistory.reduce((a, b) => a + b, 0) / yawHistory.length;
        for (let i = 1; i < yawHistory.length; i++) {
            if (
                (yawHistory[i - 1] - mean) * (yawHistory[i] - mean) < 0 &&
                Math.abs(yawHistory[i] - yawHistory[i - 1]) > 0.5
            ) {
                crossings++;
            }
        }
        const range = Math.max(...yawHistory) - Math.min(...yawHistory);
        return crossings >= 2 && range > SHAKE_THRESHOLD;
    }

    detectTilt(roll) {
        if (Math.abs(roll) > TILT_THRESHOLD) {
            return roll > 0 ? 'Left' : 'Right';
        }
        return null;
    }

    _computePose(landmarks) {
        const nose = landmarks[NOSE_TIP];
        const leftEar = landmarks[LEFT_EAR];
        const rightEar = landmarks[RIGHT_EAR];
        const forehead = landmarks[FOREHEAD];
        const chin = landmarks[CHIN];
        const leftEye = landmarks[LEFT_EYE];
        const rightEye = landmarks[RIGHT_EYE];

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;

        const yaw = (eyeCenterX - 0.5) * -60;

        const noseToChin = chin.y - nose.y;
        const noseToForehead = nose.y - forehead.y;
        const pitch = ((noseToChin - noseToForehead) / (noseToChin + noseToForehead)) * -30;

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const roll = Math.atan2(dy, dx) * (180 / Math.PI);

        return { pitch, yaw, roll };
    }
}
