// server.js
// Entry point aplikasi backend platform belajar (fitur pengumpulan tugas)

const express = require('express');
const cors = require('cors');
const path = require('path');
const tugasRoutes = require('./routes/tugas');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------
// Middleware
// -------------------------------------------------------
app.use(cors());                          // izinkan request dari frontend (origin berbeda)
app.use(express.json());                  // parsing body JSON
app.use(express.urlencoded({ extended: true }));

// Folder "uploads" dibuat bisa diakses publik lewat URL /uploads/namafile
// sehingga file yang dikumpulkan bisa langsung dibuka/didownload dari browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sajikan halaman frontend (html, css, js) langsung dari backend
// supaya frontend & backend menyatu dalam satu server yang sama
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// -------------------------------------------------------
// Routing API
// -------------------------------------------------------
app.use('/api/tugas', tugasRoutes);

// Fallback: kalau endpoint API tidak ditemukan
app.use('/api', (req, res) => {
  res.status(404).json({ sukses: false, pesan: 'Endpoint tidak ditemukan.' });
});

// -------------------------------------------------------
// Jalankan server
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
