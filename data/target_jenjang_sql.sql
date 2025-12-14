-- ============================================
-- SQL SCRIPT: TARGET PER JENJANG
-- PPG Sorong - Sistem Kurikulum
-- ============================================

-- STEP 1: Tambah kolom baru ke tabel target_jenjang jika belum ada
ALTER TABLE target_jenjang 
ADD COLUMN IF NOT EXISTS satuan VARCHAR(50),
ADD COLUMN IF NOT EXISTS keterangan TEXT,
ADD COLUMN IF NOT EXISTS jenis_penilaian VARCHAR(10) DEFAULT 'Obj',
ADD COLUMN IF NOT EXISTS rumus VARCHAR(100),
ADD COLUMN IF NOT EXISTS max_nilai INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS sumber VARCHAR(50),
ADD COLUMN IF NOT EXISTS urutan INTEGER;

-- STEP 2: Buat tabel bidang_aspek jika belum ada (untuk Keaktifan, Kemandirian)
-- Skip jika bidang sudah ada di tabel bidang

-- STEP 3: Pastikan semua kategori materi ada
-- Insert kategori yang belum ada

-- Cek dan insert kategori untuk setiap bidang
-- ALIM
INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'IQR', 'Iqro/Tilawaty', 'halaman', 1, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'HFS', 'Hafalan Surat', 'surat', 2, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'HFD-G', 'Hafalan Doa GBMTPG', 'doa', 3, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'HFD-S', 'Hafalan Doa Generus Sorong', 'doa', 4, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'HFL-G', 'Hafalan Dalil GBMTPG', 'dalil', 5, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'HFL-S', 'Hafalan Dalil Generus Sorong', 'dalil', 6, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'KLM', 'Keilmuan GBMTPG', 'materi', 7, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'TJW', 'Tajwid', 'materi', 8, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'MKQ', 'Makna Quran', 'juz', 9, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'MKH', 'Makna Hadits', 'kitab', 10, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'KLB', 'Kualitas Bacaan', 'nilai', 11, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'PGN', 'Praktek Pegon', 'nilai', 12, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'TDR', 'Tadarus Al-Quran', 'juz', 13, true
FROM bidang b WHERE b.kode = 'ALIM'
ON CONFLICT DO NOTHING;

-- FAQIH
INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'KFA', 'Kefahaman Agama GBMTPG', 'materi', 1, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'PIB', 'Praktek Ibadah GBMTPG', 'materi', 2, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'PWS', 'Praktek Wudhu Sholat', 'nilai', 3, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'PTH', 'Praktek Thoharoh', 'nilai', 4, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'PJZ', 'Praktek Perawatan Jenazah', 'nilai', 5, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'NBP', 'Nasehat Bernomor BPI', 'nasehat', 6, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, '4TK', '4 Tali Keimanan', 'nilai', 7, true
FROM bidang b WHERE b.kode = 'FAQIH'
ON CONFLICT DO NOTHING;

-- AKHLAQ
INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, '6TL', '6 Thobiat Luhur', 'nilai', 1, true
FROM bidang b WHERE UPPER(b.kode) IN ('AKHLAQ', 'AKHLAK')
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'ADB', 'Adab/Tatakrama', 'materi', 2, true
FROM bidang b WHERE UPPER(b.kode) IN ('AKHLAQ', 'AKHLAK')
ON CONFLICT DO NOTHING;

-- Buat bidang tambahan jika belum ada
INSERT INTO bidang (kode, nama, deskripsi, urutan, is_aktif)
VALUES 
('KEAKTIFAN', 'Keaktifan', 'Keaktifan mengikuti kegiatan', 0, true),
('KEMANDIRIAN', 'Kemandirian', 'Kemandirian dan keterampilan hidup', 4, true)
ON CONFLICT (kode) DO NOTHING;

-- Kategori untuk Keaktifan
INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'KAK', 'Keaktifan Bulanan', 'kali', 1, true
FROM bidang b WHERE b.kode = 'KEAKTIFAN'
ON CONFLICT DO NOTHING;

-- Kategori untuk Kemandirian
INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'KMD', 'Kemandirian GBMTPG', 'materi', 1, true
FROM bidang b WHERE b.kode = 'KEMANDIRIAN'
ON CONFLICT DO NOTHING;

