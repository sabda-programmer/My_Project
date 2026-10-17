// server.js
// ------------------------------------------------------------
// Ini adalah "pintu masuk" backend. Tugasnya:
// 1. Menyalakan server Express
// 2. Memasang middleware (cors, json parser)
// 3. Menyambungkan route (users, posts) yang sudah pakai db.js
// 4. Menyediakan folder /uploads secara statis supaya file yang
//    dikirim murid bisa diakses/di-download lewat URL
// ------------------------------------------------------------

const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

// Izinkan frontend (domain/port berbeda) mengakses API ini.
// Di production sebaiknya batasi origin, contoh:
// app.use(cors({ origin: 'https://domain-frontend-kamu.com' }))
app.use(cors());

// Supaya req.body bisa membaca JSON yang dikirim frontend
app.use(express.json());

// Folder ini berisi file-file tugas yang diupload murid.
// Dengan baris ini, file bisa diakses lewat:
// http://localhost:3000/uploads/nama-file.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pasang routing. Semua endpoint user ada di /api/users,
// semua endpoint post/tugas/komentar ada di /api/posts
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

// Endpoint sederhana untuk mengecek server hidup
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Kelas Online berjalan 🎉' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
