/* ═══════════════════════════════════════════════════════════════════════════
   13-MAIN.JS
   Mystery Temple - Galaxy Edition

   Game flow + loop:
   - Progressive loading
   - UI initialization
   - Level flow (runes -> story event -> chase -> gesture -> hacking -> morse)
   - Update loop (movement, spawning, chase, collisions, particles)
   - Pause / restart / game over

   NOTE:
   - No “override” patterns used.
   - Each responsibility stays in its own file.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------------------
   UI: LETTER / RUNE SLOTS
--------------------------------------------------------------------------- */

function initLetterSlots() {
    const levelCfg = getLevelConfig(currentLevel);
    currentPassword = levelCfg.password;
    collectedLetters = [];

    const container = getEl('collectedLetters');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < LETTERS_REQUIRED; i++) {
        const slot = document.createElement('div');
        slot.className = 'letter-slot';
        slot.id = `letterSlot${i}`;
        slot.textContent = '?';
        container.appendChild(slot);
    }

    updateGestureProgressUI(0);
}

function updateLetterDisplay() {
    for (let i = 0; i < LETTERS_REQUIRED; i++) {
        const slot = getEl(`letterSlot${i}`);
        if (!slot) continue;

        if (collectedLetters[i]) {
            slot.textContent = RUNE_SYMBOLS[i];
            slot.classList.add('filled');
        } else {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
    }

    const filled = collectedLetters.filter(Boolean).length;
    updateGestureProgressUI((filled / LETTERS_REQUIRED) * 100);

    // Once all runes are collected, wait until path clears then trigger story event
    if (filled >= LETTERS_REQUIRED && !storyObjectActive && !waitingForClearPath) {
        waitingForClearPath = true;
        const sp = getEl('storyPanel');
        if (sp) sp.textContent = '✨ Path clearing...';
    }
}

function updateGestureProgressUI(percent) {
    const bar = getEl('gestureProgressBar');
    const hint = getEl('gestureHint');

    const p = Math.max(0, Math.min(100, percent));

    if (bar) bar.style.width = `${p}%`;
    if (hint) hint.textContent = p < 100 ? 'Collect all runes!' : 'Ready for gesture!';
}

/* expose because collisions.js calls updateLetterDisplay() */
window.updateLetterDisplay = updateLetterDisplay;

/* ---------------------------------------------------------------------------
   UI: PASSWORD / LEVEL COMPLETE SCREEN
--------------------------------------------------------------------------- */

function showPasswordEntry() {
    // Build rune symbol display
    const runeContainer = getEl('runeSymbolDisplay');
    if (runeContainer) {
        runeContainer.innerHTML = '';
        for (let i = 0; i < LETTERS_REQUIRED; i++) {
            const div = document.createElement('div');
            div.className = 'rune-symbol';
            div.textContent = RUNE_SYMBOLS[i];
            runeContainer.appendChild(div);
        }
    }

    // Set required gesture
    const gesture = getCurrentGesture();
    const iconEl = getEl('gestureRequiredIcon');
    const nameEl = getEl('gestureRequiredName');
    if (iconEl) iconEl.textContent = gesture.icon;
    if (nameEl) nameEl.textContent = gesture.name;

    showEl('levelCompleteOverlay');
}

function goToPasswordPage() {
    // Close gesture modal and level overlay, then show hacking terminal.
    hideEl('gestureModal');
    hideEl('levelCompleteOverlay');

    // Show hacking animation; user clicks "Continue to Secret"
    showHackingAnimation();
}

window.goToPasswordPage = goToPasswordPage;

/* Fallback password modal (legacy) */
function checkMainPassword() {
    const input = getEl('mainPasswordInput');
    const err = getEl('mainPasswordError');
    if (!input || !err) return;

    const entered = input.value.toUpperCase().trim();
    if (entered === (currentPassword || '').toUpperCase()) {
        hideEl('passwordModal');
        showHackingAnimation();
    } else {
        err.classList.remove('hidden');
        input.value = '';
        vibrate([90, 40, 90]);
    }
}

function closeMainPasswordModal() {
    hideEl('passwordModal');
}

window.checkMainPassword = checkMainPassword;
window.closeMainPasswordModal = closeMainPasswordModal;

/* ---------------------------------------------------------------------------
   STORY EVENT + CHASE FLOW
--------------------------------------------------------------------------- */

function triggerStoryEvent() {
    gamePaused = true;
    storyObjectActive = true;
    waitingForClearPath = false;
    chaseStarted = false;

    clearAllObstacles();

    const levelCfg = getLevelConfig(currentLevel);
    const iconEl = getEl('mysteryIcon');
    if (iconEl) iconEl.textContent = levelCfg.icon;

    showEl('mysteryAlert');
    createStoryObject();
}

function startCountdownOnScreen() {
    hideEl('mysteryAlert');

    const cd = getEl('gameCountdown');
    const big = getEl('countdownBig');

    if (!cd || !big) {
        startChase();
        return;
    }

    cd.classList.remove('hidden');

    let count = 3;
    big.textContent = String(count);
    big.className = 'countdown-big';

    countdownTimer = setInterval(() => {
        count--;

        if (count > 0) {
            big.textContent = String(count);
            big.style.animation = 'none';
            setTimeout(() => { big.style.animation = 'countdownPop 1s ease-in-out'; }, 10);
        } else if (count === 0) {
            big.textContent = 'GO!';
            big.className = 'countdown-go';
        } else {
            clearInterval(countdownTimer);
            countdownTimer = null;
            cd.classList.add('hidden');
            startChase();
        }
    }, 1000);
}

window.startCountdownOnScreen = startCountdownOnScreen;

function startChase() {
    const levelCfg = getLevelConfig(currentLevel);

    setText('chaseTitle', `${levelCfg.icon} CATCH IT!`);

    const barWrap = getEl('chaseProgress');
    const fillEl = getEl('chaseFill');
    if (barWrap) barWrap.classList.remove('hidden');
    if (fillEl) {
        fillEl.style.width = '0%';
        fillEl.classList.remove('danger');
    }

    const sp = getEl('storyPanel');
    if (sp) {
        sp.classList.add('event-active');
        sp.textContent = `⚡ Catch the ${levelCfg.name}!`;
    }

    chaseProgress = 0;
    chaseStarted = true;
    gamePaused = false;
}

function catchStoryObject() {
    const levelCfg = getLevelConfig(currentLevel);

    if (storyObject) {
        createParticleEffect(storyObject.position, levelCfg.objectColor, 25);
        scene.remove(storyObject);
        storyObject = null;
    }

    storyObjectActive = false;
    chaseStarted = false;
    gamePaused = true;

    vibrate([100, 50, 100]);

    hideEl('chaseProgress');

    const sp = getEl('storyPanel');
    if (sp) sp.classList.remove('event-active');

    showPasswordEntry();
}

window.catchStoryObject = catchStoryObject;

function showRetryAlert() {
    gamePaused = true;
    chaseStarted = false;

    if (storyObject) {
        scene.remove(storyObject);
        storyObject = null;
    }

    hideEl('chaseProgress');
    showEl('retryAlert');
}

function retryLevel() {
    hideEl('retryAlert');

    storyObjectActive = false;
    chaseStarted = false;
    chaseProgress = 0;
    waitingForClearPath = false;
    collectedLetters = [];

    if (storyObject) {
        scene.remove(storyObject);
        storyObject = null;
    }

    // Clear objects
    reset3DObjects();
    resetPlayerPosition();

    initLetterSlots();
    updateGemCounterUI();
    updateHeartProgressUI();

    const sp = getEl('storyPanel');
    const levelCfg = getLevelConfig(currentLevel);
    if (sp) {
        sp.classList.remove('event-active');
        sp.textContent = `${levelCfg.icon} Collect 0/${LETTERS_REQUIRED} runes`;
    }

    gamePaused = false;
    showEl('pauseBtn');
}

window.retryLevel = retryLevel;

/* ---------------------------------------------------------------------------
   LEVEL CONTINUATION
--------------------------------------------------------------------------- */

function continueToNextLevel() {
    currentLevel++;

    if (currentLevel >= LEVELS.length) {
        currentLevel = LEVELS.length - 1;
        showFinalWin();
        return;
    }

    storyObjectActive = false;
    chaseStarted = false;
    chaseProgress = 0;
    waitingForClearPath = false;
    collectedLetters = [];

    if (storyObject) {
        scene.remove(storyObject);
        storyObject = null;
    }

    reset3DObjects();
    resetPlayerPosition();

    initLetterSlots();
    updateGemCounterUI();
    updateHeartProgressUI();

    const sp = getEl('storyPanel');
    const levelCfg = getLevelConfig(currentLevel);
    if (sp) {
        sp.classList.remove('event-active');
        sp.textContent = `${levelCfg.icon} Collect 0/${LETTERS_REQUIRED} runes`;
    }

    hideEl('chaseProgress');
    gamePaused = false;
    gameRunning = true;
}

/* cipher.js calls this */
window.continueToNextLevel = continueToNextLevel;

/* ---------------------------------------------------------------------------
   GAME OVER
--------------------------------------------------------------------------- */

function gameOver() {
    gameRunning = false;

    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (morseCountdownTimer) { clearInterval(morseCountdownTimer); morseCountdownTimer = null; }

    if (score > highscore) {
        highscore = score;
        localStorage.setItem('mysteryMagicHighscore', String(highscore));
        setText('highscore', String(highscore));
    }

    setText('finalScore', String(score));
    const lvlReached = getEl('finalLevel');
    if (lvlReached) lvlReached.textContent = String(currentLevel + 1);

    const gemsTotal = getEl('finalGems');
    if (gemsTotal) gemsTotal.textContent = String(collectedGems);

    showEl('gameOverOverlay');
    hideEl('chaseProgress');
}

window.gameOver = gameOver;

/* ---------------------------------------------------------------------------
   PAUSE / RESUME / START / RESTART
--------------------------------------------------------------------------- */

function startGame() {
    hideEl('startOverlay');

    resetGame();       // full reset (below)
    gameRunning = true;
    gameStartTime = performance.now();

    const pauseBtn = getEl('pauseBtn');
    if (pauseBtn) {
        pauseBtn.classList.remove('hidden');
        pauseBtn.textContent = '⏸️';
    }
}

window.startGame = startGame;

function togglePause() {
    if (!gameRunning) return;
    gamePaused ? resumeGame() : pauseGame();
}

window.togglePause = togglePause;

function pauseGame() {
    if (!gameRunning) return;
    gamePaused = true;

    // Pause overlay stats
    setText('pauseScore', String(score));
    setText('pauseLevel', String(currentLevel + 1));

    showEl('pauseOverlay');

    const btn = getEl('pauseBtn');
    if (btn) btn.textContent = '▶️';
}

function resumeGame() {
    gamePaused = false;
    hideEl('pauseOverlay');

    const btn = getEl('pauseBtn');
    if (btn) btn.textContent = '⏸️';
}

window.resumeGame = resumeGame;

/**
 * Reset everything to initial run.
 * (Uses resetGameState + reset3DObjects from 02-state.js)
 */
function resetGame() {
    // Hide overlays that might remain
    [
        'gameOverOverlay', 'finalWinOverlay', 'finalDialogOverlay', 'thankYouOverlay',
        'retryAlert', 'morseCodeOverlay', 'levelCompleteOverlay', 'passwordModal',
        'mysteryAlert', 'gameCountdown', 'hackingOverlay', 'localDecrypterOverlay',
        'cipherTranslationOverlay', 'pauseOverlay', 'morseCountdownOverlay',
        'unlockAnimationOverlay', 'templeWallOverlay', 'cinematicCreditsOverlay',
        'glitchDeleteOverlay', 'finalGoodbyeOverlay'
    ].forEach(hideEl);

    // Reset state + scene objects
    resetGameState();
    reset3DObjects();

    // Reset player transform
    resetPlayerPosition();

    // Reset UI values
    setText('score', '0');
    setText('gems', '0');
    setText('currentLevel', '1');

    const pf = getEl('levelProgressFill');
    if (pf) pf.style.width = '0%';

    updateLivesUI();
    updateGemCounterUI();
    updateHeartProgressUI();

    initLetterSlots();

    const levelCfg = getLevelConfig(0);
    const sp = getEl('storyPanel');
    if (sp) {
        sp.classList.remove('event-active');
        sp.textContent = `${levelCfg.icon} Collect 0/${LETTERS_REQUIRED} runes`;
    }

    hideEl('chaseProgress');

    // Ensure pause button visible once game starts
    const pauseBtn = getEl('pauseBtn');
    if (pauseBtn) pauseBtn.classList.add('hidden');
}

function restartGame() {
    resetGame();
    gameRunning = true;

    const pauseBtn = getEl('pauseBtn');
    if (pauseBtn) {
        pauseBtn.classList.remove('hidden');
        pauseBtn.textContent = '⏸️';
    }
}

window.restartGame = restartGame;

/* ---------------------------------------------------------------------------
   UPDATE LOOP
--------------------------------------------------------------------------- */

function update(timestamp) {
    // deltaTime normalized to ~60fps (16.67ms)
    deltaTime = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    if (!gameRunning || gamePaused) return;

    // Score increases with time
    score += Math.floor(1 * deltaTime);
    setText('score', String(score));

    // Base speed scales by score
    const speedSteps = Math.floor(score / 800);
    let baseSpeed = Math.min(
        DIFFICULTY.BASE_SPEED + speedSteps * DIFFICULTY.SPEED_INCREMENT,
        DIFFICULTY.MAX_SPEED
    );

    // Apply speed boost multiplier
    if (activeBoosts.speed.active) {
        baseSpeed = Math.min(baseSpeed * BOOSTS.SPEED.multiplier, DIFFICULTY.MAX_SPEED * 1.2);
    }

    gameSpeed = baseSpeed;

    updateSpeedIndicatorUI();
    updateBoostTimersUI();
    updateLevelProgressUI();

    // Lane movement smoothing
    if (player) {
        player.position.x += (targetLaneX - player.position.x) * 0.12 * deltaTime;
    }

    // Jump physics
    if (player && isJumping) {
        player.position.y += jumpVelocity * deltaTime;
        jumpVelocity -= 0.028 * deltaTime;
        if (player.position.y <= 0) {
            player.position.y = 0;
            isJumping = false;
            jumpVelocity = 0;
        }
    }

    // Slide squash
    if (player) {
        player.scale.y = isSliding ? 0.4 : Math.min(1, player.scale.y + 0.15 * deltaTime);
    }

    // Player idle animations (wings/glow/invincible blink)
    updatePlayerAnimations();
    // Environment animation (planets/stars/nebula)
    updateEnvironmentAnimations();

    // Trails
    if (Math.random() < 0.12) createMagicTrail();

    const spd = gameSpeed * deltaTime;

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.position.z += spd;
        if (o.position.z > 15) {
            scene.remove(o);
            obstacles.splice(i, 1);
        }
    }

    // Move blue gems
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        g.position.z += spd;
        g.rotation.y += 0.045 * deltaTime;
        g.position.y += Math.sin(Date.now() / 220 + i) * 0.008;
        if (g.position.z > 15) {
            scene.remove(g);
            gems.splice(i, 1);
        }
    }

    // Move green gems
    for (let i = greenGems.length - 1; i >= 0; i--) {
        const g = greenGems[i];
        g.position.z += spd;
        g.rotation.y += 0.06 * deltaTime;
        g.rotation.x += 0.03 * deltaTime;
        g.position.y += Math.sin(Date.now() / 180 + i) * 0.01;
        if (g.position.z > 15) {
            scene.remove(g);
            greenGems.splice(i, 1);
        }
    }

    // Move red gems
    for (let i = redGems.length - 1; i >= 0; i--) {
        const g = redGems[i];
        g.position.z += spd;
        g.rotation.y += 0.08 * deltaTime;
        g.rotation.z += 0.04 * deltaTime;
        g.position.y += Math.sin(Date.now() / 150 + i) * 0.012;
        if (g.position.z > 15) {
            scene.remove(g);
            redGems.splice(i, 1);
        }
    }

    // Move boosts
    for (let i = boostItems.length - 1; i >= 0; i--) {
        const b = boostItems[i];
        b.position.z += spd;
        b.rotation.y += 0.07 * deltaTime;
        b.position.y += Math.sin(Date.now() / 200 + i) * 0.01;
        if (b.position.z > 15) {
            scene.remove(b);
            boostItems.splice(i, 1);
        }
    }

    // Move letters
    for (let i = letterPickups.length - 1; i >= 0; i--) {
        const l = letterPickups[i];
        l.position.z += spd;
        l.rotation.y += 0.055 * deltaTime;
        if (l.position.z > 15) {
            scene.remove(l);
            letterPickups.splice(i, 1);
        }
    }

    // Spawn new objects (only when not in story/chase-clear state)
    if (!waitingForClearPath && !storyObjectActive) {
        if (Math.random() < DIFFICULTY.OBSTACLE_SPAWN_RATE) createObstacle();
        if (Math.random() < DIFFICULTY.GEM_SPAWN_RATE) createGem();
        if (Math.random() < DIFFICULTY.GREEN_GEM_SPAWN_RATE) createGreenGem();
        if (Math.random() < DIFFICULTY.RED_GEM_SPAWN_RATE) createRedGem();

        if (Math.random() < DIFFICULTY.BOOST_SPAWN_RATE) createBoostItem();

        const lettersNeeded = collectedLetters.filter(Boolean).length < LETTERS_REQUIRED;
        if (Math.random() < DIFFICULTY.LETTER_SPAWN_RATE && lettersNeeded) {
            createLetterPickup();
        }
    }

    // Trigger story event when path is clear
    if (waitingForClearPath && isPathClear()) {
        triggerStoryEvent();
    }

    // Story object chase movement
    if (storyObject && chaseStarted) {
        storyObject.position.z += spd * 0.42;
        storyObject.rotation.y += 0.032 * deltaTime;
        storyObject.position.y = 2 + Math.sin(Date.now() / 380) * 0.45;

        storyObject.userData.moveTimer += deltaTime;
        if (storyObject.userData.moveTimer > 60) {
            storyObject.userData.moveTimer = 0;

            if (storyObject.userData.targetLane >= 2) storyObject.userData.moveDirection = -1;
            else if (storyObject.userData.targetLane <= 0) storyObject.userData.moveDirection = 1;

            storyObject.userData.targetLane += storyObject.userData.moveDirection;
            storyObject.userData.targetLane = Math.max(0, Math.min(2, storyObject.userData.targetLane));
        }

        const targetX = LANES[storyObject.userData.targetLane];
        storyObject.position.x += (targetX - storyObject.position.x) * 0.03 * deltaTime;

        chaseProgress = Math.min(100, chaseProgress + DIFFICULTY.CHASE_FILL_RATE * deltaTime);

        const fill = getEl('chaseFill');
        if (fill) {
            fill.style.width = `${chaseProgress}%`;
            if (chaseProgress > 80) fill.classList.add('danger');
        }

        const distEl = getEl('chaseDistance');
        if (distEl) distEl.textContent = `Distance: ${Math.floor((100 - chaseProgress) * 2)}m`;

        if (chaseProgress >= DIFFICULTY.CHASE_ESCAPE_THRESHOLD) {
            showRetryAlert();
            return;
        }
    }

    // Collisions (lives handled inside collisions.js)
    if (checkCollisions()) {
        // If collisions returned fatal, gameOver already triggered
        return;
    }

    // Update particles
    updateParticles();
}

