// Cloudflare Worker: приймає заявку з сайту і шле її в Telegram.
// Токен бота і chat id зберігаються як secrets Worker-а, у браузер вони не потрапляють.
//   wrangler secret put BOT_TOKEN
//   wrangler secret put CHAT_ID   (один id або кілька через кому)
// Змінна ALLOWED_ORIGIN (wrangler.toml) — домен сайту, напр. https://replaydj.school

const esc = s => String(s ?? '').slice(0, 300).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    let d;
    try { d = await req.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    if (d.website) return new Response('ok', { headers: cors }); // honeypot для ботів
    if (!d.name || !d.contact) return new Response('Missing fields', { status: 422, headers: cors });

    const text =
      `🟡 <b>Нова заявка REPLAY</b>\n\n` +
      `👤 <b>Ім'я:</b> ${esc(d.name)}\n` +
      `📞 <b>Контакт:</b> ${esc(d.contact)}\n` +
      (d.instagram ? `📸 <b>Instagram:</b> ${esc(d.instagram)}\n` : '') +
      `📍 <b>Формат:</b> ${esc(d.format)}\n` +
      `🎓 <b>Курс:</b> ${esc(d.course)}\n` +
      `🎧 <b>Жанр:</b> ${esc(d.genre)}`;

    // CHAT_ID: один id або список через кому ("79796562,-1001234567890")
    const chats = String(env.CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
    const results = await Promise.all(chats.map(chat_id =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
      }).then(r => r.ok, () => false)));
    // успіх, якщо дійшло хоча б одному одержувачу
    const ok = results.some(Boolean);
    return new Response(ok ? 'ok' : 'Telegram error', { status: ok ? 200 : 502, headers: cors });
  },
};
