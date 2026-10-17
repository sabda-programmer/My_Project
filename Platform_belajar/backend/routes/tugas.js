// routes/tugas.js
// Semua endpoint terkait pengumpulan tugas ada di sini.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// -------------------------------------------------------
// 1. Konfigurasi folder penyimpanan file (disk storage)
// -------------------------------------------------------
// Semua file tugas yang dikirim siswa disimpan dalam satu folder
// "uploads" yang berada di directory yang sama dengan project backend.
const uploadDir = path.join(__dirname, '..', 'uploads');

// Pastikan folder uploads ada, kalau belum ada maka dibuat otomatis
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// -------------------------------------------------------
// 2. Konfigurasi Multer (middleware upload file)
// -------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format nama file: timestamp-namaasli.ext
    // supaya tidak ada file yang saling menimpa (overwrite)
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

// Filter tipe file yang diperbolehkan (bisa disesuaikan kebutuhan)
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg'
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, PPT, PPTX, ZIP, atau gambar.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // maksimal 10MB per file
});

// -------------------------------------------------------
// 3. POST /api/tugas  -> kirim / upload tugas baru
// -------------------------------------------------------
router.post('/', upload.single('file_tugas'), async (req, res) => {
  try {
    const { nama_siswa, nim_nis, judul_tugas, deskripsi } = req.body;

    if (!req.file) {
      return res.status(400).json({ sukses: false, pesan: 'File tugas wajib diupload.' });
    }
    if (!nama_siswa || !nim_nis || !judul_tugas) {
      return res.status(400).json({ sukses: false, pesan: 'Nama, NIM/NIS, dan judul tugas wajib diisi.' });
    }

    const namaFileAsli = req.file.originalname;
    const fileDisimpan = req.file.filename;
    const pathFile = '/uploads/' + req.file.filename; // path relatif yang bisa diakses publik
    const ukuranFile = req.file.size;
    const tipeFile = req.file.mimetype;

    const sql = `
      INSERT INTO pengumpulan_tugas
        (nama_siswa, nim_nis, judul_tugas, deskripsi, nama_file, file_disimpan, path_file, ukuran_file, tipe_file)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      nama_siswa,
      nim_nis,
      judul_tugas,
      deskripsi || null,
      namaFileAsli,
      fileDisimpan,
      pathFile,
      ukuranFile,
      tipeFile
    ]);

    res.status(201).json({
      sukses: true,
      pesan: 'Tugas berhasil dikirim.',
      data: {
        id: result.insertId,
        nama_siswa,
        nim_nis,
        judul_tugas,
        nama_file: namaFileAsli,
        path_file: pathFile,
        dikirim_pada: new Date()
      }
    });
  } catch (err) {
    console.error('Gagal menyimpan tugas:', err.message);
    res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan di server: ' + err.message });
  }
});

// -------------------------------------------------------
// 4. GET /api/tugas  -> ambil semua daftar tugas terkumpul
// -------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM pengumpulan_tugas ORDER BY dikirim_pada DESC'
    );
    res.json({ sukses: true, total: rows.length, data: rows });
  } catch (err) {
    console.error('Gagal mengambil data tugas:', err.message);
    res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan di server.' });
  }
});

// -------------------------------------------------------
// 5. GET /api/tugas/:id  -> detail satu tugas
// -------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM pengumpulan_tugas WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ sukses: false, pesan: 'Tugas tidak ditemukan.' });
    }
    res.json({ sukses: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan di server.' });
  }
});

// -------------------------------------------------------
// 6. DELETE /api/tugas/:id  -> hapus tugas (data + file fisik)
// -------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM pengumpulan_tugas WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ sukses: false, pesan: 'Tugas tidak ditemukan.' });
    }

    const filePath = path.join(uploadDir, rows[0].file_disimpan);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // hapus file fisik dari folder uploads
    }

    await db.execute('DELETE FROM pengumpulan_tugas WHERE id = ?', [req.params.id]);

    res.json({ sukses: true, pesan: 'Tugas berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan di server.' });
  }
});

module.exports = router;
