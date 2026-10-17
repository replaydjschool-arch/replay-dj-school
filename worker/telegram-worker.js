// Cloudflare Worker: приймає заявку з сайту і шле її в Telegram.
// Токен бота і chat id зберігаються як secrets Worker-а, у браузер вони не потрапляють.
//   wrangler secret put BOT_TOKEN
//   wrangler secret put CHAT_ID   (один id або кілька через кому)
// Змінна ALLOWED_ORIGIN (wrangler.toml) — домен сайту, напр. https://replaydj.school

const esc = s => String(s ?? '').slice(0, 300).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

// Посилання на діалог у Telegram: за ніком (@name) або за номером телефону (t.me/+380…)
const tgLink = raw => {
  const v = String(raw ?? '').trim().replace(/^(https?:\/\/)?(www\.)?t\.me\//i, '@');
  const nick = v.match(/^@?([A-Za-z][A-Za-z0-9_]{4,31})$/);
  if (nick) return `https://t.me/${nick[1]}`;
  let digits = v.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) digits = '38' + digits; // 0936… -> 380936…
  if (/^\d{10,15}$/.test(digits) && /^[+\d\s()-]+$/.test(v)) return `https://t.me/+${digits}`;
  return '';
};
// Посилання на профіль Instagram за ніком
const igLink = raw => {
  const v = String(raw ?? '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? `https://www.instagram.com/${v}` : '';
};

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
    if (!d.name) return new Response('Missing fields', { status: 422, headers: cors });

    const ig = String(d.instagram ?? '').trim(), em = String(d.email ?? '').trim(), c = String(d.contact ?? '').trim();
    if (!ig && !em && !c) return new Response('Missing fields', { status: 422, headers: cors });
    const tg = tgLink(c), igUrl = igLink(ig);

    const text =
      `🟡 <b>Нова заявка REPLAY</b>\n\n` +
      `👤 <b>Ім'я:</b> ${esc(d.name)}\n` +
      (ig ? `📸 <b>Instagram:</b> ${igUrl ? `<a href="${igUrl}">${esc(ig)}</a>` : esc(ig)}\n` : '') +
      (em ? `✉️ <b>Email:</b> ${esc(em)}\n` : '') +
      (c ? `📞 <b>Телефон / Telegram:</b> ${esc(c)}${tg ? ` · <a href="${tg}">Написати в Telegram</a>` : ''}\n` : '') +
      (d.format ? `📍 <b>Формат:</b> ${esc(d.format)}\n` : '') +
      (d.course ? `🎓 <b>Курс:</b> ${esc(d.course)}\n` : '') +
      (d.genre ? `🎧 <b>Жанр:</b> ${esc(d.genre)}` : '');

    // CHAT_ID: один id або список через кому ("79796562,-1001234567890")
    const chats = String(env.CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
    const results = await Promise.all(chats.map(chat_id =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }).then(r => r.ok, () => false)));
    // успіх, якщо дійшло хоча б одному одержувачу
    const ok = results.some(Boolean);
    return new Response(ok ? 'ok' : 'Telegram error', { status: ok ? 200 : 502, headers: cors });
  },
};
