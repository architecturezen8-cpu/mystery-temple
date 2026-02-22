/* ═══════════════════════════════════════════════════════════════════════════
   08-GESTURE.JS
   Mystery Temple - Galaxy Edition

   Camera + MediaPipe Hands gesture verification.
   - Handles permission errors safely
   - Low-light detection (allows skip ONLY for low-light)
   - Gesture hold-to-verify progress UI
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------------------
   UI HELPERS
--------------------------------------------------------------------------- */

function updateDetectionStatus(detected, text) {
    const dot = document.querySelector('#detectionStatus .detection-dot');
    const textEl = document.querySelector('#detectionStatus .detection-text');

    if (dot) dot.classList.toggle('detected', Boolean(detected));
    if (textEl) textEl.textContent = text || '';
}

function updateGestureVerifyProgress(percent) {
    const fill = getEl('gestureVerifyProgressFill');
    const percentText = getEl('gestureVerifyPercent');
    const label = getEl('gestureVerifyLabel');

    const p = Math.max(0, Math.min(100, percent));

    if (fill) fill.style.width = `${p}%`;
    if (percentText) percentText.textContent = `${Math.floor(p)}%`;

    if (!label) return;

    if (p >= 100) label.textContent = '✅ GESTURE VERIFIED!';
    else if (p > 0) label.textContent = `🖐 HOLD STEADY... ${Math.floor(p)}%`;
    else label.textContent = '🖐 HOLD GESTURE TO VERIFY...';
}

/* ---------------------------------------------------------------------------
   CAMERA ERROR BOX
--------------------------------------------------------------------------- */

function showCameraError(message) {
    const box = getEl('cameraErrorBox');
    const text = getEl('cameraErrorText');
    if (!box || !text) return;

    text.textContent = message || 'Camera access failed. Please allow camera and press RETRY.';
    box.classList.remove('hidden');

    updateDetectionStatus(false, 'Camera unavailable');
}

function hideCameraError() {
    const box = getEl('cameraErrorBox');
    if (box) box.classList.add('hidden');
}

function retryGestureCamera() {
    hideCameraError();
    stopGestureCamera();
    updateDetectionStatus(false, 'Requesting camera...');
    startGestureCamera();
}

window.retryGestureCamera = retryGestureCamera;

/* ---------------------------------------------------------------------------
   PRIVACY TRANSLATE BUTTON
--------------------------------------------------------------------------- */

function initCameraPrivacyTranslate() {
    const btn = getEl('cameraPrivacyTranslateBtn');
    const textEl = getEl('cameraPrivacyText');
    if (!btn || !textEl) return;

    let isSinhala = false;

    btn.addEventListener('click', async () => {
        textEl.style.opacity = '0.2';
        await sleep(120);

        isSinhala = !isSinhala;

        if (isSinhala) {
            // Sinhala (only here because it can be unclear otherwise)
            textEl.textContent =
                'අපි ඔබගේ කැමරා වීඩියෝව කිසිදා record හෝ save කරන්නේ නැහැ. සියලුම gesture detection processing ඔබගේ device එක තුළම පමණයි.';
            btn.innerHTML = '<span class="translate-icon">🌐</span> Switch to English';
        } else {
            textEl.textContent =
                'We never store your camera video. All gesture detection runs only on your device.';
            btn.innerHTML = '<span class="translate-icon">🌐</span> සිංහලට පරිවර්තනය කරන්න';
        }

        await sleep(80);
        textEl.style.opacity = '1';
    });
}

/* ---------------------------------------------------------------------------
   CURRENT REQUIRED GESTURE
--------------------------------------------------------------------------- */

function getCurrentGesture() {
    // Cipher mode gesture verification
    if (gestureMode === 'cipher' && cipherGestureIndex >= 0) {
        return GESTURE_CONFIG.levels[cipherGestureIndex] || GESTURE_CONFIG.levels[0];
    }

    // Normal level gesture
    return getGestureForLevel(currentLevel);
}

/* ---------------------------------------------------------------------------
   MODAL OPEN/CLOSE
--------------------------------------------------------------------------- */

