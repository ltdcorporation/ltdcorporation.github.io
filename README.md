
# Lust to Death Landing Page & Admin Bot

Landing page ini statis full teks + Cloudflare Worker supaya semua update bisa dilakukan via bot Telegram (`@ltdwebadminbot`). Repo ini langsung dipakai GitHub Pages (`ltdcorporation.github.io` atau `asiafap.com`).

## Struktur Repo
| Path | Deskripsi |
| --- | --- |
| `index.html`, `404.html`, `.nojekyll`, `updates.json`, `logo.jpg` | Aset GitHub Pages |
| `CNAME` | Domain custom (`asiafap.com`) |
| `bot-worker/` | Cloudflare Worker + skrip bot admin |

## Bot Admin – Ringkasan Perintah
Ketik `/help` di bot buat nampilin catatan ini kapan aja. Versi teksnya:

### Channel (atur tombol link)
- **Urutkan link channel:** `/setcopylist channels link1 | link2 | ...` — ketik semua link dari kiri ke kanan, pisahkan dengan tanda `|`. Contoh: `/setcopylist channels https://t.me/ltddev | https://t.me/lusttodeath`.
- **Namai tombolnya:** `/setcopylist channelNames nama1 | nama2 | ...` — urutannya wajib sama kayak daftar link di atas.
- **Balik default:** `/setcopylist channels default` — pakai lagi urutan bawaan (link utama + mirrors).

### Status & Update (pengumuman)
- **Ganti teks status:** `/status Status baru`
- **Tambah pengumuman:** `/update Pengumuman baru` (timestamp WIB otomatis)
- **Lihat daftar:** `/updates`
- **Edit/hapus:** `/editupdate nomor teks baru` atau `/delupdate nomor`. Contoh: `/editupdate 2 Bot sudah normal`.

### Copy Landing Page (semua teks/list)
- **Lihat daftar field:** `/showcopy` — muncul nama field kaya `ageTitle`, `footer`, `taglines`, dll.
- **Ganti teks tunggal:** `/setcopy namaField teks baru`. Contoh: `/setcopy legalTitle Legal / 18+`. Ketik `default` atau `-` buat reset.
- **Ganti list:** `/setcopylist namaField item1 | item2 | ...` buat field list (misal `taglines`, `joinSteps`). Pisahkan dengan `|`. Ketik `default` atau `-` buat reset.

### Bot Resmi
- **Tambah bot:** `/addbot https://t.me/namabot`
- **Hapus bot:** `/delbot nomor` — nomor sesuai urutan di `/show`.

### Monitoring / Misc
- **Ringkasan cepat:** `/show`
- **Buka catatan ini:** `/help`

> Tips: semua command copy/list bisa balik ke default cukup ketik `default` atau `-` sebagai teks pengganti.

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
