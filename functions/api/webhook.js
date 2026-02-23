export async function onRequestPost({ request, env }) {
    const update = await request.json().catch(() => null);
    if (!update || !update.message) return json({ ok: true });

    const chatId = String(update.message.chat.id);
    const text = String(update.message.text || "").trim();

    // /start
    const isStart =
        /^\/start(\s|$|@)/i.test(text) ||          // /start or /start@botname
        text.trim().toLowerCase() === "start" ||   // user typed start
        text.trim().toLowerCase() === "/link";     // optional command

    if (isStart) {
        const token = crypto.randomUUID().replace(/-/g, "");
        const now = Date.now();

        await env.DB.prepare(
            "INSERT OR REPLACE INTO tg_sessions(token, chat_id, created_at, used) VALUES(?, ?, ?, 0)"
        ).bind(token, chatId, now).run();

        const gameUrl = (env.GAME_URL || "").replace(/\/$/, "");
        const link = `${gameUrl}?tg=${token}`;

        const linkNoProto = link.replace(/^https?:\/\//, "");
        const chromeIntent =
            `intent://${linkNoProto}` +
            `#Intent;scheme=https;package=com.android.chrome;end`;

        const msg =
            `🏛 <b>Mystery Temple</b>

මෙන්න game link එක:
${link}

<b>Android Chrome වලින් open කරන්න (try this):</b>
${chromeIntent}

Game එක ඉවර උනාම <b>Telegram</b> check කරන්න.`;

        await tgSend(env.BOT_TOKEN, chatId, msg);
    }

    return json({ ok: true });
}

async function tgSend(botToken, chatId, text) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true
        })
    });
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}