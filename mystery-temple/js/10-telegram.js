/* ═══════════════════════════════════════════════════════════════════════════
   10-TELEGRAM.JS
   Mystery Temple - Galaxy Edition

   Telegram Bot integration (client-side).
   IMPORTANT:
   - Exposing bot token in frontend is NOT secure for real production use.
   - Best practice: call your own backend / serverless endpoint instead.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Send a Telegram message using Bot API.
 * @param {string} text
 * @param {object} [options]
 * @returns {Promise<{ok:boolean, error?:any}>}
 */
async function telegramSendMessage(text, options = {}) {
    if (!TELEGRAM_CONFIG?.enabled) return { ok: false, error: 'Telegram disabled' };
    if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
        return { ok: false, error: 'Missing botToken/chatId' };
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;

    const payload = {
        chat_id: TELEGRAM_CONFIG.chatId,
        text: String(text || ''),
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: true
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.ok !== true) {
            return { ok: false, error: data };
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, error };
    }
}

/**
 * Show/hide "Sending to Telegram..." UI (Temple Wall overlay).
 * @param {boolean} show
 */
function setTelegramSendingNotice(show) {
    const notice = getEl('telegramSendingNotice');
    if (!notice) return;
    notice.classList.toggle('hidden', !show);
}

/**
 * Auto-send summary when Temple Wall continue is pressed.
 * This is the "surprise" requirement.
 * @param {object} context
 */
async function telegramAutoSendAfterTempleWall(context = {}) {
    // Always safe (won't do anything if disabled)
    const link = window.location.href;
    const otp = getCombinedOTP();
    const response = context.response || 'N/A';

    // Keep it short + meaningful
    const msg =
`✅ <b>Mystery Temple Finished</b>

🔗 Link: ${link}
🔐 OTP: <code>${otp}</code>
💬 Answer: <b>${response}</b>

— Created by Sasika Randunuge`;

    setTelegramSendingNotice(true);
    const result = await telegramSendMessage(msg);
    setTelegramSendingNotice(false);

    if (result.ok) {
        showNotification('Telegram message sent.', 'success', 2500);
    } else {
        // Do not break UX if telegram fails
        console.warn('Telegram send failed:', result.error);
        showNotification('Telegram unavailable (message not sent).', 'info', 2500);
    }

    return result.ok;
}

window.telegramSendMessage = telegramSendMessage;
window.telegramAutoSendAfterTempleWall = telegramAutoSendAfterTempleWall;

console.log('✅ 10-telegram.js loaded');