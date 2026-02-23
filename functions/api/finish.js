export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: "bad json" }, 400);

  const tg = String(body.tg || "");
  const answer = String(body.answer || "N/A");
  const score = body.score ?? "?";
  const level = body.level ?? "?";

  if (!tg) return json({ ok: false, error: "missing token" }, 400);

  const row = await env.DB.prepare(
    "SELECT chat_id, used FROM tg_sessions WHERE token = ? LIMIT 1"
  ).bind(tg).first();

  if (!row) return json({ ok: false, error: "unknown token" }, 400);

  // Prevent re-use (optional)
  if (Number(row.used) === 1) return json({ ok: true, already: true });

  const chatId = String(row.chat_id);

  const msg =
`✅ <b>Game Finished</b>

Answer: <b>${answer}</b>
Score: <b>${score}</b>
Level: <b>${level}</b>`;

  await tgSend(env.BOT_TOKEN, chatId, msg);

  await env.DB.prepare(
    "UPDATE tg_sessions SET used = 1 WHERE token = ?"
  ).bind(tg).run();

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

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() }
  });
}