async function openGestureModal() {
    const modal = getEl('gestureModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    hideCameraError();

    // Reset verification state
    gestureMatchProgress = 0;
    gestureHoldStart = 0;
    gestureDetected = false;
    brightnessCheckCount = 0;

    updateGestureVerifyProgress(0);
    updateDetectionStatus(false, 'Starting...');

    // Update target icon
    const gesture = getCurrentGesture();
    const targetEl = getEl('gestureTarget');
    if (targetEl) targetEl.textContent = gesture.icon;

    // Reset password sections
    hideEl('gesturePasswordSection');
    hideEl('gesturePasswordInput');

    // Low light warning hidden at start
    setLowLightWarning(false);

    await startGestureCamera();
}

function closeGestureModal() {
    hideEl('gestureModal');
    stopGestureCamera();
}

window.openGestureModal = openGestureModal;
window.closeGestureModal = closeGestureModal;

/* ---------------------------------------------------------------------------
   LOW-LIGHT CHECK
--------------------------------------------------------------------------- */

function analyzeBrightness(video, canvas) {
    if (!video || !canvas) return 50;
    const ctx = canvas.getContext('2d');

    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let total = 0;
        let count = 0;

        // sample step for performance
        for (let i = 0; i < data.length; i += 160) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            total += (0.299 * r + 0.587 * g + 0.114 * b);
            count++;
        }

        brightnessLevel = total / Math.max(count, 1);
        return brightnessLevel;
    } catch {
        return 50;
    }
}

function setLowLightWarning(show) {
    const w = getEl('lowLightWarning');
    if (!w) return;
    w.classList.toggle('hidden', !show);
}

/**
 * Low-light skip is allowed.
 * Permission fail skip is NOT allowed (security requirement).
 */
function skipGestureAndShowPassword() {
    stopGestureCamera();
    revealPasswordFromGesture();
}
window.skipGestureAndShowPassword = skipGestureAndShowPassword;

/* ---------------------------------------------------------------------------
   CAMERA START/STOP
--------------------------------------------------------------------------- */

async function startGestureCamera() {
    const video = getEl('cameraVideo');
    const canvas = getEl('cameraCanvas');

    if (!video || !canvas) {
        showCameraError('Camera UI missing. Please refresh the page.');
        return;
    }

    try {
        updateDetectionStatus(false, 'Starting camera...');

        gestureStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 320 },
                height: { ideal: 240 }
            }
        });

        video.srcObject = gestureStream;

        await new Promise((resolve, reject) => {
            let done = false;

            video.onloadedmetadata = () => {
                video.play()
                    .then(() => {
                        done = true;
                        resolve();
                    })
                    .catch(reject);
            };

            setTimeout(() => {
                if (!done) reject(new Error('Camera timeout'));
            }, 7000);
        });

        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        if (typeof Hands === 'undefined') {
            showCameraError('Hand detection library not loaded. Check internet and refresh.');
            return;
        }

        updateDetectionStatus(false, 'Loading hand detection...');

        gestureHands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        gestureHands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
        });

        gestureHands.onResults(onGestureResults);

        updateDetectionStatus(false, 'Show your hand...');
        detectGestureLoop(video);

    } catch (error) {
        console.error('Camera error:', error);

        let msg = 'Camera access failed. Please allow camera permission and press RETRY.';
        if (error?.name === 'NotAllowedError') msg = 'Camera permission denied. Allow it and press RETRY.';
        if (error?.name === 'NotFoundError') msg = 'No camera device found.';
        if (error?.message) msg += ` (${error.message})`;

        showCameraError(msg);
    }
}

function stopGestureCamera() {
    const video = getEl('cameraVideo');
    if (video) {
        try { video.pause(); } catch { }
        video.srcObject = null;
    }

    if (gestureStream) {
        gestureStream.getTracks().forEach(t => t.stop());
        gestureStream = null;
    }

    gestureHands = null;
    gestureDetected = false;
    gestureHoldStart = 0;
    brightnessCheckCount = 0;
}

/* ---------------------------------------------------------------------------
   DETECTION LOOP
--------------------------------------------------------------------------- */

