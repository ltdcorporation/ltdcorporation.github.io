Landing page full teks, idiot-proof, tanpa gambar eksplisit. Cuma info channel, bot, dan update.

Cara Pakai Cepat
- Edit `landing/updates.json`:
  - `latestLink`: ganti ke link channel utama
  - `mirrors`: isi 1–3 link cadangan (opsional)
  - `bots`: daftar link bot resmi (bisa banyak)
  - `status`: teks status default
  - `updates`: daftar pengumuman terbaru
- (Opsional) Tambah `landing/logo.svg` atau `landing/logo.png`. Kalau ga ada, logo otomatis disembunyikan.
- Buka `landing/index.html` di browser lokal buat cek.

Deploy ke GitHub Pages (User Site)
1) Buat repo bernama `ltd.github.io` di GitHub (punya akun `ltdcorporation`).
2) Copy isi folder `landing/` (index.html, updates.json, 404.html, .nojekyll) ke root repo.
3) (Opsional) Taruh logo sebagai `logo.svg` atau `logo.png` atau `logo.jpg` di root repo.
4) Commit dan push ke `main`. User Site aktif otomatis di `https://ltd.github.io/`.
5) Tunggu ±1–2 menit, lalu test URL-nya.

Custom Domain (opsional)
- Tambah file `CNAME` berisi domain kamu (contoh: `status.domain.com`).
- Atur DNS ke GitHub Pages sesuai panduan.

Catatan
- Halaman ini hanya pusat info/link. Tidak menyimpan konten eksplisit.
- Edit teks di `index.html` kalau mau lebih personal.
- Semua copy sudah dibuat santuy dan jelas.
