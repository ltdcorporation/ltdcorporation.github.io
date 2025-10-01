Telegram Admin Bot (Cloudflare Worker)

Fungsi: update file `updates.json` di repo GitHub Pages (`ltdcorporation/ltd.github.io`) lewat chat bot Telegram. Lo tinggal klik /menu lalu kirim teks sesuai petunjuk.

Fitur cepat:
- /menu — tampilkan tombol aksi
- /show — lihat config sekarang
- /main <url> — set link channel utama
- /addmirror <url> — tambah mirror
- /delmirror <index> — hapus mirror (index mulai 1)
- /status <teks> — set status
- /update <teks> — tambah pengumuman (auto timestamp WIB)
- /addbot <url> — tambah bot resmi
- /delbot <index> — hapus bot (index mulai 1)

Arsitektur:
- Cloudflare Worker terima webhook Telegram di path `/telegram`
- Worker baca/tulis `updates.json` via GitHub REST API (commit langsung ke branch `main`)

Setup (sekali jalan):
1) Buat bot baru di @BotFather → ambil `BOT_TOKEN`
2) Buat GitHub token dengan scope minimal `public_repo` (kalau repo public) → `GITHUB_TOKEN`
3) Install `wrangler` dan login Cloudflare (`npm i -g wrangler`)
4) Buat KV tidak perlu (state di GitHub). Deploy Worker:
   - cd bot-worker
   - wrangler deploy
5) Set secrets/env:
   - wrangler secret put BOT_TOKEN
   - wrangler secret put GITHUB_TOKEN
   - wrangler secret put ADMIN_IDS   (contoh: 123456789,987654321)
   - wrangler secret put REPO_OWNER  (ltdcorporation)
   - wrangler secret put REPO_NAME   (ltd.github.io)
   - wrangler secret put FILE_PATH   (updates.json)
   - wrangler secret put BRANCH      (main)
6) Set Telegram webhook:
   - https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<nama-worker>.workers.dev/telegram

Catatan:
- Worker update file full (overwrite) dengan commit message otomatis, menyimpan `updates` sebelumnya.
- Timestamp pengumuman otomatis zona WIB (Asia/Jakarta).
- Hanya chat_id yang ada di `ADMIN_IDS` yang boleh eksekusi.

