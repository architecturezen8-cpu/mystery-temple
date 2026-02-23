/* ═══════════════════════════════════════════════════════════════════════════
   07-EFFECTS.JS
   Mystery Temple - Galaxy Edition

   Visual-only helpers:
   - Loading bar & tips
   - Background magic particles & shooting stars
   - Gem popups, sparkles, particles, trails, bursts
   - HUD UI updates (gems, hearts, lives, speed)
   - Boost activation UI
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  LOADING BAR & TIPS                                                       ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Update loading bar percentage.
 * @param {number} percent 
 */
function updateLoadingBar(percent) {
    const bar = getEl('loadingBar');
    const txt = getEl('loadingPercent');
    const tip = getEl('loadingTip');

    if (bar) bar.style.width = `${percent}%`;
    if (txt) txt.textContent = `${Math.floor(percent)}%`;

    if (tip && percent < 20) {
        tip.textContent = getRandomLoadingTip();
    }
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  BACKGROUND MAGIC PARTICLES                                               ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Create floating magic particles in the background.
 */
function createMagicBackground() {
    const container = getEl('magicParticles');
    if (!container) return;

    const colors = ['#0ff', '#0f8', '#f0f', '#ff0', '#0af'];

    for (let i = 0; i < QUALITY.bgParticles; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'magic-particle';
            p.style.left = `${Math.random() * 100}%`;

            const color = colors[Math.floor(Math.random() * colors.length)];
            p.style.background = `radial-gradient(circle, ${color}, transparent)`;

            const size = 3 + Math.random() * 5;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.setProperty('--tx', `${(Math.random() - 0.5) * 220}px`);
            p.style.animationDuration = `${10 + Math.random() * 15}s`;
            p.style.animationDelay = `${Math.random() * 10}s`;

            container.appendChild(p);
        }, i * 80);
    }
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  SHOOTING STARS                                                           ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Spawn a single shooting star in DOM layer.
 */
function spawnShootingStar() {
    const container = getEl('shootingStars');
    if (!container) return;

    const star = document.createElement('div');
    star.className = 'shooting-star';

    const startX = Math.random() * window.innerWidth * 0.6;
    const startY = Math.random() * window.innerHeight * 0.4;

    star.style.left = `${startX}px`;
    star.style.top = `${startY}px`;

    container.appendChild(star);
    setTimeout(() => star.remove(), 1500);
}

/**
 * Periodically spawn shooting stars.
 */