async function detectGestureLoop(video) {
    if (!gestureHands || !gestureStream) return;

    const canvas = getEl('cameraCanvas');

    // Low-light check every ~15 frames
    if (video.readyState >= 2) {
        brightnessCheckCount++;
        if (brightnessCheckCount >= 15) {
            brightnessCheckCount = 0;
            const b = analyzeBrightness(video, canvas);
            setLowLightWarning(b < 40);
        }

        try {
            await gestureHands.send({ image: video });
        } catch (e) {
            console.error('Hand detection error:', e);
        }
    }

    if (gestureStream) requestAnimationFrame(() => detectGestureLoop(video));
}

/* ---------------------------------------------------------------------------
   RESULTS HANDLER
--------------------------------------------------------------------------- */

/* ====== BEGIN REPLACE: onGestureResults (safe + cipher hold progress) ====== */
function onGestureResults(results) {
    const canvas = getEl('cameraCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const setCipherHold = (percent, active) => {
        if (gestureMode === 'cipher' && typeof window.cipherSetHoldProgress === 'function') {
            window.cipherSetHoldProgress(percent, active);
        }
    };

    const hasHand =
        results &&
        results.multiHandLandmarks &&
        Array.isArray(results.multiHandLandmarks) &&
        results.multiHandLandmarks.length > 0;

    if (!hasHand) {
        updateDetectionStatus(false, 'Show your hand...');
        gestureDetected = false;
        gestureHoldStart = 0;
        gestureMatchProgress = 0;

        updateGestureVerifyProgress(0);
        setCipherHold(0, false);
        return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // Draw landmarks (if function exists)
    if (typeof drawHandLandmarks === 'function') {
        drawHandLandmarks(ctx, landmarks, canvas.width, canvas.height);
    }

    const detectedGesture = detectGestureType(landmarks);
    const requiredGesture = getCurrentGesture();

    updateDetectionStatus(true, `Detected: ${detectedGesture.name}`);

    // If gesture matches requirement -> hold to verify
    if (detectedGesture.type === requiredGesture.gesture) {
        if (!gestureDetected) {
            gestureDetected = true;
            gestureHoldStart = Date.now();
            gestureMatchProgress = 0;
        }

        const holdTime = Date.now() - gestureHoldStart;
        const progress = Math.min(100, (holdTime / GESTURE_CONFIG.holdTime) * 100);

        updateGestureVerifyProgress(progress);
        setCipherHold(progress, true);

        // Prevent double-trigger
        if (progress >= 100 && gestureMatchProgress < 100) {
            gestureMatchProgress = 100;

            // Lock UI at 100%
            updateGestureVerifyProgress(100);
            setCipherHold(100, true);

            // Trigger reveal/verify flow
            revealPasswordFromGesture();
        }

        return;
    }

    // Gesture mismatch -> reset
    gestureDetected = false;
    gestureHoldStart = 0;
    gestureMatchProgress = 0;

    updateGestureVerifyProgress(0);
    setCipherHold(0, false);
}
/* ====== END REPLACE: onGestureResults (safe + cipher hold progress) ====== */

/* ---------------------------------------------------------------------------
   GESTURE CLASSIFICATION
--------------------------------------------------------------------------- */

function detectGestureType(landmarks) {
    // Most reliable first
    if (isIndexPoint(landmarks)) return { type: 'point', name: 'Index Point ☝️' };

    const fingersUp = countFingersUp(landmarks);

    if (fingersUp === 5) return { type: 'open_palm', name: 'Open Palm ✋' };
    if (fingersUp === 2 && isIndexMiddleUp(landmarks)) return { type: 'peace', name: 'Peace ✌️' };
    if (fingersUp === 0) return { type: 'fist', name: 'Fist 👊' };
    if (fingersUp === 3 && isLoveSign(landmarks)) return { type: 'love', name: 'Love 🤟' };

    return { type: 'unknown', name: `${fingersUp} fingers` };
}

function isIndexPoint(landmarks) {
    const indexUp = landmarks[8].y < landmarks[6].y;
    const middleDown = landmarks[12].y > landmarks[10].y;
    const ringDown = landmarks[16].y > landmarks[14].y;
    const pinkyDown = landmarks[20].y > landmarks[18].y;
    return indexUp && middleDown && ringDown && pinkyDown;
}

function countFingersUp(landmarks) {
    let count = 0;

    // Thumb (simple heuristic; mirrored camera can affect this)
    if (landmarks[4].x < landmarks[3].x) count++;

    if (landmarks[8].y < landmarks[6].y) count++;     // index
    if (landmarks[12].y < landmarks[10].y) count++;   // middle
    if (landmarks[16].y < landmarks[14].y) count++;   // ring
    if (landmarks[20].y < landmarks[18].y) count++;   // pinky

    return count;
}

function isIndexMiddleUp(landmarks) {
    const indexUp = landmarks[8].y < landmarks[6].y;
    const middleUp = landmarks[12].y < landmarks[10].y;
    const ringDown = landmarks[16].y > landmarks[14].y;
    const pinkyDown = landmarks[20].y > landmarks[18].y;
    return indexUp && middleUp && ringDown && pinkyDown;
}

function isLoveSign(landmarks) {
    const thumbOut = landmarks[4].x < landmarks[3].x;
    const indexUp = landmarks[8].y < landmarks[6].y;
    const middleDown = landmarks[12].y > landmarks[10].y;
    const ringDown = landmarks[16].y > landmarks[14].y;
    const pinkyUp = landmarks[20].y < landmarks[18].y;
    return thumbOut && indexUp && middleDown && ringDown && pinkyUp;
}

/* ---------------------------------------------------------------------------
   LANDMARK DRAW
--------------------------------------------------------------------------- */

function drawHandLandmarks(ctx, landmarks, width, height) {
    ctx.fillStyle = '#0f8';
    ctx.strokeStyle = '#0f8';
    ctx.lineWidth = 2;

    // points
    for (const p of landmarks) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // connections
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
    ];

    for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
        ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
        ctx.stroke();
    }
}

