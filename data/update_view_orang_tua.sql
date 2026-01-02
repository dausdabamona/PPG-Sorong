-- ============================================================================
-- UPDATE VIEW UNTUK MENAMPILKAN DATA ORANG TUA
-- PPG SORONG
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor untuk menambahkan
-- kolom ayah_nama dan ibu_nama di view v_generus_aktif dan v_jamaah_lengkap
-- ============================================================================

-- 1. Update view v_jamaah_lengkap untuk include nama orang tua
DROP VIEW IF EXISTS v_jamaah_lengkap CASCADE;

CREATE OR REPLACE VIEW v_jamaah_lengkap AS
SELECT
    j.*,
    -- Wilayah info dari enrollment
    e.id as enrollment_id,
    e.wilayah_id,
    e.jenjang_id,
    e.status as enrollment_status,
    w.nama as wilayah_nama,
    w.tingkat as wilayah_tingkat,
    jn.nama as jenjang_nama,
    jn.kode as jenjang_kode,
    -- Parent wilayah
    pw.id as desa_id,
    pw.nama as desa_nama,
    ppw.id as daerah_id,
    ppw.nama as daerah_nama,
    -- Orang tua
    ayah.nama as ayah_nama,
    ibu.nama as ibu_nama
FROM jamaah j
LEFT JOIN enrollment e ON e.jamaah_id = j.id AND e.status = 'aktif'
LEFT JOIN wilayah w ON w.id = e.wilayah_id
LEFT JOIN jenjang jn ON jn.id = e.jenjang_id
LEFT JOIN wilayah pw ON pw.id = w.parent_id
LEFT JOIN wilayah ppw ON ppw.id = pw.parent_id
LEFT JOIN jamaah ayah ON ayah.id = j.ayah_id
LEFT JOIN jamaah ibu ON ibu.id = j.ibu_id;

-- 2. Update view v_generus_aktif untuk include nama orang tua
DROP VIEW IF EXISTS v_generus_aktif CASCADE;

CREATE OR REPLACE VIEW v_generus_aktif AS
SELECT
    j.id,
    j.nama,
    j.nama_panggilan,
    j.jenis_kelamin,
    j.tanggal_lahir,
    j.phone,
    j.alamat_lengkap,
    j.status_aktif,
    j.ayah_id,
    j.ibu_id,
    -- Enrollment info
    e.id as enrollment_id,
    e.wilayah_id as kelompok_id,
    e.jenjang_id,
    -- Wilayah info
    w.nama as kelompok_nama,
    w.nama as wilayah_nama,
    -- Jenjang info
    jn.nama as jenjang_nama,
    jn.kode as jenjang_kode,
    -- Parent wilayah
    pw.id as desa_id,
    pw.nama as desa_nama,
    ppw.id as daerah_id,
    ppw.nama as daerah_nama,
    -- Orang tua
    ayah.nama as ayah_nama,
    ibu.nama as ibu_nama
FROM jamaah j
INNER JOIN enrollment e ON e.jamaah_id = j.id AND e.status = 'aktif'
LEFT JOIN wilayah w ON w.id = e.wilayah_id
LEFT JOIN jenjang jn ON jn.id = e.jenjang_id
LEFT JOIN wilayah pw ON pw.id = w.parent_id
LEFT JOIN wilayah ppw ON ppw.id = pw.parent_id
LEFT JOIN jamaah ayah ON ayah.id = j.ayah_id
LEFT JOIN jamaah ibu ON ibu.id = j.ibu_id
WHERE j.status_aktif = 'aktif'
  AND j.status_aktif NOT IN ('menikah', 'duda', 'janda', 'nonaktif', 'meninggal', 'pindah');

-- 3. Grant permissions
GRANT SELECT ON v_jamaah_lengkap TO anon, authenticated;
GRANT SELECT ON v_generus_aktif TO anon, authenticated;

-- ============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy paste seluruh isi file ini
-- 3. Klik "Run"
-- 4. Refresh halaman generus untuk melihat nama orang tua
-- ============================================================================
