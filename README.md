
# Lust to Death Landing Page & Admin Bot

Landing page ini statis full teks + Cloudflare Worker supaya semua update bisa dilakukan via bot Telegram (`@ltdwebadminbot`). Repo ini langsung dipakai GitHub Pages (`ltdcorporation.github.io` atau `asiafap.com`).

## Struktur Repo
| Path | Deskripsi |
| --- | --- |
| `index.html`, `404.html`, `.nojekyll`, `updates.json`, `logo.jpg` | Aset GitHub Pages |
| `CNAME` | Domain custom (`asiafap.com`) |
| `bot-worker/` | Cloudflare Worker + skrip bot admin |

## Bot Admin – Ringkasan Perintah
Gunakan `/help` di bot buat lihat panduan ini langsung di Telegram. Berikut cheat sheet per kategori:

### 1. Channel
- `/setcopylist channels <url1> | <url2> | ...` → set urutan tombol channel (opsional).
- `/setcopylist channelNames <label1> | <label2> | ...` → set label tombol sesuai urutan channel.
- `/setcopylist channels default` → balik ke `latestLink + mirrors` bawaan.

### 2. Status & Update
- `/status <teks>` → ganti status di header.
- `/update <teks>` → tambah pengumuman (timestamp otomatis WIB).
- `/updates` → lihat daftar update + index.
- `/editupdate <index> <teks baru>` → revisi pengumuman.
- `/delupdate <index>` → hapus pengumuman.

### 3. Copy Landing Page
- `/showcopy` → lihat teks/list yang lagi aktif beserta default-nya.
- `/setcopy <key> <teks>` → ganti teks tunggal. Ketik `default` atau `-` untuk reset.
- `/setcopylist <key> item1 | item2 | ...` → ganti list (pisahkan dengan `|`).

### 4. Bot Resmi
- `/addbot <url>` → tambah bot resmi.
- `/delbot <index>` → hapus bot sesuai urutan (lihat `/show`).

### 5. Monitoring
- `/show` → ringkasan config (link utama, daftar channel/bot, update terakhir).
- `/help` → tampilkan panduan lengkap + tombol pintasan.

> Gunakan `default` atau `-` di command copy/list untuk balikin ke nilai bawaan.

## Format `updates.json`
```json
{
  "latestLink": "https://t.me/ltddev",
  "mirrors": ["https://t.me/lusttodeath"],
  "channels": ["https://t.me/ltddev", "https://t.me/lusttodeath"],
  "channelNames": ["LTD Store", "Lust to Death"],
  "bots": ["https://t.me/ltdstorev4bot"],
  "status": "Status Channel: AKTIF",
  "updates": [{"ts": "2025-10-01T07:00:00+07:00", "text": "Halaman siap dipake."}],
  "copy": { ... }
}
```
Bot otomatis commit ke branch `main` repo ini, jadi cukup gunakan command di atas tanpa edit manual.

## Default Copy
| Key | Default |
| --- | --- |
| `ageTitle` | Halaman 18+ |
| `ageText` | Dengan lanjut, lo nyatakan umur 18+ dan setuju sama aturan halaman ini. |
| `ageButton` | Gue 18+ (Lanjut) |
| `taglines` | 1. Lust to Death — pusat kanal resmi <br> 2. Kalau channel lagi pindah, info barunya selalu ada di sini. |
| `channelNames` | [] (fallback ke @handle) |
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

## Setup Cloudflare Worker
1. `cd bot-worker`
2. `wrangler login`
3. `wrangler deploy`
4. Set secret:
   ```
   wrangler secret put BOT_TOKEN
   wrangler secret put GITHUB_TOKEN
   wrangler secret put ADMIN_IDS
   wrangler secret put REPO_OWNER
   wrangler secret put REPO_NAME
   wrangler secret put FILE_PATH
   wrangler secret put BRANCH
   ```
5. Set webhook: `https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ltd-admin-bot.rozikinkhoirr.workers.dev/telegram`
6. Update Worker bila ada perubahan code: `wrangler deploy`

## Deploy GitHub Pages Manual
1. Commit & push ke branch `main`
2. Pastikan file `CNAME` berisi `asiafap.com`
3. GitHub Pages rebuild otomatis → cek `https://asiafap.com/`

## Tips
- Logo mencari `logo.svg` kemudian `logo.png` lalu `logo.jpg`. Kalau tidak ada, otomatis disembunyikan.
- Sebelum backup/migrasi: simpan `updates.json` + tag git release.
- Untuk rollback landing page: `git checkout v1.0.0`
