// config/db.js
// Konfigurasi koneksi ke database MySQL menggunakan connection pool.
// Pool dipakai (bukan single connection) supaya server bisa menangani
// banyak request pengumpulan tugas secara bersamaan tanpa membuka
// koneksi baru setiap kali.

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'platform_belajar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Gunakan versi promise supaya bisa pakai async/await di routes
const promisePool = pool.promise();

module.exports = promisePool;
