// routes/posts.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../db');

// ------------------------------------------------------------
// Konfigurasi multer -> tempat & nama file upload disimpan.
// File fisik disimpan di folder /uploads, sedangkan yang
// disimpan ke DATABASE hanya *path/nama filenya saja* (bukan
// isi file). Ini praktik umum: file besar tidak ideal disimpan
// langsung di database.
// ------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// GET /api/posts -> semua postingan (pengumuman & tugas), terbaru dulu
router.get('/', (req, res) => {
  const sql = `
    SELECT posts.*, users.name AS author_name
    FROM posts
    JOIN users ON users.id = posts.author_id
    ORDER BY posts.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/posts/:id -> detail 1 postingan + komentar + submission
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT posts.*, users.name AS author_name
     FROM posts JOIN users ON users.id = posts.author_id
     WHERE posts.id = ?`,
    [id],
    (err, post) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

      db.all(
        `SELECT comments.*, users.name AS user_name
         FROM comments JOIN users ON users.id = comments.user_id
         WHERE post_id = ? ORDER BY comments.created_at ASC`,
        [id],
        (err2, comments) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.all(
            `SELECT submissions.*, users.name AS user_name
             FROM submissions JOIN users ON users.id = submissions.user_id
             WHERE post_id = ? ORDER BY submitted_at DESC`,
            [id],
            (err3, submissions) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ ...post, comments, submissions });
            }
          );
        }
      );
    }
  );
});

// POST /api/posts -> buat postingan baru { title, description, type, due_date, author_id }
router.post('/', (req, res) => {
  const { title, description, type, due_date, author_id } = req.body;
  if (!title || !author_id) {
    return res.status(400).json({ error: 'title dan author_id wajib diisi' });
  }
  db.run(
    `INSERT INTO posts (title, description, type, due_date, author_id)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description || '', type || 'assignment', due_date || null, author_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// POST /api/posts/:id/comments -> tambah komentar { user_id, text }
router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const { user_id, text } = req.body;
  if (!user_id || !text) {
    return res.status(400).json({ error: 'user_id dan text wajib diisi' });
  }
  db.run(
    `INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)`,
    [id, user_id, text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// POST /api/posts/:id/submissions -> upload file tugas
// dikirim sebagai multipart/form-data dengan field:
//   - file  (file yang diupload)
//   - user_id (murid yang mengumpulkan)
router.post('/:id/submissions', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'File tidak ditemukan pada request' });
  }
  if (!user_id) {
    return res.status(400).json({ error: 'user_id wajib diisi' });
  }

  db.run(
    `INSERT INTO submissions (post_id, user_id, file_name, file_path)
     VALUES (?, ?, ?, ?)`,
    [id, user_id, req.file.originalname, req.file.filename],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        file_name: req.file.originalname,
        file_path: req.file.filename
      });
    }
  );
});

module.exports = router;
