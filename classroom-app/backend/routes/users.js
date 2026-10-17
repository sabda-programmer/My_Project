// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users -> daftar semua user (untuk dropdown "login sebagai")
router.get('/', (req, res) => {
  db.all('SELECT id, name, role FROM users ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/users -> tambah user baru { name, role }
router.post('/', (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'name dan role wajib diisi' });
  }
  db.run(
    'INSERT INTO users (name, role) VALUES (?, ?)',
    [name, role],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, role });
    }
  );
});

module.exports = router;