INSERT INTO kategori_materi (bidang_id, kode, nama, satuan, urutan, is_aktif)
SELECT b.id, 'ASD', 'ASAD Beladiri', 'jurus', 2, true
FROM bidang b WHERE b.kode = 'KEMANDIRIAN'
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: CLEAR EXISTING TARGET DATA
-- ============================================
-- HATI-HATI: Ini akan menghapus semua target yang ada
-- DELETE FROM target_jenjang;

-- ============================================
-- STEP 5: INSERT TARGET DATA PER JENJANG
-- ============================================

-- Function untuk insert target dengan lookup
CREATE OR REPLACE FUNCTION insert_target(
    p_jenjang_nama VARCHAR,
    p_bidang_kode VARCHAR,
    p_kategori_nama VARCHAR,
    p_target_jumlah INTEGER,
    p_satuan VARCHAR,
    p_keterangan TEXT,
    p_jenis VARCHAR,
    p_rumus VARCHAR,
    p_max INTEGER,
    p_sumber VARCHAR,
    p_urutan INTEGER
) RETURNS VOID AS $$
DECLARE
    v_jenjang_id INTEGER;
    v_kategori_id INTEGER;
BEGIN
    -- Get jenjang_id
    SELECT id INTO v_jenjang_id FROM jenjang WHERE LOWER(nama) LIKE LOWER('%' || p_jenjang_nama || '%') LIMIT 1;
    
    -- Get kategori_id
    SELECT km.id INTO v_kategori_id 
    FROM kategori_materi km
    JOIN bidang b ON km.bidang_id = b.id
    WHERE LOWER(km.nama) LIKE LOWER('%' || p_kategori_nama || '%')
    AND (UPPER(b.kode) = UPPER(p_bidang_kode) OR UPPER(b.kode) = 'AKHLAK')
    LIMIT 1;
    
    -- Insert if both found
    IF v_jenjang_id IS NOT NULL AND v_kategori_id IS NOT NULL THEN
        INSERT INTO target_jenjang (jenjang_id, kategori_id, target_jumlah, satuan, keterangan, jenis_penilaian, rumus, max_nilai, sumber, urutan)
        VALUES (v_jenjang_id, v_kategori_id, p_target_jumlah, p_satuan, p_keterangan, p_jenis, p_rumus, p_max, p_sumber, p_urutan)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT TARGET PAUD
-- ============================================
SELECT insert_target('PAUD', 'KEAKTIFAN', 'Keaktifan Bulanan', 20, 'kali', 'Target 20x/bulan', 'Obj', '(Total/12)/20x100', 100, 'Panduan', 1);
SELECT insert_target('PAUD', 'ALIM', 'Iqro/Tilawaty', 35, 'halaman', 'Iqro Jilid 1', 'Obj', 'Hal/35x100', 100, 'Panduan', 2);
SELECT insert_target('PAUD', 'ALIM', 'Hafalan Surat', 6, 'surat', 'Al-Fatihah & An-Nas s/d Al-Kafirun', 'Obj', 'Surat/6x100', 100, 'GBMTPG', 3);
SELECT insert_target('PAUD', 'ALIM', 'Hafalan Doa GBMTPG', 6, 'doa', 'Asmaul Husna & Doa harian', 'Obj', 'Doa/6x100', 100, 'GBMTPG', 4);
SELECT insert_target('PAUD', 'ALIM', 'Hafalan Doa Generus Sorong', 12, 'doa', 'Doa Generus Sorong dasar', 'Obj', 'Doa/12x100', 100, 'Panduan', 5);
SELECT insert_target('PAUD', 'ALIM', 'Keilmuan GBMTPG', 4, 'materi', 'Dasar aqidah', 'Obj', 'Materi/4x100', 100, 'GBMTPG', 6);
SELECT insert_target('PAUD', 'FAQIH', 'Kefahaman Agama', 10, 'materi', 'Kefahaman dasar', 'Obj', 'Materi/10x100', 100, 'GBMTPG', 7);
SELECT insert_target('PAUD', 'FAQIH', 'Praktek Ibadah', 6, 'materi', 'Praktek ibadah dasar', 'Obj', 'Materi/6x100', 100, 'GBMTPG', 8);
SELECT insert_target('PAUD', 'FAQIH', 'Praktek Wudhu Sholat', 1, 'nilai', 'Praktek wudhu sholat', 'Subj', 'Nilai Penguji', 75, 'Panduan', 9);
SELECT insert_target('PAUD', 'FAQIH', 'Praktek Thoharoh', 1, 'nilai', 'Praktek thoharoh', 'Subj', 'Nilai Penguji', 75, 'Panduan', 10);
SELECT insert_target('PAUD', 'FAQIH', '4 Tali Keimanan', 100, 'nilai', 'Pengenalan 4 Tali Keimanan', 'Subj', 'Nilai', 100, 'Panduan', 11);
SELECT insert_target('PAUD', 'AKHLAQ', '6 Thobiat', 100, 'nilai', 'Pengenalan 6 Thobiat', 'Subj', 'Nilai', 100, 'Panduan', 12);
SELECT insert_target('PAUD', 'AKHLAQ', 'Adab/Tatakrama', 35, 'materi', 'Tatakrama dasar', 'Obj', 'Materi/35x100', 100, 'GBMTPG', 13);
SELECT insert_target('PAUD', 'KEMANDIRIAN', 'Kemandirian GBMTPG', 8, 'materi', 'Kemandirian dasar', 'Obj', 'Materi/8x100', 100, 'GBMTPG', 14);
SELECT insert_target('PAUD', 'KEMANDIRIAN', 'ASAD Beladiri', 1, 'jurus', 'Jurus 1', 'Subj', 'Nilai Penguji', 75, 'Panduan', 15);

