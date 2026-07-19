const el = (id) => document.getElementById(id);

export function log(container, message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

export function setModelStatus(text) {
    el('modelStatus').textContent = `Models: ${text}`;
}

export function setCameraStatus(state) {
    el('cameraStatus').textContent = `Camera: ${state}`;
}

export function setFPS(fps) {
    el('fpsDisplay').textContent = `FPS: ${fps}`;
}

export function updateExpressionPanel(expression, confidence) {
    el('expressionName').textContent = expression;
    el('expressionBar').style.width = `${(confidence * 100).toFixed(0)}%`;
    el('expressionConfidence').textContent = `${(confidence * 100).toFixed(0)}%`;
}

export function updateHandPanel(gesture, score) {
    el('handGestureName').textContent = gesture;
    el('handScore').textContent = `${(score * 100).toFixed(0)}%`;
}

export function updateEyePanel(gazeDirection, blinkCount) {
    const arrows = {
        'Center': '→',
        'Left': '←',
        'Right': '→',
        'Up': '↑',
        'Down': '↓',
        'Up Left': '↖',
        'Up Right': '↗',
        'Down Left': '↙',
        'Down Right': '↘',
    };
    el('gazeArrow').textContent = arrows[gazeDirection] || '→';
    el('gazeDirection').textContent = gazeDirection;
    el('blinkCount').textContent = blinkCount;
}

export function updateHeadPanel(nod, shake, tilt) {
    el('headNod').textContent = `Nod: ${nod ? 'Detected' : '—'}`;
    el('headShake').textContent = `Shake: ${shake ? 'Detected' : '—'}`;
    el('headTilt').textContent = `Tilt: ${tilt || '—'}`;
}
