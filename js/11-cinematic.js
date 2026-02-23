/* ═══════════════════════════════════════════════════════════════════════════
   11-CINEMATIC.JS
   Mystery Temple - Galaxy Edition

   Handles:
   - Unlocking animation (after cipher password success)
   - Temple Wall reveal (typewriter Sinhala line)
   - Final dialog (YES/NO)
   - Cinematic credits (Transformers + hacking style)
   - Glitch "delete" ending + final goodbye screen
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------------------
   UNLOCK ANIMATION (uses #unlockAnimationOverlay from HTML)
--------------------------------------------------------------------------- */

async function startUnlockingAnimation() {
    const ov = getEl('unlockAnimationOverlay');
    const icon = getEl('unlockLockIcon');
    const txt = getEl('unlockText');
    const bar = getEl('unlockProgressBar');

    if (!ov || !txt || !bar || !icon) {
        // fallback
        showFinalSinhalaMessage();
        return;
    }

    // Hide cipher while unlocking
    hideEl('cipherTranslationOverlay');

    ov.classList.remove('hidden');
    icon.textContent = '🔒';
    icon.classList.remove('unlocked');
    txt.textContent = 'UNLOCKING...';
    bar.style.width = '0%';

    const stages = [
        { p: 18, t: 'AUTHENTICATING...' },
        { p: 38, t: 'DECRYPTING...' },
        { p: 58, t: 'EXTRACTING...' },
        { p: 78, t: 'ANALYZING...' },
        { p: 95, t: 'FINALIZING...' },
        { p: 100, t: 'UNLOCKED!' }
    ];

    let cur = 0;
    for (const s of stages) {
        txt.textContent = s.t;

        // animate progress
        await new Promise(resolve => {
            animateValue(cur, s.p, 420, (val) => {
                bar.style.width = `${Math.floor(val)}%`;
            }, resolve);
        });

        cur = s.p;
        await sleep(250);
    }

    icon.textContent = '🔓';
    icon.classList.add('unlocked');
    txt.textContent = '✅ UNLOCKED!';

    await sleep(700);
    ov.classList.add('hidden');

    showFinalSinhalaMessage();
}

window.startUnlockingAnimation = startUnlockingAnimation;

/* ---------------------------------------------------------------------------
   TEMPLE WALL REVEAL
--------------------------------------------------------------------------- */

// Controls what happens after pressing Temple Wall "CONTINUE"
let templeWallNextAction = 'finalDialog'; // 'finalDialog' | 'credits'