/* ---------------------------------------------------------------------------
   AFTER VERIFIED: PASSWORD REVEAL / CIPHER VERIFY
--------------------------------------------------------------------------- */

async function revealPasswordFromGesture() {
    // Cipher mode: mark gesture verified and return to cipher
    if (gestureMode === 'cipher') {
        stopGestureCamera();
        closeGestureModal();

        if (typeof cipherMarkGestureVerified === 'function') {
            cipherMarkGestureVerified(cipherGestureIndex);
        }

        gestureMode = 'password';
        cipherGestureIndex = -1;
        return;
    }

    // Normal level: reveal password characters in modal
    stopGestureCamera();

    const section = getEl('gesturePasswordSection');
    const display = getEl('gesturePasswordDisplay');
    const inputSection = getEl('gesturePasswordInput');

    if (!section || !display) {
        closeGestureModal();
        return;
    }

    display.innerHTML = '';

    const chars = (currentPassword || '').split('');
    const charDivs = [];

    for (const ch of chars) {
        const div = document.createElement('div');
        div.className = 'revealed-password-char';
        div.dataset.target = ch;
        div.textContent = '?';
        div.style.opacity = '0';
        div.style.transform = 'scale(0.5)';
        display.appendChild(div);
        charDivs.push(div);
    }

    section.classList.remove('hidden');

    await sleep(120);
    charDivs.forEach((d, i) => {
        setTimeout(() => {
            d.style.transition = 'all 0.2s ease';
            d.style.opacity = '1';
            d.style.transform = 'scale(1)';
        }, i * 55);
    });

    // random -> final
    for (let i = 0; i < charDivs.length; i++) {
        const div = charDivs[i];
        const target = div.dataset.target;
        const steps = 6 + Math.floor(Math.random() * 4);

        for (let s = 0; s < steps; s++) {
            div.textContent = ENGLISH_CHARS[Math.floor(Math.random() * ENGLISH_CHARS.length)];
            await sleep(45);
        }
        div.textContent = target;
    }

    await sleep(450);
    if (inputSection) inputSection.classList.remove('hidden');
}

/* ---------------------------------------------------------------------------
   INIT EXPORT
--------------------------------------------------------------------------- */

window.initCameraPrivacyTranslate = initCameraPrivacyTranslate;

console.log('✅ 08-gesture.js loaded');