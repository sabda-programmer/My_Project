# Fitur Pengumpulan Tugas — Platform Belajar

Struktur proyek:

```
tugas-app/
├── backend/
│   ├── config/
│   │   └── db.js          # koneksi MySQL (connection pool)
│   ├── routes/
│   │   └── tugas.js        # endpoint upload, list, detail, delete
│   ├── uploads/             # tempat file tugas yang diupload disimpan
│   ├── db.sql               # skema database
│   ├── server.js            # entry point Express
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## Cara Menjalankan

1. **Siapkan database**
   ```bash
   mysql -u root -p < backend/db.sql
   ```

2. **Konfigurasi environment**
   ```bash
   cd backend
   cp .env.example .env
   # sesuaikan DB_USER, DB_PASSWORD, dst.
   ```

3. **Install dependency & jalankan server**
   ```bash
   npm install
   npm start
   ```

4. **Buka aplikasi**
   Kunjungi `http://localhost:3000` — frontend dan backend berjalan di server yang sama (Express menyajikan folder `frontend/` sebagai static file), jadi tidak perlu server terpisah.

## Alur Kerja Singkat

1. Siswa mengisi form di `frontend/index.html` dan memilih file tugas.
2. `script.js` mengirim data via `fetch()` sebagai `FormData` ke `POST /api/tugas`.
3. Di backend, **Multer** menyimpan file fisik ke folder `backend/uploads/`.
4. Data tugas (nama siswa, judul, path file, dll) disimpan ke tabel `pengumpulan_tugas` di MySQL lewat **mysql2**.
5. Frontend memanggil `GET /api/tugas` untuk menampilkan daftar tugas yang sudah masuk, lengkap dengan tautan untuk membuka file (`/uploads/namafile`).
