import { FilesetResolver, GestureRecognizer } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';

export class HandGestureDetector {
    constructor() {
        this.recognizer = null;
        this.loaded = false;
    }

    async loadModels() {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        this.recognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
        });
        this.loaded = true;
    }

    async detect(input) {
        if (!this.loaded || !this.recognizer) {
            return [];
        }
        const now = performance.now();
        const result = this.recognizer.recognizeForVideo(input, now);

        if (!result.gestures || result.gestures.length === 0) {
            return [];
        }

        return result.gestures.map((gestureSet, i) => {
            const top = gestureSet[0];
            return {
                gesture: top.categoryName,
                score: top.score,
                landmarks: result.landmarks?.[i] || [],
            };
        });
    }

    drawHandSkeleton(ctx, landmarks, width, height) {
        if (!landmarks || landmarks.length === 0) {
            return;
        }

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17],
        ];

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;

        for (const [start, end] of connections) {
            const s = landmarks[start];
            const e = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(s.x * width, s.y * height);
            ctx.lineTo(e.x * width, e.y * height);
            ctx.stroke();
        }

        ctx.fillStyle = '#3b82f6';
        for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
