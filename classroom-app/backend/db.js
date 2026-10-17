// db.js
// ------------------------------------------------------------
// File ini bertugas SATU hal saja: membuka koneksi ke database
// SQLite dan membuat tabel-tabel yang dibutuhkan jika belum ada.
// File lain (routes/*.js) tinggal "require('./db')" untuk
// mendapatkan koneksi yang sama (koneksi di-share/reuse).
// ------------------------------------------------------------

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Lokasi file database. SQLite = database dalam bentuk 1 file,
// jadi tidak perlu install server database terpisah (beda dengan
// MySQL/PostgreSQL yang butuh proses server sendiri).
const DB_PATH = path.join(__dirname, 'classroom.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Gagal konek ke database:', err.message);
  } else {
    console.log('✅ Terhubung ke database SQLite:', DB_PATH);
  }
});

// Aktifkan foreign key constraint (di SQLite defaultnya OFF)
db.run('PRAGMA foreign_keys = ON');

// ------------------------------------------------------------
// Skema tabel
// ------------------------------------------------------------
db.serialize(() => {
  // Tabel pengguna (guru & murid). Tanpa sistem login rumit,
  // cukup pilih "tampil sebagai siapa" di frontend.
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher','student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel "postingan" kelas: bisa berupa Pengumuman atau Tugas.
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('announcement','assignment')) DEFAULT 'assignment',
      due_date DATETIME,
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // Tabel komentar pada sebuah postingan (diskusi kelas)
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabel pengumpulan tugas (file yang dikirim murid)
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Seed data awal (hanya jika tabel users masih kosong) supaya
  // aplikasi langsung bisa dicoba tanpa setup manual dulu.
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)');
      stmt.run('Bu Sari (Guru)', 'teacher');
      stmt.run('Andi', 'student');
      stmt.run('Budi', 'student');
      stmt.finalize();
      console.log('🌱 Seed data user awal berhasil ditambahkan');
    }
  });
});

module.exports = db;
