# Kelas Online — Mini Google Classroom

Aplikasi kelas sederhana: guru bisa membuat pengumuman/tugas, murid bisa
mengumpulkan file tugas (seperti Google Classroom), dan semua orang bisa
saling berkomentar di setiap postingan.

## Struktur folder

```
classroom-app/
├── backend/                 -> server API (Node.js + Express)
│   ├── server.js            -> pintu masuk aplikasi backend
│   ├── db.js                -> koneksi & skema database SQLite
│   ├── routes/
│   │   ├── users.js         -> endpoint terkait user
│   │   └── posts.js         -> endpoint terkait postingan, komentar, upload
│   ├── uploads/              -> tempat file tugas yang diupload disimpan
│   └── package.json
│
└── frontend/                 -> tampilan yang dibuka di browser
    ├── index.html
    ├── style.css
    └── app.js                -> berisi semua kode yang "bicara" ke backend
```

---

## Konsep dasar: bagaimana 3 lapisan ini saling terhubung

Bayangkan 3 lapisan seperti restoran:

- **Database (SQLite)** = gudang bahan makanan. Hanya menyimpan data
  mentah (teks, angka, path file).
- **Backend (Express)** = dapur/koki. Dia satu-satunya pihak yang boleh
  masuk ke gudang (database). Dia menerima "pesanan" lewat API, mengambil
  bahan dari database, lalu mengembalikan hasil dalam format JSON.
- **Frontend (HTML/CSS/JS)** = pelayan + meja makan. Dia TIDAK PERNAH
  langsung menyentuh database. Dia hanya mengirim permintaan (fetch) ke
  backend lewat URL, misalnya `http://localhost:3000/api/posts`.

Alurnya selalu begini:

```
Browser (frontend)  --fetch()-->  Backend Express  --query SQL-->  Database SQLite
Browser (frontend)  <--JSON------ Backend Express  <--hasil------- Database SQLite
```

Frontend dan backend adalah **dua program terpisah** yang biasanya
berjalan di port berbeda (frontend misalnya port 5500, backend port
3000). Karena beda "alamat", browser secara default akan memblokir
komunikasi ini (kebijakan keamanan bernama **CORS**) kecuali backend
secara eksplisit mengizinkannya — itulah kenapa di `server.js` ada baris
`app.use(cors())`.

---

## Langkah 1 — Jalankan backend (yang otomatis membuat & menyambungkan database)

1. Buka terminal, masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Install semua dependency (express, cors, multer, sqlite3):
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   npm start
   ```
4. Kalau berhasil, akan muncul log seperti ini:
   ```
   ✅ Terhubung ke database SQLite: .../backend/classroom.db
   🚀 Server berjalan di http://localhost:3000
   ```

**Yang terjadi di balik layar (koneksi backend ⇄ database):**
`db.js` memakai library `sqlite3` untuk membuka (atau otomatis membuat
jika belum ada) file `classroom.db` di folder `backend/`. SQLite unik
karena databasenya cuma satu file — tidak perlu install "server
database" terpisah seperti MySQL/PostgreSQL. Begitu file itu dibuka,
`db.js` langsung menjalankan perintah SQL `CREATE TABLE IF NOT EXISTS`
untuk membuat tabel `users`, `posts`, `comments`, dan `submissions` jika
belum ada. File `routes/users.js` dan `routes/posts.js` lalu memanggil
`require('../db')` untuk memakai koneksi yang sama itu setiap kali ada
request masuk.

Coba buka `http://localhost:3000/api/health` di browser — kalau muncul
`{"status":"ok", ...}` berarti backend sudah hidup dan siap dipakai.

---

## Langkah 2 — Jalankan frontend & sambungkan ke backend

Frontend ini murni HTML/CSS/JS biasa (tanpa build tool), jadi paling
gampang dijalankan dengan **Live Server** (ekstensi VS Code) atau
perintah berikut:

```bash
cd frontend
npx serve .
```

atau cukup buka file `index.html` langsung dua kali klik di file
explorer.

**Titik penyambungannya ada satu baris saja**, di paling atas file
`frontend/app.js`:

```js
const API_BASE_URL = 'http://localhost:3000/api';
```

Semua fungsi di `app.js` (`loadPosts`, `handleNewPost`,
`handleAddComment`, `handleSubmitFile`, dst) memakai `fetch()` ke alamat
ini. Jadi kalau nanti backend kamu di-deploy ke server lain (misalnya
`https://api-kelasku.com`), kamu **hanya perlu mengubah baris ini saja**
di frontend — tidak perlu mengubah kode lain.

Contoh alur nyata saat murid mengirim komentar:

1. User mengetik teks lalu klik "Kirim" → event `submit` ditangkap oleh
   `handleAddComment()` di `app.js`.
2. `app.js` memanggil:
   ```js
   fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ user_id: currentUserId, text })
   });
   ```
3. Request ini "mendarat" di `backend/routes/posts.js`, pada baris
   `router.post('/:id/comments', ...)`.
4. Backend menjalankan `INSERT INTO comments ...` ke database SQLite.
5. Backend membalas dengan JSON `{ id: ... }`.
6. Frontend memanggil ulang `loadPosts()` supaya komentar baru langsung
   muncul di layar.

Pola yang sama berlaku untuk membuat postingan dan mengumpulkan file
tugas.

---

## Langkah 3 — Cara upload file tugas bekerja (bagian "Google Classroom"-nya)

Ini bagian yang paling sering membingungkan, jadi dijelaskan rinci:

1. Di frontend, upload file **tidak** dikirim sebagai JSON biasa,
   melainkan sebagai `FormData` (lihat `handleSubmitFile` di
   `app.js`). Ini wajib karena file adalah data biner, bukan teks.
2. Di backend (`routes/posts.js`), library **multer** menerima file itu,
   lalu:
   - Menyimpan **file fisiknya** ke folder `backend/uploads/` dengan
     nama unik (supaya tidak bentrok jika ada 2 murid upload file dengan
     nama sama).
   - Ke **database**, yang disimpan hanyalah *catatan/metadata*-nya:
     nama file asli, path/nama file di folder uploads, siapa yang upload,
     dan kapan — bukan isi filenya. Ini praktik standar; file besar tidak
     ideal disimpan langsung sebagai data di database.
3. Supaya file itu bisa dibuka/didownload lagi lewat browser, di
   `server.js` ada baris:
   ```js
   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
   ```
   Baris ini membuat semua file di folder `uploads/` bisa diakses lewat
   URL, contoh: `http://localhost:3000/uploads/173-tugas.pdf`. Link
   inilah yang dipakai frontend untuk menampilkan tombol "download" di
   daftar pengumpulan tugas.

---

## Ringkasan skema database

| Tabel | Isi |
|---|---|
| `users` | daftar guru & murid (id, name, role) |
| `posts` | pengumuman/tugas yang dibuat guru (title, description, type, due_date) |
| `comments` | komentar/diskusi di bawah sebuah post |
| `submissions` | catatan file tugas yang dikumpulkan murid (nama file, path file) |

Relasi: 1 `post` bisa punya banyak `comments` dan banyak `submissions`
(relasi one-to-many, dihubungkan lewat kolom `post_id`).

---

## Menambah fitur / mengembangkan lebih lanjut

- **Login sungguhan**: saat ini "login" hanya memilih nama dari
  dropdown (untuk demo). Untuk produksi, tambahkan autentikasi (misalnya
  JWT + hash password dengan `bcrypt`).
- **Ganti SQLite ke PostgreSQL/MySQL**: cukup ganti isi `db.js` dengan
  driver yang sesuai (`pg` atau `mysql2`) — struktur `routes/*.js` tidak
  perlu banyak berubah karena query SQL-nya mirip.
- **Deploy**: backend bisa di-deploy ke layanan seperti Render/Railway,
  frontend ke Netlify/Vercel/GitHub Pages. Setelah backend online, tinggal
  update `API_BASE_URL` di `app.js` ke alamat backend yang baru, dan
  `origin` di `cors()` pada `server.js` ke alamat frontend yang baru.