-- ============================================
-- INSERT TARGET CABERAWIT
-- ============================================
SELECT insert_target('Caberawit', 'KEAKTIFAN', 'Keaktifan Bulanan', 20, 'kali', 'Target 20x/bulan', 'Obj', '(Total/12)/20x100', 100, 'Panduan', 1);
SELECT insert_target('Caberawit', 'ALIM', 'Iqro/Tilawaty', 195, 'halaman', 'Iqro Jilid 1-6', 'Obj', 'Hal/195x100', 100, 'Panduan', 2);
SELECT insert_target('Caberawit', 'ALIM', 'Hafalan Surat', 30, 'surat', 'Juz Amma', 'Obj', 'Surat/30x100', 100, 'GBMTPG', 3);
SELECT insert_target('Caberawit', 'ALIM', 'Hafalan Doa GBMTPG', 8, 'doa', 'Doa harian', 'Obj', 'Doa/8x100', 100, 'GBMTPG', 4);
SELECT insert_target('Caberawit', 'ALIM', 'Hafalan Doa Generus Sorong', 36, 'doa', 'Doa Generus lengkap', 'Obj', 'Doa/36x100', 100, 'Panduan', 5);
SELECT insert_target('Caberawit', 'ALIM', 'Hafalan Dalil GBMTPG', 9, 'dalil', 'Dalil dasar', 'Obj', 'Dalil/9x100', 100, 'GBMTPG', 6);
SELECT insert_target('Caberawit', 'ALIM', 'Hafalan Dalil Generus Sorong', 34, 'dalil', 'Dalil lengkap', 'Obj', 'Dalil/34x100', 100, 'Panduan', 7);
SELECT insert_target('Caberawit', 'ALIM', 'Keilmuan GBMTPG', 15, 'materi', 'Aqidah lengkap', 'Obj', 'Materi/15x100', 100, 'GBMTPG', 8);
SELECT insert_target('Caberawit', 'ALIM', 'Tajwid', 30, 'materi', 'Tajwid lengkap', 'Obj', 'Materi/30x100', 100, 'Panduan', 9);
SELECT insert_target('Caberawit', 'ALIM', 'Makna Quran', 20, 'halaman', 'Juz 30', 'Obj', 'Hal/20x100', 100, 'Panduan', 10);
SELECT insert_target('Caberawit', 'ALIM', 'Makna Hadits', 9, 'kitab', '9 Kitab Hadits', 'Obj', 'Persen/9', 100, 'Panduan', 11);
SELECT insert_target('Caberawit', 'ALIM', 'Kualitas Bacaan', 1, 'nilai', 'Kualitas bacaan Quran', 'Subj', 'Nilai Penguji', 75, 'Panduan', 12);
SELECT insert_target('Caberawit', 'ALIM', 'Praktek Pegon', 1, 'nilai', 'Tulisan pegon', 'Subj', 'Nilai Penguji', 75, 'Panduan', 13);
SELECT insert_target('Caberawit', 'FAQIH', 'Kefahaman Agama', 25, 'materi', 'Kefahaman agama lanjut', 'Obj', 'Materi/25x100', 100, 'GBMTPG', 14);
SELECT insert_target('Caberawit', 'FAQIH', 'Praktek Ibadah', 16, 'materi', 'Praktek ibadah lanjut', 'Obj', 'Materi/16x100', 100, 'GBMTPG', 15);
SELECT insert_target('Caberawit', 'FAQIH', 'Praktek Wudhu Sholat', 1, 'nilai', 'Praktek wudhu sholat', 'Subj', 'Nilai Penguji', 75, 'Panduan', 16);
SELECT insert_target('Caberawit', 'FAQIH', 'Praktek Thoharoh', 1, 'nilai', 'Praktek thoharoh', 'Subj', 'Nilai Penguji', 75, 'Panduan', 17);
SELECT insert_target('Caberawit', 'FAQIH', '4 Tali Keimanan', 100, 'nilai', 'Penguasaan 4 Tali Keimanan', 'Subj', 'Nilai', 100, 'Panduan', 18);
SELECT insert_target('Caberawit', 'AKHLAQ', '6 Thobiat', 100, 'nilai', 'Penguasaan 6 Thobiat', 'Subj', 'Nilai', 100, 'Panduan', 19);
SELECT insert_target('Caberawit', 'AKHLAQ', 'Adab/Tatakrama', 110, 'materi', 'Tatakrama lengkap', 'Obj', 'Materi/110x100', 100, 'GBMTPG', 20);
SELECT insert_target('Caberawit', 'KEMANDIRIAN', 'Kemandirian GBMTPG', 21, 'materi', 'Kemandirian lanjut', 'Obj', 'Materi/21x100', 100, 'GBMTPG', 21);
SELECT insert_target('Caberawit', 'KEMANDIRIAN', 'ASAD Beladiri', 7, 'jurus', 'Jurus 1-7', 'Subj', 'Nilai Penguji', 75, 'Panduan', 22);

