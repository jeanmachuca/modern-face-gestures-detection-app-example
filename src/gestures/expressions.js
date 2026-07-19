import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

export class ExpressionDetector {
    constructor() {
        this.loaded = false;
    }

    async loadModels() {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        this.loaded = true;
    }

    async detect(input) {
        if (!this.loaded) {
            return null;
        }
        const detection = await faceapi
            .detectSingleFace(input, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (!detection) {
            return null;
        }

        return detection.expressions;
    }

    getDominantExpression(expressions) {
        if (!expressions) {
            return { name: 'neutral', confidence: 0 };
        }
        let dominant = 'neutral';
        let maxScore = 0;
        for (const [expression, score] of Object.entries(expressions)) {
            if (score > maxScore) {
                maxScore = score;
                dominant = expression;
            }
        }
        return { name: dominant, confidence: maxScore };
    }
}
