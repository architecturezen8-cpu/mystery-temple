/* ═══════════════════════════════════════════════════════════════════════════
   14-OPTIMIZATION.JS
   Mystery Temple - Galaxy Edition

   Lightweight optimizations:
   - Pause game when tab is hidden
   - Reduce expensive UI updates in background
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

function initOptimizations() {
    // Auto pause when user switches tab / locks screen
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (typeof pauseGame === 'function') pauseGame();
            else {
                gamePaused = true;
                showEl('pauseOverlay');
            }
        }
    }, { passive: true });
}

window.initOptimizations = initOptimizations;

console.log('✅ 14-optimization.js loaded');