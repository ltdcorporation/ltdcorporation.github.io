# Lust to Death Landing Page & Admin Bot

Landing page ini statis full teks (nggak ada konten eksplisit) + Cloudflare Worker buat update konten via bot Telegram. Bundle ini disimpan di repo `ltdcorporation.github.io` dan langsung live di GitHub Pages.

## Struktur Folder
- `index.html`, `404.html`, `.nojekyll`, `updates.json`, `logo.jpg` (opsional) — aset GitHub Pages
- `bot-worker/` — Cloudflare Worker + dokumentasi bot admin

## Update Konten via Bot
Bot admin `@ltdwebadminbot` udah siap pakai. Semua perubahan landing page cukup lewat command di Telegram (nggak perlu edit file manual).

### Flow Cepat
1. Ketik `/menu` buat liat shortcut tombol.
2. Pakai command sesuai kebutuhan:
   - Link: `/main`, `/addmirror`, `/delmirror`, `/status`
   - Bot resmi: `/addbot`, `/delbot`
   - Pengumuman: `/update`, `/updates`, `/editupdate`, `/delupdate`
   - Copy landing page: `/showcopy`, `/setcopy <key> <teks>`, `/setcopylist <key> item1 | item2 | item3`
3. Semua perubahan commit otomatis ke `updates.json` di branch `main` repo `ltdcorporation.github.io`.

### Default Copy (ketik `default` buat reset)
| Key | Default |
| --- | --- |
| `ageTitle` | Halaman 18+ |
| `ageText` | Dengan lanjut, lo nyatakan umur 18+ dan setuju sama aturan halaman ini. |
| `ageButton` | Gue 18+ (Lanjut) |
| `channelNames` | Array label buat tombol channel (opsional, fallback ke @handle). |
| `taglines` | 1. Lust to Death — pusat kanal resmi <br> 2. Kalau channel pindah, info barunya selalu di sini. |
| `channelsTitle` | Channel Resmi |
| `channelsHint` | Semua link channel aktif. |
| `copyHint` | Tips: abis klik "Salin Link", buka Telegram terus tempel link-nya di search/browser Telegram. |
| `joinTitle` | Cara Join (2 langkah) |
| `joinSteps` | 1. Pilih salah satu channel resmi di atas. <br> 2. Buka link di Telegram lalu pencet "Join/Bergabung". |
| `botsTitle` | Bot Resmi |
| `botsHint` | Klik Mulai → pilih menu → ikutin instruksi. Kalo lagi rewel, coba bot lainnya. |
| `updatesTitle` | Update Terbaru |
| `legalTitle` | Legal / 18+ |
| `legalItems` | 1. 18+ ONLY. Bukan untuk yang di bawah 18. <br> 2. Konten legal dan konsensual. Ini cuma pusat info/link. <br> 3. Kalo ada masalah/DMCA, hubungi kami via bot. |
| `footer` | Simpen halaman ini biar gampang dicari. Stay safe dan hormati rules platform. |

`/setcopy` menerima string. `/setcopylist` pisahkan item pakai `|`. Ketik `default` (atau `-`) buat balikin ke teks bawaan.

### Setup Worker (sekali jalan)
1. `cd bot-worker`
2. Login Cloudflare: `wrangler login`
3. Deploy pertama: `wrangler deploy`
4. Set secrets:
   ```
   wrangler secret put BOT_TOKEN
   wrangler secret put GITHUB_TOKEN
   wrangler secret put ADMIN_IDS
   wrangler secret put REPO_OWNER  # ltdcorporation
   wrangler secret put REPO_NAME   # ltdcorporation.github.io
   wrangler secret put FILE_PATH   # updates.json
   wrangler secret put BRANCH      # main
   ```
5. Set webhook Telegram: `https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ltd-admin-bot.rozikinkhoirr.workers.dev/telegram`

### Redeploy Worker
```
cd bot-worker
wrangler deploy
```
(Update kode Worker → deploy ulang. Ubah `updates.json` doang cukup commit/push.)

## Deploy GitHub Pages Manual (opsional)
1. Pastikan repo `ltdcorporation/ltdcorporation.github.io` sinkron dengan folder ini.
2. Commit & push ke branch `main`.
3. GitHub Pages otomatis build → cek `https://ltdcorporation.github.io/` (atau domain custom kalau ada file `CNAME`).

## Tips Tambahan
- Logo pakai `logo.svg` / `logo.png` / `logo.jpg`. Kalau file nggak ada, script otomatis nyembunyiin `<img id="logo">`.
- Semua teks bisa di-hide: set ke kosong pakai `/setcopy <key> -` atau kosongin list.
- Backup: tar `updates.json` + tag git release sebelum migrasi.
- Rollback gampang: `git checkout v1.0.0` (tag pertama repo landing page).
