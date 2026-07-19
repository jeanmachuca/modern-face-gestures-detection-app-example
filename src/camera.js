const CAMERA_CONFIG = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
    },
    audio: false,
};

export class CameraController {
    constructor(videoElement) {
        this.video = videoElement;
        this.stream = null;
        this.active = false;
    }

    async start() {
        if (this.active) {
            return;
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONFIG);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.active = true;
            return true;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera permission denied. Please allow camera access.');
            }
            if (error.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            }
            throw new Error(`Camera error: ${error.message}`);
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.video.srcObject = null;
        this.active = false;
    }
}
