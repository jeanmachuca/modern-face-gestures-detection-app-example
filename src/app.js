import { CameraController } from './camera.js';
import { ExpressionDetector } from './gestures/expressions.js';
import { HandGestureDetector } from './gestures/hand.js';
import { EyeTracker } from './gestures/eye.js';
import { HeadGestureDetector } from './gestures/head.js';
import {
    log,
    setModelStatus,
    setCameraStatus,
    setFPS,
    updateExpressionPanel,
    updateHandPanel,
    updateEyePanel,
    updateHeadPanel,
} from './ui.js';

const el = (id) => document.getElementById(id);

class App {
    constructor() {
        this.video = el('video');
        this.overlay = el('overlay');
        this.ctx = this.overlay.getContext('2d');
        this.handCanvas = el('handCanvas');
        this.handCtx = this.handCanvas.getContext('2d');
        this.logContainer = el('logContainer');

        this.camera = new CameraController(this.video);
        this.expressionDetector = new ExpressionDetector();
        this.handDetector = new HandGestureDetector();
        this.eyeTracker = new EyeTracker();
        this.headDetector = new HeadGestureDetector();

        this.running = false;
        this.processing = false;
        this.intervalId = null;
        this.blinkCount = 0;
        this.lastBlinkState = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = performance.now();

        this.enabled = {
            expression: true,
            hand: false,
            eye: false,
            head: false,
        };

        this._bindUI();
        this._loadModels();
    }

    _bindUI() {
        el('startBtn').addEventListener('click', () => this._toggleCamera());
        el('toggleExpression').addEventListener('change', (e) => {
            this.enabled.expression = e.target.checked;
        });
        el('toggleHand').addEventListener('change', (e) => {
            this.enabled.hand = e.target.checked;
        });
        el('toggleEye').addEventListener('change', (e) => {
            this.enabled.eye = e.target.checked;
        });
        el('toggleHead').addEventListener('change', (e) => {
            this.enabled.head = e.target.checked;
        });
    }

    async _loadModels() {
        setModelStatus('Loading...');
        log(this.logContainer, 'Loading models...');

        try {
            const promises = [];

            promises.push(
                this.expressionDetector.loadModels().then(() => {
                    log(this.logContainer, 'Expression model loaded (face-api.js)', 'success');
                })
            );

            promises.push(
                this.handDetector.loadModels().then(() => {
                    log(this.logContainer, 'Hand gesture model loaded (MediaPipe)', 'success');
                })
            );

            promises.push(
                this.eyeTracker.loadModels().then(() => {
                    log(this.logContainer, 'Eye tracker model loaded (MediaPipe)', 'success');
                })
            );

            promises.push(
                this.headDetector.loadModels().then(() => {
                    log(this.logContainer, 'Head gesture model loaded (MediaPipe)', 'success');
                })
            );

            await Promise.all(promises);
            setModelStatus('Loaded');
            log(this.logContainer, 'All models loaded — start camera to begin detection', 'success');
        } catch (err) {
            setModelStatus('Error');
            log(this.logContainer, `Model loading failed: ${err.message}`, 'error');
            console.error('Model loading error:', err);
        }
    }

    async _toggleCamera() {
        const btn = el('startBtn');
        if (this.running) {
            this._stop();
            btn.textContent = 'Start Camera';
        } else {
            btn.disabled = true;
            btn.textContent = 'Starting...';
            try {
                await this.camera.start();
                this._resizeOverlay();
                this.running = true;
                btn.textContent = 'Stop Camera';
                setCameraStatus('Active');
                log(this.logContainer, 'Camera started — detection running', 'success');
                this._startLoop();
            } catch (err) {
                log(this.logContainer, err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        }
    }

    _stop() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.camera.stop();
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        setCameraStatus('Off');
        log(this.logContainer, 'Camera stopped');
    }

    _resizeOverlay() {
        this.overlay.width = this.video.videoWidth || 1280;
        this.overlay.height = this.video.videoHeight || 720;
    }

    _startLoop() {
        this.intervalId = setInterval(() => this._tick(), 150);
        this._tick();
    }

    async _tick() {
        if (!this.running || this.processing) {
            return;
        }

        if (this.video.readyState < 2) {
            return;
        }

        this.processing = true;
        this._resizeOverlay();

        try {
            if (this.enabled.expression) {
                await this._detectExpression();
            }
            if (this.enabled.hand) {
                await this._detectHand();
            }
            if (this.enabled.eye) {
                await this._detectEye();
            }
            if (this.enabled.head) {
                await this._detectHead();
            }
        } catch (e) {
            console.error('Detection loop error:', e);
        }

        this.processing = false;
        this._updateFPS();
    }

    async _detectExpression() {
        try {
            const expr = await this.expressionDetector.detect(this.video);
            if (expr) {
                const dominant = this.expressionDetector.getDominantExpression(expr);
                updateExpressionPanel(dominant.name, dominant.confidence);
            } else {
                updateExpressionPanel('No face', 0);
            }
        } catch (e) {
            console.error('Expression detection error:', e);
            updateExpressionPanel('Error', 0);
        }
    }

    async _detectHand() {
        try {
            const hands = await this.handDetector.detect(this.video);
            this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
            if (hands.length > 0) {
                const top = hands[0];
                updateHandPanel(top.gesture, top.score);
                this.handDetector.drawHandSkeleton(
                    this.handCtx,
                    top.landmarks,
                    this.handCanvas.width,
                    this.handCanvas.height
                );
            } else {
                updateHandPanel('No hand', 0);
            }
        } catch (e) {
            console.error('Hand detection error:', e);
            updateHandPanel('Error', 0);
        }
    }

    async _detectEye() {
        try {
            const eyeData = await this.eyeTracker.detect(this.video);
            if (eyeData) {
                if (eyeData.blinkScore > 0.7 && !this.lastBlinkState) {
                    this.blinkCount++;
                }
                this.lastBlinkState = eyeData.blinkScore > 0.7;
                updateEyePanel(eyeData.gazeDirection, this.blinkCount);
            } else {
                updateEyePanel('No face', this.blinkCount);
            }
        } catch (e) {
            console.error('Eye tracking error:', e);
            updateEyePanel('Error', this.blinkCount);
        }
    }

    async _detectHead() {
        try {
            const headData = await this.headDetector.detect(this.video);
            if (headData) {
                const nod = this.headDetector.detectNod(this.headDetector.pitchHistory);
                const shake = this.headDetector.detectShake(this.headDetector.yawHistory);
                const tilt = this.headDetector.detectTilt(headData.roll);
                updateHeadPanel(nod, shake, tilt);

                this.ctx.save();
                this.ctx.fillStyle = '#3b82f6';
                const cx = this.overlay.width / 2;
                const cy = this.overlay.height / 4;
                this.ctx.beginPath();
                this.ctx.arc(cx + headData.yaw * 2, cy + headData.pitch * 2, 4, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.restore();
            } else {
                updateHeadPanel(false, false, null);
            }
        } catch (e) {
            console.error('Head detection error:', e);
            updateHeadPanel(false, false, null);
        }
    }

    _updateFPS() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
            setFPS(this.fps);
        }
    }
}

new App();