-- ============================================
-- INSERT TARGET PRA REMAJA
-- ============================================
SELECT insert_target('Pra Remaja', 'KEAKTIFAN', 'Keaktifan Bulanan', 20, 'kali', 'Target 20x/bulan', 'Obj', '(Total/12)/20x100', 100, 'Panduan', 1);
SELECT insert_target('Pra Remaja', 'ALIM', 'Makna Quran', 10, 'juz', 'Juz 21-30', 'Obj', 'Persen/10', 100, 'Panduan', 2);
SELECT insert_target('Pra Remaja', 'ALIM', 'Makna Hadits', 21, 'kitab', '21 Kitab Hadits', 'Obj', 'Persen/21', 100, 'Panduan', 3);
SELECT insert_target('Pra Remaja', 'ALIM', 'Hafalan Surat', 45, 'surat', '45 surat', 'Obj', 'Surat/45x100', 100, 'GBMTPG', 4);
SELECT insert_target('Pra Remaja', 'ALIM', 'Hafalan Doa Generus Sorong', 39, 'doa', 'Doa Generus lengkap', 'Obj', 'Doa/39x100', 100, 'Panduan', 5);
SELECT insert_target('Pra Remaja', 'ALIM', 'Hafalan Dalil Generus Sorong', 34, 'dalil', 'Dalil lengkap', 'Obj', 'Dalil/34x100', 100, 'Panduan', 6);
SELECT insert_target('Pra Remaja', 'ALIM', 'Keilmuan GBMTPG', 15, 'materi', 'Keilmuan lengkap', 'Obj', 'Materi/15x100', 100, 'GBMTPG', 7);
SELECT insert_target('Pra Remaja', 'ALIM', 'Tajwid', 30, 'materi', 'Tajwid lengkap', 'Obj', 'Materi/30x100', 100, 'Panduan', 8);
SELECT insert_target('Pra Remaja', 'ALIM', 'Kualitas Bacaan', 1, 'nilai', 'Kualitas bacaan Quran', 'Subj', 'Nilai Penguji', 75, 'Panduan', 9);
SELECT insert_target('Pra Remaja', 'ALIM', 'Praktek Pegon', 1, 'nilai', 'Tulisan pegon', 'Subj', 'Nilai Penguji', 75, 'Panduan', 10);
SELECT insert_target('Pra Remaja', 'ALIM', 'Tadarus Al-Quran', 30, 'juz', 'Khatam Quran', 'Obj', 'Juz/30x100', 100, 'Panduan', 11);
SELECT insert_target('Pra Remaja', 'FAQIH', 'Kefahaman Agama', 35, 'materi', 'Kefahaman agama lengkap', 'Obj', 'Materi/35x100', 100, 'GBMTPG', 12);
SELECT insert_target('Pra Remaja', 'FAQIH', 'Praktek Ibadah', 20, 'materi', 'Praktek ibadah lengkap', 'Obj', 'Materi/20x100', 100, 'GBMTPG', 13);
SELECT insert_target('Pra Remaja', 'FAQIH', 'Praktek Wudhu Sholat', 1, 'nilai', 'Praktek wudhu sholat', 'Subj', 'Nilai Penguji', 75, 'Panduan', 14);
SELECT insert_target('Pra Remaja', 'FAQIH', 'Praktek Thoharoh', 1, 'nilai', 'Praktek thoharoh', 'Subj', 'Nilai Penguji', 75, 'Panduan', 15);
SELECT insert_target('Pra Remaja', 'FAQIH', 'Nasehat Bernomor BPI', 95, 'nasehat', '95 Nasehat BPI', 'Obj', 'Nasehat/95x100', 100, 'Panduan', 16);
SELECT insert_target('Pra Remaja', 'FAQIH', '4 Tali Keimanan', 100, 'nilai', 'Penguasaan 4 Tali Keimanan', 'Subj', 'Nilai', 100, 'Panduan', 17);
SELECT insert_target('Pra Remaja', 'AKHLAQ', '6 Thobiat', 100, 'nilai', 'Penguasaan 6 Thobiat', 'Subj', 'Nilai', 100, 'Panduan', 18);
SELECT insert_target('Pra Remaja', 'AKHLAQ', 'Adab/Tatakrama', 120, 'materi', 'Tatakrama lengkap', 'Obj', 'Materi/120x100', 100, 'GBMTPG', 19);
SELECT insert_target('Pra Remaja', 'KEMANDIRIAN', 'Kemandirian GBMTPG', 25, 'materi', 'Kemandirian lengkap', 'Obj', 'Materi/25x100', 100, 'GBMTPG', 20);
SELECT insert_target('Pra Remaja', 'KEMANDIRIAN', 'ASAD Beladiri', 7, 'jurus', 'Jurus 1-7', 'Subj', 'Nilai Penguji', 75, 'Panduan', 21);

