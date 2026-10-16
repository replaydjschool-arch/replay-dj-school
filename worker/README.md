# Форма → Telegram

1. У Telegram відкрий @BotFather → `/newbot` → збережи токен.
2. Напиши щось своєму боту (або додай його в робочий чат), отримай chat id:
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → `message.chat.id`.
3. Деплой Worker (потрібен безкоштовний акаунт Cloudflare):
   ```
   cd worker
   npx wrangler deploy
   npx wrangler secret put BOT_TOKEN
   npx wrangler secret put CHAT_ID
   ```
4. Скопіюй URL Worker-а (`https://replay-lead-form.<акаунт>.workers.dev`) у `FORM_ENDPOINT` в кінці `index.html`.
5. У `wrangler.toml` постав `ALLOWED_ORIGIN` = домен сайту і задеплой ще раз.

Токен не лежить у коді сайту — тільки в secrets Worker-а.