function startShootingStarsLoop() {
    if (!getEl('shootingStars')) return;

    lastShootingStarTime = performance.now();

    const loop = () => {
        if (!gameRunning) {
            requestAnimationFrame(loop);
            return;
        }

        const now = performance.now();
        if (now - lastShootingStarTime > QUALITY.shootingStarInterval) {
            spawnShootingStar();
            lastShootingStarTime = now;
        }

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  GEM & RUNE POPUPS                                                        ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Show a generic gem popup (+score and emoji).
 * @param {number} screenX 
 * @param {number} screenY 
 * @param {number} value 
 * @param {string} emoji 
 */
function showGemPopup(screenX, screenY, value, emoji = '💎') {
    const popup = document.createElement('div');
    popup.className = 'gem-collect-popup';
    popup.innerHTML = `+${value} ${emoji}`;
    popup.style.left = `${screenX - 50}px`;
    popup.style.top = `${screenY - 50}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

/**
 * Convenience wrappers for specific gem colors.
 */
function showGreenGemPopup(x, y, value = 100) {
    const popup = document.createElement('div');
    popup.className = 'gem-collect-popup gem-popup-green';
    popup.innerHTML = `+${value} 💚`;
    popup.style.left = `${x - 50}px`;
    popup.style.top = `${y - 50}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

function showRedGemPopup(x, y, value = 200) {
    const popup = document.createElement('div');
    popup.className = 'gem-collect-popup gem-popup-red';
    popup.innerHTML = `+${value} ❤️`;
    popup.style.left = `${x - 50}px`;
    popup.style.top = `${y - 50}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

/**
 * Show rune collected popup.
 */
function showRunePopup(x, y) {
    const popup = document.createElement('div');
    popup.className = 'gem-collect-popup gem-popup-gold';
    popup.innerHTML = '★ RUNE! ★';
    popup.style.left = `${x - 60}px`;
    popup.style.top = `${y - 50}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  BOOST POPUP                                                              ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Show center-screen boost popup.
 * @param {string} label 
 */
function showBoostPopup(label, icon = '✨') {
    const popup = getEl('boostPopup');
    const iconEl = getEl('boostPopupIcon');
    const textEl = getEl('boostPopupText');

    if (!popup || !iconEl || !textEl) return;

    iconEl.textContent = icon;
    textEl.textContent = label;

    popup.classList.remove('hidden');
    popup.classList.remove('hiding');

    setTimeout(() => {
        popup.classList.add('hiding');
        setTimeout(() => popup.classList.add('hidden'), 300);
    }, 1200);
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  SPARKLES & 3D PARTICLES                                                  ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Create DOM sparkles from a screen position.
 * @param {number} x 
 * @param {number} y 
 * @param {string} color 
 */
function createSparkleEffect(x, y, color) {
    const container = document.createElement('div');
    container.className = 'sparkle-container';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;

    for (let i = 0; i < 12; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.style.background = `radial-gradient(circle, #fff, ${color || '#0f8'})`;
        const angle = (i / 12) * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        s.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        container.appendChild(s);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1000);
}

/**
 * Create 3D particle burst at a world position.
 * @param {THREE.Vector3} position 
 * @param {number} color 
 * @param {number} count 
 */
function createParticleEffect(position, color, count) {
    if (!scene) return;

    const actual = Math.min(count, QUALITY.particleCount);
    const geo = new THREE.SphereGeometry(0.08, 6, 6);

    for (let i = 0; i < actual; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(position);
        p.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.4 + 0.15,
                (Math.random() - 0.5) * 0.4
            ),
            life: 1
        };
        scene.add(p);
        particles.push(p);
    }
}

/**
 * Create small glowing trail behind player.
 */
function createMagicTrail() {
    if (!gameRunning || gamePaused || !player) return;
    if (magicTrails.length >= QUALITY.maxTrails) return;

    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.75
    });
    const t = new THREE.Mesh(geo, mat);
    t.position.set(
        player.position.x + (Math.random() - 0.5) * 0.4,
        player.position.y + 0.8 + Math.random() * 1.2,
        player.position.z - 0.4
    );
    t.userData = { life: 1 };
    scene.add(t);
    magicTrails.push(t);
}

/**
 * Create expanding ring burst for high-value events.
 * @param {THREE.Vector3} pos 
 * @param {number} [color] 
 */
function createGemBurst(pos, color = 0x00ff88) {
    if (!scene) return;

    const geo = new THREE.RingGeometry(0.3, 0.5, 16);
    const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
    ring.lookAt(camera.position);
    ring.userData = { life: 1, scale: 1 };
    scene.add(ring);
    gemBursts.push(ring);
}

/**
 * Update all 3D particles & effects.
 */
function updateParticles() {
    // Simple spheres
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.userData.velocity.y -= 0.012;
        p.userData.life -= 0.05;
        p.material.opacity = p.userData.life;
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    // Trails
    for (let i = magicTrails.length - 1; i >= 0; i--) {
        const t = magicTrails[i];
        t.userData.life -= 0.07;
        t.material.opacity = t.userData.life * 0.75;
        t.scale.multiplyScalar(0.93);
        if (t.userData.life <= 0) {
            scene.remove(t);
            magicTrails.splice(i, 1);
        }
    }

    // Ring bursts
    for (let i = gemBursts.length - 1; i >= 0; i--) {
        const r = gemBursts[i];
        r.userData.life -= 0.06;
        r.userData.scale += 0.15;
        r.scale.setScalar(r.userData.scale);
        r.material.opacity = r.userData.life * 0.8;
        if (r.userData.life <= 0) {
            scene.remove(r);
            gemBursts.splice(i, 1);
        }
    }
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  HUD UI UPDATE HELPERS                                                    ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Update gem counters on left panel.
 */
function updateGemCounterUI() {
    setText('redGemCount', redGemsCollected.toString());
    setText('greenGemCount', greenGemsCollected.toString());
    setText('blueGemCount', blueGemsCollected.toString());
}

/**
 * Update heart progress bars (runes/gems).
 */
function updateHeartProgressUI() {
    const maxHearts = 20;

    const setBar = (barId, textId, val) => {
        const barEl = getEl(barId);
        const txtEl = getEl(textId);
        const clamped = Math.min(val, maxHearts);
        const pct = (clamped / maxHearts) * 100;
        if (barEl) barEl.style.width = `${pct}%`;
        if (txtEl) txtEl.textContent = `${clamped}/${maxHearts}`;
    };

    setBar('heartBarRed', 'heartTextRed', redGemsCollected);
    setBar('heartBarGreen', 'heartTextGreen', greenGemsCollected);
    setBar('heartBarBlue', 'heartTextBlue', blueGemsCollected);
    setBar('heartBarYellow', 'heartTextYellow', totalRunesCollected);
}

/**
 * Update lives hearts UI.
 */
function updateLivesUI() {
    for (let i = 1; i <= LIVES_CONFIG.MAX_LIVES; i++) {
        const heart = getEl(`life${i}`);
        if (!heart) continue;
        if (i <= currentLives) {
            heart.classList.add('active');
            heart.classList.remove('lost');
        } else {
            heart.classList.remove('active');
            heart.classList.add('lost');
        }
    }
    setText('livesCount', currentLives.toString());
}

/**
 * Update speed indicator (bottom).
 */
function updateSpeedIndicatorUI() {
    const speedEl = getEl('speedValue');
    if (!speedEl) return;

    const speedMultiplier = (gameSpeed / DIFFICULTY.BASE_SPEED).toFixed(1);
    speedEl.textContent = `${speedMultiplier}x`;
}

/**
 * Update level progress bar and story panel text.
 */
function updateLevelProgressUI() {
    const levelEl = getEl('currentLevel');
    const fillEl = getEl('levelProgressFill');
    const storyEl = getEl('storyPanel');

    if (levelEl) levelEl.textContent = (currentLevel + 1).toString();

    const filled = collectedLetters.filter(l => l).length;
    if (fillEl) fillEl.style.width = `${(filled / LETTERS_REQUIRED) * 100}%`;

    if (!storyObjectActive && !waitingForClearPath && storyEl) {
        const lvlCfg = getLevelConfig(currentLevel);
        storyEl.textContent = `${lvlCfg.icon} Collect ${filled}/${LETTERS_REQUIRED} runes`;
    }
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  BOOST ACTIVATION / DEACTIVATION                                          ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Activate a boost by ID ('speed' | 'shield' | 'magnet' | 'double').
 * Handles timer + UI.
 * @param {string} boostId 
 */
function activateBoost(boostId) {
    const id = boostId.toLowerCase();
    const config = Object.values(BOOSTS).find(b => b.id === id);
    if (!config) return;

    const now = Date.now();
    const state = activeBoosts[id];
    if (!state) return;

    // If already active, extend duration
    state.active = true;
    state.endTime = now + config.duration;

    // Clear old timer
    if (state.timer) clearTimeout(state.timer);

    // Setup timer to deactivate
    state.timer = setTimeout(() => deactivateBoost(id), config.duration);

    // UI feedback
    updateBoostUI(id, true, config);

    // Additional logic for speed
    if (id === 'speed') {
        gameSpeed = Math.min(gameSpeed * config.multiplier, DIFFICULTY.MAX_SPEED * 1.2);
    }
}

/**
 * Deactivate a boost.
 * @param {string} boostId 
 */
function deactivateBoost(boostId) {
    const id = boostId.toLowerCase();
    const state = activeBoosts[id];
    if (!state || !state.active) return;

    state.active = false;
    state.endTime = 0;
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    updateBoostUI(id, false);

    if (id === 'speed') {
        gameSpeed = Math.min(gameSpeed, DIFFICULTY.MAX_SPEED);
    }
}

/**
 * Update active boosts panel UI.
 * @param {string} id 
 * @param {boolean} active 
 * @param {object} [config] 
 */
function updateBoostUI(id, active, config) {
    const panel = getEl('activeBoostsPanel');
    if (!panel) return;

    const boostEl = getEl(`boost${capitalize(id)}`);
    if (!boostEl) return;

    if (active) {
        showEl(panel);
        showEl(boostEl);
        // Timer bar handled in main loop by reading activeBoosts[*].endTime
    } else {
        hideEl(boostEl);
        // Hide panel if no boosts active
        const anyActive = Object.values(activeBoosts).some(b => b.active);
        if (!anyActive) hideEl(panel);
    }
}

/**
 * Update boost timer bars each frame.
 */
function updateBoostTimersUI() {
    const now = Date.now();

    Object.keys(activeBoosts).forEach(id => {
        const boost = activeBoosts[id];
        const cfg = Object.values(BOOSTS).find(b => b.id === id);
        const el = getEl(`boost${capitalize(id)}Timer`);
        if (!boost || !cfg || !el) return;

        if (!boost.active) {
            el.style.setProperty('--timer-pct', '0%');
            return;
        }

        const remaining = Math.max(0, boost.endTime - now);
        const pct = Math.max(0, Math.min(100, (remaining / cfg.duration) * 100));

        // vertical fill uses height percentage
        el.style.setProperty('--timer-pct', `${pct}%`);
    });
}

/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  UTILITY: CAPITALIZE STRING                                               ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Capitalize first letter of string.
 * @param {string} str 
 * @returns {string}
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


console.log('✅ 07-effects.js loaded');