-- ============================================
-- INSERT TARGET REMAJA
-- ============================================
SELECT insert_target('Remaja', 'KEAKTIFAN', 'Keaktifan Bulanan', 20, 'kali', 'Target 20x/bulan', 'Obj', '(Total/12)/20x100', 100, 'Panduan', 1);
SELECT insert_target('Remaja', 'ALIM', 'Makna Quran', 20, 'juz', 'Juz 11-30', 'Obj', 'Persen/20', 100, 'Panduan', 2);
SELECT insert_target('Remaja', 'ALIM', 'Makna Hadits', 27, 'kitab', '27 Kitab Hadits', 'Obj', 'Persen/27', 100, 'Panduan', 3);
SELECT insert_target('Remaja', 'ALIM', 'Hafalan Surat', 45, 'surat', '45 surat', 'Obj', 'Surat/45x100', 100, 'GBMTPG', 4);
SELECT insert_target('Remaja', 'ALIM', 'Hafalan Doa Generus Sorong', 39, 'doa', 'Doa Generus lengkap', 'Obj', 'Doa/39x100', 100, 'Panduan', 5);
SELECT insert_target('Remaja', 'ALIM', 'Hafalan Dalil Generus Sorong', 34, 'dalil', 'Dalil lengkap', 'Obj', 'Dalil/34x100', 100, 'Panduan', 6);
SELECT insert_target('Remaja', 'ALIM', 'Keilmuan GBMTPG', 15, 'materi', 'Keilmuan lengkap', 'Obj', 'Materi/15x100', 100, 'GBMTPG', 7);
SELECT insert_target('Remaja', 'ALIM', 'Tajwid', 30, 'materi', 'Tajwid lengkap', 'Obj', 'Materi/30x100', 100, 'Panduan', 8);
SELECT insert_target('Remaja', 'ALIM', 'Kualitas Bacaan', 1, 'nilai', 'Kualitas bacaan Quran', 'Subj', 'Nilai Penguji', 75, 'Panduan', 9);
SELECT insert_target('Remaja', 'ALIM', 'Praktek Pegon', 1, 'nilai', 'Tulisan pegon', 'Subj', 'Nilai Penguji', 75, 'Panduan', 10);
SELECT insert_target('Remaja', 'ALIM', 'Tadarus Al-Quran', 30, 'juz', 'Khatam Quran', 'Obj', 'Juz/30x100', 100, 'Panduan', 11);
SELECT insert_target('Remaja', 'FAQIH', 'Kefahaman Agama', 35, 'materi', 'Kefahaman agama lengkap', 'Obj', 'Materi/35x100', 100, 'GBMTPG', 12);
SELECT insert_target('Remaja', 'FAQIH', 'Praktek Ibadah', 20, 'materi', 'Praktek ibadah lengkap', 'Obj', 'Materi/20x100', 100, 'GBMTPG', 13);
SELECT insert_target('Remaja', 'FAQIH', 'Praktek Wudhu Sholat', 1, 'nilai', 'Praktek wudhu sholat', 'Subj', 'Nilai Penguji', 75, 'Panduan', 14);
SELECT insert_target('Remaja', 'FAQIH', 'Praktek Thoharoh', 1, 'nilai', 'Praktek thoharoh', 'Subj', 'Nilai Penguji', 75, 'Panduan', 15);
SELECT insert_target('Remaja', 'FAQIH', 'Praktek Perawatan Jenazah', 1, 'nilai', 'Perawatan jenazah', 'Subj', 'Nilai Penguji', 75, 'Panduan', 16);
SELECT insert_target('Remaja', 'FAQIH', 'Nasehat Bernomor BPI', 95, 'nasehat', '95 Nasehat BPI', 'Obj', 'Nasehat/95x100', 100, 'Panduan', 17);
SELECT insert_target('Remaja', 'FAQIH', '4 Tali Keimanan', 100, 'nilai', 'Penguasaan 4 Tali Keimanan', 'Subj', 'Nilai', 100, 'Panduan', 18);
SELECT insert_target('Remaja', 'AKHLAQ', '6 Thobiat', 100, 'nilai', 'Penguasaan 6 Thobiat', 'Subj', 'Nilai', 100, 'Panduan', 19);
SELECT insert_target('Remaja', 'AKHLAQ', 'Adab/Tatakrama', 120, 'materi', 'Tatakrama lengkap', 'Obj', 'Materi/120x100', 100, 'GBMTPG', 20);
SELECT insert_target('Remaja', 'KEMANDIRIAN', 'Kemandirian GBMTPG', 25, 'materi', 'Kemandirian lengkap', 'Obj', 'Materi/25x100', 100, 'GBMTPG', 21);
SELECT insert_target('Remaja', 'KEMANDIRIAN', 'ASAD Beladiri', 7, 'jurus', 'Jurus 1-7', 'Subj', 'Nilai Penguji', 75, 'Panduan', 22);