function openTempleWallScene(sinhalaMessage, otpCode, fullKey) {
    const overlay = getEl('templeWallOverlay');
    const container = getEl('templeWallLines');

    if (!overlay || !container) {
        showFinalDialog();
        return;
    }

    container.innerHTML = '';
    templeWallLines = [];
    templeWallAnimTimeouts.forEach(t => clearTimeout(t));
    templeWallAnimTimeouts = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('si-LK', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('si-LK', { hour: '2-digit', minute: '2-digit' });

    const lines = [
        { text: 'MYSTERY TEMPLE', cls: 'temple-wall-engraving-line glow-strong' },
        { text: 'SECRET MESSAGE UNLOCKED!', cls: 'temple-wall-engraving-line small dim' },
        { text: sinhalaMessage, cls: 'temple-wall-engraving-line sinhala', typewriter: true },
        { text: `CODE: ${otpCode}`, cls: 'temple-wall-engraving-line code' },
        { text: `FULL DECRYPT KEY: ${fullKey}`, cls: 'temple-wall-engraving-line small code' },
        { text: `DATE: ${dateStr}`, cls: 'temple-wall-engraving-line small dim' },
        { text: `TIME: ${timeStr}`, cls: 'temple-wall-engraving-line small dim' }
    ];

    // show overlay
    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    // create DOM nodes
    lines.forEach(ln => {
        const div = document.createElement('div');
        div.className = ln.cls;

        if (ln.typewriter) {
            div.textContent = '';
            div.dataset.full = ln.text;

            const len = ln.text.length;
            if (len > 260) div.style.fontSize = '0.82em';
            else if (len > 200) div.style.fontSize = '0.9em';
            else if (len > 140) div.style.fontSize = '0.98em';
        } else {
            div.textContent = ln.text;
        }

        container.appendChild(div);
        templeWallLines.push(div);
    });

    // animate lines
    templeWallLines.forEach((line, idx) => {
        const isSinhala = line.classList.contains('sinhala');

        const t = setTimeout(async () => {
            line.classList.add('show');

            if (isSinhala) {
                const full = line.dataset.full || '';
                await typeLineWithin(line, full, 6000);
            }
        }, 450 + idx * 520);

        templeWallAnimTimeouts.push(t);
    });

    templeWallActive = true;
}

async function typeLineWithin(el, text, durationMs) {
    const total = Math.max(text.length, 1);
    const perChar = Math.max(8, Math.floor(durationMs / total));
    el.textContent = '';

    for (let i = 0; i < text.length; i++) {
        el.textContent += text[i];
        await sleep(perChar);
    }
}

/**
 * Called after cipher unlock animation.
 * Opens temple wall first, then final dialog.
 */
function showFinalSinhalaMessage() {
    const combinedSinhala = allSinhalaMessages.join(' ');
    const otp = getCombinedOTP();
    const fullKey = getCombinedPassword();

    templeWallNextAction = 'finalDialog';
    openTempleWallScene(combinedSinhala, otp, fullKey);
}

/**
 * Button in THANK YOU overlay.
 * This opens temple wall again, then goes to credits after continue.
 */
function showTempleWallAndCredits() {
    const combinedSinhala = allSinhalaMessages.join(' ') || FINAL_SINHALA;
    const otp = getCombinedOTP();
    const fullKey = getCombinedPassword();

    templeWallNextAction = 'credits';
    openTempleWallScene(combinedSinhala, otp, fullKey);
}

window.showTempleWallAndCredits = showTempleWallAndCredits;

/**
 * Temple continue button click:
 * - auto sends Telegram message silently (if enabled)
 * - then goes to either final dialog or credits (depending on mode)
 */
/* ====== BEGIN REPLACE: closeTempleWallAndShowCredits (send via /api/finish) ====== */
async function closeTempleWallAndShowCredits() {
    const overlay = getEl('templeWallOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 450);
    }

    templeWallActive = false;

    // Show "sending..." small notice (if element exists)
    const notice = getEl('telegramSendingNotice');
    if (notice) notice.classList.remove('hidden');

    // Send Telegram finish message via backend
    // At this stage playerResponse may be null. It's OK; backend will receive N/A.
    const answer = (playerResponse ? playerResponse.toUpperCase() : "N/A");

    let sentOk = false;
    if (!window.__tg_finish_sent__ && typeof window.tgNotifyFinish === "function") {
        window.__tg_finish_sent__ = true;
        const r = await window.tgNotifyFinish(answer, score, currentLevel + 1);
        sentOk = Boolean(r && r.ok);
    }

    if (notice) notice.classList.add('hidden');

    // Continue flow
    if (templeWallNextAction === 'credits') startCinematicCredits();
    else showFinalDialog();
}
/* ====== END REPLACE: closeTempleWallAndShowCredits (send via /api/finish) ====== */

window.closeTempleWallAndShowCredits = closeTempleWallAndShowCredits;

/* ---------------------------------------------------------------------------
   FINAL DIALOG + YES/NO RESPONSE
--------------------------------------------------------------------------- */

function showFinalDialog() {
    const msg = getEl('finalDialogMessage');
    const ov = getEl('finalDialogOverlay');

    if (msg) {
        msg.innerHTML =
            `<strong>English:</strong> ${FINAL_ENGLISH}<br><br>` +
            `<strong>සිංහල:</strong> ${FINAL_SINHALA}`;
    }
    if (ov) ov.classList.remove('hidden');
}
async function playResponseAnimation(type) {
    const ov = document.createElement('div');
    ov.className = 'response-anim-overlay';

    const scene = document.createElement('div');
    scene.className = `response-scene ${type === 'yes' ? 'handshake' : 'earslap'}`;

    scene.innerHTML = `
      <div class="scene-text">${type === 'yes' ? 'CONFIRMED' : 'REJECTED'}</div>
      <div class="char girl"><div class="head"></div><div class="body"></div></div>
      <div class="char boy"><div class="head"></div><div class="body"></div></div>
      ${type === 'yes' ? `<div class="spark">🤝</div>` : `<div class="arm"></div><div class="impact">💥</div>`}
    `;

    ov.appendChild(scene);
    document.body.appendChild(ov);

    await sleep(1500);
    ov.remove();
}

async function handleYesResponse() {
    playerResponse = 'yes';
    hideEl('finalDialogOverlay');

    await playResponseAnimation('yes');

    const icon = getEl('thankYouIcon');
    if (icon) icon.textContent = '💖';
    setText('thankYouMessage', YES_RESPONSE);

    showEl('thankYouOverlay');

    setTimeout(() => {
        if (!creditsActive && !glitchDeleteActive) startCinematicCredits();
    }, 3800);
}

async function handleNoResponse() {
    playerResponse = 'no';
    hideEl('finalDialogOverlay');

    await playResponseAnimation('no');

    const icon = getEl('thankYouIcon');
    if (icon) icon.textContent = '😊';
    setText('thankYouMessage', NO_RESPONSE);

    showEl('thankYouOverlay');

    setTimeout(() => {
        if (!creditsActive && !glitchDeleteActive) startCinematicCredits();
    }, 3800);
}

window.showFinalDialog = showFinalDialog;
window.handleYesResponse = handleYesResponse;
window.handleNoResponse = handleNoResponse;

/* ---------------------------------------------------------------------------
   CINEMATIC CREDITS
--------------------------------------------------------------------------- */

function createCreditsMatrixBg() {
    const bg = getEl('creditsMatrixBg');
    if (!bg) return;

    bg.innerHTML = '';
    const chars = '01アイウエオカキクケコABCDEF';
    const cols = isLowEnd ? 10 : 18;

    for (let i = 0; i < cols; i++) {
        const col = document.createElement('div');
        col.className = 'credits-matrix-col';
        col.style.left = `${(i / cols) * 100}%`;
        col.style.animationDuration = `${6 + Math.random() * 6}s`;
        col.style.animationDelay = `${Math.random() * 2}s`;

        let txt = '';
        const lines = isLowEnd ? 20 : 35;
        for (let j = 0; j < lines; j++) {
            txt += chars[Math.floor(Math.random() * chars.length)] + '\n';
        }
        col.textContent = txt;
        bg.appendChild(col);
    }
}

function startCinematicCredits() {
    if (creditsActive) return;
    creditsActive = true;
    creditsStartTime = Date.now();

    hideEl('thankYouOverlay');
    hideEl('finalWinOverlay');
    hideEl('localDecrypterOverlay');

    createCreditsMatrixBg();
    showEl('cinematicCreditsOverlay');

    const fill = getEl('creditsProgressFill');
    if (fill) fill.style.width = '0%';

    // Progress bar follows scroll duration (CSS: 30s)
    const duration = 30000;
    const tick = setInterval(() => {
        if (!creditsActive) {
            clearInterval(tick);
            return;
        }

        const elapsed = Date.now() - creditsStartTime;
        const pct = Math.min(100, (elapsed / duration) * 100);
        if (fill) fill.style.width = `${pct}%`;

        if (elapsed >= duration) {
            clearInterval(tick);
            endCreditsAndStartGlitch();
        }
    }, 250);
}

function skipCredits() {
    if (!creditsActive) return;
    endCreditsAndStartGlitch();
}

window.skipCredits = skipCredits;

/* ---------------------------------------------------------------------------
   GLITCH DELETE ENDING
--------------------------------------------------------------------------- */

function endCreditsAndStartGlitch() {
    creditsActive = false;
    hideEl('cinematicCreditsOverlay');
    startGlitchDeleteSequence();
}

/* ====== BEGIN REPLACE: startGlitchDeleteSequence (20s then blackout) ====== */
/* ====== BEGIN REPLACE: startGlitchDeleteSequence (20s then THANK YOU blackout) ====== */
async function startGlitchDeleteSequence() {
    if (glitchDeleteActive) return;
    glitchDeleteActive = true;

    showEl('glitchDeleteOverlay');

    const bar = getEl('glitchProgressBar');
    const pctEl = getEl('glitchPercent');
    const statusEl = getEl('glitchStatus');
    const fileList = getEl('glitchFileList');

    if (fileList) fileList.innerHTML = '';

    const duration = 20000; // ✅ 20 seconds
    const start = Date.now();

    // Stop gameplay
    gamePaused = true;
    gameRunning = false;

    while (Date.now() - start < duration) {
        const elapsed = Date.now() - start;
        const p = Math.min(100, Math.floor((elapsed / duration) * 100));

        if (bar) bar.style.width = `${p}%`;
        if (pctEl) pctEl.textContent = `${p}%`;

        if (statusEl) {
            if (p < 25) statusEl.textContent = 'Removing cache...';
            else if (p < 55) statusEl.textContent = 'Purging memory...';
            else if (p < 85) statusEl.textContent = 'Deleting modules...';
            else statusEl.textContent = 'Final wipe...';
        }

        spawnGlitchFragments(isLowEnd ? 2 : 4);

        if (fileList && p % 10 === 0) {
            const item = document.createElement('div');
            item.className = 'glitch-file-item';
            item.textContent = `rm -rf chunk_${String(p).padStart(3, '0')}.bin`;
            fileList.appendChild(item);
            fileList.scrollTop = fileList.scrollHeight;
        }

        await sleep(isLowEnd ? 90 : 60);
    }

    // Hide glitch overlay
    hideEl('glitchDeleteOverlay');

    // Stop rendering loop (requires animate() STOP_RENDER support)
    window.__STOP_RENDER__ = true;

    // Show final professional thank you screen
    runBlackoutThanksSequence(10000);

    glitchDeleteActive = false;
}
/* ====== END REPLACE: startGlitchDeleteSequence (20s then THANK YOU blackout) ====== */
/* ====== END REPLACE: startGlitchDeleteSequence (20s then blackout) ====== */
function spawnGlitchFragments(count) {
    const container = getEl('glitchFragments');
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const frag = document.createElement('div');
        frag.className = 'glitch-fragment';

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        const w = 20 + Math.random() * 60;
        const h = 6 + Math.random() * 20;

        const tx = (Math.random() - 0.5) * 500;
        const ty = (Math.random() - 0.5) * 500;
        const rot = `${(Math.random() - 0.5) * 720}deg`;

        frag.style.left = `${x}px`;
        frag.style.top = `${y}px`;
        frag.style.width = `${w}px`;
        frag.style.height = `${h}px`;
        frag.style.setProperty('--tx', `${tx}px`);
        frag.style.setProperty('--ty', `${ty}px`);
        frag.style.setProperty('--rot', rot);
        frag.style.opacity = '1';

        container.appendChild(frag);
        setTimeout(() => frag.remove(), 2000);
    }
}

