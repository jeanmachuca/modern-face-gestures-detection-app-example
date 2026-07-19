import { FilesetResolver, FaceLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS_INDEX = 468;
const RIGHT_IRIS_INDEX = 473;

export class EyeTracker {
    constructor() {
        this.faceLandmarker = null;
        this.loaded = false;
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
            outputFacialTransformationMatrixes: false,
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

        const leftEyeCenter = this._averagePoints(landmarks, LEFT_EYE_INDICES);
        const rightEyeCenter = this._averagePoints(landmarks, RIGHT_EYE_INDICES);

        const leftIris = landmarks[LEFT_IRIS_INDEX];
        const rightIris = landmarks[RIGHT_IRIS_INDEX];

        const irisX = (leftIris.x + rightIris.x) / 2;
        const irisY = (leftIris.y + rightIris.y) / 2;
        const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyeCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

        const leftBlink = this.detectBlink(
            LEFT_EYE_INDICES.map(i => landmarks[i])
        );
        const rightBlink = this.detectBlink(
            RIGHT_EYE_INDICES.map(i => landmarks[i])
        );
        const blinkScore = (leftBlink + rightBlink) / 2;

        const gazeDirection = this.getGazeDirection(
            { x: irisX, y: irisY },
            { x: eyeCenterX, y: eyeCenterY }
        );

        return {
            gazeDirection,
            blinkScore,
            irisPosition: { x: irisX, y: irisY },
        };
    }

    getGazeDirection(irisPosition, eyeCenter) {
        const dx = irisPosition.x - eyeCenter.x;
        const dy = irisPosition.y - eyeCenter.y;
        const threshold = 0.015;

        let x = 'Center';
        let y = '';

        if (dx < -threshold) {
            x = 'Left';
        } else if (dx > threshold) {
            x = 'Right';
        }

        if (dy < -threshold) {
            y = 'Up';
        } else if (dy > threshold) {
            y = 'Down';
        }

        if (x === 'Center' && y === 'Center') {
            return 'Center';
        }
        if (x === 'Center') {
            return y;
        }
        if (y === '') {
            return x;
        }
        return `${y} ${x}`;
    }

    detectBlink(eyeLandmarks) {
        if (!eyeLandmarks || eyeLandmarks.length < 6) {
            return 0;
        }
        const vertical1 = this._distance(eyeLandmarks[1], eyeLandmarks[5]);
        const vertical2 = this._distance(eyeLandmarks[2], eyeLandmarks[4]);
        const horizontal = this._distance(eyeLandmarks[0], eyeLandmarks[3]);

        if (horizontal === 0) {
            return 0;
        }
        const ear = (vertical1 + vertical2) / (2 * horizontal);
        return Math.min(1, Math.max(0, 1 - (ear - 0.05) / 0.2));
    }

    _averagePoints(landmarks, indices) {
        let x = 0;
        let y = 0;
        for (const i of indices) {
            x += landmarks[i].x;
            y += landmarks[i].y;
        }
        return { x: x / indices.length, y: y / indices.length };
    }

    _distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
}