-- ============================================
-- INSERT TARGET PRA NIKAH
-- ============================================
SELECT insert_target('Pra Nikah', 'KEAKTIFAN', 'Keaktifan Bulanan', 16, 'kali', 'Target 16x/bulan', 'Obj', '(Total/12)/16x100', 100, 'Panduan', 1);
SELECT insert_target('Pra Nikah', 'ALIM', 'Makna Quran', 30, 'juz', 'Juz 1-30 lengkap', 'Obj', 'Persen/30', 100, 'Panduan', 2);
SELECT insert_target('Pra Nikah', 'ALIM', 'Makna Hadits', 30, 'kitab', '30 Kitab Hadits', 'Obj', 'Persen/30', 100, 'Panduan', 3);
SELECT insert_target('Pra Nikah', 'ALIM', 'Hafalan Surat', 45, 'surat', '45 surat', 'Obj', 'Surat/45x100', 100, 'GBMTPG', 4);
SELECT insert_target('Pra Nikah', 'ALIM', 'Hafalan Doa Generus Sorong', 39, 'doa', 'Doa Generus lengkap', 'Obj', 'Doa/39x100', 100, 'Panduan', 5);
SELECT insert_target('Pra Nikah', 'ALIM', 'Hafalan Dalil Generus Sorong', 34, 'dalil', 'Dalil lengkap', 'Obj', 'Dalil/34x100', 100, 'Panduan', 6);
SELECT insert_target('Pra Nikah', 'ALIM', 'Keilmuan GBMTPG', 15, 'materi', 'Keilmuan lengkap', 'Obj', 'Materi/15x100', 100, 'GBMTPG', 7);
SELECT insert_target('Pra Nikah', 'ALIM', 'Tajwid', 30, 'materi', 'Tajwid lengkap', 'Obj', 'Materi/30x100', 100, 'Panduan', 8);
SELECT insert_target('Pra Nikah', 'ALIM', 'Kualitas Bacaan', 1, 'nilai', 'Kualitas bacaan Quran', 'Subj', 'Nilai Penguji', 75, 'Panduan', 9);
SELECT insert_target('Pra Nikah', 'ALIM', 'Praktek Pegon', 1, 'nilai', 'Tulisan pegon', 'Subj', 'Nilai Penguji', 75, 'Panduan', 10);
SELECT insert_target('Pra Nikah', 'ALIM', 'Tadarus Al-Quran', 30, 'juz', 'Khatam Quran', 'Obj', 'Juz/30x100', 100, 'Panduan', 11);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Kefahaman Agama', 35, 'materi', 'Kefahaman agama lengkap', 'Obj', 'Materi/35x100', 100, 'GBMTPG', 12);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Praktek Ibadah', 20, 'materi', 'Praktek ibadah lengkap', 'Obj', 'Materi/20x100', 100, 'GBMTPG', 13);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Praktek Wudhu Sholat', 1, 'nilai', 'Praktek wudhu sholat', 'Subj', 'Nilai Penguji', 75, 'Panduan', 14);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Praktek Thoharoh', 1, 'nilai', 'Praktek thoharoh', 'Subj', 'Nilai Penguji', 75, 'Panduan', 15);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Praktek Perawatan Jenazah', 1, 'nilai', 'Perawatan jenazah', 'Subj', 'Nilai Penguji', 75, 'Panduan', 16);
SELECT insert_target('Pra Nikah', 'FAQIH', 'Nasehat Bernomor BPI', 95, 'nasehat', '95 Nasehat BPI', 'Obj', 'Nasehat/95x100', 100, 'Panduan', 17);
SELECT insert_target('Pra Nikah', 'FAQIH', '4 Tali Keimanan', 100, 'nilai', 'Penguasaan 4 Tali Keimanan', 'Subj', 'Nilai', 100, 'Panduan', 18);
SELECT insert_target('Pra Nikah', 'AKHLAQ', '6 Thobiat', 100, 'nilai', 'Penguasaan 6 Thobiat', 'Subj', 'Nilai', 100, 'Panduan', 19);
SELECT insert_target('Pra Nikah', 'AKHLAQ', 'Adab/Tatakrama', 120, 'materi', 'Tatakrama lengkap', 'Obj', 'Materi/120x100', 100, 'GBMTPG', 20);
SELECT insert_target('Pra Nikah', 'KEMANDIRIAN', 'Kemandirian GBMTPG', 25, 'materi', 'Kemandirian lengkap', 'Obj', 'Materi/25x100', 100, 'GBMTPG', 21);
SELECT insert_target('Pra Nikah', 'KEMANDIRIAN', 'ASAD Beladiri', 7, 'jurus', 'Jurus 1-7', 'Subj', 'Nilai Penguji', 75, 'Panduan', 22);

-- ============================================
-- CLEANUP: Drop temporary function
-- ============================================
DROP FUNCTION IF EXISTS insert_target;

-- ============================================
-- VERIFY RESULTS
-- ============================================
SELECT 
    j.nama as jenjang,
    COUNT(*) as total_target
FROM target_jenjang t
JOIN jenjang j ON t.jenjang_id = j.id
GROUP BY j.nama
ORDER BY j.urutan;
