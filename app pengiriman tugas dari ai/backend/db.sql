-- ===================================================
-- Database: platform_belajar
-- Tabel untuk fitur pengumpulan tugas
-- ===================================================

CREATE DATABASE IF NOT EXISTS platform_belajar
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE platform_belajar;

CREATE TABLE IF NOT EXISTS pengumpulan_tugas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama_siswa    VARCHAR(100)  NOT NULL,
  nim_nis       VARCHAR(50)   NOT NULL,
  judul_tugas   VARCHAR(150)  NOT NULL,
  deskripsi     TEXT          NULL,
  nama_file     VARCHAR(255)  NOT NULL,   -- nama file asli saat diupload siswa
  file_disimpan VARCHAR(255)  NOT NULL,   -- nama file unik yang tersimpan di server
  path_file     VARCHAR(255)  NOT NULL,   -- lokasi relatif file di folder uploads
  ukuran_file   INT           NOT NULL,   -- dalam bytes
  tipe_file     VARCHAR(100)  NOT NULL,   -- mimetype, mis. application/pdf
  status        ENUM('terkirim', 'diperiksa', 'ditolak') DEFAULT 'terkirim',
  dikirim_pada  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Contoh data uji (opsional)
-- INSERT INTO pengumpulan_tugas (nama_siswa, nim_nis, judul_tugas, deskripsi, nama_file, file_disimpan, path_file, ukuran_file, tipe_file)
-- VALUES ('Budi Santoso', '2201001', 'Tugas Basis Data Minggu 3', 'Laporan ERD', 'tugas_budi.pdf', '1699999999-tugas_budi.pdf', '/uploads/1699999999-tugas_budi.pdf', 204800, 'application/pdf');
