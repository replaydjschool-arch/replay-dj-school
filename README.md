# REPLAY DJ School — сайт

Статичний односторінковий сайт (`index.html`), без збірки. Підходить для GitHub Pages.

## Деплой на GitHub Pages
1. Створи репозиторій на GitHub, залий файли в корінь (`index.html`, `404.html`, `.nojekyll`, `robots.txt`).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Сайт буде на `https://<акаунт>.github.io/<репо>/`. Усі посилання на сторінці відносні/якірні, тож підпапка не ламає нічого.
4. Свій домен: додай файл `CNAME` з доменом (напр. `replaydj.school`) і налаштуй DNS у Settings → Pages.

## Форма
GitHub Pages — лише статика, тому заявки йдуть через FormSubmit.co на пошту школи (див. `EMAIL_ENDPOINT` в кінці `index.html`).
Telegram — опційно через Cloudflare Worker (`worker/README.md`).