/* ---------------------------------------------------------------------------
   FINAL: PLAY AGAIN
--------------------------------------------------------------------------- */

function restartAfterCredits() {
    hideEl('finalGoodbyeOverlay');

    if (typeof restartGame === 'function') {
        restartGame();
        return;
    }

    // fallback reload
    window.location.reload();
}

window.restartAfterCredits = restartAfterCredits;

/* ====== BEGIN ADD: Blackout Thank You sequence (calculating) ====== */
async function runBlackoutThanksSequence(autoReloadMs = 10000) {
    const overlay = getEl('blackoutThanks');
    const titleEl = getEl('blackoutTitle');
    const counterEl = getEl('blackoutCounter');
    const refreshEl = getEl('blackoutRefresh');
    const btn = getEl('blackoutPlayAgainBtn');

    if (!overlay || !titleEl || !counterEl || !refreshEl || !btn) return;

    overlay.classList.remove('hidden');

    // Button click = immediate reload
    btn.onclick = () => window.location.reload();

    const target = 'THANK YOU';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const start = Date.now();
    const animMs = 2600; // scramble duration

    while (Date.now() - start < animMs) {
        const p = Math.floor(((Date.now() - start) / animMs) * 100);
        counterEl.textContent = `CALCULATING... ${Math.min(100, p)}%`;

        // scramble
        let out = '';
        for (let i = 0; i < target.length; i++) {
            if (target[i] === ' ') { out += ' '; continue; }
            // gradually lock letters
            const lockChance = (Date.now() - start) / animMs;
            if (Math.random() < lockChance) out += target[i];
            else out += chars[Math.floor(Math.random() * chars.length)];
        }
        titleEl.textContent = out;

        await sleep(35);
    }

    // finalize
    counterEl.textContent = 'CALCULATING... 100%';
    titleEl.textContent = target;

    // Countdown to refresh
    const refreshStart = Date.now();
    const endAt = refreshStart + autoReloadMs;

    while (Date.now() < endAt) {
        const left = Math.ceil((endAt - Date.now()) / 1000);
        refreshEl.textContent = `Refreshing in ${left}s...`;
        await sleep(250);
    }

    window.location.reload();
}
/* ====== END ADD: Blackout Thank You sequence (calculating) ====== */

console.log('✅ 11-cinematic.js loaded');