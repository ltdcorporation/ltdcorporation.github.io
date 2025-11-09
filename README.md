
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

### Channel & Link
1. **Ganti link utama:**  
   `/main https://t.me/ltddev`
2. **Tambah channel/mirror cadangan:**  
   `/addmirror https://t.me/lusttodeath`
3. **Hapus channel/mirror nomor tertentu (lihat urutan di `/show`):**  
   `/delmirror 2`
4. **Susun tombol manual:**  
   `/setcopylist channels link1 | link2 | link3`
5. **Kasih label tombol sesuai urutan link:**  
   `/setcopylist channelNames Nama 1 | Nama 2 | Nama 3`
6. **Balik ke default (kombinasi main + mirrors):**  
   `/setcopylist channels default`

### Status & Update
1. **Status header:** `/status Channel aman`
2. **Tambah pengumuman:** `/update Pesan terbaru` (timestamp WIB otomatis)
3. **Lihat daftar:** `/updates` (nomor urut dipake buat edit/hapus)
4. **Edit/hapus:** `/editupdate 2 Bot sudah normal` atau `/delupdate 3`

### Copy Landing Page
- **Langkah 1 – cek nama field yang lagi aktif (ageTitle, footer, taglines, channelNames, botNames, legalItems, dll):**  
  `/showcopy`
- **Ganti teks tunggal:** `/setcopy ageTitle Tulisan baru`
- **Balikkan teks tunggal ke default:** `/setcopy ageTitle default` (bisa juga pakai `-`)
- **Ganti list (taglines / channelNames / botNames / legalItems / dll):**  
  `/setcopylist taglines Baris 1 | Baris 2 | Baris 3`
- **Reset list ke default:** `/setcopylist taglines default`

### Bot Resmi
- `/addbot https://t.me/namabot`
- `/delbot 2` → hapus bot nomor 2 (lihat urutan di `/show`)
- `/setcopylist botNames Nama 1 | Nama 2 | ...` → label tombol bot sesuai urutan daftar bot

### Monitoring
- `/show` → ringkasan link utama, mirrors, bot, update terakhir
- `/help` → tampilin catatan ini kapan aja

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
| `botNames` | [] (fallback ke @handle) |
| `channelsTitle` | Channel Resmi |
| `channelsHint` | Semua link channel aktif. |
| `copyHint` | Tips: abis klik "Salin Link", buka Telegram terus tempel link-nya di search/browser Telegram. |
| `joinTitle` | Cara Join (2 langkah) |
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