/* ====== BEGIN REPLACE: animate (supports STOP_RENDER) ====== */
function animate(timestamp) {
    if (window.__STOP_RENDER__) return;

    requestAnimationFrame(animate);

    if (!assetsLoaded || !renderer || !scene || !camera) return;

    if (gameRunning && !gamePaused) update(timestamp || 0);

    renderer.render(scene, camera);
}
/* ====== END REPLACE: animate (supports STOP_RENDER) ====== */

/* ---------------------------------------------------------------------------
   PROGRESSIVE LOAD
--------------------------------------------------------------------------- */

async function progressiveLoad() {
    try {
        updateLoadingBar(5);
        await sleep(80);

        // show random loading tip early
        const tip = getEl('loadingTip');
        if (tip) tip.textContent = getRandomLoadingTip();

        initThreeJS();
        updateLoadingBar(25);
        await sleep(80);

        createEnvironment();
        updateLoadingBar(50);
        await sleep(80);

        createElfPlayer();
        updateLoadingBar(70);
        await sleep(80);

        initLetterSlots();

        setText('highscore', String(highscore));
        updateLivesUI();
        updateGemCounterUI();
        updateHeartProgressUI();

        updateLoadingBar(88);
        await sleep(80);

        // Background effects
        setTimeout(createMagicBackground, 350);
        startShootingStarsLoop();

        updateLoadingBar(100);

        const ls = getEl('loadingScreen');
        if (ls) {
            ls.style.opacity = '0';
            setTimeout(() => {
                ls.classList.add('hidden');
                assetsLoaded = true;
                requestAnimationFrame(animate);
            }, 500);
        } else {
            assetsLoaded = true;
            requestAnimationFrame(animate);
        }

    } catch (e) {
        console.error('Load error:', e);
        showNotification('Loading failed. Please refresh.', 'error', 5000);
    }
}

/* ---------------------------------------------------------------------------
   DOM READY: BINDINGS
--------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Controls
    initControls();

    // Gesture privacy translate button
    initCameraPrivacyTranslate();

    // Main password input enter
    const mainPw = getEl('mainPasswordInput');
    if (mainPw) {
        mainPw.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                checkMainPassword();
            }
        });
        mainPw.addEventListener('input', () => {
            mainPw.value = mainPw.value.toUpperCase();
        });
    }

    // Cipher combined password input
    const cipherPwInput = getEl('cipherFinalPasswordInput');
    if (cipherPwInput) {
        cipherPwInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyCipherFinalPassword();
            }
        });
        cipherPwInput.addEventListener('input', () => {
            cipherPwInput.value = cipherPwInput.value.toUpperCase();
            updateCipherPasswordTypingState(cipherPwInput.value);
        });
    }
    initOptimizations();

    // Start loading pipeline
    progressiveLoad();
});

console.log('✅ 13-main.js loaded');